use axum::{
    routing::{get, post},
    Router,
    response::Json,
    extract::{Path, State},
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use chrono::{DateTime, Utc};
use tracing::{info, error};

use crate::config::WebConfig;
use crate::models::{BuildResult, ServiceStatus, DashboardData};
use crate::monitor::BuildMonitor;
use crate::notifications::NotificationManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildHistoryRequest {
    pub service_name: String,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackRequest {
    pub service_name: String,
    pub target_commit: String,
    pub reason: String,
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub monitor: Arc<BuildMonitor>,
    pub notification_manager: Arc<NotificationManager>,
}

pub struct WebServer {
    router: Router,
    config: WebConfig,
}

impl WebServer {
    pub fn new(
        monitor: Arc<BuildMonitor>,
        notification_manager: Arc<NotificationManager>,
        config: WebConfig,
    ) -> Self {
        let state = AppState {
            monitor,
            notification_manager,
        };
        
        let router = Router::new()
            .route("/api/health", get(health_check))
            .route("/api/dashboard", get(get_dashboard))
            .route("/api/services", get(list_services))
            .route("/api/services/:service_name", get(get_service_status))
            .route("/api/services/:service_name/builds", get(get_build_history))
            .route("/api/services/:service_name/builds/latest", get(get_latest_build))
            .route("/api/services/:service_name/rollback", post(trigger_rollback))
            .route("/api/services/:service_name/emergency-rollback", post(emergency_rollback))
            .route("/api/webhooks/github", post(github_webhook))
            .route("/api/webhooks/gitlab", post(gitlab_webhook))
            .with_state(Arc::new(state));
        
        Self { router, config }
    }
    
    pub fn get_router(&self) -> Router {
        self.router.clone()
    }
    
    pub async fn serve(&self) -> Result<(), anyhow::Error> {
        let addr = format!("{}:{}", self.config.host, self.config.port);
        info!("Starting web server on {}", addr);
        
        let listener = tokio::net::TcpListener::bind(&addr).await?;
        axum::serve(listener, self.router.clone()).await?;
        
        Ok(())
    }
}

// API Handlers
async fn health_check() -> Json<ApiResponse<String>> {
    Json(ApiResponse {
        success: true,
        data: Some("Build Monitor API is healthy".to_string()),
        message: "OK".to_string(),
    })
}

async fn get_dashboard(State(state): State<Arc<AppState>>) -> Json<ApiResponse<DashboardData>> {
    match state.monitor.get_dashboard_data().await {
        Ok(data) => Json(ApiResponse {
            success: true,
            data: Some(data),
            message: "Dashboard data retrieved successfully".to_string(),
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            message: format!("Failed to get dashboard data: {}", e),
        }),
    }
}

async fn list_services(State(state): State<Arc<AppState>>) -> Json<ApiResponse<Vec<ServiceStatus>>> {
    match state.monitor.list_services().await {
        Ok(services) => Json(ApiResponse {
            success: true,
            data: Some(services),
            message: "Services listed successfully".to_string(),
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            message: format!("Failed to list services: {}", e),
        }),
    }
}

async fn get_service_status(
    State(state): State<Arc<AppState>>,
    Path(service_name): Path<String>,
) -> Json<ApiResponse<ServiceStatus>> {
    match state.monitor.get_service_status(&service_name).await {
        Ok(status) => Json(ApiResponse {
            success: true,
            data: Some(status),
            message: "Service status retrieved successfully".to_string(),
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            message: format!("Failed to get service status: {}", e),
        }),
    }
}

async fn get_build_history(
    State(state): State<Arc<AppState>>,
    Path(service_name): Path<String>,
) -> Json<ApiResponse<Vec<BuildResult>>> {
    match state.monitor.get_build_history(&service_name, 50, 0).await {
        Ok(history) => Json(ApiResponse {
            success: true,
            data: Some(history),
            message: "Build history retrieved successfully".to_string(),
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            message: format!("Failed to get build history: {}", e),
        }),
    }
}

async fn get_latest_build(
    State(state): State<Arc<AppState>>,
    Path(service_name): Path<String>,
) -> Json<ApiResponse<BuildResult>> {
    match state.monitor.get_latest_build(&service_name).await {
        Ok(build) => Json(ApiResponse {
            success: true,
            data: Some(build),
            message: "Latest build retrieved successfully".to_string(),
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            message: format!("Failed to get latest build: {}", e),
        }),
    }
}

async fn trigger_rollback(
    State(state): State<Arc<AppState>>,
    Path(service_name): Path<String>,
    Json(request): Json<RollbackRequest>,
) -> Json<ApiResponse<String>> {
    match state.monitor.trigger_rollback(
        &service_name,
        &request.target_commit,
        &request.reason,
    ).await {
        Ok(commit) => Json(ApiResponse {
            success: true,
            data: Some(commit),
            message: "Rollback triggered successfully".to_string(),
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            message: format!("Failed to trigger rollback: {}", e),
        }),
    }
}

async fn emergency_rollback(
    State(state): State<Arc<AppState>>,
    Path(service_name): Path<String>,
) -> Json<ApiResponse<String>> {
    match state.monitor.emergency_rollback(&service_name).await {
        Ok(commit) => Json(ApiResponse {
            success: true,
            data: Some(commit),
            message: "Emergency rollback completed successfully".to_string(),
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            message: format!("Emergency rollback failed: {}", e),
        }),
    }
}

async fn github_webhook(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<serde_json::Value>,
) -> Json<ApiResponse<String>> {
    info!("Received GitHub webhook: {:?}", payload);
    
    match state.monitor.process_github_webhook(&payload).await {
        Ok(_) => Json(ApiResponse {
            success: true,
            data: Some("Webhook processed successfully".to_string()),
            message: "OK".to_string(),
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            message: format!("Failed to process webhook: {}", e),
        }),
    }
}

async fn gitlab_webhook(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<serde_json::Value>,
) -> Json<ApiResponse<String>> {
    info!("Received GitLab webhook: {:?}", payload);
    
    match state.monitor.process_gitlab_webhook(&payload).await {
        Ok(_) => Json(ApiResponse {
            success: true,
            data: Some("Webhook processed successfully".to_string()),
            message: "OK".to_string(),
        }),
        Err(e) => Json(ApiResponse {
            success: false,
            data: None,
            message: format!("Failed to process webhook: {}", e),
        }),
    }
}