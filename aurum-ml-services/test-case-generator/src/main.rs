use anyhow::Result;
use clap::{Parser, Subcommand};
use std::sync::Arc;
use tokio::signal;
use tracing::{info, error};
use tracing_subscriber;

mod config;
mod generator;
mod analyzer;
mod minimizer;
mod validator;
mod repository;
mod executor;
mod reporter;
mod models;

use config::Config;
use generator::TestCaseGenerator;
use analyzer::StaticAnalyzer;
use minimizer::TestCaseMinimizer;
use validator::TestCaseValidator;
use repository::TestCaseRepository;
use executor::TestExecutor;
use reporter::ReportGenerator;

#[derive(Parser)]
#[command(name = "test-case-generator")]
#[command(about = "Minimal reproducible test case generator for self-healing CI/CD pipeline")]
#[command(version = "1.0.0")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
    
    #[arg(short, long, default_value = "config.toml")]
    config: String,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the test case generator service
    Start {
        #[arg(short, long)]
        daemon: bool,
    },
    
    /// Generate test cases from build failure
    Generate {
        #[arg(short, long)]
        service_name: String,
        #[arg(short, long)]
        build_id: String,
    },
    
    /// Minimize existing test cases
    Minimize {
        #[arg(short, long)]
        test_case_id: String,
    },
    
    /// Validate test cases
    Validate {
        #[arg(short, long)]
        test_case_path: String,
    },
    
    /// Execute test cases
    Execute {
        #[arg(short, long)]
        test_case_id: String,
    },
    
    /// Generate reports
    Report {
        #[arg(short, long)]
        format: String,
    },
    
    /// List all test cases
    List,
    
    /// Get test case statistics
    Stats,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .init();

    let cli = Cli::parse();
    let config = Config::load(&cli.config)?;

    match cli.command {
        Commands::Start { daemon } => {
            start_service(config, daemon).await?;
        }
        Commands::Generate { service_name, build_id } => {
            generate_test_cases(config, service_name, build_id).await?;
        }
        Commands::Minimize { test_case_id } => {
            minimize_test_case(config, test_case_id).await?;
        }
        Commands::Validate { test_case_path } => {
            validate_test_case(config, test_case_path).await?;
        }
        Commands::Execute { test_case_id } => {
            execute_test_case(config, test_case_id).await?;
        }
        Commands::Report { format } => {
            generate_report(config, format).await?;
        }
        Commands::List => {
            list_test_cases(config).await?;
        }
        Commands::Stats => {
            show_stats(config).await?;
        }
    }

    Ok(())
}

async fn start_service(config: Config, daemon: bool) -> Result<()> {
    info!("Starting test case generator service...");
    
    let generator = TestCaseGenerator::new(config.clone()).await?;
    let analyzer = StaticAnalyzer::new(config.clone()).await?;
    let minimizer = TestCaseMinimizer::new(config.clone()).await?;
    let validator = TestCaseValidator::new(config.clone()).await?;
    let repository = TestCaseRepository::new(config.clone()).await?;
    let executor = TestExecutor::new(config.clone()).await?;
    let reporter = ReportGenerator::new(config.clone()).await?;

    info!("Test case generator service started successfully");
    
    if daemon {
        info!("Running in daemon mode");
        signal::ctrl_c().await?;
        info!("Received shutdown signal");
    } else {
        info!("Running in foreground mode (Ctrl+C to stop)");
        signal::ctrl_c().await?;
        info!("Received shutdown signal");
    }

    Ok(())
}

async fn generate_test_cases(config: Config, service_name: String, build_id: String) -> Result<()> {
    let generator = TestCaseGenerator::new(config).await?;
    generator.generate_from_failure(&service_name, &build_id).await?;
    Ok(())
}

async fn minimize_test_case(config: Config, test_case_id: String) -> Result<()> {
    let minimizer = TestCaseMinimizer::new(config).await?;
    minimizer.minimize(&test_case_id).await?;
    Ok(())
}

async fn validate_test_case(config: Config, test_case_path: String) -> Result<()> {
    let validator = TestCaseValidator::new(config).await?;
    validator.validate(&test_case_path).await?;
    Ok(())
}

async fn execute_test_case(config: Config, test_case_id: String) -> Result<()> {
    let executor = TestExecutor::new(config).await?;
    executor.execute(&test_case_id).await?;
    Ok(())
}

async fn generate_report(config: Config, format: String) -> Result<()> {
    let reporter = ReportGenerator::new(config).await?;
    reporter.generate(&format).await?;
    Ok(())
}

async fn list_test_cases(config: Config) -> Result<()> {
    let repository = TestCaseRepository::new(config).await?;
    repository.list_all().await?;
    Ok(())
}

async fn show_stats(config: Config) -> Result<()> {
    let repository = TestCaseRepository::new(config).await?;
    repository.show_stats().await?;
    Ok(())
}