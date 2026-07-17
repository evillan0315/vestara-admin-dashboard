#!/usr/bin/env bash
# setup-server.sh — Provision a bare Ubuntu 22.04 server for Vestara Admin (bare-metal/PM2 deployment)
#
# This script sets up:
#   - deployer user (with passwordless sudo and SSH key authority)
#   - Node.js 24 + pnpm
#   - PostgreSQL 17 (with vestara_user/vestara_password/vestara_db)
#   - Redis 8
#   - PM2 (global)
#   - Nginx (with a placeholder config)
#
# Run as root. The server must be an Ubuntu 22.04 instance with SSH access.
set -euo pipefail

echo "🚀 Setting up Vestara Admin server..."

# ── 1. Create deployer user and authorize SSH key ────────────────────────────
id deployer >/dev/null 2>&1 || useradd -m -s /bin/bash deployer
echo 'deployer ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/deployer
chmod 440 /etc/sudoers.d/deployer
mkdir -p /home/deployer/.ssh
cp /root/.ssh/authorized_keys /home/deployer/.ssh/authorized_keys 2>/dev/null || true
chown -R deployer:deployer /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys
usermod -aG docker deployer 2>/dev/null || true

# ── 2. Install system dependencies ──────────────────────────────────────────
apt-get update
apt-get install -y curl gnupg lsb-release wget

# ── 3. Install Node.js 24 and pnpm ─────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs
corepack enable
corepack prepare pnpm@9 --activate

# ── 4. Install PostgreSQL 17 ───────────────────────────────────────────────
apt-get install -y postgresql-17 postgresql-client-17
systemctl start postgresql
systemctl enable postgresql

# Create the vestara database and user
sudo -u postgres psql -c "CREATE USER vestara_user WITH PASSWORD 'vestara_password';"
sudo -u postgres psql -c "CREATE DATABASE vestara_db OWNER vestara_user;"

# ── 5. Install Redis 8 ─────────────────────────────────────────────────────
apt-get install -y redis-server
systemctl start redis-server
systemctl enable redis-server

# ── 6. Install PM2 ─────────────────────────────────────────────────────────
npm install -g pm2

# ── 7. Install Nginx ──────────────────────────────────────────────────────
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx

# ── 8. Create /var/www/app directory ───────────────────────────────────────
mkdir -p /var/www/app
chown deployer:deployer /var/www/app

echo "✅ Server setup complete."