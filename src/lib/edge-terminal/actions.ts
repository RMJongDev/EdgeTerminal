"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Json } from "@/lib/database.types";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  createAiLog,
  createMockEventAnalysis,
  createMockRiskReview,
  createMockSetup,
} from "./ai";
import { buildMockDiscoveryResult, createScanContextHints } from "./discovery";
import { demoEvents, demoSetups } from "./demo-data";
import type {
  AIAnalysisLog,
  AssetType,
  CandidateStatus,
  CloseReason,
  EventType,
  ImpactDirection,
  ImpactLevel,
  ScanHintMode,
  SetupDirection,
} from "./types";

function asString(formData: FormData, key: string, fallback = "") {
  return formData.get(key)?.toString().trim() || fallback;
}

function asNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json;
}

function asScanHintMode(formData: FormData): ScanHintMode {
  const mode = asString(formData, "scan_hint_mode", "ranking_boost");

  if (mode === "extra_source_query" || mode === "watch_only_note") {
    return mode;
  }

  return "ranking_boost";
}

async function getAuthenticatedSupabase() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  return { supabase, user };
}

function refresh(paths: string[]) {
  paths.forEach((path) => revalidatePath(path));
}

function toAiLogRow(userId: string, log: Omit<AIAnalysisLog, "id" | "createdAt">) {
  return {
    user_id: userId,
    analysis_type: log.analysisType,
    provider: log.provider,
    model: log.model,
    prompt_version: log.promptVersion,
    input_payload: {},
    output_payload: { summary: log.summary },
    status: log.status,
    usefulness_rating: log.usefulnessRating,
    summary: log.summary,
    error_message: null,
    source_payload_refs: log.sourcePayloadRefs,
    score_inputs: asJson(log.scoreInputs),
  };
}

async function createMarketEventFromCandidate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  candidate: Record<string, unknown>,
  status: CandidateStatus,
) {
  const rawPayloadRefs = Array.isArray(candidate.raw_payload_refs)
    ? candidate.raw_payload_refs.map((item) => String(item))
    : [];
  const sourceIds = Array.isArray(candidate.source_ids)
    ? candidate.source_ids.map((item) => String(item))
    : [];
  const { data: sources } = sourceIds.length > 0
    ? await supabase
        .from("event_sources")
        .select("id, source_url, source_name")
        .in("id", sourceIds)
        .eq("user_id", userId)
    : { data: [] };
  const sourceText = sources?.[0]?.source_url
    ? String(sources[0].source_url)
    : rawPayloadRefs[0] ?? "Discovery candidate";

  const { data: event } = await supabase
    .from("market_events")
    .insert({
      user_id: userId,
      title: String(candidate.title ?? ""),
      summary: String(candidate.summary ?? ""),
      source: sourceText,
      occurred_at: new Date().toISOString(),
      event_type: String(candidate.event_type_guess ?? "other") as EventType,
      impact_direction: String(candidate.impact_direction_guess ?? "mixed") as ImpactDirection,
      impact_level: String(candidate.impact_level_guess ?? "medium") as ImpactLevel,
      analysis_status: status === "analyzed" ? "needs_review" : "pending",
      price_move_percent: null,
    })
    .select("id")
    .single();

  const symbols = Array.isArray(candidate.affected_symbols)
    ? candidate.affected_symbols.map((item) => String(item).toUpperCase())
    : [];

  if (event?.id && symbols.length > 0) {
    const { data: assets } = await supabase
      .from("assets")
      .select("id, ticker")
      .eq("user_id", userId)
      .in("ticker", symbols);

    if (assets && assets.length > 0) {
      await supabase.from("event_assets").insert(
        assets.map((asset) => ({
          user_id: userId,
          event_id: event.id,
          asset_id: asset.id,
        })),
      );
    }
  }

  if (event?.id) {
    await supabase
      .from("event_candidates")
      .update({
        candidate_status: status,
        accepted_market_event_id: event.id,
      })
      .eq("id", String(candidate.id))
      .eq("user_id", userId);
  }

  return event?.id ? String(event.id) : null;
}

