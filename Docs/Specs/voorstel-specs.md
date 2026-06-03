# Voorstel-specs - Edge Terminal

> Status: fase 3 voorstel-specs.
> Laatst aangepast: 2026-06-03 - afgestemd op Discovery Candidate Quality MVP.
> Niveau: voldoende voor mockup-review en bouwrichting. Detailkeuzes worden uitgewerkt in `functional-design.md` en `technical-design.md`.

## Projectoverzicht

Edge Terminal is een persoonlijke trading research terminal voor event-driven research. De app helpt Robin om brede marktgebeurtenissen automatisch te ontdekken, te prioriteren en daarna sentiment, risico's, mogelijke setups en paper trades gestructureerd te beoordelen.

De eerste versie is geen tradingbot en geen signaaldienst. Elke mogelijke trade wordt behandeld als hypothese, met verplicht tegenargument en meetbare paper-trade uitkomst. Het doel is dat Robin iedere ochtend een compacte, uitlegbare top 10 ziet van breed gevonden candidate events die waarschijnlijk impact hebben op een aandeel, sector, ETF, valuta, rentepad of marktregime, zonder eerst zelf events te hoeven verzamelen.

De eerste product-slice is **Discovery Candidate Quality MVP**. Dat betekent dat de app eerst vooral goed moet worden in:

- breed scannen via toegestane news/search/market-data bronnen;
- candidate events normaliseren en dedupliceren;
- bronkwaliteit, recency, confidence en reason_to_watch tonen;
- een top 10 ranking maken die scanbaar en verklaarbaar is;
- candidates accepteren, negeren, samenvoegen of analyseren;
- alle discovery-inputs, prompts en outputs loggen voor auditability.

Scenario Library, Event Intelligence Score, historical reactions en Trade Ideas-achtige playbooks blijven de gewenste vervolglagen, maar komen bovenop betrouwbare candidate discovery.

## Discovery-bronnenstrategie

De grootste uitdaging van Edge Terminal is niet de analyse of setup-generatie, maar het dagelijks vinden van de juiste nieuwsfeiten. De MVP zoekt daarom niet "het hele internet" af en vraagt niet aan een taalmodel om vrij nieuws te verzinnen. De MVP gebruikt een gecontroleerde **event discovery funnel**:

1. Brede news/search-laag: GDELT of NewsAPI-achtig zoeken naar actuele marktgevoelige nieuwsitems, ook buiten Robin's watchlist.
2. Financiele nieuwslaag: Alpha Vantage News/Sentiment als betaalbare startoptie; Benzinga of Finnhub later als professionelere feed wanneer kwaliteit/budget dat vraagt.
3. Primaire bronnen: SEC EDGAR voor filings, company IR/press releases, earnings calendars en macrobronnen zoals FRED of officiele macro release calendars.
4. Market context: delayed koersen, movers, volume, sector/ETF-context en pre-market bewegingen als signaal dat een nieuwsfeit mogelijk marktimpact heeft.
5. Candidate Quality Layer: normaliseren, dedupliceren, bronkwaliteit beoordelen, marktimpact inschatten en de top 10 ranken.

De watchlist is alleen ranking-context. Een watchlist-hit mag extra relevantie krijgen, maar een belangrijk macro-, sector-, ETF- of filing-event mag altijd bovenaan komen wanneer het sterker is.

Naast de watchlist kan Robin per handmatige scan optioneel een **scan hint** toevoegen: een onderwerp, ticker of researchvraag waarvan hij denkt dat er iets speelt. Zo'n hint geeft extra query- en rankingcontext, maar is nooit verplicht en sluit brede marktdekking niet uit.

## Referentieonderzoek verwerkt

De specs verwerken de lessen uit `Docs/research-levelfields-trade-ideas-voorstel.md`.

| Referentie | Les voor Edge Terminal |
|---|---|
| LevelFields AI | Denk in events/scenario's, bronkwaliteit, timing, historical reaction patterns en filterbare alerts. |
| Trade Ideas | Denk in scanbaarheid, strategie-validatie, setup/risk visualisatie en performancefeedback per strategie. |
| Edge Terminal keuze | Eerst discovery candidate quality, daarna scenario's/playbooks/personal edge. |

