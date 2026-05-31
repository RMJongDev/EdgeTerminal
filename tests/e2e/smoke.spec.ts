import { expect, test } from "@playwright/test";

test("home page shows the project accelerator cockpit", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Project Accelerator" })).toBeVisible();
  await expect(page.getByText("Next.js / Supabase / Vercel")).toBeVisible();
});

test("login page is reachable", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Wachtwoord")).toBeVisible();
});

test("dashboard redirects unauthenticated users", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login/);
});
