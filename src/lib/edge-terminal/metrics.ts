import type { Advice, AdviceTracking, PaperTrade, SetupDirection, TerminalData } from "./types";

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

type AdvicePerformanceRow = {
  advice: Advice;
  tracking: AdviceTracking | null;
  returnPct: number | null;
  costPct: number;
  netReturnPct: number | null;
  closed: boolean;
  taken: boolean;
};

export type AdvicePerformanceSegment = {
  label: string;
  count: number;
  closedCount: number;
  winRate: number;
  expectancyAfterCosts: number | null;
  sampleWarning: boolean;
  labelQuality: "promising" | "mixed" | "avoid" | "not_enough_data";
};

function average(values: number[]) {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function winRate(values: number[]) {
  return values.length > 0 ? Math.round((values.filter((value) => value > 0).length / values.length) * 100) : 0;
}

function adviceReturn(tracking: AdviceTracking | null) {
  return tracking?.finalReturn ?? tracking?.d5Return ?? tracking?.d3Return ?? tracking?.d1Return ?? null;
}

function qualityLabel(closedCount: number, expectancy: number | null): AdvicePerformanceSegment["labelQuality"] {
  if (closedCount < 30 || expectancy === null) {
    return "not_enough_data";
  }

  if (expectancy >= 0.5) {
    return "promising";
  }

  if (expectancy <= -0.5) {
    return "avoid";
  }

  return "mixed";
}

function toAdviceRows(data: TerminalData): AdvicePerformanceRow[] {
  const trackingByAdviceId = new Map(data.adviceTracking.map((tracking) => [tracking.adviceId, tracking]));

  return data.advices.map((advice) => {
    const tracking = trackingByAdviceId.get(advice.id) ?? null;
    const returnPct = adviceReturn(tracking);
    const costPct = advice.costEstimatePct ?? 0;

    return {
      advice,
      tracking,
      returnPct,
      costPct,
      netReturnPct: returnPct === null ? null : returnPct - costPct,
      closed: Boolean(tracking?.outcome || tracking?.finalReturn !== null || advice.status !== "active"),
      taken: advice.takenByUser,
    };
  });
}

function segmentRows(rows: AdvicePerformanceRow[], label: string): AdvicePerformanceSegment {
  const closedRows = rows.filter((row) => row.netReturnPct !== null && row.closed);
  const netReturns = closedRows.map((row) => row.netReturnPct as number);
  const expectancy = average(netReturns);

  return {
    label,
    count: rows.length,
    closedCount: closedRows.length,
    winRate: winRate(netReturns),
    expectancyAfterCosts: expectancy,
    sampleWarning: closedRows.length < 30,
    labelQuality: qualityLabel(closedRows.length, expectancy),
  };
}

function confidenceBand(confidence: number) {
  if (confidence >= 80) return "80-100";
  if (confidence >= 60) return "60-79";
  return "0-59";
}

function groupBy(rows: AdvicePerformanceRow[], key: (row: AdvicePerformanceRow) => string) {
  const groups = new Map<string, AdvicePerformanceRow[]>();

  for (const row of rows) {
    const label = key(row);
    groups.set(label, [...(groups.get(label) ?? []), row]);
  }

  return Array.from(groups.entries())
    .map(([label, groupedRows]) => segmentRows(groupedRows, label))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

export function getAdvicePerformance(data: TerminalData) {
  const rows = toAdviceRows(data);
  const closedRows = rows.filter((row) => row.netReturnPct !== null && row.closed);
  const takenRows = rows.filter((row) => row.taken);
  const takenClosedRows = closedRows.filter((row) => row.taken);
  const allNetReturns = closedRows.map((row) => row.netReturnPct as number);
  const takenNetReturns = takenClosedRows.map((row) => row.netReturnPct as number);
  const bestRow = closedRows.reduce<AdvicePerformanceRow | null>((best, row) => {
    if (!best || (row.netReturnPct ?? -Infinity) > (best.netReturnPct ?? -Infinity)) return row;
    return best;
  }, null);
  const worstRow = closedRows.reduce<AdvicePerformanceRow | null>((worst, row) => {
    if (!worst || (row.netReturnPct ?? Infinity) < (worst.netReturnPct ?? Infinity)) return row;
    return worst;
  }, null);
  const monthly = new Map<string, { month: string; costEur: number; grossReturnEur: number; netReturnEur: number; count: number }>();

  for (const row of rows) {
    const month = row.advice.createdAt.slice(0, 7);
    const current = monthly.get(month) ?? { month, costEur: 0, grossReturnEur: 0, netReturnEur: 0, count: 0 };
    const size = row.advice.sizeSuggestionEur;

    current.count += 1;
    current.costEur += (row.costPct / 100) * size;
    current.grossReturnEur += ((row.returnPct ?? 0) / 100) * size;
    current.netReturnEur += ((row.netReturnPct ?? 0) / 100) * size;
    monthly.set(month, current);
  }

  const expectancyAfterCosts = average(allNetReturns);
  const takenExpectancyAfterCosts = average(takenNetReturns);

  return {
    summary: {
      totalCount: rows.length,
      openCount: rows.filter((row) => row.advice.status === "active").length,
      closedCount: closedRows.length,
      takenCount: takenRows.length,
      rejectedCount: rows.filter((row) => row.advice.status === "rejected_by_user").length,
      winRate: winRate(allNetReturns),
      expectancyAfterCosts,
      takenExpectancyAfterCosts,
      bestAdvice: bestRow?.advice ?? null,
      worstAdvice: worstRow?.advice ?? null,
    },
    segments: {
      direction: groupBy(rows, (row) => row.advice.direction),
      eventType: groupBy(rows, (row) => row.advice.eventType),
      runProfile: groupBy(rows, (row) => row.advice.runProfile),
      confidenceBand: groupBy(rows, (row) => confidenceBand(row.advice.confidence)),
      market: groupBy(rows, (row) => row.advice.market.toUpperCase()),
      takenVsAll: [
        segmentRows(rows, "All advices"),
        segmentRows(takenRows, "Taken by Robin"),
        segmentRows(rows.filter((row) => !row.taken), "Not taken"),
      ],
    },
    monthly: Array.from(monthly.values()).sort((left, right) => right.month.localeCompare(left.month)),
    scaleGates: [
      {
        label: "Sample size",
        passed: closedRows.length >= 30,
        detail: `${closedRows.length}/30 closed outcomes`,
      },
      {
        label: "Expectancy after costs",
        passed: (expectancyAfterCosts ?? -Infinity) > 0,
        detail: expectancyAfterCosts === null ? "n/a" : formatPercent(expectancyAfterCosts),
      },
      {
        label: "Taken advice edge",
        passed: takenClosedRows.length >= 10 && (takenExpectancyAfterCosts ?? -Infinity) > 0,
        detail: `${takenClosedRows.length} taken closed / ${takenExpectancyAfterCosts === null ? "n/a" : formatPercent(takenExpectancyAfterCosts)}`,
      },
      {
        label: "Monthly cost discipline",
        passed: Array.from(monthly.values()).every((row) => row.costEur <= 150),
        detail: "EUR 150 monthly budget",
      },
    ],
  };
}

export function getCalibrationContext(data: TerminalData, advice: Advice) {
  const performance = getAdvicePerformance(data);
  const comparableRows = toAdviceRows(data).filter(
    (row) =>
      row.advice.direction === advice.direction &&
      row.advice.eventType === advice.eventType &&
      row.advice.market === advice.market &&
      row.netReturnPct !== null &&
      row.closed,
  );
  const netReturns = comparableRows.map((row) => row.netReturnPct as number);
  const expectancyAfterCosts = average(netReturns);
  const label = qualityLabel(comparableRows.length, expectancyAfterCosts);

  return {
    comparableCount: comparableRows.length,
    winRate: winRate(netReturns),
    expectancyAfterCosts,
    label,
    ready: comparableRows.length >= 20,
    globalClosedCount: performance.summary.closedCount,
  };
}

export function getRiskGuardrails(
  data: TerminalData,
  config = {
    tradingCapitalEur: 2500,
    maxOpenPositions: 5,
    lossStreakThreshold: 5,
    drawdownThresholdPct: -10,
    lookbackDays: 30,
  },
) {
  const rows = toAdviceRows(data);
  const openTakenAdvices = data.advices.filter((advice) => advice.status === "active" && advice.takenByUser);
  const now = new Date();
  const cutoff = new Date(now.getTime() - config.lookbackDays * 24 * 60 * 60_000);
  const closedTakenRows = rows
    .filter((row) => row.taken && row.closed && row.netReturnPct !== null)
    .sort((left, right) => {
      const leftDate = left.tracking?.lastCheckedAt ?? left.tracking?.updatedAt ?? left.advice.updatedAt;
      const rightDate = right.tracking?.lastCheckedAt ?? right.tracking?.updatedAt ?? right.advice.updatedAt;
      return Date.parse(rightDate) - Date.parse(leftDate);
    });
  let losingStreak = 0;

  for (const row of closedTakenRows) {
    if ((row.netReturnPct ?? 0) < 0) {
      losingStreak += 1;
    } else {
      break;
    }
  }

  const lookbackRows = closedTakenRows.filter((row) => {
    const checkedAt = row.tracking?.lastCheckedAt ?? row.tracking?.updatedAt ?? row.advice.updatedAt;
    return Date.parse(checkedAt) >= cutoff.getTime();
  });
  const drawdownEur = lookbackRows.reduce((sum, row) => {
    const size = row.advice.sizeSuggestionEur;
    return sum + ((row.netReturnPct ?? 0) / 100) * size;
  }, 0);
  const drawdownPct = (drawdownEur / config.tradingCapitalEur) * 100;
  const openExposureEur = openTakenAdvices.reduce((sum, advice) => sum + advice.sizeSuggestionEur, 0);
  const circuitBreakerTriggered =
    losingStreak >= config.lossStreakThreshold || drawdownPct <= config.drawdownThresholdPct;

  return {
    tradingCapitalEur: config.tradingCapitalEur,
    maxOpenPositions: config.maxOpenPositions,
    openPositionCount: openTakenAdvices.length,
    openExposureEur,
    losingStreak,
    drawdownEur,
    drawdownPct,
    circuitBreakerTriggered,
    paperOnly: circuitBreakerTriggered,
    status: circuitBreakerTriggered
      ? "paper_only"
      : openTakenAdvices.length >= config.maxOpenPositions
        ? "max_positions"
        : "ok",
    warnings: [
      openTakenAdvices.length >= config.maxOpenPositions
        ? `Max open positions reached (${openTakenAdvices.length}/${config.maxOpenPositions}).`
        : null,
      losingStreak >= config.lossStreakThreshold
        ? `${losingStreak} losing taken advices in a row.`
        : null,
      drawdownPct <= config.drawdownThresholdPct
        ? `${formatPercent(drawdownPct)} drawdown in ${config.lookbackDays} days.`
        : null,
    ].filter((warning): warning is string => Boolean(warning)),
  };
}

export function getDashboardMetrics(data: TerminalData) {
  const advicePerformance = getAdvicePerformance(data);
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
    openCount: advicePerformance.summary.openCount,
    closedCount: advicePerformance.summary.closedCount,
    winRate: advicePerformance.summary.winRate,
    averageResult: advicePerformance.summary.expectancyAfterCosts ?? 0,
    bestTrade: null,
    worstTrade: null,
  };
}
