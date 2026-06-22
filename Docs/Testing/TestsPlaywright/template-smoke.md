# Template smoke tests

Deze smoke tests stammen uit de oude Next/Supabase-templatebasis en staan in `tests/e2e/smoke.spec.ts`. Voor Edge Terminal worden ze omgebouwd naar demo/local-mode regressietests zonder Supabase-testproject.

## Dekking

- Home/cockpit rendert.
- Loginpagina is bereikbaar.
- In local mode is `/login` een status/entry-scherm; verplichte auth hoort pas bij een latere Supabase-deploy.

## Run

```bash
pnpm test:e2e
```

Breid deze tests uit met project-specifieke MVP-flows, demo-fixtures en lokale SQLite-fixtures.
