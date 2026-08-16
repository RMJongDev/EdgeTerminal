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

## 2026-08-05 - Edge Terminal onepager
- Wat: Nederlandstalige Word-onepager toegevoegd met productdoel, adviesflow, edge-these, technische opbouw, risicokader en actuele MVP-status.
- Wat: Oplevering gecontroleerd op een pagina, visuele layout en documenttoegankelijkheid.
- Waarom: Een compact deelbaar overzicht maken van wat Edge Terminal doet en hoe het is gebouwd.

## 2026-06-13 - Live bronnen lokaal hersteld
- Wat: `.env.local` aangevuld met de ontbrekende Finnhub/Alpha Vantage provider-vars onder de namen die de code leest; waarden blijven gitignored.
- Wat: Oude local mock-scan knop uit Dashboard/Event Radar gehaald zodat live testen via EU/US advice runs loopt.
- Wat: Live `eu_open` sanity-run haalde 73 sources op; checks opnieuw groen.
- Volgende stap: Providerwaarschuwingen oplossen voor Finnhub earnings/quotes en GDELT throttling tijdens validatie.

## 2026-06-13 - Adviesmachine MVP lokaal bouwklaar
- Wat: OpenAI analyse/setup/risk/briefing-keten, adviesassembly, tracking-refresh, Performance Lab en risk guardrails gebouwd op lokale SQLite/demo-data.
- Wat: Dashboard, Advice Detail, Tracking, Process en legacy redirects omgezet naar de autonome adviesflow; oude handmatige setup/risk-actions verwijderd.
- Wat: Unit- en e2e-dekking uitgebreid voor pipeline, tracking, risk guardrails en de nieuwe smoke flow; build/checks groen.
- Volgende stap: 4 weken lokale validatie starten; S-31 quote-providerkeuze blijft open omdat Finnhub `/quote` met de huidige key 403 geeft.

## 2026-06-13 - Lokale pipeline, bronlagen en OpenAI-filter gebouwd
- Wat: Runtime modes `demo/local/supabase`, local shell/loginstatus en SQLite-backed store met schema, seed/reset, start-watchlist en lokale actions gebouwd.
- Wat: `startRun("eu_open"|"us_open", "manual")` toegevoegd met mock-adapters, mover sweep, adviesassembly, tracking, step/audit logging, Ferrari golden test en dedupe/scoring-clustering.
- Wat: Finnhub, SEC EDGAR, RSS/official, GDELT, Alpha Vantage movers en Nasdaq halts aangesloten met fixtures, live checks, dashboard-context en non-fatale providerfouten.
- Wat: OpenAI structured-output client en `advice-filter-v1` aangesloten; compacte Finnhub+OpenAI run gaf 43 candidates, 0 zonder bronreferentie en EUR 0.005222 filterkosten.
- Volgende stap: S-34 bouwen: analyse-, setup- en risk-stappen via OpenAI sterk model, met `none`/`skip` als geldige stops.

## 2026-06-13 - Gratis bronkeys toegevoegd
- Wat: Finnhub- en Alpha Vantage-keys lokaal toegevoegd aan `.env.local`; waarden blijven buiten git.
- Wat: Backlog bijgewerkt: S-26/S-30 input is geleverd, Marketaux blijft optioneel/later.
- Volgende stap: starten met S-21 local runtime en daarna S-22 SQLite-store.

## 2026-06-13 - Lokale keys en startconfig vastgelegd
- Wat: `.env.local` lokaal gevuld met local mode, OpenAI-key, modelkeuze en EDGAR User-Agent; `.env.example` houdt dezelfde niet-geheime modeldefaults aan.
- Wat: Trading-kapitaal op EUR 2500 gezet, eToro als MVP-startaanname vastgelegd met IBKR-achtig alternatief als advies, en start-watchlist v1 toegevoegd.
- Wat: Providerkey-links voor Finnhub, Alpha Vantage en optioneel Marketaux toegevoegd aan dependencies.
- Waarom: De lokale MVP kan nu zonder Supabase/Vercel starten en later gecontroleerd echte bronnen aansluiten.

## 2026-06-13 - Local-first MVP vereenvoudigd
- Wat: Specs, backlog, README, env-template en dependencies omgezet naar lokaal bouwen met `EDGE_RUNTIME_MODE=local` en SQLite in `.data/edge-terminal.sqlite`.
- Wat: Supabase/Vercel/cron verplaatst naar een latere deployfase na lokale validatie; EPIC-11 start nu met runtime, SQLite-store en store-interface.
- Waarom: Docker/WSL/Supabase-cloud blokkeren de MVP-start; lokaal moet eerst zonder infrastructuurkosten werkend en testbaar zijn.

