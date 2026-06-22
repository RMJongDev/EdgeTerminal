import { createRawPayloadRef } from "../contracts.ts";
import type { RunWindow, SourceAdapter, SourceItem } from "../types.ts";

type FetchLike = typeof fetch;

type AlphaVantageMover = {
  ticker?: string;
  price?: string;
  change_amount?: string;
  change_percentage?: string;
  volume?: string;
};

type AlphaVantageMoversResponse = {
  top_gainers?: AlphaVantageMover[];
  top_losers?: AlphaVantageMover[];
  most_actively_traded?: AlphaVantageMover[];
  Information?: string;
  Note?: string;
  "Error Message"?: string;
};

type AlphaVantageMoverOptions = {
  apiKey?: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
  thresholdPct?: number;
  maxItemsPerBucket?: number;
};

type NasdaqHaltsOptions = {
  feedUrl?: string;
  fetchImpl?: FetchLike;
  maxItems?: number;
};

export type NasdaqHaltItem = {
  symbol: string;
  issueName: string;
  market: string;
  reasonCode: string;
  haltDate: string;
  haltTime: string;
  pubDate: string | null;
};

function getAlphaVantageApiKey(options: AlphaVantageMoverOptions) {
  return options.apiKey ?? process.env.MOVERS_API_KEY ?? process.env.ALPHA_VANTAGE_API_KEY ?? "";
}

function parsePercent(value: string | undefined) {
  const parsed = Number.parseFloat((value ?? "").replace("%", ""));

  return Number.isFinite(parsed) ? parsed : null;
}

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
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, "i"));

  return match ? stripTags(match[1]) : null;
}

export function parseNasdaqHaltRss(xml: string): NasdaqHaltItem[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  return items
    .map((item) => ({
      symbol: tagValue(item, "ndaq:IssueSymbol") ?? tagValue(item, "title") ?? "",
      issueName: tagValue(item, "ndaq:IssueName") ?? "",
      market: tagValue(item, "ndaq:Market") ?? "",
      reasonCode: tagValue(item, "ndaq:ReasonCode") ?? "",
      haltDate: tagValue(item, "ndaq:HaltDate") ?? "",
      haltTime: tagValue(item, "ndaq:HaltTime") ?? "",
      pubDate: tagValue(item, "pubDate"),
    }))
    .filter((item) => item.symbol);
}

function alphaMoverToSourceItem(
  item: AlphaVantageMover,
  bucket: "top_gainers" | "top_losers" | "most_actively_traded",
  fetchedAt: string,
): SourceItem | null {
  const ticker = item.ticker?.trim().toUpperCase();
  const changePct = parsePercent(item.change_percentage);

  if (!ticker || changePct === null) {
    return null;
  }

  const providerItemId = `${bucket}-${ticker}-${item.change_percentage ?? fetchedAt}`;
  const direction = changePct >= 0 ? "up" : "down";

  return {
    providerItemId,
    sourceCategory: "market_context",
    sourceName: "Alpha Vantage top movers",
    sourceUrl: "https://www.alphavantage.co/documentation/#top-gainers-losers",
    publishedAt: fetchedAt,
    fetchedAt,
    title: `${ticker} moves ${direction} ${item.change_percentage}`,
    snippet: `Unexplained mover context. Price ${item.price ?? "n/a"}, change ${item.change_amount ?? "n/a"} (${item.change_percentage ?? "n/a"}), volume ${item.volume ?? "n/a"}.`,
    symbols: [ticker],
    topics: ["mover_sweep", bucket, "unexplained_move"],
    rawPayloadRef: createRawPayloadRef("alpha_vantage_movers", providerItemId, fetchedAt),
  };
}

function alphaBucketItems(
  response: AlphaVantageMoversResponse,
  bucket: "top_gainers" | "top_losers" | "most_actively_traded",
  fetchedAt: string,
  input: {
    thresholdPct: number;
    maxItemsPerBucket: number;
  },
) {
  return (response[bucket] ?? [])
    .slice(0, input.maxItemsPerBucket)
    .map((item) => alphaMoverToSourceItem(item, bucket, fetchedAt))
    .filter((item): item is SourceItem => Boolean(item))
    .filter((item) => {
      const changePct = parsePercent(item.title.split(" ").at(-1));

      return changePct === null ? false : Math.abs(changePct) >= input.thresholdPct;
    });
}

