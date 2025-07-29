use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BuildStatus {
    Unknown,
    Pending,
    Running,
    Success,
    Failure,
    Error,
    Skipped,
    RolledBack,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildResult {
    pub service_name: String,
    pub status: BuildStatus,
    pub commit_hash: String,
    pub duration: Option<std::time::Duration>,
    pub error: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub build_number: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceStatus {
    pub name: String,
    pub last_build: Option<DateTime<Utc>>,
    pub last_success: Option<DateTime<Utc>>,
    pub consecutive_failures: u32,
    pub current_status: BuildStatus,
    pub commit_hash: Option<String>,
    pub build_duration: Option<std::time::Duration>,
    pub last_error: Option<String>,
    pub health_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitInfo {
    pub hash: String,
    pub message: String,
    pub author: String,
    pub timestamp: DateTime<Utc>,
    pub files_changed: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackInfo {
    pub service_name: String,
    pub from_commit: String,
    pub to_commit: String,
    pub reason: String,
    pub timestamp: DateTime<Utc>,
    pub success: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheck {
    pub service_name: String,
    pub status: BuildStatus,
    pub timestamp: DateTime<Utc>,
    pub response_time: std::time::Duration,
    pub details: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildHistory {
    pub service_name: String,
    pub builds: Vec<BuildResult>,
    pub total_builds: u64,
    pub successful_builds: u64,
    pub failed_builds: u64,
    pub average_build_time: std::time::Duration,
    pub success_rate: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationPayload {
    pub service_name: String,
    pub status: BuildStatus,
    pub commit_hash: String,
    pub message: String,
    pub timestamp: DateTime<Utc>,
    pub build_url: Option<String>,
    pub rollback_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookPayload {
    pub event_type: String,
    pub repository: String,
    pub branch: String,
    pub commit_hash: String,
    pub commit_message: String,
    pub author: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metrics {
    pub service_name: String,
    pub timestamp: DateTime<Utc>,
    pub build_count: u64,
    pub success_count: u64,
    pub failure_count: u64,
    pub average_build_time: f64,
    pub error_rate: f64,
    pub uptime_percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardData {
    pub services: Vec<ServiceStatus>,
    pub overall_health: f32,
    pub recent_builds: Vec<BuildResult>,
    pub metrics: HashMap<String, Metrics>,
    pub alerts: Vec<String>,
}

impl BuildResult {
    pub fn new(service_name: String, status: BuildStatus, commit_hash: String) -> Self {
        Self {
            service_name,
            status,
            commit_hash,
            duration: None,
            error: None,
            timestamp: Utc::now(),
            build_number: 0,
        }
    }

    pub fn with_duration(mut self, duration: std::time::Duration) -> Self {
        self.duration = Some(duration);
        self
    }

    pub fn with_error(mut self, error: String) -> Self {
        self.error = Some(error);
        self
    }
}

impl ServiceStatus {
    pub fn new(name: String) -> Self {
        Self {
            name,
            last_build: None,
            last_success: None,
            consecutive_failures: 0,
            current_status: BuildStatus::Unknown,
            commit_hash: None,
            build_duration: None,
            last_error: None,
            health_score: 0.0,
        }
    }

    pub fn update_health_score(&mut self) {
        let base_score = 100.0;
        let failure_penalty = self.consecutive_failures as f32 * 20.0;
        let time_since_success = self.last_success
            .map(|last| (Utc::now() - last).num_hours() as f32 * 2.0)
            .unwrap_or(0.0);
        
        self.health_score = (base_score - failure_penalty - time_since_success).max(0.0);
    }
}

impl BuildHistory {
    pub fn new(service_name: String) -> Self {
        Self {
            service_name,
            builds: Vec::new(),
            total_builds: 0,
            successful_builds: 0,
            failed_builds: 0,
            average_build_time: std::time::Duration::from_secs(0),
            success_rate: 0.0,
        }
    }

    pub fn add_build(&mut self, build: BuildResult) {
        self.builds.push(build.clone());
        self.total_builds += 1;
        
        match build.status {
            BuildStatus::Success => self.successful_builds += 1,
            BuildStatus::Failure => self.failed_builds += 1,
            _ => {}
        }
        
        // Keep only last 100 builds
        if self.builds.len() > 100 {
            self.builds.remove(0);
        }
        
        // Calculate success rate
        if self.total_builds > 0 {
            self.success_rate = self.successful_builds as f32 / self.total_builds as f32;
        }
        
        // Calculate average build time
        let total_duration: std::time::Duration = self.builds
            .iter()
            .filter_map(|b| b.duration)
            .sum();
        
        if self.total_builds > 0 {
            self.average_build_time = total_duration / self.total_builds as u32;
        }
    }
}

impl Metrics {
    pub fn new(service_name: String) -> Self {
        Self {
            service_name,
            timestamp: Utc::now(),
            build_count: 0,
            success_count: 0,
            failure_count: 0,
            average_build_time: 0.0,
            error_rate: 0.0,
            uptime_percentage: 100.0,
        }
    }

    pub fn update(&mut self, build_result: &BuildResult) {
        self.timestamp = Utc::now();
        self.build_count += 1;
        
        match build_result.status {
            BuildStatus::Success => self.success_count += 1,
            BuildStatus::Failure => self.failure_count += 1,
            _ => {}
        }
        
        if self.build_count > 0 {
            self.error_rate = self.failure_count as f64 / self.build_count as f64;
            self.uptime_percentage = 100.0 - (self.error_rate * 100.0);
            
            if let Some(duration) = build_result.duration {
                let duration_secs = duration.as_secs_f64();
                self.average_build_time = (self.average_build_time * (self.build_count - 1) as f64 + duration_secs) / self.build_count as f64;
            }
        }
    }
}

impl DashboardData {
    pub fn new() -> Self {
        Self {
            services: Vec::new(),
            overall_health: 0.0,
            recent_builds: Vec::new(),
            metrics: HashMap::new(),
            alerts: Vec::new(),
        }
    }

    pub fn update_overall_health(&mut self) {
        if self.services.is_empty() {
            self.overall_health = 0.0;
            return;
        }
        
        let total_health: f32 = self.services.iter().map(|s| s.health_score).sum();
        self.overall_health = total_health / self.services.len() as f32;
    }
}