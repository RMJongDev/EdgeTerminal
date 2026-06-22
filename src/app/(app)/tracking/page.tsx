import Link from "next/link";
import { Badge, DataRow, Notice, PageHeader, Panel, PanelBody, PanelHeader } from "@/components/edge-terminal";
import { Button } from "@/components/ui/button";
import { markAdviceTaken, refreshAdviceTracking, rejectAdvice } from "@/lib/edge-terminal/actions";
import { getTerminalData } from "@/lib/edge-terminal/data";
import { formatMoney, formatPercent } from "@/lib/edge-terminal/metrics";

type TrackingPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export default async function TrackingPage({ searchParams }: TrackingPageProps) {
  const params = await searchParams;
  const data = await getTerminalData();
  const trackingByAdviceId = new Map(data.adviceTracking.map((tracking) => [tracking.adviceId, tracking]));
  const activeAdvices = data.advices.filter((advice) => advice.status === "active");
  const closedAdvices = data.advices.filter((advice) => advice.status !== "active" || trackingByAdviceId.get(advice.id)?.outcome);
  const takenCount = data.advices.filter((advice) => advice.takenByUser).length;

  return (
    <div>
      <Notice message={params.notice} />
      <PageHeader title="Tracking" eyebrow="Advice outcomes, taken marks and D1/D3/D5 checks">
        <Badge tone="cyan">{activeAdvices.length} active</Badge>
        <Badge tone="green">{takenCount} taken</Badge>
        <form action={refreshAdviceTracking}>
          <input type="hidden" name="next" value="/tracking" />
          <Button type="submit" size="sm">Refresh tracking</Button>
        </form>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel>
          <PanelHeader title="Open Advice Tracking" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3">Advice</th>
                  <th className="p-3">Entry</th>
                  <th className="p-3">Last</th>
                  <th className="p-3">D1</th>
                  <th className="p-3">D3</th>
                  <th className="p-3">D5</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeAdvices.map((advice) => {
                  const tracking = trackingByAdviceId.get(advice.id);

                  return (
                    <tr key={advice.id} className="border-b border-border align-top last:border-0">
                      <td className="p-3">
                        <Link href={`/advices/${advice.id}`} className="font-mono text-cyan-100 underline underline-offset-4">
                          #{advice.rank} {advice.ticker}
                        </Link>
                        <div className="mt-1 text-xs text-muted-foreground">{advice.direction} / {advice.eventType}</div>
                      </td>
                      <td className="p-3 font-mono">{formatMoney(tracking?.referenceEntry ?? advice.entryZoneLow)}</td>
                      <td className="p-3 font-mono">{formatMoney(tracking?.lastPrice ?? null)}</td>
                      <td className="p-3 font-mono">{formatPercent(tracking?.d1Return ?? null)}</td>
                      <td className="p-3 font-mono">{formatPercent(tracking?.d3Return ?? null)}</td>
                      <td className="p-3 font-mono">{formatPercent(tracking?.d5Return ?? null)}</td>
                      <td className="p-3">
                        <Badge tone={advice.takenByUser ? "green" : "amber"}>{advice.takenByUser ? "taken" : "watch"}</Badge>
                        {tracking?.outcome ? <div className="mt-2 text-xs text-muted-foreground">{tracking.outcome}</div> : null}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <form action={markAdviceTaken} className="flex flex-wrap gap-2">
                            <input type="hidden" name="advice_id" value={advice.id} />
                            <input
                              name="entry_price"
                              defaultValue={advice.userEntryPrice ?? ""}
                              className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm"
                              placeholder="Entry"
                            />
                            <Button type="submit" size="sm">Taken</Button>
                          </form>
                          <form action={rejectAdvice}>
                            <input type="hidden" name="advice_id" value={advice.id} />
                            <input type="hidden" name="rejected_reason" value="Rejected from tracking" />
                            <Button type="submit" size="sm" variant="ghost">Reject</Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {activeAdvices.length === 0 ? (
            <PanelBody>
              <p className="text-sm text-muted-foreground">No active advices. Start a run from the dashboard.</p>
            </PanelBody>
          ) : null}
        </Panel>

        <div className="grid gap-4 content-start">
          <Panel>
            <PanelHeader title="Tracking Summary" />
            <PanelBody>
              <DataRow label="All advices" value={data.advices.length} />
              <DataRow label="Active" value={activeAdvices.length} />
              <DataRow label="Taken by Robin" value={takenCount} />
              <DataRow label="Closed/rejected" value={closedAdvices.length} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Closed / Outcome" />
            <PanelBody className="space-y-2">
              {closedAdvices.slice(0, 8).map((advice) => {
                const tracking = trackingByAdviceId.get(advice.id);

                return (
                  <div key={advice.id} className="rounded-md border border-border bg-background p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono">{advice.ticker}</span>
                      <Badge tone={tracking?.outcome === "target" ? "green" : advice.status === "rejected_by_user" ? "amber" : "default"}>
                        {tracking?.outcome ?? advice.status}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Final {formatPercent(tracking?.finalReturn ?? null)} / last {formatMoney(tracking?.lastPrice ?? null)}
                    </div>
                  </div>
                );
              })}
              {closedAdvices.length === 0 ? <p className="text-sm text-muted-foreground">No closed advice outcomes yet.</p> : null}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
