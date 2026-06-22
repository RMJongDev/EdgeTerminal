# Backlog - Edge Terminal (bouwbacklog)

> Opgesteld 2026-06-12 voor uitvoering door een bouw-AI. Dit document is de werk-queue; de specs in `Docs/Specs/` zijn de bron van waarheid.
> Het oude backlog (demo-skelet, alles "done") staat onderaan als archief.

## Leeswijzer voor de bouw-AI

**Verplichte leesvolgorde voor je begint:** `AGENTS.md` -> `Docs/Specs/voorstel-specs.md` -> `functional-design.md` -> `technical-design.md` -> `news-sources.md` -> `risk-framework.md`. Open `process-pipeline.html` in een browser voor het totaalbeeld.

**Werkafspraken:**
1. Werk stories in volgorde af; afhankelijkheden staan per story. Parallel mag alleen als de afhankelijkheden het toelaten.
2. **[ROBIN]**-markering = input van Robin nodig (meestal API-keys). Vraag er concreet om ("ik heb X nodig, in te vullen als `VAR` in `.env.local`") en ga ondertussen door met wat zonder die input kan.
3. Demo mode (app werkt zonder env vars, met deterministische voorbeelddata) moet na elke story blijven werken - dat is hoe de Playwright-tests draaien. Local mode (`EDGE_RUNTIME_MODE=local`) is de MVP-runtime en gebruikt SQLite in `.data/`.
4. De bestaande code in `src/lib/edge-terminal/` is een triage-first demo-skelet. Strategie: bouw de nieuwe pipeline ernaast, hergebruik types/scoring/UI-primitives waar zinvol, schakel de UI om, ruim daarna oude code op (S-40). Niets half laten hangen.
5. Bij conflict tussen spec en backlog of tussen specs onderling: vraag Robin, kies niet stil.
6. UI-copy Engels; code Engels; documentatie Nederlands.

**Definition of Done - geldt voor elke story, naast de eigen acceptatiecriteria:**
- `pnpm typecheck`, `pnpm lint`, `pnpm build` groen; relevante tests groen (`pnpm test:e2e` en/of unit tests).
- Demo mode werkt zonder env vars.
- Geen secrets in de repo; nieuwe env vars in `.env.example` + `Docs/dependencies.md`.
- Entry in `Docs/implementation-log.md`; `graphify update .` gedraaid na codewijzigingen.
- Backlog-checkboxes van de story bijgewerkt.

## Overzicht en volgorde

| Epic | Doel | Status | Afhankelijk van |
|---|---|---|---|
| EPIC-10 | Herijking naar adviesmachine (docs) | done | - |
| EPIC-11 | Lokaal fundament: SQLite-runtime en datamodel | todo | - |
| EPIC-12 | Pipeline-kern: nieuwe keten end-to-end met mocks | todo | EPIC-11 (S-23) |
| EPIC-13 | Bronadapters: echte data | todo | EPIC-12 |
| EPIC-14 | LLM-keten: echte OpenAI-calls | todo | EPIC-12 |
| EPIC-15 | UI-ombouw naar advieslijst + tests | todo | EPIC-12 (UI kan parallel aan 13/14 in mock mode) |
| EPIC-16 | Uitkomstmeting, Performance Lab, risk guardrails, validatie | todo | EPIC-13 t/m 15 |
| EPIC-17 | Lokale validatie, kwaliteit en latere deploykeuze | todo | EPIC-16 |

**Robin-acties (los van stories, zo vroeg mogelijk):**
- [x] OpenAI API-key leveren (S-32) - lokaal in `.env.local`, niet committen.
- [x] Finnhub- en Alpha Vantage-keys leveren (S-26, S-30) - lokaal in `.env.local`, niet committen. Marketaux blijft optioneel/later (S-29); extra official/RSS-bronnen in S-28/S-30 zijn gratis en hebben geen keys nodig.
- [x] Trading-kapitaal vaststellen en invullen in `risk-framework.md` sectie 2 (EUR 2500).
- [x] Broker-startkeuze vastleggen: eToro voor MVP-validatie; IBKR-achtig alternatief aanbevolen voor structureel live traden.
- [ ] Supabase/Vercel pas beoordelen na lokale validatie; geen actie nodig voor het MVP.

---

## EPIC-10 - Herijking naar adviesmachine
**Status:** done (2026-06-12)
Alle specs, briefing, visualisatie en dit backlog beschrijven de adviesmachine: autonome pipeline, top 5 expliciete adviezen, twee run-profielen, mover sweep, kostenhorde, risk framework, automatische tracking. Besluiten: OpenAI als LLM-provider, Engelse UI-copy, keys op verzoek van Robin.

