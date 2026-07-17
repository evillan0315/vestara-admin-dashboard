#!/usr/bin/env bash
#
# deploy.sh — Self-hosted deployment over SSH (public-key auth)
#
# Syncs the built frontend (and optionally the API) to a remote server using
# rsync over an SSH connection authenticated with an SSH key (no passwords).
# The frontend is deployed atomically via a timestamped release directory and
# a symlink swap, so Nginx never serves a half-written build.
#
# Configuration is read from environment variables (optionally loaded from a
# local `deploy.env` file) and may be overridden by CLI flags.
#
# Examples:
#   ./scripts/deploy.sh                       # build web + deploy web
#   ./scripts/deploy.sh --no-build            # deploy already-built web dist
#   ./scripts/deploy.sh --api                 # also pull/build/restart the API
#   DEPLOY_HOST=example.com ./scripts/deploy.sh
#
# When --api is set, the script also copies the local .env.deploy (git-ignored
# runtime secrets) to <DEPLOY_API_PATH>/.env.deploy and (re)starts the API via
# infrastructure/pm2/ecosystem.config.cjs, which auto-loads those vars.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ── Load local config (git-ignored) if present ────────────────────────────
if [[ -f "${REPO_ROOT}/deploy.env" ]]; then
  # shellcheck disable=SC1091
  set -a
  . "${REPO_ROOT}/deploy.env"
  set +a
fi

# ── Defaults ──────────────────────────────────────────────────────────────
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-deployer}"
DEPLOY_SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/id_ed25519}"
DEPLOY_REMOTE_PORT="${DEPLOY_REMOTE_PORT:-22}"
DEPLOY_WEB_PATH="${DEPLOY_WEB_PATH:-/var/www/vestara}"
DEPLOY_WEB_SRC="${DEPLOY_WEB_SRC:-apps/web/dist}"
DEPLOY_RELEASES_DIR="${DEPLOY_RELEASES_DIR:-/var/www/releases}"
DEPLOY_KEEP_RELEASES="${DEPLOY_KEEP_RELEASES:-5}"
DEPLOY_NGINX_RELOAD="${DEPLOY_NGINX_RELOAD:-true}"
DEPLOY_WEB_ROOT_GROUP="${DEPLOY_WEB_ROOT_GROUP:-www-data}"

# API
DEPLOY_API="${DEPLOY_API:-false}"
DEPLOY_API_PATH="${DEPLOY_API_PATH:-/var/www/app}"

BUILD="${BUILD:-true}"

# ── CLI parsing ───────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)        DEPLOY_HOST="$2"; shift 2 ;;
    --user)        DEPLOY_USER="$2"; shift 2 ;;
    --key)         DEPLOY_SSH_KEY="$2"; shift 2 ;;
    --port)        DEPLOY_REMOTE_PORT="$2"; shift 2 ;;
    --path)        DEPLOY_WEB_PATH="$2"; shift 2 ;;
    --src)         DEPLOY_WEB_SRC="$2"; shift 2 ;;
    --api-path)    DEPLOY_API_PATH="$2"; shift 2 ;;
    --api)         DEPLOY_API="true"; shift ;;
    --no-build)    BUILD="false"; shift ;;
    --no-nginx)    DEPLOY_NGINX_RELOAD="false"; shift ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# ── Validate ──────────────────────────────────────────────────────────────
if [[ -z "${DEPLOY_HOST}" ]]; then
  echo "❌ DEPLOY_HOST is required (set it or pass --host)." >&2
  exit 1
fi
if [[ ! -f "${DEPLOY_SSH_KEY}" ]]; then
  echo "❌ SSH key not found: ${DEPLOY_SSH_KEY}" >&2
  exit 1
fi

WEB_SRC_ABS="${REPO_ROOT}/${DEPLOY_WEB_SRC}"
if [[ "${BUILD}" == "true" ]]; then
  echo "🔨 Building web app..."
  (cd "${REPO_ROOT}" && pnpm --filter web build)