## Doelgroep & gebruikersrollen

| Rol | Wie | Rechten op hoofdlijn |
|---|---|---|
| Owner / researcher | Robin de Jong | Inloggen, candidate events beoordelen, setups/trades beheren, analyses draaien, resultaten evalueren |
| System / AI worker | Server-side AI-flows | Breed nieuws en marktdata scannen, candidate events maken, top 10 prioriteren, analyses genereren, prompts/outputs loggen |

> AANNAME: MVP is single-user, maar gebruikt wel Supabase Auth zodat sessies, beveiliging en eventuele latere uitbreiding netjes staan.

## Functionele specificatie op hoofdlijnen

### 1. Auth & App Shell
- Omschrijving: beveiligde webapp met login via Supabase Auth en een compacte terminal-navigatie.
- Kernscenario's:
  - Robin logt in.
  - Robin ziet direct het dashboard.
  - Niet-ingelogde gebruikers worden naar login gestuurd.
- Belangrijkste edge cases:
  - Supabase env ontbreekt.
  - Sessie verlopen.
  - Alleen geautoriseerde gebruiker mag data zien.

### 2. Dashboard
- Omschrijving: dagelijkse cockpit met belangrijkste events, setups, risico's, open paper trades en performance.
- Kernscenario's:
  - Iedere ochtend de top 10 meest relevante candidate events zien.
  - Zien waarom een candidate mogelijk impact heeft op een aandeel, sector, ETF of bredere markt.
  - Per candidate bronkwaliteit, recency, confidence, dedupe-status en reason_to_watch zien.
  - Providerstatus, laatste scanmoment en discovery errors zien.
  - Candidate direct accepteren, negeren, samenvoegen of analyseren.
  - Zien welke setups of risk reviews aandacht vragen.
  - Snel doorklikken naar Event Detail, Event Radar of Setups & Risk.
- Belangrijkste edge cases:
  - Geen events vandaag.
  - Veel nieuwsruis maar weinig tradebare edge.
  - Provider mist bronnen of levert dubbele headlines.
  - Open paper trades zonder recente evaluatie.

### 3. Watchlist
- Omschrijving: beheer van voorkeuren, holdings en terugkerende assets. De watchlist helpt ranking en context, maar beperkt de event discovery niet.
- Kernscenario's:
  - Asset toevoegen met ticker, naam, type, markt, sector, valuta en status.
  - Asset bewerken of inactief zetten.
  - Zien welke assets recent door breed gevonden events geraakt zijn.
  - Asset markeren als extra relevant voor ranking, zonder andere markten uit te sluiten.
- Belangrijkste edge cases:
  - Dubbele ticker.
  - Asset zonder beschikbare koersdata.
  - Inactieve asset met historische events/trades.

### 4. Event Discovery & Candidate Quality
- Omschrijving: AI-gestuurde discovery-flow die breed nieuws, bedrijfsupdates, macro-items, sectorontwikkelingen, filings en marktbewegingen scant en daaruit candidate events maakt. De eerste MVP-slice draait om candidate quality: bronkwaliteit, recency, dedupe, confidence en uitlegbare top 10 ranking.
- Kernscenario's:
  - Dagelijkse scan draaien voor brede marktdekking, niet alleen de watchlist.
  - Candidate events automatisch dedupliceren en ranken op verwachte marktimpact.
  - Top 10 tonen met korte reden: "waarom dit mogelijk marktimpact heeft".
  - Score breakdown tonen: relevance, source quality, recency, dedupe confidence, market context en uncertainty.
  - Candidate accepteren, negeren, samenvoegen of direct analyseren.
  - Ignored candidates bewaren met ignore_reason zodat ruis later leerdata kan worden.
  - Bronnen en ruwe payload bewaren voor auditability.
