# Onderzoek en voorstel - LevelFields AI, Trade Ideas en Edge Terminal

> Datum: 2026-06-02  
> Laatst aangepast: 2026-06-03  
> Status: productonderzoek en implementatievoorstel, afgestemd op de aangepaste MVP/specs  
> Doel: leren van vergelijkbare event- en signal-platformen en vertalen naar een betere Edge Terminal.

## Samenvatting

LevelFields AI en Trade Ideas zijn allebei waardevolle voorbeelden, maar om verschillende redenen.

LevelFields AI is het beste voorbeeld voor de kern van Edge Terminal: events worden niet behandeld als losse nieuwsberichten, maar als herhaalbare scenario's met een historisch reactiepatroon. De gebruiker kiest scenario's, filtert op bedrijfskenmerken, ziet win rate en gemiddelde koersreacties, en krijgt alerts wanneer een event optreedt dat bij de strategie past.

Trade Ideas is het beste voorbeeld voor execution-support: het platform scant de markt realtime, laat AI-strategieen intraday entries en exits kiezen, backtest strategieen, toont signals direct in windows en op charts, en koppelt dat aan paper/simulated trading en eventueel broker-executie.

Voor Edge Terminal is de beste richting:

```text
LevelFields-denken voor event intelligence
+ Trade Ideas-denken voor strategy validation
+ eigen risk review en paper-trade learning
= persoonlijke trading cockpit die helpt beslissen, niet blind volgen
```

De aangepaste MVP maakt dit scherper: Edge Terminal moet niet wachten tot Robin zelf events invoert. De ochtendworkflow start met brede AI-gestuurde discovery, waarna Robin een top 10 candidate events beoordeelt. De applicatie moet dus niet primair "koop/verkoop-signalen" geven. De beste versie wordt een persoonlijke decision terminal:

- breed nieuws, filings, macro-items, sectorontwikkelingen, marktbewegingen en perception events scannen;
- candidate events normaliseren, dedupliceren en ranken;
- een compacte top 10 tonen met reason_to_watch, bronkwaliteit en verwachte impact;
- candidates accepteren, negeren, samenvoegen of analyseren;
- event-scenario's met historische reactiepatronen opbouwen;
- alerts en candidates prioriteren op marktimpact, bronkwaliteit, recency, context en jouw voorkeuren;
- AI gebruiken voor hypotheses, counterarguments en setup-voorstellen;
- paper trades gebruiken om jouw eigen signal quality te meten;
- steeds scherper leren welke eventtypes, filters en setups voor jou werken.

## Bronnen

Belangrijkste geraadpleegde bronnen:

- LevelFields AI - How Does LevelFields' AI Work: https://support.levelfields.ai/support/solutions/articles/69000853017-how-does-levelfields-ai-work-
- LevelFields AI - How do I use this site: https://support.levelfields.ai/support/solutions/articles/69000815305-how-do-i-use-this-site-
- LevelFields AI - Alerts: https://support.levelfields.ai/support/solutions/articles/69000842165-how-do-i-use-the-alerts-
- LevelFields AI - AI Options Trading: https://www.levelfields.ai/ai-options-trading
- Trade Ideas - What Holly Does: https://www.trade-ideas.com/hollyguide/What_Holly_Does.html
- Trade Ideas - Features: https://www.trade-ideas.com/features/?product=bplusholly
- Trade Ideas - OddMaker backtesting: https://trade-ideas.com/features/backtesting/
- Trade Ideas - Holly on Charts: https://www.trade-ideas.com/hollyguide/Holly_on_Charts.html
- Trade Ideas - Why Holly: https://www.trade-ideas.com/hollyguide/Why_Holly.html

## Aanpassing op actuele MVP/specs

De MVP en specs zijn na het eerste onderzoek aangescherpt. De belangrijkste wijziging is dat Event Discovery nu de primaire start van de applicatie is.

Actuele MVP-flow:

```text
Broad Market Discovery
-> Candidate Event
-> Candidate triage
-> Accepted Market Event
-> Analysis
-> Setup
-> Risk Review
-> Paper Trade
-> Result
-> Learning
```

Belangrijke implicaties voor dit voorstel:

- De watchlist is context en rankingvoorkeur, geen harde zoekgrens.
- Handmatig events toevoegen blijft fallback/correctie, maar is niet de standaard ochtendworkflow.
- `discovery_runs`, `event_sources` en `event_candidates` horen bij de kern van de MVP.
- De top 10 candidate events is het belangrijkste dagelijkse productmoment.
- Candidate triage moet naast "accepteren" ook "negeren", "samenvoegen" en "analyseren" ondersteunen.
- De Event Intelligence Score moet primair candidate ranking ondersteunen, niet alleen accepted market events.
- Scenario Library en Playbooks blijven belangrijk, maar moeten bovenop discovery candidates worden gelegd.

## Huidige Edge Terminal als uitgangspunt

De bestaande productrichting is al sterk:

```text
Broad Market Discovery -> Candidate Event -> Analysis -> Setup -> Risk Review -> Paper Trade -> Result -> Learning
```

Sterke punten in de huidige MVP:

- brede AI-gestuurde discovery staat centraal;
- top 10 candidate events is de dagelijkse start;
- candidate events kunnen worden geaccepteerd, genegeerd, samengevoegd of geanalyseerd;
- watchlist/asset preferences helpen ranking, maar beperken discovery niet;
- events zijn de verplichte start van elke setup;
- `no_trade` is een echte uitkomst;
- risk review is verplicht voordat een setup serieus wordt;
- paper trading meet de hypothese;
- Performance Lab leert van resultaten;
- AI-output wordt gelogd voor auditability.

Wat nog mist ten opzichte van de beste voorbeelden:

- discovery quality controls: bronkwaliteit, dedupe-confidence, recency en merge hints expliciet zichtbaar;
- een duidelijke ranking breakdown voor de top 10 candidate events;
- een gestructureerde scenario-bibliotheek zoals LevelFields;
- historische event-reacties per scenario;
- alert- en triageregels die ruis verminderen;
- een expliciete candidate/event score met onderliggende factoren;
- strategy/playbook-laag zoals Trade Ideas;
- persoonlijke backtest of replay op eigen paper trades;
- duidelijke scheiding tussen "extern bewezen patroon" en "jouw eigen edge".

## Wat LevelFields AI precies doet

### 1. Event intelligence in plaats van nieuwsfeed

LevelFields beschrijft zichzelf als AI die continu bedrijfsdocumenten en aankondigingen leest, events extraheert en koppelt aan tickers. De belangrijke stap is niet alleen detectie, maar interpretatie: wie is bron, wie is onderwerp, welk eventtype is dit, wanneer gebeurde het, wat is de uitkomst, en welke ticker hoort erbij.

Dit is belangrijk voor Edge Terminal omdat simpele keyword alerts te veel ruis geven. Een goede event terminal moet entiteiten en context begrijpen:

- "Bluebird" als vogel is geen `BLUE`;
- "Elliott" kan activist investor zijn, maar ook iets totaal anders;
- "S&P 500 inclusion" heeft een toegevoegd bedrijf en een verwijderd bedrijf;
- "layoffs" kan bullish zijn bij winstgevende bedrijven en bearish bij zwakke bedrijven.

### 2. Scenario's als herhaalbare strategieen

LevelFields werkt met scenario's: groepen vergelijkbare events die historisch een richting en reactiepatroon hebben. Voorbeelden uit hun documentatie:

- share buybacks;
- activist investor filings;
- CEO departures;
- S&P 500 inclusions;
- billion dollar contracts;
- dividend increases;
- breakthrough therapy designations;
- DOJ investigations;
- class action lawsuits;
- layoffs;
- FDA decisions.

Elke scenario-card toont volgens hun documentatie onder meer:

- eventtype;
- bullish of bearish verwachting;
- win rate;
- gemiddelde 1-day move;
- typische hold time;
- uitleg/tutorial.

Dit is zeer relevant voor Edge Terminal. Jouw app heeft nu eventtypes, maar nog geen scenario's met regels, voorkeuren, historische meetpunten en leerdoelen.

### 3. Historische reactiepatronen

LevelFields koppelt events aan post-event price movements. Belangrijk is dat ze niet alleen zeggen "dit is bullish", maar tonen hoe vergelijkbare events zich historisch gedroegen.

Belangrijke concepten:

- 1D impact: koersreactie rond de eerste handelsdag na het event;
- average 1D return: gemiddelde reactie binnen het scenario;
- table view: individuele events met D1, D2, D3, D5, 1M en soms langere returns;
- filters die de statistieken opnieuw berekenen voor vergelijkbare bedrijven.

Productles: Edge Terminal moet uiteindelijk niet alleen AI-rationale tonen, maar ook "wat gebeurde er historisch bij vergelijkbare events?" en "wat gebeurde er eerder bij mijn eigen paper trades?".

### 4. Filters als patroonverfijning

Een sterk LevelFields-principe is dat scenario's pas echt bruikbaar worden met filters. Een eventtype kan anders werken per:

- market cap;
- sector;
- profitability;
- revenue growth;
- volume/liquidity;
- volatility;
- dividend status;
- short-term of long-term trade horizon.

Voorbeeldlogica:

- layoffs bij zwakke bedrijven kunnen bearish zijn;
- layoffs bij grote winstgevende bedrijven kunnen als kostenbesparing bullish worden gezien;
- buybacks zijn sterker als de omvang relevant is ten opzichte van market cap;
- breakthrough therapy events vragen andere risk logic dan dividend increases.

### 5. Alerts zijn geen blind signaal

LevelFields benadrukt caveats rond alerts:

- earnings op dezelfde dag kunnen de impact van een bullish event overrulen;
- een negatieve brede markt kan bullish events verzwakken;
- timing is cruciaal, want na een dag of twee kan het event al ingeprijsd zijn;
- average move helpt om exitverwachting te bepalen;
- alerts kunnen direct of als daily digest worden verstuurd.

