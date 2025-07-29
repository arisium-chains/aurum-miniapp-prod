# Rust Face Embedding Implementation Plan

## Overview

This document outlines the detailed implementation plan for the Rust-based face embedding service that will replace the current simulated implementation. The service will use ArcFace or InsightFace models for extracting high-quality face embeddings.

## Technical Requirements

### 1. Core Dependencies

```toml
[dependencies]
actix-web = "4.0"
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
image = "0.24"
ndarray = "0.15"
ort = "1.15"  # ONNX Runtime for Rust
base64 = "0.21"
tokio-util = { version = "0.7", features = ["codec"] }
```

### 2. Model Selection

- **Primary**: ArcFace ResNet100 (arcface_resnet100.onnx)
- **Alternative**: InsightFace (insightface_resnet100.onnx)
- **Input Size**: 112x112 aligned face crops
- **Output**: 512-dimensional L2-normalized embedding vector

## Implementation Plan

### Phase 1: Core Infrastructure

#### 1. Project Structure

```
face-embedding-service/
├── Cargo.toml
├── src/
│   ├── main.rs              # Service entry point
│   ├── api/                 # API handlers
│   │   ├── mod.rs
│   │   ├── extract.rs       # Embedding extraction endpoint
│   │   └── health.rs        # Health check endpoint
│   ├── models/              # ML model handling
│   │   ├── mod.rs
│   │   ├── arcface.rs       # ArcFace implementation
│   │   └── insightface.rs    # InsightFace implementation
│   ├── processors/          # Image processing
│   │   ├── mod.rs
│   │   ├── face_align.rs     # Face alignment
│   │   ├── image_utils.rs   # Image utilities
│   │   └── preprocessing.rs # Image preprocessing
│   └── utils/               # Utility functions
│       ├── mod.rs
│       └── embedding.rs      # Embedding utilities
└── models/                  # ONNX model files
    ├── arcface_resnet100.onnx
    └── insightface_resnet100.onnx
```

#### 2. Main Service Implementation

```rust
// src/main.rs
use actix_web::{web, App, HttpServer, middleware::Logger};
use env_logger;

mod api;
mod models;
mod processors;
mod utils;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();

    let port = std::env::var("PORT").unwrap_or_else(|_| "8002".to_string());

    println!("Starting Face Embedding Service on port {}", port);

    HttpServer::new(|| {
        App::new()
            .wrap(Logger::default())
            .service(api::extract_embedding)
            .service(api::health_check)
    })
    .bind(format!("0.0.0.0:{}", port))?
    .run()
    .await
}
```

### Phase 2: Face Embedding Core Logic

#### 1. ArcFace Implementation

```rust
// src/models/arcface.rs
use ort::{Environment, ExecutionProvider, GraphOptimizationLevel, SessionBuilder};
use ndarray::{Array, IxDyn};
use image::{DynamicImage, GenericImageView};

pub struct ArcFaceEmbedder {
    session: ort::Session,
}

impl ArcFaceEmbedder {
    pub fn new(model_path: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let environment = Environment::builder()
            .with_name("ArcFace")
            .with_execution_providers([ExecutionProvider::cpu()])
            .build()?;

        let session = SessionBuilder::new(&environment)?
            .with_optimization_level(GraphOptimizationLevel::Level3)?
            .with_intra_threads(4)?
            .with_model_from_file(model_path)?;

        Ok(ArcFaceEmbedder { session })
    }

    pub fn extract_embedding(&self, face_img: &DynamicImage) -> Result<FaceEmbedding, Box<dyn std::error::Error>> {
        // Preprocess image
        let input_tensor = self.preprocess_image(face_img)?;

        // Run inference
        let outputs = self.session.run(ort::inputs![input_tensor]?)?;

        // Extract embedding from outputs
        let embedding = self.extract_embedding_from_output(&outputs)?;

        // Calculate quality metrics
        let quality = self.calculate_embedding_quality(&embedding);

        Ok(FaceEmbedding {
            embedding,
            quality,
            confidence: 0.95, // Placeholder, could be based on detection confidence
        })
    }

    fn preprocess_image(&self, img: &DynamicImage) -> Result<ort::Value, Box<dyn std::error::Error>> {
        // Resize image to model input size (112x112)
        let resized = img.resize_exact(112, 112, image::imageops::FilterType::Triangle);

        // Convert to RGB if needed
        let rgb_img = resized.to_rgb8();

        // Normalize to [-1, 1] range (ArcFace standard)
        let mut array = Array::zeros(IxDyn(&[1, 3, 112, 112]));
        let pixels = rgb_img.pixels();

        for (i, pixel) in pixels.enumerate() {
            let channel_stride = 112 * 112;
            let row = i / 112;
            let col = i % 112;

            array[[0, 0, row, col]] = (pixel[0] as f32 / 127.5) - 1.0;
            array[[0, 1, row, col]] = (pixel[1] as f32 / 127.5) - 1.0;
            array[[0, 2, row, col]] = (pixel[2] as f32 / 127.5) - 1.0;
        }

        Ok(ort::Value::from_array(array)?)
    }

    fn extract_embedding_from_output(&self, outputs: &ort::Outputs) -> Result<Vec<f32>, Box<dyn std::error::Error>> {
        // Extract embedding from model outputs
        // This will depend on the specific ArcFace model output format
        // Implementation details will be added based on the actual model

        // Placeholder for actual embedding extraction
        let embedding = vec![0.0; 512]; // 512-dimensional embedding

        Ok(embedding)
    }

    fn calculate_embedding_quality(&self, embedding: &[f32]) -> f32 {
        // Calculate embedding quality based on magnitude and diversity
        let magnitude = embedding.iter().map(|&x| x * x).sum::<f32>().sqrt();
        let mean = embedding.iter().sum::<f32>() / embedding.len() as f32;
        let variance = embedding.iter().map(|&x| (x - mean).powi(2)).sum::<f32>() / embedding.len() as f32;

        // Well-trained embeddings should have magnitude ~1.0 and good variance
        let magnitude_score = (1.0 - (magnitude - 1.0).abs()).max(0.0);
        let diversity_score = (variance * 10.0).min(1.0);

        (magnitude_score + diversity_score) / 2.0
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FaceEmbedding {
    pub embedding: Vec<f32>, // 512-dimensional vector
    pub quality: f32,        // Embedding quality score (0-1)
    pub confidence: f32,     // Detection confidence (0-1)
}
```

