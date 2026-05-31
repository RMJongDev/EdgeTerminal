# Next.js / Supabase / Vercel template

> Bron voor de standaard technische projectstart van deze accelerator. Gebruik dit als default voor New Default-apps, tenzij het project bewust afwijkt.

## Oordeel

Gebruik de Vercel/Supabase starter als referentie voor Supabase SSR auth, maar niet als volledige basis. Deze accelerator heeft extra waarde: briefing, specs, design, backlog, testplannen, skills en implementation log. De app-skeleton hoort daarom in deze repo te staan, naast de accelerator-laag.

## Standaard stack

| Laag | Default |
|---|---|
| Runtime | Node.js Active LTS |
| Package manager | pnpm |
| Frontend | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS, shadcn-compatible component primitives, lucide-react |
| Auth | Supabase Auth via `@supabase/ssr`, cookie-based, PKCE-compatible |
| Database | Supabase Postgres met migrations en RLS |
| Backend | Next.js Server Actions en Route Handlers, Supabase client per request |
| Hosting | Vercel met Supabase integration/env vars |
| Testing | Playwright e2e, later uitbreiden met unit tests waar zinvol |

## Template-eindstaat

```txt
project-root/
  src/
    app/
      (auth)/login/
      (app)/dashboard/
      auth/confirm/
      auth/error/
    components/
      ui/
    lib/
      supabase/
  supabase/
    migrations/
    seed.sql
  tests/
    e2e/
  Docs/
  .agents/
  .claude/
  .env.example
  package.json
```

## Auth-regels

- `src/lib/supabase/client.ts` is alleen voor Client Components.
- `src/lib/supabase/server.ts` maakt per server request een nieuwe client.
- `src/lib/supabase/proxy.ts` ververst cookies en doet alleen grove route-redirects.
- Bescherming van data gebeurt in Supabase RLS. Next.js redirects zijn UX en defense-in-depth.
- Gebruik `supabase.auth.getUser()` op serverroutes waar echte autorisatie nodig is.
- Service-role keys zijn alleen toegestaan in server-only code en nooit in `NEXT_PUBLIC_*`.

## Supabase-regels

- Elke tabel die persoonsgegevens of klantdata bevat krijgt RLS voordat de app live gaat.
- Migrations zijn leidend; handmatige dashboard-aanpassingen worden achteraf als migration vastgelegd.
- Generated database types horen in `src/lib/database.types.ts`.
- Nieuwe env vars gaan in `.env.example` en `Docs/dependencies.md`.

## Projectstart-runbook

1. Kloon de template naar een nieuwe projectmap.
2. Hernoem projectnaam in `package.json`, README en relevante Docs.
3. Maak Supabase project aan.
4. Kopieer `.env.example` naar `.env.local`.
5. Vul `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
6. Run `pnpm install`.
7. Start lokaal met `pnpm dev`.
8. Pas Supabase auth redirect URLs aan:
   - lokaal: `http://localhost:3000/auth/confirm`
   - productie: `https://<domain>/auth/confirm`
9. Koppel Vercel aan GitHub en Supabase.
10. Run fase 1 t/m 4 van de Project Accelerator.

## Wanneer afwijken?

Wijk alleen af als het project dit echt vraagt:

- geen auth nodig: Supabase auth-routes blijven uit de MVP of worden verwijderd;
- zware relationele domeinlogica: overweeg Drizzle/Kysely bovenop Supabase Postgres;
- enterprise SSO: overweeg Supabase SSO, Auth.js, Clerk of klant-IdP;
- veel background work: voeg queue/worker toe buiten de Vercel request lifecycle;
- AI-heavy app: leg modelproviders, streaming en kostenlimieten expliciet vast in `technical-design.md`.
