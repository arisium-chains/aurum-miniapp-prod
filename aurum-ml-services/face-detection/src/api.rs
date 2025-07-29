use actix_web::{get, post, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use base64::Engine;
use image::io::Reader as ImageReader;
use std::io::Cursor;
use crate::processors::FaceDetector;
use ort::Error as OrtError;


#[derive(Debug, Serialize, Deserialize)]
pub struct FaceDetectionRequest {
    pub image_base64: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FaceDetectionResponse {
    pub faces: Vec<FaceAnalysis>,
    pub processing_time_ms: u128,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FaceAnalysis {
    pub bounding_box: [f32; 4],
    pub score: f32,
    pub landmarks: Vec<[f32; 2]>,
    pub golden_ratio_analysis: GoldenRatioAnalysis,
    pub ai_detection: AiDetection,
    pub filter_detection: FilterDetection,
    pub geometric_analysis: GeometricAnalysis,
    pub texture_analysis: TextureAnalysis,
}

impl From<crate::models::FaceDetection> for FaceAnalysis {
    fn from(detection: crate::models::FaceDetection) -> Self {
        Self {
            bounding_box: detection.bounding_box,
            score: detection.score,
            landmarks: detection.landmarks.to_vec(),
            golden_ratio_analysis: GoldenRatioAnalysis::from(detection.golden_ratio_analysis),
            ai_detection: AiDetection::from(detection.ai_detection),
            filter_detection: FilterDetection::from(detection.filter_detection),
            geometric_analysis: GeometricAnalysis::from(detection.geometric_analysis),
            texture_analysis: TextureAnalysis::from(detection.texture_analysis),
        }
    }
}

impl From<crate::models::GoldenRatioAnalysis> for GoldenRatioAnalysis {
    fn from(analysis: crate::models::GoldenRatioAnalysis) -> Self {
        Self {
            score: analysis.score,
            symmetry_score: analysis.symmetry_score,
            facial_proportions: analysis.facial_proportions,
            overall_adherence: analysis.score * 100.0, // Convert to percentage
            dominant_ratio: "phi".to_string(), // Default value
            measurements: Default::default(), // Empty map
            improvements: Vec::new(), // Empty list
            confidence: 0.95, // Default confidence
        }
    }
}

impl From<crate::models::AiDetection> for crate::api::AiDetection {
    fn from(detection: crate::models::AiDetection) -> Self {
        Self {
            score: detection.score,
            confidence: detection.confidence,
            is_ai_generated: detection.score > 0.5,
            indicators: vec!["unknown".to_string()], // Default value
            detection_method: "onnx-model".to_string(), // Default value
        }
    }
}

impl From<crate::models::FilterDetection> for FilterDetection {
    fn from(detection: crate::models::FilterDetection) -> Self {
        Self {
            score: detection.score,
            confidence: detection.confidence,
            filter_level: match detection.score {
                s if s > 0.8 => "heavy",
                s if s > 0.5 => "medium",
                _ => "light",
            }.to_string(),
            detected_filters: vec!["unknown".to_string()], // Default value
            authenticity_impact: detection.score * 100.0, // Convert to percentage
        }
    }
}

impl From<crate::models::GeometricAnalysis> for GeometricAnalysis {
    fn from(analysis: crate::models::GeometricAnalysis) -> Self {
        Self {
            score: analysis.score,
            symmetry_score: analysis.symmetry_score,
            distortion_detected: analysis.score < 0.7,
            distortion_type: None, // Default value
            severity: 1.0 - analysis.score, // Invert score for severity
            affected_regions: vec!["unknown".to_string()], // Default value
        }
    }
}

impl From<crate::models::TextureAnalysis> for TextureAnalysis {
    fn from(analysis: crate::models::TextureAnalysis) -> Self {
        Self {
            score: analysis.score,
            confidence: analysis.confidence,
            skin_smoothing: analysis.score * 100.0, // Convert to percentage
            artificial_enhancement: analysis.score * 100.0, // Convert to percentage
            texture_consistency: analysis.confidence * 100.0, // Convert to percentage
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GoldenRatioAnalysis {
    pub score: f32,
    pub symmetry_score: f32,
    pub facial_proportions: [f32; 6],
    pub overall_adherence: f32,
    pub dominant_ratio: String,
    pub measurements: std::collections::HashMap<String, f32>,
    pub improvements: Vec<String>,
    pub confidence: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AiDetection {
    pub score: f32,
    pub confidence: f32,
    pub is_ai_generated: bool,
    pub indicators: Vec<String>,
    pub detection_method: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FilterDetection {
    pub score: f32,
    pub confidence: f32,
    pub filter_level: String,
    pub detected_filters: Vec<String>,
    pub authenticity_impact: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GeometricAnalysis {
    pub score: f32,
    pub symmetry_score: f32,
    pub distortion_detected: bool,
    pub distortion_type: Option<String>,
    pub severity: f32,
    pub affected_regions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TextureAnalysis {
    pub score: f32,
    pub confidence: f32,
    pub skin_smoothing: f32,
    pub artificial_enhancement: f32,
    pub texture_consistency: f32,
}

#[get("/health")]
pub async fn health_check() -> impl Responder {
    HttpResponse::Ok().json("OK")
}

#[post("/detect")]
pub async fn detect_face(
    payload: web::Json<FaceDetectionRequest>,
    detector: web::Data<FaceDetector>,
) -> Result<HttpResponse, actix_web::Error> {
    let start_time = std::time::Instant::now();
    
    // Validate base64 input
    if payload.image_base64.is_empty() {
        return Err(actix_web::error::ErrorBadRequest("Empty image data"));
    }
    if payload.image_base64.len() > 10_000_000 { // ~10MB max
        return Err(actix_web::error::ErrorBadRequest("Image too large"));
    }
    
    // Decode base64 image
    let image_bytes = base64::engine::general_purpose::STANDARD
        .decode(&payload.image_base64)
        .map_err(|e| actix_web::error::ErrorBadRequest(e.to_string()))?;
    
    // Load image
    let image = ImageReader::new(Cursor::new(image_bytes))
        .with_guessed_format()?
        .decode()
        .map_err(|e| actix_web::error::ErrorBadRequest(e.to_string()))?;

    // Detect faces
    let faces = detector.detect_faces(&image)
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    // Convert to response format using From trait
    let faces = faces.into_iter().map(FaceAnalysis::from).collect();

    let processing_time = start_time.elapsed().as_millis();

    Ok(HttpResponse::Ok().json(FaceDetectionResponse {
        faces,
        processing_time_ms: processing_time,
    }))
}

#[derive(Debug, thiserror::Error)]
pub enum FaceDetectionError {
    #[error("Invalid image format")]
    InvalidImageFormat,
    #[error("Invalid base64 encoding")]
    InvalidBase64,
    #[error("Image processing error: {0}")]
    ImageProcessing(String),
    #[error("Model error: {0}")]
    ModelError(String),
    #[error("Inference error: {0}")]
    InferenceError(String),
    #[error("ORT error: {0}")]
    OrtError(#[from] OrtError),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

impl From<crate::models::ModelError> for FaceDetectionError {
    fn from(err: crate::models::ModelError) -> Self {
        match err {
            crate::models::ModelError::OrtError(e) => FaceDetectionError::OrtError(e),
            crate::models::ModelError::InvalidInputShape => {
                FaceDetectionError::ModelError("Invalid input shape".to_string())
            }
            crate::models::ModelError::InvalidOutput => {
                FaceDetectionError::ModelError("Invalid output".to_string())
            }
        }
    }
}
