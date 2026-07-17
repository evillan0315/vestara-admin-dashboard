# Self-Hosted Deployment Guide

> **Live at** [`vestara.meetlily.org`](https://vestara.meetlily.org) — Ubuntu 22.04 VPS, Nginx + Let's Encrypt TLS, PM2, PostgreSQL 17, Redis 8.

This guide explains how to deploy the **Vestara Admin Dashboard** on your own
server (e.g. an Ubuntu 22.04 LTS VPS), fully under your control — no Vercel
required.

The application is a pnpm/Turborepo monorepo:

| App        | Stack                                   | What it is                                                   |
| ---------- | --------------------------------------- | ------------------------------------------------------------ |
| `apps/api` | Express 5 + Prisma + PostgreSQL + Redis | The REST + WebSocket API. Runs as a long-lived Node process. |
| `apps/web` | React 19 + Vite + MUI                   | A static SPA. Built once and served by Nginx.                |

Why a long-running Node process? The API hosts **live features over
WebSockets** (`/api/v1/ws`) and **background jobs via BullMQ** (report
generation). Serverless platforms (e.g. Vercel functions) cannot hold
persistent WebSocket connections, so a self-hosted Node process is the
recommended topology for production.

---

## Table of Contents

- [Architecture & Topology](#architecture--topology)
- [Server Requirements](#server-requirements)
- [Option A — Automated Server Bootstrap](#option-a--automated-server-bootstrap)
- [Option B — Manual Installation](#option-b--manual-installation)
  - [1. System packages & users](#1-system-packages--users)
  - [2. Node.js 24 + pnpm](#2-nodejs-24--pnpm)
  - [3. PostgreSQL](#3-postgresql)
  - [4. Redis](#4-redis)
  - [5. Get the code](#5-get-the-code)
  - [6. Install dependencies](#6-install-dependencies)
  - [7. Environment configuration](#7-environment-configuration)
  - [8. Database migration & seed](#8-database-migration--seed)
  - [9. Build](#9-build)
  - [10. Run the API (PM2)](#10-run-the-api-pm2)
  - [11. Serve the frontend + proxy the API (Nginx)](#11-serve-the-frontend--proxy-the-api-nginx)
  - [12. TLS with Let's Encrypt](#12-tls-with-let-s-encrypt)
- [OAuth (Google / GitHub)](#oauth-google--github)
- [Updating / Redeploying](#updating--redeploying)
- [Automated Deployment (SSH)](#automated-deployment-ssh)
- [Health Checks & Logs](#health-checks--logs)
- [Scaling Notes](#scaling-notes)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

---

## Architecture & Topology

The simplest, most robust topology is a **single domain** where Nginx serves
the SPA at `/` and reverse-proxies `/api/v1` (and the `/socket.io/` path
used by the real-time Socket.IO layer) to the API process:

```
                         ┌─────────────────────────────────────┐
   Browser ── HTTPS ───► │  Nginx (vestara.meetlily.org)        │
                         │    /            → static SPA (dist)  │
                         │    /api/v1/*     → 127.0.0.1:5000     │
                         │    /socket.io/*  → 127.0.0.1:5000 (WS)│
                         └───────────────┬─────────────────────┘
                                         │
                         ┌───────────────▼─────────────────────┐
                         │  Node API  (PM2, port 5000)          │
                         │    Express + WebSocket + BullMQ      │
                         └──────┬───────────────────┬──────────┘
                                │                   │
                         ┌──────▼──────┐      ┌─────▼─────┐
                         │ PostgreSQL  │      │  Redis    │
                         └─────────────┘      └───────────┘
```

**Key addresses (single-domain):**

| Path                                         | Served by                    |
| -------------------------------------------- | ---------------------------- |
| `https://vestara.meetlily.org/`              | SPA (`apps/web/dist`)        |
| `https://vestara.meetlily.org/api/v1/*`      | API (`apps/api`)             |
| `https://vestara.meetlily.org/socket.io/*`   | Real-time Socket.IO endpoint |
| `https://vestara.meetlily.org/api/v1/health` | Health check                 |

Because the frontend uses a **relative** API base (`/api/v1` by default), no
frontend environment variable is required for the single-domain setup. OAuth
redirects are derived from `window.location.origin`, so they also just work.

> **Subdomain variant (optional):** If you prefer `app.example.com` (frontend)
> and `api.example.com` (backend), set `VITE_API_URL=https://api.example.com/api/v1`
> and `CORS_ORIGIN=https://app.example.com`, and point each DNS record at the
> server. The rest of this guide assumes the single-domain layout.

---

## Server Requirements

| Resource | Minimum                   | Recommended (production) |
| -------- | ------------------------- | ------------------------ |
| CPU      | 1 vCPU                    | 2–4 vCPU                 |
| RAM      | 1 GB                      | 4 GB                     |
| Disk     | 20 GB SSD                 | 40 GB SSD                |
| OS       | Ubuntu 24.04 LTS          | Ubuntu 24.04 LTS         |
| Network  | IPv4 + DNS A/AAAA records | —                        |

Open ports: `22` (SSH), `80` (HTTP→HTTPS), `443` (HTTPS). The API port `5000`
stays bound to `127.0.0.1` and is **not** exposed publicly.

---

## Option A — Automated Server Bootstrap

A helper script `setup-production-server.sh` (run as **root**) installs the
operating-system layer for you: system updates, a `deployer` user with
passwordless sudo, SSH hardening, UFW firewall, Fail2Ban, Nginx, Node.js 24,
PM2, PostgreSQL, Redis, Docker, Certbot (Let's Encrypt), kernel tuning, and
log rotation.

```bash
# Edit the variables at the top of the script first (DOMAIN, DB password, etc.)
sudo ./setup-production-server.sh
```

The script provisions the stack but **not** the application code or env files —
complete those steps manually from [§5](#5-get-the-code) onward. Review the
script and set a strong `POSTGRES_PASSWORD` and your real `DOMAIN` before
running it.

> The script configures an Nginx site that proxies `/` to port `3000`. That is
> **outdated for this app** (the API listens on `5000` and mounts `/api/v1`).
> Replace that Nginx config with the one in [§11](#11-serve-the-frontend--proxy-the-api-nginx).

---

## Option B — Manual Installation

### 1. System packages & users

```bash
sudo apt update && sudo apt -y upgrade
sudo apt install -y curl wget git build-essential ca-certificates \
  gnupg unzip ufw fail2ban nginx postgresql postgresql-contrib redis-server

# Create a non-root deploy user (optional but recommended)
sudo adduser --disabled-password --gecos "" deployer
sudo usermod -aG sudo deployer
```

Enable the firewall:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 2. Node.js 24 + pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Enable pnpm via Corepack (ships with Node 24)
sudo corepack enable
sudo corepack prepare pnpm@latest --activate
node -v && pnpm -v
```

### 3. PostgreSQL

```bash
sudo systemctl enable --now postgresql
sudo -u postgres psql <<'SQL'
CREATE DATABASE vestara_db;
CREATE USER vestara_user WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE vestara_db TO vestara_user;
ALTER USER vestara_user WITH SUPERUSER;
SQL
```

You will use this connection string in the env file:

```
DATABASE_URL=postgresql://vestara_user:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:5432/vestara_db?schema=public
```

### 4. Redis

```bash
sudo sed -i 's/^supervised .*/supervised systemd/' /etc/redis/redis.conf
sudo sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis/redis.conf
sudo systemctl enable --now redis-server
redis-cli ping   # => PONG
```

### 5. Get the code

```bash
sudo mkdir -p /var/www/app
sudo chown -R deployer:deployer /var/www/app
cd /var/www/app
git clone <your-repo-url> .
# or: git clone <url> vestara && mv vestara/* vestara/.* . 2>/dev/null
```

Work as the `deployer` user for the remaining steps.

### 6. Install dependencies

```bash
cd /var/www/app
pnpm install --frozen-lockfile
```

> The API reads its runtime configuration from a **repo-root `.env`** file
> (see `apps/api/src/config/index.ts`). Place `.env` at `/var/www/app/.env`.

### 7. Environment configuration

**API — `/var/www/app/.env`** (production example):

```bash
# ── Core ───────────────────────────────────────
NODE_ENV=production

# API listens on 0.0.0.0:5000; Nginx proxies /api/v1 to it.
PORT=5000
API_URL=https://vestara.meetlily.org

# CORS / OAuth origin = your public frontend origin
CORS_ORIGIN=https://vestara.meetlily.org
CLIENT_URL=https://vestara.meetlily.org

# ── Database ───────────────────────────────────
DATABASE_URL=postgresql://vestara_user:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:5432/vestara_db?schema=public

# ── Redis (cache, sessions, BullMQ) ────────────
REDIS_URL=redis://127.0.0.1:6379

# ── JWT (generate two strong random secrets) ───
JWT_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# ── OAuth (optional; see §OAuth) ───────────────
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GOOGLE_CALLBACK_URL=https://vestara.meetlily.org/api/v1/auth/oauth/google/callback
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
# GITHUB_CALLBACK_URL=https://vestara.meetlily.org/api/v1/auth/oauth/github/callback

# ── AI / Integrations (optional) ───────────────
# OPENCODE_API_KEY=

# ── File storage (optional; LOCAL is default) ──
UPLOAD_PATH=./uploads
CLOUDINARY_CLOUD_NAME=  CLOUDINARY_API_KEY=  CLOUDINARY_API_SECRET=
# S3-compatible storage uses the AWS-conventional names below.
S3_ENDPOINT=  S3_BUCKET=  S3_REGION=us-east-1
S3_ACCESS_KEY_ID=  S3_SECRET_ACCESS_KEY=

# ── AI / Integrations (optional) ───────────────
# OPENCODE_API_KEY=
# VERCEL_AI_GATEWAY_API_KEY=
OPENCODE_BASE_URL=https://opencode.ai/zen/v1

# ── Email (optional) ───────────────────────────
# SMTP_HOST=  SMTP_PORT=587  SMTP_USER=  SMTP_PASSWORD=  SMTP_FROM=noreply@example.com

LOG_LEVEL=info
```

> Never commit `.env`. It is git-ignored. Keep backups of secrets in a password manager.
>
> A complete, copy-ready template of every production variable (including SMTP,
> Cloudinary, S3, AI keys, and the web `VITE_*` build vars) is provided at
> **`.env.deploy.example`** in the repo root — copy it to `.env.deploy` and
> fill in values, then export them into the API's environment at launch.

**Frontend — `/var/www/app/apps/web/.env`** (optional for single-domain):

```bash
# Defaults to "/api/v1" (relative) — only set if using a separate API domain.
# With a separate API domain, point it at the API base URL:
VITE_API_URL=https://vestara.meetlily.org/api/v1
VITE_APP_NAME=Vestara
```

### 8. Database migration & seed

```bash
cd /var/www/app

# Generate the Prisma client
pnpm exec prisma generate --schema apps/api/prisma/schema.prisma

# Apply migrations (use `migrate deploy`, not `migrate dev`, in production)
pnpm exec prisma migrate deploy --schema apps/api/prisma/schema.prisma

# (Optional) Seed initial organization + users
pnpm prisma:seed
```

> Run Prisma commands from the repo root so it picks up the root `.env`
> (`DATABASE_URL`). If your `.env` lives elsewhere, prefix with
> `DATABASE_URL=...`.

### 9. Build

```bash
cd /var/www/app
pnpm build
```

This builds both apps via Turborepo:

- `apps/api` → compiled to `apps/api/dist/` (API reads `dist/index.js`)
- `apps/web` → static bundle in `apps/web/dist/`

### 10. Run the API (PM2)

The process definition is version-controlled at
**`infrastructure/pm2/ecosystem.config.cjs`**. It runs a single forked instance
(required for in-process WebSocket + BullMQ state) and **auto-loads
`.env.deploy`** at startup, so runtime secrets stay in one git-ignored place.

```js
// infrastructure/pm2/ecosystem.config.cjs (excerpt)
module.exports = {
  apps: [
    {
      name: 'vestara-api',
      cwd: '/var/www/app',
      script: 'apps/api/dist/index.js',
      exec_mode: 'fork', // single instance: WebSocket + BullMQ share in-process state
      instances: 1,
      env: { /* merged from .env.deploy */ NODE_ENV: 'production' },
      error_file: '/var/www/logs/api-error.log',
      out_file: '/var/www/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
```

Start and persist across reboots:

```bash
cd /var/www/app
mkdir -p /var/www/logs
pnpm exec pm2 start infrastructure/pm2/ecosystem.config.cjs --env production
pnpm exec pm2 save
pnpm exec pm2 startup   # follow the printed command to enable the systemd unit
```

Verify:

```bash
curl -i http://127.0.0.1:5000/api/v1/health
# => 200 {"success":true,"data":{...}}
```

### 11. Serve the frontend + proxy the API (Nginx)

The canonical, production-ready Nginx site config lives at
**`infrastructure/nginx/vestara.meetlily.org.conf`** in the repo. It implements
the single-domain topology: SPA at `/`, API reverse-proxied at `/api/v1`,
WebSocket upgrades on `/api/v1/ws` and `/socket.io/`, 100 MB upload limit, TLS
hardening, and security headers. Copy it into place:

```bash
sudo cp infrastructure/nginx/vestara.meetlily.org.conf \
         /etc/nginx/sites-available/vestara
sudo ln -sf /etc/nginx/sites-available/vestara /etc/nginx/sites-enabled/vestara
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

> This mirrors the **live** `/etc/nginx/sites-enabled/vestara` on the server:
> the API is mounted at `/api/v1/`, real-time traffic uses Socket.IO at
> `/socket.io/`, uploads up to 100 MB are allowed, and the SPA is served from
> `/var/www/vestara` (the path `scripts/deploy.sh` deploys to). The config
> already contains the HTTP→HTTPS redirect server block; Certbot adds the
> certificate paths and the `listen 443 ssl;` lines on first issuance.

> Note: `/api/v1/` is proxied **with** the prefix intact
> (`/api/v1/health` → `http://127.0.0.1:5000/api/v1/health`), which matches
> the API's mount point. The `Upgrade`/`Connection` headers enable WebSocket
> traffic on `/api/v1/ws`, while the dedicated `/socket.io/` location handles
> the Socket.IO real-time layer.

### 12. TLS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d vestara.meetlily.org --agree-tos -m admin@example.com --redirect
sudo systemctl enable --now certbot.timer
```

Certbot auto-edits the Nginx config to add the certificate paths and HTTPS
redirect. Reload Nginx once more, then visit `https://vestara.meetlily.org`.

---

## OAuth (Google / GitHub)

1. Create an OAuth app in the provider console. 2. Set the **Authorized redirect URI** to:
   - Google: `https://vestara.meetlily.org/api/v1/auth/oauth/google/callback`
   - GitHub: `https://vestara.meetlily.org/api/v1/auth/oauth/github/callback`
2. Paste the client ID/secret into the root `.env`
   (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, and the
   GitHub equivalents).
3. Restart the API: `pnpm exec pm2 start infrastructure/pm2/ecosystem.config.cjs --env production --update-env || pnpm exec pm2 restart vestara-api`.

If you change `API_URL` or use a separate API domain, make sure each
`*_CALLBACK_URL` matches the exact origin the browser uses — the backend
validates the callback host.

---

## Updating / Redeploying

```bash
cd /var/www/app
git pull --ff-only

pnpm install --frozen-lockfile
pnpm exec prisma generate --schema apps/api/prisma/schema.prisma
pnpm exec prisma migrate deploy --schema apps/api/prisma/schema.prisma
pnpm build

pnpm exec pm2 start infrastructure/pm2/ecosystem.config.cjs --env production --update-env || pnpm exec pm2 restart vestara-api
# Frontend is static — Nginx already serves the new dist/ after build
sudo systemctl reload nginx
```

For zero-downtime API restarts, PM2 restarts the single forked process
quickly; the Nginx proxy will briefly return 502 during the restart window
(typically < 1s).

---

## Automated Deployment (SSH)

Instead of running the manual steps above on every change, `scripts/deploy.sh`
pushes the built frontend to the server over **SSH with public-key
authentication** (no passwords) and swaps it in atomically. A GitHub Actions
workflow runs it automatically on every push to `main`.

### 1. SSH key setup (public key on the server)

On the machine that will run the deploy (your laptop, or the CI runner),
generate a key pair if you don't have one:

```bash
ssh-keygen -t ed25519 -C "deploy@vestara" -f ~/.ssh/vestara_deploy
```

Copy the **public** key to the server's `deployer` account (the private key
stays local / in CI secrets):

```bash
ssh-copy-id -i ~/.ssh/vestara_deploy.pub deployer@your-server.example.com
# or manually:
cat ~/.ssh/vestara_deploy.pub | ssh deployer@your-server.example.com \
  'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

The server must allow `PubkeyAuthentication` (the `setup-production-server.sh`
script already hardens SSH to key-only). Test the connection:

```bash
ssh -i ~/.ssh/vestara_deploy deployer@your-server.example.com 'echo ok'
```

### 2. Configure the deploy

Copy the template and fill in your values (this file is git-ignored):

```bash
cp deploy.env.example deploy.env
$EDITOR deploy.env
```

| Variable                         | Meaning                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `DEPLOY_HOST`                    | Server IP or domain (required)                                                                              |
| `DEPLOY_USER`                    | SSH user (default `deployer`)                                                                               |
| `DEPLOY_SSH_KEY`                 | Path to the **private** key used for auth                                                                   |
| `DEPLOY_REMOTE_PORT`             | SSH port (default `22`)                                                                                     |
| `DEPLOY_WEB_PATH`                | Remote Nginx web root (default `/var/www/vestara`)                                                          |
| `DEPLOY_RELEASES_DIR`            | Where timestamped releases are stored (default `/var/www/releases`)                                         |
| `DEPLOY_KEEP_RELEASES`           | How many past releases to keep (default `5`)                                                                |
| `DEPLOY_WEB_ROOT_GROUP`          | Group that should own web files (default `www-data`)                                                        |
| `DEPLOY_API` / `DEPLOY_API_PATH` | Also copy `.env.deploy` + pull/build/restart the API remotely via `infrastructure/pm2/ecosystem.config.cjs` |

### 3. Deploy

```bash
# Build web locally, then deploy (default):
./scripts/deploy.sh

# Deploy an already-built dist/ (e.g. from CI):
./scripts/deploy.sh --no-build

# Also redeploy the API on the server:
./scripts/deploy.sh --api

# Override any setting via flags:
./scripts/deploy.sh --host example.com --user deployer --key ~/.ssh/vestara_deploy
```

What the script does:

1. Optionally builds `apps/web`.
2. Uploads `apps/web/dist/` to a new timestamped release dir
   (`/var/www/releases/vestara-<timestamp>`) via `rsync` over SSH.
3. **Safety gate**: aborts if the upload produced 0 files (avoids pointing Nginx at an empty release).
4. Fixes ownership/permissions for the web server user.
5. Atomically swaps the web root symlink to the new release
   (`ln -sfn … && mv -Tf`) — Nginx never serves a half-written build.
6. Prunes old releases beyond `DEPLOY_KEEP_RELEASES`.
7. Runs `nginx -t && systemctl reload nginx`.
8. Optionally (`--api`) pulls, installs, **fixes ownership** (handles root-owned files from previous sudo builds), **cleans stale `tsconfig.tsbuildinfo`**, builds packages, pushes schema via `prisma db push`, builds the API, and restarts via PM2.
9. Runs `/api/v1/health` and SPA health checks.

### 4. GitHub Actions (zero-click on push)

`.github/workflows/deploy-selfhosted.yml` builds the web app and runs
`scripts/deploy.sh --no-build` on every push to `main` (for web-relevant
changes). Add these **repository secrets** (Settings → Secrets → Actions):

| Secret            | Value                                           |
| ----------------- | ----------------------------------------------- |
| `DEPLOY_HOST`     | Server host                                     |
| `DEPLOY_USER`     | SSH user (`deployer`)                           |
| `DEPLOY_WEB_PATH` | Remote web root (`/var/www/vestara`)            |
| `DEPLOY_SSH_KEY`  | The **private** key contents (`vestara_deploy`) |

Trigger an API redeploy from a workflow run with the **API** input enabled, or
set `DEPLOY_API=true` in `deploy.env`. The private key is written to a
`chmod 600` file on the runner and removed afterwards.

> The deploy user needs passwordless sudo for `chown`/`nginx`/`systemctl`
> (the bootstrap script grants `deployer ALL=(ALL) NOPASSWD:ALL`).

---

## Health Checks & Logs

- **API health:** `GET /api/v1/health` → `200 OK`.
- **WebSocket status (admin):** `GET /api/v1/ws/status` (legacy WS) — real-time
  traffic also flows over Socket.IO at `/socket.io/`.
- **API logs:** `pnpm exec pm2 logs vestara-api` or `/var/www/logs/api-*.log`.
- **Nginx logs:** `/var/log/nginx/vestara.access.log`, `/var/log/nginx/vestara.error.log`.
- **PostgreSQL:** `sudo -u postgres psql -d vestara_db -c "SELECT 1"`.
- **Redis:** `redis-cli ping`.

External monitoring (optional): point Uptime-Kuma / Healthchecks.io at
`https://vestara.meetlily.org/api/v1/health`.

---

## Scaling Notes

- **Keep one API instance** by default. WebSockets and the BullMQ worker share
  in-process state; multiple forks would each open their own WS/BullMQ context.
- If you need more throughput, run **additional stateless API instances behind
  Nginx** and enable the **Socket.IO Redis adapter** (the `@socket.io/redis-adapter`
  dependency is already present) plus **sticky sessions** — required only if
  you scale WebSockets horizontally.
- The **frontend is fully static** and can be served from multiple Nginx nodes
  or a CDN; nothing is stateful on the web side.
- PostgreSQL and Redis should be on their own managed/backed-up instances for
  larger deployments.

---

## Security Checklist

- [ ] Firewall enabled (only 22/80/443 open); API port `5000` not public.
- [ ] SSH key-only auth, `PermitRootLogin no` (the bootstrap script does this).
- [ ] Fail2Ban enabled.
- [ ] Strong unique `JWT_SECRET` / `JWT_REFRESH_SECRET` (64-byte hex).
- [ ] `DATABASE_URL` uses a dedicated DB user with a strong password.
- [ ] TLS via Let's Encrypt with auto-renew; HSTS enabled.
- [ ] `.env` is git-ignored and backed up securely (not in the repo).
- [ ] Automatic security updates: `sudo apt install -y unattended-upgrades`.
- [ ] Regular PostgreSQL backups (`pg_dump`) and off-site copies.
- [ ] CORS restricted to your real frontend origin (no `*` in production).
- [ ] File uploads: prefer S3-compatible/Cloudinary over LOCAL for durability,
      or back up the local upload directory.

---

## Troubleshooting

| Symptom                                                | Likely cause / fix                                                                                                                                                                                              |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `502 Bad Gateway` on `/api/*`                          | API not running or wrong port. Check `pm2 status` and that `PORT=5000` matches the Nginx `proxy_pass`.                                                                                                          |
| `502` only on first load after restart                 | Brief restart window; expected. Use `pm2 reload` for graceful restart.                                                                                                                                          |
| CORS error in browser console                          | `CORS_ORIGIN` doesn't match the browser origin. Set it to the exact `https://vestara.meetlily.org`.                                                                                                             |
| `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` in API logs       | Nginx sends `X-Forwarded-For` but Express doesn't trust it. The fix is `app.set('trust proxy', 1)` in `apps/api/src/app.ts` (already applied).                                                                  |
| `GET /settings/:key` returns 404 for optional settings | The setting doesn't exist yet. The fix is to use the non-throwing `findByKey()` in `SettingsService` (already applied) — returns `null` gracefully.                                                             |
| `401` immediately after login on reload                | Access token expired and refresh failed. Ensure `JWT_REFRESH_SECRET` matches across restarts and `REDIS_URL` is reachable (refresh tokens/sessions may use Redis).                                              |
| `PrismaClientInitializationError`                      | `DATABASE_URL` missing or wrong. Run Prisma from repo root where `.env` lives.                                                                                                                                  |
| Migrations fail                                        | Use `prisma migrate deploy` (not `dev`) in production; ensure DB user has DDL rights.                                                                                                                           |
| WebSocket not connecting                               | Nginx missing `Upgrade`/`Connection` headers, or behind a proxy that strips them. Verify the `/api/` block.                                                                                                     |
| Static page blank / routes 404                         | Nginx missing `try_files $uri $uri/ /index.html;` SPA fallback.                                                                                                                                                 |
| OAuth redirect mismatch                                | `*_CALLBACK_URL` must exactly equal the provider's configured redirect URI and the browser origin.                                                                                                              |
| API build produces no output / stale dist              | Stale `tsconfig.tsbuildinfo` from a previous build with different `rootDir`. Run `find packages/ apps/api/ -name tsconfig.tsbuildinfo -delete` before rebuilding. The deploy script handles this automatically. |
| `EACCES: permission denied` on API dist                | A previous `sudo` build left root-owned files. Run `sudo chown -R deployer:deployer apps/api/dist apps/api/src/generated` before rebuilding. The deploy script handles this automatically.                      |

For local debugging, run the API in dev mode:

```bash
pnpm dev:api   # tsx watch, NODE_ENV=development
```
