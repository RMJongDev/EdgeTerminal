import type { JsonSchema } from "./types.ts";

const scoreSchema = {
  type: "number",
  minimum: 0,
  maximum: 100,
} satisfies JsonSchema;

export const adviceFilterOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["source_ref", "is_candidate", "reason_to_watch", "pre_rank", "affected_symbols", "event_type_guess"],
        properties: {
          source_ref: { type: "string" },
          is_candidate: { type: "boolean" },
          reason_to_watch: { type: "string" },
          pre_rank: { type: "number", minimum: 0 },
          affected_symbols: { type: "array", items: { type: "string" } },
          event_type_guess: { type: "string" },
        },
      },
    },
  },
} satisfies JsonSchema;

export const adviceAnalysisOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["sentiment", "impact", "horizon_days", "bull_case", "bear_case", "priced_in_view", "uncertainty", "confidence"],
  properties: {
    sentiment: { type: "string", enum: ["positive", "negative", "neutral", "mixed"] },
    impact: { type: "string", enum: ["low", "medium", "high"] },
    horizon_days: { type: "number", minimum: 1, maximum: 14 },
    bull_case: { type: "string" },
    bear_case: { type: "string" },
    priced_in_view: { type: "string" },
    uncertainty: { type: "string" },
    confidence: scoreSchema,
  },
} satisfies JsonSchema;

export const adviceSetupOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["direction", "entry_logic", "entry_zone_low", "entry_zone_high", "stop_loss", "target", "horizon_days", "invalidation"],
  properties: {
    direction: { type: "string", enum: ["long", "short", "none"] },
    entry_logic: { type: "string" },
    entry_zone_low: { type: ["number", "null"] },
    entry_zone_high: { type: ["number", "null"] },
    stop_loss: { type: ["number", "null"] },
    target: { type: ["number", "null"] },
    horizon_days: { type: "number", minimum: 1, maximum: 14 },
    invalidation: { type: "string" },
  },
} satisfies JsonSchema;

export const adviceRiskOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["counterargument", "thesis_killer", "risk_score", "verdict", "gap_risk", "squeeze_risk"],
  properties: {
    counterargument: { type: "string" },
    thesis_killer: { type: "string" },
    risk_score: scoreSchema,
    verdict: { type: "string", enum: ["ok", "skip"] },
    gap_risk: { type: "string" },
    squeeze_risk: { type: ["string", "null"] },
  },
} satisfies JsonSchema;

export const adviceAssemblyOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["advices", "no_advice_reason"],
  properties: {
    advices: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        required: ["ticker", "direction", "rank", "reasoning", "counterargument", "invalidation"],
        properties: {
          ticker: { type: "string" },
          direction: { type: "string", enum: ["long", "short"] },
          rank: { type: "number", minimum: 1, maximum: 5 },
          reasoning: { type: "string" },
          counterargument: { type: "string" },
          invalidation: { type: "string" },
        },
      },
    },
    no_advice_reason: { type: ["string", "null"] },
  },
} satisfies JsonSchema;

export const adviceBriefingOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["market_context", "advice_summary", "no_advice_notes", "open_position_risks", "conclusion"],
  properties: {
    market_context: { type: "string" },
    advice_summary: { type: "string" },
    no_advice_notes: { type: "string" },
    open_position_risks: { type: "string" },
    conclusion: { type: "string" },
  },
} satisfies JsonSchema;

export const structuredOutputSchemas = {
  "advice-filter-v1": adviceFilterOutputSchema,
  "advice-analysis-v1": adviceAnalysisOutputSchema,
  "advice-setup-v1": adviceSetupOutputSchema,
  "advice-risk-v1": adviceRiskOutputSchema,
  "advice-assembly-v1": adviceAssemblyOutputSchema,
  "advice-briefing-v1": adviceBriefingOutputSchema,
} satisfies Record<string, JsonSchema>;
