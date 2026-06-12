# Technical Design - Edge Terminal

> Status: herijkt naar adviesmachine, bouwvoorbereiding voor slice 1.
> Laatst aangepast: 2026-06-12 - vervangt de triage-first versie volledig.
> Functionele eisen: `functional-design.md`. Procesvisualisatie: `process-pipeline.html`. Risicokader en drempels: `risk-framework.md`.

## Architectuur

```text
[Browser]
  |
  v
[Next.js App Router op Vercel]
  |-- Server Components voor dashboard/advieslijst/tracking
  |-- Server Actions voor run-start, correcties, taken-markering
  |-- Route handlers voor pipeline-run en (later) cron
  |
  +--> [Supabase Auth + Postgres + RLS]
  |
  +--> [Advice Pipeline] (server-side orchestratie, een module)
        |
        |-- 1. Source funnel adapters
        |     |-- broad news/search   (GDELT + RSS/IR feeds)
        |     |-- financiele feed     (Finnhub of Alpha Vantage News & Sentiment)
        |     |-- primaire bronnen    (SEC EDGAR, earnings calendar)
        |     |-- market context      (delayed quotes, movers)
        |
        |-- 2. Mover sweep: onverklaarde movers -> gerichte nieuws-fetch (code + marktdata)
        |-- 3. Normalisatie + dedupe/clustering        (code, geen LLM)
        |-- 4. Filter + voor-ranking                   (goedkoop LLM-model)
        |-- 5. Per candidate: analyse -> setup -> risk (sterk LLM-model)
        |-- 6. Uitvoerbaarheidscheck                   (code + marktdata)
        |-- 7. Advice assembly + ranking -> top 5      (LLM + code)
        |-- 8. Tracking update                         (code + delayed quotes)
        |
        +--> alle stappen loggen naar ai_analysis_logs (incl. kosten)
```

## Runtime modes

### Demo mode (Supabase-env ontbreekt)

- App toont demo-adviezen en demo-runstatus; UI blijft reviewbaar en Playwright-testbaar zonder extern project.
- Pipeline draait met deterministische mock-adapters en mock-LLM-stappen.

### Live mode

- Supabase Auth verplicht; RLS beperkt data tot `auth.uid()`.
- Pipeline draait server-side vanuit een authenticated owner action; alle keys server-only.
- Cron (slice 3) via route handler met `DISCOVERY_SCAN_CRON_SECRET` en een expliciet ingerichte server-side write-strategie.

## Pipeline-orchestratie

Een run is een keten die zelfstandig doorloopt; elke stap schrijft zijn tussenresultaat weg zodat een gefaalde run herstart kan worden vanaf de laatste gelukte stap.

```text
startRun(profile: "eu_open" | "us_open", trigger: "manual" | "cron")
  -> createDiscoveryRun()                          discovery_runs (status: running)
  -> fetchSources(profile)                         event_sources       [parallel per adapter]
  -> moverSweep()                                  event_sources       [code + marktdata]
       top movers/decliners ophalen (US via gainers/losers-endpoint, EU via quote-sweep
       over een vast large-cap universum); elke flinke beweging zonder verklarend bronitem
       krijgt een gerichte nieuws-fetch (company news op ticker + brede query op naam);
       gevonden nieuws wordt een bronitem met de koersreactie als bewijs
  -> normalizeSources()                            uniforme source items
  -> dedupeAndCluster()                            dedupe_key + clusters (code: titel/symbool/tijd-similarity)
  -> filterCandidates()                            event_candidates    [goedkoop LLM, batch]
       selecteert kansrijke candidates (~10-15) met reason_to_watch en voor-rank
  -> for each kansrijke candidate (parallel, max N):
       analyzeEvent()                              event_analyses      [sterk LLM]
       generateSetup()                             trade_setups        [sterk LLM; long/short/none]
       reviewRisk()                                risk_reviews        [sterk LLM; tegenargument verplicht]
       checkExecutability()                        spread/liquiditeit/kosten + kostenhorde (risk-framework)
  -> assembleAdvices()                             advices             [LLM + code]
       bundelt setup+risk+uitvoerbaarheid tot adviezen; rankt; cap op 5; mag 0 opleveren
  -> updateTracking()                              advice_tracking     [code + delayed quotes]
  -> completeRun()                                 discovery_runs (status, counts, kosten, fouten)
```

