import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  callOpenAiStructured,
  estimateOpenAiCost,
} from "../../src/lib/edge-terminal/llm/openai.ts";
import type { JsonSchema } from "../../src/lib/edge-terminal/pipeline/types.ts";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["verdict"],
  properties: {
    verdict: { type: "string" },
  },
} satisfies JsonSchema;

describe("OpenAI structured output helper", () => {
  it("sends Responses API structured-output requests and parses usage cost", async () => {
    const bodies: Array<Record<string, unknown>> = [];
    const result = await callOpenAiStructured<{ verdict: string }>({
      apiKey: "test-key",
      model: "gpt-5.4-mini",
      modelRole: "filter",
      promptVersion: "test-v1",
      schemaName: "test_schema",
      schema,
      systemPrompt: "Return structured JSON.",
      userPrompt: "Say ok.",
      fetchImpl: createJsonFetch(async (_url, init) => {
        bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);

        return {
          id: "resp-test",
          output_text: JSON.stringify({ verdict: "ok" }),
          usage: {
            input_tokens: 1_000,
            output_tokens: 200,
            total_tokens: 1_200,
          },
        };
      }),
    });

    assert.equal(result.responseId, "resp-test");
    assert.deepEqual(result.output, { verdict: "ok" });
    assert.equal(result.usage.totalTokens, 1_200);
    assert.equal(result.costUsd, 0.00165);
    assert.equal(result.costSummary.costEur, 0.001518);
    assert.equal(bodies[0]?.model, "gpt-5.4-mini");
    assert.deepEqual((bodies[0]?.text as Record<string, unknown>)?.format, {
      type: "json_schema",
      name: "test_schema",
      strict: true,
      schema,
    });
  });

  it("retries retryable OpenAI HTTP failures", async () => {
    let calls = 0;
    const result = await callOpenAiStructured<{ verdict: string }>({
      apiKey: "test-key",
      model: "gpt-5.4",
      modelRole: "analysis",
      promptVersion: "retry-v1",
      schemaName: "retry_schema",
      schema,
      systemPrompt: "Return structured JSON.",
      userPrompt: "Say ok.",
      maxRetries: 1,
      fetchImpl: (async () => {
        calls += 1;

        if (calls === 1) {
          return { ok: false, status: 429 } as Response;
        }

        return {
          ok: true,
          status: 200,
          async json() {
            return {
              output: [
                {
                  content: [
                    {
                      type: "output_text",
                      text: JSON.stringify({ verdict: "ok-after-retry" }),
                    },
                  ],
                },
              ],
              usage: {
                input_tokens: 100,
                output_tokens: 50,
              },
            };
          },
        } as Response;
      }) as typeof fetch,
    });

    assert.equal(calls, 2);
    assert.equal(result.output.verdict, "ok-after-retry");
  });

  it("estimates known model costs from official 2026-06-13 pricing inputs", () => {
    assert.deepEqual(estimateOpenAiCost({ model: "gpt-5.4", inputTokens: 1_000_000, outputTokens: 1_000_000 }), {
      costUsd: 17.5,
      costEur: 16.1,
    });
  });
});

function createJsonFetch(resolveJson: (url: URL | RequestInfo, init?: RequestInit) => Promise<unknown>): typeof fetch {
  return (async (url: URL | RequestInfo, init?: RequestInit) => ({
    ok: true,
    status: 200,
    async json() {
      return resolveJson(url, init);
    },
  }) as Response) as typeof fetch;
}
