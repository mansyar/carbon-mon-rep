#!/usr/bin/env bash
set -euo pipefail

# Simple smoke checks used by CI and locally:
# 1) GET /api/health
# 2) (optional) POST /api/auth/login -> capture tokens
# 3) POST /api/emissions (using access token if available)
# 4) GET /api/emissions (using access token if available)
# 5) POST /api/auth/refresh (validate refresh rotation)

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

API_URL="http://localhost:3000"
echo "Running smoke checks against $API_URL"

echo "1) GET /api/health"
curl -sS -f "$API_URL/api/health" | jq .

# Credentials: provide via env for CI/local runs
# Example: SMOKE_USERNAME=admin SMOKE_PASSWORD=secret ./scripts/test/smoke.sh
SMOKE_USERNAME="${SMOKE_USERNAME:-}"
SMOKE_PASSWORD="${SMOKE_PASSWORD:-}"

ACCESS_TOKEN=""
REFRESH_TOKEN=""

if [ -n "$SMOKE_USERNAME" ] && [ -n "$SMOKE_PASSWORD" ]; then
  echo "2) POST /api/auth/login (using provided credentials)"
  LOGIN_BODY=$(jq -n --arg u "$SMOKE_USERNAME" --arg p "$SMOKE_PASSWORD" '{username:$u, password:$p}')
  LOGIN_RESP=$(curl -sS -f -X POST -H "Content-Type: application/json" -d "$LOGIN_BODY" "$API_URL/api/auth/login" || true)
  if [ -z "$LOGIN_RESP" ]; then
    echo "Login request failed or returned no body:"
    echo "$LOGIN_RESP"
    exit 1
  fi

  ACCESS_TOKEN=$(echo "$LOGIN_RESP" | jq -r '.accessToken // empty')
  REFRESH_TOKEN=$(echo "$LOGIN_RESP" | jq -r '.refreshToken // empty')

  if [ -z "$ACCESS_TOKEN" ] || [ -z "$REFRESH_TOKEN" ]; then
    echo "Login did not return accessToken/refreshToken. Response:"
    echo "$LOGIN_RESP" | jq .
    exit 1
  fi

  echo "Login successful. Access token and refresh token obtained."
else
  echo "SMOKE_USERNAME/SMOKE_PASSWORD not set — skipping authenticated login. The script will attempt unauthenticated checks (may receive 401 for protected endpoints)."
fi

echo "3) POST /api/emissions"
POST_BODY='{
  "site_id": "00000000-0000-0000-0000-000000000001",
  "emission_type": "scope_1",
  "value": "42.0",
  "unit": "kgCO2e",
  "timestamp": "2025-01-04T00:00:00Z"
}'

if [ -n "$ACCESS_TOKEN" ]; then
  POST_RESP=$(curl -sS -f -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS_TOKEN" -d "$POST_BODY" "$API_URL/api/emissions")
else
  POST_RESP=$(curl -sS -f -X POST -H "Content-Type: application/json" -d "$POST_BODY" "$API_URL/api/emissions" || true)
fi

echo "POST response: $POST_RESP"

echo "4) GET /api/emissions"
if [ -n "$ACCESS_TOKEN" ]; then
  curl -sS -f -H "Authorization: Bearer $ACCESS_TOKEN" "$API_URL/api/emissions" | jq .
else
  curl -sS -f "$API_URL/api/emissions" | jq . || true
fi

# If we have a refresh token, test the refresh endpoint
if [ -n "$REFRESH_TOKEN" ]; then
  echo "5) POST /api/auth/refresh"
  REFRESH_BODY=$(jq -n --arg r "$REFRESH_TOKEN" '{refreshToken:$r}')
  REFRESH_RESP=$(curl -sS -f -X POST -H "Content-Type: application/json" -d "$REFRESH_BODY" "$API_URL/api/auth/refresh" || true)
  if [ -z "$REFRESH_RESP" ]; then
    echo "Refresh request failed. Response:"
    echo "$REFRESH_RESP"
    exit 1
  fi
  NEW_ACCESS=$(echo "$REFRESH_RESP" | jq -r '.accessToken // empty')
  NEW_REFRESH=$(echo "$REFRESH_RESP" | jq -r '.refreshToken // empty')
  echo "Refresh response: $REFRESH_RESP" | jq .
  if [ -z "$NEW_ACCESS" ] || [ -z "$NEW_REFRESH" ]; then
    echo "Refresh did not return new tokens."
    exit 1
  fi
  echo "Refresh succeeded and returned rotated tokens."
fi

# Teardown backend process if run locally (skip in CI)
if [ -z "${CI:-}" ]; then
  if [ -n "${BACKEND_PID:-}" ] && ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "Stopping backend (pid: $BACKEND_PID)..."
    kill $BACKEND_PID || true
  fi
else
  echo "Detected CI environment; leaving backend process running for subsequent steps"
fi

echo "Smoke checks completed."
