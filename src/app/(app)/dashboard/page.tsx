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
  mergeCandidate,
  startDailyScan,
} from "@/lib/edge-terminal/actions";
import { getTerminalData } from "@/lib/edge-terminal/data";
import { rankTopCandidates } from "@/lib/edge-terminal/discovery-scoring";
import { getDashboardMetrics } from "@/lib/edge-terminal/metrics";
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

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const data = await getTerminalData();
  const metrics = getDashboardMetrics(data);
  const latestRun = data.latestDiscoveryRun;
  const topCandidates = rankTopCandidates(data.eventCandidates, 10);
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
      <PageHeader title="Candidate Quality Command" eyebrow="Manual daily scan, broad discovery, paper trades only">
        <Badge tone={data.isDemoMode ? "amber" : "green"}>
          {data.isDemoMode ? "Demo data" : "Live Supabase"}
        </Badge>
        <Badge tone="cyan">Top 10 candidates</Badge>
      </PageHeader>

      <Panel className="mb-4">
        <PanelHeader title="Start daily scan">
          <Badge tone="blue">Optional scan hint</Badge>
        </PanelHeader>
        <PanelBody>
          <form action={startDailyScan} className="grid gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="text-xs text-muted-foreground">Waar heb je vandaag gevoel bij?</span>
              <textarea
                name="scan_hint"
                defaultValue={latestRun?.contextHints?.text ?? ""}
                className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Bijv. RACE launch backlash, NVDA exportregels, renteverlaging, olievoorraad, crypto ETF inflows"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <label className="grid gap-1.5 text-sm">
                <span className="text-xs text-muted-foreground">Gebruik als</span>
                <select name="scan_hint_mode" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="ranking_boost">Ranking boost</option>
                  <option value="extra_source_query">Extra source query</option>
                  <option value="watch_only_note">Watch-only note</option>
                </select>
              </label>
              <div className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                Leeg starten is prima. Een hint geeft extra context, maar sluit brede marktdekking niet uit.
              </div>
              <Button type="submit">Start daily scan</Button>
            </div>
          </form>
        </PanelBody>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Top candidates" value={topCandidates.length} detail={`${latestRun?.sourceCount ?? 0} source items scanned`} tone="cyan" />
        <MetricCard label="Avg source quality" value={avgSourceQuality} detail={`${topCandidates.filter((candidate) => candidate.sourceQualityScore < 60).length} weak-source candidates`} tone="green" />
        <MetricCard label="Dedupe clusters" value={dedupeClusters} detail={`${Math.max(0, topCandidates.length - dedupeClusters)} duplicate candidates reduced`} tone="blue" />
        <MetricCard label="Open paper trades" value={metrics.openCount} detail={`${riskAlerts.length} risk alerts`} tone={riskAlerts.length > 0 ? "amber" : "green"} />
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
                No candidates yet. Start a daily scan to generate the top 10.
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
            <PanelHeader title="Daily Briefing">
              <Badge tone="amber">Summary</Badge>
            </PanelHeader>
            <PanelBody className="space-y-3">
              <p className="text-sm text-muted-foreground">{data.dailyBriefing.marketSummary}</p>
              {data.dailyBriefing.keyEvents.slice(0, 3).map((item) => (
                <div key={item} className="rounded-md border border-border bg-background p-3 text-sm">
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
