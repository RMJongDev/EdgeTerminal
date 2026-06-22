import { createRawPayloadRef } from "../contracts.ts";
import type { RunWindow, SourceAdapter, SourceItem } from "../types.ts";

type FetchLike = typeof fetch;

type FinnhubConfig = {
  apiKey: string;
  baseUrl: string;
  fetchImpl: FetchLike;
};

type FinnhubNewsItem = {
  category?: string;
  datetime?: number;
  headline?: string;
  id?: number | string;
  related?: string;
  source?: string;
  summary?: string;
  url?: string;
};

type FinnhubQuote = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};

export type FinnhubPriceSnapshot = {
  ticker: string;
  price: number;
  checkedAt: string;
};

type FinnhubEarningsCalendarItem = {
  date?: string;
  epsActual?: number | null;
  epsEstimate?: number | null;
  hour?: string;
  quarter?: number;
  revenueActual?: number | null;
  revenueEstimate?: number | null;
  symbol?: string;
  year?: number;
};

type FinnhubEarningsCalendarResponse = {
  earningsCalendar?: FinnhubEarningsCalendarItem[];
};

export type FinnhubAdapterOptions = {
  apiKey?: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
  symbols?: string[];
  maxSymbolsPerRun?: number;
  includeMarketNews?: boolean;
  includeCompanyNews?: boolean;
  includeEarnings?: boolean;
  includeQuotes?: boolean;
};

function getFinnhubConfig(options: FinnhubAdapterOptions = {}): FinnhubConfig | null {
  const apiKey = options.apiKey ?? process.env.FINANCIAL_NEWS_API_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    baseUrl: (options.baseUrl ?? process.env.FINANCIAL_NEWS_BASE_URL ?? "https://finnhub.io/api/v1").replace(/\/$/, ""),
    fetchImpl: options.fetchImpl ?? fetch,
  };
}

function dateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function fetchFinnhubJson<T>(
  config: FinnhubConfig,
  path: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(`${config.baseUrl}${path}`);
  url.searchParams.set("token", config.apiKey);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await config.fetchImpl(url);

  if (!response.ok) {
    throw new Error(`Finnhub ${path} failed with HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function symbolsFromRelated(related: string | undefined, fallback: string | undefined) {
  const symbols = (related ?? "")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length > 0) {
    return Array.from(new Set(symbols));
  }

  return fallback ? [fallback.toUpperCase()] : [];
}

function newsToSourceItem(provider: string, item: FinnhubNewsItem, fetchedAt: string, fallbackSymbol?: string): SourceItem {
  const providerItemId = String(item.id ?? item.url ?? item.headline ?? `${provider}-${fetchedAt}`);
  const publishedAt = item.datetime ? new Date(item.datetime * 1_000).toISOString() : fetchedAt;
  const symbols = symbolsFromRelated(item.related, fallbackSymbol);

  return {
    providerItemId,
    sourceName: item.source || provider,
    sourceUrl: item.url || `https://finnhub.io`,
    publishedAt,
    fetchedAt,
    title: item.headline || "Finnhub news item",
    snippet: item.summary,
    symbols,
    topics: [item.category ?? "news"].filter(Boolean),
    rawPayloadRef: createRawPayloadRef(provider, providerItemId, fetchedAt),
  };
}

function quoteToSourceItem(symbol: string, quote: FinnhubQuote, fetchedAt: string): SourceItem {
  const providerItemId = `${symbol}-${quote.t ?? Date.parse(fetchedAt)}`;
  const move = quote.dp === undefined ? "n/a" : `${quote.dp.toFixed(2)}%`;

  return {
    providerItemId,
    sourceName: "Finnhub quote",
    sourceUrl: `https://finnhub.io`,
    publishedAt: quote.t ? new Date(quote.t * 1_000).toISOString() : fetchedAt,
    fetchedAt,
    title: `${symbol} quote snapshot: ${move}`,
    snippet: `Last ${quote.c ?? "n/a"}, previous close ${quote.pc ?? "n/a"}, open ${quote.o ?? "n/a"}.`,
    symbols: [symbol],
    topics: ["quote", "market_context"],
    rawPayloadRef: createRawPayloadRef("finnhub_quote", providerItemId, fetchedAt),
  };
}

function earningsToSourceItem(item: FinnhubEarningsCalendarItem, fetchedAt: string): SourceItem {
  const symbol = item.symbol?.toUpperCase() ?? "UNKNOWN";
  const providerItemId = `${symbol}-${item.date ?? fetchedAt}-${item.quarter ?? "q"}-${item.year ?? "y"}`;

  return {
    providerItemId,
    sourceName: "Finnhub earnings calendar",
    sourceUrl: "https://finnhub.io",
    publishedAt: item.date ? `${item.date}T00:00:00.000Z` : fetchedAt,
    fetchedAt,
    title: `${symbol} earnings calendar item`,
    snippet: `Date ${item.date ?? "n/a"}, hour ${item.hour ?? "n/a"}, EPS estimate ${item.epsEstimate ?? "n/a"}, revenue estimate ${item.revenueEstimate ?? "n/a"}.`,
    symbols: [symbol],
    topics: ["earnings", "calendar"],
    rawPayloadRef: createRawPayloadRef("finnhub_earnings", providerItemId, fetchedAt),
  };
}

function limitedSymbols(options: FinnhubAdapterOptions) {
  return Array.from(new Set((options.symbols ?? []).map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))).slice(
    0,
    options.maxSymbolsPerRun ?? 8,
  );
}

