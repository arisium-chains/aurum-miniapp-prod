use self_healing_system::static_analysis::*;
use syn::{parse_quote, ItemFn};
use std::collections::HashMap;

#[cfg(test)]
mod static_analysis_tests {
    use super::*;

    #[test]
    fn test_security_visitor() {
        let code = r#"
use std::process::Command;

fn execute_command(user_input: String) {
    Command::new("sh")
        .arg("-c")
        .arg(user_input)
        .output()
        .unwrap();
}
"#;
        
        let file = syn::parse_file(code).unwrap();
        let mut visitor = SecurityVisitor::new();
        visitor.visit_file(&file);
        
        assert!(!visitor.issues.is_empty());
        assert!(visitor.issues.iter().any(|issue| 
            issue.message.contains("Command injection")
        ));
    }

    #[test]
    fn test_performance_visitor() {
        let code = r#"
fn inefficient_loop() {
    let vec = vec![1, 2, 3, 4, 5];
    for i in 0..vec.len() {
        println!("{}", vec[i]);
    }
}
"#;
        
        let file = syn::parse_file(code).unwrap();
        let mut visitor = PerformanceVisitor::new();
        visitor.visit_file(&file);
        
        assert!(!visitor.issues.is_empty());
        assert!(visitor.issues.iter().any(|issue| 
            issue.message.contains("inefficient")
        ));
    }

    #[test]
    fn test_edition2024_visitor() {
        let code = r#"
#[macro_use]
extern crate serde;

mod old_style {
    pub fn function() {}
}
"#;
        
        let file = syn::parse_file(code).unwrap();
        let mut visitor = Edition2024Visitor::new();
        visitor.visit_file(&file);
        
        assert!(!visitor.issues.is_empty());
        assert!(visitor.issues.iter().any(|issue| 
            issue.issue_type == IssueType::Edition2024Compatibility
        ));
    }

    #[test]
    fn test_code_style_visitor() {
        let code = r#"
fn bad_naming(){
    let x=5;
    let y =x+1;
}
"#;
        
        let file = syn::parse_file(code).unwrap();
        let mut visitor = CodeStyleVisitor::new();
        visitor.visit_file(&file);
        
        assert!(!visitor.issues.is_empty());
        assert!(visitor.issues.iter().any(|issue| 
            issue.issue_type == IssueType::CodeStyle
        ));
    }

    #[test]
    fn test_dependency_analyzer() {
        let cargo_toml = r#"
[package]
name = "test"
version = "0.1.0"

[dependencies]
serde = "1.0"
tokio = { version = "1.0", features = ["full"] }
chrono = "0.4"
"#;
        
        let dependencies = DependencyAnalyzer::analyze_dependencies(cargo_toml).unwrap();
        
        assert_eq!(dependencies.len(), 3);
        assert!(dependencies.contains_key("serde"));
        assert!(dependencies.contains_key("tokio"));
        assert!(dependencies.contains_key("chrono"));
    }

    #[test]
    fn test_complexity_calculator() {
        let code = r#"
fn complex_function(x: i32) -> i32 {
    if x > 0 {
        if x < 10 {
            return x * 2;
        } else if x < 100 {
            return x * 3;
        } else {
            return x * 4;
        }
    } else {
        match x {
            -1 => 0,
            -2 => 1,
            _ => 2,
        }
    }
}
"#;
        
        let file = syn::parse_file(code).unwrap();
        let mut calculator = ComplexityCalculator::new();
        calculator.visit_file(&file);
        
        assert!(calculator.complexity_scores.contains_key("complex_function"));
        assert!(calculator.complexity_scores["complex_function"] > 5);
    }

    #[test]
    fn test_pattern_detector() {
        let code = r#"
fn example() {
    let result = match some_value {
        Ok(val) => val,
        Err(e) => return Err(e),
    };
    
    let vec = vec![1, 2, 3];
    for item in vec.iter() {
        println!("{}", item);
    }
}
"#;
        
        let file = syn::parse_file(code).unwrap();
        let mut detector = PatternDetector::new();
        detector.visit_file(&file);
        
        assert!(!detector.patterns.is_empty());
    }

    #[test]
    fn test_ast_utils() {
        let code = "fn test() { let x = 5; }";
        let file = syn::parse_file(code).unwrap();
        
        let functions = AstUtils::find_functions(&file);
        assert_eq!(functions.len(), 1);
        assert_eq!(functions[0].sig.ident, "test");
        
        let variables = AstUtils::find_variables(&file);
        assert_eq!(variables.len(), 1);
        assert_eq!(variables[0], "x");
    }

    #[test]
    fn test_issue_severity_ordering() {
        assert!(Severity::Error > Severity::Warning);
        assert!(Severity::Warning > Severity::Info);
        assert!(Severity::Critical > Severity::Error);
    }

    #[test]
    fn test_issue_type_display() {
        assert_eq!(format!("{}", IssueType::TypeError), "TypeError");
        assert_eq!(format!("{}", IssueType::SecurityVulnerability), "SecurityVulnerability");
        assert_eq!(format!("{}", IssueType::Performance), "Performance");
    }
}