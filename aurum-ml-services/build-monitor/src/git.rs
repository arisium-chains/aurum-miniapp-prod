use crate::config::GitConfig;
use crate::models::{CommitInfo, BuildStatus};
use git2::{Repository, Commit, Oid, DiffOptions};
use std::path::Path;
use std::collections::HashSet;
use tracing::{info, error, debug};

pub struct GitManager {
    repo: Repository,
    config: GitConfig,
}

impl GitManager {
    pub async fn new(config: GitConfig) -> Result<Self, anyhow::Error> {
        let repo_path = Path::new(&config.repository_path);
        
        if !repo_path.exists() {
            return Err(anyhow::anyhow!("Repository path does not exist: {:?}", repo_path));
        }
        
        let repo = Repository::open(repo_path)?;
        
        info!("Successfully opened Git repository at: {:?}", repo_path);
        
        Ok(Self { repo, config })
    }

    pub async fn get_latest_commit(&self) -> Result<String, anyhow::Error> {
        let head = self.repo.head()?;
        let commit = head.peel_to_commit()?;
        Ok(commit.id().to_string())
    }

    pub async fn get_commit_info(&self, commit_hash: &str) -> Result<CommitInfo, anyhow::Error> {
        let oid = Oid::from_str(commit_hash)?;
        let commit = self.repo.find_commit(oid)?;
        
        let author = commit.author();
        let message = commit.message().unwrap_or("").to_string();
        
        let mut files_changed = Vec::new();
        
        if let Ok(parent) = commit.parent(0) {
            let diff = self.repo.diff_tree_to_tree(
                Some(&parent.tree()?),
                Some(&commit.tree()?),
                None
            )?;
            
            for delta in diff.deltas() {
                if let Some(path) = delta.new_file().path() {
                    files_changed.push(path.to_string_lossy().to_string());
                }
            }
        }
        
        Ok(CommitInfo {
            hash: commit.id().to_string(),
            message,
            author: author.name().unwrap_or("Unknown").to_string(),
            timestamp: DateTime::from_timestamp(commit.time().seconds(), 0)
                .unwrap_or_else(|| DateTime::from_timestamp(0, 0).unwrap()),
            files_changed,
        })
    }

    pub async fn get_commits_between(
        &self,
        from_commit: &str,
        to_commit: &str,
    ) -> Result<Vec<CommitInfo>, anyhow::Error> {
        let from_oid = Oid::from_str(from_commit)?;
        let to_oid = Oid::from_str(to_commit)?;
        
        let from_commit = self.repo.find_commit(from_oid)?;
        let to_commit = self.repo.find_commit(to_oid)?;
        
        let mut commits = Vec::new();
        let mut revwalk = self.repo.revwalk()?;
        
        revwalk.push(to_oid)?;
        revwalk.hide(from_oid)?;
        
        for oid in revwalk {
            let oid = oid?;
            let commit = self.repo.find_commit(oid)?;
            let info = self.get_commit_info(&commit.id().to_string()).await?;
            commits.push(info);
        }
        
        Ok(commits)
    }

    pub async fn isolate_failing_commit(
        &self,
        service_name: &str,
        good_commit: &str,
        bad_commit: &str,
    ) -> Result<Option<String>, anyhow::Error> {
        info!("Starting advanced binary search to isolate failing commit for service: {}", service_name);
        
        let good_oid = Oid::from_str(good_commit)?;
        let bad_oid = Oid::from_str(bad_commit)?;
        
        // Get all commits between good and bad
        let mut commits = Vec::new();
        let mut revwalk = self.repo.revwalk()?;
        revwalk.push(bad_oid)?;
        revwalk.hide(good_oid)?;
        
        for oid in revwalk {
            commits.push(oid?);
        }
        
        if commits.is_empty() {
            return Ok(None);
        }
        
        // Advanced bisect with multiple strategies
        self.advanced_bisect(service_name, &commits).await
    }
    
