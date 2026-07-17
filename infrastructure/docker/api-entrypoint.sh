#!/usr/bin/env bash
#
# api-entrypoint.sh — boot the Vestara API container.
#
#   1. Sync the Prisma schema to the database (the project uses `db push`,
#      not SQL migrations, so this is idempotent and safe to re-run).
#   2. Seed initial data (idempotent; safe to re-run, non-fatal on failure).
#   3. Start the compiled Node API.
#
# All runtime variables (DATABASE_URL, JWT_*, REDIS_URL, ...) are injected by
# the compose `env_file` (the server's .env.deploy), so they are already
# present in the environment.
#
set -e

cd /app/apps/api

echo "🗄  Syncing database schema (prisma db push)..."
pnpm exec prisma db push --accept-data-loss --skip-generate

echo "🌱 Seeding database (idempotent)..."
if pnpm exec tsx prisma/seed.ts; then
  echo "✅ Seed complete"
else
  echo "⚠️  Seed failed (non-fatal) — continuing to start the API"
fi

echo "🚀 Starting Vestara API on port ${API_PORT:-5000}..."
exec node dist/index.js
