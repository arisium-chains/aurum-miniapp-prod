# Docker Compose Bug Fix Plan

## Problem Analysis

### Current Issues

1. **Obsolete version attribute**: Docker Compose warns about the deprecated `version: "3.8"` attribute
2. **Missing aurum-ml-services directory**: The configuration references `../../aurum-ml-services` but this directory doesn't exist
3. **Path resolution failures**: Docker cannot find the build context for Rust ML services

### Root Cause

The docker-compose.yml files are configured to build Rust ML services from a non-existent directory structure. The services expect:

- `aurum-ml-services/face-detection/Dockerfile`
- `aurum-ml-services/face-embedding/Dockerfile`

But these directories and files don't exist in the current project structure.

## Solution Approach

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   ML API        │    │   ML Worker     │
│   (Port 3000)   │◄──►│   (Port 3001)   │◄──►│                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │     Redis      │    │   Qdrant DB     │
         │              │   (Port 6381)   │    │ (Port 6334/6335)│
         │              └─────────────────┘    └─────────────────┘
         │                       │
         │                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Face Detection  │    │ Face Embedding  │    │   Nginx Proxy   │
│ Service (8001)  │    │ Service (8002)  │    │    (Port 80)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                 │
        ┌─────────────────┐
        │  Model Files    │
        │ (public/models) │
        └─────────────────┘
```

### Implementation Plan

#### Phase 1: Remove Deprecated Version Attribute

- Remove `version: "3.8"` from both `docker-compose.yml` and `docker-compose.dev.yml`
- Modern Docker Compose doesn't require version specification

#### Phase 2: Create aurum-ml-services Directory Structure

Create the following directory structure:

```
aurum-ml-services/
├── face-detection/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── src/
│       └── main.rs
├── face-embedding/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── src/
│       └── main.rs
└── models/
    ├── face_detection_model.onnx
    └── face_embedding_model.onnx
```

#### Phase 3: Create Placeholder Services

Create simplified Rust services that:

- Respond to health checks on `/health` endpoint
- Provide basic face detection/embedding simulation
- Log requests for debugging
- Use minimal dependencies

#### Phase 4: Update Docker Compose Configuration

- Update build contexts in both docker-compose files
- Ensure proper volume mounts for model files
- Configure environment variables correctly

#### Phase 5: Testing and Verification

- Test individual service builds
- Test full docker-compose up sequence
- Verify service communication
- Test health check endpoints

## Detailed Implementation Steps

### Step 1: Remove Version Attribute

```yaml
# Remove this line:
version: "3.8"

# Services should start directly:
services:
  app:
    # ...
```

### Step 2: Create Directory Structure

```bash
# Create aurum-ml-services directory
mkdir -p aurum-ml-services/face-detection/src
mkdir -p aurum-ml-services/face-embedding/src
mkdir -p aurum-ml-services/models
```

### Step 3: Create Face Detection Service

**Dockerfile**:

```dockerfile
FROM rust:1.70-slim as builder

WORKDIR /app
COPY face-detection/src ./src/
COPY Cargo.toml ./

RUN cargo build --release

FROM rust:1.70-slim
WORKDIR /app
COPY --from=builder /app/target/release/face-detection-service /usr/local/bin/
COPY models/ ./models/

EXPOSE 8001
CMD ["face-detection-service"]
```

**src/main.rs**:

```rust
use std::net::TcpListener;
use std::io::{Read, Write};
use std::thread;
use std::sync::Arc;

fn main() -> std::io::Result<()> {
    let listener = TcpListener::bind("0.0.0.0:8001")?;
    println!("Face detection service listening on port 8001");

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                thread::spawn(|| {
                    handle_connection(stream);
                });
            }
            Err(e) => {
                eprintln!("Failed to establish connection: {}", e);
            }
        }
    }
    Ok(())
}

fn handle_connection(mut stream: std::net::TcpStream) {
    let mut buffer = [0; 1024];
    match stream.read(&mut buffer) {
        Ok(_) => {
            let request = String::from_utf8_lossy(&buffer[..]);
            println!("Received request: {}", request);

            let response = if request.contains("/health") {
                "HTTP/1.1 200 OK\r\n\r\n{\"status\":\"healthy\",\"service\":\"face-detection-service\"}"
            } else {
                "HTTP/1.1 200 OK\r\n\r\n{\"faces\":[{\"bbox\":[100,100,200,200],\"confidence\":0.95}]}"
            };

            stream.write_all(response.as_bytes()).unwrap();
        }
        Err(e) => {
            eprintln!("Failed to read from connection: {}", e);
        }
    }
}
```

### Step 4: Create Face Embedding Service

Similar structure but on port 8002 with embedding-specific responses.

### Step 5: Update Docker Compose Configuration

```yaml
# Update build contexts to use correct relative paths
face-detection-service:
  build:
    context: ../../aurum-ml-services
    dockerfile: face-detection/Dockerfile

face-embedding-service:
  build:
    context: ../../aurum-ml-services
    dockerfile: face-embedding/Dockerfile
```

## Expected Outcomes

After implementing this plan:

1. **No more Docker Compose warnings** about obsolete version attribute
2. **Successful build process** for all services including ML services
3. **Proper service communication** between all components
4. **Health check endpoints** working for all services
5. **Model file access** for ML services

## Testing Strategy

1. **Build Testing**: Test individual Docker builds
2. **Compose Testing**: Test `docker-compose up --build`
3. **Service Testing**: Verify health endpoints
4. **Integration Testing**: Test service-to-service communication
5. **Volume Testing**: Verify model file access

## Rollback Plan

If issues persist:

1. Comment out ML services in docker-compose.yml
2. Set environment variables to use simulated ML only
3. Verify basic application functionality
4. Gradually reintroduce services one by one

## Alternative Approaches

If the placeholder services don't meet requirements:

1. **Remove ML services entirely** and rely on simulated ML
2. **Use external ML services** via Docker Hub images
3. **Create Node.js-based ML services** as intermediate solution
4. **Implement proper Rust services** with actual ML capabilities
