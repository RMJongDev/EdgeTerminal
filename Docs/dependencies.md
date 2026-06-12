# Dependencies

Externe tools, MCP servers, skills en repos die dit project (of de Claude-workflow eromheen) nodig heeft. Houd dit bij zodra je iets installeert of toevoegt — zo kan een nieuwe machine of teamlid snel reproduceren.

## Format per entry

- **Naam** — wat het is, waarom we het gebruiken
- **Bron** — link naar repo / docs / marketplace
- **Install** — exact commando of stappen
- **Scope** — global / project / sessie

---

## Claude Code — MCP servers

### Playwright MCP
- **Wat**: browser-automation MCP server, geeft Claude `browser_*` tools (navigate, click, snapshot, screenshot, etc.) voor live e2e-verificatie en de `playwright-testing` skill (Spoor A).
- **Bron**: <https://skillsmp.com/search?q=playwright+mcp> · <https://github.com/microsoft/playwright-mcp>
- **Install** (terminal):
  ```bash
  claude mcp add playwright npx @playwright/mcp@latest
  ```
- **Scope**: global (per gebruiker)

---

## Knowledge graph / codebase analyse

### graphify
- **Wat**: zet elke input (code, docs, papers) om naar een knowledge graph + clustered communities + HTML/JSON/audit report. Dit project heeft een graph in `graphify-out/` (zie CLAUDE.md regels).
- **Bron**: <https://github.com/safishamsi/graphify>
- **Install**: volg README van de repo.
- **Gebruik**: `graphify update .` na codewijzigingen om de graph current te houden (AST-only, geen API-kosten).
- **Scope**: project

---

## Runtime & package manager

