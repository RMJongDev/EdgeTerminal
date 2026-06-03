import type { AIAnalysisLog, EventAnalysis, MarketEvent, RiskReview, TradeSetup } from "./types";

export function hasOpenAiEnv() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function hasGeminiEnv() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function getAiRuntimeStatus() {
  return {
    openai: hasOpenAiEnv() ? "configured" : "mock",
    gemini: hasGeminiEnv() ? "configured" : "mock",
    openaiModel: process.env.OPENAI_ANALYSIS_MODEL ?? "gpt-4o-mini",
    geminiModel: process.env.GEMINI_RESEARCH_MODEL ?? "gemini-1.5-flash",
  };
}

export function createMockEventAnalysis(event: MarketEvent): Omit<EventAnalysis, "id"> {
  const isPerception = event.eventType === "perception";

  return {
    eventId: event.id,
    sentiment: event.impactDirection,
    impactLevel: event.impactLevel,
    timeHorizon: isPerception ? "intraday / short term" : "short term",
    confidenceScore: isPerception ? 62 : 58,
    summary: isPerception
      ? "This appears to be a perception-driven event. The direct fundamental impact is uncertain, but sentiment and price reaction deserve attention."
      : "This event may affect the linked asset, but the trade edge depends on market confirmation and whether the news is already priced in.",
    bullCase: isPerception
      ? "If the reaction is emotional and not tied to fundamentals, an overreaction rebound can appear after sentiment stabilizes."
      : "If the market underestimates the event impact, a continuation setup can emerge after confirmation.",
    bearCase: isPerception
      ? "Negative narrative can persist if media or analysts amplify the concern."
      : "The event may already be priced in, or broader market pressure can overwhelm the catalyst.",
    keyRisks: "Chasing, priced-in reaction, weak confirmation, broad-market beta.",
    fundamentalImpact: isPerception ? "Unclear" : null,
    sentimentImpact: isPerception ? "High" : null,
    priceImpact: event.priceMovePercent ? "Confirmed by immediate move" : null,
    reversalChance: isPerception ? "Possible if selling pressure fades" : null,
    followThroughRisk: isPerception ? "Elevated while negative narrative persists" : null,
  };
}

export function createMockSetup(event: MarketEvent, assetId: string, assetTicker: string): Omit<TradeSetup, "id"> {
  const isNegative = event.impactDirection === "negative";
  const direction = isNegative ? "short" : event.impactDirection === "positive" ? "long" : "no_trade";

  return {
    eventId: event.id,
    assetId,
    assetTicker,
    title: `${assetTicker} ${
      direction === "no_trade" ? "no clear edge" : `possible ${direction} hypothesis`
    }`,
    direction,
    strategy: event.eventType === "perception" ? "Perception event reaction" : "Event-driven continuation",
    entryLogic:
      direction === "no_trade"
        ? "No entry until price action confirms a clear edge."
        : "Wait for confirmation near a logical level; avoid chasing the first reaction.",
    stopLoss: direction === "no_trade" ? null : "Level-based invalidation",
    target: direction === "no_trade" ? null : "2R or next liquidity zone",
    timeHorizon: "intraday / short term",
    confidenceScore: direction === "no_trade" ? 42 : 60,
    rationale:
      direction === "no_trade"
        ? "The event is relevant but not clean enough for a paper trade yet."
        : "The event can create a tradable hypothesis if market reaction confirms the initial bias.",
    invalidation: "Invalid if price action contradicts the event bias or the broader sector moves against the setup.",
    assumptions: "Market reaction is not fully priced in and follow-through confirms the thesis.",
    status: "draft",
  };
}

export function createMockRiskReview(setup: TradeSetup): Omit<RiskReview, "id"> {
  return {
    setupId: setup.id,
    keyRisks:
      "The setup may be too obvious, already priced in, or dependent on a first reaction that can reverse quickly.",
    counterargument:
      "The strongest opposing case is that market participants have already absorbed the event and the remaining move has poor risk/reward.",
    reasonToSkip:
      "Skip if there is no clean entry, no volume confirmation, or if the setup requires chasing an extended move.",
    riskScore: setup.direction === "no_trade" ? 82 : 68,
    finalVerdict: setup.direction === "no_trade" ? "skip" : "wait",
  };
}

export function createAiLog(
  analysisType: AIAnalysisLog["analysisType"],
  summary: string,
  provider: AIAnalysisLog["provider"] = "mock",
): Omit<AIAnalysisLog, "id" | "createdAt"> {
  const runtime = getAiRuntimeStatus();

  return {
    analysisType,
    provider,
    model:
      provider === "openai"
        ? runtime.openaiModel
        : provider === "gemini"
          ? runtime.geminiModel
          : "mock-provider-v1",
    promptVersion: `${analysisType}-v1`,
    status: "success",
    usefulnessRating: null,
    summary,
    sourcePayloadRefs: [],
    scoreInputs: {},
  };
}
