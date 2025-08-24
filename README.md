# Carbon Monitor — Quickstart

This repository provides a Bun-based monorepo scaffold (backend + frontend), Prisma migrations + seed, Docker Compose (Postgres), and CI quickstart to reproduce a developer environment for Milestone 0.

Prereqs
- Bun (https://bun.sh)
- Docker & docker-compose (for local Postgres) OR a running Postgres reachable at DATABASE_URL

Quickstart (docker-compose approach)
1. Copy env example:
   cp .env.example .env

2. Start Postgres:
   docker compose up -d postgres
   # Note: the compose maps Postgres host port 7463 -> container 5432

3. Install dependencies (root):
   bun install

4. Generate Prisma client and run migrations:
   bunx prisma generate
   bunx prisma migrate dev --name init

5. Seed DB:
   bunx tsx prisma/seed.ts

6. Start backend (dev):
   # If using docker-compose Postgres (container host `postgres`):
   DATABASE_URL="postgresql://postgres:postgres@postgres:5432/carbon_dev?schema=public" bun workspace run dev --scope @carbon/backend

7. Start frontend (dev):
   bun workspace run dev --scope @carbon/frontend

Minimal verification
- Backend health: GET /api/health (default port 3000) -> { "status": "ok" }
- Frontend will fetch /api/health on load and display the result.

Developer utilities
- scripts/dev/start-backend.sh — starts backend with sensible DATABASE_URL default
- scripts/dev/start-frontend.sh — starts frontend (Vite)
- scripts/test/integration.sh — CI/local integration orchestration (starts backend and runs smoke checks)
- scripts/test/smoke.sh — simple smoke checks (GET /api/health, POST/GET /api/emissions)

Notes
- See `docs/README.md` for more extensive docs and troubleshooting.
- This README is a concise quickstart for contributors to get a working local dev environment quickly.
