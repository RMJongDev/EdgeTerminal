# Client Briefing - Edge Terminal

> Status: herijkt op 2026-06-12 naar adviesmachine.
> Bron: `ProjectOmschrijving.txt` (2026-05-31, deels achterhaald) en interviews met Robin op 2026-05-31 en 2026-06-12.
> Onderbouwing koerswijziging: `Docs/analyse-bouwgereedheid.md`.

## Klant
- **Klantnaam:** Edge Terminal
- **Contactpersoon + rol:** Robin de Jong - initiatiefnemer, product owner en developer
- **Bestaande klant of nieuwe lead?** Eigen product / intern New Default-project

## Projectdoel

Edge Terminal is Robins persoonlijke **adviesmachine** voor swing trading op nieuws. Een autonome pipeline verzamelt twee keer per dag nieuws, filings, macro-items en marktcontext, analyseert koersimpact en levert een gerangschikte top 5 **expliciete koop/verkoop-adviezen** (ticker, richting, entry, stop, target, horizon, onderbouwing). Robin beslist zelf en handelt zelf bij zijn broker; elk advies wordt automatisch gevolgd zodat meetbaar wordt welke adviestypen waarde hebben.

De kernflow:

```text
Run (07:30 EU / 15:00 US)
  -> source funnel -> dedupe -> LLM-filter
  -> per candidate: analyse -> setup -> risk review
  -> top 5 expliciete adviezen (of "geen advies vandaag")
  -> Robin beslist en handelt zelf
  -> automatische tracking -> Performance Lab -> leren
```

## Scope & kaders
- **Horizon:** swing trades van dagen tot ~2 weken; geen intraday.
- **Markten:** US-aandelen + EU large caps, long en short; EU small caps later.
- **Inzet:** EUR 100-1000 per trade; adviesritme 2-3 echte trades per week (plafond 6), max 4-5 open posities.
- **Budget data/AI:** EUR 150 per maand.
- **Auth:** single-user met Supabase Auth.
- **Broker:** Robin handelt zelf (nu eToro; alternatief wordt los van de bouw bekeken). Geen brokerkoppeling.
- **Fasering:** slice 1 tracer bullet (pipeline end-to-end op echte data), slice 2 uitkomstmeting, slice 3 cron + kwaliteit. Zie `Docs/Specs/voorstel-specs.md`.

## Aanleiding
- **Probleem:** relevante markt-events handmatig vinden kost te veel tijd en komt te laat of versnipperd binnen; Robin wil dat een pipeline dit werk volledig overneemt en vertaalt naar concrete adviezen.
- **Waarom nu:** het voorwerk (datamodel, ontwerpen, demo-UI) ligt er; de richting is op 2026-06-12 definitief vastgelegd; bouwen is de enige manier om de kernvraag (advieskwaliteit op echte data) te beantwoorden.

## Buiten scope
- Automatisch trades uitvoeren of brokerkoppeling.
- Advies aan derden, publieke signalen, communityfunctie, abonnementen.
- Realtime koersschermen, mobiele app, uitgebreide backtesting (later: historical reaction patterns).

## Referenties
- **Referentiecategorieen:** LevelFields AI, Trade Ideas, Bloomberg Terminal, Koyfin.
- **Gewenste uitstraling:** professionele darkmode trading terminal; compact, data-gericht, snel scanbaar.

## Bijzonderheden
- **Toon:** direct en concreet richting Robin ("Short X, entry rond Y - want..."), maar elk advies draagt verplicht zijn tegenargument en invalidatie. Geen hype-taal, geen zekerheden suggereren.
- **Belangrijk principe:** "geen advies vandaag" is een volwaardige uitkomst; de pipeline vult nooit op naar vijf.
- **Perception events** (slecht ontvangen productlancering, reputatieschade, sentiment-omslag) blijven volwaardige eventcategorie naast financiele events.
- **Stakeholders / beslissers:** Robin de Jong.

## Open punten na herijking
- Definitieve providerkeuze per bronlaag na test van gratis tiers (EU-dekking is criterium).
- Concrete LLM-modelnamen bij bouwstart vastleggen in env.
- Berekening positiegrootte-indicatie (vast bedrag vs. risico-percentage).
- Brokerkeuze door Robin zelf te verifieren (kostenimpact shorts/1-2 weken aanhouden).