- Belangrijkste edge cases:
  - Headlines zijn ruis, oud nieuws of clickbait.
  - Hetzelfde event komt uit meerdere bronnen.
  - AI denkt impact te zien maar bronbewijs is zwak.
  - Een brede marktbeweging wordt onterecht aan een specifiek bedrijf gekoppeld.
  - Een watchlist-hit verdringt een belangrijker breed-markt event.
  - Scraping/API-provider faalt of rate-limit wordt geraakt.

### 5. Market Events
- Omschrijving: geaccepteerde discovery events die invloed kunnen hebben op assets, sectoren of markten. Handmatige invoer blijft alleen als fallback of correctiepad bestaan.
- Kernscenario's:
  - Candidate event promoveren naar formeel market event.
  - Event koppelen aan een of meerdere assets, sectoren, ETF's of marktregimes.
  - Event classificeren op type, impact, datum en status.
  - Event verrijken met Gemini-webresearch als dat nuttig is.
- Belangrijkste edge cases:
  - Event raakt meerdere assets.
  - Event is vooral perceptiegedreven.
  - Bron of koersreactie is onzeker.

### 6. Perception Events
- Omschrijving: speciale eventcategorie voor sentiment, merkvertrouwen, publieke ontvangst of narratief.
- Kernscenario's:
  - Slecht ontvangen productpresentatie automatisch detecteren uit mediareactie, koersreactie en publiek narratief.
  - Koersreactie, mediareactie en publieke ontvangst meenemen.
  - Onderscheid maken tussen fundamentele impact en sentimentimpact.
- Belangrijkste edge cases:
  - Veel ruis, weinig fundamenteel bewijs.
  - Koersreactie lijkt overdreven.
  - Mogelijke short en rebound setup bestaan tegelijk.

### 7. Event Analysis
- Omschrijving: OpenAI-analyse van eventimpact, sentiment, tijdshorizon, onzekerheid en risico's.
- Kernscenario's:
  - Analyse draaien vanuit Event Detail of direct vanuit een candidate.
  - Candidate provenance meenemen: bronnen, raw payload reference, source quality, recency en dedupe/merge hints.
  - Bull case, bear case en risico's tonen.
  - Impactniveau, confidence score en Event Intelligence Score vastleggen.
  - Analyse expliciet laten aangeven of `no_trade` of `ignore` beter is dan een setup.
- Belangrijkste edge cases:
  - Analyse geeft "geen duidelijke edge".
  - Bronnen spreken elkaar tegen.
  - Analyse-output is onvolledig of fout.
  - Candidate blijkt na analyse oud nieuws, duplicate of onvoldoende bronbewijs.

### 8. Setups & Risk
- Omschrijving: vertaalt event + analyse naar mogelijke long, short of no-trade hypothese en valt die hypothese verplicht aan voordat er een paper trade komt.
- Kernscenario's:
  - Setup genereren vanuit een geanalyseerd event.
  - Richting, entry-logica, invalidatie, stop-loss, target en aannames vastleggen.
  - Setup goedkeuren, afwijzen of op watch zetten.
  - Risk review uitvoeren met zwakke aannames, counterargument en final verdict.
- Belangrijkste edge cases:
  - No trade is de beste uitkomst.
  - Setup heeft te weinig concrete entry-logica.
  - Meerdere setups uit hetzelfde event.
  - Risk review spreekt setup tegen.
  - Risk score te hoog voor paper trade.
  - Setup wordt ongeldig door nieuwe informatie.

### 9. Paper Trades
- Omschrijving: fictieve trades om hypotheses meetbaar te testen zonder brokerkoppeling.
- Kernscenario's:
  - Paper trade aanmaken vanuit setup.
  - Open trades bekijken.
  - Trade handmatig sluiten.
  - Resultaat, exit reason en evaluatie vastleggen.
- Belangrijkste edge cases:
  - Trade handmatig geannuleerd.
  - Stop-loss of target geraakt.
  - Hypothese klopt inhoudelijk maar timing faalt.

