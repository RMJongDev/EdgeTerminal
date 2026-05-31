# Voorstel-specs - Edge Terminal

> Status: fase 3 voorstel-specs.  
> Niveau: voldoende voor mockup-review en bouwrichting. Detailkeuzes worden uitgewerkt in `functional-design.md` en `technical-design.md`.

## Projectoverzicht

Edge Terminal is een persoonlijke trading research terminal voor event-driven research. De app helpt Robin om marktgebeurtenissen, sentiment, risico's, mogelijke setups en paper trades gestructureerd te beoordelen.

De eerste versie is geen tradingbot en geen signaaldienst. Elke mogelijke trade wordt behandeld als hypothese, met verplicht tegenargument en meetbare paper-trade uitkomst. Het doel is dagelijks sneller zien waar aandacht nodig is en achteraf leren welke signalen echt waarde hebben.

## Doelgroep & gebruikersrollen

| Rol | Wie | Rechten op hoofdlijn |
|---|---|---|
| Owner / researcher | Robin de Jong | Inloggen, assets/events/setups/trades beheren, analyses draaien, resultaten evalueren |
| System / AI worker | Server-side AI-flows | Analyses genereren, webresearch samenvatten, prompts/outputs loggen |

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
  - Zien hoeveel relevante events vandaag spelen.
  - Zien welke assets op de watchlist geraakt worden.
  - Zien welke setups of risk reviews aandacht vragen.
  - Snel doorklikken naar Event Detail of Signal Desk.
- Belangrijkste edge cases:
  - Geen events vandaag.
  - Wel events maar geen duidelijke edge.
  - Open paper trades zonder recente evaluatie.

### 3. Watchlist
- Omschrijving: beheer van VS-aandelen, EU-aandelen en ETF's die gevolgd worden.
- Kernscenario's:
  - Asset toevoegen met ticker, naam, type, markt, sector, valuta en status.
  - Asset bewerken of inactief zetten.
  - Zien welke assets recent door events geraakt zijn.
- Belangrijkste edge cases:
  - Dubbele ticker.
  - Asset zonder beschikbare koersdata.
  - Inactieve asset met historische events/trades.

### 4. Market Events
- Omschrijving: vastleggen van gebeurtenissen die invloed kunnen hebben op assets of sectoren.
- Kernscenario's:
  - Handmatig event aanmaken.
  - Event koppelen aan een of meerdere assets.
  - Event classificeren op type, impact, datum en status.
  - Event verrijken met Gemini-webresearch als dat nuttig is.
- Belangrijkste edge cases:
  - Event raakt meerdere assets.
  - Event is vooral perceptiegedreven.
  - Bron of koersreactie is onzeker.

### 5. Perception Events
- Omschrijving: speciale eventcategorie voor sentiment, merkvertrouwen, publieke ontvangst of narratief.
- Kernscenario's:
  - Slecht ontvangen productpresentatie vastleggen.
  - Koersreactie, mediareactie en publieke ontvangst meenemen.
  - Onderscheid maken tussen fundamentele impact en sentimentimpact.
- Belangrijkste edge cases:
  - Veel ruis, weinig fundamenteel bewijs.
  - Koersreactie lijkt overdreven.
  - Mogelijke short en rebound setup bestaan tegelijk.

### 6. Event Analysis
- Omschrijving: OpenAI-analyse van eventimpact, sentiment, tijdshorizon, onzekerheid en risico's.
- Kernscenario's:
  - Analyse draaien vanuit Event Detail.
  - Bull case, bear case en risico's tonen.
  - Impactniveau en confidence score vastleggen.
- Belangrijkste edge cases:
  - Analyse geeft "geen duidelijke edge".
  - Bronnen spreken elkaar tegen.
  - Analyse-output is onvolledig of fout.

### 7. Signal Desk
- Omschrijving: vertaalt event + analyse naar mogelijke long, short of no-trade hypothese.
- Kernscenario's:
  - Setup genereren vanuit een geanalyseerd event.
  - Richting, entry-logica, invalidatie, stop-loss, target en aannames vastleggen.
  - Setup goedkeuren, afwijzen of op watch zetten.
- Belangrijkste edge cases:
  - No trade is de beste uitkomst.
  - Setup heeft te weinig concrete entry-logica.
  - Meerdere setups uit hetzelfde event.

### 8. Risk Review
- Omschrijving: verplicht tegenargument voor elke setup om tunnelvisie te voorkomen.
- Kernscenario's:
  - Setup kritisch laten beoordelen.
  - Zwakke aannames en redenen om niet te traden tonen.
  - Eindoordeel: geschikt voor paper trade of beter overslaan.
