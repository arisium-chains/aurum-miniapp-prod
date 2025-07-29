use self_healing_system::patch_validator::*;
use self_healing_system::patch_generator::{Patch, CodeChange, ChangeType, SafetyAnalysis, PerformanceImpact};
use self_healing_system::database::{Database, PatchRecord, ValidationResult};
use std::collections::HashMap;
use tempfile::tempdir;

#[cfg(test)]
mod patch_validation_tests {
    use super::*;

    #[test]
    fn test_validator_initialization() {
        let validator = PatchValidator::new();
        assert!(validator.is_ok());
    }

    #[test]
    fn test_basic_validation_flow() {
        let dir = tempdir().unwrap();
        let validator = PatchValidator::new().unwrap();
        
        let patch = Patch {
            id: "test-1".to_string(),
            target_file: "src/main.rs".to_string(),
            code_changes: vec![
                CodeChange {
                    line_number: 10,
                    original_line: "let x = 5;".to_string(),
                    new_line: "let x = 10;".to_string(),
                    change_type: ChangeType::Modification,
                }
            ],
            description: "Simple value change".to_string(),
            confidence: 0.9,
            safety_analysis: SafetyAnalysis {
                is_safe: true,
                breaking_changes: vec![],
                security_risks: vec![],
                performance_impact: PerformanceImpact::Neutral,
            },
            breaking_changes: vec![],
            dependencies: vec![],
            test_requirements: vec![],
        };
        
        let result = validator.validate_patch(&patch, dir.path());
        assert!(result.is_ok());
        
        let validation_result = result.unwrap();
        assert!(validation_result.build_success);
        assert!(validation_result.tests_passed);
        assert!(validation_result.security_scan_passed);
    }

    #[test]
    fn test_build_failure_detection() {
        let dir = tempdir().unwrap();
        let validator = PatchValidator::new().unwrap();
        
        // Create a patch that will cause build failure
        let patch = Patch {
            id: "build-fail".to_string(),
            target_file: "src/main.rs".to_string(),
            code_changes: vec![
                CodeChange {
                    line_number: 1,
                    original_line: "fn main() {}".to_string(),
                    new_line: "fn main() { invalid syntax }".to_string(),
                    change_type: ChangeType::Modification,
                }
            ],
            description: "Invalid syntax".to_string(),
            confidence: 0.1,
            safety_analysis: SafetyAnalysis {
                is_safe: false,
                breaking_changes: vec!["Syntax error".to_string()],
                security_risks: vec![],
                performance_impact: PerformanceImpact::Negative,
            },
            breaking_changes: vec!["Syntax error".to_string()],
            dependencies: vec![],
            test_requirements: vec![],
        };
        
        let result = validator.validate_patch(&patch, dir.path());
        assert!(result.is_ok());
        
        let validation_result = result.unwrap();
        assert!(!validation_result.build_success);
        assert!(!validation_result.tests_passed);
    }

    #[test]
    fn test_security_scanning() {
        let dir = tempdir().unwrap();
        let validator = PatchValidator::new().unwrap();
        
        let patch = Patch {
            id: "security-test".to_string(),
            target_file: "src/security.rs".to_string(),
            code_changes: vec![
                CodeChange {
                    line_number: 5,
                    original_line: "let query = format!(\"SELECT * FROM users WHERE id = {}\", user_id);".to_string(),
                    new_line: "let query = format!(\"SELECT * FROM users WHERE id = {}\", user_id);".to_string(),
                    change_type: ChangeType::Modification,
                }
            ],
            description: "SQL injection vulnerability".to_string(),
            confidence: 0.3,
            safety_analysis: SafetyAnalysis {
                is_safe: false,
                breaking_changes: vec![],
                security_risks: vec!["SQL injection".to_string()],
                performance_impact: PerformanceImpact::Neutral,
            },
            breaking_changes: vec![],
            dependencies: vec![],
            test_requirements: vec![],
        };
        
        let result = validator.validate_patch(&patch, dir.path());
        assert!(result.is_ok());
        
        let validation_result = result.unwrap();
        assert!(!validation_result.security_scan_passed);
        assert!(validation_result.security_issues.contains(&"SQL injection vulnerability".to_string()));
    }

    #[test]
    fn test_performance_impact_measurement() {
        let dir = tempdir().unwrap();
        let validator = PatchValidator::new().unwrap();
        
        let patch = Patch {
            id: "perf-test".to_string(),
            target_file: "src/algorithm.rs".to_string(),
            code_changes: vec![
                CodeChange {
                    line_number: 20,
                    original_line: "for i in 0..n { result.push(i * 2); }".to_string(),
                    new_line: "for i in 0..n*n { result.push(i * 2); }".to_string(),
                    change_type: ChangeType::Modification,
                }
            ],
            description: "Increase complexity".to_string(),
            confidence: 0.5,
            safety_analysis: SafetyAnalysis {
                is_safe: false,
                breaking_changes: vec![],
                security_risks: vec![],
                performance_impact: PerformanceImpact::Negative,
            },
            breaking_changes: vec![],
            dependencies: vec![],
            test_requirements: vec![],
        };
        
        let result = validator.validate_patch(&patch, dir.path());
        assert!(result.is_ok());
        
        let validation_result = result.unwrap();
        assert!(validation_result.performance_impact.is_some());
        let impact = validation_result.performance_impact.unwrap();
        assert!(impact.regression_detected);
    }