export async function startDailyScan(formData: FormData) {
  const contextHints = createScanContextHints(asString(formData, "scan_hint"), asScanHintMode(formData));
  const discovery = buildMockDiscoveryResult(contextHints);
  const auth = await getAuthenticatedSupabase();

  if (!auth) {
    redirect("/dashboard?notice=Demo%20mode%3A%20mock%20daily%20scan%20ready");
  }

  const { supabase, user } = auth;
  const { data: run } = await supabase
    .from("discovery_runs")
    .insert({
      user_id: user.id,
      status: "running",
      trigger: "manual",
      provider: "mock",
      context_hints: contextHints ?? {},
      source_count: 0,
      candidate_count: 0,
      top_candidate_count: 0,
      metadata: { mode: "deterministic_mock" },
    })
    .select("id")
    .single();

  if (!run?.id) {
    redirect("/dashboard?notice=Discovery%20run%20kon%20niet%20starten");
  }

  const runId = String(run.id);
  const { data: insertedSources } = await supabase
    .from("event_sources")
    .insert(
      discovery.sources.map((source) => ({
        user_id: user.id,
        discovery_run_id: runId,
        provider: source.provider,
        source_category: source.sourceCategory,
        provider_item_id: source.providerItemId,
        source_name: source.sourceName,
        source_url: source.sourceUrl,
        published_at: source.publishedAt,
        fetched_at: source.fetchedAt,
        raw_payload_ref: source.rawPayloadRef,
        title: source.title,
        snippet: source.snippet,
        symbols: source.symbols,
        topics: source.topics,
        source_quality_score: source.sourceQualityScore,
        metadata: { mock_source_id: source.id },
      })),
    )
    .select("id, raw_payload_ref");

  const sourceIdByRef = new Map(
    (insertedSources ?? []).map((source) => [String(source.raw_payload_ref ?? ""), String(source.id)]),
  );

  await supabase.from("event_candidates").insert(
    discovery.candidates.map((candidate) => ({
      user_id: user.id,
      discovery_run_id: runId,
      title: candidate.title,
      summary: candidate.summary,
      reason_to_watch: candidate.reasonToWatch,
      affected_symbols: candidate.affectedSymbols,
      affected_markets: candidate.affectedMarkets,
      event_type_guess: candidate.eventTypeGuess,
      impact_direction_guess: candidate.impactDirectionGuess,
      impact_level_guess: candidate.impactLevelGuess,
      relevance_score: candidate.relevanceScore,
      confidence_score: candidate.confidenceScore,
      source_quality_score: candidate.sourceQualityScore,
      recency_score: candidate.recencyScore,
      candidate_quality_score: candidate.candidateQualityScore,
      dedupe_key: candidate.dedupeKey,
      merge_hint: candidate.mergeHint,
      candidate_status: candidate.candidateStatus,
      ignore_reason: candidate.ignoreReason,
      source_ids: candidate.rawPayloadRefs
        .map((ref) => sourceIdByRef.get(ref))
        .filter((sourceId): sourceId is string => Boolean(sourceId)),
      raw_payload_refs: candidate.rawPayloadRefs,
      score_breakdown: candidate.scoreBreakdown,
      uncertainty_notes: candidate.uncertaintyNotes,
      metadata: { mock_candidate_id: candidate.id },
    })),
  );

  await supabase
    .from("discovery_runs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      source_count: discovery.sources.length,
      candidate_count: discovery.candidates.length,
      top_candidate_count: discovery.candidates.length,
    })
    .eq("id", runId)
    .eq("user_id", user.id);

  await supabase.from("ai_analysis_logs").insert(
    toAiLogRow(user.id, {
      ...createAiLog("candidate_ranking", `Ranked ${discovery.candidates.length} candidate events from ${discovery.sources.length} sources.`),
      sourcePayloadRefs: discovery.sources
        .map((source) => source.rawPayloadRef)
        .filter((ref): ref is string => Boolean(ref)),
      scoreInputs: {
        contextHints,
        sourceCount: discovery.sources.length,
        candidateCount: discovery.candidates.length,
      },
    }),
  );

  refresh(["/dashboard", "/events", "/briefing", "/ai-log"]);
  redirect("/dashboard?notice=Daily%20scan%20complete%3A%20top%2010%20ready");
}

