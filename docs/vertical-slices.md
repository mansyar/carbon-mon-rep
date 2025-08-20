# Vertical-slice story template & Pilot: Emissions CRUD (Epic B)

This document provides a small story template that enforces vertical slicing (UI ↔ API ↔ DB ↔ Tests ↔ NFR) and a pilot conversion of Epic B (Emissions Data CRUD) from the FRD into sprint-sized vertical slices.

## Template: Vertical Slice (use for each story)
- Title: short name
- Epic: parent epic
- Slice ID: e.g., B.1.1
- Story (user-facing): "As a [persona], I want ... so that ..."
- UI
  - Screen / component(s)
  - Primary interactions
  - Wireframe / mockup link (file path or URL)
  - Client-side validation rules
- API
  - Endpoint(s): HTTP method + path
  - Request sample (JSON)
  - Response sample (JSON)
  - Error cases and status codes
- DB / Persistence
  - Table(s) affected, columns, and migration summary
  - Referential constraints and indexes
- Background / Jobs
  - Any async processing, queues, CRON jobs, or notifications
- Acceptance Criteria (clear, testable)
  - Functional criteria (what must be true)
  - Observability (logs/metrics to verify)
- Tests
  - Unit tests (services, validators)
  - Integration tests (API + DB)
  - E2E test (user flow)
- Non-functional requirements (NFR)
  - Latency, throughput, retention, security constraints
- Definition of Done (DoD)
  - Code review, coverage, OpenAPI updated, staging deployed
- Estimated size / sprint allocation

---

## Pilot conversion: Epic B — Emissions Data CRUD

Epic B summary: create/edit/delete/list emissions records with audit logging and filtering/pagination.

### Slice B.1.1 — FE: Single Emission Form (Create flow)
- Epic: B — Emissions Data CRUD
- Slice ID: B.1.1
- Story: As a Data Entry user, I want a form to add a single emission entry so that emissions are recorded per site.
- UI:
  - Screen: "Data Entry → Add Emission" modal or page
  - Fields: site_id (select), emission_type (text/lookup), value (number), unit (select), timestamp (datetime), reference_id (optional)
  - Client validation: required fields, value >= 0, timestamp ISO local, unit in configured set
  - UX: show server-side errors inline; success toast and navigate to Emissions list
  - Mockup: docs/mockups/data-entry.md
  - UX: show server-side errors inline; success toast and navigate to Emissions list
  - Mockup: docs/mockups/data-entry.md
- API:
  - OpenAPI: docs/openapi.yaml#/paths/~1emissions/post
  - POST /api/emissions
  - Request:
    {
      "site_id": "string",
      "emission_type": "string",
      "value": 123.45,
      "unit": "kg",
      "timestamp": "2025-08-18T07:00:00Z",
      "reference_id": "optional"
    }
  - Response: 201 { "id": "...", ...created record... }
  - Errors: 400 validation errors, 401 unauthorized, 422 business rules
- DB:
  - Table: emissions (id, site_id, emission_type, value, unit, timestamp, reference_id, deleted_at, created_by, created_at, updated_at)
  - Migration: add columns if missing; index on (site_id, timestamp)
- Background:
  - None for create; synchronous insert + audit log write
- Acceptance Criteria:
  - Client enforces validation and prevents submission when invalid
  - Successful submit returns 201 and record persisted
  - Audit log entry created: actor, action=create, resource_id, diff
- Tests:
  - Unit: validator tests, form component tests
  - Integration: POST /api/emissions inserts row and audit log
  - E2E: fill form -> submit -> verify list and DB (or API) contains record
- NFR:
  - API response <= 500ms under normal load
  - Audit log persisted within same transaction (or guaranteed eventual consistency documented)
- DoD:
  - OpenAPI updated for POST /emissions
  - Unit coverage >= 80% for new modules
  - Integration test added and passing
  - PR reviewed and merged, deployed to staging

### Slice B.1.2 — BE: Create Emission API & Audit Logging
- Epic: B
- Slice ID: B.1.2
- Story: As a system, create emission records via API with atomic audit logging.
- UI: N/A (API-focused)
- API:
  - OpenAPI: docs/openapi.yaml#/paths/~1emissions/post
  - POST /api/emissions (same as B.1.1)
  - Server validations: emission_type length <= 50, value numeric >= 0, unit exists in units table
- DB:
  - Insert into emissions; insert audit_logs (user_id, action, target_type='emission', target_id, timestamp, diff JSON)
  - Transactional semantics: prefer single DB transaction for consistency (or documented compensation flow)
