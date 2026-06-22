import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { getLocalDatabasePath } from "../../env.ts";
import { demoTerminalData } from "../demo-data.ts";
import type { Asset, TerminalData } from "../types.ts";

const SNAPSHOT_ID = "default";

let db: DatabaseSync | null = null;

const mirrorTables = [
  "assets",
  "discovery_runs",
  "event_sources",
  "event_candidates",
  "source_payload_snapshots",
  "pipeline_step_runs",
  "advices",
  "advice_tracking",
  "market_events",
  "event_analyses",
  "trade_setups",
  "risk_reviews",
  "paper_trades",
  "ai_analysis_logs",
  "daily_briefings",
] as const;

const startWatchlist: Asset[] = [
  ["asset-aapl", "AAPL", "Apple Inc.", "us_equity", "Technology", "NASDAQ", "USD", "United States", 1],
  ["asset-msft", "MSFT", "Microsoft Corporation", "us_equity", "Technology", "NASDAQ", "USD", "United States", 1],
  ["asset-nvda", "NVDA", "NVIDIA Corporation", "us_equity", "Semiconductors", "NASDAQ", "USD", "United States", 1],
  ["asset-amd", "AMD", "Advanced Micro Devices", "us_equity", "Semiconductors", "NASDAQ", "USD", "United States", 2],
  ["asset-tsla", "TSLA", "Tesla Inc.", "us_equity", "Automotive", "NASDAQ", "USD", "United States", 1],
  ["asset-amzn", "AMZN", "Amazon.com Inc.", "us_equity", "Consumer / Cloud", "NASDAQ", "USD", "United States", 2],
  ["asset-googl", "GOOGL", "Alphabet Inc.", "us_equity", "Technology", "NASDAQ", "USD", "United States", 2],
  ["asset-meta", "META", "Meta Platforms", "us_equity", "Technology", "NASDAQ", "USD", "United States", 2],
  ["asset-nflx", "NFLX", "Netflix Inc.", "us_equity", "Media", "NASDAQ", "USD", "United States", 3],
  ["asset-orcl", "ORCL", "Oracle Corporation", "us_equity", "Software", "NYSE", "USD", "United States", 3],
  ["asset-jpm", "JPM", "JPMorgan Chase", "us_equity", "Financials", "NYSE", "USD", "United States", 3],
  ["asset-bac", "BAC", "Bank of America", "us_equity", "Financials", "NYSE", "USD", "United States", 4],
  ["asset-ba", "BA", "Boeing", "us_equity", "Industrials", "NYSE", "USD", "United States", 3],
  ["asset-dis", "DIS", "Walt Disney", "us_equity", "Media", "NYSE", "USD", "United States", 4],
  ["asset-nke", "NKE", "Nike", "us_equity", "Consumer", "NYSE", "USD", "United States", 4],
  ["asset-sbux", "SBUX", "Starbucks", "us_equity", "Consumer", "NASDAQ", "USD", "United States", 4],
  ["asset-mcd", "MCD", "McDonald's", "us_equity", "Consumer", "NYSE", "USD", "United States", 4],
  ["asset-lly", "LLY", "Eli Lilly", "us_equity", "Healthcare", "NYSE", "USD", "United States", 3],
  ["asset-pfe", "PFE", "Pfizer", "us_equity", "Healthcare", "NYSE", "USD", "United States", 4],
  ["asset-sap", "SAP.DE", "SAP SE", "eu_equity", "Software", "XETRA", "EUR", "Germany", 2],
  ["asset-shel", "SHEL.L", "Shell plc", "eu_equity", "Energy", "LSE", "GBP", "United Kingdom", 2],
  ["asset-mc", "MC.PA", "LVMH", "eu_equity", "Luxury", "Euronext Paris", "EUR", "France", 2],
  ["asset-rms", "RMS.PA", "Hermes", "eu_equity", "Luxury", "Euronext Paris", "EUR", "France", 3],
  ["asset-air", "AIR.PA", "Airbus", "eu_equity", "Industrials", "Euronext Paris", "EUR", "France", 3],
  ["asset-tte", "TTE.PA", "TotalEnergies", "eu_equity", "Energy", "Euronext Paris", "EUR", "France", 3],
  ["asset-or-pa", "OR.PA", "L'Oreal", "eu_equity", "Consumer", "Euronext Paris", "EUR", "France", 4],
  ["asset-sie", "SIE.DE", "Siemens", "eu_equity", "Industrials", "XETRA", "EUR", "Germany", 3],
  ["asset-vow3", "VOW3.DE", "Volkswagen", "eu_equity", "Automotive", "XETRA", "EUR", "Germany", 4],
  ["asset-nesn", "NESN.SW", "Nestle", "eu_equity", "Consumer", "SIX", "CHF", "Switzerland", 4],
  ["asset-ubsg", "UBSG.SW", "UBS Group", "eu_equity", "Financials", "SIX", "CHF", "Switzerland", 4],
  ["asset-azn", "AZN.L", "AstraZeneca", "eu_equity", "Healthcare", "LSE", "GBP", "United Kingdom", 3],
  ["asset-bp", "BP.L", "BP plc", "eu_equity", "Energy", "LSE", "GBP", "United Kingdom", 4],
  ["asset-novo", "NOVO-B.CO", "Novo Nordisk", "eu_equity", "Healthcare", "Nasdaq Copenhagen", "DKK", "Denmark", 2],
].map(([id, ticker, name, assetType, sector, exchange, currency, country, priority]) => ({
  id: String(id),
  ticker: String(ticker),
  name: String(name),
  assetType: assetType as Asset["assetType"],
  sector: String(sector),
  exchange: String(exchange),
  currency: String(currency),
  country: String(country),
  priority: Number(priority),
  status: "active",
  notes: "Seeded local MVP watchlist.",
  lastMovePercent: null,
  updatedAt: "2026-06-13T00:00:00.000Z",
}));

