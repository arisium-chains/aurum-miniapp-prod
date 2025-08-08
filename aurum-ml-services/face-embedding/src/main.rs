use axum::{
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{env, net::SocketAddr};

#[derive(Debug, Serialize, Deserialize)]
struct HealthResponse {
    status: String,
    service: String,
    version: String,
}

#[derive(Debug, Deserialize)]
struct EmbeddingRequest {
    image: String,
}

#[derive(Debug, Serialize)]
struct FaceEmbeddingResponse {
    embeddings: Vec<FaceEmbedding>,
    processing_time_ms: u64,
}

#[derive(Debug, Serialize)]
struct FaceEmbedding {
    face_id: String,
    embedding: Vec<f32>,
    confidence: f32,
}

#[tokio::main]
async fn main() {
    env_logger::init();

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8002".to_string())
        .parse()
        .expect("PORT must be a number");

    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/embed", post(embed_handler));

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("Face embedding service starting on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn health_handler() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy".to_string(),
        service: "face-embedding-service".to_string(),
        version: "1.0.0".to_string(),
    })
}

async fn embed_handler(
    Json(req): Json<EmbeddingRequest>,
) -> Result<Json<FaceEmbeddingResponse>, (StatusCode, String)> {
    if req.image.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "image field is required".to_string(),
        ));
    }

    // Simulate face embedding extraction
    let embedding: Vec<f32> = (0..512).map(|i| (i as f32 - 256.0) / 256.0).collect();

    let response = FaceEmbeddingResponse {
        embeddings: vec![FaceEmbedding {
            face_id: "face_001".to_string(),
            embedding,
            confidence: 0.92,
        }],
        processing_time_ms: 150,
    };

    Ok(Json(response))
}
