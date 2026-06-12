import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { demoTerminalData } from "./demo-data";
import type {
  AIAnalysisLog,
  Asset,
  CandidateScoreBreakdown,
  DailyBriefing,
  DiscoveryRun,
  EventAnalysis,
  EventCandidate,
  EventSource,
  MarketEvent,
  PaperTrade,
  RiskReview,
  ScanContextHints,
  TerminalData,
  TradeSetup,
} from "./types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function asScoreBreakdown(value: unknown): CandidateScoreBreakdown {
  const record = asRecord(value);

  return {
    relevance: Number(record.relevance ?? 0),
    sourceQuality: Number(record.sourceQuality ?? record.source_quality ?? 0),
    recency: Number(record.recency ?? 0),
    dedupeConfidence: Number(record.dedupeConfidence ?? record.dedupe_confidence ?? 0),
    marketContext: Number(record.marketContext ?? record.market_context ?? 0),
    watchlistPreference: Number(record.watchlistPreference ?? record.watchlist_preference ?? 0),
    scanHintFit: Number(record.scanHintFit ?? record.scan_hint_fit ?? 0),
    uncertaintyPenalty: Number(record.uncertaintyPenalty ?? record.uncertainty_penalty ?? 0),
  };
}

function asContextHints(value: unknown): ScanContextHints | null {
  const record = asRecord(value);
  const text = typeof record.text === "string" ? record.text : "";

  if (!text && Object.keys(record).length === 0) {
    return null;
  }

  const mode = typeof record.mode === "string" ? record.mode : "ranking_boost";

  return {
    text,
    mode:
      mode === "extra_source_query" || mode === "watch_only_note"
        ? mode
        : "ranking_boost",
    symbols: asStringArray(record.symbols),
    topics: asStringArray(record.topics),
  };
}

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
    sourcePayloadRefs: asStringArray(row.source_payload_refs),
    scoreInputs: asRecord(row.score_inputs),
    createdAt: String(row.created_at),
  };
}

function toDiscoveryRun(row: Record<string, unknown>): DiscoveryRun {
  const runProfile = row.run_profile === "eu_open" || row.run_profile === "us_open"
    ? row.run_profile
    : "mock";

  return {
    id: String(row.id),
    status: row.status as DiscoveryRun["status"],
    trigger: row.trigger as DiscoveryRun["trigger"],
    provider: row.provider as DiscoveryRun["provider"],
    runProfile,
    contextHints: asContextHints(row.context_hints),
    startedAt: String(row.started_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    sourceCount: Number(row.source_count ?? 0),
    candidateCount: Number(row.candidate_count ?? 0),
    topCandidateCount: Number(row.top_candidate_count ?? 0),
    costSummary: asRecord(row.cost_summary),
    errorMessage: row.error_message ? String(row.error_message) : null,
  };
}

function toEventSource(row: Record<string, unknown>): EventSource {
  return {
    id: String(row.id),
    discoveryRunId: String(row.discovery_run_id),
    provider: String(row.provider ?? ""),
    sourceCategory: row.source_category as EventSource["sourceCategory"],
    providerItemId: row.provider_item_id ? String(row.provider_item_id) : null,
    sourceName: String(row.source_name ?? ""),
    sourceUrl: row.source_url ? String(row.source_url) : null,
    publishedAt: row.published_at ? String(row.published_at) : null,
    fetchedAt: String(row.fetched_at),
    rawPayloadRef: row.raw_payload_ref ? String(row.raw_payload_ref) : null,
    title: String(row.title ?? ""),
    snippet: row.snippet ? String(row.snippet) : null,
    symbols: asStringArray(row.symbols),
    topics: asStringArray(row.topics),
    sourceQualityScore: Number(row.source_quality_score ?? 0),
  };
}

function toEventCandidate(row: Record<string, unknown>): EventCandidate {
  return {
    id: String(row.id),
    discoveryRunId: String(row.discovery_run_id),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    reasonToWatch: String(row.reason_to_watch ?? ""),
    affectedSymbols: asStringArray(row.affected_symbols),
    affectedMarkets: asStringArray(row.affected_markets),
    eventTypeGuess: row.event_type_guess as EventCandidate["eventTypeGuess"],
    impactDirectionGuess: row.impact_direction_guess as EventCandidate["impactDirectionGuess"],
    impactLevelGuess: row.impact_level_guess as EventCandidate["impactLevelGuess"],
    relevanceScore: Number(row.relevance_score ?? 0),
    confidenceScore: Number(row.confidence_score ?? 0),
    sourceQualityScore: Number(row.source_quality_score ?? 0),
    recencyScore: Number(row.recency_score ?? 0),
    candidateQualityScore: Number(row.candidate_quality_score ?? 0),
    dedupeKey: String(row.dedupe_key ?? ""),
    mergeHint: row.merge_hint ? String(row.merge_hint) : null,
    candidateStatus: row.candidate_status as EventCandidate["candidateStatus"],
    ignoreReason: row.ignore_reason ? String(row.ignore_reason) : null,
    acceptedMarketEventId: row.accepted_market_event_id ? String(row.accepted_market_event_id) : null,
    canonicalCandidateId: row.canonical_candidate_id ? String(row.canonical_candidate_id) : null,
    sourceIds: asStringArray(row.source_ids),
    rawPayloadRefs: asStringArray(row.raw_payload_refs),
    scoreBreakdown: asScoreBreakdown(row.score_breakdown),
    uncertaintyNotes: String(row.uncertainty_notes ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
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
    runsResult,
    sourcesResult,
    candidatesResult,
    assetsResult,
    eventsResult,
    analysesResult,
    setupsResult,
    risksResult,
    tradesResult,
    logsResult,
    briefingResult,
  ] = await Promise.all([
    supabase.from("discovery_runs").select("*").order("started_at", { ascending: false }).limit(5),
    supabase.from("event_sources").select("*").order("fetched_at", { ascending: false }).limit(100),
    supabase.from("event_candidates").select("*").order("candidate_quality_score", { ascending: false }).limit(50),
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
    runsResult.error ||
    sourcesResult.error ||
    candidatesResult.error ||
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
  const discoveryRuns = (runsResult.data ?? []).map((row) => toDiscoveryRun(row));

  return {
    discoveryRuns,
    eventSources: (sourcesResult.data ?? []).map((row) => toEventSource(row)),
    eventCandidates: (candidatesResult.data ?? []).map((row) => toEventCandidate(row)),
    latestDiscoveryRun: discoveryRuns[0] ?? null,
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
