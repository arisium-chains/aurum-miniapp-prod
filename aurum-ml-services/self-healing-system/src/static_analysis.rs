use anyhow::{Result, Context};
use syn::{parse_file, visit::Visit, visit_mut::VisitMut, File, Item, ItemFn, ItemStruct, ItemImpl};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use regex::Regex;

use crate::config::Config;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisIssue {
    pub id: String,
    pub severity: IssueSeverity,
    pub issue_type: IssueType,
    pub file_path: String,
    pub line_number: u32,
    pub column_number: u32,
    pub message: String,
    pub suggestion: Option<String>,
    pub context: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IssueSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IssueType {
    Edition2024Compatibility,
    DeprecatedUsage,
    UnsafeCode,
    Performance,
    Security,
    Style,
    Complexity,
}

#[derive(Debug, Clone)]
pub struct StaticAnalyzer {
    config: Config,
    edition2024_visitor: Edition2024CompatibilityVisitor,
}

#[derive(Debug, Clone)]
struct Edition2024CompatibilityVisitor {
    issues: Vec<AnalysisIssue>,
    current_file: String,
}

impl StaticAnalyzer {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            edition2024_visitor: Edition2024CompatibilityVisitor::new(),
        }
    }

    pub async fn analyze_project(&mut self, project_path: &str) -> Result<Vec<AnalysisIssue>> {
        let mut all_issues = Vec::new();
        
        // Find all Rust files
        let rust_files = self.find_rust_files(project_path)?;
        
        for file_path in rust_files {
            let issues = self.analyze_file(&file_path).await?;
            all_issues.extend(issues);
        }
        
        Ok(all_issues)
    }

    async fn analyze_file(&mut self, file_path: &Path) -> Result<Vec<AnalysisIssue>> {
        let content = std::fs::read_to_string(file_path)
            .with_context(|| format!("Failed to read file: {:?}", file_path))?;
        
        let file = parse_file(&content)
            .with_context(|| format!("Failed to parse file: {:?}", file_path))?;
        
        let mut visitor = Edition2024CompatibilityVisitor::new();
        visitor.current_file = file_path.to_string_lossy().to_string();
        
        visitor.visit_file(&file);
        
        Ok(visitor.issues)
    }

    fn find_rust_files(&self, project_path: &str) -> Result<Vec<PathBuf>> {
        let mut files = Vec::new();
        
        for entry in WalkDir::new(project_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
            .filter(|e| e.path().extension().map_or(false, |ext| ext == "rs"))
        {
            files.push(entry.path().to_path_buf());
        }
        
        Ok(files)
    }
}

impl Edition2024CompatibilityVisitor {
    fn new() -> Self {
        Self {
            issues: Vec::new(),
            current_file: String::new(),
        }
    }

    fn add_issue(&mut self, issue_type: IssueType, line: u32, col: u32, message: &str, suggestion: Option<&str>) {
        let issue = AnalysisIssue {
            id: uuid::Uuid::new_v4().to_string(),
            severity: IssueSeverity::Error,
            issue_type,
            file_path: self.current_file.clone(),
            line_number: line,
            column_number: col,
            message: message.to_string(),
            suggestion: suggestion.map(|s| s.to_string()),
            context: HashMap::new(),
        };
        
        self.issues.push(issue);
    }
}

impl<'ast> Visit<'ast> for Edition2024CompatibilityVisitor {
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        // Check for edition2024 compatibility issues
        let span = node.sig.ident.span();
        let start = span.start();
        
        // Check for deprecated patterns
        let fn_name = node.sig.ident.to_string();
        if fn_name.contains("async_trait") {
            self.add_issue(
                IssueType::Edition2024Compatibility,
                start.line as u32,
                start.column as u32,
                "async_trait usage may need edition2024 compatibility check",
                Some("Consider using native async fn in trait with edition2024"),
            );
        }
        
        // Check for unsafe blocks
        if let Some(_) = node.sig.unsafety {
            self.add_issue(
                IssueType::UnsafeCode,
                start.line as u32,
                start.column as u32,
                "Unsafe function detected",
                Some("Consider safe alternatives or add safety documentation"),
            );
        }
        
        syn::visit::visit_item_fn(self, node);
    }

    fn visit_item_struct(&mut self, node: &'ast ItemStruct) {
        let span = node.ident.span();
        let start = span.start();
        
        // Check for struct patterns that might need edition2024 updates
        let struct_name = node.ident.to_string();
        if struct_name.ends_with("Error") && !struct_name.contains("Edition2024") {
            self.add_issue(
                IssueType::Edition2024Compatibility,
                start.line as u32,
                start.column as u32,
                "Error struct may need edition2024 compatibility",
                Some("Consider adding edition2024 compatibility attributes"),
            );
        }
        
        syn::visit::visit_item_struct(self, node);
    }

    fn visit_item_impl(&mut self, node: &'ast ItemImpl) {
        let span = node.impl_token.span;
        let start = span.start();
        
        // Check for impl patterns
        if let Some((_, trait_path, _)) = &node.trait_ {
            let trait_name = trait_path.segments.last().unwrap().ident.to_string();
            if trait_name == "Future" || trait_name == "AsyncRead" || trait_name == "AsyncWrite" {
                self.add_issue(
                    IssueType::Edition2024Compatibility,
                    start.line as u32,
                    start.column as u32,
                    &format!("{} implementation may need edition2024 compatibility", trait_name),
                    Some("Check async trait implementation for edition2024"),
                );
            }
        }
        
        syn::visit::visit_item_impl(self, node);
    }
}

