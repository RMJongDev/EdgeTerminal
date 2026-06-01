"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  createAiLog,
  createMockEventAnalysis,
  createMockRiskReview,
  createMockSetup,
} from "./ai";
import { demoEvents, demoSetups } from "./demo-data";
import type {
  AIAnalysisLog,
  AssetType,
  CloseReason,
  EventType,
  ImpactDirection,
  ImpactLevel,
  SetupDirection,
} from "./types";

function asString(formData: FormData, key: string, fallback = "") {
  return formData.get(key)?.toString().trim() || fallback;
}

function asNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
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
  };
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
    redirect("/signals?notice=Demo%20mode%3A%20mock%20setup");
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

  refresh(["/signals", `/events/${eventId}`, "/dashboard", "/ai-log"]);
  redirect("/signals?notice=Setup%20generated");
}

export async function generateRiskReview(formData: FormData) {
  const setupId = asString(formData, "setup_id");
  const auth = await getAuthenticatedSupabase();

  if (!auth) {
    redirect("/risk?notice=Demo%20mode%3A%20mock%20risk%20review");
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

  refresh(["/risk", "/signals", "/dashboard", "/ai-log"]);
  redirect("/risk?notice=Risk%20review%20generated");
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