export function createLocalId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

function getDatabase() {
  if (db) {
    return db;
  }

  const configuredPath = getLocalDatabasePath();
  const dbPath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(/* turbopackIgnore: true */ process.cwd(), configuredPath);
  mkdirSync(path.dirname(dbPath), { recursive: true });

  try {
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");
    ensureSchema(db);
  } catch (error) {
    throw new Error(
      `Local SQLite database could not be opened at ${configuredPath}. Stop the dev server and delete ${configuredPath}, ${configuredPath}-shm and ${configuredPath}-wal to reset it.`,
      { cause: error },
    );
  }

  return db;
}

function ensureSchema(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS local_state_snapshots (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  for (const table of mirrorTables) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        sort_at TEXT,
        updated_at TEXT NOT NULL
      );
    `);
  }
}

function cloneData(data: TerminalData): TerminalData {
  return JSON.parse(JSON.stringify(data)) as TerminalData;
}

function normalizeTerminalData(input: TerminalData): TerminalData {
  const data = input as TerminalData & Partial<TerminalData>;

  return {
    ...data,
    sourcePayloadSnapshots: data.sourcePayloadSnapshots ?? [],
    pipelineStepRuns: data.pipelineStepRuns ?? [],
    advices: data.advices ?? [],
    adviceTracking: data.adviceTracking ?? [],
  };
}

function createInitialData(): TerminalData {
  const data = normalizeTerminalData(cloneData(demoTerminalData));
  const assetsByTicker = new Map<string, Asset>();

  for (const asset of [...data.assets, ...startWatchlist]) {
    assetsByTicker.set(asset.ticker, asset);
  }

  data.assets = Array.from(assetsByTicker.values()).sort((a, b) => a.priority - b.priority || a.ticker.localeCompare(b.ticker));
  data.isDemoMode = false;

  return data;
}

function readSnapshot(): TerminalData | null {
  const row = getDatabase()
    .prepare("SELECT payload FROM local_state_snapshots WHERE id = ?")
    .get(SNAPSHOT_ID) as { payload?: string } | undefined;

  if (!row?.payload) {
    return null;
  }

  try {
    return normalizeTerminalData(JSON.parse(row.payload) as TerminalData);
  } catch (error) {
    throw new Error(
      `Local SQLite snapshot is corrupt. Stop the dev server and delete ${getLocalDatabasePath()}, ${getLocalDatabasePath()}-shm and ${getLocalDatabasePath()}-wal to reset it.`,
      { cause: error },
    );
  }
}

function sortAt(value: unknown): string | null {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(
      record.updatedAt ??
        record.startedAt ??
        record.fetchedAt ??
        record.createdAt ??
        record.occurredAt ??
        record.openedAt ??
        record.briefingDate ??
        "",
    ) || null;
  }

  return null;
}

function replaceMirrorRows(database: DatabaseSync, table: (typeof mirrorTables)[number], rows: Array<{ id: string }>) {
  const deleteStatement = database.prepare(`DELETE FROM ${table}`);
  const insertStatement = database.prepare(
    `INSERT INTO ${table} (id, payload, sort_at, updated_at) VALUES (?, ?, ?, ?)`,
  );
  const now = new Date().toISOString();

  deleteStatement.run();
  for (const row of rows) {
    insertStatement.run(row.id, JSON.stringify(row), sortAt(row), now);
  }
}

function writeSnapshot(data: TerminalData) {
  const database = getDatabase();
  const now = new Date().toISOString();
  database
    .prepare(`
      INSERT INTO local_state_snapshots (id, payload, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
    `)
    .run(SNAPSHOT_ID, JSON.stringify(data), now);

  replaceMirrorRows(database, "assets", data.assets);
  replaceMirrorRows(database, "discovery_runs", data.discoveryRuns);
  replaceMirrorRows(database, "event_sources", data.eventSources);
  replaceMirrorRows(database, "event_candidates", data.eventCandidates);
  replaceMirrorRows(database, "source_payload_snapshots", data.sourcePayloadSnapshots);
  replaceMirrorRows(database, "pipeline_step_runs", data.pipelineStepRuns);
  replaceMirrorRows(database, "advices", data.advices);
  replaceMirrorRows(database, "advice_tracking", data.adviceTracking);
  replaceMirrorRows(database, "market_events", data.events);
  replaceMirrorRows(database, "event_analyses", data.analyses);
  replaceMirrorRows(database, "trade_setups", data.setups);
  replaceMirrorRows(database, "risk_reviews", data.riskReviews);
  replaceMirrorRows(database, "paper_trades", data.paperTrades);
  replaceMirrorRows(database, "ai_analysis_logs", data.aiLogs);
  replaceMirrorRows(database, "daily_briefings", [data.dailyBriefing]);
}

export function getLocalTerminalData(): TerminalData {
  const existing = readSnapshot();

  if (existing) {
    return { ...existing, isDemoMode: false };
  }

  const initialData = createInitialData();
  writeSnapshot(initialData);

  return initialData;
}

export function updateLocalTerminalData(mutator: (data: TerminalData) => void): TerminalData {
  const data = cloneData(getLocalTerminalData());
  mutator(data);
  data.latestDiscoveryRun = data.discoveryRuns[0] ?? null;
  data.isDemoMode = false;
  writeSnapshot(data);

  return data;
}

export function resetLocalTerminalData() {
  const data = createInitialData();
  writeSnapshot(data);

  return data;
}

export function closeLocalStoreForTests() {
  db?.close();
  db = null;
}
