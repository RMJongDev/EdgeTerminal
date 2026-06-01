# Functional Design - Edge Terminal

> Status: bouwvoorbereiding. Dit document beschrijft wat de MVP functioneel moet doen. Technische details staan in `technical-design.md`.

## Scope

De MVP levert een single-user webapp met Supabase Auth, demo/fallback-data zonder Supabase-project, en de volledige researchcyclus:

```text
Watchlist -> Market Event -> Analysis -> Setup -> Risk Review -> Paper Trade -> Result -> Learning
```

## Rollen

| Rol | Beschrijving |
|---|---|
| Owner / researcher | Robin. Beheert watchlist, events, setups, risk reviews, paper trades en evaluaties. |
| AI worker | Server-side flow die analyses, setups, risk reviews, briefings en research samenvattingen maakt. |

## Globale regels

- Geen setup zonder concreet event.
- Geen paper trade zonder setup.
- Geen setup zonder risk review voordat hij serieus genomen wordt.
- `no trade` is een volwaardige uitkomst.
- AI-uitkomsten zijn hypotheses, geen advies.
- Elke AI-call wordt gelogd in AI Analysis Log.
- Demo-data mag alleen als fallback wanneer Supabase-env ontbreekt.

## Schermen

### Login

Doel: toegang tot de persoonlijke terminal.

Zichtbaar:
- productnaam Edge Terminal;
- Supabase Auth formulier;
- melding wanneer Supabase-env ontbreekt;
- uitleg dat MVP single-user is.

Acties:
- inloggen;
- account maken;
- terug naar home.

### Home

Doel: korte product-entry en route naar login/dashboard.

Zichtbaar:
- Edge Terminal propositie;
- NewDefault maker-signaal;
- Supabase/AI/market-data status;
- CTA naar dashboard/login.

### App Shell

Doel: vaste terminalnavigatie.

Navigatie:
- Dashboard;
- Watchlist;
- Event Radar;
- Signal Desk;
- Risk Review;
- Paper Trades;
- Performance Lab;
- Daily Briefing;
- AI Log.

Zichtbaar:
- NewDefault logo subtiel in sidebar/footer;
- environment status: live Supabase of demo mode;
- uitloggen.

### Dashboard

Doel: dagelijks startpunt.

Zichtbaar:
- relevante events vandaag;
- perception movers;
- mogelijke setups;
- open paper trades;
- risk alerts;
- performance snapshot;
- daily briefing teaser.

Acties:
- nieuw event maken;
- doorklikken naar event detail;
- setup review openen;
- paper trade openen.

Lege staat:
- uitleg dat Robin eerst een asset en event kan toevoegen.

### Watchlist

Doel: assets beheren.

Velden:
- ticker;
- naam;
- asset type: US equity, EU equity, ETF;
- sector;
- exchange/market;
- currency;
- country;
- priority;
- status active/inactive;
- notes.

Acties:
- asset toevoegen;
- asset bewerken;
- asset inactief zetten;
- filteren op type/status.

### Event Radar

Doel: market events vastleggen en prioriteren.

Velden:
- title;
- summary;
- source URL/text;
- occurred_at;
- event_type;
- impact_direction;
- impact_level;
- analysis_status;
- linked assets.

Eventtypes:
- earnings;
- guidance;
- analyst;
- M&A;
- product_launch;
- legal;
- macro;
- sector;
- competitor;
- perception;
- other.

Acties:
- event aanmaken;
- asset koppelen;
- event analyseren;
- detail openen.

### Event Detail

Doel: één event begrijpen.

Zichtbaar:
- eventinformatie;
- gekoppelde assets;
- Gemini research context;
- OpenAI event analysis;
- impact split voor perception events;
- gekoppelde setups.

Acties:
- analysis genereren/herhalen;
- setup genereren;
- no-trade markeren;
- AI-log openen.

### Signal Desk

Doel: setups beoordelen.

Velden setup:
- asset;
- direction: long, short, no_trade;
- strategy;
- entry_logic;
- invalidation;
- stop_loss;
- target;
- time_horizon;
- confidence_score;
- rationale;
- assumptions;
- status.

Acties:
- setup genereren vanuit event analysis;
- setup goedkeuren of afwijzen;
- risk review aanmaken;
- paper trade voorbereiden.

### Risk Review

Doel: setup aanvallen voordat er een paper trade komt.

Velden:
- key_risks;
- counterargument;
- reason_to_skip;
- risk_score;
- final_verdict: paper_trade_ok, wait, skip;

Acties:
- risk review genereren;
- verdict aanpassen;
- setup status bijwerken;
- paper trade aanmaken als verdict dat toelaat.

### Paper Trades

Doel: hypotheses meetbaar testen.

Velden:
- setup_id;
- asset_id;
- direction;
- entry_price;
- stop_loss;
- target_price;
- opened_at;
- closed_at;
- status;
- exit_price;
- result_percent;
- close_reason;
- notes;
- hypothesis_review.

Acties:
- paper trade maken vanuit setup;
- open trades bekijken;
- trade sluiten;
- resultaat en evaluatie opslaan.

### Performance Lab

Doel: leren welke hypotheses waarde hebben.

Zichtbaar:
- totaal open/closed trades;
- winrate;
- gemiddeld resultaat;
- beste/slechtste trade;
- performance per richting;
- performance per eventtype;
- performance per confidence band;
- strategieen: good, mixed, avoid.

Lege staat:
- melding dat performance pas betekenis krijgt na gesloten paper trades.

### Daily Briefing

Doel: dagelijkse samenvatting.

Zichtbaar:
- market context;
- key events;
- possible setups;
- risks;
- open paper trades to monitor;
- do-nothing warning;
- day conclusion.

Acties:
- briefing genereren;
- briefing bewaren;
- events/setups openen.

### AI Analysis Log

Doel: audit trail voor AI.

Velden:
- analysis_type;
- provider: openai/gemini/mock;
- model;
- prompt_version;
- input_payload;
- output_payload;
- status;
- usefulness_rating;
- error_message;
- created_at.

Acties:
- details openen;
- analyse opnieuw draaien;
- bruikbaarheid markeren.

## MVP acceptatie

- Robin kan zonder live Supabase-project de UI bekijken met demo-data.
- Zodra Supabase-env en migraties beschikbaar zijn, kan dezelfde app echte data gebruiken.
- De hoofdflow is zichtbaar en technisch voorbereid: event -> analysis -> setup -> risk -> paper trade -> performance.
- Alle schermen gebruiken terminal-styling en NewDefault co-branding subtiel.
