# Risk Framework - Edge Terminal

> Status: vastgesteld 2026-06-12, hoort bij `voorstel-specs.md`.
> Doel: een risicokader dat losstaat van hoe overtuigend een advies leest. De app handhaaft signalerend (ranking, warnings, statusbalk); Robin voert uit.
> Alle drempels hieronder zijn startwaarden en configureerbaar; wijzigingen worden hier bijgehouden.

## 1. Edge-these

De pipeline wint nooit de snelheidsrace: als nieuws in een API staat, is de eerste koersreactie al geweest. De edge wordt gezocht in:

1. **Tweede-orde beoordeling** - is de marktreactie over- of onderdreven voor een horizon van dagen tot twee weken (post-event drift, overreaction rebound)?
2. **Selectie en discipline** - weinig, goed onderbouwde adviezen met verplicht tegenargument, kostenhorde en automatische uitkomstmeting.
3. **Aandachtsgaten** - events buiten de hoofdaandacht (perception events, mover sweep) waar verwerking trager is.

Consequentie voor elke prompt en ranking: geen beweging najagen, entry op pullback of bevestiging, en "geen advies" wanneer de reactie al fair geprijsd lijkt.

## 2. Kapitaal en positiegrootte

| Regel | Startwaarde |
|---|---|
| Trading-kapitaal | Door Robin vast te stellen: alleen geld dat volledig gemist kan worden. Vastleggen voor de eerste echte trade. |
| Max risico per trade | 1% van het trading-kapitaal (afstand entry -> stop, inclusief slippage-marge, bepaalt de positiegrootte) |
| Minimale positie | EUR 500 zolang het kostenprofiel CFD-achtig is; onder EUR 500 eten kosten elke realistische edge op |
| Maximale positie | EUR 1000 (bestaand besluit) |
| Max open posities | 4-5 tegelijk |
| Correlatieregel | Max 2 open posities in hetzelfde sector/thema; een derde geldt als het vergroten van een bestaande trade |
| Shorts | Halve positiegrootte of dubbele slippage-marge: verliesrisico is asymmetrisch en squeeze-risico is reeel bij negatief-sentiment-namen |

## 3. Kostenhorde

- **Regel:** verwachte round-trip kosten (spread + fees + overnight/weekend bij 1-2 weken aanhouden) <= 1/3 van de verwachte beweging naar target. Anders: no-trade of zware rank-penalty.
- De pipeline berekent per advies `expected_move_pct` en `cost_estimate_pct` en toont de verhouding op de advieskaart.
- **Broker-voorwaarde:** de overstap naar een broker met echte aandelen/shorts en lage kosten (IBKR-achtig) is een voorwaarde voor structureel echt traden, geen nice-to-have. Tot die tijd: alleen posities waar de kostenhorde ook met CFD-kosten haalbaar is.

## 4. Circuit breaker

Verliesreeksen komen ook bij een goed systeem (55% winrate geeft regelmatig 5+ verliezers op rij). Wat beschermt is de vooraf vastgelegde reactie:

| Trigger (startwaarden) | Actie |
|---|---|
| 5 echte verliezers op rij, OF | 2 weken alleen paper: adviezen blijven komen met "paper only"-label |
| -10% van het trading-kapitaal binnen 30 dagen | Zelfde actie; herstart daarna op halve positiegrootte |

Vaste regels:
- nooit de positiegrootte verhogen om verlies terug te winnen;
- nooit opschalen direct na een winreeks (zelfde fout, andere richting);
- de app toont de circuit-breaker status op het dashboard; Robin handhaaft hem bij de broker.

## 5. Gap- en slippage-realisme

- Een stop-loss is een intentie, geen garantie: nieuws-aandelen gappen, juist rond de events waar deze pipeline op handelt.
- Positiegrootte rekent met stop-afstand + 2% slippage-marge (shorts: zie 2).
- Elke risk review benoemt gap-risico expliciet; bij shorts ook squeeze-risico.

## 6. Statistische discipline - opschaal-gates

| Fase | Wat het bewijst | Gate |
|---|---|---|
| 4 weken validatie | Proceskwaliteit: vindt de pipeline de juiste events, klopt de argumentatie achteraf | 0-2 kleine echte trades per week, niet meer |
| >= 50 getrackte adviezen | Eerste statistische indicatie | Pas bij positieve expectancy **na kosten**: doorgaan met 2-3 echte trades per week |
| 3 maanden / >= 100 adviezen | Regime-spreiding, expectancy per adviestype | Pas hierna size stapsgewijs verhogen, en alleen binnen regels uit 2 |

Winrate alleen is geen maatstaf; expectancy na kosten (gemiddelde uitkomst x frequentie - kosten) is dat wel. Het Performance Lab toont die per adviestype met een sample-size waarschuwing onder ~30 waarnemingen.

## 7. Kalibratie tegen overtuigende verhalen

LLM-argumentatie leest altijd goed - ook als hij fout is. Tegenwicht in het product:

- elk Advies Detail toont **kalibratie-context**: hoe vergelijkbare adviestypen het historisch deden, zodra >= 20 getrackte uitkomsten bestaan;
- de tracking-data weegt zwaarder dan de leesindruk: een adviestype met negatieve expectancy wordt gemarkeerd als "vermijden", hoe goed het verhaal ook klinkt;
- bekende blinde vlek v1: geen social-sentiment-bronlaag; perception events leunen op mediatone en koersreactie. Geaccepteerd, op de Later-lijst.

## 8. Verwachtingen per fase

Het eerste halfjaar is de opbrengst **leren plus een geverifieerd track record**, geen inkomen. Bij deze kapitaalschaal kan dat ook niet anders: de waarde zit in bewijzen welke adviestypen werken voordat er serieus kapitaal achteraan gaat. Elke maand een korte evaluatie in `implementation-log.md`: expectancy na kosten, beste/slechtste adviestype, en of de gates uit 6 gehaald zijn.

## 9. Wat de app bewaakt vs. wat Robin doet

| App (signalerend) | Robin (uitvoerend) |
|---|---|
| Kostenhorde en correlatie-check in de ranking | Trades plaatsen en sluiten bij de broker |
| Risk-statusbalk: open posities vs. max, drawdown, circuit-breaker status | Circuit breaker naleven |
| "Paper only"-label bij circuit-breaker trigger | Trading-kapitaal en drempels vaststellen |
| Kalibratie-context en expectancy na kosten | Beslissen, met de data zwaarder dan het verhaal |
| Gap/squeeze-risico in elk short-advies | Brokerkeuze (voorwaarde voor structureel live) |
