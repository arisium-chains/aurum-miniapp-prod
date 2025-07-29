use git2::{Repository, Oid, Signature, IndexAddOption, ResetType};
use std::path::{Path, PathBuf};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum GitError {
    #[error("Git operation failed: {0}")]
    GitError(#[from] git2::Error),
    #[error("Path error: {0}")]
    PathError(String),
    #[error("Branch operation failed: {0}")]
    BranchError(String),
    #[error("Merge conflict detected")]
    MergeConflict,
    #[error("Invalid repository state")]
    InvalidState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommit {
    pub hash: String,
    pub message: String,
    pub author: String,
    pub email: String,
    pub timestamp: DateTime<Utc>,
    pub files_changed: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BranchInfo {
    pub name: String,
    pub is_current: bool,
    pub commit_hash: String,
    pub ahead: usize,
    pub behind: usize,
}

#[derive(Debug, Clone)]
pub struct GitOperations {
    repo: Repository,
    repo_path: PathBuf,
}

impl GitOperations {
    /// Create a new GitOperations instance for the given repository path
    pub fn new(repo_path: impl AsRef<Path>) -> Result<Self, GitError> {
        let repo = Repository::open(&repo_path)?;
        Ok(Self {
            repo,
            repo_path: repo_path.as_ref().to_path_buf(),
        })
    }

    /// Initialize a new Git repository if it doesn't exist
    pub fn init(repo_path: impl AsRef<Path>) -> Result<Self, GitError> {
        let repo = match Repository::open(&repo_path) {
            Ok(repo) => repo,
            Err(_) => Repository::init(&repo_path)?,
        };
        
        Ok(Self {
            repo,
            repo_path: repo_path.as_ref().to_path_buf(),
        })
    }

    /// Get the current branch name
    pub fn current_branch(&self) -> Result<String, GitError> {
        let head = self.repo.head()?;
        if let Some(name) = head.shorthand() {
            Ok(name.to_string())
        } else {
            Err(GitError::InvalidState)
        }
    }

    /// Create a new branch for patch application
    pub fn create_patch_branch(&self, issue_id: u64, patch_id: u64) -> Result<String, GitError> {
        let branch_name = format!("self-heal/issue-{}/patch-{}", issue_id, patch_id);
        
        // Check if branch already exists
        if self.branch_exists(&branch_name)? {
            return Ok(branch_name);
        }

        let head = self.repo.head()?;
        let commit = head.peel_to_commit()?;
        
        self.repo.branch(&branch_name, &commit, false)?;
        
        Ok(branch_name)
    }

    /// Check if a branch exists
    pub fn branch_exists(&self, branch_name: &str) -> Result<bool, GitError> {
        let branches = self.repo.branches(None)?;
        for branch_result in branches {
            let (branch, _) = branch_result?;
            if let Some(name) = branch.name()? {
                if name == branch_name {
                    return Ok(true);
                }
            }
        }
        Ok(false)
    }

    /// Switch to a specific branch
    pub fn checkout_branch(&self, branch_name: &str) -> Result<(), GitError> {
        let (object, reference) = self.repo.revparse_ext(branch_name)?;
        self.repo.checkout_tree(&object, None)?;
        
        if let Some(reference) = reference {
            self.repo.set_head(reference.name().ok_or_else(|| {
                GitError::BranchError("Invalid reference name".to_string())
            })?)?;
        } else {
            self.repo.set_head_detached(object.id())?;
        }
        
        Ok(())
    }

    /// Create a new commit with the given changes
    pub fn commit_changes(
        &self,
        message: &str,
        files: &[&str],
        author_name: &str,
        author_email: &str,
    ) -> Result<Oid, GitError> {
        let signature = Signature::now(author_name, author_email)?;
        
        let mut index = self.repo.index()?;
        for file in files {
            index.add_path(Path::new(file))?;
        }
        
        let tree_id = index.write_tree()?;
        let tree = self.repo.find_tree(tree_id)?;
        
        let head = self.repo.head()?;
        let parent_commit = head.peel_to_commit()?;
        
        let commit_id = self.repo.commit(
            Some("HEAD"),
            &signature,
            &signature,
            message,
            &tree,
            &[&parent_commit],
        )?;
        
        Ok(commit_id)
    }

    /// Apply a patch to the working directory
    pub fn apply_patch(&self, patch_content: &str) -> Result<(), GitError> {
        // Create a temporary patch file
        let patch_path = self.repo_path.join("temp_patch.patch");
        std::fs::write(&patch_path, patch_content)?;
        
        // Apply the patch
        let output = std::process::Command::new("git")
            .arg("apply")
            .arg("--3way")
            .arg(&patch_path)
            .current_dir(&self.repo_path)
            .output()?;
        
        std::fs::remove_file(patch_path)?;
        
        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(GitError::BranchError(format!("Failed to apply patch: {}", error)));
        }
        
        Ok(())
    }

    /// Get the diff between working directory and HEAD
    pub fn get_diff(&self) -> Result<String, GitError> {
        let output = std::process::Command::new("git")
            .arg("diff")
            .arg("HEAD")
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }

    /// Get commit history
    pub fn get_commit_history(&self, limit: usize) -> Result<Vec<GitCommit>, GitError> {
        let mut revwalk = self.repo.revwalk()?;
        revwalk.push_head()?;
        
        let mut commits = Vec::new();
        let mut count = 0;
        
        for oid_result in revwalk {
            if count >= limit {
                break;
            }
            
            let oid = oid_result?;
            let commit = self.repo.find_commit(oid)?;
            
            let files_changed = self.get_files_changed_in_commit(&commit)?;
            
            let git_commit = GitCommit {
                hash: oid.to_string(),
                message: commit.message().unwrap_or("").to_string(),
                author: commit.author().name().unwrap_or("").to_string(),
                email: commit.author().email().unwrap_or("").to_string(),
                timestamp: DateTime::from_timestamp(commit.time().seconds(), 0)
                    .unwrap_or_else(|| DateTime::from_timestamp(0, 0).unwrap()),
                files_changed,
            };
            
            commits.push(git_commit);
            count += 1;
        }
        
        Ok(commits)
    }

    /// Get files changed in a specific commit
    fn get_files_changed_in_commit(&self, commit: &git2::Commit) -> Result<Vec<String>, GitError> {
        let mut files = Vec::new();
        
        let tree = commit.tree()?;
        let parent = commit.parent(0)?;
        let parent_tree = parent.tree()?;
        
        let diff = self.repo.diff_tree_to_tree(
            Some(&parent_tree),
            Some(&tree),
            None,
        )?;
        
        for delta in diff.deltas() {
            if let Some(path) = delta.new_file().path() {
                files.push(path.to_string_lossy().to_string());
            }
        }
        
        Ok(files)
    }

    /// Get all branches
    pub fn get_branches(&self) -> Result<Vec<BranchInfo>, GitError> {
        let branches = self.repo.branches(None)?;
        let current_branch = self.current_branch()?;
        
        let mut branch_info = Vec::new();
        
        for branch_result in branches {
            let (branch, branch_type) = branch_result?;
            
            if branch_type != git2::BranchType::Local {
                continue;
            }
            
            let name = branch.name()?.unwrap_or("").to_string();
            let reference = branch.get();
            let commit = reference.peel_to_commit()?;
            
            let (ahead, behind) = self.get_ahead_behind(&name)?;
            
            branch_info.push(BranchInfo {
                name: name.clone(),
                is_current: name == current_branch,
                commit_hash: commit.id().to_string(),
                ahead,
                behind,
            });
        }
        
        Ok(branch_info)
    }

    /// Get ahead/behind count for a branch relative to upstream
    fn get_ahead_behind(&self, branch_name: &str) -> Result<(usize, usize), GitError> {
        let branch = self.repo.find_branch(branch_name, git2::BranchType::Local)?;
        let upstream = branch.upstream();
        
        match upstream {
            Ok(upstream) => {
                let local_oid = branch.get().target().unwrap_or(Oid::zero());
                let upstream_oid = upstream.get().target().unwrap_or(Oid::zero());
                
                let (ahead, behind) = self.repo.graph_ahead_behind(local_oid, upstream_oid)?;
                Ok((ahead as usize, behind as usize))
            }
            Err(_) => Ok((0, 0)),
        }
    }

    /// Reset the repository to a specific commit
    pub fn reset_to_commit(&self, commit_hash: &str, hard: bool) -> Result<(), GitError> {
        let oid = Oid::from_str(commit_hash)?;
        let object = self.repo.find_object(oid, None)?;
        
        let reset_type = if hard {
            ResetType::Hard
        } else {
            ResetType::Soft
        };
        
        self.repo.reset(&object, reset_type, None)?;
        Ok(())
    }

    /// Get the current HEAD commit hash
    pub fn get_head_hash(&self) -> Result<String, GitError> {
        let head = self.repo.head()?;
        Ok(head.target().unwrap_or(Oid::zero()).to_string())
    }

    /// Check if the working directory is clean
    pub fn is_working_directory_clean(&self) -> Result<bool, GitError> {
        let status = self.repo.statuses(None)?;
        Ok(status.is_empty())
    }

    /// Get repository status
    pub fn get_status(&self) -> Result<HashMap<String, String>, GitError> {
        let statuses = self.repo.statuses(None)?;
        let mut status_map = HashMap::new();
        
        for entry in statuses.iter() {
            let path = entry.path().unwrap_or("").to_string();
            let status = format!("{:?}", entry.status());
            status_map.insert(path, status);
        }
        
        Ok(status_map)
    }

    /// Create a backup branch before applying patches
    pub fn create_backup_branch(&self, base_branch: &str) -> Result<String, GitError> {
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
        let backup_name = format!("backup/{}/{}", base_branch, timestamp);
        
        self.checkout_branch(base_branch)?;
        
        let head = self.repo.head()?;
        let commit = head.peel_to_commit()?;
        
        self.repo.branch(&backup_name, &commit, false)?;
        
        Ok(backup_name)
    }

    /// Cherry-pick a commit from another branch
    pub fn cherry_pick(&self, commit_hash: &str) -> Result<(), GitError> {
        let oid = Oid::from_str(commit_hash)?;
        let commit = self.repo.find_commit(oid)?;
        
        let mut cherrypick = self.repo.cherry_pick_commit(&commit, None, None)?;
        
        if cherrypick.is_conflicted() {
            return Err(GitError::MergeConflict);
        }
        
        let tree_id = cherrypick.write_tree()?;
        let tree = self.repo.find_tree(tree_id)?;
        
        let head = self.repo.head()?;
        let parent_commit = head.peel_to_commit()?;
        
        let signature = self.repo.signature()?;
        self.repo.commit(
            Some("HEAD"),
            &signature,
            &signature,
            &format!("Cherry-pick: {}", commit.message().unwrap_or("")),
            &tree,
            &[&parent_commit],
        )?;
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_git_operations() {
        let temp_dir = tempdir().unwrap();
        let git_ops = GitOperations::init(temp_dir.path()).unwrap();
        
        // Test current branch
        let branch = git_ops.current_branch().unwrap();
        assert_eq!(branch, "main");
        
        // Test branch creation
        let new_branch = git_ops.create_patch_branch(1, 1).unwrap();
        assert!(new_branch.contains("self-heal/issue-1/patch-1"));
        
        // Test branch existence
        assert!(git_ops.branch_exists(&new_branch).unwrap());
    }
}