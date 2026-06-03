# Backlog - Edge Terminal

> Levend backlog-document met epics en user stories. Statussen zijn bijgewerkt op basis van deze bouwvoorbereiding.

## EPIC-01 - Styleguide en productbasis
**Doel:** Edge Terminal visueel en inhoudelijk scherp neerzetten voordat er verder gebouwd wordt.  
**Status:** done  
**Definition of done:** styleguide, mockups, projectcontext en voorstel-specs bestaan.

### STORY-01 - Styleguide vastleggen
- **Als** product owner, **wil ik** een visuele basis, **zodat** schermen consistent gebouwd worden.
- **Acceptatiecriteria:**
  - [x] Kleuren, typografie, badges, panels en table style vastgelegd.
  - [x] NewDefault co-branding subtiel beschreven.
- **Status:** done

### STORY-02 - Mockups akkoord
- **Als** product owner, **wil ik** de kernschermen zien, **zodat** de bouwrichting klopt.
- **Acceptatiecriteria:**
  - [x] Dashboard, Process, Event Radar, Event Detail, Setups & Risk, Paper Trades en Performance Lab in mockups.
  - [x] Review akkoord voor nu.
- **Status:** done

## EPIC-02 - Functioneel en technisch ontwerp
**Doel:** bouwkeuzes vastleggen zonder afhankelijk te zijn van een bestaand Vercel- of Supabase-project.  
**Status:** done

### STORY-03 - Functioneel ontwerp
- **Als** developer, **wil ik** per scherm weten wat zichtbaar en klikbaar is, **zodat** ik gericht kan bouwen.
- **Acceptatiecriteria:**
  - [x] Schermen, acties, velden en edge cases beschreven.
  - [x] MVP-regels zoals no trade en risk review vastgelegd.
- **Status:** done

### STORY-04 - Technisch ontwerp
- **Als** developer, **wil ik** routes, modules, env vars en data-aanpak kennen, **zodat** de implementatie voorspelbaar is.
- **Acceptatiecriteria:**
  - [x] Demo/live runtime modes beschreven.
  - [x] AI, Supabase en market-data aanpak vastgelegd.
- **Status:** done

## EPIC-03 - Supabase schema
**Doel:** het datamodel klaarzetten voor later Supabase-project.  
**Status:** done

### STORY-05 - Edge Terminal migratie
- **Als** developer, **wil ik** SQL-migraties voor alle MVP-tabellen, **zodat** Robin later Supabase kan aanmaken en direct kan draaien.
- **Acceptatiecriteria:**
  - [x] Assets, events, analyses, setups, risk reviews, paper trades, evaluations, AI logs en briefings bestaan.
  - [x] RLS policies per user-owned tabel.
  - [x] Updated-at triggers.
- **Status:** done

### STORY-06 - Seed/demo data
- **Als** reviewer, **wil ik** voorbeelddata, **zodat** de app zichtbaar werkt zonder echte marktdata.
- **Acceptatiecriteria:**
  - [x] Seed SQL verwijst naar demo-data voordat Supabase bestaat.
  - [x] Demo-data bevat RACE/ASML/SPY scenario en sluit aan op mockups.
- **Status:** done

## EPIC-04 - App shell en dashboards
**Doel:** de template-app ombouwen naar Edge Terminal.  
**Status:** done

### STORY-07 - App shell bouwen
- **Als** gebruiker, **wil ik** terminalnavigatie, **zodat** alle kernmodules bereikbaar zijn.
- **Acceptatiecriteria:**
  - [x] Sidebar/nav bevat alle MVP-schermen.
  - [x] NewDefault subtiel zichtbaar.
  - [x] Demo/live status zichtbaar.
- **Status:** done

### STORY-08 - Dashboard bouwen
- **Als** gebruiker, **wil ik** dagelijks focus zien, **zodat** ik weet welke events en trades aandacht vragen.
- **Acceptatiecriteria:**
  - [x] Start daily scan, top 10 candidates, source quality, discovery status, briefing en open risk zichtbaar.
- **Status:** done

## EPIC-05 - Discovery Candidate Quality MVP
**Doel:** Edge Terminal start handmatig een brede source funnel, maakt candidate events, toont een uitlegbare top 10 en laat Robin candidates triagen voordat ze market events worden.  
**Status:** done

### STORY-09 - Watchlist CRUD
- **Als** gebruiker, **wil ik** assets/holdings/voorkeuren beheren, **zodat** discovery-ranking context heeft zonder de marktdekking te beperken.
- **Acceptatiecriteria:**
  - [x] Asset toevoegen via server action in live Supabase mode.
  - [x] Assets tonen met demo/live datalaag.
  - [x] Active/inactive status zichtbaar.
- **Status:** done

### STORY-10A - Discovery datamodel
- **Als** developer, **wil ik** `discovery_runs`, `event_sources` en `event_candidates`, **zodat** source funnel, provenance, ranking en triage persistent kunnen worden.
- **Acceptatiecriteria:**
  - [x] Migratie bevat discovery-run, source en candidate tabellen met RLS.
  - [x] `discovery_runs` bewaart optionele `context_hints`.
  - [x] `event_sources` bewaart provider, source category, URL/timestamp en raw payload ref.
  - [x] `event_candidates` bewaart score breakdown, status, source refs en accepted-event link.
