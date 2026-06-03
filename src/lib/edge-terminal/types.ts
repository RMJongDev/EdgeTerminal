export type AssetType = "us_equity" | "eu_equity" | "etf";
export type AssetStatus = "active" | "inactive";
export type EventType =
  | "earnings"
  | "guidance"
  | "analyst"
  | "m_and_a"
  | "product_launch"
  | "legal"
  | "macro"
  | "sector"
  | "competitor"
  | "perception"
  | "other";
export type ImpactDirection = "positive" | "negative" | "neutral" | "mixed";
export type ImpactLevel = "low" | "medium" | "high";
export type AnalysisStatus = "pending" | "analyzed" | "needs_review" | "failed";
export type SetupDirection = "long" | "short" | "no_trade";
export type SetupStatus = "draft" | "approved" | "rejected" | "watching" | "paper_trade";
export type RiskVerdict = "paper_trade_ok" | "wait" | "skip";
export type PaperTradeStatus =
  | "open"
  | "closed"
  | "stop_loss_hit"
  | "target_hit"
  | "expired"
  | "cancelled";
export type CloseReason =
  | "target_hit"
  | "stop_loss_hit"
  | "manual_close"
  | "hypothesis_invalidated"
  | "expired"
  | "cancelled";
export type AIProvider = "openai" | "gemini" | "news_search" | "market_data" | "mock";
export type AIAnalysisType =
  | "event_analysis"
  | "setup_generation"
  | "risk_review"
  | "daily_briefing"
  | "web_research"
  | "discovery_run"
  | "candidate_dedupe"
  | "candidate_ranking"
  | "source_quality";
export type DiscoveryStatus = "running" | "completed" | "failed";
export type DiscoveryTrigger = "manual" | "morning" | "mock" | "future_cron";
export type DiscoveryProvider = "mock" | "news_search" | "market_data" | "mixed";
export type SourceCategory =
  | "broad_news"
  | "financial_feed"
  | "primary_source"
  | "macro_calendar"
  | "market_context"
  | "manual";
export type CandidateStatus = "new" | "accepted" | "ignored" | "merged" | "analyzed";

export type ScanHintMode = "ranking_boost" | "extra_source_query" | "watch_only_note";

export type ScanContextHints = {
  text: string;
  mode: ScanHintMode;
  symbols: string[];
  topics: string[];
};

export type CandidateScoreBreakdown = {
  relevance: number;
  sourceQuality: number;
  recency: number;
  dedupeConfidence: number;
  marketContext: number;
  watchlistPreference: number;
  scanHintFit: number;
  uncertaintyPenalty: number;
};

export type Asset = {
  id: string;
  ticker: string;
  name: string;
  assetType: AssetType;
  sector: string;
  exchange: string;
  currency: string;
  country: string;
  priority: number;
  status: AssetStatus;
  notes: string | null;
  lastMovePercent: number | null;
  updatedAt: string;
};

export type MarketEvent = {
  id: string;
  title: string;
  summary: string;
  source: string | null;
  occurredAt: string;
  eventType: EventType;
  impactDirection: ImpactDirection;
  impactLevel: ImpactLevel;
  analysisStatus: AnalysisStatus;
  priceMovePercent: number | null;
  linkedAssetIds: string[];
  linkedTickers: string[];
};

export type EventAnalysis = {
  id: string;
  eventId: string;
  sentiment: ImpactDirection;
  impactLevel: ImpactLevel;
  timeHorizon: string;
  confidenceScore: number;
  summary: string;
  bullCase: string;
  bearCase: string;
  keyRisks: string;
  fundamentalImpact: string | null;
  sentimentImpact: string | null;
  priceImpact: string | null;
  reversalChance: string | null;
  followThroughRisk: string | null;
};

export type TradeSetup = {
  id: string;
  eventId: string;
  assetId: string;
  assetTicker: string;
  title: string;
  direction: SetupDirection;
  strategy: string;
  entryLogic: string;
  stopLoss: string | null;
  target: string | null;
  timeHorizon: string;
  confidenceScore: number;
  rationale: string;
  invalidation: string;
  assumptions: string;
  status: SetupStatus;
};

export type RiskReview = {
  id: string;
  setupId: string;
  keyRisks: string;
  counterargument: string;
  reasonToSkip: string;
  riskScore: number;
  finalVerdict: RiskVerdict;
};

export type PaperTrade = {
  id: string;
  setupId: string;
  assetId: string;
  assetTicker: string;
  direction: SetupDirection;
  entryPrice: number;
  stopLoss: number | null;
  targetPrice: number | null;
  openedAt: string;
  closedAt: string | null;
  status: PaperTradeStatus;
  exitPrice: number | null;
  resultPercent: number | null;
  closeReason: CloseReason | null;
  notes: string | null;
  hypothesisReview: string | null;
};

export type AIAnalysisLog = {
  id: string;
  analysisType: AIAnalysisType;
  provider: AIProvider;
  model: string | null;
  promptVersion: string;
  status: "success" | "failed";
  usefulnessRating: number | null;
  summary: string;
  sourcePayloadRefs: string[];
  scoreInputs: Record<string, unknown>;
  createdAt: string;
};

export type DiscoveryRun = {
  id: string;
  status: DiscoveryStatus;
  trigger: DiscoveryTrigger;
  provider: DiscoveryProvider;
  contextHints: ScanContextHints | null;
  startedAt: string;
  completedAt: string | null;
  sourceCount: number;
  candidateCount: number;
  topCandidateCount: number;
  errorMessage: string | null;
};

export type EventSource = {
  id: string;
  discoveryRunId: string;
  provider: string;
  sourceCategory: SourceCategory;
  providerItemId: string | null;
  sourceName: string;
  sourceUrl: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  rawPayloadRef: string | null;
  title: string;
  snippet: string | null;
  symbols: string[];
  topics: string[];
  sourceQualityScore: number;
};

export type EventCandidate = {
  id: string;
  discoveryRunId: string;
  title: string;
  summary: string;
  reasonToWatch: string;
  affectedSymbols: string[];
  affectedMarkets: string[];
  eventTypeGuess: EventType;
  impactDirectionGuess: ImpactDirection;
  impactLevelGuess: ImpactLevel;
  relevanceScore: number;
  confidenceScore: number;
  sourceQualityScore: number;
  recencyScore: number;
  candidateQualityScore: number;
  dedupeKey: string;
  mergeHint: string | null;
  candidateStatus: CandidateStatus;
  ignoreReason: string | null;
  acceptedMarketEventId: string | null;
  canonicalCandidateId: string | null;
  sourceIds: string[];
  rawPayloadRefs: string[];
  scoreBreakdown: CandidateScoreBreakdown;
  uncertaintyNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyBriefing = {
  id: string;
  briefingDate: string;
  title: string;
  marketSummary: string;
  keyEvents: string[];
  possibleSetups: string[];
  keyRisks: string[];
  openTrades: string[];
  doNothingWarning: string;
  conclusion: string;
};

export type TerminalData = {
  discoveryRuns: DiscoveryRun[];
  eventSources: EventSource[];
  eventCandidates: EventCandidate[];
  latestDiscoveryRun: DiscoveryRun | null;
  assets: Asset[];
  events: MarketEvent[];
  analyses: EventAnalysis[];
  setups: TradeSetup[];
  riskReviews: RiskReview[];
  paperTrades: PaperTrade[];
  aiLogs: AIAnalysisLog[];
  dailyBriefing: DailyBriefing;
  isDemoMode: boolean;
};
