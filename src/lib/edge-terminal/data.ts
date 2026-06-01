import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { demoTerminalData } from "./demo-data";
import type {
  AIAnalysisLog,
  Asset,
  DailyBriefing,
  EventAnalysis,
  MarketEvent,
  PaperTrade,
  RiskReview,
  TerminalData,
  TradeSetup,
} from "./types";

function toAsset(row: Record<string, unknown>): Asset {
  return {
    id: String(row.id),
    ticker: String(row.ticker),
    name: String(row.name),
    assetType: row.asset_type as Asset["assetType"],
    sector: String(row.sector ?? ""),
    exchange: String(row.exchange ?? ""),
    currency: String(row.currency ?? ""),
    country: String(row.country ?? ""),
    priority: Number(row.priority ?? 0),
    status: row.status as Asset["status"],
    notes: row.notes ? String(row.notes) : null,
    lastMovePercent: row.last_move_percent === null ? null : Number(row.last_move_percent ?? 0),
    updatedAt: String(row.updated_at),
  };
}

function toEvent(row: Record<string, unknown>, linkedTickers: string[] = []): MarketEvent {
  return {
    id: String(row.id),
    title: String(row.title),
    summary: String(row.summary ?? ""),
    source: row.source ? String(row.source) : null,
    occurredAt: String(row.occurred_at),
    eventType: row.event_type as MarketEvent["eventType"],
    impactDirection: row.impact_direction as MarketEvent["impactDirection"],
    impactLevel: row.impact_level as MarketEvent["impactLevel"],
    analysisStatus: row.analysis_status as MarketEvent["analysisStatus"],
    priceMovePercent: row.price_move_percent === null ? null : Number(row.price_move_percent ?? 0),
    linkedAssetIds: [],
    linkedTickers,
  };
}

function toAnalysis(row: Record<string, unknown>): EventAnalysis {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    sentiment: row.sentiment as EventAnalysis["sentiment"],
    impactLevel: row.impact_level as EventAnalysis["impactLevel"],
    timeHorizon: String(row.time_horizon ?? ""),
    confidenceScore: Number(row.confidence_score ?? 0),
    summary: String(row.summary ?? ""),
    bullCase: String(row.bull_case ?? ""),
    bearCase: String(row.bear_case ?? ""),
    keyRisks: String(row.key_risks ?? ""),
    fundamentalImpact: row.fundamental_impact ? String(row.fundamental_impact) : null,
    sentimentImpact: row.sentiment_impact ? String(row.sentiment_impact) : null,
    priceImpact: row.price_impact ? String(row.price_impact) : null,
    reversalChance: row.reversal_chance ? String(row.reversal_chance) : null,
    followThroughRisk: row.follow_through_risk ? String(row.follow_through_risk) : null,
  };
}

function toSetup(row: Record<string, unknown>): TradeSetup {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    assetId: String(row.asset_id),
    assetTicker: String(row.asset_ticker ?? ""),
    title: String(row.title ?? ""),
    direction: row.direction as TradeSetup["direction"],
    strategy: String(row.strategy ?? ""),
    entryLogic: String(row.entry_logic ?? ""),
    stopLoss: row.stop_loss ? String(row.stop_loss) : null,
    target: row.target ? String(row.target) : null,
    timeHorizon: String(row.time_horizon ?? ""),
    confidenceScore: Number(row.confidence_score ?? 0),
    rationale: String(row.rationale ?? ""),
    invalidation: String(row.invalidation ?? ""),
    assumptions: String(row.assumptions ?? ""),
    status: row.status as TradeSetup["status"],
  };
}

function toRisk(row: Record<string, unknown>): RiskReview {
  return {
    id: String(row.id),
    setupId: String(row.setup_id),
    keyRisks: String(row.key_risks ?? ""),
    counterargument: String(row.counterargument ?? ""),
    reasonToSkip: String(row.reason_to_skip ?? ""),
    riskScore: Number(row.risk_score ?? 0),
    finalVerdict: row.final_verdict as RiskReview["finalVerdict"],
  };
}