- Background:
  - If heavy validation or enrichment required, push to background queue and return 202 (not in MVP)
- Acceptance Criteria:
  - Valid request -> 201 and both emissions + audit_logs rows present
  - Invalid request -> 400 and no DB changes
- Tests:
  - Unit tests for service layer and audit creation
  - Integration test asserting DB rows and transaction behavior
- NFR:
  - API handles 100 rps for writes in baseline environment
- DoD: same as template

### Slice B.1.3 — Tests & E2E for Create flow
- Epic: B
- Slice ID: B.1.3
- Story: Provide test coverage that validates the end-to-end Create flow.
- UI:
  - E2E uses the real form or API-driven E2E to simulate form submission
- API:
  - Use test harness with test DB
- Tests:
  - Unit: validator & service mocks
  - Integration: POST call -> DB assert + audit row
  - E2E: browser automation test to fill form and observe list updated
- Acceptance Criteria:
  - All tests green in CI pipeline
  - Coverage gates met

### Slice B.2.1 — BE: Update emission record (Edit)
- Epic: B
- Slice ID: B.2.1
- Story: As a Data Entry user, I want to update allowed fields on emission records.
- UI:
  - Screen: Emissions list → Edit modal with same validation rules
- API:
  - OpenAPI: docs/openapi.yaml#/paths/~1emissions~1{id}/put
  - PUT /api/emissions/{id}
  - Request: allowed fields only (value, unit, timestamp, emission_type, reference_id)
  - Response: 200 updated record
- DB:
  - Update row, set updated_by/updated_at
  - Write audit_log with diff (old vs new)
- Acceptance Criteria:
  - Only permitted users can update
  - Audit diff shows changed fields
- Tests: unit/integration/E2E similar to create
- NFR: soft-write latency < 700ms

### Slice B.2.2 — BE: Soft-delete emission record
- Epic: B
- Slice ID: B.2.2
- Story: As a Data Entry user with permission, I want to delete records using soft-delete.
- API:
  - OpenAPI: docs/openapi.yaml#/paths/~1emissions~1{id}/delete
  - DELETE /api/emissions/{id} -> 200
  - Behavior: set deleted_at, preserve history; optionally mark in audit_logs
- Acceptance Criteria:
  - Record excluded from standard list queries unless include_deleted flag used
  - Audit log records delete action
- Tests: integration for delete and list exclusion

### Slice B.3.1 — List & Pagination (FE + BE)
- Epic: B
- Slice ID: B.3.1
- Story: As an authorized user, I want to list emissions with filters & pagination.
- UI:
  - Emissions list page with filters: site_id, emission_type, date range, page controls
- API:
  - OpenAPI: docs/openapi.yaml#/paths/~1emissions/get
  - GET /api/emissions?site_id=&emission_type=&from=&to=&page=&per_page=
  - Response headers: X-Total, X-Page, X-Per-Page (or pagination object)
- DB:
  - Query supports indexes; limit/offset or cursor strategy documented
- Acceptance Criteria:
  - Filters behave correctly, pagination returns correct counts
- Tests:
  - Integration: seed data, assert expected pages and counts
  - E2E: apply filters and verify results

---

## Converted MUST Epics (Auth, Bulk Upload, Reporting, Audit Logs)

Below are vertical-slice conversions for the remaining MUST epics from the FRD. Use the same template fields for each slice when creating backlog items.

---

## Epic A — Authentication & Users (MUST)

Epic A summary: login, token management, user creation and role assignment with audit recording.

### Slice A.1.1 — FE: Login Screen
- Epic: A — Authentication & Users
- Slice ID: A.1.1
- Story: As a user, I want to login with username/password so that I can access the app.
- UI:
  - Screen: Login page/modal
  - Fields: username/email, password, remember_me checkbox, submit
  - Client validation: required fields, password min length
  - UX: show inline field errors, show generic auth error for invalid creds, "forgot password" link
  - Mockup: docs/mockups/login.md
- API:
  - OpenAPI: docs/openapi.yaml#/paths/~1auth~1login/post
  - POST /api/auth/login
  - Request: { "username": "user", "password": "secret" }
  - Response: 200 { "access_token": "jwt", "refresh_token": "r.tok", "expires_in": 3600 } or 401 on invalid
  - Errors: 401 invalid, 429 rate-limited
- DB:
  - Users table read; no schema change
- Background:
  - Rate-limit store (redis) or login attempt counter
- Acceptance Criteria:
  - Valid creds -> tokens returned, invalid -> 401, rate-limit enforced
