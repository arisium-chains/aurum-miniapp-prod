# Build stage
FROM node:20-alpine AS builder

# Install Python and build tools needed for some Node.js packages or scripts
RUN apk add --no-cache python3 py3-pip make g++ bash

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --only=production --ignore-scripts

# Copy the rest of the application code
COPY . .

# Download required models
RUN npm run download-models

# Build the Next.js application with standalone output
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Install necessary system dependencies for the application runtime
RUN apk add --no-cache dumb-init

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the working directory
WORKDIR /app

# Copy the standalone output from the builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env.production.local ./.env.production.local # If you use a production-specific .env

# Copy any other essential files not covered by the standalone build
# For example, custom scripts or configuration files not in public or .next
# COPY --from=builder /app/scripts ./scripts # If scripts are needed at runtime

# Set correct permissions for the application
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the environment variable for the server
ENV PORT 3000
ENV HOSTNAME "0.0.0.0" # Listen on all interfaces

# Use dumb-init as the entrypoint to properly handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start the application using the standalone server
# The server.js file is created by Next.js standalone output
CMD ["node", "server.js"]
