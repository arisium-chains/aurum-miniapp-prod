use anyhow::{Result, Context};
use async_openai::{
    config::OpenAIConfig,
    types::{
        ChatCompletionRequestMessage, ChatCompletionRequestSystemMessage,
        ChatCompletionRequestUserMessage, CreateChatCompletionRequest, Role,
    },
    Client as OpenAIClient,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::config::{Config, LLMConfig};
use crate::static_analysis::AnalysisIssue;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMRequest {
    pub prompt: String,
    pub context: HashMap<String, String>,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMResponse {
    pub content: String,
    pub usage: UsageStats,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageStats {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

#[derive(Debug, Clone)]
pub struct LLMIntegration {
    config: Config,
    openai_client: Option<OpenAIClient<OpenAIConfig>>,
}

impl LLMIntegration {
    pub fn new(config: Config) -> Result<Self> {
        let openai_client = if !config.llm.openai.api_key.is_empty() {
            let openai_config = OpenAIConfig::new()
                .with_api_key(&config.llm.openai.api_key)
                .with_api_base(&config.llm.openai.base_url);
            Some(OpenAIClient::with_config(openai_config))
        } else {
            None
        };

        Ok(Self {
            config,
            openai_client,
        })
    }

    pub async fn generate_patch(&self, issue: &AnalysisIssue) -> Result<LLMResponse> {
        let prompt = self.build_patch_prompt(issue);
        
        let request = LLMRequest {
            prompt,
            context: self.build_context(issue),
            max_tokens: Some(self.config.llm.max_tokens),
            temperature: Some(self.config.llm.temperature),
            model: Some(self.config.llm.default_model.clone()),
        };
        
        self.send_request(request).await
    }

    pub async fn explain_issue(&self, issue: &AnalysisIssue) -> Result<LLMResponse> {
        let prompt = self.build_explanation_prompt(issue);
        
        let request = LLMRequest {
            prompt,
            context: self.build_context(issue),
            max_tokens: Some(1000),
            temperature: Some(0.3),
            model: Some(self.config.llm.default_model.clone()),
        };
        
        self.send_request(request).await
    }

    pub async fn validate_patch(&self, issue: &AnalysisIssue, patch: &str) -> Result<LLMResponse> {
        let prompt = self.build_validation_prompt(issue, patch);
        
        let request = LLMRequest {
            prompt,
            context: self.build_context(issue),
            max_tokens: Some(500),
            temperature: Some(0.1),
            model: Some(self.config.llm.default_model.clone()),
        };
        
        self.send_request(request).await
    }

    async fn send_request(&self, request: LLMRequest) -> Result<LLMResponse> {
        let model = request.model.as_deref().unwrap_or(&self.config.llm.default_model);
        
        match model {
            "gpt-4" | "gpt-3.5-turbo" => {
                self.send_openai_request(request).await
            }
            "claude-3-5-sonnet" => {
                self.send_anthropic_request(request).await
            }
            "local" => {
                self.send_local_request(request).await
            }
            _ => {
                error!("Unsupported model: {}", model);
                Err(anyhow::anyhow!("Unsupported model: {}", model))
            }
        }
    }

    async fn send_openai_request(&self, request: LLMRequest) -> Result<LLMResponse> {
        let client = self.openai_client.as_ref()
            .context("OpenAI client not configured")?;
        
        let messages = vec![
            ChatCompletionRequestMessage::System(ChatCompletionRequestSystemMessage {
                content: "You are an expert Rust developer specializing in automated code fixes and edition2024 compatibility.".to_string(),
                name: None,
            }),
            ChatCompletionRequestMessage::User(ChatCompletionRequestUserMessage {
                content: request.prompt,
                name: None,
            }),
        ];

        let req = CreateChatCompletionRequest {
            model: self.config.llm.openai.model.clone(),
            messages,
            max_tokens: request.max_tokens,
            temperature: request.temperature,
            ..Default::default()
        };

        let response = client.chat().create(req).await?;
        
        let choice = response.choices.into_iter().next()
            .context("No response from OpenAI")?;
        
        let usage = response.usage.context("No usage data")?;
        
        Ok(LLMResponse {
            content: choice.message.content,
            usage: UsageStats {
                prompt_tokens: usage.prompt_tokens,
                completion_tokens: usage.completion_tokens,
                total_tokens: usage.total_tokens,
            },
            model: response.model,
        })
    }

    async fn send_anthropic_request(&self, request: LLMRequest) -> Result<LLMResponse> {
        // Anthropic implementation would go here
        // For now, return a mock response
        Ok(LLMResponse {
            content: format!("Anthropic response for: {}", request.prompt),
            usage: UsageStats {
                prompt_tokens: 100,
                completion_tokens: 200,
                total_tokens: 300,
            },
            model: "claude-3-5-sonnet".to_string(),
        })
    }

    async fn send_local_request(&self, request: LLMRequest) -> Result<LLMResponse> {
        // Local model implementation would go here
        // For now, return a mock response
        Ok(LLMResponse {
            content: format!("Local model response for: {}", request.prompt),
            usage: UsageStats {
                prompt_tokens: 50,
                completion_tokens: 100,
                total_tokens: 150,
            },
            model: "local".to_string(),
        })
    }

    fn build_patch_prompt(&self, issue: &AnalysisIssue) -> String {
        format!(
            r#"Fix the following Rust code issue:

Issue Type: {:?}
Severity: {:?}
File: {}
Line: {}
Message: {}

Context:
{}

Please provide a complete, working patch that fixes this issue while maintaining backward compatibility and following Rust best practices. The patch should be in unified diff format and include necessary imports and type annotations.

Focus on edition2024 compatibility if applicable."#,
            issue.issue_type,
            issue.severity,
            issue.file_path,
            issue.line_number,
            issue.message,
            issue.context.get("line").unwrap_or(&"N/A".to_string())
        )
    }

    fn build_explanation_prompt(&self, issue: &AnalysisIssue) -> String {
        format!(
            r#"Explain the following Rust code issue in detail:

Issue Type: {:?}
Severity: {:?}
File: {}
Line: {}
Message: {}

Context:
{}

Please provide:
1. A clear explanation of what the issue is
2. Why it occurs
3. How it affects the codebase
4. Best practices to avoid similar issues
5. Any relevant Rust edition2024 considerations

Keep the explanation technical but accessible to intermediate Rust developers."#,
            issue.issue_type,
            issue.severity,
            issue.file_path,
            issue.line_number,
            issue.message,
            issue.context.get("line").unwrap_or(&"N/A".to_string())
        )
    }

    fn build_validation_prompt(&self, issue: &AnalysisIssue, patch: &str) -> String {
        format!(
            r#"Validate the following patch for the given issue:

Issue:
- Type: {:?}
- File: {}
- Line: {}
- Message: {}

Proposed Patch:
```
{}
```

Please analyze:
1. Does the patch correctly address the issue?
2. Are there any potential side effects?
3. Does it maintain backward compatibility?
4. Is it edition2024 compatible?
5. Are there any security concerns?
6. Does it follow Rust best practices?

Provide a detailed validation report with recommendations."#,
            issue.issue_type,
            issue.file_path,
            issue.line_number,
            issue.message,
            patch
        )
    }

    fn build_context(&self, issue: &AnalysisIssue) -> HashMap<String, String> {
        let mut context = HashMap::new();
        
        context.insert("file_path".to_string(), issue.file_path.clone());
        context.insert("line_number".to_string(), issue.line_number.to_string());
        context.insert("issue_type".to_string(), format!("{:?}", issue.issue_type));
        
        if let Some(suggestion) = &issue.suggestion {
            context.insert("suggestion".to_string(), suggestion.clone());
        }
        
        context
    }
}

// Prompt templates for different scenarios
pub struct PromptTemplates;

impl PromptTemplates {
    pub fn edition2024_migration() -> &'static str {
        r#"You are an expert Rust developer specializing in edition2024 migrations.

Task: Convert the following Rust code to be compatible with Rust edition2024.

Key changes to consider:
1. async trait methods
2. dyn keyword usage
3. macro hygiene
4. pattern matching changes
5. lifetime elision improvements
6. const generics enhancements

Provide a complete, working patch in unified diff format that:
- Maintains backward compatibility
- Uses edition2024 features where beneficial
- Includes necessary feature flags
- Updates Cargo.toml if needed
- Adds appropriate documentation

Code to migrate:
{code}

Current edition: {current_edition}
Target edition: 2024"#
    }

    pub fn security_fix() -> &'static str {
        r#"You are a security-focused Rust developer.

Task: Fix the security vulnerability in the provided code.

Security issue: {issue_type}
Severity: {severity}
Location: {file}:{line}

Requirements:
1. Eliminate the security vulnerability
2. Maintain functionality
3. Add input validation
4. Include security documentation
5. Consider using safe alternatives

Provide a complete patch in unified diff format.

Vulnerable code:
{code}

Context:
{context}"#
    }

    pub fn performance_optimization() -> &'static str {
        r#"You are a performance optimization expert for Rust.

Task: Optimize the following code for better performance.

Issue: {issue}
Current performance: {metrics}

Optimization goals:
1. Reduce time complexity
2. Minimize memory allocations
3. Improve cache locality
4. Leverage Rust's zero-cost abstractions
5. Consider parallelization opportunities

Provide an optimized version with:
- Performance improvements
- Benchmark results
- Memory usage analysis
- Complete patch in unified diff format

Code to optimize:
{code}"#
    }
}

// Error handling
use thiserror::Error;
use tracing::{error, info};

#[derive(Error, Debug)]
pub enum LLMError {
    #[error("API error: {0}")]
    ApiError(String),
    
    #[error("Configuration error: {0}")]
    ConfigError(String),
    
    #[error("Rate limit exceeded")]
    RateLimit,
    
    #[error("Invalid response format")]
    InvalidResponse,
}

// Rate limiting
#[derive(Debug, Clone)]
pub struct RateLimiter {
    requests_per_minute: u32,
    current_requests: std::sync::Arc<std::sync::atomic::AtomicU32>,
}

impl RateLimiter {
    pub fn new(requests_per_minute: u32) -> Self {
        Self {
            requests_per_minute,
            current_requests: std::sync::Arc::new(std::sync::atomic::AtomicU32::new(0)),
        }
    }

    pub async fn check_rate_limit(&self) -> Result<(), LLMError> {
        let current = self.current_requests.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        
        if current >= self.requests_per_minute {
            return Err(LLMError::RateLimit);
        }
        
        // Reset counter every minute
        tokio::spawn({
            let counter = self.current_requests.clone();
            async move {
                tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
                counter.store(0, std::sync::atomic::Ordering::SeqCst);
            }
        });
        
        Ok(())
    }
}