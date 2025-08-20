T-SETUP.0: Milestone 0 scaffold + dev quickstart

Owner: @m.ansyarafi
ETA: 2025-08-28

Summary
- Adds Milestone 0 scaffolding: Bun monorepo workspace, backend/frontend minimal apps, Prisma schema + migration + seed, Dockerfiles, docker-compose.yml, dev scripts, and CI quickstart.
- Includes initial Prisma migration at prisma/migrations/20250820113859_init and seed script (prisma/seed.ts).
- Backend implements a minimal API (/api/health, /api/emissions) and Prisma service stubs.
- Frontend is a minimal Vite + React app that pings /api/health.
- Adds simple CI workflow (.github/workflows/ci.yml) to install Bun, install deps, generate Prisma client, lint, and run tests.
- Adds dev wrappers in scripts/dev/* and docs quickstart.

Files changed / added (high level)
- package.json (root), .editorconfig, .prettierrc, .eslintrc.cjs
- prisma/schema.prisma, prisma/seed.ts, prisma/migrations/20250820113859_init/**
- docker-compose.yml
- packages/backend/* (package.json, tsconfig.json, Dockerfile, src/...)
- packages/frontend/* (package.json, tsconfig.json, Dockerfile, src/...)
- scripts/dev/start-backend.sh, scripts/dev/start-frontend.sh
- .github/workflows/ci.yml
- docs/README.md, docs/TASK_PROGRESS.md, docs/milestones.md (Owner/ETA added)

Verification (what I ran)
- bun install (root)
- bunx prisma generate
- Applied migration and generated migration folder:
  DATABASE_URL="postgresql://postgres:postgres@localhost:7463/carbon_dev?schema=public" bunx prisma migrate dev --name init
- Generated Prisma client: bunx prisma generate
- Seeded DB: DATABASE_URL="postgresql://postgres:postgres@localhost:7463/carbon_dev?schema=public" bunx tsx prisma/seed.ts
  -> Created 3 Emission rows
- Started backend dev server:
  DATABASE_URL="postgresql://postgres:postgres@localhost:7463/carbon_dev?schema=public" bun run --watch src/index.ts (listening on port 3000)
- Confirmed health endpoint:
  curl http://localhost:3000/api/health -> {"status":"ok"}

How reviewers can test locally
1. Copy env example:
   cp .env.example .env
   (if running Postgres on a custom port, update DATABASE_URL)
2. Start Postgres via docker-compose (or ensure Postgres is running):
   docker-compose up -d postgres
3. Install deps:
   bun install
4. Generate & migrate:
   bunx prisma generate
   DATABASE_URL="<your DATABASE_URL>" bunx prisma migrate dev --name init
5. Seed DB:
   DATABASE_URL="<your DATABASE_URL>" bunx tsx prisma/seed.ts
6. Start backend:
   DATABASE_URL="<your DATABASE_URL>" ./scripts/dev/start-backend.sh
7. Start frontend:
   ./scripts/dev/start-frontend.sh
8. Open http://localhost:5173 and verify frontend shows health response, and curl http://localhost:3000/api/health returns {"status":"ok"}

Checklist for PR
- [ ] Include prisma/migrations folder in the commit (present)
- [ ] CI passes (Bun install, prisma generate, lint, tests)
- [ ] Reviewer can run quickstart and verify /api/health and frontend ping
- [ ] Merge when at least one approving review is present

Notes / Caveats
- This is Milestone 0 scaffold only. No production auth, background workers, or heavy business logic included.
- CI job uses bun.sh installer; adjust if organization policies require pinned installers.
- Developer environment in this run used Postgres on localhost:7463 — adjust DATABASE_URL for reviewers as needed.