function toTrade(row: Record<string, unknown>): PaperTrade {
  return {
    id: String(row.id),
    setupId: String(row.setup_id),
    assetId: String(row.asset_id),
    assetTicker: String(row.asset_ticker ?? ""),
    direction: row.direction as PaperTrade["direction"],
    entryPrice: Number(row.entry_price ?? 0),
    stopLoss: row.stop_loss === null ? null : Number(row.stop_loss ?? 0),
    targetPrice: row.target_price === null ? null : Number(row.target_price ?? 0),
    openedAt: String(row.opened_at),
    closedAt: row.closed_at ? String(row.closed_at) : null,
    status: row.status as PaperTrade["status"],
    exitPrice: row.exit_price === null ? null : Number(row.exit_price ?? 0),
    resultPercent: row.result_percent === null ? null : Number(row.result_percent ?? 0),
    closeReason: row.close_reason as PaperTrade["closeReason"],
    notes: row.notes ? String(row.notes) : null,
    hypothesisReview: row.hypothesis_review ? String(row.hypothesis_review) : null,
  };
}

function toLog(row: Record<string, unknown>): AIAnalysisLog {
  return {
    id: String(row.id),
    analysisType: row.analysis_type as AIAnalysisLog["analysisType"],
    provider: row.provider as AIAnalysisLog["provider"],
    model: row.model ? String(row.model) : null,
    promptVersion: String(row.prompt_version ?? ""),
    status: row.status as AIAnalysisLog["status"],
    usefulnessRating: row.usefulness_rating === null ? null : Number(row.usefulness_rating ?? 0),
    summary: String(row.summary ?? ""),
    createdAt: String(row.created_at),
  };
}

function toBriefing(row: Record<string, unknown>): DailyBriefing {
  return {
    id: String(row.id),
    briefingDate: String(row.briefing_date),
    title: String(row.title ?? ""),
    marketSummary: String(row.market_summary ?? ""),
    keyEvents: (row.key_events as string[] | null) ?? [],
    possibleSetups: (row.possible_setups as string[] | null) ?? [],
    keyRisks: (row.key_risks as string[] | null) ?? [],
    openTrades: (row.open_trades as string[] | null) ?? [],
    doNothingWarning: String(row.do_nothing_warning ?? ""),
    conclusion: String(row.conclusion ?? ""),
  };
}

export async function getTerminalData(): Promise<TerminalData> {
  if (!hasSupabaseEnv()) {
    return demoTerminalData;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return demoTerminalData;
  }

  const [
    assetsResult,
    eventsResult,
    analysesResult,
    setupsResult,
    risksResult,
    tradesResult,
    logsResult,
    briefingResult,
  ] = await Promise.all([
    supabase.from("assets").select("*").order("priority"),
    supabase.from("market_events").select("*").order("occurred_at", { ascending: false }),
    supabase.from("event_analyses").select("*").order("created_at", { ascending: false }),
    supabase.from("trade_setups").select("*").order("created_at", { ascending: false }),
    supabase.from("risk_reviews").select("*").order("created_at", { ascending: false }),
    supabase.from("paper_trades").select("*").order("opened_at", { ascending: false }),
    supabase.from("ai_analysis_logs").select("*").order("created_at", { ascending: false }),
    supabase.from("daily_briefings").select("*").order("briefing_date", { ascending: false }).limit(1),
  ]);

  if (
    assetsResult.error ||
    eventsResult.error ||
    analysesResult.error ||
    setupsResult.error ||
    risksResult.error ||
    tradesResult.error ||
    logsResult.error
  ) {
    return demoTerminalData;
  }

  const assets = (assetsResult.data ?? []).map((row) => toAsset(row));
  const events = (eventsResult.data ?? []).map((row) => toEvent(row));

  return {
    assets,
    events,
    analyses: (analysesResult.data ?? []).map((row) => toAnalysis(row)),
    setups: (setupsResult.data ?? []).map((row) => toSetup(row)),
    riskReviews: (risksResult.data ?? []).map((row) => toRisk(row)),
    paperTrades: (tradesResult.data ?? []).map((row) => toTrade(row)),
    aiLogs: (logsResult.data ?? []).map((row) => toLog(row)),
    dailyBriefing:
      briefingResult.data?.[0] ? toBriefing(briefingResult.data[0]) : demoTerminalData.dailyBriefing,
    isDemoMode: false,
  };
}

export async function getEventDetail(id: string) {
  const data = await getTerminalData();
  const event = data.events.find((item) => item.id === id) ?? data.events[0];
  const analysis = data.analyses.find((item) => item.eventId === event.id);
  const setups = data.setups.filter((item) => item.eventId === event.id);
  const assets = data.assets.filter((asset) => event.linkedAssetIds.includes(asset.id) || event.linkedTickers.includes(asset.ticker));

  return {
    data,
    event,
    analysis,
    setups,
    assets,
  };
}
