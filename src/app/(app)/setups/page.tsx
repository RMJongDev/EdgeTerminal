import Link from "next/link";
import {
  Badge,
  DataRow,
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

type SetupsPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export default async function SetupsPage({ searchParams }: SetupsPageProps) {
  const params = await searchParams;
  const data = await getTerminalData();
  const riskBySetupId = new Map(data.riskReviews.map((review) => [review.setupId, review]));
  const pendingSetups = data.setups.filter((setup) => !riskBySetupId.has(setup.id));
  const highRiskReviews = data.riskReviews.filter((review) => review.riskScore >= 65);
  const actionableSetup =
    data.setups.find((setup) => setup.direction !== "no_trade" && riskBySetupId.get(setup.id)?.finalVerdict === "paper_trade_ok") ??
    data.setups.find((setup) => setup.direction !== "no_trade");

  return (
    <div>
      <Notice message={params.notice} />
      <PageHeader title="Setups & Risk" eyebrow="Hypotheses, counterarguments and paper-trade readiness">
        <Badge tone="cyan">{data.setups.length} hypotheses</Badge>
        <Badge tone="amber">{pendingSetups.length} pending review</Badge>
        <Badge tone={highRiskReviews.length > 0 ? "red" : "green"}>{highRiskReviews.length} high risk</Badge>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
        <Panel>
          <PanelHeader title="Setup board">
            <Badge tone="blue">No trade is valid by default</Badge>
          </PanelHeader>
          <div className="divide-y divide-border">
            {data.setups.map((setup) => {
              const review = riskBySetupId.get(setup.id);

              return (
                <div key={setup.id} className="grid gap-4 p-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold">{setup.title}</h2>
                          <Link href={`/events/${setup.eventId}`} className="text-xs text-cyan-100 hover:underline">
                            Event detail
                          </Link>
                        </div>
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
                      <Badge tone={review ? "green" : "amber"}>{review ? "risk reviewed" : "risk pending"}</Badge>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <div>
                        <strong className="text-foreground">Entry:</strong> {setup.entryLogic}
                      </div>
                      <div>
                        <strong className="text-foreground">Invalidation:</strong> {setup.invalidation}
                      </div>
                      <div>
                        <strong className="text-foreground">Stop:</strong> {setup.stopLoss ?? "n/a"}
                      </div>
                      <div>
                        <strong className="text-foreground">Target:</strong> {setup.target ?? "n/a"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-background p-3">
                    {review ? (
                      <div className="grid gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">Risk review</span>
                          <Badge tone={review.finalVerdict === "skip" ? "red" : review.finalVerdict === "wait" ? "amber" : "green"}>
                            {review.finalVerdict}
                          </Badge>
                        </div>
                        <DataRow label="Risk score" value={<Badge tone={review.riskScore >= 65 ? "red" : "amber"}>{review.riskScore}/100</Badge>} />
                        <DataRow label="Counterargument" value={review.counterargument} />
                        <DataRow label="Reason to skip" value={review.reasonToSkip} />
                      </div>
                    ) : (
                      <form action={generateRiskReview} className="grid gap-3">
                        <input type="hidden" name="setup_id" value={setup.id} />
                        <div>
                          <div className="font-medium">Risk review pending</div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Attack this setup before creating a paper trade.
                          </p>
                        </div>
                        <Button size="sm" type="submit">Generate review</Button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}

            {data.setups.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No setups yet. Generate one from an event detail page.
              </div>
            ) : null}
          </div>
        </Panel>

        <div className="grid gap-4 content-start">
          <Panel>
            <PanelHeader title="Review queue" />
            <PanelBody className="grid gap-3">
              {pendingSetups.map((setup) => (
                <form key={setup.id} action={generateRiskReview} className="rounded-md border border-border bg-background p-3">
                  <input type="hidden" name="setup_id" value={setup.id} />
                  <div className="font-medium">{setup.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{setup.rationale}</p>
                  <Button className="mt-3" size="sm" type="submit">Generate review</Button>
                </form>
              ))}
              {pendingSetups.length === 0 ? (
                <p className="text-sm text-muted-foreground">All setups have a risk review.</p>
              ) : null}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Create paper trade" />
            <PanelBody>
              {actionableSetup ? (
                <form action={createPaperTrade} className="grid gap-3">
                  <input type="hidden" name="setup_id" value={actionableSetup.id} />
                  <input type="hidden" name="asset_id" value={actionableSetup.assetId} />
                  <input type="hidden" name="asset_ticker" value={actionableSetup.assetTicker} />
                  <input type="hidden" name="direction" value={actionableSetup.direction} />
                  <Field label="Setup"><Input value={actionableSetup.title} readOnly /></Field>
                  <Field label="Asset"><Input value={actionableSetup.assetTicker} readOnly /></Field>
                  <Field label="Entry price"><Input name="entry_price" type="number" step="0.01" placeholder="382.20" required /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Stop-loss"><Input name="stop_loss" type="number" step="0.01" /></Field>
                    <Field label="Target"><Input name="target_price" type="number" step="0.01" /></Field>
                  </div>
                  <Field label="Notes"><Input name="notes" placeholder="Paper trade only" /></Field>
                  <Button type="submit">Create paper trade</Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">No actionable long/short setup available.</p>
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
