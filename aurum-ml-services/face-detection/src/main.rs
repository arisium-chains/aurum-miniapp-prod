use actix_web::{web, App, HttpServer, middleware::Logger};
use env_logger;
use std::sync::Arc;
use crate::processors::FaceDetector;

mod api;
mod models;
mod processors;
mod utils;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();

    let port = std::env::var("PORT").unwrap_or_else(|_| "8001".to_string());
    let model_path = std::env::var("MODEL_PATH")
        .expect("MODEL_PATH environment variable must be set");

    println!("Starting Face Detection Service on port {}", port);

    // Initialize face detector with shared state
    let detector = Arc::new(
        FaceDetector::new(&model_path)
            .expect("Failed to initialize face detection model")
    );

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(detector.clone()))
            .wrap(Logger::default())
            .service(api::detect_face)
            .service(api::health_check)
    })
    .bind(format!("0.0.0.0:{}", port))?
    .run()
    .await
}
