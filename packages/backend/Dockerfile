# Multi-stage Bun build -> production image
FROM oven/bun:latest AS deps
WORKDIR /app
COPY packages/backend/package.json packages/backend/bun.lockb* ./
# Install all deps (including dev deps needed for prisma generate)
RUN bun install

FROM oven/bun:latest AS build
WORKDIR /app
# copy node_modules from deps (contains prisma CLI if present)
COPY --from=deps /app/node_modules ./node_modules
COPY packages/backend ./
COPY prisma ./prisma

# Install OpenSSL (Prisma may require system OpenSSL to select proper engine)
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Generate Prisma client (will populate node_modules/.prisma/client for the target platform)
RUN bunx prisma generate

# Build a production bundle (CJS) for Node runtime (target node to allow Node builtins like tls/dns)
RUN bun build src/index.ts --outdir dist --format cjs --target node

FROM oven/bun:latest AS runtime
WORKDIR /app

# Ensure required system OpenSSL libraries are present at runtime (Prisma engine depends on libssl)
RUN apt-get update -y && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy built artifacts and the node_modules from the build stage (contains generated Prisma engine)
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
# Use node runtime to run built CJS output
CMD ["node", "./dist/index.js"]
