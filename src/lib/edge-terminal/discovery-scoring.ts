import type { CandidateScoreBreakdown, EventCandidate, ScanContextHints } from "./types";

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateCandidateQualityScore(breakdown: CandidateScoreBreakdown) {
  return clampScore(
    breakdown.relevance * 0.24 +
      breakdown.sourceQuality * 0.18 +
      breakdown.recency * 0.16 +
      breakdown.dedupeConfidence * 0.12 +
      breakdown.marketContext * 0.14 +
      breakdown.watchlistPreference * 0.06 +
      breakdown.scanHintFit * 0.1 -
      breakdown.uncertaintyPenalty * 0.12,
  );
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((item) => item.length >= 3);
}

export function getScanHintFit(candidate: EventCandidate, contextHints: ScanContextHints | null) {
  if (!contextHints?.text.trim()) {
    return 0;
  }

  const hintText = contextHints.text.toLowerCase();
  const symbolFit = candidate.affectedSymbols.some((symbol) =>
    hintText.includes(symbol.toLowerCase()),
  )
    ? 24
    : 0;
  const topicFit = contextHints.topics.some((topic) =>
    [...candidate.affectedMarkets, candidate.eventTypeGuess, candidate.title, candidate.summary]
      .join(" ")
      .toLowerCase()
      .includes(topic.toLowerCase()),
  )
    ? 16
    : 0;
  const candidateTokens = new Set(
    tokenize(`${candidate.title} ${candidate.summary} ${candidate.reasonToWatch}`),
  );
  const textFit = Math.min(
    18,
    tokenize(contextHints.text).filter((token) => candidateTokens.has(token)).length * 6,
  );

  return clampScore(symbolFit + topicFit + textFit);
}

export function applyScanHint(candidate: EventCandidate, contextHints: ScanContextHints | null) {
  const scanHintFit = getScanHintFit(candidate, contextHints);
  const scoreBreakdown = {
    ...candidate.scoreBreakdown,
    scanHintFit,
  };

  return {
    ...candidate,
    scoreBreakdown,
    candidateQualityScore: calculateCandidateQualityScore(scoreBreakdown),
  };
}

export function rankTopCandidates(candidates: EventCandidate[], limit = 10) {
  const bestByDedupeKey = new Map<string, EventCandidate>();

  for (const candidate of candidates) {
    if (candidate.candidateStatus === "ignored" || candidate.candidateStatus === "merged") {
      continue;
    }

    const dedupeKey = candidate.dedupeKey || candidate.id;
    const existing = bestByDedupeKey.get(dedupeKey);

    if (!existing || candidate.candidateQualityScore > existing.candidateQualityScore) {
      bestByDedupeKey.set(dedupeKey, candidate);
    }
  }

  return [...bestByDedupeKey.values()]
    .sort((left, right) => {
      if (right.candidateQualityScore !== left.candidateQualityScore) {
        return right.candidateQualityScore - left.candidateQualityScore;
      }

      return right.recencyScore - left.recencyScore;
    })
    .slice(0, limit);
}
