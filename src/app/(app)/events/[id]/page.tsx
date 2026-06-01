import { Badge, DataRow, Notice, PageHeader, Panel, PanelBody, PanelHeader } from "@/components/edge-terminal";
import { Button } from "@/components/ui/button";
import { generateEventAnalysis, generateSetup } from "@/lib/edge-terminal/actions";
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
  const primaryAsset = assets[0];

  return (
    <div>
      <Notice message={query.notice} />
      <PageHeader title={event.title} eyebrow={event.linkedTickers.join(", ") || "Market event"}>
        <Badge tone={event.impactDirection === "negative" ? "red" : "green"}>{event.impactDirection}</Badge>
        <Badge tone={event.eventType === "perception" ? "amber" : "blue"}>{event.eventType}</Badge>
        <Badge tone="cyan">Paper trade only</Badge>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          <Panel>
            <PanelHeader title="Event Analysis">
              <form action={generateEventAnalysis}>
                <input type="hidden" name="event_id" value={event.id} />
                <Button size="sm" type="submit">Generate analysis</Button>
              </form>
            </PanelHeader>
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
                <p className="text-sm text-muted-foreground">No analysis yet. Generate a mock/OpenAI-ready analysis from this event.</p>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Linked setups">
              {primaryAsset ? (
                <form action={generateSetup}>
                  <input type="hidden" name="event_id" value={event.id} />
                  <input type="hidden" name="asset_id" value={primaryAsset.id} />
                  <input type="hidden" name="asset_ticker" value={primaryAsset.ticker} />
                  <Button size="sm" type="submit">Generate setup</Button>
                </form>
              ) : null}
            </PanelHeader>
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
              {setups.length === 0 ? <p className="text-sm text-muted-foreground">No setup generated yet.</p> : null}
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
              <DataRow label="Gemini research" value={<Badge tone="amber">placeholder</Badge>} />
              <DataRow label="OpenAI analysis" value={<Badge tone={analysis ? "green" : "amber"}>{analysis ? "ready" : "pending"}</Badge>} />
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
