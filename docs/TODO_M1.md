# Milestone 1 — TODO Checklist (Authentication & RBAC)

Summary:
- Implement dynamic RBAC in Prisma, HS256 short-lived access tokens, rotating refresh tokens (DB + Redis hashed), permission cache (Redis) with version invalidation, login rate-limit (Redis), password policy + bcrypt, audit events, dev docker-compose with Redis, seeds, routes/middleware/services/tests/CI updates.

Checklist
- [x] Analyze requirements (task brief + design decisions)
- [x] Update Prisma schema with RBAC models (Role, Permission, RolePermission, UserRole) and RefreshSession; add generator binaryTargets
- [x] Create & run Prisma migration for M1
- [x] Add Redis service to docker-compose and set backend REDIS_URL / depends_on redis
- [x] Update backend Dockerfile: install dev deps for prisma generate, run prisma generate in build stage, ensure runtime libssl present
- [x] Confirm/implement Redis config (packages/backend/src/config/redis.ts)
- [x] Implement password utilities: policy checks + bcrypt hashing (packages/backend/src/utils/password.ts)
- [x] Implement services: userService, tokenService (HS256 access tokens + rotating refresh tokens stored hashed with "{sessionId}.{secret}" pattern), permissionService, roleService
- [x] Implement middleware: authenticate, requirePermission, rateLimit (Redis fixed-window)
- [x] Implement permission cache (Redis) with version invalidation on role/permission changes
- [x] Implement login rate-limiting (Redis fixed-window) for auth routes
- [x] Implement auditService.writeAudit(...) calls for security-relevant events
- [x] Add dev docker-compose workflow and rebuild images; resolve Prisma engine/libssl issues
- [x] Add seeds (prisma/seed.ts) and built-in seed runner
- [x] Create/update routes: auth, users, roles, emissions
- [x] Add smoke script and execute basic checks (health + protected routes check)
- [x] Containers: backend, postgres, redis are built and running; /api/health returns OK
- [x] Basic tests added (unit/integration directories exist and some specs implemented)
- [ ] Decide whether smoke script should exercise authenticated flows (currently POST /api/emissions returns 401 expected)
- [ ] If yes: update smoke script to perform login, capture refresh/access tokens, exercise protected endpoints
- [ ] Complete unit & integration tests for auth/RBAC/token rotation/permission caching
- [ ] Add CI pipeline steps to run tests, prisma migrate/seed, and docker-compose where appropriate
- [ ] Documentation updates: docs/RBAC.md, docs/milestones.md, docs/implementation_plan.md — reflect implemented behavior and env vars
- [ ] Final cleanup: linting, types, error handling, ensure audit coverage, remove debug logs
- [ ] Release / tag milestone

Immediate next actions
1. Confirm whether you want the smoke script to exercise authenticated flows. If yes, I will:
   - Update ./scripts/test/smoke.sh to POST /api/auth/login, capture access token, and call protected endpoints.
   - Re-run smoke.sh to validate end-to-end auth and RBAC.
2. Continue writing tests and CI updates once you confirm smoke script decision.

Useful commands
```bash
# re-run smoke
chmod +x ./scripts/test/smoke.sh && ./scripts/test/smoke.sh

# view backend logs
docker-compose logs --tail=200 backend

# check health
curl -sS http://localhost:3000/api/health
