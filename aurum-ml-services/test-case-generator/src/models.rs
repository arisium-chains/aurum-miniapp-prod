use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TestCaseStatus {
    Created,
    Analyzing,
    Minimizing,
    Validating,
    Ready,
    Executing,
    Passed,
    Failed,
    Error,
    Obsolete,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TestType {
    Unit,
    Integration,
    EndToEnd,
    Performance,
    Security,
    Regression,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestCase {
    pub id: Uuid,
    pub service_name: String,
    pub build_id: String,
    pub commit_hash: String,
    pub title: String,
    pub description: String,
    pub test_type: TestType,
    pub status: TestCaseStatus,
    pub priority: u32,
    pub tags: Vec<String>,
    pub dependencies: Vec<String>,
    pub metadata: HashMap<String, String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub executed_at: Option<DateTime<Utc>>,
    pub execution_time_ms: Option<u64>,
    pub failure_reason: Option<String>,
    pub stack_trace: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildFailure {
    pub service_name: String,
    pub build_id: String,
    pub commit_hash: String,
    pub branch: String,
    pub timestamp: DateTime<Utc>,
    pub error_message: String,
    pub stack_trace: String,
    pub affected_files: Vec<String>,
    pub build_logs: String,
    pub environment: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestExecution {
    pub id: Uuid,
    pub test_case_id: Uuid,
    pub status: TestCaseStatus,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub duration_ms: Option<u64>,
    pub output: Option<String>,
    pub error_output: Option<String>,
    pub exit_code: Option<i32>,
    pub resource_usage: ResourceUsage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceUsage {
    pub cpu_percent: f64,
    pub memory_mb: u64,
    pub disk_io_mb: u64,
    pub network_io_mb: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MinimizationResult {
    pub original_test_case: TestCase,
    pub minimized_test_case: TestCase,
    pub reduction_percentage: f64,
    pub steps_taken: Vec<String>,
    pub validation_passed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub test_case_id: Uuid,
    pub is_valid: bool,
    pub issues: Vec<String>,
    pub suggestions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrossServiceFailure {
    pub primary_service: String,
    pub affected_services: Vec<String>,
    pub failure_pattern: String,
    pub correlation_strength: f64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestCaseMetrics {
    pub total_test_cases: u64,
    pub active_test_cases: u64,
    pub passed_test_cases: u64,
    pub failed_test_cases: u64,
    pub average_execution_time_ms: u64,
    pub success_rate: f64,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestCaseRequest {
    pub service_name: String,
    pub build_id: String,
    pub failure_details: BuildFailure,
    pub preferences: TestCasePreferences,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestCasePreferences {
    pub max_test_cases: usize,
    pub test_types: Vec<TestType>,
    pub priority_threshold: u32,
    pub include_dependencies: bool,
    pub minimization_enabled: bool,
}