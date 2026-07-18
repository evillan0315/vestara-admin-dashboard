# Quick Start

> Get the Vestara Command Center running locally in under 5 minutes.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 22+ | Check with `node -v` |
| pnpm | 10+ | Install with `corepack enable` or `npm i -g pnpm` |
| Git | latest | — |
| Docker | optional | For local PostgreSQL + Redis |

---

## 1. Clone and Install

```bash
git clone https://github.com/evillan0315/vestara-admin-dashboard.git
cd vestara-admin-dashboard
pnpm install
```

> `pnpm install` also generates the Prisma Client via postinstall hooks.

---

## 2. Configure Environment

```bash
cp .env.example .env
```

The `.env` file is git-ignored. Default values work with the Docker Compose setup.

### Minimum required variables

```env
DATABASE_URL=postgresql://vestara:vestara@localhost:5432/vestara_dev
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:5173
API_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000
```

---

## 3. Start Services

### One-command bootstrap (recommended)

```bash
pnpm dev:local
```

This automatically:
- Starts Docker containers (PostgreSQL 17 + Redis 8)
- Runs database migrations
- Seeds initial data
- Starts both dev servers (API on `:5000`, Web on `:5173`)

### Manual flow

```bash
# Start databases
docker compose up -d

# Run migrations
pnpm prisma migrate dev

# Seed initial data
pnpm prisma db seed

# Start dev servers
pnpm dev
```

---

## 4. Open the App

| Service | URL |
|---------|-----|
| Web App | http://localhost:5173 |
| API | http://localhost:5000 |
| API Health | http://localhost:5000/api/v1/health |
| Prisma Studio | http://localhost:5555 |

### Default login

After seeding, use one of the seeded user accounts. Check `prisma/seed.ts` for credentials.

---

## 5. Verify Everything Works

```bash
# Health check
curl http://localhost:5000/api/v1/health

# Expected response
# { "success": true, "data": { "status": "ok", "version": "1.0.0" } }
```

---

## Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start both API and Web dev servers |
| `pnpm dev:local` | Full bootstrap (Docker + migrate + seed + dev) |
| `pnpm build` | Build both apps for production |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run API integration tests |
| `pnpm test:watch` | Run tests in watch mode |

---

## Troubleshooting

### Port already in use

```bash
# Kill processes on port 5000 (API)
lsof -ti:5000 | xargs kill -9

# Kill processes on port 5173 (Web)
lsof -ti:5173 | xargs kill -9
```

### Database connection refused

```bash
# Ensure Docker is running
docker compose up -d

# Verify PostgreSQL is healthy
docker compose ps
```

### Prisma Client not generated

```bash
pnpm prisma generate
```

### Stale dependencies

```bash
rm -rf node_modules
pnpm install
```

---

## Next Steps

- [Architecture](./assets/architecture/ARCHITECTURE.md) — Understand the system design
- [Developer Guide](./DEVELOPER_GUIDE.md) — Day-to-day development workflow
- [Frontend Guide](./FRONTEND.md) — React, MUI, theming, components
- [Backend Guide](./BACKEND.md) — Express, Prisma, services, routes
- [API Reference](./api/README.md) — Full REST API documentation
