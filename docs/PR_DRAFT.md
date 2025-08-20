# PR draft: T-SETUP.0: Milestone 0 scaffold + dev quickstart

Owner: @m.ansyarafi  
ETA: 2025-08-28

Summary
- Adds Milestone 0 scaffolding: Bun monorepo workspace, backend/frontend minimal apps, Prisma schema + migration + seed, Dockerfiles, docker-compose.yml, dev scripts, and CI quickstart.
- Includes migration at prisma/migrations/20250820113859_init and seed script (prisma/seed.ts).
- Backend: /api/health, /api/emissions, Prisma client/service stubs.
- Frontend: Vite + React app that pings /api/health.
- CI: .github/workflows/ci.yml (install Bun, bun install, prisma generate, lint, tests).
- Dev wrappers: scripts/dev/start-backend.sh, scripts/dev/start-frontend.sh
- Docs updated: docs/README.md, docs/milestones.md (Owner/ETA), docs/TASK_PROGRESS.md

Verification performed
- bun install
- bunx prisma generate
- DATABASE_URL="postgresql://postgres:postgres@localhost:7463/carbon_dev?schema=public" bunx prisma migrate dev --name init
- DATABASE_URL="postgresql://postgres:postgres@localhost:7463/carbon_dev?schema=public" bunx tsx prisma/seed.ts
- Started backend dev; health: GET /api/health -> {"status":"ok"}

How to test locally (reviewer)
1. cp .env.example .env (edit DATABASE_URL if using a different port/host)
2. docker-compose up -d postgres OR ensure Postgres is running
3. bun install
4. bunx prisma generate
5. DATABASE_URL="<your DB>" bunx prisma migrate dev --name init
6. DATABASE_URL="<your DB>" bunx tsx prisma/seed.ts
7. Start backend: DATABASE_URL="<your DB>" ./scripts/dev/start-backend.sh
8. Start frontend: ./scripts/dev/start-frontend.sh
9. Verify: curl http://localhost:3000/api/health -> {"status":"ok"} and open frontend (http://localhost:5173)

Suggested commit / PR checklist
- [ ] prisma/migrations folder included (present)
- [ ] CI passes (Bun install, prisma generate, lint, tests)
- [ ] Reviewer can run quickstart and verify /api/health and frontend ping
- [ ] Merge after at least one approving review

Notes
- Repository branch: setup/milestone-0 (created locally). No remote configured here.
- To push and open PR:
  git remote add origin <your-remote-url>
  git push -u origin setup/milestone-0
  Open PR titled: "T-SETUP.0: Milestone 0 scaffold + dev quickstart" and paste this body.
