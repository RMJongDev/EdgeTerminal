---
name: playwright-testing
description: End-to-end testen van MYN CRM met Playwright — twee sporen. Spoor A (interactief, MCP browser tools) voor live verificatie, bug reproductie, golden path checks na UI-changes, screenshots. Spoor B (permanente suite in `tests/e2e/` via `pnpm test:e2e`) voor herhaalbare regressietests met storageState, fixtures en aparte test-Supabase. Gebruik deze skill wanneer je flows moet verifiëren, `.spec.ts` bestanden schrijft of aanpast, de test-suite uitbreidt, of wanneer de user vraagt om "test in de browser", "maak een playwright test", "e2e test", "smoke test", "reproduceer bug".
---

# Playwright Testing — MYN CRM

Twee sporen, één skill.

## Welk spoor kies je?

| Situatie | Spoor |
|---|---|
| Feature zojuist gebouwd, golden path checken | **A** (MCP, live) |
| Bug reproduceren die user meldt | **A** |
| Screenshot maken voor user | **A** |
| Visueel nalopen van een nieuwe pagina | **A** |
| Permanente regressietest toevoegen | **B** (`.spec.ts` file) |
| Bestaande E2E-test aanpassen of fixen | **B** |
| CI-suite uitbreiden | **B** |
| Nieuwe fixture of seed-helper schrijven | **B** |

**Nooit tegelijk:** Spoor A (MCP) en Spoor B (`pnpm test:e2e`) gebruiken dezelfde poort 3000. Sluit de MCP browser vóór je `pnpm test:e2e` draait.

---

# Spoor A — Interactieve MCP runs

Interactieve browser-automatisering voor MYN CRM via de Playwright MCP server. Voor live verificatie van features, niet voor permanente test-bestanden.

## Wanneer deze skill gebruiken

- Na het bouwen of wijzigen van UI: **altijd** de golden path in de browser doorlopen (zie AGENTS.md "For UI or frontend changes").
- Bug reproductie: user meldt een fout, jij repliceert via MCP.
- Smoke test na grote refactor: admin-login → dashboard → ledenlijst → bedrijven → events.
- Visuele check: screenshot maken van een nieuwe pagina of component.
- Formulier-validatie checken: required velden, foutmeldingen, success states.

**Niet gebruiken voor:** het schrijven van `.spec.ts` testbestanden — gebruik daarvoor gewone file-editing en `pnpm test:e2e`.

## Vereisten vóór je start

1. **Dev server draait.** Check of `pnpm dev` loopt op `http://localhost:3000`. Start hem anders in de achtergrond:
   ```
   Bash(command: "pnpm dev", run_in_background: true)
   ```
   Wacht tot je "Ready" ziet in de output vóór je navigeert.

2. **Test-credentials.** Voor admin-routes heb je een testaccount nodig. Check `.env.local` / `supabase/seed/` of vraag de user. Hardcode nooit productie-credentials.

3. **Werkdirectory schoon.** De `.playwright-mcp/` folder vangt console-logs en page-snapshots op — dit is een tijdelijke scratch dir (staat in `.gitignore`).

## Kern-workflow

### 1. Navigeren en snapshot nemen

```
mcp__playwright__browser_navigate(url: "http://localhost:3000/admin/leden")
mcp__playwright__browser_snapshot()   // accessibility tree — altijd hieruit refs halen
```

**Belangrijk:** gebruik `browser_snapshot` (accessibility tree) als bron voor element-refs, niet `browser_take_screenshot`. Screenshots zijn alleen voor visuele bevestiging aan de user.

### 2. Interactie

Gebruik de `ref` uit de snapshot voor elke actie:

```
mcp__playwright__browser_click(element: "Nieuw lid knop", ref: "e42")
mcp__playwright__browser_type(element: "E-mailveld", ref: "e17", text: "test@myn.nl")
mcp__playwright__browser_fill_form(fields: [...])   // meerdere velden tegelijk
mcp__playwright__browser_select_option(element: "Regio dropdown", ref: "e23", values: ["noord"])
```

Voor meerdere velden: gebruik `browser_fill_form` in één call i.p.v. losse `browser_type` calls.

### 3. Wachten op state-changes

Na een Server Action, navigatie of mutatie:

