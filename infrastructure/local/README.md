# Local Development Setup — Vestara Admin Dashboard

Run the full stack on `localhost` with Docker for the backing services and the
Vite + Express dev servers for the apps.

## Topology (local)

```
Browser ── http://localhost:5173 ──► Vite dev server (web)
                                        │  /api/*  (proxy)
                                        ▼
                                   Express API :5000  ──► PostgreSQL :5432
                                        │                    Redis      :6379
                                        ▼ (lazy, optional)
                                   WebSocket realtime layer
```

The web client uses a **relative** API base (`/api/v1`). Vite proxies
`/api` → `http://localhost:5000`, so no CORS configuration is needed and you
do **not** need to set `VITE_API_URL`.

## Prerequisites

- Node.js 22+ and pnpm 10+
- Docker + Docker Compose (for Postgres / Redis)

## 1. Start the backing services

```bash
docker compose up -d          # Postgres 17 + Redis 8
docker compose ps             # verify both are "healthy"
```

- Postgres: `vestara_user` / `vestara_password` / db `vestara_db` (port 5432)
- Redis: port 6379

These credentials match the `DATABASE_URL` / `REDIS_URL` in the repo-root `.env`.

## 2. Configure environment

A git-ignored `.env` at the repo root is already provided for local dev (see
`.env.example` for the template). It is loaded automatically by both the API
(`apps/api/src/config` reads the repo-root `.env`) and Vite (`envDir` = repo
root).

To regenerate or customize:

```bash
cp .env.example .env
# then edit DATABASE_URL / secrets as needed
```

## 3. Initialize the database

```bash
pnpm prisma generate
pnpm prisma migrate dev        # create tables in local Postgres
pnpm prisma:seed               # seed orgs + users + settings + audit logs
```

## 4. Run the apps

```bash
pnpm install
pnpm dev                       # starts web (:5173) + api (:5000) via turbo
```

Or individually:

```bash
pnpm dev:api                  # Express API on http://localhost:5000
pnpm dev:web                  # Vite dev server on http://localhost:5173
```

## 5. Verify

- API health: `curl http://localhost:5000/api/v1/health`
- Web: open `http://localhost:5173` and log in with a seeded user.

> **Redis is optional locally.** It is only used by the WebSocket realtime
> layer, which connects lazily. The API boots and serves REST without Redis;
> realtime features simply degrade. Start Redis with `docker compose up -d`
> to enable live notifications / presence.

## Teardown

```bash
docker compose down            # stop, keep data
docker compose down -v         # stop and wipe volumes
```
