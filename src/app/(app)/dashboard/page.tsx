import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import {
  Badge,
  DataRow,
  MetricCard,
  Notice,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
} from "@/components/edge-terminal";
import { Button } from "@/components/ui/button";
import {
  acceptCandidate,
  analyzeCandidate,
  ignoreCandidate,
  markAdviceTaken,
  mergeCandidate,
  rejectAdvice,
  refreshAdviceTracking,
  startAdviceRun,
} from "@/lib/edge-terminal/actions";
import { getTerminalData } from "@/lib/edge-terminal/data";
import { rankTopCandidates } from "@/lib/edge-terminal/discovery-scoring";
import { formatMoney, formatPercent, getDashboardMetrics, getRiskGuardrails } from "@/lib/edge-terminal/metrics";
import { getRuntimeStatus } from "@/lib/env";
import type { CandidateStatus, EventCandidate } from "@/lib/edge-terminal/types";

type DashboardPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

const statusTone: Record<CandidateStatus, "cyan" | "green" | "amber" | "blue" | "default"> = {
  new: "cyan",
  accepted: "green",
  ignored: "amber",
  merged: "blue",
  analyzed: "green",
};

function impactTone(candidate: EventCandidate) {
  if (candidate.impactLevelGuess === "high" || candidate.impactDirectionGuess === "negative") {
    return "red" as const;
  }

  if (candidate.impactDirectionGuess === "positive") {
    return "green" as const;
  }

  return "amber" as const;
}

function asCostSummary(value: Record<string, unknown> | null | undefined) {
  return {
    totalTokens: Number(value?.totalTokens ?? 0),
    totalCostEur: Number(value?.totalCostEur ?? 0),
    providerFailures: Array.isArray(value?.providerFailures) ? value.providerFailures as Array<Record<string, unknown>> : [],
  };
}

