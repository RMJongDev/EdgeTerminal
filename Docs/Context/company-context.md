# Company Context - Edge Terminal

> Disclaimer: dit document is samengesteld op basis van Robin's projectomschrijving en de interviews van 2026-05-31 en 2026-06-12. Intern product; er is geen externe markt-research gedaan.

## Kerngegevens
- **Naam:** Edge Terminal
- **Opgericht:** 2026
- **HQ / locaties:** Intern New Default-project, Hummelo
- **Aantal medewerkers (orde van grootte):** 1 product owner/developer in MVP-fase
- **Website:** (open)

## Wat doen ze?
- **Kernactiviteit:** Edge Terminal is Robins persoonlijke adviesmachine voor swing trading op nieuws: een autonome pipeline die twee keer per dag nieuws, filings en marktcontext verzamelt, analyseert en vertaalt naar een gerangschikte top 5 expliciete koop/verkoop-adviezen.
- **Producten / diensten:** Persoonlijke trading advice terminal voor eigen gebruik.
- **Verdienmodel:** n.v.t. - persoonlijk product, geen SaaS, geen advies aan derden.

## Productpositionering
Edge Terminal is geen tradingbot en geen signaaldienst voor derden. Het is een persoonlijke adviesmachine: de pipeline doet al het werk (verzamelen, dedupen, analyseren, risico's afwegen, ranken) en levert expliciete adviezen met ticker, richting, entry, stop, target en onderbouwing. Robin beslist en handelt zelf bij zijn broker.

De app:
- scant breed nieuws, filings, macro-items en koersbewegingen (incl. mover sweep voor onverwachte bewegingen);
- analyseert impact, sentiment en of de marktreactie over- of onderdreven is;
- genereert per kansrijke gebeurtenis automatisch analyse, setup en risk review;
- bundelt dat tot gerangschikte adviezen met verplicht tegenargument en invalidatie;
- trackt elk advies automatisch (D1/D3/D5, stop/target), ook niet-genomen adviezen;
- meet in het Performance Lab welke adviestypen netto geld opleveren;
- bewaakt het risicokader signalerend: kostenhorde, correlatie, circuit breaker.

## Kernflow

```text
Run (07:30 EU / 15:00 US)
  -> source funnel + mover sweep
  -> dedupe -> LLM-filter
  -> per candidate: analyse -> setup -> risk review
  -> top 5 expliciete adviezen (of "no advice today")
  -> Robin beslist en handelt zelf
  -> automatische tracking -> Performance Lab -> leren
```

## Markt & doelgroep
- **Doelgroep:** Robin als enige gebruiker. Single-user met Supabase Auth, zodat sessies en latere uitbreiding netjes geregeld zijn.
- **Marktpositie:** Persoonlijke adviesmachine tussen nieuwsplatformen, watchlists en professionele terminals in; vergelijkbaar denkkader: LevelFields AI, Trade Ideas.
- **Geografische focus:** Start US-aandelen + EU large caps, long en short; EU small caps later.

## Functionele domeinen
- **Dashboard:** run-start, runstatus, top 5 advieskaarten, risk-statusbalk, unexplained movers.
- **Advice Detail:** volledig advies met uitklapbare redeneerketen, kostenhorde en kalibratie-context.
- **Event Radar:** inspectie en correctie van wat de pipeline vond (geen verplichte triage).
- **Watchlist:** voorkeuren/holdings als rankingcontext, nooit een zoekgrens.
- **Tracking:** automatische uitkomsten per advies; genomen vs. paper.
- **Performance Lab:** expectancy na kosten per adviestype; opschaal-gates.
- **Briefing:** compacte samenvatting per run.
- **AI Log:** audit trail van elke LLM-stap met promptversie en kosten.

## Perception Events
Naast klassieke financiele events zijn narratief- en sentimentgedreven gebeurtenissen volwaardige input: slecht ontvangen productpresentaties, reputatieschade, social backlash, opvallende koersreacties na publieke events. De mover sweep garandeert dat zulke bewegingen gevonden worden, ook buiten de watchlist (het Ferrari-scenario). De analyse splitst fundamentele impact van sentimentimpact en beoordeelt overreactie vs. follow-through.

## Tone of voice & productprincipes
- Expliciet en concreet richting Robin: richting, entry zone, stop, target, horizon.
- Elk advies draagt verplicht zijn tegenargument en invalidatie - nooit alleen de bull case.
- "No advice today" is een volwaardige uitkomst; de lijst wordt nooit opgevuld.
- Geen advies zonder concreet event met bronreferentie.
- Kostenhorde: een advies dat alleen zonder kosten werkt, bestaat niet.
- Confidence is een rankinghulp, geen zekerheid; de tracking-data weegt zwaarder dan het verhaal.
- Snel scanbaar: badges, levels en compacte samenvattingen boven lange tekst.
- UI-copy Engels; documentatie Nederlands.

Vermijden: "Guaranteed winner", "Must buy", "Perfect setup", "Risk-free", "Easy money".
Gewenst: "Short RACE, entry 380-388, invalidated above 402 - because...", "No advice today", "High uncertainty", "Cost check passed", "Counterargument:".

## Technische context
- **Bestaande systemen:** Next.js / Supabase / Vercel app (demo-skelet, wordt omgebouwd volgens `Docs/backlog.md`).
- **Tech stack:** Next.js App Router, Supabase Auth/Postgres/RLS, Tailwind, TypeScript, Playwright, Vercel.
- **AI-aanpak:** OpenAI - goedkoop filtermodel + sterk analysemodel, structured outputs, alles gelogd met kosten (besluit 2026-06-12).
- **Databronnen:** Finnhub, SEC EDGAR, RSS (GlobeNewswire/EQS/Euronext), GDELT of Marketaux, Alpha Vantage movers, delayed quotes US+EU. Budget EUR 150/maand totaal.
- **Belangrijke randvoorwaarden:** alle keys server-only; RLS verplicht; adviezen zijn uitsluitend voor Robin en worden nooit gedeeld of gepubliceerd; de app voert nooit zelf trades uit.

## Bronnen
- `ProjectOmschrijving.txt` - oorspronkelijke ruwe projectomschrijving (deels achterhaald, gemarkeerd).
- Interview 2026-05-31 - eerste projectrichting.
- Interview 2026-06-12 - herijking naar adviesmachine; kernbesluiten in `Docs/Specs/voorstel-specs.md`.
- `Docs/analyse-bouwgereedheid.md` - onderbouwing van de koerswijziging.