function northAmericaSymbols(symbols: string[]) {
  return symbols.filter((symbol) => !symbol.includes("."));
}

export function hasFinnhubEnv(options: FinnhubAdapterOptions = {}) {
  return Boolean(getFinnhubConfig(options));
}

export function createFinnhubNewsAdapter(options: FinnhubAdapterOptions = {}): SourceAdapter | null {
  const config = getFinnhubConfig(options);

  if (!config) {
    return null;
  }

  return {
    provider: "finnhub_news",
    category: "financial_feed",
    async fetchItems(window: RunWindow) {
      const fetchedAt = window.to.toISOString();
      const symbols = limitedSymbols(options);
      const items: SourceItem[] = [];

      if (options.includeMarketNews ?? true) {
        const marketNews = await fetchFinnhubJson<FinnhubNewsItem[]>(config, "/news", {
          category: "general",
        });
        items.push(...marketNews.slice(0, 20).map((item) => newsToSourceItem("finnhub_market_news", item, fetchedAt)));
      }

      if (options.includeCompanyNews ?? true) {
        for (const symbol of northAmericaSymbols(symbols)) {
          const companyNews = await fetchFinnhubJson<FinnhubNewsItem[]>(config, "/company-news", {
            symbol,
            from: dateParam(window.from),
            to: dateParam(window.to),
          });
          items.push(...companyNews.slice(0, 8).map((item) => newsToSourceItem("finnhub_company_news", item, fetchedAt, symbol)));
        }
      }

      return items;
    },
  };
}

export function createFinnhubEarningsAdapter(options: FinnhubAdapterOptions = {}): SourceAdapter | null {
  const config = getFinnhubConfig(options);

  if (!config) {
    return null;
  }

  return {
    provider: "finnhub_earnings",
    category: "financial_feed",
    async fetchItems(window: RunWindow) {
      if (options.includeEarnings === false) {
        return [];
      }

      const fetchedAt = window.to.toISOString();
      const symbols = limitedSymbols(options);
      const response = await fetchFinnhubJson<FinnhubEarningsCalendarResponse>(config, "/calendar/earnings", {
        from: dateParam(window.from),
        to: dateParam(new Date(window.to.getTime() + 7 * 24 * 60 * 60_000)),
        international: true,
      });
      const calendar = response.earningsCalendar ?? [];

      return calendar
        .filter((item) => !symbols.length || (item.symbol && symbols.includes(item.symbol.toUpperCase())))
        .slice(0, 30)
        .map((item) => earningsToSourceItem(item, fetchedAt));
    },
  };
}

export function createFinnhubQuoteAdapter(options: FinnhubAdapterOptions = {}): SourceAdapter | null {
  const config = getFinnhubConfig(options);

  if (!config) {
    return null;
  }

  return {
    provider: "finnhub_quote",
    category: "market_context",
    async fetchItems(window: RunWindow) {
      if (options.includeQuotes === false) {
        return [];
      }

      const fetchedAt = window.to.toISOString();
      const symbols = limitedSymbols(options);
      const items: SourceItem[] = [];

      for (const symbol of symbols) {
        const quote = await fetchFinnhubJson<FinnhubQuote>(config, "/quote", { symbol });

        if (quote.c !== undefined || quote.dp !== undefined) {
          items.push(quoteToSourceItem(symbol, quote, fetchedAt));
        }
      }

      return items;
    },
  };
}

export async function fetchFinnhubLastPrices(
  symbols: string[],
  options: FinnhubAdapterOptions = {},
): Promise<FinnhubPriceSnapshot[]> {
  const config = getFinnhubConfig(options);

  if (!config) {
    return [];
  }

  const uniqueSymbols = limitedSymbols({
    ...options,
    symbols,
    maxSymbolsPerRun: options.maxSymbolsPerRun ?? symbols.length,
  });
  const snapshots: FinnhubPriceSnapshot[] = [];

  for (const symbol of uniqueSymbols) {
    try {
      const quote = await fetchFinnhubJson<FinnhubQuote>(config, "/quote", { symbol });
      if (Number.isFinite(quote.c) && quote.c && quote.c > 0) {
        snapshots.push({
          ticker: symbol,
          price: quote.c,
          checkedAt: quote.t ? new Date(quote.t * 1_000).toISOString() : new Date().toISOString(),
        });
      }
    } catch {
      continue;
    }
  }

  return snapshots;
}

export function createFinnhubAdapters(options: FinnhubAdapterOptions = {}) {
  return [
    createFinnhubNewsAdapter(options),
    createFinnhubEarningsAdapter(options),
    createFinnhubQuoteAdapter(options),
  ].filter((adapter): adapter is SourceAdapter => Boolean(adapter));
}
