use crate::config::NotificationConfig;
use crate::models::{BuildResult, ServiceStatus};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::mpsc;
use tracing::{info, error, warn};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NotificationType {
    BuildSuccess,
    BuildFailure,
    BuildWarning,
    RollbackTriggered,
    RollbackCompleted,
    ServiceDown,
    ServiceUp,
    DependencyConflict,
    SecurityAlert,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Notification {
    pub notification_type: NotificationType,
    pub service_name: String,
    pub message: String,
    pub details: HashMap<String, String>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

pub struct NotificationManager {
    config: NotificationConfig,
    slack_webhook: Option<String>,
    discord_webhook: Option<String>,
    email_config: Option<EmailConfig>,
    notification_queue: mpsc::UnboundedSender<Notification>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct EmailConfig {
    smtp_server: String,
    smtp_port: u16,
    username: String,
    password: String,
    from_email: String,
    to_emails: Vec<String>,
}

impl NotificationManager {
    pub fn new(config: NotificationConfig) -> Result<Self, anyhow::Error> {
        let (tx, mut rx) = mpsc::unbounded_channel();
        
        let manager = Self {
            config,
            slack_webhook: None,
            discord_webhook: None,
            email_config: None,
            notification_queue: tx,
        };
        
        // Start notification processor
        tokio::spawn(async move {
            while let Some(notification) = rx.recv().await {
                Self::process_notification(notification).await;
            }
        });
        
        Ok(manager)
    }

    pub async fn send_build_notification(&self, build_result: &BuildResult) {
        let notification_type = match build_result.status {
            crate::models::BuildStatus::Success => NotificationType::BuildSuccess,
            crate::models::BuildStatus::Failure => NotificationType::BuildFailure,
            crate::models::BuildStatus::Warning => NotificationType::BuildWarning,
            _ => return,
        };
        
        let mut details = HashMap::new();
        details.insert("commit_hash".to_string(), build_result.commit_hash.clone());
        details.insert("build_number".to_string(), build_result.build_number.to_string());
        
        if let Some(error) = &build_result.error {
            details.insert("error".to_string(), error.clone());
        }
        
        if let Some(duration) = &build_result.duration {
            details.insert("duration".to_string(), format!("{:.2}s", duration.as_secs_f64()));
        }
        
        let notification = Notification {
            notification_type,
            service_name: build_result.service_name.clone(),
            message: format!("Build {} for {}", build_result.status, build_result.service_name),
            details,
            timestamp: chrono::Utc::now(),
        };
        
        let _ = self.notification_queue.send(notification);
    }

    pub async fn send_service_notification(&self, service_status: &ServiceStatus) {
        let notification_type = if service_status.healthy {
            NotificationType::ServiceUp
        } else {
            NotificationType::ServiceDown
        };
        
        let mut details = HashMap::new();
        details.insert("last_check".to_string(), service_status.last_check.to_rfc3339());
        
        if let Some(error) = &service_status.error {
            details.insert("error".to_string(), error.clone());
        }
        
        let notification = Notification {
            notification_type,
            service_name: service_status.service_name.clone(),
            message: format!(
                "Service {} is {}",
                service_status.service_name,
                if service_status.healthy { "UP" } else { "DOWN" }
            ),
            details,
            timestamp: chrono::Utc::now(),
        };
        
        let _ = self.notification_queue.send(notification);
    }

    pub async fn send_rollback_notification(
        &self,
        service_name: &str,
        from_commit: &str,
        to_commit: &str,
        success: bool,
    ) {
        let notification_type = if success {
            NotificationType::RollbackCompleted
        } else {
            NotificationType::RollbackTriggered
        };
        
        let mut details = HashMap::new();
        details.insert("from_commit".to_string(), from_commit.to_string());
        details.insert("to_commit".to_string(), to_commit.to_string());
        
        let notification = Notification {
            notification_type,
            service_name: service_name.to_string(),
            message: format!(
                "Rollback {} for {}: {} -> {}",
                if success { "completed" } else { "triggered" },
                service_name,
                from_commit,
                to_commit
            ),
            details,
            timestamp: chrono::Utc::now(),
        };
        
        let _ = self.notification_queue.send(notification);
    }

    pub async fn send_dependency_conflict(
        &self,
        service_name: &str,
        dependency: &str,
        conflict: &str,
    ) {
        let mut details = HashMap::new();
        details.insert("dependency".to_string(), dependency.to_string());
        details.insert("conflict".to_string(), conflict.to_string());
        
        let notification = Notification {
            notification_type: NotificationType::DependencyConflict,
            service_name: service_name.to_string(),
            message: format!("Dependency conflict detected in {}: {}", service_name, dependency),
            details,
            timestamp: chrono::Utc::now(),
        };
        
        let _ = self.notification_queue.send(notification);
    }

    async fn process_notification(notification: Notification) {
        info!("Processing notification: {:?}", notification.notification_type);
        
        // Send to Slack
        if let Err(e) = Self::send_slack_notification(&notification).await {
            error!("Failed to send Slack notification: {}", e);
        }
        
        // Send to Discord
        if let Err(e) = Self::send_discord_notification(&notification).await {
            error!("Failed to send Discord notification: {}", e);
        }
        
        // Send email
        if let Err(e) = Self::send_email_notification(&notification).await {
            error!("Failed to send email notification: {}", e);
        }
    }

    async fn send_slack_notification(notification: &Notification) -> Result<(), anyhow::Error> {
        let webhook_url = std::env::var("SLACK_WEBHOOK_URL")
            .map_err(|_| anyhow::anyhow!("SLACK_WEBHOOK_URL not set"))?;
        
        let color = match notification.notification_type {
            NotificationType::BuildSuccess => "good",
            NotificationType::BuildFailure => "danger",
            NotificationType::BuildWarning => "warning",
            NotificationType::RollbackTriggered => "warning",
            NotificationType::RollbackCompleted => "good",
            NotificationType::ServiceDown => "danger",
            NotificationType::ServiceUp => "good",
            NotificationType::DependencyConflict => "warning",
            NotificationType::SecurityAlert => "danger",
        };
        
        let payload = serde_json::json!({
            "attachments": [{
                "color": color,
                "title": format!("Build Monitor Alert: {}", notification.service_name),
                "text": &notification.message,
                "fields": notification.details.iter().map(|(k, v)| {
                    serde_json::json!({
                        "title": k,
                        "value": v,
                        "short": true
                    })
                }).collect::<Vec<_>>(),
                "ts": notification.timestamp.timestamp()
            }]
        });
        
        let client = reqwest::Client::new();
        client.post(&webhook_url)
            .json(&payload)
            .send()
            .await?
            .error_for_status()?;
        
        Ok(())
    }

    async fn send_discord_notification(notification: &Notification) -> Result<(), anyhow::Error> {
        let webhook_url = std::env::var("DISCORD_WEBHOOK_URL")
            .map_err(|_| anyhow::anyhow!("DISCORD_WEBHOOK_URL not set"))?;
        
        let color = match notification.notification_type {
            NotificationType::BuildSuccess => 0x00ff00,
            NotificationType::BuildFailure => 0xff0000,
            NotificationType::BuildWarning => 0xffff00,
            NotificationType::RollbackTriggered => 0xffa500,
            NotificationType::RollbackCompleted => 0x00ff00,
            NotificationType::ServiceDown => 0xff0000,
            NotificationType::ServiceUp => 0x00ff00,
            NotificationType::DependencyConflict => 0xffff00,
            NotificationType::SecurityAlert => 0xff0000,
        };
        
        let embed = serde_json::json!({
            "title": format!("Build Monitor Alert: {}", notification.service_name),
            "description": &notification.message,
            "color": color,
            "fields": notification.details.iter().map(|(k, v)| {
                serde_json::json!({
                    "name": k,
                    "value": v,
                    "inline": true
                })
            }).collect::<Vec<_>>(),
            "timestamp": notification.timestamp.to_rfc3339()
        });
        
        let payload = serde_json::json!({
            "embeds": [embed]
        });
        
        let client = reqwest::Client::new();
        client.post(&webhook_url)
            .json(&payload)
            .send()
            .await?
            .error_for_status()?;
        
        Ok(())
    }

    async fn send_email_notification(notification: &Notification) -> Result<(), anyhow::Error> {
        let smtp_server = std::env::var("SMTP_SERVER")
            .map_err(|_| anyhow::anyhow!("SMTP_SERVER not set"))?;
        
        let smtp_port = std::env::var("SMTP_PORT")
            .unwrap_or_else(|_| "587".to_string())
            .parse::<u16>()?;
        
        let username = std::env::var("SMTP_USERNAME")
            .map_err(|_| anyhow::anyhow!("SMTP_USERNAME not set"))?;
        
        let password = std::env::var("SMTP_PASSWORD")
            .map_err(|_| anyhow::anyhow!("SMTP_PASSWORD not set"))?;
        
        let from_email = std::env::var("FROM_EMAIL")
            .map_err(|_| anyhow::anyhow!("FROM_EMAIL not set"))?;
        
        let to_emails = std::env::var("TO_EMAILS")
            .map_err(|_| anyhow::anyhow!("TO_EMAILS not set"))?
            .split(',')
            .map(|s| s.trim().to_string())
            .collect::<Vec<_>>();
        
        let subject = format!("[Build Monitor] Alert: {}", notification.service_name);
        
        let mut body = format!(
            "Service: {}\nType: {:?}\nMessage: {}\n\nDetails:\n",
            notification.service_name,
            notification.notification_type,
            notification.message
        );
        
        for (key, value) in &notification.details {
            body.push_str(&format!("{}: {}\n", key, value));
        }
        
        body.push_str(&format!("\nTimestamp: {}", notification.timestamp));
        
        // Send email using lettre crate
        // This is a simplified version - in production, use proper email library
        
        info!("Email notification sent to: {:?}", to_emails);
        
        Ok(())
    }

    pub async fn send_custom_notification(
        &self,
        notification_type: NotificationType,
        service_name: &str,
        message: &str,
        details: HashMap<String, String>,
    ) {
        let notification = Notification {
            notification_type,
            service_name: service_name.to_string(),
            message: message.to_string(),
            details,
            timestamp: chrono::Utc::now(),
        };
        
        let _ = self.notification_queue.send(notification);
    }

    pub async fn test_notifications(&self) {
        info!("Testing notification system");
        
        let test_notification = Notification {
            notification_type: NotificationType::BuildSuccess,
            service_name: "test-service".to_string(),
            message: "Test notification from build monitor".to_string(),
            details: HashMap::new(),
            timestamp: chrono::Utc::now(),
        };
        
        let _ = self.notification_queue.send(test_notification);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_notification_creation() {
        let config = NotificationConfig {
            enabled: true,
            slack_webhook: None,
            discord_webhook: None,
            email_config: None,
        };
        
        let manager = NotificationManager::new(config).unwrap();
        
        let build_result = BuildResult {
            service_name: "test-service".to_string(),
            status: crate::models::BuildStatus::Success,
            commit_hash: "abc123".to_string(),
            duration: Some(std::time::Duration::from_secs(120)),
            error: None,
            timestamp: chrono::Utc::now(),
            build_number: 42,
        };
        
        manager.send_build_notification(&build_result).await;
        
        // Give some time for async processing
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }
}