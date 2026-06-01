import { Plus } from "lucide-react";
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
import { createAsset } from "@/lib/edge-terminal/actions";
import { getTerminalData } from "@/lib/edge-terminal/data";

type WatchlistPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export default async function WatchlistPage({ searchParams }: WatchlistPageProps) {
  const params = await searchParams;
  const data = await getTerminalData();

  return (
    <div>
      <Notice message={params.notice} />
      <PageHeader title="Watchlist" eyebrow="Assets followed by Edge Terminal">
        <Badge tone="cyan">US equities</Badge>
        <Badge tone="cyan">EU equities</Badge>
        <Badge tone="cyan">ETFs</Badge>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Panel>
          <PanelHeader title="Tracked assets">
            <Badge>{data.assets.length} assets</Badge>
          </PanelHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3">Ticker</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Sector</th>
                  <th className="p-3">Market</th>
                  <th className="p-3">Move</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.assets.map((asset) => (
                  <tr key={asset.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono">{asset.ticker}</td>
                    <td className="p-3">{asset.name}</td>
                    <td className="p-3"><Badge tone="blue">{asset.assetType.replace("_", " ")}</Badge></td>
                    <td className="p-3 text-muted-foreground">{asset.sector}</td>
                    <td className="p-3 text-muted-foreground">{asset.exchange}</td>
                    <td className="p-3 font-mono">{asset.lastMovePercent ? `${asset.lastMovePercent}%` : "n/a"}</td>
                    <td className="p-3"><Badge tone={asset.status === "active" ? "green" : "default"}>{asset.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Add asset">
            <Plus className="h-4 w-4 text-cyan-100" />
          </PanelHeader>
          <PanelBody>
            <form action={createAsset} className="grid gap-3">
              <Field label="Ticker"><Input name="ticker" placeholder="RACE" required /></Field>
              <Field label="Name"><Input name="name" placeholder="Ferrari N.V." required /></Field>
              <Field label="Asset type">
                <select name="asset_type" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="us_equity">US equity</option>
                  <option value="eu_equity">EU equity</option>
                  <option value="etf">ETF</option>
                </select>
              </Field>
              <Field label="Sector"><Input name="sector" placeholder="Luxury / Automotive" /></Field>
              <Field label="Exchange"><Input name="exchange" placeholder="NYSE / Milan" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Currency"><Input name="currency" placeholder="EUR" /></Field>
                <Field label="Country"><Input name="country" placeholder="Italy" /></Field>
              </div>
              <Field label="Priority"><Input name="priority" type="number" defaultValue="5" /></Field>
              <Field label="Notes"><Input name="notes" placeholder="Narrative-sensitive brand" /></Field>
              <Button type="submit">Save asset</Button>
            </form>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
