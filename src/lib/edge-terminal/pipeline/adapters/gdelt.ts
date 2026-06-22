import type { Asset } from "../../types.ts";
import { createRawPayloadRef } from "../contracts.ts";
import type { RunProfile, RunWindow, SourceAdapter, SourceItem } from "../types.ts";

type FetchLike = typeof fetch;

type GdeltArticle = {
  url?: string;
  url_mobile?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
};

type GdeltResponse = {
  articles?: GdeltArticle[];
};

export type GdeltQueryConfig = {
  id: string;
  query: string;
  topics: string[];
  symbols: string[];
  isGenericEventPattern: boolean;
};

type GdeltAdapterOptions = {
  assets?: Asset[];
  profile?: Exclude<RunProfile, "mock">;
  baseUrl?: string;
  fetchImpl?: FetchLike;
  delayMs?: number;
  rateLimitRetryMs?: number;
  maxRecordsPerQuery?: number;
  maxQueriesPerRun?: number;
  userAgent?: string;
};

const genericEventQueries: GdeltQueryConfig[] = [
  {
    id: "generic-negative-market-move",
    query: '"shares fell" OR "shares drop" OR "stock drops" OR "stock plunges" OR "profit warning" OR "cuts guidance" sourcelang:eng tonelessthan:-1',
    topics: ["gdelt", "generic_event_pattern", "negative_market_move"],
    symbols: [],
    isGenericEventPattern: true,
  },
  {
    id: "generic-recall-investigation",
    query: '"recall" OR "investigation" OR "lawsuit" OR "short seller" stock sourcelang:eng tonelessthan:-1',
    topics: ["gdelt", "generic_event_pattern", "recall_investigation"],
    symbols: [],
    isGenericEventPattern: true,
  },
];

function isAssetForProfile(asset: Asset, profile: Exclude<RunProfile, "mock">) {
  if (asset.status !== "active") {
    return false;
  }

  return profile === "eu_open"
    ? asset.assetType === "eu_equity"
    : asset.assetType === "us_equity" || asset.assetType === "etf";
}

function cleanTicker(ticker: string) {
  return ticker.split(".")[0]?.replace(/[^A-Z0-9-]/gi, "").toUpperCase() || ticker.toUpperCase();
}

function quotePhrase(value: string) {
  return `"${value.replace(/"/g, "").trim()}"`;
}

function assetQuery(asset: Asset): GdeltQueryConfig {
  const ticker = cleanTicker(asset.ticker);
  const company = quotePhrase(asset.name);

  return {
    id: `asset-${ticker.toLowerCase()}`,
    query: `${company} stock OR shares OR earnings OR guidance OR recall OR investigation sourcelang:eng`,
    topics: ["gdelt", "watchlist_query", asset.sector.toLowerCase()],
    symbols: [asset.ticker],
    isGenericEventPattern: false,
  };
}

function sectorQuery(sector: string): GdeltQueryConfig {
  const normalizedSector = sector.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "sector";
  const plainSector = sector.replace(/[^\w\s/-]/g, "").trim();

  return {
    id: `sector-${normalizedSector}`,
    query: `${quotePhrase(plainSector)} stocks OR shares OR demand OR guidance sourcelang:eng tonelessthan:-1`,
    topics: ["gdelt", "sector_query", normalizedSector],
    symbols: [],
    isGenericEventPattern: false,
  };
}

export function buildGdeltQueries(input: {
  assets: Asset[];
  profile: Exclude<RunProfile, "mock">;
  maxQueriesPerRun?: number;
}): GdeltQueryConfig[] {
  const maxQueries = input.maxQueriesPerRun ?? 4;
  const activeAssets = input.assets
    .filter((asset) => isAssetForProfile(asset, input.profile))
    .sort((left, right) => left.priority - right.priority || left.ticker.localeCompare(right.ticker));
  const targetedQueries = activeAssets.slice(0, 2).map(assetQuery);
  const firstSector = activeAssets.find((asset) => asset.sector)?.sector;
  const sectorQueries = firstSector ? [sectorQuery(firstSector)] : [];

  return [...genericEventQueries, ...targetedQueries, ...sectorQueries].slice(0, maxQueries);
}

function timespanForWindow(window: RunWindow) {
  const hours = Math.max(1, Math.ceil((window.to.getTime() - window.from.getTime()) / 3_600_000));

  return `${hours}h`;
}