Regels:
- elke bronlaag-failure is non-fatal: run draait door met de overige lagen en logt wat er miste;
- de mover sweep maakt nooit direct een candidate: een beweging zonder gevonden bronitem blijft context ("unexplained move" op het dashboard); de regel "geen candidate zonder bron" blijft altijd gelden;
- de brede laag draait naast watchlist/sector-query's altijd generieke event-pattern-query's (negatieve tone + marktbewegingstaal), zodat onbekende namen en perception events vindbaar blijven;
- de filter-stap krijgt nooit meer dan een batchgrootte aan items per LLM-call; kosten per run worden opgeteld en gelogd;
- setup-richting `none` stopt de keten voor die candidate (geen advies, wel gelogd waarom);
- een risk review met verdict `skip` blokkeert advies-assembly voor die candidate;
- de assembly vult nooit op naar vijf; ranking weegt confidence, risk score, bronkwaliteit, recency en uitvoerbaarheid;
- de assembly past de kostenhorde en een correlatie-check toe: een advies in hetzelfde sector/thema als open posities of hoger gerankte adviezen krijgt een warning en rank-penalty (drempels: `risk-framework.md`);
- alle prompts gebruiken structured outputs (JSON schema) en worden integraal gelogd met promptversie.

## Run-profielen

| Veld | `eu_open` | `us_open` |
|---|---|---|
| Tijdvenster bronnen | sinds vorige US-close, nadruk overnight/Azie/EU-ochtend | sinds EU-run, nadruk US premarket en dagnieuws |
| Query-context | EU-tickers/sectoren zwaarder | US-tickers/macro zwaarder |
| Market context | EU-indices, EU-movers waar beschikbaar | US premarket movers, US-indices |

Profiel wordt opgeslagen op `discovery_runs.run_profile` en meegegeven aan adapters, filter en ranking.

## Providerstack (startkeuze)

| Laag | Start | Vervangbaar door |
|---|---|---|
| Broad news | GDELT (gratis) + RSS-lijst (persbureaus, company IR) | NewsAPI-achtige provider |
| Financiele feed | Finnhub of Alpha Vantage News & Sentiment, gratis tier | Benzinga/Finnhub betaald |
| Primair | SEC EDGAR (gratis), earnings calendar via feed | - |
| Marktdata | Finnhub/EODHD/Twelve Data delayed; EU-dekking is selectiecriterium | EODHD all-world bij EU-gat |
| LLM filter | OpenAI goedkoop model (env: `OPENAI_FILTER_MODEL`) | - |
| LLM analyse | OpenAI sterk model (env: `OPENAI_ANALYSIS_MODEL`) | - |

Definitieve keuze per laag wordt in week 1 van slice 1 bevestigd door de gratis tiers te testen op EU-dekking; de adapter-interface verandert daar niet door. Concrete endpoints, limieten, RSS-startlijst en het ophaalpatroon per bron: `news-sources.md`. Licentieregels: geen betaalde content integraal herpubliceren; robots/licenties respecteren; alleen officiele API's en open feeds.

## Env vars

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=

# OpenAI - server-only; actuele modelnamen invullen bij bouw
OPENAI_API_KEY=
OPENAI_FILTER_MODEL=
OPENAI_ANALYSIS_MODEL=

# Bronnen - server-only
FINANCIAL_NEWS_API_KEY=      # Finnhub
FINANCIAL_NEWS_BASE_URL=
BROAD_NEWS_API_KEY=          # Marketaux (GDELT kan zonder key)
MOVERS_API_KEY=              # Alpha Vantage TOP_GAINERS_LOSERS (mover sweep)
EDGAR_USER_AGENT=            # verplicht voor SEC EDGAR: naam + e-mail
MARKET_DATA_API_KEY=
MARKET_DATA_BASE_URL=

