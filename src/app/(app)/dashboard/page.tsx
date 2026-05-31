import { redirect } from "next/navigation";
import { Database, ShieldCheck, TestTube2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/status-pill";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!hasSupabaseEnv()) {
    redirect("/login?error=Supabase%20env%20ontbreekt");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Protected route</p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Dashboard
          </h1>
        </div>
        <StatusPill tone="ready">{profile?.role ?? "member"}</StatusPill>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welkom{profile?.full_name ? `, ${profile.full_name}` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border border-border bg-background p-4">
            <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
            <h2 className="font-medium">Auth</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Server-side user check met Supabase Auth.
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-4">
            <Database className="mb-3 h-5 w-5 text-primary" />
            <h2 className="font-medium">Data</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Profiles tabel is beschermd met RLS.
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-4">
            <TestTube2 className="mb-3 h-5 w-5 text-primary" />
            <h2 className="font-medium">Tests</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Playwright smoke tests staan klaar voor uitbreiding.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
