import { createRawPayloadRef } from "../contracts.ts";
import type { RunWindow, SourceAdapter, SourceCategory, SourceItem } from "../types.ts";

type FetchLike = typeof fetch;

export type RssFeedConfig = {
  id: string;
  name: string;
  url: string;
  sourceCategory: SourceCategory;
  topics: string[];
  symbols?: string[];
  sectorGate?: string[];
};

type RssAdapterOptions = {
  fetchImpl?: FetchLike;
  feeds?: RssFeedConfig[];
  companyFeeds?: RssFeedConfig[];
  symbols?: string[];
  sectors?: string[];
  maxItemsPerFeed?: number;
};

type ParsedFeedItem = {
  id: string;
  title: string;
  link: string | null;
  publishedAt: string | null;
  snippet: string | null;
};

export const officialRssFeeds: RssFeedConfig[] = [
  {
    id: "globenewswire-news",
    name: "GlobeNewswire News Releases",
    url: "https://www.globenewswire.com/RssFeed/orgclass/1/feedTitle/GlobeNewswire%20-%20News%20Releases",
    sourceCategory: "financial_feed",
    topics: ["press_release", "company_news"],
  },
  {
    id: "pr-newswire",
    name: "PR Newswire",
    url: "https://www.prnewswire.com/rss/news-releases-list.rss",
    sourceCategory: "financial_feed",
    topics: ["press_release", "company_news"],
  },
  {
    id: "businesswire",
    name: "Business Wire",
    url: "https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeEFpQWQ==",
    sourceCategory: "financial_feed",
    topics: ["press_release", "company_news"],
  },
  {
    id: "fed-press",
    name: "Federal Reserve Press Releases",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    sourceCategory: "macro_calendar",
    topics: ["macro", "rates", "central_bank"],
  },
  {
    id: "ecb-press",
    name: "ECB Press Releases",
    url: "https://www.ecb.europa.eu/rss/press.html",
    sourceCategory: "macro_calendar",
    topics: ["macro", "rates", "central_bank"],
  },
  {
    id: "bls-latest",
    name: "BLS Latest Releases",
    url: "https://www.bls.gov/feed/bls_latest.rss",
    sourceCategory: "macro_calendar",
    topics: ["macro", "jobs", "inflation"],
  },
  {
    id: "sec-press",
    name: "SEC Press Releases",
    url: "https://www.sec.gov/news/pressreleases.rss",
    sourceCategory: "primary_source",
    topics: ["regulator", "sec"],
  },
  {
    id: "fda-press",
    name: "FDA Press Announcements",
    url: "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml",
    sourceCategory: "primary_source",
    topics: ["regulator", "healthcare", "fda"],
    sectorGate: ["healthcare", "pharma", "biotech"],
  },
  {
    id: "ema-news",
    name: "EMA News",
    url: "https://www.ema.europa.eu/en/news.xml",
    sourceCategory: "primary_source",
    topics: ["regulator", "healthcare", "ema"],
    sectorGate: ["healthcare", "pharma", "biotech"],
  },
  {
    id: "eurostat-news",
    name: "Eurostat News Releases",
    url: "https://ec.europa.eu/eurostat/api/dissemination/rss/newsreleases?lang=en",
    sourceCategory: "macro_calendar",
    topics: ["macro", "europe", "statistics"],
  },
];

export const companyIrFeeds: RssFeedConfig[] = [
  {
    id: "asml-ir",
    name: "ASML press releases",
    url: "https://www.asml.com/en/news/press-releases/rss.xml",
    sourceCategory: "primary_source",
    topics: ["company_ir", "semiconductors"],
    symbols: ["ASML", "ASML.AS"],
  },
  {
    id: "apple-newsroom",
    name: "Apple Newsroom",
    url: "https://www.apple.com/newsroom/rss-feed.rss",
    sourceCategory: "primary_source",
    topics: ["company_ir", "technology"],
    symbols: ["AAPL"],
  },
  {
    id: "microsoft-ir",
    name: "Microsoft Investor Relations",
    url: "https://www.microsoft.com/en-us/investor/rss",
    sourceCategory: "primary_source",
    topics: ["company_ir", "technology"],
    symbols: ["MSFT"],
  },
];

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripTags(value: string) {
  return decodeXml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function tagValue(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));

  return match ? stripTags(match[1]) : null;
}

