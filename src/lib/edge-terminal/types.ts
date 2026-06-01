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
export type AIProvider = "openai" | "gemini" | "mock";
export type AIAnalysisType =
  | "event_analysis"
  | "setup_generation"
  | "risk_review"
  | "daily_briefing"
  | "web_research";

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
  createdAt: string;
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
