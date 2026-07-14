# Self-Hosted Deployment Guide

This guide explains how to deploy the **Vestara Admin Dashboard** on your own
server (e.g. an Ubuntu 24.04 LTS VPS), fully under your control — no Vercel
required.

The application is a pnpm/Turborepo monorepo:

| App | Stack | What it is |
|-----|-------|------------|
| `apps/api` | Express 5 + Prisma + PostgreSQL + Redis | The REST + WebSocket API. Runs as a long-lived Node process. |
| `apps/web` | React 19 + Vite + MUI | A static SPA. Built once and served by Nginx. |

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
- [Health Checks & Logs](#health-checks--logs)
- [Scaling Notes](#scaling-notes)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

---

## Architecture & Topology

The simplest, most robust topology is a **single domain** where Nginx serves
the SPA at `/` and reverse-proxies `/api` to the API process:

```
                         ┌─────────────────────────────────────┐
   Browser ── HTTPS ───► │  Nginx (admin.example.com)           │
                         │    /            → static SPA (dist)  │
                         │    /api/*       → 127.0.0.1:5000     │
                         │    /api/v1/ws   → 127.0.0.1:5000 (WS)│
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

| Path | Served by |
|------|-----------|
| `https://admin.example.com/` | SPA (`apps/web/dist`) |
| `https://admin.example.com/api/v1/*` | API (`apps/api`) |
| `https://admin.example.com/api/v1/ws` | WebSocket endpoint |
| `https://admin.example.com/api/v1/health` | Health check |

Because the frontend uses a **relative** API base (`/api/v1` by default), no
frontend environment variable is required for the single-domain setup. OAuth
redirects are derived from `window.location.origin`, so they also just work.

> **Subdomain variant (optional):** If you prefer `app.example.com` (frontend)
> and `api.example.com` (backend), set `VITE_API_URL=https://api.example.com/api/v1`
> and `CORS_ORIGIN=https://app.example.com`, and point each DNS record at the
> server. The rest of this guide assumes the single-domain layout.

---

## Server Requirements

| Resource | Minimum | Recommended (production) |
|----------|---------|--------------------------|
| CPU | 1 vCPU | 2–4 vCPU |
| RAM | 1 GB | 4 GB |
| Disk | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| Network | IPv4 + DNS A/AAAA records | — |

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
CREATE DATABASE vestara_admin;
CREATE USER vestara WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE vestara_admin TO vestara;
SQL
```

You will use this connection string in the env file:

```
DATABASE_URL=postgresql://vestara:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:5432/vestara_admin?schema=public
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

# API listens on 0.0.0.0:5000; Nginx proxies /api to it.
PORT=5000
API_URL=https://admin.example.com

# CORS / OAuth origin = your public frontend origin
CORS_ORIGIN=https://admin.example.com
CLIENT_URL=https://admin.example.com

# ── Database ───────────────────────────────────
DATABASE_URL=postgresql://vestara:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:5432/vestara_admin?schema=public

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
# GOOGLE_CALLBACK_URL=https://admin.example.com/api/v1/auth/oauth/google/callback
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
# GITHUB_CALLBACK_URL=https://admin.example.com/api/v1/auth/oauth/github/callback

# ── AI / Integrations (optional) ───────────────
# OPENCODE_API_KEY=

# ── File storage (optional; LOCAL is default) ──
# S3_ENDPOINT=  S3_BUCKET=  S3_ACCESS_KEY=  S3_SECRET_KEY=  S3_REGION=us-east-1

# ── Email (optional) ───────────────────────────
# SMTP_HOST=  SMTP_PORT=587  SMTP_USER=  SMTP_PASSWORD=  SMTP_FROM=noreply@example.com

LOG_LEVEL=info
```

> Never commit `.env`. It is git-ignored. Keep backups of secrets in a password manager.

**Frontend — `/var/www/app/apps/web/.env`** (optional for single-domain):

```bash
# Defaults to "/api/v1" (relative) — only set if using a separate API domain.
# VITE_API_URL=/api/v1
VITE_APP_NAME=Vestara Admin
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

Create `ecosystem.config.cjs` in the repo root:

```js
module.exports = {
  apps: [{
    name: 'vestara-api',
    cwd: '/var/www/app',
    script: 'apps/api/dist/index.js',
    exec_mode: 'fork',     // single instance: WebSocket + BullMQ share in-process state
    instances: 1,
    env_production: {
      NODE_ENV: 'production',
    },
    error_file: '/var/www/logs/api-error.log',
    out_file: '/var/www/logs/api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }],
};
```

Start and persist across reboots:

```bash
cd /var/www/app
mkdir -p /var/www/logs
pnpm exec pm2 start ecosystem.config.cjs --env production
pnpm exec pm2 save
pnpm exec pm2 startup   # follow the printed command to enable the systemd unit
```

Verify:

```bash
curl -i http://127.0.0.1:5000/api/v1/health
# => 200 {"success":true,"data":{...}}
```

### 11. Serve the frontend + proxy the API (Nginx)

Create `/etc/nginx/sites-available/vestara`:

```nginx
server {
    listen 80;
    server_name admin.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.example.com;

    # Certbot will populate these after §12
    ssl_certificate     /etc/letsencrypt/live/admin.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.example.com/privkey.pem;

    root /var/www/app/apps/web/dist;
    index index.html;

    # API + WebSocket reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Static assets with long cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback (client-side routing)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable and test:

```bash
sudo ln -sf /etc/nginx/sites-available/vestara /etc/nginx/sites-enabled/vestara
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

> Note: `/api/` is proxied **with** the `/api` prefix intact
> (`/api/v1/health` → `http://127.0.0.1:5000/api/v1/health`), which matches
> the API's mount point. The `Upgrade`/`Connection` headers enable WebSocket
> traffic on `/api/v1/ws`.

### 12. TLS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d admin.example.com --agree-tos -m admin@example.com --redirect
sudo systemctl enable --now certbot.timer
```

Certbot auto-edits the Nginx config to add the certificate paths and HTTPS
redirect. Reload Nginx once more, then visit `https://admin.example.com`.

---

## OAuth (Google / GitHub)

1. Create an OAuth app in the provider console.
2. Set the **Authorized redirect URI** to:
   - Google: `https://admin.example.com/api/v1/auth/oauth/google/callback`
   - GitHub: `https://admin.example.com/api/v1/auth/oauth/github/callback`
3. Paste the client ID/secret into the root `.env`
   (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, and the
   GitHub equivalents).
4. Restart the API: `pnpm exec pm2 restart vestara-api`.

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

pnpm exec pm2 restart vestara-api
# Frontend is static — Nginx already serves the new dist/ after build
sudo systemctl reload nginx
```

For zero-downtime API restarts, PM2 restarts the single forked process
quickly; the Nginx proxy will briefly return 502 during the restart window
(typically < 1s).

---

## Health Checks & Logs

- **API health:** `GET /api/v1/health` → `200 OK`.
- **WebSocket status (admin):** `GET /api/v1/ws/status`.
- **API logs:** `pnpm exec pm2 logs vestara-api` or `/var/www/logs/api-*.log`.
- **Nginx logs:** `/var/log/nginx/access.log`, `/var/log/nginx/error.log`.
- **PostgreSQL:** `sudo -u postgres psql -d vestara_admin -c "SELECT 1"`.
- **Redis:** `redis-cli ping`.

External monitoring (optional): point Uptime-Kuma / Healthchecks.io at
`https://admin.example.com/api/v1/health`.

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

| Symptom | Likely cause / fix |
|---------|--------------------|
| `502 Bad Gateway` on `/api/*` | API not running or wrong port. Check `pm2 status` and that `PORT=5000` matches the Nginx `proxy_pass`. |
| `502` only on first load after restart | Brief restart window; expected. Use `pm2 reload` for graceful restart. |
| CORS error in browser console | `CORS_ORIGIN` doesn't match the browser origin. Set it to the exact `https://admin.example.com`. |
| `401` immediately after login on reload | Access token expired and refresh failed. Ensure `JWT_REFRESH_SECRET` matches across restarts and `REDIS_URL` is reachable (refresh tokens/sessions may use Redis). |
| `PrismaClientInitializationError` | `DATABASE_URL` missing or wrong. Run Prisma from repo root where `.env` lives. |
| Migrations fail | Use `prisma migrate deploy` (not `dev`) in production; ensure DB user has DDL rights. |
| WebSocket not connecting | Nginx missing `Upgrade`/`Connection` headers, or behind a proxy that strips them. Verify the `/api/` block. |
| Static page blank / routes 404 | Nginx missing `try_files $uri $uri/ /index.html;` SPA fallback. |
| OAuth redirect mismatch | `*_CALLBACK_URL` must exactly equal the provider's configured redirect URI and the browser origin. |

For local debugging, run the API in dev mode:

```bash
pnpm dev:api   # tsx watch, NODE_ENV=development
```
