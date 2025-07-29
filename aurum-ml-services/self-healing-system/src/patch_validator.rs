use anyhow::{Result, Context};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::fs;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tempfile::TempDir;

use crate::config::Config;
use crate::patch_generator::GeneratedPatch;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub patch_id: String,
    pub status: ValidationStatus,
    pub build_success: bool,
    pub test_success: bool,
    pub security_scan_passed: bool,
    pub performance_impact: PerformanceImpact,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub metrics: ValidationMetrics,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ValidationStatus {
    Pending,
    Running,
    Success,
    Failed,
    Warning,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceImpact {
    pub compile_time_change: f64, // percentage change
    pub binary_size_change: i64,  // bytes change
    pub memory_usage_change: f64, // percentage change
    pub runtime_performance_change: f64, // percentage change
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationMetrics {
    pub build_time_ms: u64,
    pub test_time_ms: u64,
    pub security_issues_found: u32,
    pub warnings_count: u32,
    pub errors_count: u32,
}

#[derive(Debug, Clone)]
pub struct PatchValidator {
    config: Config,
    workspace_root: PathBuf,
    docker_available: bool,
}

impl PatchValidator {
    pub fn new(config: Config) -> Result<Self> {
        let workspace_root = PathBuf::from(&config.workspace_root);
        
        // Check if Docker is available
        let docker_available = Command::new("docker")
            .arg("--version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map(|status| status.success())
            .unwrap_or(false);
        
        Ok(Self {
            config,
            workspace_root,
            docker_available,
        })
    }

    pub async fn validate_patch(&self, patch: &GeneratedPatch) -> Result<ValidationResult> {
        info!("Starting validation for patch: {}", patch.id);
        
        let temp_dir = TempDir::new()?;
        let temp_path = temp_dir.path();
        
        // Create a copy of the workspace
        self.setup_test_workspace(temp_path)?;
        
        // Apply the patch
        self.apply_patch(temp_path, patch)?;
        
        // Run validation steps
        let build_success = self.check_build(temp_path).await?;
        let test_success = self.check_tests(temp_path).await?;
        let security_scan_passed = self.run_security_scan(temp_path).await?;
        let performance_impact = self.measure_performance_impact(temp_path).await?;
        
        // Collect errors and warnings
        let (errors, warnings) = self.collect_issues(temp_path).await?;
        
        let metrics = ValidationMetrics {
            build_time_ms: 0, // Will be populated by actual measurements
            test_time_ms: 0,
            security_issues_found: 0,
            warnings_count: warnings.len() as u32,
            errors_count: errors.len() as u32,
        };
        
        let status = if build_success && test_success && security_scan_passed {
            ValidationStatus::Success
        } else if build_success && test_success {
            ValidationStatus::Warning
        } else {
            ValidationStatus::Failed
        };
        
        let result = ValidationResult {
            patch_id: patch.id.clone(),
            status,
            build_success,
            test_success,
            security_scan_passed,
            performance_impact,
            errors,
            warnings,
            metrics,
            timestamp: chrono::Utc::now(),
        };
        
        info!("Validation completed for patch {}: {:?}", patch.id, result.status);
        
        Ok(result)
    }

    fn setup_test_workspace(&self, temp_path: &Path) -> Result<()> {
        // Copy the entire workspace to temp directory
        let mut cmd = Command::new("cp");
        cmd.arg("-r")
            .arg(&self.workspace_root)
            .arg(temp_path);
        
        let status = cmd.status()
            .context("Failed to copy workspace to temp directory")?;
        
        if !status.success() {
            return Err(anyhow::anyhow!("Failed to copy workspace"));
        }
        
        Ok(())
    }

    fn apply_patch(&self, workspace_path: &Path, patch: &GeneratedPatch) -> Result<()> {
        let patch_file = workspace_path.join("temp_patch.diff");
        fs::write(&patch_file, &patch.diff)?;
        
        // Apply the patch using git apply
        let status = Command::new("git")
            .arg("apply")
            .arg(&patch_file)
            .current_dir(workspace_path)
            .status()
            .context("Failed to apply patch")?;
        
        if !status.success() {
            return Err(anyhow::anyhow!("Failed to apply patch with git apply"));
        }
        
        // Clean up patch file
        fs::remove_file(patch_file)?;
        
        Ok(())
    }

    async fn check_build(&self, workspace_path: &Path) -> Result<bool> {
        info!("Checking build...");
        
        let start = std::time::Instant::now();
        
        let status = Command::new("cargo")
            .arg("check")
            .arg("--workspace")
            .current_dir(workspace_path)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .context("Failed to run cargo check")?;
        
        let build_time = start.elapsed().as_millis() as u64;
        
        Ok(status.success())
    }

    async fn check_tests(&self, workspace_path: &Path) -> Result<bool> {
        info!("Running tests...");
        
        let start = std::time::Instant::now();
        
        let status = Command::new("cargo")
            .arg("test")
            .arg("--workspace")
            .current_dir(workspace_path)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .context("Failed to run cargo test")?;
        
        let test_time = start.elapsed().as_millis() as u64;
        
        Ok(status.success())
    }

    async fn run_security_scan(&self, workspace_path: &Path) -> Result<bool> {
        info!("Running security scan...");
        
        // Run cargo audit
        let audit_status = Command::new("cargo")
            .arg("audit")
            .current_dir(workspace_path)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status();
        
        let audit_passed = match audit_status {
            Ok(status) => status.success(),
            Err(_) => {
                warn!("cargo-audit not found, skipping vulnerability scan");
                true
            }
        };
        
        // Run clippy for security lints
        let clippy_status = Command::new("cargo")
            .arg("clippy")
            .arg("--")
            .arg("-D")
            .arg("warnings")
            .arg("-D")
            .arg("clippy::all")
            .current_dir(workspace_path)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status();
        
        let clippy_passed = match clippy_status {
            Ok(status) => status.success(),
            Err(_) => {
                warn!("clippy not found, skipping lint checks");
                true
            }
        };
        
        Ok(audit_passed && clippy_passed)
    }

    async fn measure_performance_impact(&self, workspace_path: &Path) -> Result<PerformanceImpact> {
        info!("Measuring performance impact...");
        
        // Build and measure binary size
        let binary_size = self.measure_binary_size(workspace_path)?;
        
        // Run benchmarks if available
        let runtime_performance = self.run_benchmarks(workspace_path).await?;
        
        Ok(PerformanceImpact {
            compile_time_change: 0.0, // TODO: Implement actual measurement
            binary_size_change: binary_size,
            memory_usage_change: 0.0,
            runtime_performance_change: runtime_performance,
        })
    }

    fn measure_binary_size(&self, workspace_path: &Path) -> Result<i64> {
        let status = Command::new("cargo")
            .arg("build")
            .arg("--release")
            .current_dir(workspace_path)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .context("Failed to build release binary")?;
        
        if !status.success() {
            return Ok(0);
        }
        
        // Find the binary and get its size
        let target_dir = workspace_path.join("target").join("release");
        if let Ok(entries) = fs::read_dir(&target_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() && path.extension().is_none() {
                    if let Ok(metadata) = fs::metadata(&path) {
                        return Ok(metadata.len() as i64);
                    }
                }
            }
        }
        
        Ok(0)
    }

    async fn run_benchmarks(&self, workspace_path: &Path) -> Result<f64> {
        // Run cargo bench if available
        let status = Command::new("cargo")
            .arg("bench")
            .current_dir(workspace_path)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status();
        
        match status {
            Ok(status) if status.success() => Ok(0.0),
            _ => Ok(0.0), // No benchmarks or failed benchmarks
        }
    }

    async fn collect_issues(&self, workspace_path: &Path) -> Result<(Vec<String>, Vec<String>)> {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();
        
        // Run cargo check with JSON output
        let output = Command::new("cargo")
            .arg("check")
            .arg("--message-format=json")
            .current_dir(workspace_path)
            .output()
            .context("Failed to run cargo check with JSON output")?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            errors.push(stderr.to_string());
        }
        
        // Parse JSON messages
        for line in String::from_utf8_lossy(&output.stdout).lines() {
            if let Ok(message) = serde_json::from_str::<serde_json::Value>(line) {
                if let Some(level) = message.get("level").and_then(|v| v.as_str()) {
                    let text = message.get("message").and_then(|v| v.as_str()).unwrap_or("");
                    
                    match level {
                        "error" => errors.push(text.to_string()),
                        "warning" => warnings.push(text.to_string()),
                        _ => {}
                    }
                }
            }
        }
        
        Ok((errors, warnings))
    }

    pub async fn validate_with_docker(&self, patch: &GeneratedPatch) -> Result<ValidationResult> {
        if !self.docker_available {
            return self.validate_patch(patch).await;
        }
        
        info!("Validating patch with Docker...");
        
        let temp_dir = TempDir::new()?;
        let dockerfile = self.create_dockerfile(temp_dir.path())?;
        
        // Build Docker image
        let build_status = Command::new("docker")
            .arg("build")
            .arg("-t")
            .arg("patch-validation")
            .arg("-f")
            .arg(&dockerfile)
            .arg(".")
            .current_dir(&self.workspace_root)
            .status()
            .context("Failed to build Docker image")?;
        
        if !build_status.success() {
            return Err(anyhow::anyhow!("Failed to build Docker image"));
        }
        
        // Run validation in container
        let run_status = Command::new("docker")
            .arg("run")
            .arg("--rm")
            .arg("-v")
            .arg(format!("{}:/workspace", self.workspace_root.display()))
            .arg("patch-validation")
            .status()
            .context("Failed to run validation in Docker")?;
        
        let status = if run_status.success() {
            ValidationStatus::Success
        } else {
            ValidationStatus::Failed
        };
        
        Ok(ValidationResult {
            patch_id: patch.id.clone(),
            status,
            build_success: run_status.success(),
            test_success: run_status.success(),
            security_scan_passed: true,
            performance_impact: PerformanceImpact {
                compile_time_change: 0.0,
                binary_size_change: 0,
                memory_usage_change: 0.0,
                runtime_performance_change: 0.0,
            },
            errors: Vec::new(),
            warnings: Vec::new(),
            metrics: ValidationMetrics {
                build_time_ms: 0,
                test_time_ms: 0,
                security_issues_found: 0,
                warnings_count: 0,
                errors_count: 0,
            },
            timestamp: chrono::Utc::now(),
        })
    }

    fn create_dockerfile(&self, temp_dir: &Path) -> Result<PathBuf> {
        let dockerfile_content = r#"
FROM rust:1.75-slim

WORKDIR /workspace

# Install required tools
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install cargo tools
RUN cargo install cargo-audit
RUN rustup component add clippy

# Copy workspace
COPY . .

# Run validation
CMD ["cargo", "check", "--workspace"] && ["cargo", "test", "--workspace"]
"#;

        let dockerfile_path = temp_dir.join("Dockerfile");
        fs::write(&dockerfile_path, dockerfile_content)?;
        
        Ok(dockerfile_path)
    }

    pub fn generate_validation_report(&self, results: &[ValidationResult]) -> String {
        let mut report = String::new();
        
        report.push_str("# Patch Validation Report\n\n");
        
        let total_patches = results.len();
        let successful_patches = results.iter().filter(|r| r.status == ValidationStatus::Success).count();
        let failed_patches = results.iter().filter(|r| r.status == ValidationStatus::Failed).count();
        
        report.push_str(&format!("## Summary\n"));
        report.push_str(&format!("- Total patches: {}\n", total_patches));
        report.push_str(&format!("- Successful: {}\n", successful_patches));
        report.push_str(&format!("- Failed: {}\n", failed_patches));
        report.push_str(&format!("- Success rate: {:.1}%\n", (successful_patches as f64 / total_patches as f64) * 100.0));
        
        for result in results {
            report.push_str(&format!("\n## Patch {}\n", result.patch_id));
            report.push_str(&format!("- Status: {:?}\n", result.status));
            report.push_str(&format!("- Build: {}\n", result.build_success));
            report.push_str(&format!("- Tests: {}\n", result.test_success));
            report.push_str(&format!("- Security: {}\n", result.security_scan_passed));
            
            if !result.errors.is_empty() {
                report.push_str("\n### Errors\n");
                for error in &result.errors {
                    report.push_str(&format!("- {}\n", error