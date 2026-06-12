# Voorstel-specs - Edge Terminal

> Status: herijkt naar adviesmachine.
> Laatst aangepast: 2026-06-12 - vervangt de eerdere researchtool-versie volledig.
> Onderbouwing van de koerswijziging: `Docs/analyse-bouwgereedheid.md`.
> Visualisatie van proces en pipeline: `Docs/Specs/process-pipeline.html`.
> Risicokader en opschaal-gates: `Docs/Specs/risk-framework.md`.

## Projectoverzicht

Edge Terminal is Robins **persoonlijke adviesmachine** voor swing trading op nieuws. De pipeline verzamelt twee keer per dag zelfstandig nieuws, filings, macro-items en marktcontext, analyseert welke gebeurtenissen koersimpact kunnen hebben, en levert **expliciete koop/verkoop-adviezen**: ticker, richting, entry, stop, target, horizon en onderbouwing. Robin leest de gerangschikte top 5, beslist zelf en handelt zelf bij zijn broker.

De app voert nooit zelf trades uit en geeft geen advies aan derden. Maar richting Robin is de output expliciet: *"Short Ferrari, entry rond X, stop boven Y, target Z, horizon 1-2 weken - want..."* - geen vrijblijvende hypotheses.

## Kernbesluiten (interview 2026-06-12)

| Onderwerp | Besluit |
|---|---|
| Product | Expliciet tradingadvies voor eigen gebruik, geen researchtool. |
| Werkverdeling | De pipeline doet al het werk zelf: verzamelen, dedupen, analyseren, risico's afwegen, ranken. Geen verplichte handmatige tussenstappen. |
| Horizon | Posities van dagen tot ~2 weken: swing trading op nieuws, geen intraday. |
| Ritme | Twee runs per dag: 07:30 (EU-opening) en 15:00 NL-tijd (US-opening). |
| Output per run | Gerangschikte top 5 adviezen, beste eerst. "Geen advies vandaag" is een volwaardige uitkomst. |
| Echt traden | Robin neemt 2-3 trades per week (6 is plafond, geen quota), max 4-5 gelijktijdig open posities. |
| Markten | Start: US-aandelen + EU large caps, long en short. EU small caps later, als de pipeline bewezen werkt. |
| Inzet | EUR 100-1000 per trade; uitvoerbaarheid (spread, liquiditeit, kosten) weegt mee in het advies. |
| Budget | EUR 150/maand voor data-API's en AI samen. |
| Validatie | Elk advies wordt automatisch gevolgd (paper); Robin beslist zelf op gevoel plus argumentatie. |
| Scan starten | Handmatig vanaf het dashboard in het MVP; cron direct daarna. |
| LLM-provider | OpenAI: goedkoop filtermodel + sterk analysemodel; modelnamen in env (besluit 2026-06-12). |
| UI-taal | Engels (terminal-stijl), incl. gegenereerde adviezen en briefings; documentatie Nederlands. |
| Keys/accounts | Robin levert API-keys op verzoek; de bouw-AI vraagt per story concreet welke nodig zijn. |

## Het advies - kernproduct van de pipeline

Elk advies bevat minimaal:

- ticker + richting (long/short);
- entry-zone, stop-loss, target;
- horizon (dagen tot 2 weken);
- positiegrootte-indicatie binnen EUR 100-1000;
- confidence score en rank binnen de top 5;
- redenatie: welk nieuws/event, waarom nu, wat is mogelijk nog niet ingeprijsd;
- tegenargument en invalidatie ("advies vervalt als...");
- bronverwijzingen (URL + publicatietijd);
- uitvoerbaarheidsnotitie: spread, liquiditeit en kostenimpact bij deze positiegrootte.

Kwaliteitseisen aan elk advies:

- geen advies zonder concreet event en bronreferentie;
- geen advies zonder tegenargument en invalidatiecriterium;
- confidence is een rankinghulp, geen zekerheid;
- kostenhorde: verwachte round-trip kosten staan in verhouding tot de verwachte beweging (richtlijn <= 1/3, zie `risk-framework.md`); een advies dat alleen zonder kosten werkt, bestaat niet;
- de pipeline vult nooit op naar vijf: liever twee sterke adviezen dan vijf matige.

## Adviesritme - schrijven vs. nemen

