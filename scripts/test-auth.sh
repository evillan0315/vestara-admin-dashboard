#!/bin/bash
# Vestara Auth API - End-to-end test script
# Usage: bash scripts/test-auth.sh

set -e

API_URL="http://localhost:5000/api/v1"
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_step() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  STEP: $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

echo ""
echo -e "${CYAN}🔐 Vestara Auth API Test Suite${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ─── Health Check ────────────────────────────────────
print_step "1. Health Check"
HEALTH=$(curl -s "$API_URL/../health" 2>/dev/null || curl -s "http://localhost:5000/health" 2>/dev/null)
if [ $? -eq 0 ]; then
  print_success "API server is reachable"
  echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
else
  print_error "Cannot reach API server at $API_URL"
  echo "Make sure the dev server is running: pnpm dev"
  exit 1
fi

# ─── Register ────────────────────────────────────────
print_step "2. Register a new user"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vestara-admin-api.vercel.app",
    "password": "Admin123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN"
  }')

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  print_success "User registered successfully (HTTP $HTTP_CODE)"
else
  print_error "Registration failed (HTTP $HTTP_CODE)"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  # If user already exists, try logging in instead
  if echo "$BODY" | grep -q "AUTH_EMAIL_EXISTS"; then
    echo ""
    echo "User already exists, proceeding to login..."
  else
    exit 1
  fi
fi

echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

# Extract tokens from registration (or we'll get them from login)
REGISTER_TOKENS=$(echo "$BODY" | jq -r '.data.tokens // empty' 2>/dev/null)

# ─── Login ───────────────────────────────────────────
print_step "3. Login"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vestara-admin-api.vercel.app",
    "password": "Admin123!"
  }')

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  print_success "Login successful (HTTP $HTTP_CODE)"
else
  print_error "Login failed (HTTP $HTTP_CODE)"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  exit 1
fi

echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

# Extract tokens and user info
ACCESS_TOKEN=$(echo "$BODY" | jq -r '.data.tokens.accessToken')
REFRESH_TOKEN=$(echo "$BODY" | jq -r '.data.tokens.refreshToken')
USER_ID=$(echo "$BODY" | jq -r '.data.user.id')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  print_error "No access token received"
  exit 1
fi
print_success "Access token received: ${ACCESS_TOKEN:0:20}..."

# ─── Get Current User ───────────────────────────────
print_step "4. Get current user (GET /auth/me)"
ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n1)
BODY=$(echo "$ME_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  print_success "Current user retrieved (HTTP $HTTP_CODE)"
else
  print_error "Failed to get current user (HTTP $HTTP_CODE)"
fi
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

# ─── Refresh Token ───────────────────────────────────
print_step "5. Refresh access token (POST /auth/refresh)"
REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")

HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tail -n1)
BODY=$(echo "$REFRESH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  print_success "Token refreshed successfully (HTTP $HTTP_CODE)"
  NEW_ACCESS_TOKEN=$(echo "$BODY" | jq -r '.data.tokens.accessToken')
  NEW_REFRESH_TOKEN=$(echo "$BODY" | jq -r '.data.tokens.refreshToken')
  echo "  New access token:  ${NEW_ACCESS_TOKEN:0:20}..."
  echo "  New refresh token: ${NEW_REFRESH_TOKEN:0:20}..."
else
  print_error "Token refresh failed (HTTP $HTTP_CODE)"
fi
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

# Use the new tokens for logout
ACCESS_TOKEN="${NEW_ACCESS_TOKEN:-$ACCESS_TOKEN}"
REFRESH_TOKEN="${NEW_REFRESH_TOKEN:-$REFRESH_TOKEN}"

# ─── Logout ──────────────────────────────────────────
print_step "6. Logout (POST /auth/logout)"
LOGOUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"refreshToken\": \"$REFRESH_TOKEN\"}")

HTTP_CODE=$(echo "$LOGOUT_RESPONSE" | tail -n1)
BODY=$(echo "$LOGOUT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  print_success "Logged out successfully (HTTP $HTTP_CODE)"
else
  print_error "Logout failed (HTTP $HTTP_CODE)"
fi
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

# ─── Verify logout (me should fail) ─────────────────
print_step "7. Verify logout (GET /auth/me — should return 401)"
VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tail -n1)
BODY=$(echo "$VERIFY_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
  print_success "Correctly rejected after logout (HTTP $HTTP_CODE)"
else
  print_error "Expected 401 but got HTTP $HTTP_CODE"
fi
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

# ─── Summary ─────────────────────────────────────────
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Auth API test suite completed${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
