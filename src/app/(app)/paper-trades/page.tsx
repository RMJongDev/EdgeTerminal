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
import { closePaperTrade } from "@/lib/edge-terminal/actions";
import { getTerminalData } from "@/lib/edge-terminal/data";
import { formatMoney, formatPercent } from "@/lib/edge-terminal/metrics";

type PaperTradesPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export default async function PaperTradesPage({ searchParams }: PaperTradesPageProps) {
  const params = await searchParams;
  const data = await getTerminalData();
  const openTrades = data.paperTrades.filter((trade) => trade.status === "open");
  const closedTrades = data.paperTrades.filter((trade) => trade.status !== "open");
  const selectedTrade = openTrades[0];

  return (
    <div>
      <Notice message={params.notice} />
      <PageHeader title="Paper Trades" eyebrow="Fictional trades for measuring research quality">
        <Badge tone="cyan">{openTrades.length} open</Badge>
        <Badge tone="green">{closedTrades.length} closed</Badge>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Panel>
          <PanelHeader title="Open and closed trades" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3">Asset</th>
                  <th className="p-3">Direction</th>
                  <th className="p-3">Entry</th>
                  <th className="p-3">Stop</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">P/L</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Review</th>
                </tr>
              </thead>
              <tbody>
                {data.paperTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono">{trade.assetTicker}</td>
                    <td className="p-3"><Badge tone={trade.direction === "short" ? "red" : "green"}>{trade.direction}</Badge></td>
                    <td className="p-3 font-mono">{formatMoney(trade.entryPrice)}</td>
                    <td className="p-3 font-mono">{formatMoney(trade.stopLoss)}</td>
                    <td className="p-3 font-mono">{formatMoney(trade.targetPrice)}</td>
                    <td className="p-3 font-mono">{formatPercent(trade.resultPercent)}</td>
                    <td className="p-3"><Badge tone={trade.status === "open" ? "amber" : "green"}>{trade.status}</Badge></td>
                    <td className="max-w-[260px] truncate p-3 text-muted-foreground">{trade.hypothesisReview ?? trade.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Close selected trade" />
          <PanelBody>
            {selectedTrade ? (
              <form action={closePaperTrade} className="grid gap-3">
                <input type="hidden" name="trade_id" value={selectedTrade.id} />
                <Field label="Asset"><Input value={selectedTrade.assetTicker} readOnly /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Exit price"><Input name="exit_price" type="number" step="0.01" required /></Field>
                  <Field label="Result %"><Input name="result_percent" type="number" step="0.01" required /></Field>
                </div>
                <Field label="Close reason">
                  <select name="close_reason" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="manual_close">Manual close</option>
                    <option value="target_hit">Target hit</option>
                    <option value="stop_loss_hit">Stop-loss hit</option>
                    <option value="hypothesis_invalidated">Hypothesis invalidated</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </Field>
                <Field label="Hypothesis review">
                  <Input name="hypothesis_review" placeholder="Did the original thesis hold?" />
                </Field>
                <Button type="submit">Save result</Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">No open paper trades to close.</p>
            )}
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
