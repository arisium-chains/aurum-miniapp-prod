# Multi-stage build for production-ready build-monitor service
FROM rust:1.82-slim as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Copy source code
COPY src ./src
COPY config.toml ./

# Build the application
RUN cargo build --release

# Production stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    git \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 build-monitor

# Create app directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/build-monitor /usr/local/bin/

# Copy configuration
COPY --chown=build-monitor:build-monitor config.toml ./

# Create data directory
RUN mkdir -p /app/data /app/logs && \
    chown -R build-monitor:build-monitor /app

# Switch to non-root user
USER build-monitor

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Default command
CMD ["build-monitor", "start", "--daemon"]