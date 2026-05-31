# `.claude/` Setup — wat hoort er in een project-repo

Referentie voor fase 2. Beschrijft de canonieke `.claude/` inrichting voor elk project dat uit deze accelerator komt.

## Folder-structuur

```
.claude/
├── settings.json            # Permissies + config (committed)
├── settings.local.json      # Persoonlijke overrides (gitignored)
├── agents/                  # Specialisten als .md (optioneel per project)
├── skills/
│   ├── project-accelerator/ # Deze skill — blijft staan
│   ├── skill-writer/        # Tooling — blijft staan
│   ├── brand-guidelines/    # Ingevuld in fase 2
│   ├── design/              # Ingevuld in fase 2
│   └── <project-skills>/    # Optioneel — extra skills die dit project specifiek nodig heeft
├── commands/                # Slash-commands per project
├── hooks/                   # Hook-scripts
└── docs/                    # Gedeelde referentiedocs voor agents/skills
```

## Wat fase 2 doet

1. **`brand-guidelines/SKILL.md`** — vervangt `<TODO>` met data uit `Docs/Context/company-styling.md`.
2. **`design/SKILL.md`** — vervangt `<TODO>` met de tech-keuzes (Tailwind tokens, component classes, brand signature).
3. **`Docs/Specs/styleguide.html`** — werkende HTML-styleguide die beide skills visueel valideert.
4. **`AGENTS.md` (root)** — projectnaam, klant, kanaal, korte design-samenvatting, links naar fase 1 docs.
5. **Optionele agents** — alleen als het project een terugkerende specialist nodig heeft (database-reviewer, accessibility-checker, content-translator, …).

## Wat fase 2 NIET doet

- Geen nieuwe skills aanmaken zonder noodzaak — gebruik [skill-writer](../../skill-writer/SKILL.md) als het wel nodig is.
- Geen permissies verbreden in `settings.json` zonder reden.
- Geen hooks toevoegen tenzij Robin ze expliciet vraagt.

## Validatie na fase 2

- `grep -r "TODO" .agents/skills/brand-guidelines .agents/skills/design` → geen hits.
- `Docs/Specs/styleguide.html` opent in browser zonder fouten.
- Root `AGENTS.md` noemt projectnaam en klant.
