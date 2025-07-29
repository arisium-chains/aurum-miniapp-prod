#!/bin/bash
set -e

# Fast build script for development
echo "🚀 Starting fast development build..."

# Build with development profile for speed
export CARGO_INCREMENTAL=1
export RUSTC_WRAPPER=""
export CARGO_PROFILE_DEV_INCREMENTAL=true

# Build both services in parallel
echo "Building face-detection..."
cargo build --bin face-detection &

echo "Building face-embedding..."
cargo build --bin face-embedding &

# Wait for both builds to complete
wait

echo "✅ Development builds completed!"
echo "Run services with:"
echo "  cargo run --bin face-detection"
echo "  cargo run --bin face-embedding"