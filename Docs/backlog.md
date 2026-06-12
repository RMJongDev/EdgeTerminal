# Backlog - Edge Terminal (bouwbacklog)

> Opgesteld 2026-06-12 voor uitvoering door een bouw-AI. Dit document is de werk-queue; de specs in `Docs/Specs/` zijn de bron van waarheid.
> Het oude backlog (demo-skelet, alles "done") staat onderaan als archief.

## Leeswijzer voor de bouw-AI

**Verplichte leesvolgorde voor je begint:** `AGENTS.md` -> `Docs/Specs/voorstel-specs.md` -> `functional-design.md` -> `technical-design.md` -> `news-sources.md` -> `risk-framework.md`. Open `process-pipeline.html` in een browser voor het totaalbeeld.

**Werkafspraken:**
1. Werk stories in volgorde af; afhankelijkheden staan per story. Parallel mag alleen als de afhankelijkheden het toelaten.
2. **[ROBIN]**-markering = input van Robin nodig (meestal API-keys). Vraag er concreet om ("ik heb X nodig, in te vullen als `VAR` in `.env.local`") en ga ondertussen door met wat zonder die input kan.
3. Demo mode (app werkt zonder env vars, met deterministische voorbeelddata) moet na elke story blijven werken - dat is hoe de Playwright-tests draaien.
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
| EPIC-11 | Fundament live: Supabase, Vercel, datamodel | todo | - |
| EPIC-12 | Pipeline-kern: nieuwe keten end-to-end met mocks | todo | EPIC-11 (S-23) |
| EPIC-13 | Bronadapters: echte data | todo | EPIC-12 |
| EPIC-14 | LLM-keten: echte OpenAI-calls | todo | EPIC-12 |
| EPIC-15 | UI-ombouw naar advieslijst + tests | todo | EPIC-12 (UI kan parallel aan 13/14 in mock mode) |
| EPIC-16 | Uitkomstmeting, Performance Lab, risk guardrails, validatie | todo | EPIC-13 t/m 15 |
| EPIC-17 | Automatisering en kwaliteit | todo | EPIC-16 |

**Robin-acties (los van stories, zo vroeg mogelijk):**
- [ ] Supabase-project aanmaken en keys leveren (S-21).
- [ ] Vercel-project koppelen of toegang leveren (S-22).
- [ ] OpenAI API-key leveren (S-32).
- [ ] Finnhub-, Alpha Vantage- en evt. Marketaux-keys leveren (S-26, S-29, S-30).
- [ ] Trading-kapitaal vaststellen en invullen in `risk-framework.md` sectie 2 (voor S-45).
- [ ] Brokerkeuze verifieren (kostenimpact eToro vs. alternatief) - staat los van de bouw.

---

## EPIC-10 - Herijking naar adviesmachine
**Status:** done (2026-06-12)
Alle specs, briefing, visualisatie en dit backlog beschrijven de adviesmachine: autonome pipeline, top 5 expliciete adviezen, twee run-profielen, mover sweep, kostenhorde, risk framework, automatische tracking. Besluiten: OpenAI als LLM-provider, Engelse UI-copy, keys op verzoek van Robin.

---

## EPIC-11 - Fundament live

