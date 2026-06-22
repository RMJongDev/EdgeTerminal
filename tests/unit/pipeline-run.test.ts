import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, beforeEach, describe, it } from "node:test";
import type {
  EventAnalysis,
  EventCandidate,
  EventSource,
  RiskReview,
  TradeSetup,
} from "../../src/lib/edge-terminal/types.ts";
import type { SourceAdapter } from "../../src/lib/edge-terminal/pipeline/types.ts";

const tempDir = mkdtempSync(path.join(os.tmpdir(), "edge-terminal-pipeline-run-"));
const dbPath = path.join(tempDir, "edge-terminal.sqlite");

process.env.EDGE_RUNTIME_MODE = "local";
process.env.EDGE_LOCAL_DB_PATH = dbPath;

const { closeLocalStoreForTests, getLocalTerminalData, resetLocalTerminalData } = await import(
  "../../src/lib/edge-terminal/store/local.ts"
);
const { startRun } = await import("../../src/lib/edge-terminal/pipeline/index.ts");
const { assembleAdvices } = await import("../../src/lib/edge-terminal/pipeline/steps/assembly.ts");
const { createMockSourceAdapters } = await import("../../src/lib/edge-terminal/pipeline/steps/mock-adapters.ts");

beforeEach(() => {
  resetLocalTerminalData();
});

after(() => {
  closeLocalStoreForTests();
  rmSync(tempDir, { force: true, recursive: true });
});

describe("pipeline startRun", () => {
  it("runs the mock advice chain end-to-end and persists ranked advices", async () => {
    const result = await startRun("eu_open", "manual", {
      sourceAdapters: createMockSourceAdapters(),
    });
    const data = getLocalTerminalData();
    const latestAdvice = data.advices
      .filter((advice) => advice.discoveryRunId === result.runId)
      .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

    assert.equal(result.status, "completed");
    assert.ok(result.sourceCount >= 5);
    assert.ok(result.candidateCount >= 4);
    assert.ok(result.adviceCount > 0);
    assert.ok(result.adviceCount <= 5);
    assert.equal(latestAdvice[0]?.ticker, "RACE.MI");
    assert.equal(latestAdvice[0]?.direction, "short");
    assert.ok((latestAdvice[0]?.costHurdleRatio ?? 1) <= 0.333);
    assert.ok(data.adviceTracking.some((tracking) => tracking.adviceId === latestAdvice[0]?.id));
    assert.ok(data.pipelineStepRuns.some((step) => step.discoveryRunId === result.runId && step.stepName === "assemble_advices"));
    assert.ok(data.pipelineStepRuns.some((step) => step.discoveryRunId === result.runId && step.stepName === "generate_briefing"));
    assert.ok(data.sourcePayloadSnapshots.some((snapshot) => snapshot.discoveryRunId === result.runId));
    assert.ok(data.aiLogs.some((log) => log.promptVersion === "advice-assembly-v1"));
    assert.ok(
      data.aiLogs.some(
        (log) =>
          log.analysisType === "advice_briefing" &&
          log.promptVersion === "advice-briefing-v1" &&
          Boolean(log.inputPayload?.advices) &&
          Boolean(log.outputPayload?.briefingId) &&
          Boolean(log.costSummary),
      ),
    );
    assert.ok(data.aiLogs.some((log) => log.analysisType === "pipeline_step" && log.promptVersion === "pipeline-complete_run-v1"));
    assert.equal(data.dailyBriefing.briefingDate, result.completedAt.slice(0, 10));
    assert.ok(data.dailyBriefing.marketSummary.length > 20);
    assert.ok(data.dailyBriefing.conclusion.length > 10);
    assert.ok(
      data.aiLogs.some(
        (log) =>
          log.analysisType === "advice_analysis" &&
          log.promptVersion === "advice-analysis-v1" &&
          Boolean(log.inputPayload?.candidate) &&
          Boolean(log.outputPayload?.analysisId) &&
          Boolean(log.costSummary),
      ),
    );
    assert.ok(
      data.aiLogs.some(
        (log) =>
          log.analysisType === "advice_setup" &&
          log.promptVersion === "advice-setup-v1" &&
          Boolean(log.inputPayload?.analysis) &&
          Boolean(log.outputPayload?.setupId),
      ),
    );
    assert.ok(
      data.aiLogs.some(
        (log) =>
          log.analysisType === "advice_risk" &&
          log.promptVersion === "advice-risk-v1" &&
          Boolean(log.inputPayload?.setup) &&
          Boolean(log.outputPayload?.riskReviewId),
      ),
    );
  });

  it("keeps source adapter failures non-fatal when another source layer still works", async () => {
    const failingAdapter: SourceAdapter = {
      provider: "mock_failing_feed",
      category: "financial_feed",
      async fetchItems() {
        throw new Error("planned adapter failure");
      },
    };

    const result = await startRun("eu_open", "manual", {
      sourceAdapters: [failingAdapter],
    });
    const data = getLocalTerminalData();
    const run = data.discoveryRuns.find((item) => item.id === result.runId);

    assert.equal(result.status, "completed");
    assert.match(run?.errorMessage ?? "", /mock_failing_feed/);
    assert.ok(result.adviceCount > 0);
    assert.ok(data.advices.some((advice) => advice.discoveryRunId === result.runId && advice.ticker === "RACE.MI"));
  });

  it("allows a zero-advice run when every candidate fails direction or executability gates", async () => {
    const weakAdapter: SourceAdapter = {
      provider: "mock_weak_context",
      category: "macro_calendar",
      async fetchItems(window) {
        return [
          {
            providerItemId: "weak-macro-only",
            sourceName: "Weak macro context",
            sourceUrl: "https://example.com/weak-macro",
            publishedAt: window.to.toISOString(),
            fetchedAt: window.to.toISOString(),
            title: "Rates volatility cools after a near-consensus macro print",
            snippet: "Broad macro context only, not a single-stock edge.",
            symbols: ["SPY"],
            topics: ["macro", "rates"],
            rawPayloadRef: "mock:weak-macro-only",
          },
        ];
      },
    };
    const emptyMoverAdapter: SourceAdapter = {
      provider: "mock_empty_mover_sweep",
      category: "market_context",
      async fetchItems() {
        return [];
      },
    };

    const result = await startRun("us_open", "manual", {
      sourceAdapters: [weakAdapter],
      moverSweepAdapter: emptyMoverAdapter,
    });
    const data = getLocalTerminalData();
    const spySetup = data.setups.find((setup) => setup.assetTicker === "SPY");
    const spyRisk = data.riskReviews.find((risk) => risk.setupId === spySetup?.id);
    const spyExecutabilityStep = data.pipelineStepRuns.find(
      (step) => step.candidateId === spySetup?.eventId.replace("event", "candidate") && step.stepName === "check_executability",
    );
    const skippedExecutabilityStep = data.pipelineStepRuns.find(
      (step) => step.stepName === "check_executability" && step.status === "skipped",
    );

    assert.equal(result.adviceCount, 0);
    assert.match(result.noAdviceReason ?? "", /No advice today/);
    assert.equal(spySetup?.direction, "none");
    assert.equal(spyRisk?.finalVerdict, "skip");
    assert.equal(spyExecutabilityStep?.status ?? skippedExecutabilityStep?.status, "skipped");
  });
});

