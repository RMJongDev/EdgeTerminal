# Technical Design - Edge Terminal

> Status: bouwvoorbereiding. Dit document beschrijft de technische inrichting zonder Vercel- of Supabase-project aan te maken.

## Architectuur

```text
[Browser]
  |
  v
[Next.js App Router]
  |-- Server Components for dashboards/lists
  |-- Server Actions for CRUD and workflow actions
  |-- Route handlers for future AI endpoints if needed
  |
  +--> [Supabase Auth + Postgres + RLS]
  |
  +--> [OpenAI]  event analysis / setup / risk review / briefing
  |
  +--> [Gemini] web research / market context
  |
  +--> [Market data provider] optional delayed quotes
```

## Runtime modes

### Demo mode

Wanneer Supabase-env ontbreekt:
- app toont demo-data;
- forms en actions geven een vriendelijke melding of redirect;
- dashboard en MVP-schermen blijven reviewbaar;
- Playwright smoke tests kunnen zonder extern project draaien.

### Live mode

Wanneer Supabase-env aanwezig is:
- protected app vereist Supabase Auth;
- data komt uit Supabase-tabellen;
- RLS beperkt data tot `auth.uid()`;
- AI keys blijven server-only.

## Env vars

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=
OPENAI_API_KEY=
OPENAI_ANALYSIS_MODEL=
GEMINI_API_KEY=
GEMINI_RESEARCH_MODEL=
MARKET_DATA_API_KEY=
MARKET_DATA_BASE_URL=
```

## Database

Belangrijkste tabellen:
- `profiles`;
- `assets`;
- `market_events`;
- `event_assets`;
- `event_analyses`;
- `trade_setups`;
- `risk_reviews`;
- `paper_trades`;
- `trade_evaluations`;
- `ai_analysis_logs`;
- `daily_briefings`.

Alle user-owned tabellen krijgen:
- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `created_at`;
- `updated_at`;
- RLS policies voor select/insert/update/delete op `auth.uid() = user_id`.

## Server modules

| Module | Doel |
|---|---|
| `src/lib/edge-terminal/types.ts` | domeintypes en enumwaarden |
| `src/lib/edge-terminal/demo-data.ts` | demo/fallback-data |
| `src/lib/edge-terminal/data.ts` | read helpers met Supabase/live en demo fallback |
| `src/lib/edge-terminal/actions.ts` | server actions voor CRUD/workflow |
| `src/lib/edge-terminal/ai.ts` | provider-agnostische AI-flow placeholders |
| `src/lib/edge-terminal/metrics.ts` | performance-statistieken |

## Routes

| Route | Doel |
|---|---|
| `/` | product-entry |
| `/login` | Supabase auth |
| `/dashboard` | daily command dashboard |
| `/watchlist` | assets CRUD |
| `/events` | market events + nieuw event |
| `/events/[id]` | event detail, analysis, linked setups |
| `/signals` | setup desk |
| `/risk` | risk reviews |
| `/paper-trades` | open/closed paper trades |
| `/performance` | performance lab |
| `/briefing` | daily briefing |
| `/ai-log` | AI analysis audit trail |

## AI-flow

### Event analysis

Input:
- event;
- linked assets;
- optional Gemini research context;
- market move / source notes.

Output:
- sentiment;
- impact level;
- time horizon;
- confidence score;
- bull case;
- bear case;
- key risks;
- perception split if applicable.

### Setup generation

Input:
- event;
- analysis;
- asset.

Output:
- direction: long, short, no_trade;
- strategy;
- entry logic;
- stop/target;
- invalidation;
- assumptions;
- confidence.

### Risk review

Input:
- setup;
- event;
- analysis.

Output:
- counterargument;
- weak assumptions;
- reason to skip;
- risk score;
- verdict.

## Market data

MVP gebruikt:
- handmatige price fields;
- optional delayed quote provider zodra gekozen.

Providercriteria:
- VS equities;
- EU equities;
- ETF coverage;
- betaalbaar;
- eenvoudige REST API;
- duidelijke licentie voor persoonlijk gebruik.

## Security

- Supabase service-role key niet gebruiken in client.
- OpenAI/Gemini keys alleen server-side.
- RLS verplicht op user-data tabellen.
- Geen financieel advies copy in UI.
- AI-output loggen voor auditability.

## Teststrategie

- Unit-ish coverage via TypeScript helpers voor metrics.
- Playwright smoke:
  - home toont Edge Terminal;
  - login bereikbaar;
  - dashboard toont demo cockpit zonder Supabase;
  - hoofdschermen bereikbaar;
  - paper-trade/performance flow zichtbaar.
- Later authenticated e2e met Supabase storage state.

## Bouwvolgorde

1. Styleguide/docs.
2. Database migratie.
3. Domain data/actions.
4. App shell/routes.
5. CRUD watchlist/events.
6. AI placeholders.
7. Paper trades.
8. Performance Lab.
9. Tests.