```
mcp__playwright__browser_wait_for(text: "Lid toegevoegd")   // wacht op bevestigingstekst
```

Gebruik `text` (verschijnt) of `textGone` (verdwijnt) — geen willekeurige `time` waardes tenzij echt nodig.

### 4. Verifiëren

- **Console errors:** `mcp__playwright__browser_console_messages()` — check op rode errors na elke flow. MYN CRM hoort zero console errors te geven.
- **Network:** `mcp__playwright__browser_network_requests()` — check of Server Actions 200 teruggeven, geen 401/500.
- **Visueel:** `mcp__playwright__browser_take_screenshot()` alleen wanneer de user een screenshot wil zien, of wanneer je een regressie vermoedt.

### 5. Afsluiten

```
mcp__playwright__browser_close()
```

Sluit de browser aan het einde van de sessie. Laat 'm niet open tussen onafhankelijke taken.

## MYN CRM — veelvoorkomende flows

### Admin login

1. Navigeer naar `http://localhost:3000/admin` → middleware redirect naar `/login`.
2. Vul email + password (uit `.env.local` test-account).
3. Klik "Inloggen" → wacht op redirect naar `/admin/dashboard`.
4. Snapshot + check dat sidebar zichtbaar is.

### Lid aanmaken (golden path)

1. `/admin/leden` → klik "Nieuw lid".
2. `browser_fill_form` met naam, email, bedrijf, regio.
3. Submit → `browser_wait_for(text: "Lid toegevoegd")`.
4. Verifieer dat het nieuwe lid in de tabel staat (snapshot + zoek op email).

### Event check-in

1. `/admin/events/[id]/check-in` → zoek geregistreerde persoon.
2. Klik check-in toggle.
3. Verifieer dat gastenteller ophoogt (DB trigger `update_guest_event_counter`).
4. Check console voor errors.

### Portaal magic-link (gast-flow)

1. `/portaal/login` → vul gast-email.
2. Check `browser_network_requests` dat Resend webhook getriggerd is.
3. (Magic link zelf volgen kan niet zonder echte inbox — stop hier en rapporteer.)

## Best practices

- **Altijd snapshot eerst**, dan acteren. Refs zijn alleen geldig binnen de meest recente snapshot.
- **Parallelle calls:** verschillende onafhankelijke MCP-tools mogen in één message — bv. `browser_console_messages` + `browser_network_requests` na een flow.
- **Stop bij eerste blocker.** Als login faalt, ga niet doorklikken — rapporteer en vraag credentials.
- **Geen productie-URLs.** Alleen `localhost:3000` of preview-URLs die de user expliciet aanlevert.
- **Rapporteer resultaten kort:** wat gewerkt heeft, welke console errors/network failures je zag, en een conclusie (golden path ✅ / blocker bij stap N).
- **Cleanup:** sluit de browser en negeer `.playwright-mcp/` artefacten — die zijn niet committable.

## Wat NIET doen

- Geen `.spec.ts` bestanden schrijven via deze skill — dat is een andere taak.
- Geen `pnpm test:e2e` draaien via Bash terwijl je ook MCP browser-sessies gebruikt (poort-conflict mogelijk).
- Geen echte betaling-flows (Mollie) testen zonder testmode-key.
- Geen data-mutaties op een gedeelde/staging DB zonder user-akkoord.
- Geen screenshots als primaire verificatie gebruiken — snapshot (a11y tree) is sneller en betrouwbaarder.

## Output-formaat na een testrun

Rapporteer in deze vorm:

```
Flow: <naam>
Stappen: <aantal> uitgevoerd
Console errors: <0 / lijst>
Network failures: <0 / lijst>
Resultaat: ✅ golden path werkt / ❌ blocker bij stap N — <reden>
```

Houd het onder de 10 regels tenzij de user details vraagt.

---

# Spoor B — Permanente suite (`pnpm test:e2e`)

Gestructureerde Playwright-testsuite in `tests/e2e/` voor regressiepreventie en CI. Volledige README staat in [`tests/e2e/README.md`](../../../tests/e2e/README.md) — onderstaande is het werkmodel voor Claude.

## Directory layout

