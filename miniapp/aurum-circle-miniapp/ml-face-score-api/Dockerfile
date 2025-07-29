FROM node:20-alpine

WORKDIR /app

# Install Python and build tools for onnxruntime-node
RUN apk add --no-cache python3 py3-pip make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create directories for temp files and models
RUN mkdir -p temp models

EXPOSE 3000

CMD ["node", "dist/index.js"]