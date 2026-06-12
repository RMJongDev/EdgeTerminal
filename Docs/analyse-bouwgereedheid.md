# Analyse - Plan en bouwgereedheid Edge Terminal

> Status: verwerkt - de herijking uit dit document is op 2026-06-12 doorgevoerd in specs, briefing en backlog (zie EPIC-10 in `Docs/backlog.md`). Dit document blijft als onderbouwing.
> Datum: 2026-06-12.
> Doel: beoordelen wat er bruikbaar is in de huidige projectstart, wat herschreven moet worden, en wanneer de bouw moet starten.
> Basis: ProjectOmschrijving.txt, voorstel-specs, functioneel/technisch ontwerp, backlog, implementatielog, de codebase en het interview van 2026-06-12.

## 1. Wat Edge Terminal moet zijn (vastgesteld 2026-06-12)

Edge Terminal is een **persoonlijke adviesmachine**. De pipeline verzamelt dagelijks zelfstandig nieuws, analyseert impact en levert **expliciete koop/verkoop-adviezen** - met ticker, richting, entry, stop en target - waar Robin echt geld op inzet. Robin start de scan, de pipeline doet al het werk, en het dashboard toont een gerangschikte top 5: beste advies bovenaan. Robin leest, beslist en handelt zelf bij zijn broker.

Vastgelegde uitgangspunten uit het interview:

| Onderwerp | Besluit |
|---|---|
| Product | Expliciet tradingadvies, geen researchtool met vrijblijvende hypotheses. |
| Werkverdeling | De pipeline doet zelf het volledige werk: verzamelen, dedupen, analyseren, risico's afwegen, ranken. Geen verplichte handmatige tussenstappen. |
| Horizon | Posities van dagen tot ~2 weken: swing trading op nieuws, geen intraday. |
| Ritme | Twee briefings per dag: 07:30 (voor EU-opening) en 15:00 NL-tijd (voor US-opening). |
| Volume | Streven ~6 adviezen per week (plafond, geen quota - zie 5.6). |
| Markten | US-aandelen + Europa, small en large caps, long en short. |
| Broker | Nu eToro; staat open voor alternatief (zie 5.6). |
| Inzet | EUR 100-1000 per trade. |
| Budget | EUR 150/maand voor data-API's en AI samen. |
| Traceerbaarheid | Pragmatisch: bron-URL erbij is genoeg, Robin googelt zelf na bij twijfel. |
| Validatie | Robin beslist zelf op basis van het advies en de argumentatie; geen formele gate vooraf. |
| Scan starten | Handmatig vanaf het dashboard is oke voor het MVP; daarna draait alles vanzelf. |

Deze uitgangspunten zijn vanaf nu de bron van waarheid. Waar bestaande documenten hiervan afwijken, wijken de documenten.

## 2. Waar het project werkelijk staat: er is nog niets

Het eerlijke vertrekpunt: **er staat nog geen werkend product.** Geverifieerd in de code en configuratie:

- geen Supabase-project, geen Vercel-deployment, geen enkele API-key ingevuld;
- geen nieuwsbron, geen marktdata-provider en geen echte AI-call aangesloten - `src/lib/edge-terminal` bevat uitsluitend mock- en demodata, ook de "AI-analyses" zijn hardcoded placeholders;
- de SQL-migraties bestaan als bestanden maar draaien nergens;
- de app toont schermen met verzonnen voorbeelddata.

Het backlog staat volledig op "done", maar dat is misleidend: het beschrijft de afronding van een **demo-skelet**, niet van het product. Van het eigenlijke product - een pipeline die op echte data echte adviezen produceert - bestaat 0%.

Wat er wel ligt is voorwerk: documentatie, mockups, een datamodel-ontwerp, een klikbare demo-UI en een hoop doordachte ontwerpkeuzes. Dat voorwerk heeft waarde (zie 3), maar het mag niet verward worden met voortgang op het product zelf.

## 3. Wat er goed zit in het voorwerk