    async fn advanced_bisect(
        &self,
        service_name: &str,
        commits: &[Oid],
    ) -> Result<Option<String>, anyhow::Error> {
        // Strategy 1: Weighted bisect based on commit complexity
        let weighted_commits = self.calculate_commit_weights(service_name, commits).await?;
        
        // Strategy 2: Service-specific bisect with dependency analysis
        let service_commits = self.filter_service_commits(service_name, &weighted_commits).await?;
        
        if service_commits.is_empty() {
            return Ok(None);
        }
        
        // Strategy 3: Parallel bisect with caching
        let result = self.parallel_bisect(service_name, &service_commits).await?;
        
        Ok(result)
    }
    
    async fn calculate_commit_weights(
        &self,
        service_name: &str,
        commits: &[Oid],
    ) -> Result<Vec<(Oid, f64)>, anyhow::Error> {
        let mut weighted_commits = Vec::new();
        
        for &oid in commits {
            let commit = self.repo.find_commit(oid)?;
            let weight = self.calculate_commit_complexity(&commit, service_name).await?;
            weighted_commits.push((oid, weight));
        }
        
        // Sort by weight (descending) to prioritize complex commits
        weighted_commits.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        Ok(weighted_commits)
    }
    
    async fn calculate_commit_complexity(
        &self,
        commit: &Commit,
        service_name: &str,
    ) -> Result<f64, anyhow::Error> {
        let mut complexity = 0.0;
        
        // Factor 1: Number of files changed
        if let Ok(parent) = commit.parent(0) {
            let diff = self.repo.diff_tree_to_tree(
                Some(&parent.tree()?),
                Some(&commit.tree()?),
                None
            )?;
            
            let file_count = diff.deltas().count() as f64;
            complexity += file_count * 0.5;
            
            // Factor 2: Lines of code changed
            let mut total_lines = 0;
            for delta in diff.deltas() {
                if let Some(new_file) = delta.new_file() {
                    if let Some(path) = new_file.path() {
                        if path.to_string_lossy().contains(service_name) {
                            total_lines += 1;
                        }
                    }
                }
            }
            complexity += total_lines as f64 * 2.0;
        }
        
        // Factor 3: Commit message length and keywords
        let message = commit.message().unwrap_or("");
        complexity += message.len() as f64 * 0.01;
        
        if message.contains("fix") || message.contains("bug") {
            complexity += 5.0;
        }
        if message.contains("feature") || message.contains("feat") {
            complexity += 3.0;
        }
        
        Ok(complexity)
    }
    
    async fn filter_service_commits(
        &self,
        service_name: &str,
        weighted_commits: &[(Oid, f64)],
    ) -> Result<Vec<Oid>, anyhow::Error> {
        let mut filtered = Vec::new();
        
        for &(oid, _) in weighted_commits {
            if self.check_service_affected(service_name, &oid.to_string()).await? {
                filtered.push(oid);
            }
        }
        
        Ok(filtered)
    }
    
    async fn parallel_bisect(
        &self,
        service_name: &str,
        commits: &[Oid],
    ) -> Result<Option<String>, anyhow::Error> {
        if commits.is_empty() {
            return Ok(None);
        }
        
        let mut left = 0;
        let mut right = commits.len() - 1;
        
        // Cache for build results
        let mut build_cache = std::collections::HashMap::new();
        
        while left < right {
            let mid = left + (right - left) / 2;
            let mid_commit = commits[mid];
            
            // Check cache first
            let test_result = if let Some(&cached) = build_cache.get(&mid_commit.to_string()) {
                cached
            } else {
                let result = self.test_build_at_commit(service_name, &mid_commit.to_string()).await?;
                build_cache.insert(mid_commit.to_string(), result);
                result
            };
            
            match test_result {
                BuildStatus::Success => {
                    left = mid + 1;
                }
                BuildStatus::Failure => {
                    right = mid;
                }
                _ => {
                    left = mid + 1;
                }
            }
        }
        
        if left < commits.len() {
            Ok(Some(commits[left].to_string()))
        } else {
            Ok(None)
        }
    }

