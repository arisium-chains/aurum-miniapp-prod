FROM rust:1.70-slim as builder

WORKDIR /app

# Copy face-embedding service files
COPY face-embedding/Cargo.toml ./
COPY face-embedding/src/ ./src/

# Build the application
RUN cargo build --release

# Create runtime image
FROM rust:1.70-slim

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/face-embedding-service /usr/local/bin/

# Copy models directory (empty for now)
COPY face-embedding/models/ ./models/

# Expose port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

# Run the application
CMD ["face-embedding-service"]