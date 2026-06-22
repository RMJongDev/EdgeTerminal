import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createFinnhubEarningsAdapter,
  createFinnhubNewsAdapter,
  createFinnhubQuoteAdapter,
} from "../../src/lib/edge-terminal/pipeline/adapters/finnhub.ts";
import type { RunWindow } from "../../src/lib/edge-terminal/pipeline/types.ts";

const window: RunWindow = {
  profile: "us_open",
  from: new Date("2026-06-13T08:00:00.000Z"),
  to: new Date("2026-06-13T14:30:00.000Z"),
};

describe("Finnhub adapters", () => {
  it("maps market and company news fixtures to source items", async () => {
    const requests: string[] = [];
    const fetchImpl = createFixtureFetch((url) => {
      requests.push(url.pathname);

      if (url.pathname.endsWith("/news")) {
        return [
          {
            category: "general",
            datetime: 1781359200,
            headline: "Market breadth improves before the US open",
            id: 101,
            related: "SPY",
            source: "Finnhub fixture",
            summary: "Broad market context fixture.",
            url: "https://example.com/market-news",
          },
        ];
      }

      return [
        {
          category: "company",
          datetime: 1781359800,
          headline: "Apple supplier headline lifts sentiment",
          id: 202,
          related: "AAPL",
          source: "Finnhub fixture",
          summary: "Company news fixture.",
          url: "https://example.com/aapl-news",
        },
      ];
    });
    const adapter = createFinnhubNewsAdapter({
      apiKey: "test-key",
      fetchImpl,
      symbols: ["AAPL", "ASML.AS"],
    });

    const items = await adapter?.fetchItems(window);

    assert.deepEqual(requests, ["/api/v1/news", "/api/v1/company-news"]);
    assert.equal(items?.length, 2);
    assert.equal(items?.[1]?.symbols?.[0], "AAPL");
    assert.match(items?.[1]?.rawPayloadRef ?? "", /finnhub_company_news/);
  });

  it("maps quote and earnings fixtures to market context source items", async () => {
    const quoteAdapter = createFinnhubQuoteAdapter({
      apiKey: "test-key",
      fetchImpl: createFixtureFetch(() => ({
        c: 212.4,
        d: 3.2,
        dp: 1.53,
        o: 208.1,
        pc: 209.2,
        t: 1781359900,
      })),
      symbols: ["AAPL"],
    });
    const earningsAdapter = createFinnhubEarningsAdapter({
      apiKey: "test-key",
      fetchImpl: createFixtureFetch(() => ({
        earningsCalendar: [
          {
            date: "2026-06-17",
            epsEstimate: 1.42,
            hour: "amc",
            quarter: 2,
            revenueEstimate: 95000000000,
            symbol: "AAPL",
            year: 2026,
          },
        ],
      })),
      symbols: ["AAPL"],
    });

    const quoteItems = await quoteAdapter?.fetchItems(window);
    const earningsItems = await earningsAdapter?.fetchItems(window);

    assert.equal(quoteItems?.[0]?.title, "AAPL quote snapshot: 1.53%");
    assert.equal(quoteItems?.[0]?.topics?.includes("market_context"), true);
    assert.equal(earningsItems?.[0]?.title, "AAPL earnings calendar item");
    assert.equal(earningsItems?.[0]?.topics?.includes("earnings"), true);
  });
});

function createFixtureFetch(resolveJson: (url: URL) => unknown): typeof fetch {
  return (async (input: URL | RequestInfo) => {
    const url = input instanceof URL ? input : new URL(String(input));

    return {
      ok: true,
      status: 200,
      async json() {
        return resolveJson(url);
      },
    } as Response;
  }) as typeof fetch;
}
