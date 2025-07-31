# Use the official Node.js image as the base image
FROM node:20-alpine

# Install Python and build tools
RUN apk add --no-cache python3 py3-pip make g++ bash

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --ignore-scripts

# Copy the rest of the application code
COPY . .

# Set execute permissions for scripts
RUN chmod +x scripts/*.sh

# Run the model download script
RUN npm run download-models

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