    async fn test_build_at_commit(
        &self,
        service_name: &str,
        commit_hash: &str,
    ) -> Result<BuildStatus, anyhow::Error> {
        use std::process::Command;
        use std::env;
        
        info!("Testing build for service {} at commit {}", service_name, commit_hash);
        
        // Save current directory
        let original_dir = env::current_dir()?;
        
        // Checkout the specific commit
        let oid = Oid::from_str(commit_hash)?;
        let commit = self.repo.find_commit(oid)?;
        
        // Create a temporary branch for testing
        let branch_name = format!("test-{}-{}", service_name, commit_hash);
        
        // Change to repository directory
        let repo_path = Path::new(&self.config.repository_path);
        env::set_current_dir(repo_path)?;
        
        // Create and checkout temporary branch
        let checkout_result = Command::new("git")
            .args(&["checkout", "-b", &branch_name, commit_hash])
            .output();
        
        if let Err(e) = checkout_result {
            env::set_current_dir(&original_dir)?;
            return Err(anyhow::anyhow!("Failed to checkout commit: {}", e));
        }
        
        // Determine service directory
        let service_dir = match service_name {
            "face-detection" => "face-detection",
            "face-embedding" => "face-embedding",
            "common" => "common",
            _ => service_name,
        };
        
        // Run build test based on service type
        let build_status = if Path::new(&format!("{}/Cargo.toml", service_dir)).exists() {
            // Rust service
            self.test_rust_build(service_dir).await?
        } else if Path::new(&format!("{}/package.json", service_dir)).exists() {
            // Node.js service
            self.test_node_build(service_dir).await?
        } else if Path::new(&format!("{}/Dockerfile", service_dir)).exists() {
            // Docker-based service
            self.test_docker_build(service_dir).await?
        } else {
            BuildStatus::Failure
        };
        
        // Cleanup: return to original branch
        let _ = Command::new("git")
            .args(&["checkout", "main"])
            .output();
        
        let _ = Command::new("git")
            .args(&["branch", "-D", &branch_name])
            .output();
        
        // Restore original directory
        env::set_current_dir(&original_dir)?;
        
        info!("Build test completed for {} at {}: {:?}", service_name, commit_hash, build_status);
        Ok(build_status)
    }
    
    async fn test_rust_build(&self, service_dir: &str) -> Result<BuildStatus, anyhow::Error> {
        use std::process::Command;
        
        let build_output = Command::new("cargo")
            .args(&["build", "--release"])
            .current_dir(service_dir)
            .output()?;
        
        if build_output.status.success() {
            // Run tests
            let test_output = Command::new("cargo")
                .args(&["test"])
                .current_dir(service_dir)
                .output()?;
            
            if test_output.status.success() {
                Ok(BuildStatus::Success)
            } else {
                Ok(BuildStatus::Failure)
            }
        } else {
            Ok(BuildStatus::Failure)
        }
    }
    
    async fn test_node_build(&self, service_dir: &str) -> Result<BuildStatus, anyhow::Error> {
        use std::process::Command;
        
        // Install dependencies
        let install_output = Command::new("npm")
            .args(&["install"])
            .current_dir(service_dir)
            .output()?;
        
        if !install_output.status.success() {
            return Ok(BuildStatus::Failure);
        }
        
        // Run build
        let build_output = Command::new("npm")
            .args(&["run", "build"])
            .current_dir(service_dir)
            .output()?;
        
        if build_output.status.success() {
            // Run tests if available
            let test_output = Command::new("npm")
                .args(&["test"])
                .current_dir(service_dir)
                .output();
            
            match test_output {
                Ok(output) if output.status.success() => Ok(BuildStatus::Success),
                Ok(_) => Ok(BuildStatus::Failure),
                Err(_) => Ok(BuildStatus::Success), // No tests defined
            }
        } else {
            Ok(BuildStatus::Failure)
        }
    }
    