export async function createAsset(formData: FormData) {
  const auth = await getAuthenticatedSupabase();

  if (!auth) {
    redirect("/watchlist?notice=Demo%20mode%3A%20asset%20niet%20opgeslagen");
  }

  const { supabase, user } = auth;
  await supabase.from("assets").insert({
    user_id: user.id,
    ticker: asString(formData, "ticker").toUpperCase(),
    name: asString(formData, "name"),
    asset_type: asString(formData, "asset_type", "us_equity") as AssetType,
    sector: asString(formData, "sector"),
    exchange: asString(formData, "exchange"),
    currency: asString(formData, "currency", "USD").toUpperCase(),
    country: asString(formData, "country"),
    priority: asNumber(formData, "priority", 5),
    notes: asString(formData, "notes") || null,
    status: "active",
  });

  refresh(["/watchlist", "/dashboard"]);
  redirect("/watchlist?notice=Asset%20opgeslagen");
}

export async function createMarketEvent(formData: FormData) {
  const auth = await getAuthenticatedSupabase();

  if (!auth) {
    redirect("/events?notice=Demo%20mode%3A%20event%20niet%20opgeslagen");
  }

  const { supabase, user } = auth;
  const { data: event } = await supabase
    .from("market_events")
    .insert({
      user_id: user.id,
      title: asString(formData, "title"),
      summary: asString(formData, "summary"),
      source: asString(formData, "source") || null,
      occurred_at: asString(formData, "occurred_at", new Date().toISOString()),
      event_type: asString(formData, "event_type", "other") as EventType,
      impact_direction: asString(formData, "impact_direction", "mixed") as ImpactDirection,
      impact_level: asString(formData, "impact_level", "medium") as ImpactLevel,
      price_move_percent: asNumber(formData, "price_move_percent", 0),
      analysis_status: "pending",
    })
    .select("id")
    .single();

  const assetId = asString(formData, "asset_id");

  if (event?.id && assetId) {
    await supabase.from("event_assets").insert({
      user_id: user.id,
      event_id: event.id,
      asset_id: assetId,
    });
  }

  refresh(["/events", "/dashboard"]);
  redirect(event?.id ? `/events/${event.id}` : "/events");
}

export async function acceptCandidate(formData: FormData) {
  const candidateId = asString(formData, "candidate_id");
  const auth = await getAuthenticatedSupabase();

  if (!auth) {
    redirect("/events?notice=Demo%20mode%3A%20candidate%20acceptance%20preview");
  }

  const { supabase, user } = auth;
  const { data: candidate } = await supabase
    .from("event_candidates")
    .select("*")
    .eq("id", candidateId)
    .eq("user_id", user.id)
    .single();

  if (!candidate) {
    redirect("/events?notice=Candidate%20niet%20gevonden");
  }

  const eventId = await createMarketEventFromCandidate(supabase, user.id, candidate, "accepted");

  refresh(["/events", "/dashboard", eventId ? `/events/${eventId}` : "/events"]);
  redirect(eventId ? `/events/${eventId}?notice=Candidate%20accepted` : "/events?notice=Candidate%20accepted");
}

export async function ignoreCandidate(formData: FormData) {
  const candidateId = asString(formData, "candidate_id");
  const ignoreReason = asString(formData, "ignore_reason", "Not enough edge or source proof");
  const auth = await getAuthenticatedSupabase();

  if (!auth) {
    redirect("/events?notice=Demo%20mode%3A%20candidate%20ignore%20preview");
  }

  const { supabase, user } = auth;
  await supabase
    .from("event_candidates")
    .update({
      candidate_status: "ignored",
      ignore_reason: ignoreReason,
    })
    .eq("id", candidateId)
    .eq("user_id", user.id);

  refresh(["/events", "/dashboard"]);
  redirect("/events?notice=Candidate%20ignored");
}

export async function mergeCandidate(formData: FormData) {
  const candidateId = asString(formData, "candidate_id");
  const mergeHint = asString(formData, "merge_hint", "Merged with canonical candidate or repeated headline cluster");
  const canonicalCandidateId = asString(formData, "canonical_candidate_id") || null;
  const auth = await getAuthenticatedSupabase();

  if (!auth) {
    redirect("/events?notice=Demo%20mode%3A%20candidate%20merge%20preview");
  }

  const { supabase, user } = auth;
  await supabase
    .from("event_candidates")
    .update({
      candidate_status: "merged",
      merge_hint: mergeHint,
      canonical_candidate_id: canonicalCandidateId,
    })
    .eq("id", candidateId)
    .eq("user_id", user.id);

  refresh(["/events", "/dashboard"]);
  redirect("/events?notice=Candidate%20merged");
}

