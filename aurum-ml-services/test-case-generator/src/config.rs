use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub database: DatabaseConfig,
    pub repository: RepositoryConfig,
    pub analyzer: AnalyzerConfig,
    pub generator: GeneratorConfig,
    pub executor: ExecutorConfig,
    pub notifications: NotificationConfig,
    pub logging: LoggingConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub timeout_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepositoryConfig {
    pub base_path: PathBuf,
    pub max_size_mb: u64,
    pub retention_days: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzerConfig {
    pub max_depth: usize,
    pub timeout_seconds: u64,
    pub include_patterns: Vec<String>,
    pub exclude_patterns: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratorConfig {
    pub max_test_cases_per_failure: usize,
    pub minimization_timeout_seconds: u64,
    pub validation_timeout_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutorConfig {
    pub max_concurrent_tests: usize,
    pub timeout_seconds: u64,
    pub retry_attempts: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationConfig {
    pub webhook_url: Option<String>,
    pub slack_token: Option<String>,
    pub email_config: Option<EmailConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailConfig {
    pub smtp_server: String,
    pub smtp_port: u16,
    pub username: String,
    pub password: String,
    pub from_address: String,
    pub to_addresses: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub level: String,
    pub file_path: Option<PathBuf>,
    pub format: String,
}

impl Config {
    pub fn load(path: &str) -> Result<Self, anyhow::Error> {
        let content = std::fs::read_to_string(path)?;
        let config: Config = toml::from_str(&content)?;
        Ok(config)
    }

    pub fn default() -> Self {
        Self {
            database: DatabaseConfig {
                url: "sqlite://test_cases.db".to_string(),
                max_connections: 10,
                timeout_seconds: 30,
            },
            repository: RepositoryConfig {
                base_path: "./test_cases".into(),
                max_size_mb: 1000,
                retention_days: 90,
            },
            analyzer: AnalyzerConfig {
                max_depth: 5,
                timeout_seconds: 300,
                include_patterns: vec!["**/*.rs".to_string(), "**/*.py".to_string(), "**/*.js".to_string()],
                exclude_patterns: vec!["**/target/**".to_string(), "**/node_modules/**".to_string()],
            },
            generator: GeneratorConfig {
                max_test_cases_per_failure: 10,
                minimization_timeout_seconds: 600,
                validation_timeout_seconds: 300,
            },
            executor: ExecutorConfig {
                max_concurrent_tests: 5,
                timeout_seconds: 600,
                retry_attempts: 3,
            },
            notifications: NotificationConfig {
                webhook_url: None,
                slack_token: None,
                email_config: None,
            },
            logging: LoggingConfig {
                level: "info".to_string(),
                file_path: None,
                format: "json".to_string(),
            },
        }
    }
}