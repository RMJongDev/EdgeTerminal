# Project Accelerator Next/Supabase

Herbruikbare projectstart voor New Default-apps op Next.js, Supabase en Vercel. Deze repo combineert twee dingen:

- een startbare Next.js app-skeleton met Supabase auth, Tailwind en Playwright;
- de Project Accelerator workflow in `Docs/` en `.agents/skills/`, zodat discovery, voorstel, specs, backlog en bouwvoorbereiding vanaf dag 1 meelopen.

## Start nieuw project

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Vul daarna de Supabase-waarden in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Open Claude Code of Codex in deze map en zeg:

```txt
start nieuw project
```

De accelerator vult de projectdocumentatie en past de app-skeleton aan op basis van het klantproject.

## Standaard stack

| Laag | Keuze |
|---|---|
| Frontend | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS, shadcn-compatible component primitives, darkmode default |
| Auth | Supabase Auth met cookie-based SSR via `@supabase/ssr` |
| Database | Supabase Postgres met RLS en migraties in `supabase/migrations/` |
| Hosting | Vercel |
| Tests | Playwright e2e smoke tests |

## Belangrijke mappen

```txt
src/                         Next.js app-skeleton
supabase/                    migraties en seed-data
tests/e2e/                   Playwright tests
Docs/                        projectdocumentatie en accelerator-output
.agents/skills/              gedeelde Codex/Claude skills
.claude/                     Claude Code configuratie
```

## Commands

```bash
pnpm dev        # lokale app
pnpm build      # productie-build
pnpm lint       # lint
pnpm typecheck  # TypeScript
pnpm test:e2e   # Playwright
pnpm test       # lint + typecheck + e2e
```

## Projectregels

- Documentatie in Nederlands, code in Engels.
- Nieuwe env vars altijd in `.env.example`.
- Geen secrets committen.
- Datarechten afdwingen met Supabase RLS.
- Na codewijzigingen: `graphify update .` draaien als `graphify` beschikbaar is.