1. **De juiste probleemfocus.** De specs benoemen dat de kern van dit product het dagelijks vinden, ontdubbelen en ranken van het juiste nieuws is - niet de UI of de analyse-tekst. Dat klopt, en daar is een serieuze source funnel voor ontworpen: breed nieuws -> financiele feeds -> primaire bronnen (SEC EDGAR, IR, macro) -> marktcontext -> kwaliteits- en rankinglaag.
2. **Het datamodel-ontwerp is grotendeels herbruikbaar.** Discovery runs, bronnen met provenance, candidates met score-breakdown, events, analyses, setups, risk reviews, uitkomsten en een AI-auditlog - de structuur past ook bij een adviesmachine, met de aanpassingen uit 4.3.
3. **Kwaliteitsprincipes die het advies beter maken.** Verplicht tegenargument bij elk advies, invalidatiecriteria, confidence-score, "geen advies vandaag" als geldige uitkomst, en logging van alle AI-inputs/outputs zodat promptversies vergelijkbaar zijn. Deze principes blijven - niet om het advies af te zwakken, maar omdat ze de kwaliteit en leerbaarheid van expliciete adviezen verhogen.
4. **Vervangbaar ontworpen providerlaag.** De adapter-opzet maakt het wisselen of stapelen van nieuws-/databronnen later goedkoop. Precies wat nodig is bij een budget van EUR 150/maand en gratis tiers als startpunt.
5. **Onderzoeksbasis en procesdiscipline.** LevelFields/Trade Ideas-lessen zijn verwerkt; backlog, log en specs zijn consequent bijgehouden. De demo-UI is bruikbaar als visuele referentie voor de echte schermen.

## 4. Wat herschreven of nieuw ontworpen moet worden

### 4.1 De docs beschrijven het verkeerde product

ProjectOmschrijving.txt en alle specs beschrijven een researchtool die uitdrukkelijk *geen* advies geeft: alles is "hypothese", de tone-of-voice verbiedt zelfs advies-taal ("vermijd: must buy"), en paper trading is het eindpunt van de flow. Dat is niet het product dat Robin wil. Het product geeft expliciet advies: *"Short Ferrari, entry rond X, stop boven Y, target Z, horizon 1-2 weken - want..."*

Dit is geen nuance maar een herpositionering die door alle documenten heen loopt: doelstelling, flows, schermteksten, succesdefinitie. De specs moeten integraal herijkt worden voordat er gebouwd wordt, anders stuurt elke bouwsessie op het verkeerde doel.

Wat uit de oude framing behouden blijft (als kwaliteitseis aan het advies, niet als vervanging ervan): elk advies draagt zijn redenatie, tegenargument, invalidatie en confidence. Een adviesmachine zonder tegenargumenten wordt een ja-knikker; dat is het bestaande ontwerp terecht niet.

### 4.2 De flow is triage-first ontworpen; het doel is een autonome pipeline

De huidige flow vraagt per kandidaat handmatige stappen: accepteren -> analyse starten -> setup genereren -> risk review starten -> paper trade aanmaken. Dat zijn 5+ kliks per advies bij 10 kandidaten per scan - precies het werk dat de pipeline zelf moet doen.

Doelflow:

```text
Robin start de scan (enige handeling)
  -> source funnel: nieuws + filings + macro + marktcontext ophalen
  -> normaliseren, dedupen, voor-ranken
  -> automatisch per kansrijke kandidaat: analyse -> setup -> risk review
  -> automatisch ranken op kwaliteit en uitvoerbaarheid
  -> dashboard toont top 5 expliciete adviezen, beste eerst
  -> Robin beslist en handelt zelf bij de broker
  -> pipeline volgt elk advies automatisch (koers vs. entry/stop/target)
  -> Performance Lab toont welke adviestypen geld opleveren
```

De ontworpen bouwstenen (analyse, setup, risk review, tracking) blijven bestaan, maar als **stappen in een keten die zelf doorloopt**, niet als schermen die op een klik wachten. Handmatig ingrijpen (advies verwerpen, kandidaat negeren) blijft mogelijk als correctie achteraf, nooit als verplichte poort. Het dashboard verandert van kandidatenlijst in advieslijst.