Het aantal adviezen dat de app **schrijft** en het aantal trades dat Robin **neemt** zijn bewust losgekoppeld:

- De app produceert per run een top 5 en trackt **alle** adviezen automatisch tegen de koers (ook niet-genomen adviezen). Dat levert tientallen datapunten per maand op zonder dat het geld kost - de leerdata voor het Performance Lab.
- Robin neemt er 2-3 per week echt, met 6 als plafond voor uitzonderlijk rijke nieuwsweken en max 4-5 gelijktijdig open posities. Zitten de sloten vol, dan moet een nieuw advies een open positie verslaan.
- Eerste 4 weken: 0-2 echte trades per week, klein, terwijl het automatische track record zich opbouwt.
- Opschalen volgt de gates uit `risk-framework.md`: pas meer of grotere trades na bewezen positieve expectancy na kosten.

## Edge-these - waarom dit kan werken

De pipeline wint nooit de snelheidsrace: als nieuws in een API staat, is de eerste koersreactie al geweest. De edge wordt daarom niet gezocht in sneller reageren, maar in:

1. **Tweede-orde beoordeling**: is de marktreactie over- of onderdreven voor een horizon van dagen tot twee weken (post-event drift, overreaction rebound)?
2. **Selectie en discipline**: weinig, goed onderbouwde adviezen met verplicht tegenargument, kostenhorde en automatische uitkomstmeting - in plaats van veel en snel.
3. **Aandachtsgaten**: events buiten de hoofdaandacht (perception events, mover sweep) waar de verwerking trager is.

Elke prompt en ranking stuurt hierop: geen beweging najagen, entry op pullback of bevestiging, en "geen advies" wanneer de reactie al fair geprijsd lijkt.

## Pipeline op hoofdlijnen

```text
Robin start run (07:30 EU-profiel / 15:00 US-profiel)   [enige handmatige stap in MVP]
  -> Source funnel: broad news + financiele feed + filings/macro + marktcontext
  -> Mover sweep: opvallende koersbewegingen zonder verklaring krijgen een gerichte nieuws-fetch
  -> Normaliseren naar bronitems met provenance
  -> Dedupen en clusteren van dubbele headlines
  -> Goedkoop LLM-filter: kansrijke candidates selecteren en voor-ranken
  -> Per kansrijke candidate automatisch (sterk LLM-model):
       analyse -> setup (long/short/geen) -> risk review -> uitvoerbaarheidscheck
  -> Advice assembly: bundeling tot adviezen, ranking op kwaliteit en uitvoerbaarheid
  -> Dashboard toont top 5 (of "geen advies vandaag") + korte briefing
  -> Robin beslist en handelt zelf bij de broker; markeert genomen adviezen
  -> Automatische tracking: D1/D3/D5-uitkomst, stop/target geraakt
  -> Performance Lab: welke adviestypen leveren netto geld op
  -> Lessen voeden prompts en ranking (promptversies vergelijkbaar via AI-log)
```

Handmatig ingrijpen (advies verwerpen, candidate negeren of corrigeren) blijft mogelijk als correctie achteraf, nooit als verplichte poort.

## Twee dagelijkse run-profielen

| Profiel | Tijdstip | Universum |
|---|---|---|
| `eu_open` | 07:30 | EU-opening: overnight US, Azie, Europese ochtendberichten; EU-tickers zwaarder gewogen |
| `us_open` | 15:00 NL | US-opening: premarket movers, US-bedrijfsnieuws, macro-releases van de dag |

Profielen verschillen in bronquery's, tijdvensters en rankingcontext. In het MVP start Robin beide runs handmatig; cron is de eerste verbetering daarna.

## Bronnenstrategie en budget

De pipeline zoekt niet "het hele internet" af en laat geen taalmodel vrij nieuws verzinnen: elke candidate komt uit een gecontroleerde bronfunnel met provenance.

