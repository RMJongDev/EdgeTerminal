export type RunProfile = "eu_open" | "us_open" | "mock";
export type PipelineTrigger = "manual" | "cron";

export type PipelineStepName =
  | "create_run"
  | "fetch_sources"
  | "mover_sweep"
  | "normalize_sources"
  | "dedupe_cluster"
  | "filter_candidates"
  | "analyze_event"
  | "generate_setup"
  | "review_risk"
  | "check_executability"
  | "assemble_advices"
  | "update_tracking"
  | "complete_run";

export type PipelineStepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export type SourceCategory =
  | "broad_news"
  | "financial_feed"
  | "primary_source"
  | "macro_calendar"
  | "market_context"
  | "manual";

export type SourceItem = {
  providerItemId: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  fetchedAt: string;
  title: string;
  snippet?: string;
  symbols?: string[];
  topics?: string[];
  rawPayloadRef: string;
};

export type SourcePayloadSnapshot = {
  rawPayloadRef: string;
  provider: string;
  payloadKind: "metadata" | "snippet" | "api_response";
  payload: Record<string, unknown>;
  payloadHash?: string;
};

export type RunWindow = {
  profile: RunProfile;
  from: Date;
  to: Date;
};

export type SourceAdapter = {
  provider: string;
  category: SourceCategory;
  fetchItems(window: RunWindow): Promise<SourceItem[]>;
};

export type PipelineSetupDirection = "long" | "short" | "none";
export type LegacySetupDirection = PipelineSetupDirection | "no_trade";
export type PipelineRiskVerdict = "ok" | "skip";
export type LegacyRiskVerdict = PipelineRiskVerdict | "paper_trade_ok" | "wait";

export type StepCostSummary = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costEur: number;
};

export type RunCostSummary = {
  totalTokens: number;
  totalCostEur: number;
  steps: Partial<Record<PipelineStepName, StepCostSummary>>;
};

export type PipelineStepRunDraft = {
  discoveryRunId: string;
  candidateId: string | null;
  adviceId: string | null;
  stepName: PipelineStepName;
  status: PipelineStepStatus;
  attempt: number;
  promptVersion: string | null;
  model: string | null;
  sourcePayloadRefs: string[];
};

export type JsonSchema = {
  readonly type?: string | readonly string[];
  readonly properties?: Record<string, JsonSchema>;
  readonly items?: JsonSchema;
  readonly required?: readonly string[];
  readonly enum?: readonly (string | number | boolean | null)[];
  readonly additionalProperties?: boolean | JsonSchema;
  readonly description?: string;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minItems?: number;
  readonly maxItems?: number;
};