export async function analyzeCandidate(formData: FormData) {
  const candidateId = asString(formData, "candidate_id");
  const auth = await getAuthenticatedSupabase();

  if (!auth) {
    redirect("/events/event-race-launch?notice=Demo%20mode%3A%20candidate%20analysis%20preview");
  }

  const { supabase, user } = auth;
  const { data: candidate } = await supabase
    .from("event_candidates")
    .select("*")
    .eq("id", candidateId)
    .eq("user_id", user.id)
    .single();

  if (!candidate) {
    redirect("/events?notice=Candidate%20niet%20gevonden");
  }

  const eventId = await createMarketEventFromCandidate(supabase, user.id, candidate, "analyzed");
  await supabase.from("ai_analysis_logs").insert(
    toAiLogRow(user.id, {
      ...createAiLog("event_analysis", `Prepared candidate analysis input for ${String(candidate.title ?? "candidate")}.`),
      sourcePayloadRefs: Array.isArray(candidate.raw_payload_refs)
        ? candidate.raw_payload_refs.map((item) => String(item))
        : [],
      scoreInputs: asRecord(candidate.score_breakdown),
    }),
  );

  refresh(["/events", "/dashboard", "/ai-log", eventId ? `/events/${eventId}` : "/events"]);
  redirect(eventId ? `/events/${eventId}?notice=Candidate%20ready%20for%20analysis` : "/events?notice=Candidate%20analyzed");
}

export async function generateEventAnalysis(formData: FormData) {
  const eventId = asString(formData, "event_id");
  const auth = await getAuthenticatedSupabase();

  if (!auth) {
    redirect(`/events/${eventId || "event-race-launch"}?notice=Demo%20mode%3A%20mock%20analysis`);
  }

  const { supabase, user } = auth;
  const { data: eventRow } = await supabase
    .from("market_events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (!eventRow) {
    redirect("/events?notice=Event%20niet%20gevonden");
  }

  const mockEvent = demoEvents.find((event) => event.id === eventId) ?? {
    id: String(eventRow.id),
    title: String(eventRow.title),
    summary: String(eventRow.summary ?? ""),
    source: eventRow.source ? String(eventRow.source) : null,
    occurredAt: String(eventRow.occurred_at),
    eventType: eventRow.event_type as EventType,
    impactDirection: eventRow.impact_direction as ImpactDirection,
    impactLevel: eventRow.impact_level as ImpactLevel,
    analysisStatus: "pending" as const,
    priceMovePercent:
      eventRow.price_move_percent === null ? null : Number(eventRow.price_move_percent ?? 0),
    linkedAssetIds: [],
    linkedTickers: [],
  };
  const analysis = createMockEventAnalysis(mockEvent);

  await supabase.from("event_analyses").insert({
    user_id: user.id,
    event_id: eventId,
    sentiment: analysis.sentiment,
    impact_level: analysis.impactLevel,
    time_horizon: analysis.timeHorizon,
    confidence_score: analysis.confidenceScore,
    summary: analysis.summary,
    bull_case: analysis.bullCase,
    bear_case: analysis.bearCase,
    key_risks: analysis.keyRisks,
    fundamental_impact: analysis.fundamentalImpact,
    sentiment_impact: analysis.sentimentImpact,
    price_impact: analysis.priceImpact,
    reversal_chance: analysis.reversalChance,
    follow_through_risk: analysis.followThroughRisk,
  });
  await supabase
    .from("market_events")
    .update({ analysis_status: "analyzed" })
    .eq("id", eventId)
    .eq("user_id", user.id);
  await supabase
    .from("ai_analysis_logs")
    .insert(toAiLogRow(user.id, createAiLog("event_analysis", `Generated mock event analysis for ${mockEvent.title}.`)));

  refresh([`/events/${eventId}`, "/events", "/dashboard", "/ai-log"]);
  redirect(`/events/${eventId}?notice=Analysis%20generated`);
}

