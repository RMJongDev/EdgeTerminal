# Technical Design - Edge Terminal

> Status: bouwvoorbereiding. Dit document beschrijft de technische inrichting zonder Vercel- of Supabase-project aan te maken.
> Laatst aangepast: 2026-06-03 - afgestemd op Discovery Candidate Quality MVP.

## Architectuur

```text
[Browser]
  |
  v
[Next.js App Router]
  |-- Server Components for dashboards/lists
  |-- Server Actions for CRUD and workflow actions
  |-- Route handlers for discovery scans, AI endpoints and future scheduled jobs
  |
  +--> [Supabase Auth + Postgres + RLS]
  |
  +--> [Discovery Source Funnel]
       |-- broad news/search provider
       |-- financial news/sentiment feed
       |-- primary sources and calendars
       |-- market context provider
  |
  +--> [Discovery Candidate Quality Layer] normalize / dedupe / rank / triage
  |
  +--> [OpenAI]  event analysis / setup / risk review / briefing
  |
  +--> [Gemini] web research / candidate enrichment / market context
  |
  +--> [Market data provider] movers / delayed quotes / context
```

## Runtime modes

### Demo mode

Wanneer Supabase-env ontbreekt:
- app toont demo-data;
- forms en actions geven een vriendelijke melding of redirect;
- discovery toont voorbeeld-candidates en providerstatus;
- discovery gebruikt deterministic mock candidates met source quality, recency, dedupe hints en score breakdown;
- dashboard en MVP-schermen blijven reviewbaar;
- Playwright smoke tests kunnen zonder extern project draaien.

### Live mode

Wanneer Supabase-env aanwezig is:
- protected app vereist Supabase Auth;
- data komt uit Supabase-tabellen;
- RLS beperkt data tot `auth.uid()`;
- AI keys blijven server-only.
- discovery scans draaien server-side vanuit een authenticated owner action en schrijven candidate events naar Supabase.
- een echte scheduled cron wordt pas toegevoegd wanneer de server-side schrijfrechten expliciet zijn gekozen en gedocumenteerd.

### Discovery execution modes

| Mode | Doel | Techniek |
|---|---|---|
| Mock discovery | UI en tests zonder provider | Deterministische demo-candidates in `demo-data.ts` of `discovery.ts` |
| Manual refresh | MVP live flow | Authenticated server action/route handler schrijft op `auth.uid()` |
| Provider scan | Eerste echte integratie | Discovery source funnel + market context, server-only keys |
| Future cron | Later ochtendscan zonder klik | Route handler met `DISCOVERY_SCAN_CRON_SECRET` en expliciet gekozen server-side write strategy |

## Discovery source funnel

De technische discovery-laag probeert niet "het hele internet" te crawlen. Elke scan haalt gecontroleerde bronitems op uit adapters, slaat provenance op en laat de Candidate Quality Layer pas daarna normaliseren, dedupliceren en ranken.

```text
fetchBroadNewsSources()
  -> fetchFinancialNewsSources()
  -> fetchPrimarySourceItems()
  -> fetchMarketContext()
  -> normalizeSourceItems()
  -> dedupeCandidates()
  -> scoreCandidates()
  -> rankTopCandidates(10)
```

Bronlagen:

| Laag | MVP-bronnen | Doel |
|---|---|---|
| Broad news/search | GDELT of NewsAPI-achtige provider | Brede actuele nieuwsdekking buiten de watchlist |
| Financiele nieuwsfeed | Alpha Vantage News/Sentiment als startoptie; Benzinga/Finnhub later | Ticker-, sector-, sentiment- en topicgerichte marktitems |
| Primaire bronnen | SEC EDGAR, company IR/press releases, earnings calendars, FRED/officiele macro calendars | Verifieerbare filings, bedrijfsfeiten en macro-events |
| Market context | Delayed quotes, movers, volume, sector/ETF-context | Bepalen of een nieuwsfeit marktimpact lijkt te hebben |
| Candidate Quality Layer | Eigen code + AI-promptversies | Concrete events maken, dedupen, bronkwaliteit/ranking bepalen |