| Laag | Startkeuze | Indicatie/mnd |
|---|---|---|
| Broad news/search | GDELT (gratis) + RSS van persbureaus, company-IR en official feeds | EUR 0 |
| Financiele feed | Finnhub of Alpha Vantage News & Sentiment - gratis tier eerst, betalen bij bewezen waarde | EUR 0-50 |
| Primaire bronnen | SEC EDGAR, company IR, EU regulated news/RNS-route, earnings calendar via feed-provider | EUR 0 |
| Market-structure triggers | Nasdaq/NYSE trading halts + mover sweep | EUR 0 |
| Sector/regulator feeds | FDA/EMA voor healthcare/pharma/biotech; BLS/Eurostat/ECB/Fed voor macrocontext | EUR 0 |
| Marktdata delayed US+EU | Finnhub/EODHD/Twelve Data - EU-dekking is het selectiecriterium | EUR 20-60 |
| LLM-keten | Goedkoop model voor filtering/voor-ranking, sterk model alleen voor finale analyses | EUR 30-50 |

Totaal past binnen EUR 150/maand mits de LLM-keten getrapt blijft: goedkoop filteren (~50-100 bronitems per run), duur analyseren (~10 candidates per run). De eerste bronuitbreiding blijft gratis-first: liever meer primary/official feeds met duidelijke provenance dan extra algemene nieuwsruis. De adapterlaag is vervangbaar ontworpen zodat een betere feed later ingeschoven kan worden zonder herbouw.

De watchlist blijft bestaan als ranking-context (voorkeuren en holdings krijgen extra gewicht), nooit als zoekgrens. Perception events (slecht ontvangen productlancering, reputatieschade, sentiment-omslag) blijven een volwaardige eventcategorie naast financiele events.

## Modules

| Module | Doel |
|---|---|
| Dashboard | Advieslijst: top 5 per run, beste eerst; runstatus en providerstatus; open getrackte posities |
| Advies Detail | Volledig advies met redenatie, tegenargument, invalidatie, bronnen, onderliggende analyse en risk review |
| Event Radar | Inspectie- en correctielaag: candidates, dedupe-clusters, bronnen; negeren/corrigeren als de pipeline het mis heeft |
| Watchlist | Voorkeuren/holdings als rankingcontext |
| Tracking | Alle adviezen met automatische uitkomsten (D1/D3/D5, stop/target); markering welke Robin echt nam |
| Performance Lab | Welke adviestypen, richtingen, eventtypes en confidence-bands netto waarde hebben; echt genomen vs. paper |
| Briefing | Compacte samenvatting per run: marktcontext, adviezen, risico's, "vandaag niets doen" indien van toepassing |
| AI Log | Audit trail: elke LLM-call met promptversie, input, output, kosten en bruikbaarheid |

## Datamodel (ASCII ERD)

```text
[User]
  | owns
  v
[DiscoveryRun (run_profile: eu_open/us_open)]
  --< [EventSource] (provenance: bron, URL, publicatietijd, payload ref)
  --< [EventCandidate] (dedupe, scores, status)
        |
        | kansrijk -> automatische keten
        v
   [EventAnalysis] -> [TradeSetup] -> [RiskReview]
        \________________|________________/
                         |
                         v
                     [Advice]  (rank 1-5, entry/stop/target, redenatie,
                         |      tegenargument, invalidatie, bronnen,
                         |      uitvoerbaarheid, taken_by_user)
                         v
                  [AdviceTracking] (D1/D3/D5, stop/target geraakt, resultaat)
                         |
                         v
                  [PerformanceMetric] (afgeleid / view)

[DiscoveryRun, EventCandidate, EventAnalysis, TradeSetup, RiskReview, Advice]
  --< [AIAnalysisLog] (promptversie, input, output, kosten, status)
```

`Advice` en `AdviceTracking` zijn nieuw; `AdviceTracking` vervangt de handmatige paper trades uit het oude ontwerp. De bestaande tabellen voor runs, sources, candidates, analyses, setups en risk reviews blijven, maar worden door de pipeline gevuld in plaats van per klik.

## Tech-stack

| Laag | Keuze | Onderbouwing |
|---|---|---|
| Frontend | Next.js App Router + React + TypeScript | Template-stack, snelle dashboardbouw |
| Styling | Tailwind / shadcn-compatible, darkmode terminal | Bestaat al als demo-skelet |
| Backend | Next.js route handlers / server actions | Pipeline draait server-side, keys blijven server-only |
| Database | Supabase Postgres + RLS | Relationeel model, auth-integratie |
| Auth | Supabase Auth | Single-user nu, uitbreidbaar |
| Hosting | Vercel | Standaard New Default-stack |
| Pipeline | Eigen orchestratie in server-code | Getrapte keten: adapters -> dedupe -> filter-LLM -> analyse-LLM -> assembly |
| LLM | OpenAI: goedkoop filtermodel + sterk analysemodel (namen in env, actueel houden) | Budget en kwaliteit gescheiden |
| Tracking | Delayed quotes provider | Automatische uitkomstmeting per advies |
| Testing | Playwright + unit tests op scoring/assembly | Golden path: run -> top 5 -> tracking |

