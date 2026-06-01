import { Badge, PageHeader, Panel, PanelBody, PanelHeader } from "@/components/edge-terminal";
import { getTerminalData } from "@/lib/edge-terminal/data";

export const dynamic = "force-dynamic";

export default async function BriefingPage() {
  const data = await getTerminalData();
  const briefing = data.dailyBriefing;

  return (
    <div>
      <PageHeader title="Daily Market Briefing" eyebrow={briefing.briefingDate}>
        <Badge tone="amber">Do nothing warning included</Badge>
        <Badge tone={data.isDemoMode ? "amber" : "green"}>{data.isDemoMode ? "Demo" : "Live"}</Badge>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel>
          <PanelHeader title="Briefing detail" />
          <PanelBody className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Market summary</h2>
              <p className="mt-1 text-sm text-muted-foreground">{briefing.marketSummary}</p>
            </div>
            <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-3">
              <h2 className="text-sm font-semibold text-amber-100">Do nothing</h2>
              <p className="mt-1 text-sm text-amber-100/80">{briefing.doNothingWarning}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Conclusion</h2>
              <p className="mt-1 text-sm text-muted-foreground">{briefing.conclusion}</p>
            </div>
          </PanelBody>
        </Panel>

        <div className="grid gap-4">
          {[
            ["Key events", briefing.keyEvents],
            ["Possible setups", briefing.possibleSetups],
            ["Key risks", briefing.keyRisks],
            ["Open trades", briefing.openTrades],
          ].map(([title, items]) => (
            <Panel key={title as string}>
              <PanelHeader title={title as string} />
              <PanelBody className="space-y-2">
                {(items as string[]).map((item) => (
                  <div key={item} className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                    {item}
                  </div>
                ))}
              </PanelBody>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}
