import Link from "next/link";
import { Badge, DataRow, Notice, PageHeader, Panel, PanelBody, PanelHeader } from "@/components/edge-terminal";
import { Button } from "@/components/ui/button";
import { markAdviceTaken, rejectAdvice } from "@/lib/edge-terminal/actions";
import { getTerminalData } from "@/lib/edge-terminal/data";
import { formatMoney, formatPercent, getCalibrationContext, getRiskGuardrails } from "@/lib/edge-terminal/metrics";

type AdviceDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdviceDetailPage({ params, searchParams }: AdviceDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const data = await getTerminalData();
  const advice = data.advices.find((item) => item.id === id) ?? data.advices[0];
  const candidate = data.eventCandidates.find((item) => item.id === advice?.candidateId);
  const event = data.events.find((item) => item.id === candidate?.acceptedMarketEventId);
  const analysis = data.analyses.find((item) => item.id === advice?.analysisId);
  const setup = data.setups.find((item) => item.id === advice?.setupId);
  const risk = data.riskReviews.find((item) => item.id === advice?.riskReviewId);
  const tracking = data.adviceTracking.find((item) => item.adviceId === advice?.id);
  const guardrails = getRiskGuardrails(data);
  const aiLogs = data.aiLogs.filter((log) =>
    log.scoreInputs?.candidateId === advice?.candidateId ||
    log.scoreInputs?.setupId === advice?.setupId ||
    log.scoreInputs?.riskReviewId === advice?.riskReviewId ||
    log.promptVersion === "advice-assembly-v1",
  );
  const calibration = advice ? getCalibrationContext(data, advice) : null;

  if (!advice) {
    return (
      <div>
        <PageHeader title="Advice not found" eyebrow="Advice detail" />
        <Panel>
          <PanelBody>
            <p className="text-sm text-muted-foreground">No advice is available yet. Start a run from the dashboard.</p>
          </PanelBody>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <Notice message={query.notice} />
      <PageHeader title={`${advice.ticker} ${advice.direction}`} eyebrow={`Rank #${advice.rank ?? "-"} / ${advice.runProfile}`}>
        <Badge tone={advice.direction === "short" ? "red" : "green"}>{advice.direction}</Badge>
        <Badge tone={advice.takenByUser ? "green" : "cyan"}>{advice.takenByUser ? "taken" : advice.status}</Badge>
        {guardrails.paperOnly ? <Badge tone="red">paper only</Badge> : null}
        <Badge tone="amber">not financial advice</Badge>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4">
          <Panel>
            <PanelHeader title="Advice" />
            <PanelBody className="space-y-4">
              <div className="grid gap-3 md:grid-cols-5">
                <DataRow label="Entry" value={`${advice.entryZoneLow}-${advice.entryZoneHigh}`} />
                <DataRow label="Stop" value={formatMoney(advice.stopLoss)} />
                <DataRow label="Target" value={formatMoney(advice.target)} />
                <DataRow label="Horizon" value={`${advice.horizonDays}d`} />
                <DataRow label="Size" value={`EUR ${advice.sizeSuggestionEur}`} />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Reasoning</h2>
                <p className="mt-1 text-sm text-muted-foreground">{advice.reasoning}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-border bg-background p-3">
                  <h2 className="text-sm font-semibold">Counterargument</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{advice.counterargument}</p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <h2 className="text-sm font-semibold">Invalidation</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{advice.invalidation}</p>
                </div>
              </div>
              {advice.sourceRefs.length > 0 ? (
                <div>
                  <h2 className="text-sm font-semibold">Sources</h2>
                  <div className="mt-2 grid gap-2">
                    {advice.sourceRefs.map((source) => (
                      <div key={`${source.sourceId}-${source.rawPayloadRef}`} className="rounded-md border border-border bg-background p-3 text-sm">
                        {source.url ? (
                          <Link href={source.url} className="text-cyan-100 underline underline-offset-4">
                            {source.title}
                          </Link>
                        ) : (
                          <span>{source.title}</span>
                        )}
                        <div className="mt-1 text-xs text-muted-foreground">{source.publishedAt ?? "publication time unknown"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Chain" />
            <PanelBody className="grid gap-3">
              <div className="rounded-md border border-border bg-background p-3">
                <h2 className="text-sm font-semibold">Event + Candidate</h2>
                <p className="mt-1 text-sm text-muted-foreground">{event?.summary ?? candidate?.summary ?? "No event context found."}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-border bg-background p-3">
                  <h2 className="text-sm font-semibold">Analysis</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{analysis?.summary ?? "No analysis linked."}</p>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <h2 className="text-sm font-semibold">Setup</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{setup?.entryLogic ?? "No setup linked."}</p>
                </div>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <h2 className="text-sm font-semibold">Risk Review</h2>
                <p className="mt-1 text-sm text-muted-foreground">{risk?.counterargument ?? advice.counterargument}</p>
              </div>
            </PanelBody>
          </Panel>
        </div>

        <div className="grid gap-4 content-start">
          <Panel>
            <PanelHeader title="Execution Gates" />
            <PanelBody>
              <DataRow label="Expected move" value={formatPercent(advice.expectedMovePct)} />
              <DataRow label="Cost estimate" value={formatPercent(advice.costEstimatePct)} />
              <DataRow label="Cost hurdle" value={advice.costHurdleRatio ?? "n/a"} />
              <DataRow label="Confidence" value={`${advice.confidence}/100`} />
              <DataRow label="Note" value={advice.executabilityNote ?? "n/a"} />
              {advice.correlationWarning ? (
                <div className="mt-3 rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                  {advice.correlationWarning}
                </div>
              ) : null}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Gap & Squeeze" />
            <PanelBody className="space-y-3">
              <p className="text-sm text-muted-foreground">{advice.gapRiskNote ?? "Gap risk not available."}</p>
              {advice.squeezeRiskNote ? <p className="text-sm text-red-100">{advice.squeezeRiskNote}</p> : null}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Tracking" />
            <PanelBody>
              <DataRow label="Reference entry" value={tracking ? formatMoney(tracking.referenceEntry) : "n/a"} />
              <DataRow label="D1" value={tracking ? formatPercent(tracking.d1Return) : "n/a"} />
              <DataRow label="D3" value={tracking ? formatPercent(tracking.d3Return) : "n/a"} />
              <DataRow label="D5" value={tracking ? formatPercent(tracking.d5Return) : "n/a"} />
              <DataRow label="Outcome" value={tracking?.outcome ?? "tracking"} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Actions" />
            <PanelBody className="space-y-3">
              <form action={markAdviceTaken} className="grid gap-2">
                <input type="hidden" name="advice_id" value={advice.id} />
                <input
                  name="entry_price"
                  defaultValue={advice.userEntryPrice ?? ""}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Actual entry price"
                />
                <Button type="submit">Mark taken</Button>
              </form>
              <form action={rejectAdvice}>
                <input type="hidden" name="advice_id" value={advice.id} />
                <input type="hidden" name="rejected_reason" value="Rejected from advice detail" />
                <Button type="submit" variant="secondary">Reject advice</Button>
              </form>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Calibration" />
            <PanelBody className="space-y-3">
              {calibration?.ready ? (
                <div className="space-y-2">
                  <DataRow label="Comparable outcomes" value={calibration.comparableCount} />
                  <DataRow label="Winrate" value={`${calibration.winRate}%`} />
                  <DataRow label="Expectancy after costs" value={formatPercent(calibration.expectancyAfterCosts)} />
                  <DataRow label="Label" value={<Badge tone={calibration.label === "promising" ? "green" : calibration.label === "avoid" ? "red" : "amber"}>{calibration.label}</Badge>} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not enough comparable outcomes yet ({calibration?.comparableCount ?? 0}/20). Global closed outcomes: {calibration?.globalClosedCount ?? 0}.
                </p>
              )}
              <div className="text-xs text-muted-foreground">
                AI logs: {aiLogs.map((log) => log.promptVersion).join(", ") || "none linked"}
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/ai-log">Open AI log</Link>
              </Button>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