- Tests:
  - Unit: form validation
  - Integration: POST /auth/login returns tokens for valid creds
  - E2E: login flow and token persistence
- NFR:
  - Login latency < 500ms; rate-limit configurable
- DoD:
  - OpenAPI updated for login, tests added

### Slice A.1.2 — BE: Auth Token & Refresh
- Epic: A
- Slice ID: A.1.2
- Story: Issue JWT access tokens and refresh tokens with revocation support.
- API:
  - OpenAPI: docs/openapi.yaml#/paths/~1auth~1refresh/post
  - POST /api/auth/refresh -> returns new access token
  - POST /api/auth/revoke -> revoke refresh token(s)
- DB:
  - Token revocation store (table or redis) to persist revoked refresh tokens / sessions
- Background:
  - Optional cleanup job for expired sessions
- Acceptance Criteria:
  - Refresh endpoint issues new access token when refresh token valid
  - Revoked tokens blocked
- Tests: unit/integration for token lifecycle
- NFR: secure token signing, secret rotation documented

### Slice A.2.1 — BE: User Management & Role Assignment
- Epic: A
- Slice ID: A.2.1
- Story: As an Admin, I want to create users and assign roles so that access is controlled.
- UI:
  - Admin Users page: create user, assign roles dropdown, view user list
- API:
  - OpenAPI: docs/openapi.yaml#/paths/~1users/post
  - POST /api/users, PUT /api/users/{id}/roles
- DB:
  - users table, user_roles join table
  - Audit: role changes recorded in audit_logs
- Acceptance Criteria:
  - Admin can create user and assign roles; role change writes audit entry
- Tests: integration for role assignment and audit row
- NFR: role change visible within 1s in subsequent auth checks

---

## Epic C — Bulk Upload (MUST)

Epic C summary: allow CSV/Excel bulk upload with per-row validation, partial success handling, template mapping.

### Slice C.1.1 — FE: Bulk Upload Page / UX
- Epic: C — Bulk Upload
- Slice ID: C.1.1
- Story: As a Data Entry user, I want to upload a CSV/Excel so many rows can be imported.
- UI:
  - Page: Bulk Upload with file picker, template selector, mapping UI, upload progress and results table
  - Client validation: file type, max rows file size
  - Mockup: docs/mockups/bulk-upload.md
- API:
  - OpenAPI: docs/openapi.yaml#/paths/~1emissions~1bulk/post (bulk upload)
  - POST /api/uploads/emissions (multipart/form-data) -> returns upload_id
  - GET /api/uploads/{upload_id}/status -> returns progress and per-row summary  (TODO: add status/results endpoints to docs/openapi.yaml)
  - GET /api/uploads/{upload_id}/results -> download errors CSV/PDF  (TODO: add status/results endpoints to docs/openapi.yaml)
- Acceptance Criteria:
  - Client shows progress, allows selecting mapping/template
  - Downloadable error report available after upload
- Tests: E2E for upload flow and result retrieval
- NFR: support files up to N MB, progress updates within 2s

### Slice C.1.2 — BE: Upload Processing & Per-row Validation
- Epic: C
- Slice ID: C.1.2
- Story: Process uploaded file, validate rows, insert successful rows, produce error report for failures.
- API:
  - OpenAPI: docs/openapi.yaml#/paths/~1emissions~1bulk/post
  - Accept file and mapping, persist upload metadata, enqueue processing job -> return 202 with upload_id
- DB:
  - uploads table (id, user_id, status, total_rows, success_count, failure_count, created_at)
  - Insert successful emissions rows; write per-row error records to uploads_errors table or store error CSV in object storage
- Background:
  - Worker job reads file, validates each row, writes success/failure; emits progress events
- Acceptance Criteria:
  - Partial success allowed: successes persisted, failures reported
  - Per-row result downloadable
- Tests: unit for validator, integration for processing job using fixture files
- NFR: worker processes X rows/minute baseline; support retries for transient failures

### Slice C.2.1 — BE/FE: CSV Template Management & Mapping
- Epic: C
- Slice ID: C.2.1
- Story: As an Admin, I want to define CSV templates and mappings for uploads.
- UI:
  - Admin UI to upload template, define column->field mappings, save templates
- API:
  - POST /api/upload-templates, GET /api/upload-templates
- DB:
  - upload_templates table stores mapping JSON
- Acceptance Criteria:
  - Templates persisted and selectable on upload
- Tests: integration for template CRUD

---

## Epic D — Reporting (MUST)

Epic D summary: generate site/date-range reports (PDF/Excel) with charts; support queued generation for heavy reports and scheduled reports.

