# Fase 4 — Build Prep

**Doel:** het project bouwklaar maken. Diepe functional + technical interviews, definitieve designs, en een complete backlog die in een sprintplanning past.

## Deliverables

| Output-file | Bron / template |
|---|---|
| `Docs/Specs/functional-design.md` | [../templates/functional-design.md](../templates/functional-design.md) |
| `Docs/Specs/technical-design.md` | [../templates/technical-design.md](../templates/technical-design.md) |
| `Docs/Specs/backlog.md` | [../templates/backlog.md](../templates/backlog.md) |
| `Docs/Testing/TestsPlaywright/*` | geautomatiseerde test-plannen / `.spec`-scripts |
| `Docs/Testing/TestsHuman/*` | handmatige test-scripts voor stakeholders |

## Volgorde

1. **Functional interview — diep.** [../interviews/full-functional.md](../interviews/full-functional.md). Doorloop elke kernflow van fase 3 in detail: rollen, rechten, edge cases, validaties, error states, lege states, notificaties.
2. **Tech-stack interview.** [../interviews/tech-stack.md](../interviews/tech-stack.md). Frameworks, hosting, auth, CI/CD, monitoring, testing, externe services. Vastleggen op versie-niveau.
3. **Functional design schrijven.** Vul [../templates/functional-design.md](../templates/functional-design.md). User stories met acceptatiecriteria. Volledig datamodel (ASCII ERD). Alle flows.
4. **Technical design schrijven.** Vul [../templates/technical-design.md](../templates/technical-design.md). Architectuurdiagram (ASCII), folderstructuur, deployment, observability, security, API-contracten.
5. **Backlog opbouwen.** Vul [../templates/backlog.md](../templates/backlog.md). Epics → stories → taken. Elke story heeft acceptatiecriteria, story points en MVP-of-later label.
6. **Test-plannen.** Schrijf per MVP-flow minstens één geautomatiseerd plan in `Docs/Testing/TestsPlaywright/` en één handmatig script in `Docs/Testing/TestsHuman/`. Het handmatige script is voor een niet-technische stakeholder.
7. **DoD-check.** [../checklists/build-ready.md](../checklists/build-ready.md).

## Edge cases

- **Robin twijfelt over een tech-keuze** → noteer beide opties met trade-offs in `technical-design.md` en markeer als open beslissing.
- **Backlog wordt te groot** → forceer MVP-cut: alles wat niet kritiek is voor versie 1 → label `later`.
- **Functional design wijkt af van het voorstel** → update `voorstel-specs.md` óók, of noteer expliciet dat fase 4 voorrang krijgt en waarom.

## Resultaat

Na groene `build-ready.md`-checklist is het project klaar om te bouwen. Robin kan een nieuwe Claude-sessie starten en die de `Docs/Specs/`-bestanden + ingevulde `.claude/` laten lezen om direct te coden.
