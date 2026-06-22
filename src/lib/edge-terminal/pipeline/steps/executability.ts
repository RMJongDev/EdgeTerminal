import type { TradeSetup } from "../../types.ts";
import type { ExecutabilityCheck, NumericTradePlan } from "../types.ts";

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function checkExecutability(input: {
  setup: TradeSetup;
  numericPlan: NumericTradePlan;
  openSameThemeCount: number;
}): ExecutabilityCheck {
  const entryMid = (input.numericPlan.entryZoneLow + input.numericPlan.entryZoneHigh) / 2;
  const expectedMovePct = Math.abs((input.numericPlan.target - entryMid) / entryMid) * 100;
  const stopDistancePct = Math.abs((input.numericPlan.stopLoss - entryMid) / entryMid) * 100;
  const shortMultiplier = input.setup.direction === "short" ? 1.45 : 1;
  const costEstimatePct = round((0.55 + stopDistancePct * 0.03) * shortMultiplier, 2);
  const costHurdleRatio = round(costEstimatePct / expectedMovePct, 3);
  const confidenceScale = Math.min(1, Math.max(0, (input.setup.confidenceScore - 50) / 35));
  const baseSize = 500 + confidenceScale * 500;
  const sizeSuggestionEur = Math.round(Math.min(input.setup.direction === "short" ? 750 : 1000, baseSize) / 25) * 25;
  const isExecutable =
    input.setup.direction !== "none" &&
    input.setup.direction !== "no_trade" &&
    expectedMovePct >= 4 &&
    costHurdleRatio <= 0.333 &&
    input.openSameThemeCount < 2;

  return {
    isExecutable,
    expectedMovePct: round(expectedMovePct),
    costEstimatePct,
    costHurdleRatio,
    sizeSuggestionEur,
    note: isExecutable
      ? `Cost hurdle clears: estimated costs are ${costHurdleRatio}x expected move, below the 0.333 max.`
      : "No advice: the setup fails the cost, movement, direction, or correlation gate.",
  };
}
