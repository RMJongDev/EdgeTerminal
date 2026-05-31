# Next.js / Supabase / Vercel template reference

Gebruik dit als technische default voor New Default-projecten die in de vaste webapp-stack vallen.

## Default stack

| Laag | Keuze |
|---|---|
| Runtime | Node.js Active LTS |
| Package manager | pnpm |
| Frontend | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS, shadcn-compatible UI primitives, lucide-react |
| Auth | Supabase Auth met `@supabase/ssr` en cookies |
| Data | Supabase Postgres, RLS, migrations |
| Backend | Server Actions en Route Handlers in Next.js |
| Deploy | Vercel met Supabase integration/env sync |
| Tests | Playwright e2e smoke tests |

## Architectuurprincipe

De Vercel/Supabase starter is een referentie, niet de bron van waarheid. Deze repo is rijker: app-skeleton plus accelerator-docs, skills, testafspraken en implementation log. Bij twijfel behoud je de accelerator-structuur en pas je de app-skeleton gericht aan.

## Must-haves bij fase 4

- `technical-design.md` benoemt of de default stack wordt gebruikt of bewust afwijkt.
- `.env.example` bevat alle keys die de app verwacht.
- `supabase/migrations/` bevat de MVP-tabellen en RLS policies.
- `src/lib/supabase/` bevat client/server/proxy helpers.
- Protected routes vertrouwen niet alleen op Next.js redirects; RLS is de echte data-guard.
- `tests/e2e/` bevat minimaal smoke tests voor home, auth route en protected route.
- Vercel deploy, Supabase project en redirect URLs zijn beschreven.

## Standaard route-model

```txt
/                 publiek project-startscherm
/login            Supabase email/password login en signup
/auth/confirm     Supabase email confirmation callback
/auth/error       auth foutmeldingen
/dashboard        protected app shell na login
```

## Afwijkingen vastleggen

Als het project afwijkt, noteer in `Docs/Specs/technical-design.md`:

- wat de afwijking is;
- waarom de default niet past;
- impact op development, hosting, security en testing;
- welke template-bestanden aangepast of verwijderd moeten worden.
