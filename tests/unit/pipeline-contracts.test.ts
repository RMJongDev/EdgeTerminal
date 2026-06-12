import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PIPELINE_STEP_ORDER,
  createEmptyCostSummary,
  createRawPayloadRef,
  createStepRunDraft,
  mergeStepCost,
  normalizeRiskVerdict,
  normalizeSetupDirection,
  structuredOutputSchemas,
} from "../../src/lib/edge-terminal/pipeline/index.ts";

describe("pipeline contracts", () => {
  it("keeps the canonical step order stable", () => {
    assert.equal(PIPELINE_STEP_ORDER[0], "create_run");
    assert.equal(PIPELINE_STEP_ORDER.at(-1), "complete_run");
    assert.equal(new Set(PIPELINE_STEP_ORDER).size, PIPELINE_STEP_ORDER.length);
  });

  it("normalizes legacy setup and risk values to the advice-machine contract", () => {
    assert.equal(normalizeSetupDirection("no_trade"), "none");
    assert.equal(normalizeSetupDirection("short"), "short");
    assert.equal(normalizeRiskVerdict("paper_trade_ok"), "ok");
    assert.equal(normalizeRiskVerdict("wait"), "ok");
    assert.equal(normalizeRiskVerdict("skip"), "skip");
  });

  it("creates deterministic raw payload refs", () => {
    assert.equal(
      createRawPayloadRef("Finnhub News", "https://example.com/AAPL?id=1", "2026-06-12T07:30:00.000Z"),
      "finnhub-news:https-example.com-aapl-id-1:2026-06-12t07-30-00.000z",
    );
  });

  it("merges per-step costs without double-counting replaced step values", () => {
    const first = mergeStepCost(createEmptyCostSummary(), "filter_candidates", {
      inputTokens: 100,
      outputTokens: 25,
      totalTokens: 125,
      costEur: 0.01234567,
    });
    const replaced = mergeStepCost(first, "filter_candidates", {
      inputTokens: 120,
      outputTokens: 30,
      totalTokens: 150,
      costEur: 0.02,
    });

    assert.equal(replaced.totalTokens, 150);
    assert.equal(replaced.totalCostEur, 0.02);
  });

  it("creates pending step-run drafts with nullable candidate and advice references", () => {
    assert.deepEqual(createStepRunDraft({ discoveryRunId: "run-1", stepName: "mover_sweep" }), {
      discoveryRunId: "run-1",
      candidateId: null,
      adviceId: null,
      stepName: "mover_sweep",
      status: "pending",
      attempt: 1,
      promptVersion: null,
      model: null,
      sourcePayloadRefs: [],
    });
  });

  it("defines structured output schemas for every LLM prompt version", () => {
    assert.deepEqual(Object.keys(structuredOutputSchemas), [
      "advice-filter-v1",
      "advice-analysis-v1",
      "advice-setup-v1",
      "advice-risk-v1",
      "advice-assembly-v1",
      "advice-briefing-v1",
    ]);
  });
});
