#!/usr/bin/env sh
#
# web-entrypoint.sh — generate a self-signed TLS cert for the Nginx edge.
#
# Runs as part of the official Nginx image's entrypoint.d chain. A raw IP
# address cannot obtain a Let's Encrypt certificate, so we mint a self-signed
# one to keep traffic encrypted (browsers will show a warning). Replace with a
# CA-signed cert once a domain points at this host.
#
set -e

CERT_DIR=/etc/nginx/ssl
CERT=$CERT_DIR/fullchain.pem
KEY=$CERT_DIR/privkey.pem

mkdir -p "$CERT_DIR"

if [ ! -f "$CERT" ] || [ ! -f "$KEY" ]; then
  echo "🔐 Generating self-signed TLS certificate for Vestara edge..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY" \
    -out "$CERT" \
    -subj "/C=US/ST=NA/L=NA/O=Vestara/CN=vestara.meetlily.org" \
    -addext "subjectAltName=DNS:vestara.meetlily.org"
  echo "✅ Self-signed certificate written to $CERT_DIR"
fi