Adapterregels:
- elke bronadapter retourneert `provider`, `source_category`, `provider_item_id`, `source_name`, `source_url`, `published_at`, `fetched_at`, `title`, `snippet`, `symbols`, `topics` en `raw_payload_ref` waar beschikbaar;
- betaalde of gelicentieerde content wordt niet integraal in de UI herpubliceerd;
- primaire bronnen krijgen hogere `source_quality_score` dan herhaalde headlines of zwakke aggregators;
- market movers zonder concreet nieuwsfeit worden als context opgeslagen, niet automatisch als candidate;
- watchlist/asset preferences worden pas in scoring gebruikt en vormen nooit een harde query-grens;
- optionele scan hints mogen extra query-termen en ranking boost geven, maar mogen de brede bronfunnel niet vervangen.

## Env vars

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=
OPENAI_API_KEY=
OPENAI_ANALYSIS_MODEL=
GEMINI_API_KEY=
GEMINI_RESEARCH_MODEL=
NEWS_DISCOVERY_API_KEY=
NEWS_DISCOVERY_BASE_URL=
MARKET_DATA_API_KEY=
MARKET_DATA_BASE_URL=
DISCOVERY_SCAN_CRON_SECRET=
```

## Database

Belangrijkste tabellen:
- `profiles`;
- `discovery_runs`;
- `event_sources`;
- `event_candidates`;
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

### Discovery candidate quality tables

De eerste technische slice draait om deze drie tabellen:

#### `discovery_runs`

Doel: vastleggen van elke brede scan, ook als de provider faalt of alleen demo-data gebruikt wordt.

Minimale velden:
- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `status`: running, completed, failed;
- `trigger`: manual, morning, mock, future_cron;
- `provider`: mock, news_search, market_data, mixed;
- `context_hints jsonb`: optionele user-input zoals tickers, onderwerpen, vragen en hint-mode;
- `started_at`;
- `completed_at`;
- `source_count`;
- `candidate_count`;
- `top_candidate_count`;
- `error_message`;
- `metadata jsonb`.

#### `event_sources`

Doel: bronitems en payload-referenties bewaren zonder betaalde content integraal te herpubliceren.

Minimale velden:
- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `discovery_run_id uuid references discovery_runs(id)`;
- `provider`;
- `source_category`: broad_news, financial_feed, primary_source, macro_calendar, market_context, manual;
- `provider_item_id`;
- `source_name`;
- `source_url`;
- `published_at`;
- `fetched_at`;
- `raw_payload_ref`;
- `title`;
- `snippet`;
- `source_quality_score numeric`;
- `metadata jsonb`.

#### `event_candidates`

Doel: gerankte discovery-output voordat Robin iets accepteert, negeert, samenvoegt of analyseert.

Minimale velden:
- `id uuid primary key`;
- `user_id uuid references auth.users(id)`;
- `discovery_run_id uuid references discovery_runs(id)`;
- `title`;
- `summary`;
- `reason_to_watch`;
- `affected_symbols text[]`;
- `affected_markets text[]`;
- `event_type_guess`;
- `impact_direction_guess`;
- `impact_level_guess`;
- `relevance_score numeric`;
- `confidence_score numeric`;
- `source_quality_score numeric`;
- `recency_score numeric`;
- `dedupe_key`;
- `merge_hint`;
- `candidate_status`: new, accepted, ignored, merged, analyzed;
- `ignore_reason`;
- `accepted_market_event_id uuid references market_events(id)`;
- `source_ids uuid[]`;
- `raw_payload_refs text[]`;
- `score_breakdown jsonb`;
- `uncertainty_notes text`;
- `created_at`;
- `updated_at`.

Candidate lifecycle:

```text
new
  -> accepted -> market_event
  -> ignored  -> stored with ignore_reason
  -> merged   -> linked to canonical candidate/event
  -> analyzed -> analysis can still result in accept, ignore or no_trade