---

## EPIC-11 - Lokaal fundament

### S-21 - Local runtime mode zonder Docker/Supabase/Vercel
**Doel:** de app draait lokaal in een persistente MVP-mode zonder Docker, WSL, Supabase-cloud of Vercel.
**Referenties:** `technical-design.md` sectie Runtime modes en Database; `supabase/migrations/` blijft alleen pariteitsbron voor latere deploy.
**Taken:**
- [x] Voeg `EDGE_RUNTIME_MODE=local` en `EDGE_LOCAL_DB_PATH=.data/edge-terminal.sqlite` toe als runtimepad.
- [x] Voeg `.data/` toe aan `.gitignore`; secrets blijven in `.env.local`.
- [x] Bouw runtime-detectie voor `demo`, `local` en later `supabase`.
- [x] Loginroute en app shell tonen local-mode status; geen verplichte auth in local mode.
- [x] Documenteer reset/back-up van de lokale database.
**Acceptatiecriteria:**
- [x] App start zonder Docker/WSL/Supabase/Vercel in local mode.
- [x] `.data/edge-terminal.sqlite` wordt lokaal aangemaakt en niet gecommit.
- [x] Local mode toont "local" status in de shell.
- [ ] Demo mode werkt nog steeds wanneer env vars ontbreken.
**Afhankelijkheden:** geen. **Robin-input:** geen.

### S-22 - SQLite schema en lokale store
**Doel:** het adviesmachine-datamodel bestaat lokaal en is persistent.
**Referenties:** `technical-design.md` sectie Database; `supabase/migrations/` als pariteitsbron voor latere Postgres/Supabase deploy.
**Taken:**
- [x] Nieuwe module `src/lib/edge-terminal/store/` met SQLite-verbinding via Node 24 `node:sqlite`.
- [x] SQLite schema voor `discovery_runs`, `event_sources`, `event_candidates`, `source_payload_snapshots`, `pipeline_step_runs`, `advices`, `advice_tracking`, `assets`, `ai_analysis_logs`, `daily_briefings` en de bestaande analyse/setup/risk-entiteiten.
- [x] Seed/reset helper voor lokale ontwikkeling.
- [x] Store-interface maken zodat pipeline/UI niet direct aan SQLite of Supabase vastzit.
- [x] Supabase-migraties blijven bestaan als latere deploy-pariteit, maar worden niet voor MVP-runtime gebruikt.
**Acceptatiecriteria:**
- [x] Local store kan initialiseren, resetten en bestaande demo-fixtures seeden.
- [x] Data blijft behouden na app-restart.
- [x] Store-unit tests dekken create/read/update voor run, advice, tracking en AI-log.
- [x] `database.types.ts` blijft consistent met de latere Supabase-tabellen; SQLite types leven in de storelaag.
**Afhankelijkheden:** S-21.

### S-23 - Datalaag omschakelen naar store-interface
**Doel:** schermen en server actions lezen/schrijven via demo/local/supabase adapters in plaats van hardcoded Supabase als enige persistente pad.
**Taken:**
- [x] `getTerminalData()` kiest: demo-data bij `demo`, SQLite bij `local`, Supabase later bij env/config.
- [x] Server actions schrijven in local mode naar SQLite.
- [x] Supabase-clientpad blijft compileerbaar maar wordt niet gebruikt in het MVP.
- [x] Local-mode foutafhandeling: bij corrupte database duidelijke melding en reset-instructie.
**Acceptatiecriteria:**
- [x] Dashboard, Event Radar, Watchlist, AI Log en bestaande actions werken in local mode met persistente data.
- [x] Geen Supabase env nodig voor MVP.
- [x] Pipeline-contracttests draaien via `pnpm test:unit`.
- [x] `paper_trades`/`trade_evaluations` blijven bestaan (historie) maar worden vanaf EPIC-15 niet meer door de app gebruikt.
**Afhankelijkheden:** S-22.

---

## EPIC-12 - Pipeline-kern (nieuwe keten, mock end-to-end)

