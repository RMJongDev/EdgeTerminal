import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, KeyRound } from "lucide-react";
import { signIn, signUp } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isSupabaseConfigured = hasSupabaseEnv();

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-md space-y-5">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Terug
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Login
            </CardTitle>
            <CardDescription>
              Supabase email/password auth staat klaar voor elk nieuw project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSupabaseConfigured ? (
              <div className="mb-4 rounded-md border border-accent/40 bg-accent/10 p-3 text-sm text-accent">
                Vul eerst `.env.local` met je Supabase URL en publishable key.
              </div>
            ) : null}
            {params.error ? (
              <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {params.error}
              </div>
            ) : null}
            {params.message ? (
              <div className="mb-4 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
                {params.message}
              </div>
            ) : null}

            <form className="space-y-4">
              <input type="hidden" name="next" value={params.next ?? "/dashboard"} />
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Wachtwoord</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button formAction={signIn} disabled={!isSupabaseConfigured}>
                  Inloggen
                </Button>
                <Button formAction={signUp} variant="secondary" disabled={!isSupabaseConfigured}>
                  Account maken
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
