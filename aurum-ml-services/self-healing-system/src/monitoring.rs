use prometheus::{Counter, Gauge, Histogram, Registry, TextEncoder};
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub issues_detected: u64,
    pub patches_generated: u64,
    pub patches_applied: u64,
    pub patches_failed: u64,
    pub build_failures: u64,
    pub build_successes: u64,
    pub llm_requests: u64,
    pub llm_errors: u64,
    pub validation_runs: u64,
    pub validation_failures: u64,
    pub security_alerts: u64,
    pub performance_regressions: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alert {
    pub id: String,
    pub severity: AlertSeverity,
    pub message: String,
    pub timestamp: DateTime<Utc>,
    pub source: String,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AlertSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

pub struct MetricsCollector {
    registry: Registry,
    issues_detected: Counter,
    patches_generated: Counter,
    patches_applied: Counter,
    patches_failed: Counter,
    build_failures: Counter,
    build_successes: Counter,
    llm_requests: Counter,
    llm_errors: Counter,
    validation_runs: Counter,
    validation_failures: Counter,
    security_alerts: Counter,
    performance_regressions: Counter,
    
    active_issues: Gauge,
    pending_patches: Gauge,
    validation_queue_size: Gauge,
    
    issue_detection_duration: Histogram,
    patch_generation_duration: Histogram,
    validation_duration: Histogram,
    build_duration: Histogram,
}

impl MetricsCollector {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let registry = Registry::new();
        
        // Counters
        let issues_detected = Counter::new("issues_detected_total", "Total number of issues detected")?;
        let patches_generated = Counter::new("patches_generated_total", "Total number of patches generated")?;
        let patches_applied = Counter::new("patches_applied_total", "Total number of patches successfully applied")?;
        let patches_failed = Counter::new("patches_failed_total", "Total number of patches that failed")?;
        let build_failures = Counter::new("build_failures_total", "Total number of build failures")?;
        let build_successes = Counter::new("build_successes_total", "Total number of successful builds")?;
        let llm_requests = Counter::new("llm_requests_total", "Total number of LLM API requests")?;
        let llm_errors = Counter::new("llm_errors_total", "Total number of LLM API errors")?;
        let validation_runs = Counter::new("validation_runs_total", "Total number of validation runs")?;
        let validation_failures = Counter::new("validation_failures_total", "Total number of validation failures")?;
        let security_alerts = Counter::new("security_alerts_total", "Total number of security alerts")?;
        let performance_regressions = Counter::new("performance_regressions_total", "Total number of performance regressions")?;
        
        // Gauges
        let active_issues = Gauge::new("active_issues", "Number of active issues")?;
        let pending_patches = Gauge::new("pending_patches", "Number of pending patches")?;
        let validation_queue_size = Gauge::new("validation_queue_size", "Size of the validation queue")?;
        
        // Histograms
        let issue_detection_duration = Histogram::with_opts(
            prometheus::HistogramOpts::new("issue_detection_duration_seconds", "Time spent detecting issues")
                .buckets(vec![0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0])
        )?;
        
        let patch_generation_duration = Histogram::with_opts(
            prometheus::HistogramOpts::new("patch_generation_duration_seconds", "Time spent generating patches")
                .buckets(vec![1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0])
        )?;
        
        let validation_duration = Histogram::with_opts(
            prometheus::HistogramOpts::new("validation_duration_seconds", "Time spent validating patches")
                .buckets(vec![5.0, 10.0, 30.0, 60.0, 120.0, 300.0, 600.0])
        )?;
        
        let build_duration = Histogram::with_opts(
            prometheus::HistogramOpts::new("build_duration_seconds", "Time spent building")
                .buckets(vec![30.0, 60.0, 120.0, 300.0, 600.0, 900.0, 1800.0])
        )?;
        
        // Register all metrics
        registry.register(Box::new(issues_detected.clone()))?;
        registry.register(Box::new(patches_generated.clone()))?;
        registry.register(Box::new(patches_applied.clone()))?;
        registry.register(Box::new(patches_failed.clone()))?;
        registry.register(Box::new(build_failures.clone()))?;
        registry.register(Box::new(build_successes.clone()))?;
        registry.register(Box::new(llm_requests.clone()))?;
        registry.register(Box::new(llm_errors.clone()))?;
        registry.register(Box::new(validation_runs.clone()))?;
        registry.register(Box::new(validation_failures.clone()))?;
        registry.register(Box::new(security_alerts.clone()))?;
        registry.register(Box::new(performance_regressions.clone()))?;
        
        registry.register(Box::new(active_issues.clone()))?;
        registry.register(Box::new(pending_patches.clone()))?;
        registry.register(Box::new(validation_queue_size.clone()))?;
        
        registry.register(Box::new(issue_detection_duration.clone()))?;
        registry.register(Box::new(patch_generation_duration.clone()))?;
        registry.register(Box::new(validation_duration.clone()))?;
        registry.register(Box::new(build_duration.clone()))?;
        
        Ok(Self {
            registry,
            issues_detected,
            patches_generated,
            patches_applied,
            patches_failed,
            build_failures,
            build_successes,
            llm_requests,
            llm_errors,
            validation_runs,
            validation_failures,
            security_alerts,
            performance_regressions,
            active_issues,
            pending_patches,
            validation_queue_size,
            issue_detection_duration,
            patch_generation_duration,
            validation_duration,
            build_duration,
        })
    }
    
    pub fn export_metrics(&self) -> Result<String, Box<dyn std::error::Error>> {
        let encoder = TextEncoder::new();
        let metric_families = self.registry.gather();
        let mut buffer = Vec::new();
        encoder.encode(&metric_families, &mut buffer)?;
        Ok(String::from_utf8(buffer)?)
    }
    
    pub fn increment_issues_detected(&self) {
        self.issues_detected.inc();
    }
    
    pub fn increment_patches_generated(&self) {
        self.patches_generated.inc();
    }
    
    pub fn increment_patches_applied(&self) {
        self.patches_applied.inc();
    }
    
    pub fn increment_patches_failed(&self) {
        self.patches_failed.inc();
    }
    
    pub fn increment_build_failures(&self) {
        self.build_failures.inc();
    }
    
    pub fn increment_build_successes(&self) {
        self.build_successes.inc();
    }
    
    pub fn increment_llm_requests(&self) {
        self.llm_requests.inc();
    }
    
    pub fn increment_llm_errors(&self) {
        self.llm_errors.inc();
    }
    
    pub fn increment_validation_runs(&self) {
        self.validation_runs.inc();
    }
    
    pub fn increment_validation_failures(&self) {
        self.validation_failures.inc();
    }
    
    pub fn increment_security_alerts(&self) {
        self.security_alerts.inc();
    }
    
    pub fn increment_performance_regressions(&self) {
        self.performance_regressions.inc();
    }
    
    pub fn set_active_issues(&self, count: f64) {
        self.active_issues.set(count);
    }
    
    pub fn set_pending_patches(&self, count: f64) {
        self.pending_patches.set(count);
    }
    
    pub fn set_validation_queue_size(&self, size: f64) {
        self.validation_queue_size.set(size);
    }
    
    pub fn start_issue_detection_timer(&self) -> prometheus::HistogramTimer {
        self.issue_detection_duration.start_timer()
    }
    
    pub fn start_patch_generation_timer(&self) -> prometheus::HistogramTimer {
        self.patch_generation_duration.start_timer()
    }
    
    pub fn start_validation_timer(&self) -> prometheus::HistogramTimer {
        self.validation_duration.start_timer()
    }
    
    pub fn start_build_timer(&self) -> prometheus::HistogramTimer {
        self.build_duration.start_timer()
    }
}