### S-24 - Pipeline-module en startRun
**Doel:** de autonome keten bestaat als code en draait end-to-end met mock-adapters en mock-LLM.
**Referenties:** `technical-design.md` § Pipeline-orchestratie (stappen, regels, afslagen), § Run-profielen; `process-pipeline.html` stappen 1-11.
**Taken:**
- Nieuwe module `src/lib/edge-terminal/pipeline/` met o.a. `run.ts` (orchestrator), `steps/` (een bestand per stap), `types.ts` (SourceItem, RunWindow, adapter-interface uit `news-sources.md` § Ophaalpatroon).
- `startRun(profile, trigger)`: maakt `discovery_runs`-record, draait stappen sequentieel, persisteert tussenresultaat per stap, telt kosten op in `cost_summary`.
- Afslagen implementeren: setup-richting `none` stopt de keten voor die candidate (gelogd met reden); risk-verdict `skip` blokkeert assembly; assembly cap 5, mag 0 opleveren.
- Bronlaag-failures non-fataal (run draait door, mist wordt gelogd op de run); een gefaalde verplichte stap zet de run op `failed` met `error_message`.
- Elke stap logt naar `ai_analysis_logs` (input/output/promptversie/kosten - mock-waarden in deze story).
- Mock-adapters en mock-LLM-stappen via dezelfde interfaces als de echte (zodat S-26+ en S-32+ alleen implementaties inschuiven).
- In demo mode: deterministische voorbeelddata; in local mode: persistente SQLite via dezelfde store-interface.
**Acceptatiecriteria:**
- [x] `startRun("eu_open"|"us_open", "manual")` draait end-to-end in mock mode en levert `advices` met rank 1-N (N <= 5).
- [x] Unit tests voor de afslagen (`none`, `skip`, cap, 0-adviezen-run) en voor non-fatale bronlaag-failure.
- [x] **Golden scenario-test (Ferrari-case):** mock-fixture met een flinke daler buiten de watchlist + negatief nieuws komt via de mover sweep-stap als candidate boven en eindigt in een advies of onderbouwde no-trade.
- [x] Alle stappen zichtbaar in `ai_analysis_logs` met cost_summary op de run.
**Afhankelijkheden:** S-23 (local store; demo-pad blijft beschikbaar).

### S-25 - Dedupe, clustering en scoring in de nieuwe keten
**Doel:** de bestaande scoring-/dedupe-logica is geport naar de nieuwe keten en getest.
**Referenties:** `technical-design.md` § Pipeline-orchestratie (dedupeAndCluster); bestaande `discovery-scoring.ts`/`discovery.ts` als bron van herbruikbare logica.
**Taken:**
- Dedupe op twee niveaus: exact (`provider_item_id`/URL) en fuzzy (titel + symbool + tijd-similarity) naar clusters met `dedupe_key`/`merge_hint`.
- Score-helpers (relevance, source quality, recency, market context, watchlist-fit) hergebruiken/porten als pure functies.
**Acceptatiecriteria:**
- [x] Unit tests: dubbele headlines uit meerdere bronnen worden een cluster; een cluster neemt maximaal een plek in bij de filter-input.
- [x] Score-breakdown wordt per candidate opgeslagen (`score_breakdown jsonb`).
**Afhankelijkheden:** S-24.

---

## EPIC-13 - Bronadapters (echte data)

> Voor elke adapter geldt: uniform source-item formaat met provenance (zie `news-sources.md` § Ophaalpatroon), tijdvenster uit het run-profiel, backoff bij 429, opgenomen fixture voor tests (geen live calls in CI), titel/snippet/link opslaan - geen volledige artikelen herpubliceren.

### S-26 - Finnhub-adapter (financiele feed + quotes + earnings calendar) **[ROBIN]**
**Referenties:** `news-sources.md` § 1.
**Taken:** company-news per ticker (watchlist + mover-sweep-tickers), general news, quotes, earnings calendar; delay tussen calls om binnen 60/min te blijven.
**Acceptatiecriteria:**
- [x] Adapter levert echte items in een live run; fixtures + contract test aanwezig.
- [x] **EU-dekkingstest uitgevoerd** met mandje ASML/SAP/Shell/LVMH; resultaat gedocumenteerd in `news-sources.md` (levert Finnhub bruikbaar EU-nieuws op de gratis tier, ja/nee).
- [x] 429/fouten zichtbaar op de runstatus.
**Robin-input:** Finnhub API-key (gratis account).

### S-27 - SEC EDGAR-adapter
**Referenties:** `news-sources.md` § 2.
**Taken:** Atom-feeds nieuwste 8-K en 6-K; verplichte `EDGAR_USER_AGENT`-header; max 10 req/s met 100ms delay; filing-detail alleen ophalen voor candidates die de LLM-filter passeren.
**Acceptatiecriteria:**
- [x] 8-K/6-K items komen binnen als primary_source met form type, bedrijf en link.
- [x] User-Agent aantoonbaar op elke request; fixtures + contract test.
**Robin-input:** geen (gratis, geen key).

