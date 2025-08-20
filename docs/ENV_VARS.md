# Environment Variables & Secrets — Reference

This document lists environment variables used by the project, with types, meaning, example values, and notes on where to store them securely. Add any additional service-specific variables here as new features are implemented.

Important safety note
- NEVER commit real secrets to git. Use `.env` for local dev only and a secrets manager (Vault, AWS Secrets Manager, GitHub Secrets, Coolify secrets) for staging/production.
- Required variables must be present in production. Optional vars have defaults noted.

Table of contents
- Core
- Database / Prisma
- Auth & Security
- Storage & Uploads
- Background workers / Queueing
- Email / Notifications
- Observability / Monitoring
- Rate limiting / Throttling
- Feature flags & env meta
- Example .env.example
- Secrets management recommendations

---

CORE
- PORT (integer) — HTTP port for the API server
  - Example: 3000
  - Default (dev): 3000

- BUN_ENV (string) — runtime environment
  - Example: development | staging | production
  - Default: development

- NODE_ENV (string) — fallback for third-party libs
  - Example: development | production
  - Default: development

- APP_URL (string) — public base URL of the app (used in links and emails)
  - Example: https://carbon.example.com

- CORS_ALLOWED_ORIGINS (string, CSV) — allowed origins for CORS
  - Example: https://app.example.com,https://admin.example.com
  - Use `*` only for local development.

DATABASE / PRISMA
- DATABASE_URL (string) — primary connection string (Postgres)
  - Example: postgresql://user:password@localhost:5432/carbon?schema=public
  - Required in all environments.

- SHADOW_DATABASE_URL (string) — (optional) shadow DB for migrations (Prisma)
  - Example: postgresql://user:password@localhost:5433/carbon_shadow?schema=public
  - Useful for CI/migrate workflows where migrations require an isolated DB.

- DATABASE_POOL_SIZE (integer) — DB connection pool size
  - Example: 10
  - Default: 10

AUTH & SECURITY
- JWT_SECRET (string) — HMAC secret or private key used to sign access tokens
  - Required (production).

- JWT_EXPIRES_IN (integer | string) — access token TTL in seconds or string
  - Example: 3600 or "1h"
  - Default: 3600

- JWT_REFRESH_SECRET (string) — secret used to sign refresh tokens
  - Required if using refresh tokens.

- REFRESH_TOKEN_EXPIRES_IN (integer | string) — refresh token TTL
  - Example: 604800 or "7d"

- BCRYPT_SALT_ROUNDS (integer) — bcrypt cost factor
  - Example: 12
  - Default: 12

- TOKEN_REVOKE_STORE (string) — where revoked refresh tokens are stored (redis|db)
  - Example: redis
  - If `redis`, `REDIS_URL` must be set.

- PASSWORD_POLICY_MIN_LENGTH (integer)
  - Example: 10
  - Optional; enforce in app-level validation.

STORAGE & UPLOADS
- OBJECT_STORAGE_PROVIDER (string) — one of ("s3", "minio", "local")
  - Example: s3

- OBJECT_STORAGE_URL (string) — endpoint or S3 URL for object storage (MinIO or S3-compatible)
  - Example: https://minio.internal:9000

- OBJECT_STORAGE_BUCKET (string) — bucket/container name for uploads/reports
  - Example: carbon-reports

- OBJECT_STORAGE_ACCESS_KEY (string) — access key for object storage
- OBJECT_STORAGE_SECRET_KEY (string) — secret key for object storage

- S3_REGION (string) — AWS S3 region (if using AWS)
  - Example: ap-southeast-2

- REPORTS_STORAGE_PATH (string) — base path/prefix in object storage
  - Example: reports/

- UPLOAD_MAX_FILE_SIZE_MB (integer) — per-file size limit in MB
  - Example: 50
  - Default: 50

- UPLOAD_MAX_ROWS (integer) — maximum rows allowed in uploads
  - Example: 100000
  - Default: 100000

- UPLOAD_CHUNK_SIZE (integer) — rows per insert chunk for streaming imports
  - Example: 1000
  - Default: 1000

REDIS / CACHE / RATE LIMITING
- REDIS_URL (string) — redis connection URL (optional but recommended)
  - Example: redis://:password@localhost:6379/0

- REDIS_TLS (boolean / string) — enable TLS for Redis connection (true|false)
  - Example: "true" or "false"

- RATE_LIMIT_WINDOW_MS (integer) — window size for rate limiting (ms)
  - Example: 60000

- RATE_LIMIT_MAX (integer) — max requests per window per IP for auth endpoints
  - Example: 10

BACKGROUND WORKERS & QUEUEING
- QUEUE_PROVIDER (string) — provider for job queue (redis|rabbitmq|sqs)
  - Example: redis

- QUEUE_URL (string) — provider connection string
  - Example: redis://:password@localhost:6379/1

- WORKER_CONCURRENCY (integer)
  - Example: 4
  - Default: 2

- UPLOAD_PROCESSOR_QUEUE (string) — named queue for upload jobs
  - Example: upload_processing

- REPORTS_QUEUE (string) — named queue for report generation jobs
  - Example: report_generation

EMAIL / NOTIFICATIONS
- SMTP_HOST (string)
  - Example: smtp.mailtrap.io

- SMTP_PORT (integer)
  - Example: 587

- SMTP_SECURE (boolean) — true if using TLS on connect
  - Example: "false"

- SMTP_USER (string)
- SMTP_PASS (string)
- EMAIL_FROM (string) — default from address
  - Example: "no-reply@carbon.example.com"

