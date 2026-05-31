# Interview — Tech Stack (fase 4)

> **Doel:** definitieve technische keuzes voor `technical-design.md`. Wat hier vastligt is wat we bouwen.
>
> **Hoe te gebruiken:** stel ALLE vragen in één bericht. 🔴 = blokkerend, 🟡 = mag later.
>
> **Default voor New Default webapps:** stel eerst de Next.js/Supabase/Vercel-template voor uit `references/next-supabase-template.md`. Vraag daarna alleen door waar het project afwijkt of meer detail nodig heeft.

## 🧭 Template-fit
🔴 Past dit project in de standaard Next.js + Supabase + Vercel stack?
🔴 Zijn er redenen om af te wijken (enterprise SSO, zware background jobs, bestaande backend, compliance, on-prem, budget)?
🟡 Moet de template ook later als SaaS/subscription basis kunnen doorgroeien?

## 🖥️ Frontend
🔴 Framework + versie (default: Next.js App Router, actuele major)?
🔴 Styling (default: Tailwind, darkmode)?
🔴 Component library (default: shadcn-compatible primitives + lucide)?
🔴 State management (Zustand, Redux, Tanstack Query, server state alleen)?
🟡 SSR / SSG / CSR / hybride?

## 🔧 Backend
🔴 Stack (default: Node.js Active LTS)?
🔴 Framework (default: Next.js Server Actions + Route Handlers)?
🔴 ORM (Prisma, Drizzle, SQLAlchemy, …)?
🔴 API-stijl (REST, GraphQL, tRPC, RPC)?

## 🗄️ Database
🔴 Type (default: Postgres)?
🔴 Hosting (default: Supabase)?
🔴 Migration tooling (default: Supabase migrations)?
🔴 Welke tabellen, RLS policies en generated types zijn MVP?
🟡 Backups & retention?

## 🔐 Auth
🔴 Provider (default: Supabase Auth)?
🔴 Methodes (e-mail/pwd, OAuth providers, SSO, magic link)?
🔴 Sessie-strategie (default: cookie-based SSR via `@supabase/ssr`)?
🔴 Welke routes zijn publiek, protected of role-based?
🟡 MFA?

## ☁️ Hosting & infra
🔴 Hosting (default: Vercel)?
🔴 Domein + DNS waar?
🔴 SSL automatisch?
🟡 CDN?

## 🚀 CI/CD
🔴 Git provider (GitHub, GitLab, …)?
🔴 CI tool (default: Vercel checks + GitHub Actions indien nodig)?
🔴 Branch-strategie (trunk-based, gitflow, …)?
🔴 Deploy-trigger (auto on main, manual, tags)?
🔴 Welke Vercel environments zijn nodig (preview, staging, production)?

## 📊 Observability
🔴 Error tracking (Sentry, Highlight, …)?
🟡 APM / metrics (Datadog, Grafana, Vercel Analytics)?
🟡 Log aggregation?
🟡 Uptime monitoring?

## 🧪 Testing
🔴 Unit (Vitest, Jest, pytest, …)?
🔴 E2E (default: Playwright)?
🟡 Visual regression?
🟡 Coverage-doel?

## 📧 E-mail / notificaties
🔴 Provider (Resend, Postmark, SendGrid, …)?
🔴 Templating (React Email, MJML, plain HTML)?

## 💾 File storage
🟡 Provider (S3, R2, UploadThing, Supabase Storage, …)?
🟡 Bestandsformaten + groottelimieten?

## 💳 Betalingen
🟡 Provider (Stripe, Mollie, …)?
🟡 Subscription / one-off / marketplace?

## 🤖 AI / LLM
🟡 Provider (Anthropic, OpenAI, eigen)?
🟡 Use cases?
🟡 Streaming nodig?

## 🔒 Security & compliance
🔴 AVG-aandachtspunten?
🔴 Secrets management (env vars, Vault, Doppler, …)?
🟡 Pen-test gepland?
🟡 SOC2 / ISO eisen?