```

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
| `src/lib/edge-terminal/discovery.ts` | orchestratie van bron-ingestie, normalisatie, dedupe, ranking en triage |
| `src/lib/edge-terminal/discovery-providers.ts` | adapters voor broad news/search, financiele feeds, primaire bronnen en market context |
| `src/lib/edge-terminal/discovery-scoring.ts` | pure score helpers voor relevance/source quality/recency/dedupe breakdown |
| `src/lib/edge-terminal/discovery-types.ts` | provider payloads, candidate status, score breakdown en prompt schema's |
| `src/lib/edge-terminal/ai.ts` | provider-agnostische AI-flow placeholders |
| `src/lib/edge-terminal/metrics.ts` | performance-statistieken |

Discovery functies:

- `createDiscoveryRun(contextHints?)` maakt een run met status `running` en bewaart optionele scan hints;
- `fetchDiscoverySources()` orkestreert mock of provider-bronnen vanuit de source funnel;
- `fetchBroadNewsSources()`, `fetchFinancialNewsSources()`, `fetchPrimarySourceItems()` en `fetchMarketContext()` leveren uniforme source items;
- `normalizeSourcesToCandidates()` zet ruwe bronitems om naar candidate drafts;
- `dedupeCandidates()` voegt dubbele headlines of bronitems samen via `dedupe_key` en `merge_hint`;
- `scoreCandidates()` berekent relevance, source quality, recency, confidence en uncertainty;
- `rankTopCandidates()` kiest de top 10, zonder watchlist als harde filter;
- `completeDiscoveryRun()` schrijft aantallen, status en eventuele fouten weg;
- `acceptCandidate()`, `ignoreCandidate()`, `mergeCandidate()` en `analyzeCandidate()` voeren triage-acties uit.

## Routes

| Route | Doel |
|---|---|
| `/` | product-entry |
| `/login` | Supabase auth |
| `/dashboard` | daily command dashboard |
| `/watchlist` | assets CRUD |
| `/events` | discovery candidates + accepted market events |
| `/events/[id]` | event detail, analysis, linked setups |
| `/api/discovery/run` | route handler voor handmatige discovery scan vanuit Dashboard/Event Radar |
| `/api/discovery/cron` | toekomstige cron-entrypoint, beschermd met `DISCOVERY_SCAN_CRON_SECRET` |
| `/setups` | setups, counterarguments and risk reviews |
| `/signals` | redirect naar `/setups` voor oude links |
| `/risk` | redirect naar `/setups` voor oude links |
| `/paper-trades` | open/closed paper trades |
| `/performance` | performance lab |
| `/briefing` | daily briefing |
| `/ai-log` | AI analysis audit trail |

## AI-flow

### Broad event discovery

Input:
- broad news/search source items;
- financiele nieuws/sentiment source items;
- primaire bronitems: SEC filings, company IR/press releases, earnings calendars en macro release calendars;
- market movers, delayed quote context, volume en sector/ETF-context;
- optionele scan hints: tickers, topics, vrije researchvraag en hint-mode;
- optionele watchlist/asset preferences als ranking-context, niet als harde filter.

Output:
- `candidate_title`;
- `candidate_summary`;
- `source_refs`;
- `affected_symbols`, `affected_sectors`, `affected_etfs` or `affected_market_regimes`;
- `event_type_guess`;
- `impact_direction_guess`;
- `impact_level_guess`;
- `relevance_score`;
- `confidence_score`;
- `source_quality_score`;
- `recency_score`;
- `dedupe_key`;
- `merge_hint`;
- `reason_to_watch`;
- `score_breakdown`;
- `uncertainty_notes`.

Rules:
- geen candidate zonder concrete gebeurtenis of aantoonbare marktcontext;
- geen candidate zonder bronreferentie, publicatietijd en onzekerheidsnotitie;
- brede marktdekking gaat voor watchlist-dekking;
- brede marktdekking gaat ook voor scan-hint-dekking;
- primaire bronnen en bevestigde bedrijfs/macro-feiten wegen zwaarder dan herhaalde headlines;
- bronkwaliteit en recency wegen mee in ranking;
- duplicate headlines mogen niet meerdere top 10 plekken innemen;
- weak-source candidates mogen zichtbaar zijn, maar moeten als onzeker gemarkeerd worden;
- `ignore` en `merge` worden als waardevolle uitkomst gelogd;
- top 10 is compact en actiegericht, maar blijft hypothese;
- legal/compliance: gebruik toegestane API's/feeds en respecteer robots/licenties als er scraping wordt toegevoegd.

Score breakdown:

```text
candidate_quality_score =
  relevance_score
