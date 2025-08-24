# Implementation Plan

[Overview]
Deliver a reproducible Milestone 0 developer environment that provides a minimal Bun-based monorepo skeleton, Prisma migrations + seed runnable, Hello World backend and frontend, Dockerfiles + docker-compose (Postgres), and CI (GitHub Actions) quickstart so contributors can run and validate the project locally and in CI.

This plan implements Milestone 0 from docs/milestones.md and defines a minimal, well-scoped deliverable: workspace scaffolding (backend + frontend), Prisma schema scaffold and idempotent seed, Dockerfiles and a docker-compose that provides a Postgres dev database, Bun scripts to install/run/lint/format, and a lightweight GitHub Actions CI that validates install, Prisma client generation, linting, and unit tests. The goal is to make the developer quickstart reproducible and documented (README quickstart) so reviewers and new contributors can reproduce a dev environment reliably.

[Types]  
Define TypeScript DTOs and Prisma models aligning OpenAPI shapes to DB models.

- Type system changes (single sentence):
  - Add Prisma models and TypeScript DTOs mapping to OpenAPI request/response schemas (User, Emission, AuditLog, Site, CsvMapping, UploadJob, Report, ErpConnector) with explicit validation rules.

- Detailed type definitions and validation rules:
  - prisma/schema.prisma (canonical models; excerpt)
    - enum Role { ADMIN DATA_ENTRY AUDITOR VIEWER }
    - model User {
        id         String   @id @default(uuid()) @db.Uuid
        username   String   @unique
        passwordHash String
        role       Role
        createdAt  DateTime @default(now()) @db.Timestamptz
        updatedAt  DateTime @updatedAt
        deletedAt  DateTime?
      }
    - model Site {
        id        String  @id @default(uuid()) @db.Uuid
        name      String
        metadata  Json?
        createdAt DateTime @default(now())
      }
    - model Emission {
        id           String   @id @default(uuid()) @db.Uuid
        siteId       String   @db.Uuid
        emissionType String   @db.VarChar(50)
        value        Decimal  @db.Decimal(18,6)
        unit         String
        timestamp    DateTime
        referenceId  String?
        createdBy    String?  @db.Uuid
        createdAt    DateTime @default(now())
        updatedAt    DateTime @updatedAt
        deletedAt    DateTime?
        @@index([siteId, timestamp])
        @@index([emissionType])
      }
    - model AuditLog {
        id        String   @id @default(uuid()) @db.Uuid
        userId    String?  @db.Uuid
        action    String
        targetType String
        targetId  String?  @db.Uuid
        diff      Json?
        createdAt DateTime @default(now())
        @@index([userId, createdAt])
      }
    - model CsvMapping { id String @id @default(uuid()) @db.Uuid; name String; mapping Json; createdBy String? @db.Uuid; createdAt DateTime @default(now()) }
    - model UploadJob { id String @id @default(uuid()) @db.Uuid; userId String? @db.Uuid; fileUrl String?; status String; insertedCount Int?; failedCount Int?; errorFileUrl String?; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
    - model Report { id String @id @default(uuid()) @db.Uuid; siteId String @db.Uuid; periodFrom DateTime; periodTo DateTime; format String; fileUrl String?; status String; createdAt DateTime @default(now()) }
    - model ErpConnector { id String @id @default(uuid()) @db.Uuid; siteId String @db.Uuid; type String; config String; lastSyncAt DateTime?; status String; createdAt DateTime @default(now()) }
  - TypeScript DTOs (packages/backend/src/types/*.ts)
    - interface AuthRequest { username: string; password: string; }
    - interface AuthResponse { accessToken: string; refreshToken: string; tokenType: "Bearer"; }
    - interface EmissionCreateDTO { site_id: string; emission_type: string; value: string; unit: string; timestamp: string; reference_id?: string }
    - interface EmissionDTO extends EmissionCreateDTO { id: string; created_at: string; updated_at: string; created_by?: string }
    - interface Pagination { total: number; page: number; per_page: number }
  - Validation rules:
    - emission_type: string, maxLength 50
    - value: decimal >= 0 (use Zod and Decimal conversion)
    - unit: string, must be in configured units list (config driven)
    - timestamp: ISO 8601 date-time
    - Implement validation using Zod (recommended) at the service boundary; convert to Prisma types prior to persistence.

[Files]  
Single sentence describing file modifications.

Create scaffold files for a Bun monorepo (packages/backend, packages/frontend), Prisma schema and seed, Dockerfiles and docker-compose, CI workflow, lint/format configs, and update documentation.

- New files to be created (full paths + purpose):
  - docs/implementation_plan.md — Implementation plan (this file)
  - package.json (root) — Bun workspaces: packages/backend, packages/frontend; root scripts (install, format, lint)
  - .editorconfig — editor config
  - .prettierrc — formatting rules
  - .eslintrc.cjs — ESLint config (root)
  - .github/workflows/ci.yml — GitHub Actions CI for M0
  - .env.example — example env variables (DATABASE_URL, JWT_SECRET, PORT)
  - docker-compose.yml — Compose with services: postgres, backend (dev), frontend (dev)
  - prisma/schema.prisma — initial Prisma models (see Types)
  - prisma/seed.ts — idempotent seed script (Admin user, one Site, sample Emission rows, CsvMapping, UploadJob)
  - packages/backend/package.json — backend deps and scripts (dev, start, migrate:dev, seed, lint, test)
  - packages/backend/tsconfig.json — TypeScript config
  - packages/backend/Dockerfile — build/runtime Dockerfile for backend (Bun compatible)
  - packages/backend/src/index.ts — Express entrypoint with /api/health and route mounts
  - packages/backend/src/routes/emissions.ts — minimal POST /api/emissions and GET /api/emissions stubs
  - packages/backend/src/services/prismaClient.ts — Prisma client singleton
  - packages/backend/src/services/emissionService.ts — createEmission, listEmissions stubs
  - packages/backend/src/services/auditService.ts — writeAudit stub
  - packages/backend/src/types/*.ts — DTO definitions
  - packages/backend/tests/unit/* — unit tests skeleton (emissionService.spec.ts, auditService.spec.ts)
  - packages/frontend/package.json — frontend deps and scripts (dev, build)
  - packages/frontend/tsconfig.json — TS config
  - packages/frontend/Dockerfile — frontend container
  - packages/frontend/src/main.tsx — React entry
  - packages/frontend/src/App.tsx — minimal app that pings /api/health
  - scripts/dev/start-backend.sh — convenience script to run backend with env loading (optional)
  - scripts/dev/start-frontend.sh — convenience script to run frontend (optional)
  - README.md (root) — quickstart with Docker Compose, bun install, prisma generate/migrate dev, seed, dev start
  - docs/README.md — quick reference + Owner/ETA entry

- Existing files to be modified:
  - docs/milestones.md — add "Owner: @m.ansyarafi" under Milestone 0 and "ETA: 2025-08-28"
  - docs/README.md — include quickstart and docker-compose instructions

- Files to be deleted or moved:
  - None in M0.

- Configuration updates:
  - root package.json will include "workspaces": ["packages/*"]
  - add lint-staged & husky hooks in root package.json (optional)
  - .github/workflows/ci.yml references installing Bun via official install script in workflow

[Functions]  
Single sentence describing function modifications.

Add small service functions for Prisma client initialization, idempotent seeding, simple CRUD stubs, and audit log writes; these will be extended in later milestones.

- New functions (name, signature, file path, purpose)
  - createPrismaClient(): PrismaClient — packages/backend/src/services/prismaClient.ts — initialize and export singleton Prisma client with graceful shutdown.
  - seedDatabase(): Promise<void> — prisma/seed.ts — idempotent seeds: admin user, site, emissions, csv mapping, upload job.
  - startServer(port: number): Promise<void> — packages/backend/src/index.ts — start Express server, bind routes (/api/health, /api/emissions).
  - createEmission(dto: EmissionCreateDTO, userId?: string): Promise<EmissionDTO> — packages/backend/src/services/emissionService.ts — validate DTO, insert emission, call auditService.writeAudit (transactional behavior stub).
  - listEmissions(filters: object, page?: number, perPage?: number): Promise<{ data: EmissionDTO[]; pagination: Pagination; }> — packages/backend/src/services/emissionService.ts — basic pagination wrapper.
  - writeAudit(userId: string | null, action: string, targetType: string, targetId?: string, diff?: object): Promise<void> — packages/backend/src/services/auditService.ts — insert audit_log row.
  - healthCheck(): Promise<{ status: 'ok' }> — packages/backend/src/index.ts and packages/frontend/src/App.tsx to verify API reachability.

- Modified functions (none in M0 since this is scaffolding)
  - No existing code to modify in M0.

- Removed functions
  - None.

[Classes]  
Single sentence describing class modifications.

Prefer lightweight service modules rather than heavy class hierarchies; create service modules for emissions, audit, uploads, and Prisma wrapper.

- New modules (file path, key exported methods)
  - packages/backend/src/services/prismaClient.ts — exports prisma: PrismaClient
  - packages/backend/src/services/emissionService.ts — exports createEmission, listEmissions, updateEmission (stub), softDeleteEmission (stub)
  - packages/backend/src/services/auditService.ts — exports writeAudit
  - packages/backend/src/workers/uploadWorker.ts — placeholder module (processUpload stub)
  - packages/backend/src/workers/reportWorker.ts — placeholder module (generateReport stub)

- Modified classes
  - None.

- Removed classes
  - None.

[Dependencies]  
Single sentence describing dependency modifications.

Add Bun-managed dependencies: Express, Prisma, @prisma/client, Zod, bcrypt, jsonwebtoken (placeholder), React, TailwindCSS, Vite (or Bun-compatible dev server), and dev tooling (TypeScript, eslint, prettier, vitest).

- Backend (packages/backend/package.json)
  - dependencies:
    - express
    - dotenv
    - zod
    - bcrypt
    - jsonwebtoken
    - @prisma/client (generated after prisma generate)
  - devDependencies:
    - prisma
    - typescript
    - ts-node (for seed)
    - vitest (unit tests)
    - eslint, prettier
- Frontend (packages/frontend/package.json)
  - dependencies:
    - react
    - react-dom
  - devDependencies:
    - tailwindcss
    - postcss
    - autoprefixer
    - vite (or Bun-compatible dev server)
    - typescript
- Root / CI:
  - Add GitHub Actions workflow that installs Bun and runs Bun commands (bun install, bunx prisma generate, bun workspace run lint/test).
- Version guidance:
  - Use recent stable major versions (express ^4.18, prisma ^5.x, react ^18+, tailwindcss ^3.x). Pin versions in package.json per release policy.

[Testing]  
Single sentence describing testing approach.

Provide unit tests for service modules and integration smoke tests that validate Prisma migrations + seed + basic API health endpoints using docker-compose Postgres.

- Unit tests:
  - packages/backend/tests/unit/emissionService.spec.ts — test validation behavior and that createEmission invokes prisma.create with expected args (mock prisma).
  - packages/backend/tests/unit/auditService.spec.ts — ensure writeAudit formats and persists expected object (mocked).
  - Use Vitest (fast) and run under Bun where supported.
- Integration tests:
  - packages/backend/tests/integration/emission-api.spec.ts — boots docker-compose Postgres, runs bunx prisma migrate dev against it, runs seed, starts backend in test mode, performs HTTP POST /api/emissions and asserts DB row and audit row present.
  - Provide script scripts/test/integration.sh that orchestrates bringing up DB, running migrations, running tests.
- Smoke tests:
  - scripts/test/smoke.sh — curl /api/health and a simple POST/GET to emissions endpoint.
- CI:
  - jobs: install-bun, install-deps, prisma-generate, lint, unit-tests. Integration tests can be gated in a separate workflow (optional for M0).
- Test data:
  - prisma/seed.ts provides sample data used in integration tests.
- Acceptance criteria for tests:
  - Unit tests pass locally.
  - CI job completes lint + unit tests and prisma generate.

[Implementation Order]  
Single sentence describing the implementation sequence.

Implement in small atomic commits: scaffold repo → Prisma schema + seed → Dockerfiles + docker-compose → backend Hello World + prisma client + seed runner → frontend Hello World → dev scripts + lint/format → CI workflow → docs update → verification.

Numbered steps (detailed order)
1. Initialize root workspace
   - Add root package.json with Bun workspaces: ["packages/*"].
   - Add .editorconfig, .prettierrc, .eslintrc.cjs.
2. Add Prisma scaffold
   - Create prisma/schema.prisma (models per Types section).
   - Add .env.example with DATABASE_URL pointing to docker-compose Postgres.
   - Add prisma/seed.ts implementing seedDatabase() and export for bunx ts-node.
3. Add Docker + Compose
   - Add Dockerfile for backend (Bun runtime image or node + bun install).
   - Add Dockerfile for frontend.
   - Add docker-compose.yml with postgres:15, backend, frontend services. Postgres env: POSTGRES_PASSWORD=postgres; database: carbon_dev.
4. Implement backend minimal app
   - packages/backend/src/index.ts: Express app, /api/health, mount emissions router.
   - packages/backend/src/services/prismaClient.ts: export prisma instance.
   - packages/backend/src/services/emissionService.ts: createEmission, listEmissions stubs.
   - packages/backend/src/services/auditService.ts: writeAudit stub.
   - packages/backend/src/routes/emissions.ts: POST and GET endpoints that call services.
   - packages/backend/package.json scripts: "dev", "start", "migrate:dev", "seed".
5. Implement seed and verify migrations locally
   - Run bunx prisma migrate dev --name init (developer run) and bunx prisma generate
   - Run bunx ts-node prisma/seed.ts (or bunx prisma db seed if configured)
6. Implement frontend minimal app
   - packages/frontend/src/App.tsx: ping /api/health and show status.
   - packages/frontend/package.json scripts: "dev", "build".
7. Add dev scripts and lint/format
   - Root scripts: "install", "dev" (starts back+front), "format", "lint".
   - Add husky + lint-staged hooks (optional).
8. Add GitHub Actions
   - .github/workflows/ci.yml: install Bun, bun install, bunx prisma generate, run lint, run unit tests.
9. Documentation and milestone update
   - Update docs/milestones.md: add Owner: @m.ansyarafi and ETA: 2025-08-28 under Milestone 0.
   - Update README.md quickstart with commands:
     - docker-compose up -d postgres
     - bun install
     - DATABASE_URL=... bunx prisma migrate dev --name init
     - bunx prisma generate
     - bunx ts-node prisma/seed.ts
     - bun workspace run dev
10. Verification / DoD
    - Verify docker-compose up brings Postgres; run migration and seed; start backend and frontend; verify /api/health returns ok.
    - Commit and open PR titled "T-SETUP.0: Milestone 0 scaffold + dev quickstart" and include Owner/ETA.

Notes and constraints
- Keep migrations additive and small. Migrations will be generated locally by the developer (Prisma recommended flow).
- For M0, do not implement auth flows, workers, or complex domain logic—only stubs / scaffolding to validate the dev environment.
- Dockerfiles should be optimized for Bun where possible; if Bun base images are not available, use lightweight Node base and install Bun during build.
- CI uses GitHub Actions and installs Bun via the official install script in the workflow.
