import { calculateCandidateQualityScore } from "../../discovery-scoring.ts";
import type { EventCandidate, EventSource } from "../../types.ts";

type CandidateCluster = {
  key: string;
  candidates: EventCandidate[];
  sourceIds: Set<string>;
  rawPayloadRefs: Set<string>;
  titleTokens: Set<string>;
  symbols: Set<string>;
  publishedAt: number | null;
  exactKeys: Set<string>;
};

const stopWords = new Set([
  "after",
  "amid",
  "and",
  "are",
  "for",
  "from",
  "into",
  "its",
  "new",
  "the",
  "with",
]);

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !stopWords.has(token));
}

function titleTokens(value: string) {
  return new Set(tokenize(value));
}

function jaccard(left: Set<string>, right: Set<string>) {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) {
      intersection += 1;
    }
  }

  return intersection / (left.size + right.size - intersection);
}

function sourceById(sources: EventSource[]) {
  return new Map(sources.map((source) => [source.id, source]));
}

function sourceExactKeys(candidate: EventCandidate, sources: Map<string, EventSource>) {
  const keys = new Set<string>();

  for (const sourceId of candidate.sourceIds) {
    const source = sources.get(sourceId);

    if (!source) {
      continue;
    }

    if (source.providerItemId) {
      keys.add(`provider:${source.provider}:${source.providerItemId}`);
    }

    if (source.sourceUrl) {
      keys.add(`url:${source.sourceUrl.trim().toLowerCase().replace(/#.*$/, "")}`);
    }
  }

  for (const ref of candidate.rawPayloadRefs) {
    keys.add(`ref:${ref}`);
  }

  return keys;
}

function sourcePublishedAt(candidate: EventCandidate, sources: Map<string, EventSource>) {
  const timestamps = candidate.sourceIds
    .map((sourceId) => sources.get(sourceId)?.publishedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value))
    .filter(Number.isFinite);

  return timestamps.length > 0 ? Math.min(...timestamps) : Date.parse(candidate.createdAt);
}

function sharesSymbol(left: Set<string>, right: Set<string>) {
  for (const symbol of left) {
    if (right.has(symbol)) {
      return true;
    }
  }

  return false;
}

function fuzzyMatches(cluster: CandidateCluster, candidate: EventCandidate, candidateTokens: Set<string>, publishedAt: number | null) {
  if (!sharesSymbol(cluster.symbols, new Set(candidate.affectedSymbols))) {
    return false;
  }

  const similarity = jaccard(cluster.titleTokens, candidateTokens);
  const timeDiffHours =
    publishedAt !== null && cluster.publishedAt !== null
      ? Math.abs(publishedAt - cluster.publishedAt) / 3_600_000
      : 0;

  return similarity >= 0.45 && timeDiffHours <= 12;
}

function exactMatches(cluster: CandidateCluster, keys: Set<string>) {
  for (const key of keys) {
    if (cluster.exactKeys.has(key)) {
      return true;
    }
  }

  return false;
}

function mergeCluster(cluster: CandidateCluster): EventCandidate {
  const best = cluster.candidates
    .slice()
    .sort((left, right) => right.candidateQualityScore - left.candidateQualityScore || right.recencyScore - left.recencyScore)[0];
  const dedupeConfidence = cluster.candidates.length > 1 ? 94 : best.scoreBreakdown.dedupeConfidence;
  const sourceQuality = Math.round(
    cluster.candidates.reduce((sum, candidate) => sum + candidate.sourceQualityScore, 0) / cluster.candidates.length,
  );
  const scoreBreakdown = {
    ...best.scoreBreakdown,
    sourceQuality,
    dedupeConfidence,
  };

  return {
    ...best,
    sourceIds: Array.from(cluster.sourceIds),
    rawPayloadRefs: Array.from(cluster.rawPayloadRefs),
    sourceQualityScore: sourceQuality,
    dedupeKey: cluster.key,
    mergeHint:
      cluster.candidates.length > 1
        ? `Clustered ${cluster.candidates.length} related source items into one filter candidate.`
        : best.mergeHint,
    scoreBreakdown,
    candidateQualityScore: calculateCandidateQualityScore(scoreBreakdown),
  };
}

export function dedupeAndClusterCandidates(candidates: EventCandidate[], sources: EventSource[]) {
  const sourcesById = sourceById(sources);
  const clusters: CandidateCluster[] = [];

  for (const candidate of candidates) {
    const tokens = titleTokens(`${candidate.title} ${candidate.summary}`);
    const exactKeys = sourceExactKeys(candidate, sourcesById);
    const publishedAt = sourcePublishedAt(candidate, sourcesById);
    let cluster = clusters.find((item) => exactMatches(item, exactKeys));

    if (!cluster) {
      cluster = clusters.find((item) => fuzzyMatches(item, candidate, tokens, publishedAt));
    }

    if (!cluster) {
      cluster = {
        key: candidate.dedupeKey || `cluster-${clusters.length + 1}`,
        candidates: [],
        sourceIds: new Set(),
        rawPayloadRefs: new Set(),
        titleTokens: tokens,
        symbols: new Set(candidate.affectedSymbols),
        publishedAt: Number.isFinite(publishedAt) ? publishedAt : null,
        exactKeys,
      };
      clusters.push(cluster);
    }

    cluster.candidates.push(candidate);
    candidate.sourceIds.forEach((sourceId) => cluster.sourceIds.add(sourceId));
    candidate.rawPayloadRefs.forEach((ref) => cluster.rawPayloadRefs.add(ref));
    candidate.affectedSymbols.forEach((symbol) => cluster.symbols.add(symbol));
    exactKeys.forEach((key) => cluster.exactKeys.add(key));
    tokens.forEach((token) => cluster.titleTokens.add(token));
  }

  return clusters.map(mergeCluster).sort((left, right) => {
    if (right.candidateQualityScore !== left.candidateQualityScore) {
      return right.candidateQualityScore - left.candidateQualityScore;
    }

    return right.recencyScore - left.recencyScore;
  });
}