## Niet-functionele eisen

- **Uitlegbaarheid:** elk advies toont zijn volledige redeneerketen en bronnen; Robin moet in 1 minuut kunnen zien waarom dit advies bovenaan staat.
- **Auditability:** alle LLM-inputs/outputs, promptversies en rankinginputs worden gelogd; promptversies zijn achteraf vergelijkbaar op uitkomst.
- **Kostenbeheersing:** LLM- en API-kosten per run zichtbaar in het AI-log; maandbudget EUR 150 bewaakt.
- **Beschikbaarheid:** als een bronlaag faalt draait de run door met de overige lagen en toont de app wat er miste; een mislukte run toont de laatst bekende adviezen met duidelijke timestamp.
- **Security:** RLS op alle user-data; alle keys server-only; geen advies-output naar derden.
- **Eigen geld, eigen risico:** de app adviseert alleen Robin zelf; tone of voice is direct en concreet, maar elk advies draagt zijn tegenargument en invalidatie.
- **Risicokader:** positiegrootte-regels, correlatielimieten, circuit breaker en opschaal-gates staan in `risk-framework.md`; de app handhaaft signalerend (ranking, warnings, statusbalk), Robin voert uit.

## Fasering

### Slice 0 - Herijking (deze fase, afgerond bij akkoord op deze specs)
- Specs, functioneel ontwerp, technisch ontwerp en backlog herschreven naar adviesmachine.
- Adviesformat, run-profielen en providerstack vastgelegd.
- Procesvisualisatie: `process-pipeline.html`.

### Slice 1 - Tracer bullet (alles staat of valt hiermee)
- Supabase-project + Vercel live, auth werkend.
- Migraties bijgewerkt: `advices`, `advice_tracking`, `run_profile`.
- Echte adapters: een nieuwsbron + EDGAR + delayed quotes.
- Getrapte LLM-keten met echte calls, structured outputs en logging.
- Advice assembly en dashboard-advieslijst: end-to-end van run naar top 5.
- Beide run-profielen handmatig startbaar.

### Slice 2 - Uitkomstmeting en leren
- Automatische tracking per advies: D1/D3/D5, stop/target geraakt.
- "Genomen"-markering; Performance Lab op echte adviezen (genomen vs. paper).
- Briefing per run.

### Slice 3 - Kwaliteit en automatisering
- Cron: runs staan klaar zonder handmatige start.
- Dedupe verbeteren, bronmix uitbreiden, promptversies vergelijken via AI-log.
- EU small caps evalueren; betaalde feed overwegen bij bewezen waarde.

### Later / nice-to-have
- Alerts, scenario library, historical reaction patterns per eventtype.
- Social sentiment-bronlaag (X/Reddit-achtig) voor perception events - bekende blinde vlek van v1.
- Geavanceerde grafieken.
- Brokerkoppeling alleen als expliciet later gekozen.

## Succescriterium slice 1

Vier weken dagelijks draaien. Per advies beoordeelt Robin "had ik hier wat aan gehad"; de automatische tracking toont wat de adviezen netto hadden opgeleverd. Dat bewijs bepaalt of de pipeline het vertrouwen verdient - niet meer documentatie.

## Open punten

- Definitieve providerkeuze bevestigen na test van de gratis tiers (dekking EU-nieuws en EU-quotes is het criterium).
- Concrete OpenAI-modelnamen (filter + analyse) bij bouwstart vastleggen in env; actuele modellen kiezen en prijzen verifieren.
- Brokerkeuze: eToro-kosten (CFD overnight/weekend fees, spreads) versus alternatief zoals Interactive Brokers - door Robin zelf te verifieren, staat los van de bouw.
- Hoe de positiegrootte-indicatie berekend wordt (vast bedrag vs. risico-percentage per trade).
- Mockups (`mockups.html`) zijn op 2026-06-12 vernieuwd naar de adviesmachine-flow (oude versie in `Docs/Archive/`); restpunten uit Robins mockup-review verwerken voor S-38.
