# Build stage
FROM rust:1.82-slim-bookworm as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the face-detection service files
COPY face-detection/Cargo.toml ./face-detection/
COPY face-embedding/Cargo.toml ./face-embedding/
COPY common ./common
COPY face-detection/src ./face-detection/src

# Build the service
WORKDIR /app/face-detection
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/target/release/face-detection /app/face-detection

# Expose port
EXPOSE 8080

# Run the application
CMD ["./face-detection"]