Voor Edge Terminal is dit goud waard: alerts moeten altijd met context komen. Niet "trade dit", maar "dit event is nieuw, deze factoren bevestigen of verzwakken het".

### 6. Wat LevelFields goed oplost

- Het maakt eventtypes tastbaar als scenario's.
- Het geeft gebruikers een leerpad: eerst scenario's lezen, dan alerts activeren.
- Het reduceert ruis via filters en scenario's.
- Het maakt timing expliciet.
- Het vertaalt ruwe events naar historische verwachtingen.
- Het dwingt gebruikers om niet elk event hetzelfde te behandelen.

### 7. Wat Edge Terminal beter kan doen

LevelFields is vooral een event-discovery en signal-platform. Edge Terminal kan persoonlijker worden:

- eigen paper-trade resultaten naast externe scenario-statistieken;
- persoonlijke risk review verplicht maken;
- "no trade" meten als kwaliteitskeuze;
- AI counterargument standaard tonen;
- signalen evalueren op proceskwaliteit, niet alleen P/L;
- brede discovery combineren met jouw watchlist, stijl en notities zonder de marktzoekruimte te vernauwen.

## Wat Trade Ideas precies doet

### 1. Realtime scanning in plaats van statische screening

Trade Ideas positioneert zich als realtime scanner. Het verschil met een klassieke screener:

- een screener filtert een momentopname;
- een scanner detecteert events zodra ze optreden;
- alerts komen binnen zonder refresh;
- gebruikers kunnen scans en alerts sterk aanpassen.

Voor Edge Terminal is dit later relevant, maar niet als eerste focus. Realtime tick-by-tick scanning is complex en vereist goede marktdata. De aangepaste MVP kiest een betere tussenweg: geen handmatige eventverzameling als standaard, maar wel een server-side daily broad-market discovery scan met toegestane news/search/market-data providers, dedupe, ranking en een compacte top 10.

### 2. Holly AI als strategie-selecteur

Holly AI backtest volgens Trade Ideas elke nacht meer dan 60 strategieen, optimaliseert parameters en selecteert strategieen met de hoogste statistische kans voor de komende handelsdag. Gemiddeld zou Holly 5 tot 25 trades per dag doen, afhankelijk van de gekozen strategieen en marktomstandigheden.

Belangrijk: Holly is niet alleen een LLM die uitleg schrijft. Het is vooral een strategie- en backtest-machine:

```text
strategy library
-> nightly backtest
-> parameter optimization
-> market regime check
-> selected strategies for today
-> intraday entries/exits
```

Productles: Edge Terminal moet AI niet alleen als tekstgenerator gebruiken. AI moet werken bovenop gestructureerde playbooks, meetbare uitkomsten en duidelijke status.

### 3. AI Strategy Window en AI Strategy Trades Window

Trade Ideas maakt onderscheid tussen:

- strategieen die voor vandaag actief zijn;
- concrete trades die Holly intraday opent;
- P/L en risk mode per strategie;
- trade history;
- entries, stops en exits.

Voor Edge Terminal vertaalt dit zich naar:

- Scenario Library: welke event-scenario's volg ik?
- Today Candidates: welke events/setups verdienen aandacht?
- Setup Detail: welke entry, invalidation, target en hold time?
- Risk Review: wat kan deze setup ontkrachten?
- Paper Trade: wat is er daadwerkelijk getest?

### 4. Chart-context

Trade Ideas toont Holly trades ook op charts:

- long/short entry arrows;
- entry line;
- stop line;
- target of trade-zone;
- visuele profitable/loss area.

Edge Terminal hoeft in MVP geen volwaardig chartplatform te worden. Wel is een compacte "setup visual" waardevol:

```text
Event time | Entry plan | Stop | Target | Invalidation | Review date
```

Een simpele price path tabel of mini-chart is genoeg om de trade thesis beter te beoordelen.

### 5. OddMaker backtesting

OddMaker is zeer leerzaam. Trade Ideas laat gebruikers scans/alerts backtesten zonder code en toont performance metrics zoals:

- profit factor;
- win rate;
- average winner/loser;
- max drawdown;
- equity curve;
- trade-by-trade breakdown;
- filters die waarde toevoegen of wegnemen.

Voor Edge Terminal is dit een latere, maar cruciale richting: niet alleen trades loggen, maar achteraf per scenario en filtergroep leren:

- Welke eventtypes leverden goede paper trades op?
- Welke AI confidence band was betrouwbaar?
- Welke risk flags voorspelden slechte trades?
- Welke setups waren te vroeg, te laat of te breed?
- Wanneer was `no_trade` de beste beslissing?

### 6. Simulated trading en brokerkoppeling

Trade Ideas ondersteunt simulated trading en kan koppelen met brokers. Voor Edge Terminal is dit voorlopig expliciet niet de beste focus.

Waarom niet:

