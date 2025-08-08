use std::path::PathBuf;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio::process::Command;
use tokio::time::{sleep, Duration};

async fn spawn_service(port: u16) -> tokio::process::Child {
    let bin = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("target/debug/face-detection-service");
    Command::new(bin)
        .env("PORT", port.to_string())
        .spawn()
        .expect("failed to spawn service")
}

#[tokio::test]
async fn health_endpoint() {
    let port = 18001;
    let mut child = spawn_service(port).await;
    sleep(Duration::from_millis(200)).await;

    let mut stream = TcpStream::connect(("127.0.0.1", port)).await.unwrap();
    stream
        .write_all(b"GET /health HTTP/1.1\r\nHost: localhost\r\n\r\n")
        .await
        .unwrap();
    let mut buf = vec![0; 1024];
    let n = stream.read(&mut buf).await.unwrap();
    let resp = String::from_utf8_lossy(&buf[..n]);
    assert!(resp.contains("\"healthy\""));

    let _ = child.kill().await;
}

#[tokio::test]
async fn detect_endpoint() {
    let port = 18002;
    let mut child = spawn_service(port).await;
    sleep(Duration::from_millis(200)).await;

    let mut stream = TcpStream::connect(("127.0.0.1", port)).await.unwrap();
    stream
        .write_all(b"POST /detect HTTP/1.1\r\nHost: localhost\r\nContent-Length: 0\r\n\r\n")
        .await
        .unwrap();
    let mut buf = vec![0; 1024];
    let n = stream.read(&mut buf).await.unwrap();
    let resp = String::from_utf8_lossy(&buf[..n]);
    assert!(resp.contains("faces"));

    let _ = child.kill().await;
}
