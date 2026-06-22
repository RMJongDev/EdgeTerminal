import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createEdgarCurrentFilingsAdapter,
  parseEdgarAtom,
} from "../../src/lib/edge-terminal/pipeline/adapters/edgar.ts";
import type { RunWindow } from "../../src/lib/edge-terminal/pipeline/types.ts";

const atomFixture = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>urn:sec:accession:0000320193-26-000001</id>
    <title>8-K - Apple Inc. (0000320193) (Filer)</title>
    <link href="https://www.sec.gov/Archives/edgar/data/320193/000032019326000001/0000320193-26-000001-index.htm" />
    <updated>2026-06-13T13:15:00-04:00</updated>
    <summary type="html">&lt;b&gt;Form type:&lt;/b&gt; 8-K &lt;br /&gt; Current report fixture</summary>
  </entry>
  <entry>
    <id>urn:sec:accession:0001234567-26-000002</id>
    <title>8-K - Example Holdings plc (0001234567) (Filer)</title>
    <link href="https://www.sec.gov/Archives/edgar/data/1234567/000123456726000002/0001234567-26-000002-index.htm" />
    <updated>2026-06-13T13:20:00-04:00</updated>
    <summary type="html">Foreign issuer event fixture</summary>
  </entry>
</feed>`;

const window: RunWindow = {
  profile: "us_open",
  from: new Date("2026-06-13T00:00:00.000Z"),
  to: new Date("2026-06-14T00:00:00.000Z"),
};

describe("SEC EDGAR adapter", () => {
  it("parses Atom entries from a fixture", () => {
    const entries = parseEdgarAtom(atomFixture);

    assert.equal(entries.length, 2);
    assert.equal(entries[0].title, "8-K - Apple Inc. (0000320193) (Filer)");
    assert.match(entries[0].summary ?? "", /Form type/);
  });

  it("maps 8-K and 6-K Atom feeds to primary source items with User-Agent", async () => {
    const userAgents: string[] = [];
    const formTypes: string[] = [];
    const adapter = createEdgarCurrentFilingsAdapter({
      userAgent: "EdgeTerminal robin@example.com",
      forms: ["8-K", "6-K"],
      delayMs: 0,
      fetchImpl: (async (input: URL | RequestInfo, init?: RequestInit) => {
        const url = input instanceof URL ? input : new URL(String(input));
        userAgents.push(String(new Headers(init?.headers).get("User-Agent")));
        formTypes.push(String(url.searchParams.get("type")));

        return {
          ok: true,
          status: 200,
          async text() {
            return atomFixture;
          },
        } as Response;
      }) as typeof fetch,
    });

    const items = await adapter?.fetchItems(window);

    assert.deepEqual(formTypes, ["8-K", "6-K"]);
    assert.deepEqual(userAgents, ["EdgeTerminal robin@example.com", "EdgeTerminal robin@example.com"]);
    assert.equal(items?.length, 4);
    assert.equal(items?.[0]?.sourceName, "SEC EDGAR");
    assert.equal(items?.[0]?.topics?.includes("8-k"), true);
    assert.equal(items?.[2]?.topics?.includes("6-k"), true);
    assert.match(items?.[0]?.sourceUrl ?? "", /sec\.gov/);
  });
});
