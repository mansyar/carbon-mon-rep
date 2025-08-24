# Multi-stage frontend build for production
FROM oven/bun:latest AS deps
WORKDIR /app
COPY packages/frontend/package.json packages/frontend/bun.lockb* ./
RUN bun install --production

FROM oven/bun:latest AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/frontend ./
RUN bunx vite build

FROM oven/bun:latest AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
EXPOSE 5173
CMD ["bun", "run", "preview"]