### 4.3 Het adviesformat bestaat nog niet

Het eindproduct van de pipeline moet als entiteit gedefinieerd worden. Minimaal per advies:

- ticker + richting (long/short);
- entry-zone, stop-loss, target;
- horizon (dagen tot 2 weken);
- positiegrootte-indicatie binnen EUR 100-1000;
- confidence en rank binnen de top 5;
- redenatie (welk nieuws, waarom nu, wat is nog niet ingeprijsd);
- tegenargument en invalidatie ("advies vervalt als...");
- bronverwijzingen;
- uitvoerbaarheid: spread, liquiditeit en kosten meegewogen - bij posities van EUR 100-1000 maken die het verschil tussen netto winst en verlies.

Veel velden bestaan verspreid over het setup- en risk-review-ontwerp; wat ontbreekt is de bundeling tot een advies-entiteit met rank, plus de koppeling aan automatische uitkomstmeting (4.5).

### 4.4 Twee dagelijkse runs met verschillende profielen

De specs kennen een (1) "daily scan". Het doel zijn twee runs met elk een eigen universum:

- **07:30 EU-run:** EU-opening; overnight US, Azie en Europese ochtendberichten; EU-tickers zwaarder gewogen.
- **15:00 US-run:** US-opening; premarket movers, US-bedrijfsnieuws, macro-releases van die dag.

Run-profielen verschillen in bronquery's, tijdvensters en rankingcontext. Klein ontwerppunt (`discovery_runs` bestaat al als concept, een profielveld erbij), wel voor de bouw vastleggen.

### 4.5 Automatische uitkomstmeting in plaats van handmatige paper trades

In het oude ontwerp sluit Robin paper trades handmatig en voert resultaten zelf in. Voor een adviesmachine is dat omgedraaid: **elk uitgebracht advies wordt automatisch gevolgd** met delayed koersdata - uitkomst na D1/D3/D5, stop geraakt, target geraakt - zonder dat Robin iets doet. Of Robin de trade echt neemt of niet: het track record bouwt zichzelf op.

Dit is belangrijker dan het lijkt. Robin beslist op gevoel plus argumentatie; zonder automatische uitkomstdata kalibreert dat gevoel nooit en valt er niets te leren over welke adviestypen werken. Dit stond als "Historical Reaction Lab" in *later/nice-to-have*, maar hoort direct na de eerste echte adviezen - het is de enige feedbackloop die er echt toe doet.

### 4.6 Provider- en budgetkeuze is nog niet gemaakt

De providerkeuze staat sinds 2026-06-02 open. Dat moet een keuze worden, geen verder onderzoek. Indicatieve verdeling van EUR 150/maand (actuele prijzen verifieren bij keuze):

| Laag | Startoptie | Indicatie |
|---|---|---|
| Financieel nieuws + sentiment | Finnhub of Alpha Vantage News & Sentiment (gratis tier eerst, betalen bij bewezen waarde) | EUR 0-50 |
| Breed nieuws | GDELT (gratis) + RSS van persbureaus en IR-pagina's (gratis) | EUR 0 |
| Primaire bronnen | SEC EDGAR (gratis), earnings calendar via feed-provider | EUR 0 |
| Marktdata delayed US+EU | EODHD of Twelve Data (EU-dekking is het selectiecriterium) | EUR 20-60 |
| LLM-calls | Goedkoop model voor filtering/voor-ranking, sterker model alleen voor de finale analyses | EUR 30-50 |

Twee runs per dag met ~50-100 bronitems filteren en ~10 diepe analyses past hierbinnen, mits de LLM-keten getrapt is: goedkoop filteren, duur analyseren.

**Caveat EU small caps:** nieuws- en datadekking voor Europese small caps is structureel zwakker dan voor US (taal, bronnen, API-dekking). Advies: start met US + EU large caps en voeg EU small caps later toe wanneer de pipeline bewezen werkt - anders jaag je het moeilijkste segment na voordat de kern staat.

## 5. Overige bevindingen