### S-28 - Gratis RSS/official-source adapter en startlijst
**Referenties:** `news-sources.md` § 4.
**Taken:** RSS-parser (bv. `rss-parser`); feed-configuratielijst in code (GlobeNewswire, EQS, Euronext company news, publiek toegankelijke RNS-route, PR Newswire-categorieen, Business Wire, ECB, Fed, BLS, Eurostat, FDA, EMA); company-IR registry voor watchlist/high-priority tickers en gericht voor movers; exacte feed-URLs vastleggen en in `news-sources.md` documenteren; GUID-dedupe; items buiten het run-venster droppen.
**Acceptatiecriteria:**
- [x] Minimaal 10 gratis feeds live, waarvan minimaal 3 primary/official bronnen (regulated news, company IR of regulator/macro); per item titel/link/pubDate/bron opgeslagen.
- [x] Company-IR registry is uitbreidbaar per ticker zonder adaptercode te wijzigen.
- [x] FDA/EMA feeds zijn sector-gated (alleen healthcare/pharma/biotech context of gerichte mover-fetch), zodat ze de algemene runs niet vervuilen.
- [x] Feed-lijst uitbreidbaar zonder codewijziging buiten de configlijst.
**Robin-input:** geen.

### S-29 - Brede laag: Marketaux of GDELT **[ROBIN]**
**Referenties:** `news-sources.md` § 3 en § 5.
**Taken:** test beide gratis tiers op EU-dekking en bruikbaarheid; kies er een als primaire brede laag en documenteer de keuze + motivatie in `news-sources.md`; implementeer de gekozen adapter; **generieke event-pattern-query's** (negatieve tone + marktbewegingstaal, zonder bedrijfsnamen) draaien verplicht naast watchlist/sector-query's.
**Acceptatiecriteria:**
- [ ] Keuze gedocumenteerd; adapter live met fixtures. GDELT gekozen en fixtures groen; live check op 2026-06-13 tijdelijk geblokkeerd door GDELT HTTP 429 throttle.
- [x] Generieke query's leveren aantoonbaar items over bedrijven buiten de watchlist.
**Robin-input:** Marketaux key (alleen als Marketaux gekozen wordt; GDELT heeft geen key).

### S-30 - Mover sweep **[ROBIN]**
**Referenties:** `news-sources.md` § 8; `technical-design.md` § Pipeline-orchestratie (moverSweep) en regels.
**Taken:** US-movers via Alpha Vantage `TOP_GAINERS_LOSERS` (1 call per run); gratis exchange-alerts ophalen (Nasdaq trade halt RSS/current halts en NYSE halts) als extra triggerlaag; EU via quote-sweep over een vaste universumlijst (AEX/DAX/CAC 40/FTSE MIB/IBEX-constituenten als configlijst in code) met drempel |beweging| >= 4% (configureerbaar per profiel); per onverklaarde mover/halt gerichte fetch (Finnhub company-news + brede-laag-query op bedrijfsnaam + company IR waar bekend); geen nieuws gevonden -> "unexplained move/halt" opslaan als context (geen candidate).
**Acceptatiecriteria:**
- [ ] Een mover buiten de watchlist met vindbaar nieuws wordt candidate met koersreactie als bewijs (live variant van de Ferrari-test).
- [x] Een `T1`/`T2`-achtige trading halt triggert gerichte nieuws-fetch en wordt als context zichtbaar, maar wordt zonder bron nooit candidate.
- [x] Unexplained moves verschijnen als context op het dashboard (S-37/S-38) en worden nooit candidate.
**Robin-input:** Alpha Vantage key (gratis).

### S-31 - Marktdata-provider voor context en tracking **[ROBIN]**
**Referenties:** `news-sources.md` (EU-dekking als criterium); `technical-design.md` § Providerstack.
**Taken:** kies de delayed-quotes-provider voor EU+US (kandidaten: Finnhub, EODHD, Twelve Data) op basis van een EU-dekkingstest (zelfde mandje als S-26 + 5 EU-large-caps); documenteer keuze en kosten in `news-sources.md` + `dependencies.md`; implementeer quote-functies voor market context (S-24-stap) en tracking (S-42).
**Acceptatiecriteria:**
- [ ] EU- en US-quotes werken voor het testmandje; keuze + kosten gedocumenteerd en binnen budget (EUR 20-60/mnd max).
**Robin-input:** key van de gekozen provider.

---

## EPIC-14 - LLM-keten (OpenAI)

