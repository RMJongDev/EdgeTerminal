import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Advice, AdviceTracking } from "../../src/lib/edge-terminal/types.ts";
import {
  calculateDirectionalReturn,
  createInitialAdviceTracking,
  tradingDaysElapsed,
  updateAdviceTrackingWithPrices,
} from "../../src/lib/edge-terminal/pipeline/steps/tracking.ts";

describe("advice tracking calculations", () => {
  it("counts trading days across a weekend and sets D1 without overwriting future checkpoints", () => {
    const advice = createAdvice({ createdAt: "2026-06-12T10:00:00.000Z", direction: "long" });
    const tracking = createInitialAdviceTracking({
      advices: [advice],
      now: advice.createdAt,
      createId: (prefix) => `${prefix}-1`,
    });
    const result = updateAdviceTrackingWithPrices({
      advices: [advice],
      tracking,
      quotes: [{ ticker: "TST", price: 103, checkedAt: "2026-06-15T16:00:00.000Z" }],
      now: "2026-06-15T16:00:00.000Z",
      createId: (prefix) => `${prefix}-new`,
    });

    assert.equal(tradingDaysElapsed("2026-06-12T10:00:00.000Z", "2026-06-15T16:00:00.000Z"), 1);
    assert.equal(result.tracking[0].d1Return, 3);
    assert.equal(result.tracking[0].d3Return, null);
    assert.equal(result.advices[0].status, "active");
  });

  it("calculates short returns and closes at target", () => {
    const advice = createAdvice({ direction: "short", stopLoss: 105, target: 90 });
    const result = updateAdviceTrackingWithPrices({
      advices: [advice],
      tracking: [createTracking(advice)],
      quotes: [{ ticker: "TST", price: 89, checkedAt: "2026-06-16T16:00:00.000Z" }],
      now: "2026-06-16T16:00:00.000Z",
      createId: (prefix) => `${prefix}-new`,
    });

    assert.equal(calculateDirectionalReturn({ direction: "short", referenceEntry: 100, price: 89 }), 11);
    assert.equal(result.tracking[0].outcome, "target");
    assert.equal(result.tracking[0].finalReturn, 11);
    assert.equal(result.advices[0].status, "expired");
    assert.equal(result.closedCount, 1);
  });

  it("marks long stop hits as invalidated", () => {
    const advice = createAdvice({ direction: "long", stopLoss: 95, target: 110 });
    const result = updateAdviceTrackingWithPrices({
      advices: [advice],
      tracking: [createTracking(advice)],
      quotes: [{ ticker: "TST", price: 94, checkedAt: "2026-06-16T16:00:00.000Z" }],
      now: "2026-06-16T16:00:00.000Z",
      createId: (prefix) => `${prefix}-new`,
    });

    assert.equal(result.tracking[0].outcome, "stop");
    assert.equal(result.tracking[0].finalReturn, -6);
    assert.equal(result.advices[0].status, "invalidated");
  });

  it("expires after the advice horizon and labels positive versus negative expiry", () => {
    const advice = createAdvice({
      createdAt: "2026-06-12T10:00:00.000Z",
      direction: "long",
      horizonDays: 5,
    });
    const result = updateAdviceTrackingWithPrices({
      advices: [advice],
      tracking: [createTracking(advice)],
      quotes: [{ ticker: "TST", price: 98, checkedAt: "2026-06-19T16:00:00.000Z" }],
      now: "2026-06-19T16:00:00.000Z",
      createId: (prefix) => `${prefix}-new`,
    });

    assert.equal(tradingDaysElapsed(advice.createdAt, "2026-06-19T16:00:00.000Z"), 5);
    assert.equal(result.tracking[0].outcome, "expired_negative");
    assert.equal(result.tracking[0].d5Return, -2);
    assert.equal(result.advices[0].status, "expired");
  });
});

function createAdvice(overrides: Partial<Advice> = {}): Advice {
  const createdAt = overrides.createdAt ?? "2026-06-12T10:00:00.000Z";

  return {
    id: "advice-test",
    discoveryRunId: "run-test",
    candidateId: "candidate-test",
    analysisId: "analysis-test",
    setupId: "setup-test",
    riskReviewId: "risk-test",
    assetId: "asset-test",
    ticker: "TST",
    direction: "long",
    market: "us",
    entryZoneLow: 99,
    entryZoneHigh: 101,
    stopLoss: 95,
    target: 110,
    horizonDays: 5,
    sizeSuggestionEur: 250,
    confidence: 70,
    rank: 1,
    eventType: "sector",
    runProfile: "us_open",
    reasoning: "Test reasoning.",
    counterargument: "Test counterargument.",
    invalidation: "Test invalidation.",
    sourceRefs: [],
    executabilityNote: null,
    expectedMovePct: 4,
    costEstimatePct: 0.5,
    costHurdleRatio: 0.125,
    correlationWarning: null,
    gapRiskNote: null,
    squeezeRiskNote: null,
    status: "active",
    takenByUser: false,
    userEntryPrice: null,
    userExitPrice: null,
    userNote: null,
    rejectedReason: null,
    metadata: {},
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function createTracking(advice: Advice): AdviceTracking {
  return {
    id: "tracking-test",
    adviceId: advice.id,
    referenceEntry: 100,
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
    metadata: {},
    createdAt: advice.createdAt,
    updatedAt: advice.createdAt,
  };
}
