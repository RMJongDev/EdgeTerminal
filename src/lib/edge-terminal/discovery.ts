import { demoEventCandidates } from "./demo-data";
import { fetchMockDiscoverySources } from "./discovery-providers";
import { applyScanHint, rankTopCandidates } from "./discovery-scoring";
import type { EventCandidate, EventSource, ScanContextHints, ScanHintMode } from "./types";

function extractSymbols(value: string) {
  const matches = value.match(/\b[A-Z]{2,5}\b/g) ?? [];
  return Array.from(new Set(matches));
}

function extractTopics(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((item) => item.length >= 4 && !extractSymbols(value).includes(item.toUpperCase()))
    .slice(0, 12);
}

export function createScanContextHints(text: string, mode: ScanHintMode = "ranking_boost"): ScanContextHints | null {
  const trimmed = text.trim();

  if (!trimmed) {
    return null;
  }

  return {
    text: trimmed,
    mode,
    symbols: extractSymbols(trimmed),
    topics: extractTopics(trimmed),
  };
}

export type MockDiscoveryResult = {
  sources: EventSource[];
  candidates: EventCandidate[];
};

export function buildMockDiscoveryResult(contextHints: ScanContextHints | null): MockDiscoveryResult {
  const sources = fetchMockDiscoverySources();
  const candidates = rankTopCandidates(
    demoEventCandidates.map((candidate) => applyScanHint(candidate, contextHints)),
    10,
  );

  return {
    sources,
    candidates,
  };
}
