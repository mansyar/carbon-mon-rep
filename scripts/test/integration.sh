#!/usr/bin/env bash
set -euo pipefail

# Integration test orchestration for CI / local runs
# - Bring up Postgres via docker-compose
# - Wait for Postgres readiness
# - Run Prisma migrate + generate and seed
# - Start backend (background)
# - Run simple smoke tests: GET /api/health, POST /api/emissions, GET /api/emissions
# - Tear down if run locally (CI will handle workspace cleanup)

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "Assuming Postgres and database have been started and seeded by the workflow."
echo "If running locally, run: docker compose up -d postgres && bunx prisma migrate deploy && bunx ts-node prisma/seed.ts"

echo "Starting backend in background..."
# Start backend using built dist if available, otherwise fall back to dev mode
if [ -f "packages/backend/dist/index.js" ]; then
  bun packages/backend/dist/index.js &
else
  echo "Dist not found, starting backend in dev mode..."
  bun workspace run dev &
fi
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend (http://localhost:3000) to respond..."
for i in {1..30}; do
  if curl -sS http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "Backend is responding."
    break
  fi
  echo "Waiting for backend... ($i)"
  sleep 1
done

# Run smoke tests
echo "Running smoke tests..."

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

echo "Integration smoke tests completed."

# Teardown backend process if run locally (skip in CI)
if [ -z "${CI:-}" ]; then
  if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "Stopping backend (pid: $BACKEND_PID)..."
    kill $BACKEND_PID || true
  fi
else
  echo "Detected CI environment; leaving backend process running for subsequent steps"
fi

echo "Done."
