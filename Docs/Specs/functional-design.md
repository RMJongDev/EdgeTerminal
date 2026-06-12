# Functional Design - Edge Terminal

> Status: herijkt naar adviesmachine, bouwvoorbereiding voor slice 1.
> Laatst aangepast: 2026-06-12 - vervangt de triage-first researchtool-versie volledig.
> Technische details: `technical-design.md`. Procesvisualisatie: `process-pipeline.html`.

## Scope

Edge Terminal is een single-user webapp (Supabase Auth) met een autonome adviespipeline. Robin start een run; de pipeline verzamelt nieuws, analyseert en levert een gerangschikte top 5 expliciete tradingadviezen. Robin beslist en handelt zelf bij zijn broker. Elk advies wordt automatisch gevolgd zodat het Performance Lab leert welke adviestypen waarde hebben.

```text
Run starten -> source funnel -> dedupe -> LLM-filter -> per candidate: analyse/setup/risk
  -> advice assembly -> top 5 op dashboard -> Robin beslist -> automatische tracking -> leren
```

## Rollen

| Rol | Beschrijving |
|---|---|
| Owner / trader | Robin. Start runs, leest adviezen, beslist, handelt zelf bij de broker, markeert genomen adviezen. |
| Pipeline (AI worker) | Server-side keten die bronnen scant, candidates filtert, analyses/setups/risk reviews draait, adviezen bundelt en rankt, en uitkomsten trackt. |

## Globale regels

- De pipeline draait zelfstandig van run-start tot top 5; er zijn geen verplichte handmatige tussenstappen.
- Geen advies zonder concreet event met bronreferentie en publicatietijd.
- Geen advies zonder tegenargument en invalidatiecriterium.
- "Geen advies vandaag" is een volwaardige run-uitkomst; de pipeline vult nooit op naar vijf.
- Elk advies wordt automatisch getrackt, ook als Robin het niet neemt.
- De watchlist is rankingcontext, geen zoekgrens; brede markt- en macro-events blijven altijd vindbaar.
- Opvallende koersbewegingen triggeren een mover sweep: een gerichte nieuws-zoektocht per mover. Een beweging zonder gevonden bron blijft zichtbaar als "unexplained move" en wordt nooit een candidate.
- Perception events (sentiment, merkvertrouwen, publieke ontvangst) zijn volwaardige eventcategorie.
- Handmatig ingrijpen (advies verwerpen, candidate negeren/corrigeren) is een correctiepad achteraf, geen poort.
- Elke LLM-call wordt gelogd met promptversie, input, output en kosten.
- Het risicokader (`risk-framework.md`) werkt signalerend in de app: kostenhorde en correlatie wegen mee in de ranking, het dashboard toont risk-status en circuit-breaker meldingen; Robin voert zelf uit.
- Demo-data alleen als fallback wanneer Supabase-env ontbreekt.
- UI-copy, gegenereerde adviezen en briefings zijn Engels (terminal-stijl); documentatie blijft Nederlands.
- De app voert nooit zelf trades uit en deelt geen adviezen met derden.

## Run-profielen

| Profiel | Tijdstip | Universum |
|---|---|---|
| `eu_open` | 07:30 | Overnight US, Azie, Europese ochtendberichten; EU-tickers zwaarder gewogen |
| `us_open` | 15:00 NL | Premarket movers, US-bedrijfsnieuws, macro-releases van de dag |

MVP: Robin start beide runs handmatig vanaf het dashboard. Cron volgt in slice 3.

## Schermen

### Login

- Supabase Auth formulier; melding wanneer Supabase-env ontbreekt; single-user uitleg.

### App Shell

Navigatie:
- Dashboard (advieslijst);
- Event Radar (pipeline-inspectie);
- Watchlist;
- Tracking;
- Performance Lab;
- Briefing;
- AI Log;
- Process.

Zichtbaar: NewDefault-logo subtiel, environment status (live/demo), uitloggen.

### Dashboard - de advieslijst

Doel: in een oogopslag zien wat de pipeline adviseert en of de run gezond draaide.

Zichtbaar:
- knoppen `Start EU-run` en `Start US-run` (met runstatus: bezig, klaar, gefaald);
- top 5 adviezen van de laatste run, rank 1 bovenaan, per advies:
  - ticker, richting (long/short), confidence, rank;
  - entry-zone, stop, target, horizon;
  - een-regel-redenatie en het belangrijkste tegenargument;
  - bronlink(s) en uitvoerbaarheidsnotitie;
  - actie: openen (Advies Detail), verwerpen, "genomen" markeren;
- expliciete "geen advies vandaag"-staat met reden (te veel ruis, te weinig edge);
- runsamenvatting: aantal bronitems, candidates, geanalyseerd, kosten van de run;
- providerstatus en eventuele bronlaag-fouten;
- unexplained movers: flinke koersbewegingen waar de pipeline geen verklarend nieuws bij vond (context, geen advies);
- open getrackte posities (genomen adviezen eerst);
- performance snapshot;
- risk-status: open posities vs. maximum, drawdown op genomen trades en circuit-breaker status (vanaf slice 2);
- briefing-teaser.

Lege staat: uitleg dat er nog geen run gedraaid heeft of dat providerconfiguratie ontbreekt; laatst bekende adviezen blijven zichtbaar met duidelijke timestamp.

### Advies Detail

Doel: een advies in 1 minuut kunnen beoordelen, met de volledige redeneerketen eronder.

