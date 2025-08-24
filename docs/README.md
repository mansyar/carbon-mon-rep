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
   # Note: the compose maps Postgres host port 7463 -> container 5432
3. Install dependencies (root):
   bun install
4. Generate Prisma client and run migrations:
   bunx prisma generate
   bunx prisma migrate dev --name init
5. Seed DB:
   bunx tsx prisma/seed.ts
6. Start backend (dev):
   # If using docker-compose Postgres (host port 7463):
   DATABASE_URL="postgresql://postgres:postgres@postgres:7463/carbon_dev?schema=public" bun workspace run dev --scope @carbon/backend
7. Start frontend (dev):
   bun workspace run dev --scope @carbon/frontend

If you are running Postgres on a custom port or host, note the difference between host access and container-internal access:

- Host (CLI / local tools): when you run Postgres on your machine and want local tools or the backend started from your shell to connect, use the host-mapped port (the compose file maps host port 7463 to the Postgres container). Example (in .env.example):
  DATABASE_URL="postgresql://postgres:postgres@localhost:7463/carbon_dev?schema=public"

- Container internal (services via docker-compose): services inside the docker-compose network must connect to the Postgres container using the container port 5432 and the service name as host. Example (used by the backend service in docker-compose):
  DATABASE_URL="postgresql://postgres:postgres@postgres:5432/carbon_dev?schema=public"

Set DATABASE_URL accordingly before running migrate/seed and when starting the backend.

Frontend styling (Tailwind)
- The frontend includes Tailwind CSS for fast styling during development (M0). After `bun install` the frontend dev server (Vite) will process Tailwind directives. The minimal Tailwind entry is at `packages/frontend/src/index.css` (contains `@tailwind` directives) and is imported by `packages/frontend/src/main.tsx`.
- Tailwind, PostCSS and Autoprefixer are listed in `packages/frontend/package.json` devDependencies. If you add or change Tailwind configuration, see `packages/frontend/tailwind.config.js` and `packages/frontend/postcss.config.js`.

Husky / lint-staged
- After cloning, run `bun install` then `bun run prepare` to install Husky git hooks.
- Pre-commit will run eslint --fix on staged files via lint-staged.

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
