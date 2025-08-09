# Rust Face Detection Implementation Plan

## Overview

This document outlines the detailed implementation plan for the Rust-based face detection service that will replace the current simulated implementation. The service will use MediaPipe BlazeFace or MTCNN models for accurate and efficient face detection.

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

- **Primary**: MediaPipe BlazeFace (blazeface.onnx)
- **Alternative**: MTCNN (pnet.onnx, rnet.onnx, onet.onnx)
- **Input Size**: 128x128 or 192x192 for BlazeFace
- **Output**: Bounding boxes, confidence scores, facial landmarks

## Implementation Plan

### Phase 1: Core Infrastructure

#### 1. Project Structure

```
face-detection-service/
├── Cargo.toml
├── src/
│   ├── main.rs              # Service entry point
│   ├── api/                 # API handlers
│   │   ├── mod.rs
│   │   ├── detect.rs        # Face detection endpoint
│   │   └── health.rs        # Health check endpoint
│   ├── models/              # ML model handling
│   │   ├── mod.rs
│   │   ├── blazeface.rs     # BlazeFace implementation
│   │   └── mtcnn.rs         # MTCNN implementation
│   ├── processors/          # Image processing
│   │   ├── mod.rs
│   │   ├── image_utils.rs   # Image utilities
│   │   └── preprocessing.rs # Image preprocessing
│   └── utils/               # Utility functions
│       ├── mod.rs
│       └── bbox.rs          # Bounding box utilities
└── models/                  # ONNX model files
    ├── blazeface.onnx
    └── mtcnn/
        ├── pnet.onnx
        ├── rnet.onnx
        └── onet.onnx
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

    let port = std::env::var("PORT").unwrap_or_else(|_| "8001".to_string());

    println!("Starting Face Detection Service on port {}", port);

    HttpServer::new(|| {
        App::new()
            .wrap(Logger::default())
            .service(api::detect_face)
            .service(api::health_check)
    })
    .bind(format!("0.0.0.0:{}", port))?
    .run()
    .await
}
```

### Phase 2: Face Detection Core Logic

#### 1. BlazeFace Implementation

```rust
// src/models/blazeface.rs
use ort::{Environment, ExecutionProvider, GraphOptimizationLevel, SessionBuilder};
use ndarray::{Array, IxDyn};
use image::{DynamicImage, GenericImageView};

pub struct BlazeFaceDetector {
    session: ort::Session,
}

impl BlazeFaceDetector {
    pub fn new(model_path: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let environment = Environment::builder()
            .with_name("BlazeFace")
            .with_execution_providers([ExecutionProvider::cpu()])
            .build()?;

        let session = SessionBuilder::new(&environment)?
            .with_optimization_level(GraphOptimizationLevel::Level3)?
            .with_intra_threads(4)?
            .with_model_from_file(model_path)?;

        Ok(BlazeFaceDetector { session })
    }

    pub fn detect_faces(&self, img: &DynamicImage) -> Result<Vec<FaceDetection>, Box<dyn std::error::Error>> {
        // Preprocess image
        let input_tensor = self.preprocess_image(img)?;

        // Run inference
        let outputs = self.session.run(ort::inputs![input_tensor]?)?;

        // Post-process results
        let detections = self.postprocess_outputs(&outputs, img.width(), img.height())?;

        Ok(detections)
    }

    fn preprocess_image(&self, img: &DynamicImage) -> Result<ort::Value, Box<dyn std::error::Error>> {
        // Resize image to model input size (128x128 or 192x192)
        let resized = img.resize_exact(128, 128, image::imageops::FilterType::Triangle);

        // Convert to RGB if needed
        let rgb_img = resized.to_rgb8();

        // Normalize pixel values to [0, 1]
        let mut array = Array::zeros(IxDyn(&[1, 3, 128, 128]));
        let pixels = rgb_img.pixels();

        for (i, pixel) in pixels.enumerate() {
            let channel_stride = 128 * 128;
            let row = i / 128;
            let col = i % 128;

            array[[0, 0, row, col]] = pixel[0] as f32 / 255.0;
            array[[0, 1, row, col]] = pixel[1] as f32 / 255.0;
            array[[0, 2, row, col]] = pixel[2] as f32 / 255.0;
        }

        Ok(ort::Value::from_array(array)?)
    }

    fn postprocess_outputs(&self, outputs: &ort::Outputs, img_width: u32, img_height: u32) -> Result<Vec<FaceDetection>, Box<dyn std::error::Error>> {
        // Extract bounding boxes and confidence scores from model outputs
        // This will depend on the specific BlazeFace model output format
        // Implementation details will be added based on the actual model

        let mut detections = Vec::new();

        // Placeholder for actual post-processing logic
        // This would parse the model outputs and convert them to FaceDetection structs

        Ok(detections)
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FaceDetection {
    pub bbox: BoundingBox,
    pub landmarks: FacialLandmarks,
    pub confidence: f32,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct BoundingBox {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FacialLandmarks {
    pub left_eye: [f32; 2],
    pub right_eye: [f32; 2],
    pub nose: [f32; 2],
    pub left_mouth: [f32; 2],
    pub right_mouth: [f32; 2],
}
```

