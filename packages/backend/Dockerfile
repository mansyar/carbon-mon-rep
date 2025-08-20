FROM oven/bun:latest

WORKDIR /app

# Copy manifests first for caching installs
COPY package.json bun.lockb* ./

# Install dependencies (dev deps included for dev image)
RUN bun install

# Copy source
COPY . .

# Generate Prisma client if possible (no-op if prisma not setup yet)
RUN bunx prisma generate || true

EXPOSE 3000

# Default to running the dev script so container is usable for local development
CMD ["bun", "run", "dev"]
