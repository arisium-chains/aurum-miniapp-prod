use self_healing_system::patch_generator::*;
use self_healing_system::static_analysis::{Issue, IssueType, Severity};
use self_healing_system::database::{Database, PatchRecord};
use std::collections::HashMap;

#[cfg(test)]
mod patch_generation_tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_patch_generator_initialization() {
        let generator = PatchGenerator::new();
        assert!(generator.is_ok());
    }

    #[test]
    fn test_patch_generation_for_type_error() {
        let generator = PatchGenerator::new().unwrap();
        
        let issue = Issue {
            file_path: "src/main.rs".to_string(),
            line_number: 10,
            column: 15,
            message: "Type mismatch: expected i32, found String".to_string(),
            severity: Severity::Error,
            issue_type: IssueType::TypeError,
            suggested_fix: None,
            context: {
                let mut ctx = HashMap::new();
                ctx.insert("variable_name".to_string(), "count".to_string());
                ctx.insert("expected_type".to_string(), "i32".to_string());
                ctx.insert("actual_type".to_string(), "String".to_string());
                ctx
            },
        };
        
        let patches = generator.generate_patches(&issue).unwrap();
        assert!(!patches.is_empty());
        
        let patch = &patches[0];
        assert!(patch.target_file.contains("main.rs"));
        assert!(patch.confidence > 0.0);
        assert!(patch.confidence <= 1.0);
        assert!(!patch.code_changes.is_empty());
    }

    #[test]
    fn test_patch_generation_for_security_issue() {
        let generator = PatchGenerator::new().unwrap();
        
        let issue = Issue {
            file_path: "src/api.rs".to_string(),
            line_number: 25,
            column: 8,
            message: "SQL injection vulnerability detected".to_string(),
            severity: Severity::Critical,
            issue_type: IssueType::SecurityVulnerability,
            suggested_fix: None,
            context: {
                let mut ctx = HashMap::new();
                ctx.insert("vulnerability_type".to_string(), "sql_injection".to_string());
                ctx.insert("affected_function".to_string(), "execute_query".to_string());
                ctx
            },
        };
        
        let patches = generator.generate_patches(&issue).unwrap();
        assert!(!patches.is_empty());
        
        // Security patches should have high confidence
        for patch in &patches {
            assert!(patch.confidence >= 0.7);
            assert!(patch.safety_analysis.is_safe);
        }
    }

    #[test]
    fn test_patch_generation_for_performance_issue() {
        let generator = PatchGenerator::new().unwrap();
        
        let issue = Issue {
            file_path: "src/utils.rs".to_string(),
            line_number: 50,
            column: 12,
            message: "Inefficient loop: O(n²) complexity detected".to_string(),
            severity: Severity::Warning,
            issue_type: IssueType::Performance,
            suggested_fix: None,
            context: {
                let mut ctx = HashMap::new();
                ctx.insert("complexity".to_string(), "O(n^2)".to_string());
                ctx.insert("suggested_improvement".to_string(), "use HashMap".to_string());
                ctx
            },
        };
        
        let patches = generator.generate_patches(&issue).unwrap();
        assert!(!patches.is_empty());
        
        // Performance patches should maintain functionality
        for patch in &patches {
            assert!(patch.breaking_changes.is_empty());
            assert!(patch.confidence >= 0.6);
        }
    }

    #[test]
    fn test_patch_safety_analysis() {
        let generator = PatchGenerator::new().unwrap();
        
        let unsafe_patch = Patch {
            id: "test-1".to_string(),
            target_file: "src/main.rs".to_string(),
            code_changes: vec![
                CodeChange {
                    line_number: 10,
                    original_line: "let x = 5;".to_string(),
                    new_line: "let x = \"hello\";".to_string(),
                    change_type: ChangeType::Modification,
                }
            ],
            description: "Change type from i32 to String".to_string(),
            confidence: 0.8,
            safety_analysis: SafetyAnalysis {
                is_safe: false,
                breaking_changes: vec!["Type change may break downstream usage".to_string()],
                security_risks: vec![],
                performance_impact: PerformanceImpact::Neutral,
            },
            breaking_changes: vec!["Type change".to_string()],
            dependencies: vec![],
            test_requirements: vec!["Update type annotations".to_string()],
        };
        
        let analysis = generator.analyze_patch_safety(&unsafe_patch).unwrap();
        assert!(!analysis.is_safe);
        assert!(!analysis.breaking_changes.is_empty());
    }

    #[test]
    fn test_dependency_analysis() {
        let generator = PatchGenerator::new().unwrap();
        
        let patch = Patch {
            id: "test-2".to_string(),
            target_file: "src/main.rs".to_string(),
            code_changes: vec![
                CodeChange {
                    line_number: 1,
                    original_line: "use std::collections::HashMap;".to_string(),
                    new_line: "use std::collections::BTreeMap;".to_string(),
                    change_type: ChangeType::Modification,
                }
            ],
            description: "Replace HashMap with BTreeMap".to_string(),
            confidence: 0.9,
            safety_analysis: SafetyAnalysis::default(),
            breaking_changes: vec![],
            dependencies: vec!["std::collections::BTreeMap".to_string()],
            test_requirements: vec![],
        };
        
        let deps = generator.analyze_dependencies(&patch).unwrap();
        assert!(!deps.is_empty());
        assert!(deps.contains(&"std::collections::BTreeMap".to_string()));
    }

    #[test]
    fn test_patch_ranking() {
        let generator = PatchGenerator::new().unwrap();
        
        let patches = vec![
            Patch {
                id: "patch-1".to_string(),
                target_file: "src/main.rs".to_string(),
                code_changes: vec![],
                description: "Low confidence patch".to_string(),
                confidence: 0.3,
                safety_analysis: SafetyAnalysis::default(),
                breaking_changes: vec![],
                dependencies: vec![],
                test_requirements: vec![],
            },
            Patch {
                id: "patch-2".to_string(),
                target_file: "src/main.rs".to_string(),
                code_changes: vec![],
                description: "High confidence patch".to_string(),
                confidence: 0.9,
                safety_analysis: SafetyAnalysis::default(),
                breaking_changes: vec![],
                dependencies: vec![],
                test_requirements: vec![],
            },
            Patch {
                id: "patch-3".to_string(),
                target_file: "src/main.rs".to_string(),
                code_changes: vec![],
                description: "Medium confidence patch".to_string(),
                confidence: 0.7,
                safety_analysis: SafetyAnalysis::default(),
                breaking_changes: vec![],
                dependencies: vec![],
                test_requirements: vec![],
            },
        ];
        
        let ranked = generator.rank_patches(patches).unwrap();
        assert_eq!(ranked[0].id, "patch-2");
        assert_eq!(ranked[1].id, "patch-3");
        assert_eq!(ranked[2].id, "patch-1");
    }

    #[test]
    fn test_patch_database_storage() {
        let dir = tempdir().unwrap();
        let db_path = dir.path().join("test.db");
        
        let db = Database::new(&db_path.to_string_lossy()).unwrap();
        let generator = PatchGenerator::new().unwrap();
        
        let issue = Issue {
            file_path: "src/test.rs".to_string(),
            line_number: 1,
            column: 1,
            message: "Test issue".to_string(),
            severity: Severity::Error,
            issue_type: IssueType::TypeError,
            suggested_fix: None,
            context: HashMap::new(),
        };
        
        let patches = generator.generate_patches(&issue).unwrap();
        assert!(!patches.is_empty());
        
        let patch_record = PatchRecord {
            id: patches[0].id.clone(),
            issue_id: "issue-1".to_string(),
            patch: patches[0].clone(),
            status: PatchStatus::Generated,
            created_at: chrono::Utc::now(),
            validated_at: None,
            applied_at: None,
            validation_result: None,
        };
        
        db.store_patch(&patch_record).unwrap();
        
        let retrieved = db.get_patch(&patches[0].id).unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().id, patches[0].id);
    }

    #[test]
    fn test_complex_patch_generation() {
        let generator = PatchGenerator::new().unwrap();
        
        let issue = Issue {
            file_path: "src/complex.rs".to_string(),
            line_number: 100,
            column: 25,
            message: "Complex lifetime issue with async closure".to_string(),
            severity: Severity::Error,
            issue_type: IssueType::TypeError,
            suggested_fix: None,
            context: {
                let mut ctx = HashMap::new();
                ctx.insert("async_context".to_string(), "true".to_string());
                ctx.insert("lifetime_bounds".to_string(), "complex".to_string());
                ctx
            },
        };
        
        let patches = generator.generate_patches(&issue).unwrap();
        assert!(!patches.is_empty());
        
        // Complex issues should generate multiple variants
        assert!(patches.len() >= 2);
        
        for patch in patches {
            assert!(!patch.code_changes.is_empty());
            assert!(patch.confidence > 0.0);
            assert!(patch.confidence <= 1.0);
        }
    }

    #[test]
    fn test_edge_case_handling() {
        let generator = PatchGenerator::new().unwrap();
        
        // Test with minimal context
        let issue = Issue {
            file_path: "src/empty.rs".to_string(),
            line_number: 0,
            column: 0,
            message: "".to_string(),
            severity: Severity::Info,
            issue_type: IssueType::CodeStyle,
            suggested_fix: None,
            context: HashMap::new(),
        };
        
        let result = generator.generate_patches(&issue);
        assert!(result.is_ok());
        
        // Test with very long file path
        let long_path_issue = Issue {
            file_path: "a".repeat(1000),
            line_number: 1,
            column: 1,
            message: "Test".to_string(),
            severity: Severity::Warning,
            issue_type: IssueType::Performance,
            suggested_fix: None,
            context: HashMap::new(),
        };
        
        let result = generator.generate_patches(&long_path_issue);
        assert!(result.is_ok());
    }

    #[test]
    fn test_performance_optimization() {
        let generator = PatchGenerator::new().unwrap();
        
        let start = std::time::Instant::now();
        
        let issue = Issue {
            file_path: "src/perf_test.rs".to_string(),
            line_number: 1,
            column: 1,
            message: "Performance test".to_string(),
            severity: Severity::Warning,
            issue_type: IssueType::Performance,
            suggested_fix: None,
            context: HashMap::new(),
        };
        
        let _patches = generator.generate_patches(&issue).unwrap();
        
        let duration = start.elapsed();
        assert!(duration.as_millis() < 5000, "Patch generation should be reasonably fast");
    }

    #[test]
    fn test_patch_validation_requirements() {
        let generator = PatchGenerator::new().unwrap();
        
        let issue = Issue {
            file_path: "src/api.rs".to_string(),
            line_number: 30,
            column: 10,
            message: "Missing error handling".to_string(),
            severity: Severity::Warning,
            issue_type: IssueType::CodeStyle,
            suggested_fix: None,
            context: {
                let mut ctx = HashMap::new();
                ctx.insert("function_name".to_string(), "process_request".to_string());
                ctx
            },
        };
        
        let patches = generator.generate_patches(&issue).unwrap();
        
        for patch in patches {
            assert!(!patch.test_requirements.is_empty());
            assert!(patch.test_requirements.iter().any(|req| 
                req.contains("test") || req.contains("validate")
            ));
        }
    }

    #[test]
    fn test_multiple_variant_generation() {
        let generator = PatchGenerator::new().unwrap();
        
        let issue = Issue {
            file_path: "src/main.rs".to_string(),
            line_number: 15,
            column: 8,
            message: "Multiple possible fixes for this issue".to_string(),
            severity: Severity::Error,
            issue_type: IssueType::TypeError,
            suggested_fix: None,
            context: HashMap::new(),
        };
        
        let patches = generator.generate_patches(&issue).unwrap();
        
        // Should generate multiple variants for complex issues
        assert!(patches.len() >= 2);
        
        // Each variant should have different confidence scores
        let confidences: Vec<f64> = patches.iter().map(|p| p.confidence).collect();
        assert!(confidences.windows(2).any(|w| w[0] != w[1]));
    }

    #[test]
    fn test_patch_metadata_extraction() {
        let generator = PatchGenerator::new().unwrap();
        
        let patch = Patch {
            id: "meta-test".to_string(),
            target_file: "src/lib.rs".to_string(),
            code_changes: vec![
                CodeChange {
                    line_number: 42,
                    original_line: "    let result = vec.iter().map(|x| x * 2).collect();".to_string(),
                    new_line: "    let result: Vec<_> = vec.iter().map(|x| x * 2).collect();".to_string(),
                    change_type: ChangeType::Modification,
                }
            ],
            description: "Add explicit type annotation".to_string(),
            confidence: 0.85,
            safety_analysis: SafetyAnalysis {
                is_safe: true,
                breaking_changes: vec![],
                security_risks: vec![],
                performance_impact: PerformanceImpact::Neutral,
            },
            breaking_changes: vec![],
            dependencies: vec![],
            test_requirements: vec!["Verify type inference works".to_string()],
        };
        
        let metadata = generator.extract_patch_metadata(&patch).unwrap();
        assert!(metadata.contains_key("lines_changed"));
        assert!(metadata.contains_key("complexity_score"));
        assert!(metadata.contains_key("risk_level"));
    }
}