## 2026-06-12 - Gratis nieuwsbronnen aangescherpt
- Wat: `news-sources.md` uitgebreid met gratis-first bronnen: exchange halts, company IR registry, Business Wire/PR Newswire, BLS/Eurostat en FDA/EMA sectorfeeds.
- Wat: Backlog S-28/S-30 en specs bijgewerkt zodat deze bronnen als gratis official-source/triggerlaag worden gebouwd zonder extra API-key verplichting.
- Waarom: De bronfunnel moet sterker worden via primary/official provenance in plaats van meer algemene nieuwsruis.

## 2026-06-12 - Technische preflight bouwstart gefixt
- Wat: Playwright-baseline hersteld met webpack-devserver; `pnpm test:e2e` is weer groen.
- Wat: Unit-test runner toegevoegd via Node 24 en pipeline-contracttests toegevoegd voor step order, legacy-normalisatie, payload refs, kosten en structured-output schemas.
- Wat: Adviesmachine-preflightmigratie toegevoegd voor `advices`, `advice_tracking`, `pipeline_step_runs`, `source_payload_snapshots`, runprofielen/kosten en ticker-only adviezen buiten de watchlist; specs/backlog hierop bijgewerkt.
- Volgende stap: vervangen door de local-first koers van 2026-06-13; start met SQLite-runtime en store-interface.

## 2026-06-12 - Herijking naar adviesmachine doorgevoerd
- Wat: Doel-interview + `Docs/analyse-bouwgereedheid.md`: Edge Terminal wordt een adviesmachine met autonome pipeline (top 5 expliciete adviezen, 2 runs/dag, automatische tracking, EUR 150/mnd).
- Wat: Voorstel-specs, functional design, technical design, client-briefing en backlog volledig herschreven; oude epics gearchiveerd als demo-skelet; adviesritme vastgelegd (2-3 echte trades/week, plafond 6, max 4-5 open).
- Wat: Procesvisualisatie `Docs/Specs/process-pipeline.html` toegevoegd; mockups en ProjectOmschrijving.txt gemarkeerd als deels achterhaald.
- Wat: `Docs/Specs/news-sources.md` toegevoegd: geverifieerde bronnen (Finnhub, EDGAR, GDELT, RSS, Marketaux, Alpha Vantage) met endpoints, limieten en ophaalpatroon; mover sweep + generieke event-pattern-query's toegevoegd zodat perception events buiten de watchlist (Ferrari-scenario) gevangen worden.
- Wat: `Docs/Specs/risk-framework.md` toegevoegd (edge-these, kostenhorde, positiegrootte, correlatieregel, circuit breaker, opschaal-gates, kalibratie-context) en doorvertaald naar specs, ontwerpen, backlog en visualisatie.
- Wat: Besluiten vastgelegd (OpenAI, Engelse UI, keys op verzoek); AGENTS.md, README, `.env.example` en `dependencies.md` op Edge Terminal gezet; volledig bouwbacklog (EPIC-11 t/m 17, S-21 t/m S-48) geschreven voor uitvoering door een bouw-AI.
- Wat: Mockups vernieuwd naar de adviesmachine (9 klikbare schermen incl. Advice Detail, Tracking en risk-status); oude triage-first mockup gearchiveerd in `Docs/Archive/`.
- Volgende stap: vervangen door de local-first koers van 2026-06-13; Robin levert pas keys wanneer de betreffende adapter/LLM-story start.

## 2026-06-03 - Discovery MVP completion audit
- Wat: Top-10 ranking aangescherpt zodat dedupe clusters maar een keer meetellen en merged/ignored candidates uit de actieve dashboardranking vallen.
- Wat: Dashboard toont discovery-run foutmeldingen en de backlog staat op done voor Discovery Candidate Quality MVP.
- Wat: `pnpm typecheck`, `pnpm lint`, `pnpm test:e2e`, `pnpm build` en `graphify update .` groen gedraaid.

