use self_healing_system::llm_integration::*;
use self_healing_system::static_analysis::{Issue, IssueType, Severity};
use std::collections::HashMap;

#[cfg(test)]
mod llm_integration_tests {
    use super::*;
    use mockall::predicate::*;
    use mockall::*;

    // Mock LLM provider for testing
    mock! {
        pub LLMProvider {
            fn generate_patch(&self, prompt: &str, context: &HashMap<String, String>) -> Result<String, String>;
            fn explain_issue(&self, issue: &Issue, context: &HashMap<String, String>) -> Result<String, String>;
            fn validate_patch(&self, patch: &str, context: &HashMap<String, String>) -> Result<ValidationResult, String>;
        }
    }

    #[test]
    fn test_prompt_template_rendering() {
        let template = PromptTemplate::new(
            "Fix the {issue_type} in function {function_name}",
            vec!["issue_type".to_string(), "function_name".to_string()]
        );
        
        let mut context = HashMap::new();
        context.insert("issue_type".to_string(), "type error".to_string());
        context.insert("function_name".to_string(), "process_data".to_string());
        
        let rendered = template.render(&context).unwrap();
        assert_eq!(rendered, "Fix the type error in function process_data");
    }

    #[test]
    fn test_prompt_template_missing_variable() {
        let template = PromptTemplate::new(
            "Fix {missing_var}",
            vec!["missing_var".to_string()]
        );
        
        let context = HashMap::new();
        let result = template.render(&context);
        assert!(result.is_err());
    }

    #[test]
    fn test_llm_provider_factory() {
        let config = LLMConfig {
            provider: "openai".to_string(),
            api_key: "test-key".to_string(),
            model: "gpt-4".to_string(),
            max_tokens: 1000,
            temperature: 0.7,
            timeout: 30,
            retry_attempts: 3,
            rate_limit: 10,
        };
        
        let provider = LLMProviderFactory::create(&config).unwrap();
        assert_eq!(provider.get_provider_name(), "openai");
    }

    #[test]
    fn test_openai_provider_request_format() {
        let provider = OpenAIProvider::new(
            "test-key".to_string(),
            "gpt-4".to_string(),
            1000,
            0.7,
            30,
            3,
            10,
        );
        
        let prompt = "Fix the type error";
        let context = HashMap::new();
        
        // This would normally make an HTTP request, but we test the format
        let request = provider.build_request(prompt, &context);
        assert!(request.contains("gpt-4"));
        assert!(request.contains("test-key"));
    }

    #[test]
    fn test_claude_provider_request_format() {
        let provider = ClaudeProvider::new(
            "test-key".to_string(),
            "claude-3-sonnet".to_string(),
            1000,
            0.7,
            30,
            3,
            10,
        );
        
        let prompt = "Explain the security issue";
        let context = HashMap::new();
        
        let request = provider.build_request(prompt, &context);
        assert!(request.contains("claude-3-sonnet"));
        assert!(request.contains("test-key"));
    }

    #[test]
    fn test_patch_generation_prompt() {
        let issue = Issue {
            file_path: "src/main.rs".to_string(),
            line_number: 42,
            column: 10,
            message: "Type mismatch: expected i32, found String".to_string(),
            severity: Severity::Error,
            issue_type: IssueType::TypeError,
            suggested_fix: None,
            context: HashMap::new(),
        };
        
        let context = HashMap::new();
        let prompt = PromptBuilder::build_patch_generation_prompt(&issue, &context);
        
        assert!(prompt.contains("Type mismatch"));
        assert!(prompt.contains("i32"));
        assert!(prompt.contains("String"));
        assert!(prompt.contains("safe fix"));
    }

