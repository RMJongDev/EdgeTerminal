import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createRssOfficialSourceAdapter,
  parseRssOrAtom,
  type RssFeedConfig,
} from "../../src/lib/edge-terminal/pipeline/adapters/rss-official.ts";
import type { RunWindow } from "../../src/lib/edge-terminal/pipeline/types.ts";

const rssFixture = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <guid>press-1</guid>
      <title>Company publishes material update</title>
      <link>https://example.com/company-update</link>
      <pubDate>Sat, 13 Jun 2026 08:30:00 GMT</pubDate>
      <description>Short source snippet only.</description>
    </item>
    <item>
      <guid>old-1</guid>
      <title>Old item outside the run window</title>
      <link>https://example.com/old</link>
      <pubDate>Sat, 06 Jun 2026 08:30:00 GMT</pubDate>
      <description>Old source snippet.</description>
    </item>
  </channel>
</rss>`;

const atomFixture = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>atom-1</id>
    <title>Official regulator atom item</title>
    <link href="https://example.com/regulator" />
    <updated>2026-06-13T09:00:00Z</updated>
    <summary>Regulator summary.</summary>
  </entry>
</feed>`;

const window: RunWindow = {
  profile: "eu_open",
  from: new Date("2026-06-13T00:00:00.000Z"),
  to: new Date("2026-06-14T00:00:00.000Z"),
};

describe("RSS/official source adapter", () => {
  it("parses RSS and Atom fixtures", () => {
    assert.equal(parseRssOrAtom(rssFixture).length, 2);
    assert.equal(parseRssOrAtom(atomFixture)[0]?.link, "https://example.com/regulator");
  });

  it("maps feed items, drops items outside the run window and keeps feed config external", async () => {
    const feeds: RssFeedConfig[] = [
      {
        id: "test-official",
        name: "Test Official Feed",
        url: "https://example.com/rss",
        sourceCategory: "primary_source",
        topics: ["regulated_news"],
      },
    ];
    const adapter = createRssOfficialSourceAdapter({
      feeds,
      companyFeeds: [
        {
          id: "asml-ir-test",
          name: "ASML IR Test",
          url: "https://example.com/asml",
          sourceCategory: "primary_source",
          topics: ["company_ir"],
          symbols: ["ASML"],
        },
      ],
      symbols: ["ASML"],
      fetchImpl: createFixtureFetch((url) => (url.includes("asml") ? atomFixture : rssFixture)),
    });

    const items = await adapter.fetchItems(window);

    assert.equal(items.length, 2);
    assert.equal(items[0]?.sourceName, "Test Official Feed");
    assert.equal(items[0]?.sourceCategory, "primary_source");
    assert.equal(items[0]?.providerItemId, "press-1");
    assert.equal(items[1]?.symbols?.[0], "ASML");
    assert.equal(items.some((item) => item.providerItemId === "old-1"), false);
  });

  it("keeps FDA/EMA style regulator feeds sector-gated", async () => {
    const healthcareFeed: RssFeedConfig = {
      id: "healthcare-regulator",
      name: "Healthcare Regulator",
      url: "https://example.com/health",
      sourceCategory: "primary_source",
      topics: ["healthcare", "regulator"],
      sectorGate: ["healthcare", "pharma", "biotech"],
    };
    const fetchImpl = createFixtureFetch(() => rssFixture);
    const generalAdapter = createRssOfficialSourceAdapter({
      feeds: [healthcareFeed],
      sectors: ["Technology"],
      fetchImpl,
    });
    const healthcareAdapter = createRssOfficialSourceAdapter({
      feeds: [healthcareFeed],
      sectors: ["Healthcare"],
      fetchImpl,
    });

    assert.equal((await generalAdapter.fetchItems(window)).length, 0);
    assert.equal((await healthcareAdapter.fetchItems(window)).length, 1);
  });
});

function createFixtureFetch(resolveText: (url: string) => string): typeof fetch {
  return (async (input: URL | RequestInfo) => {
    const url = input instanceof URL ? input.toString() : String(input);

    return {
      ok: true,
      status: 200,
      async text() {
        return resolveText(url);
      },
    } as Response;
  }) as typeof fetch;
}
