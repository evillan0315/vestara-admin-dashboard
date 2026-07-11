# ADR 0005 — Vercel deployment (API serverless + static web)

- Status: Accepted
- Date: 2026-07-12

## Context

We wanted zero-infrastructure deployment with fast CI on push to `main`, separate build outputs for the static SPA and the API, and minimal operational overhead.

## Decision

Deploy both apps to **Vercel** from the `main` branch:

- **Web** (`@vestara/web`): built with `pnpm turbo build --filter=@vestara/web` (`tsc -b && vite build`); static output in `dist`; SPA fallback rewrite `/((?!assets/).*) → /index.html`; long-cache headers on `/assets/*`. Exposes `VITE_API_URL` for the API base.
- **API** (`@vestara/api`): built with `pnpm turbo build --filter=@vestara/api` (type-check only); served as a **Vercel serverless function** from `apps/api/api/index.ts` (exports the Express app via `createApp()`). A rewrite `/api/(.*) → /api/index` mounts all routes under the function. `maxDuration: 30s`.

All secrets (`DATABASE_URL`, `JWT_SECRET`, OAuth credentials, etc.) are configured in the Vercel project dashboard, not in source control. The Turbo `build` task whitelists the required environment variables.

## Consequences

- **Positive:** No servers to manage; automatic preview deployments; env isolation; instant rollbacks via Vercel.
- **Negative:** Serverless cold starts; `maxDuration` cap (30s) limits long-running jobs (background workers/BullMQ deferred); the API is type-checked, not bundled, so runtime errors surface in Vercel logs.
- **Follow-up:** Add a GitHub Actions CI to run lint/typecheck/tests before deploy; consider a dedicated backend host if long-running jobs are needed.
