# Multi-stage Docker build for Aurum Circle Next.js Frontend
# Optimized for production deployment with standalone output
# Supports custom registry configuration and proxy settings

# Build arguments for network configuration
ARG NPM_REGISTRY=https://registry.npmjs.org
ARG NPM_PROXY=
ARG NPM_OFFLINE=false

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install system dependencies needed for build and runtime
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    curl \
    wget \
    && rm -rf /var/cache/apk/*

# Configure npm with better timeout and retry settings
RUN npm config set fetch-timeout 300000 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-retry-factor 2

# Configure npm based on build arguments
RUN if [ ! -z "$NPM_PROXY" ]; then \
      npm config set proxy "$NPM_PROXY" \
    ; fi \
    && if [ "$NPM_OFFLINE" = "true" ]; then \
      npm config set offline true \
    ; fi

# Copy package files
COPY package*.json ./

# Copy robust installation script
COPY scripts/install-deps.sh .
RUN chmod +x install-deps.sh

# Use robust installation script with custom registry
RUN if [ ! -z "$NPM_REGISTRY" ] && [ "$NPM_REGISTRY" != "https://registry.npmjs.org" ]; then \
      echo "🎯 Using custom registry: $NPM_REGISTRY" \
    ; fi \
    && ./install-deps.sh

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy application source code
COPY . .

# Ensure scripts are executable
RUN chmod +x scripts/*.sh

# Download ML models during build (now that source code is available)
RUN echo "Starting ML model download..." && \
    npm run download-models || \
    (echo "❌ Model download failed, but continuing with build..." && \
     mkdir -p public/models/arcface public/models/face_detection && \
     touch public/models/arcface/buffalo_l.onnx && \
     touch public/models/face_detection/model.tflite && \
     echo '{"face_detection":{"model_path":"/models/face_detection/model.tflite","input_size":[192,192],"confidence_threshold":0.7,"backend":"webgl"},"face_embedding":{"model_path":"/models/arcface/buffalo_l.onnx","input_size":[112,112],"output_size":512,"backend":"webgl"},"version":"1.0.0","last_updated":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' > public/models/model_config.json)

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application with standalone output
RUN npm run build --legacy-peer-deps

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment variables for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install runtime dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl \
    wget \
    && rm -rf /var/cache/apk/*

# Copy built application from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy ML models
COPY --from=builder --chown=nextjs:nodejs /app/public/models ./public/models

# Create directories for persistent data
RUN mkdir -p /app/data/logs && chown -R nextjs:nodejs /app/data

# Set execute permissions for scripts
RUN chmod +x scripts/*.sh

# Switch to non-root user
USER nextjs

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