### S-32 - OpenAI-client, structured outputs en kostenlogging **[ROBIN]**
**Referenties:** `technical-design.md` § LLM-keten (provider, invariants, promptversies).
**Taken:**
- Server-only OpenAI-client; modelkeuze via `OPENAI_FILTER_MODEL`/`OPENAI_ANALYSIS_MODEL`.
- **Kies actuele modelnamen** (goedkoop + sterk), verifieer prijzen tegen het budget (~EUR 30-50/mnd bij 2 runs/dag) en leg ze vast in `.env.example`-comment en `Docs/dependencies.md`.
- Structured-output-helper (JSON schema per stap), retry/backoff, timeout.
- Logging-wrapper: elke call naar `ai_analysis_logs` met prompt_version, model, input/output, tokens en kosten; optellen in `discovery_runs.cost_summary`.
- Migreer de oude env-checks (`hasOpenAiEnv`/`hasGeminiEnv` in `src/lib/edge-terminal/ai.ts`) naar het nieuwe schema; Gemini-referenties verwijderen.
**Acceptatiecriteria:**
- [x] Een testcall met structured output werkt; kosten verschijnen in het log.
- [x] Zonder key valt alles terug op de mock-implementaties (demo mode intact).
**Robin-input:** OpenAI API-key.

### S-33 - Filter-stap (`advice-filter-v1`)
**Taken:** batch-gewijze filtering van genormaliseerde/gededupliceerde items (~50-100 per run) met het goedkope model; output per item: kansrijk ja/nee, reason_to_watch, voor-rank, affected symbols, event_type_guess; selecteert ~10-15 candidates; prompt-invariants uit `technical-design.md` § LLM-keten toepassen (geen nieuws verzinnen, geen kwantum vullen, watchlist als context).
**Acceptatiecriteria:**
- [x] Live run produceert candidates met reason_to_watch en bronreferenties; geen candidate zonder bron. Check 2026-06-13: compacte `us_open` run met Finnhub + OpenAI filter gaf 43 candidates, 0 zonder bronreferentie.
- [x] Batchgrootte begrensd; kosten per filter-ronde gelogd. Huidige limiet: 80 items per OpenAI-call; live filterrun via `gpt-5.4-mini` logde tokens en `totalCostEur`.
**Afhankelijkheden:** S-32 + minimaal een echte adapter (S-26 of S-29).

### S-34 - Analyse-, setup- en risk-stappen (`advice-analysis-v1`, `advice-setup-v1`, `advice-risk-v1`)
**Taken:** per kansrijke candidate (parallel met cap) de drie stappen met het sterke model; analyse krijgt koersreactie sinds publicatie mee (priced-in-weging) en doet de over-/onderreactie-beoordeling; setup levert long/short/none met entry op pullback/bevestiging; risk review valt de setup aan (tegenargument, thesis killer, risk score, verdict) en benoemt gap-risico en bij shorts squeeze-risico.
**Acceptatiecriteria:**
- [x] Outputs valideren tegen de schema's; `none` en `skip` komen voor in live runs en stoppen de keten correct. Checks 2026-06-13: OpenAI smoke met mock-bronnen gaf `none` + skipped risk/executability; gecontroleerde NVDA-source gaf OpenAI analysis/setup/risk, `short`, risk `skip`, en skipped executability.
- [x] Elke stap los herdraaibaar vanuit het AI-log. Per candidate loggen `advice-analysis-v1`, `advice-setup-v1` en `advice-risk-v1` nu inputPayload, outputPayload, model, provider, tokenkosten en bronrefs.
**Afhankelijkheden:** S-33.

### S-35 - Uitvoerbaarheidscheck, advice assembly en ranking (`advice-assembly-v1`)
**Referenties:** `risk-framework.md` § 3 (kostenhorde) en § 2 (correlatieregel); `technical-design.md` § Pipeline-orchestratie regels.
**Taken:** bereken `expected_move_pct` en `cost_estimate_pct` per kandidaat-advies (spread/fees-inschatting bij de voorgestelde positiegrootte); kostenhorde toepassen (kosten <= 1/3 van verwachte beweging, anders no-trade of zware rank-penalty); correlatie-check tegen open posities en hoger gerankte adviezen (zelfde sector/thema -> warning + penalty); assembly bundelt keten tot definitieve `advices` met rank 1-5, mag 0 opleveren; positiegrootte-indicatie binnen EUR 500-1000.
**Acceptatiecriteria:**
- [x] Elk advies bevat het volledige adviesformat uit `voorstel-specs.md` § Het advies.
- [x] Kostenhorde aantoonbaar werkend (unit test met te dure casus); correlatie-warning zichtbaar op het advies.
- [x] Een run zonder sterke kandidaten levert 0 adviezen met onderbouwing.
**Afhankelijkheden:** S-34, S-31 (quotes voor kosten/spread-inschatting; tot die tijd conservatieve aannames).

