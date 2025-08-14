# Simple web app Dockerfile
FROM node:20-alpine AS runner

# Install wget for health checks
RUN apk add --no-cache wget

WORKDIR /app

# Create minimal package.json
RUN echo '{ \
  "name": "aurum-web-simple", \
  "version": "1.0.0", \
  "main": "simple-app.js", \
  "scripts": { \
    "start": "node simple-app.js" \
  }, \
  "dependencies": { \
    "express": "^4.19.2" \
  } \
}' > package.json

# Install dependencies
RUN npm install --only=production && npm cache clean --force

# Copy simple app
COPY src/simple-app.js ./

# Create public directory
RUN mkdir -p public

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 webapp

# Set correct permissions
RUN chown -R webapp:nodejs /app
USER webapp

EXPOSE 3000

# Set environment variables
ENV SERVICE_NAME=web-app
ENV NODE_ENV=production

CMD ["node", "simple-app.js"]
