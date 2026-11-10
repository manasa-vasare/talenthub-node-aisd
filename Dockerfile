# ============================================================================
# TALENT HUB - DOCKERFILE (Production Multi-Stage Build)
# ============================================================================

# Stage 1: Build client and server
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root workspace configs
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source codes
COPY server ./server
COPY client ./client

# Build client and server
RUN pnpm --filter talent-hub-client build
RUN pnpm --filter talent-hub-server build

# Stage 2: Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY server/package.json ./server/

# Install production dependencies only
RUN pnpm install --prod --filter talent-hub-server

# Copy compiled backend and frontend
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/src/db/schema.sql ./server/dist/db/schema.sql
COPY --from=builder /app/client/dist ./client/dist

# Create storage directory for offer letters
RUN mkdir -p /app/uploads/offers

EXPOSE 5000

CMD ["node", "server/dist/index.js"]

