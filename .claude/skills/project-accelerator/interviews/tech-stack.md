# Interview — Tech Stack (fase 4)

> **Doel:** definitieve technische keuzes voor `technical-design.md`. Wat hier vastligt is wat we bouwen.
>
> **Hoe te gebruiken:** stel ALLE vragen in één bericht. 🔴 = blokkerend, 🟡 = mag later.

## 🖥️ Frontend
🔴 Framework + versie (Next.js 15, Vite + React, Astro, …)?
🔴 Styling (Tailwind, CSS modules, vanilla, …)?
🔴 Component library (eigen, shadcn, MUI, …)?
🔴 State management (Zustand, Redux, Tanstack Query, server state alleen)?
🟡 SSR / SSG / CSR / hybride?

## 🔧 Backend
🔴 Stack (Node, Bun, Python, Go, .NET, …)?
🔴 Framework (Next API routes, Express, FastAPI, NestJS, …)?
🔴 ORM (Prisma, Drizzle, SQLAlchemy, …)?
🔴 API-stijl (REST, GraphQL, tRPC, RPC)?

## 🗄️ Database
🔴 Type (Postgres, MySQL, SQLite, Mongo, …)?
🔴 Hosting (Supabase, Neon, RDS, eigen VPS, …)?
🔴 Migration tooling?
🟡 Backups & retention?

## 🔐 Auth
🔴 Provider (NextAuth/Auth.js, Clerk, Supabase Auth, eigen, …)?
🔴 Methodes (e-mail/pwd, OAuth providers, SSO, magic link)?
🔴 Sessie-strategie (cookies, JWT)?
🟡 MFA?

## ☁️ Hosting & infra
🔴 Hosting (Vercel, Netlify, Fly, Railway, AWS, …)?
🔴 Domein + DNS waar?
🔴 SSL automatisch?
🟡 CDN?

## 🚀 CI/CD
🔴 Git provider (GitHub, GitLab, …)?
🔴 CI tool (GitHub Actions, GitLab CI, …)?
🔴 Branch-strategie (trunk-based, gitflow, …)?
🔴 Deploy-trigger (auto on main, manual, tags)?

## 📊 Observability
🔴 Error tracking (Sentry, Highlight, …)?
🟡 APM / metrics (Datadog, Grafana, Vercel Analytics)?
🟡 Log aggregation?
🟡 Uptime monitoring?

## 🧪 Testing
🔴 Unit (Vitest, Jest, pytest, …)?
🔴 E2E (Playwright, Cypress, …)?
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
