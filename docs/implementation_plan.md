# Implementation Plan

[Overview]
Implement Milestone 1: dynamic Authentication & RBAC — JWT access + refresh with Redis-assisted sessions and caches, dynamic roles & permissions persisted in the database, permission middleware, Redis-based rate limiting for auth endpoints, audit events for auth operations, OpenAPI updates, tests, and dev Redis in docker-compose.

This change replaces the current enum-centric role authorization with a normalized RBAC model (roles, permissions, role_permissions, user_roles) to support multi-role users and runtime-configurable permissions. The implementation will provide a secure token lifecycle (HS256 access tokens, rotating refresh tokens persisted in DB, Redis used for rate limiting and permission caching), enforce the agreed password policy, seed builtin permissions/roles, and extend the API surface to include auth and role-management endpoints. The plan minimizes disruptive changes by keeping the existing User.role enum field readable (deprecated for authorization) and implementing new behavior incrementally with migrations and seed scripts. Dev ergonomics include adding Redis to docker-compose and providing test seeding scripts separate from production admin seeding.

[Types]  
Introduce dynamic RBAC and auth-related types.

- Single sentence: Add Prisma models and TypeScript DTOs for roles, permissions, user_roles, role_permissions, and refresh sessions.

- Prisma models to add (exact fields and types):
  - model Permission {
      id        String   @id @default(uuid()) @db.Uuid
      name      String   @unique
      description String?
      createdAt DateTime @default(now()) @db.Timestamptz
      updatedAt DateTime @updatedAt
    }

  - model Role {
      id        String   @id @default(uuid()) @db.Uuid
      name      String   @unique
      description String?
      isBuiltin Boolean  @default(true)
      createdAt DateTime @default(now()) @db.Timestamptz
      updatedAt DateTime @updatedAt
    }

  - model RolePermission {
      roleId       String @db.Uuid
      permissionId String @db.Uuid
      role         Role   @relation(fields: [roleId], references: [id])
      permission   Permission @relation(fields: [permissionId], references: [id])
      @@id([roleId, permissionId])
    }

  - model UserRole {
      id         String   @id @default(uuid()) @db.Uuid
      userId     String   @db.Uuid
      roleId     String   @db.Uuid
      assignedBy String?  @db.Uuid
      assignedAt DateTime @default(now()) @db.Timestamptz
      role       Role     @relation(fields: [roleId], references: [id])
    }

  - model RefreshSession {
      id                 String   @id @default(uuid()) @db.Uuid
      userId             String   @db.Uuid
      refreshTokenHash   String
      expiresAt          DateTime
      revokedAt          DateTime?
      replacedBySessionId String?  @db.Uuid
      createdAt          DateTime @default(now()) @db.Timestamptz
    }

- TypeScript DTOs (packages/backend/src/types):
  - PermissionDTO: { id: string; name: string; description?: string; created_at: string; updated_at: string }
  - RoleDTO: { id: string; name: string; description?: string; is_builtin: boolean; permissions: string[]; created_at: string; updated_at: string }
  - UserWithRolesDTO: { id: string; username: string; roles: RoleDTO[]; permissions: string[]; created_at: string }
  - RefreshSessionDTO (admin/debug): { id, user_id, expires_at, revoked_at, created_at }

- Validation rules:
  - Password regex: ^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$
  - Permission name pattern: ^[a-z0-9_\.]+$
  - Username length <= 50

- Relationships:
  - Effective permissions = union of permissions from user roles.
  - Permission caching uses a permission version integer to invalidate cached sets.

[Files]  
Single sentence: Create services, middleware, routes, config, and migration files; update docker-compose and OpenAPI.

Detailed breakdown:

- New files to create:
  - prisma/migrations/<timestamp>_m1_rbac_auth/ (auto-generated migration SQL plus a post-migration seed script)
  - packages/backend/src/config/auth.ts — auth-related constants and TTLs
  - packages/backend/src/config/redis.ts — Redis client setup (ioredis)
  - packages/backend/src/middleware/authenticate.ts — JWT verification, attach req.user { id }
  - packages/backend/src/middleware/requirePermission.ts — requirePermission(permission: string)
  - packages/backend/src/middleware/rateLimit.ts — Redis-backed rate limiter (configurable)
  - packages/backend/src/services/tokenService.ts — token generation, rotation, revocation, hashing
  - packages/backend/src/services/permissionService.ts — aggregate permissions, cache in Redis, invalidate
  - packages/backend/src/services/roleService.ts — seed builtin roles/permissions, assignRoleToUser, listRoles
  - packages/backend/src/services/userService.ts — createUser, verifyCredentials, password validation
  - packages/backend/src/routes/auth.ts — POST /api/auth/login, POST /api/auth/refresh, POST /api/auth/revoke
  - packages/backend/src/routes/users.ts — POST /api/users (Admin), POST /api/users/:id/roles (assign role)
  - packages/backend/src/routes/roles.ts — GET /api/roles
  - packages/backend/src/utils/password.ts — validatePassword, hashPassword, comparePassword
  - packages/backend/src/utils/errors.ts — error helpers producing { error, message?, details? }
  - scripts/dev/start-redis.sh — optional convenience
  - docs/openapi_fragments/auth.yaml — auth + users/roles fragments to merge into docs/openapi.yaml
  - docs/implementation_plan.md — this file (written)