OBSERVABILITY & MONITORING
- LOG_LEVEL (string) — debug|info|warn|error
  - Default: info

- SENTRY_DSN (string) — sentry DSN (optional)
- PROMETHEUS_ENABLED (boolean) — enable prometheus metrics endpoint
  - Default: false

- METRICS_PORT (integer) — port for metrics exporter
  - Default: 9090

REPORTING & FILE GENERATION
- REPORTS_MAX_ROWS_IN_MEMORY (integer) — max rows to load into memory when generating reports
  - Example: 100_000
  - Prefer streaming; set low to avoid OOM.

- REPORT_TEMP_DIR (string) — local temp dir for file generation (worker)
  - Example: /tmp/reports

EXTERNAL INTEGRATIONS / ERP
- ERP_SAP_API_KEY (string) — API key for SAP connector (if used)
- ERP_ODOO_API_KEY (string) — API key for Odoo connector
- ERP_API_KEYS_ENCRYPTION_KEY (string) — symmetric key used to encrypt stored connector keys at rest (rotate regularly)

SECURITY / TLS / COOKIES
- TLS_CERT_PATH (string) — path to TLS cert (if managing TLS at app)
- TLS_KEY_PATH (string) — path to TLS key
- COOKIE_SECURE (boolean) — true in production for secure cookies
  - Default: true in production

FEATURE FLAGS & MISC
- FEATURE_SCHEDULED_REPORTS (boolean) — enable scheduled reports
  - Default: false

- MAX_UPLOAD_WORKERS (integer) — cap worker count for uploads

CI / TESTING (CI-specific overrides)
- CI_DATABASE_URL (string) — DB URL used in CI for test runs
- CI_SHADOW_DATABASE_URL (string) — shadow DB for migrations in CI

SEED / ADMIN (local dev convenience; treat as sensitive)
- SEED_ADMIN_EMAIL (string) — only for local/dev seeding
- SEED_ADMIN_PASSWORD (string) — only for local/dev seeding

---

EXAMPLE `.env.example`
```env
# Core
PORT=3000
BUN_ENV=development
NODE_ENV=development
APP_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Database
DATABASE_URL=postgresql://dev:devpass@localhost:5432/carbon?schema=public
SHADOW_DATABASE_URL=postgresql://dev:devpass@localhost:5433/carbon_shadow?schema=public
DATABASE_POOL_SIZE=10

# Auth
JWT_SECRET=replace_this_in_prod
JWT_EXPIRES_IN=3600
JWT_REFRESH_SECRET=replace_refresh_secret_in_prod
REFRESH_TOKEN_EXPIRES_IN=604800
BCRYPT_SALT_ROUNDS=12

# Redis / queue
REDIS_URL=redis://:devpass@localhost:6379/0
QUEUE_PROVIDER=redis
QUEUE_URL=redis://:devpass@localhost:6379/1
WORKER_CONCURRENCY=2

# Storage
OBJECT_STORAGE_PROVIDER=minio
OBJECT_STORAGE_URL=http://localhost:9000
OBJECT_STORAGE_BUCKET=carbon-reports
OBJECT_STORAGE_ACCESS_KEY=minioadmin
OBJECT_STORAGE_SECRET_KEY=minioadmin

# Email
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=no-reply@local

# Observability
LOG_LEVEL=debug
SENTRY_DSN=

# Uploads & Reports
UPLOAD_MAX_FILE_SIZE_MB=50
UPLOAD_MAX_ROWS=100000
UPLOAD_CHUNK_SIZE=1000
REPORTS_STORAGE_PATH=reports/

# Dev seeds (DO NOT USE IN PRODUCTION)
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=changeme
```

---

SECRETS MANAGEMENT & BEST PRACTICES
- Local dev: `.env` file (gitignored). Use `.env.example` with non-sensitive placeholders.
- Staging/Production:
  - Use a secrets manager (HashiCorp Vault, AWS Secrets Manager, Google Secret Manager) or platform secrets (Coolify, Heroku, GitHub Actions secrets).
  - Rotate `JWT_SECRET`, `JWT_REFRESH_SECRET`, `OBJECT_STORAGE_SECRET_KEY`, and DB passwords regularly.
  - For DB migrations requiring a shadow DB, keep `SHADOW_DATABASE_URL` separate and restricted.
  - Do not print secrets in logs. Mask sensitive values in CI logs.

KEY ROTATION & REVOCATION
- When rotating `JWT_SECRET` or `JWT_REFRESH_SECRET`:
  - Consider short overlapping window where new tokens are validated against new secret and old tokens are invalidated by token revocation list (TOKEN_REVOKE_STORE).
  - Alternatively, rotate refresh secrets and force re-login for all users.

ENCRYPTION AT REST
- Encrypt sensitive fields (ERP API keys) before persisting to DB. Use envelope encryption with a KMS-managed key.
- Document encryption key rotation and access policies.

CI / Deploy notes
- CI pipelines should source secrets from the CI provider (GitHub Actions secrets) and not store them in repo.
- Use environment-specific secrets (use separate keys for staging vs production).
- For containerized deployments, inject secrets via the orchestration system (Coolify, Kubernetes secrets, Docker Compose environment injection).

---

ADDING NEW ENV VARS
- Add new env vars to this file and update the `.env.example`.
- Include a description, type, default value, and whether it is required.
- Update README quickstart and deployment docs if the variable affects infra.

Document owner: Engineering
Last updated: 2025-08-18
