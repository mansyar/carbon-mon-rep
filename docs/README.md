# Project docs

This folder contains project documentation and quickstart instructions.

## Quickstart (developer)

Prereqs:
- Bun installed (https://bun.sh)
- Docker / docker-compose (for local Postgres) OR a running Postgres reachable at DATABASE_URL
- Node tooling provided via Bun (bunx, tsx)

Example local quickstart (docker-compose approach):
1. Copy env example:
   cp .env.example .env
2. Start Postgres:
   docker-compose up -d postgres
3. Install dependencies (root):
   bun install
4. Generate Prisma client and run migrations:
   bunx prisma generate
   bunx prisma migrate dev --name init
5. Seed DB:
   bunx tsx prisma/seed.ts
6. Start backend (dev):
   DATABASE_URL="postgresql://postgres:postgres@postgres:5432/carbon_dev?schema=public" bun workspace run dev --scope @carbon/backend
7. Start frontend (dev):
   bun workspace run dev --scope @carbon/frontend

If you are running Postgres on a custom port or host (for example localhost:7463), set DATABASE_URL accordingly before running migrate/seed and when starting the backend.

## Dev script wrappers (local)
To simplify starting services, the repository includes simple dev wrappers:

- scripts/dev/start-backend.sh
  - Exports DATABASE_URL (defaults to localhost:7463) and runs `bun run dev` in the backend workspace.
  - Usage: `./scripts/dev/start-backend.sh` (make executable as needed)

- scripts/dev/start-frontend.sh
  - Runs Vite for the frontend.
  - Usage: `./scripts/dev/start-frontend.sh`

## Minimal verification
- Backend health: GET /api/health (default port 3000) -> { "status": "ok" }
- Frontend will fetch /api/health on load and display the result.

Notes:
- This quickstart is intentionally minimal for Milestone 0: scaffolding, Prisma + seed, backend & frontend Hello World.
- See docs/implementation_plan.md for the full Milestone 0 plan and implementation order.