#### 2. Image Preprocessing

```rust
// src/processors/preprocessing.rs
use image::{DynamicImage, GenericImageView};
use ndarray::Array;

pub fn preprocess_for_detection(img: &DynamicImage, target_size: (u32, u32)) -> Array<f32, ndarray::IxDyn> {
    // Resize image
    let resized = img.resize_exact(target_size.0, target_size.1, image::imageops::FilterType::Triangle);

    // Convert to RGB
    let rgb_img = resized.to_rgb8();

    // Create tensor
    let mut array = Array::zeros(ndarray::IxDyn(&[1, 3, target_size.1 as usize, target_size.0 as usize]));

    for (i, pixel) in rgb_img.pixels().enumerate() {
        let row = i / target_size.0 as usize;
        let col = i % target_size.0 as usize;

        array[[0, 0, row, col]] = pixel[0] as f32 / 255.0;
        array[[0, 1, row, col]] = pixel[1] as f32 / 255.0;
        array[[0, 2, row, col]] = pixel[2] as f32 / 255.0;
    }

    array
}

pub fn decode_bounding_boxes(output: &ndarray::ArrayViewD<f32>, img_width: f32, img_height: f32) -> Vec<BoundingBox> {
    // Convert normalized coordinates to pixel coordinates
    // Implementation depends on model output format

    Vec::new() // Placeholder
}
```

### Phase 3: API Implementation

#### 1. Detection Endpoint

```rust
// src/api/detect.rs
use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use image::io::Reader as ImageReader;
use std::io::Cursor;

use crate::models::blazeface::{BlazeFaceDetector, FaceDetection};

#[derive(Deserialize)]
pub struct DetectRequest {
    pub image: String, // Base64 encoded image
    #[serde(default = "default_min_confidence")]
    pub min_confidence: f32,
}

fn default_min_confidence() -> f32 {
    0.7
}

#[derive(Serialize)]
pub struct DetectResponse {
    pub success: bool,
    pub faces: Vec<FaceDetection>,
    pub message: Option<String>,
}

pub async fn detect_face(
    data: web::Json<DetectRequest>,
    detector: web::Data<BlazeFaceDetector>,
) -> Result<HttpResponse> {
    match detect_faces_impl(&data.image, data.min_confidence, &detector).await {
        Ok(faces) => {
            Ok(HttpResponse::Ok().json(DetectResponse {
                success: true,
                faces,
                message: None,
            }))
        }
        Err(e) => {
            Ok(HttpResponse::BadRequest().json(DetectResponse {
                success: false,
                faces: vec![],
                message: Some(e.to_string()),
            }))
        }
    }
}

async fn detect_faces_impl(
    base64_image: &str,
    min_confidence: f32,
    detector: &BlazeFaceDetector,
) -> Result<Vec<FaceDetection>, Box<dyn std::error::Error>> {
    // Decode base64 image
    let image_data = base64::decode(base64_image)?;
    let cursor = Cursor::new(image_data);
    let img = ImageReader::new(cursor).with_guessed_format()?.decode()?;

    // Detect faces
    let mut faces = detector.detect_faces(&img)?;

    // Filter by confidence
    faces.retain(|face| face.confidence >= min_confidence);

    Ok(faces)
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
}

pub async fn health_check() -> Result<HttpResponse> {
    let response = HealthResponse {
        status: "healthy".to_string(),
        service: "face-detection-service".to_string(),
        version: "1.0.0".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
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

use crate::models::blazeface::BlazeFaceDetector;

static BLAZE_FACE_DETECTOR: OnceCell<Arc<BlazeFaceDetector>> = OnceCell::const_new();

pub async fn get_blazeface_detector() -> Result<Arc<BlazeFaceDetector>, Box<dyn std::error::Error>> {
    BLAZE_FACE_DETECTOR.get_or_try_init(|| async {
        let model_path = std::env::var("MODEL_PATH").unwrap_or_else(|_| "./models/blazeface.onnx".to_string());
        let detector = BlazeFaceDetector::new(&model_path)?;
        Ok(Arc::new(detector))
    }).await.clone()
}
```

