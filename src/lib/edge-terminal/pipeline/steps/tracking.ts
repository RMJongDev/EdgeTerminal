import type { Advice, AdviceStatus, AdviceTracking, AdviceTrackingOutcome } from "../../types.ts";

export type TrackingQuote = {
  ticker: string;
  price: number;
  checkedAt?: string;
};

export type TrackingUpdateResult = {
  advices: Advice[];
  tracking: AdviceTracking[];
  updatedCount: number;
  closedCount: number;
  missingTickers: string[];
};

function roundPrice(value: number) {
  return Math.round(value * 100) / 100;
}

function roundReturn(value: number) {
  return Math.round(value * 100) / 100;
}

function utcDay(value: string) {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isWeekday(date: Date) {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

export function tradingDaysElapsed(fromIso: string, toIso: string) {
  const from = utcDay(fromIso);
  const to = utcDay(toIso);

  if (to <= from) {
    return 0;
  }

  let count = 0;
  for (let cursor = addUtcDays(from, 1); cursor <= to; cursor = addUtcDays(cursor, 1)) {
    if (isWeekday(cursor)) {
      count += 1;
    }
  }

  return count;
}

export function calculateDirectionalReturn(input: {
  direction: Advice["direction"];
  referenceEntry: number;
  price: number;
}) {
  if (!Number.isFinite(input.referenceEntry) || input.referenceEntry <= 0 || !Number.isFinite(input.price)) {
    return null;
  }

  const rawReturn = input.direction === "long"
    ? ((input.price - input.referenceEntry) / input.referenceEntry) * 100
    : ((input.referenceEntry - input.price) / input.referenceEntry) * 100;

  return roundReturn(rawReturn);
}

function targetHit(advice: Advice, price: number) {
  return advice.direction === "long" ? price >= advice.target : price <= advice.target;
}

function stopHit(advice: Advice, price: number) {
  return advice.direction === "long" ? price <= advice.stopLoss : price >= advice.stopLoss;
}

function outcomeForExpired(finalReturn: number | null): AdviceTrackingOutcome {
  return (finalReturn ?? 0) >= 0 ? "expired_positive" : "expired_negative";
}

function statusForOutcome(outcome: AdviceTrackingOutcome | null): AdviceStatus {
  if (outcome === "stop" || outcome === "invalidated") {
    return "invalidated";
  }

  return "expired";
}

export function createInitialAdviceTracking(input: {
  advices: Advice[];
  now: string;
  createId: (prefix: string) => string;
}): AdviceTracking[] {
  return input.advices.map((advice) => ({
    id: input.createId("tracking"),
    adviceId: advice.id,
    referenceEntry: Math.round(((advice.entryZoneLow + advice.entryZoneHigh) / 2) * 100) / 100,
    d1Return: null,
    d3Return: null,
    d5Return: null,
    stopHitAt: null,
    targetHitAt: null,
    expiredAt: null,
    finalReturn: null,
    outcome: null,
    lastCheckedAt: null,
    lastPrice: null,
    metadata: {
      initializedBy: "mock_pipeline",
      runProfile: advice.runProfile,
    },
    createdAt: input.now,
    updatedAt: input.now,
  }));
}

export function createDeterministicTrackingQuotes(input: {
  advices: Advice[];
  tracking: AdviceTracking[];
  now: string;
}): TrackingQuote[] {
  const trackingByAdviceId = new Map(input.tracking.map((tracking) => [tracking.adviceId, tracking]));

  return input.advices
    .filter((advice) => advice.status === "active")
    .map((advice) => {
      const tracking = trackingByAdviceId.get(advice.id);
      const referenceEntry = tracking?.referenceEntry ?? roundPrice((advice.entryZoneLow + advice.entryZoneHigh) / 2);
      const age = Math.max(1, tradingDaysElapsed(advice.createdAt, input.now));
      const driftPct = Math.min(4, 0.65 * age);
      const directionMultiplier = advice.direction === "long" ? 1 : -1;
      const price = tracking?.lastPrice ?? referenceEntry * (1 + (directionMultiplier * driftPct) / 100);

      return {
        ticker: advice.ticker,
        price: roundPrice(price),
        checkedAt: input.now,
      };
    });
}

export function updateAdviceTrackingWithPrices(input: {
  advices: Advice[];
  tracking: AdviceTracking[];
  quotes: TrackingQuote[];
  now: string;
  createId: (prefix: string) => string;
}): TrackingUpdateResult {
  const quotesByTicker = new Map(
    input.quotes
      .filter((quote) => Number.isFinite(quote.price) && quote.price > 0)
      .map((quote) => [quote.ticker.toUpperCase(), quote]),
  );
  const existingTrackingByAdviceId = new Map(input.tracking.map((tracking) => [tracking.adviceId, tracking]));
  const nextAdvices: Advice[] = [];
  const nextTrackingByAdviceId = new Map(existingTrackingByAdviceId);
  const missingTickers = new Set<string>();
  let updatedCount = 0;
  let closedCount = 0;

  for (const advice of input.advices) {
    if (advice.status !== "active") {
      nextAdvices.push(advice);
      continue;
    }

    const quote = quotesByTicker.get(advice.ticker.toUpperCase());

    if (!quote) {
      missingTickers.add(advice.ticker);
      nextAdvices.push(advice);
      continue;
    }

    const currentTracking = existingTrackingByAdviceId.get(advice.id) ?? {
      id: input.createId("tracking"),
      adviceId: advice.id,
      referenceEntry: roundPrice((advice.entryZoneLow + advice.entryZoneHigh) / 2),
      d1Return: null,
      d3Return: null,
      d5Return: null,
      stopHitAt: null,
      targetHitAt: null,
      expiredAt: null,
      finalReturn: null,
      outcome: null,
      lastCheckedAt: null,
      lastPrice: null,
      metadata: { initializedBy: "tracking_refresh" },
      createdAt: input.now,
      updatedAt: input.now,
    } satisfies AdviceTracking;
    const checkedAt = quote.checkedAt ?? input.now;
    const tradeAge = tradingDaysElapsed(advice.createdAt, checkedAt);
    const directionalReturn = calculateDirectionalReturn({
      direction: advice.direction,
      referenceEntry: currentTracking.referenceEntry,
      price: quote.price,
    });

    let stopHitAt = currentTracking.stopHitAt;
    let targetHitAt = currentTracking.targetHitAt;
    let expiredAt = currentTracking.expiredAt;
    let outcome = currentTracking.outcome;
    let finalReturn = currentTracking.finalReturn;

    if (!outcome && targetHit(advice, quote.price)) {
      targetHitAt = checkedAt;
      outcome = "target";
      finalReturn = directionalReturn;
    } else if (!outcome && stopHit(advice, quote.price)) {
      stopHitAt = checkedAt;
      outcome = "stop";
      finalReturn = directionalReturn;
    } else if (!outcome && tradeAge >= advice.horizonDays) {
      expiredAt = checkedAt;
      outcome = outcomeForExpired(directionalReturn);
      finalReturn = directionalReturn;
    }

    const updatedTracking: AdviceTracking = {
      ...currentTracking,
      d1Return: currentTracking.d1Return ?? (tradeAge >= 1 ? directionalReturn : null),
      d3Return: currentTracking.d3Return ?? (tradeAge >= 3 ? directionalReturn : null),
      d5Return: currentTracking.d5Return ?? (tradeAge >= 5 ? directionalReturn : null),
      stopHitAt,
      targetHitAt,
      expiredAt,
      finalReturn,
      outcome,
      lastCheckedAt: checkedAt,
      lastPrice: roundPrice(quote.price),
      metadata: {
        ...currentTracking.metadata,
        lastProvider: "tracking_quote",
        tradingDaysElapsed: tradeAge,
      },
      updatedAt: input.now,
    };
    const updatedAdvice: Advice = outcome
      ? {
          ...advice,
          status: statusForOutcome(outcome),
          userExitPrice: roundPrice(quote.price),
          updatedAt: input.now,
        }
      : {
          ...advice,
          updatedAt: input.now,
        };

    if (outcome && !currentTracking.outcome) {
      closedCount += 1;
    }
    updatedCount += 1;
    nextAdvices.push(updatedAdvice);
    nextTrackingByAdviceId.set(advice.id, updatedTracking);
  }

  return {
    advices: nextAdvices,
    tracking: Array.from(nextTrackingByAdviceId.values()),
    updatedCount,
    closedCount,
    missingTickers: Array.from(missingTickers).sort(),
  };
}
