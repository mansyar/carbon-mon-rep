FROM oven/bun:latest

WORKDIR /app

# Copy manifests for cached install
COPY package.json bun.lockb* ./

RUN bun install

COPY . .

EXPOSE 5173

CMD ["bunx", "vite", "--host"]
