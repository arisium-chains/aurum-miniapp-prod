use anyhow::{Result, Context};
use std::collections::HashMap;
use std::path::Path;
use std::fs;
use std::process::Command;
use regex::Regex;
use serde::{Deserialize, Serialize};

use crate::config::Config;
use crate::static_analysis::AnalysisIssue;
use crate::llm_integration::{LLMIntegration, LLMResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedPatch {
    pub id: String,
    pub issue_id: String,
    pub original_code: String,
    pub patched_code: String,
    pub diff: String,
    pub explanation: String,
    pub confidence: f32,
    pub safety_score: f32,
    pub breaking_changes: Vec<String>,
    pub dependencies: Vec<String>,
    pub validation_status: ValidationStatus,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ValidationStatus {
    Pending,
    Validating,
    Valid,
    Invalid,
    Rejected,
}

#[derive(Debug, Clone)]
pub struct PatchGenerator {
    config: Config,
    llm_integration: LLMIntegration,
    safety_patterns: Vec<Regex>,
}

impl PatchGenerator {
    pub fn new(config: Config) -> Result<Self> {
        let llm_integration = LLMIntegration::new(config.clone())?;
        
        // Compile safety patterns
        let safety_patterns = vec![
            Regex::new(r#"unsafe\s*\{"#).unwrap(),
            Regex::new(r#"transmute\s*\("#).unwrap(),
            Regex::new(r#"mem::uninitialized"#).unwrap(),
            Regex::new(r#"ptr::read"#).unwrap(),
            Regex::new(r#"ptr::write"#).unwrap(),
            Regex::new(r#"std::process::Command"#).unwrap(),
            Regex::new(r#"std::fs::"#).unwrap(),
        ];

        Ok(Self {
            config,
            llm_integration,
            safety_patterns,
        })
    }

    pub async fn generate_patch(&self, issue: &AnalysisIssue) -> Result<GeneratedPatch> {
        info!("Generating patch for issue: {}", issue.id);
        
        // Get original code
        let original_code = self.get_original_code(issue)?;
        
        // Generate patch using LLM
        let llm_response = self.llm_integration.generate_patch(issue).await?;
        
        // Parse and validate the response
        let patch = self.parse_llm_response(&llm_response, issue, &original_code)?;
        
        // Perform safety analysis
        let safety_score = self.analyze_safety(&patch.patched_code)?;
        
        // Check for breaking changes
        let breaking_changes = self.identify_breaking_changes(&original_code, &patch.patched_code)?;
        
        // Analyze dependencies
        let dependencies = self.analyze_dependencies(&patch.patched_code)?;
        
        let generated_patch = GeneratedPatch {
            id: uuid::Uuid::new_v4().to_string(),
            issue_id: issue.id.clone(),
            original_code,
            patched_code: patch.patched_code,
            diff: patch.diff,
            explanation: patch.explanation,
            confidence: patch.confidence,
            safety_score,
            breaking_changes,
            dependencies,
            validation_status: ValidationStatus::Pending,
            created_at: chrono::Utc::now(),
        };
        
        info!("Generated patch {} for issue {}", generated_patch.id, issue.id);
        
        Ok(generated_patch)
    }

    fn get_original_code(&self, issue: &AnalysisIssue) -> Result<String> {
        let file_path = Path::new(&issue.file_path);
        let content = fs::read_to_string(file_path)
            .with_context(|| format!("Failed to read file: {}", issue.file_path))?;
        
        // Extract the relevant code section
        let lines: Vec<&str> = content.lines().collect();
        let start_line = (issue.line_number as usize).saturating_sub(5);
        let end_line = (issue.line_number as usize + 5).min(lines.len());
        
        let relevant_lines = &lines[start_line..end_line];
        Ok(relevant_lines.join("\n"))
    }

    fn parse_llm_response(&self, response: &LLMResponse, issue: &AnalysisIssue, original: &str) -> Result<ParsedPatch> {
        let content = &response.content;
        
        // Extract diff from response
        let diff = self.extract_diff(content)?;
        
        // Apply diff to get patched code
        let patched_code = self.apply_diff(original, &diff)?;
        
        // Extract explanation
        let explanation = self.extract_explanation(content)?;
        
        // Calculate confidence based on response quality
        let confidence = self.calculate_confidence(content, &diff)?;
        
        Ok(ParsedPatch {
            patched_code,
            diff,
            explanation,
            confidence,
        })
    }

    fn extract_diff(&self, content: &str) -> Result<String> {
        // Look for unified diff format
        let diff_start = content.find("---").unwrap_or(0);
        let diff_end = content.rfind("+++").map(|i| i + 100).unwrap_or(content.len());
        
        let diff = content[diff_start..diff_end].to_string();
        
        if diff.is_empty() {
            // Try to extract code blocks
            let re = Regex::new(r"```diff\n(.*?)\n```").unwrap();
            if let Some(captures) = re.captures(content) {
                return Ok(captures[1].to_string());
            }
            
            // Try to extract patch format
            let re = Regex::new(r"```patch\n(.*?)\n```").unwrap();
            if let Some(captures) = re.captures(content) {
                return Ok(captures[1].to_string());
            }
            
            return Err(anyhow::anyhow!("No valid diff found in response"));
        }
        
        Ok(diff)
    }

    fn apply_diff(&self, original: &str, diff: &str) -> Result<String> {
        // Simple diff application - in production, use a proper diff library
        let mut result = original.to_string();
        
        // This is a simplified implementation
        // In production, use the `diff` crate or similar
        
        // For now, return the diff as-is (this needs proper implementation)
        Ok(diff.to_string())
    }

    fn extract_explanation(&self, content: &str) -> Result<String> {
        // Look for explanation sections
        let re = Regex::new(r"(?i)(?:explanation|description|summary):\s*(.*?)(?:\n\n|$)").unwrap();
        
        if let Some(captures) = re.captures(content) {
            Ok(captures[1].trim().to_string())
        } else {
            Ok("No explanation provided".to_string())
        }
    }

    fn calculate_confidence(&self, content: &str, diff: &str) -> Result<f32> {
        let mut score = 0.5; // Base score
        
        // Check for confidence indicators
        if content.contains("confident") || content.contains("certain") {
            score += 0.2;
        }
        
        if content.contains("tested") || content.contains("verified") {
            score += 0.15;
        }
        
        // Check diff quality
        if diff.contains("+++") && diff.contains("---") {
            score += 0.1;
        }
        
        // Check for comprehensive changes
        if diff.lines().count() > 5 {
            score += 0.05;
        }
        
        Ok(score.min(1.0))
    }

    fn analyze_safety(&self, code: &str) -> Result<f32> {
        let mut safety_score = 1.0;
        
        for pattern in &self.safety_patterns {
            if pattern.is_match(code) {
                safety_score -= 0.2;
            }
        }
        
        // Check for proper error handling
        if !code.contains("Result") && !code.contains("Option") {
            safety_score -= 0.1;
        }
        
        // Check for unsafe blocks
        if code.contains("unsafe") {
            safety_score -= 0.3;
        }
        
        Ok(safety_score.max(0.0))
    }

    fn identify_breaking_changes(&self, original: &str, patched: &str) -> Result<Vec<String>> {
        let mut changes = Vec::new();
        
        // Check for public API changes
        let original_pub_fns = self.extract_public_functions(original);
        let patched_pub_fns = self.extract_public_functions(patched);
        
        for fn_name in original_pub_fns {
            if !patched_pub_fns.contains(&fn_name) {
                changes.push(format!("Removed public function: {}", fn_name));
            }
        }
        
        // Check for signature changes
        // This is a simplified check - in production, use proper AST analysis
        
        Ok(changes)
    }

    fn extract_public_functions(&self, code: &str) -> Vec<String> {
        let re = Regex::new(r"pub\s+(?:async\s+)?fn\s+(\w+)").unwrap();
        re.captures_iter(code)
            .map(|cap| cap[1].to_string())
            .collect()
    }

    fn analyze_dependencies(&self, code: &str) -> Result<Vec<String>> {
        let mut deps = Vec::new();
        
        // Look for use statements
        let re = Regex::new(r"use\s+([\w:]+)").unwrap();
        for cap in re.captures_iter(code) {
            deps.push(cap[1].to_string());
        }
        
        // Look for external crate usage
        let re = Regex::new(r"(\w+)::").unwrap();
        for cap in re.captures_iter(code) {
            let crate_name = &cap[1];
            if !deps.contains(&crate_name.to_string()) {
                deps.push(crate_name.to_string());
            }
        }
        
        Ok(deps)
    }

    pub async fn generate_multiple_patches(&self, issue: &AnalysisIssue, count: usize) -> Result<Vec<GeneratedPatch>> {
        let mut patches = Vec::new();
        
        for i in 0..count {
            info!("Generating patch variant {}/{}", i + 1, count);
            
            let patch = self.generate_patch(issue).await?;
            patches.push(patch);
            
            // Small delay to avoid rate limiting
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }
        
        // Sort by confidence and safety score
        patches.sort_by(|a, b| {
            let score_a = a.confidence * a.safety_score;
            let score_b = b.confidence * b.safety_score;
            score_b.partial_cmp(&score_a).unwrap()
        });
        
        Ok(patches)
    }

    pub fn format_patch_for_review(&self, patch: &GeneratedPatch) -> String {
        format!(
            r#"Patch ID: {}
Issue ID: {}
Confidence: {:.2}%
Safety Score: {:.2}%

Original Code:
```
{}
```

Patched Code:
```
{}
```

Diff:
```diff
{}
```

Explanation:
{}

Breaking Changes:
{}

Dependencies:
{}
"#,
            patch.id,
            patch.issue_id,
            patch.confidence * 100.0,
            patch.safety_score * 100.0,
            patch.original_code,
            patch.patched_code,
            patch.diff,
            patch.explanation,
            patch.breaking_changes.join(", "),
            patch.dependencies.join(", ")
        )
    }
}

#[derive(Debug, Clone)]
struct ParsedPatch {
    patched_code: String,
    diff: String,
    explanation: String,
    confidence: f32,
}

// Patch templates for common issues
pub struct PatchTemplates;

impl PatchTemplates {
    pub fn edition2024_async_trait() -> &'static str {
        r#"// Before (edition2021)
trait AsyncService {
    async fn process(&self) -> Result<(), Error>;
}

// After (edition2024)
trait AsyncService {
    async fn process(&self) -> impl Future<Output = Result<(), Error>> + Send;
}"#
    }

    pub fn edition2024_dyn_dispatch() -> &'static str {
        r#"// Before
fn handle_service(service: &impl Service) {
    service.process();
}

// After
fn handle_service(service: &dyn Service) {
    service.process();
}"#
    }

    pub fn security_input_validation() -> &'static str {
        r#"// Add input validation
fn process_user_input(input: &str) -> Result<String, Error> {
    if input.len() > MAX_INPUT_LENGTH {
        return Err(Error::InputTooLong);
    }
    
    if !input.chars().all(|c| c.is_alphanumeric() || c.is_whitespace()) {
        return Err(Error::InvalidCharacters);
    }
    
    Ok(input.trim().to_string())
}"#
    }

    pub fn performance_vec_capacity() -> &'static str {
        r#"// Optimize vector allocation
// Before
let mut items = Vec::new();
for item in data {
    items.push(item);
}

// After
let mut items = Vec::with_capacity(data.len());
for item in data {
    items.push(item);
}"#
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::static_analysis::{IssueType, Severity};

    #[tokio::test]
    async fn test_generate_patch() {
        let config = Config::default();
        let generator = PatchGenerator::new(config).unwrap();
        
        let issue = AnalysisIssue {
            id: "test-1".to_string(),
            issue_type: IssueType::Edition2024Compatibility,
            severity: Severity::High,
            file_path: "src/main.rs".to_string(),
            line_number: 10,
            message: "async trait methods need edition2024 syntax".to_string(),
            suggestion: Some("Use impl Future syntax".to_string()),
            context: HashMap::new(),
        };
        
        let patch = generator.generate_patch(&issue).await;
        assert!(patch.is_ok());
    }

    #[test]
    fn test_analyze_safety() {
        let config = Config::default();
        let generator = PatchGenerator::new(config).unwrap();
        
        let safe_code = r#"
            fn safe_function(x: i32) -> i32 {
                x + 1
            }
        "#;
        
        let unsafe_code = r#"
            unsafe {
                let ptr = std::ptr::null();
                *ptr
            }
        "#;
        
        let safe_score = generator.analyze_safety(safe_code).unwrap();
        let unsafe_score = generator.analyze_safety(unsafe_code).unwrap();
        
        assert!(safe_score > unsafe_score);
    }
}