pub struct AlertManager {
    alerts: Arc<RwLock<Vec<Alert>>>,
    webhook_url: Option<String>,
    email_config: Option<EmailConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailConfig {
    pub smtp_server: String,
    pub smtp_port: u16,
    pub username: String,
    pub password: String,
    pub from_email: String,
    pub to_emails: Vec<String>,
}

impl AlertManager {
    pub fn new(webhook_url: Option<String>, email_config: Option<EmailConfig>) -> Self {
        Self {
            alerts: Arc::new(RwLock::new(Vec::new())),
            webhook_url,
            email_config,
        }
    }
    
    pub async fn create_alert(
        &self,
        severity: AlertSeverity,
        message: String,
        source: String,
        metadata: HashMap<String, String>,
    ) -> String {
        let alert = Alert {
            id: uuid::Uuid::new_v4().to_string(),
            severity: severity.clone(),
            message: message.clone(),
            timestamp: Utc::now(),
            source,
            metadata,
        };
        
        {
            let mut alerts = self.alerts.write().await;
            alerts.push(alert.clone());
            
            // Keep only last 1000 alerts
            if alerts.len() > 1000 {
                alerts.drain(0..alerts.len() - 1000);
            }
        }
        
        // Send notifications based on severity
        if matches!(severity, AlertSeverity::Error | AlertSeverity::Critical) {
            self.send_notification(&alert).await;
        }
        
        alert.id
    }
    
