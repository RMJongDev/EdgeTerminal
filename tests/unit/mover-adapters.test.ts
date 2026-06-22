import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Asset, EventSource } from "../../src/lib/edge-terminal/types.ts";
import {
  createAlphaVantageTopMoversAdapter,
  createNasdaqTradeHaltsAdapter,
  parseNasdaqHaltRss,
} from "../../src/lib/edge-terminal/pipeline/adapters/movers.ts";
import { createCandidatesFromSources } from "../../src/lib/edge-terminal/pipeline/steps/filter.ts";
import type { RunWindow } from "../../src/lib/edge-terminal/pipeline/types.ts";

const window: RunWindow = {
  profile: "us_open",
  from: new Date("2026-06-13T08:00:00.000Z"),
  to: new Date("2026-06-13T15:00:00.000Z"),
};

const haltFixture = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:ndaq="http://www.nasdaqtrader.com/">
  <channel>
    <item>
      <title>KBR</title>
      <pubDate>Sat, 13 Jun 2026 14:44:00 GMT</pubDate>
      <ndaq:HaltDate>06/13/2026</ndaq:HaltDate>
      <ndaq:HaltTime>10:44:13.000</ndaq:HaltTime>
      <ndaq:IssueSymbol>KBR</ndaq:IssueSymbol>
      <ndaq:IssueName>KBR INC COM</ndaq:IssueName>
      <ndaq:Market>NYSE</ndaq:Market>
      <ndaq:ReasonCode>T1</ndaq:ReasonCode>
    </item>
  </channel>
</rss>`;

describe("mover and halt adapters", () => {
  it("maps Alpha Vantage top movers and keeps them context-only until news confirms them", async () => {
    const requestedUrls: URL[] = [];
    const adapter = createAlphaVantageTopMoversAdapter({
      apiKey: "test-key",
      thresholdPct: 4,
      fetchImpl: (async (input: URL | RequestInfo) => {
        requestedUrls.push(input instanceof URL ? input : new URL(String(input)));

        return {
          ok: true,
          status: 200,
          async json() {
            return {
              top_gainers: [
                { ticker: "BIG", price: "12.34", change_amount: "1.23", change_percentage: "11.07%", volume: "1000000" },
              ],
              top_losers: [
                { ticker: "DROP", price: "8.00", change_amount: "-0.80", change_percentage: "-9.09%", volume: "900000" },
              ],
              most_actively_traded: [
                { ticker: "FLAT", price: "10.00", change_amount: "0.10", change_percentage: "1.00%", volume: "2000000" },
              ],
            };
          },
        } as Response;
      }) as typeof fetch,
    });

    assert.ok(adapter);
    const items = await adapter.fetchItems(window);

    assert.equal(items.length, 2);
    assert.equal(items[0]?.sourceCategory, "market_context");
    assert.equal(items[0]?.topics?.includes("unexplained_move"), true);
    assert.equal(requestedUrls[0]?.searchParams.get("function"), "TOP_GAINERS_LOSERS");
    assert.equal(requestedUrls[0]?.searchParams.has("apikey"), true);
  });

  it("parses Nasdaq halt RSS and maps T1/T2 halts as context triggers", async () => {
    assert.equal(parseNasdaqHaltRss(haltFixture)[0]?.symbol, "KBR");

    const adapter = createNasdaqTradeHaltsAdapter({
      fetchImpl: createTextFetch(haltFixture),
    });
    const items = await adapter.fetchItems(window);

    assert.equal(items.length, 1);
    assert.equal(items[0]?.symbols?.[0], "KBR");
    assert.equal(items[0]?.topics?.includes("trading_halt_context"), true);
    assert.equal(items[0]?.topics?.includes("news_halt"), true);
  });

  it("does not create candidates directly from unexplained movers or raw halt context", () => {
    const candidates = createCandidatesFromSources({
      runId: "run-test",
      sources: [
        source("source-mover", "alpha_vantage_movers", "market_context", ["BIG"], ["mover_sweep", "unexplained_move"]),
        source("source-news", "finnhub_news", "financial_feed", ["AAPL"], ["company_news", "guidance"]),
      ],
      assets: [asset("AAPL")],
      now: "2026-06-13T15:00:00.000Z",
      createId: (prefix) => `${prefix}-test`,
    });

    assert.equal(candidates.length, 1);
    assert.equal(candidates[0]?.affectedSymbols[0], "AAPL");
  });
});

function createTextFetch(text: string): typeof fetch {
  return (async () => ({
    ok: true,
    status: 200,
    async text() {
      return text;
    },
  }) as Response) as typeof fetch;
}

function source(
  id: string,
  provider: string,
  sourceCategory: EventSource["sourceCategory"],
  symbols: string[],
  topics: string[],
): EventSource {
  return {
    id,
    discoveryRunId: "run-test",
    provider,
    sourceCategory,
    providerItemId: id,
    sourceName: provider,
    sourceUrl: "https://example.com",
    publishedAt: "2026-06-13T14:00:00.000Z",
    fetchedAt: "2026-06-13T15:00:00.000Z",
    rawPayloadRef: id,
    title: `${symbols[0]} test source`,
    snippet: "Test source",
    symbols,
    topics,
    sourceQualityScore: 82,
  };
}

function asset(ticker: string): Asset {
  return {
    id: `asset-${ticker.toLowerCase()}`,
    ticker,
    name: ticker,
    assetType: "us_equity",
    sector: "Technology",
    exchange: "NASDAQ",
    currency: "USD",
    country: "United States",
    priority: 1,
    status: "active",
    notes: null,
    lastMovePercent: null,
    updatedAt: "2026-06-13T00:00:00.000Z",
  };
}
