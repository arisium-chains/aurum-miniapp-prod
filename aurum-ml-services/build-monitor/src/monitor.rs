use crate::config::Config;
use crate::models::{BuildStatus, BuildResult, ServiceStatus};
use crate::git::GitManager;
use crate::docker::DockerManager;
use crate::notifications::NotificationManager;
use crate::rollback::RollbackManager;
use crate::metrics::MetricsCollector;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{interval, Duration};
use tracing::{info, error, warn};

pub struct BuildMonitor {
    config: Config,
    git_manager: Arc<GitManager>,
    docker_manager: Arc<DockerManager>,
    notification_manager: Arc<NotificationManager>,
    rollback_manager: Arc<RollbackManager>,
    metrics: Arc<MetricsCollector>,
    service_status: Arc<RwLock<HashMap<String, ServiceStatus>>>,
}

impl BuildMonitor {
    pub async fn new(config: Config) -> Result<Self, anyhow::Error> {
        let git_manager = Arc::new(GitManager::new(config.git.clone()).await?);
        let docker_manager = Arc::new(DockerManager::new(config.docker.clone()).await?);
        let notification_manager = Arc::new(NotificationManager::new(config.notifications.clone()).await?);
        let rollback_manager = Arc::new(RollbackManager::new(config.rollback.clone()).await?);
        let metrics = Arc::new(MetricsCollector::new().await?);

        Ok(Self {
            config,
            git_manager,
            docker_manager,
            notification_manager,
            rollback_manager,
            metrics,
            service_status: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    pub async fn start(&self) -> Result<(), anyhow::Error> {
        info!("Starting build monitoring service...");
        
        // Initialize service status tracking
        self.initialize_services().await?;
        
        // Start monitoring loop
        let mut interval = interval(Duration::from_secs(
            self.config.services.health_check_interval
        ));
        
        loop {
            interval.tick().await;
            self.check_all_services().await;
        }
    }

    async fn initialize_services(&self) -> Result<(), anyhow::Error> {
        info!("Initializing service tracking...");
        
        let mut status = self.service_status.write().await;
        
        for (name, service) in &self.config.services.services {
            status.insert(name.clone(), ServiceStatus {
                name: name.clone(),
                last_build: None,
                last_success: None,
                consecutive_failures: 0,
                current_status: BuildStatus::Unknown,
                commit_hash: None,
                build_duration: None,
            });
        }
        
        Ok(())
    }

    async fn check_all_services(&self) {
        info!("Running health check for all services...");
        
        for (name, service) in &self.config.services.services {
            match self.check_service(name, service).await {
                Ok(result) => {
                    self.handle_build_result(name, result).await;
                }
                Err(e) => {
                    error!("Failed to check service {}: {}", name, e);
                    self.handle_build_failure(name, e).await;
                }
            }
        }
    }

    async fn check_service(&self, name: &str, service: &crate::config::Service) -> Result<BuildResult, anyhow::Error> {
        info!("Checking service: {}", name);
        
        let start_time = std::time::Instant::now();
        
        // Get latest commit
        let latest_commit = self.git_manager.get_latest_commit().await?;
        
        // Check if we need to build
        let should_build = self.should_build_service(name, &latest_commit).await?;
        
        if !should_build {
            return Ok(BuildResult {
                service_name: name.to_string(),
                status: BuildStatus::Skipped,
                commit_hash: latest_commit,
                duration: None,
                error: None,
            });
        }
        
        // Build the service
        let build_result = self.docker_manager.build_service(service).await;
        
        let duration = Some(start_time.elapsed());
        
        match build_result {
            Ok(_) => {
                Ok(BuildResult {
                    service_name: name.to_string(),
                    status: BuildStatus::Success,
                    commit_hash: latest_commit,
                    duration,
                    error: None,
                })
            }
            Err(e) => {
                Ok(BuildResult {
                    service_name: name.to_string(),
                    status: BuildStatus::Failure,
                    commit_hash: latest_commit,
                    duration,
                    error: Some(e.to_string()),
                })
            }
        }
    }

    async fn should_build_service(&self, name: &str, commit_hash: &str) -> Result<bool, anyhow::Error> {
        let status = self.service_status.read().await;
        
        if let Some(service_status) = status.get(name) {
            // Check if this commit has already been built
            if service_status.commit_hash.as_deref() == Some(commit_hash) {
                return Ok(false);
            }
            
            // Check if there are changes affecting this service
            let affected = self.git_manager.check_service_affected(name, commit_hash).await?;
            Ok(affected)
        } else {
            Ok(true)
        }
    }

    async fn handle_build_result(&self, service_name: &str, result: BuildResult) {
        let mut status = self.service_status.write().await;
        
        if let Some(service_status) = status.get_mut(service_name) {
            service_status.last_build = Some(chrono::Utc::now());
            service_status.commit_hash = Some(result.commit_hash.clone());
            service_status.build_duration = result.duration;
            
            match result.status {
                BuildStatus::Success => {
                    service_status.current_status = BuildStatus::Success;
                    service_status.last_success = Some(chrono::Utc::now());
                    service_status.consecutive_failures = 0;
                    
                    info!("Service {} built successfully", service_name);
                    self.metrics.record_success(service_name).await;
                }
                BuildStatus::Failure => {
                    service_status.current_status = BuildStatus::Failure;
                    service_status.consecutive_failures += 1;
                    
                    error!("Service {} build failed", service_name);
                    self.metrics.record_failure(service_name).await;
                    
                    // Trigger rollback if configured
                    if service_status.consecutive_failures >= 3 {
                        self.trigger_rollback(service_name, &result.commit_hash).await;
                    }
                }
                _ => {}
            }
        }
        
        // Send notifications
        self.notification_manager.send_notification(&result).await;
    }

    async fn handle_build_failure(&self, service_name: &str, error: anyhow::Error) {
        error!("Build failure for service {}: {}", service_name, error);
        
        let mut status = self.service_status.write().await;
        if let Some(service_status) = status.get_mut(service_name) {
            service_status.current_status = BuildStatus::Error;
            service_status.consecutive_failures += 1;
        }
        
        self.metrics.record_error(service_name).await;
    }

    async fn trigger_rollback(&self, service_name: &str, failed_commit: &str) {
        info!("Triggering rollback for service {} due to failures", service_name);
        
        match self.rollback_manager.rollback(service_name, failed_commit).await {
            Ok(rollback_commit) => {
                info!("Successfully rolled back service {} to commit {}", service_name, rollback_commit);
                self.notification_manager.send_rollback_notification(service_name, &rollback_commit).await;
            }
            Err(e) => {
                error!("Failed to rollback service {}: {}", service_name, e);
                self.notification_manager.send_rollback_failure_notification(service_name, &e.to_string()).await;
            }
        }
    }

    pub async fn get_service_status(&self, service_name: &str) -> Option<ServiceStatus> {
        let status = self.service_status.read().await;
        status.get(service_name).cloned()
    }

    pub async fn get_all_status(&self) -> Vec<ServiceStatus> {
        let status = self.service_status.read().await;
        status.values().cloned().collect()
    }
}