- **Status:** done

### STORY-10B - Start daily scan en scan hints
- **Als** gebruiker, **wil ik** een daily scan handmatig kunnen starten met optionele scan hint, **zodat** mijn gevoel kan meewegen zonder brede marktdekking te verliezen.
- **Acceptatiecriteria:**
  - [x] Dashboard bevat `Start daily scan`.
  - [x] Scan kan leeg starten.
  - [x] Optionele hint ondersteunt onderwerp, ticker of researchvraag.
  - [x] Hint is ranking/query-context, geen harde filter.
  - [x] Runstatus, providerstatus, laatste scanmoment en foutmeldingen zijn zichtbaar.
- **Status:** done

### STORY-10C - Mock source funnel en candidate scoring
- **Als** gebruiker, **wil ik** ook zonder echte provider een top 10 uit een source funnel zien, **zodat** de flow reviewbaar en testbaar is.
- **Acceptatiecriteria:**
  - [x] Deterministische mock source funnel bevat broad news/search, financiele feed, primaire bronnen en market context.
  - [x] Sources worden genormaliseerd naar candidate events.
  - [x] Dedupe voorkomt dubbele headlines in de top 10.
  - [x] Scoring bevat relevance, source quality, recency, dedupe confidence, market context, watchlist preference en scan hint fit.
  - [x] De app toont top 10 candidates met reason_to_watch, score, bron en mogelijke marktimpact.
- **Status:** done

### STORY-10D - Event Radar candidate triage
- **Als** gebruiker, **wil ik** candidates kunnen accepteren, negeren, samenvoegen of analyseren, **zodat** alleen relevante gebeurtenissen de analyseflow in gaan.
- **Acceptatiecriteria:**
  - [x] Candidates kunnen `new`, `accepted`, `ignored`, `merged` of `analyzed` zijn.
  - [x] Candidate accepteren maakt een formeel market event.
  - [x] Candidate negeren vereist of bewaart een ignore reason.
  - [x] Candidate samenvoegen bewaart merge hint/canonical reference.
  - [x] Analyze kan vanuit candidate naar event analysis flow.
- **Status:** done

### STORY-10E - Process A-Z reference
- **Als** gebruiker, **wil ik** het volledige proces kunnen terugvinden, **zodat** ik begrijp waar source funnel, triage, analyse, setup en performance zitten.
- **Acceptatiecriteria:**
  - [x] Mockup bevat Process A-Z overzicht en detailpagina's.
  - [x] App bevat route of scherm naar Process A-Z.
  - [x] Process verwijst naar Dashboard, Event Radar, Event Detail, Setups & Risk, Paper Trades, Performance Lab en AI Log.
- **Status:** done

## EPIC-06 - AI flow
**Doel:** discovery- en analyseflow technisch voorbereiden zonder live provider te vereisen.  
**Status:** done

### STORY-11 - OpenAI analyse placeholders
- **Als** gebruiker, **wil ik** analysis/setup/risk generation kunnen starten, **zodat** de flow klaar is voor echte OpenAI-calls.
- **Acceptatiecriteria:**
  - [x] Server-side AI module bestaat.
  - [x] Mock output wordt gelogd als provider keys ontbreken.
  - [x] OpenAI env vars gedocumenteerd.
- **Status:** done

### STORY-12 - Gemini/search discovery placeholders
- **Als** gebruiker, **wil ik** research en discovery context voorbereiden, **zodat** actuele websearch en brede event-ingestie later aangesloten kunnen worden.
- **Acceptatiecriteria:**
  - [x] Gemini env vars gedocumenteerd.
  - [x] Research output is voorbereid als AI-log type.
  - [x] Discovery provider env vars zijn gedocumenteerd.
  - [x] Promptversies voor candidate discovery en ranking zijn beschreven.
- **Status:** done

## EPIC-07 - Paper trading en Performance
**Doel:** hypotheses meetbaar maken.  
**Status:** done

### STORY-13 - Paper trades
- **Als** gebruiker, **wil ik** paper trades aanmaken en sluiten, **zodat** hypotheses meetbaar worden.
- **Acceptatiecriteria:**
  - [x] Open en closed trades zichtbaar.
  - [x] Sluitvelden aanwezig.
  - [x] Resultaatpercentage verwerkt in metrics.
- **Status:** done

### STORY-14 - Performance Lab
- **Als** gebruiker, **wil ik** leren welke setups werken, **zodat** mijn research beter wordt.
- **Acceptatiecriteria:**
  - [x] Winrate, gemiddeld resultaat en performance per richting zichtbaar.
  - [x] Eventtype/confidence inzichten zichtbaar.
- **Status:** done

## EPIC-08 - Tests
**Doel:** MVP-flow regressiebestendig maken.  
**Status:** done

### STORY-15 - Playwright smoke en golden path
- **Als** developer, **wil ik** e2e tests, **zodat** de cockpit niet ongemerkt breekt.
- **Acceptatiecriteria:**
  - [x] Home, login, dashboard en kernmodules getest.
  - [x] Tests werken zonder extern Supabase-project.
- **Status:** done
