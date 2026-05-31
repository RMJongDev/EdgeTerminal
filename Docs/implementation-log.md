# Implementation Log

> Kort en bondig logboek van wat er per Claude-sessie is gebeurd. Nieuwste bovenaan. Eén entry per sessie.

## Format

```
## YYYY-MM-DD — <korte titel>
- Wat: 1-3 bullets met de concrete wijzigingen
- Waarom: 1 zin context (alleen als niet uit de wijzigingen blijkt)
- Volgende stap: optioneel, 1 zin
```

---

## 2026-05-31 - Volledige vervolgstappen uitgezet
- Wat: Route vanaf voorstel-specs naar styleguide, functioneel ontwerp, technisch ontwerp, backlog en bouwstart bepaald.
- Waarom: De mockups en voorstel-specs zijn nu goed genoeg om richting bouwvoorbereiding te gaan.
- Volgende stap: Styleguide en functioneel ontwerp uitwerken.

## 2026-05-31 - Voorstel-specs opgesteld
- Wat: Voorstel-specs voor Edge Terminal aangemaakt met MVP-modules, kernflows, datamodelrichting en high-level architectuur.
- Wat: Open punten vastgelegd voor market-data provider, disclaimers, paper-trade sluitvelden en productlogo.
- Volgende stap: Functioneel ontwerp uitwerken per scherm en workflow.

## 2026-05-31 - Vervolgstappen bepaald
- Wat: Route vanaf de eerste mockups bepaald: mockup-review, functioneel ontwerp, datamodel, backlog en daarna bouw.
- Waarom: Edge Terminal heeft nu genoeg richting om gecontroleerd richting bouwvoorbereiding te gaan.
- Volgende stap: Mockups aanscherpen en daarna functioneel ontwerp opstellen.

## 2026-05-31 - NewDefault branding toegevoegd
- Wat: NewDefault-logo subtiel toegevoegd aan de mockup in topbar, sidebar-footer en dashboard-strip.
- Wat: Stylingdocument bijgewerkt met co-brandingregels voor Edge Terminal als NewDefault-product.
- Volgende stap: Mockup visueel beoordelen en bepalen of Edge Terminal een eigen productlogo krijgt.

## 2026-05-31 - Eerste mockups opgezet
- Wat: Keuzes vastgelegd voor VS/EU-aandelen, ETF's, Supabase Auth, OpenAI-analyse en Gemini-research.
- Wat: Eerste klikbare mockup gemaakt voor Dashboard, Event Radar, Event Detail, Signal Desk, Paper Trades en Performance Lab.
- Volgende stap: Mockup visueel beoordelen en daarna itereren op schermvolgorde, informatiedichtheid en datamodel.

## 2026-05-31 - Fase 1 contextdocumenten opgezet
- Wat: Projectbriefing, company-context en stylingbasis voor Edge Terminal aangemaakt.
- Wat: MVP-richting vastgelegd rond event-driven research, risk review, paper trading en performance learning.
- Volgende stap: Fase 1 open vragen beantwoorden en daarna door naar brand/design en eerste mockups.

## 2026-05-31 - Projectomschrijving gelezen
- Wat: ProjectOmschrijving.txt gelezen en de kernrichting van Edge Terminal beoordeeld.
- Wat: Eerste productlijn herkend: event-driven research, analyse, risk review, paper trading en performance learning.
- Volgende stap: Projectomschrijving omzetten naar concrete fases, backlog en datamodel.

## 2026-05-31 - Idee-intake gestart
- Wat: Poging gedaan om de aangeleverde projecttekst uit de attachment te lezen.
- Waarom: De intake is gestart, maar de lokale sandbox kon de attachment niet openen.
- Volgende stap: Projectidee direct in de chat ontvangen en uitwerken naar eerste richting.

## 2026-05-31 - Next/Supabase template uitgewerkt
- Wat: Next.js/Supabase/Vercel app-skeleton toegevoegd met auth routes, Supabase helpers, RLS migration en Playwright smoke tests.
- Wat: Project Accelerator fase 4, tech-stack interview, templates en build-ready checklist gekoppeld aan de standaard template-stack.
- Wat: install/build/test flow geverifieerd met `pnpm lint`, `pnpm typecheck`, `pnpm build` en `pnpm test:e2e`.

## 2026-05-31 - Next Supabase template-plan
- Wat: Vercel/Supabase starter en bestaande accelerator-structuur beoordeeld.
- Wat: plan opgesteld om deze repo uit te breiden tot herbruikbare Next.js/Supabase/Vercel template.
- Volgende stap: beslissen of de app-skeleton direct in root komt of als aparte template-laag wordt gegenereerd.

## 2026-05-31 - NewDefault documentatie toegevoegd
- Wat: `Docs/NewDefault/` aangemaakt met brand notes, originele bronnen en opgeschoonde logo-assets.
- Wat: `Docs/NewDefault/design-system.html` toegevoegd als visuele preview voor NewDefault-voorstellen en agency-assets.
- Waarom: NewDefault-styling blijft beschikbaar op verzoek zonder te botsen met klant- of projecthuisstijlen.

## 2026-05-31 - AGENTS en gedeelde skills gemigreerd
- Wat: `AGENTS.md` is bron van waarheid geworden; `CLAUDE.md` is wrapper met `@AGENTS.md`.
- Wat: `.agents/skills/` is de skills-bron; `.claude/skills/` verwijst ernaar via junction.
- Volgende stap: test een nieuwe Claude Code- en Codex-sessie op het laden van dezelfde instructies.

## 2026-04-15 — Dependencies-doc toegevoegd
- Wat: nieuwe `Docs/dependencies.md` met Playwright MCP install, graphify repo, en placeholder-lijst voor overige deps (Node/pnpm, Playwright browsers, Supabase/Vercel/gh CLI, MCP servers, fonts, env keys).
- Waarom: centrale plek om externe tools en MCP servers te loggen zodat een nieuwe machine reproduceerbaar is.
