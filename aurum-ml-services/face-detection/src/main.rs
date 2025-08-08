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
struct DetectionRequest {
    image: String,
}

#[derive(Debug, Serialize)]
struct FaceDetectionResponse {
    faces: Vec<Face>,
}

#[derive(Debug, Serialize)]
struct Face {
    bbox: [i32; 4],
    confidence: f32,
}

#[tokio::main]
async fn main() {
    env_logger::init();

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8001".to_string())
        .parse()
        .expect("PORT must be a number");

    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/detect", post(detect_handler));

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("Face detection service starting on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn health_handler() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy".to_string(),
        service: "face-detection-service".to_string(),
        version: "1.0.0".to_string(),
    })
}

async fn detect_handler(
    Json(req): Json<DetectionRequest>,
) -> Result<Json<FaceDetectionResponse>, (StatusCode, String)> {
    if req.image.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "image field is required".to_string(),
        ));
    }

    // Simulate face detection with mock data
    let faces = vec![
        Face {
            bbox: [100, 100, 200, 200],
            confidence: 0.95,
        },
        Face {
            bbox: [150, 150, 250, 250],
            confidence: 0.87,
        },
    ];

    Ok(Json(FaceDetectionResponse { faces }))
}
