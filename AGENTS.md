# Project Accelerator Next/Supabase

Template repo voor het opstarten van een nieuw softwareproject in de standaard New Default-stack: Next.js, Supabase, Vercel, Tailwind, TypeScript en Playwright. Kloon deze repo, open Claude Code of Codex in de kopie, en zeg **"start nieuw project"**. De [project-accelerator](.agents/skills/project-accelerator/SKILL.md) skill begeleidt het proces in vier fasen.

## Hoe te gebruiken

1. Kloon deze repo naar een nieuwe project-folder.
2. Kopieer `.env.example` naar `.env.local` en vul Supabase keys zodra er een project is.
3. Run `pnpm install` en `pnpm dev` om de app-skeleton te starten.
4. Open Claude Code of Codex in die folder.
5. Zeg: **"start nieuw project"** of **"werk aan de project accelerator"**.
6. Volg de fasen. De AI-assistent vult `Docs/`, `.agents/skills/` en waar nodig de app-skeleton stap voor stap met je in.

## Structuur

- `AGENTS.md` - bron van waarheid voor gedeelde projectinstructies voor Claude Code en Codex.
- `CLAUDE.md` - dunne Claude Code wrapper die `AGENTS.md` importeert.
- `.agents/skills/` - bron van waarheid voor gedeelde skills.
  - `project-accelerator/` - orchestreert de kickstart in 4 fasen.
  - `brand-guidelines/`, `design/` - placeholders die fase 2 invult.
  - `skill-writer/` - wordt gebruikt als er onderweg een nieuwe skill nodig is.
- `.claude/skills/` - symlink of junction naar `.agents/skills/`, zodat skills niet kunnen driften.
- `.claude/` - overige Claude Code configuratie (agents, rules, commands, hooks, docs).
- `src/` - Next.js App Router app-skeleton:
  - `src/app/` - routes, layouts, auth confirm/error, dashboard.
  - `src/components/` - herbruikbare layout- en UI-componenten.
  - `src/lib/supabase/` - browser/server/proxy clients voor Supabase SSR auth.
- `supabase/` - migraties en seed-data voor lokale/remote Supabase.
- `tests/e2e/` - Playwright smoke/regressietests.
- `Docs/` - projectdocumentatie:
  - `implementation-log.md` - sessielog (zie hieronder)
  - `backlog.md` - epics + user stories
  - `Briefings/` - klant-briefing
  - `Context/` - developer-context, company-context, company-styling
  - `Interviews/` - ruwe interview-output per sessie
  - `Specs/` - voorstel-specs, mockups.html, styleguide.html, functional-design, technical-design
  - `Proposal/` - klantvoorstel
  - `Testing/TestsPlaywright/` - geautomatiseerde e2e-test-plannen + scripts
  - `Testing/TestsHuman/` - handmatige test-scripts voor niet-technische stakeholders
  - `Template/` - technische template-keuzes en projectstart-runbook
  - `Archive/` - gearchiveerde docs

## Conventies

- Standaard runtime: Next.js App Router + Supabase Auth/Postgres + Vercel + Tailwind + shadcn-compatible componenten.
- Package manager: pnpm. Gebruik Node.js Active LTS.
- Team-config in `settings.json`, persoonlijk in `settings.local.json` (gitignored).
- `AGENTS.md` en `.agents/skills/` zijn de bron van waarheid voor gedeelde instructies en skills.
- `CLAUDE.md` bevat alleen `@AGENTS.md`; `.claude/skills/` verwijst naar `.agents/skills/`.
- Elke skill: `.agents/skills/<naam>/SKILL.md` - nooit dieper genest.
- Elke agent: een `.md` in `.claude/agents/`.
- Documenten Nederlands, code Engels, diagrammen ASCII art, default UI darkmode.
- Secrets nooit committen. Nieuwe env vars altijd toevoegen aan `.env.example` en `Docs/dependencies.md`.
- Supabase service-role keys blijven server-only en komen nooit in client components terecht.
- Bescherm data met Supabase RLS; Next.js route checks zijn aanvullend, niet de bron van waarheid.
- Detail: zie [.agents/skills/project-accelerator/references/house-style.md](.agents/skills/project-accelerator/references/house-style.md).

## Implementation log - verplicht

Aan het einde van **elke** sessie voegt de AI-assistent een entry toe bovenaan [Docs/implementation-log.md](Docs/implementation-log.md). Format:

```
## YYYY-MM-DD - <korte titel>
- Wat: 1-3 bullets met de concrete wijzigingen
- Waarom: 1 zin context (alleen als niet uit de wijzigingen blijkt)
- Volgende stap: optioneel, 1 zin
```

Regels:
- Nieuwste entry bovenaan, onder de `---` na het format-blok.
- Een entry per sessie - niet per losse actie.
- Kort en bondig: max ~6 regels per entry.
- Datum in `YYYY-MM-DD`. Vandaag is bekend uit de sessiecontext.
- Schrijf het log voor je de sessie afsluit, ook als de sessie kort was.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