Zichtbaar:
- het volledige adviesformat (alle velden uit de specs);
- de keten eronder, uitklapbaar: event + bronnen -> analyse (bull/bear/onzekerheid) -> setup-logica -> risk review (tegenargument, thesis killer, risk score);
- uitvoerbaarheid: spread/liquiditeit/kosten-inschatting bij EUR 100-1000;
- trackingstatus van dit advies (D1/D3/D5, stop/target);
- kalibratie-context: historische tracking-resultaten van dit adviestype zodra genoeg data bestaat - bewust tegenwicht voor overtuigend geschreven redenaties;
- kostenhorde-verhouding (verwachte kosten vs. verwachte beweging) en bij shorts het gap/squeeze-risico;
- link naar AI-log entries van deze keten.

Acties:
- "genomen" markeren (met optionele eigen entry-prijs);
- verwerpen met reden (wordt leerdata);
- keten opnieuw draaien (her-analyse).

### Event Radar - inspectie en correctie

Doel: zien wat de pipeline vond en waarom, en corrigeren als hij het mis heeft. Geen verplichte werklijst.

Zichtbaar:
- candidates van de laatste runs met status (kansrijk/geanalyseerd/advies geworden/genegeerd/dedupe-cluster);
- per candidate: titel, samenvatting, reason_to_watch, scores (relevance, source quality, recency, confidence), dedupe-cluster, bronnen met URL en publicatietijd;
- welke candidates de LLM-filter passeerden en welke niet (met reden).

Acties:
- candidate negeren met reden (leerdata);
- dedupe-correctie (cluster splitsen/samenvoegen);
- candidate alsnog laten analyseren (pipeline draait de keten);
- asset/sector-koppeling corrigeren.

### Watchlist

Doel: voorkeuren en holdings beheren als rankingcontext.

Velden: ticker, naam, type (US equity, EU equity, ETF), sector, exchange, currency, country, priority, status, notes.

Acties: toevoegen, bewerken, inactief zetten, prioriteit markeren, filteren.

### Tracking

Doel: alle adviezen volgen, automatisch.

Zichtbaar:
- open adviezen (binnen horizon): huidige stand vs. entry, afstand tot stop/target;
- gesloten adviezen: uitkomst (target geraakt, stop geraakt, horizon verlopen), resultaat in %;
- D1/D3/D5-uitkomsten per advies;
- filter: alle adviezen vs. alleen genomen adviezen;
- vergelijking genomen vs. niet-genomen (had Robin de juiste eruit gepikt?).

Acties:
- "genomen"-markering aanpassen, eigen entry/exit invullen voor genomen trades;
- notitie toevoegen aan een uitkomst.

Tracking gebeurt met delayed quotes en wordt ververst bij elke run plus handmatige refresh; geen realtime-eis.

### Performance Lab

Doel: leren welke adviestypen netto geld opleveren.

Zichtbaar:
- totaal adviezen, open/gesloten, winrate, gemiddeld resultaat, beste/slechtste;
- performance per richting, eventtype, run-profiel (EU/US), confidence-band en markt;
- genomen vs. paper: doet Robins selectie het beter dan de top 5 als geheel?
- adviestypen gemarkeerd als kansrijk / gemengd / vermijden zodra genoeg data bestaat;
- kosten vs. opbrengst: wat kostte de pipeline deze maand, wat leverden de adviezen (paper en echt) op;
- expectancy na kosten per adviestype, met sample-size waarschuwing (onder ~30 waarnemingen: indicatief);
- opschaal-gates uit `risk-framework.md`: zichtbaar of ze gehaald zijn.

Lege staat: melding dat dit pas betekenis krijgt na enkele weken tracking.

### Briefing

Doel: compacte samenvatting per run, leesbaar in 2 minuten.

Zichtbaar:
- marktcontext van het moment;
- de adviezen van de run in een alinea, plus wat er bewust geen advies werd en waarom;
- risico's voor open posities;
- "vandaag niets doen"-conclusie wanneer van toepassing.

### AI Log

Doel: audit trail en kostenbewaking.

Velden: analysis_type, provider, model, prompt_version, input_payload, output_payload, source_payload_refs, token-/kosteninfo, status, usefulness_rating, error_message, created_at.

Acties: details openen, stap opnieuw draaien, bruikbaarheid markeren, kosten per run/maand bekijken.

### Process

Doel: het complete proces kunnen terugzien zoals gevisualiseerd in `process-pipeline.html`; verwijst per stap naar het bijbehorende scherm.

## MVP-acceptatie (slice 1)

- Robin logt in op een live Supabase-omgeving.
- Robin start een EU- of US-run; de pipeline draait end-to-end zonder verdere kliks.
- Het dashboard toont binnen enkele minuten een gerangschikte top 5 met echte bronnen, of een onderbouwde "geen advies vandaag".
- Elk advies toont entry/stop/target, redenatie, tegenargument, invalidatie en bronlinks.
- Elke LLM-stap is terug te vinden in het AI-log met promptversie en kosten.
- Bij een falende bronlaag draait de run door en is zichtbaar wat er miste.
- Demo-mode blijft werken zonder Supabase-env voor UI-review en tests.

Slice 2 voegt daar automatische tracking en het Performance Lab op echte adviezen aan toe; slice 3 cron en kwaliteitsiteraties (zie `voorstel-specs.md`).
