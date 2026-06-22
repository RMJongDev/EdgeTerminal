import type { EventCandidate, RiskReview, TradeSetup } from "../../types.ts";

export function createRiskReview(input: {
  candidate: EventCandidate;
  setup: TradeSetup;
  createId: (prefix: string) => string;
}): RiskReview {
  const isShort = input.setup.direction === "short";
  const isNoTrade = input.setup.direction === "none" || input.setup.direction === "no_trade";
  const riskScore = isNoTrade ? 84 : isShort ? 70 : 62;

  return {
    id: input.createId("risk"),
    setupId: input.setup.id,
    keyRisks: isShort
      ? "Shorts can squeeze, the first selloff may already price the event, and a rebound can be violent if the narrative stabilizes."
      : "The event may be priced in, sector confirmation can fail, and broad market weakness can overwhelm a positive catalyst.",
    counterargument: isShort
      ? "The best opposing case is that Ferrari's selloff is emotional, not fundamental, and buyers step in after the first wave."
      : "The best opposing case is that the market already expected the good news and follow-through has poor risk/reward.",
    reasonToSkip: isNoTrade
      ? "Skip because the event does not clear the source quality and executability bar."
      : "Skip if the entry requires chasing, if spread widens, or if the catalyst loses source support.",
    riskScore,
    finalVerdict: isNoTrade ? "skip" : "ok",
  };
}
