FROM oven/bun:latest

WORKDIR /app

# Copy manifests first for caching installs
COPY packages/backend/package.json packages/backend/bun.lockb* ./
# Copy root prisma schema into backend image so `prisma generate` can run during build
COPY prisma ./prisma

# Install dependencies (dev deps included for dev image)
RUN bun install

# Copy source
COPY packages/backend ./

# Generate Prisma client if possible (no-op if prisma not setup yet)
RUN bunx prisma generate || true

EXPOSE 3000

# Default to running the dev script so container is usable for local development
CMD ["bun", "run", "dev"]
