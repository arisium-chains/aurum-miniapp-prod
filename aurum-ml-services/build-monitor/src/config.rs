use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Config {
    pub server: ServerConfig,
    pub services: ServiceConfig,
    pub git: GitConfig,
    pub docker: DockerConfig,
    pub notifications: NotificationConfig,
    pub database: DatabaseConfig,
    pub rollback: RollbackConfig,
    pub cache: CacheConfig,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub workers: Option<usize>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ServiceConfig {
    pub services: HashMap<String, Service>,
    pub build_timeout: u64,
    pub health_check_interval: u64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Service {
    pub name: String,
    pub path: String,
    pub dockerfile: String,
    pub build_args: Option<HashMap<String, String>>,
    pub dependencies: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct GitConfig {
    pub repository_url: String,
    pub branch: String,
    pub webhook_secret: String,
    pub ssh_key_path: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DockerConfig {
    pub registry_url: Option<String>,
    pub registry_username: Option<String>,
    pub registry_password: Option<String>,
    pub build_args: HashMap<String, String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct NotificationConfig {
    pub slack: Option<SlackConfig>,
    pub discord: Option<DiscordConfig>,
    pub email: Option<EmailConfig>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SlackConfig {
    pub webhook_url: String,
    pub channel: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DiscordConfig {
    pub webhook_url: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct EmailConfig {
    pub smtp_server: String,
    pub smtp_port: u16,
    pub username: String,
    pub password: String,
    pub from: String,
    pub to: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RollbackConfig {
    pub max_rollback_commits: usize,
    pub safety_checks: bool,
    pub dry_run: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct CacheConfig {
    pub redis_url: String,
    pub ttl: u64,
}

impl Config {
    pub fn load(path: &str) -> Result<Self, config::ConfigError> {
        let settings = config::Config::builder()
            .add_source(config::File::with_name(path))
            .add_source(config::Environment::with_prefix("BUILD_MONITOR"))
            .build()?;
        
        settings.try_deserialize()
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "0.0.0.0".to_string(),
                port: 8080,
                workers: None,
            },
            services: ServiceConfig {
                services: HashMap::new(),
                build_timeout: 300,
                health_check_interval: 30,
            },
            git: GitConfig {
                repository_url: String::new(),
                branch: "main".to_string(),
                webhook_secret: String::new(),
                ssh_key_path: None,
            },
            docker: DockerConfig {
                registry_url: None,
                registry_username: None,
                registry_password: None,
                build_args: HashMap::new(),
            },
            notifications: NotificationConfig {
                slack: None,
                discord: None,
                email: None,
            },
            database: DatabaseConfig {
                url: "sqlite://build_monitor.db".to_string(),
                max_connections: 10,
            },
            rollback: RollbackConfig {
                max_rollback_commits: 10,
                safety_checks: true,
                dry_run: false,
            },
            cache: CacheConfig {
                redis_url: "redis://localhost:6379".to_string(),
                ttl: 3600,
            },
        }
    }
}