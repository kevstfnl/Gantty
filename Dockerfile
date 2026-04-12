# ── Stage 1: Dependencies ─────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Install dependencies only (cached layer)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Builder ──────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js (outputs to .next/standalone)
RUN npm run build

# ── Stage 3: Runner (minimal image, sources excluded) ─────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy ONLY the standalone build output — no sources
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

# Data directory for SQLite (mounted as volume)
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

# Set DB path to persistent volume
ENV DB_PATH=/app/data/gantty.db

CMD ["node", "server.js"]