### S-21 - Supabase-project en lokale live mode **[ROBIN]**
**Doel:** de app draait lokaal tegen een echt Supabase-project; demo mode blijft als fallback.
**Referenties:** `technical-design.md` § Runtime modes, § Database; bestaande migraties in `supabase/migrations/`.
**Taken:**
- Vraag Robin een Supabase-project aan te maken en lever instructies: welke waarden uit het dashboard nodig zijn (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- Draai de bestaande migraties tegen het project (Supabase CLI: `supabase link` + `supabase db push`, of SQL-editor; documenteer wat gebruikt is).
- Verifieer auth end-to-end lokaal: account aanmaken, inloggen, uitloggen, redirect van protected routes.
**Acceptatiecriteria:**
- [ ] `.env.local` gevuld (niet gecommit); app start in live mode en toont "live" status in de shell.
- [ ] Alle bestaande migraties draaien zonder fouten; tabellen zichtbaar in Supabase.
- [ ] Login/signup/signout werkt; niet-ingelogde gebruiker wordt naar `/login` gestuurd.
- [ ] Demo mode werkt nog steeds wanneer env vars ontbreken.
**Afhankelijkheden:** geen. **Robin-input:** Supabase keys.

### S-22 - Vercel-deployment **[ROBIN]**
**Doel:** de app draait op een productie-URL zodat Robin runs vanaf elk device kan starten.
**Taken:**
- Vraag Robin het Vercel-project te koppelen (of toegang te geven); zet alle env vars in Vercel (production + preview).
- Deploy; verifieer auth en demo/live-gedrag op de productie-URL; `NEXT_PUBLIC_SITE_URL` correct voor auth-redirects.
**Acceptatiecriteria:**
- [ ] Productie-deploy werkt met login en dashboard.
- [ ] Env vars staan alleen in Vercel/`.env.local`, nergens in de repo.
**Afhankelijkheden:** S-21. **Robin-input:** Vercel-toegang.

### S-23 - Migratie adviesmachine-datamodel
**Doel:** het datamodel voor adviezen en automatische tracking bestaat.
**Referenties:** `technical-design.md` § Database (exacte veldenlijsten voor `advices` en `advice_tracking`, uitbreiding `discovery_runs`).
**Taken:**
- Nieuwe migratie `supabase/migrations/<timestamp>_advice_machine.sql`:
  - `discovery_runs`: voeg `run_profile` (`eu_open`/`us_open`/`mock`) en `cost_summary jsonb` toe;
  - `advices`: alle velden uit technical-design § `advices`, incl. keten-referenties (candidate/analysis/setup/risk_review), entry/stop/target, `expected_move_pct`, `cost_estimate_pct`, `rank`, `status`, `taken_by_user` en user-velden;
  - `advice_tracking`: alle velden uit technical-design § `advice_tracking` (D1/D3/D5-returns, stop/target/expiry, outcome, last_checked);
  - RLS-policies (`auth.uid() = user_id`) en `updated_at`-triggers conform de bestaande migratiestijl.
- Werk `src/lib/database.types.ts` bij (regenereren via Supabase CLI of handmatig consistent).
- Schrijf de migratie zo dat hij ook zonder live project review-baar is; toepassen zodra S-21 klaar is.
**Acceptatiecriteria:**
- [ ] Migratie draait foutloos op het Supabase-project; RLS aantoonbaar actief (query zonder auth geeft niets).
- [ ] `database.types.ts` dekt de nieuwe tabellen; typecheck groen.
- [ ] `paper_trades`/`trade_evaluations` blijven bestaan (historie) maar worden vanaf EPIC-15 niet meer door de app gebruikt.
**Afhankelijkheden:** schrijven kan direct; toepassen vereist S-21.

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
- In demo mode (geen Supabase): persist in-memory per request, zelfde codepad.
**Acceptatiecriteria:**
- [ ] `startRun("eu_open"|"us_open", "manual")` draait end-to-end in mock mode en levert `advices` met rank 1-N (N <= 5).
- [ ] Unit tests voor de afslagen (`none`, `skip`, cap, 0-adviezen-run) en voor non-fatale bronlaag-failure.
- [ ] **Golden scenario-test (Ferrari-case):** mock-fixture met een flinke daler buiten de watchlist + negatief nieuws komt via de mover sweep-stap als candidate boven en eindigt in een advies of onderbouwde no-trade.
- [ ] Alle stappen zichtbaar in `ai_analysis_logs` met cost_summary op de run.
**Afhankelijkheden:** S-23 (datamodel; in-memory demo-pad kan eerder).

### S-25 - Dedupe, clustering en scoring in de nieuwe keten
**Doel:** de bestaande scoring-/dedupe-logica is geport naar de nieuwe keten en getest.
**Referenties:** `technical-design.md` § Pipeline-orchestratie (dedupeAndCluster); bestaande `discovery-scoring.ts`/`discovery.ts` als bron van herbruikbare logica.
**Taken:**
- Dedupe op twee niveaus: exact (`provider_item_id`/URL) en fuzzy (titel + symbool + tijd-similarity) naar clusters met `dedupe_key`/`merge_hint`.
- Score-helpers (relevance, source quality, recency, market context, watchlist-fit) hergebruiken/porten als pure functies.
**Acceptatiecriteria:**
- [ ] Unit tests: dubbele headlines uit meerdere bronnen worden een cluster; een cluster neemt maximaal een plek in bij de filter-input.
- [ ] Score-breakdown wordt per candidate opgeslagen (`score_breakdown jsonb`).
**Afhankelijkheden:** S-24.

---

## EPIC-13 - Bronadapters (echte data)

> Voor elke adapter geldt: uniform source-item formaat met provenance (zie `news-sources.md` § Ophaalpatroon), tijdvenster uit het run-profiel, backoff bij 429, opgenomen fixture voor tests (geen live calls in CI), titel/snippet/link opslaan - geen volledige artikelen herpubliceren.

### S-26 - Finnhub-adapter (financiele feed + quotes + earnings calendar) **[ROBIN]**
**Referenties:** `news-sources.md` § 1.
**Taken:** company-news per ticker (watchlist + mover-sweep-tickers), general news, quotes, earnings calendar; delay tussen calls om binnen 60/min te blijven.
**Acceptatiecriteria:**
- [ ] Adapter levert echte items in een live run; fixtures + contract test aanwezig.
- [ ] **EU-dekkingstest uitgevoerd** met mandje ASML/SAP/Shell/LVMH; resultaat gedocumenteerd in `news-sources.md` (levert Finnhub bruikbaar EU-nieuws op de gratis tier, ja/nee).
- [ ] 429/fouten zichtbaar op de runstatus.
**Robin-input:** Finnhub API-key (gratis account).

### S-27 - SEC EDGAR-adapter
**Referenties:** `news-sources.md` § 2.
**Taken:** Atom-feeds nieuwste 8-K en 6-K; verplichte `EDGAR_USER_AGENT`-header; max 10 req/s met 100ms delay; filing-detail alleen ophalen voor candidates die de LLM-filter passeren.
**Acceptatiecriteria:**
- [ ] 8-K/6-K items komen binnen als primary_source met form type, bedrijf en link.
- [ ] User-Agent aantoonbaar op elke request; fixtures + contract test.
**Robin-input:** geen (gratis, geen key).

### S-28 - RSS-adapter en startlijst
**Referenties:** `news-sources.md` § 4.
**Taken:** RSS-parser (bv. `rss-parser`); feed-configuratielijst in code (GlobeNewswire, EQS, Euronext company news, PR Newswire-categorieen, ECB, Fed); exacte feed-URLs vastleggen en in `news-sources.md` documenteren; GUID-dedupe; items buiten het run-venster droppen.
**Acceptatiecriteria:**
- [ ] Minimaal 5 feeds live; per item titel/link/pubDate/bron opgeslagen.
- [ ] Feed-lijst uitbreidbaar zonder codewijziging buiten de configlijst.
**Robin-input:** geen.

### S-29 - Brede laag: Marketaux of GDELT **[ROBIN]**
**Referenties:** `news-sources.md` § 3 en § 5.
**Taken:** test beide gratis tiers op EU-dekking en bruikbaarheid; kies er een als primaire brede laag en documenteer de keuze + motivatie in `news-sources.md`; implementeer de gekozen adapter; **generieke event-pattern-query's** (negatieve tone + marktbewegingstaal, zonder bedrijfsnamen) draaien verplicht naast watchlist/sector-query's.
**Acceptatiecriteria:**
- [ ] Keuze gedocumenteerd; adapter live met fixtures.
- [ ] Generieke query's leveren aantoonbaar items over bedrijven buiten de watchlist.
**Robin-input:** Marketaux key (alleen als Marketaux gekozen wordt; GDELT heeft geen key).

### S-30 - Mover sweep **[ROBIN]**
**Referenties:** `news-sources.md` § 8; `technical-design.md` § Pipeline-orchestratie (moverSweep) en regels.
**Taken:** US-movers via Alpha Vantage `TOP_GAINERS_LOSERS` (1 call per run); EU via quote-sweep over een vaste universumlijst (AEX/DAX/CAC 40/FTSE MIB/IBEX-constituenten als configlijst in code) met drempel |beweging| >= 4% (configureerbaar per profiel); per onverklaarde mover gerichte fetch (Finnhub company-news + brede-laag-query op bedrijfsnaam); geen nieuws gevonden -> "unexplained move" opslaan als context (geen candidate).
**Acceptatiecriteria:**
- [ ] Een mover buiten de watchlist met vindbaar nieuws wordt candidate met koersreactie als bewijs (live variant van de Ferrari-test).
- [ ] Unexplained moves verschijnen als context op het dashboard (S-37/S-38) en worden nooit candidate.
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
- [ ] Een testcall met structured output werkt; kosten verschijnen in het log.
- [ ] Zonder key valt alles terug op de mock-implementaties (demo mode intact).
**Robin-input:** OpenAI API-key.

### S-33 - Filter-stap (`advice-filter-v1`)
**Taken:** batch-gewijze filtering van genormaliseerde/gededupliceerde items (~50-100 per run) met het goedkope model; output per item: kansrijk ja/nee, reason_to_watch, voor-rank, affected symbols, event_type_guess; selecteert ~10-15 candidates; prompt-invariants uit `technical-design.md` § LLM-keten toepassen (geen nieuws verzinnen, geen kwantum vullen, watchlist als context).
**Acceptatiecriteria:**
- [ ] Live run produceert candidates met reason_to_watch en bronreferenties; geen candidate zonder bron.
- [ ] Batchgrootte begrensd; kosten per filter-ronde gelogd.
**Afhankelijkheden:** S-32 + minimaal een echte adapter (S-26 of S-29).

### S-34 - Analyse-, setup- en risk-stappen (`advice-analysis-v1`, `advice-setup-v1`, `advice-risk-v1`)
**Taken:** per kansrijke candidate (parallel met cap) de drie stappen met het sterke model; analyse krijgt koersreactie sinds publicatie mee (priced-in-weging) en doet de over-/onderreactie-beoordeling; setup levert long/short/none met entry op pullback/bevestiging; risk review valt de setup aan (tegenargument, thesis killer, risk score, verdict) en benoemt gap-risico en bij shorts squeeze-risico.
**Acceptatiecriteria:**
- [ ] Outputs valideren tegen de schema's; `none` en `skip` komen voor in live runs en stoppen de keten correct.
- [ ] Elke stap los herdraaibaar vanuit het AI-log.
**Afhankelijkheden:** S-33.

### S-35 - Uitvoerbaarheidscheck, advice assembly en ranking (`advice-assembly-v1`)
**Referenties:** `risk-framework.md` § 3 (kostenhorde) en § 2 (correlatieregel); `technical-design.md` § Pipeline-orchestratie regels.
**Taken:** bereken `expected_move_pct` en `cost_estimate_pct` per kandidaat-advies (spread/fees-inschatting bij de voorgestelde positiegrootte); kostenhorde toepassen (kosten <= 1/3 van verwachte beweging, anders no-trade of zware rank-penalty); correlatie-check tegen open posities en hoger gerankte adviezen (zelfde sector/thema -> warning + penalty); assembly bundelt keten tot definitieve `advices` met rank 1-5, mag 0 opleveren; positiegrootte-indicatie binnen EUR 500-1000.
**Acceptatiecriteria:**
- [ ] Elk advies bevat het volledige adviesformat uit `voorstel-specs.md` § Het advies.
- [ ] Kostenhorde aantoonbaar werkend (unit test met te dure casus); correlatie-warning zichtbaar op het advies.
- [ ] Een run zonder sterke kandidaten levert 0 adviezen met onderbouwing.
**Afhankelijkheden:** S-34, S-31 (quotes voor kosten/spread-inschatting; tot die tijd conservatieve aannames).

### S-36 - Briefing (`advice-briefing-v1`)
**Taken:** compacte Engelse run-samenvatting met het goedkope model: marktcontext, de adviezen, wat bewust geen advies werd en waarom, risico's voor open posities, "do nothing"-conclusie waar van toepassing; opslaan in `daily_briefings`.
**Acceptatiecriteria:**
- [ ] Briefing leesbaar in ~2 minuten; zichtbaar op `/briefing` en als teaser op het dashboard.
**Afhankelijkheden:** S-35.

---

## EPIC-15 - UI-ombouw naar advieslijst

> Kan grotendeels parallel aan EPIC-13/14 in mock mode. Styling conform bestaande terminal-stijl (`Docs/Specs/styleguide.html`) en huidige componenten.

### S-37 - Datalaag en demo-data op het adviesmodel
**Taken:** breid `src/lib/edge-terminal/data.ts` + `demo-data.ts` uit naar de nieuwe entiteiten (advices, advice_tracking, runstatus met profiel en kosten, unexplained movers); demo-data toont een realistische run-uitkomst incl. een Ferrari-achtig perception-advies, een "no advice"-profiel en open tracking-posities; types in `types.ts` bijwerken.
**Acceptatiecriteria:**
- [ ] Demo mode toont dezelfde schermen als live mode, gevoed uit demo-data.
**Afhankelijkheden:** S-24.

### S-38 - Dashboard als advieslijst
**Referenties:** `functional-design.md` § Dashboard.
**Taken:** `/dashboard` ombouwen: `Start EU run` / `Start US run` knoppen met runstatus (running/completed/failed + timestamp + kosten); top 5 advieskaarten (ticker, richting, confidence, rank, entry/stop/target, horizon, een-regel-redenatie, belangrijkste tegenargument, bronlinks, kostenhorde-verhouding, acties open/verwerp/genomen); expliciete "No advice today"-staat met reden; unexplained movers-paneel; open getrackte posities; briefing-teaser; providerstatus en bronlaag-fouten.
**Acceptatiecriteria:**
- [ ] Alle elementen uit functional-design § Dashboard aanwezig; lege staat en failed-run-staat correct (laatst bekende adviezen + duidelijke timestamp).
**Afhankelijkheden:** S-37.

### S-39 - Advies Detail
**Referenties:** `functional-design.md` § Advies Detail.
**Taken:** route `/advices/[id]`: volledig adviesformat; uitklapbare keten (event + bronnen -> analyse -> setup -> risk review); kostenhorde-verhouding; gap/squeeze-blok bij shorts; trackingstatus; kalibratie-context-slot (gevuld vanaf S-43, tot die tijd "not enough data yet"); acties: taken-markering (met optionele eigen entry), verwerpen met reden, keten herdraaien; links naar AI-log entries.
**Acceptatiecriteria:**
- [ ] Een advies is in 1 minuut te beoordelen zonder door te klikken; de keten eronder is volledig navigeerbaar.
**Afhankelijkheden:** S-37.

### S-40 - Event Radar, Tracking, redirects en opruimen
**Referenties:** `functional-design.md` § Event Radar en § Tracking; `technical-design.md` § Routes.
**Taken:** `/events` ombouwen naar inspectie/correctie (candidates met filter-uitkomst en reden, dedupe-clusters, acties: negeren met reden, cluster splitsen/samenvoegen, alsnog analyseren, koppeling corrigeren); `/tracking` bouwen (open/gesloten adviezen, D1/D3/D5, filter alle vs. genomen); redirects: `/paper-trades` -> `/tracking`, `/setups`, `/signals`, `/risk` -> `/dashboard`; oude triage-first UI en dode server actions verwijderen; `/process` actualiseren naar de nieuwe pipeline-stappen.
**Acceptatiecriteria:**
- [ ] Geen oude flow meer bereikbaar; geen dode code in `src/lib/edge-terminal/`; alle nav-items kloppen met functional-design § App Shell.
**Afhankelijkheden:** S-38, S-39.

### S-41 - Playwright golden path
**Taken:** e2e-suite (mock mode) voor de nieuwe flow: home -> login-scherm bereikbaar -> dashboard toont advieslijst -> run starten (mock) -> top 5 of no-advice zichtbaar -> advies detail -> taken markeren -> tracking toont het advies; plus het Ferrari-scenario als e2e (mock-mover buiten watchlist eindigt als zichtbaar advies); bestaande smoke-tests bijwerken.
**Acceptatiecriteria:**
- [ ] `pnpm test:e2e` groen zonder env vars; Ferrari-scenario gedekt.
**Afhankelijkheden:** S-40.

---

## EPIC-16 - Uitkomstmeting, leren en guardrails

### S-42 - Automatische advice tracking
**Referenties:** `technical-design.md` § `advice_tracking`; `risk-framework.md` § 5.
**Taken:** tracking-update als pipeline-slotstap + handmatige refresh-actie: voor alle open adviezen delayed quotes ophalen, richtinggecorrigeerde returns berekenen (referentie = midden entry-zone op adviesmoment), D1/D3/D5 op handelsdagen, stop/target-detectie, expiry op horizon; uitkomstcategorieen zetten.
**Acceptatiecriteria:**
- [ ] Unit tests voor de berekeningen (long en short, stop/target/expiry, handelsdagen over weekend heen).
- [ ] `/tracking` en het dashboard tonen live uitkomsten zonder handwerk.
**Afhankelijkheden:** S-31, S-35.

### S-43 - Performance Lab op adviezen
**Referenties:** `functional-design.md` § Performance Lab; `risk-framework.md` § 6-7.
**Taken:** `/performance` ombouwen: totalen, winrate, **expectancy na kosten** per richting/eventtype/run-profiel/confidence-band/markt; sample-size waarschuwing (n < 30 = indicatief); genomen vs. alle adviezen; kosten vs. opbrengst per maand; opschaal-gates zichtbaar (gehaald ja/nee); kalibratie-context voeden naar Advies Detail (adviestype >= 20 uitkomsten).
**Acceptatiecriteria:**
- [ ] Alle metrics uit functional-design § Performance Lab aanwezig; adviestypen krijgen kansrijk/gemengd/vermijden-label zodra genoeg data.
**Afhankelijkheden:** S-42.

### S-44 - Risk guardrails en circuit breaker
**Referenties:** `risk-framework.md` § 2, 4, 9.
**Taken:** dashboard risk-statusbalk (open posities vs. max, drawdown op genomen trades, circuit-breaker status); circuit-breaker detectie (5 echte verliezers op rij of -10% trading-kapitaal in 30 dagen, drempels configureerbaar) -> "paper only"-banner, adviezen krijgen paper-label; correlatie-warning live op advieskaarten; gap/squeeze-risico verplicht zichtbaar op elk short-advies.
**Acceptatiecriteria:**
- [ ] Triggers getest met fixtures; de app dwingt niets af maar signaleert ondubbelzinnig.
**Afhankelijkheden:** S-42; trading-kapitaal ingevuld in `risk-framework.md` **[ROBIN]**.

### S-45 - Validatieperiode (4 weken) **[ROBIN + bouw-AI]**
**Referenties:** `risk-framework.md` § 6-8; `voorstel-specs.md` § Succescriterium slice 1.
**Taken:** 4 weken lang beide runs dagelijks draaien (handmatig); Robin beoordeelt per advies kort "was this useful" (veld op Advies Detail); wekelijkse mini-evaluatie in `implementation-log.md`; na 4 weken eindevaluatie: expectancy na kosten, beste/slechtste adviestype, brondekking-gaten, LLM-kosten vs. budget; besluit met Robin over vervolg (doorgaan/bijsturen/stoppen) en over de opschaal-gates.
**Acceptatiecriteria:**
- [ ] 4 weken data compleet; eindevaluatie gedocumenteerd; besluit vastgelegd.
**Afhankelijkheden:** alles t/m S-44.

---

## EPIC-17 - Automatisering en kwaliteit

### S-46 - Cron: runs staan vanzelf klaar
**Referenties:** `technical-design.md` § Runtime modes (cron), § Routes (`/api/pipeline/cron`).
**Taken:** cron-entrypoint met `DISCOVERY_SCAN_CRON_SECRET`-check en expliciete server-side write-strategie (documenteren: hoe schrijft de cron als Robins user); scheduling voor 07:30 en 15:00 **Nederlandse tijd** - let op: Vercel cron werkt in UTC, dus zomer-/wintertijd afhandelen (vaste UTC-tijden + documentatie van de afwijking, of een tz-bewuste check in de handler); gefaalde cron-run zichtbaar op dashboard met laatst bekende adviezen.
**Acceptatiecriteria:**
- [ ] Beide runs draaien een week lang automatisch op de juiste NL-tijden; secret vereist; handmatig starten blijft werken.
**Afhankelijkheden:** S-45 (of eerder als Robin dat wil).

### S-47 - Kwaliteitsiteraties
**Taken:** dedupe/clustering verbeteren op basis van echte run-data; bronmix evalueren en GDELT/RSS-gaten dichten; promptversies vergelijken op advies-uitkomst (Performance Lab per prompt_version); verbeterde prompts als v2 naast v1 gelogd.
**Acceptatiecriteria:**
- [ ] Minimaal een aantoonbare verbetering doorgevoerd met voor/na-data.
**Afhankelijkheden:** S-45.

### S-48 - EU small caps en betaalde feed evalueren
**Taken:** met validatiedata beoordelen of EU small caps haalbaar zijn (nieuws- en quotedekking); kosten/baten van een betaalde feed (Benzinga/Finnhub betaald/EODHD) afwegen binnen EUR 150/mnd; advies aan Robin documenteren in `news-sources.md`.
**Acceptatiecriteria:**
- [ ] Onderbouwd advies gedocumenteerd; besluit door Robin vastgelegd.
**Afhankelijkheden:** S-45.

---

## Archief - demo-skelet (voor 2026-06-12)

EPIC-01 t/m EPIC-08 (styleguide, ontwerpen, Supabase-schema, app-shell, Discovery Candidate Quality MVP, AI-placeholders, paper trading, tests) zijn afgerond als **demo-skelet**: mockdata, placeholder-AI, geen live omgeving. Ze leverden het voorwerk en de UI-basis, maar geen productvoortgang. De triage-first flow uit die epics is vervangen door de autonome pipeline; herbruikbare delen (datamodel, schermen, demo mode, tests) worden in EPIC-11 t/m 15 omgebouwd. Details: git-historie van dit bestand.
