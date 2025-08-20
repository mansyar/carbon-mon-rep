# Migration Plan & Runbook — Prisma Migrate (Postgres)

## Purpose

This document describes the recommended migration workflow, CI/CD integration, rollback strategy, zero-downtime rules, and operational runbook for applying schema changes using Prisma Migrate against PostgreSQL.

## Tooling & Recommendation

- Use Prisma + Prisma Migrate (aligns with chosen tech stack).
- Local dev: use `bunx prisma migrate dev` to generate migrations and update the client.
- CI / Production: use `bunx prisma migrate deploy` to apply already-reviewed migrations.
- Generate Prisma client with `bunx prisma generate`.

## Repository Layout (convention)

- prisma/
  - schema.prisma
  - migrations/
  - seed.ts
- docs/db/SCHEMA.md
- docs/db/MIGRATION_PLAN.md (this file)

## Migration Naming & Versioning

- Use timestamped descriptive names: `YYYYMMDDHHMMSS_add_upload_job_table`
- Each migration folder created by Prisma contains `migration.sql`; keep changes small and atomic.
- Avoid combining unrelated changes in a single migration.

## Development Workflow (developer)

1. Update `prisma/schema.prisma`.
2. Run locally:
   ```bash
   # Create migration and update local DB (dev)
   bunx prisma migrate dev --name add_some_field
   # Regenerate client
   bunx prisma generate
   ```
3. Run app tests and manual smoke checks against local dev DB.
4. Commit migration folder + `schema.prisma` to feature branch and open PR.

## Review & Pull Request

- PR must include:
  - PM/engineer rationale for schema change
  - Estimated data migration/backfill cost (rows, time)
  - DB impact assessment (indexes, full-table scans, locks)
- Reviewer checks migration SQL (inside generated migration) for potentially destructive statements.

## CI/CD Integration

- CI Pipeline:
  - Run `bunx prisma migrate status` against ephemeral/test DB to detect mismatch.
  - Run tests against migrated ephemeral DB.
- Deploy Pipeline:
  - Step: `bunx prisma migrate deploy` (applies pending migrations)
  - Step: run post-migration smoke tests (auth, create emission, list emissions)
  - If `prisma migrate deploy` fails, stop deployment and trigger rollback runbook.

Example CI snippet:

```bash
# Create ephemeral DB in CI (or use testing DB)
bunx prisma migrate status --schema=prisma/schema.prisma
bunx prisma migrate deploy
bunx prisma generate
bun test
```

## Production Runbook (procedural)

Pre-checks (before running migrations):

- Ensure recent DB backup / snapshot is available
- Confirm pending migrations in repo have been reviewed and approved
- Run migration in staging with production-like data if possible
- Notify stakeholders and schedule maintenance window if migration includes large data changes

Execution:

1. Backup DB (snapshot or logical backup)
2. Run `bunx prisma migrate deploy` on the production host (or run via deployment job)
3. Run smoke tests (health check, create/read emissions, login)
4. Monitor DB metrics and application logs for 15–30 minutes

Post-execution:

- If success: mark migration as deployed in release notes.
- If failure: follow rollback procedure.

## Rollback Strategy

- Prefer forward fixes and data-compatible changes over destructive down-migrations.
- Prisma down-migrations are generally not recommended for production rollback.
- Rollback options:
  - Restore DB from pre-migration backup (full restore) — the safest option for destructive changes.
  - If schema change is additive (e.g., new nullable columns, new tables), deploy a forward fix to adapt application code instead of rollback.
- Document required restore steps and test restore regularly.

## Zero-downtime Migration Guidelines

- Additive-first pattern:
  1. Add new nullable column or new table in migration A
  2. Deploy code that writes both old and new fields (dual-write) or tolerates absent new field
  3. Backfill existing rows with a background job (batched)
  4. Make column NOT NULL (if needed) in a later migration after backfill
  5. Remove legacy column/behavior in final migration release
- Index additions:
  - Creating an index may lock depending on Postgres version and configuration. Use `CREATE INDEX CONCURRENTLY` for large tables (requires separate SQL run, not inside a transaction).
- Avoid long-running migrations inside a single transaction (Prisma-generated migrations are transactional by default). For large data changes, implement out-of-band scripts.

## Data Migrations & Backfills

- Separate structural migrations from large data migrations.
- For heavy backfills:
  - Implement as a separate job (TypeScript / worker) that runs in batches and reports progress.
  - Use cursor-based batching (e.g., window on primary key or created_at).
  - Monitor progress and errors; provide a resumable mechanism.

## Backup & Recovery

- Before any production migration, take a full DB snapshot and logical backup:
  - Logical: `pg_dump` (for compatibility)
  - Snapshot: cloud provider snapshot (fast restore)
- Validate backup integrity periodically by restoring to a test cluster.

## Testing Migrations

- Add migration tests in CI:
  - Apply migrations to ephemeral DB
  - Run schema validation tests (e.g., expected tables/columns exist)
  - Run application smoke tests
- Optionally run `prisma migrate resolve` during recovery if partial migrations exist.

## Operational Notes for Prisma

- `prisma migrate dev` is intended for development. Do not run it in production.
- Use `prisma migrate deploy` in production.
- Keep `schema.prisma` and migration folders under version control.
- For concurrent deployments, ensure only one migration runner executes `prisma migrate deploy` at a time (e.g., lock in deployment pipeline).

## Security & Sensitive Fields

- Do not store plaintext secrets in DB migrations or in schema files.
- For encrypted fields (ERP connector config), persist ciphertext and include metadata (algorithm, KMS key id) in the config JSON.

## Example Commands

```bash
# Local dev flow
bunx prisma migrate dev --name init
bunx prisma generate
bunx ts-node prisma/seed.ts

# Apply production migrations (CI/CD)
bunx prisma migrate deploy
bunx prisma generate
```

## Common Migration Checklist

- [ ] Migration SQL reviewed in PR
- [ ] Impact assessment documented
- [ ] Backup/snapshot taken
- [ ] Staging migration validated
- [ ] Rollback plan prepared
- [ ] Stakeholders notified (if maintenance window required)

## Troubleshooting

- If `prisma migrate deploy` errors:
  - Inspect generated SQL in `prisma/migrations/<migration>/migration.sql`
  - Check DB logs for locking or permission errors
  - If stuck, restore from backup or run `prisma migrate resolve` to mark migrations manually after recovery (use with caution)

---

Document owner: Platform / Backend
Last updated: 2025-08-18
