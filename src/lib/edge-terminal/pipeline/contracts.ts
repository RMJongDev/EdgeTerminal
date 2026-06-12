import type {
  LegacyRiskVerdict,
  LegacySetupDirection,
  PipelineStepName,
  PipelineStepRunDraft,
  PipelineSetupDirection,
  PipelineRiskVerdict,
  RunCostSummary,
  RunProfile,
  StepCostSummary,
} from "./types.ts";

export const RUN_PROFILES: RunProfile[] = ["eu_open", "us_open", "mock"];

export const PIPELINE_STEP_ORDER: PipelineStepName[] = [
  "create_run",
  "fetch_sources",
  "mover_sweep",
  "normalize_sources",
  "dedupe_cluster",
  "filter_candidates",
  "analyze_event",
  "generate_setup",
  "review_risk",
  "check_executability",
  "assemble_advices",
  "update_tracking",
  "complete_run",
];

export function isRunProfile(value: string): value is RunProfile {
  return RUN_PROFILES.includes(value as RunProfile);
}

export function normalizeSetupDirection(direction: LegacySetupDirection): PipelineSetupDirection {
  return direction === "no_trade" ? "none" : direction;
}

export function normalizeRiskVerdict(verdict: LegacyRiskVerdict): PipelineRiskVerdict {
  return verdict === "skip" ? "skip" : "ok";
}

export function createRawPayloadRef(provider: string, providerItemId: string, fetchedAt: string) {
  const providerPart = sanitizeRefPart(provider);
  const itemPart = sanitizeRefPart(providerItemId);
  const fetchedPart = sanitizeRefPart(fetchedAt);

  return `${providerPart}:${itemPart}:${fetchedPart}`;
}

export function createEmptyCostSummary(): RunCostSummary {
  return {
    totalTokens: 0,
    totalCostEur: 0,
    steps: {},
  };
}

export function mergeStepCost(
  summary: RunCostSummary,
  stepName: PipelineStepName,
  stepCost: StepCostSummary,
): RunCostSummary {
  const previousStep = summary.steps[stepName];
  const previousTokens = previousStep?.totalTokens ?? 0;
  const previousCost = previousStep?.costEur ?? 0;

  return {
    totalTokens: summary.totalTokens - previousTokens + stepCost.totalTokens,
    totalCostEur: roundCost(summary.totalCostEur - previousCost + stepCost.costEur),
    steps: {
      ...summary.steps,
      [stepName]: {
        ...stepCost,
        costEur: roundCost(stepCost.costEur),
      },
    },
  };
}

export function createStepRunDraft(input: {
  discoveryRunId: string;
  stepName: PipelineStepName;
  candidateId?: string | null;
  adviceId?: string | null;
  attempt?: number;
  promptVersion?: string | null;
  model?: string | null;
  sourcePayloadRefs?: string[];
}): PipelineStepRunDraft {
  return {
    discoveryRunId: input.discoveryRunId,
    candidateId: input.candidateId ?? null,
    adviceId: input.adviceId ?? null,
    stepName: input.stepName,
    status: "pending",
    attempt: input.attempt ?? 1,
    promptVersion: input.promptVersion ?? null,
    model: input.model ?? null,
    sourcePayloadRefs: input.sourcePayloadRefs ?? [],
  };
}

function sanitizeRefPart(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function roundCost(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}
