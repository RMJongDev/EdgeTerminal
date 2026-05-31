# Fase 3 — Voorstel

**Doel:** een voorstel dat naar de klant kan. Korte functional interview, voorstel-specs (functional + tech stack op hoofdlijnen), klikbare mockups en het uiteindelijke klantvoorstel.

## Deliverables

| Output-file | Bron / template |
|---|---|
| `Docs/Specs/voorstel-specs.md` | [../templates/voorstel-specs.md](../templates/voorstel-specs.md) |
| `Docs/Specs/mockups.html` | [../templates/mockups.html](../templates/mockups.html) |
| `Docs/Proposal/voorstel-klant.md` | [../templates/voorstel-klant.md](../templates/voorstel-klant.md) |

## Volgorde

1. **Korte functional interview.** Open [../interviews/short-functional.md](../interviews/short-functional.md). Stel de vragen in één blok aan Robin. Schrijf ruwe antwoorden ergens vast (bv. een scratch-sectie onderaan `voorstel-specs.md`).
2. **Voorstel-specs schrijven.** Vul [../templates/voorstel-specs.md](../templates/voorstel-specs.md) op basis van de antwoorden. Datamodel + user flows + architectuur in ASCII art. Tech-stack op hoofdlijnen — diepere keuzes komen in fase 4.
3. **Mockups bouwen.** Kopieer [../templates/mockups.html](../templates/mockups.html) naar `Docs/Specs/mockups.html`. Gebruik tokens uit `Docs/Specs/styleguide.html` (fase 2). Bouw 3-6 kernschermen klikbaar. Mobiel + desktop.
4. **Klantvoorstel schrijven.** Vul [../templates/voorstel-klant.md](../templates/voorstel-klant.md). Tone of voice: SuperP = consultancy, New Default = DEPT-stijl. Zie [../references/house-style.md](../references/house-style.md).
5. **DoD-check.** [../checklists/proposal-ready.md](../checklists/proposal-ready.md).

## Edge cases

- **Robin weet de tech-stack nog niet** → kies redelijke defaults op basis van zijn `developer-context.md` (Mendix/React/Node/Python) en markeer in `voorstel-specs.md` als "voorlopig — definitief in fase 4".
- **Klant heeft visuele referenties** → check ze in stap 3 en match de mockup-stijl waar mogelijk binnen de styleguide-grenzen.
- **Te weinig info voor mockups** → bouw alleen de schermen waar je voldoende voor hebt; markeer ontbrekende schermen in een `// TODO`-sectie in mockups.html.

## Volgende fase

Na klant-akkoord op het voorstel → [4-build-prep.md](4-build-prep.md). Niet eerder.