### 10. Performance Lab
- Omschrijving: leren welke signalen, eventtypes, strategieen en confidence scores waarde hebben.
- Kernscenario's:
  - Gesloten trades tellen.
  - Winrate en gemiddeld resultaat tonen.
  - Performance per richting, eventtype en confidence band bekijken.
  - Strategieen markeren als kansrijk, mixed of vermijden.
- Belangrijkste edge cases:
  - Te weinig data voor conclusie.
  - Outlier trade vertekent gemiddelde.
  - No-trade beslissingen moeten ook waarde kunnen aantonen.

### 11. Daily Briefing
- Omschrijving: compacte dagelijkse samenvatting van brede marktcontext, top 10 candidate events, setups, risico's en open trades.
- Kernscenario's:
  - Belangrijkste breed gevonden candidate events van de dag tonen.
  - Discovery status, brondekking en confidence samenvatten.
  - Candidates noemen die beter genegeerd of samengevoegd kunnen worden.
  - Mogelijke setups en "do nothing"-waarschuwingen samenvatten.
  - Open paper trades om te monitoren tonen.
- Belangrijkste edge cases:
  - Dag met veel ruis en weinig edge.
  - Geen nieuwe events, wel open trades.
  - Gemini-research niet beschikbaar.

### 12. AI Analysis Log
- Omschrijving: log van analyses, inputs, prompts, outputs, status en bruikbaarheid.
- Kernscenario's:
  - Analysegeschiedenis bekijken.
  - Input/output per analyse openen.
  - Discovery promptversies, source payload references en ranking-inputs terugzien.
  - Analyse opnieuw draaien.
  - Bruikbaarheid of foutstatus markeren.
- Belangrijkste edge cases:
  - AI-output is onbruikbaar.
  - Providerfout of timeout.
  - Promptversie verandert later.

## Datamodel (ASCII ERD)

```text
[User]
  | 1
  | owns
  v
[DiscoveryRun] --< [EventCandidate] >-- [EventSource]
      |                  |
      |                  | accepted
      |                  v
[Asset] --< [EventAsset] >-- [MarketEvent]
   |                              |
   |                              | 1
   |                              v
   |                         [EventAnalysis]
   |                              |
   |                              | 1..n
   |                              v
   +------------------------< [TradeSetup]
                                  |
                                  | 1
                                  v
                             [RiskReview]
                                  |
                                  | 0..1
                                  v
                             [PaperTrade]
                                  |
                                  | 0..n
                                  v
                             [TradeEvaluation]

[MarketEvent] --< [AIAnalysisLog]
[EventCandidate] --< [AIAnalysisLog]
[TradeSetup]  --< [AIAnalysisLog]
[RiskReview]  --< [AIAnalysisLog]
[PaperTrade]  --< [PerformanceMetric]  (afgeleid / view)
```

## Belangrijkste entiteiten

| Entiteit | Doel |
|---|---|
| `discovery_runs` | Dagelijkse of handmatige brede scans met status, provider, timing, brondekking en foutmeldingen |
| `event_sources` | Bronnen/feed-items/URLs, timestamps en raw payload references waar discovery candidates uit komen |
| `event_candidates` | Door AI gevonden en gerankte events voordat Robin ze accepteert, negeert, samenvoegt of analyseert; bevat o.a. reason_to_watch, relevance_score, confidence_score, source_quality_score, recency_score, dedupe_key, merge_hint, candidate_status en ignore_reason |
| `assets` | Voorkeuren, holdings en context-assets; geen harde discovery scope |
| `market_events` | Geaccepteerde formele events en perception events |
| `event_assets` | Koppelt events aan een of meerdere assets, sectoren of ETF's |
| `event_analyses` | AI-analyse van eventimpact |
| `trade_setups` | Long, short of no-trade hypotheses |
| `risk_reviews` | Kritische review per setup |
| `paper_trades` | Fictieve trades vanuit setups |
| `trade_evaluations` | Sluitreden, resultaat en hypothese-evaluatie |
| `ai_analysis_logs` | Prompt, input, output, provider, status en bruikbaarheid |
| `daily_briefings` | Dagelijkse samenvattingen |

