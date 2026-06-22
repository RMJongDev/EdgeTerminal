import { Badge, DataRow, Notice, PageHeader, Panel, PanelBody, PanelHeader } from "@/components/edge-terminal";
import { getEventDetail } from "@/lib/edge-terminal/data";
import { formatPercent } from "@/lib/edge-terminal/metrics";

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const { event, analysis, setups, assets } = await getEventDetail(id);

  return (
    <div>
      <Notice message={query.notice} />
      <PageHeader title={event.title} eyebrow={event.linkedTickers.join(", ") || "Market event"}>
        <Badge tone={event.impactDirection === "negative" ? "red" : "green"}>{event.impactDirection}</Badge>
        <Badge tone={event.eventType === "perception" ? "amber" : "blue"}>{event.eventType}</Badge>
        <Badge tone="cyan">source proof</Badge>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          <Panel>
            <PanelHeader title="Event Analysis" />
            <PanelBody className="space-y-4">
              <p className="text-sm text-muted-foreground">{event.summary}</p>
              {analysis ? (
                <>
                  <div>
                    <h3 className="text-sm font-semibold">Summary</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{analysis.summary}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-border bg-background p-3">
                      <h3 className="text-sm font-semibold">Bull case</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{analysis.bullCase}</p>
                    </div>
                    <div className="rounded-md border border-border bg-background p-3">
                      <h3 className="text-sm font-semibold">Bear case</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{analysis.bearCase}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No event-level analysis stored yet. The autonomous run writes candidate analysis to AI Log and advice detail.
                </p>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Linked setup history" />
            <PanelBody className="grid gap-3">
              {setups.map((setup) => (
                <div key={setup.id} className="rounded-md border border-border bg-background p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{setup.title}</strong>
                    <Badge tone={setup.direction === "short" ? "red" : setup.direction === "long" ? "green" : "blue"}>{setup.direction}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{setup.rationale}</p>
                </div>
              ))}
              {setups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No legacy setup rows are linked to this event. Current advice setup and risk output live on Advice Detail.
                </p>
              ) : null}
            </PanelBody>
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel>
            <PanelHeader title="Impact split" />
            <PanelBody>
              <DataRow label="Impact level" value={<Badge tone={event.impactLevel === "high" ? "red" : "amber"}>{event.impactLevel}</Badge>} />
              <DataRow label="Price move" value={<span className="font-mono">{formatPercent(event.priceMovePercent)}</span>} />
              <DataRow label="Fundamental impact" value={analysis?.fundamentalImpact ?? "n/a"} />
              <DataRow label="Sentiment impact" value={analysis?.sentimentImpact ?? "n/a"} />
              <DataRow label="Reversal chance" value={analysis?.reversalChance ?? "n/a"} />
              <DataRow label="Follow-through risk" value={analysis?.followThroughRisk ?? "n/a"} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Research sources" />
            <PanelBody>
              <DataRow label="Source" value={event.source ?? "Manual note"} />
              <DataRow label="Linked assets" value={assets.map((asset) => asset.ticker).join(", ") || "n/a"} />
              <DataRow label="Pipeline analysis" value={<Badge tone={analysis ? "green" : "amber"}>{analysis ? "stored" : "AI Log"}</Badge>} />
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
