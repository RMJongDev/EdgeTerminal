import type {
  Advice,
  AIAnalysisLog,
  DailyBriefing,
  DiscoveryRun,
  EventAnalysis,
  EventCandidate,
  EventSource,
  EventType,
  ImpactDirection,
  ImpactLevel,
  MarketEvent,
  PipelineStepRun,
  RiskReview,
  SetupDirection,
  SourcePayloadSnapshot,
  TradeSetup,
} from "../types.ts";
import {
  callOpenAiStructured,
  hasOpenAiApiKey,
} from "../llm/openai.ts";
import { createLocalId, getLocalTerminalData, updateLocalTerminalData } from "../store/local.ts";
import {
  createEmptyCostSummary,
  mergeStepCost,
} from "./contracts.ts";
import {
  createConfiguredMoverSweepAdapters,
  createConfiguredSourceAdapters,
  createMoverFollowUpSourceAdapters,
} from "./adapters/index.ts";
import type {
  ExecutabilityCheck,
  NumericTradePlan,
  PipelineRunResult,
  PipelineStepName,
  PipelineTrigger,
  RunCostSummary,
  RunProfile,
  RunWindow,
  SourceAdapter,
  SourceItem,
  StepCostSummary,
} from "./types.ts";
import { createEventAnalysis, createEventFromCandidate } from "./steps/analyze.ts";
import { assembleAdvices } from "./steps/assembly.ts";
import { dedupeAndClusterCandidates } from "./steps/dedupe.ts";
import { checkExecutability } from "./steps/executability.ts";
import { createCandidatesFromSources } from "./steps/filter.ts";
import { createMockMoverSweepAdapter } from "./steps/mock-adapters.ts";
import { createRiskReview } from "./steps/risk.ts";
import {
  adviceAnalysisOutputSchema,
  adviceBriefingOutputSchema,
  adviceFilterOutputSchema,
  adviceRiskOutputSchema,
  adviceSetupOutputSchema,
} from "./schemas.ts";
import { createSetup } from "./steps/setup.ts";
import {
  createDeterministicTrackingQuotes,
  createInitialAdviceTracking,
  updateAdviceTrackingWithPrices,
} from "./steps/tracking.ts";

type FetchedSourceItem = SourceItem & {
  provider: string;
  sourceCategory: SourceAdapter["category"];
};

type SourceFailure = {
  provider: string;
  message: string;
};

type AdviceFilterOutput = {
  items: Array<{
    source_ref: string;
    is_candidate: boolean;
    reason_to_watch: string;
    pre_rank: number;
    affected_symbols: string[];
    event_type_guess: string;
  }>;
};

type FilterSelectionResult = {
  selectedCandidates: EventCandidate[];
  provider: AIAnalysisLog["provider"];
  model: string;
  cost: StepCostSummary;
  outputPayload: Record<string, unknown>;
  failure: SourceFailure | null;
};

type AdviceAnalysisOutput = {
  sentiment: string;
  impact: string;
  horizon_days: number;
  bull_case: string;
  bear_case: string;
  priced_in_view: string;
  uncertainty: string;
  confidence: number;
};

type AdviceSetupOutput = {
  direction: string;
  entry_logic: string;
  entry_zone_low: number | null;
  entry_zone_high: number | null;
  stop_loss: number | null;
  target: number | null;
  horizon_days: number;
  invalidation: string;
};

type AdviceRiskOutput = {
  counterargument: string;
  thesis_killer: string;
  risk_score: number;
  verdict: string;
  gap_risk: string;
  squeeze_risk: string | null;
};

type AdviceBriefingOutput = {
  market_context: string;
  advice_summary: string;
  no_advice_notes: string;
  open_position_risks: string;
  conclusion: string;
};

type CandidateLlmStep<T> = {
  value: T;
  provider: AIAnalysisLog["provider"];
  model: string | null;
  cost: StepCostSummary;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown>;
  errorMessage: string | null;
  status?: PipelineStepRun["status"];
};

type CandidatePipelineItem = {
  candidate: EventCandidate;
  source: EventSource | null;
  event: MarketEvent;
  analysis: EventAnalysis;
  setup: TradeSetup;
  riskReview: RiskReview;
  numericPlan: NumericTradePlan;
  executability: ExecutabilityCheck;
  llmSteps: {
    analysis: CandidateLlmStep<EventAnalysis>;
    setup: CandidateLlmStep<{
      setup: TradeSetup;
      numericPlan: NumericTradePlan;
    }>;
    risk: CandidateLlmStep<RiskReview>;
  };
};

type StartRunOptions = {
  now?: Date;
  sourceAdapters?: SourceAdapter[];
  moverSweepAdapter?: SourceAdapter;
  moverSweepAdapters?: SourceAdapter[];
};

function roundCost(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function stepCost(inputTokens: number, outputTokens: number, costEur = 0): StepCostSummary {
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    costEur: roundCost(costEur),
  };
}

const eventTypes = new Set<EventType>([
  "earnings",
  "guidance",
  "analyst",
  "m_and_a",
  "product_launch",
  "legal",
  "macro",
  "sector",
  "competitor",
  "perception",
  "other",
]);

const impactDirections = new Set<ImpactDirection>(["positive", "negative", "neutral", "mixed"]);
const impactLevels = new Set<ImpactLevel>(["low", "medium", "high"]);
const setupDirections = new Set<SetupDirection>(["long", "short", "none"]);

function normalizeEventType(value: string, fallback: EventType): EventType {
  return eventTypes.has(value as EventType) ? value as EventType : fallback;
}

function normalizeImpactDirection(value: string, fallback: ImpactDirection): ImpactDirection {
  return impactDirections.has(value as ImpactDirection) ? value as ImpactDirection : fallback;
}

function normalizeImpactLevel(value: string, fallback: ImpactLevel): ImpactLevel {
  return impactLevels.has(value as ImpactLevel) ? value as ImpactLevel : fallback;
}

function normalizeSetupDirection(value: string): SetupDirection {
  return setupDirections.has(value as SetupDirection) ? value as SetupDirection : "none";
}

