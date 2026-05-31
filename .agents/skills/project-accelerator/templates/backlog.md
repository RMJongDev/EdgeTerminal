# Backlog — {{ projectnaam }}

> **Template.** Definitieve backlog — vul in fase 4. Schrijf naar `Docs/Specs/backlog.md`. Bron: functional-design + technical-design.

## Legenda
- **MVP** = moet in versie 1
- **Later** = nice-to-have / fase 2
- **Points** = grof: 1 / 2 / 3 / 5 / 8

## Epic 1 — {{ naam }}
**Doel:**
**Definition of done:**

| ID | Story | Acceptatie | Points | MVP |
|---|---|---|---|---|
| E1-S1 |  |  |  | ✅ |
| E1-S2 |  |  |  | ✅ |

### E1-S1 — {{ story-titel }}
**Als** [rol] **wil ik** [actie] **zodat** [waarde].

**Acceptatie:**
- [ ] …

**Tech-taken:**
- [ ] …

**Open vragen:**
- …

---

## Epic 2 — {{ naam }}
…

---

## Cross-cutting taken (geen epic)
- [ ] Project setup (projectnaam, package metadata, Node/pnpm, CI, env)
- [ ] Supabase project aanmaken en `.env.example`/`.env.local` synchroniseren
- [ ] Supabase migrations + RLS policies voor MVP-datamodel
- [ ] Generated Supabase database types bijwerken
- [ ] Auth-implementatie (login, signup, logout, protected routes, redirect URLs)
- [ ] App shell en navigatie aanpassen op projectdomein
- [ ] Design-system bootstrap vanuit fase 2 verwerken in Tailwind/componenten
- [ ] Playwright smoke tests voor home, login en protected routes
- [ ] Logging + monitoring inrichten
- [ ] Vercel deployment pipeline en rollback testen

## Buiten MVP
*(Alles met label `Later` — kort gegroepeerd zodat klant ziet wat bewust is uitgesteld)*