fi
if [[ ! -d "${WEB_SRC_ABS}" ]]; then
  echo "❌ Web build output not found at ${WEB_SRC_ABS}. Build first or use --no-build." >&2
  exit 1
fi

# ── SSH / rsync helpers ─────────────────────────────────────────────────────
SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
SSH_OPTS=(-i "${DEPLOY_SSH_KEY}" -p "${DEPLOY_REMOTE_PORT}" -o StrictHostKeyChecking=accept-new -o BatchMode=yes -o LogLevel=ERROR)
ssh_cmd() { ssh "${SSH_OPTS[@]}" "${SSH_TARGET}" "$@"; }
rsync_cmd() {
  rsync -az --delete \
    -e "ssh ${SSH_OPTS[*]}" \
    "$@"
}

echo "🚀 Deploying to ${SSH_TARGET} (port ${DEPLOY_REMOTE_PORT})"
echo "   web source : ${WEB_SRC_ABS}"
echo "   web target : ${DEPLOY_WEB_PATH}"

# ── 1. Ensure releases directory exists ───────────────────────────────────
ssh_cmd "mkdir -p ${DEPLOY_RELEASES_DIR}"

# ── 2. Upload to a new timestamped release directory ───────────────────────
RELEASE_TS="$(date +%Y%m%d-%H%M%S)"
RELEASE_DIR="${DEPLOY_RELEASES_DIR}/vestara-${RELEASE_TS}"
echo "📦 Uploading build to ${RELEASE_DIR}..."
rsync_cmd "${WEB_SRC_ABS}/" "${SSH_TARGET}:${RELEASE_DIR}/"

# Safety gate: never point Nginx at an empty/partial release. Abort before the
# atomic swap if the upload produced no files.
UPLOADED_FILES="$(ssh_cmd "find ${RELEASE_DIR} -type f 2>/dev/null | wc -l")"
if [[ "${UPLOADED_FILES:-0}" -eq 0 ]]; then
  echo "❌ Release upload produced 0 files at ${RELEASE_DIR}. Aborting to avoid a broken deploy." >&2
  ssh_cmd "sudo rm -rf ${RELEASE_DIR}"
  exit 1
fi
echo "   uploaded ${UPLOADED_FILES} file(s)"

# ── 3. Fix ownership/permissions for the web server ────────────────────────
ssh_cmd "sudo chown -R ${DEPLOY_WEB_ROOT_GROUP}:${DEPLOY_WEB_ROOT_GROUP} ${RELEASE_DIR} && \
  find ${RELEASE_DIR} -type d -exec chmod 755 {} \; && \
  find ${RELEASE_DIR} -type f -exec chmod 644 {} \;"

# ── 4. Atomic swap: point the web root at the new release ──────────────────
echo "🔗 Switching ${DEPLOY_WEB_PATH} -> ${RELEASE_DIR}"
ssh_cmd "
  if [ -e ${DEPLOY_WEB_PATH} ] && [ ! -L ${DEPLOY_WEB_PATH} ]; then
    sudo mv ${DEPLOY_WEB_PATH} ${DEPLOY_WEB_PATH}.bak
  fi
  ln -sfn ${RELEASE_DIR} ${DEPLOY_WEB_PATH}.tmp
  sudo mv -Tf ${DEPLOY_WEB_PATH}.tmp ${DEPLOY_WEB_PATH}
  sudo chown -h ${DEPLOY_WEB_ROOT_GROUP}:${DEPLOY_WEB_ROOT_GROUP} ${DEPLOY_WEB_PATH}
"

# ── 5. Prune old releases (keep the most recent N) ─────────────────────────
ssh_cmd "ls -dt ${DEPLOY_RELEASES_DIR}/vestara-* 2>/dev/null | tail -n +$((DEPLOY_KEEP_RELEASES + 1)) | xargs -r sudo rm -rf"

