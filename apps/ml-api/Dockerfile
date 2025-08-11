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

# Monorepo-compatible Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy workspace package files
COPY package*.json ./
COPY turbo.json ./

# Copy shared packages
COPY packages/ ./packages/

# Copy ml-api specific files
COPY apps/ml-api/package*.json ./apps/ml-api/
COPY apps/ml-api/tsconfig.json ./apps/ml-api/

# Install dependencies (workspace root)
RUN npm install

# Copy ml-api source code
COPY apps/ml-api/src/ ./apps/ml-api/src/

# Build shared packages first
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=packages/shared-utils
RUN npm run build --workspace=packages/shared-config

# Build ML API
WORKDIR /app/apps/ml-api
RUN npm run build

# Create directories for temp files and models
RUN mkdir -p temp models

EXPOSE 3000

# Set environment variables for service identification
ENV SERVICE_NAME=ml-api
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