- Existing files to modify:
  - prisma/schema.prisma — add the models listed in [Types]
  - prisma/seed.ts — remove automatic Admin seed for production; add separate test seeding path and a separate seed_admin script (scripts/seed_admin.ts)
  - packages/backend/package.json — add dependencies (jsonwebtoken, bcrypt, ioredis)
  - packages/backend/src/routes/emissions.ts — protect endpoints with requirePermission('emissions.read') and requirePermission('emissions.create') where applicable
  - packages/backend/src/services/emissionService.ts — pass userId when create/update operations are called (thread through from req.user)
  - packages/backend/src/services/auditService.ts — extend (optionally) to accept extra context metadata (diff/context argument)
  - docs/openapi.yaml — add new endpoint definitions and schemas
  - docker-compose.yml — add a redis service block for dev:
    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
      command: ["redis-server", "--appendonly", "no"]

- Files to delete or move:
  - None for M1. Deprecate usage of User.role enum for authorization with code comments.

- Configuration updates:
  - docs/ENV_VARS.md: document TOKEN_REVOKE_STORE=redis, add RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, add REDIS_URL example, and document JWT_REFRESH_SECRET, REFRESH_TOKEN_EXPIRES_IN usage for rotation.
  - package.json scripts: add scripts for redis start (optional) and seed_admin.

[Functions]  
Single sentence: Add token/permission/role/user service functions and middleware functions for authentication, authorization, and rate limiting.

Detailed breakdown:

- New functions (name, signature, file, purpose):
  - signAccessToken(userId: string, permissionsVersion: number): string — packages/backend/src/services/tokenService.ts — return JWT signed HS256 containing sub=userId, pv=permissionsVersion, exp.
  - generateRefreshSession(userId: string): Promise<{ sessionId: string; token: string }> — token stored hashed in RefreshSession table with expiresAt.
  - rotateRefreshToken(oldRefreshToken: string): Promise<{ accessToken:string; refreshToken:string }> — validate old, create new session, revoke old.
  - revokeRefreshSession(sessionId: string): Promise<void> — mark revokedAt and possibly set replacedBySessionId.
  - hashToken(raw: string): string — stable hashing helper (sha256 or bcrypt).
  - verifyRefreshToken(raw: string): Promise<{ sessionId: string; userId: string } | null> — verify token and session live.

  - getUserPermissions(userId: string): Promise<Set<string>> — packages/backend/src/services/permissionService.ts — fetch roles->permissions, cache in Redis with permset:user:{userId}:v{version}
  - invalidateUserPermissions(userId: string): Promise<void> — delete cache key and optionally bump perms version.

  - assignRoleToUser(userId: string, roleId: string, actorId?: string): Promise<void> — roleService
  - listRoles(): Promise<RoleDTO[]> — roleService
  - seedBuiltinPermissionsAndRoles(): Promise<void> — run at migration or first server start.

  - createUser(input: { username, password, roles?: string[] }, actorId?: string): Promise<UserWithRolesDTO> — userService
  - verifyCredentials(username: string, rawPassword: string): Promise<User | null> — userService

  - authenticate(req, res, next) — middleware that verifies JWT, fetches user id, attaches req.user
  - requirePermission(permission: string) — middleware that calls permissionService.getUserPermissions and 403s if missing
  - rateLimit({ key, limit, windowMs }) — middleware for auth endpoints (login) using Redis INCR+EXPIRE or Lua

- Modified functions:
  - writeAudit(...) — add optional context parameter: writeAudit(userId, action, targetType, targetId?, diff?, context?) without breaking existing callers.
  - emission route handlers — accept authenticated req.user and pass userId to service methods (createEmission, updateEmission, softDeleteEmission).

- Removed functions:
  - None removed; old role enum logic replaced gradually.

