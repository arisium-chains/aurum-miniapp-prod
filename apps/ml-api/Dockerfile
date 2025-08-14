# ML API Dockerfile - Simple minimal server
FROM node:20-alpine AS builder

WORKDIR /app

# Create minimal package.json
RUN echo '{ \
  "name": "ml-api-simple", \
  "version": "1.0.0", \
  "main": "dist/simple-server.js", \
  "scripts": { \
    "build": "tsc", \
    "start": "node dist/simple-server.js" \
  }, \
  "dependencies": { \
    "express": "^4.19.2", \
    "cors": "^2.8.5", \
    "helmet": "^7.1.0", \
    "compression": "^1.7.4" \
  }, \
  "devDependencies": { \
    "typescript": "^5.4.5", \
    "@types/express": "^4.17.21", \
    "@types/cors": "^2.8.17", \
    "@types/compression": "^1.7.5", \
    "@types/node": "^20.12.7" \
  } \
}' > package.json

# Create minimal tsconfig.json
RUN echo '{ \
  "compilerOptions": { \
    "target": "ES2020", \
    "module": "commonjs", \
    "outDir": "./dist", \
    "rootDir": "./src", \
    "strict": true, \
    "esModuleInterop": true, \
    "skipLibCheck": true, \
    "forceConsistentCasingInFileNames": true \
  }, \
  "include": ["src/**/*"], \
  "exclude": ["node_modules", "dist"] \
}' > tsconfig.json

# Install dependencies
RUN npm install

# Copy simple server source
COPY apps/ml-api/src/simple-server.ts ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Install wget for health checks
RUN apk add --no-cache wget

WORKDIR /app

# Copy package.json and install production dependencies
COPY --from=builder /app/package.json ./
RUN npm install --only=production && npm cache clean --force

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

CMD ["node", "dist/simple-server.js"]