- Belangrijkste edge cases:
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
- Omschrijving: compacte dagelijkse samenvatting van marktcontext, events, setups, risico's en open trades.
- Kernscenario's:
  - Belangrijkste events van de dag tonen.
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
[TradeSetup]  --< [AIAnalysisLog]
[RiskReview]  --< [AIAnalysisLog]
[PaperTrade]  --< [PerformanceMetric]  (afgeleid / view)
```

## Belangrijkste entiteiten

| Entiteit | Doel |
|---|---|
| `assets` | Watchlist met aandelen en ETF's |
| `market_events` | Formele events en perception events |
| `event_assets` | Koppelt events aan een of meerdere assets |
| `event_analyses` | AI-analyse van eventimpact |
| `trade_setups` | Long, short of no-trade hypotheses |
| `risk_reviews` | Kritische review per setup |
| `paper_trades` | Fictieve trades vanuit setups |
| `trade_evaluations` | Sluitreden, resultaat en hypothese-evaluatie |
| `ai_analysis_logs` | Prompt, input, output, provider, status en bruikbaarheid |
| `daily_briefings` | Dagelijkse samenvattingen |

## Kernflows (ASCII)

### MVP hoofdflow

```text
Login
  -> Dashboard
  -> Watchlist asset kiezen/toevoegen
  -> Market event aanmaken
  -> Asset(s) koppelen
  -> Event analysis draaien
  -> Setup genereren
  -> Risk review draaien
  -> Paper trade aanmaken
  -> Paper trade sluiten
  -> Performance Lab leert van resultaat
```

### Perception event flow

```text
Product/public event
  -> Perception event registreren
  -> Gemini research naar markt/mediareactie
  -> OpenAI analyse: fundamenteel vs sentiment vs koersimpact
  -> Signal Desk: sentiment short / rebound / no trade
  -> Risk Review: chasing, overreaction, priced-in
  -> Paper trade of watch only
```

### Daily briefing flow

```text
Watchlist + market events + open paper trades
  -> Gemini context waar nodig
  -> OpenAI briefing generation
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
| AI-analyse | OpenAI | Event analysis, setup generation, risk review en briefings |
| Webresearch | Gemini | Actuele marktcontext en websearch/research rond events |
| Market data | Te kiezen delayed market-data API + handmatige fallback | Eerst alleen als dit simpel en betaalbaar kan |
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
   |                |        +--> [Gemini: webresearch/search context]
   |                |        |
   |                |        +--> [Market data provider - optional MVP]
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
- **Beschikbaarheid:** geen harde realtime-eis. Als AI of Gemini tijdelijk faalt, moet handmatig vastleggen mogelijk blijven.
- **Auditability:** AI-inputs en outputs worden gelogd zodat analyses later verklaarbaar en vergelijkbaar zijn.

## Integraties

- **Supabase:** auth, Postgres, RLS.
- **OpenAI:** event analysis, setup generation, risk review, daily briefing.
- **Gemini:** websearch/research context voor actuele marktinformatie.
- **Market data provider:** open keuze voor delayed koersen voor VS-aandelen, EU-aandelen en ETF's.

## Fasering

### MVP
- Supabase Auth en app shell.
- Dashboard met kernmetrics.
- Watchlist CRUD.
- Market Events CRUD met asset-koppeling.
- Perception events als eventtype.
- Event Analysis via OpenAI.
- Signal Desk met long/short/no-trade setup.
- Risk Review verplicht voor setup.
- Paper trade aanmaken en handmatig sluiten.
- Performance Lab met basisstatistieken.
- AI Analysis Log basis.

### Fase 2
- Daily Briefing uitgebreid.
- Gemini research-workflow voor events.
- Betere promptversies en analyseherhaling.
- Performance per eventtype, strategie en confidence band.
- Delayed market data integratie als provider gekozen is.

### Later / nice-to-have
- Automatische event-detectie.
- Alerts.
- Uitgebreide backtesting.
- Geavanceerde grafieken.
- Multi-user SaaS-ready inrichting.
- Brokerkoppeling alleen als expliciet later gekozen, niet voor MVP.

## Open punten

- Welke market-data provider gebruiken we voor delayed VS/EU/ETF-data?
- Welke velden zijn verplicht bij het sluiten van een paper trade?
- Hoe prominent moet de juridische disclaimer in de UI worden?
- Krijgt Edge Terminal een eigen productlogo naast NewDefault als afzender?
- Welke promptversies en modelnamen worden definitief voor OpenAI en Gemini gebruikt?
- Moet `daily_briefings` in MVP al persistent opgeslagen worden of eerst gegenereerd op basis van actuele data?
- Hoe meten we de waarde van een no-trade beslissing?

## Verwerkte short-functional antwoorden

- Software in een zin: persoonlijke event-driven trading research cockpit.
- Probleem: research, signalen, risico's en resultaten staan nu niet in een meetbare cyclus.
- Succescriterium: Robin kan dagelijks events analyseren, setups beoordelen, paper trades volgen en achteraf leren welke hypotheses waarde hadden.
- Rollen: single-user owner/researcher plus server-side AI-flows.
- Belangrijkste flow: event -> analysis -> setup -> risk review -> paper trade -> resultaat -> leren.
- Eerste assetscope: VS-aandelen, EU-aandelen en ETF's.
- Integraties: OpenAI voor analyses, Gemini voor webresearch, Supabase voor auth/database, market-data provider nog open.
- UI: web-only, darkmode, terminal-achtige cockpit, subtiele NewDefault co-branding.
