import { demoEventSources } from "./demo-data";
import type { EventSource, SourceCategory } from "./types";

function cloneSources(category: SourceCategory) {
  return demoEventSources
    .filter((source) => source.sourceCategory === category)
    .map((source) => ({ ...source }));
}

export function fetchBroadNewsSources() {
  return cloneSources("broad_news");
}

export function fetchFinancialNewsSources() {
  return cloneSources("financial_feed");
}

export function fetchPrimarySourceItems() {
  return [
    ...cloneSources("primary_source"),
    ...cloneSources("macro_calendar"),
  ];
}

export function fetchMarketContext() {
  return cloneSources("market_context");
}

export function fetchMockDiscoverySources(): EventSource[] {
  return [
    ...fetchBroadNewsSources(),
    ...fetchFinancialNewsSources(),
    ...fetchPrimarySourceItems(),
    ...fetchMarketContext(),
  ];
}
