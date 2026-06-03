# Functional Design - Edge Terminal

> Status: bouwvoorbereiding. Dit document beschrijft wat de MVP functioneel moet doen. Technische details staan in `technical-design.md`.
> Laatst aangepast: 2026-06-03 - afgestemd op Discovery Candidate Quality MVP.

## Scope

De MVP levert een single-user webapp met Supabase Auth, demo/fallback-data zonder Supabase-project, en een AI-gestuurde event-driven researchcyclus. Edge Terminal zoekt breed naar relevante events; Robin hoeft niet zelf nieuws of events te verzamelen.

```text
Broad Market Discovery -> Candidate Quality Ranking -> Candidate Triage -> Accepted Market Event -> Analysis -> Setup -> Risk Review -> Paper Trade -> Result -> Learning
```

## Rollen

| Rol | Beschrijving |
|---|---|
| Owner / researcher | Robin. Beoordeelt candidate events, setups, risk reviews, paper trades en evaluaties. |
| AI worker | Server-side flow die breed nieuws/data scant, candidate events rankt, analyses, setups, risk reviews, briefings en research samenvattingen maakt. |

## Globale regels

- Geen setup zonder concreet event.
- Geen paper trade zonder setup.
- Geen setup zonder risk review voordat hij serieus genomen wordt.
- `no trade` is een volwaardige uitkomst.
- Event discovery is primair AI-gestuurd en breed; de watchlist is context/voorkeur, geen zoekgrens.
- Discovery gebruikt een bronfunnel; het taalmodel zoekt niet vrij op internet en mag geen candidate maken zonder bronbewijs.
- Robin mag optioneel een scan hint meegeven, zoals een onderwerp, ticker of vraag; dit stuurt ranking/query-expansion maar is geen verplicht veld en geen harde filter.
- De eerste product-slice is Discovery Candidate Quality: bronkwaliteit, recency, dedupe, confidence en reason_to_watch moeten zichtbaar zijn voordat Robin analyseert.
- Handmatig event toevoegen is fallback/correctie, niet de standaard ochtendworkflow.
- Candidate events worden pas formele market events na acceptatie; analyse mag ook eindigen in ignore, merge of no_trade.
- `ignore` en `merge` zijn waardevolle triage-uitkomsten en blijven leerdata.
- AI-uitkomsten zijn hypotheses, geen advies.
- Elke AI-call wordt gelogd in AI Analysis Log.
- Demo-data mag alleen als fallback wanneer Supabase-env ontbreekt.

## Discovery bronfunnel

Doel: dagelijks genoeg relevante nieuwsfeiten verzamelen om hypotheses te kunnen vormen, zonder dat Robin zelf het web hoeft af te struinen.

Functionele bronlagen:

1. Brede news/search: actuele marktgevoelige headlines en artikelen buiten Robin's watchlist.
2. Financiele nieuwsfeed: ticker-, sector-, sentiment- en topicgerichte marktitems.
3. Primaire bronnen: filings, company IR/press releases, earnings calendars en macro release calendars.
4. Market context: movers, delayed quotes, volume, sector/ETF-context en pre-market signalen.
5. Candidate Quality Layer: normalisatie, concrete-event check, dedupe, source quality, recency, market impact en top 10 ranking.

Regels:
- een candidate moet minimaal een bronreferentie, publicatietijd, reason_to_watch en onzekerheidsnotitie hebben;
- primaire bronnen wegen zwaarder dan herhaalde headlines;
- meerdere headlines over hetzelfde feit worden een cluster, niet meerdere top 10 regels;
- market movers zonder nieuwsfeit zijn context, geen zelfstandig event;
- watchlist/asset preferences verhogen relevantie, maar sluiten andere bronnen of markten niet uit;
- scan hints verhogen tijdelijk relevantie of voegen extra queries toe, maar macro-, sector- en onverwachte events blijven vindbaar.

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
- Setups & Risk;
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
- optionele scan context/hint input voor onderwerp, ticker of researchvraag;
- top 10 breed gevonden candidate events vandaag;
- bronfunnel-status: broad news/search, financiele feed, primaire bronnen en market context;
- discovery status, brondekking en laatste scanmoment;
- providerstatus en eventuele discovery errors;
- per candidate: reason_to_watch, source_quality_score, recency_score, confidence_score, dedupe/merge hint en candidate_status;
- perception movers;
- mogelijke setups;
- open paper trades;
- risk alerts;
- performance snapshot;
- daily briefing teaser.

