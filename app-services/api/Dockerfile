# ============================================================
# API Dockerfile
# Base image: node:18-alpine (lightweight Node.js)
# What it does: runs the Express.js API server on port 8080
# ============================================================

# Stage 1: build dependencies
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files first (better Docker layer caching)
# If package.json does not change, this layer is reused
COPY package.json ./

# Install production dependencies only
RUN npm install --production

# ────────────────────────────────────────────────────────────
# Stage 2: final image (smaller — does not include npm cache)
FROM node:18-alpine AS runner

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependencies from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY src/ ./src/
COPY package.json ./

# Switch to non-root user
USER appuser

# Expose the API port
EXPOSE 8080

# Health check at container level (extra safety net)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

# Start the API server
CMD ["node", "src/index.js"]