    pub async fn get_alerts(
        &self,
        severity_filter: Option<AlertSeverity>,
        limit: Option<usize>,
    ) -> Vec<Alert> {
        let alerts = self.alerts.read().await;
        let mut filtered: Vec<_> = alerts.iter()
            .filter(|alert| {
                if let Some(ref filter) = severity_filter {
                    &alert.severity == filter
                } else {
                    true
                }
            })
            .cloned()
            .collect();
        
        // Sort by timestamp (newest first)
        filtered.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        if let Some(limit) = limit {
            filtered.truncate(limit);
        }
        
        filtered
    }
    
    pub async fn get_alert_by_id(&self, id: &str) -> Option<Alert> {
        let alerts = self.alerts.read().await;
        alerts.iter().find(|alert| alert.id == id).cloned()
    }
    
    pub async fn get_system_health(&self) -> SystemMetrics {
        let alerts = self.alerts.read().await;
        
        // This would typically query the metrics collector
        // For now, return basic counts from alerts
        SystemMetrics {
            issues_detected: alerts.iter().filter(|a| a.source == "issue_detector").count() as u64,
            patches_generated: alerts.iter().filter(|a| a.source == "patch_generator").count() as u64,
            patches_applied: alerts.iter().filter(|a| a.message.contains("applied")).count() as u64,
            patches_failed: alerts.iter().filter(|a| a.message.contains("failed")).count() as u64,
            build_failures: alerts.iter().filter(|a| a.source == "build_monitor").count() as u64,
            build_successes: alerts.iter().filter(|a| a.message.contains("build succeeded")).count() as u64,
            llm_requests: alerts.iter().filter(|a| a.source == "llm_client").count() as u64,
            llm_errors: alerts.iter().filter(|a| a.source == "llm_client" && a.severity == AlertSeverity::Error).count() as u64,
            validation_runs: alerts.iter().filter(|a| a.source == "validator").count() as u64,
            validation_failures: alerts.iter().filter(|a| a.source == "validator" && a.severity == AlertSeverity::Error).count() as u64,
            security_alerts: alerts.iter().filter(|a| a.source == "security_scanner").count() as u64,
            performance_regressions: alerts.iter().filter(|a| a.source == "performance_monitor").count() as u64,
        }
    }
    
    async fn send_notification(&self, alert: &Alert) {
        if let Some(ref webhook_url) = self.webhook_url {
            self.send_webhook(webhook_url, alert).await;
        }
        
        if let Some(ref email_config) = self.email_config {
            self.send_email(email_config, alert).await;
        }
    }
    
    async fn send_webhook(&self, url: &str, alert: &Alert) {
        let client = reqwest::Client::new();
        let payload = serde_json::json!({
            "alert_id": alert.id,
            "severity": alert.severity,
            "message": alert.message,
            "timestamp": alert.timestamp,
            "source": alert.source,
            "metadata": alert.metadata
        });
        
        let _ = client.post(url).json(&payload).send().await;
    }
    