function linkValue(block: string) {
  const atomLink = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);

  if (atomLink) {
    return decodeXml(atomLink[1]);
  }

  return tagValue(block, "link");
}

function normalizeDate(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function parseRssOrAtom(xml: string): ParsedFeedItem[] {
  const rssItems = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const atomEntries = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];

  return [...rssItems, ...atomEntries].map((block) => {
    const link = linkValue(block);
    const id = tagValue(block, "guid") ?? tagValue(block, "id") ?? link ?? tagValue(block, "title") ?? "rss-item";

    return {
      id,
      title: tagValue(block, "title") ?? "RSS item",
      link,
      publishedAt: normalizeDate(tagValue(block, "pubDate") ?? tagValue(block, "published") ?? tagValue(block, "updated")),
      snippet: tagValue(block, "description") ?? tagValue(block, "summary") ?? tagValue(block, "content"),
    };
  });
}

function isAllowedByGate(feed: RssFeedConfig, sectors: string[]) {
  if (!feed.sectorGate?.length) {
    return true;
  }

  const normalizedSectors = sectors.map((sector) => sector.toLowerCase());

  return feed.sectorGate.some((gate) => normalizedSectors.some((sector) => sector.includes(gate)));
}

function selectFeeds(options: RssAdapterOptions) {
  const symbols = new Set((options.symbols ?? []).map((symbol) => symbol.toUpperCase()));
  const sectorAllowedFeeds = (options.feeds ?? officialRssFeeds).filter((feed) =>
    isAllowedByGate(feed, options.sectors ?? []),
  );
  const selectedCompanyFeeds = (options.companyFeeds ?? companyIrFeeds).filter((feed) =>
    (feed.symbols ?? []).some((symbol) => symbols.has(symbol.toUpperCase())),
  );

  return [...sectorAllowedFeeds, ...selectedCompanyFeeds];
}

function toSourceItem(feed: RssFeedConfig, item: ParsedFeedItem, fetchedAt: string): SourceItem {
  return {
    providerItemId: item.id,
    sourceCategory: feed.sourceCategory,
    sourceName: feed.name,
    sourceUrl: item.link ?? feed.url,
    publishedAt: item.publishedAt ?? fetchedAt,
    fetchedAt,
    title: item.title,
    snippet: item.snippet ?? undefined,
    symbols: feed.symbols ?? [],
    topics: feed.topics,
    rawPayloadRef: createRawPayloadRef(`rss_${feed.id}`, item.id, fetchedAt),
  };
}

export function createRssOfficialSourceAdapter(options: RssAdapterOptions = {}): SourceAdapter {
  return {
    provider: "rss_official",
    category: "primary_source",
    async fetchItems(window: RunWindow) {
      const fetchImpl = options.fetchImpl ?? fetch;
      const fetchedAt = window.to.toISOString();
      const items: SourceItem[] = [];

      for (const feed of selectFeeds(options)) {
        try {
          const response = await fetchImpl(feed.url, {
            headers: {
              "User-Agent": "EdgeTerminal RSS reader robin@mdejong.dev",
              Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
            },
          });

          if (!response.ok) {
            continue;
          }

          const parsedItems = parseRssOrAtom(await response.text())
            .filter((item) => {
              const publishedAt = item.publishedAt ? Date.parse(item.publishedAt) : Date.parse(fetchedAt);

              return publishedAt >= window.from.getTime() && publishedAt <= window.to.getTime();
            })
            .slice(0, options.maxItemsPerFeed ?? 20)
            .map((item) => toSourceItem(feed, item, fetchedAt));

          items.push(...parsedItems);
        } catch {
          continue;
        }
      }

      return items;
    },
  };
}
