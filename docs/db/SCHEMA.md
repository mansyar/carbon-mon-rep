# Database Schema & Conventions — Carbon Emission Monitoring

## Purpose

This document captures the canonical database design, naming conventions, data types rationale, indexing strategy, soft-delete pattern, and links to Prisma schema, ERD, migration guidance, and seeds. It is intended to let backend, QA, and DevOps implement and run the database with minimal ambiguity.

## Scope

Covers the core models required for MVP:

- Users & Roles
- Sites
- Emissions
- Audit logs
- Configurations
- CSV mappings & Upload jobs
- Reports
- ERP connectors

It also references:

- prisma/schema.prisma (canonical Prisma schema)
- docs/db/ERD.mmd (Mermaid ERD)
- docs/db/MIGRATION_PLAN.md (migration strategy & runbook)
- prisma/seed.ts (sample seed data)

## Assumptions & Decisions

- Database: PostgreSQL (managed)
- ORM + Migrations: Prisma + Prisma Migrate
- Primary keys: UUID (string) using PostgreSQL uuid type
- Time fields: timestamptz (Prisma `DateTime`) with `@default(now())`
- Numeric emission `value`: high-precision decimal (use Prisma Decimal / @db.Decimal(18,6))
- Soft-delete: `deletedAt: DateTime?` (NULL => active)
- No partitioning initially (can be added later)
- Encryption of sensitive fields (e.g., ERP connector credentials) is performed at the application layer before persisting; store ciphertext and metadata

## Naming Conventions

- Table names: singular, lower_snake_case (e.g., `user`, `emission`)
- Column names: lower_snake_case
- Primary key column: `id`
- Timestamps: `created_at`, `updated_at`, `deleted_at`
- Foreign keys: `<referenced_table>_id` (UUID)
- Index names: `idx_<table>_<cols>`; unique constraints: `uq_<table>_<cols>`

## Data Types & Rationale

- UUID primary keys for global uniqueness and easier federation across services.
- `timestamptz` for all timestamp fields to avoid timezone ambiguity.
- `numeric`/`decimal` for emissions `value` to avoid float precision issues.
- JSONB for flexible fields (e.g., `site.metadata`, `csv_mapping.mapping`, `audit_log.diff`).
- Use application-level validation for business rules (units, emission_type max length, non-negative values).

## Core Models (summary)

Below are high-level descriptions. See `prisma/schema.prisma` for the canonical schema.

- User

  - id: UUID PK
  - username: unique
  - password_hash: text (bcrypt)
  - role: enum (ADMIN, DATA_ENTRY, AUDITOR, VIEWER)
  - created_at, updated_at, deleted_at

- Site

  - id: UUID PK
  - name: text
  - metadata: JSONB (optional)
  - created_at

- Emission

  - id: UUID PK
  - site_id: FK -> site.id
  - emission_type: varchar(50)
  - value: decimal(18,6)
  - unit: varchar(10)
  - timestamp: timestamptz (the event time)
  - reference_id: varchar (optional)
  - created_by: FK -> user.id (nullable, e.g., from ERP import)
  - created_at, updated_at, deleted_at

- AuditLog

  - id: UUID PK
  - user_id: FK (nullable for system actions)
  - action: text (e.g., "create_emission", "update_user_role")
  - target_type: text (e.g., "emission", "user")
  - target_id: UUID (nullable)
  - diff: JSONB (old/new or row-level changes)
  - created_at (timestamp)

- Configuration

  - id: UUID PK
  - key: varchar
  - value: text (or JSONB for structured values)
  - scope: text (global / site)
  - created_at, updated_at

- CsvMapping

  - id: UUID PK
  - name: text
  - mapping: JSONB
  - created_by: FK -> user.id
  - created_at

- UploadJob

  - id: UUID PK
  - user_id: FK
  - file_url: text
  - status: enum (PENDING, PROCESSING, COMPLETED, FAILED)
  - inserted_count, failed_count
  - error_file_url: text (optional)
  - created_at, updated_at

- Report

  - id: UUID PK
  - site_id: FK
  - period_from, period_to: date / timestamptz
  - format: enum (PDF, EXCEL)
  - file_url: text
  - status: enum (QUEUED, READY, FAILED)
  - created_at

