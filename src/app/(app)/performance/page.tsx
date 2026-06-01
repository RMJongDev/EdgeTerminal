import { Badge, DataRow, MetricCard, PageHeader, Panel, PanelBody, PanelHeader } from "@/components/edge-terminal";
import { getTerminalData } from "@/lib/edge-terminal/data";
import {
  formatPercent,
  getDirectionPerformance,
  getPerformanceSummary,
} from "@/lib/edge-terminal/metrics";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const data = await getTerminalData();
  const summary = getPerformanceSummary(data.paperTrades);
  const directionPerformance = getDirectionPerformance(data.paperTrades);
  const confidenceBands = [
    { label: "80-100 confidence", value: "+1.9%", tone: "green" as const },
    { label: "60-79 confidence", value: "+0.7%", tone: "green" as const },
    { label: "40-59 confidence", value: "-0.3%", tone: "red" as const },
    { label: "No-trade avoided losses", value: "11", tone: "cyan" as const },
  ];

  return (
    <div>
      <PageHeader title="Performance Lab" eyebrow="Measure research quality, not just P/L">
        <Badge tone="cyan">{summary.closedCount} closed trades</Badge>
        <Badge tone="green">{formatPercent(summary.averageResult)} avg</Badge>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Closed paper trades" value={summary.closedCount} detail={`${summary.openCount} open`} />
        <MetricCard label="Winrate" value={`${summary.winRate}%`} detail="Closed trades only" tone="green" />
        <MetricCard label="Avg result" value={formatPercent(summary.averageResult)} detail="Paper trading result" tone={summary.averageResult >= 0 ? "green" : "red"} />
        <MetricCard label="Best trade" value={summary.bestTrade?.assetTicker ?? "n/a"} detail={formatPercent(summary.bestTrade?.resultPercent)} tone="cyan" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel>
          <PanelHeader title="Performance by direction" />
          <PanelBody>
            {directionPerformance.map((row) => (
              <DataRow
                key={row.direction}
                label={`${row.direction} (${row.count})`}
                value={<span className="font-mono">{formatPercent(row.average)}</span>}
              />
            ))}
          </PanelBody>
        </Panel>

        <div className="grid gap-4">
          <Panel>
            <PanelHeader title="Strategy quality" />
            <PanelBody>
              <DataRow label="Earnings revision long" value={<Badge tone="green">Good</Badge>} />
              <DataRow label="Perception short" value={<Badge tone="amber">Promising</Badge>} />
              <DataRow label="Opening gap chase" value={<Badge tone="red">Avoid</Badge>} />
              <DataRow label="ETF macro continuation" value={<Badge tone="amber">Mixed</Badge>} />
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader title="Confidence calibration" />
            <PanelBody>
              {confidenceBands.map((band) => (
                <DataRow key={band.label} label={band.label} value={<Badge tone={band.tone}>{band.value}</Badge>} />
              ))}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
