#!/usr/bin/env bash
#
# dev-local.sh — One-command localhost development environment.
#
# Brings up the full local stack:
#   1. Docker services (Postgres + Redis) via docker compose, waiting for healthy.
#   2. Prisma client generation + database migration + seed (idempotent).
#   3. Both dev servers (web :5173 + api :5000) via `pnpm dev`.
#
# The web dev server proxies /api -> http://localhost:5000, so no CORS or
# VITE_API_URL configuration is required. See infrastructure/local/README.md.
#
# Examples:
#   ./scripts/dev-local.sh                 # full setup + dev servers (foreground)
#   ./scripts/dev-local.sh --skip-db       # assume Postgres/Redis already running
#   ./scripts/dev-local.sh --no-seed       # migrate only, skip seeding
#   ./scripts/dev-local.sh --no-dev        # infra + migrate/seed, then exit
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

SKIP_DB=false
NO_SEED=false
NO_DEV=false

for arg in "$@"; do
  case "$arg" in
    --skip-db)  SKIP_DB=true ;;
    --no-seed)  NO_SEED=true ;;
    --no-dev)   NO_DEV=true ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

# ── 1. Docker services ─────────────────────────────────────────────────────
if [[ "${SKIP_DB}" == "true" ]]; then
  echo "🐳 Skipping Docker (--skip-db). Assuming Postgres/Redis are already up."
else
  if ! command -v docker >/dev/null 2>&1; then
    echo "❌ docker is required for local services (or pass --skip-db if they're already running)." >&2
    exit 1
  fi
  echo "🐳 Starting Postgres + Redis via docker compose..."
  docker compose up -d --wait
  echo "✅ Services healthy."
fi

# ── 2. Database setup (idempotent) ──────────────────────────────────────────
echo "🗄  Preparing database..."
pnpm exec prisma generate
pnpm exec prisma migrate deploy
if [[ "${NO_SEED}" == "true" ]]; then
  echo "🌱 Skipping seed (--no-seed)."
else
  echo "🌱 Seeding initial data..."
  pnpm prisma:seed
fi

# ── 3. Dev servers ──────────────────────────────────────────────────────────
if [[ "${NO_DEV}" == "true" ]]; then
  echo "✅ Local infra ready. Start the apps with: pnpm dev"
  exit 0
fi

echo "🚀 Starting web (:5173) + api (:5000)..."
echo "   Web proxies /api -> http://localhost:5000 (no CORS config needed)."
echo "   Press Ctrl+C to stop."
exec pnpm dev
