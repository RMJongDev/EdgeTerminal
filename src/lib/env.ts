export type EdgeRuntimeMode = "demo" | "local" | "supabase";

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getEdgeRuntimeMode(): EdgeRuntimeMode {
  const configuredMode = process.env.EDGE_RUNTIME_MODE?.toLowerCase();

  if (configuredMode === "demo" || configuredMode === "local" || configuredMode === "supabase") {
    return configuredMode;
  }

  if (hasSupabaseEnv()) {
    return "supabase";
  }

  return "demo";
}

export function isDemoMode() {
  return getEdgeRuntimeMode() === "demo";
}

export function isLocalMode() {
  return getEdgeRuntimeMode() === "local";
}

export function isSupabaseMode() {
  return getEdgeRuntimeMode() === "supabase";
}

export function getLocalDatabasePath() {
  return process.env.EDGE_LOCAL_DB_PATH || ".data/edge-terminal.sqlite";
}

export function getRuntimeStatus() {
  const mode = getEdgeRuntimeMode();

  return {
    mode,
    label:
      mode === "local"
        ? "Local SQLite"
        : mode === "supabase"
          ? "Supabase live"
          : "Demo mode",
    storage:
      mode === "local"
        ? getLocalDatabasePath()
        : mode === "supabase"
          ? "Supabase Postgres"
          : "In-memory fixtures",
  };
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, publishableKey };
}
