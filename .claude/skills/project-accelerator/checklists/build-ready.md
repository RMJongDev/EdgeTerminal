# Checklist — Fase 4 Build Ready

> Draai aan het einde van fase 4, vóór de bouw start.

## Bestanden aanwezig
- [ ] `Docs/Specs/functional-design.md`
- [ ] `Docs/Specs/technical-design.md`
- [ ] `Docs/Specs/backlog.md`

## functional-design.md
- [ ] Scope (in/out) expliciet
- [ ] Alle rollen + rechten vastgelegd
- [ ] Volledig datamodel met velden, types, constraints
- [ ] Per kernflow: happy path, edge cases, validaties, error states, lege states
- [ ] Notificatie-matrix ingevuld
- [ ] Geen open vragen meer (of expliciet als "post-MVP" gemarkeerd)

## technical-design.md
- [ ] Tech-stack tabel volledig — versies erbij
- [ ] Architectuurdiagram ASCII
- [ ] Folderstructuur
- [ ] API-contracten of -schema
- [ ] Auth-flow vastgelegd
- [ ] Secrets-management vastgelegd
- [ ] Observability (errors, logs, metrics) belegd
- [ ] CI/CD pipeline beschreven
- [ ] Deployment-procedure incl. rollback

## backlog.md
- [ ] Alle epics hebben een doel + DoD
- [ ] Elke story heeft acceptatiecriteria
- [ ] Elke story heeft story points
- [ ] MVP vs later label op elke story
- [ ] Cross-cutting taken (setup, auth, design system, monitoring, deploy) staan erin
- [ ] Geen story zonder owner-acceptatie van Robin

## Testing
- [ ] `Docs/Testing/TestsPlaywright/` bevat minstens één geautomatiseerd test-plan of `.spec`-script voor de happy paths
- [ ] `Docs/Testing/TestsHuman/` bevat minstens één handmatig test-script dat een niet-technische stakeholder kan uitvoeren
- [ ] Beide dekken de MVP-flows uit `functional-design.md`

## .claude / skills check
- [ ] `.agents/skills/brand-guidelines/SKILL.md` is ingevuld (geen TODO meer)
- [ ] `.agents/skills/design/SKILL.md` is ingevuld (geen TODO meer)
- [ ] Root `AGENTS.md` is project-specifiek
- [ ] Eventuele project-specifieke agents staan in `.claude/agents/`

## Klaar voor bouw
- [ ] Een nieuwe Claude-sessie kan op basis van `Docs/Specs/` + `.claude/` direct beginnen met coden zonder Robin uit te vragen
