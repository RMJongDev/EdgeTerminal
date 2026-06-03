import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, DataRow, PageHeader, Panel, PanelBody, PanelHeader } from "@/components/edge-terminal";
import { Button } from "@/components/ui/button";
import { getTerminalData } from "@/lib/edge-terminal/data";

export const dynamic = "force-dynamic";

const processSteps = [
  {
    id: "research",
    title: "1. Research start",
    route: "/dashboard",
    owner: "Dashboard",
    output: "Manual daily scan met optionele context hint",
    detail:
      "Jij start de scan. Het systeem neemt brede marktdekking als basis en gebruikt jouw onderwerp, aandeel of gevoel als extra ranking-context.",
  },
  {
    id: "source-funnel",
    title: "2. Source funnel",
    route: "/events",
    owner: "Event Radar",
    output: "Gestructureerde source items",
    detail:
      "Mock MVP: brede nieuwsbronnen, financial feeds, primaire bronnen, macro calendars en marktcontext worden samengebracht in een dedupebare bronlaag.",
  },
  {
    id: "candidate-ranking",
    title: "3. Candidate ranking",
    route: "/events",
    owner: "Event Radar",
    output: "Top 10 Candidate Event List",
    detail:
      "Kandidaten krijgen scores voor relevantie, confidence, bronkwaliteit, recency en scan-hint fit. Alleen de beste tien gaan naar triage.",
  },
  {
    id: "triage",
    title: "4. Triage",
    route: "/events",
    owner: "Event Radar",
    output: "Accept, Analyze, Merge of Ignore",
    detail:
      "Jij houdt controle. Een kandidaat wordt pas een echt market event wanneer je hem accepteert of doorzet naar analyse.",
  },
  {
    id: "analysis",
    title: "5. Event analysis",
    route: "/events/event-race-launch",
    owner: "Event Detail",
    output: "Bull case, bear case, risico's en horizon",
    detail:
      "Het taalmodel analyseert het geaccepteerde event met broncontext, impactrichting en onzekerheden als input.",
  },
  {
    id: "setup-risk",
    title: "6. Setup & risk",
    route: "/setups",
    owner: "Setups & Risk",
    output: "Paper-trade hypothese of bewust geen trade",
    detail:
      "Een setup is pas bruikbaar na risk review. De default uitkomst mag altijd skippen of wachten zijn.",
  },
  {
    id: "paper-trade",
    title: "7. Paper trade",
    route: "/paper-trades",
    owner: "Paper Trades",
    output: "Gelogde trade zonder echt kapitaal",
    detail:
      "Alleen gevalideerde hypotheses komen in paper trading. Entry, stop, target en notities blijven expliciet vastgelegd.",
  },
  {
    id: "performance",
    title: "8. Performance loop",
    route: "/performance",
    owner: "Performance Lab",
    output: "Feedback naar scoring en proces",
    detail:
      "Resultaten worden gebruikt om te leren welke events, bronnen en setup-types daadwerkelijk edge opleveren.",
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
      <PageHeader title="Process A-Z" eyebrow="Van handmatige research-start tot performance feedback">
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
                Discovery runs, candidate ranking en model-output horen zichtbaar te blijven in AI Log,
                zodat later te verklaren is waarom een event wel of niet door de funnel kwam.
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