- **5.6 Broker en kostenrealisme.** Shorts en 1-2 weken aanhouden lopen bij eToro via CFD's met overnight/weekend-fees; samen met de spreads vreet dat aan posities van EUR 100-1000. Een broker met echte shorts, EU-beurzen en lage kosten (bijv. Interactive Brokers) past beter bij dit profiel. Buiten de scope van de app, maar bepalend voor of de adviezen netto iets opleveren - zelf verifieren.
- **6 adviezen per week is een plafond, geen quota.** Weken met 0-2 adviezen moeten normaal zijn; een pipeline die naar 6 toe vult, vult met ruis. "Vandaag geen advies" moet een volwaardige dashboard-uitkomst zijn.
- **Modelnamen verouderd.** `.env.example` noemt `gpt-4o-mini` en `gemini-1.5-flash`; bij de echte integratie actualiseren naar actuele modellen.
- **Cron direct na MVP.** Handmatig starten is gekozen voor het MVP, maar de 07:30-run wordt anders wekker-discipline. De voorbereide cron-route is de eerste verbetering daarna, zodat de adviezen klaarstaan als Robin opstaat.

## 6. Wanneer bouwen?

**Nu - na een korte herijking, geen nieuwe plan-ronde.** Er ligt genoeg (eerder te veel) documentatie; wat ontbreekt is bewijs dat de kern werkt. De vragen die ertoe doen - vindt de funnel dagelijks bruikbaar nieuws, zijn de analyses goed genoeg om geld aan toe te vertrouwen, past het in EUR 150/maand - zijn alleen bouwend te beantwoorden.

Herijking eerst (1-2 sessies):

1. Specs herschrijven naar adviesmachine met autonome pipeline (4.1 + 4.2).
2. Adviesformat vastleggen (4.3) en de twee run-profielen (4.4).
3. Providerstack kiezen binnen EUR 150/maand (4.6).
4. Backlog opnieuw opzetten vanaf het eerlijke nulpunt: de "done"-epics afvoeren naar archief of hernoemen tot "demo-skelet", en nieuwe epics op het echte product richten.

Daarna bouwen:

- **Slice 1 - tracer bullet (alles staat of valt hiermee):** Supabase + Vercel live; een echte nieuwsbron + EDGAR + delayed quotes aangesloten; echte LLM-keten (filteren -> analyseren -> ranken); end-to-end naar een top 5 expliciete adviezen op het dashboard. Hoe kaal ook - het doel is bewijzen dat de pipeline op echte data echte adviezen kan maken.
- **Slice 2:** tweede run-profiel (EU/US) en automatische uitkomstmeting per advies; Performance Lab op echte adviezen.
- **Slice 3:** kwaliteitsiteraties: dedupe, bronmix, promptversies vergelijken via de AI-log; cron zodat de runs vanzelf klaarstaan.

**Succescriterium slice 1:** vier weken dagelijks draaien. Per advies beoordeelt Robin "had ik hier wat aan gehad", en de automatische tracking toont wat de adviezen netto hadden opgeleverd. Dat is de validatie - niet meer documentatie.

## 7. Samenvattend oordeel

| Aspect | Oordeel |
|---|---|
| Werkelijke productvoortgang | 0% - er staat nog niets functioneels; alleen voorwerk en een demo-skelet |
| Voorwerk (datamodel, source funnel, principes, demo-UI) | Goed doordacht en grotendeels herbruikbaar voor de adviesmachine |
| Richting van de docs | Verkeerd product beschreven (researchtool i.p.v. adviesmachine); integraal herijken voor de bouw |
| Flow-ontwerp | Triage-first met te veel handwerk; ombouwen naar autonome pipeline die top 5 adviezen levert |
| Kernrisico (discovery- en advieskwaliteit op echte data) | Volledig onbewezen; alleen bouwend te beantwoorden |
| Budget/providers | Haalbaar binnen EUR 150/maand mits getrapte LLM-keten; keuze nu maken |
| Moment om te bouwen | Nu - direct na de herijking van punt 6, stap 1-4 |
