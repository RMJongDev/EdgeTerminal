import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { DatabaseSync } from "node:sqlite";

const tempDir = mkdtempSync(path.join(os.tmpdir(), "edge-terminal-local-store-"));
const dbPath = path.join(tempDir, "edge-terminal.sqlite");

process.env.EDGE_RUNTIME_MODE = "local";
process.env.EDGE_LOCAL_DB_PATH = dbPath;

const {
  createLocalId,
  closeLocalStoreForTests,
  getLocalTerminalData,
  resetLocalTerminalData,
  updateLocalTerminalData,
} = await import("../../src/lib/edge-terminal/store/local.ts");

after(() => {
  closeLocalStoreForTests();
  rmSync(tempDir, { force: true, recursive: true });
});

describe("local SQLite store", () => {
  it("initializes the local database and seeds the watchlist", () => {
    const data = resetLocalTerminalData();

    assert.equal(existsSync(dbPath), true);
    assert.equal(data.isDemoMode, false);
    assert.ok(data.assets.some((asset) => asset.ticker === "AAPL"));
    assert.ok(data.assets.some((asset) => asset.ticker === "ASML"));
  });

  it("creates the MVP schema tables", () => {
    resetLocalTerminalData();
    const database = new DatabaseSync(dbPath, { readOnly: true });
    const tables = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => String((row as { name: string }).name));
    database.close();

    assert.ok(tables.includes("local_state_snapshots"));
    assert.ok(tables.includes("discovery_runs"));
    assert.ok(tables.includes("event_candidates"));
    assert.ok(tables.includes("source_payload_snapshots"));
    assert.ok(tables.includes("pipeline_step_runs"));
    assert.ok(tables.includes("advices"));
    assert.ok(tables.includes("advice_tracking"));
    assert.ok(tables.includes("ai_analysis_logs"));
  });

  it("persists updates across reads", () => {
    const ticker = `T${Date.now().toString().slice(-5)}`;
    updateLocalTerminalData((data) => {
      data.assets = [
        {
          id: createLocalId("asset"),
          ticker,
          name: "Temporary Test Asset",
          assetType: "us_equity",
          sector: "Testing",
          exchange: "NYSE",
          currency: "USD",
          country: "United States",
          priority: 9,
          status: "active",
          notes: null,
          lastMovePercent: null,
          updatedAt: new Date().toISOString(),
        },
        ...data.assets,
      ];
    });

    const data = getLocalTerminalData();

    assert.ok(data.assets.some((asset) => asset.ticker === ticker));
  });
});