    async fn send_email(&self, config: &EmailConfig, alert: &Alert) {
        // This would use a proper email library like lettre
        // For now, just log the email attempt
        tracing::info!(
            "Would send email alert: {} - {} to {:?}",
            alert.severity,
            alert.message,
            config.to_emails
        );
    }
}

#[derive(Debug, Clone)]
pub struct HealthChecker {
    metrics_collector: Arc<MetricsCollector>,
    alert_manager: Arc<AlertManager>,
    check_interval: std::time::Duration,
}

impl HealthChecker {
    pub fn new(
        metrics_collector: Arc<MetricsCollector>,
        alert_manager: Arc<AlertManager>,
        check_interval: std::time::Duration,
    ) -> Self {
        Self {
            metrics_collector,
            alert_manager,
            check_interval,
        }
    }
    
    pub async fn start_health_checks(&self) {
        let mut interval = tokio::time::interval(self.check_interval);
        
        loop {
            interval.tick().await;
            self.perform_health_check().await;
        }
    }
    
    async fn perform_health_check(&self) {
        // Check for high error rates
        let metrics = self.alert_manager.get_system_health().await;
        
        // LLM error rate
        if metrics.llm_requests > 0 {
            let error_rate = metrics.llm_errors as f64 / metrics.llm_requests as f64;
            if error_rate > 0.1 {
                self.alert_manager.create_alert(
                    AlertSeverity::Warning,
                    format!("High LLM error rate: {:.2}%", error_rate * 100.0),
                    "health_checker".to_string(),
                    HashMap::from([
                        ("error_rate".to_string(), error_rate.to_string()),
                        ("requests".to_string(), metrics.llm_requests.to_string()),
                        ("errors".to_string(), metrics.llm_errors.to_string()),
                    ]),
                ).await;
            }
        }
        
        // Validation failure rate
        if metrics.validation_runs > 0 {
            let failure_rate = metrics.validation_failures as f64 / metrics.validation_runs as f64;
            if failure_rate > 0.2 {
                self.alert_manager.create_alert(
                    AlertSeverity::Warning,
                    format!("High validation failure rate: {:.2}%", failure_rate * 100.0),
                    "health_checker".to_string(),
                    HashMap::from([
                        ("failure_rate".to_string(), failure_rate.to_string()),
                        ("runs".to_string(), metrics.validation_runs.to_string()),
                        ("failures".to_string(), metrics.validation_failures.to_string()),
                    ]),
                ).await;
            }
        }
        
        // Patch failure rate
        let total_patches = metrics.patches_applied + metrics.patches_failed;
        if total_patches > 0 {
            let failure_rate = metrics.patches_failed as f64 / total_patches as f64;
            if failure_rate > 0.3 {
                self.alert_manager.create_alert(
                    AlertSeverity::Error,
                    format!("High patch failure rate: {:.2}%", failure_rate * 100.0),
                    "health_checker".to_string(),
                    HashMap::from([
                        ("failure_rate".to_string(), failure_rate.to_string()),
                        ("applied".to_string(), metrics.patches_applied.to_string()),
                        ("failed".to_string(), metrics.patches_failed.to_string()),
                    ]),
                ).await;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[tokio::test]
    async fn test_metrics_collector() {
        let collector = MetricsCollector::new().unwrap();
        
        collector.increment_issues_detected();
        collector.set_active_issues(5.0);
        
        let metrics = collector.export_metrics().unwrap();
        assert!(metrics.contains("issues_detected_total 1"));
        assert!(metrics.contains("active_issues 5"));
    }

    #[tokio::test]
    async fn test_alert_manager() {
        let alert_manager = AlertManager::new(None, None);
        
        let alert_id = alert_manager.create_alert(
            AlertSeverity::Error,
            "Test alert".to_string(),
            "test".to_string(),
            HashMap::new(),
        ).await;
        
        let alert = alert_manager.get_alert_by_id(&alert_id).await;
        assert!(alert.is_some());
        assert_eq!(alert.unwrap().message, "Test alert");
    }
}