    #[test]
    fn test_issue_explanation_prompt() {
        let issue = Issue {
            file_path: "src/utils.rs".to_string(),
            line_number: 15,
            column: 5,
            message: "Potential SQL injection vulnerability".to_string(),
            severity: Severity::Critical,
            issue_type: IssueType::SecurityVulnerability,
            suggested_fix: None,
            context: HashMap::new(),
        };
        
        let context = HashMap::new();
        let prompt = PromptBuilder::build_issue_explanation_prompt(&issue, &context);
        
        assert!(prompt.contains("SQL injection"));
        assert!(prompt.contains("security vulnerability"));
        assert!(prompt.contains("explain"));
    }

    #[test]
    fn test_patch_validation_prompt() {
        let patch = r#"
--- a/src/main.rs
+++ b/src/main.rs
@@ -10,7 +10,7 @@
-    let x: i32 = "hello";
+    let x: String = "hello".to_string();
"#;
        
        let context = HashMap::new();
        let prompt = PromptBuilder::build_patch_validation_prompt(patch, &context);
        
        assert!(prompt.contains("patch"));
        assert!(prompt.contains("validation"));
        assert!(prompt.contains("safe"));
    }

    #[test]
    fn test_rate_limiter() {
        let mut limiter = RateLimiter::new(2, std::time::Duration::from_secs(1));
        
        assert!(limiter.try_acquire().is_ok());
        assert!(limiter.try_acquire().is_ok());
        assert!(limiter.try_acquire().is_err());
        
        std::thread::sleep(std::time::Duration::from_secs(1));
        assert!(limiter.try_acquire().is_ok());
    }

    #[test]
    fn test_retry_mechanism() {
        let mut attempts = 0;
        let result = Retry::with_attempts(3, || {
            attempts += 1;
            if attempts < 3 {
                Err("temporary error")
            } else {
                Ok("success")
            }
        });
        
        assert_eq!(attempts, 3);
        assert_eq!(result.unwrap(), "success");
    }

    #[test]
    fn test_response_parser() {
        let response = r#"
```rust
fn fixed_function() -> i32 {
    42
}
```"#;
        
        let parsed = ResponseParser::extract_code_block(response, "rust").unwrap();
        assert!(parsed.contains("fn fixed_function"));
        assert!(!parsed.contains("```"));
    }

    #[test]
    fn test_validation_result() {
        let result = ValidationResult {
            is_safe: true,
            confidence: 0.95,
            issues: vec![],
            suggestions: vec!["Consider adding tests".to_string()],
        };
        
        assert!(result.is_safe);
        assert_eq!(result.confidence, 0.95);
        assert!(result.issues.is_empty());
        assert_eq!(result.suggestions.len(), 1);
    }

    #[test]
    fn test_error_handling() {
        let error = LLMError::RateLimitExceeded;
        assert_eq!(format!("{}", error), "Rate limit exceeded");
        
        let error = LLMError::InvalidResponse("Invalid JSON".to_string());
        assert!(format!("{}", error).contains("Invalid JSON"));
    }

    #[test]
    fn test_context_builder() {
        let mut builder = ContextBuilder::new();
        builder.add_file_context("main.rs", "fn main() { println!(\"Hello\"); }");
        builder.add_dependency_context("serde", "1.0");
        builder.add_test_context("test_main", "assert_eq!(1 + 1, 2)");
        
        let context = builder.build();
        assert!(context.contains_key("file_main.rs"));
        assert!(context.contains_key("dependency_serde"));
        assert!(context.contains_key("test_test_main"));
    }

    #[test]
    fn test_token_counter() {
        let text = "This is a test string with several words";
        let count = TokenCounter::count(text);
        assert!(count > 0);
        assert!(count <= text.len());
    }

    #[test]
    fn test_cost_calculator() {
        let config = LLMConfig {
            provider: "openai".to_string(),
            api_key: "test".to_string(),
            model: "gpt-4".to_string(),
            max_tokens: 1000,
            temperature: 0.7,
            timeout: 30,
            retry_attempts: 3,
            rate_limit: 10,
        };
        
        let cost = CostCalculator::estimate_cost(&config, 1000);
        assert!(cost > 0.0);
    }
}