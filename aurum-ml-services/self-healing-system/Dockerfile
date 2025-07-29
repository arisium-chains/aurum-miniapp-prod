# Multi-stage build for self-healing system
FROM rust:1.80-slim as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libsqlite3-dev \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY Cargo.toml Cargo.lock ./
COPY self-healing-system/Cargo.toml ./self-healing-system/
COPY self-healing-system/migrations ./self-healing-system/migrations/

# Copy source code
COPY self-healing-system/src ./self-healing-system/src/
COPY self-healing-system/config ./self-healing-system/config/

# Build the application
WORKDIR /app/self-healing-system
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libsqlite3-0 \
    libssl3 \
    git \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -r -g root -u 1001 selfheal

# Create directories
RUN mkdir -p /app/data /app/logs /app/config
RUN chown -R selfheal:root /app

# Copy binary from builder
COPY --from=builder /app/target/release/self-healing-system /app/self-healing-system

# Copy configuration
COPY --from=builder /app/self-healing-system/config /app/config/

# Set permissions
RUN chmod +x /app/self-healing-system
RUN chown -R selfheal:root /app

# Switch to non-root user
USER selfheal

# Set working directory
WORKDIR /app

# Expose ports
EXPOSE 8080 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Default command
CMD ["./self-healing-system", "daemon"]