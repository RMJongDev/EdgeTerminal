import type { AIAnalysisLog } from "../types.ts";
import type { JsonSchema, StepCostSummary } from "../pipeline/types.ts";

type FetchLike = typeof fetch;
type OpenAiModelRole = "filter" | "analysis";

type OpenAiUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
};

type OpenAiResponsePayload = {
  id?: string;
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  usage?: OpenAiUsage;
};

export type OpenAiStructuredCallInput = {
  promptVersion: string;
  schemaName: string;
  schema: JsonSchema;
  systemPrompt: string;
  userPrompt: string;
  modelRole: OpenAiModelRole;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  maxRetries?: number;
};

export type OpenAiStructuredCallResult<T> = {
  responseId: string | null;
  model: string;
  promptVersion: string;
  output: T;
  outputText: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  costSummary: StepCostSummary;
  costUsd: number;
};

const usdToEurEstimate = 0.92;

const pricingUsdPerMillionTokens = [
  { prefix: "gpt-5.5", input: 5, output: 30 },
  { prefix: "gpt-5.4-mini", input: 0.75, output: 4.5 },
  { prefix: "gpt-5.4-nano", input: 0.2, output: 1.25 },
  { prefix: "gpt-5.4", input: 2.5, output: 15 },
];

export function hasOpenAiApiKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAiModel(role: OpenAiModelRole) {
  if (role === "filter") {
    return process.env.OPENAI_FILTER_MODEL ?? "gpt-5.4-mini";
  }

  return process.env.OPENAI_ANALYSIS_MODEL ?? "gpt-5.4";
}

function getApiKey(input: OpenAiStructuredCallInput) {
  return input.apiKey ?? process.env.OPENAI_API_KEY ?? "";
}

function roundMoney(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function pricingForModel(model: string) {
  return pricingUsdPerMillionTokens.find((pricing) => model.startsWith(pricing.prefix)) ?? pricingUsdPerMillionTokens[3];
}

export function estimateOpenAiCost(input: {
  model: string;
  inputTokens: number;
  outputTokens: number;
}) {
  const pricing = pricingForModel(input.model);
  const costUsd = (input.inputTokens * pricing.input + input.outputTokens * pricing.output) / 1_000_000;

  return {
    costUsd: roundMoney(costUsd),
    costEur: roundMoney(costUsd * usdToEurEstimate),
  };
}

function extractOutputText(payload: OpenAiResponsePayload) {
  if (payload.output_text) {
    return payload.output_text;
  }

  for (const output of payload.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not contain output text");
}

async function wait(ms: number) {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(input: {
  fetchImpl: FetchLike;
  url: string;
  apiKey: string;
  body: Record<string, unknown>;
  timeoutMs: number;
  maxRetries: number;
}) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= input.maxRetries; attempt += 1) {
    try {
      const response = await input.fetchImpl(input.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input.body),
        signal: AbortSignal.timeout(input.timeoutMs),
      });

      if (response.ok) {
        return response;
      }

      const retryable = response.status === 429 || response.status >= 500;
      const message = `OpenAI Responses API failed with HTTP ${response.status}`;

      if (!retryable || attempt === input.maxRetries) {
        throw new Error(message);
      }

      lastError = new Error(message);
      await wait(750 * (attempt + 1));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === input.maxRetries) {
        break;
      }

      await wait(750 * (attempt + 1));
    }
  }

  throw lastError ?? new Error("OpenAI Responses API call failed");
}

export async function callOpenAiStructured<T>(
  input: OpenAiStructuredCallInput,
): Promise<OpenAiStructuredCallResult<T>> {
  const apiKey = getApiKey(input);

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = input.model ?? getOpenAiModel(input.modelRole);
  const body = {
    model,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: input.systemPrompt }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: input.userPrompt }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: input.schemaName,
        strict: true,
        schema: input.schema,
      },
    },
    store: false,
  };
  const response = await fetchWithRetry({
    fetchImpl: input.fetchImpl ?? fetch,
    url: input.baseUrl ?? "https://api.openai.com/v1/responses",
    apiKey,
    body,
    timeoutMs: input.timeoutMs ?? 30_000,
    maxRetries: input.maxRetries ?? 2,
  });
  const payload = (await response.json()) as OpenAiResponsePayload;
  const outputText = extractOutputText(payload);
  const output = JSON.parse(outputText) as T;
  const inputTokens = payload.usage?.input_tokens ?? 0;
  const outputTokens = payload.usage?.output_tokens ?? 0;
  const totalTokens = payload.usage?.total_tokens ?? inputTokens + outputTokens;
  const cost = estimateOpenAiCost({ model, inputTokens, outputTokens });

  return {
    responseId: payload.id ?? null,
    model,
    promptVersion: input.promptVersion,
    output,
    outputText,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens,
    },
    costSummary: {
      inputTokens,
      outputTokens,
      totalTokens,
      costEur: cost.costEur,
    },
    costUsd: cost.costUsd,
  };
}

export function createOpenAiAnalysisLog(input: {
  analysisType: AIAnalysisLog["analysisType"];
  promptVersion: string;
  model: string;
  summary: string;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown>;
  costSummary: StepCostSummary;
  sourcePayloadRefs?: string[];
}): Omit<AIAnalysisLog, "id" | "createdAt"> {
  return {
    analysisType: input.analysisType,
    provider: "openai",
    model: input.model,
    promptVersion: input.promptVersion,
    status: "success",
    usefulnessRating: null,
    summary: input.summary,
    sourcePayloadRefs: input.sourcePayloadRefs ?? [],
    scoreInputs: {
      inputPayload: input.inputPayload,
      outputPayload: input.outputPayload,
      costSummary: input.costSummary,
    },
    inputPayload: input.inputPayload,
    outputPayload: input.outputPayload,
    costSummary: input.costSummary,
    errorMessage: null,
  };
}