# Automatisering (slice 3)
DISCOVERY_SCAN_CRON_SECRET=
```

`GEMINI_*` en `NEWS_DISCOVERY_*` vars zijn vervallen. `.env.example` en `Docs/dependencies.md` zijn bijgewerkt op 2026-06-12; de code migreert mee in EPIC-14 van het backlog.

## Database

Bestaande tabellen blijven: `profiles`, `discovery_runs`, `event_sources`, `event_candidates`, `market_events`, `event_assets`, `assets`, `event_analyses`, `trade_setups`, `risk_reviews`, `ai_analysis_logs`, `daily_briefings`.

Wijzigingen voor de adviesmachine:

### `discovery_runs` - uitbreiden

- `run_profile`: `eu_open` | `us_open` | `mock`;
- `cost_summary jsonb`: tokens/kosten per stap;
- bestaande velden (status, trigger, counts, error_message) blijven.

### `advices` - nieuw (kernentiteit)

- `id`, `user_id`, `discovery_run_id`;
- `candidate_id`, `analysis_id`, `setup_id`, `risk_review_id` (de keten);
- `ticker`, `direction` (`long`/`short`), `market` (`us`/`eu`);
- `entry_zone_low`, `entry_zone_high`, `stop_loss`, `target`;
- `horizon_days int`, `size_suggestion_eur numeric`;
- `confidence numeric`, `rank int` (1-5);
- `reasoning text`, `counterargument text`, `invalidation text`;
- `source_refs jsonb` (URL + publicatietijd per bron);
- `executability_note text`;
- `expected_move_pct numeric`, `cost_estimate_pct numeric` (input voor de kostenhorde);
- `status`: `active`, `expired`, `invalidated`, `rejected_by_user`;
- `taken_by_user boolean`, `user_entry_price`, `user_exit_price`, `user_note`;
- `created_at`, `updated_at`.

### `advice_tracking` - nieuw (vervangt handmatige paper trades)

- `id`, `user_id`, `advice_id`;
- `reference_entry numeric` (midden entry-zone op adviesmoment);
- `d1_return`, `d3_return`, `d5_return` (numeric, vs. reference_entry, richtinggecorrigeerd);
- `stop_hit_at`, `target_hit_at`, `expired_at`;
- `final_return numeric`, `outcome`: `target`, `stop`, `expired_positive`, `expired_negative`, `invalidated`;
- `last_checked_at`, `last_price numeric`;
- `created_at`, `updated_at`.

Tracking-update draait bij elke run en bij handmatige refresh: haalt delayed quotes op voor alle open adviezen, berekent returns en zet uitkomsten. Geen realtime-eis; D-waarden zijn handelsdagen.

### `paper_trades` / `trade_evaluations` - uitfaseren

Worden vervangen door `advices` + `advice_tracking`. Bestaande migratiebestanden blijven (historie), een nieuwe migratie voegt de nieuwe tabellen toe; de oude tabellen worden niet meer door de app gebruikt en kunnen in een latere opruimmigratie vervallen.

Alle nieuwe tabellen: `user_id` + RLS (`auth.uid() = user_id`) + `updated_at`-trigger, conform bestaande conventie.

## LLM-keten en promptversies

Provider: **OpenAI** (besluit 2026-06-12). Goedkoop model voor filter/briefing, sterk model voor analyse/setup/risk/assembly. Concrete modelnamen bij bouwstart kiezen (actueel, prijzen verifieren tegen ~EUR 30-50/mnd bij 2 runs/dag) en vastleggen in env + `Docs/dependencies.md`. Alle calls gebruiken structured outputs. Gegenereerde output (adviezen, briefings) is Engels.

| Stap | Model | Promptversie | Output (structured) |
|---|---|---|---|
| Filter + voor-ranking | goedkoop | `advice-filter-v1` | per item: kansrijk ja/nee, reason_to_watch, voor-rank, affected symbols |
| Event analysis | sterk | `advice-analysis-v1` | sentiment, impact, horizon, bull/bear case, onzekerheid, perception split |
| Setup generation | sterk | `advice-setup-v1` | richting (long/short/none), entry-logica, stop, target, aannames |
| Risk review | sterk | `advice-risk-v1` | tegenargument, thesis killer, zwakke aannames, risk score, verdict (ok/skip) |
| Advice assembly + ranking | sterk | `advice-assembly-v1` | definitieve adviesvelden, rank, of besluit "geen advies" met reden |
| Briefing | goedkoop | `advice-briefing-v1` | run-samenvatting in 2 minuten leestijd |

Prompt-invariants (in elke prompt):
- adviseer alleen op aantoonbaar event + bron; verzin geen nieuws;
- `none`/"geen advies" is een goede uitkomst; vul nooit op naar een aantal;
- weeg in wat al ingeprijsd kan zijn (koersreactie sinds publicatie meegeven);
- jaag geen beweging na: beoordeel expliciet of de reactie over- of onderdreven is; entry-logica op pullback of bevestiging, niet op chase;
- benoem gap-risico en bij shorts squeeze-risico; een stop is een intentie, geen garantie - de positiegrootte rekent met slippage;
- pas de kostenhorde toe: verwachte round-trip kosten <= 1/3 van de verwachte beweging, anders no-trade of rank-penalty (drempels: `risk-framework.md`);
- output in het vastgelegde JSON-schema, geen vrije tekst erbuiten.

Elke call logt naar `ai_analysis_logs`: prompt_version, model, input_payload, output_payload, tokens/kosten, status. Promptversies zijn daardoor achteraf vergelijkbaar op advies-uitkomst (Performance Lab per prompt_version is een slice 3-inzicht).

## Routes

| Route | Doel |
|---|---|
| `/` | product-entry |
| `/login` | Supabase auth |
| `/dashboard` | advieslijst + run-start + runstatus |
| `/advices/[id]` | advies detail met volledige keten |
| `/events` | Event Radar: candidates, clusters, correcties |
| `/events/[id]` | event/candidate detail |
| `/watchlist` | rankingcontext CRUD |
| `/tracking` | alle adviezen met uitkomsten (vervangt `/paper-trades`, redirect) |
| `/performance` | Performance Lab |
| `/briefing` | briefing per run |
| `/ai-log` | audit trail + kosten |
| `/process` | procesoverzicht (verwijst naar process-pipeline.html inhoud) |
| `/api/pipeline/run` | route handler: start run (profile param), authenticated |
| `/api/pipeline/cron` | slice 3: cron-entrypoint met secret |

Oude routes `/setups`, `/signals`, `/risk`, `/paper-trades` redirecten naar `/dashboard` of `/tracking`.

## Security

- Alle provider- en LLM-keys server-only; nooit in client components.
- RLS verplicht op alle user-data tabellen.
- Cron-route vereist secret en expliciete write-strategie voordat hij live schrijft.
- Bronpayloads opslaan als referentie/samenvatting; betaalde content niet integraal herpubliceren.
- Adviezen zijn voor Robin alleen; geen publieke endpoints met advies-output.

## Teststrategie

- Unit tests (code, geen LLM): normalisatie, dedupe/clustering, uitvoerbaarheidscheck, tracking-berekening (D1/D3/D5, stop/target-detectie, richtinggecorrigeerde returns), assembly-capregels.
- Contract tests per adapter met opgenomen fixtures (geen live calls in CI).
- Golden scenario-fixture (Ferrari-case): een flinke daler buiten de watchlist met negatief nieuws komt via de mover sweep als candidate boven en doorloopt de keten tot advies of onderbouwde no-trade.
- LLM-stappen mockbaar via dezelfde interface als demo mode.
- Playwright golden path: login -> run starten (mock) -> top 5 zichtbaar -> advies detail -> taken markeren -> tracking toont advies.
- Kosten-assertie: een mock-run logt een cost_summary; live runs tonen kosten op dashboard/AI-log.

## Bouwvolgorde slice 1

1. Migratie: `advices`, `advice_tracking`, `discovery_runs.run_profile` + `cost_summary`, RLS.
2. Supabase-project + Vercel live; auth golden path werkend.
3. Pipeline-skeleton met mock-adapters en mock-LLM end-to-end (bestaande demo-code ombouwen naar de nieuwe keten).
4. Echte adapters: financiele feed + EDGAR + delayed quotes + mover sweep (gratis tiers, EU-dekking testen).
5. Echte LLM-calls: filter-stap, daarna analyse/setup/risk, daarna assembly; per stap structured outputs + logging.
6. Dashboard-advieslijst + Advies Detail.
7. Run-profielen eu_open/us_open.
8. Playwright + unit tests op de nieuwe keten.

Slice 2: tracking-update job, taken-markering, Performance Lab op adviezen. Slice 3: cron, dedupe-verbetering, bronmix, promptversie-vergelijking.
