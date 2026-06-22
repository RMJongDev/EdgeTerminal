import type {
  Advice,
  AdviceMarket,
  EventAnalysis,
  EventCandidate,
  EventSource,
  RiskReview,
  RunProfile,
  TradeSetup,
} from "../../types.ts";
import type { ExecutabilityCheck, NumericTradePlan } from "../types.ts";

type AdviceAssemblyItem = {
  candidate: EventCandidate;
  source: EventSource | null;
  analysis: EventAnalysis;
  setup: TradeSetup;
  riskReview: RiskReview;
  numericPlan: NumericTradePlan;
  executability: ExecutabilityCheck;
};

function marketForTicker(ticker: string, profile: RunProfile): AdviceMarket {
  if (profile === "eu_open" || ticker.includes(".")) {
    return "eu";
  }

  return "us";
}

function rankScore(item: AdviceAssemblyItem) {
  const riskPenalty = item.riskReview.riskScore * 0.35;
  const costPenalty = item.executability.costHurdleRatio * 30;

  return item.setup.confidenceScore * 0.5 + item.candidate.candidateQualityScore * 0.55 - riskPenalty - costPenalty;
}

function themeForItem(item: AdviceAssemblyItem) {
  return item.candidate.eventTypeGuess;
}

function activeOpenSameThemeCount(item: AdviceAssemblyItem, openAdvices: Advice[]) {
  const theme = themeForItem(item);

  return openAdvices.filter((advice) => advice.status === "active" && advice.takenByUser && advice.eventType === theme).length;
}

function rankedSameThemeCount(item: AdviceAssemblyItem, alreadyRanked: Advice[]) {
  const theme = themeForItem(item);

  return alreadyRanked.filter((advice) => advice.eventType === theme).length;
}

function correlationPenalty(item: AdviceAssemblyItem, openAdvices: Advice[]) {
  return activeOpenSameThemeCount(item, openAdvices) * 12;
}

function rankScoreWithOpenCorrelation(item: AdviceAssemblyItem, openAdvices: Advice[]) {
  return rankScore(item) - correlationPenalty(item, openAdvices);
}

function correlationWarning(input: {
  item: AdviceAssemblyItem;
  openAdvices: Advice[];
  alreadyRanked: Advice[];
}) {
  const openSameTheme = activeOpenSameThemeCount(input.item, input.openAdvices);
  const rankedSameTheme = rankedSameThemeCount(input.item, input.alreadyRanked);
  const totalSameTheme = openSameTheme + rankedSameTheme;

  if (totalSameTheme === 0) {
    return null;
  }

  return `Correlation warning: ${totalSameTheme} active or higher-ranked advice(s) already share the ${themeForItem(input.item)} theme. Treat this as adding to the same exposure, not as independent risk.`;
}

function hasSourceProof(item: AdviceAssemblyItem) {
  return Boolean(item.source?.sourceUrl && item.source.publishedAt);
}

export function assembleAdvices(input: {
  runId: string;
  profile: RunProfile;
  items: AdviceAssemblyItem[];
  openAdvices?: Advice[];
  now: string;
  createId: (prefix: string) => string;
}): { advices: Advice[]; noAdviceReason: string | null } {
  const openAdvices = input.openAdvices ?? [];
  const eligibleItems = input.items
    .filter((item) => item.executability.isExecutable && item.riskReview.finalVerdict !== "skip" && hasSourceProof(item))
    .sort((a, b) => rankScoreWithOpenCorrelation(b, openAdvices) - rankScoreWithOpenCorrelation(a, openAdvices));
  const advices: Advice[] = [];

  for (const item of eligibleItems) {
    if (advices.length >= 5) {
      break;
    }

      const ticker = item.setup.assetTicker;
      const isShort = item.setup.direction === "short";
      const warning = correlationWarning({ item, openAdvices, alreadyRanked: advices });
      const baseRankScore = rankScore(item);
      const openCorrelationPenalty = correlationPenalty(item, openAdvices);
      const higherRankedPenalty = rankedSameThemeCount(item, advices) * 8;

      advices.push({
        id: input.createId("advice"),
        discoveryRunId: input.runId,
        candidateId: item.candidate.id,
        analysisId: item.analysis.id,
        setupId: item.setup.id,
        riskReviewId: item.riskReview.id,
        assetId: item.setup.assetId === "external-asset" ? null : item.setup.assetId,
        ticker,
        direction: isShort ? "short" : "long",
        market: marketForTicker(ticker, input.profile),
        entryZoneLow: item.numericPlan.entryZoneLow,
        entryZoneHigh: item.numericPlan.entryZoneHigh,
        stopLoss: item.numericPlan.stopLoss,
        target: item.numericPlan.target,
        horizonDays: item.numericPlan.horizonDays,
        sizeSuggestionEur: item.executability.sizeSuggestionEur,
        confidence: item.setup.confidenceScore,
        rank: advices.length + 1,
        eventType: item.candidate.eventTypeGuess,
        runProfile: input.profile,
        reasoning: `${item.candidate.reasonToWatch} ${item.analysis.summary}`,
        counterargument: item.riskReview.counterargument,
        invalidation: item.setup.invalidation,
        sourceRefs: item.source
          ? [
              {
                title: item.source.title,
                url: item.source.sourceUrl,
                publishedAt: item.source.publishedAt,
                sourceId: item.source.id,
                rawPayloadRef: item.source.rawPayloadRef,
              },
            ]
          : [],
        executabilityNote: item.executability.note,
        expectedMovePct: item.executability.expectedMovePct,
        costEstimatePct: item.executability.costEstimatePct,
        costHurdleRatio: item.executability.costHurdleRatio,
        correlationWarning: warning,
        gapRiskNote:
          "Stops are not guaranteed around news. Size assumes extra slippage and the advice should be skipped if the opening gap removes the entry zone.",
        squeezeRiskNote: isShort
          ? "Short squeeze risk is explicit: use smaller size and skip if the bounce reclaims the event VWAP."
          : null,
        status: "active",
        takenByUser: false,
        userEntryPrice: null,
        userExitPrice: null,
        userNote: null,
        rejectedReason: null,
        metadata: {
          assemblyVersion: "advice-assembly-v1",
          rankScore: Math.round((baseRankScore - openCorrelationPenalty - higherRankedPenalty) * 100) / 100,
          baseRankScore: Math.round(baseRankScore * 100) / 100,
          correlationPenalty: openCorrelationPenalty + higherRankedPenalty,
          sourceQualityScore: item.candidate.sourceQualityScore,
        },
        createdAt: input.now,
        updatedAt: input.now,
      } satisfies Advice);
  }

  return {
    advices,
    noAdviceReason:
      advices.length > 0
        ? null
        : "No advice today: candidates failed the cost hurdle, risk gate, source proof, or direction clarity.",
  };
}