// Additional analysis visitors
#[derive(Debug, Clone)]
pub struct SecurityVisitor {
    issues: Vec<AnalysisIssue>,
    current_file: String,
}

impl SecurityVisitor {
    pub fn new() -> Self {
        Self {
            issues: Vec::new(),
            current_file: String::new(),
        }
    }

    pub fn analyze_security(&mut self, file: &File, file_path: &str) -> Vec<AnalysisIssue> {
        self.current_file = file_path.to_string();
        self.visit_file(file);
        self.issues.clone()
    }
}

impl<'ast> Visit<'ast> for SecurityVisitor {
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let span = node.sig.ident.span();
        let start = span.start();
        
        // Check for security-sensitive patterns
        let content = node.to_token_stream().to_string();
        
        // Check for command injection
        if content.contains("Command::new") || content.contains("std::process::Command") {
            self.issues.push(AnalysisIssue {
                id: uuid::Uuid::new_v4().to_string(),
                severity: IssueSeverity::Warning,
                issue_type: IssueType::Security,
                file_path: self.current_file.clone(),
                line_number: start.line as u32,
                column_number: start.column as u32,
                message: "Potential command injection vulnerability".to_string(),
                suggestion: Some("Use parameterized commands and validate inputs".to_string()),
                context: HashMap::new(),
            });
        }
        
        // Check for file system operations
        if content.contains("std::fs::remove") || content.contains("std::fs::write") {
            self.issues.push(AnalysisIssue {
                id: uuid::Uuid::new_v4().to_string(),
                severity: IssueSeverity::Warning,
                issue_type: IssueType::Security,
                file_path: self.current_file.clone(),
                line_number: start.line as u32,
                column_number: start.column as u32,
                message: "File system operation detected".to_string(),
                suggestion: Some("Validate file paths and permissions".to_string()),
                context: HashMap::new(),
            });
        }
        
        syn::visit::visit_item_fn(self, node);
    }
}

// Performance analysis visitor
#[derive(Debug, Clone)]
pub struct PerformanceVisitor {
    issues: Vec<AnalysisIssue>,
    current_file: String,
}

impl PerformanceVisitor {
    pub fn new() -> Self {
        Self {
            issues: Vec::new(),
            current_file: String::new(),
        }
    }

    pub fn analyze_performance(&mut self, file: &File, file_path: &str) -> Vec<AnalysisIssue> {
        self.current_file = file_path.to_string();
        self.visit_file(file);
        self.issues.clone()
    }
}

impl<'ast> Visit<'ast> for PerformanceVisitor {
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let span = node.sig.ident.span();
        let start = span.start();
        
        // Check for performance patterns
        let content = node.to_token_stream().to_string();
        
        // Check for inefficient patterns
        if content.contains(".collect::<Vec<_>>()") {
            self.issues.push(AnalysisIssue {
                id: uuid::Uuid::new_v4().to_string(),
                severity: IssueSeverity::Info,
                issue_type: IssueType::Performance,
                file_path: self.current_file.clone(),
                line_number: start.line as u32,
                column_number: start.column as u32,
                message: "Inefficient collection pattern".to_string(),
                suggestion: Some("Consider using iterators more efficiently".to_string()),
                context: HashMap::new(),
            });
        }
        
        syn::visit::visit_item_fn(self, node);
    }
}

// Utility functions
pub fn extract_context_from_file(file_path: &str, line_number: u32) -> Result<HashMap<String, String>> {
    let content = std::fs::read_to_string(file_path)?;
    let lines: Vec<&str> = content.lines().collect();
    
    let mut context = HashMap::new();
    
    if line_number > 0 && line_number <= lines.len() as u32 {
        let line_idx = (line_number - 1) as usize;
        let start = line_idx.saturating_sub(2);
        let end = (line_idx + 3).min(lines.len());
        
        context.insert("before".to_string(), lines[start..line_idx].join("\n"));
        context.insert("line".to_string(), lines[line_idx].to_string());
        context.insert("after".to_string(), lines[line_idx + 1..end].join("\n"));
    }
    
    Ok(context)
}

pub fn categorize_issue(issue: &AnalysisIssue) -> String {
    match issue.issue_type {
        IssueType::Edition2024Compatibility => "edition2024".to_string(),
        IssueType::DeprecatedUsage => "deprecated".to_string(),
        IssueType::UnsafeCode => "unsafe".to_string(),
        IssueType::Performance => "performance".to_string(),
        IssueType::Security => "security".to_string(),
        IssueType::Style => "style".to_string(),
        IssueType::Complexity => "complexity".to_string(),
    }
}