### Node.js
- **Wat**: JavaScript runtime — basis voor alles (Next.js, Playwright, Vercel CLI, MCP servers).
- **Bron**: <https://nodejs.org/>
- **Install**: via [nvm-windows](https://github.com/coreybutler/nvm-windows) of [volta](https://volta.sh/). Vastleggen via `.nvmrc` in project root.
- **Versie**: Node 24 (`.nvmrc`) — Active LTS voor nieuwe projecten in 2026.
- **Scope**: global

### pnpm
- **Wat**: package manager — sneller en disk-efficiënter dan npm; voorkeur voor monorepo's.
- **Bron**: <https://pnpm.io/>
- **Install**:
  ```bash
  npm install -g pnpm
  ```
- **Versie vastgelegd**: `"packageManager": "pnpm@11.2.2"` in `package.json`.
- **Scope**: global

---

## Template runtime — Next/Supabase/Vercel

### Next.js + React
- **Wat**: App Router frontend/backend runtime voor de template.
- **Bron**: <https://nextjs.org/docs>
- **Install**: projectdependency via `pnpm install`.
- **Versie**: `next@^16.2.6`, `react@^19.2.0`, `react-dom@^19.2.0`.
- **Scope**: project

### Supabase SSR client
- **Wat**: Supabase Auth/Postgres client met cookie-based SSR auth.
- **Bron**: <https://supabase.com/docs/guides/auth/server-side>
- **Install**: projectdependency via `pnpm install`.
- **Versie**: `@supabase/ssr@^0.10.3`, `@supabase/supabase-js@^2.106.2`.
- **Scope**: project

### Tailwind + component primitives
- **Wat**: stylinglaag voor darkmode-first app shells en shadcn-compatible componenten.
- **Bron**: <https://tailwindcss.com/> · <https://ui.shadcn.com/>
- **Install**: projectdependency via `pnpm install`.
- **Versie**: zie `package.json`.
- **Scope**: project

---

## Claude Code

### Claude Code CLI
- **Wat**: de CLI/IDE-extensie waarop dit project draait — laadt skills, agents, hooks, MCP servers.
- **Bron**: <https://docs.claude.com/claude-code>
- **Install**: zie officiële docs (npm install of installer per OS).
- **Versie**: TODO — noteer de versie waarop de skills/agents in dit repo getest zijn zodra een teamlid hem reproduceert.
- **Scope**: global

---

## Testing

### Playwright browsers
- **Wat**: browser-binaries voor de permanente e2e test-suite (Spoor B in `tests/e2e/`, draait via `pnpm test:e2e`). Los van Playwright MCP — die heeft eigen browser-handling.
- **Bron**: <https://playwright.dev/>
- **Install**:
  ```bash
  pnpm add -D @playwright/test
  pnpm exec playwright install
  ```
- **Scope**: project

---

## Backend & deploy CLIs

### Supabase CLI
- **Wat**: lokale Supabase, migraties, en aparte test-Supabase voor e2e met storageState.
- **Bron**: <https://supabase.com/docs/guides/cli>
- **Install**:
  ```bash
  npm install -g supabase
  ```
- **Scope**: global
- **Toevoegen wanneer**: het project daadwerkelijk Supabase gebruikt.

### Vercel CLI
- **Wat**: deploys, env-sync, lokaal Vercel-runtime testen.
- **Bron**: <https://vercel.com/docs/cli>
- **Install**:
  ```bash
  npm install -g vercel
  ```
- **Scope**: global
- **Toevoegen wanneer**: er naar Vercel gedeployed wordt.

### GitHub CLI (`gh`)
- **Wat**: PR's, issues, checks vanuit terminal — Claude gebruikt dit voor PR-workflows.
- **Bron**: <https://cli.github.com/>
- **Install**: <https://cli.github.com/manual/installation> (winget/choco/scoop op Windows).
- **Scope**: global

---

## MCP servers — per project toe te voegen

Documenteer hier elke MCP server die naast Playwright wordt toegevoegd. Format: `claude mcp add <naam> ...` commando + reden.

- **Supabase MCP** — TODO, toevoegen als Supabase gebruikt wordt.
- **GitHub MCP** — TODO, toevoegen voor diepere repo-integratie naast `gh`.
- **Filesystem MCP** — TODO, alleen als bredere FS-toegang nodig is dan Claude's standaard tools.

---

## User-level Claude skills

Skills die niet in `.claude/skills/` van dit repo zitten maar wel verwacht worden (uit `~/.claude/skills/`):

- **graphify** — vereist voor de knowledge-graph workflow (zie boven).
- **skill-writer** — voor het schrijven van nieuwe skills tijdens het project.
- **project-accelerator** — orchestreert de 4-fase kickstart (zit in dit repo, maar check dat globale versie niet conflicteert).

---

## Brand & assets

### Fonts / brand assets
- **Wat**: externe fonts (Google Fonts, Adobe Fonts, foundry-licenties) en logo/icon-assets gebruikt door `brand-guidelines` en `design` skills.
- **Bron**: TODO — vul in zodra de huisstijl vastligt (welke fonts, waar gehost, welke licentie).
- **Scope**: project

---

## Secrets & env

### Environment variables
- **Wat**: keys die het project verwacht. Waardes **nooit** hier noteren — alleen de keys.
- **Bron**: `.env.example` in project root is leidend.
- **Onderhoud**: bij elke nieuwe env var → toevoegen aan `.env.example` met dummy/placeholder, en kort beschrijven waarvoor.

Verwachte keys (waarden levert Robin op verzoek aan; zie `.env.example` en `Docs/Specs/news-sources.md`):
- `OPENAI_API_KEY` + `OPENAI_FILTER_MODEL` / `OPENAI_ANALYSIS_MODEL` - LLM-keten: goedkoop filtermodel, sterk analysemodel (providerbesluit 2026-06-12).
- `FINANCIAL_NEWS_API_KEY` / `FINANCIAL_NEWS_BASE_URL` - Finnhub: company/market news, quotes, earnings calendar.
- `BROAD_NEWS_API_KEY` - Marketaux als brede laag (GDELT heeft geen key nodig).
- `MOVERS_API_KEY` - Alpha Vantage `TOP_GAINERS_LOSERS` voor de mover sweep.
- `EDGAR_USER_AGENT` - verplichte User-Agent (naam + e-mail) voor SEC EDGAR; geen key.
- `MARKET_DATA_API_KEY` / `MARKET_DATA_BASE_URL` - delayed quotes US+EU voor market context en advice tracking (EODHD/Twelve Data; EU-dekking is het criterium).
- `DISCOVERY_SCAN_CRON_SECRET` - beveiligt het cron-entrypoint (slice 3).

Providerkeuzes per bronlaag zijn op 2026-06-12 vastgelegd in `Docs/Specs/news-sources.md`. Nog open: definitieve keuze brede laag (GDELT vs Marketaux) en quotes-provider, na de EU-dekkingstest in het backlog.

---

## Onderhoud

- Eén entry per dependency; update versie/commando bij wijziging.
- Verwijder entries die niet meer gebruikt worden (geen "removed" markers).
- Verwijs vanuit `implementation-log.md` naar dit bestand wanneer je iets toevoegt.
