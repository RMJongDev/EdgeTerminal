import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, DataRow, PageHeader, Panel, PanelBody, PanelHeader } from "@/components/edge-terminal";
import { Button } from "@/components/ui/button";
import { getTerminalData } from "@/lib/edge-terminal/data";

export const dynamic = "force-dynamic";

const processSteps = [
  {
    id: "start-run",
    title: "1. Start run",
    route: "/dashboard",
    owner: "Advice Dashboard",
    output: "EU open of US open scan met budgetlimiet",
    detail:
      "Jij start de run of laat het schema draaien. Het systeem kiest het run-profiel, bewaakt kosten en houdt demo/local mode bruikbaar zonder externe database.",
  },
  {
    id: "source-funnel",
    title: "2. Source funnel",
    route: "/events",
    owner: "Event Radar",
    output: "Gestructureerde source items",
    detail:
      "Gratis bronnen, filings, RSS, macro-items, movers en markthalts komen samen in een bronlaag met snapshots, provenance en provider-metadata.",
  },
  {
    id: "filter-ranking",
    title: "3. Filter & ranking",
    route: "/events",
    owner: "Event Radar",
    output: "Deduped candidate list met reden per selectie",
    detail:
      "De pipeline dedupet bronitems, filtert ruis weg en rangschikt candidates op bronkwaliteit, recency, impact, liquiditeit en thesis-fit.",
  },
  {
    id: "analysis-chain",
    title: "4. Analysis chain",
    route: "/ai-log",
    owner: "AI Log",
    output: "Analysis, setup en risk review per candidate",
    detail:
      "OpenAI analyseert de beste candidates in drie stappen. Een 'none' setup of 'skip' risk verdict stopt de keten bewust voordat er een advies ontstaat.",
  },
  {
    id: "advice-assembly",
    title: "5. Advice assembly",
    route: "/dashboard",
    owner: "Advice Dashboard",
    output: "Top 5 expliciete adviezen of bewust geen advies",
    detail:
      "Alleen setups met entry, stop, target, bronbewijs en kostenhorde worden gerankt. Correlatie met open exposure verlaagt de score of blokkeert het advies.",
  },
  {
    id: "briefing",
    title: "6. Briefing",
    route: "/briefing",
    owner: "Briefing",
    output: "Korte besluitbriefing met do-nothing conclusie waar nodig",
    detail:
      "De run eindigt met een briefing die de topadviezen, blokkades, kosten en belangrijkste onzekerheden uitlegt in beslisbare taal.",
  },
  {
    id: "tracking",
    title: "7. Tracking",
    route: "/tracking",
    owner: "Tracking",
    output: "Taken/rejected adviezen met D1/D3/D5 vervolg",
    detail:
      "Robin beslist zelf. De app volgt elk advies en meet later of genomen en afgewezen ideeën waarde hadden, zonder ooit orders uit te voeren.",
  },
  {
    id: "performance",
    title: "8. Performance loop",
    route: "/performance",
    owner: "Performance Lab",
    output: "Feedback naar scoring en proces",
    detail:
      "Resultaten worden gebruikt om te leren welke bronnen, sectoren, eventtypes en adviestypen daadwerkelijk edge opleveren.",
  },
];

export default async function ProcessPage() {
  const data = await getTerminalData();
  const latestRun = data.latestDiscoveryRun;
  const topCandidate = data.eventCandidates
    .slice()
    .sort((left, right) => right.candidateQualityScore - left.candidateQualityScore)[0];

  return (
    <div>
      <PageHeader title="Process A-Z" eyebrow="Van autonome run tot performance feedback">
        <Badge tone="cyan">{processSteps.length} stappen</Badge>
        <Badge tone={latestRun?.status === "completed" ? "green" : "amber"}>
          {latestRun?.status ?? "not started"}
        </Badge>
      </PageHeader>

      <Panel className="mb-4">
        <PanelHeader title="Hoogover proces" />
        <PanelBody>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            {processSteps.map((step) => (
              <a
                key={step.id}
                href={`#${step.id}`}
                className="grid min-h-44 gap-3 rounded-md border border-border bg-background p-4 transition-colors hover:border-cyan-300/50 hover:bg-cyan-300/5"
              >
                <div>
                  <div className="text-xs text-muted-foreground">{step.owner}</div>
                  <h2 className="mt-1 text-base font-semibold">{step.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{step.output}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-xs text-cyan-100">
                  Detail bekijken
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </a>
            ))}
          </div>
        </PanelBody>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          {processSteps.map((step) => (
            <Panel key={step.id} id={step.id}>
              <PanelHeader title={step.title}>
                <Button asChild size="sm" variant="secondary">
                  <Link href={step.route}>
                    Open {step.owner}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </PanelHeader>
              <PanelBody className="space-y-3">
                <p className="text-sm text-muted-foreground">{step.detail}</p>
                <div className="grid gap-2 md:grid-cols-3">
                  <DataRow label="Waar" value={step.owner} />
                  <DataRow label="Route" value={<span className="font-mono">{step.route}</span>} />
                  <DataRow label="Output" value={step.output} />
                </div>
              </PanelBody>
            </Panel>
          ))}
        </div>

        <div className="grid content-start gap-4">
          <Panel>
            <PanelHeader title="Live processtatus" />
            <PanelBody>
              <DataRow label="Laatste scan" value={latestRun ? new Date(latestRun.startedAt).toLocaleString("nl-NL") : "n/a"} />
              <DataRow label="Sources" value={latestRun?.sourceCount ?? 0} />
              <DataRow label="Candidates" value={latestRun?.candidateCount ?? data.eventCandidates.length} />
              <DataRow label="Top candidate" value={topCandidate?.title ?? "n/a"} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Audit trail" />
            <PanelBody className="space-y-3 text-sm text-muted-foreground">
              <p>
                Discovery runs, candidate ranking en model-output blijven zichtbaar in AI Log,
                zodat later te verklaren is waarom een advies wel of niet door de funnel kwam.
              </p>
              <Button asChild size="sm" variant="secondary">
                <Link href="/ai-log">
                  Open AI Log
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
