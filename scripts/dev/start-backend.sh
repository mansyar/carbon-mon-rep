#!/usr/bin/env bash
set -euo pipefail

# Default DATABASE_URL points to localhost:7463 (adjust if needed)
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:7463/carbon_dev?schema=public}"

cd packages/backend
echo "Starting backend with DATABASE_URL=$DATABASE_URL"
bun run dev
