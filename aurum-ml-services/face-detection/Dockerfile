# Use Rust official image as base
FROM rustlang/rust:nightly as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    clang \
    libclang-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy workspace files
COPY Cargo.toml Cargo.lock ./
COPY common ./common
COPY face-detection ./face-detection
COPY face-embedding ./face-embedding

# Build the face-detection service
RUN cargo build --release --bin face-detection

# Production stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/target/release/face-detection ./face-detection

# Copy default models directory
RUN mkdir -p ./models

# Expose port
EXPOSE 8001

# Environment variables
ENV PORT=8001
ENV MODEL_PATH=/app/models/face_detection_model.onnx
ENV RUST_LOG=info

# Run the application
CMD ["./face-detection"]