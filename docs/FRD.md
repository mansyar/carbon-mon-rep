# Functional Requirements / User Stories (FRD)

## 1. Document purpose

This FRD defines user stories, acceptance criteria, and the MVP scope for the Carbon Emission Monitoring & Reporting System. Use this document as the single source of truth for development, QA, and design handoff.

## 2. Scope (MVP)

- Manual single-entry and bulk CSV/Excel upload of emissions data per site
- Authentication (JWT) with Admin and Data Entry roles
- Report generation (PDF/Excel) for configured intervals (daily, monthly)
- Audit logging for data changes and uploads
- Basic UI: Dashboard, Data Entry form, Bulk Upload page, Reports page

## 3. Personas

- Admin: configures sites, roles, templates, and reviews audit logs
- Data Entry User: enters emissions data manually or via bulk upload
- Auditor: views audit logs and reports (read-only)
- Viewer: views reports and dashboards (read-only)

## 4. Prioritized Epics & Stories (MUST / SHOULD / MAY)

Priority: MUST = MVP, SHOULD = important soon after, MAY = later

Epic A — Authentication & Users (MUST)

- Story A.1 — Login

  - As a user, I want to login with username/password so that I can access the app.
  - Acceptance criteria:
    - Valid credentials return a signed JWT and refresh token
    - Invalid credentials return 401 with error code
    - Login attempts are rate-limited (configurable)

- Story A.2 — Role assignment
  - As an Admin, I want to assign roles to users so that access is controlled.
  - Acceptance criteria:
    - Admin can create users and assign roles (Admin, Data Entry, Auditor, Viewer)
    - Role changes are recorded in audit logs

Epic B — Emissions Data CRUD (MUST)

- Story B.1 — Create emission record (single)

  - As a Data Entry user, I want to add a single emission entry for a site.
  - Acceptance criteria:
    - Form validates required fields: site_id, emission_type, value, unit, timestamp
    - On success returns 201 with created record
    - Action recorded in audit log with user, timestamp, and diff

- Story B.2 — Edit & Delete emission records

  - As a Data Entry user (with permission), I want to update or delete records.
  - Acceptance criteria:
    - PUT /emissions/:id updates allowed fields and returns 200
    - DELETE /emissions/:id soft-deletes record and returns 200
    - All updates/deletes captured in audit logs

- Story B.3 — List & paginate emissions
  - As any authorized user, I want to list emissions with filters and pagination.
  - Acceptance criteria:
    - Supports filters: site_id, emission_type, date range
    - Pagination headers (total, page, per_page)

Epic C — Bulk Upload (MUST)

- Story C.1 — Upload CSV/Excel

  - As a Data Entry user, I want to upload a CSV/Excel of emissions to import many rows.
  - Acceptance criteria:
    - System accepts predefined template or mapped columns
    - Server validates rows and returns a per-row result (success/errors)
    - On partial failure, successful rows are inserted, failures included in downloadable error report (PDF/CSV)
    - Upload progress shown in UI with status polling

- Story C.2 — CSV template and mapping
  - As an Admin, I want to upload/define the CSV template and mappings.
  - Acceptance criteria:
    - Admin can upload a template or set column-to-field mappings
    - Mappings persisted and selectable during uploads

Epic D — Reporting (MUST)

- Story D.1 — Generate report

  - As a Viewer or Auditor, I want to generate emissions report for a site and date range.
  - Acceptance criteria:
    - Report supports daily/weekly/monthly intervals
    - Exports to PDF and Excel with charts and summary
    - Report generation queued if heavy; user notified when ready

- Story D.2 — Scheduled reports (SHOULD)
  - As an Admin, I want scheduled report generation and delivery (email or download link).
  - Acceptance criteria:
    - Admin configures schedule and recipients
    - Reports generated and stored for N days

Epic E — Audit Logging & Exports (MUST)

- Story E.1 — Audit log view & filters
  - As an Auditor or Admin, I want to view audit logs filtered by site, user, action, and date range.
  - Acceptance criteria:
    - Logs show user, action, target resource, timestamp, and diff
    - Supports pagination and export to PDF

Epic F — Configurations (SHOULD)

- Story F.1 — Units & date format
  - As an Admin, I want to set default units and date formats for the system.
  - Acceptance criteria:
    - Configuration accessible via UI and API
    - Changes recorded in audit logs

## 5. Non-functional requirements (NFRs)

- Authentication: JWT with refresh tokens, token revocation flow
- Security: password hashed (bcrypt), secrets stored encrypted
- Performance: list endpoints return < 2s on 100k records (target)
- Scalability: design to allow horizontal scaling of API
- Availability: target 99.9% for critical endpoints
- Data retention: audit logs retention configurable (default 2 years)

## 6. API & Data validation notes

- Reference: create OpenAPI spec for all endpoints (Auth, Emissions, Uploads, Reports, Audit-logs)
- Validation rules:
  - emission_type: required, string, max 50 chars
  - value: required, numeric, >= 0
  - unit: required, one of configured units (kg, tCO2e, etc.)
  - timestamp: required, ISO 8601

## 7. CSV/Excel Template (MVP)

Columns (required): site_id, emission_type, value, unit, timestamp, reference_id (optional)

- Provide sample files in the repo: docs/samples/emissions_template.csv
- On upload, server returns per-row code/messages; UI shows summary and downloadable error file

## 8. Acceptance / Definition of Done (DoD)

For a story to be Done:

- Code implemented and peer-reviewed
- Unit tests with >= 80% coverage for new modules
- Integration tests for API endpoints
- E2E tests for critical flows (login, upload, report)
- OpenAPI updated and Postman collection generated
- Deployed to staging and smoke-tested
- Documentation updated (README + user guide)

## 9. Next steps / artifacts to produce

- Generate prioritized backlog (Jira/Trello/GitHub Issues) from these stories
- Create OpenAPI spec for Auth and Emissions endpoints
- Provide CSV sample files and error-report format
- UX mockups for Data Entry, Upload, and Reports pages

---

Document owner: Product / Project Lead
Last updated: 2025-08-18