function normalizeRiskVerdict(value: string) {
  return value === "ok" ? "ok" : "skip";
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) {
    return 50;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampHorizonDays(value: number) {
  if (!Number.isFinite(value)) {
    return 5;
  }

  return Math.max(1, Math.min(14, Math.round(value)));
}

function fallbackNumericPlan(direction: SetupDirection): NumericTradePlan {
  if (direction === "short") {
    return {
      entryZoneLow: 96,
      entryZoneHigh: 100,
      stopLoss: 106,
      target: 84,
      horizonDays: 5,
    };
  }

  return {
    entryZoneLow: 100,
    entryZoneHigh: 104,
    stopLoss: 94,
    target: 116,
    horizonDays: 5,
  };
}

function toNumericPlan(output: AdviceSetupOutput, direction: SetupDirection): NumericTradePlan {
  const fallback = fallbackNumericPlan(direction);

  if (!hasUsableNumericOutput(output, direction)) {
    return fallback;
  }

  const entryZoneLow = Math.min(output.entry_zone_low, output.entry_zone_high);
  const entryZoneHigh = Math.max(output.entry_zone_low, output.entry_zone_high);

  return {
    entryZoneLow,
    entryZoneHigh,
    stopLoss: output.stop_loss,
    target: output.target,
    horizonDays: clampHorizonDays(output.horizon_days),
  };
}

function hasUsableNumericOutput(output: AdviceSetupOutput, direction: SetupDirection): output is AdviceSetupOutput & {
  entry_zone_low: number;
  entry_zone_high: number;
  stop_loss: number;
  target: number;
} {
  if (
    direction === "none" ||
    output.entry_zone_low === null ||
    output.entry_zone_high === null ||
    output.stop_loss === null ||
    output.target === null
  ) {
    return false;
  }

  const entryZoneLow = Math.min(output.entry_zone_low, output.entry_zone_high);
  const entryZoneHigh = Math.max(output.entry_zone_low, output.entry_zone_high);
  const entryMid = (entryZoneLow + entryZoneHigh) / 2;

  return (
    direction === "short"
      ? output.stop_loss > entryMid && output.target < entryMid
      : output.stop_loss < entryMid && output.target > entryMid
  );
}

function aggregateStepCost(previous: StepCostSummary | undefined, next: StepCostSummary): StepCostSummary {
  return {
    inputTokens: (previous?.inputTokens ?? 0) + next.inputTokens,
    outputTokens: (previous?.outputTokens ?? 0) + next.outputTokens,
    totalTokens: (previous?.totalTokens ?? 0) + next.totalTokens,
    costEur: roundCost((previous?.costEur ?? 0) + next.costEur),
  };
}

function buildRunWindow(profile: RunProfile, now: Date): RunWindow {
  const lookbackHours = profile === "eu_open" ? 16 : profile === "us_open" ? 7 : 24;

  return {
    profile,
    from: new Date(now.getTime() - lookbackHours * 60 * 60_000),
    to: now,
  };
}

async function fetchFromAdapters(
  adapters: SourceAdapter[],
  window: RunWindow,
): Promise<{ items: FetchedSourceItem[]; failures: SourceFailure[] }> {
  const results = await Promise.all(
    adapters.map(async (adapter) => {
      try {
        const items = await adapter.fetchItems(window);

        return {
          adapter,
          items,
          failure: null,
        };
      } catch (error) {
        return {
          adapter,
          items: [],
          failure: {
            provider: adapter.provider,
            message: error instanceof Error ? error.message : String(error),
          },
        };
      }
    }),
  );

  const items: FetchedSourceItem[] = [];
  const failures: SourceFailure[] = [];

  for (const result of results) {
    if (result.failure) {
      failures.push(result.failure);
      continue;
    }

    items.push(
      ...result.items.map((item) => ({
        ...item,
        provider: result.adapter.provider,
        sourceCategory: item.sourceCategory ?? result.adapter.category,
      })),
    );
  }

  return { items, failures };
}

function sourceQuality(item: FetchedSourceItem) {
  if (item.provider === "mock_mover_sweep") return 88;
  if (item.sourceCategory === "primary_source" || item.sourceCategory === "macro_calendar") return 84;
  if (item.title.toLowerCase().includes("weak-source")) return 48;

  return item.topics?.includes("margin") ? 52 : 78;
}

function isContextOnlyMoverItem(item: SourceItem) {
  const topics = item.topics ?? [];

  return topics.includes("unexplained_move") || topics.includes("trading_halt_context");
}

function toEventSource(input: {
  runId: string;
  item: FetchedSourceItem;
  createId: (prefix: string) => string;
}): EventSource {
  return {
    id: input.createId("source"),
    discoveryRunId: input.runId,
    provider: input.item.provider,
    sourceCategory: input.item.sourceCategory,
    providerItemId: input.item.providerItemId,
    sourceName: input.item.sourceName,
    sourceUrl: input.item.sourceUrl,
    publishedAt: input.item.publishedAt,
    fetchedAt: input.item.fetchedAt,
    rawPayloadRef: input.item.rawPayloadRef,
    title: input.item.title,
    snippet: input.item.snippet ?? null,
    symbols: input.item.symbols ?? [],
    topics: input.item.topics ?? [],
    sourceQualityScore: sourceQuality(input.item),
  };
}

function toSnapshot(input: {
  runId: string;
  source: EventSource;
  now: string;
  createId: (prefix: string) => string;
}): SourcePayloadSnapshot {
  return {
    id: input.createId("snapshot"),
    discoveryRunId: input.runId,
    eventSourceId: input.source.id,
    rawPayloadRef: input.source.rawPayloadRef ?? `local:${input.source.id}`,
    provider: input.source.provider,
    payloadKind: "metadata",
    payload: {
      title: input.source.title,
      snippet: input.source.snippet,
      sourceUrl: input.source.sourceUrl,
      publishedAt: input.source.publishedAt,
      symbols: input.source.symbols,
      topics: input.source.topics,
    },
    payloadHash: null,
    retentionNote: "Local mock metadata only; no full article text stored.",
    createdAt: input.now,
    updatedAt: input.now,
  };
}

function createAiLog(input: {
  analysisType: AIAnalysisLog["analysisType"];
  promptVersion: string;
  summary: string;
  provider?: AIAnalysisLog["provider"];
  model?: string | null;
  sourcePayloadRefs?: string[];
  scoreInputs?: Record<string, unknown>;
  inputPayload?: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  costSummary?: StepCostSummary;
  errorMessage?: string | null;
  now: string;
}): AIAnalysisLog {
  return {
    id: createLocalId("log"),
    analysisType: input.analysisType,
    provider: input.provider ?? "mock",
    model: input.model ?? "mock-advice-pipeline-v1",
    promptVersion: input.promptVersion,
    status: input.errorMessage ? "failed" : "success",
    usefulnessRating: null,
    summary: input.summary,
    sourcePayloadRefs: input.sourcePayloadRefs ?? [],
    scoreInputs: input.scoreInputs ?? {},
    inputPayload: input.inputPayload,
    outputPayload: input.outputPayload,
    costSummary: input.costSummary,
    errorMessage: input.errorMessage ?? null,
    createdAt: input.now,
  };
}

function candidatePromptInput(input: {
  profile: RunProfile;
  candidate: EventCandidate;
  source: EventSource | null;
  event: MarketEvent;
}) {
  return {
    profile: input.profile,
    candidate: {
      id: input.candidate.id,
      title: input.candidate.title,
      summary: input.candidate.summary,
      reason_to_watch: input.candidate.reasonToWatch,
      affected_symbols: input.candidate.affectedSymbols,
      event_type_guess: input.candidate.eventTypeGuess,
      impact_direction_guess: input.candidate.impactDirectionGuess,
      impact_level_guess: input.candidate.impactLevelGuess,
      candidate_quality_score: input.candidate.candidateQualityScore,
      confidence_score: input.candidate.confidenceScore,
      source_quality_score: input.candidate.sourceQualityScore,
      uncertainty_notes: input.candidate.uncertaintyNotes,
    },
    source: input.source
      ? {
          id: input.source.id,
          provider: input.source.provider,
          source_name: input.source.sourceName,
          url: input.source.sourceUrl,
          published_at: input.source.publishedAt,
          title: input.source.title,
          snippet: input.source.snippet,
          symbols: input.source.symbols,
          topics: input.source.topics,
        }
      : null,
    market_context: {
      price_move_percent_since_publication: input.event.priceMovePercent,
      note:
        "If precise current price or price reaction is missing, prefer direction 'none' instead of inventing trade levels.",
    },
  };
}

function fallbackAnalysisStep(input: {
  candidate: EventCandidate;
  event: MarketEvent;
  createId: (prefix: string) => string;
  inputPayload: Record<string, unknown>;
  errorMessage?: string | null;
}): CandidateLlmStep<EventAnalysis> {
  const analysis = createEventAnalysis({
    candidate: input.candidate,
    event: input.event,
    createId: input.createId,
  });

  return {
    value: analysis,
    provider: "mock",
    model: "mock-advice-pipeline-v1",
    cost: stepCost(1_000, 380),
    inputPayload: input.inputPayload,
    outputPayload: {
      mode: "mock_fallback",
      analysisId: analysis.id,
      sentiment: analysis.sentiment,
      impactLevel: analysis.impactLevel,
      confidenceScore: analysis.confidenceScore,
      fallbackReason: input.errorMessage ?? null,
    },
    errorMessage: input.errorMessage ?? null,
  };
}

async function runAnalysisStep(input: {
  profile: RunProfile;
  candidate: EventCandidate;
  source: EventSource | null;
  event: MarketEvent;
  createId: (prefix: string) => string;
}): Promise<CandidateLlmStep<EventAnalysis>> {
  const inputPayload = {
    ...candidatePromptInput(input),
    instructions: [
      "Analyze only the provided source-backed event.",
      "Judge whether the first price reaction appears underdone, overdone, or already priced in.",
      "Do not add facts, prices, dates, or tickers that are absent from the input.",
    ],
  };

  if (!hasOpenAiApiKey()) {
    return fallbackAnalysisStep({ ...input, inputPayload });
  }

  try {
    const result = await callOpenAiStructured<AdviceAnalysisOutput>({
      modelRole: "analysis",
      promptVersion: "advice-analysis-v1",
      schemaName: "advice_analysis_v1",
      schema: adviceAnalysisOutputSchema,
      systemPrompt:
        "You are Edge Terminal's event-analysis step for swing trading. Return strict JSON only. Do not invent external facts or prices.",
      userPrompt: JSON.stringify(inputPayload),
      timeoutMs: 60_000,
    });
    const output = result.output;
    const sentiment = normalizeImpactDirection(output.sentiment, input.candidate.impactDirectionGuess);
    const impactLevel = normalizeImpactLevel(output.impact, input.candidate.impactLevelGuess);
    const horizonDays = clampHorizonDays(output.horizon_days);
    const analysis: EventAnalysis = {
      id: input.createId("analysis"),
      eventId: input.event.id,
      sentiment,
      impactLevel,
      timeHorizon: `${horizonDays} trading days`,
      confidenceScore: clampScore(output.confidence),
      summary: output.priced_in_view,
      bullCase: output.bull_case,
      bearCase: output.bear_case,
      keyRisks: output.uncertainty,
      fundamentalImpact: input.candidate.eventTypeGuess === "perception" ? "Unproven" : "Possible",
      sentimentImpact: sentiment,
      priceImpact: output.priced_in_view,
      reversalChance: sentiment === "negative" ? "Possible if the first reaction was emotional." : "Possible if good news is already crowded.",
      followThroughRisk: impactLevel === "high" ? "High while the source narrative persists." : "Medium.",
    };

    return {
      value: analysis,
      provider: "openai",
      model: result.model,
      cost: result.costSummary,
      inputPayload,
      outputPayload: {
        mode: "openai_structured",
        responseId: result.responseId,
        analysisId: analysis.id,
        ...output,
      },
      errorMessage: null,
    };
  } catch (error) {
    return fallbackAnalysisStep({
      ...input,
      inputPayload,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}

function fallbackSetupStep(input: {
  candidate: EventCandidate;
  event: MarketEvent;
  assetId: string | null;
  createId: (prefix: string) => string;
  inputPayload: Record<string, unknown>;
  errorMessage?: string | null;
}): CandidateLlmStep<{
  setup: TradeSetup;
  numericPlan: NumericTradePlan;
}> {
  const value = createSetup({
    candidate: input.candidate,
    event: input.event,
    assetId: input.assetId,
    createId: input.createId,
  });

  return {
    value,
    provider: "mock",
    model: "mock-advice-pipeline-v1",
    cost: stepCost(780, 260),
    inputPayload: input.inputPayload,
    outputPayload: {
      mode: "mock_fallback",
      setupId: value.setup.id,
      direction: value.setup.direction,
      entryZoneLow: value.numericPlan.entryZoneLow,
      entryZoneHigh: value.numericPlan.entryZoneHigh,
      fallbackReason: input.errorMessage ?? null,
    },
    errorMessage: input.errorMessage ?? null,
  };
}

async function runSetupStep(input: {
  profile: RunProfile;
  candidate: EventCandidate;
  source: EventSource | null;
  event: MarketEvent;
  analysis: EventAnalysis;
  assetId: string | null;
  createId: (prefix: string) => string;
}): Promise<CandidateLlmStep<{
  setup: TradeSetup;
  numericPlan: NumericTradePlan;
}>> {
  const inputPayload = {
    ...candidatePromptInput(input),
    analysis: {
      sentiment: input.analysis.sentiment,
      impact_level: input.analysis.impactLevel,
      time_horizon: input.analysis.timeHorizon,
      confidence_score: input.analysis.confidenceScore,
      summary: input.analysis.summary,
      bull_case: input.analysis.bullCase,
      bear_case: input.analysis.bearCase,
      key_risks: input.analysis.keyRisks,
    },
    instructions: [
      "Return direction 'none' if there is no clean swing setup or if numeric levels would require guessing.",
      "For long: stop must be below the entry midpoint and target above it.",
      "For short: stop must be above the entry midpoint and target below it.",
      "Never fill quota; no-trade is a successful output.",
    ],
  };

  if (!hasOpenAiApiKey()) {
    return fallbackSetupStep({ ...input, inputPayload });
  }

  try {
    const result = await callOpenAiStructured<AdviceSetupOutput>({
      modelRole: "analysis",
      promptVersion: "advice-setup-v1",
      schemaName: "advice_setup_v1",
      schema: adviceSetupOutputSchema,
      systemPrompt:
        "You are Edge Terminal's setup-generation step. Return strict JSON only. Prefer direction none when levels are not source-grounded.",
      userPrompt: JSON.stringify(inputPayload),
      timeoutMs: 60_000,
    });
    const output = result.output;
    const requestedDirection = normalizeSetupDirection(output.direction);
    const direction = hasUsableNumericOutput(output, requestedDirection) ? requestedDirection : "none";
    const numericPlan = toNumericPlan(output, direction);
    const ticker = input.candidate.affectedSymbols[0] ?? "UNKNOWN";
    const setup: TradeSetup = {
      id: input.createId("setup"),
      eventId: input.event.id,
      assetId: input.assetId ?? "external-asset",
      assetTicker: ticker,
      title: direction === "none" ? `${ticker} no clean advice` : `${ticker} ${direction} event setup`,
      direction,
      strategy:
        input.candidate.eventTypeGuess === "perception"
          ? "Perception-event second leg"
          : "Event-driven swing setup",
      entryLogic: output.entry_logic,
      stopLoss: direction === "none" ? null : String(numericPlan.stopLoss),
      target: direction === "none" ? null : String(numericPlan.target),
      timeHorizon: `${numericPlan.horizonDays} trading days`,
      confidenceScore: direction === "none" ? Math.min(55, input.analysis.confidenceScore) : input.analysis.confidenceScore,
      rationale:
        direction === "none"
          ? "No advice: the setup step could not ground a complete executable trade plan from the available source context."
          : input.candidate.reasonToWatch,
      invalidation: output.invalidation,
      assumptions:
        "The source-backed event remains valid, the entry zone is not chased, and the first reaction has not fully priced the thesis.",
      status: "draft",
    };

    return {
      value: { setup, numericPlan },
      provider: "openai",
      model: result.model,
      cost: result.costSummary,
      inputPayload,
      outputPayload: {
        mode: "openai_structured",
        responseId: result.responseId,
        setupId: setup.id,
        normalizedDirection: direction,
        ...output,
      },
      errorMessage: null,
    };
  } catch (error) {
    return fallbackSetupStep({
      ...input,
      inputPayload,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}

function fallbackRiskStep(input: {
  candidate: EventCandidate;
  setup: TradeSetup;
  createId: (prefix: string) => string;
  inputPayload: Record<string, unknown>;
  errorMessage?: string | null;
  status?: PipelineStepRun["status"];
}): CandidateLlmStep<RiskReview> {
  const riskReview = createRiskReview({
    candidate: input.candidate,
    setup: input.setup,
    createId: input.createId,
  });

  return {
    value: riskReview,
    provider: "mock",
    model: input.status === "skipped" ? null : "mock-advice-pipeline-v1",
    cost: input.status === "skipped" ? stepCost(0, 0) : stepCost(760, 240),
    inputPayload: input.inputPayload,
    outputPayload: {
      mode: input.status === "skipped" ? "setup_none_stop" : "mock_fallback",
      riskReviewId: riskReview.id,
      riskScore: riskReview.riskScore,
      finalVerdict: riskReview.finalVerdict,
      fallbackReason: input.errorMessage ?? null,
    },
    errorMessage: input.errorMessage ?? null,
    status: input.status,
  };
}

async function runRiskStep(input: {
  profile: RunProfile;
  candidate: EventCandidate;
  source: EventSource | null;
  event: MarketEvent;
  analysis: EventAnalysis;
  setup: TradeSetup;
  createId: (prefix: string) => string;
}): Promise<CandidateLlmStep<RiskReview>> {
  const inputPayload = {
    ...candidatePromptInput(input),
    analysis: {
      summary: input.analysis.summary,
      bull_case: input.analysis.bullCase,
      bear_case: input.analysis.bearCase,
      key_risks: input.analysis.keyRisks,
      confidence_score: input.analysis.confidenceScore,
    },
    setup: {
      direction: input.setup.direction,
      entry_logic: input.setup.entryLogic,
      stop_loss: input.setup.stopLoss,
      target: input.setup.target,
      time_horizon: input.setup.timeHorizon,
      invalidation: input.setup.invalidation,
      assumptions: input.setup.assumptions,
    },
    instructions: [
      "Attack the setup. Do not confirm it by default.",
      "Always name gap risk explicitly.",
      "For shorts, name squeeze risk explicitly.",
      "Return verdict skip if the counterargument or thesis killer is stronger than the setup.",
    ],
  };

  if (input.setup.direction === "none" || input.setup.direction === "no_trade") {
    return fallbackRiskStep({
      candidate: input.candidate,
      setup: input.setup,
      createId: input.createId,
      inputPayload,
      status: "skipped",
    });
  }

  if (!hasOpenAiApiKey()) {
    return fallbackRiskStep({ ...input, inputPayload });
  }

  try {
    const result = await callOpenAiStructured<AdviceRiskOutput>({
      modelRole: "analysis",
      promptVersion: "advice-risk-v1",
      schemaName: "advice_risk_v1",
      schema: adviceRiskOutputSchema,
      systemPrompt:
        "You are Edge Terminal's skeptical risk-review step. Return strict JSON only. Your job is to block weak trades.",
      userPrompt: JSON.stringify(inputPayload),
      timeoutMs: 60_000,
    });
    const output = result.output;
    const riskReview: RiskReview = {
      id: input.createId("risk"),
      setupId: input.setup.id,
      keyRisks: [
        output.gap_risk,
        input.setup.direction === "short" && output.squeeze_risk ? output.squeeze_risk : null,
        output.thesis_killer,
      ]
        .filter(Boolean)
        .join(" "),
      counterargument: output.counterargument,
      reasonToSkip: output.thesis_killer,
      riskScore: clampScore(output.risk_score),
      finalVerdict: normalizeRiskVerdict(output.verdict),
    };

    return {
      value: riskReview,
      provider: "openai",
      model: result.model,
      cost: result.costSummary,
      inputPayload,
      outputPayload: {
        mode: "openai_structured",
        responseId: result.responseId,
        riskReviewId: riskReview.id,
        ...output,
      },
      errorMessage: null,
    };
  } catch (error) {
    return fallbackRiskStep({
      ...input,
      inputPayload,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}

function skippedExecutability(note: string): ExecutabilityCheck {
  return {
    isExecutable: false,
    expectedMovePct: 0,
    costEstimatePct: 0,
    costHurdleRatio: 999,
    sizeSuggestionEur: 0,
    note,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runWorker()));

  return results;
}

async function runCandidateAdviceChain(input: {
  profile: Exclude<RunProfile, "mock">;
  candidate: EventCandidate;
  source: EventSource | null;
  assetId: string | null;
  now: string;
  createId: (prefix: string) => string;
  openSameThemeCount: number;
}): Promise<CandidatePipelineItem> {
  const event = createEventFromCandidate({
    candidate: input.candidate,
    sourceUrl: input.source?.sourceUrl ?? null,
    now: input.now,
    createId: input.createId,
  });
  const analysisStep = await runAnalysisStep({
    profile: input.profile,
    candidate: input.candidate,
    source: input.source,
    event,
    createId: input.createId,
  });
  const setupStep = await runSetupStep({
    profile: input.profile,
    candidate: input.candidate,
    source: input.source,
    event,
    analysis: analysisStep.value,
    assetId: input.assetId,
    createId: input.createId,
  });
  const riskStep = await runRiskStep({
    profile: input.profile,
    candidate: input.candidate,
    source: input.source,
    event,
    analysis: analysisStep.value,
    setup: setupStep.value.setup,
    createId: input.createId,
  });
  const executability =
    riskStep.value.finalVerdict === "skip"
      ? skippedExecutability("No advice: risk review returned skip before the executability gate.")
      : checkExecutability({
          setup: setupStep.value.setup,
          numericPlan: setupStep.value.numericPlan,
          openSameThemeCount: input.openSameThemeCount,
        });

  input.candidate.candidateStatus = "analyzed";
  input.candidate.acceptedMarketEventId = event.id;
  input.candidate.updatedAt = input.now;

  return {
    candidate: input.candidate,
    source: input.source,
    event,
    analysis: analysisStep.value,
    setup: setupStep.value.setup,
    riskReview: riskStep.value,
    numericPlan: setupStep.value.numericPlan,
    executability,
    llmSteps: {
      analysis: analysisStep,
      setup: setupStep,
      risk: riskStep,
    },
  };
}

function fallbackBriefing(input: {
  profile: Exclude<RunProfile, "mock">;
  pipelineItems: CandidatePipelineItem[];
  advices: Advice[];
  openAdvices: Advice[];
  noAdviceReason: string | null;
  now: string;
  createId: (prefix: string) => string;
}): DailyBriefing {
  return {
    id: input.createId("briefing"),
    briefingDate: input.now.slice(0, 10),
    title: `${input.profile === "eu_open" ? "EU open" : "US open"} Advice Briefing`,
    marketSummary:
      input.advices.length > 0
        ? `${input.profile} run completed with ${input.advices.length} actionable advice(s).`
        : input.noAdviceReason ?? "No advice today.",
    keyEvents: input.pipelineItems.slice(0, 3).map((item) => item.event.title),
    possibleSetups:
      input.advices.length > 0
        ? input.advices.map(
            (advice) =>
              `${advice.direction.toUpperCase()} ${advice.ticker} around ${advice.entryZoneLow}-${advice.entryZoneHigh}, stop ${advice.stopLoss}, target ${advice.target}.`,
          )
        : ["No executable setup cleared source proof, risk and cost gates."],
    keyRisks:
      input.advices.length > 0
        ? input.advices.map((advice) => advice.counterargument).slice(0, 3)
        : input.pipelineItems.slice(0, 3).map((item) => item.riskReview.reasonToSkip),
    openTrades: input.openAdvices
      .slice(0, 4)
      .map((advice) => `${advice.direction.toUpperCase()} ${advice.ticker} from ${advice.entryZoneLow}-${advice.entryZoneHigh}`),
    doNothingWarning:
      "Skip every advice if the entry zone is gone, the source thesis breaks, the correlation warning worsens, or the cost hurdle no longer clears.",
    conclusion:
      input.advices.length > 0
        ? "Review the ranked advices; do not chase the first move."
        : "No trade is the correct output today.",
  };
}

function briefingPromptInput(input: {
  profile: Exclude<RunProfile, "mock">;
  pipelineItems: CandidatePipelineItem[];
  advices: Advice[];
  openAdvices: Advice[];
  noAdviceReason: string | null;
  providerFailures: SourceFailure[];
}) {
  return {
    profile: input.profile,
    counts: {
      analyzed_candidates: input.pipelineItems.length,
      advice_count: input.advices.length,
      open_advice_count: input.openAdvices.length,
      provider_failures: input.providerFailures.map((failure) => failure.provider),
    },
    key_events: input.pipelineItems.slice(0, 5).map((item) => ({
      title: item.event.title,
      ticker: item.setup.assetTicker,
      setup_direction: item.setup.direction,
      risk_verdict: item.riskReview.finalVerdict,
      executability_note: item.executability.note,
    })),
    advices: input.advices.map((advice) => ({
      rank: advice.rank,
      ticker: advice.ticker,
      direction: advice.direction,
      entry: `${advice.entryZoneLow}-${advice.entryZoneHigh}`,
      stop: advice.stopLoss,
      target: advice.target,
      horizon_days: advice.horizonDays,
      reasoning: advice.reasoning,
      counterargument: advice.counterargument,
      correlation_warning: advice.correlationWarning,
    })),
    open_advices: input.openAdvices.slice(0, 5).map((advice) => ({
      ticker: advice.ticker,
      direction: advice.direction,
      event_type: advice.eventType,
      rank: advice.rank,
    })),
    no_advice_reason: input.noAdviceReason,
    instructions: [
      "Write concise English for Robin, readable in about two minutes.",
      "Mention no-advice explicitly when there are no executable advices.",
      "Do not add news, tickers, prices or risks outside the provided input.",
      "End with a clear do-nothing conclusion if setup/risk/cost gates did not clear.",
    ],
  };
}

async function runBriefingStep(input: {
  profile: Exclude<RunProfile, "mock">;
  pipelineItems: CandidatePipelineItem[];
  advices: Advice[];
  openAdvices: Advice[];
  noAdviceReason: string | null;
  providerFailures: SourceFailure[];
  now: string;
  createId: (prefix: string) => string;
}): Promise<CandidateLlmStep<DailyBriefing>> {
  const fallback = fallbackBriefing(input);
  const inputPayload = briefingPromptInput(input);

  if (!hasOpenAiApiKey()) {
    return {
      value: fallback,
      provider: "mock",
      model: "mock-advice-pipeline-v1",
      cost: stepCost(420, 160),
      inputPayload,
      outputPayload: {
        mode: "mock_fallback",
        briefingId: fallback.id,
      },
      errorMessage: null,
    };
  }

  try {
    const result = await callOpenAiStructured<AdviceBriefingOutput>({
      modelRole: "filter",
      promptVersion: "advice-briefing-v1",
      schemaName: "advice_briefing_v1",
      schema: adviceBriefingOutputSchema,
      systemPrompt:
        "You are Edge Terminal's briefing writer. Return strict JSON only. Be concise, source-bound and direct.",
      userPrompt: JSON.stringify(inputPayload),
      timeoutMs: 45_000,
    });
    const output = result.output;
    const briefing: DailyBriefing = {
      ...fallback,
      marketSummary: [output.market_context, output.advice_summary].filter(Boolean).join(" "),
      doNothingWarning: output.no_advice_notes || fallback.doNothingWarning,
      openTrades: output.open_position_risks
        ? [output.open_position_risks, ...fallback.openTrades].slice(0, 4)
        : fallback.openTrades,
      conclusion: output.conclusion,
    };

    return {
      value: briefing,
      provider: "openai",
      model: result.model,
      cost: result.costSummary,
      inputPayload,
      outputPayload: {
        mode: "openai_structured",
        responseId: result.responseId,
        briefingId: briefing.id,
        ...output,
      },
      errorMessage: null,
    };
  } catch (error) {
    return {
      value: fallback,
      provider: "mock",
      model: "mock-advice-pipeline-v1",
      cost: stepCost(420, 160),
      inputPayload,
      outputPayload: {
        mode: "mock_fallback",
        briefingId: fallback.id,
        fallbackReason: error instanceof Error ? error.message : String(error),
      },
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function fallbackFilterSelection(candidates: EventCandidate[]): FilterSelectionResult {
  const selectedCandidates = candidates.filter((candidate) => candidate.candidateQualityScore >= 68).slice(0, 5);

  return {
    selectedCandidates,
    provider: "mock",
    model: "mock-advice-pipeline-v1",
    cost: stepCost(80, 20),
    outputPayload: {
      mode: "score_fallback",
      candidateCount: candidates.length,
      selectedCount: selectedCandidates.length,
      topTickers: selectedCandidates.map((candidate) => candidate.affectedSymbols[0]),
    },
    failure: null,
  };
}

function filterPromptInput(input: {
  profile: RunProfile;
  candidates: EventCandidate[];
}) {
  return {
    profile: input.profile,
    instructions: [
      "Select only candidates with a clear source-backed event and plausible swing-trading edge.",
      "Do not fill quota. Returning no candidates is allowed.",
      "Watchlist symbols are context, not a boundary. Do not invent tickers or news.",
      "Avoid chasing already-priced first reactions; prefer candidates where a second-order move may remain.",
    ],
    items: input.candidates.slice(0, 80).map((candidate) => ({
      source_ref: candidate.id,
      title: candidate.title,
      summary: candidate.summary,
      affected_symbols: candidate.affectedSymbols,
      event_type_guess: candidate.eventTypeGuess,
      impact_direction_guess: candidate.impactDirectionGuess,
      impact_level_guess: candidate.impactLevelGuess,
      source_quality_score: candidate.sourceQualityScore,
      candidate_quality_score: candidate.candidateQualityScore,
      reason_to_watch: candidate.reasonToWatch,
      uncertainty_notes: candidate.uncertaintyNotes,
    })),
  };
}

async function selectCandidatesForAdvice(input: {
  profile: Exclude<RunProfile, "mock">;
  candidates: EventCandidate[];
}): Promise<FilterSelectionResult> {
  if (!hasOpenAiApiKey()) {
    return fallbackFilterSelection(input.candidates);
  }

  const promptInput = filterPromptInput(input);

  try {
    const result = await callOpenAiStructured<AdviceFilterOutput>({
      modelRole: "filter",
      promptVersion: "advice-filter-v1",
      schemaName: "advice_filter_v1",
      schema: adviceFilterOutputSchema,
      systemPrompt:
        "You are Edge Terminal's first-pass trading event filter. Return only JSON matching the schema. Never invent facts, sources, tickers, prices or events.",
      userPrompt: JSON.stringify(promptInput),
      timeoutMs: 45_000,
    });
    const candidatesById = new Map(input.candidates.map((candidate) => [candidate.id, candidate]));
    const selectedCandidates = result.output.items
      .filter((item) => item.is_candidate)
      .sort((left, right) => left.pre_rank - right.pre_rank)
      .map((item) => {
        const candidate = candidatesById.get(item.source_ref);

        if (!candidate) {
          return null;
        }

        return {
          ...candidate,
          reasonToWatch: item.reason_to_watch || candidate.reasonToWatch,
          affectedSymbols: item.affected_symbols.length > 0 ? item.affected_symbols : candidate.affectedSymbols,
          eventTypeGuess: normalizeEventType(item.event_type_guess, candidate.eventTypeGuess),
        } satisfies EventCandidate;
      })
      .filter((candidate): candidate is EventCandidate => Boolean(candidate))
      .slice(0, 12);

    return {
      selectedCandidates,
      provider: "openai",
      model: result.model,
      cost: result.costSummary,
      outputPayload: {
        mode: "openai_structured",
        candidateCount: input.candidates.length,
        selectedCount: selectedCandidates.length,
        topTickers: selectedCandidates.map((candidate) => candidate.affectedSymbols[0]),
        responseId: result.responseId,
      },
      failure: null,
    };
  } catch (error) {
    const fallback = fallbackFilterSelection(input.candidates);

    return {
      ...fallback,
      failure: {
        provider: "openai_filter",
        message: error instanceof Error ? error.message : String(error),
      },
      outputPayload: {
        ...fallback.outputPayload,
        fallbackReason: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export async function startRun(
  profile: Exclude<RunProfile, "mock">,
  trigger: PipelineTrigger,
  options: StartRunOptions = {},
): Promise<PipelineRunResult> {
  const currentData = getLocalTerminalData();
  const nowDate = options.now ?? new Date();
  const now = nowDate.toISOString();
  const runWindow = buildRunWindow(profile, nowDate);
  const runId = createLocalId("run");
  const stepRuns: PipelineStepRun[] = [];
  let costSummary: RunCostSummary = createEmptyCostSummary();

  function addStep(input: {
    stepName: PipelineStepName;
    candidateId?: string | null;
    adviceId?: string | null;
    promptVersion?: string | null;
    model?: string | null;
    inputPayload?: Record<string, unknown>;
    outputPayload?: Record<string, unknown>;
    sourcePayloadRefs?: string[];
    cost?: StepCostSummary;
    status?: PipelineStepRun["status"];
    errorMessage?: string | null;
  }) {
    const cost = input.cost ?? stepCost(0, 0, 0);
    const previousStepCost = costSummary.steps[input.stepName];
    costSummary = mergeStepCost(costSummary, input.stepName, aggregateStepCost(previousStepCost, cost));
    stepRuns.push({
      id: createLocalId("step"),
      discoveryRunId: runId,
      candidateId: input.candidateId ?? null,
      adviceId: input.adviceId ?? null,
      stepName: input.stepName,
      status: input.status ?? "completed",
      attempt: 1,
      promptVersion: input.promptVersion ?? null,
      model: input.model ?? null,
      inputPayload: input.inputPayload ?? {},
      outputPayload: input.outputPayload ?? {},
      costSummary: cost,
      sourcePayloadRefs: input.sourcePayloadRefs ?? [],
      errorMessage: input.errorMessage ?? null,
      startedAt: now,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  addStep({
    stepName: "create_run",
    outputPayload: {
      profile,
      trigger,
      from: runWindow.from.toISOString(),
      to: runWindow.to.toISOString(),
    },
  });

  const sourceAdapters = options.sourceAdapters ?? createConfiguredSourceAdapters({
    assets: currentData.assets,
    profile,
  });
  const fetched = await fetchFromAdapters(sourceAdapters, runWindow);
  const fetchedItems = fetched.items;
  addStep({
    stepName: "fetch_sources",
    outputPayload: {
      adapters: sourceAdapters.map((adapter) => adapter.provider),
      itemCount: fetchedItems.length,
      failures: fetched.failures,
    },
    cost: stepCost(0, 0),
  });

  const moverAdapters = options.moverSweepAdapters ??
    (options.moverSweepAdapter
      ? [options.moverSweepAdapter]
      : options.sourceAdapters
        ? [createMockMoverSweepAdapter()]
        : createConfiguredMoverSweepAdapters({ profile }));
  const mover = await fetchFromAdapters(moverAdapters, runWindow);
  const moverItems = mover.items;
  const followUpAdapters = options.sourceAdapters || options.moverSweepAdapter || options.moverSweepAdapters
    ? []
    : createMoverFollowUpSourceAdapters({
        moverItems: moverItems.filter(isContextOnlyMoverItem),
        assets: currentData.assets,
        profile,
      });
  const moverFollowUp = followUpAdapters.length > 0
    ? await fetchFromAdapters(followUpAdapters, runWindow)
    : { items: [], failures: [] };
  const sourceFailures = [...fetched.failures, ...mover.failures, ...moverFollowUp.failures];
  addStep({
    stepName: "mover_sweep",
    outputPayload: {
      itemCount: moverItems.length,
      followUpItemCount: moverFollowUp.items.length,
      tickers: moverItems.flatMap((item) => item.symbols ?? []),
      followUpAdapters: followUpAdapters.map((adapter) => adapter.provider),
      failures: [...mover.failures, ...moverFollowUp.failures],
    },
    cost: stepCost(0, 0),
  });

  const eventSources = [...moverItems, ...moverFollowUp.items, ...fetchedItems].map((item) =>
    toEventSource({
      runId,
      item,
      createId: createLocalId,
    }),
  );
  const sourcePayloadSnapshots = eventSources.map((source) =>
    toSnapshot({
      runId,
      source,
      now,
      createId: createLocalId,
    }),
  );
  const sourcePayloadRefs = sourcePayloadSnapshots.map((snapshot) => snapshot.rawPayloadRef);

  addStep({
    stepName: "normalize_sources",
    outputPayload: {
      sourceCount: eventSources.length,
      snapshotCount: sourcePayloadSnapshots.length,
    },
    sourcePayloadRefs,
  });

  const allCandidates = createCandidatesFromSources({
    runId,
    sources: eventSources,
    assets: currentData.assets,
    now,
    createId: createLocalId,
  });
  const dedupedCandidates = dedupeAndClusterCandidates(allCandidates, eventSources);

  addStep({
    stepName: "dedupe_cluster",
    outputPayload: {
      inputCount: allCandidates.length,
      outputCount: dedupedCandidates.length,
    },
    sourcePayloadRefs,
    cost: stepCost(80, 20),
  });

  const filterSelection = await selectCandidatesForAdvice({
    profile,
    candidates: dedupedCandidates,
  });
  const selectedCandidates = filterSelection.selectedCandidates;
  const providerFailures = filterSelection.failure ? [...sourceFailures, filterSelection.failure] : sourceFailures;

  addStep({
    stepName: "filter_candidates",
    promptVersion: "advice-filter-v1",
    model: filterSelection.model,
    inputPayload: {
      sourceCount: eventSources.length,
      candidateCount: dedupedCandidates.length,
      provider: filterSelection.provider,
    },
    outputPayload: filterSelection.outputPayload,
    sourcePayloadRefs,
    cost: filterSelection.cost,
  });

  const pipelineItems = await mapWithConcurrency(selectedCandidates, 2, async (candidate) => {
    const source = eventSources.find((item) => item.id === candidate.sourceIds[0]) ?? null;
    const asset = currentData.assets.find((item) => item.ticker === candidate.affectedSymbols[0]) ?? null;
    const openSameThemeCount = currentData.advices.filter(
      (advice) => advice.status === "active" && advice.eventType === candidate.eventTypeGuess,
    ).length;

    return runCandidateAdviceChain({
      profile,
      candidate,
      source,
      assetId: asset?.id ?? null,
      now,
      createId: createLocalId,
      openSameThemeCount,
    });
  });

  for (const item of pipelineItems) {
    const candidateRefs = item.candidate.rawPayloadRefs;
    addStep({
      stepName: "analyze_event",
      candidateId: item.candidate.id,
      promptVersion: "advice-analysis-v1",
      model: item.llmSteps.analysis.model,
      inputPayload: item.llmSteps.analysis.inputPayload,
      outputPayload: {
        ...item.llmSteps.analysis.outputPayload,
        sentiment: item.analysis.sentiment,
        confidenceScore: item.analysis.confidenceScore,
      },
      sourcePayloadRefs: candidateRefs,
      cost: item.llmSteps.analysis.cost,
      status: item.llmSteps.analysis.status,
      errorMessage: item.llmSteps.analysis.errorMessage,
    });
    addStep({
      stepName: "generate_setup",
      candidateId: item.candidate.id,
      promptVersion: "advice-setup-v1",
      model: item.llmSteps.setup.model,
      inputPayload: item.llmSteps.setup.inputPayload,
      outputPayload: {
        ...item.llmSteps.setup.outputPayload,
        setupId: item.setup.id,
        direction: item.setup.direction,
        entryZoneLow: item.numericPlan.entryZoneLow,
        entryZoneHigh: item.numericPlan.entryZoneHigh,
      },
      sourcePayloadRefs: candidateRefs,
      cost: item.llmSteps.setup.cost,
      status: item.llmSteps.setup.status,
      errorMessage: item.llmSteps.setup.errorMessage,
    });
    addStep({
      stepName: "review_risk",
      candidateId: item.candidate.id,
      promptVersion: "advice-risk-v1",
      model: item.llmSteps.risk.model,
      inputPayload: item.llmSteps.risk.inputPayload,
      outputPayload: {
        ...item.llmSteps.risk.outputPayload,
        riskReviewId: item.riskReview.id,
        riskScore: item.riskReview.riskScore,
        finalVerdict: item.riskReview.finalVerdict,
      },
      sourcePayloadRefs: candidateRefs,
      cost: item.llmSteps.risk.cost,
      status: item.llmSteps.risk.status,
      errorMessage: item.llmSteps.risk.errorMessage,
    });
    const executabilityStatus =
      item.setup.direction === "none" || item.setup.direction === "no_trade" || item.riskReview.finalVerdict === "skip"
        ? "skipped"
        : "completed";
    addStep({
      stepName: "check_executability",
      candidateId: item.candidate.id,
      status: executabilityStatus,
      outputPayload: {
        isExecutable: item.executability.isExecutable,
        expectedMovePct: item.executability.expectedMovePct,
        costEstimatePct: item.executability.costEstimatePct,
        costHurdleRatio: item.executability.costHurdleRatio,
        note: item.executability.note,
      },
      sourcePayloadRefs: candidateRefs,
      cost: stepCost(0, 0),
    });
  }

  const trackingRefresh = updateAdviceTrackingWithPrices({
    advices: currentData.advices,
    tracking: currentData.adviceTracking,
    quotes: createDeterministicTrackingQuotes({
      advices: currentData.advices,
      tracking: currentData.adviceTracking,
      now,
    }),
    now,
    createId: createLocalId,
  });
  const openAdvices = trackingRefresh.advices.filter((advice) => advice.status === "active");
  const { advices, noAdviceReason } = assembleAdvices({
    runId,
    profile,
    items: pipelineItems,
    openAdvices,
    now,
    createId: createLocalId,
  });
  const adviceTracking = createInitialAdviceTracking({
    advices,
    now,
    createId: createLocalId,
  });

  addStep({
    stepName: "assemble_advices",
    promptVersion: "advice-assembly-v1",
    model: "mock-advice-pipeline-v1",
    outputPayload: {
      adviceCount: advices.length,
      noAdviceReason,
      topAdviceTickers: advices.map((advice) => advice.ticker),
    },
    sourcePayloadRefs,
    cost: stepCost(980, 280),
  });

  for (const advice of advices) {
    const step = stepRuns.find((item) => item.candidateId === advice.candidateId && item.stepName === "check_executability");
    if (step) {
      step.adviceId = advice.id;
    }
  }

  addStep({
    stepName: "update_tracking",
    outputPayload: {
      updatedCount: trackingRefresh.updatedCount,
      closedCount: trackingRefresh.closedCount,
      initializedCount: adviceTracking.length,
      missingTickers: trackingRefresh.missingTickers,
      priceProvider: "deterministic_local",
    },
  });

  const briefingStep = await runBriefingStep({
    profile,
    pipelineItems,
    advices,
    openAdvices,
    noAdviceReason,
    providerFailures,
    now,
    createId: createLocalId,
  });
  addStep({
    stepName: "generate_briefing",
    promptVersion: "advice-briefing-v1",
    model: briefingStep.model,
    inputPayload: briefingStep.inputPayload,
    outputPayload: briefingStep.outputPayload,
    sourcePayloadRefs,
    cost: briefingStep.cost,
    status: briefingStep.status,
    errorMessage: briefingStep.errorMessage,
  });

  addStep({
    stepName: "complete_run",
    outputPayload: {
      sourceCount: eventSources.length,
      candidateCount: dedupedCandidates.length,
      adviceCount: advices.length,
    },
  });

  const run: DiscoveryRun = {
    id: runId,
    status: "completed",
    trigger,
    provider: filterSelection.provider === "openai" ? "mixed" : "mock",
    runProfile: profile,
    contextHints: null,
    startedAt: now,
    completedAt: now,
    sourceCount: eventSources.length,
    candidateCount: dedupedCandidates.length,
    topCandidateCount: advices.length,
    costSummary: {
      ...costSummary,
      providerFailures,
    } as unknown as Record<string, unknown>,
    errorMessage:
      providerFailures.length > 0
        ? `Non-fatal provider failure(s): ${providerFailures.map((failure) => failure.provider).join(", ")}`
        : null,
  };
  const events = pipelineItems.map((item) => item.event);
  const analyses = pipelineItems.map((item) => item.analysis);
  const setups = pipelineItems.map((item) => item.setup);
  const riskReviews = pipelineItems.map((item) => item.riskReview);
  const candidateAiLogs = pipelineItems.flatMap((item) => [
    createAiLog({
      analysisType: "advice_analysis",
      promptVersion: "advice-analysis-v1",
      summary: `Analyzed ${item.setup.assetTicker} event candidate.`,
      provider: item.llmSteps.analysis.provider,
      model: item.llmSteps.analysis.model,
      sourcePayloadRefs: item.candidate.rawPayloadRefs,
      scoreInputs: {
        profile,
        candidateId: item.candidate.id,
        eventId: item.event.id,
        stepStatus: item.llmSteps.analysis.status ?? "completed",
      },
      inputPayload: item.llmSteps.analysis.inputPayload,
      outputPayload: item.llmSteps.analysis.outputPayload,
      costSummary: item.llmSteps.analysis.cost,
      errorMessage: item.llmSteps.analysis.errorMessage,
      now,
    }),
    createAiLog({
      analysisType: "advice_setup",
      promptVersion: "advice-setup-v1",
      summary: `Generated ${item.setup.assetTicker} setup: ${item.setup.direction}.`,
      provider: item.llmSteps.setup.provider,
      model: item.llmSteps.setup.model,
      sourcePayloadRefs: item.candidate.rawPayloadRefs,
      scoreInputs: {
        profile,
        candidateId: item.candidate.id,
        eventId: item.event.id,
        setupId: item.setup.id,
        stepStatus: item.llmSteps.setup.status ?? "completed",
      },
      inputPayload: item.llmSteps.setup.inputPayload,
      outputPayload: item.llmSteps.setup.outputPayload,
      costSummary: item.llmSteps.setup.cost,
      errorMessage: item.llmSteps.setup.errorMessage,
      now,
    }),
    createAiLog({
      analysisType: "advice_risk",
      promptVersion: "advice-risk-v1",
      summary: `Reviewed ${item.setup.assetTicker} risk: ${item.riskReview.finalVerdict}.`,
      provider: item.llmSteps.risk.provider,
      model: item.llmSteps.risk.model,
      sourcePayloadRefs: item.candidate.rawPayloadRefs,
      scoreInputs: {
        profile,
        candidateId: item.candidate.id,
        eventId: item.event.id,
        setupId: item.setup.id,
        riskReviewId: item.riskReview.id,
        stepStatus: item.llmSteps.risk.status ?? "completed",
      },
      inputPayload: item.llmSteps.risk.inputPayload,
      outputPayload: item.llmSteps.risk.outputPayload,
      costSummary: item.llmSteps.risk.cost,
      errorMessage: item.llmSteps.risk.errorMessage,
      now,
    }),
  ]);
  const aiLogs = [
    createAiLog({
      analysisType: "advice_filter",
      promptVersion: "advice-filter-v1",
      summary: `Filtered ${dedupedCandidates.length} candidates to ${selectedCandidates.length} advice candidates.`,
      provider: filterSelection.provider,
      model: filterSelection.model,
      sourcePayloadRefs,
      scoreInputs: { profile, selectedCount: selectedCandidates.length },
      inputPayload: {
        sourceCount: eventSources.length,
        candidateCount: dedupedCandidates.length,
      },
      outputPayload: filterSelection.outputPayload,
      costSummary: filterSelection.cost,
      errorMessage: filterSelection.failure?.message ?? null,
      now,
    }),
    ...candidateAiLogs,
    createAiLog({
      analysisType: "advice_analysis",
      promptVersion: "advice-analysis-v1",
      summary: `Analyzed ${pipelineItems.length} events for the ${profile} run.`,
      sourcePayloadRefs,
      scoreInputs: { profile },
      now,
    }),
    createAiLog({
      analysisType: "advice_setup",
      promptVersion: "advice-setup-v1",
      summary: `Generated ${setups.length} setup hypotheses.`,
      sourcePayloadRefs,
      scoreInputs: { profile },
      now,
    }),
    createAiLog({
      analysisType: "advice_risk",
      promptVersion: "advice-risk-v1",
      summary: `Reviewed risk for ${riskReviews.length} setup hypotheses.`,
      sourcePayloadRefs,
      scoreInputs: { profile },
      now,
    }),
    createAiLog({
      analysisType: "advice_assembly",
      promptVersion: "advice-assembly-v1",
      summary: advices.length > 0 ? `Assembled top ${advices.length} advices.` : noAdviceReason ?? "No advice.",
      sourcePayloadRefs,
      scoreInputs: { profile, adviceCount: advices.length },
      now,
    }),
    createAiLog({
      analysisType: "advice_briefing",
      promptVersion: "advice-briefing-v1",
      summary: `Generated ${profile} briefing with ${advices.length} active advices.`,
      provider: briefingStep.provider,
      model: briefingStep.model,
      sourcePayloadRefs,
      scoreInputs: { profile, adviceCount: advices.length },
      inputPayload: briefingStep.inputPayload,
      outputPayload: briefingStep.outputPayload,
      costSummary: briefingStep.cost,
      errorMessage: briefingStep.errorMessage,
      now,
    }),
    ...stepRuns.map((step) =>
      createAiLog({
        analysisType: "pipeline_step",
        promptVersion: step.promptVersion ?? `pipeline-${step.stepName}-v1`,
        summary: `Pipeline step ${step.stepName} completed for ${profile}.`,
        sourcePayloadRefs: step.sourcePayloadRefs,
        scoreInputs: {
          stepName: step.stepName,
          status: step.status,
          costSummary: step.costSummary,
          candidateId: step.candidateId,
          adviceId: step.adviceId,
        },
        now,
      }),
    ),
  ];

  updateLocalTerminalData((data) => {
    data.discoveryRuns = [run, ...data.discoveryRuns].slice(0, 30);
    data.latestDiscoveryRun = run;
    data.eventSources = [...eventSources, ...data.eventSources].slice(0, 400);
    data.sourcePayloadSnapshots = [...sourcePayloadSnapshots, ...data.sourcePayloadSnapshots].slice(0, 400);
    data.eventCandidates = [...dedupedCandidates, ...data.eventCandidates].slice(0, 200);
    data.pipelineStepRuns = [...stepRuns, ...data.pipelineStepRuns].slice(0, 500);
    data.events = [...events, ...data.events].slice(0, 200);
    data.analyses = [...analyses, ...data.analyses].slice(0, 200);
    data.setups = [...setups, ...data.setups].slice(0, 200);
    data.riskReviews = [...riskReviews, ...data.riskReviews].slice(0, 200);
    data.advices = [...advices, ...trackingRefresh.advices].slice(0, 100);
    data.adviceTracking = [...adviceTracking, ...trackingRefresh.tracking].slice(0, 150);
    data.aiLogs = [...aiLogs, ...data.aiLogs].slice(0, 200);
    data.dailyBriefing = briefingStep.value;
  });

  return {
    runId,
    profile,
    trigger,
    status: "completed",
    sourceCount: eventSources.length,
    candidateCount: dedupedCandidates.length,
    adviceCount: advices.length,
    topAdviceTickers: advices.map((advice) => advice.ticker),
    noAdviceReason,
    completedAt: now,
  };
}
