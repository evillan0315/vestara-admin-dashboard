# PM2 Configuration — Vestara Admin API

Process definition for running the Express API as a managed background service.

## Files

| File                   | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `ecosystem.config.cjs` | PM2 ecosystem config for the `vestara-api` process |

## Behavior

- **Single forked instance** (`exec_mode: 'fork'`, `instances: 1`) — required
  because the API holds in-process WebSocket and BullMQ state.
- **Auto-loads `.env.deploy`** (repo root, git-ignored) at startup, so secrets
  live in one place. Environment variables already set in the shell/systemd
  unit take precedence.
- Writes rotated logs to `/var/www/logs/` and drains connections on shutdown
  (`kill_timeout`, `shutdown_with_message`).

## Usage (on the server)

```bash
cd /var/www/app
mkdir -p /var/www/logs
pnpm exec pm2 start infrastructure/pm2/ecosystem.config.cjs --env production
pnpm exec pm2 save
pnpm exec pm2 startup   # enable the systemd unit for reboots
```

Verify:

```bash
curl -i http://127.0.0.1:5000/api/v1/health
# => 200 {"success":true,"data":{...}}
```

See [`docs/SELF_HOSTED_DEPLOYMENT.md`](../docs/SELF_HOSTED_DEPLOYMENT.md) §10 for details.
