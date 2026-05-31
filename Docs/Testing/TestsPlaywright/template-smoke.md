# Template smoke tests

Deze permanente smoke tests horen bij de Next/Supabase template en staan in `tests/e2e/smoke.spec.ts`.

## Dekking

- Home/cockpit rendert.
- Loginpagina is bereikbaar.
- Protected dashboard redirect unauthenticated users naar `/login`.

## Run

```bash
pnpm test:e2e
```

Breid deze tests in fase 4 uit met project-specifieke MVP-flows en Supabase testdata.
