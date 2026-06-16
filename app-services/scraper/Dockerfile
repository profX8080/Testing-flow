# ============================================================
# Scraper Dockerfile
# Base image: node:18-alpine
# What it does: runs the scraper that generates dummy data
# every 30 seconds and stores it on the EBS volume at /scraped-data
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

# Create /scraped-data directory — overridden by EBS PVC mount in K8s
RUN mkdir -p /scraped-data && chown appuser:appgroup /scraped-data

USER appuser

EXPOSE 9090

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:9090/health || exit 1

CMD ["node", "src/index.js"]
