import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dedupeAndClusterCandidates } from "../../src/lib/edge-terminal/pipeline/steps/dedupe.ts";
import type { EventCandidate, EventSource } from "../../src/lib/edge-terminal/types.ts";

describe("pipeline dedupe and clustering", () => {
  it("clusters duplicate headlines from multiple sources into one filter candidate", () => {
    const now = "2026-06-13T08:00:00.000Z";
    const sources: EventSource[] = [
      createSource({
        id: "source-a",
        provider: "mock_news",
        providerItemId: "ferrari-launch-a",
        sourceUrl: "https://example.com/ferrari-launch-a",
        title: "Ferrari falls 7% after launch reaction turns negative",
        rawPayloadRef: "mock:source-a",
        now,
      }),
      createSource({
        id: "source-b",
        provider: "mock_wire",
        providerItemId: "ferrari-launch-b",
        sourceUrl: "https://example.com/ferrari-launch-b",
        title: "Ferrari shares fall after negative launch reaction",
        rawPayloadRef: "mock:source-b",
        now,
      }),
    ];
    const candidates = [
      createCandidate({
        id: "candidate-a",
        sourceId: "source-a",
        rawPayloadRef: "mock:source-a",
        title: sources[0].title,
        quality: 78,
        now,
      }),
      createCandidate({
        id: "candidate-b",
        sourceId: "source-b",
        rawPayloadRef: "mock:source-b",
        title: sources[1].title,
        quality: 74,
        now,
      }),
    ];

    const clustered = dedupeAndClusterCandidates(candidates, sources);

    assert.equal(clustered.length, 1);
    assert.deepEqual(clustered[0].sourceIds.sort(), ["source-a", "source-b"]);
    assert.deepEqual(clustered[0].rawPayloadRefs.sort(), ["mock:source-a", "mock:source-b"]);
    assert.match(clustered[0].mergeHint ?? "", /Clustered 2/);
    assert.equal(clustered[0].scoreBreakdown.dedupeConfidence, 94);
  });
});

function createSource(input: {
  id: string;
  provider: string;
  providerItemId: string;
  sourceUrl: string;
  title: string;
  rawPayloadRef: string;
  now: string;
}): EventSource {
  return {
    id: input.id,
    discoveryRunId: "run-dedupe-test",
    provider: input.provider,
    sourceCategory: "broad_news",
    providerItemId: input.providerItemId,
    sourceName: input.provider,
    sourceUrl: input.sourceUrl,
    publishedAt: input.now,
    fetchedAt: input.now,
    rawPayloadRef: input.rawPayloadRef,
    title: input.title,
    snippet: "Duplicate Ferrari launch reaction item.",
    symbols: ["RACE.MI"],
    topics: ["perception", "product_launch"],
    sourceQualityScore: 82,
  };
}

function createCandidate(input: {
  id: string;
  sourceId: string;
  rawPayloadRef: string;
  title: string;
  quality: number;
  now: string;
}): EventCandidate {
  return {
    id: input.id,
    discoveryRunId: "run-dedupe-test",
    title: input.title,
    summary: "Ferrari launch reaction turned negative across market media.",
    reasonToWatch: "Perception shock with confirmed price context.",
    affectedSymbols: ["RACE.MI"],
    affectedMarkets: ["EU equities"],
    eventTypeGuess: "perception",
    impactDirectionGuess: "negative",
    impactLevelGuess: "high",
    relevanceScore: 90,
    confidenceScore: 78,
    sourceQualityScore: 82,
    recencyScore: 92,
    candidateQualityScore: input.quality,
    dedupeKey: input.id,
    mergeHint: null,
    candidateStatus: "new",
    ignoreReason: null,
    acceptedMarketEventId: null,
    canonicalCandidateId: null,
    sourceIds: [input.sourceId],
    rawPayloadRefs: [input.rawPayloadRef],
    scoreBreakdown: {
      relevance: 90,
      sourceQuality: 82,
      recency: 92,
      dedupeConfidence: 70,
      marketContext: 88,
      watchlistPreference: 0,
      scanHintFit: 0,
      uncertaintyPenalty: 8,
    },
    uncertaintyNotes: "Synthetic duplicate item.",
    createdAt: input.now,
    updatedAt: input.now,
  };
}
