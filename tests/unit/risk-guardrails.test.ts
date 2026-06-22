import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { demoTerminalData } from "../../src/lib/edge-terminal/demo-data.ts";
import { getRiskGuardrails } from "../../src/lib/edge-terminal/metrics.ts";
import type { Advice, AdviceTracking, TerminalData } from "../../src/lib/edge-terminal/types.ts";

describe("risk guardrails", () => {
  it("triggers paper-only mode after five losing taken advices in a row", () => {
    const data = createRiskFixture(
      Array.from({ length: 5 }, (_, index) => ({
        id: `loss-${index}`,
        takenByUser: true,
        status: "invalidated" as const,
        finalReturn: -2 - index,
      })),
    );
    const guardrails = getRiskGuardrails(data);

    assert.equal(guardrails.losingStreak, 5);
    assert.equal(guardrails.paperOnly, true);
    assert.equal(guardrails.status, "paper_only");
  });

  it("triggers paper-only mode after a 10 percent 30-day drawdown", () => {
    const data = createRiskFixture([
      {
        id: "large-loss",
        takenByUser: true,
        status: "invalidated",
        finalReturn: -11,
        sizeSuggestionEur: 2500,
      },
    ]);
    const guardrails = getRiskGuardrails(data);

    assert.ok(guardrails.drawdownPct <= -10);
    assert.equal(guardrails.paperOnly, true);
  });

  it("ignores losses that Robin did not mark as taken", () => {
    const data = createRiskFixture(
      Array.from({ length: 6 }, (_, index) => ({
        id: `not-taken-loss-${index}`,
        takenByUser: false,
        status: "invalidated" as const,
        finalReturn: -20,
      })),
    );
    const guardrails = getRiskGuardrails(data);

    assert.equal(guardrails.losingStreak, 0);
    assert.equal(guardrails.paperOnly, false);
    assert.equal(guardrails.status, "ok");
  });
});

function createRiskFixture(
  rows: Array<{
    id: string;
    takenByUser: boolean;
    status: Advice["status"];
    finalReturn: number;
    sizeSuggestionEur?: number;
  }>,
): TerminalData {
  const now = new Date();
  const base = JSON.parse(JSON.stringify(demoTerminalData)) as TerminalData;
  const baseAdvice = base.advices[0];

  base.advices = rows.map((row, index) => {
    const checkedAt = new Date(now.getTime() - index * 24 * 60 * 60_000).toISOString();

    return {
      ...baseAdvice,
      id: row.id,
      status: row.status,
      takenByUser: row.takenByUser,
      sizeSuggestionEur: row.sizeSuggestionEur ?? 500,
      userExitPrice: 100 + row.finalReturn,
      createdAt: checkedAt,
      updatedAt: checkedAt,
    };
  });
  base.adviceTracking = rows.map((row, index) => {
    const checkedAt = new Date(now.getTime() - index * 24 * 60 * 60_000).toISOString();

    return {
      id: `tracking-${row.id}`,
      adviceId: row.id,
      referenceEntry: 100,
      d1Return: row.finalReturn,
      d3Return: row.finalReturn,
      d5Return: row.finalReturn,
      stopHitAt: row.status === "invalidated" ? checkedAt : null,
      targetHitAt: null,
      expiredAt: row.status === "expired" ? checkedAt : null,
      finalReturn: row.finalReturn,
      outcome: row.status === "invalidated" ? "stop" : "expired_negative",
      lastCheckedAt: checkedAt,
      lastPrice: 100 + row.finalReturn,
      metadata: {},
      createdAt: checkedAt,
      updatedAt: checkedAt,
    } satisfies AdviceTracking;
  });

  return base;
}
