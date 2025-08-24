#!/usr/bin/env bash
set -euo pipefail

# Simple smoke checks used by CI and locally:
# 1) GET /api/health
# 2) POST /api/emissions
# 3) GET /api/emissions

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "Running smoke checks against http://localhost:3000"

echo "1) GET /api/health"
curl -sS -f http://localhost:3000/api/health | jq .

echo "2) POST /api/emissions"
POST_BODY='{
  "site_id": "00000000-0000-0000-0000-000000000001",
  "emission_type": "scope_1",
  "value": "42.0",
  "unit": "kgCO2e",
  "timestamp": "2025-01-04T00:00:00Z"
}'
POST_RESP=$(curl -sS -f -X POST -H "Content-Type: application/json" -d "$POST_BODY" http://localhost:3000/api/emissions)
echo "POST response: $POST_RESP"

echo "3) GET /api/emissions"
curl -sS -f http://localhost:3000/api/emissions | jq .

echo "Smoke checks completed."