## Discovery Candidate Quality MVP

De eerste bouwslice richt zich op betrouwbare candidate triage, niet op geavanceerde backtesting of broker-executie.

### Minimale candidate-card

Elke top 10 candidate toont:

- titel en korte samenvatting;
- affected symbols, sectoren, ETF's of marktregimes;
- reason_to_watch;
- source_name, source_url en detected_at;
- relevance_score;
- confidence_score;
- source_quality_score;
- recency_score;
- dedupe/merge hint;
- candidate_status;
- acties: accept, ignore, merge, analyze.

### Rankingregels

- Brede marktimpact weegt zwaarder dan watchlist-hit.
- Watchlist/asset preferences verhogen relevantie, maar sluiten andere markten niet uit.
- Recente primaire bronnen wegen hoger dan oude of herhaalde headlines.
- Duplicate headlines worden samengevoegd of krijgen merge_hint.
- Kandidaten met zwak bronbewijs mogen in de lijst staan, maar moeten zichtbaar als onzeker gemarkeerd zijn.
- `ignore` is een waardevolle uitkomst en wordt met reden opgeslagen.

### Bronfunnel voor MVP

De eerste werkende discovery hoeft niet alle mogelijke bronnen perfect te dekken, maar moet wel de bronlagen correct modelleren:

```text
Broad news/search
  -> financial news/sentiment feed
  -> primary sources and calendars
  -> market context
  -> normalized source items
  -> deduped candidate events
  -> ranked top 10 for analysis
```

MVP-startpunt:
- brede nieuws/search via GDELT of NewsAPI-achtige provider;
- financiele feed via Alpha Vantage News/Sentiment of vergelijkbaar;
- primaire broncheck via SEC EDGAR, company IR/press releases en macro/earnings calendars waar beschikbaar;
- market context via delayed quotes, movers en sector/ETF-context;
- optionele scan hints voor onderwerp, ticker of vraag als tijdelijke ranking/query-context;
- geen candidate zonder bronreferentie, publicatietijd, reason_to_watch en onzekerheidsnotitie.

## Kernflows (ASCII)

### MVP hoofdflow

```text
Login
  -> Dashboard
  -> Daily source funnel: broad news/search + financial feed + primary sources + market context
  -> Source quality / recency / dedupe / market-impact ranking
  -> Top 10 candidate events bekijken
  -> Candidate accepteren / negeren / samenvoegen
  -> Market event ontstaat uit accepted candidate
  -> Event analysis draaien
  -> Setup genereren
  -> Risk review draaien
  -> Paper trade aanmaken
  -> Paper trade sluiten
  -> Performance Lab leert van resultaat
```

### Perception event flow

```text
Product/public/news event
  -> Discovery vindt narratief of sentimentverschuiving
  -> Candidate krijgt perception score + bronbewijs
  -> Accepted candidate wordt perception event
  -> Gemini research naar markt/mediareactie
  -> OpenAI analyse: fundamenteel vs sentiment vs koersimpact
  -> Setups & Risk: sentiment short / rebound / no trade
  -> Risk review: chasing, overreaction, priced-in
  -> Paper trade of watch only
```

### Daily briefing flow

```text
Brede news/search scan + financiele feed + primaire bronnen + market context
  -> Gemini/Search enrichment waar nodig
  -> Source quality, recency, dedupe en concrete-event check
  -> OpenAI/Gemini ranking en briefing generation
  -> Top 10 impact candidates
  -> Dashboard summary
  -> User kiest focus events
```

## Tech-stack op hoofdlijnen