[Classes]  
Single sentence: No large OO changes; small helper classes for rate limiting or permission caching may be added.

Detailed breakdown:
- Optional RedisRateLimiter class (packages/backend/src/middleware/rateLimit.ts)
  - constructor(redisClient, limit:number, windowMs:number)
  - allow(key:string): Promise<boolean>
- Optional PermissionCache wrapper (packages/backend/src/services/permissionService.ts)
  - get(userId): Promise<Set<string>>
  - invalidate(userId): Promise<void>
No existing classes are removed or modified.

[Dependencies]  
Single sentence: Add JWT, bcrypt, and Redis client libraries; keep Bun-compatible packages.

Details:
- New runtime packages (backend):
  - jsonwebtoken (HS256 signing)
  - bcrypt (or bcryptjs) — prefer bcrypt for security; ensure build support under Bun
  - ioredis (or node-redis v4) — pick ioredis for feature set
  - uuid (if needed)
- Dev/test:
  - @types/jsonwebtoken, @types/bcrypt (if using TypeScript types), test fixtures for Redis (or use in-memory redis-mock for unit tests)
- Versioning: pin to stable major versions compatible with Bun node-compat layer; update package.json in packages/backend and run bun install then bunx prisma generate after schema change.

[Testing]  
Single sentence: Achieve >=90% coverage via unit, integration, and E2E tests for auth and RBAC behaviors.

Test file requirements:
- Unit tests:
  - password policy validator (positive/negative cases)
  - tokenService sign/verify/hash and rotation logic (mock DB)
  - permissionService caching behavior (mock Redis)
  - roleService assign/list logic
  - rateLimiter allow logic
- Integration tests (packages/backend/tests/integration/):
  - POST /api/auth/login: valid credentials -> 200, access+refresh returned, audit row created
  - POST /api/auth/login: invalid credentials -> 401, audit row with login_failure
  - POST /api/auth/refresh: rotation invalidates previous refresh token (old refresh cannot be used)
  - POST /api/users/:id/roles: assign role -> subsequent protected request shows new permissions (permission cache invalidated)
  - Emissions route guarded: POST /api/emissions requires emissions.create -> unauthorized without, authorized with permission
- E2E:
  - Full flow: create user (admin), assign DataEntry role, login as user, create emission, refresh token flow
- Mocks & test infra:
  - Use test Postgres DB (CI: CI_DATABASE_URL), run prisma migrate dev on test DB, run seed for builtin roles
  - Use ephemeral Redis instance for integration tests (docker compose or testcontainers)
- Coverage:
  - Configure coverage collection and enforce >= 90% for new/changed modules; record in CI.

[Implementation Order]  
Single sentence: Implement in small incremental steps: schema migration → redis dev setup → services → middleware → routes → tests → OpenAPI/docs → CI & deploy.

Numbered steps:
1. Prisma schema update and migration: add Permission, Role, RolePermission, UserRole, RefreshSession models. Generate client.
2. Seed builtin permissions & roles: implement seedBuiltinPermissionsAndRoles() and run in a post-migration seeding step (prisma/seed.ts or scripts/seed_roles.ts). Keep admin seeding separate script.
3. Add Redis to docker-compose.yml for dev; implement packages/backend/src/config/redis.ts.
4. Implement userService and password utilities (validation & hashing).
5. Implement tokenService with signAccessToken, generateRefreshSession, rotateRefreshToken, revokeRefreshSession, hashToken.
6. Implement permissionService and roleService including caching in Redis and cache invalidation.
7. Implement middleware: authenticate, requirePermission, rateLimit. Wire rateLimit to POST /api/auth/login.
8. Add routes: packages/backend/src/routes/auth.ts, users.ts, roles.ts and hook them up in packages/backend/src/index.ts (app.use('/api/auth', authRouter), app.use('/api/users', usersRouter), app.use('/api/roles', rolesRouter)).
9. Protect emissions routes with requirePermission middleware and ensure userId passed into emissionService.create/update.
10. Extend auditService.writeAudit signature to record login events and role changes; update places to call it.
11. Update docs/openapi.yaml with auth + user/role endpoints, request/response schemas, error schemas, and examples.
12. Implement tests (unit → integration → E2E) and achieve >=90% coverage for new modules. Use Redis in CI for integration tests.
13. CI changes: add Redis service to test workflow or start Redis via docker-compose in CI; add coverage gate.
14. Finalize docs: update docs/ENV_VARS.md, docs/milestones.md (mark subtasks), and provide developer notes for running seed_admin.
15. Smoke test locally via docker-compose (api + redis + postgres) and run test suite.
