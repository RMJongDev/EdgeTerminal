---
name: design
description: PLACEHOLDER — Design system voor de app-UI van dit project. Vul in zodra tokens, componenten en patronen zijn gedefinieerd. Gebruik deze skill bij elke UI-wijziging (componenten, pagina's, layouts, forms, tables, cards, badges, modals, navigatie). Trigger-keywords: UI, design, component, Tailwind, className, styling, layout, form, table, card, badge, modal, navigatie.
---

# Design System — TEMPLATE

> **Status:** placeholder. Vul deze skill in zodra het design system vorm krijgt. Verwijder deze blockquote bij activering.

You are working in the `<TODO: project-naam>` codebase. Dit project heeft een eigen visuele identiteit die je exact moet matchen.

**Visual source of truth:** `Docs/Specs/styleguide.md` *(TODO: aanmaken)*
**Tokens / config live in:** `<TODO: bv. tailwind.config.ts en app/globals.css>`

---

## Waarom deze skill bestaat

> TODO: noteer 2–4 niet-onderhandelbare regels die generieke output snel laat ontsporen. Bv. custom radius, badge-kleurregels, nav-state regels.

1. **`<TODO regel 1>`**
2. **`<TODO regel 2>`**
3. **`<TODO regel 3>`**

---

## Decision flow

Voor elke className:

1. **Wat voor element is dit?** (button, card, badge, input, nav item, modal, alert, table, icon)
2. **Welke tokens gelden?** Zie tabel hieronder.
3. **Welke reference file?** Open en kopieer — niet uit het hoofd schrijven.

| Taak | Reference |
|---|---|
| Badges, status chips | `references/badges.md` *(TODO)* |
| Buttons, forms, cards, tables, modals | `references/components.md` *(TODO)* |
| Kleuren, typografie, spacing | `references/tokens.md` *(TODO)* |
| Sidebar, nav, layout | `references/layout-nav.md` *(TODO)* |

---

## Brand signature / radius systeem

> TODO: beschrijf het herkenbare visuele element (custom radius, shape, etc.) en de mapping per element.

| Element | Radius / class | Waarom |
|---|---|---|
| Card | `<TODO>` | TODO |
| Primary button | `<TODO>` | TODO |
| Alert | `<TODO>` | TODO |
| Modal | `<TODO>` | TODO |
| Nav item | `<TODO>` | TODO |
| Input | `<TODO>` | TODO |
| Badge | `<TODO>` | TODO |
| Avatar | `<TODO>` | TODO |

---

## Core tokens

**Brand kleuren:**
- `#TODO` — Primary → `<TODO class>`
- `#TODO` — Accent → `<TODO class>`
- `#TODO` — Danger → `<TODO class>`
- `#TODO` — Success → `<TODO class>`

**Semantische tokens (light/dark via CSS vars):**
- `bg-base`, `bg-surface`, `bg-subtle`
- `border-default`
- `text-primary`, `text-secondary`, `text-muted`

> TODO: vervang door echte tokennamen zodra Tailwind/CSS config bestaat.

**Font:** `<TODO>`
**Icons:** `<TODO bibliotheek>`, size `<TODO>`, stroke `<TODO>`
**Cijfers:** altijd `tabular-nums` in tabellen en stat cards.

---

## Badges

> TODO: definieer badge-anatomie en variants (success, info, warning, danger, muted, default, ...).

```tsx
<span className="<TODO base classes> {variant-classes}">
  Label
</span>
```

| Context | Variant |
|---|---|
| `<TODO>` | `<TODO>` |

---

## Component quick-reference

> TODO: vul één regel per component zodra de classes vastliggen.

```text
Primary button:  <TODO>
Secondary btn:   <TODO>
Danger button:   <TODO>
Ghost button:    <TODO>
Icon button:     <TODO>
Input:           <TODO>
Card:            <TODO>
Table wrapper:   <TODO>
Modal container: <TODO>
Alert base:      <TODO>
```

---

## Critical don'ts

- `<TODO: meest gemaakte fouten — vul aan tijdens development>`

---

## Definition of done — UI component

Voor je een component af noemt:

1. `<TODO check 1>`
2. `<TODO check 2>`
3. `<TODO check 3>`
4. Alle iconen zijn consistent in bibliotheek, size en stroke.
5. Alle cijfers in tabellen en stat cards hebben `tabular-nums`.
6. Alle kleuren zijn brand classes of semantische tokens — geen losse hex.