- het verhoogt juridische en technische complexiteit;
- het verplaatst de app richting execution in plaats van research;
- jouw productdoel is beter denken, niet automatisch handelen;
- paper trading is genoeg om hypotheses meetbaar te maken.

### 7. Wat Trade Ideas goed oplost

- Snelle scanbaarheid.
- Strategy library met meetbare performance.
- AI als selectie- en optimalisatielaag.
- Duidelijke entry/exit/risk visualisatie.
- Simulated trading als oefenomgeving.
- Performance feedback direct gekoppeld aan strategieen.

### 8. Wat Edge Terminal beter kan doen

Trade Ideas is sterk voor actieve traders, maar kan overweldigend zijn. Edge Terminal kan rustiger en persoonlijker zijn:

- minder tick-by-tick ruis;
- meer event-thesis en context;
- expliciete counterarguments;
- persoonlijk trading journal;
- prioriteit op watchlist en eigen stijl;
- geen druk naar execution.

## Productprincipes voor Edge Terminal

### Principe 1 - Candidate events zijn hypotheses, geen signalen

Een discovery candidate is een aanleiding om te onderzoeken. Pas na broncontrole, dedupe, context, scenario-match, setup en risk review ontstaat een mogelijke paper trade.

### Principe 2 - Discovery ranking is het dagelijkse startpunt

De belangrijkste ochtendvraag is niet "wat staat er op mijn watchlist?", maar "welke 10 breed gevonden events verdienen vandaag aandacht en waarom?". De watchlist helpt ranking, maar mag de zoekruimte niet beperken.

### Principe 3 - Scenario's zijn belangrijker dan losse tickers

De gebruiker moet leren: "dit type event werkt voor mij onder deze condities", niet alleen "deze ticker ging omhoog".

### Principe 4 - Elke candidate krijgt een context score

Een candidate zonder context is ruis. Edge Terminal moet altijd tonen:

- waarom dit event relevant is;
- welke bronnen het dragen;
- of het nieuw, oud, dubbel of onzeker is;
- wat de historische verwachting is;
- wat het kan overrulen;
- wat nog onbekend is;
- welk risico het idee ongeldig maakt.

### Principe 5 - Risk review is een productfeature, geen bijzaak

LevelFields en Trade Ideas tonen kansen. Edge Terminal moet kansen aanvallen voordat ze paper trades worden.

### Principe 6 - Persoonlijke data wint op termijn van generieke claims

Externe win rates zijn nuttig als startpunt, maar jouw eigen paper-trade database moet leidend worden.

## Voorstel: nieuwe kernmodules en verbeteringen

### 1. Discovery Candidate Quality Layer

Nieuwe kernlaag binnen Dashboard en Event Radar.

Doel:
de brede discovery-output betrouwbaar genoeg maken voor dagelijkse triage. Deze laag bepaalt welke candidate events de top 10 halen, welke events ruis zijn, welke bronnen voldoende bewijs leveren, en welke candidates samengevoegd moeten worden.

MVP-velden per candidate:

- `discovery_run_id`;
- `title`;
- `summary`;
- `source_name`;
- `source_url`;
- `raw_payload_reference`;
- `detected_at`;
- `occurred_at`;
- `event_type_guess`;
- `impact_direction_guess`;
- `impact_level_guess`;
- `affected_symbols`;
- `affected_markets`;
- `reason_to_watch`;
- `relevance_score`;
- `confidence_score`;
- `source_quality_score`;
- `recency_score`;
- `dedupe_key`;
- `merge_hint`;
- `candidate_status`: new, accepted, ignored, merged, analyzed;
- `ignore_reason`.

Rankingvragen:

- Is er een concrete gebeurtenis, of alleen commentaar/ruis?
- Is het event breed marktbewegend, sectorrelevant of ticker-specifiek?
- Is het vers genoeg voor een setup of alleen nog leerdata?
- Zijn meerdere bronnen hetzelfde event aan het herhalen?
- Is de bron primair, secundair of twijfelachtig?
- Is de verwachte impact groot genoeg voor de top 10?
- Past het bij watchlist/voorkeuren zonder andere markten uit te sluiten?

UI:

- top 10 op Dashboard;
- Event Radar tabs: New, Top 10, Accepted, Ignored, Merged, Analyzed;
- providerstatus en laatste scanmoment;
- bronkwaliteit en dedupe-confidence per candidate;
- quick actions: accept, ignore, merge, analyze.

### 2. Scenario Library

Nieuwe of uitgebreide sectie binnen Event Radar.

Doel:
scenario's beheren die discovery candidates en accepted events beter interpreteren, inclusief default richting, horizon, filters en evaluatiecriteria.

Voorbeeldscenario's voor start:

| Scenario | Richting | Horizon | Waarom relevant |
|---|---:|---:|---|
| Share buyback | long | 1-21 dagen | Vaak directe herwaardering, vooral bij grote buyback t.o.v. market cap |
| Activist stake | long | 1-90 dagen | Kan snelle pop en langere campagne veroorzaken |
| CEO sudden departure | short/watch | 1-10 dagen | Vaak onzekerheid en sentimentdruk |
| Class action / legal risk | short/watch | 1-30 dagen | Kan reputatie- en margin pressure geven |
| Guidance raise/cut | long/short | 1-30 dagen | Fundamentele verwachting verschuift |
| Product launch backlash | short/watch | 1-14 dagen | Past bij perception-event richting |
| Analyst upgrade/downgrade | watch | 1-5 dagen | Vaak nuttig met volume/price confirmation |
| Macro CPI/Fed event | risk regime | intraday-5 dagen | Kan individuele events overrulen |

Nieuwe velden per scenario:

- `name`;
- `event_type`;
- `default_direction`;
- `default_time_horizon`;
- `expected_reaction_window`;
- `required_confirmations`;
- `common_false_positives`;
- `risk_overrides`;
- `starter_filters`;
- `personal_status`: testing, active, paused, avoid;
- `notes`.

### 3. Event Intelligence Score

Een samengestelde score per candidate/event, niet als advies maar als prioritering.

Voorstel score:

```text
event_intelligence_score =
  candidate_relevance
+ source_quality
+ recency
+ dedupe_confidence
+ scenario_fit
+ watchlist_preference_fit
+ historical_pattern_strength
+ market_context
+ liquidity_fit
- override_risks
- uncertainty_penalty
```

Componenten:

| Component | Vraag |
|---|---|
| Candidate relevance | Is dit echt een marktgebeurtenis of alleen ruis? |
| Recency | Is het event nieuw genoeg voor de ochtendflow? |
| Dedupe confidence | Is dit uniek of onderdeel van een bestaande candidate? |
| Scenario fit | Past het event in een bekend scenario? |
| Source quality | Komt het uit filing, company release, betrouwbare newswire of social noise? |
| Watchlist preference fit | Raakt het jouw voorkeuren, zonder brede discovery te beperken? |
| Historical pattern strength | Is er genoeg historische of eigen data? |
| Market context | Werkt brede markt mee of tegen? |
| Liquidity fit | Is volume/spread handelbaar voor paper setup? |
| Override risks | Earnings, macro, sector shock, legal detail, low float manipulation |
| Uncertainty penalty | Ontbrekende bron, onduidelijke entiteit, mixed event |

UI:

- scorebadge op Dashboard top 10 en Event Radar;
- ranking breakdown op candidate cards;
- score breakdown op Event Detail;
- "why this matters" en "why this may fail";
- filters op source quality, recency, score en status.

### 4. Historical Reaction Lab

Nieuwe sectie op Event Detail.

MVP-start:

- handmatige of delayed price snapshots;
- D0, D1, D3, D5, D10, D20 returns;
- markeer of de move front-loaded, delayed, failed of reversed was.

Later:

- automatische quotes via provider;
- scenario-aggregatie;
- persoonlijke event-statistieken.

Voorbeeldvelden:

- `event_price_reference`;
- `return_1d`;
- `return_3d`;
- `return_5d`;
- `return_10d`;
- `return_20d`;
- `max_favorable_excursion`;
- `max_adverse_excursion`;
- `reaction_shape`: front_loaded, continuation, delayed, fade, no_move;
- `priced_in_assessment`;
- `notes`.

Waarom:
dit is het stuk waar LevelFields sterk in is. Zonder reactiepatronen blijft Edge Terminal te afhankelijk van losse AI-uitleg.

### 5. Alert Rules en Daily Triage

Nieuwe alert-laag, eerst zonder push/email als interne dashboardregels.

Alert types:

- discovery alert: nieuw high-score candidate event;
- scenario alert: elk nieuw candidate/event binnen scenario;
- filtered alert: scenario + watchlist preference + market cap/sector/priority;
- risk alert: event dat open paper trade of setup ontkracht;
- stale alert: setup zonder risk review of paper trade na X dagen;
- follow-through alert: event beweegt na D1/D3 zoals verwacht;
- fail alert: event beweegt tegen thesis.

Daily Briefing moet niet alleen samenvatten, maar prioriteren:

```text
1. New high-quality event candidates
2. Candidates to ignore or merge
3. Setups that need risk review
4. Existing trades affected by new events
5. What not to trade today
```

### 6. Playbook-driven Setup Generation

Trade Ideas heeft strategieen. Edge Terminal kan lichtere playbooks gebruiken.

Voorbeeld playbooks:

- Post-event momentum continuation;
- Fast fade after overreaction;
- Gap-and-wait confirmation;
- Perception backlash short;
- Buyback follow-through;
- Activist campaign watch;
- Earnings override no-trade;
- Macro risk-off no-trade.

Velden per playbook:

- setup direction;
- required confirmation;
- entry logic;
- invalidation logic;
- stop placement rule;
- target rule;
- expected hold time;
- when to skip;
- review questions.

Belangrijk:
AI mag een playbook voorstellen, maar moet altijd uitleggen waarom alternatieven zwakker zijn.

