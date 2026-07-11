# Developer Guide

> Practical, day-to-day guide for developing, testing, and extending the Vestara Admin Dashboard monorepo.

This guide complements the [API documentation](../api/README.md) and the [Architecture Decision Records](./decisions/README.md). For infrastructure and release steps, see the [Deployment Guide](./DEPLOYMENT.md).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Repository Layout](#repository-layout)
- [Common Commands](#common-commands)
- [Environment Configuration](#environment-configuration)
- [How the Monorepo Builds](#how-the-monorepo-builds)
- [Adding a Backend Feature](#adding-a-backend-feature)
- [Adding a Frontend Feature](#adding-a-frontend-feature)
- [Testing](#testing)
- [Code Style & Conventions](#code-style--conventions)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 22+ | Defined in `package.json` `engines` |
| pnpm | 10+ | Use `corepack enable` or `npm i -g pnpm` |
| Prisma Postgres | Hosted | Managed PostgreSQL; no local Postgres required |
| Redis | 8+ | Optional locally; used for cache/sessions (currently unused by deployed API) |
| Git | latest | — |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/evillan0315/vestara-admin-dashboard.git
cd vestara-admin-dashboard

# 2. Install dependencies (also generates Prisma Client via postinstall hooks)
pnpm install

# 3. Configure environment
cp .env.example .env
# Fill in DATABASE_URL (from `prisma postgres link`) and JWT secrets.

# 4. Apply database migrations + seed
pnpm prisma migrate dev
pnpm prisma db seed

# 5. Run everything (web + api)
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:5000 (`/api/v1` base path)
- API health: http://localhost:5000/health

---

## Repository Layout

```
vestara-admin-dashboard/
├── apps/
│   ├── api/                # Express 5 backend (@vestara/api)
│   │   ├── src/
│   │   │   ├── config/     # Environment configuration (loads .env)
│   │   │   ├── middleware/ # Security headers, CORS, validation, error handler, auth
│   │   │   ├── repositories/ # Data access (Prisma queries)
│   │   │   ├── routes/     # HTTP route definitions (mounted under /api/v1)
│   │   │   ├── services/   # Business logic
│   │   │   ├── utils/      # JWT, AppError, response envelope, pagination
│   │   │   ├── app.ts      # Express app factory
│   │   │   └── index.ts    # Local server entry (tsx)
│   │   ├── api/index.ts    # Vercel serverless entry (export default app)
│   │   ├── prisma/         # schema.prisma, migrations, seed.ts
│   │   ├── tests/          # vitest integration tests
│   │   └── vercel.json
│   └── web/                # React 19 frontend (@vestara/web)
│       ├── src/
│       │   ├── api/        # API client (axios) + typed hooks
│       │   ├── components/ # Shared UI (layout, common)
│       │   ├── features/   # Feature modules (auth, users, settings, ...)
│       │   ├── layouts/    # navConfig, route composition
│       │   ├── pages/      # Route pages
│       │   ├── styles/     # MUI theme factory (theme.ts)
│       │   └── theme/      # Theme types, tokens, density presets
│       └── vercel.json
├── packages/               # Shared libraries (see below)
├── docs/                   # This folder
├── turbo.json
└── pnpm-workspace.yaml
```

### Shared Packages (`packages/*`)

| Package | Purpose |
|---------|---------|
| `@vestara/types` | DTOs, enums, shared interfaces |
| `@vestara/validation` | Zod schemas + validation helpers |
| `@vestara/constants` | HTTP status codes, error codes, route paths |
| `@vestara/utils` | Shared utility functions |
| `@vestara/config` | Shared configuration helpers |

These are consumed via workspace aliases (`workspace:*`) and resolved by both `tsconfig.json` `paths` and Vite aliases (`@vestara/*`).

---

## Common Commands

Run from the repository root unless noted. Turbo fans commands out to the workspaces.

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run web + api together (persistent watchers) |
| `pnpm dev:web` | Run only the Vite dev server |
| `pnpm dev:api` | Run only the API (`tsx watch src/index.ts`) |
| `pnpm build` | Build all apps/packages (`turbo build`) |
| `pnpm typecheck` | Strict TypeScript check across the repo |
| `pnpm lint` | ESLint across all packages |
| `pnpm format` | Prettier write |
| `pnpm format:check` | Prettier check (CI) |
| `pnpm test` | Run all tests (`turbo test` → `vitest run`) |
| `pnpm prisma:generate` | Regenerate Prisma Client after schema changes |
| `pnpm prisma:migrate` | Create/apply a migration |
| `pnpm prisma:studio` | Open Prisma Studio |
| `pnpm prisma:seed` | Seed development data |
| `pnpm clean` | Remove build artifacts + `node_modules` |

Filter to a single workspace when needed:

```bash
pnpm --filter=@vestara/web build
pnpm --filter=@vestara/api test
```

---

## Environment Configuration

The API reads variables from `.env` at the repo root (loaded by `apps/api/src/config/index.ts` via `dotenv`). The web reads a **different** set: only `VITE_*` variables are exposed to the browser.

### API variables (`.env`)

See [`.env.example`](../../.env.example) for the full list. The most important:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma Postgres connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Signing secrets for access/refresh tokens |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token TTLs (`15m` / `30d`) |
| `CLIENT_URL` / `CORS_ORIGIN` | Allowed frontend origin for CORS |
| `API_URL` | Public API base URL (used for OAuth callback URLs) |
| `GOOGLE_*` / `GITHUB_*` | OAuth provider credentials (optional) |
| `REDIS_URL`, `SMTP_*`, `S3_*` | Cache / email / storage (optional) |

> **Never commit `.env`.** A `.env.example` is committed; real secrets live in the Vercel dashboard (see [Deployment Guide](./DEPLOYMENT.md)).

### Web variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL the browser calls (e.g. `https://vestara-admin-api.vercel.app`). Falls back to `/api/v1` (proxied in dev). |
| `VITE_APP_NAME` | Application display name |

In dev, `vite.config.ts` proxies `/api` → `http://localhost:5000`, so local frontend calls work without `VITE_API_URL`.

---

## How the Monorepo Builds

- **Turborepo** orchestrates tasks (`dev`, `build`, `typecheck`, `lint`, `test`) with dependency graph awareness. `build` depends on `^build` (dependencies build first).
- **API build** is `tsc --noEmit` (type-check only — there is no bundler step for API; Vercel runs the TypeScript source directly via the serverless entry). `prisma generate` runs in `prebuild`/`pretypecheck`.
- **Web build** is `tsc -b && vite build` → emits `apps/web/dist`.
- **Vercel** uses `vercel.json` in each app: the API uses `pnpm turbo build --filter=@vestara/api` and serves `api/index.ts` as a serverless function with a rewrite `/api/(.*) → /api/index`; the web uses `pnpm turbo build --filter=@vestara/web` and serves the static `dist` with an SPA fallback rewrite.

---

## Adding a Backend Feature

Example: a new resource `reports`.

1. **Validation** — add Zod schemas in `@vestara/validation` (or inline under `apps/api/src/routes` if resource-local):

   ```ts
   import { z } from 'zod';
   export const listReportsSchema = z.object({
     page: z.coerce.number().int().min(1).default(1),
     perPage: z.coerce.number().int().min(1).max(100).default(20),
   });
   ```

2. **Repository** (`apps/api/src/repositories/report.repository.ts`) — Prisma queries only. Export a singleton from `repositories/index.ts`.

3. **Service** (`apps/api/src/services/report.service.ts`) — business logic; depends on the repository. Export a singleton.

4. **Route** (`apps/api/src/routes/report.routes.ts`):

   ```ts
   import { Router } from 'express';
   import { authenticate, requireRole } from '../middleware/auth.js';
   import { validate } from '../middleware/validate.js';
   import { listReportsSchema } from '@vestara/validation';
   import { reportService } from '../services/index.js';

   const router = Router();
   router.get('/', authenticate, validate(listReportsSchema), async (req, res, next) => {
     try {
       const result = await reportService.list(req.query);
       res.json({ success: true, data: result.data, meta: result.meta });
     } catch (err) { next(err); }
   });
   export default router;
   ```

5. **Mount** it in `apps/api/src/routes/index.ts` under `/api/v1/reports` (or your chosen path).

### Conventions

- Always return the standard envelope: `{ success: true, data, meta? }` or throw an `AppError` subclass (caught by the central error handler).
- Use `authenticate` + `requireRole('super_admin')` for protected/admin routes.
- Use `validate(schema)` middleware for request bodies/query params.
- Use `next(err)` — never `res.send` inside try/catch error paths.

---

## Adding a Frontend Feature

Example: a new admin page `Analytics`.

1. **API hook** — add a typed query/mutation in `apps/web/src/api/` (axios client + TanStack Query):

   ```ts
   export const useAnalytics = () =>
     useQuery({ queryKey: ['analytics'], queryFn: () => apiClient.get('/analytics').then(r => r.data.data) });
   ```

2. **Page** — create `apps/web/src/pages/AnalyticsPage.tsx`.

3. **Route** — register it in the router (typically `apps/web/src/App.tsx` or the routes module) wrapped in `<ProtectedRoute>`.

4. **Nav** — add an entry to `apps/web/src/layouts/navConfig.ts` if it should appear in the sidebar.

### Conventions

- Path alias `@/` → `apps/web/src/*`; `@vestara/*` → shared packages.
- Forms: React Hook Form + Zod (`@hookform/resolvers/zod`).
- Server state: TanStack Query. UI state: React context (e.g. `AuthContext`).
- Reuse the shared `DataTable`, `StatCard`, `ConfirmDialog`, `Toast` rather than building one-off components.
- Theme: extend `apps/web/src/styles/theme.ts` / `apps/web/src/theme/tokens.ts` — do **not** hardcode colors; read from `theme` or `tokens`.

---

## Testing

- **API**: `vitest` integration tests live in `apps/api/tests/`. They boot the Express app with `supertest` and exercise auth + protected routes end-to-end. Run with `pnpm --filter=@vestara/api test` (or `test:watch`).
- **Web**: component/integration tests are not yet set up. Use the same `vitest` + React Testing Library pattern when added.
- **Before pushing**, run the local quality gate:

  ```bash
  pnpm lint
  pnpm typecheck
  pnpm test
  pnpm build
  ```

---

## Code Style & Conventions

- **TypeScript strict mode** everywhere. Avoid `any`; prefer precise types from `@vestara/types`.
- **ESLint** (flat config) + **Prettier** (with `prettier-plugin-tailwindcss`). Run `pnpm format` before committing.
- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`).
- **Single-responsibility** functions; backend layered as route → service → repository.
- **No secrets** in code or `.env` (committed only `.env.example`).
- Reuse shared packages; do not duplicate validation/types/utils.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| `Cannot find module '@vestara/types'` | Run `pnpm install` (workspace symlinks) and ensure `tsc --noEmit` (which runs `prisma generate`). |
| `PrismaClientInitializationError` / `Pxxxx` | `DATABASE_URL` missing or stale. Re-run `pnpm prisma generate` and check `.env`. |
| API returns 500 on `/auth/refresh` after restart | Refresh-token rotation inserts a new token; ensure the `RefreshToken` table has no leftover unique constraint violations (fixed in `auth.service.ts`). |
| Web build fails with `TS2304: Cannot find name 'fontSize'` or `TS1117` in `theme.ts` | The theme factory expects a `scaleFontSize` helper and a single `components` block — see `apps/web/src/styles/theme.ts`. |
| CORS errors from the browser | Set `CLIENT_URL`/`CORS_ORIGIN` (API) and `VITE_API_URL` (web) to the correct origins for the environment. |
| OAuth redirect mismatch | Ensure `GOOGLE_CALLBACK_URL` / `GITHUB_CALLBACK_URL` (or `API_URL`) match the provider's allowed redirect URIs exactly. |

---

## Further Reading

- [API Documentation](../api/README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Architecture Decision Records](./decisions/README.md)
- [Root README](../../README.md)
