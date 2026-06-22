"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Json } from "@/lib/database.types";
import { getEdgeRuntimeMode, hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createAiLog } from "./ai";
import { buildMockDiscoveryResult, createScanContextHints } from "./discovery";
import { startRun } from "./pipeline";
import { fetchFinnhubLastPrices } from "./pipeline/adapters/finnhub";
import {
  createDeterministicTrackingQuotes,
  updateAdviceTrackingWithPrices,
  type TrackingQuote,
} from "./pipeline/steps/tracking";
import { createLocalId, getLocalTerminalData, updateLocalTerminalData } from "./store/local";
import type {
  AIAnalysisLog,
  AssetType,
  CandidateStatus,
  EventType,
  ImpactDirection,
  ImpactLevel,
  MarketEvent,
  ScanHintMode,
  TerminalData,
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
    input_payload: asJson(log.inputPayload ?? {}),
    output_payload: asJson(log.outputPayload ?? { summary: log.summary }),
    status: log.status,
    usefulness_rating: log.usefulnessRating,
    summary: log.summary,
    error_message: log.errorMessage ?? null,
    source_payload_refs: log.sourcePayloadRefs,
    score_inputs: asJson(log.scoreInputs),
    input_tokens: typeof log.costSummary?.inputTokens === "number" ? log.costSummary.inputTokens : null,
    output_tokens: typeof log.costSummary?.outputTokens === "number" ? log.costSummary.outputTokens : null,
    cost_eur: typeof log.costSummary?.costEur === "number" ? log.costSummary.costEur : null,
  };
}

function isLocalRuntime() {
  return getEdgeRuntimeMode() === "local";
}

function localAiLog(log: Omit<AIAnalysisLog, "id" | "createdAt">): AIAnalysisLog {
  return {
    id: createLocalId("log"),
    createdAt: new Date().toISOString(),
    ...log,
  };
}

function safeNextPath(value: string) {
  if (value === "/dashboard" || value === "/tracking" || value === "/performance" || value.startsWith("/advices/")) {
    return value;
  }

  return "/tracking";
}

async function getLocalTrackingQuotes(data: TerminalData, now: string) {
  const activeAdvices = data.advices.filter((advice) => advice.status === "active");
  const tickers = Array.from(new Set(activeAdvices.map((advice) => advice.ticker)));
  let provider = "deterministic_local";
  let providerError: string | null = null;
  let liveQuotes: TrackingQuote[] = [];

  if (tickers.length > 0) {
    try {
      liveQuotes = (await fetchFinnhubLastPrices(tickers)).map((quote) => ({
        ticker: quote.ticker,
        price: quote.price,
        checkedAt: quote.checkedAt,
      }));
      if (liveQuotes.length > 0) {
        provider = liveQuotes.length === tickers.length ? "finnhub" : "finnhub+fallback";
      }
    } catch (error) {
      providerError = error instanceof Error ? error.message : "Finnhub tracking quote refresh failed";
    }
  }

  const fallbackQuotes = createDeterministicTrackingQuotes({
    advices: activeAdvices,
    tracking: data.adviceTracking,
    now,
  });
  const quoteByTicker = new Map<string, TrackingQuote>();

  for (const quote of fallbackQuotes) {
    quoteByTicker.set(quote.ticker.toUpperCase(), quote);
  }

  for (const quote of liveQuotes) {
    quoteByTicker.set(quote.ticker.toUpperCase(), quote);
  }

  return {
    quotes: Array.from(quoteByTicker.values()),
    provider,
    providerError,
  };
}

