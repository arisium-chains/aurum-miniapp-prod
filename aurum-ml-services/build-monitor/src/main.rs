use anyhow::Result;
use clap::{Parser, Subcommand};
use std::sync::Arc;
use tokio::signal;
use tracing::{info, error};
use tracing_subscriber;

use build_monitor::config::Config;
use build_monitor::monitor::BuildMonitor;
use build_monitor::notifications::NotificationManager;
use build_monitor::web::WebServer;

#[derive(Parser)]
#[command(name = "build-monitor")]
#[command(about = "A comprehensive build failure detection and rollback system")]
#[command(version = "1.0.0")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
    
    #[arg(short, long, default_value = "config.toml")]
    config: String,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the build monitor service
    Start {
        #[arg(short, long)]
        daemon: bool,
    },
    
    /// Check service status
    Status,
    
    /// Trigger manual rollback for a service
    Rollback {
        service_name: String,
        target_commit: String,
        #[arg(short, long)]
        reason: String,
    },
    
    /// Emergency rollback for a service
    EmergencyRollback {
        service_name: String,
    },
    
    /// List all monitored services
    List,
    
    /// Get build history for a service
    History {
        service_name: String,
        #[arg(short, long, default_value = "10")]
        limit: usize,
    },
    
    /// Test notification channels
    TestNotification {
        #[arg(short, long)]
        channel: String,
        #[arg(short, long)]
        message: String,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .init();
    
    let cli = Cli::parse();
    let config = Config::load(&cli.config)?;
    
    match cli.command {
        Commands::Start { daemon } => {
            start_service(config, daemon).await?;
        }
        Commands::Status => {
            check_status(config).await?;
        }
        Commands::Rollback { service_name, target_commit, reason } => {
            trigger_rollback(config, service_name, target_commit, reason).await?;
        }
        Commands::EmergencyRollback { service_name } => {
            emergency_rollback(config, service_name).await?;
        }
        Commands::List => {
            list_services(config).await?;
        }
        Commands::History { service_name, limit } => {
            show_history(config, service_name, limit).await?;
        }
        Commands::TestNotification { channel, message } => {
            test_notification(config, channel, message).await?;
        }
    }
    
    Ok(())
}

async fn start_service(config: Config, daemon: bool) -> Result<()> {
    info!("Starting build monitor service...");
    
    let notification_manager = Arc::new(NotificationManager::new(config.notifications.clone()));
    let monitor = Arc::new(BuildMonitor::new(config.clone(), notification_manager.clone()).await?);
    
    // Start monitoring in background
    let monitor_handle = {
        let monitor = monitor.clone();
        tokio::spawn(async move {
            if let Err(e) = monitor.start_monitoring().await {
                error!("Monitoring service error: {}", e);
            }
        })
    };
    
    // Start web server
    let web_server = WebServer::new(
        monitor.clone(),
        notification_manager.clone(),
        config.web.clone(),
    );
    
    let web_handle = tokio::spawn(async move {
        if let Err(e) = web_server.serve().await {
            error!("Web server error: {}", e);
        }
    });
    
    info!("Build monitor service started successfully");
    info!("Web dashboard available at http://{}:{}", config.web.host, config.web.port);
    
    if daemon {
        // Run as daemon
        info!("Running in daemon mode");
        tokio::select! {
            _ = monitor_handle => {},
            _ = web_handle => {},
            _ = signal::ctrl_c() => {
                info!("Received shutdown signal");
            }
        }
    } else {
        // Run in foreground
        info!("Running in foreground mode (Ctrl+C to stop)");
        tokio::select! {
            _ = monitor_handle => {},
            _ = web_handle => {},
            _ = signal::ctrl_c() => {
                info!("Received shutdown signal");
            }
        }
    }
    
    info!("Shutting down build monitor service...");
    Ok(())
}