Acties:
- discovery scan leeg starten/herhalen;
- discovery scan starten met optionele scan hint;
- candidate accepteren, negeren, samenvoegen, analyseren of openen;
- doorklikken naar event detail;
- setup review openen;
- paper trade openen.

Lege staat:
- uitleg dat discovery nog geen bruikbare candidates heeft gevonden of dat providerconfiguratie ontbreekt.

### Watchlist

Doel: assets, holdings en voorkeuren beheren. Deze lijst helpt ranking en context, maar beperkt discovery niet.

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
- asset als ranking-prioriteit markeren;
- filteren op type/status.

### Event Radar

Doel: AI-gevonden candidate events triagen, prioriteren en promoveren naar formele market events.

Velden:
- title;
- summary;
- source_category: broad_news, financial_feed, primary_source, macro_calendar, market_context, manual;
- provider_item_id;
- source URL/text en source_name;
- raw_payload_ref;
- detected_at;
- occurred_at of geschatte eventtijd;
- event_type_guess;
- impact_direction_guess;
- impact_level_guess;
- relevance_score;
- confidence_score;
- source_quality_score;
- recency_score;
- dedupe_key;
- merge_hint;
- score_breakdown;
- uncertainty_notes;
- affected_symbols;
- affected_markets;
- reason_to_watch;
- analysis_status;
- candidate_status: new, accepted, ignored, merged, analyzed.
- ignore_reason.

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
- brede discovery scan starten/herhalen;
- candidate accepteren als market event;
- candidate negeren;
- candidate samenvoegen met bestaand event;
- candidate analyseren zonder hem direct te accepteren;
- asset/sector/ETF-koppeling corrigeren;
- event analyseren;
- detail openen.

Lege staat:
- uitleg dat discovery provider of AI keys ontbreken, of dat de laatste scan geen relevante events vond.

### Event Detail

Doel: één event begrijpen.

Zichtbaar:
- eventinformatie;
- gekoppelde assets, sectoren, ETF's of marktregimes;
- discovery provenance: reason_to_watch, bronkwaliteit, recency, dedupe/merge hint en ruwe bronreferenties;
- Event Intelligence Score als latere verrijking bovenop candidate quality;
- Gemini research context;
- OpenAI event analysis;
- impact split voor perception events;
- gekoppelde setups.

Acties:
- analysis genereren/herhalen;
- setup genereren;
- no-trade markeren;
- AI-log openen.

### Setups & Risk

Doel: setup-hypotheses beoordelen en verplicht aanvallen voordat er een paper trade komt.

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

Velden risk review:
- key_risks;
- counterargument;
- reason_to_skip;
- thesis_killer;
- source_recency_dedupe_risk;
- risk_score;
- final_verdict: paper_trade_ok, wait, skip;

Risk-acties:
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
- performance per candidate_status en ignore/no_trade uitkomsten zodra genoeg data bestaat;
- strategieen: good, mixed, avoid.

Lege staat:
- melding dat performance pas betekenis krijgt na gesloten paper trades.

### Daily Briefing

Doel: dagelijkse samenvatting.

Zichtbaar:
- market context;
- top 10 candidate/accepted events;
- brondekking en discovery confidence;
- candidates die genegeerd of samengevoegd moeten worden;
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
- provider: openai/gemini/news_search/market_data/mock;
- model;
- prompt_version;
- discovery prompt version: event-discovery-v1, candidate-dedupe-v1, candidate-ranking-v1, source-quality-v1;
- input_payload;
- output_payload;
- source_payload_refs;
- score_inputs;
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
- De hoofdflow is zichtbaar en technisch voorbereid: source funnel -> candidate quality ranking -> candidate triage -> accepted event -> analysis -> setup -> risk -> paper trade -> performance.
- De discovery-flow is zichtbaar als bronfunnel: broad news/search -> financiele feed -> primaire bronnen -> market context -> dedupe/ranking -> top 10.
- Dashboard en Event Radar maken duidelijk dat Robin niet zelf events hoeft te verzamelen; AI-discovery en candidate quality zijn de primaire ingang.
- Mockups tonen per hoofdfunctie kort wat het doet, zodat de nieuwe workflow ook zonder toelichting begrijpelijk is.
- Alle schermen gebruiken terminal-styling en NewDefault co-branding subtiel.
