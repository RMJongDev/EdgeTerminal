# Edge Terminal

Persoonlijke adviesmachine voor swing trading op nieuws. Een autonome pipeline scant twee keer per dag nieuws, filings en marktcontext, en levert een gerangschikte top 5 expliciete tradingadviezen met entry, stop, target en onderbouwing. Elk advies wordt automatisch getrackt; het Performance Lab laat zien welke adviestypen waarde hebben.

Single-user app voor Robin de Jong. Geen tradingbot: de app voert nooit zelf trades uit en deelt geen adviezen met derden.

## Quickstart

```bash
pnpm install
cp .env.example .env.local   # vul Supabase-waarden in zodra er een project is
pnpm dev
```

Zonder env vars draait de app in **demo mode** met voorbeelddata - alle schermen blijven reviewbaar en testbaar.

## Documentatie

- [AGENTS.md](AGENTS.md) - projectinstructies en werkwijze (start hier)
- [Docs/Specs/voorstel-specs.md](Docs/Specs/voorstel-specs.md) - wat het product is
- [Docs/Specs/technical-design.md](Docs/Specs/technical-design.md) - architectuur en pipeline
- [Docs/Specs/news-sources.md](Docs/Specs/news-sources.md) - bronnen en endpoints
- [Docs/Specs/risk-framework.md](Docs/Specs/risk-framework.md) - risicokader
- [Docs/Specs/process-pipeline.html](Docs/Specs/process-pipeline.html) - procesvisualisatie
- [Docs/backlog.md](Docs/backlog.md) - bouwbacklog

## Stack

| Laag | Keuze |
|---|---|
| Frontend | Next.js App Router, React, TypeScript, Tailwind (darkmode terminal) |
| Auth/DB | Supabase Auth + Postgres met RLS, migraties in `supabase/migrations/` |
| Hosting | Vercel |
| LLM | OpenAI: goedkoop filtermodel + sterk analysemodel (server-only) |
| Bronnen | Finnhub, SEC EDGAR, RSS, GDELT/Marketaux, Alpha Vantage movers |
| Tests | Playwright e2e + unit tests op pipeline-helpers |

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

- Documentatie Nederlands, code en UI-copy Engels.
- Nieuwe env vars altijd in `.env.example` en `Docs/dependencies.md`.
- Geen secrets committen; alle provider-keys server-only.
- Datarechten afdwingen met Supabase RLS.
- Na codewijzigingen: `graphify update .` draaien als `graphify` beschikbaar is.
- Elke sessie een entry in `Docs/implementation-log.md`.
