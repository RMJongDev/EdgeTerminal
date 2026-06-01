import Link from "next/link";
import { ArrowRight, Bot, Database, ShieldCheck, TrendingUp } from "lucide-react";
import { Badge, MetricCard, Panel, PanelBody, PanelHeader } from "@/components/edge-terminal";
import { Button } from "@/components/ui/button";
import { hasSupabaseEnv } from "@/lib/env";
import { getAiRuntimeStatus } from "@/lib/edge-terminal/ai";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const isSupabaseConfigured = hasSupabaseEnv();
  const aiStatus = getAiRuntimeStatus();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md border border-cyan-300/40 bg-cyan-300/10 font-mono text-sm font-bold text-cyan-100">
              ET
            </span>
            <div>
              <p className="text-sm text-muted-foreground">NewDefault private product</p>
              <h1 className="text-2xl font-semibold tracking-normal">Edge Terminal</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={isSupabaseConfigured ? "green" : "amber"}>
              {isSupabaseConfigured ? "Supabase live" : "Demo mode"}
            </Badge>
            <Badge tone={aiStatus.openai === "configured" ? "green" : "amber"}>
              OpenAI {aiStatus.openai}
            </Badge>
            <Button asChild>
              <Link href="/dashboard">
                Open cockpit
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-7">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-medium text-cyan-100">Event-driven trading research</p>
              <h2 className="text-4xl font-semibold leading-tight tracking-normal md:text-5xl">
                Personal market intelligence cockpit for hypotheses, not hype.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Edge Terminal structures market events, perception shifts, AI analysis,
                risk reviews and paper trades into one measurable research cycle.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">View demo cockpit</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">Supabase login</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="MVP scope" value="US/EU/ETF" detail="Watchlist first" tone="cyan" />
              <MetricCard label="Trade mode" value="Paper" detail="No broker execution" tone="amber" />
              <MetricCard label="Core loop" value="7 steps" detail="Event to learning" tone="green" />
            </div>
            <Panel>
              <PanelHeader title="Research cycle">
                <Badge tone="cyan">MVP</Badge>
              </PanelHeader>
              <PanelBody className="grid gap-3">
                {[
                  ["Event", "Manual market event or perception event"],
                  ["Analysis", "OpenAI impact, bull/bear case and risks"],
                  ["Setup", "Long, short or no trade hypothesis"],
                  ["Risk", "Mandatory counterargument before paper trade"],
                  ["Learning", "Performance Lab measures signal quality"],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-md border border-border bg-background p-3">
                    <div className="font-medium">{title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{copy}</div>
                  </div>
                ))}
              </PanelBody>
            </Panel>
            <div className="grid gap-4 sm:grid-cols-3">
              <Panel>
                <PanelBody>
                  <Database className="mb-3 h-5 w-5 text-cyan-100" />
                  <span className="text-sm font-medium">Supabase ready</span>
                </PanelBody>
              </Panel>
              <Panel>
                <PanelBody>
                  <Bot className="mb-3 h-5 w-5 text-cyan-100" />
                  <span className="text-sm font-medium">AI placeholders</span>
                </PanelBody>
              </Panel>
              <Panel>
                <PanelBody>
                  <ShieldCheck className="mb-3 h-5 w-5 text-cyan-100" />
                  <span className="text-sm font-medium">Paper only</span>
                </PanelBody>
              </Panel>
            </div>
          </div>
        </section>

        <footer className="flex items-center gap-2 border-t border-border py-4 text-xs text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Research first. No financial advice. Paper trades only.
        </footer>
      </div>
    </main>
  );
}
