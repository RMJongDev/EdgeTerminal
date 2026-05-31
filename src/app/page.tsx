import Link from "next/link";
import { ArrowRight, CheckCircle2, Database, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/status-pill";
import { hasSupabaseEnv } from "@/lib/env";

const checklist = [
  "Project Accelerator docs en skills aanwezig",
  "Next.js App Router skeleton klaar",
  "Supabase SSR auth voorbereid",
  "Playwright smoke tests voorbereid",
];

export const dynamic = "force-dynamic";

export default function HomePage() {
  const isSupabaseConfigured = hasSupabaseEnv();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_32rem),linear-gradient(180deg,_rgba(255,255,255,0.04),_transparent_16rem)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <div>
            <p className="text-sm text-muted-foreground">New Default template</p>
            <h1 className="text-2xl font-semibold tracking-normal">Project Accelerator</h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill tone={isSupabaseConfigured ? "ready" : "warning"}>
              {isSupabaseConfigured ? "Supabase configured" : "Env missing"}
            </StatusPill>
            <Button asChild>
              <Link href="/dashboard">
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="max-w-2xl space-y-4">
              <p className="text-sm font-medium text-primary">Next.js / Supabase / Vercel</p>
              <h2 className="text-4xl font-semibold leading-tight tracking-normal md:text-5xl">
                Startpunt voor apps die snel van intake naar bouw moeten.
              </h2>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">
                De app-skeleton staat klaar, terwijl de accelerator de briefing, specs,
                backlog en testaanpak per project invult.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/login">Login of signup</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">Protected dashboard</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Template status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {checklist.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="flex flex-col gap-2 p-4">
                  <FileText className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium">Docs-first</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-2 p-4">
                  <Database className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium">Postgres + RLS</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-2 p-4">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium">SSR auth</span>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
