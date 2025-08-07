use std::env;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct HealthResponse {
    status: String,
    service: String,
    version: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct FaceDetectionResponse {
    faces: Vec<Face>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Face {
    bbox: [i32; 4],
    confidence: f32,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::init();
    
    // Get port from environment or use default
    let port = env::var("PORT")
        .unwrap_or_else(|_| "8001".to_string())
        .parse()
        .expect("PORT must be a number");
    
    let addr: SocketAddr = ([0, 0, 0, 0], port).into();
    
    println!("Face detection service starting on {}", addr);
    
    let listener = TcpListener::bind(addr).await?;
    
    loop {
        let (mut socket, _) = listener.accept().await?;
        
        tokio::spawn(async move {
            let mut buffer = [0; 1024];
            
            // Read the HTTP request
            let mut request = String::new();
            loop {
                let n = match socket.read(&mut buffer).await {
                    Ok(n) if n == 0 => return,
                    Ok(n) => n,
                    Err(e) => {
                        eprintln!("failed to read from socket; err = {:?}", e);
                        return;
                    }
                };
                
                request.push_str(std::str::from_utf8(&buffer[..n]).unwrap_or(""));
                
                // Check if we've received the full request
                if request.contains("\r\n\r\n") {
                    break;
                }
            }
            
            // Parse the request
            let response = if request.starts_with("GET /health") {
                let response = HealthResponse {
                    status: "healthy".to_string(),
                    service: "face-detection-service".to_string(),
                    version: "1.0.0".to_string(),
                };
                format!("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{}", serde_json::to_string(&response).unwrap())
            } else if request.starts_with("POST /detect") {
                println!("Received face detection request");
                
                // Simulate face detection with random results
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
                
                let response = FaceDetectionResponse { faces };
                format!("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{}", serde_json::to_string(&response).unwrap())
            } else {
                "HTTP/1.1 404 NOT FOUND\r\n\r\n".to_string()
            };
            
            // Send the response
            if let Err(e) = socket.write_all(response.as_bytes()).await {
                eprintln!("failed to write to socket; err = {:?}", e);
            }
        });
    }
}