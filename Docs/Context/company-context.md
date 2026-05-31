# Company Context - Edge Terminal

> Disclaimer: dit document is samengesteld op basis van Robin's projectomschrijving en dient ter verificatie door Robin. Er is nog geen externe website- of marktresearch gedaan voor dit interne product.

## Kerngegevens
- **Naam:** Edge Terminal
- **Opgericht:** 2026
- **HQ / locaties:** Intern New Default-project, Hummelo
- **Aantal medewerkers (orde van grootte):** 1 product owner/developer in MVP-fase
- **Website:** (open)

## Wat doen ze?
- **Kernactiviteit:** Edge Terminal structureert market events, analyseert impact en helpt trading hypotheses via paper trades meetbaar te maken.
- **Producten / diensten:** Persoonlijke trading research terminal voor event-driven research.
- **Verdienmodel:** n.v.t. in MVP. 
  > AANNAME: eerste versie is voor persoonlijk gebruik, niet als publiek SaaS-product.

## Productpositionering
Edge Terminal is geen tradingbot en geen signaaldienst. Het is een research cockpit waarin elke mogelijke trade als hypothese wordt behandeld.

De app ondersteunt:
- events verzamelen en classificeren;
- impact en sentiment beoordelen;
- mogelijke long, short of no-trade setups formuleren;
- setups kritisch laten aanvallen via risk review;
- paper trades aanmaken en volgen;
- resultaten meten in het Performance Lab;
- leren welke signalen, eventtypes en strategieen waarde hebben.

## Kernflow

```text
Watchlist
  -> Market Event
  -> Event Analysis
  -> Signal Desk
  -> Risk Review
  -> Paper Trade
  -> Performance Lab
  -> Better research rules
```

## Markt & doelgroep
- **Doelgroep:** Robin als eerste gebruiker. De MVP blijft single-user, maar gebruikt wel Supabase Auth zodat login, sessies en later uitbreiden netjes geregeld zijn.
- **Marktpositie:** Persoonlijke, compacte research terminal tussen losse notities, watchlists, nieuwsplatformen en professionele terminals in.
- **Geografische focus:** Eerst VS-aandelen, EU-aandelen en ETF's.

## Referentiecategorieen
- Professionele marktterminals.
- Trading dashboards.
- Watchlist- en nieuwsplatformen.
- Research journals.
- Paper trading tools.
- AI-assisted analysis tools.

## Functionele domeinen
- **Dashboard:** dagelijkse cockpit met events, setups, risico's, open paper trades en performance.
- **Watchlist:** assets die gevolgd worden.
- **Market Events:** formele financiele events en perception events.
- **Event Analysis:** analyse van sentiment, impact, horizon, onzekerheid, bull case, bear case en risico's.
- **Signal Desk:** vertaalt een event naar een mogelijke setup of no trade.
- **Risk Review:** zoekt tegenargumenten en redenen om over te slaan.
- **Paper Trades:** test hypotheses zonder echt geld.
- **Performance Lab:** meet of analyses en setups waarde hebben.
- **Daily Market Briefing:** korte dagelijkse samenvatting met kansen, risico's en do-nothing signalen.
- **AI Analysis Log:** inzicht in prompts, inputs, outputs, bruikbaarheid en fouten.

## Perception Events
Edge Terminal moet niet alleen klassieke financiele gebeurtenissen verwerken. Ook narratief- en sentimentgedreven gebeurtenissen zijn volwaardige market events.

Voorbeelden:
- slecht ontvangen productpresentatie;
- negatieve mediareactie;
- reputatieschade;
- social backlash;
- onverwachte kritiek op design, prijs, strategie of management;
- opvallende koersreactie na een publiek event.

Belangrijke analysevragen bij perception events:
- Is de impact fundamenteel of vooral sentimentgedreven?
- Is de koersreactie overdreven of terecht?
- Kan negatieve beeldvorming langer blijven hangen?
- Is er een mogelijke sentiment short, rebound setup of juist no trade?

## Tone of voice & productprincipes
- Kritisch boven enthousiast.
- Research eerst, handelen later.
- No trade is een geldige uitkomst.
- Geen setup zonder concreet event.
- Geen setup zonder risk review.
- Confidence is geen zekerheid.
- Alles moet later meetbaar zijn.
- Snel scanbaar boven lange tekst waar badges, scores en compacte samenvattingen beter werken.

Vermijden:
- "Guaranteed winner"
- "Must buy"
- "Perfect setup"
- "Risk-free"
- "Easy money"

Gewenst:
- "Possible long setup"
- "No clear edge"
- "High uncertainty"
- "Risk review suggests caution"
- "Worth tracking, not trading yet"
- "Paper trade only"
- "Hypothesis failed"

## Technische context
- **Bestaande systemen:** Next.js / Supabase / Vercel template-repo.
- **Tech stack:** Next.js App Router, Supabase Auth/Postgres, Tailwind, TypeScript, Playwright.
- **AI-aanpak:** OpenAI voor analyse, setup generation en risk review. Gemini voor websearch/research rond actuele marktcontext.
- **Market-data aanpak:** delayed koersdata via API als dit eenvoudig en betaalbaar kan; handmatige invoer/fallback blijft toegestaan in MVP.
- **Vendor lock-ins / gevoeligheden:** market-data provider en eventuele toekomstige brokerkoppeling zijn nog open.
- **Belangrijke randvoorwaarde:** service-role keys blijven server-only; financiele analyses mogen niet als beleggingsadvies voor derden worden gepresenteerd.

## Bronnen
- `ProjectOmschrijving.txt` - volledige ruwe projectomschrijving door Robin.
- Gesprek met Robin op 2026-05-31 - bevestiging van projectrichting en volgende stap.
