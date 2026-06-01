import type { PaperTrade, SetupDirection, TerminalData } from "./types";

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "n/a";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

export function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return "n/a";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

export function isClosedTrade(trade: PaperTrade) {
  return trade.status !== "open" && trade.resultPercent !== null;
}

export function getPerformanceSummary(trades: PaperTrade[]) {
  const openTrades = trades.filter((trade) => trade.status === "open");
  const closedTrades = trades.filter(isClosedTrade);
  const winningTrades = closedTrades.filter((trade) => (trade.resultPercent ?? 0) > 0);
  const averageResult =
    closedTrades.length > 0
      ? closedTrades.reduce((sum, trade) => sum + (trade.resultPercent ?? 0), 0) /
        closedTrades.length
      : 0;

  return {
    openCount: openTrades.length,
    closedCount: closedTrades.length,
    winRate: closedTrades.length > 0 ? Math.round((winningTrades.length / closedTrades.length) * 100) : 0,
    averageResult,
    bestTrade: closedTrades.reduce<PaperTrade | null>((best, trade) => {
      if (!best || (trade.resultPercent ?? 0) > (best.resultPercent ?? 0)) return trade;
      return best;
    }, null),
    worstTrade: closedTrades.reduce<PaperTrade | null>((worst, trade) => {
      if (!worst || (trade.resultPercent ?? 0) < (worst.resultPercent ?? 0)) return trade;
      return worst;
    }, null),
  };
}

export function getDirectionPerformance(trades: PaperTrade[]) {
  const directions: SetupDirection[] = ["long", "short", "no_trade"];

  return directions.map((direction) => {
    const directionTrades = trades.filter(
      (trade) => trade.direction === direction && isClosedTrade(trade),
    );
    const average =
      directionTrades.length > 0
        ? directionTrades.reduce((sum, trade) => sum + (trade.resultPercent ?? 0), 0) /
          directionTrades.length
        : 0;

    return {
      direction,
      count: directionTrades.length,
      average,
    };
  });
}

export function getDashboardMetrics(data: TerminalData) {
  const performance = getPerformanceSummary(data.paperTrades);
  const highImpactEvents = data.events.filter((event) => event.impactLevel === "high");
  const perceptionEvents = data.events.filter((event) => event.eventType === "perception");
  const pendingRiskReviews = data.setups.filter(
    (setup) => !data.riskReviews.some((review) => review.setupId === setup.id),
  );

  return {
    relevantEvents: data.events.length,
    highImpactEvents: highImpactEvents.length,
    perceptionEvents: perceptionEvents.length,
    possibleSetups: data.setups.length,
    pendingRiskReviews: pendingRiskReviews.length,
    ...performance,
  };
}
