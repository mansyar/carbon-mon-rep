# Multi-stage Bun build -> production image
# Stage 1: Install production deps (cached)
FROM oven/bun:latest AS deps
WORKDIR /app
COPY packages/backend/package.json packages/backend/bun.lockb* ./
RUN bun install --production

# Stage 2: Build (generate prisma client + build bundle)
FROM oven/bun:latest AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/backend ./
COPY prisma ./prisma
# Generate Prisma client (no-op if not configured)
RUN bunx prisma generate || true
# Build a production bundle (CJS) for Node runtime
RUN bun build src/index.ts --outdir dist --format cjs

# Stage 3: Runtime - keep image minimal but with Bun available
FROM oven/bun:latest AS runtime
WORKDIR /app
# Copy built artifacts and production deps
COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
# Use node runtime to run built CJS output
CMD ["node", "./dist/index.js"]
