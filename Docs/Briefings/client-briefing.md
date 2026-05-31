# Client Briefing - Edge Terminal

> Status: fase 1 projectcontext.  
> Bron: `ProjectOmschrijving.txt` en gesprek met Robin op 2026-05-31.

## Klant
- **Klantnaam:** Edge Terminal
- **Contactpersoon + rol:** Robin de Jong - initiatiefnemer, product owner en developer
- **E-mail / telefoon:** n.v.t. voor intern product
- **Bestaande klant of nieuwe lead?** Eigen product / intern New Default-project

## Kanaal
- **Via welk kanaal loopt dit?** New Default / direct
- **Reden voor dit kanaal:** Edge Terminal is een eigen product en past bij de New Default-stack voor maatwerksoftware en AI-tools.

## Scope & budget
- **Scope-afbakening:** MVP eerst. De eerste versie richt zich op de volledige researchcyclus: event -> analyse -> setup -> risk review -> paper trade -> resultaat -> leren.
- **Budget-indicatie:** n.v.t. / interne ontwikkeltijd.
- **Deadline of tijdlijn:** (open)
- **Eerste markt-scope:** VS-aandelen, EU-aandelen en ETF's.
- **Data-aanpak MVP:** delayed koersdata via API als dit zonder veel complexiteit kan; anders handmatige invoer/fallback voor prijzen en resultaten.
- **AI-aanpak MVP:** OpenAI voor event analysis, setup generation en risk review. Gemini voor websearch/research rond actuele marktinformatie.
- **Auth-aanpak MVP:** single-user product voor Robin, wel met Supabase Auth en login.
- **Eerste deliverable na context:** klikbare mockups, nog geen bouw.

## Aanleiding
- **Wat is het probleem dat de klant wil oplossen?** Robin wil marktgebeurtenissen, sentiment, hypotheses, risico's en paper trades gestructureerd kunnen beoordelen in een persoonlijke research cockpit.
- **Wat hebben ze nu (huidige situatie)?** 
  > AANNAME: research gebeurt nu verspreid over nieuwsbronnen, watchlists, losse notities, koersplatformen en handmatige evaluatie.
- **Waarom nu?** Het projectidee is concreet genoeg om de kernflow te bouwen en daarna via paper trades te meten welke signalen waarde hebben.

## Projectdoel
Edge Terminal moet een persoonlijke event-driven trading research terminal worden. De app helpt niet met automatisch handelen, maar met beter nadenken over mogelijke trades op basis van events, sentiment, risico's en historische uitkomsten.

De kernflow:

```text
Market event
  -> Event analysis
  -> Possible setup / no trade
  -> Risk review
  -> Paper trade
  -> Result
  -> Learning
```

## MVP-scope
- Inloggen en navigeren tussen hoofdonderdelen.
- Watchlist beheren.
- Market events handmatig invoeren en koppelen aan assets.
- Events analyseren op sentiment, impact, onzekerheid en risico's.
- Mogelijke setup genereren: long, short of no trade.
- Risk review uitvoeren voordat een setup serieus wordt genomen.
- Paper trade aanmaken, volgen en handmatig sluiten.
- Performance Lab met basisstatistieken: gesloten trades, winrate, gemiddeld resultaat en performance per richting.
- Daily Briefing met belangrijkste events, setups, risico's en "do nothing"-waarschuwingen.

## Buiten scope voor MVP
- Automatische echte trades.
- Brokerkoppeling.
- Betaalde abonnementen.
- Externe gebruikers.
- Complexe grafieken en real-time koersschermen.
- Mobiele app.
- Uitgebreide backtesting.
- Social sentiment scraping.
- Automatische portfolio-optimalisatie.
- Publieke signalen of communityfunctie.

## Referenties
- **Klant-website:** n.v.t. / nog geen productwebsite
- **Concurrenten / referentiecategorieen:** Bloomberg Terminal, Koyfin, TradingView, Seeking Alpha, eigen Notion/Sheets research-flows.
- **Voorbeelden die de klant mooi vindt:** Professionele trading terminal, darkmode, compact, data-gericht, snel scanbaar.

## Bijzonderheden
- **Toon / verwachtingen:** Professioneel, scherp, kritisch, niet hype-gedreven.
- **Politieke gevoeligheden / vorige leveranciers:** n.v.t.
- **Stakeholders / beslissers:** Robin de Jong.
- **Belangrijk principe:** De app mag hypotheses voorstellen, maar geen zekerheid suggereren en geen koop- of verkoopadvies aan anderen geven.
- **Belangrijke aanvulling:** Market events moeten ook perception events bevatten, zoals slecht ontvangen productlanceringen, reputatieschade, social backlash en koersreacties door sentiment of narratief.

## Open vragen na briefing
- Welke koersdata-provider past het beste bij MVP: betaalbaar, delayed, VS/EU/ETF-dekking en simpele API?
- Welke velden zijn verplicht bij het sluiten van een paper trade?
- Moet de app juridische disclaimers tonen in de UI, bijvoorbeeld "paper trade only" en "geen financieel advies"?
- Komt er een eigen logo/merkstijl voor Edge Terminal of starten we met een sober terminal-thema?