function nasdaqHaltToSourceItem(item: NasdaqHaltItem, fetchedAt: string): SourceItem {
  const providerItemId = `${item.symbol}-${item.haltDate}-${item.haltTime}-${item.reasonCode}`;
  const reasonTopic = item.reasonCode ? item.reasonCode.toLowerCase() : "unknown_halt_code";
  const isNewsHalt = item.reasonCode === "T1" || item.reasonCode === "T2";
  const pubDateTimestamp = item.pubDate ? Date.parse(item.pubDate) : NaN;

  return {
    providerItemId,
    sourceCategory: "market_context",
    sourceName: "Nasdaq trade halt RSS",
    sourceUrl: "https://www.nasdaqtrader.com/trader.aspx?id=tradehalts",
    publishedAt: Number.isFinite(pubDateTimestamp) ? new Date(pubDateTimestamp).toISOString() : fetchedAt,
    fetchedAt,
    title: `${item.symbol} trading halt ${item.reasonCode || "unknown"}`,
    snippet: `${item.issueName || item.symbol} halted on ${item.market || "unknown market"} at ${item.haltDate} ${item.haltTime} ET. Reason code ${item.reasonCode || "n/a"}.`,
    symbols: [item.symbol],
    topics: ["trading_halt", "market_structure", "trading_halt_context", reasonTopic, ...(isNewsHalt ? ["news_halt"] : [])],
    rawPayloadRef: createRawPayloadRef("nasdaq_trade_halts", providerItemId, fetchedAt),
  };
}

export function createAlphaVantageTopMoversAdapter(options: AlphaVantageMoverOptions = {}): SourceAdapter | null {
  const apiKey = getAlphaVantageApiKey(options);

  if (!apiKey) {
    return null;
  }

  return {
    provider: "alpha_vantage_movers",
    category: "market_context",
    async fetchItems(window: RunWindow) {
      const fetchedAt = window.to.toISOString();
      const fetchImpl = options.fetchImpl ?? fetch;
      const url = new URL(options.baseUrl ?? "https://www.alphavantage.co/query");
      url.searchParams.set("function", "TOP_GAINERS_LOSERS");
      url.searchParams.set("apikey", apiKey);

      const response = await fetchImpl(url, {
        headers: {
          "User-Agent": "EdgeTerminal Alpha Vantage reader robin@mdejong.dev",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Alpha Vantage TOP_GAINERS_LOSERS failed with HTTP ${response.status}`);
      }

      const payload = (await response.json()) as AlphaVantageMoversResponse;
      const hasMoverBuckets = Array.isArray(payload.top_gainers) || Array.isArray(payload.top_losers) || Array.isArray(payload.most_actively_traded);

      if (!hasMoverBuckets) {
        throw new Error(payload.Information ?? payload.Note ?? payload["Error Message"] ?? "Alpha Vantage mover response did not include mover buckets");
      }

      const thresholdPct = options.thresholdPct ?? 4;
      const maxItemsPerBucket = options.maxItemsPerBucket ?? 20;

      return [
        ...alphaBucketItems(payload, "top_gainers", fetchedAt, { thresholdPct, maxItemsPerBucket }),
        ...alphaBucketItems(payload, "top_losers", fetchedAt, { thresholdPct, maxItemsPerBucket }),
        ...alphaBucketItems(payload, "most_actively_traded", fetchedAt, { thresholdPct, maxItemsPerBucket }),
      ].sort((left, right) => {
        const leftPct = Math.abs(parsePercent(left.title.split(" ").at(-1)) ?? 0);
        const rightPct = Math.abs(parsePercent(right.title.split(" ").at(-1)) ?? 0);

        return rightPct - leftPct;
      });
    },
  };
}

export function createNasdaqTradeHaltsAdapter(options: NasdaqHaltsOptions = {}): SourceAdapter {
  return {
    provider: "nasdaq_trade_halts",
    category: "market_context",
    async fetchItems(window: RunWindow) {
      const fetchImpl = options.fetchImpl ?? fetch;
      const fetchedAt = window.to.toISOString();
      const response = await fetchImpl(options.feedUrl ?? "https://www.nasdaqtrader.com/rss.aspx?feed=tradehalts", {
        headers: {
          "User-Agent": "EdgeTerminal Nasdaq halt reader robin@mdejong.dev",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
      });

      if (!response.ok) {
        throw new Error(`Nasdaq trade halt RSS failed with HTTP ${response.status}`);
      }

      return parseNasdaqHaltRss(await response.text())
        .slice(0, options.maxItems ?? 25)
        .map((item) => nasdaqHaltToSourceItem(item, fetchedAt))
        .filter((item) => {
          const publishedAt = Date.parse(item.publishedAt);

          return Number.isFinite(publishedAt) ? publishedAt >= window.from.getTime() && publishedAt <= window.to.getTime() : true;
        });
    },
  };
}

export function hasAlphaVantageMoversEnv(options: AlphaVantageMoverOptions = {}) {
  return Boolean(getAlphaVantageApiKey(options));
}