```
tests/e2e/
├── auth.setup.ts              # admin login → .auth/admin.json
├── portal.setup.ts            # portal session via service-role → .auth/portal.json
├── admin/*.spec.ts            # admin zone tests
├── portal/*.spec.ts           # portaal zone tests
├── fixtures/
│   ├── auth.ts                # re-export van base test + expect
│   ├── db.ts                  # createServiceRoleClient + resetTestDatabase
│   ├── members.ts             # createTestMember()
│   ├── companies.ts           # createTestCompany()
│   └── events.ts              # createTestEvent()
└── .auth/*.json               # storageState (gitignored)
```

## Projects in `playwright.config.ts`

- `setup-admin` — draait `auth.setup.ts`, schrijft `.auth/admin.json`
- `setup-portal` — draait `portal.setup.ts`, schrijft `.auth/portal.json`
- `admin` — depends on `setup-admin`, laadt admin storageState, testMatch `admin/**`
- `portal` — depends on `setup-portal`, laadt portal storageState, testMatch `portal/**`

Config laadt `.env.test` via een eigen minimale loader (geen `dotenv` dep). Credentials: `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, `TEST_PORTAL_EMAIL`, `TEST_SUPABASE_URL`, `TEST_SUPABASE_SERVICE_ROLE_KEY`.

## DB-strategie

- **Aparte Supabase project** voor E2E — nooit productie/staging.
- `resetTestDatabase()` in `fixtures/db.ts` truncate't in FK-volgorde en seedt baseline. Draai per spec-file in `test.beforeAll`, **niet per test** (DB-triggers maken per-test cleanup broos).
- `createServiceRoleClient()` weigert hard als de URL `prod` of `production` bevat.

```ts
import { test, expect } from "../fixtures/auth";
import { resetTestDatabase } from "../fixtures/db";
import { createTestMember } from "../fixtures/members";

test.beforeAll(async () => {
  await resetTestDatabase();
});

test("lid aanmaken en terugzien in lijst", async ({ page }) => {
  await createTestMember({
    firstName: "E2E",
    lastName: "Tester",
    email: "e2e@myn-test.nl",
  });
  await page.goto("/admin/leden");
  await expect(page.getByText("e2e@myn-test.nl")).toBeVisible();
});
```

## Patterns

- **Importeer altijd uit `../fixtures/auth`** (niet direct uit `@playwright/test`) — dat is het uitbreidpunt voor custom fixtures.
- **Seed via fixtures, niet via UI** — sneller en deterministischer. UI-tests verifiëren alleen wat niet via DB te checken is.
- **Selectoren:** `getByRole` / `getByLabel` boven CSS-selectors. Volgt toegankelijkheid en overleeft Tailwind-refactors.
- **Eén flow per `test()`** — geen mega-tests. `test.describe` om ze te groeperen.
- **Geen hardcoded UUIDs** tenzij ze uit `resetTestDatabase` baseline komen (`00000000-0000-0000-0000-000000000001` voor test-company).

## Nieuwe fixture toevoegen

1. Maak `tests/e2e/fixtures/<domein>.ts` — één `createTest<X>()` functie, gebruikt `createServiceRoleClient()`.
2. Geen cleanup in de fixture zelf — `resetTestDatabase()` tussen spec-files doet het werk.
3. Matcht `lib/<domein>/` boundaries uit AGENTS.md. Geen dump-bestanden.

## Commands

```bash
pnpm test:e2e                          # hele suite
pnpm test:e2e --project=admin          # alleen admin
pnpm test:e2e --project=portal         # alleen portaal
pnpm test:e2e --ui                     # interactive UI
pnpm test:e2e --debug                  # stap debug
pnpm test:e2e admin/members.spec.ts    # losse spec
```

## Don'ts voor Spoor B

- Geen MCP browser-sessie open terwijl `pnpm test:e2e` draait (port-conflict).
- Geen credentials hardcoden — altijd `.env.test`.
- Geen tests tegen `.env.local`/productie Supabase — check dat `TEST_SUPABASE_URL` anders is.
- Geen per-test cleanup — gebruik `resetTestDatabase()` in `beforeAll`.
- Geen mega-`fixtures/test-data.ts` — domein-gesplitst houden.
- Geen `dotenv` package installeren — de config-loader in `playwright.config.ts` doet het al.