#### 2. Face Alignment

```rust
// src/processors/face_align.rs
use image::{DynamicImage, GenericImageView};
use crate::utils::embedding::FacialLandmarks;

pub fn align_face(img: &DynamicImage, landmarks: &FacialLandmarks) -> DynamicImage {
    // Align face based on facial landmarks
    // Implementation would use similarity transformation to align eyes horizontally

    // Placeholder implementation - return original image
    img.clone()
}

pub fn crop_face(img: &DynamicImage, bbox: &BoundingBox) -> DynamicImage {
    // Crop face from image based on bounding box
    img.crop_imm(
        bbox.x as u32,
        bbox.y as u32,
        bbox.width as u32,
        bbox.height as u32,
    )
}

#[derive(Debug, Clone)]
pub struct BoundingBox {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}
```

### Phase 3: API Implementation

#### 1. Embedding Extraction Endpoint

```rust
// src/api/extract.rs
use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use image::io::Reader as ImageReader;
use std::io::Cursor;

use crate::models::arcface::{ArcFaceEmbedder, FaceEmbedding};

#[derive(Deserialize)]
pub struct ExtractRequest {
    pub image: String, // Base64 encoded face image
    #[serde(default)]
    pub aligned: bool, // Whether the face is already aligned
}

#[derive(Serialize)]
pub struct ExtractResponse {
    pub success: bool,
    pub embedding: Option<FaceEmbedding>,
    pub message: Option<String>,
}

pub async fn extract_embedding(
    data: web::Json<ExtractRequest>,
    embedder: web::Data<ArcFaceEmbedder>,
) -> Result<HttpResponse> {
    match extract_embedding_impl(&data.image, data.aligned, &embedder).await {
        Ok(embedding) => {
            Ok(HttpResponse::Ok().json(ExtractResponse {
                success: true,
                embedding: Some(embedding),
                message: None,
            }))
        }
        Err(e) => {
            Ok(HttpResponse::BadRequest().json(ExtractResponse {
                success: false,
                embedding: None,
                message: Some(e.to_string()),
            }))
        }
    }
}

async fn extract_embedding_impl(
    base64_image: &str,
    aligned: bool,
    embedder: &ArcFaceEmbedder,
) -> Result<FaceEmbedding, Box<dyn std::error::Error>> {
    // Decode base64 image
    let image_data = base64::decode(base64_image)?;
    let cursor = Cursor::new(image_data);
    let img = ImageReader::new(cursor).with_guessed_format()?.decode()?;

    // If not aligned, align the face first (would require face detection and landmarks)
    let processed_img = if !aligned {
        // In a complete implementation, we would:
        // 1. Detect face in image
        // 2. Extract facial landmarks
        // 3. Align face based on landmarks
        img
    } else {
        img
    };

    // Extract embedding
    let embedding = embedder.extract_embedding(&processed_img)?;

    Ok(embedding)
}
```

#### 2. Health Check Endpoint

```rust
// src/api/health.rs
use actix_web::{HttpResponse, Result};
use serde::Serialize;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub service: String,
    pub version: String,
    pub timestamp: String,
    pub model_status: ModelStatus,
}

#[derive(Serialize)]
pub struct ModelStatus {
    pub loaded: bool,
    pub model_name: String,
    pub input_shape: Vec<usize>,
}

pub async fn health_check() -> Result<HttpResponse> {
    let response = HealthResponse {
        status: "healthy".to_string(),
        service: "face-embedding-service".to_string(),
        version: "1.0.0".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
        model_status: ModelStatus {
            loaded: true,
            model_name: "ArcFace ResNet100".to_string(),
            input_shape: vec![1, 3, 112, 112],
        },
    };

    Ok(HttpResponse::Ok().json(response))
}
```

