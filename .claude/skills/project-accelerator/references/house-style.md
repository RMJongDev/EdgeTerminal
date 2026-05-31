# House Style — Robin / SuperP / New Default

## Globale conventies

| Onderwerp | Regel |
|---|---|
| Documenten | Nederlands |
| Code (variabelen, types, functies) | Engels |
| Diagrammen in docs | ASCII art |
| Default UI thema | Darkmode, hoog contrast |
| Markdown | Voor specs, briefings, designs, backlog |
| HTML | Alleen voor styleguide en mockups |

## Tone of voice per kanaal

### SuperP (enterprise / consultancy)
- Professioneel, consultancy-taal
- Focus op enterprise-kwaliteit, schaalbaarheid, betrouwbaarheid
- Refereert aan SuperP.AI en Aionic waar relevant
- Vermijd: speelse taal, hypeterms, te informele toon
- Lengte: gestructureerd, volledig, met executive summary

### New Default (MKB / vastgoed)
- DEPT Agency-stijl: creatief, to the point, slim en menselijk
- Korte zinnen, actieve formuleringen
- Visuele blokken in plaats van lange paragrafen
- Doelgroep: vastgoedprofessionals, makelaars, investeerders, woningkopers
- Vermijd: corporate jargon, wollige formuleringen, lange intro's
- Lengte: kort, snelle scan, hooks i.p.v. essays

## Schrijfregels

- Je/jij-vorm in klantcommunicatie (tenzij formele factuurcontext)
- Korte zinnen, actief
- Geen vulwoorden, geen "leveraging", geen "synergy", geen "stakeholder engagement"
- Geen exclamation-marks-inflatie
- Mensen bij naam noemen waar mogelijk
- Geen emoji's tenzij de klant ze zelf gebruikt

## Diagrammen

ASCII boxes met `─ │ ┌ ┐ └ ┘ ▼ ▲ ◀ ▶ ┬ ┴ ├ ┤ ┼`. Voorbeeld:

```
┌──────────────┐      ┌──────────────┐
│   Browser    │ ───▶ │   Next.js    │
└──────────────┘      └──────┬───────┘
                             ▼
                      ┌──────────────┐
                      │  Postgres    │
                      └──────────────┘
```

## Markdown-conventies

- Kopjes: `#`, `##`, `###` — niet dieper dan `####`
- Tabellen voor gestructureerde data
- Code blocks voor commando's, paths, ASCII art
- Geen emoji's in headings (wel mag in lijsten als marker, bv. 🔴/🟡)
- Links: `[label](pad)` — relatief vanuit de huidige file
