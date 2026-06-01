import {
  Badge,
  Field,
  Notice,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
} from "@/components/edge-terminal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPaperTrade, generateRiskReview } from "@/lib/edge-terminal/actions";
import { getTerminalData } from "@/lib/edge-terminal/data";

type SignalsPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export default async function SignalsPage({ searchParams }: SignalsPageProps) {
  const params = await searchParams;
  const data = await getTerminalData();
  const selectedSetup = data.setups[0];

  return (
    <div>
      <Notice message={params.notice} />
      <PageHeader title="Signal Desk" eyebrow="Every setup is a hypothesis">
        <Badge tone="cyan">{data.setups.length} hypotheses</Badge>
        <Badge tone="blue">No trade is valid</Badge>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel>
          <PanelHeader title="Setup candidates" />
          <div className="divide-y divide-border">
            {data.setups.map((setup) => (
              <div key={setup.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{setup.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{setup.rationale}</p>
                  </div>
                  <Badge tone={setup.direction === "short" ? "red" : setup.direction === "long" ? "green" : "blue"}>
                    {setup.direction}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="amber">Confidence {setup.confidenceScore}</Badge>
                  <Badge>{setup.status}</Badge>
                  <Badge tone="cyan">{setup.strategy}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <div><strong className="text-foreground">Entry:</strong> {setup.entryLogic}</div>
                  <div><strong className="text-foreground">Invalidation:</strong> {setup.invalidation}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-4">
          <Panel>
            <PanelHeader title="Generate risk review" />
            <PanelBody>
              {selectedSetup ? (
                <form action={generateRiskReview} className="grid gap-3">
                  <input type="hidden" name="setup_id" value={selectedSetup.id} />
                  <p className="text-sm text-muted-foreground">
                    Attack selected setup: <strong className="text-foreground">{selectedSetup.title}</strong>
                  </p>
                  <Button type="submit">Generate risk review</Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">No setups yet.</p>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Create paper trade" />
            <PanelBody>
              {selectedSetup ? (
                <form action={createPaperTrade} className="grid gap-3">
                  <input type="hidden" name="setup_id" value={selectedSetup.id} />
                  <input type="hidden" name="asset_id" value={selectedSetup.assetId} />
                  <input type="hidden" name="asset_ticker" value={selectedSetup.assetTicker} />
                  <input type="hidden" name="direction" value={selectedSetup.direction} />
                  <Field label="Asset"><Input value={selectedSetup.assetTicker} readOnly /></Field>
                  <Field label="Entry price"><Input name="entry_price" type="number" step="0.01" placeholder="382.20" required /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Stop-loss"><Input name="stop_loss" type="number" step="0.01" /></Field>
                    <Field label="Target"><Input name="target_price" type="number" step="0.01" /></Field>
                  </div>
                  <Field label="Notes"><Input name="notes" placeholder="Paper trade only" /></Field>
                  <Button type="submit" disabled={selectedSetup.direction === "no_trade"}>
                    Create paper trade
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">No approved setup selected.</p>
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