### 7. Risk Review 2.0

De huidige risk review is goed. Maak hem scherper door LevelFields caveats en Trade Ideas risk modes te vertalen naar vaste checks:

- Is er dezelfde dag earnings?
- Is er een macro-event dat alles kan overrulen?
- Is de candidate gedragen door sterke bronnen of vooral door herhaalde headlines?
- Is het event dubbel geteld of samengevoegd met ouder nieuws?
- Is de beweging al ingeprijsd?
- Is de alert te oud?
- Is volume/liquidity voldoende?
- Past de horizon bij het scenario?
- Is de setup afhankelijk van een tweede bevestiging?
- Wat zou de beste reden zijn om niets te doen?

Nieuwe output:

- `risk_score`;
- `risk_mode`: conservative, balanced, aggressive;
- `skip_reason`;
- `confirmation_needed`;
- `review_after`;
- `max_loss_assumption`;
- `thesis_killer`.

### 8. Personal Edge Score

Na genoeg paper trades moet Edge Terminal niet meer alleen generieke scores tonen. Het moet leren van Robin's eigen data.

Voorstel:

```text
personal_edge_score =
  personal_win_rate_by_scenario
+ average_result_by_setup_type
+ discipline_score
+ risk_review_accuracy
+ no_trade_quality
- repeated_mistake_penalty
```

Nieuwe inzichten in Performance Lab:

- performance per scenario;
- performance per playbook;
- performance per event age;
- performance per confidence band;
- performance per risk verdict;
- top avoid-patterns;
- beste `no_trade` beslissingen;
- setups die vaak goed geanalyseerd maar slecht getimed waren.

## Concrete verwerking in de bestaande applicatie

### Dashboard

Toevoegen:

- "Top event candidates" met Event Intelligence Score;
- discovery status: provider, laatste scanmoment, aantal bronnen, errors;
- top 10 cards met reason_to_watch, affected markets en candidate_status;
- "What to ignore today";
- "Scenario watch" met actieve scenario's;
- "Risk overrides" voor macro/earnings/broad market;
- "Learning note" uit Performance Lab.

### Watchlist

Toevoegen:

- preferred scenarios per asset;
- avoid scenarios per asset;
- liquidity/trading-style notes;
- asset priority gekoppeld aan rankinggewicht, niet aan discovery-scope;
- event sensitivity tags, bijvoorbeeld `macro_sensitive`, `legal_sensitive`, `sentiment_sensitive`.

### Event Radar

Ombouwen van eventlijst naar discovery- en triage-oppervlak:

- tabs: Top 10, New, Accepted, Ignored, Merged, Analyzed;
- run status voor `discovery_runs`;
- source list voor `event_sources`;
- candidate cards voor `event_candidates`;
- scenario filter;
- age filter;
- source quality filter;
- recency filter;
- score breakdown;
- merge hints en duplicate badges;
- quick action: accept, ignore, merge, analyze.

### Event Detail

Toevoegen:

- candidate provenance als het event uit discovery komt;
- scenario match;
- source context;
- source quality en raw payload reference;
- historical reaction lab;
- expected reaction window;
- override risks;
- comparable past events;
- personal past results for this scenario;
- AI bull/bear/no-trade recommendation.

### Setups & Risk

Toevoegen:

- playbook selector;
- setup quality checklist;
- risk mode;
- confirmation needed;
- thesis killer;
- "paper trade allowed?" gate;
- reject/skip reason library.

### Paper Trades

Toevoegen:

- linked scenario;
- linked playbook;
- event age at entry;
- planned hold time;
- actual hold time;
- max favorable/adverse excursion;
- discipline score;
- "followed setup?" yes/no.

### Performance Lab

Toevoegen:

- scenario performance;
- playbook performance;
- event-age performance;
- risk review accuracy;
- no-trade review;
- mistakes library;
- next-week focus scenarios.

### AI Log

Toevoegen:

- prompt version;
- discovery prompt version: `event-discovery-v1`, `candidate-dedupe-v1`, `candidate-ranking-v1`;
- scenario version;
- score inputs;
- source payload references;
- model output schema;
- user override notes;
- final decision outcome.

## Technische implicaties

### Nieuwe tabellen of uitbreidingen

Volgens de actuele specs horen deze discovery-tabellen bij de MVP-kern:

```text
discovery_runs
event_sources
event_candidates
```

Voorstel voor aanvullende Supabase-tabellen na de discovery-basis:

```text
event_scenarios
scenario_filters
event_reaction_snapshots
alert_rules
alert_events
setup_playbooks
setup_quality_reviews
personal_edge_metrics
```

Minimale start kan met bestaande tabellen door velden toe te voegen aan:

- `event_candidates`;
- `market_events`;
- `event_analyses`;
- `trade_setups`;
- `risk_reviews`;
- `paper_trades`;
- `trade_evaluations`.

### Event ingestion fasering

Fase 1:

- `discovery_runs`, `event_sources` en `event_candidates` gebruiken als MVP-basis;
- demo/mock broad-market candidates tonen zonder provider;
- candidate ranking met reason_to_watch, relevance_score, confidence_score en source_quality;
- candidate triage: accept, ignore, merge, analyze;
- handmatige event input alleen als fallback/correctiepad.

Fase 2:

- news/search discovery provider aansluiten;
- daily ochtendscan en handmatige refresh;
- dedupe en merge hints verbeteren;
- delayed quote API;
- movers gebruiken als discovery-signaal;
- daily briefing met actual market context.

Fase 3:

- SEC/company filings;
- earnings calendar;
- macro calendar;
- sector/macro tagging;
- entity matching en deduplicatie.

Fase 4:

- automatische D1/D3/D5 returns;
- eigen scenario-statistieken;
- no-code personal backtest op paper trades;
- replay van oude alerts;
- personal edge score.

### AI-output schemas

Discovery moet gestructureerd worden:

```text
{
  candidate_title,
  candidate_summary,
  source_refs,
  affected_symbols,
  affected_markets,
  event_type_guess,
  impact_direction_guess,
  impact_level_guess,
  relevance_score,
  confidence_score,
  source_quality_score,
  recency_score,
  reason_to_watch,
  duplicate_or_merge_hint,
  uncertainty_notes
}
```

Event analysis moet gestructureerd worden:

```text
{
  candidate_id,
  scenario_match,
  impact_direction,
  expected_reaction_window,
  confidence_score,
  event_intelligence_score,
  score_breakdown,
  bull_case,
  bear_case,
  no_trade_case,
  override_risks,
  required_confirmations,
  comparable_event_notes
}
```

Setup generation:

```text
{
  playbook,
  direction,
  entry_logic,
  confirmation_needed,
  invalidation,
  stop_loss_logic,
  target_logic,
  planned_hold_time,
  reason_to_skip,
  confidence_score
}
```

Risk review:

```text
{
  counterargument,
  thesis_killer,
  macro_override,
  earnings_override,
  timing_risk,
  liquidity_risk,
  risk_mode,
  risk_score,
  final_verdict
}
```

## Wat we niet moeten kopieren

Niet direct doen:

- brokerkoppeling;
- automatisch handelen;
- tick-by-tick realtime scanner;
- grote performanceclaims in UI;
- social/community signal hype;
- 50+ strategieen voordat de kern werkt;
- complex options-pricing scherm.

Wel doen:

- broad-market discovery als eerste productmoment behandelen;
- candidate events beter structureren, dedupliceren en ranken;
- bronkwaliteit, recency en uncertainty zichtbaar maken;
- scenario's zichtbaar maken;
- alerts en candidates context geven;
- risk-first proces behouden;
- performance meten op eigen data;
- expliciet tonen dat AI hypotheses maakt, geen advies.

## Prioriteiten

### Prioriteit 1 - Discovery Candidate Quality MVP

Dit is nu de belangrijkste upgrade, omdat de aangepaste MVP draait om dagelijkse brede discovery. De top 10 candidate events moet betrouwbaar, scanbaar en uitlegbaar zijn voordat scenario's of playbooks echt waarde toevoegen.

Deliverables:

- `discovery_runs`, `event_sources` en `event_candidates` volledig benutten in UI en dataflow;
- top 10 candidate cards op Dashboard;
- Event Radar triage tabs: Top 10, New, Accepted, Ignored, Merged, Analyzed;
- source quality, recency, dedupe hints en reason_to_watch zichtbaar;
- candidate actions: accept, ignore, merge, analyze;
- discovery AI-output schema en promptversies aansluiten op AI Log.

### Prioriteit 2 - Event Intelligence Score en Scenario Library

Deze laag maakt Edge Terminal meer LevelFields-achtig: candidates worden niet alleen gerankt, maar ook gekoppeld aan herhaalbare scenario's en historische verwachtingen.

Deliverables:

- scenario model;
- scenario cards;
- score breakdown op candidate en accepted event;
- scenario filter in Event Radar;
- AI-output schema aanpassen voor `scenario_match` en `event_intelligence_score`;
- watchlist preference fit als rankinggewicht, niet als discovery-filter.

### Prioriteit 3 - Historical Reaction Lab

Zonder reactiehistorie blijft de app te beschrijvend. Met D1/D3/D5 returns wordt hij lerend.

Deliverables:

- reaction snapshot velden;
- mini-tabel op Event Detail;
- scenario aggregation in Performance Lab;
- handmatige start, later provider API.

### Prioriteit 4 - Playbooks in Setups & Risk

Dit brengt Trade Ideas-denken binnen zonder realtime trading engine.

Deliverables:

- setup playbooks;
- playbook selector;
- setup quality checklist;
- risk review 2.0.

### Prioriteit 5 - Personal Edge Metrics

De app wordt pas echt waardevol als hij jouw gedrag terugspiegelt.

Deliverables:

- scenario performance;
- playbook performance;
- no-trade quality;
- repeated mistake detection;
- next-week focus recommendation.

## Voorstel voor eerste bouwstap

De eerste echte productverbetering zou deze slice moeten zijn:

```text
Discovery Candidate Quality MVP
-> mock/provider-ready discovery run
-> top 10 candidate events op Dashboard
-> candidate score zichtbaar in Event Radar
-> source quality + recency + dedupe breakdown
-> accept / ignore / merge / analyze acties
-> accepted candidate wordt market event
-> AI Log bewaart discovery prompt/input/output
```

Waarom deze slice:

- sluit direct aan op bestaande MVP;
- vereist geen brokerkoppeling;
- vereist nog geen dure realtime provider;
- maakt de ochtendworkflow direct bruikbaar zonder handmatig nieuws te verzamelen;
- legt de basis voor scenario matching, historische reacties en latere provider-integraties;
- combineert LevelFields' event-discovery-denken met Edge Terminal's eigen risk-first flow.

## Backlogvoorstel

### EPIC - Discovery candidate intelligence

Doel: brede marktbronnen omzetten naar een compacte, uitlegbare top 10 van candidate events.

Stories:

- Als gebruiker wil ik iedere ochtend een top 10 candidate events zien, zodat ik niet zelf nieuws hoef te verzamelen.
- Als gebruiker wil ik per candidate reason_to_watch, bronkwaliteit, recency en confidence zien, zodat ik snel kan triageren.
- Als gebruiker wil ik candidates kunnen accepteren, negeren, samenvoegen of analyseren, zodat alleen relevante events de researchflow in gaan.
- Als gebruiker wil ik providerstatus en laatste scanmoment zien, zodat ik weet of de briefing betrouwbaar is.
- Als gebruiker wil ik dat dubbele headlines worden herkend, zodat dezelfde gebeurtenis niet meerdere plekken inneemt.

### EPIC - Scenario intelligence

Doel: candidate en accepted market events omzetten naar herhaalbare scenario's met score, filters en leerwaarde.

Stories:

- Als gebruiker wil ik scenario's beheren, zodat ik niet elk candidate event los beoordeel.
- Als gebruiker wil ik per candidate/event een scenario match zien, zodat ik begrijp welk patroon mogelijk speelt.
- Als gebruiker wil ik een Event Intelligence Score met breakdown, zodat ik snel prioriteit kan bepalen.
- Als gebruiker wil ik candidates/events kunnen negeren met reden, zodat `ignore` en `no_trade` ook leerdata worden.

### EPIC - Historical reaction learning

Doel: koersreacties na events vastleggen en leren welke patronen werken.

Stories:

- Als gebruiker wil ik D1/D3/D5 returns per event zien, zodat ik weet of de thesis follow-through kreeg.
- Als gebruiker wil ik scenario performance zien, zodat ik betere focus kan kiezen.
- Als gebruiker wil ik zien of een move front-loaded of continuation was, zodat mijn entry/exit verbetert.

### EPIC - Playbook setups

Doel: setups standaardiseren rond herhaalbare handelsplannen.

Stories:

- Als gebruiker wil ik een setup-playbook kiezen, zodat entries, stops en invalidation consistenter worden.
- Als gebruiker wil ik dat AI een playbook voorstelt met alternatieven, zodat ik minder willekeurig beslis.
- Als gebruiker wil ik een setup quality checklist, zodat ik geen paper trade maak op halve informatie.

### EPIC - Personal edge

Doel: eigen paper-trade data gebruiken om betere beslissingen te nemen.

Stories:

- Als gebruiker wil ik performance per scenario zien, zodat ik weet welke eventtypes waarde hebben.
- Als gebruiker wil ik performance per playbook zien, zodat ik mijn handelsstijl verfijn.
- Als gebruiker wil ik herhaalde fouten zien, zodat ik bewuster kan skippen.
- Als gebruiker wil ik no-trade beslissingen terugkijken, zodat discipline meetbaar wordt.

## Eindadvies

Gebruik LevelFields AI als belangrijkste productreferentie voor:

- event discovery uit brede bronnen;
- scenario-denken;
- eventtype taxonomie;
- historische reactiepatronen;
- filterbare alerts;
- context rond timing en caveats.

Gebruik Trade Ideas als referentie voor:

- strategy library;
- backtest/validation-denken;
- entry/exit/risk visualisatie;
- simulated trading feedback;
- performance per strategie.

Maak Edge Terminal niet tot een kloon van beide. De unieke positie is:

```text
Een persoonlijke event-driven research cockpit
die breed marktgebeurtenissen vindt en rankt,
candidate events omzet in hypotheses,
die hypotheses verplicht aanvalt met risk review,
en via paper trading leert welke signalen echt bij Robin werken.
```

Dat is de juiste richting om de applicatie perfect te maken voor het ondersteunen van jouw trading: snel genoeg om kansen niet te missen, rustig genoeg om niet impulsief te handelen, en kritisch genoeg om van elke beslissing te leren.