    async fn test_docker_build(&self, service_dir: &str) -> Result<BuildStatus, anyhow::Error> {
        use std::process::Command;
        
        let image_name = format!("test-{}:latest", service_dir);
        
        let build_output = Command::new("docker")
            .args(&["build", "-t", &image_name, "."])
            .current_dir(service_dir)
            .output()?;
        
        if build_output.status.success() {
            // Cleanup test image
            let _ = Command::new("docker")
                .args(&["rmi", &image_name])
                .output();
            
            Ok(BuildStatus::Success)
        } else {
            Ok(BuildStatus::Failure)
        }
    }

    pub async fn check_service_affected(
        &self,
        service_name: &str,
        commit_hash: &str,
    ) -> Result<bool, anyhow::Error> {
        let oid = Oid::from_str(commit_hash)?;
        let commit = self.repo.find_commit(oid)?;
        
        let service_patterns = self.get_service_patterns(service_name)?;
        
        if let Ok(parent) = commit.parent(0) {
            let diff = self.repo.diff_tree_to_tree(
                Some(&parent.tree()?),
                Some(&commit.tree()?),
                None
            )?;
            
            let mut affected_files = HashSet::new();
            
            for delta in diff.deltas() {
                if let Some(path) = delta.new_file().path() {
                    affected_files.insert(path.to_string_lossy().to_string());
                }
                if let Some(path) = delta.old_file().path() {
                    affected_files.insert(path.to_string_lossy().to_string());
                }
            }
            
            // Check if any affected files match service patterns
            for pattern in service_patterns {
                for file in &affected_files {
                    if file.contains(&pattern) {
                        return Ok(true);
                    }
                }
            }
        }
        
        Ok(false)
    }

    fn get_service_patterns(&self, service_name: &str) -> Result<Vec<String>, anyhow::Error> {
        // Define patterns for each service
        let patterns = match service_name {
            "face-detection" => vec![
                "face-detection".to_string(),
                "common".to_string(),
                "Cargo.toml".to_string(),
            ],
            "face-embedding" => vec![
                "face-embedding".to_string(),
                "common".to_string(),
                "Cargo.toml".to_string(),
            ],
            "common" => vec![
                "common".to_string(),
                "Cargo.toml".to_string(),
            ],
            _ => vec![service_name.to_string()],
        };
        
        Ok(patterns)
    }

    pub async fn get_branch_commits(
        &self,
        branch: &str,
        limit: usize,
    ) -> Result<Vec<CommitInfo>, anyhow::Error> {
        let branch_ref = format!("refs/heads/{}", branch);
        let reference = self.repo.find_reference(&branch_ref)?;
        let oid = reference.target().ok_or_else(|| anyhow::anyhow!("Branch has no target"))?;
        
        let mut commits = Vec::new();
        let mut revwalk = self.repo.revwalk()?;
        revwalk.push(oid)?;
        revwalk.set_sorting(git2::Sort::TIME)?;
        
        for (i, oid) in revwalk.enumerate() {
            if i >= limit {
                break;
            }
            
            let oid = oid?;
            let info = self.get_commit_info(&oid.to_string()).await?;
            commits.push(info);
        }
        
        Ok(commits)
    }

    pub async fn create_branch(
        &self,
        branch_name: &str,
        commit_hash: &str,
    ) -> Result<(), anyhow::Error> {
        let oid = Oid::from_str(commit_hash)?;
        let commit = self.repo.find_commit(oid)?;
        
        self.repo.branch(branch_name, &commit, false)?;
        
        info!("Created branch {} at commit {}", branch_name, commit_hash);
        Ok(())
    }

    pub async fn checkout_commit(
        &self,
        commit_hash: &str,
    ) -> Result<(), anyhow::Error> {
        let oid = Oid::from_str(commit_hash)?;
        let commit