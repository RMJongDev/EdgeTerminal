# Fase 2 — Claude Setup

**Doel:** de `.claude/`-config van dit project-repo project-specifiek maken. Placeholder-skills invullen, eventueel agents toevoegen, `AGENTS.md` aanscherpen, en een eerste styleguide.html opleveren.

## Deliverables

| Output | Bron |
|---|---|
| `.agents/skills/brand-guidelines/SKILL.md` (ingevuld) | huidige placeholder + fase 1 outputs |
| `.agents/skills/design/SKILL.md` (ingevuld) | huidige placeholder + fase 1 outputs |
| `Docs/Specs/styleguide.html` | [../templates/styleguide.html](../templates/styleguide.html) |
| `AGENTS.md` (aangescherpt) | bestaande root-AGENTS.md |
| `.claude/agents/*.md` (optioneel) | als project specifieke specialisten nodig heeft |

## Volgorde

1. **Lees fase 1 outputs.** `Docs/Briefings/client-briefing.md`, `Docs/Context/company-context.md`, `Docs/Context/company-styling.md`.
2. **Vul `brand-guidelines` skill.** Open [../../brand-guidelines/SKILL.md](../../brand-guidelines/SKILL.md). Vervang alle `<TODO>` markers met data uit `company-styling.md`. Verwijder de status-blockquote.
3. **Vul `design` skill.** Idem voor [../../design/SKILL.md](../../design/SKILL.md). Hier gaat het om app-UI: Tailwind tokens, component classes, brand signature (custom radius?), badge-regels.
4. **Genereer `styleguide.html`.** Kopieer [../templates/styleguide.html](../templates/styleguide.html) naar `Docs/Specs/styleguide.html` en vul met de tokens uit stap 2-3. Werkend HTML-bestand zonder externe dependencies, darkmode default.
5. **Scherp `AGENTS.md` aan.** Voeg projectnaam, klant, kanaal, korte design-samenvatting en verwijzingen naar de fase 1 docs toe.
6. **Agents (optioneel).** Heeft het project een specialist nodig (bv. database-reviewer, accessibility-checker)? Maak `.md` in `.claude/agents/`. Skip als overbodig.
7. **DoD-check** (zie onderaan).

## Brand-signature beslismoment

Vraag Robin expliciet: *"Krijgt dit project een eigen brand-signature (zoals MYN's hoek-cut), of werken we met standaard radius?"* Zet het antwoord in beide skill-files en in `styleguide.html`.

## Definition of done — fase 2

- [ ] `brand-guidelines/SKILL.md` bevat geen `<TODO>` of `TODO` meer
- [ ] `design/SKILL.md` bevat geen `<TODO>` of `TODO` meer
- [ ] `Docs/Specs/styleguide.html` opent in een browser en toont alle tokens
- [ ] `AGENTS.md` noemt projectnaam, klant en kanaal
- [ ] Optionele agents zijn aangemaakt of bewust overgeslagen
- [ ] Robin heeft visueel akkoord gegeven op de styleguide

## Volgende fase

Na groene check → [3-voorstel.md](3-voorstel.md).