## 2026-06-03 - Discovery Candidate MVP gebouwd
- Wat: Discovery datamodel, demo source funnel, candidate scoring, daily scan action en Event Radar triage-flow toegevoegd.
- Wat: Dashboard vernieuwd naar Candidate Quality Command en nieuwe Process A-Z app-route plus navigatie toegevoegd.
- Wat: Backlog, styleguide, Playwright-config en smoke tests bijgewerkt; typecheck, lint, e2e en graphify update gedraaid.
- Volgende stap: Echte discovery-provider kiezen en aansluiten op dezelfde source/candidate-adapters.

## 2026-06-03 - Bouw-readiness beoordeeld
- Wat: Backlog, specs, migraties, app-shell, dashboard, actions, demo-data, env en tests gecontroleerd op aansluiting met de nieuwe discovery-candidate MVP.
- Waarom: Voor de bouw moet duidelijk zijn welke gaten nog zitten tussen mockups/specs en de bestaande appbasis.
- Volgende stap: Backlog en eerste bouwslice expliciet herijken voordat implementatie start.

## 2026-06-03 - Optionele scan hints toegevoegd
- Wat: `mockups.html` uitgebreid met Optional Scan Context op Dashboard en Process-copy aangepast naar `Start daily scan`.
- Wat: `voorstel-specs.md`, `functional-design.md` en `technical-design.md` vastgelegd dat scan hints ranking/query-context zijn, geen verplicht veld en geen harde filter.
- Volgende stap: Bij bouw `context_hints` opslaan op `discovery_runs` en meenemen in discovery scoring.

## 2026-06-03 - Handmatig startpunt research-run verduidelijkt
- Wat: `mockups.html` aangepast zodat Process en Dashboard expliciet tonen dat de research-run handmatig start op het Dashboard.
- Wat: Primaire CTA verduidelijkt en Process-detailtekst aangepast rond handmatig starten.
- Volgende stap: Bij appbouw deze CTA koppelen aan `/api/discovery/run` of een server action.

## 2026-06-03 - Procespagina aan mockups toegevoegd
- Wat: `mockups.html` uitgebreid met een klikbare Process A-Z pagina en acht detailpagina's voor research start, source funnel, candidate quality, triage, analyse, setups/risk, paper trades en performance learning.
- Wat: Navigatie en scherm-switching aangepast zodat procesdetails onder de Process-navigatie actief blijven.
- Volgende stap: Procespagina reviewen en daarna bepalen welke detailvelden direct in de echte app gebouwd worden.

## 2026-06-03 - Specs op discovery-bronfunnel gezet
- Wat: `voorstel-specs.md`, `functional-design.md` en `technical-design.md` aangescherpt met een concrete source funnel voor dagelijkse nieuws/event discovery.
- Wat: GDELT/NewsAPI, Alpha Vantage, SEC EDGAR, FRED/macro calendars, primaire bronnen en market context vastgelegd als bronlagen.
- Volgende stap: Concrete MVP-startprovider kiezen en daarna de provideradapter in de bouwvolgorde oppakken.

## 2026-06-03 - Discovery-bronnenstrategie verkend
- Wat: Strategie uitgewerkt voor nieuws/event-ingestie via brede news search, financiele feeds, primaire bronnen, macro/filing calendars en market context.
- Waarom: De grootste productrisico zit in het vinden, dedupen en ranken van de juiste dagelijkse nieuwsfeiten.
- Volgende stap: Bronkeuze vastleggen in `technical-design.md` zodra de gewenste MVP-providerstack gekozen is.

## 2026-06-03 - Dashboard top 10 mockup volledig gemaakt
- Wat: `mockups.html` aangepast zodat de Candidate Event List op het dashboard echt tien zichtbare candidates toont.
- Waarom: De mockup beloofde een top 10, maar liet slechts drie voorbeeldregels zien.
- Volgende stap: Bij app-implementatie deze lijst als echte ranked top 10 uit discovery-data renderen.

## 2026-06-03 - Mockupwijzigingen zichtbaarder gemaakt
- Wat: `mockups.html` voorzien van een duidelijke versie-banner en een herkenbare Candidate Quality Command-dashboardkop.
- Waarom: De aangepaste static mockup moet direct herkenbaar zijn, los van de draaiende Next-app.
- Volgende stap: Indien gewenst dezelfde candidate-quality schermen in de echte app-routes implementeren.