describe("advice assembly", () => {
  it("caps executable advices at five ranked items", () => {
    const now = "2026-06-13T10:00:00.000Z";
    const items = Array.from({ length: 6 }, (_, index) => createAssemblyItem(index, now));
    const result = assembleAdvices({
      runId: "run-cap-test",
      profile: "us_open",
      items,
      now,
      createId: (prefix) => `${prefix}-${Math.random().toString(16).slice(2)}`,
    });

    assert.equal(result.advices.length, 5);
    assert.deepEqual(result.advices.map((advice) => advice.rank), [1, 2, 3, 4, 5]);
    assert.ok(result.advices.every((advice) => advice.ticker && advice.direction && advice.sourceRefs.length > 0));
    assert.ok(result.advices.every((advice) => advice.entryZoneLow && advice.stopLoss && advice.target && advice.horizonDays));
    assert.ok(result.advices.every((advice) => advice.reasoning && advice.counterargument && advice.invalidation));
    assert.ok(result.advices.some((advice) => advice.correlationWarning));
  });

  it("blocks advice assembly when the cost hurdle does not clear", () => {
    const now = "2026-06-13T10:00:00.000Z";
    const expensiveItem = createAssemblyItem(0, now);
    expensiveItem.executability = {
      isExecutable: false,
      expectedMovePct: 2,
      costEstimatePct: 1,
      costHurdleRatio: 0.5,
      sizeSuggestionEur: 0,
      note: "No advice: estimated costs are too high for the expected move.",
    };
    const result = assembleAdvices({
      runId: "run-cost-test",
      profile: "us_open",
      items: [expensiveItem],
      now,
      createId: (prefix) => `${prefix}-${Math.random().toString(16).slice(2)}`,
    });

    assert.equal(result.advices.length, 0);
    assert.match(result.noAdviceReason ?? "", /cost hurdle/);
  });

  it("adds a correlation warning when an open advice shares the same theme", () => {
    const now = "2026-06-13T10:00:00.000Z";
    const openSeed = assembleAdvices({
      runId: "run-open-seed",
      profile: "us_open",
      items: [createAssemblyItem(0, now)],
      now,
      createId: (prefix) => `${prefix}-${Math.random().toString(16).slice(2)}`,
    }).advices[0];
    const result = assembleAdvices({
      runId: "run-correlation-test",
      profile: "us_open",
      items: [createAssemblyItem(1, now)],
      openAdvices: [{ ...openSeed, id: "open-sector-advice", status: "active", takenByUser: true }],
      now,
      createId: (prefix) => `${prefix}-${Math.random().toString(16).slice(2)}`,
    });

    assert.equal(result.advices.length, 1);
    assert.match(result.advices[0].correlationWarning ?? "", /Correlation warning/);
    assert.equal(result.advices[0].metadata.correlationPenalty, 12);
  });
});