async fn check_status(config: Config) -> Result<()> {
    let notification_manager = Arc::new(NotificationManager::new(config.notifications.clone()));
    let monitor = Arc::new(BuildMonitor::new(config, notification_manager).await?);
    
    let dashboard = monitor.get_dashboard_data().await?;
    
    println!("Build Monitor Status:");
    println!("===================");
    println!("Total Services: {}", dashboard.total_services);
    println!("Healthy Services: {}", dashboard.healthy_services);
    println!("Failed Services: {}", dashboard.failed_services);
    println!("Last Check: {}", dashboard.last_check);
    
    for service in dashboard.services {
        println!("\nService: {}", service.name);
        println!("  Status: {:?}", service.status);
        println!("  Last Build: {}", service.last_build);
        if let Some(commit) = &service.last_successful_commit {
            println!("  Last Successful Commit: {}", commit);
        }
    }
    
    Ok(())
}

async fn trigger_rollback(
    config: Config,
    service_name: String,
    target_commit: String,
    reason: String,
) -> Result<()> {
    let notification_manager = Arc::new(NotificationManager::new(config.notifications.clone()));
    let monitor = Arc::new(BuildMonitor::new(config, notification_manager).await?);
    
    info!("Triggering rollback for {} to commit {}", service_name, target_commit);
    
    let result = monitor.trigger_rollback(&service_name, &target_commit, &reason).await?;
    
    println!("Rollback completed successfully");
    println!("Target commit: {}", result);
    
    Ok(())
}

async fn emergency_rollback(config: Config, service_name: String) -> Result<()> {
    let notification_manager = Arc::new(NotificationManager::new(config.notifications.clone()));
    let monitor = Arc::new(BuildMonitor::new(config, notification_manager).await?);
    
    info!("Triggering emergency rollback for {}", service_name);
    
    let result = monitor.emergency_rollback(&service_name).await?;
    
    println!("Emergency rollback completed successfully");
    println!("Rolled back to commit: {}", result);
    
    Ok(())
}

async fn list_services(config: Config) -> Result<()> {
    let notification_manager = Arc::new(NotificationManager::new(config.notifications.clone()));
    let monitor = Arc::new(BuildMonitor::new(config, notification_manager).await?);
    
    let services = monitor.list_services().await?;
    
    println!("Monitored Services:");
    println!("==================");
    
    for service in services {
        println!("- {} ({:?})", service.name, service.status);
    }
    
    Ok(())
}

async fn show_history(config: Config, service_name: String, limit: usize) -> Result<()> {
    let notification_manager = Arc::new(NotificationManager::new(config.notifications.clone()));
    let monitor = Arc::new(BuildMonitor::new(config, notification_manager).await?);
    
    let history = monitor.get_build_history(&service_name, limit, 0).await?;
    
    println!("Build History for {}:", service_name);
    println!("========================");
    
    for build in history {
        println!("Commit: {}", build.commit_hash);
        println!("Status: {:?}", build.status);
        println!("Timestamp: {}", build.timestamp);
        println!("Duration: {}s", build.duration_seconds);
        if let Some(error) = &build.error_message {
            println!("Error: {}", error);
        }
        println!("---");
    }
    
    Ok(())
}

async fn test_notification(config: Config, channel: String, message: String) -> Result<()> {
    let notification_manager = NotificationManager::new(config.notifications);
    
    info!("Testing notification to channel: {}", channel);
    
    match channel.as_str() {
        "slack" => {
            notification_manager.send_slack_notification(&message).await?;
            println!("Slack notification sent successfully");
        }
        "discord" => {
            notification_manager.send_discord_notification(&message).await?;
            println!("Discord notification sent successfully");
        }
        "email" => {
            notification_manager.send_email_notification(&message).await?;
            println!("Email notification sent successfully");
        }
        _ => {
            anyhow::bail!("Unsupported channel: {}. Use 'slack', 'discord', or 'email'", channel);
        }
    }
    
    Ok(())
}