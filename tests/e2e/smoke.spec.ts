import { expect, test } from "@playwright/test";

test("home page shows the Edge Terminal entry point", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Edge Terminal" })).toBeVisible();
  await expect(page.getByText("Event-driven trading research")).toBeVisible();
  await expect(page.getByText("Paper trades only")).toBeVisible();
});

test("login page is reachable", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Edge Terminal login" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Wachtwoord")).toBeVisible();
});

test("dashboard shows the demo cockpit without a Supabase project", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Daily Market Command" })).toBeVisible();
  await expect(page.getByText("Narrative & Sentiment Movers")).toBeVisible();
  await expect(page.getByText("Ferrari launch receives negative public reaction")).toBeVisible();
});

test("core MVP screens are reachable", async ({ page }) => {
  const screens = [
    ["/watchlist", "Watchlist"],
    ["/events", "Event Radar"],
    ["/signals", "Signal Desk"],
    ["/risk", "Risk Review"],
    ["/paper-trades", "Paper Trades"],
    ["/performance", "Performance Lab"],
    ["/briefing", "Daily Market Briefing"],
    ["/ai-log", "AI Analysis Log"],
  ] as const;

  for (const [url, heading] of screens) {
    await page.goto(url);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});

test("event detail exposes analysis, setup and risk flow", async ({ page }) => {
  await page.goto("/events/event-race-launch");

  await expect(page.getByRole("heading", { name: "Ferrari launch receives negative public reaction" })).toBeVisible();
  await expect(page.getByText("Event Analysis")).toBeVisible();
  await expect(page.getByText("Impact split")).toBeVisible();
  await expect(page.getByText("Generate setup")).toBeVisible();
});