function createLocalEventFromCandidate(
  data: TerminalData,
  candidateId: string,
  status: CandidateStatus,
): string | null {
  const candidate = data.eventCandidates.find((item) => item.id === candidateId);

  if (!candidate) {
    return null;
  }

  const now = new Date().toISOString();
  const sourceText =
    candidate.sourceIds
      .map((sourceId) => data.eventSources.find((source) => source.id === sourceId)?.sourceUrl)
      .find((sourceUrl): sourceUrl is string => Boolean(sourceUrl)) ??
    candidate.rawPayloadRefs[0] ??
    "Discovery candidate";
  const linkedAssets = data.assets.filter((asset) => candidate.affectedSymbols.includes(asset.ticker));
  const eventId = createLocalId("event");
  const event: MarketEvent = {
    id: eventId,
    title: candidate.title,
    summary: candidate.summary,
    source: sourceText,
    occurredAt: now,
    eventType: candidate.eventTypeGuess,
    impactDirection: candidate.impactDirectionGuess,
    impactLevel: candidate.impactLevelGuess,
    analysisStatus: status === "analyzed" ? "needs_review" : "pending",
    priceMovePercent: null,
    linkedAssetIds: linkedAssets.map((asset) => asset.id),
    linkedTickers: candidate.affectedSymbols,
  };

  data.events = [event, ...data.events];
  candidate.candidateStatus = status;
  candidate.acceptedMarketEventId = eventId;
  candidate.updatedAt = now;

  return eventId;
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

  if (isLocalRuntime()) {
    updateLocalTerminalData((data) => {
      const now = new Date().toISOString();
      const runId = createLocalId("run");
      const run = {
        id: runId,
        status: "completed" as const,
        trigger: "manual" as const,
        provider: "mock" as const,
        runProfile: "mock" as const,
        contextHints,
        startedAt: now,
        completedAt: now,
        sourceCount: discovery.sources.length,
        candidateCount: discovery.candidates.length,
        topCandidateCount: discovery.candidates.length,
        costSummary: {
          mode: "local_mock",
          totalCostEur: 0,
          note: "Mock pipeline run persisted locally.",
        },
        errorMessage: null,
      };
      const sourceIdByRef = new Map<string, string>();
      const sources = discovery.sources.map((source) => {
        const sourceId = createLocalId("source");

        if (source.rawPayloadRef) {
          sourceIdByRef.set(source.rawPayloadRef, sourceId);
        }

        return {
          ...source,
          id: sourceId,
          discoveryRunId: runId,
          fetchedAt: now,
        };
      });
      const candidates = discovery.candidates.map((candidate) => ({
        ...candidate,
        id: createLocalId("candidate"),
        discoveryRunId: runId,
        sourceIds: candidate.rawPayloadRefs
          .map((ref) => sourceIdByRef.get(ref))
          .filter((sourceId): sourceId is string => Boolean(sourceId)),
        candidateStatus: "new" as const,
        acceptedMarketEventId: null,
        canonicalCandidateId: null,
        createdAt: now,
        updatedAt: now,
      }));

      data.discoveryRuns = [run, ...data.discoveryRuns].slice(0, 10);
      data.eventSources = [...sources, ...data.eventSources].slice(0, 200);
      data.eventCandidates = [...candidates, ...data.eventCandidates].slice(0, 100);
      data.latestDiscoveryRun = run;
      data.aiLogs = [
        localAiLog({
          ...createAiLog("candidate_ranking", `Ranked ${candidates.length} candidate events from ${sources.length} sources.`),
          sourcePayloadRefs: sources
            .map((source) => source.rawPayloadRef)
            .filter((ref): ref is string => Boolean(ref)),
          scoreInputs: {
            contextHints,
            sourceCount: sources.length,
            candidateCount: candidates.length,
          },
        }),
        ...data.aiLogs,
      ];
      data.dailyBriefing = {
        ...data.dailyBriefing,
        briefingDate: now.slice(0, 10),
        title: "Local run briefing",
        marketSummary: `Local mock run completed with ${candidates.length} ranked candidates from ${sources.length} sources.`,
        keyEvents: candidates.slice(0, 3).map((candidate) => candidate.title),
        possibleSetups: candidates.slice(0, 2).map((candidate) => candidate.reasonToWatch),
        conclusion: candidates.length > 0 ? "Review the top candidates and only act when the setup is clean." : "No advice today.",
      };
    });

    refresh(["/dashboard", "/events", "/briefing", "/ai-log"]);
    redirect("/dashboard?notice=Local%20run%20complete%3A%20candidates%20stored");
  }

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
      run_profile: "mock",
      context_hints: contextHints ?? {},
      cost_summary: {},
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

export async function startAdviceRun(formData: FormData) {
  const requestedProfile = asString(formData, "run_profile", "eu_open");
  const runProfile = requestedProfile === "us_open" ? "us_open" : "eu_open";

  if (isLocalRuntime()) {
    const result = await startRun(runProfile, "manual");
    refresh(["/dashboard", "/events", "/briefing", "/ai-log", "/performance"]);
    redirect(
      `/dashboard?notice=${encodeURIComponent(
        `${runProfile} advice run complete: ${result.adviceCount} advice(s), top ${result.topAdviceTickers.join(", ") || "none"}`,
      )}`,
    );
  }

  const auth = await getAuthenticatedSupabase();

  if (!auth) {
    redirect("/dashboard?notice=Demo%20mode%3A%20mock%20advice%20run%20preview");
  }

  redirect("/dashboard?notice=Supabase%20advice%20pipeline%20komt%20na%20de%20lokale%20MVP");
}

export async function markAdviceTaken(formData: FormData) {
  const adviceId = asString(formData, "advice_id");
  const entryPrice = asNumber(formData, "entry_price", Number.NaN);

  if (isLocalRuntime()) {
    updateLocalTerminalData((data) => {
      const now = new Date().toISOString();
      const advice = data.advices.find((item) => item.id === adviceId);

      if (!advice) {
        return;
      }

      advice.takenByUser = true;
      advice.userEntryPrice = Number.isFinite(entryPrice) ? entryPrice : advice.userEntryPrice ?? advice.entryZoneLow;
      advice.updatedAt = now;

      const tracking = data.adviceTracking.find((item) => item.adviceId === advice.id);
      if (tracking && Number.isFinite(entryPrice)) {
        tracking.referenceEntry = entryPrice;
        tracking.updatedAt = now;
      }
    });
    refresh(["/dashboard", "/tracking", "/performance"]);
    redirect("/dashboard?notice=Advice%20marked%20as%20taken");
  }

  redirect("/dashboard?notice=Taking%20advices%20is%20available%20in%20local%20mode%20for%20the%20MVP");
}

export async function rejectAdvice(formData: FormData) {
  const adviceId = asString(formData, "advice_id");
  const rejectedReason = asString(formData, "rejected_reason", "Rejected by user");

  if (isLocalRuntime()) {
    updateLocalTerminalData((data) => {
      const now = new Date().toISOString();
      const advice = data.advices.find((item) => item.id === adviceId);

      if (!advice) {
        return;
      }

      advice.status = "rejected_by_user";
      advice.takenByUser = false;
      advice.rejectedReason = rejectedReason;
      advice.updatedAt = now;
    });
    refresh(["/dashboard", "/tracking", "/performance"]);
    redirect("/dashboard?notice=Advice%20rejected");
  }

  redirect("/dashboard?notice=Rejecting%20advices%20is%20available%20in%20local%20mode%20for%20the%20MVP");
}

export async function refreshAdviceTracking(formData: FormData) {
  const nextPath = safeNextPath(asString(formData, "next", "/tracking"));

  if (isLocalRuntime()) {
    const now = new Date().toISOString();
    const snapshot = getLocalTerminalData();
    const { quotes, provider, providerError } = await getLocalTrackingQuotes(snapshot, now);
    let updatedCount = 0;
    let closedCount = 0;
    let missingTickers: string[] = [];

    updateLocalTerminalData((data) => {
      const result = updateAdviceTrackingWithPrices({
        advices: data.advices,
        tracking: data.adviceTracking,
        quotes,
        now,
        createId: createLocalId,
      });

      updatedCount = result.updatedCount;
      closedCount = result.closedCount;
      missingTickers = result.missingTickers;
      data.advices = result.advices;
      data.adviceTracking = result.tracking;
      data.aiLogs = [
        localAiLog({
          ...createAiLog("pipeline_step", `Refreshed advice tracking with ${provider}.`),
          promptVersion: "pipeline-update_tracking-v1",
          outputPayload: {
            provider,
            updatedCount,
            closedCount,
            missingTickers,
            providerError,
          },
          scoreInputs: {
            provider,
            quoteCount: quotes.length,
          },
        }),
        ...data.aiLogs,
      ];
    });

    refresh(["/dashboard", "/tracking", "/performance", "/ai-log"]);
    redirect(
      `${nextPath}?notice=${encodeURIComponent(
        `Tracking refreshed: ${updatedCount} updated, ${closedCount} closed via ${provider}${
          missingTickers.length ? `; missing ${missingTickers.join(", ")}` : ""
        }`,
      )}`,
    );
  }

  redirect(`${nextPath}?notice=Tracking%20refresh%20is%20available%20in%20local%20mode%20for%20the%20MVP`);
}

export async function createAsset(formData: FormData) {
  if (isLocalRuntime()) {
    updateLocalTerminalData((data) => {
      const now = new Date().toISOString();
      data.assets = [
        {
          id: createLocalId("asset"),
          ticker: asString(formData, "ticker").toUpperCase(),
          name: asString(formData, "name"),
          assetType: asString(formData, "asset_type", "us_equity") as AssetType,
          sector: asString(formData, "sector"),
          exchange: asString(formData, "exchange"),
          currency: asString(formData, "currency", "USD").toUpperCase(),
          country: asString(formData, "country"),
          priority: asNumber(formData, "priority", 5),
          notes: asString(formData, "notes") || null,
          status: "active" as const,
          lastMovePercent: null,
          updatedAt: now,
        },
        ...data.assets,
      ].sort((a, b) => a.priority - b.priority || a.ticker.localeCompare(b.ticker));
    });

    refresh(["/watchlist", "/dashboard"]);
    redirect("/watchlist?notice=Asset%20stored%20locally");
  }

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
  if (isLocalRuntime()) {
    let eventId = "";
    updateLocalTerminalData((data) => {
      eventId = createLocalId("event");
      const assetId = asString(formData, "asset_id");
      const asset = data.assets.find((item) => item.id === assetId);
      data.events = [
        {
          id: eventId,
          title: asString(formData, "title"),
          summary: asString(formData, "summary"),
          source: asString(formData, "source") || null,
          occurredAt: asString(formData, "occurred_at", new Date().toISOString()),
          eventType: asString(formData, "event_type", "other") as EventType,
          impactDirection: asString(formData, "impact_direction", "mixed") as ImpactDirection,
          impactLevel: asString(formData, "impact_level", "medium") as ImpactLevel,
          priceMovePercent: asNumber(formData, "price_move_percent", 0),
          analysisStatus: "pending",
          linkedAssetIds: assetId ? [assetId] : [],
          linkedTickers: asset ? [asset.ticker] : [],
        },
        ...data.events,
      ];
    });

    refresh(["/events", "/dashboard"]);
    redirect(eventId ? `/events/${eventId}?notice=Event%20stored%20locally` : "/events");
  }

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

  if (isLocalRuntime()) {
    let eventId: string | null = null;
    updateLocalTerminalData((data) => {
      eventId = createLocalEventFromCandidate(data, candidateId, "accepted");
    });

    refresh(["/events", "/dashboard", eventId ? `/events/${eventId}` : "/events"]);
    redirect(eventId ? `/events/${eventId}?notice=Candidate%20accepted%20locally` : "/events?notice=Candidate%20not%20found");
  }

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

  if (isLocalRuntime()) {
    updateLocalTerminalData((data) => {
      const candidate = data.eventCandidates.find((item) => item.id === candidateId);

      if (candidate) {
        candidate.candidateStatus = "ignored";
        candidate.ignoreReason = ignoreReason;
        candidate.updatedAt = new Date().toISOString();
      }
    });

    refresh(["/events", "/dashboard"]);
    redirect("/events?notice=Candidate%20ignored%20locally");
  }

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

  if (isLocalRuntime()) {
    updateLocalTerminalData((data) => {
      const candidate = data.eventCandidates.find((item) => item.id === candidateId);

      if (candidate) {
        candidate.candidateStatus = "merged";
        candidate.mergeHint = mergeHint;
        candidate.canonicalCandidateId = canonicalCandidateId;
        candidate.updatedAt = new Date().toISOString();
      }
    });

    refresh(["/events", "/dashboard"]);
    redirect("/events?notice=Candidate%20merged%20locally");
  }

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

  if (isLocalRuntime()) {
    let eventId: string | null = null;
    updateLocalTerminalData((data) => {
      eventId = createLocalEventFromCandidate(data, candidateId, "analyzed");
      const candidate = data.eventCandidates.find((item) => item.id === candidateId);

      if (candidate) {
        data.aiLogs = [
          localAiLog({
            ...createAiLog("event_analysis", `Prepared candidate analysis input for ${candidate.title}.`),
            sourcePayloadRefs: candidate.rawPayloadRefs,
            scoreInputs: candidate.scoreBreakdown,
          }),
          ...data.aiLogs,
        ];
      }
    });

    refresh(["/events", "/dashboard", "/ai-log", eventId ? `/events/${eventId}` : "/events"]);
    redirect(eventId ? `/events/${eventId}?notice=Candidate%20ready%20locally` : "/events?notice=Candidate%20not%20found");
  }

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