### Slice D.1.1 — FE: Report Builder UI
- Epic: D — Reporting
- Slice ID: D.1.1
- Story: As a Viewer or Auditor, I want to generate a report for a site and date range.
- UI:
  - Reports page: site selector, date range picker, interval selector (daily/weekly/monthly), generate button, history table with download links
  - Mockup: docs/mockups/reports.md
- API:
  - (TODO) Add report endpoints to docs/openapi.yaml:
    - POST /api/reports/generate
    - GET /api/reports/{report_id}/status
    - GET /api/reports/{report_id}/download
  - POST /api/reports/generate -> { report_id } (queues job)
  - GET /api/reports/{report_id}/status
  - GET /api/reports/{report_id}/download -> PDF/Excel
- Acceptance Criteria:
  - UI queues generation and shows status, downloadable file when ready
- Tests: E2E generate flow and download

### Slice D.1.2 — BE: Report Generation Worker (PDF/Excel)
- Epic: D
- Slice ID: D.1.2
- Story: Generate PDF/Excel reports with charts and summary; support queuing for heavy jobs.
- API/Jobs:
  - Worker consumes job, queries emissions aggregated by interval, renders charts, writes file to storage, updates report record
- DB:
  - reports table (id, user_id, site_id, params JSON, status, file_path, created_at)
- Acceptance Criteria:
  - Generated files include charts and expected summary numbers; large requests processed asynchronously
- Tests: integration for worker job and file generation assertions
- NFR: generation for typical month < 30s; heavy loads queued and retried

### Slice D.2.1 — BE: Scheduled Reports (SHOULD -> TECH STORY)
- Epic: D
- Slice ID: D.2.1
- Story: Admin configures scheduled report generation and recipients; reports generated and delivered.
- Note: mark as SHOULD/technical; include as separate infra story for scheduling and delivery
- Acceptance Criteria:
  - Configurable schedule stored, worker runs on schedule, email/link delivery works

---

## Epic E — Audit Logging & Exports (MUST)

Epic E summary: capture audit events for changes/uploads and provide filtered views and exports.

### Slice E.1.1 — BE: Audit Logging Infrastructure
- Epic: E — Audit Logging & Exports
- Slice ID: E.1.1
- Story: Implement persistent audit logging for key actions (create/update/delete/uploads, role changes).
- API:
  - Internal service writes audit_logs table entries: user_id, action, target_type, target_id, timestamp, diff JSON, context
- DB:
  - audit_logs table with indexes on user_id, target_type, timestamp
- Background:
  - Optional archiver job for retention policy
- Acceptance Criteria:
  - Actions produce audit rows with required fields; retention/archiving configurable
- Tests: unit for writer, integration that operations create audit rows

### Slice E.1.2 — FE: Audit Log View & Filters
- Epic: E
- Slice ID: E.1.2
- Story: As an Auditor or Admin, I want to view audit logs filtered by site, user, action, and date range.
- UI:
  - Audit logs page with filters, pagination, export button
  - Mockup: docs/mockups/audit-logs.md
- API:
  - (TODO) Add audit-log endpoints to docs/openapi.yaml:
    - GET /api/audit-logs
    - POST /api/audit-logs/export
  - GET /api/audit-logs?site_id=&user_id=&action=&from=&to=&page=&per_page=
  - GET /api/audit-logs/download?format=pdf/csv&filters=...
- Acceptance Criteria:
  - Filters function correctly, exports produce expected file
- Tests: integration for filtering and export generation

### Slice E.1.3 — BE: Audit Log Export
- Epic: E
- Slice ID: E.1.3
- Story: Support export of audit logs to PDF/CSV with proper formatting and retention handling.
- API:
  - POST /api/audit-logs/export -> { export_id } queued, GET /api/audit-logs/exports/{export_id}/download
- Background:
  - Worker to stream selected logs and produce CSV/PDF (paged to avoid memory spikes)
- Acceptance Criteria:
  - Export respects filters, includes diffs, and is downloadable
- Tests: integration for export job and file correctness

---

## Technical stories: Cross-cutting infrastructure (extract & implement)

Create dedicated technical stories for core infra concerns that multiple vertical slices will depend on. Each technical story should be treated as an independent backlog item with clear acceptance criteria, migrations, tests, and rollout plan.

