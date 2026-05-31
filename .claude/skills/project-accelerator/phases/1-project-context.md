# Fase 1 — Project Context

**Doel:** alle context vastleggen die je nodig hebt om over het project te kunnen praten — wie is de developer, wie is de klant, wat doet de klant, hoe ziet hun merk eruit.

## Deliverables

| Output-file | Bron / template |
|---|---|
| `Docs/Context/developer-context.md` | [../templates/developer-briefing.md](../templates/developer-briefing.md) — vaak al ingevuld; alleen aanvullen |
| `Docs/Briefings/client-briefing.md` | [../templates/client-briefing.md](../templates/client-briefing.md) |
| `Docs/Context/company-context.md` | [../templates/company-context.md](../templates/company-context.md) |
| `Docs/Context/company-styling.md` | [../templates/company-styling.md](../templates/company-styling.md) |

## Volgorde

1. **Developer-context check.** Lees `Docs/Context/developer-context.md` als die bestaat. Klopt nog? Update zo nodig. Bestaat 'ie niet? Vul in via het template.
2. **Client briefing.** Open [../templates/client-briefing.md](../templates/client-briefing.md), stel de vragen aan Robin in één blok (zie patroon hieronder), schrijf de antwoorden naar `Docs/Briefings/client-briefing.md`.
3. **Company context — research.** Gebruik WebSearch op de klant-URL en directe concurrenten. Vul `Docs/Context/company-context.md` op basis van het template. Markeer expliciet wat uit research komt vs wat uit Robins input. Voeg disclaimer toe: *"Samengesteld op basis van publiek beschikbare informatie en dient ter verificatie door de klant."*
4. **Company styling — research.** Bezoek de klant-website. Noteer kleuren (hex), fonts, beeldtaal, tone of voice. Vul `Docs/Context/company-styling.md`.
5. **DoD-check.** Draai [../checklists/inventory.md](../checklists/inventory.md).

## Interview-blok voor stap 2 (client briefing)

Stel deze vragen aan Robin in één bericht, gegroepeerd, met 🔴 kritiek / 🟡 optioneel:

🔴 Klantnaam + contactpersoon
🔴 Bestaande klant of nieuwe lead?
🔴 Kanaal: SuperP of New Default?
🔴 Budget / scope (MVP, fase 1, fixed price, uurtje-factuurtje?)
🔴 Deadline of geen
🟡 Referentie-URL's (klant-site, concurrenten, voorbeelden die ze mooi vinden)
🟡 Bijzonderheden (toon, politieke gevoeligheden, vorige leveranciers)

## Edge cases

- **Geen klant-website** → vraag of er een logo of merkbestand is; vul `company-styling.md` minimaal en markeer als open.
- **Robin levert alles in één lap tekst** → splits zelf, vraag alleen na bij ontbrekende kritieke velden.
- **Bestaande klant uit eerder project** → check of er al een `company-context.md` in een ander repo staat; vraag Robin of je 'm mag overnemen.

## Volgende fase

Na groene checklist → [2-claude-setup.md](2-claude-setup.md).
