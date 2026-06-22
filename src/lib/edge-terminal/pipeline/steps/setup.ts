import type { EventCandidate, MarketEvent, TradeSetup } from "../../types.ts";
import type { NumericTradePlan } from "../types.ts";

const pricePlans: Record<string, NumericTradePlan> = {
  "RACE.MI": {
    entryZoneLow: 394,
    entryZoneHigh: 399,
    stopLoss: 414,
    target: 361,
    horizonDays: 7,
  },
  ASML: {
    entryZoneLow: 928,
    entryZoneHigh: 940,
    stopLoss: 899,
    target: 992,
    horizonDays: 8,
  },
  NVDA: {
    entryZoneLow: 142,
    entryZoneHigh: 146,
    stopLoss: 151,
    target: 131,
    horizonDays: 6,
  },
};

function fallbackPlan(direction: "long" | "short" | "none"): NumericTradePlan {
  if (direction === "short") {
    return {
      entryZoneLow: 96,
      entryZoneHigh: 100,
      stopLoss: 106,
      target: 84,
      horizonDays: 5,
    };
  }

  return {
    entryZoneLow: 100,
    entryZoneHigh: 104,
    stopLoss: 94,
    target: 116,
    horizonDays: 5,
  };
}

export function createSetup(input: {
  candidate: EventCandidate;
  event: MarketEvent;
  assetId: string | null;
  createId: (prefix: string) => string;
}): { setup: TradeSetup; numericPlan: NumericTradePlan } {
  const ticker = input.candidate.affectedSymbols[0] ?? "UNKNOWN";
  const direction =
    input.candidate.candidateQualityScore < 68 || input.candidate.eventTypeGuess === "macro"
      ? "none"
      : input.candidate.impactDirectionGuess === "negative"
        ? "short"
        : input.candidate.impactDirectionGuess === "positive"
          ? "long"
          : "none";
  const numericPlan = pricePlans[ticker] ?? fallbackPlan(direction);

  return {
    numericPlan,
    setup: {
      id: input.createId("setup"),
      eventId: input.event.id,
      assetId: input.assetId ?? "external-asset",
      assetTicker: ticker,
      title:
        direction === "none"
          ? `${ticker} no clean advice`
          : `${ticker} ${direction} on event follow-through`,
      direction,
      strategy:
        input.candidate.eventTypeGuess === "perception"
          ? "Perception-event second leg"
          : "Event-driven swing continuation",
      entryLogic:
        direction === "none"
          ? "Do not enter until stronger source proof and a clean technical level appear."
          : "Wait for confirmation near the entry zone; avoid chasing the first reaction.",
      stopLoss: direction === "none" ? null : String(numericPlan.stopLoss),
      target: direction === "none" ? null : String(numericPlan.target),
      timeHorizon: `${numericPlan.horizonDays} trading days`,
      confidenceScore: direction === "none" ? 45 : input.candidate.confidenceScore,
      rationale:
        direction === "none"
          ? "The event is visible but does not clear the quality bar for an explicit advice."
          : input.candidate.reasonToWatch,
      invalidation:
        direction === "short"
          ? "Invalid if price reclaims the event VWAP and the media narrative stabilizes."
          : "Invalid if price loses the setup level or sector confirmation breaks down.",
      assumptions:
        "The first reaction has not fully priced the second-order impact and source proof remains intact.",
      status: "draft",
    },
  };
}