### T-Audit-01 — Audit Logging Infrastructure & Migration
- Goal: Provide reliable, queryable, and exportable audit logging for all critical actions (create/update/delete, uploads, role changes).
- Scope:
  - Schema: create `audit_logs` table (id, user_id, action, target_type, target_id, timestamp, diff JSON, context JSON, metadata).
  - Indexes on (target_type, target_id), (user_id), and timestamp.
  - Migration script and seed for existing important events if applicable.
  - API: internal write service; public API endpoints for read/filter/export already defined in slices (GET /api/audit-logs, POST /api/audit-logs/export).
  - Retention: configurable retention policy and archiver job (archiver moves old logs to cheaper storage or deletes per policy).
- Background jobs:
  - Archiver/retention job
  - Optional async writer for high-throughput paths (with guaranteed delivery/retry)
- Acceptance Criteria:
  - All write paths create an audit row with required fields
  - Queries supporting filters (site/user/action/date) return correct results and respect pagination
  - Export job produces correctly formatted CSV/PDF
  - Migration tested and reversible
- Tests:
  - Unit tests for writer and serializer
  - Integration tests asserting that create/update/delete operations produce audit rows
  - Load test for write throughput and archiver behavior
- DoD:
  - Migration committed, tested, OpenAPI/read endpoints implemented, exports validated, staging smoke-tested

### T-CSV-01 — CSV/Excel Mapping & Validation Engine
- Goal: Implement a reusable engine for parsing, mapping, validating, and reporting results for uploaded CSV/Excel files.
- Scope:
  - Store templates mapping (upload_templates table) with column->field JSON, sample file, and validation rules metadata.
  - Parsing layer that supports CSV and common Excel formats, streaming processing to avoid high memory usage.
  - Validation rules engine pluggable by field (type checks, ranges, allowed enums, cross-field rules).
  - Error reporting: per-row error records persisted or error CSV generated in object storage; downloadable via GET /api/uploads/{id}/results.
  - Progress & retry semantics: worker reports progress and supports retry on transient failures.
  - Security: sanitize inputs, virus-scan uploaded files (or integrate gateway that scans).
- Background jobs:
  - Upload processor worker (streaming, row-by-row validation, bulk insert for successful batches)
  - Error report generator (CSV/PDF)
- Acceptance Criteria:
  - Templates can be created and selected during upload
  - CSV/Excel uploads produce per-row results with partial successes possible
  - Memory usage remains bounded for large files (streaming)
  - Error report downloadable and correctly references row numbers and error messages
- Tests:
  - Unit tests for parser, mapper, and validator rules
  - Integration tests with fixture files covering success, failure, and partial cases
  - E2E test for front-end upload -> background processing -> results retrieval
- DoD:
  - Template CRUD implemented, upload processing worker deployed to staging, performance baseline documented

### T-Reports-01 — Scheduled & Queued Report Worker
- Goal: Provide reliable queued generation of heavy reports, scheduled report execution, and delivery mechanisms.
- Scope:
  - Reports table and job queueing (reports table already included in slices).
  - Worker that aggregates emissions by interval, renders charts, generates PDF & Excel, stores file in object storage, and updates report status.
  - Scheduler service to create periodic jobs per admin-configured schedules and recipients.
  - Delivery: generate email with signed download link (or store in user report history for download).
  - Retry/backoff for transient failures; monitoring/alerts for worker failures.
- Background jobs:
  - Report generation worker
  - Scheduler (cron or persistent scheduler) to enqueue report jobs
  - Delivery worker (email/link generation)
- Acceptance Criteria:
  - Reports generated asynchronously with status updates and downloadable files
  - Scheduled reports trigger at configured times and deliver to recipients
  - Worker handles typical monthly report within the target SLA and queues heavy jobs
- Tests:
  - Integration tests for worker end-to-end (aggregation -> file generation -> storage)
  - Scheduler integration tests (simulate time-based triggers)
  - E2E test for user flow: schedule report -> receive link -> download
- DoD:
  - Worker deployed to staging, retries and alerting configured, documentation for schedule configuration

---

## Notes & Next steps (recommendations)
1. Use the template for every MUST story. Each story converted this way becomes a vertical slice that can be delivered end-to-end.
2. Track the technical stories (T-Audit-01, T-CSV-01, T-Reports-01) in the backlog and link them from feature slices that depend on them.
3. Attach OpenAPI snippets (docs/openapi.yaml) to each API-focused slice and reference UI mockups (create simple Figma/PNG under docs/mockups/).
4. Convert remaining MUST stories (Auth, Bulk Upload, Reporting, Audit Logs) using this template. Start with Bulk Upload as next pilot if preferred.
5. Track converted slices in backlog (GitHub Issues/Jira) and include the slice ID in PR titles.

Document created from FRD last updated: 2025-08-18
