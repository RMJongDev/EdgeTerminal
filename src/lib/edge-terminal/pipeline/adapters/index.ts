import type { Asset } from "../../types.ts";
import type { RunProfile, SourceAdapter } from "../types.ts";
import { createMockMoverSweepAdapter, createMockSourceAdapters } from "../steps/mock-adapters.ts";
import { createEdgarCurrentFilingsAdapter } from "./edgar.ts";
import { createFinnhubAdapters, createFinnhubNewsAdapter, hasFinnhubEnv } from "./finnhub.ts";
import { createGdeltDocAdapter } from "./gdelt.ts";
import {
  createAlphaVantageTopMoversAdapter,
  createNasdaqTradeHaltsAdapter,
} from "./movers.ts";
import { createRssOfficialSourceAdapter } from "./rss-official.ts";

function symbolsForProfile(assets: Asset[], profile: Exclude<RunProfile, "mock">) {
  return assets
    .filter((asset) => asset.status === "active")
    .filter((asset) => (profile === "eu_open" ? asset.assetType === "eu_equity" : asset.assetType === "us_equity" || asset.assetType === "etf"))
    .sort((left, right) => left.priority - right.priority || left.ticker.localeCompare(right.ticker))
    .map((asset) => asset.ticker);
}

export function createConfiguredSourceAdapters(input: {
  assets: Asset[];
  profile: Exclude<RunProfile, "mock">;
}) {
  const edgarAdapter = createEdgarCurrentFilingsAdapter();
  const symbols = symbolsForProfile(input.assets, input.profile);
  const sectors = Array.from(new Set(input.assets.map((asset) => asset.sector)));
  const rssAdapter = createRssOfficialSourceAdapter({
    symbols,
    sectors,
  });
  const gdeltAdapter = createGdeltDocAdapter({
    assets: input.assets,
    profile: input.profile,
  });

  if (!hasFinnhubEnv()) {
    if (edgarAdapter) {
      return [...createMockSourceAdapters(), edgarAdapter, rssAdapter, gdeltAdapter];
    }

    return [...createMockSourceAdapters(), rssAdapter, gdeltAdapter];
  }

  const adapters = createFinnhubAdapters({
    symbols,
    maxSymbolsPerRun: 8,
  });

  if (edgarAdapter) {
    adapters.push(edgarAdapter);
  }
  adapters.push(rssAdapter);
  adapters.push(gdeltAdapter);

  return adapters.length > 0 ? adapters : createMockSourceAdapters();
}

export function createConfiguredMoverSweepAdapters(input: {
  profile: Exclude<RunProfile, "mock">;
}) {
  const adapters: SourceAdapter[] = [];
  const alphaVantageAdapter = input.profile === "us_open"
    ? createAlphaVantageTopMoversAdapter({
        thresholdPct: 4,
        maxItemsPerBucket: 20,
      })
    : null;

  if (alphaVantageAdapter) {
    adapters.push(alphaVantageAdapter);
  }
  adapters.push(createNasdaqTradeHaltsAdapter());

  return adapters.length > 0 ? adapters : [createMockMoverSweepAdapter()];
}

export function createMoverFollowUpSourceAdapters(input: {
  moverItems: Array<{ symbols?: string[] }>;
  profile: Exclude<RunProfile, "mock">;
  assets: Asset[];
}) {
  const moverSymbols = Array.from(
    new Set(input.moverItems.flatMap((item) => item.symbols ?? []).map((symbol) => symbol.toUpperCase())),
  ).slice(0, 5);
  const existingAssets = input.assets.filter((asset) => moverSymbols.includes(asset.ticker.toUpperCase()));
  const syntheticAssets = moverSymbols
    .filter((symbol) => !existingAssets.some((asset) => asset.ticker.toUpperCase() === symbol))
    .map((symbol, index): Asset => ({
      id: `mover-${symbol.toLowerCase()}`,
      ticker: symbol,
      name: symbol,
      assetType: symbol.includes(".") ? "eu_equity" : "us_equity",
      sector: "Unclassified mover",
      exchange: "Unknown",
      currency: "USD",
      country: "Unknown",
      priority: 50 + index,
      status: "active",
      notes: "Synthetic mover asset for targeted broad-news follow-up.",
      lastMovePercent: null,
      updatedAt: new Date().toISOString(),
    }));
  const followUpAssets = [...existingAssets, ...syntheticAssets];
  const adapters: SourceAdapter[] = [];

  if (hasFinnhubEnv() && moverSymbols.length > 0) {
    const finnhubNewsAdapter = createFinnhubNewsAdapter({
      symbols: moverSymbols,
      maxSymbolsPerRun: 5,
      includeMarketNews: false,
      includeCompanyNews: true,
    });

    if (finnhubNewsAdapter) {
      adapters.push(finnhubNewsAdapter);
    }
  }

  if (followUpAssets.length > 0) {
    adapters.push(createGdeltDocAdapter({
      assets: followUpAssets,
      profile: input.profile,
      maxQueriesPerRun: Math.min(3, followUpAssets.length + 1),
      maxRecordsPerQuery: 10,
    }));
  }

  return adapters;
}
