# Milestone 0 - Task Progress

Current progress summary for Milestone 0 (owner: @m.ansyarafi, ETA: 2025-08-28)

- [x] Step 1: Create root workspace files and editor/lint configs
- [x] Step 2: Add Prisma schema scaffold and idempotent seed script
- [x] Step 3: Add Dockerfiles and docker-compose with Postgres service
- [x] Step 4: Implement backend minimal app, Prisma client, and service stubs
- [x] Step 5: Implement frontend minimal app that pings /api/health
- [x] Step 6: Add dev scripts, lint/format, and optional Husky hooks
- [x] Step 7: Add GitHub Actions CI workflow (install Bun, generate Prisma client, lint, unit tests)
- [x] Step 8: Update docs (docs/milestones.md Owner/ETA, README quickstart)
- [x] Step 9: Verification: run migrations, seed, start services, and validate /api/health
- [ ] Step 10: Open PR "T-SETUP.0: Milestone 0 scaffold + dev quickstart" with Owner/ETA and link tests/verification

Notes:
- Backend is running at http://localhost:3000 (health OK).
- Prisma migrations created at `prisma/migrations/20250820113859_init`.
- DB seeded with sample emissions.
- Next action: create PR including migration folder and all scaffolding files (Step 10).