### S-36 - Briefing (`advice-briefing-v1`)
**Taken:** compacte Engelse run-samenvatting met het goedkope model: marktcontext, de adviezen, wat bewust geen advies werd en waarom, risico's voor open posities, "do nothing"-conclusie waar van toepassing; opslaan in `daily_briefings`.
**Acceptatiecriteria:**
- [x] Briefing leesbaar in ~2 minuten; zichtbaar op `/briefing` en als teaser op het dashboard. Live smoke 2026-06-13: `advice_briefing` via `gpt-5.4-mini`, structured output, EUR 0.001294, conclusie "Do nothing today" bij 0 adviezen.
**Afhankelijkheden:** S-35.

---

## EPIC-15 - UI-ombouw naar advieslijst

> Kan grotendeels parallel aan EPIC-13/14 in mock mode. Styling conform bestaande terminal-stijl (`Docs/Specs/styleguide.html`) en huidige componenten.

### S-37 - Datalaag en demo-data op het adviesmodel
**Taken:** breid `src/lib/edge-terminal/data.ts` + `demo-data.ts` uit naar de nieuwe entiteiten (advices, advice_tracking, runstatus met profiel en kosten, unexplained movers); demo-data toont een realistische run-uitkomst incl. een Ferrari-achtig perception-advies, een "no advice"-profiel en open tracking-posities; types in `types.ts` bijwerken.
**Acceptatiecriteria:**
- [x] Demo mode toont dezelfde schermen als live mode, gevoed uit demo-data. Check 2026-06-13: demo payload bevat 2 advices, 2 trackingrecords, Ferrari/ASML laatste-run adviezen en 1 no-advice run; Supabase mapper vult advices/tracking niet meer leeg.
**Afhankelijkheden:** S-24.

### S-38 - Dashboard als advieslijst
**Referenties:** `functional-design.md` § Dashboard.
**Taken:** `/dashboard` ombouwen: `Start EU run` / `Start US run` knoppen met runstatus (running/completed/failed + timestamp + kosten); top 5 advieskaarten (ticker, richting, confidence, rank, entry/stop/target, horizon, een-regel-redenatie, belangrijkste tegenargument, bronlinks, kostenhorde-verhouding, acties open/verwerp/genomen); expliciete "No advice today"-staat met reden; unexplained movers-paneel; open getrackte posities; briefing-teaser; providerstatus en bronlaag-fouten.
**Acceptatiecriteria:**
- [x] Alle elementen uit functional-design § Dashboard aanwezig; lege staat en failed-run-staat correct (laatst bekende adviezen + duidelijke timestamp). Check 2026-06-13: dashboard toont EU/US runknoppen, runstatus/kosten/providerfouten, topadvieskaarten met acties, no-advice fallback, mover context, tracking/risk status en briefing teaser; `pnpm test:e2e` dekt de advieslijst en mock-run.
**Afhankelijkheden:** S-37.

### S-39 - Advies Detail
**Referenties:** `functional-design.md` § Advies Detail.
**Taken:** route `/advices/[id]`: volledig adviesformat; uitklapbare keten (event + bronnen -> analyse -> setup -> risk review); kostenhorde-verhouding; gap/squeeze-blok bij shorts; trackingstatus; kalibratie-context-slot (gevuld vanaf S-43, tot die tijd "not enough data yet"); acties: taken-markering (met optionele eigen entry), verwerpen met reden, keten herdraaien; links naar AI-log entries.
**Acceptatiecriteria:**
- [x] Een advies is in 1 minuut te beoordelen zonder door te klikken; de keten eronder is volledig navigeerbaar. Check 2026-06-13: `/advices/advice-race-short` toont adviesformat, bronketen, setup/risk, gap/squeeze, tracking, kalibratieplaceholder en AI-loglinks; gedekt door Playwright.
**Afhankelijkheden:** S-37.

### S-40 - Event Radar, Tracking, redirects en opruimen
**Referenties:** `functional-design.md` § Event Radar en § Tracking; `technical-design.md` § Routes.
**Taken:** `/events` ombouwen naar inspectie/correctie (candidates met filter-uitkomst en reden, dedupe-clusters, acties: negeren met reden, cluster splitsen/samenvoegen, alsnog analyseren, koppeling corrigeren); `/tracking` bouwen (open/gesloten adviezen, D1/D3/D5, filter alle vs. genomen); redirects: `/paper-trades` -> `/tracking`, `/setups`, `/signals`, `/risk` -> `/dashboard`; oude triage-first UI en dode server actions verwijderen; `/process` actualiseren naar de nieuwe pipeline-stappen.
**Acceptatiecriteria:**
- [x] Geen oude flow meer bereikbaar; geen dode code in `src/lib/edge-terminal/`; alle nav-items kloppen met functional-design § App Shell. Check 2026-06-13: app-shell gebruikt Dashboard/Tracking/Briefing/Performance, legacy routes redirecten, Event Detail is read-only audit, oude handmatige setup/risk actions zijn verwijderd en `/process` beschrijft de autonome adviespipeline.
**Afhankelijkheden:** S-38, S-39.

