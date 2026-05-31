---
name: project-accelerator
description: Drive the end-to-end kickstart of a new software project across four phases — project context, .claude/ setup, klantvoorstel met mockups, en definitief functional/technical design + backlog. Use when the user says "start nieuw project", "werk aan de project accelerator", "kickstart", "nieuwe klant", "maak een voorstel", "interview voor specs", or wants briefings, company context, voorstel-specs, mockups, styleguide, of een bouwklare backlog. Triggers also: project accelerator, project kickstart, accelerate, briefing invullen, klantvoorstel, definitief ontwerp, backlog opbouwen.
---

# Project Accelerator

Begeleidt Robin door het volledig invullen van een nieuw project-repo. Deze repo is een Next.js/Supabase/Vercel-template die voor elk nieuw project gekloond wordt; vanaf dat moment is de kopie het project-repo en helpt deze skill alle kickstart-bestanden en de app-skeleton gestructureerd in te vullen via interviews en templates.

## Quick start

Robin zegt: **"Start nieuw project"** of **"Werk aan de project accelerator"**.

1. Lees [phases/1-project-context.md](phases/1-project-context.md) en begin daar.
2. Werk fase 1 → 2 → 3 → 4 in volgorde af. Sla geen fasen over.
3. Aan het einde van elke fase: draai de bijbehorende checklist in [checklists/](checklists/). Stop niet zonder groene check.

## When to use this Skill

- Robin start een nieuw project en heeft deze repo gekloond.
- Hij zegt: "kickstart", "project accelerator", "nieuwe klant", "maak een voorstel", "interview voor specs", "definitief ontwerp", "backlog opbouwen".
- Hij wil een briefing, company context, voorstel-specs, mockups, styleguide, klantvoorstel of bouwklare backlog opleveren.
- Hij vraagt om de `Docs/` of `.agents/skills/brand-guidelines` / `design` folders te vullen.

**Niet gebruiken voor:** losse documentatietaken die niet bij een kickstart horen, of als het project al in de bouwfase zit.

## De 4 fasen

