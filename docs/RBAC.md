# RBAC Matrix & Permissions — Reference

Purpose
- Define the default roles, granular permissions, and implementation guidance for Role-Based Access Control (RBAC) in the Carbon Emission Monitoring system.
- Provide a clear, auditable mapping between product features and required permissions so backend, frontend, and docs stay consistent.

Design decisions (summary)
- Use role-based assignments with configurable/custom roles.
- Permissions are fine-grained, resource + action style (e.g. `emissions.create`, `reports.generate`).
- Persist roles, permissions, and role->permission mappings in the database to allow runtime changes and admin UI.
- Record role changes in the audit log (actor, change, timestamp).
- Enforce permission checks server-side for every protected API and reflect in the UI (hide/disable controls).

Default roles
- Admin — full access to manage system, users, templates, and deployment-level settings.
- DataEntry — create/update/delete emissions, perform uploads.
- Auditor — read-only access to audit logs and generated reports (no edits).
- Viewer — read-only access to dashboards and report downloads.
- Manager (optional) — read + limited write for site-level config (useful for company-level delegated admins).

Permission naming convention
- resource.action (dot-separated)
- resource can be plural (emissions, users, uploads, reports, audit_logs, templates, configs)
- examples:
  - emissions.create, emissions.read, emissions.update, emissions.delete, emissions.bulk_upload
  - uploads.status_view, uploads.results_download
  - upload_templates.create, upload_templates.read, upload_templates.update, upload_templates.delete
  - reports.generate, reports.read, reports.download, reports.schedule
  - users.create, users.read, users.update, users.delete, users.assign_roles
  - audit_logs.read, audit_logs.export
  - configs.read, configs.update
  - system.admin (super-user)

Permission matrix (defaults)
| Permission | Admin | DataEntry | Auditor | Viewer | Manager |
|---|:---:|:---:|:---:|:---:|:---:|
| emissions.create | ✓ | ✓ |  |  | ✓ |
| emissions.read | ✓ | ✓ | ✓ | ✓ | ✓ |
| emissions.update | ✓ | ✓ |  |  | ✓ |
| emissions.delete (soft) | ✓ | ✓ |  |  |  |
| emissions.bulk_upload | ✓ | ✓ |  |  |  |
| uploads.status_view | ✓ | ✓ |  |  |  |
| uploads.results_download | ✓ | ✓ |  |  |  |
| upload_templates.manage | ✓ |  |  |  |  |
| reports.generate | ✓ | ✓ |  |  | ✓ |
| reports.read | ✓ | ✓ | ✓ | ✓ | ✓ |
| reports.download | ✓ | ✓ | ✓ | ✓ | ✓ |
| reports.schedule | ✓ |  |  |  |  |
| users.create | ✓ |  |  |  |  |
| users.read | ✓ |  |  |  |  |
| users.update | ✓ |  |  |  |  |
| users.assign_roles | ✓ |  |  |  |  |
| audit_logs.read | ✓ |  | ✓ |  |  |
| audit_logs.export | ✓ |  | ✓ |  |  |
| configs.read | ✓ |  |  |  | ✓ |
| configs.update | ✓ |  |  |  |  |
| system.admin | ✓ |  |  |  |  |

Notes:
- Managers are intended as scoped admins (site-level). If implementing scoping, combine permission with resource scoping (e.g., `emissions.update:site=<site_id>` or a separate policy layer).
- Viewer and Auditor are read-only; Auditor gets `audit_logs.read` and `audit_logs.export`.

Custom roles
- Admin UI must allow:
  - Creating a new role with a name/description
  - Selecting permissions from the canonical permission list
  - Assigning role to users (one or many)
- Persist custom roles and mappings in DB so they are available to auth middleware and the UI.

Enforcement points
- Backend: middleware checks permissions on each API endpoint (use role -> permission lookup + optional resource-level scoping).
- Frontend: query logged-in user's permissions/scopes and enable/disable UI controls (do NOT rely on frontend-only checks).
- Token contents: include user_id and role(s). Avoid embedding full permission lists in JWT unless short-lived; prefer server-side permission lookups for critical checks.

Audit requirements
- All role/permission changes must be recorded in audit logs (who changed, before/after, timestamp).
- Assigning/removing roles from users must be auditable.

Database schema (recommended)
- roles (id, name, description, is_builtin, created_at, updated_at)
- permissions (id, name, description, created_at)
- role_permissions (role_id, permission_id)
- user_roles (user_id, role_id, assigned_by, assigned_at)
- Optionally: role_scopes (role_id, resource_type, resource_id) for scoped roles

Example Prisma snippet (conceptual)
```prisma
model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  is_builtin  Boolean  @default(false)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  permissions RolePermission[]
  userRoles   UserRole[]
}

model Permission {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  created_at  DateTime @default(now())
  rolePerms   RolePermission[]
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role     @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])
  @@id([roleId, permissionId])
}

model UserRole {
  id        String   @id @default(uuid())
  userId    String
  roleId    String
  assignedBy String?
  assignedAt DateTime @default(now())
  role      Role     @relation(fields: [roleId], references: [id])
}
```

Implementation suggestions
- Seed builtin roles and canonical permission list at migration time (so `Admin` always exists).
- Use a permission cache (in-memory or Redis) to avoid DB lookups on every request; invalidate cache on role/permission changes.
- Provide a lightweight Permission Service (or helper) that answers `userHasPermission(userId, permission, resource?)` for reuse in middleware, jobs, and batch processes.
- For scoped permissions (site-level) prefer a policy layer (e.g., ABAC-style checks) rather than adding explosive numbers of permissions.

UI considerations
- Admin > Roles page: list roles, edit permissions, view assigned users.
- User Management: assign/unassign roles, show effective permissions summary.
- On login: expose a minimal `permissions` or `roles` array in user session to render UI; backend must still re-check.

Testing guidance
- Unit tests: permission checks, permission service, middleware.
- Integration tests: role assignment flow -> verify API authorization behavior.
- E2E tests: user with each role exercising allowed and forbidden flows.

Migration & rollout notes
- Add DB migrations to create `permissions` + `roles` + join tables and seed builtin roles/permissions.
- During rollout, seed Admin user and ensure at least one Admin exists.
- When changing permission names or removing permissions, migrate role_permission mappings carefully and update frontend feature gating.

Security considerations
- Least privilege: default roles should grant minimal necessary permissions.
- Regularly review built-in permissions and custom roles for privilege creep.
- Protect role-management endpoints behind `system.admin` or `users.assign_roles` and log all changes.

Document owner: Engineering
Last updated: 2025-08-18
