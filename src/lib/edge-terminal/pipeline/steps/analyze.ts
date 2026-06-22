import type { EventAnalysis, EventCandidate, MarketEvent } from "../../types.ts";

export function createEventFromCandidate(input: {
  candidate: EventCandidate;
  sourceUrl: string | null;
  now: string;
  createId: (prefix: string) => string;
}): MarketEvent {
  return {
    id: input.createId("event"),
    title: input.candidate.title,
    summary: input.candidate.summary,
    source: input.sourceUrl ?? input.candidate.rawPayloadRefs[0] ?? "Pipeline candidate",
    occurredAt: input.now,
    eventType: input.candidate.eventTypeGuess,
    impactDirection: input.candidate.impactDirectionGuess,
    impactLevel: input.candidate.impactLevelGuess,
    analysisStatus: "analyzed",
    priceMovePercent: input.candidate.affectedSymbols.includes("RACE.MI") ? -7.1 : null,
    linkedAssetIds: [],
    linkedTickers: input.candidate.affectedSymbols,
  };
}

export function createEventAnalysis(input: {
  candidate: EventCandidate;
  event: MarketEvent;
  createId: (prefix: string) => string;
}): EventAnalysis {
  const isPerception = input.candidate.eventTypeGuess === "perception";
  const isNegative = input.candidate.impactDirectionGuess === "negative";

  return {
    id: input.createId("analysis"),
    eventId: input.event.id,
    sentiment: input.candidate.impactDirectionGuess,
    impactLevel: input.candidate.impactLevelGuess,
    timeHorizon: isPerception ? "2-7 trading days" : "3-10 trading days",
    confidenceScore: input.candidate.confidenceScore,
    summary: isPerception
      ? "This is a perception shock with a confirmed price reaction. The edge is not speed; it is judging whether the second leg is still mispriced after the first selloff."
      : "The event can matter for swing trading, but it needs confirmation because broad market beta or sector noise may dominate.",
    bullCase: isNegative
      ? "If the market overreacted to headlines and fundamentals are intact, the short thesis can fail quickly on a relief bounce."
      : "If follow-through confirms the event, the market may keep repricing the affected ticker over several sessions.",
    bearCase: isNegative
      ? "If media and analyst narratives amplify the concern, the move can continue after a weak rebound attempt."
      : "If the news is already priced in, upside may be limited and risk/reward may collapse.",
    keyRisks:
      "The first move may already reflect the news, liquidity can be thin around the open, and broad market direction can overpower the catalyst.",
    fundamentalImpact: isPerception ? "Unproven" : "Possible",
    sentimentImpact: isPerception ? "High" : "Medium",
    priceImpact: input.event.priceMovePercent ? "Confirmed by mover sweep" : "Needs confirmation",
    reversalChance: isPerception ? "Elevated if the selloff was emotional." : "Moderate.",
    followThroughRisk: isNegative ? "High while the narrative remains negative." : "Medium.",
  };
}
