#!/usr/bin/env bash

set -euo pipefail

####################################################
# Production Server Setup
# Ubuntu 22.04 / 24.04 LTS
# Node.js 24 LTS
####################################################


############################
# Configuration
############################

DEPLOY_USER="deployer"

TIMEZONE="Asia/Manila"

NODE_VERSION="24"

SSH_PORT="22"

DOMAIN="meetlily.org"

WWW_DOMAIN="www.meetlily.org"

SSL_EMAIL="evillan0315@gmail.com"

APP_DIR="/var/www/app"

POSTGRES_DB="production_db"

POSTGRES_USER="app_user"

POSTGRES_PASSWORD="CHANGE_ME"


############################
# Root Check
############################

if [ "$EUID" -ne 0 ]; then
    echo "Run this script as root"
    exit 1
fi


echo "Starting production setup..."



############################
# Update System
############################

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
build-essential \
gnupg \
jq



############################
# Timezone
############################

timedatectl set-timezone "$TIMEZONE"




############################
# Deploy User
############################

if ! id "$DEPLOY_USER" >/dev/null 2>&1
then

    adduser \
    --disabled-password \
    --gecos "" \
    $DEPLOY_USER

fi


# Add deploy user to sudo group
usermod \
-aG sudo \
$DEPLOY_USER



############################
# Configure Passwordless Sudo
############################

cat > /etc/sudoers.d/${DEPLOY_USER} <<EOF

${DEPLOY_USER} ALL=(ALL) NOPASSWD:ALL

EOF


chmod 440 \
/etc/sudoers.d/${DEPLOY_USER}



# Validate sudo configuration

visudo -c



############################
# SSH Key Directory
############################

mkdir -p \
/home/$DEPLOY_USER/.ssh


touch \
/home/$DEPLOY_USER/.ssh/authorized_keys


chmod 700 \
/home/$DEPLOY_USER/.ssh


chmod 600 \
/home/$DEPLOY_USER/.ssh/authorized_keys


chown -R \
$DEPLOY_USER:$DEPLOY_USER \
/home/$DEPLOY_USER/.ssh



############################
# SSH Hardening
############################

cp \
/etc/ssh/sshd_config \
/etc/ssh/sshd_config.backup


cat >> /etc/ssh/sshd_config <<EOF

PermitRootLogin no

PasswordAuthentication no

PubkeyAuthentication yes

MaxAuthTries 3

LoginGraceTime 30

AllowUsers ${DEPLOY_USER}

EOF


systemctl restart ssh



############################
# Firewall
############################

ufw --force reset


ufw default deny incoming

ufw default allow outgoing


ufw allow ${SSH_PORT}/tcp

ufw allow 80/tcp

ufw allow 443/tcp


ufw --force enable



############################
# Fail2Ban
############################

cat > /etc/fail2ban/jail.local <<EOF

[DEFAULT]

bantime = 1h

findtime = 10m

maxretry = 5



[sshd]

enabled=true

port=${SSH_PORT}

logpath=/var/log/auth.log

EOF


systemctl enable fail2ban

systemctl restart fail2ban



############################
# Nginx
############################

apt install -y nginx


rm -f \
/etc/nginx/sites-enabled/default


cat > /etc/nginx/sites-available/app <<EOF

server {

listen 80;

listen [::]:80;


server_name ${DOMAIN} ${WWW_DOMAIN};



location / {


proxy_pass http://127.0.0.1:3000;


proxy_http_version 1.1;


proxy_set_header Upgrade \$http_upgrade;

proxy_set_header Connection "upgrade";


proxy_set_header Host \$host;


proxy_set_header X-Real-IP \$remote_addr;


proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;


proxy_set_header X-Forwarded-Proto \$scheme;


}


}

EOF



ln -sf \
/etc/nginx/sites-available/app \
/etc/nginx/sites-enabled/app



nginx -t


systemctl enable nginx

systemctl restart nginx



############################
# Node.js 24
############################

curl -fsSL \
https://deb.nodesource.com/setup_${NODE_VERSION}.x \
| bash -


apt install -y nodejs


node -v

npm -v



############################
# PM2
############################

npm install -g pm2


sudo -u $DEPLOY_USER pm2 startup systemd \
-u $DEPLOY_USER \
--hp /home/$DEPLOY_USER



############################
# PostgreSQL
############################

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



############################
# Redis
############################

apt install -y redis-server


sed -i \
"s/^supervised .*/supervised systemd/" \
/etc/redis/redis.conf


sed -i \
"s/^bind .*/bind 127.0.0.1/" \
/etc/redis/redis.conf


systemctl enable redis-server

systemctl restart redis-server



############################
# Docker
############################

curl -fsSL \
https://get.docker.com \
| sh


usermod \
-aG docker \
$DEPLOY_USER


systemctl enable docker



############################
# Certbot SSL
############################

apt install -y \
certbot \
python3-certbot-nginx



certbot \
--nginx \
--non-interactive \
--agree-tos \
--email ${SSL_EMAIL} \
-d ${DOMAIN} \
-d ${WWW_DOMAIN} \
--redirect



systemctl enable certbot.timer

systemctl start certbot.timer



certbot renew --dry-run



############################
# Kernel Optimization
############################

cat >> /etc/sysctl.conf <<EOF


net.core.somaxconn=65535

net.ipv4.tcp_max_syn_backlog=65535

net.ipv4.ip_local_port_range=1024 65535

vm.swappiness=10

EOF


sysctl -p



############################
# App Structure
############################

mkdir -p \
${APP_DIR}/backend \
${APP_DIR}/frontend \
/var/www/logs \
/var/www/backups


chown -R \
${DEPLOY_USER}:${DEPLOY_USER} \
/var/www



############################
# Auto Updates
############################

apt install -y unattended-upgrades


dpkg-reconfigure \
--priority=low \
unattended-upgrades



############################
# PM2 Logs
############################

sudo -u $DEPLOY_USER \
pm2 install pm2-logrotate || true


sudo -u $DEPLOY_USER \
pm2 set pm2-logrotate:max_size 100M || true


sudo -u $DEPLOY_USER \
pm2 set pm2-logrotate:retain 14 || true



############################
# Cleanup
############################

apt autoremove -y

apt autoclean



echo "

====================================

Production Server Ready

Stack:

✓ Ubuntu LTS
✓ Node.js 24
✓ PM2
✓ Nginx
✓ HTTPS SSL
✓ PostgreSQL
✓ Redis
✓ Docker
✓ Firewall
✓ Fail2Ban
✓ Auto Updates


Application:

${APP_DIR}


URL:

https://${DOMAIN}


====================================

"


chown -R deployer:deployer /home/deployer/.ssh

chmod 700 /home/deployer/.ssh

chmod 600 /home/deployer/.ssh/authorized_keys


cat > /etc/sudoers.d/deployer <<EOF
deployer ALL=(ALL) NOPASSWD:ALL
EOF