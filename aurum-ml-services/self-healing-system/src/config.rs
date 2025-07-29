use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub llm: LLMConfig,
    pub static_analysis: StaticAnalysisConfig,
    pub validation: ValidationConfig,
    pub git: GitConfig,
    pub database_url: String,
    pub monitoring: MonitoringConfig,
    pub security: SecurityConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub workers: usize,
    pub timeout: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMConfig {
    pub openai: OpenAIConfig,
    pub anthropic: AnthropicConfig,
    pub local: LocalModelConfig,
    pub default_model: String,
    pub max_tokens: u32,
    pub temperature: f32,
    pub timeout: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenAIConfig {
    pub api_key: String,
    pub base_url: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnthropicConfig {
    pub api_key: String,
    pub base_url: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalModelConfig {
    pub enabled: bool,
    pub endpoint: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StaticAnalysisConfig {
    pub rust_edition: String,
    pub target_features: Vec<String>,
    pub ignore_patterns: Vec<String>,
    pub max_file_size: usize,
    pub timeout: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationConfig {
    pub test_command: String,
    pub build_command: String,
    pub docker_image: String,
    pub timeout: u64,
    pub max_retries: u32,
    pub rollback_on_failure: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitConfig {
    pub author_name: String,
    pub author_email: String,
    pub commit_message_template: String,
    pub branch_prefix: String,
    pub push_remote: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringConfig {
    pub metrics_port: u16,
    pub log_level: String,
    pub alert_webhook: Option<String>,
    pub health_check_interval: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    pub enable_security_scan: bool,
    pub vulnerability_db_url: Option<String>,
    pub max_patch_size: usize,
    pub require_review: bool,
    pub allowed_patterns: Vec<String>,
    pub blocked_patterns: Vec<String>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "0.0.0.0".to_string(),
                port: 8080,
                workers: 4,
                timeout: 300,
            },
            llm: LLMConfig {
                openai: OpenAIConfig {
                    api_key: "".to_string(),
                    base_url: "https://api.openai.com/v1".to_string(),
                    model: "gpt-4".to_string(),
                },
                anthropic: AnthropicConfig {
                    api_key: "".to_string(),
                    base_url: "https://api.anthropic.com".to_string(),
                    model: "claude-3-5-sonnet-20241022".to_string(),
                },
                local: LocalModelConfig {
                    enabled: false,
                    endpoint: "http://localhost:11434".to_string(),
                    model: "codellama".to_string(),
                },
                default_model: "gpt-4".to_string(),
                max_tokens: 4000,
                temperature: 0.1,
                timeout: 60,
            },
            static_analysis: StaticAnalysisConfig {
                rust_edition: "2021".to_string(),
                target_features: vec!["edition2024".to_string()],
                ignore_patterns: vec![
                    "target/".to_string(),
                    ".git/".to_string(),
                    "node_modules/".to_string(),
                ],
                max_file_size: 1024 * 1024, // 1MB
                timeout: 30,
            },
            validation: ValidationConfig {
                test_command: "cargo test".to_string(),
                build_command: "cargo build".to_string(),
                docker_image: "rust:1.75".to_string(),
                timeout: 300,
                max_retries: 3,
                rollback_on_failure: true,
            },
            git: GitConfig {
                author_name: "Self-Healing Bot".to_string(),
                author_email: "bot@aurum-circle.com".to_string(),
                commit_message_template: "fix: {description}".to_string(),
                branch_prefix: "self-healing".to_string(),
                push_remote: "origin".to_string(),
            },
            database_url: "sqlite:self_healing.db".to_string(),
            monitoring: MonitoringConfig {
                metrics_port: 9090,
                log_level: "info".to_string(),
                alert_webhook: None,
                health_check_interval: 30,
            },
            security: SecurityConfig {
                enable_security_scan: true,
                vulnerability_db_url: None,
                max_patch_size: 10000,
                require_review: false,
                allowed_patterns: vec![
                    r"^use\s+".to_string(),
                    r"^fn\s+".to_string(),
                    r"^struct\s+".to_string(),
                    r"^impl\s+".to_string(),
                ],
                blocked_patterns: vec![
                    r"unsafe\s*\{".to_string(),
                    r"std::process::Command".to_string(),
                    r"std::fs::remove".to_string(),
                ],
            },
        }
    }
}

impl Config {
    pub async fn load(path: &str) -> Result<Self, config::ConfigError> {
        let settings = config::Config::builder()
            .add_source(config::File::with_name(path).required(false))
            .add_source(config::Environment::with_prefix("SELF_HEALING"))
            .set_default("database_url", "sqlite:self_healing.db")?
            .build()?;
        
        settings.try_deserialize()
    }

    pub fn get_llm_config(&self, model: Option<&str>) -> &LLMConfig {
        match model {
            Some("openai") => &self.llm,
            Some("anthropic") => &self.llm,
            Some("local") => &self.llm,
            _ => &self.llm,
        }
    }

    pub fn get_model_name(&self, model: Option<&str>) -> String {
        model.unwrap_or(&self.llm.default_model).to_string()
    }
}