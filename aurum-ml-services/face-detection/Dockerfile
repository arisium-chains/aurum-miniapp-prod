FROM rust:1.70-slim as builder

WORKDIR /app

# Copy face-detection service files
COPY face-detection/Cargo.toml face-detection/Cargo.lock ./
COPY face-detection/src/ ./src/

# Build the application
RUN cargo build --release --locked

# Create runtime image
FROM rust:1.70-slim

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/face-detection-service /usr/local/bin/

# Copy models directory (empty for now)
COPY face-detection/models/ ./models/

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run the application
CMD ["face-detection-service"]