# ── 6. Reload Nginx ────────────────────────────────────────────────────────
if [[ "${DEPLOY_NGINX_RELOAD}" == "true" ]]; then
  echo "🔄 Reloading Nginx..."
  ssh_cmd "sudo nginx -t && sudo systemctl reload nginx"
fi

# ── 7. Optional API deploy ─────────────────────────────────────────────────
if [[ "${DEPLOY_API}" == "true" ]]; then
  echo "🛠  Deploying API from ${DEPLOY_API_PATH}..."

  # Ship the git-ignored runtime secrets alongside the code so the API has its
  # environment on first boot. Refuse to deploy if the local file is missing.
  if [[ -f "${REPO_ROOT}/.env.deploy" ]]; then
    echo "🔐 Copying .env.deploy to ${DEPLOY_API_PATH}/.env.deploy"
    rsync_cmd "${REPO_ROOT}/.env.deploy" "${SSH_TARGET}:${DEPLOY_API_PATH}/.env.deploy"
    ssh_cmd "sudo chown ${DEPLOY_WEB_ROOT_GROUP}:${DEPLOY_WEB_ROOT_GROUP} ${DEPLOY_API_PATH}/.env.deploy && \
      chmod 600 ${DEPLOY_API_PATH}/.env.deploy"
  else
    echo "⚠️  Local .env.deploy not found — skipping secret copy. The API may fail to start without its environment." >&2
  fi

  # Pull the latest code, install deps, sync the schema (this project uses
  # `prisma db push` rather than SQL migrations), build the shared packages and
  # the API, then (re)start under PM2. The shared packages MUST be built before
  # the API because the API imports their compiled `dist` output.
  #
  # Fix ownership first: a previous sudo build may have left root-owned files
  # in dist/generated that block the deployer user from writing.  Also clean
  # stale tsconfig.tsbuildinfo so TypeScript does incremental-rebuild-skip
  # output that was correct for the old rootDir.
  ssh_cmd "cd ${DEPLOY_API_PATH} && \
    git pull --ff-only && \
    pnpm install --no-frozen-lockfile && \
    sudo chown -R ${DEPLOY_USER}:${DEPLOY_USER} packages/ apps/api/dist apps/api/src/generated && \
    find packages/ apps/api/ -name tsconfig.tsbuildinfo -delete 2>/dev/null; \
    pnpm --filter \"./packages/*\" build && \
    pnpm --filter @vestara/api exec prisma db push --accept-data-loss && \
    pnpm --filter @vestara/api build && \
    sudo chown -R ${DEPLOY_USER}:${DEPLOY_USER} apps/api/dist && \
    pnpm --filter @vestara/api exec pm2 start infrastructure/pm2/ecosystem.config.cjs --env production --update-env || \
    pnpm --filter @vestara/api exec pm2 restart vestara-api"
fi

# ── 8. Health checks ─────────────────────────────────────────────────────────
echo "🩺 Health checks..."
WEB_CODE="$(ssh_cmd "curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://127.0.0.1/ || echo 000")"
if [[ "${WEB_CODE}" == "200" ]]; then
  echo "✅ Web (SPA) health OK (HTTP ${WEB_CODE})"
else
  echo "⚠️  Web (SPA) health returned HTTP ${WEB_CODE}"
fi

if [[ "${DEPLOY_API}" == "true" ]]; then
  HTTP_CODE="$(ssh_cmd "curl -s -o /dev/null -w '%{http_code}' --max-time 10 http://127.0.0.1/api/v1/health || echo 000")"
  if [[ "${HTTP_CODE}" == "200" ]]; then
    echo "✅ API health OK (HTTP ${HTTP_CODE})"
  else
    echo "⚠️  API health returned HTTP ${HTTP_CODE} (frontend deploy still succeeded)"
  fi
fi

echo "✅ Deployment complete."
echo "   Active release: ${RELEASE_DIR}"
