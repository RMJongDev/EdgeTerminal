import { expect, test } from "@playwright/test";

test("home page shows the Edge Terminal entry point", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Edge Terminal" })).toBeVisible();
  await expect(page.getByText("Event-driven trading research")).toBeVisible();
  await expect(page.getByText("Robin decides and executes manually")).toBeVisible();
});

test("login page is reachable", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText("Edge Terminal login")).toBeVisible();
  await expect(page.getByText("Demo mode is active")).toBeVisible();
});

test("dashboard shows the local cockpit without Supabase or Vercel", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Advice Dashboard" })).toBeVisible();
  await expect(page.getByText("Demo mode").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Start EU run" })).toBeVisible();
  await expect(page.getByText("Advice Run")).toBeVisible();
  await expect(page.getByText("RACE").first()).toBeVisible();
  await expect(page.getByText("ASML").first()).toBeVisible();
  await expect(page.getByText("Top 10 Candidate Events")).toBeVisible();
  await expect(page.getByText("Ferrari launch receives negative public reaction").first()).toBeVisible();
  await page.getByRole("button", { name: "Start EU run" }).click();
  await expect(page.getByText("Demo mode: mock advice run preview")).toBeVisible();
});

test("core MVP screens are reachable", async ({ page }) => {
  const screens = [
    ["/process", "Process A-Z"],
    ["/watchlist", "Watchlist"],
    ["/events", "Event Radar"],
    ["/tracking", "Tracking"],
    ["/performance", "Performance Lab"],
    ["/briefing", "Daily Market Briefing"],
    ["/ai-log", "AI Analysis Log"],
  ] as const;

  for (const [url, heading] of screens) {
    await page.goto(url);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
});

test("advice detail exposes advice, chain, risk and tracking", async ({ page }) => {
  await page.goto("/advices/advice-race-short");

  await expect(page.getByRole("heading", { name: "RACE short" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Advice", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Gap & Squeeze", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tracking", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Calibration", exact: true })).toBeVisible();
  await expect(page.getByText("Counterargument").first()).toBeVisible();
});

test("legacy routes redirect to the new advice workflow", async ({ page }) => {
  await page.goto("/paper-trades");
  await expect(page).toHaveURL(/\/tracking$/);
  await expect(page.getByRole("heading", { name: "Tracking", exact: true })).toBeVisible();

  await page.goto("/setups");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Advice Dashboard" })).toBeVisible();
});
