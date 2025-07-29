use anyhow::Result;
use clap::{Parser, Subcommand};
use tracing::{info, error};
use tracing_subscriber;

mod config;
mod static_analysis;
mod llm_integration;
mod patch_generator;
mod patch_validator;
mod git_operations;
mod monitoring;
mod database;

use crate::config::Config;
use crate::monitoring::SelfHealingDaemon;

#[derive(Parser)]
#[command(name = "self-healing-system")]
#[command(about = "Self-healing CI/CD pipeline with LLM-assisted code patching")]
#[command(version = "1.0.0")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
    
    #[arg(short, long, default_value = "config.toml")]
    config: String,
    
    #[arg(short, long)]
    verbose: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the self-healing daemon
    Daemon {
        #[arg(short, long)]
        watch: bool,
    },
    
    /// Analyze a specific project for issues
    Analyze {
        #[arg(short, long)]
        project_path: String,
        
        #[arg(short, long)]
        output: Option<String>,
    },
    
    /// Generate a patch for detected issues
    Generate {
        #[arg(short, long)]
        issue_id: String,
        
        #[arg(short, long)]
        model: Option<String>,
    },
    
    /// Validate a generated patch
    Validate {
        #[arg(short, long)]
        patch_path: String,
        
        #[arg(short, long)]
        project_path: String,
    },
    
    /// Apply a validated patch
    Apply {
        #[arg(short, long)]
        patch_path: String,
        
        #[arg(short, long)]
        project_path: String,
        
        #[arg(long)]
        dry_run: bool,
    },
    
    /// List all known issues
    Issues {
        #[arg(short, long)]
        status: Option<String>,
    },
    
    /// Rollback a previously applied patch
    Rollback {
        #[arg(short, long)]
        patch_id: String,
        
        #[arg(short, long)]
        project_path: String,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let cli = Cli::parse();
    
    // Load configuration
    let config = Config::load(&cli.config).await?;
    
    if cli.verbose {
        info!("Configuration loaded: {:?}", config);
    }

    match cli.command {
        Commands::Daemon { watch } => {
            info!("Starting self-healing daemon...");
            let daemon = SelfHealingDaemon::new(config).await?;
            daemon.run(watch).await?;
        }
        
        Commands::Analyze { project_path, output } => {
            info!("Analyzing project: {}", project_path);
            let analyzer = static_analysis::StaticAnalyzer::new(config.clone());
            let issues = analyzer.analyze_project(&project_path).await?;
            
            if let Some(output_path) = output {
                std::fs::write(output_path, serde_json::to_string_pretty(&issues)?)?;
                info!("Analysis results saved to: {}", output_path);
            } else {
                println!("{}", serde_json::to_string_pretty(&issues)?);
            }
        }
        
        Commands::Generate { issue_id, model } => {
            info!("Generating patch for issue: {}", issue_id);
            let generator = patch_generator::PatchGenerator::new(config.clone(), model);
            let patch = generator.generate_patch(&issue_id).await?;
            
            println!("Generated patch: {}", serde_json::to_string_pretty(&patch)?);
        }
        
        Commands::Validate { patch_path, project_path } => {
            info!("Validating patch: {} for project: {}", patch_path, project_path);
            let validator = patch_validator::PatchValidator::new(config.clone());
            let result = validator.validate_patch(&patch_path, &project_path).await?;
            
            println!("Validation result: {}", serde_json::to_string_pretty(&result)?);
        }
        
        Commands::Apply { patch_path, project_path, dry_run } => {
            info!("Applying patch: {} to project: {}", patch_path, project_path);
            let applier = patch_generator::PatchApplier::new(config.clone());
            let result = applier.apply_patch(&patch_path, &project_path, dry_run).await?;
            
            if dry_run {
                println!("Dry run completed. Would apply: {}", serde_json::to_string_pretty(&result)?);
            } else {
                println!("Patch applied: {}", serde_json::to_string_pretty(&result)?);
            }
        }
        
        Commands::Issues { status } => {
            let db = database::Database::new(&config.database_url).await?;
            let issues = db.get_issues(status.as_deref()).await?;
            
            println!("{}", serde_json::to_string_pretty(&issues)?);
        }
        
        Commands::Rollback { patch_id, project_path } => {
            info!("Rolling back patch: {} from project: {}", patch_id, project_path);
            let rollback = patch_generator::PatchRollback::new(config.clone());
            let result = rollback.rollback_patch(&patch_id, &project_path).await?;
            
            println!("Rollback result: {}", serde_json::to_string_pretty(&result)?);
        }
    }

    Ok(())
}