- ErpConnector
  - id: UUID PK
  - site_id: FK
  - type: enum (SAP, ODOO, GENERIC)
  - config: text (encrypted JSON)
  - last_sync_at: timestamptz
  - status: enum (ENABLED, DISABLED, ERROR)
  - created_at

## Indexing Strategy

- Emission: index on (site_id, timestamp) for time-range queries per site
- Emission: index on emission_type for filtering
- Partial index on deleted_at IS NULL for "active rows" queries (speeds lists where soft-delete used)
- AuditLog: index on (user_id, created_at) and (target_type, target_id)
- Configuration: unique index on (key, scope)

## Referential Actions

- Avoid cascading deletes. Use `ON DELETE NO ACTION` or `RESTRICT` and let application handle soft-delete propagation/backfill.
- When deleting a site, mark site.deleted_at and optionally mark dependent emissions.deleted_at in a background job.

## Retention & Archival

- Audit logs retention configurable (default 2 years per FRD).
- Implement scheduled job to archive audit logs older than retention to separate archival storage (S3) and remove from DB if needed.
- For now, keep logs in DB and plan archival in MIGRATION_PLAN.md / runbook.

## Soft-delete Pattern

- Add nullable `deleted_at` timestamp to tables requiring soft-delete (`user`, `emission`, `site`).
- Application code must always filter `WHERE deleted_at IS NULL` for active rows.
- Create partial index to optimize those queries:
  - Example SQL: `CREATE INDEX idx_emission_active ON emission (site_id, timestamp) WHERE deleted_at IS NULL;`

## Prisma-specific notes

- Use `schema.prisma` with:
  - datasource: provider = "postgresql"
  - generator: client = "prisma-client-js"
- Use `Decimal` for `value` fields and annotate `@db.Decimal(18,6)` where precision is required.
- Use `String @id @default(uuid()) @db.Uuid` for UUID PKs.
- Use `@@index` and `@@unique` in Prisma models per indexing strategy.
- Recommended Prisma commands:
  - Local dev: `bunx prisma migrate dev --name init`
  - CI / Deploy: `bunx prisma migrate deploy`
  - Generate client: `bunx prisma generate`

Example Prisma model snippet (extract)

```prisma
model Emission {
  id            String   @id @default(uuid()) @db.Uuid
  siteId        String   @db.Uuid
  emissionType  String   @db.VarChar(50)
  value         Decimal  @db.Decimal(18, 6)
  unit          String
  timestamp     DateTime
  referenceId   String?
  createdBy     String?  @db.Uuid
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  @@index([siteId, timestamp])
  @@index([emissionType])
}
```

## Seeds & Test Data

- Provide `prisma/seed.ts` that inserts:
  - 1 Admin user (with placeholder password hashed by the app during onboarding)
  - 1 Site
  - 10 sample Emission rows across dates
  - 1 CsvMapping example
  - 1 UploadJob sample
- Seed script should be idempotent where practical (use `upsert`).

## Files to review / next

- `prisma/schema.prisma` — canonical Prisma schema (will be created)
- `docs/db/ERD.mmd` — Mermaid ERD (will be created)
- `docs/db/MIGRATION_PLAN.md` — migration plan & runbook (will be created)
- `prisma/seed.ts` — seed script (will be created)
- `examples/sql/001_init.sql` — optional raw SQL for ops (will be created)

## Validation & Acceptance Criteria

- Prisma schema maps to OpenAPI `Emission` fields (site_id, emission_type, value, unit, timestamp, reference_id).
- ERD renders with Mermaid and matches models.
- Migrations generated via `bunx prisma migrate dev` on a dev DB should create tables and indexes described here.
- Seed script populates minimal data for dev/test flows.

## Quick References & Commands

- Generate Prisma client:

```bash
# Bun
bunx prisma generate
# or using pnpm
pnpm prisma generate
```

- Create a migration locally:

```bash
bunx prisma migrate dev --name init
```

- Apply migrations in CI / production:

```bash
bunx prisma migrate deploy
```

- Run seed (if configured via package.json):

```bash
bunx ts-node prisma/seed.ts
# Or `ts-node` for TypeScript seed files
```

---

Document owner: Platform / Backend
Last updated: 2025-08-18