## 2026-06-03 - Specs-map op candidate quality gesynchroniseerd
- Wat: `functional-design.md`, `styleguide.html`, `mockups.html`, `voorstel-specs.md` en `technical-design.md` afgestemd op Discovery Candidate Quality MVP.
- Wat: Mockups uitgebreid met Watchlist, Daily Briefing en AI Log, plus uitleg per scherm en zichtbare source quality, recency, dedupe en triage-acties.
- Volgende stap: Backlog eventueel verder detailleren naar implementatietaken voor discovery scoring en Event Radar triage.

## 2026-06-03 - Technical design op candidate quality gezet
- Wat: `technical-design.md` aangepast op Discovery Candidate Quality MVP met datamodelvelden, runtime modes, scoring, triage-actions en route handlers.
- Wat: Discovery AI-output, security, providerregels, tests en bouwvolgorde aangescherpt rond top 10 candidates, bronkwaliteit, recency en dedupe.
- Volgende stap: Functioneel ontwerp of backlog op dezelfde technische slice nalopen voordat de bouw start.

## 2026-06-03 - Voorstel-specs op candidate quality gezet
- Wat: `voorstel-specs.md` afgestemd op het LevelFields/Trade Ideas voorstel en de Discovery Candidate Quality MVP.
- Wat: Top 10 candidate cards, bronkwaliteit, recency, dedupe/merge hints, candidate triage en aangepaste fasering toegevoegd.
- Volgende stap: Functioneel/technisch ontwerp eventueel op dezelfde candidate-quality details nalopen.

## 2026-06-03 - Researchvoorstel op discovery-MVP afgestemd
- Wat: LevelFields/Trade Ideas onderzoeksvoorstel aangepast op de nieuwe broad-discovery MVP met candidate events, top 10 triage en providerstatus.
- Wat: Eerste bouwslice verlegd van Scenario Library naar Discovery Candidate Quality MVP; scenario's blijven interpretatielaag daarna.
- Volgende stap: Discovery Candidate Quality MVP uitwerken in datamodel/UI zodra de bouw start.

## 2026-06-02 - Specificaties naar broad event discovery aangepast
- Wat: Voorstel-specs, functioneel ontwerp, technisch ontwerp, backlog en mockup-copy aangepast van manual-first events naar AI-gestuurde brede event discovery.
- Wat: Discovery candidates, top 10 ochtendbriefing, bron/dedupe/ranking prompts en provider-env-vars toegevoegd.
- Volgende stap: Discovery datamodel en provideradapter bouwen voor `discovery_runs`, `event_sources` en `event_candidates`.

## 2026-06-02 - Platformonderzoek LevelFields en Trade Ideas
- Wat: Online onderzoek naar LevelFields AI en Trade Ideas vertaald naar Edge Terminal-productlessen.
- Wat: Nieuw onderzoeks- en voorstelbestand toegevoegd met scenario library, Event Intelligence Score, reaction lab, playbooks en personal edge roadmap.
- Volgende stap: Eerste bouwslice kiezen: Scenario Library MVP met Event Intelligence Score.

## 2026-06-02 - Event discovery scope verduidelijkt
- Wat: Specificaties naast de voorgestelde event-discovery flow gelegd.
- Wat: Vastgesteld dat de huidige scope handmatige events, Gemini-verrijking en optionele market data bevat; automatische detectie staat later/nice-to-have.
- Volgende stap: Beslissen of event candidates naar MVP of fase 2 moeten opschuiven.

## 2026-06-02 - Navigatie aangescherpt
- Wat: Signal Desk en Risk Review samengevoegd tot `Setups & Risk` op `/setups`.
- Wat: Oude routes `/signals` en `/risk` verwijzen door naar `/setups`; server actions keren ook terug naar de nieuwe pagina.
- Wat: Typecheck, lint, lokale HTTP-checks en `graphify update .` uitgevoerd.

## 2026-06-02 - Event discovery aanpak besproken
- Wat: Bestaande backlog/specs gecontroleerd op event discovery, market data en research-integraties.
- Wat: Gefaseerde aanpak bepaald voor handmatige events, watchlist-scans, feed-ingestie en AI-ranking.
- Volgende stap: Event discovery backlog/story toevoegen zodra providerkeuze of MVP-scope vaststaat.

## 2026-06-02 - Prompt pipeline richting besproken
- Wat: Bestaande AI-placeholders, Supabase-tabellen en technische AI-flow doorgenomen.
- Wat: Richting bepaald voor provider-agnostische prompt-pipelines, structured outputs en audit logging.
- Volgende stap: Pipeline-service en promptversies implementeren zodra echte provider-calls worden aangesloten.

