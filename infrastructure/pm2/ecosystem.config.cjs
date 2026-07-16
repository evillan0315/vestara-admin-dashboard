/**
 * PM2 ecosystem config for the Vestara Admin API (self-hosted / VPS deploy).
 *
 * - Runs a single forked instance: the API uses in-process WebSocket and
 *   BullMQ state, so `instances: 1` / `exec_mode: 'fork'` is required.
 * - Loads runtime secrets from the repo-root `.env.deploy` so that file stays
 *   the single source of truth (git-ignored). Variables already present in the
 *   environment take precedence.
 *
 * Usage (on the server, where /var/www/app holds the checked-out repo):
 *   cd /var/www/app
 *   pnpm exec pm2 start infrastructure/pm2/ecosystem.config.cjs --env production
 *   pnpm exec pm2 save
 *   pnpm exec pm2 startup   # enable the systemd unit for reboots
 */

const fs = require('fs');
const path = require('path');

function loadDeployEnv() {
  const envPath = path.resolve(__dirname, '../../.env.deploy');
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    // Strip matching surrounding quotes (single or double).
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const deployEnv = loadDeployEnv();

module.exports = {
  apps: [
    {
      name: 'vestara-api',
      cwd: '/var/www/app',
      script: 'apps/api/dist/index.js',
      exec_mode: 'fork', // single instance: WebSocket + BullMQ share in-process state
      instances: 1,

      // Merge .env.deploy vars into the process environment. Existing env vars
      // (e.g. from the shell or systemd) are preserved by spreading first.
      env: {
        ...deployEnv,
        NODE_ENV: process.env.NODE_ENV || 'production',
      },

      error_file: '/var/www/logs/api-error.log',
      out_file: '/var/www/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Graceful shutdown so in-flight requests / WS connections drain.
      kill_timeout: 10000,
      shutdown_with_message: true,
    },
  ],
};
