"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: FormDataEntryValue | null) {
  const next = value?.toString();

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

function getCredentials(formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    redirect("/login?error=Vul%20e-mail%20en%20wachtwoord%20in");
  }

  return { email, password };
}

export async function signIn(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/login?error=Supabase%20env%20ontbreekt");
  }

  const supabase = await createClient();
  const credentials = getCredentials(formData);
  const next = safeNext(formData.get("next"));
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/login?error=Supabase%20env%20ontbreekt");
  }

  const supabase = await createClient();
  const credentials = getCredentials(formData);
  const next = safeNext(formData.get("next"));
  const { error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Check%20je%20mail%20om%20je%20account%20te%20bevestigen");
}

export async function signOut() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