## 2026-06-02 - Lokale testbaarheid en pagina-overzicht
- Wat: Node/pnpm-versies gecontroleerd, typecheck gedraaid en de dev server lokaal gestart.
- Wat: Poort `3000` bleek bezet door een ander project; Edge Terminal draait gecontroleerd op `http://127.0.0.1:3001`.
- Wat: Cockpitpagina's doorgenomen voor een korte review-kijkwijzer.
- Volgende stap: vervangen door de local-first koers van 2026-06-13; lokale SQLite-runtime eerst testbaar maken.

## 2026-05-31 - 11-punten MVP-basis afgerond
- Wat: Styleguide, functioneel ontwerp, technisch ontwerp, backlog, Supabase schema, app-shell, CRUD-routes, AI-placeholders, paper trading, performance en e2e tests uitgewerkt.
- Wat: Demo/live datalaag toegevoegd zodat de app zonder Supabase-project werkt en later met Supabase Auth/Postgres kan draaien.
- Volgende stap: vervangen door de local-first koers van 2026-06-13; geen Supabase/Vercel-projecten nodig voor het MVP.

## 2026-05-31 - Volledige vervolgstappen uitgezet
- Wat: Route vanaf voorstel-specs naar styleguide, functioneel ontwerp, technisch ontwerp, backlog en bouwstart bepaald.
- Waarom: De mockups en voorstel-specs zijn nu goed genoeg om richting bouwvoorbereiding te gaan.
- Volgende stap: Styleguide en functioneel ontwerp uitwerken.

## 2026-05-31 - Voorstel-specs opgesteld
- Wat: Voorstel-specs voor Edge Terminal aangemaakt met MVP-modules, kernflows, datamodelrichting en high-level architectuur.
- Wat: Open punten vastgelegd voor market-data provider, disclaimers, paper-trade sluitvelden en productlogo.
- Volgende stap: Functioneel ontwerp uitwerken per scherm en workflow.

## 2026-05-31 - Vervolgstappen bepaald
- Wat: Route vanaf de eerste mockups bepaald: mockup-review, functioneel ontwerp, datamodel, backlog en daarna bouw.
- Waarom: Edge Terminal heeft nu genoeg richting om gecontroleerd richting bouwvoorbereiding te gaan.
- Volgende stap: Mockups aanscherpen en daarna functioneel ontwerp opstellen.

## 2026-05-31 - NewDefault branding toegevoegd
- Wat: NewDefault-logo subtiel toegevoegd aan de mockup in topbar, sidebar-footer en dashboard-strip.
- Wat: Stylingdocument bijgewerkt met co-brandingregels voor Edge Terminal als NewDefault-product.
- Volgende stap: Mockup visueel beoordelen en bepalen of Edge Terminal een eigen productlogo krijgt.

## 2026-05-31 - Eerste mockups opgezet
- Wat: Keuzes vastgelegd voor VS/EU-aandelen, ETF's, Supabase Auth, OpenAI-analyse en Gemini-research.
- Wat: Eerste klikbare mockup gemaakt voor Dashboard, Event Radar, Event Detail, Signal Desk, Paper Trades en Performance Lab.
- Volgende stap: Mockup visueel beoordelen en daarna itereren op schermvolgorde, informatiedichtheid en datamodel.

## 2026-05-31 - Fase 1 contextdocumenten opgezet
- Wat: Projectbriefing, company-context en stylingbasis voor Edge Terminal aangemaakt.
- Wat: MVP-richting vastgelegd rond event-driven research, risk review, paper trading en performance learning.
- Volgende stap: Fase 1 open vragen beantwoorden en daarna door naar brand/design en eerste mockups.

## 2026-05-31 - Projectomschrijving gelezen
- Wat: ProjectOmschrijving.txt gelezen en de kernrichting van Edge Terminal beoordeeld.
- Wat: Eerste productlijn herkend: event-driven research, analyse, risk review, paper trading en performance learning.
- Volgende stap: Projectomschrijving omzetten naar concrete fases, backlog en datamodel.

## 2026-05-31 - Idee-intake gestart
- Wat: Poging gedaan om de aangeleverde projecttekst uit de attachment te lezen.
- Waarom: De intake is gestart, maar de lokale sandbox kon de attachment niet openen.
- Volgende stap: Projectidee direct in de chat ontvangen en uitwerken naar eerste richting.

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
