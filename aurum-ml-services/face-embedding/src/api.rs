use actix_web::{get, post, web, HttpResponse, Responder};
use serde::{Deserialize, Serialize};
use base64::Engine;
use image::io::Reader as ImageReader;
use std::io::Cursor;
use crate::{FaceEmbeddingModel, FaceEmbedding};
use ort::Error as OrtError;

#[derive(Debug, Serialize, Deserialize)]
pub struct FaceEmbeddingRequest {
    pub image_base64: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FaceEmbeddingResponse {
    pub embedding: Vec<f32>,
    pub quality: f32,
    pub confidence: f32,
    pub processing_time_ms: u128,
}

#[get("/health")]
pub async fn health_check() -> impl Responder {
    HttpResponse::Ok().json("OK")
}

#[post("/extract")]
pub async fn extract_embedding(
    payload: web::Json<FaceEmbeddingRequest>,
    model: web::Data<FaceEmbeddingModel>,
) -> Result<HttpResponse, actix_web::Error> {
    let start_time = std::time::Instant::now();
    
    // Validate base64 input
    if payload.image_base64.is_empty() {
        return Err(actix_web::error::ErrorBadRequest("Empty image data"));
    }
    if payload.image_base64.len() > 10_000_000 { // ~10MB max
        return Err(actix_web::error::ErrorBadRequest("Image too large"));
    }
    
    // Extract embedding
    let face_embedding = model.extract_embedding_from_base64(&payload.image_base64)
        .map_err(|e| actix_web::error::ErrorInternalServerError(e.to_string()))?;

    let processing_time = start_time.elapsed().as_millis();

    Ok(HttpResponse::Ok().json(FaceEmbeddingResponse {
        embedding: face_embedding.embedding,
        quality: face_embedding.quality,
        confidence: face_embedding.confidence,
        processing_time_ms: processing_time,
    }))
}