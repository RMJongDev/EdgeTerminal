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
