use anyhow::{Result, Context};
use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Issue {
    pub id: String,
    pub file_path: String,
    pub line_number: Option<i32>,
    pub issue_type: String,
    pub severity: IssueSeverity,
    pub description: String,
    pub context: Option<String>,
    pub suggested_fix: Option<String>,
    pub status: IssueStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "TEXT")]
pub enum IssueSeverity {
    Critical,
    High,
    Medium,
    Low,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "TEXT")]
pub enum IssueStatus {
    Open,
    InProgress,
    Resolved,
    Rejected,
    Duplicate,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Patch {
    pub id: String,
    pub issue_id: String,
    pub patch_content: String,
    pub description: String,
    pub confidence_score: f64,
    pub safety_score: f64,
    pub breaking_changes: bool,
    pub dependencies_affected: Option<serde_json::Value>,
    pub validation_status: ValidationStatus,
    pub validation_results: Option<serde_json::Value>,
    pub applied: bool,
    pub applied_at: Option<DateTime<Utc>>,
    pub rollback_patch: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "TEXT")]
pub enum ValidationStatus {
    Pending,
    Running,
    Success,
    Failed,
    Warning,
}

#[derive(Debug, Clone)]
pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(database_url)
            .await
            .context("Failed to connect to database")?;
        
        let db = Self { pool };
        db.migrate().await?;
        
        Ok(db)
    }

    async fn migrate(&self) -> Result<()> {
        sqlx::migrate!("./migrations")
            .run(&self.pool)
            .await
            .context("Failed to run migrations")?;
        
        Ok(())
    }

    pub async fn create_issue(&self, issue: Issue) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO issues (
                id, file_path, line_number, issue_type, severity, description,
                context, suggested_fix, status, created_at, updated_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            issue.id,
            issue.file_path,
            issue.line_number,
            issue.issue_type,
            issue.severity as IssueSeverity,
            issue.description,
            issue.context,
            issue.suggested_fix,
            issue.status as IssueStatus,
            issue.created_at,
            issue.updated_at,
            issue.metadata
        )
        .execute(&self.pool)
        .await
        .context("Failed to create issue")?;
        
        Ok(())
    }

    pub async fn get_issue(&self, id: &str) -> Result<Option<Issue>> {
        let issue = sqlx::query_as!(
            Issue,
            r#"
            SELECT id, file_path, line_number, issue_type as "issue_type: IssueSeverity",
                   severity as "severity: IssueSeverity", description, context,
                   suggested_fix, status as "status: IssueStatus", created_at,
                   updated_at, resolved_at, metadata
            FROM issues
            WHERE id = ?
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch issue")?;
        
        Ok(issue)
    }

    pub async fn get_issues_by_status(&self, status: IssueStatus) -> Result<Vec<Issue>> {
        let issues = sqlx::query_as!(
            Issue,
            r#"
            SELECT id, file_path, line_number, issue_type as "issue_type: IssueSeverity",
                   severity as "severity: IssueSeverity", description, context,
                   suggested_fix, status as "status: IssueStatus", created_at,
                   updated_at, resolved_at, metadata
            FROM issues
            WHERE status = ?
            ORDER BY created_at DESC
            "#,
            status as IssueStatus
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to fetch issues by status")?;
        
        Ok(issues)
    }

    pub async fn update_issue_status(&self, id: &str, status: IssueStatus) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE issues
            SET status = ?, updated_at = ?
            WHERE id = ?
            "#,
            status as IssueStatus,
            Utc::now(),
            id
        )
        .execute(&self.pool)
        .await
        .context("Failed to update issue status")?;
        
        Ok(())
    }

    pub async fn resolve_issue(&self, id: &str) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE issues
            SET status = 'Resolved', resolved_at = ?, updated_at = ?
            WHERE id = ?
            "#,
            Utc::now(),
            Utc::now(),
            id
        )
        .execute(&self.pool)
        .await
        .context("Failed to resolve issue")?;
        
        Ok(())
    }

    pub async fn create_patch(&self, patch: Patch) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO patches (
                id, issue_id, patch_content, description, confidence_score,
                safety_score, breaking_changes, dependencies_affected,
                validation_status, validation_results, applied, applied_at,
                rollback_patch, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            patch.id,
            patch.issue_id,
            patch.patch_content,
            patch.description,
            patch.confidence_score,
            patch.safety_score,
            patch.breaking_changes,
            patch.dependencies_affected,
            patch.validation_status as ValidationStatus,
            patch.validation_results,
            patch.applied,
            patch.applied_at,
            patch.rollback_patch,
            patch.created_at,
            patch.updated_at
        )
        .execute(&self.pool)
        .await
        .context("Failed to create patch")?;
        
        Ok(())
    }

    pub async fn get_patch(&self, id: &str) -> Result<Option<Patch>> {
        let patch = sqlx::query_as!(
            Patch,
            r#"
            SELECT id, issue_id, patch_content, description, confidence_score,
                   safety_score, breaking_changes, dependencies_affected,
                   validation_status as "validation_status: ValidationStatus",
                   validation_results, applied, applied_at, rollback_patch,
                   created_at, updated_at
            FROM patches
            WHERE id = ?
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch patch")?;
        
        Ok(patch)
    }

    pub async fn get_patches_for_issue(&self, issue_id: &str) -> Result<Vec<Patch>> {
        let patches = sqlx::query_as!(
            Patch,
            r#"
            SELECT id, issue_id, patch_content, description, confidence_score,
                   safety_score, breaking_changes, dependencies_affected,
                   validation_status as "validation_status: ValidationStatus",
                   validation_results, applied, applied_at, rollback_patch,
                   created_at, updated_at
            FROM patches
            WHERE issue_id = ?
            ORDER BY confidence_score DESC, created_at ASC
            "#,
            issue_id
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to fetch patches for issue")?;
        
        Ok(patches)
    }

    pub async fn update_patch_validation(&self, id: &str, status: ValidationStatus, results: Option<serde_json::Value>) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE patches
            SET validation_status = ?, validation_results = ?, updated_at = ?
            WHERE id = ?
            "#,
            status as ValidationStatus,
            results,
            Utc::now(),
            id
        )
        .execute(&self.pool)
        .await
        .context("Failed to update patch validation")?;
        
        Ok(())
    }

    pub async fn mark_patch_applied(&self, id: &str, rollback_patch: Option<String>) -> Result<()> {
        sqlx::query!(
            r#"
            UPDATE patches
            SET applied = true, applied_at = ?, rollback_patch = ?, updated_at = ?
            WHERE id = ?
            "#,
            Utc::now(),
            rollback_patch,
            Utc::now(),
            id
        )
        .execute(&self.pool)
        .await
        .context("Failed to mark patch as applied")?;
        
        Ok(())
    }

    pub async fn get_statistics(&self) -> Result<DatabaseStats> {
        let stats = sqlx::query_as!(
            DatabaseStats,
            r#"
            SELECT
                (SELECT COUNT(*) FROM issues) as total_issues,
                (SELECT COUNT(*) FROM issues WHERE status = 'Open') as open_issues,
                (SELECT COUNT(*) FROM issues WHERE status = 'Resolved') as resolved_issues,
                (SELECT COUNT(*) FROM patches) as total_patches,
                (SELECT COUNT(*) FROM patches WHERE applied = true) as applied_patches,
                (SELECT COUNT(*) FROM patches WHERE validation_status = 'Success') as successful_validations,
                (SELECT AVG(confidence_score) FROM patches) as avg_confidence_score,
                (SELECT AVG(safety_score) FROM patches) as avg_safety_score
            "#
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to fetch statistics")?;
        
        Ok(stats)
    }

    pub async fn search_issues(&self, query: &str) -> Result<Vec<Issue>> {
        let search_pattern = format!("%{}%", query);
        
        let issues = sqlx::query_as!(
            Issue,
            r#"
            SELECT id, file_path, line_number, issue_type as "issue_type: IssueSeverity",
                   severity as "severity: IssueSeverity", description, context,
                   suggested_fix, status as "status: IssueStatus", created_at,
                   updated_at, resolved_at, metadata
            FROM issues
            WHERE file_path LIKE ? OR description LIKE ? OR issue_type LIKE ?
            ORDER BY created_at DESC
            "#,
            search_pattern,
            search_pattern,
            search_pattern
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to search issues")?;
        
        Ok(issues)
    }

    pub async fn cleanup_old_data(&self, days_to_keep: i64) -> Result<usize> {
        let cutoff_date = Utc::now() - chrono::Duration::days(days_to_keep);
        
        // Delete old resolved issues and their patches
        let result = sqlx::query!(
            r#"
            DELETE FROM issues
            WHERE status = 'Resolved' AND resolved_at < ?
            "#,
            cutoff_date
        )
        .execute(&self.pool)
        .await
        .context("Failed to cleanup old data")?;
        
        Ok(result.rows_affected() as usize)
    }
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct DatabaseStats {
    pub total_issues: i64,
    pub open_issues: i64,
    pub resolved_issues: i64,
    pub total_patches: i64,
    pub applied_patches: i64,
    pub successful_validations: i64,
    pub avg_confidence_score: Option<f64>,
    pub avg_safety_score: Option<f64>,
}

// Database initialization
pub async fn init_database(database_path: &str) -> Result<Database> {
    let database_url = format!("sqlite:{}", database_path);
    
    // Create database directory if it doesn't exist
    if let Some(parent) = Path::new(database_path).parent() {
        std::fs::create_dir_all(parent)?;
    }
    
    Database::new(&database_url).await
}

// SQL migrations
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_database_operations() -> Result<()> {
        let temp_dir = tempdir()?;
        let db_path = temp_dir.path().join("test.db");
        let db = init_database(db_path.to_str().unwrap()).await?;
        
        // Create test issue
        let issue = Issue {
            id: "test-issue-1".to_string(),
            file_path: "src/main.rs".to_string(),
            line_number: Some(42),
            issue_type: "unused_variable".to_string(),
            severity: IssueSeverity::Medium,
            description: "Variable is declared but never used".to_string(),
            context: Some("let x = 5;".to_string()),
            suggested_fix: Some("Remove unused variable".to_string()),
            status: IssueStatus::Open,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            resolved_at: None,
            metadata: None,
        };
        
        db.create_issue(issue.clone()).await?;
        
        // Retrieve issue
        let retrieved = db.get_issue(&issue.id).await?;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().id, issue.id);
        
        // Update status
        db.update_issue_status(&issue.id, IssueStatus::InProgress).await?;
        
        // Create patch
        let patch = Patch {
            id: "test-patch-1".to_string(),
            issue_id: issue.id.clone(),
            patch_content: "diff --git a/src/main.rs b/src/main.rs\nindex 1234567..abcdefg 100644\n--- a/src/main.rs\n+++ b/src/main.rs\n@@ -42 +42 @@\n-let x = 5;\n+".to_string(),
            description: "Remove unused variable x".to_string(),
            confidence_score: 0.95,
            safety_score: 0.99,
            breaking_changes: false,
            dependencies_affected: None,
            validation_status: ValidationStatus::Pending,
            validation_results: None,
            applied: false,
            applied_at: None,
            rollback_patch: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        db.create_patch(patch.clone()).await?;
        
        // Retrieve patches for issue
        let patches = db.get_patches_for_issue(&issue.id).await?;
        assert_eq!(patches.len(), 1);
        assert_eq!(patches[0].id, patch.id);
        
        Ok(())
    }
}