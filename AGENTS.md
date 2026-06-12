# Edge Terminal

Persoonlijke adviesmachine voor swing trading op nieuws, gebouwd voor en door Robin de Jong. Een autonome pipeline verzamelt twee keer per dag nieuws, filings, macro-items en marktcontext, analyseert koersimpact en levert een gerangschikte top 5 expliciete koop/verkoop-adviezen (ticker, richting, entry, stop, target, horizon, onderbouwing). Elk advies wordt automatisch gevolgd zodat meetbaar wordt welke adviestypen waarde hebben. Robin beslist en handelt zelf bij zijn broker; de app voert nooit zelf trades uit.

Stack: Next.js App Router, Supabase (Auth/Postgres/RLS), Vercel, Tailwind, TypeScript, Playwright, OpenAI.

## Bron van waarheid

| Document | Inhoud |
|---|---|
| `Docs/Specs/voorstel-specs.md` | Wat het product is: kernbesluiten, adviesformat, edge-these, fasering |
| `Docs/Specs/functional-design.md` | Schermen, acties, globale regels |
| `Docs/Specs/technical-design.md` | Architectuur, pipeline-orchestratie, datamodel, LLM-keten, routes |
| `Docs/Specs/news-sources.md` | Concrete bronnen, endpoints, limieten, mover sweep, ophaalpatroon |
| `Docs/Specs/risk-framework.md` | Risicokader: kostenhorde, positiegrootte, circuit breaker, opschaal-gates |
| `Docs/Specs/process-pipeline.html` | Visualisatie van proces en pipeline (openen in browser) |
| `Docs/backlog.md` | De werk-queue voor de bouw - story voor story afwerken |

`Docs/Specs/mockups.html` toont de adviesmachine-schermen (klikbare mockup, vernieuwd 2026-06-12). Deels achterhaald (gemarkeerd in de bestanden zelf): `ProjectOmschrijving.txt` (historische input) en `Docs/analyse-bouwgereedheid.md` (onderbouwing van de koerswijziging); de oude triage-first mockup staat in `Docs/Archive/`.

## Werkwijze voor de bouw-AI

1. Werk `Docs/backlog.md` story voor story af, in volgorde; respecteer de afhankelijkheden per story.
2. Lees per story eerst de gerefereerde spec-secties; bouw daarna; rond af met de Definition of Done.
3. **Definition of Done per story:** `pnpm typecheck`, `pnpm lint`, `pnpm build` en de relevante tests groen; demo mode blijft werken zonder env vars; geen secrets in de repo; entry in `Docs/implementation-log.md`; `graphify update .` na codewijzigingen.
4. **Keys en accounts:** Robin levert API-keys op verzoek. Vraag er expliciet en concreet om ("ik heb nu X nodig, in te vullen als `VAR` in `.env.local`") bij stories met een Robin-input-markering. Blokkeer niet stil: ga door met wat zonder keys kan (mock/demo mode).
5. Bij een conflict tussen specs onderling of tussen spec en backlog: stel de vraag aan Robin, kies niet stil.
6. Vaste besluiten heronderhandel je niet zonder Robin: adviesmachine (geen researchtool), autonome pipeline zonder verplichte triage, top 5 met "geen advies" als geldige uitkomst, twee run-profielen (eu_open/us_open), kostenhorde en risk framework signalerend in de ranking, OpenAI als LLM-provider, budget EUR 150/maand, demo mode behouden, UI-copy Engels.

## Structuur

- `AGENTS.md` - dit bestand; bron van waarheid voor gedeelde projectinstructies (Claude Code en Codex).
- `CLAUDE.md` - dunne wrapper die `AGENTS.md` importeert.
- `.agents/skills/` - gedeelde skills; `.claude/skills/` is een junction hiernaartoe.
- `src/` - Next.js app: `src/app/` routes, `src/components/`, `src/lib/supabase/` SSR-clients, `src/lib/edge-terminal/` domein- en pipelinecode.
- `supabase/` - migraties en seed.
- `tests/e2e/` - Playwright.
- `Docs/` - documentatie: `Specs/`, `backlog.md`, `implementation-log.md`, `dependencies.md`, `Briefings/`, `Context/`, `Archive/`.

## Conventies

- Package manager: pnpm. Node Active LTS (`.nvmrc`).
- Documenten Nederlands, code Engels, UI-copy Engels, diagrammen ASCII, UI darkmode terminal-stijl.
- Secrets nooit committen. Nieuwe env vars altijd toevoegen aan `.env.example` en `Docs/dependencies.md`.
- Alle provider- en LLM-keys server-only; nooit in client components.
- Data beschermen met Supabase RLS; route checks zijn aanvullend, niet de bron van waarheid.
- Elke skill: `.agents/skills/<naam>/SKILL.md`. Elke agent: een `.md` in `.claude/agents/`.
- Team-config in `settings.json`, persoonlijk in `settings.local.json` (gitignored).

## Implementation log - verplicht

Aan het einde van **elke** sessie een entry bovenaan [Docs/implementation-log.md](Docs/implementation-log.md). Format:

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
- Datum in `YYYY-MM-DD`.
- Schrijf het log voor je de sessie afsluit, ook als de sessie kort was.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
