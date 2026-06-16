# ============================================================
# Backend Dockerfile
# Base image: node:18-alpine
# What it does: runs the backend API that reads/writes to EBS
# The /data directory is mounted from an EBS PersistentVolume
# ============================================================

FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --production

FROM node:18-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./

# Create /data directory — will be overridden by EBS PVC mount
RUN mkdir -p /data && chown appuser:appgroup /data

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "src/index.js"]
