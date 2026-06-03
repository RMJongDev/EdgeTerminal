import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Gauge,
  GitBranch,
  ListChecks,
  LogOut,
  Radar,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { signOut } from "@/app/(auth)/login/actions";
import { Badge } from "@/components/edge-terminal";
import { Button } from "@/components/ui/button";
import { hasSupabaseEnv } from "@/lib/env";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/process", label: "Process", icon: GitBranch },
  { href: "/watchlist", label: "Watchlist", icon: ListChecks },
  { href: "/events", label: "Event Radar", icon: Radar },
  { href: "/setups", label: "Setups & Risk", icon: ShieldAlert },
  { href: "/paper-trades", label: "Paper Trades", icon: CalendarDays },
  { href: "/performance", label: "Performance Lab", icon: BarChart3 },
  { href: "/briefing", label: "Daily Briefing", icon: Sparkles },
  { href: "/ai-log", label: "AI Log", icon: Bot },
];

export function AppShell({ children }: AppShellProps) {
  const isLive = hasSupabaseEnv();

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="border-b border-border bg-[#0a0f14] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-4 p-4">
          <Link href="/dashboard" className="border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md border border-cyan-300/40 bg-cyan-300/10 font-mono text-sm font-bold text-cyan-100">
                ET
              </span>
              <div>
                <div className="font-mono text-sm font-bold uppercase tracking-normal">
                  Edge Terminal
                </div>
                <div className="text-xs text-muted-foreground">by New Default</div>
              </div>
            </div>
          </Link>

          <nav className="grid gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto grid gap-3 border-t border-border pt-4">
            <div>
              <div className="text-xs text-muted-foreground">Runtime</div>
              <div className="mt-1">
                <Badge tone={isLive ? "green" : "amber"}>
                  {isLive ? "Supabase live" : "Demo mode"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-[#007A80]" />
              <span className="h-2 w-2 rounded-full bg-[#D3BEA1]" />
              NewDefault private product
            </div>
            <form action={signOut}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <LogOut className="h-4 w-4" />
                Uitloggen
              </Button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-7">{children}</main>
    </div>
  );
}
