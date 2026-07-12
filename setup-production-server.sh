#!/usr/bin/env bash

set -euo pipefail

#############################################
# Ubuntu 18.04 Production Server Bootstrap
#############################################

DEPLOY_USER="deployer"
TIMEZONE="Asia/Manila"

NODE_VERSION="18"

POSTGRES_DB="production_db"
POSTGRES_USER="app_user"
POSTGRES_PASSWORD="CHANGE_ME_STRONG_PASSWORD"

SSH_PORT="22"

APP_DIR="/var/www/app"

#############################################
# Root check
#############################################

if [[ $EUID -ne 0 ]]; then
    echo "Run this script as root"
    exit 1
fi


echo "Starting production server setup..."


#############################################
# System Update
#############################################

apt update
apt upgrade -y

apt install -y \
curl \
wget \
git \
vim \
nano \
htop \
unzip \
ufw \
fail2ban \
logrotate \
software-properties-common \
ca-certificates \
apt-transport-https \
build-essential


#############################################
# Timezone
#############################################

timedatectl set-timezone "$TIMEZONE"


#############################################
# Create Deploy User
#############################################

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then

    adduser --disabled-password --gecos "" "$DEPLOY_USER"

    usermod \
    -aG sudo \
    "$DEPLOY_USER"

fi


mkdir -p /home/$DEPLOY_USER/.ssh

chmod 700 /home/$DEPLOY_USER/.ssh

touch /home/$DEPLOY_USER/.ssh/authorized_keys

chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys

chown -R \
$DEPLOY_USER:$DEPLOY_USER \
/home/$DEPLOY_USER/.ssh


#############################################
# SSH Hardening
#############################################

cp /etc/ssh/sshd_config \
/etc/ssh/sshd_config.backup


cat >> /etc/ssh/sshd_config <<EOF

# Production Security

PermitRootLogin no

PasswordAuthentication no

PubkeyAuthentication yes

MaxAuthTries 3

LoginGraceTime 30

AllowUsers $DEPLOY_USER

EOF


systemctl restart sshd


#############################################
# Firewall
#############################################

ufw --force reset

ufw default deny incoming
ufw default allow outgoing

ufw allow ${SSH_PORT}/tcp
ufw allow 80/tcp
ufw allow 443/tcp

ufw --force enable


#############################################
# Fail2Ban
#############################################

cat > /etc/fail2ban/jail.local <<EOF

[DEFAULT]

bantime = 1h
findtime = 10m
maxretry = 5


[sshd]

enabled = true
port = ${SSH_PORT}
logpath = /var/log/auth.log

EOF


systemctl enable fail2ban
systemctl restart fail2ban


#############################################
# Nginx
#############################################

apt install -y nginx


cat > /etc/nginx/nginx.conf <<EOF

user www-data;

worker_processes auto;


events {

    worker_connections 4096;

}


http {

    sendfile on;

    tcp_nopush on;

    tcp_nodelay on;


    keepalive_timeout 65;


    client_max_body_size 100M;


    gzip on;

    gzip_types
        text/plain
        text/css
        application/json
        application/javascript;

}

EOF


nginx -t

systemctl enable nginx

systemctl restart nginx


#############################################
# Node.js
#############################################

curl -fsSL \
https://deb.nodesource.com/setup_${NODE_VERSION}.x \
| bash -

apt install -y nodejs


npm install -g pm2


pm2 startup systemd \
-o /tmp/pm2-startup.txt


#############################################
# PostgreSQL
#############################################

apt install -y \
postgresql \
postgresql-contrib


sudo -u postgres psql <<EOF

CREATE DATABASE ${POSTGRES_DB};

CREATE USER ${POSTGRES_USER}
WITH PASSWORD '${POSTGRES_PASSWORD}';

GRANT ALL PRIVILEGES
ON DATABASE ${POSTGRES_DB}
TO ${POSTGRES_USER};

EOF


systemctl enable postgresql


#############################################
# Redis
#############################################

apt install -y redis-server


sed -i \
"s/^supervised no/supervised systemd/" \
/etc/redis/redis.conf


sed -i \
"s/^bind .*/bind 127.0.0.1/" \
/etc/redis/redis.conf


systemctl enable redis-server

systemctl restart redis-server


#############################################
# Kernel Optimization
#############################################

cat >> /etc/sysctl.conf <<EOF


# Production tuning

net.core.somaxconn=65535

net.ipv4.tcp_max_syn_backlog=65535

net.ipv4.ip_local_port_range=1024 65535

vm.swappiness=10

EOF


sysctl -p


#############################################
# Application Directories
#############################################

mkdir -p \
$APP_DIR/backend \
$APP_DIR/frontend \
/var/www/logs \
/var/www/backups


chown -R \
$DEPLOY_USER:$DEPLOY_USER \
/var/www


#############################################
# Automatic Updates
#############################################

apt install -y unattended-upgrades


dpkg-reconfigure \
--priority=low \
unattended-upgrades


#############################################
# PM2 Log Rotation
#############################################

sudo -u $DEPLOY_USER pm2 install pm2-logrotate || true


sudo -u $DEPLOY_USER pm2 set \
pm2-logrotate:max_size 50M || true


sudo -u $DEPLOY_USER pm2 set \
pm2-logrotate:retain 7 || true


#############################################
# Cleanup
#############################################

apt autoremove -y

apt autoclean


#############################################
# Complete
#############################################

echo "
========================================

Production Server Setup Completed

User:
$DEPLOY_USER

Application Directory:
$APP_DIR

Installed:

✓ Nginx
✓ Node.js ${NODE_VERSION}
✓ PM2
✓ PostgreSQL
✓ Redis
✓ Firewall
✓ Fail2Ban
✓ SSH Hardening
✓ Kernel tuning

Next steps:

1. Add your SSH public key:

/home/$DEPLOY_USER/.ssh/authorized_keys


2. Configure your domain DNS


3. Install SSL:

certbot --nginx -d yourdomain.com


4. Deploy application


========================================
"