function parseGdeltDate(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  if (/^\d{14}$/.test(value)) {
    const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:${value.slice(12, 14)}.000Z`;

    return iso;
  }

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : fallback;
}

async function wait(ms: number) {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchGdeltArticles(input: {
  fetchImpl: FetchLike;
  baseUrl: string;
  query: GdeltQueryConfig;
  window: RunWindow;
  maxRecords: number;
  userAgent: string;
  rateLimitRetryMs: number;
}) {
  const url = new URL(input.baseUrl);
  url.searchParams.set("query", input.query.query);
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("format", "json");
  url.searchParams.set("timespan", timespanForWindow(input.window));
  url.searchParams.set("maxrecords", String(input.maxRecords));
  url.searchParams.set("sort", "datedesc");

  const request = () =>
    input.fetchImpl(url, {
      headers: {
        "User-Agent": input.userAgent,
        Accept: "application/json",
      },
    });
  let response = await request();

  if (response.status === 429 && input.rateLimitRetryMs > 0) {
    await wait(input.rateLimitRetryMs);
    response = await request();
  }

  if (!response.ok) {
    throw new Error(`GDELT DOC query ${input.query.id} failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as GdeltResponse;

  return payload.articles ?? [];
}

function toSourceItem(query: GdeltQueryConfig, article: GdeltArticle, fetchedAt: string): SourceItem {
  const sourceUrl = article.url ?? article.url_mobile ?? "https://www.gdeltproject.org/";
  const providerItemId = sourceUrl || `${query.id}-${article.title ?? fetchedAt}`;
  const publishedAt = parseGdeltDate(article.seendate, fetchedAt);

  return {
    providerItemId,
    sourceCategory: "broad_news",
    sourceName: article.domain ?? "GDELT DOC",
    sourceUrl,
    publishedAt,
    fetchedAt,
    title: article.title ?? "GDELT news item",
    snippet: [
      article.domain ? `Domain: ${article.domain}` : null,
      article.sourcecountry ? `Source country: ${article.sourcecountry}` : null,
      article.language ? `Language: ${article.language}` : null,
      `Query: ${query.id}`,
    ].filter(Boolean).join(". "),
    symbols: query.symbols,
    topics: query.topics,
    rawPayloadRef: createRawPayloadRef("gdelt_doc", providerItemId, fetchedAt),
  };
}

export function createGdeltDocAdapter(options: GdeltAdapterOptions = {}): SourceAdapter {
  return {
    provider: "gdelt_doc",
    category: "broad_news",
    async fetchItems(window: RunWindow) {
      const profile = options.profile ?? (window.profile === "mock" ? "us_open" : window.profile);
      const queries = buildGdeltQueries({
        assets: options.assets ?? [],
        profile,
        maxQueriesPerRun: options.maxQueriesPerRun,
      });
      const fetchImpl = options.fetchImpl ?? fetch;
      const fetchedAt = window.to.toISOString();
      const seenUrls = new Set<string>();
      const items: SourceItem[] = [];
      const failures: string[] = [];

      for (const [index, query] of queries.entries()) {
        if (index > 0) {
          await wait(options.delayMs ?? 5_500);
        }

        let articles: GdeltArticle[] = [];
        try {
          articles = await fetchGdeltArticles({
            fetchImpl,
            query,
            window,
            baseUrl: options.baseUrl ?? "https://api.gdeltproject.org/api/v2/doc/doc",
            maxRecords: options.maxRecordsPerQuery ?? 20,
            userAgent: options.userAgent ?? "EdgeTerminal GDELT reader robin@mdejong.dev",
            rateLimitRetryMs: options.rateLimitRetryMs ?? 6_000,
          });
        } catch (error) {
          failures.push(error instanceof Error ? error.message : String(error));
          continue;
        }

        for (const article of articles) {
          const item = toSourceItem(query, article, fetchedAt);
          const publishedAt = Date.parse(item.publishedAt);

          if (Number.isFinite(publishedAt) && (publishedAt < window.from.getTime() || publishedAt > window.to.getTime())) {
            continue;
          }

          if (seenUrls.has(item.sourceUrl)) {
            continue;
          }

          seenUrls.add(item.sourceUrl);
          items.push(item);
        }
      }

      if (items.length === 0 && failures.length === queries.length && failures.length > 0) {
        throw new Error(`GDELT DOC failed for all queries: ${failures.join("; ")}`);
      }

      return items;
    },
  };
}
