import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Asset } from "../../src/lib/edge-terminal/types.ts";
import {
  buildGdeltQueries,
  createGdeltDocAdapter,
} from "../../src/lib/edge-terminal/pipeline/adapters/gdelt.ts";
import type { RunWindow } from "../../src/lib/edge-terminal/pipeline/types.ts";

const window: RunWindow = {
  profile: "us_open",
  from: new Date("2026-06-13T08:00:00.000Z"),
  to: new Date("2026-06-13T15:00:00.000Z"),
};

describe("GDELT DOC adapter", () => {
  it("builds generic event-pattern queries alongside watchlist queries", () => {
    const queries = buildGdeltQueries({
      assets: [asset("AAPL", "Apple Inc.", "Technology", "us_equity"), asset("ASML.AS", "ASML Holding", "Semiconductors", "eu_equity")],
      profile: "us_open",
      maxQueriesPerRun: 4,
    });

    assert.equal(queries.some((query) => query.isGenericEventPattern && query.symbols.length === 0), true);
    assert.equal(queries.some((query) => query.symbols.includes("AAPL")), true);
    assert.equal(queries.some((query) => query.query.includes("Apple Inc.")), true);
  });

  it("maps GDELT article list responses to broad-news source items", async () => {
    const seenUrls: URL[] = [];
    const adapter = createGdeltDocAdapter({
      assets: [asset("AAPL", "Apple Inc.", "Technology", "us_equity")],
      profile: "us_open",
      delayMs: 0,
      maxQueriesPerRun: 3,
      maxRecordsPerQuery: 5,
      fetchImpl: createFixtureFetch((url) => {
        seenUrls.push(url);
        const query = url.searchParams.get("query") ?? "";

        if (query.includes("Apple Inc.")) {
          return [
            {
              url: "https://example.com/apple-guidance",
              title: "Apple shares fall after supplier guidance",
              seendate: "20260613143000",
              domain: "example.com",
              language: "English",
              sourcecountry: "United States",
            },
          ];
        }

        if (query.includes("shares fell")) {
          return [
            {
              url: "https://example.com/small-cap-warning",
              title: "SmallCapCo shares plunge after profit warning",
              seendate: "20260613120000",
              domain: "example.com",
              language: "English",
              sourcecountry: "United Kingdom",
            },
          ];
        }

        return [];
      }),
    });

    const items = await adapter.fetchItems(window);

    assert.equal(items.length, 2);
    assert.equal(items[0]?.sourceCategory, "broad_news");
    assert.equal(items[0]?.symbols?.length, 0);
    assert.equal(items[0]?.topics?.includes("generic_event_pattern"), true);
    assert.equal(items[1]?.symbols?.[0], "AAPL");
    assert.equal(items[1]?.publishedAt, "2026-06-13T14:30:00.000Z");
    assert.equal(seenUrls[0]?.searchParams.get("mode"), "ArtList");
    assert.equal(seenUrls[0]?.searchParams.get("format"), "json");
    assert.equal(seenUrls[0]?.searchParams.get("timespan"), "7h");
    assert.equal(seenUrls[0]?.searchParams.get("maxrecords"), "5");
  });

  it("drops articles outside the run window and dedupes by URL", async () => {
    const adapter = createGdeltDocAdapter({
      delayMs: 0,
      maxQueriesPerRun: 1,
      fetchImpl: createFixtureFetch(() => [
        {
          url: "https://example.com/duplicate",
          title: "Duplicate current article",
          seendate: "20260613100000",
          domain: "example.com",
        },
        {
          url: "https://example.com/duplicate",
          title: "Duplicate current article",
          seendate: "20260613101500",
          domain: "example.com",
        },
        {
          url: "https://example.com/old",
          title: "Old article",
          seendate: "20260612100000",
          domain: "example.com",
        },
      ]),
    });

    const items = await adapter.fetchItems(window);

    assert.equal(items.length, 1);
    assert.equal(items[0]?.sourceUrl, "https://example.com/duplicate");
  });

  it("continues with later GDELT queries when one query is rate-limited", async () => {
    let calls = 0;
    const adapter = createGdeltDocAdapter({
      assets: [asset("AAPL", "Apple Inc.", "Technology", "us_equity")],
      profile: "us_open",
      delayMs: 0,
      rateLimitRetryMs: 0,
      maxQueriesPerRun: 3,
      fetchImpl: (async () => {
        calls += 1;

        if (calls === 1) {
          return { ok: false, status: 429 } as Response;
        }

        return {
          ok: true,
          status: 200,
          async json() {
            return calls === 3
              ? {
                  articles: [
                    {
                      url: "https://example.com/apple",
                      title: "Apple shares move after news",
                      seendate: "20260613110000",
                      domain: "example.com",
                    },
                  ],
                }
              : { articles: [] };
          },
        } as Response;
      }) as typeof fetch,
    });

    const items = await adapter.fetchItems(window);

    assert.equal(items.length, 1);
    assert.equal(items[0]?.symbols?.[0], "AAPL");
  });
});

function asset(ticker: string, name: string, sector: string, assetType: Asset["assetType"]): Asset {
  return {
    id: `asset-${ticker.toLowerCase()}`,
    ticker,
    name,
    assetType,
    sector,
    exchange: "Test",
    currency: "USD",
    country: "United States",
    priority: 1,
    status: "active",
    notes: null,
    lastMovePercent: null,
    updatedAt: "2026-06-13T00:00:00.000Z",
  };
}

function createFixtureFetch(resolveArticles: (url: URL) => unknown[]): typeof fetch {
  return (async (input: URL | RequestInfo) => {
    const url = input instanceof URL ? input : new URL(String(input));

    return {
      ok: true,
      status: 200,
      async json() {
        return { articles: resolveArticles(url) };
      },
    } as Response;
  }) as typeof fetch;
}