export async function generateSetup(formData: FormData) {
  const eventId = asString(formData, "event_id");
  const assetId = asString(formData, "asset_id");
  const assetTicker = asString(formData, "asset_ticker", "ASSET").toUpperCase();
  const auth = await getAuthenticatedSupabase();

  if (!auth) {
    redirect("/setups?notice=Demo%20mode%3A%20mock%20setup");
  }

  const { supabase, user } = auth;
  const event = demoEvents.find((item) => item.id === eventId) ?? demoEvents[0];
  const setup = createMockSetup(event, assetId, assetTicker);

  await supabase.from("trade_setups").insert({
    user_id: user.id,
    event_id: setup.eventId,
    asset_id: setup.assetId,
    asset_ticker: setup.assetTicker,
    title: setup.title,
    direction: setup.direction,
    strategy: setup.strategy,
    entry_logic: setup.entryLogic,
    stop_loss: setup.stopLoss,
    target: setup.target,
    time_horizon: setup.timeHorizon,
    confidence_score: setup.confidenceScore,
    rationale: setup.rationale,
    invalidation: setup.invalidation,
    assumptions: setup.assumptions,
    status: setup.status,
  });
  await supabase
    .from("ai_analysis_logs")
    .insert(toAiLogRow(user.id, createAiLog("setup_generation", `Generated setup hypothesis for ${assetTicker}.`)));

  refresh(["/setups", "/signals", `/events/${eventId}`, "/dashboard", "/ai-log"]);
  redirect("/setups?notice=Setup%20generated");
}

export async function generateRiskReview(formData: FormData) {
  const setupId = asString(formData, "setup_id");
  const auth = await getAuthenticatedSupabase();

  if (!auth) {
    redirect("/setups?notice=Demo%20mode%3A%20mock%20risk%20review");
  }

  const { supabase, user } = auth;
  const setup = demoSetups.find((item) => item.id === setupId) ?? demoSetups[0];
  const risk = createMockRiskReview(setup);

  await supabase.from("risk_reviews").insert({
    user_id: user.id,
    setup_id: setupId,
    key_risks: risk.keyRisks,
    counterargument: risk.counterargument,
    reason_to_skip: risk.reasonToSkip,
    risk_score: risk.riskScore,
    final_verdict: risk.finalVerdict,
  });
  await supabase
    .from("ai_analysis_logs")
    .insert(toAiLogRow(user.id, createAiLog("risk_review", `Generated risk review for ${setup.title}.`)));

  refresh(["/setups", "/risk", "/signals", "/dashboard", "/ai-log"]);
  redirect("/setups?notice=Risk%20review%20generated");
}

export async function createPaperTrade(formData: FormData) {
  const auth = await getAuthenticatedSupabase();

  if (!auth) {
    redirect("/paper-trades?notice=Demo%20mode%3A%20paper%20trade%20niet%20opgeslagen");
  }

  const { supabase, user } = auth;
  await supabase.from("paper_trades").insert({
    user_id: user.id,
    setup_id: asString(formData, "setup_id"),
    asset_id: asString(formData, "asset_id"),
    asset_ticker: asString(formData, "asset_ticker").toUpperCase(),
    direction: asString(formData, "direction", "long") as SetupDirection,
    entry_price: asNumber(formData, "entry_price"),
    stop_loss: asNumber(formData, "stop_loss") || null,
    target_price: asNumber(formData, "target_price") || null,
    opened_at: new Date().toISOString(),
    status: "open",
    notes: asString(formData, "notes") || null,
  });

  refresh(["/paper-trades", "/performance", "/dashboard"]);
  redirect("/paper-trades?notice=Paper%20trade%20created");
}

export async function closePaperTrade(formData: FormData) {
  const auth = await getAuthenticatedSupabase();
  const tradeId = asString(formData, "trade_id");

  if (!auth) {
    redirect("/paper-trades?notice=Demo%20mode%3A%20resultaat%20niet%20opgeslagen");
  }

  const { supabase, user } = auth;
  const resultPercent = asNumber(formData, "result_percent");
  await supabase
    .from("paper_trades")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
      exit_price: asNumber(formData, "exit_price"),
      result_percent: resultPercent,
      close_reason: asString(formData, "close_reason", "manual_close") as CloseReason,
      hypothesis_review: asString(formData, "hypothesis_review"),
    })
    .eq("id", tradeId)
    .eq("user_id", user.id);

  await supabase.from("trade_evaluations").insert({
    user_id: user.id,
    paper_trade_id: tradeId,
    result_percent: resultPercent,
    close_reason: asString(formData, "close_reason", "manual_close") as CloseReason,
    hypothesis_review: asString(formData, "hypothesis_review"),
  });

  refresh(["/paper-trades", "/performance", "/dashboard"]);
  redirect("/performance?notice=Paper%20trade%20closed");
}
