# Technical Design — {{ projectnaam }}

> **Template.** Definitief technisch ontwerp — vul in fase 4 op basis van het tech-stack interview. Schrijf naar `Docs/Specs/technical-design.md`.

## Tech-stack (definitief)
| Laag | Keuze | Versie | Reden |
|---|---|---|---|
| Runtime | Node.js | Active LTS | Vercel/Next runtime basis |
| Package manager | pnpm |  | Snelle, reproduceerbare installs |
| Frontend framework | Next.js App Router |  | Default template |
| Styling | Tailwind CSS |  | Default template, darkmode-first |
| Component primitives | shadcn-compatible + lucide-react |  | Snel, aanpasbaar, geen zware UI lock-in |
| State management | Server state eerst; client state alleen waar nodig |  | Minder client-complexiteit |
| Backend / API | Next.js Server Actions + Route Handlers |  | Past bij App Router en Vercel |
| ORM / data layer |  |  |  |
| Database | Supabase Postgres |  | Managed Postgres + Auth + Storage |
| Cache / queue |  |  |  |
| Auth | Supabase Auth met `@supabase/ssr` |  | Cookie-based SSR auth |
| File storage |  |  |  |
| E-mail / notificaties |  |  |  |
| Hosting | Vercel |  | Default deploy target |
| CI/CD |  |  |  |
| Monitoring / logging |  |  |  |
| Error tracking |  |  |  |
| Testing | Playwright e2e |  | Smoke/regressie flows |

## Template-fit
- **Default stack gebruikt:** ja/nee
- **Afwijkingen van Next/Supabase/Vercel-template:**
- **Waarom:**
- **Impact op app-skeleton (`src/`, `supabase/`, `tests/e2e/`, `.env.example`):**

## Architectuurdiagram (ASCII)
```
Browser
  |
  v
Vercel / Next.js App Router
  |-- Server Components / Server Actions
  |-- Route Handlers
  |-- Proxy session refresh
  |
  v
Supabase
  |-- Auth
  |-- Postgres + RLS
  |-- Storage (optioneel)
```

## Folderstructuur
```
src/
  app/
    (auth)/
    (app)/
    auth/
  components/
    ui/
  lib/
    supabase/
supabase/
  migrations/
tests/
  e2e/
```

## Environment variables
| Key | Scope | Verplicht | Beschrijving |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client/server | ja | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client/server | ja | Supabase publishable/anon key |
|  |  |  |  |

## Supabase schema & RLS
| Tabel | Doel | Belangrijkste velden | RLS policies | Notities |
|---|---|---|---|---|
| `profiles` | Gebruikersprofiel gekoppeld aan `auth.users` | `id`, `full_name`, `role` | gebruiker ziet/wijzigt eigen profiel | Default template |
|  |  |  |  |  |

## API-contracten
*(REST endpoints / GraphQL schema / RPC — afhankelijk van keuze)*

| Method | Path | Auth | Request | Response | Notities |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## Externe integraties
| Service | Doel | Auth-methode | Rate limits | Fallback |
|---|---|---|---|---|
|  |  |  |  |  |

## Security
- **Auth-flow:**
- **Authorization-strategie:**
- **RLS-strategie:**
- **Secrets management:**
- **AVG / compliance:**
- **OWASP-aandachtspunten:**

## Performance & schaalbaarheid
- **Verwachte load:**
- **Caching-strategie:**
- **DB-indexen:**

## Observability
- **Metrics:**
- **Logs:**
- **Tracing:**
- **Alerts:**

## Deployment
- **Environments:** (dev / staging / prod)
- **Branch-strategie:**
- **Vercel project:**
- **Supabase project(en):**
- **Auth redirect URLs:**
- **Rollback-procedure:**

## Open beslissingen
- (markeer wat nog beslist moet worden voor de bouw start)