### Phase 5: Testing and Validation

#### 1. Unit Tests

```rust
// src/models/blazeface_test.rs
#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgb};

    #[test]
    fn test_blazeface_initialization() {
        let detector = BlazeFaceDetector::new("./models/blazeface.onnx");
        assert!(detector.is_ok());
    }

    #[test]
    fn test_preprocessing() {
        // Create a test image
        let img = ImageBuffer::from_fn(100, 100, |x, y| {
            Rgb([x as u8, y as u8, (x + y) as u8])
        });
        let dyn_img = DynamicImage::ImageRgb8(img);

        let tensor = preprocess_for_detection(&dyn_img, (128, 128));
        assert_eq!(tensor.shape(), &[1, 3, 128, 128]);
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
pub enum FaceDetectionError {
    ImageDecodeError(String),
    ModelInferenceError(String),
    InvalidInputError(String),
    ModelLoadError(String),
}

impl std::fmt::Display for FaceDetectionError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            FaceDetectionError::ImageDecodeError(msg) => write!(f, "Image decode error: {}", msg),
            FaceDetectionError::ModelInferenceError(msg) => write!(f, "Model inference error: {}", msg),
            FaceDetectionError::InvalidInputError(msg) => write!(f, "Invalid input: {}", msg),
            FaceDetectionError::ModelLoadError(msg) => write!(f, "Model load error: {}", msg),
        }
    }
}

impl std::error::Error for FaceDetectionError {}
```

## Deployment Considerations

### 1. Docker Configuration

```dockerfile
# Dockerfile for face-detection-service
FROM rust:1.70 as builder

WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/face-detection-service /usr/local/bin/face-detection-service
COPY ./models /app/models

EXPOSE 8001
CMD ["face-detection-service"]
```

### 2. Environment Variables

- `MODEL_PATH`: Path to the ONNX model file
- `PORT`: Service port (default: 8001)
- `LOG_LEVEL`: Logging level
- `MAX_CONCURRENT_REQUESTS`: Maximum concurrent requests

## Integration with Existing System

### 1. API Compatibility

The Rust service will expose the same API endpoints as the current Node.js implementation:

- `POST /api/detect-face` - Face detection endpoint
- `GET /api/health` - Health check endpoint

### 2. Data Format

Input and output data formats will match the existing system to ensure seamless integration:

- Input: Base64 encoded images
- Output: JSON with bounding boxes, landmarks, and confidence scores

## Performance Targets

### 1. Latency

- < 50ms for 512x512 images
- < 30ms for 256x256 images
- < 100ms for 1024x1024 images

### 2. Throughput

- > 20 requests/second on single core
- > 100 requests/second on 8-core system
- Memory usage < 500MB under load

### 3. Accuracy

- > 95% face detection accuracy on standard datasets
- < 5% false positive rate
- Robust detection across different lighting conditions and angles

## Implementation Timeline

### Week 1: Core Infrastructure

- Set up project structure
- Implement basic HTTP server
- Create model loading framework

### Week 2: Face Detection Logic

- Implement BlazeFace detection
- Add image preprocessing
- Implement post-processing

### Week 3: API and Integration

- Implement REST API endpoints
- Add health checks and monitoring
- Ensure compatibility with existing system

### Week 4: Testing and Optimization

- Write unit and integration tests
- Performance optimization
- Documentation and deployment setup