function euro(value: number) {
  return value > 0 ? `EUR ${value.toFixed(4)}` : "EUR 0";
}

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const data = await getTerminalData();
  const runtime = getRuntimeStatus();
  const metrics = getDashboardMetrics(data);
  const guardrails = getRiskGuardrails(data);
  const latestRun = data.latestDiscoveryRun;
  const runCost = asCostSummary(latestRun?.costSummary as Record<string, unknown> | null | undefined);
  const runCandidates = latestRun
    ? data.eventCandidates.filter((candidate) => candidate.discoveryRunId === latestRun.id)
    : data.eventCandidates;
  const topCandidates = rankTopCandidates(runCandidates, 10);
  const latestAdvices = data.advices
    .filter((advice) => advice.discoveryRunId === latestRun?.id)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const trackingByAdviceId = new Map(data.adviceTracking.map((tracking) => [tracking.adviceId, tracking]));
  const activeAdvices = data.advices.filter((advice) => advice.status === "active");
  const analyzedCount = data.pipelineStepRuns.filter(
    (step) => step.discoveryRunId === latestRun?.id && step.stepName === "analyze_event" && step.status === "completed",
  ).length;
  const marketContextItems = data.eventSources
    .filter((source) => source.discoveryRunId === latestRun?.id)
    .filter((source) => source.topics.includes("unexplained_move") || source.topics.includes("trading_halt_context"))
    .sort((a, b) => Date.parse(b.publishedAt ?? b.fetchedAt) - Date.parse(a.publishedAt ?? a.fetchedAt))
    .slice(0, 8);
  const avgSourceQuality =
    topCandidates.length > 0
      ? Math.round(
          topCandidates.reduce((sum, candidate) => sum + candidate.sourceQualityScore, 0) /
            topCandidates.length,
        )
      : 0;
  const dedupeClusters = new Set(topCandidates.map((candidate) => candidate.dedupeKey)).size;
  const riskAlerts = data.riskReviews.filter((review) => review.riskScore >= 65);

  return (
    <div>
      <Notice message={params.notice} />
      <PageHeader title="Advice Dashboard" eyebrow="Manual EU/US runs, source-backed advice, Robin decides">
        <Badge tone={runtime.mode === "local" ? "cyan" : data.isDemoMode ? "amber" : "green"}>
          {runtime.label}
        </Badge>
        <Badge tone={latestRun?.status === "completed" ? "green" : latestRun?.status === "failed" ? "red" : "amber"}>
          {latestRun?.status ?? "not started"}
        </Badge>
        {guardrails.paperOnly ? <Badge tone="red">paper only</Badge> : null}
      </PageHeader>

      <Panel className="mb-4">
        <PanelHeader title="Risk Guardrails">
          <Badge tone={guardrails.status === "ok" ? "green" : guardrails.paperOnly ? "red" : "amber"}>
            {guardrails.status}
          </Badge>
        </PanelHeader>
        <PanelBody className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs text-muted-foreground">Open positions</div>
              <div className="mt-1 font-mono text-xl font-semibold">{guardrails.openPositionCount}/{guardrails.maxOpenPositions}</div>
              <div className="mt-1 text-xs text-muted-foreground">Taken active advice</div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs text-muted-foreground">Open exposure</div>
              <div className="mt-1 font-mono text-xl font-semibold">EUR {formatMoney(guardrails.openExposureEur)}</div>
              <div className="mt-1 text-xs text-muted-foreground">Capital EUR {formatMoney(guardrails.tradingCapitalEur)}</div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs text-muted-foreground">30d drawdown</div>
              <div className="mt-1 font-mono text-xl font-semibold">{formatPercent(guardrails.drawdownPct)}</div>
              <div className="mt-1 text-xs text-muted-foreground">Taken closed advice</div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs text-muted-foreground">Losing streak</div>
              <div className="mt-1 font-mono text-xl font-semibold">{guardrails.losingStreak}</div>
              <div className="mt-1 text-xs text-muted-foreground">Trigger at 5</div>
            </div>
          </div>
          {guardrails.paperOnly ? (
            <div className="rounded-md border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">
              Circuit breaker active: keep new advice paper only for two weeks, then restart at half size.
            </div>
          ) : null}
          {guardrails.warnings.map((warning) => (
            <div key={warning} className="rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
              {warning}
            </div>
          ))}
        </PanelBody>
      </Panel>

      <Panel className="mb-4">
        <PanelHeader title="Advice Run">
          <Badge tone="cyan">{latestRun?.runProfile ?? "mock"}</Badge>
        </PanelHeader>
        <PanelBody className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid gap-2 md:grid-cols-4">
              {[
                ["Run", latestRun?.status ?? "none", latestRun ? new Date(latestRun.completedAt ?? latestRun.startedAt).toLocaleString("nl-NL") : "Start a run"],
                ["Sources", latestRun?.sourceCount ?? 0, `${latestRun?.candidateCount ?? 0} candidates`],
                ["Analyzed", analyzedCount, `${latestAdvices.length} advice cards`],
                ["Cost", euro(runCost.totalCostEur), `${runCost.totalTokens} tokens`],
              ].map(([label, value, detail]) => (
                <div key={String(label)} className="rounded-md border border-border bg-background p-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-1 font-mono text-xl font-semibold">{value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap content-start gap-2">
              <form action={startAdviceRun}>
                <input type="hidden" name="run_profile" value="eu_open" />
                <Button type="submit">Start EU run</Button>
              </form>
              <form action={startAdviceRun}>
                <input type="hidden" name="run_profile" value="us_open" />
                <Button type="submit" variant="secondary">Start US run</Button>
              </form>
              <form action={refreshAdviceTracking}>
                <input type="hidden" name="next" value="/dashboard" />
                <Button type="submit" variant="secondary">Refresh tracking</Button>
              </form>
            </div>
          </div>
          {runCost.providerFailures.length > 0 || latestRun?.errorMessage ? (
            <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
              {latestRun?.errorMessage ?? `Provider warning: ${runCost.providerFailures.map((failure) => failure.provider).join(", ")}`}
            </div>
          ) : null}
          <div className="grid gap-3 xl:grid-cols-2">
            {latestAdvices.slice(0, 5).map((advice) => (
              <div key={advice.id} className="rounded-md border border-border bg-background p-4">
                {(() => {
                  const tracking = trackingByAdviceId.get(advice.id);

                  return (
                    <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-sm">#{advice.rank} {advice.ticker}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{advice.eventType} / {advice.market.toUpperCase()}</div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {guardrails.paperOnly ? <Badge tone="red">paper only</Badge> : null}
                    {advice.takenByUser ? <Badge tone="green">taken</Badge> : null}
                    <Badge tone={advice.direction === "short" ? "red" : "green"}>{advice.direction}</Badge>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
                  <div><span className="text-muted-foreground">Entry</span><br />{advice.entryZoneLow}-{advice.entryZoneHigh}</div>
                  <div><span className="text-muted-foreground">Stop</span><br />{advice.stopLoss}</div>
                  <div><span className="text-muted-foreground">Target</span><br />{advice.target}</div>
                  <div><span className="text-muted-foreground">Horizon</span><br />{advice.horizonDays}d</div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{advice.reasoning}</p>
                <p className="mt-2 text-sm text-amber-100/80">Counter: {advice.counterargument}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Confidence {advice.confidence}</span>
                  <span>Cost ratio {advice.costHurdleRatio ?? "n/a"}</span>
                  <span>Size EUR {advice.sizeSuggestionEur}</span>
                </div>
                <div className="mt-3 grid gap-2 rounded border border-border bg-black/10 p-2 text-xs md:grid-cols-4">
                  <span>Last {tracking?.lastPrice ?? "n/a"}</span>
                  <span>D1 {tracking?.d1Return ?? "n/a"}%</span>
                  <span>D3 {tracking?.d3Return ?? "n/a"}%</span>
                  <span>D5 {tracking?.d5Return ?? "n/a"}%</span>
                </div>
                {advice.sourceRefs[0]?.url ? (
                  <Link href={advice.sourceRefs[0].url} className="mt-2 inline-block text-xs text-cyan-100 underline underline-offset-4">
                    {advice.sourceRefs[0].title}
                  </Link>
                ) : null}
                {advice.correlationWarning ? (
                  <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-200">
                    {advice.correlationWarning}
                  </div>
                ) : null}
                {advice.direction === "short" ? (
                  <div className="mt-2 rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-100">
                    Gap: {advice.gapRiskNote ?? "gap risk must be reviewed"} / Squeeze: {advice.squeezeRiskNote ?? "squeeze risk must be reviewed"}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/advices/${advice.id}`}>Open</Link>
                  </Button>
                  <form action={markAdviceTaken} className="flex flex-wrap gap-2">
                    <input type="hidden" name="advice_id" value={advice.id} />
                    <input
                      name="entry_price"
                      defaultValue={advice.userEntryPrice ?? ""}
                      className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm"
                      placeholder="Entry"
                    />
                    <Button type="submit" size="sm">Taken</Button>
                  </form>
                  <form action={rejectAdvice}>
                    <input type="hidden" name="advice_id" value={advice.id} />
                    <input type="hidden" name="rejected_reason" value="Rejected from dashboard" />
                    <Button type="submit" size="sm" variant="ghost">Reject</Button>
                  </form>
                </div>
                    </>
                  );
                })()}
              </div>
            ))}
            {latestAdvices.length === 0 ? (
              <div className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
                <div className="font-semibold text-foreground">No advice today</div>
                <p className="mt-1">{latestRun?.errorMessage ?? data.dailyBriefing.conclusion ?? "No run stored yet."}</p>
                <p className="mt-2 text-xs">The pipeline is allowed to return zero advices when source proof, setup, risk or cost gates do not clear.</p>
              </div>
            ) : null}
          </div>
        </PanelBody>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Active advices" value={activeAdvices.length} detail={`${latestAdvices.length} from latest run`} tone="cyan" />
        <MetricCard label="Avg source quality" value={avgSourceQuality} detail={`${topCandidates.filter((candidate) => candidate.sourceQualityScore < 60).length} weak-source candidates`} tone="green" />
        <MetricCard label="Dedupe clusters" value={dedupeClusters} detail={`${Math.max(0, topCandidates.length - dedupeClusters)} duplicate candidates reduced`} tone="blue" />
        <MetricCard label="Mover context" value={marketContextItems.length} detail="not candidates without source proof" tone="amber" />
        <MetricCard label="Open tracked advice" value={metrics.openCount} detail={`${riskAlerts.length} risk alerts`} tone={riskAlerts.length > 0 ? "amber" : "green"} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel>
          <PanelHeader title="Top 10 Candidate Events">
            <Badge tone="cyan">Candidate quality</Badge>
          </PanelHeader>
          <div className="divide-y divide-border">
            {topCandidates.map((candidate, index) => (
              <div
                key={candidate.id}
                className="grid gap-3 px-4 py-3 md:grid-cols-[64px_minmax(0,1fr)_112px_220px]"
              >
                <span className="font-mono text-sm text-muted-foreground">#{index + 1}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="truncate">{candidate.title}</strong>
                    <Badge tone={statusTone[candidate.candidateStatus]}>{candidate.candidateStatus}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{candidate.reasonToWatch}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{candidate.affectedSymbols.join(", ") || "macro"}</span>
                    <span>Source {candidate.sourceQualityScore}</span>
                    <span>Recency {candidate.recencyScore}</span>
                    {candidate.mergeHint ? <span>Merge hint</span> : null}
                  </div>
                </div>
                <div className="grid gap-1 text-sm">
                  <Badge tone={impactTone(candidate)}>{candidate.impactDirectionGuess}</Badge>
                  <span className="font-mono">CQ {candidate.candidateQualityScore}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={analyzeCandidate}>
                    <input type="hidden" name="candidate_id" value={candidate.id} />
                    <Button type="submit" size="sm" variant="secondary">Analyze</Button>
                  </form>
                  <form action={acceptCandidate}>
                    <input type="hidden" name="candidate_id" value={candidate.id} />
                    <Button type="submit" size="sm">Accept</Button>
                  </form>
                  <form action={mergeCandidate}>
                    <input type="hidden" name="candidate_id" value={candidate.id} />
                    <Button type="submit" size="sm" variant="ghost">Merge</Button>
                  </form>
                  <form action={ignoreCandidate}>
                    <input type="hidden" name="candidate_id" value={candidate.id} />
                    <input type="hidden" name="ignore_reason" value="Not enough edge or source proof" />
                    <Button type="submit" size="sm" variant="ghost">Ignore</Button>
                  </form>
                </div>
              </div>
            ))}
            {topCandidates.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted-foreground">
                No candidates yet. Start an EU or US advice run to generate the top 10.
              </div>
            ) : null}
          </div>
        </Panel>

        <div className="grid gap-4">
          <Panel>
            <PanelHeader title="Discovery Status">
              <Badge tone={latestRun?.status === "completed" ? "green" : latestRun?.status === "failed" ? "red" : "amber"}>
                {latestRun?.status ?? "not started"}
              </Badge>
            </PanelHeader>
            <PanelBody>
              <DataRow label="Last scan" value={latestRun ? new Date(latestRun.startedAt).toLocaleString("nl-NL") : "n/a"} />
              <DataRow label="Provider" value={latestRun?.provider ?? "mock"} />
              <DataRow label="Sources" value={latestRun?.sourceCount ?? 0} />
              <DataRow label="Candidates" value={latestRun?.candidateCount ?? 0} />
              <DataRow label="Scan hint" value={latestRun?.contextHints?.text ? "active" : "empty"} />
              <DataRow label="Error" value={latestRun?.errorMessage ?? "none"} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Mover Context">
              <Badge tone="amber">{marketContextItems.length} items</Badge>
            </PanelHeader>
            <PanelBody className="space-y-2">
              {marketContextItems.map((source) => (
                <div key={source.id} className="rounded-md border border-border bg-background p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm">{source.symbols.join(", ") || "MARKET"}</span>
                    <Badge tone={source.topics.includes("trading_halt_context") ? "red" : "amber"}>
                      {source.topics.includes("trading_halt_context") ? "halt" : "move"}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{source.title}</div>
                </div>
              ))}
              {marketContextItems.length === 0 ? (
                <div className="text-sm text-muted-foreground">No unexplained movers or halts in the latest run.</div>
              ) : null}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Daily Briefing">
              <Badge tone="amber">Summary</Badge>
            </PanelHeader>
            <PanelBody className="space-y-3">
              <p className="text-sm text-muted-foreground">{data.dailyBriefing.marketSummary}</p>
              {data.dailyBriefing.keyEvents.slice(0, 3).map((item, index) => (
                <div key={`${index}-${item}`} className="rounded-md border border-border bg-background p-3 text-sm">
                  {item}
                </div>
              ))}
              <Button asChild variant="secondary" size="sm">
                <Link href="/briefing">
                  Full briefing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Open Risk">
              <Badge tone={riskAlerts.length > 0 ? "red" : "green"}>{riskAlerts.length} alerts</Badge>
            </PanelHeader>
            <PanelBody>
              {riskAlerts.map((risk) => (
                <DataRow
                  key={risk.id}
                  label={risk.counterargument}
                  value={<Badge tone="red">{risk.riskScore}/100</Badge>}
                />
              ))}
              {riskAlerts.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldAlert className="h-4 w-4" />
                  No high-risk reviews yet.
                </div>
              ) : null}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