### Phase 4: Model Integration

#### 1. Model Loading and Initialization

```rust
// src/models/mod.rs
use std::sync::Arc;
use tokio::sync::OnceCell;

use crate::models::arcface::ArcFaceEmbedder;

static ARC_FACE_EMBEDDER: OnceCell<Arc<ArcFaceEmbedder>> = OnceCell::const_new();

pub async fn get_arcface_embedder() -> Result<Arc<ArcFaceEmbedder>, Box<dyn std::error::Error>> {
    ARC_FACE_EMBEDDER.get_or_try_init(|| async {
        let model_path = std::env::var("MODEL_PATH").unwrap_or_else(|_| "./models/arcface_resnet100.onnx".to_string());
        let embedder = ArcFaceEmbedder::new(&model_path)?;
        Ok(Arc::new(embedder))
    }).await.clone()
}
```

### Phase 5: Testing and Validation

#### 1. Unit Tests

```rust
// src/models/arcface_test.rs
#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgb};

    #[test]
    fn test_arcface_initialization() {
        let embedder = ArcFaceEmbedder::new("./models/arcface_resnet100.onnx");
        assert!(embedder.is_ok());
    }

    #[test]
    fn test_embedding_quality() {
        let embedder = ArcFaceEmbedder::new("./models/arcface_resnet100.onnx").unwrap();

        // Test with a well-formed embedding (all ones)
        let embedding = vec![1.0; 512];
        let quality = embedder.calculate_embedding_quality(&embedding);
        assert!(quality > 0.5);

        // Test with a zero embedding
        let embedding = vec![0.0; 512];
        let quality = embedder.calculate_embedding_quality(&embedding);
        assert!(quality < 0.5);
    }
}
```

## Performance Optimization

### 1. Model Optimization

- Use quantized ONNX models for faster inference
- Enable CPU optimizations in ONNX Runtime
- Consider model distillation for smaller, faster models

### 2. Concurrency

- Use tokio for async processing
- Implement connection pooling for model sessions
- Use Arc and Mutex for shared state

### 3. Memory Management

- Reuse tensors where possible
- Implement object pooling for frequently allocated objects
- Use efficient data structures

## Error Handling

### 1. Error Types

```rust
#[derive(Debug)]
pub enum FaceEmbeddingError {
    ImageDecodeError(String),
    ModelInferenceError(String),
    InvalidInputError(String),
    ModelLoadError(String),
    AlignmentError(String),
}

impl std::fmt::Display for FaceEmbeddingError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            FaceEmbeddingError::ImageDecodeError(msg) => write!(f, "Image decode error: {}", msg),
            FaceEmbeddingError::ModelInferenceError(msg) => write!(f, "Model inference error: {}", msg),
            FaceEmbeddingError::InvalidInputError(msg) => write!(f, "Invalid input: {}", msg),
            FaceEmbeddingError::ModelLoadError(msg) => write!(f, "Model load error: {}", msg),
            FaceEmbeddingError::AlignmentError(msg) => write!(f, "Face alignment error: {}", msg),
        }
    }
}

impl std::error::Error for FaceEmbeddingError {}
```

## Deployment Considerations

### 1. Docker Configuration

```dockerfile
# Dockerfile for face-embedding-service
FROM rust:1.70 as builder

WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/face-embedding-service /usr/local/bin/face-embedding-service
COPY ./models /app/models

EXPOSE 8002
CMD ["face-embedding-service"]
```

### 2. Environment Variables

- `MODEL_PATH`: Path to the ONNX model file
- `PORT`: Service port (default: 8002)
- `LOG_LEVEL`: Logging level
- `MAX_CONCURRENT_REQUESTS`: Maximum concurrent requests

## Integration with Existing System

### 1. API Compatibility

The Rust service will expose the same API endpoints as the current Node.js implementation:

- `POST /api/extract-embedding` - Embedding extraction endpoint
- `GET /api/health` - Health check endpoint

### 2. Data Format

Input and output data formats will match the existing system to ensure seamless integration:

- Input: Base64 encoded face images
- Output: JSON with 512-dimensional embedding vector and quality metrics

## Performance Targets

### 1. Latency

- < 80ms for 112x112 face crops
- < 50ms for 112x112 face crops with GPU acceleration
- < 200ms for full image processing (detection + alignment + embedding)

### 2. Throughput

- > 15 requests/second on single core
- > 80 requests/second on 8-core system
- Memory usage < 600MB under load

### 3. Accuracy

- > 99% embedding extraction success rate
- < 0.1% embedding quality below threshold
- Consistent embedding quality across different lighting conditions

## Implementation Timeline

### Week 1: Core Infrastructure

- Set up project structure
- Implement basic HTTP server
- Create model loading framework

### Week 2: Face Embedding Logic

- Implement ArcFace embedding extraction
- Add image preprocessing and alignment
- Implement quality metrics calculation

### Week 3: API and Integration

- Implement REST API endpoints
- Add health checks and monitoring
- Ensure compatibility with existing system

### Week 4: Testing and Optimization

- Write unit and integration tests
- Performance optimization
- Documentation and deployment setup