### S-41 - Playwright golden path
**Taken:** e2e-suite (mock mode) voor de nieuwe flow: home -> login-scherm bereikbaar -> dashboard toont advieslijst -> run starten (mock) -> top 5 of no-advice zichtbaar -> advies detail -> taken markeren -> tracking toont het advies; plus het Ferrari-scenario als e2e (mock-mover buiten watchlist eindigt als zichtbaar advies); bestaande smoke-tests bijwerken.
**Acceptatiecriteria:**
- [x] `pnpm test:e2e` groen zonder env vars; Ferrari-scenario gedekt. Check 2026-06-13: `pnpm test:e2e` draaide in demo mode met 6/6 tests groen, inclusief Advice Dashboard, RACE/Ferrari-scenario, Advice Detail, Tracking en legacy redirects.
**Afhankelijkheden:** S-40.

---

## EPIC-16 - Uitkomstmeting, leren en guardrails

### S-42 - Automatische advice tracking
**Referenties:** `technical-design.md` § `advice_tracking`; `risk-framework.md` § 5.
**Taken:** tracking-update als pipeline-slotstap + handmatige refresh-actie: voor alle open adviezen delayed quotes ophalen, richtinggecorrigeerde returns berekenen (referentie = midden entry-zone op adviesmoment), D1/D3/D5 op handelsdagen, stop/target-detectie, expiry op horizon; uitkomstcategorieen zetten.
**Acceptatiecriteria:**
- [x] Unit tests voor de berekeningen (long en short, stop/target/expiry, handelsdagen over weekend heen). Check 2026-06-13: `tests/unit/tracking.test.ts` dekt weekend-handelsdagen, long/short returns, target, stop en expiry; `pnpm test:unit` groen met 37 tests.
- [x] `/tracking` en het dashboard tonen live uitkomsten zonder handwerk. Check 2026-06-13: pipeline `update_tracking` werkt bestaande open adviezen bij, handmatige `refreshAdviceTracking` gebruikt Finnhub quotes met lokale fallback, Dashboard en Tracking tonen last/D1/D3/D5/outcome; `pnpm build` en `pnpm test:e2e` groen.
**Afhankelijkheden:** S-31, S-35.

### S-43 - Performance Lab op adviezen
**Referenties:** `functional-design.md` § Performance Lab; `risk-framework.md` § 6-7.
**Taken:** `/performance` ombouwen: totalen, winrate, **expectancy na kosten** per richting/eventtype/run-profiel/confidence-band/markt; sample-size waarschuwing (n < 30 = indicatief); genomen vs. alle adviezen; kosten vs. opbrengst per maand; opschaal-gates zichtbaar (gehaald ja/nee); kalibratie-context voeden naar Advies Detail (adviestype >= 20 uitkomsten).
**Acceptatiecriteria:**
- [x] Alle metrics uit functional-design § Performance Lab aanwezig; adviestypen krijgen kansrijk/gemengd/vermijden-label zodra genoeg data. Check 2026-06-13: Performance Lab rekent op `advices + advice_tracking`, toont expectancy na kosten per richting/eventtype/run-profiel/confidence-band/markt, taken vs all, maandkosten vs opbrengst, n<30 waarschuwingen en opschaal-gates; Advice Detail krijgt calibration context vanaf 20 vergelijkbare uitkomsten.
**Afhankelijkheden:** S-42.

### S-44 - Risk guardrails en circuit breaker
**Referenties:** `risk-framework.md` § 2, 4, 9.
**Taken:** dashboard risk-statusbalk (open posities vs. max, drawdown op genomen trades, circuit-breaker status); circuit-breaker detectie (5 echte verliezers op rij of -10% trading-kapitaal in 30 dagen, drempels configureerbaar) -> "paper only"-banner, adviezen krijgen paper-label; correlatie-warning live op advieskaarten; gap/squeeze-risico verplicht zichtbaar op elk short-advies.
**Acceptatiecriteria:**
- [x] Triggers getest met fixtures; de app dwingt niets af maar signaleert ondubbelzinnig. Check 2026-06-13: `tests/unit/risk-guardrails.test.ts` dekt 5 verliezers op rij, -10% drawdown in 30 dagen en niet-genomen verliezen; Dashboard toont risk-statusbalk, drawdown/open exposure/circuit breaker en paper-only banner; advieskaarten en Advice Detail tonen paper-only/correlatie/gap/squeeze-signalen.
**Afhankelijkheden:** S-42; trading-kapitaal ingevuld in `risk-framework.md` **[ROBIN]**.

