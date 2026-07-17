# Deployment Guide

> How to deploy the Vestara Admin Dashboard (web + API) to Vercel from the `main` branch.

This guide covers the currently used setup: both apps are deployed to **Vercel**. For local development, see the [Developer Guide](./DEVELOPER_GUIDE.md).

> **Prefer to run it on your own server?** See the [Self-Hosted Deployment Guide](./SELF_HOSTED_DEPLOYMENT.md) for a full Ubuntu 24.04 walkthrough (Node + PM2 + Nginx + PostgreSQL + Redis + Let's Encrypt).

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deploy the API](#deploy-the-api)
- [Deploy the Web](#deploy-the-web)
- [Database (Prisma Postgres)](#database-prisma-postgres)
- [OAuth Configuration](#oauth-configuration)
- [Custom Domains](#custom-domains)
- [CI / CD](#cicd)
- [Rollback](#rollback)
- [Monitoring & Health](#monitoring--health)
- [Common Deployment Issues](#common-deployment-issues)

---

## Overview

| App | Package        | Build command                            | Output                               | URL                                    |
| --- | -------------- | ---------------------------------------- | ------------------------------------ | -------------------------------------- |
| API | `@vestara/api` | `pnpm turbo build --filter=@vestara/api` | Serverless function (`api/index.ts`) | `https://vestara-admin-api.vercel.app` |
| Web | `@vestara/web` | `pnpm turbo build --filter=@vestara/web` | Static `dist`                        | `https://vestara-admin-web.vercel.app` |

The API is served as a Vercel serverless function with a rewrite that mounts all routes under `/api/v1`:

```
/api/(.*)  →  /api/index
```

The web is a static SPA with an SPA fallback rewrite and immutable caching for `/assets/*`.

---

## Prerequisites

- A Vercel account with access to the `vestara-admin-dashboard` project (or create two new projects).
- The Git repository connected to Vercel (GitHub: `evillan0315/vestara-admin-dashboard`).
- A **Prisma Postgres** database (managed PostgreSQL) with `DATABASE_URL`.
- Node 22 / pnpm 10 build environment (Vercel detects `pnpm` from `packageManager` in `package.json`).

---

## Environment Variables

Configure these in **each Vercel project's Environment Variables** settings (Production / Preview as needed). They are **not** committed to the repo.

### API project

| Variable                      | Example                                                                  | Notes                                         |
| ----------------------------- | ------------------------------------------------------------------------ | --------------------------------------------- |
| `NODE_ENV`                    | `production`                                                             |                                               |
| `DATABASE_URL`                | `postgres://…@db.prisma.io:5432/postgres?sslmode=require`                | From Prisma Postgres                          |
| `JWT_SECRET`                  | `openssl rand -hex 64`                                                   | Strong random value                           |
| `JWT_REFRESH_SECRET`          | `openssl rand -hex 64`                                                   | Different from `JWT_SECRET`                   |
| `JWT_EXPIRES_IN`              | `15m`                                                                    |                                               |
| `JWT_REFRESH_EXPIRES_IN`      | `30d`                                                                    |                                               |
| `API_URL`                     | `https://vestara-admin-api.vercel.app`                                   | Public base URL; used for OAuth callback URLs |
| `CLIENT_URL` / `CORS_ORIGIN`  | `https://vestara-admin-web.vercel.app`                                   | Allowed browser origin                        |
| `GOOGLE_CLIENT_ID`            | —                                                                        | Optional (see [OAuth](#oauth-configuration))  |
| `GOOGLE_CLIENT_SECRET`        | —                                                                        | Optional                                      |
| `GOOGLE_CALLBACK_URL`         | `https://vestara-admin-api.vercel.app/api/v1/auth/oauth/google/callback` | Optional if `API_URL` set                     |
| `GITHUB_CLIENT_ID`            | —                                                                        | Optional                                      |
| `GITHUB_CLIENT_SECRET`        | —                                                                        | Optional                                      |
| `GITHUB_CALLBACK_URL`         | `https://vestara-admin-api.vercel.app/api/v1/auth/oauth/github/callback` | Optional if `API_URL` set                     |
| `REDIS_URL`, `SMTP_*`, `S3_*` | —                                                                        | Optional (cache/email/storage)                |

> Turbo's `build` task whitelists these variables (see `turbo.json` `env` list); if you add a new env var used at build time, add it there too.

### Web project

| Variable        | Example                                | Notes                                                         |
| --------------- | -------------------------------------- | ------------------------------------------------------------- |
| `VITE_API_URL`  | `https://vestara-admin-api.vercel.app` | Browser-called API base. Falls back to `/api/v1` (dev proxy). |
| `VITE_APP_NAME` | `Vestara Admin`                        | Display name                                                  |

> Only `VITE_*` variables are exposed to the browser. They are inlined at build time, so **changing them requires a redeploy**.

---

## Deploy the API

1. In Vercel, **Add New → Project** and import the repo.
2. Framework preset: **Other** (set `framework: null` — already in `apps/api/vercel.json`).
3. Root Directory: `apps/api`.
4. Build & Output (auto-applied from `apps/api/vercel.json`):
   - Install: `pnpm install`
   - Build: `pnpm turbo build --filter=@vestara/api`
   - Output Directory: `.`
   - Function max duration: `30s`
5. Add the [API environment variables](#environment-variables).
6. Deploy. The function entry is `apps/api/api/index.ts`, which exports the Express app (`createApp()`).

> The API build step is a **type-check** (`tsc --noEmit`), not a bundle. Runtime errors appear in Vercel Function logs.

---

## Deploy the Web

1. **Add New → Project**, import the repo.
2. Framework preset: **Vite** (auto-detected; set in `apps/web/vercel.json`).
3. Root Directory: `apps/web`.
4. Build & Output (from `apps/web/vercel.json`):
   - Install: `pnpm install`
   - Build: `pnpm turbo build --filter=@vestara/web`
   - Output Directory: `dist`
5. Add the [Web environment variables](#environment-variables) (`VITE_API_URL`, `VITE_APP_NAME`).
6. Deploy. SPA fallback and asset caching are configured via `vercel.json`.

---

## Database (Prisma Postgres)

1. Create a Prisma Postgres project and copy the `DATABASE_URL`.
2. Set `DATABASE_URL` in the **API** Vercel project.
3. Apply migrations (run locally or in a CI step):

   ```bash
   pnpm prisma migrate deploy
   ```

4. (Optional) Seed:

   ```bash
   pnpm prisma db seed
   ```

> `prisma generate` runs automatically during the API build (`prebuild`). Use `prisma migrate deploy` (not `migrate dev`) in production.

---

## OAuth Configuration

1. Create OAuth client credentials in the Google Cloud Console / GitHub Developer settings.
2. Add the **authorized redirect URIs** exactly matching the callback URLs:
   - `https://vestara-admin-api.vercel.app/api/v1/auth/oauth/google/callback`
   - `https://vestara-admin-api.vercel.app/api/v1/auth/oauth/github/callback`
3. Put the client ID/secret into the API project's environment variables (`GOOGLE_*` / `GITHUB_*`).
4. Redeploy the API after changing OAuth env vars.

---

## Custom Domains

- In each Vercel project: **Settings → Domains** → add your domain → follow the DNS verification steps.
- Update `API_URL`, `CLIENT_URL`/`CORS_ORIGIN` (API) and `VITE_API_URL` (web) to the new domains, then redeploy both projects.
- Ensure the OAuth provider's redirect URIs are updated to the new API domain.

---

## CI / CD

- **Automatic:** Vercel deploys Preview environments on every PR and Production on push to `main`.
- **GitHub Actions:** `.github/workflows/deploy-api.yml` builds and deploys the API to Vercel on push to `main`. A separate web deployment workflow is still a [roadmap item](https://github.com/evillan0315/vestara-admin-dashboard) (Phase 29).

Recommended pre-merge quality gate (run locally or in CI):

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

---

## Rollback

- **Vercel:** open the deployment, click **… → Rollback** to promote the previous successful build. Instant for the web; for the API it reverts the serverless function.
- Because the API is type-checked (not bundled), also consider reverting the relevant DB migration if a schema change is involved (`prisma migrate resolve` / restore snapshot).

---

## Monitoring & Health

- **API health:** `GET https://<api>//health` returns `{ success: true, data: { status: "healthy", … } }` (no auth required).
- **Function logs:** Vercel Dashboard → Functions → view real-time and historical logs.
- **Frontend:** Vercel provides Analytics/Web Analytics; check the browser console for `VITE_API_URL` resolution issues.

---

## Common Deployment Issues

| Symptom                                              | Cause / Fix                                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| API 500 on first request                             | `DATABASE_URL` missing/stale or Prisma Client not generated. Verify env var and that `prisma generate` ran in build.      |
| CORS error in browser                                | `CLIENT_URL`/`CORS_ORIGIN` (API) or `VITE_API_URL` (web) point at the wrong origin. Update and redeploy both.             |
| 404 on `/api/v1/...`                                 | The API serverless rewrite `/api/(.*) → /api/index` must be present in `apps/api/vercel.json`; confirm the file deployed. |
| OAuth redirect mismatch                              | Callback URL in provider settings must exactly equal `API_URL + /api/v1/auth/oauth/{google,github}/callback`.             |
| Web calls wrong API after domain change              | `VITE_*` vars are baked at build time — change them and **redeploy** the web project.                                     |
| Web build fails with `TS2304`/`TS1117` in `theme.ts` | Theme factory expects a single `components` block and a `scaleFontSize` helper; see `apps/web/src/styles/theme.ts`.       |