function createAssemblyItem(index: number, now: string): Parameters<typeof assembleAdvices>[0]["items"][number] {
  const ticker = `TST${index}`;
  const candidate: EventCandidate = {
    id: `candidate-${index}`,
    discoveryRunId: "run-cap-test",
    title: `${ticker} event`,
    summary: `${ticker} summary`,
    reasonToWatch: `${ticker} clears source and price-action gates.`,
    affectedSymbols: [ticker],
    affectedMarkets: ["US equities"],
    eventTypeGuess: "sector",
    impactDirectionGuess: "positive",
    impactLevelGuess: "medium",
    relevanceScore: 80,
    confidenceScore: 72 + index,
    sourceQualityScore: 82,
    recencyScore: 88,
    candidateQualityScore: 80 + index,
    dedupeKey: `dedupe-${index}`,
    mergeHint: null,
    candidateStatus: "analyzed",
    ignoreReason: null,
    acceptedMarketEventId: `event-${index}`,
    canonicalCandidateId: null,
    sourceIds: [`source-${index}`],
    rawPayloadRefs: [`mock:source-${index}`],
    scoreBreakdown: {
      relevance: 80,
      sourceQuality: 82,
      recency: 88,
      dedupeConfidence: 90,
      marketContext: 78,
      watchlistPreference: 0,
      scanHintFit: 0,
      uncertaintyPenalty: 8,
    },
    uncertaintyNotes: "Synthetic cap test item.",
    createdAt: now,
    updatedAt: now,
  };
  const source: EventSource = {
    id: `source-${index}`,
    discoveryRunId: "run-cap-test",
    provider: "mock",
    sourceCategory: "financial_feed",
    providerItemId: `source-${index}`,
    sourceName: "Mock source",
    sourceUrl: "https://example.com/source",
    publishedAt: now,
    fetchedAt: now,
    rawPayloadRef: `mock:source-${index}`,
    title: `${ticker} source`,
    snippet: "Synthetic source",
    symbols: [ticker],
    topics: ["sector"],
    sourceQualityScore: 82,
  };
  const analysis: EventAnalysis = {
    id: `analysis-${index}`,
    eventId: `event-${index}`,
    sentiment: "positive",
    impactLevel: "medium",
    timeHorizon: "5 trading days",
    confidenceScore: 72 + index,
    summary: "Synthetic positive event analysis.",
    bullCase: "Follow-through continues.",
    bearCase: "News is priced in.",
    keyRisks: "Broad market reversal.",
    fundamentalImpact: "Possible",
    sentimentImpact: "Medium",
    priceImpact: "Confirmed",
    reversalChance: "Moderate",
    followThroughRisk: "Medium",
  };
  const setup: TradeSetup = {
    id: `setup-${index}`,
    eventId: `event-${index}`,
    assetId: `asset-${index}`,
    assetTicker: ticker,
    title: `${ticker} long`,
    direction: "long",
    strategy: "Synthetic continuation",
    entryLogic: "Confirm near the entry zone.",
    stopLoss: "94",
    target: "116",
    timeHorizon: "5 trading days",
    confidenceScore: 72 + index,
    rationale: "Synthetic rationale.",
    invalidation: "Invalid below setup low.",
    assumptions: "Synthetic assumptions.",
    status: "draft",
  };
  const riskReview: RiskReview = {
    id: `risk-${index}`,
    setupId: setup.id,
    keyRisks: "Synthetic risk.",
    counterargument: "Synthetic counterargument.",
    reasonToSkip: "Skip if entry is gone.",
    riskScore: 55,
    finalVerdict: "ok",
  };

  return {
    candidate,
    source,
    analysis,
    setup,
    riskReview,
    numericPlan: {
      entryZoneLow: 100,
      entryZoneHigh: 102,
      stopLoss: 94,
      target: 116,
      horizonDays: 5,
    },
    executability: {
      isExecutable: true,
      expectedMovePct: 14.85,
      costEstimatePct: 0.8,
      costHurdleRatio: 0.054,
      sizeSuggestionEur: 700,
      note: "Executable synthetic item.",
    },
  };
}
