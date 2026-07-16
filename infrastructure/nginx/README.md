# Nginx Configuration — Vestara Admin Dashboard

Production reverse-proxy / static-host config for the self-hosted deployment.

## Files

| File | Purpose |
|------|---------|
| `vestara.meetlily.org.conf` | Single-domain Nginx site for `vestara.meetlily.org` |

## Topology

```
Browser ── HTTPS ──► Nginx (vestara.meetlily.org)
                       │
                       ├── /            → static SPA  (/var/www/vestara)
                       ├── /api/v1/*    → 127.0.0.1:5000  (Express API)
                       ├── /api/v1/ws   → WebSocket upgrade
                       └── /socket.io/  → Socket.IO real-time layer
```

## Deploy

```bash
sudo cp vestara.meetlily.org.conf /etc/nginx/sites-available/vestara
sudo ln -sf /etc/nginx/sites-available/vestara /etc/nginx/sites-enabled/vestara
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Issue TLS certificate (auto-edits the config with cert paths + 443 block):
sudo certbot --nginx -d vestara.meetlily.org
```

See [`docs/SELF_HOSTED_DEPLOYMENT.md`](../docs/SELF_HOSTED_DEPLOYMENT.md) §11 for details.
