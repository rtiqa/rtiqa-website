# =====================================================================
# RTIQA Education Platform - Production Multi-Stage Dockerfile
# Stage 1: Build Frontend SPA and Server TypeScript Bundles
# Stage 2: Minimal, Non-Root Production Runtime Container
# =====================================================================

# ----------------- Stage 1: Builder -----------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies required for build
COPY package.json package-lock.json ./
RUN npm ci

# Copy source tree and configuration files
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY server ./server
COPY server.ts ./

# Execute production build (creates dist/ and dist/server.cjs)
RUN npm run build

# ----------------- Stage 2: Runner -----------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/db/schema.sql ./src/db/schema.sql

# Set non-root permissions for secure container execution
USER node

# Expose standard container ingress port
EXPOSE 3000

# Container Healthcheck using built-in health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Production Start Command
CMD ["node", "dist/server.cjs"]
