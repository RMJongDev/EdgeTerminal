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
import {
  acceptCandidate,
  analyzeCandidate,
  createMarketEvent,
  ignoreCandidate,
  mergeCandidate,
  startDailyScan,
} from "@/lib/edge-terminal/actions";
import { getTerminalData } from "@/lib/edge-terminal/data";
import type { CandidateStatus, EventCandidate } from "@/lib/edge-terminal/types";

type EventsPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

const statusTone: Record<CandidateStatus, "cyan" | "green" | "amber" | "blue" | "default"> = {
  new: "cyan",
  accepted: "green",
  ignored: "amber",
  merged: "blue",
  analyzed: "green",
};

function impactTone(candidate: EventCandidate) {
  if (candidate.impactLevelGuess === "high" || candidate.impactDirectionGuess === "negative") {
    return "red" as const;
  }

  if (candidate.impactDirectionGuess === "positive") {
    return "green" as const;
  }

  return "amber" as const;
}

export const dynamic = "force-dynamic";

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const data = await getTerminalData();
  const candidates = data.eventCandidates
    .slice()
    .sort((left, right) => right.candidateQualityScore - left.candidateQualityScore);
  const sourceById = new Map(data.eventSources.map((source) => [source.id, source]));
  const candidatesByStatus = {
    new: candidates.filter((candidate) => candidate.candidateStatus === "new").length,
    accepted: candidates.filter((candidate) => candidate.candidateStatus === "accepted").length,
    ignored: candidates.filter((candidate) => candidate.candidateStatus === "ignored").length,
    merged: candidates.filter((candidate) => candidate.candidateStatus === "merged").length,
    analyzed: candidates.filter((candidate) => candidate.candidateStatus === "analyzed").length,
  };

  return (
    <div>
      <Notice message={params.notice} />
      <PageHeader title="Event Radar" eyebrow="Candidate triage, source proof and accepted market events">
        <Badge tone="cyan">{candidates.length} candidates</Badge>
        <Badge tone="green">{candidatesByStatus.accepted + candidatesByStatus.analyzed} promoted</Badge>
        <form action={startDailyScan}>
          <Button size="sm" type="submit">Start daily scan</Button>
        </form>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel>
          <PanelHeader title="Candidate Event List">
            <Radar className="h-4 w-4 text-cyan-100" />
          </PanelHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Scores</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, index) => {
                  const primarySource = candidate.sourceIds
                    .map((sourceId) => sourceById.get(sourceId))
                    .find(Boolean);

                  return (
                    <tr key={candidate.id} className="border-b border-border align-top last:border-0">
                      <td className="p-3 font-mono text-muted-foreground">#{index + 1}</td>
                      <td className="max-w-[360px] p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{candidate.title}</span>
                          <Badge tone={impactTone(candidate)}>{candidate.impactDirectionGuess}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{candidate.reasonToWatch}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="font-mono">{candidate.affectedSymbols.join(", ") || "macro"}</span>
                          <span>{candidate.affectedMarkets.join(", ")}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>{primarySource?.sourceName ?? candidate.rawPayloadRefs[0] ?? "n/a"}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {primarySource?.sourceCategory ?? "source"} - SQ {candidate.sourceQualityScore}
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        <div>CQ {candidate.candidateQualityScore}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          R {candidate.relevanceScore} - Rec {candidate.recencyScore}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge tone={statusTone[candidate.candidateStatus]}>{candidate.candidateStatus}</Badge>
                        {candidate.mergeHint ? (
                          <div className="mt-2 text-xs text-muted-foreground">{candidate.mergeHint}</div>
                        ) : null}
                        {candidate.ignoreReason ? (
                          <div className="mt-2 text-xs text-muted-foreground">{candidate.ignoreReason}</div>
                        ) : null}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <form action={analyzeCandidate}>
                            <input type="hidden" name="candidate_id" value={candidate.id} />
                            <Button size="sm" variant="secondary" type="submit">Analyze</Button>
                          </form>
                          <form action={acceptCandidate}>
                            <input type="hidden" name="candidate_id" value={candidate.id} />
                            <Button size="sm" type="submit">Accept</Button>
                          </form>
                          <form action={mergeCandidate}>
                            <input type="hidden" name="candidate_id" value={candidate.id} />
                            <Button size="sm" variant="ghost" type="submit">Merge</Button>
                          </form>
                          <form action={ignoreCandidate}>
                            <input type="hidden" name="candidate_id" value={candidate.id} />
                            <input type="hidden" name="ignore_reason" value="Not enough edge or source proof" />
                            <Button size="sm" variant="ghost" type="submit">Ignore</Button>
                          </form>
                        </div>
                        {candidate.acceptedMarketEventId ? (
                          <Link className="mt-2 block text-xs text-cyan-100 hover:underline" href={`/events/${candidate.acceptedMarketEventId}`}>
                            Open accepted event
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {candidates.length === 0 ? (
            <PanelBody>
              <p className="text-sm text-muted-foreground">No candidates yet. Start a daily scan from Dashboard or Event Radar.</p>
            </PanelBody>
          ) : null}
        </Panel>

        <div className="grid gap-4">
          <Panel>
            <PanelHeader title="Triage Summary" />
            <PanelBody>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">New</span><span className="font-mono">{candidatesByStatus.new}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Accepted</span><span className="font-mono">{candidatesByStatus.accepted}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Analyzed</span><span className="font-mono">{candidatesByStatus.analyzed}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Merged</span><span className="font-mono">{candidatesByStatus.merged}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ignored</span><span className="font-mono">{candidatesByStatus.ignored}</span></div>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Source Coverage" />
            <PanelBody className="space-y-2">
              {["broad_news", "financial_feed", "primary_source", "macro_calendar", "market_context"].map((category) => (
                <div key={category} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{category}</span>
                  <span className="font-mono">{data.eventSources.filter((source) => source.sourceCategory === category).length}</span>
                </div>
              ))}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Manual correction fallback">
              <Badge tone="amber">Not primary</Badge>
            </PanelHeader>
            <PanelBody>
              <form action={createMarketEvent} className="grid gap-3">
                <Field label="Linked asset">
                  <select name="asset_id" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {data.assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>{asset.ticker} - {asset.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Title"><Input name="title" placeholder="Manual correction event" required /></Field>
                <Field label="Summary"><Input name="summary" placeholder="What happened and why it matters" /></Field>
                <Field label="Source"><Input name="source" placeholder="URL or manual note" /></Field>
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
                <Button type="submit" variant="secondary">Save manual event</Button>
              </form>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