```
┌─────────────────────────────────────────────────────────────────┐
│ FASE 1 — PROJECT CONTEXT                                        │
│ Inputs:  client briefing (ruw), referenties, logo               │
│ Outputs: Docs/Context/{developer,company}-context.md            │
│          Docs/Briefings/client-briefing.md                      │
│          Docs/Context/company-styling.md                        │
│ → phases/1-project-context.md                                   │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ FASE 2 — CLAUDE SETUP                                           │
│ Inputs:  fase 1 outputs                                         │
│ Outputs: ingevulde .agents/skills/brand-guidelines/SKILL.md     │
│          ingevulde .agents/skills/design/SKILL.md               │
│          Docs/Specs/styleguide.html                             │
│          aangescherpte AGENTS.md + eventueel agents             │
│ → phases/2-claude-setup.md                                      │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ FASE 3 — VOORSTEL                                               │
│ Inputs:  fase 1+2 outputs                                       │
│ Outputs: Docs/Specs/voorstel-specs.md                           │
│          Docs/Specs/mockups.html                                │
│          Docs/Proposal/voorstel-klant.md                        │
│ → phases/3-voorstel.md                                          │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ FASE 4 — BUILD PREP                                             │
│ Inputs:  goedgekeurd voorstel                                   │
│ Outputs: Docs/Specs/functional-design.md                        │
│          Docs/Specs/technical-design.md                         │
│          Docs/Specs/backlog.md                                  │
│ → phases/4-build-prep.md                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Decision flow

| Robin's situatie | Open dit |
|---|---|
| Net repo gekloond, niets ingevuld | [phases/1-project-context.md](phases/1-project-context.md) |
| Context staat, brand/design moet | [phases/2-claude-setup.md](phases/2-claude-setup.md) |
| Klaar voor klantvoorstel | [phases/3-voorstel.md](phases/3-voorstel.md) |
| Voorstel goedgekeurd, bouw start binnenkort | [phases/4-build-prep.md](phases/4-build-prep.md) |
| Weet niet waar hij staat | Draai [checklists/inventory.md](checklists/inventory.md) |

## Instructions voor Claude

1. **Bepaal de fase.** Lees de relevante `Docs/`-bestanden om te zien wat al ingevuld is. Gebruik [checklists/inventory.md](checklists/inventory.md) als leidraad. Vraag Robin niet wat al duidelijk uit het repo blijkt.
2. **Open de fase-file.** Lees `phases/<n>-...md` volledig vóór je begint. Daar staan deliverables, volgorde, templates en interview-scripts.
3. **Voer interviews gegroepeerd uit.** Niet één vraag per beurt — groepeer per categorie en markeer kritiek (🔴) vs optioneel (🟡). Zie het patroon in [interviews/](interviews/).
4. **Schrijf antwoorden direct naar de juiste `Docs/`-locatie.** Templates in [templates/](templates/) zijn de bron — kopieer de structuur, vul met antwoorden, schrijf naar de bestemming uit het fase-bestand.
5. **Gebruik de standaard app-template als default.** Voor normale New Default-apps is [references/next-supabase-template.md](references/next-supabase-template.md) leidend: Next.js App Router, Supabase, Vercel, Tailwind, Playwright. Wijk alleen af met expliciete trade-off in `technical-design.md`.
6. **Houd docs en skeleton synchroon.** Als fase 4 een technische keuze definitief maakt, update dan ook relevante app-bestanden (`src/`, `supabase/`, `.env.example`, `tests/e2e/`) of noteer waarom dat nog niet kan.
7. **Sluit de fase af met de checklist.** Elke fase heeft een checklist in [checklists/](checklists/). Loop hem expliciet langs voor je doorgaat.
8. **Edge cases:** geen logo → markeer in styleguide en vraag later op. Klant niet bereikbaar → markeer aannames met `> AANNAME:`. Onbekende tech-keuze → noteer als open punt in `Docs/Specs/voorstel-specs.md`.

## Conventies

| Onderwerp | Regel |
|---|---|
| Taal documenten | Nederlands |
| Taal code | Engels |
| Diagrammen | ASCII art (ERD, flows, architectuur) |
| Design thema | Darkmode default tenzij klant anders vraagt |
| Markdown | Voor specs, briefings, designs, backlog |
| HTML | Alleen voor styleguide en mockups |
| Tone of voice | Kanaal-afhankelijk — zie [references/house-style.md](references/house-style.md) |
| App-template | Next.js/Supabase/Vercel default — zie [references/next-supabase-template.md](references/next-supabase-template.md) |

## Definition of done — per fase

- Fase 1 → [checklists/inventory.md](checklists/inventory.md)
- Fase 2 → end-of-file checklist in [phases/2-claude-setup.md](phases/2-claude-setup.md)
- Fase 3 → [checklists/proposal-ready.md](checklists/proposal-ready.md)
- Fase 4 → [checklists/build-ready.md](checklists/build-ready.md)

## Template output — hoe ziet het eruit na fase 4?

Dit is de verwachte file-structuur nadat Robin alle vier fasen volledig heeft doorlopen. Gebruik dit als referentie om te zien welke bestanden er moeten liggen, en om snel te herkennen wat er nog ontbreekt.

```
<project-root>/
├── AGENTS.md                                  # aangescherpt in fase 2
├── README.md
├── package.json                               # Next/Supabase template-app
├── .env.example                               # alle vereiste env keys, nooit secrets
├── src/                                       # Next.js App Router skeleton
│   ├── app/                                  # routes, layouts, auth, dashboard
│   ├── components/                           # app shell + UI primitives
│   └── lib/supabase/                         # client/server/proxy helpers
├── supabase/                                  # migrations + seed
├── tests/e2e/                                 # Playwright smoke/regressie
├── .claude/
│   ├── settings.json                          # team-config
│   ├── settings.local.json                    # persoonlijk (gitignored)
│   ├── agents/                                # optioneel, per fase uitgebreid
│   ├── commands/
│   ├── hooks/
│   ├── rules/
│   └── skills/
│       ├── project-accelerator/               # deze skill (template)
│       ├── brand-guidelines/
│       │   └── SKILL.md                       # ✅ ingevuld in fase 2
│       ├── design/
│       │   └── SKILL.md                       # ✅ ingevuld in fase 2
│       └── skill-writer/
└── Docs/
    ├── implementation-log.md                  # groeit elke sessie
    ├── backlog.md                             # 🔵 fase 4 — epics + user stories, leeg template vanaf start
    ├── Briefings/
    │   └── client-briefing.md                 # 🟢 fase 1
    ├── Context/
    │   ├── developer-context.md               # 🟢 fase 1
    │   ├── company-context.md                 # 🟢 fase 1
    │   └── company-styling.md                 # 🟢 fase 1
    ├── Interviews/                            # ruwe interview-output, 1 file per sessie
    │   ├── README.md                          # naming + format
    │   └── YYYY-MM-DD-<onderwerp>-<stakeholder>.md
    ├── Specs/
    │   ├── voorstel-specs.md                  # 🟠 fase 3
    │   ├── mockups.html                       # 🟠 fase 3
    │   ├── styleguide.html                    # 🟠 fase 2
    │   ├── functional-design.md               # 🔵 fase 4
    │   └── technical-design.md                # 🔵 fase 4
    ├── Proposal/
    │   └── voorstel-klant.md                  # 🟠 fase 3
    ├── Testing/
    │   ├── TestsPlaywright/                   # 🔵 fase 4 — geautomatiseerde e2e-plannen + .spec scripts
    │   │   └── README.md
    │   └── TestsHuman/                        # 🔵 fase 4 — handmatige test-scripts voor stakeholders
    │       └── README.md
    └── Archive/                               # superseded docs
```

Legenda: 🟢 fase 1 · 🟠 fase 2/3 · 🔵 fase 4. Elke fase voegt zijn outputs toe — eerder gemaakte bestanden blijven staan en worden hooguit bijgewerkt.

## Supporting files (progressive disclosure)

- [phases/](phases/) — wat doe je per fase, in welke volgorde
- [interviews/](interviews/) — gestructureerde vraagscripts per fase
- [templates/](templates/) — invul-templates met kopjes en prompts
- [checklists/](checklists/) — per fase een DoD-check
- [references/](references/) — house-style, .claude/ setup-referentie en Next/Supabase template
