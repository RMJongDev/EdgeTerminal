import { calculateCandidateQualityScore } from "../../discovery-scoring.ts";
import type { Asset, EventCandidate, EventSource, EventType, ImpactDirection, ImpactLevel } from "../../types.ts";

type CandidateTemplate = {
  eventTypeGuess: EventType;
  impactDirectionGuess: ImpactDirection;
  impactLevelGuess: ImpactLevel;
  relevanceScore: number;
  confidenceScore: number;
  reasonToWatch: string;
  uncertaintyNotes: string;
};

type CreateCandidatesInput = {
  runId: string;
  sources: EventSource[];
  assets: Asset[];
  now: string;
  createId: (prefix: string) => string;
};

function isContextOnlySource(source: EventSource) {
  return source.topics.includes("unexplained_move") || source.topics.includes("trading_halt_context");
}

const templates: Record<string, CandidateTemplate> = {
  "RACE.MI": {
    eventTypeGuess: "perception",
    impactDirectionGuess: "negative",
    impactLevelGuess: "high",
    relevanceScore: 94,
    confidenceScore: 80,
    reasonToWatch:
      "Mover sweep found a sharp decliner with a concrete perception catalyst outside the MVP watchlist.",
    uncertaintyNotes:
      "The first reaction is already large; advice must avoid chasing and wait for a failed bounce or confirmation.",
  },
  ASML: {
    eventTypeGuess: "sector",
    impactDirectionGuess: "positive",
    impactLevelGuess: "medium",
    relevanceScore: 82,
    confidenceScore: 72,
    reasonToWatch:
      "Sector demand commentary may support post-event drift if chip equipment confirms relative strength.",
    uncertaintyNotes: "Supplier commentary may already be priced in and needs sector confirmation.",
  },
  NVDA: {
    eventTypeGuess: "legal",
    impactDirectionGuess: "negative",
    impactLevelGuess: "high",
    relevanceScore: 84,
    confidenceScore: 70,
    reasonToWatch:
      "Policy shock can pressure a crowded AI hardware name, but source details need confirmation.",
    uncertaintyNotes: "Policy headlines can reverse if the final scope is narrower than feared.",
  },
  SPY: {
    eventTypeGuess: "macro",
    impactDirectionGuess: "positive",
    impactLevelGuess: "medium",
    relevanceScore: 80,
    confidenceScore: 61,
    reasonToWatch:
      "Useful market context for risk appetite, but not specific enough for a standalone advice.",
    uncertaintyNotes: "ETF beta can hide event-specific edge.",
  },
  NKE: {
    eventTypeGuess: "sector",
    impactDirectionGuess: "negative",
    impactLevelGuess: "low",
    relevanceScore: 56,
    confidenceScore: 44,
    reasonToWatch:
      "Weak-source apparel read-through is worth monitoring only if a stronger source confirms it.",
    uncertaintyNotes: "Source quality is too low for a direct advice.",
  },
};

export function createCandidatesFromSources(input: CreateCandidatesInput): EventCandidate[] {
  return input.sources
    .filter((source) => !isContextOnlySource(source))
    .map((source) => {
      const ticker = source.symbols[0] ?? "MARKET";
      const template = templates[ticker] ?? templates.SPY;
      const watchedAsset = input.assets.find((asset) => asset.ticker === ticker);
      const sourceQualityScore = source.sourceQualityScore;
      const recencyScore = source.provider === "mock_mover_sweep" ? 96 : sourceQualityScore >= 80 ? 86 : 74;
      const marketContext = source.provider === "mock_mover_sweep" ? 92 : 76;
      const watchlistPreference = watchedAsset ? Math.max(4, 18 - watchedAsset.priority * 3) : 0;
      const uncertaintyPenalty = template.confidenceScore < 55 ? 24 : template.impactLevelGuess === "high" ? 8 : 12;
      const scoreBreakdown = {
        relevance: template.relevanceScore,
        sourceQuality: sourceQualityScore,
        recency: recencyScore,
        dedupeConfidence: 84,
        marketContext,
        watchlistPreference,
        scanHintFit: source.provider === "mock_mover_sweep" ? 20 : 0,
        uncertaintyPenalty,
      };

      return {
        id: input.createId("candidate"),
        discoveryRunId: input.runId,
        title: source.title,
        summary: source.snippet ?? source.title,
        reasonToWatch: template.reasonToWatch,
        affectedSymbols: source.symbols.length > 0 ? source.symbols : [ticker],
        affectedMarkets: ticker.includes(".") ? ["EU equities"] : ["US equities"],
        eventTypeGuess: template.eventTypeGuess,
        impactDirectionGuess: template.impactDirectionGuess,
        impactLevelGuess: template.impactLevelGuess,
        relevanceScore: template.relevanceScore,
        confidenceScore: template.confidenceScore,
        sourceQualityScore,
        recencyScore,
        candidateQualityScore: calculateCandidateQualityScore(scoreBreakdown),
        dedupeKey: `${ticker.toLowerCase()}-${template.eventTypeGuess}-${input.now.slice(0, 10)}`,
        mergeHint: sourceQualityScore < 60 ? "Needs stronger confirmation before analysis." : null,
        candidateStatus: "new",
        ignoreReason: null,
        acceptedMarketEventId: null,
        canonicalCandidateId: null,
        sourceIds: [source.id],
        rawPayloadRefs: source.rawPayloadRef ? [source.rawPayloadRef] : [],
        scoreBreakdown,
        uncertaintyNotes: template.uncertaintyNotes,
        createdAt: input.now,
        updatedAt: input.now,
      } satisfies EventCandidate;
    })
    .sort((a, b) => b.candidateQualityScore - a.candidateQualityScore);
}