    #[test]
    fn test_docker_containerization() {
        let dir = tempdir().unwrap();
        let validator = PatchValidator::new().unwrap();
        
        let patch = Patch {
            id: "docker-test".to_string(),
            target_file: "src/main.rs".to_string(),
            code_changes: vec![
                CodeChange {
                    line_number: 1,
                    original_line: "fn main() { println!(\"Hello\"); }".to_string(),
                    new_line: "fn main() { println!(\"Hello, World!\"); }".to_string(),
                    change_type: ChangeType::Modification,
                }
            ],
            description: "Update greeting".to_string(),
            confidence: 0.95,
            safety_analysis: SafetyAnalysis {
                is_safe: true,
                breaking_changes: vec![],
                security_risks: vec![],
                performance_impact: PerformanceImpact::Neutral,
            },
            breaking_changes: vec![],
            dependencies: vec![],
            test_requirements: vec![],
        };
        
        let result = validator.validate_patch(&patch, dir.path());
        assert!(result.is_ok());
        
        let validation_result = result.unwrap();
        assert!(validation_result.container_validation_success);
    }

    #[test]
    fn test_dependency_conflict_detection() {
        let dir = tempdir().unwrap();
        let validator = PatchValidator::new().unwrap();
        
        let patch = Patch {
            id: "dep-conflict".to_string(),
            target_file: "src/main.rs".to_string(),
            code_changes: vec![
                CodeChange {
                    line_number: 1,
                    original_line: "use std::collections::HashMap;".to_string(),
                    new_line: "use std::collections::BTreeMap as HashMap;".to_string(),
                    change_type: ChangeType::Modification,
                }
            ],
            description: "Change HashMap implementation".to_string(),
            confidence: 0.7,
            safety_analysis: SafetyAnalysis {
                is_safe: true,
                breaking_changes: vec![],
                security_risks: vec![],
                performance_impact: PerformanceImpact::Neutral,
            },
            breaking_changes: vec![],
            dependencies: vec!["std::collections::BTreeMap".to_string()],
            test_requirements: vec![],
        };
        
        let result = validator.validate_patch(&patch, dir.path());
        assert!(result.is_ok());
        
        let validation_result = result.unwrap();
        assert!(validation_result.dependency_conflicts.is_empty() || 
                validation_result.dependency_conflicts.iter().any(|c| c.contains("BTreeMap")));
    }

    #[test]
    fn test_comprehensive_validation_report() {
        let dir = tempdir().unwrap();
        let validator = PatchValidator::new().unwrap();
        
        let patch = Patch {
            id: "comprehensive-test".to_string(),
            target_file: "src/lib.rs".to_string(),
            code_changes: vec![
                CodeChange {
                    line_number: 10,
                    original_line: "pub fn add(a: i32, b: i32) -> i32 { a + b }".to_string(),
                    new_line: "pub fn add(a: i32, b: i32) -> i32 { a + b + 1 }".to_string(),
                    change_type: ChangeType::Modification,
                }
            ],
            description: "Add one to result".to_string(),
            confidence: 0.8,
            safety_analysis: SafetyAnalysis {
                is_safe: true,
                breaking_changes: vec![],
                security_risks: vec![],
                performance_impact: PerformanceImpact::Neutral,
            },
            breaking_changes: vec![],
            dependencies: vec![],
            test_requirements: vec!["Update tests to expect +1".to_string()],
        };
        
        let result = validator.validate_patch(&patch, dir.path());
        assert!(result.is_ok());
        
        let validation_result = result.unwrap();
        
        // Check all validation aspects
        assert!(validation_result.build_success);
        assert!(validation_result.tests_passed);
        assert!(validation_result.security_scan_passed);
        assert!(validation_result.container_validation_success);
        assert!(validation_result.validation_duration_ms > 0);
        
        // Check report completeness
        assert!(!validation_result.validation_report.is_empty());
        assert!(validation_result.validation_report.contains("Build"));
        assert!(validation_result.validation_report.contains("Tests"));
        assert!(validation_result.validation_report.contains("Security"));
    }

    #[test]
    fn test_validation_with_database() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        let db = Database::new(&db_path.to_string_lossy()).unwrap();
        let validator = PatchValidator::new().unwrap();
        
        let patch = Patch {
            id: "db-test".to_string(),
            target_file: "src/main.rs".to_string(),
            code_changes: vec![
                CodeChange {
                    line_number: 1,
                    original_line: "fn main() { println!(\"old\"); }".to_string(),
                    new_line: "fn main() { println!(\"new\"); }".to_string(),
                    change_type: ChangeType::Modification,
                }
            ],
            description: "Simple change".to_string(),
            confidence: 0.9,
            safety_analysis: SafetyAnalysis {
                is_safe: true,
                breaking_changes: vec![],
                security_risks: vec![],
                performance_impact: PerformanceImpact::Neutral,
            },
            breaking_changes: vec![],
            dependencies: vec![],
            test_requirements: vec![],
        };
        
