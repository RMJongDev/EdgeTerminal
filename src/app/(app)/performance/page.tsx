import { Badge, DataRow, MetricCard, PageHeader, Panel, PanelBody, PanelHeader } from "@/components/edge-terminal";
import { getTerminalData } from "@/lib/edge-terminal/data";
import {
  formatMoney,
  formatPercent,
  getAdvicePerformance,
  type AdvicePerformanceSegment,
} from "@/lib/edge-terminal/metrics";

export const dynamic = "force-dynamic";

function qualityTone(quality: AdvicePerformanceSegment["labelQuality"]) {
  if (quality === "promising") return "green" as const;
  if (quality === "avoid") return "red" as const;
  if (quality === "mixed") return "amber" as const;
  return "blue" as const;
}

function SegmentPanel({ title, rows }: { title: string; rows: AdvicePerformanceSegment[] }) {
  return (
    <Panel>
      <PanelHeader title={title} />
      <PanelBody className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-md border border-border bg-background p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{row.label}</span>
              <Badge tone={qualityTone(row.labelQuality)}>
                {row.sampleWarning ? "n < 30" : row.labelQuality}
              </Badge>
            </div>
            <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <span>{row.closedCount}/{row.count} closed</span>
              <span>Winrate {row.winRate}%</span>
              <span>Exp {formatPercent(row.expectancyAfterCosts)}</span>
            </div>
          </div>
        ))}
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No advice data yet.</p> : null}
      </PanelBody>
    </Panel>
  );
}

export default async function PerformancePage() {
  const data = await getTerminalData();
  const performance = getAdvicePerformance(data);
  const { summary, segments } = performance;

  return (
    <div>
      <PageHeader title="Performance Lab" eyebrow="Measure advice quality after costs">
        <Badge tone="cyan">{summary.closedCount} closed outcomes</Badge>
        <Badge tone={(summary.expectancyAfterCosts ?? 0) >= 0 ? "green" : "red"}>
          {formatPercent(summary.expectancyAfterCosts)} expectancy
        </Badge>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="All advices" value={summary.totalCount} detail={`${summary.openCount} open`} tone="cyan" />
        <MetricCard label="Closed outcomes" value={summary.closedCount} detail="stop, target or expiry" tone="blue" />
        <MetricCard label="Winrate" value={`${summary.winRate}%`} detail="after tracking close" tone="green" />
        <MetricCard
          label="Expectancy after costs"
          value={formatPercent(summary.expectancyAfterCosts)}
          detail="net per advice"
          tone={(summary.expectancyAfterCosts ?? 0) >= 0 ? "green" : "red"}
        />
        <MetricCard label="Taken by Robin" value={summary.takenCount} detail={`${summary.rejectedCount} rejected`} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SegmentPanel title="By Direction" rows={segments.direction} />
            <SegmentPanel title="By Event Type" rows={segments.eventType} />
            <SegmentPanel title="By Run Profile" rows={segments.runProfile} />
            <SegmentPanel title="By Confidence Band" rows={segments.confidenceBand} />
            <SegmentPanel title="By Market" rows={segments.market} />
            <SegmentPanel title="Taken vs All" rows={segments.takenVsAll} />
          </div>

          <Panel>
            <PanelHeader title="Monthly Cost vs Return" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="p-3">Month</th>
                    <th className="p-3">Advices</th>
                    <th className="p-3">Estimated cost</th>
                    <th className="p-3">Gross return</th>
                    <th className="p-3">Net return</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.monthly.map((row) => (
                    <tr key={row.month} className="border-b border-border last:border-0">
                      <td className="p-3 font-mono">{row.month}</td>
                      <td className="p-3">{row.count}</td>
                      <td className="p-3 font-mono">EUR {formatMoney(row.costEur)}</td>
                      <td className="p-3 font-mono">EUR {formatMoney(row.grossReturnEur)}</td>
                      <td className="p-3 font-mono">EUR {formatMoney(row.netReturnEur)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {performance.monthly.length === 0 ? (
              <PanelBody>
                <p className="text-sm text-muted-foreground">No monthly advice data yet.</p>
              </PanelBody>
            ) : null}
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel>
            <PanelHeader title="Scale Gates" />
            <PanelBody>
              {performance.scaleGates.map((gate) => (
                <DataRow
                  key={gate.label}
                  label={gate.label}
                  value={<Badge tone={gate.passed ? "green" : "amber"}>{gate.detail}</Badge>}
                />
              ))}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Calibration Labels" />
            <PanelBody>
              <DataRow label="Best advice" value={summary.bestAdvice?.ticker ?? "n/a"} />
              <DataRow label="Worst advice" value={summary.worstAdvice?.ticker ?? "n/a"} />
              <DataRow label="Taken expectancy" value={formatPercent(summary.takenExpectancyAfterCosts)} />
              <p className="mt-3 text-sm text-muted-foreground">
                Segment labels remain indicative until there are at least 30 closed outcomes. Advice Detail uses a stricter 20 comparable-outcome threshold.
              </p>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
