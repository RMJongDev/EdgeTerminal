import Link from "next/link";
import { Radar } from "lucide-react";
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
import { createMarketEvent } from "@/lib/edge-terminal/actions";
import { getTerminalData } from "@/lib/edge-terminal/data";
import { formatPercent } from "@/lib/edge-terminal/metrics";

type EventsPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const data = await getTerminalData();

  return (
    <div>
      <Notice message={params.notice} />
      <PageHeader title="Event Radar" eyebrow="Manual events first, Gemini research-ready">
        <Badge tone="amber">{data.events.filter((event) => event.analysisStatus !== "analyzed").length} need analysis</Badge>
        <Badge tone="cyan">{data.events.length} events</Badge>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Panel>
          <PanelHeader title="Market events">
            <Radar className="h-4 w-4 text-cyan-100" />
          </PanelHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3">Time</th>
                  <th className="p-3">Asset</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Impact</th>
                  <th className="p-3">Move</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((event) => (
                  <tr key={event.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono">{new Date(event.occurredAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="p-3 font-mono">{event.linkedTickers.join(", ") || "n/a"}</td>
                    <td className="p-3">
                      <Link href={`/events/${event.id}`} className="font-medium hover:text-cyan-100">{event.title}</Link>
                      <div className="mt-1 truncate text-xs text-muted-foreground">{event.summary}</div>
                    </td>
                    <td className="p-3"><Badge tone={event.eventType === "perception" ? "amber" : "blue"}>{event.eventType}</Badge></td>
                    <td className="p-3"><Badge tone={event.impactLevel === "high" ? "red" : "amber"}>{event.impactLevel}</Badge></td>
                    <td className="p-3 font-mono">{formatPercent(event.priceMovePercent)}</td>
                    <td className="p-3"><Badge tone={event.analysisStatus === "analyzed" ? "cyan" : "amber"}>{event.analysisStatus}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="New event" />
          <PanelBody>
            <form action={createMarketEvent} className="grid gap-3">
              <Field label="Linked asset">
                <select name="asset_id" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {data.assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.ticker} - {asset.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Title"><Input name="title" placeholder="Ferrari launch receives negative reaction" required /></Field>
              <Field label="Summary"><Input name="summary" placeholder="What happened and why it matters" /></Field>
              <Field label="Source"><Input name="source" placeholder="URL or manual note" /></Field>
              <Field label="Occurred at"><Input name="occurred_at" type="datetime-local" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <select name="event_type" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="perception">Perception</option>
                    <option value="earnings">Earnings</option>
                    <option value="guidance">Guidance</option>
                    <option value="macro">Macro</option>
                    <option value="sector">Sector</option>
                    <option value="competitor">Competitor</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Impact">
                  <select name="impact_level" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Direction">
                  <select name="impact_direction" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="negative">Negative</option>
                    <option value="positive">Positive</option>
                    <option value="mixed">Mixed</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </Field>
                <Field label="Price move %"><Input name="price_move_percent" type="number" step="0.1" placeholder="-6.8" /></Field>
              </div>
              <Button type="submit">Save event</Button>
            </form>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
