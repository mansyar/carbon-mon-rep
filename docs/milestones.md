# Milestones — Implementation Tracker

Purpose
- Track implementation progress across vertical slices, infra stories, and release milestones.
- Each milestone contains granular checkboxes for Backend, Frontend, Tests, OpenAPI, Docs, and Deployment steps.
- Use PR titles with slice IDs (e.g., B.1.2) and update this file when a subtask completes.

How to use
- Update checkboxes as work completes.
- Add "Owner: <github-handle>" and "ETA: <date>" where needed.
- Link PRs/Issue numbers next to completed items.
- Keep each milestone concise and focused to one sprint (1 week) where possible.

Milestones (mapped from TDD / vertical-slices)

- Milestone 0 — Project Setup (Week 0)
  - [ ] Repo skeleton verified (monorepo packages present)
  - [ ] Dev scripts: install, dev, format, lint
  - [ ] DB migrations & seed runnable (`prisma migrate dev`, `prisma db seed`)
  - [ ] "Hello World" backend and frontend running
  - DoD: dev env reproducible, README quickstart validated
  - Owner: @m.ansyarafi
  - ETA: 2025-08-28

- Milestone 1 — Authentication & RBAC (Week 1)
  - Slice IDs: A.1.1, A.1.2, A.2.1
  - [ ] Backend: JWT login, refresh, revocation, RBAC middleware
  - [ ] DB: roles/permissions schema + seed
  - [ ] Frontend: login page + role-aware navigation
  - [ ] Tests: unit + integration for auth flows
  - [ ] OpenAPI updated for auth endpoints
  - DoD: login+refresh work end-to-end, Admin role seed present

- Milestone 2 — Data Entry (Manual) (Week 2)
  - Slice IDs: B.1.1, B.1.2, B.1.3
  - [ ] Backend: Emissions CRUD endpoints, transactional audit logging
  - [ ] DB: emissions table migration + indexes
  - [ ] Frontend: Data Entry form, list view
  - [ ] Tests: validator unit tests, integration for POST/PUT/DELETE
  - [ ] OpenAPI updated for emissions endpoints
  - DoD: create/edit/delete persist audit rows; API + FE validated

- Milestone 3 — Bulk Uploads (Week 3)
  - Slice IDs: C.1.1, C.1.2, C.2.1
  - [ ] Backend: upload endpoint, upload metadata, enqueue processing job
  - [ ] Worker: streaming parser, per-row validation, partial commit, error report generation
  - [ ] Frontend: bulk upload UI, progress polling, results download
  - [ ] Templates: upload template CRUD
  - [ ] Tests: parser/validator unit tests, integration for processing job
  - DoD: partial successes allowed, downloadable error report

- Milestone 4 — Reporting (Week 4)
  - Slice IDs: D.1.1, D.1.2
  - [ ] Backend: report queueing API, report record lifecycle
  - [ ] Worker: aggregation, charts, PDF/Excel generation, storage
  - [ ] Frontend: report builder UI + history
  - [ ] Tests: worker integration, end-to-end generate+download
  - DoD: queued generation works and files downloadable

- Milestone 5 — Audit Logs & Exports (Week 5)
  - Slice IDs: E.1.1, E.1.2, E.1.3
  - [ ] Backend: audit_logs schema, read endpoints, export job
  - [ ] Frontend: audit log viewer + filters + export
  - [ ] Tests: ensure operations create audit rows; export correctness
  - DoD: filters, pagination, and export produce correct files

- Milestone 6 — Configurations & Admin UX (Week 6)
  - Slice IDs: F.1 (configs), CSV template polish
  - [ ] Backend: configurations API (units, date format)
  - [ ] Frontend: admin configs page
  - [ ] Tests: config API + effect on UI/formatting
  - DoD: configs editable and audited

- Milestone 7 — Deployment & Final Testing (Week 7)
  - [ ] Dockerfiles and container images for BE/FE
  - [ ] CI: lint, tests, coverage gates, migrates in pipeline
  - [ ] Deploy to staging (Coolify) and run smoke tests
  - [ ] Load / performance baseline for uploads & reports
  - DoD: staging-ready, smoke tests green, deployment docs updated

Cross-cutting technical stories (T-*)
- T-Audit-01 — Audit logging infra & migration
  - [ ] Migration committed
  - [ ] Writer service and API endpoints
  - [ ] Export worker
- T-CSV-01 — CSV/Excel mapping & validation engine
  - [ ] Template CRUD
  - [ ] Streaming parser & validator
  - [ ] Error report generation
- T-Reports-01 — Scheduled & queued report worker
  - [ ] Scheduler, enqueueing, delivery

Tracking conventions
- Prefix PR titles with Slice ID: `B.1.2: Implement create emission + audit logging`
- Update this file when a major subtask completes (include PR link)
- Use "Owner" and "ETA" fields for each milestone entry where relevant
- Keep checkboxes minimal and decisive (done/undone)

Appendix
- Links:
  - FRD: docs/FRD.md
  - TDD: docs/TDD.md
  - Vertical slices: docs/vertical-slices.md
  - OpenAPI: docs/openapi.yaml
  - Samples: docs/samples/