| Laag | Keuze | Onderbouwing |
|---|---|---|
| Frontend | Next.js App Router + React + TypeScript | Past bij template en snelle interactieve dashboardbouw |
| Styling | Tailwind / shadcn-compatible componenten | Compacte darkmode UI met herbruikbare primitives |
| Backend / API | Next.js route handlers / server actions | Server-side AI-calls en Supabase access blijven beheersbaar |
| Database | Supabase Postgres | Relationeel datamodel, RLS, auth-integratie |
| Auth | Supabase Auth | Single-user login nu, uitbreidbaar later |
| Hosting | Vercel | Standaard voor Next.js en New Default-stack |
| Event discovery | Discovery source funnel + Candidate Quality Layer | Brede news/search, financiele feeds, primaire bronnen en market context normaliseren, dedupliceren en ranken zonder handmatige invoer of watchlist-beperking |
| AI-analyse | OpenAI | Event analysis, setup generation, risk review en briefings |
| Webresearch | Gemini | Actuele marktcontext, bronverrijking en research rond candidate events |
| Market data | Te kiezen delayed market-data API | Koersreactie en movers gebruiken als discovery-signaal |
| Testing | Playwright | Golden-path checks voor dashboard, events, setup en paper trade flow |

## Architectuur (ASCII)

```text
[Browser]
   |
   v
[Next.js App Router]
   |              \
   |               \ server-side calls
   v                v
[Supabase Auth]   [API / Server Actions]
   |                |        |
   |                |        +--> [OpenAI: analysis/setup/risk/briefing]
   |                |        |
   |                |        +--> [Gemini: discovery research/search context]
   |                |        |
   |                |        +--> [Discovery source funnel]
   |                |        |      |-- broad news/search
   |                |        |      |-- financial news/sentiment
   |                |        |      |-- primary sources/calendars
   |                |        |
   |                |        +--> [Market data provider: movers/context]
   v                v
[Supabase Postgres + RLS]
   |
   v
[Dashboard / Performance views]
```

## Niet-functionele eisen

- **Performance:** dashboard moet snel laden met compacte queries en afgeleide metrics waar nodig.
- **Security / compliance:** Supabase RLS aan, service-role keys server-only, AI/API keys nooit naar client.
- **Financiele veiligheid:** UI gebruikt consequent "hypothese", "paper trade", "no clear edge" en "geen financieel advies" waar relevant.
- **Schaalbaarheid:** MVP single-user, maar datamodel krijgt `user_id` zodat multi-user later mogelijk blijft.
- **Beschikbaarheid:** geen harde realtime-eis, maar de ochtendbriefing moet zonder handmatige event-invoer kunnen starten. Als discovery faalt, toont de app providerstatus, laatste scanmoment, foutmelding en laatst bekende candidates; handmatige correctie blijft mogelijk.
- **Auditability:** AI-inputs, source payload references, ranking-inputs en outputs worden gelogd zodat discovery en analyses later verklaarbaar en vergelijkbaar zijn.

## Integraties

- **Supabase:** auth, Postgres, RLS.
- **OpenAI:** event analysis, setup generation, risk review, daily briefing.
- **Gemini:** websearch/research context voor actuele marktinformatie en candidate enrichment.
- **News/search/discovery provider:** brede news/search-laag voor actuele nieuwsitems buiten de watchlist.
- **Financiele nieuwsfeed:** Alpha Vantage News/Sentiment als startoptie; Benzinga/Finnhub later als kwaliteit/budget dat vraagt.
- **Primaire bronnen:** SEC EDGAR, company IR/press releases, earnings calendars en macrobronnen zoals FRED/officiele release calendars.
- **Market data provider:** open keuze voor delayed koersen, movers en ETF/sector-context.

## Fasering

### MVP
- Supabase Auth en app shell.
- Dashboard met kernmetrics.
- Discovery Candidate Quality MVP:
  - `discovery_runs`, `event_sources` en `event_candidates`;
  - mock/provider-ready source funnel met brede news/search, financiele feed, primaire broncheck en market context;
  - optionele scan hint op Dashboard als context voor query-expansion en ranking boost;
  - top 10 candidate events op Dashboard;
  - source quality, recency, dedupe hints en reason_to_watch zichtbaar;
  - providerstatus en laatste scanmoment zichtbaar.