+ source_quality_score
+ recency_score
+ dedupe_confidence
+ market_context_score
+ watchlist_preference_fit
+ scan_hint_fit
- uncertainty_penalty
```

De score is rankinghulp, geen advies. De UI toont altijd de onderliggende reden en onzekerheid.

Promptversies:
- `event-discovery-v1`: normaliseert ruwe bronitems naar candidate events.
- `candidate-dedupe-v1`: herkent dubbele headlines en mergebare bronnen.
- `candidate-ranking-v1`: scoort candidates op verwachte marktimpact, recency, bronkwaliteit en onzekerheid.
- `source-quality-v1`: beoordeelt of bronnen voldoende betrouwbaar en recent zijn voor analyse.

### Event analysis

Input:
- accepted event of event candidate;
- linked assets;
- optional Gemini research context;
- source quality, recency, dedupe/merge hints;
- market move / source notes.

Output:
- sentiment;
- impact level;
- time horizon;
- confidence score;
- Event Intelligence Score als latere laag bovenop candidate quality;
- bull case;
- bear case;
- no-trade case;
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
- candidate provenance wanneer beschikbaar.

Output:
- counterargument;
- weak assumptions;
- reason to skip;
- thesis killer;
- source/recency/dedupe risk wanneer relevant;
- risk score;
- verdict.

## Candidate triage

Triage-acties zijn server-side en werken altijd op `event_candidates`.

| Actie | Technisch effect |
|---|---|
| accept | Maakt `market_events` record, koppelt `accepted_market_event_id`, zet `candidate_status=accepted` |
| ignore | Zet `candidate_status=ignored`, vereist `ignore_reason`, bewaart candidate als leerdata |
| merge | Zet `candidate_status=merged`, vult `merge_hint` of canonical reference in metadata |
| analyze | Maakt of hergebruikt event analysis input; status wordt `analyzed` als er nog geen market event ontstaat |

Triage-regels:
- een accepted candidate mag niet opnieuw als los market event worden geaccepteerd;
- ignored candidates blijven filterbaar in Event Radar;
- merged candidates tellen niet mee als aparte top 10 item;
- analyze mag eindigen in accept, ignore, no_trade of setup generation;
- alle triage-acties worden in `ai_analysis_logs` of een audit payload vastgelegd wanneer AI-output is gebruikt.

## Market data

MVP gebruikt:
- delayed market-data provider zodra gekozen;
- handmatige price fields alleen als correctie/fallback;
- movers als discovery-signaal voor onverwachte events;
- market data is context voor candidate ranking, niet de enige bron van waarheid.

Providercriteria:
- VS equities;
- EU equities;
- ETF coverage;
- betaalbaar;
- eenvoudige REST API;
- duidelijke licentie voor persoonlijk gebruik.

## Source discovery strategy

MVP-startkeuze:
- begin met een generieke broad news/search adapter plus een financiele nieuwsfeed;
- gebruik primaire bronnen als verificatie- en kwaliteitsboost, niet als enige discovery-ingang;
- gebruik market data/movers als context om te beoordelen of een feit marktimpact lijkt te hebben;
- houd de providerlaag vervangbaar zodat GDELT/NewsAPI/Alpha Vantage later door Benzinga/Finnhub of andere feeds aangevuld kan worden.

Providercriteria per laag:

| Laag | Criteria |
|---|---|
| Broad news/search | brede dekking buiten Robin's watchlist, query op topics/symbols/sectors, URL's en timestamps beschikbaar |
| Financiele feed | ticker/topic/sentiment metadata, marktgerichte bronselectie, betaalbaar voor personal research |
| Primaire bronnen | filings, press releases, earnings/macro calendars, stabiele identifiers en publicatietijden |
| Market context | delayed quotes, movers, volume, sector/ETF-context, eenvoudige REST API |
| Alle lagen | duidelijke gebruiksrechten, server-only keys, rate limits voor ochtendscan en handmatige refresh |

Discovery cadence:
- standaard ochtendscan voor de daily top 10;
- handmatige refresh vanuit Dashboard/Event Radar;
- intraday refresh alleen als expliciet gestart in MVP;
- later optionele alerts of scheduled intraday scans.

Failure modes:
- als brede news/search faalt, kan de app nog primaire bronnen en market context tonen;
- als financiele feed ontbreekt, blijft broad news/search + primaire bronnen bruikbaar maar met lagere confidence;
- als market data faalt, blijft candidate discovery werken maar market_context_score wordt lager of onbekend;
- providerfouten worden zichtbaar op Dashboard en in `discovery_runs.error_message`.

## Security

- Supabase service-role key niet gebruiken in client.
- OpenAI/Gemini keys alleen server-side.
- News/search/market-data keys alleen server-side.
- RLS verplicht op user-data tabellen.
- Geen financieel advies copy in UI.
- AI-output loggen voor auditability.
- Discovery bronpayloads loggen zonder betaalde content integraal te herpubliceren in de UI.
- `raw_payload_ref` verwijst naar opgeslagen metadata of provider-id; lange content wordt samengevat en niet integraal doorgegeven aan client.
- Cron-routes vereisen secret-check en mogen pas live schrijven wanneer de user/write-strategy expliciet is ingericht.

## Teststrategie

- Unit-ish coverage via TypeScript helpers voor metrics.
- Unit-ish coverage voor discovery scoring:
  - source quality score;
  - recency score;
  - dedupe key/merge hints;
  - top 10 ranking zonder watchlist hard-filter.
- Playwright smoke:
  - home toont Edge Terminal;
  - login bereikbaar;
  - dashboard toont demo cockpit met top 10 candidate discovery zonder Supabase;
  - candidate card toont reason_to_watch, source quality, recency en status;
  - Event Radar toont candidate triage states;
  - hoofdschermen bereikbaar;
  - paper-trade/performance flow zichtbaar.
- Later authenticated e2e met Supabase storage state.

## Bouwvolgorde

1. Styleguide/docs.
2. Discovery datamodel: `discovery_runs`, `event_sources`, `event_candidates` met candidate quality fields.
3. Database migratie voor bestaande domain tables en RLS.
4. Discovery types en uniforme source item schema's.
5. Deterministische mock source funnel met broad news/search, financiele feed, primaire bronnen en market context.
6. Scoring helpers voor source quality, recency, dedupe, market context en top 10 ranking.
7. Dashboard top 10 candidate cards met providerstatus en bronfunnel-status.
8. Event Radar candidate tabs en triage actions: accept, ignore, merge, analyze.
9. Candidate naar accepted market event flow.
10. AI analysis/setup/risk pipelines met candidate provenance.
11. Paper trades.
12. Performance Lab.
13. Echte provideradapter(s) voor broad news/search, financiele feed, primaire bronnen en market-data context.
14. Tests voor discovery scoring, dashboard, Event Radar en golden path.
15. Later: Event Intelligence Score, Scenario Library, Historical Reaction Lab en playbooks.
