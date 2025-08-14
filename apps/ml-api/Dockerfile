# [DEPRECATED: 2025-08-11] Old single-app Dockerfile preserved for reference
# FROM node:20-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .
# RUN npm install --include=dev typescript
# RUN npm run build
# RUN mkdir -p temp models
# EXPOSE 3000
# CMD ["node", "dist/index.js"]

# Standalone ML API Dockerfile (built from apps/ml-api context)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Install wget for health checks
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create directories for temp files and models
RUN mkdir -p temp models

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 mlapi

# Set correct permissions
RUN chown -R mlapi:nodejs /app
USER mlapi

EXPOSE 3000

# Set environment variables
ENV SERVICE_NAME=ml-api
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
