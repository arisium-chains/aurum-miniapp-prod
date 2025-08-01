FROM node:20-alpine

WORKDIR /app


# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create directories for temp files and models
RUN mkdir -p temp models

EXPOSE 3000

CMD ["node", "dist/index.js"]
