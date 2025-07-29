use actix_web::{web, App, HttpServer, middleware::Logger};
use env_logger;
use std::sync::Arc;
use face_embedding::FaceEmbeddingModel;

mod api;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();

    let port = std::env::var("PORT").unwrap_or_else(|_| "8002".to_string());
    let model_path = std::env::var("MODEL_PATH")
        .expect("MODEL_PATH environment variable must be set");

    println!("Starting Face Embedding Service on port {}", port);

    // Initialize face embedding model with shared state
    let model = Arc::new(
        FaceEmbeddingModel::new(&model_path)
            .expect("Failed to initialize face embedding model")
    );

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(model.clone()))
            .wrap(Logger::default())
            .service(api::extract_embedding)
            .service(api::health_check)
    })
    .bind(format!("0.0.0.0:{}", port))?
    .run()
    .await
}