### S-45 - Validatieperiode (4 weken) **[ROBIN + bouw-AI]**
**Referenties:** `risk-framework.md` § 6-8; `voorstel-specs.md` § Succescriterium slice 1.
**Taken:** 4 weken lang beide runs dagelijks draaien (handmatig); Robin beoordeelt per advies kort "was this useful" (veld op Advies Detail); wekelijkse mini-evaluatie in `implementation-log.md`; na 4 weken eindevaluatie: expectancy na kosten, beste/slechtste adviestype, brondekking-gaten, LLM-kosten vs. budget; besluit met Robin over vervolg (doorgaan/bijsturen/stoppen) en over de opschaal-gates.
**Acceptatiecriteria:**
- [ ] 4 weken data compleet; eindevaluatie gedocumenteerd; besluit vastgelegd.
**Afhankelijkheden:** alles t/m S-44.

---

## EPIC-17 - Lokale validatie, kwaliteit en latere deploykeuze

### S-46 - Lokale validatie en deploybesluit
**Referenties:** `risk-framework.md` § 6-8; `voorstel-specs.md` § Succescriterium slice 1.
**Taken:** vier weken lokaal beide runs dagelijks draaien; brondekking, kosten, foutpercentages, advieskwaliteit en gebruiksgemak wekelijks samenvatten; aan het einde expliciet besluiten of deploy/cron/Supabase/Vercel de extra complexiteit waard zijn.
**Acceptatiecriteria:**
- [ ] Vier weken lokale run-data compleet genoeg voor een besluit.
- [ ] Besluit vastgelegd: lokaal blijven, bijsturen, stoppen, of deployfase starten.
- [ ] Als deployfase start: concrete eisen voor auth, backup, cron, kosten en RLS zijn gedocumenteerd.
**Afhankelijkheden:** S-45.

### S-47 - Kwaliteitsiteraties
**Taken:** dedupe/clustering verbeteren op basis van lokale run-data; bronmix evalueren en GDELT/RSS-gaten dichten; promptversies vergelijken op advies-uitkomst (Performance Lab per prompt_version); verbeterde prompts als v2 naast v1 gelogd.
**Acceptatiecriteria:**
- [ ] Minimaal een aantoonbare verbetering doorgevoerd met voor/na-data.
**Afhankelijkheden:** S-46.

### S-48 - EU small caps en betaalde feed evalueren
**Taken:** met validatiedata beoordelen of EU small caps haalbaar zijn (nieuws- en quotedekking); kosten/baten van een betaalde feed (Benzinga/Finnhub betaald/EODHD) afwegen binnen EUR 150/mnd; advies aan Robin documenteren in `news-sources.md`.
**Acceptatiecriteria:**
- [ ] Onderbouwd advies gedocumenteerd; besluit door Robin vastgelegd.
**Afhankelijkheden:** S-46.

### S-49 - Deployfase voorbereiden (optioneel, na validatie)
**Taken:** alleen uitvoeren als S-46 oplevert dat cloud/deploy nodig is: Supabase Auth/Postgres/RLS terugbrengen als productiemode, Vercel-deploy en cron ontwerpen, lokale SQLite-data migreren of archiveren, en kosten/backup/security expliciet vastleggen.
**Acceptatiecriteria:**
- [ ] Geen deploywerk start zonder positief S-46-besluit.
- [ ] Supabase/Vercel-plan bevat migratiepad vanaf SQLite, RLS-test, backupbeleid en maandkosten.
**Afhankelijkheden:** S-46.

---

## Archief - demo-skelet (voor 2026-06-12)

EPIC-01 t/m EPIC-08 (styleguide, ontwerpen, Supabase-schema, app-shell, Discovery Candidate Quality MVP, AI-placeholders, paper trading, tests) zijn afgerond als **demo-skelet**: mockdata, placeholder-AI, geen live omgeving. Ze leverden het voorwerk en de UI-basis, maar geen productvoortgang. De triage-first flow uit die epics is vervangen door de autonome pipeline; herbruikbare delen (datamodel, schermen, demo mode, tests) worden in EPIC-11 t/m 15 omgebouwd. Details: git-historie van dit bestand.