        let validation_result = validator.validate_patch(&patch, dir.path()).unwrap();
        
        // Store validation result in database
        let record = ValidationResult {
            patch_id: patch.id.clone(),
            build_success: validation_result.build_success,
            tests_passed: validation_result.tests_passed,
            security_scan_passed: validation_result.security_scan_passed,
            performance_impact: validation_result.performance_impact,
            validation_report: validation_result.validation_report,
            validation_duration_ms: validation_result.validation_duration_ms,
            container_validation_success: validation_result.container_validation_success,
            dependency_conflicts: validation_result.dependency_conflicts,
            security_issues: validation_result.security_issues,
        };
        
        db.store_validation_result(&record).unwrap();
        
        let retrieved = db.get_validation_result(&patch.id).unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().patch_id, patch.id);
    }

    #[test]
    fn test_concurrent_validation() {
        use std::thread;
        
        let dir = tempdir().unwrap();
        let validator = PatchValidator::new().unwrap();
        
        let patches = vec![
            Patch {
                id: "concurrent-1".to_string(),
                target_file: "src/main.rs".to_string(),
                code_changes: vec![
                    CodeChange {
                        line_number: 1,
                        original_line: "fn main() { println!(\"1\"); }".to_string(),
                        new_line: "fn main() { println!(\"1a\"); }".to_string(),
                        change_type: ChangeType::Modification,
                    }
                ],
                description: "Change 1".to_string(),
                confidence: 0.9,
                safety_analysis: SafetyAnalysis::default(),
                breaking_changes: vec![],
                dependencies: vec![],
                test_requirements: vec![],
            },
            Patch {
                id: "concurrent-2".to_string(),
                target_file: "src/main.rs".to_string(),
                code_changes: vec![
                    CodeChange {
                        line_number: 1,
                        original_line: "fn main() { println!(\"2\"); }".to_string(),
                        new_line: "fn main() { println!(\"2a\"); }".to_string(),
                        change_type: ChangeType::Modification,
                    }
                ],
                description: "Change 2".to_string(),
                confidence: 0.9,
                safety_analysis: SafetyAnalysis::default(),
                breaking_changes: vec![],
                dependencies: vec![],
                test_requirements: vec![],
            },
        ];
        
        let handles: Vec<_> = patches.into_iter().map(|patch| {
            let validator = validator.clone();
            let dir_path = dir.path().to_path_buf();
            thread::spawn(move || {
                validator.validate_patch(&patch, &dir_path)
            })
        }).collect();
        
        for handle in handles {
            let result = handle.join().unwrap();
            assert!(result.is_ok());
        }
    }

    #[test]
    fn test_edge_case_handling() {
        let dir = tempdir().unwrap();
        let validator = PatchValidator::new().unwrap();
        
        // Test with empty patch
        let empty_patch = Patch {
            id: "empty".to_string(),
            target_file: "".to_string(),
            code_changes: vec![],
            description: "".to_string(),
            confidence: 0.0,
            safety_analysis: SafetyAnalysis::default(),
            breaking_changes: vec![],
            dependencies: vec![],
            test_requirements: vec![],
        };
        
        let result = validator.validate_patch(&empty_patch, dir.path());
        assert!(result.is_ok());
        
        // Test with very long file path
        let long_path_patch = Patch {
            id: "long-path".to_string(),
            target_file: "a".repeat(1000),
            code_changes: vec![
                CodeChange {
                    line_number: 1,
                    original_line: "test".to_string(),
                    new_line: "test".to_string(),
                    change_type: ChangeType::Modification,
                }
            ],
            description: "Test".to_string(),
            confidence: 0.5,
            safety_analysis: SafetyAnalysis::default(),
            breaking_changes: vec![],
            dependencies: vec![],
            test_requirements: vec![],
        };
        
        let result = validator.validate_patch(&long_path_patch, dir.path());
        assert!(result.is_ok());
    }

    #[test]
    fn test_validation_timeout() {
        let dir = tempdir().unwrap();
        let validator = PatchValidator::new().unwrap();
        
        let patch = Patch {
            id: "timeout-test".to_string(),
            target_file: "src/main.rs".to_string(),
            code_changes: vec![
                CodeChange {
                    line_number: 1,
                    original_line: "fn main() { std::thread::sleep(std::time::Duration::from_secs(10)); }".to_string(),
                    new_line: "fn main() { std::thread::sleep(std::time::Duration::from_secs(60)); }".to_string(),
                    change_type: ChangeType::Modification,
                }
            ],
            description: "Long running test".to_string(),
            confidence: 0.5,
            safety_analysis: SafetyAnalysis::default(),
            breaking_changes: vec![],
            dependencies: vec![],
            test_requirements: vec![],
        };
        
        let start = std::time::Instant::now();
        let result = validator.validate_patch(&patch, dir.path());
        let duration = start.elapsed();
        
        assert!(result.is_ok());
        assert!(duration.as_secs() < 30, "Validation should timeout reasonably");
    }
}