- Candidate triage: accepteren, negeren, samenvoegen, analyseren.
- Watchlist/asset preferences als context, niet als harde discovery scope.
- Scan hints als tijdelijke run-context, niet als harde discovery scope.
- Market Events vanuit accepted candidates met asset/sector/ETF-koppeling.
- Perception events als eventtype.
- Event Analysis via OpenAI.
- Setups & Risk met long/short/no-trade setup en verplichte risk review.
- Paper trade aanmaken en handmatig sluiten.
- Performance Lab met basisstatistieken.
- AI Analysis Log basis.

### Fase 2
- Daily Briefing uitgebreid met trendvergelijking en bronkwaliteit.
- Gemini research-workflow voor candidate enrichment.
- Event Intelligence Score met score breakdown op candidate en accepted event.
- Scenario Library voor LevelFields-achtig scenario-denken.
- Betere promptversies en analyseherhaling.
- Performance per eventtype, strategie en confidence band.
- Extra discovery-bronnen, sector/macro tagging en betere deduplicatie.

### Later / nice-to-have
- Alerts.
- Uitgebreide backtesting.
- Historical Reaction Lab met D1/D3/D5 returns en scenario-aggregatie.
- Trade Ideas-achtige setup playbooks en personal edge metrics.
- Geavanceerde grafieken.
- Multi-user SaaS-ready inrichting.
- Brokerkoppeling alleen als expliciet later gekozen, niet voor MVP.

## Open punten

- Welke market-data provider gebruiken we voor delayed VS/EU/ETF-data?
- Welke concrete startprovider kiezen we eerst: GDELT, NewsAPI, Alpha Vantage of een gemengde adapter?
- Welke betaalde/professionelere feed komt later in aanmerking: Benzinga, Finnhub of iets anders?
- Welke broncategorieen mogen in MVP gebruikt worden: nieuws-API's, RSS, filings, earnings calendars, macro calendars, company IR en social/perception signals?
- Hoe streng moet bronkwaliteit meewegen in de top 10 ranking?
- Welke minimale score of bronkwaliteit is nodig voordat een candidate in de top 10 mag staan?
- Welke dedupe_key/merge_hint aanpak gebruiken we voor dubbele headlines en herhaalde bronitems?
- Welke ignore_reasons willen we standaardiseren zodat genegeerde candidates later leerdata worden?
- Welke velden zijn verplicht bij het sluiten van een paper trade?
- Hoe prominent moet de juridische disclaimer in de UI worden?
- Krijgt Edge Terminal een eigen productlogo naast NewDefault als afzender?
- Welke promptversies en modelnamen worden definitief voor OpenAI en Gemini gebruikt?
- Komt Event Intelligence Score direct na candidate quality of pas wanneer Scenario Library is toegevoegd?
- Moet `daily_briefings` in MVP al persistent opgeslagen worden of eerst gegenereerd op basis van actuele data?
- Hoe meten we de waarde van een no-trade beslissing?

## Verwerkte short-functional antwoorden

- Software in een zin: persoonlijke event-driven trading research cockpit.
- Probleem: relevante markt-events moeten nu handmatig gevonden worden en komen daardoor te laat of versnipperd binnen.
- Succescriterium: Robin krijgt dagelijks automatisch een uitlegbare top 10 van breed gevonden candidate events met bronkwaliteit, recency, dedupe hints en reason_to_watch, kan die triageren/analyseren, setups beoordelen, paper trades volgen en achteraf leren welke hypotheses waarde hadden.
- Rollen: single-user owner/researcher plus server-side AI-flows.
- Belangrijkste flow: source funnel -> candidate quality ranking -> candidate triage -> accepted market event -> analysis -> setup -> risk review -> paper trade -> resultaat -> leren.
- Eerste marktscope: breed nieuws over aandelen, sectoren, ETF's, macro en perception events; watchlist is voorkeur/context, geen zoekgrens.
- Integraties: OpenAI voor analyses, Gemini voor research/enrichment, Supabase voor auth/database, broad news/search, financiele nieuwsfeed, primaire bronnen en market-data context.
- UI: web-only, darkmode, terminal-achtige cockpit, subtiele NewDefault co-branding.
