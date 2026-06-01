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
import { getTerminalData } from "@/lib/edge-terminal/data";
import { formatPercent, getDashboardMetrics } from "@/lib/edge-terminal/metrics";

type DashboardPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const data = await getTerminalData();
  const metrics = getDashboardMetrics(data);
  const perceptionEvents = data.events.filter((event) => event.eventType === "perception");
  const riskAlerts = data.riskReviews.filter((review) => review.riskScore >= 65);

  return (
    <div>
      <Notice message={params.notice} />
      <PageHeader title="Daily Market Command" eyebrow="VS equities, EU equities and ETF watchlist">
        <Badge tone={data.isDemoMode ? "amber" : "green"}>
          {data.isDemoMode ? "Demo data" : "Live Supabase"}
        </Badge>
        <Badge tone="cyan">Paper trades only</Badge>
        <Button asChild size="sm">
          <Link href="/events">New event</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Relevant events" value={metrics.relevantEvents} detail={`${metrics.perceptionEvents} perception events`} tone="cyan" />
        <MetricCard label="Possible setups" value={metrics.possibleSetups} detail={`${metrics.pendingRiskReviews} risk reviews pending`} tone="amber" />
        <MetricCard label="Open paper trades" value={metrics.openCount} detail={`${metrics.closedCount} closed`} />
        <MetricCard label="Closed winrate" value={`${metrics.winRate}%`} detail={`${formatPercent(metrics.averageResult)} avg result`} tone="green" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <Panel>
            <PanelHeader title="Narrative & Sentiment Movers">
              <Badge tone="amber">Perception events</Badge>
            </PanelHeader>
            <div className="divide-y divide-border">
              {perceptionEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="grid gap-2 px-4 py-3 hover:bg-secondary/30 md:grid-cols-[80px_minmax(0,1fr)_120px_80px]"
                >
                  <span className="font-mono text-sm">{event.linkedTickers.join(", ")}</span>
                  <span>
                    <span className="block font-medium">{event.title}</span>
                    <span className="block truncate text-sm text-muted-foreground">{event.summary}</span>
                  </span>
                  <Badge tone={event.impactDirection === "negative" ? "red" : "amber"}>
                    {event.impactDirection}
                  </Badge>
                  <span className="font-mono text-sm">{formatPercent(event.priceMovePercent)}</span>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="High Priority Event Flow">
              <Badge tone="cyan">Research cycle</Badge>
            </PanelHeader>
            <PanelBody className="grid gap-3 md:grid-cols-5">
              {["Event", "Analysis", "Setup", "Risk Review", "Paper Trade"].map((step, index) => (
                <div key={step} className="rounded-md border border-border bg-background p-3">
                  <div className="font-mono text-xs text-muted-foreground">0{index + 1}</div>
                  <div className="mt-1 font-medium">{step}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {index === 0 ? "RACE perception event" : index === 4 ? "Awaiting close" : "Prepared"}
                  </div>
                </div>
              ))}
            </PanelBody>
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel>
            <PanelHeader title="Daily Briefing">
              <Badge tone="amber">Caution</Badge>
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
