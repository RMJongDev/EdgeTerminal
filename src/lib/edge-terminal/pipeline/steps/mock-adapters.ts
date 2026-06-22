import { createRawPayloadRef } from "../contracts.ts";
import type { RunWindow, SourceAdapter, SourceItem } from "../types.ts";

function isoAt(window: RunWindow, minutesAgo: number) {
  return new Date(window.to.getTime() - minutesAgo * 60_000).toISOString();
}

function item(
  window: RunWindow,
  input: Omit<SourceItem, "fetchedAt" | "rawPayloadRef" | "publishedAt"> & {
    publishedMinutesAgo: number;
  },
): SourceItem {
  const publishedAt = isoAt(window, input.publishedMinutesAgo);
  const fetchedAt = window.to.toISOString();

  return {
    providerItemId: input.providerItemId,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    publishedAt,
    fetchedAt,
    title: input.title,
    snippet: input.snippet,
    symbols: input.symbols,
    topics: input.topics,
    rawPayloadRef: createRawPayloadRef(input.sourceName, input.providerItemId, fetchedAt),
  };
}

export function createMockSourceAdapters(): SourceAdapter[] {
  return [
    {
      provider: "mock_broad_news",
      category: "broad_news",
      async fetchItems(window) {
        return [
          item(window, {
            providerItemId: "mock-news-asml-sector-demand",
            sourceName: "Mock market desk",
            sourceUrl: "https://example.com/asml-sector-demand",
            publishedMinutesAgo: 54,
            title: "Chip-equipment demand note improves ASML sentiment",
            snippet:
              "Supplier commentary suggests demand is stronger than feared, creating a possible continuation setup in European semiconductors.",
            symbols: ["ASML"],
            topics: ["semiconductors", "sector", "guidance"],
          }),
          item(window, {
            providerItemId: "mock-news-nke-margin-readthrough",
            sourceName: "Mock retail monitor",
            sourceUrl: "https://example.com/retail-margin-warning",
            publishedMinutesAgo: 48,
            title: "Retail margin warning echoes across apparel peers",
            snippet:
              "A weak-source margin read-through touches apparel peers, but the original source is not strong enough for a clean advice.",
            symbols: ["NKE"],
            topics: ["retail", "margin"],
          }),
        ];
      },
    },
    {
      provider: "mock_primary_source",
      category: "primary_source",
      async fetchItems(window) {
        return [
          item(window, {
            providerItemId: "mock-primary-nvda-export-rule",
            sourceName: "Mock policy monitor",
            sourceUrl: "https://example.com/ai-export-rules",
            publishedMinutesAgo: 72,
            title: "Export restriction update pressures AI hardware names",
            snippet:
              "A policy update creates near-term pressure across AI hardware suppliers, with NVIDIA most exposed in the watchlist.",
            symbols: ["NVDA"],
            topics: ["policy", "ai_hardware", "legal"],
          }),
        ];
      },
    },
    {
      provider: "mock_macro_calendar",
      category: "macro_calendar",
      async fetchItems(window) {
        return [
          item(window, {
            providerItemId: "mock-macro-rates-risk",
            sourceName: "Mock macro calendar",
            sourceUrl: "https://example.com/rates-volatility",
            publishedMinutesAgo: 88,
            title: "Rates volatility cools after a near-consensus macro print",
            snippet:
              "Macro context is supportive for risk appetite, but the signal is broad and not specific enough for a single-stock trade.",
            symbols: ["SPY"],
            topics: ["macro", "rates"],
          }),
        ];
      },
    },
  ];
}

export function createMockMoverSweepAdapter(): SourceAdapter {
  return {
    provider: "mock_mover_sweep",
    category: "market_context",
    async fetchItems(window) {
      return [
        item(window, {
          providerItemId: "mock-mover-race-mi-negative-launch",
          sourceName: "Mock mover sweep",
          sourceUrl: "https://example.com/ferrari-launch-backlash",
          publishedMinutesAgo: 31,
          title: "Ferrari falls 7% after launch reaction turns negative",
          snippet:
            "Ferrari is a large decliner outside the local MVP watchlist after media and public reaction to a launch turns sharply negative.",
          symbols: ["RACE.MI"],
          topics: ["perception", "product_launch", "mover_sweep"],
        }),
      ];
    },
  };
}
