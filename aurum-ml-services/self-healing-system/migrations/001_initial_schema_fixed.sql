-- Initial schema for self-healing system
-- Creates all necessary tables for issues, patches, and validation results

-- Issues table: stores detected code issues
CREATE TABLE IF NOT EXISTS issues (
    id INTEGER PRIMARY KEY,
    file_path TEXT NOT NULL,
    line_number INTEGER,
    column_number INTEGER,
    issue_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    context TEXT,
    rule_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'ignored')),
    metadata TEXT -- JSON string for additional data
);

-- Patches table: stores generated patches for issues
CREATE TABLE IF NOT EXISTS patches (
    id INTEGER PRIMARY KEY,
    issue_id INTEGER NOT NULL,
    patch_content TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence_score REAL NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    breaking_changes BOOLEAN NOT NULL DEFAULT 0,
    security_analysis TEXT,
    performance_impact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'validated', 'failed', 'applied', 'rejected')),
    llm_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
);

-- Validation results table: stores validation outcomes for patches
CREATE TABLE IF NOT EXISTS validation_results (
    id INTEGER PRIMARY KEY,
    patch_id INTEGER NOT NULL,
    validation_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'warning')),
    details TEXT,
    execution_time_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patch_id) REFERENCES patches(id) ON DELETE CASCADE
);

-- Applied patches table: tracks successfully applied patches
CREATE TABLE IF NOT EXISTS applied_patches (
    id INTEGER PRIMARY KEY,
    patch_id INTEGER NOT NULL,
    original_hash TEXT NOT NULL,
    new_hash TEXT NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    rollback_hash TEXT,
    rollback_available BOOLEAN DEFAULT 1,
    FOREIGN KEY (patch_id) REFERENCES patches(id) ON DELETE CASCADE
);

-- Build history table: tracks build attempts and outcomes
CREATE TABLE IF NOT EXISTS build_history (
    id INTEGER PRIMARY KEY,
    commit_hash TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    build_status TEXT NOT NULL CHECK (build_status IN ('success', 'failure', 'cancelled')),
    build_output TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER,
    triggered_by TEXT
);

-- Security scans table: stores security scan results
CREATE TABLE IF NOT EXISTS security_scans (
    id INTEGER PRIMARY KEY,
    patch_id INTEGER,
    scan_type TEXT NOT NULL,
    findings TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patch_id) REFERENCES patches(id) ON DELETE CASCADE
);

-- Performance metrics table: stores performance measurements
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INTEGER PRIMARY KEY,
    patch_id INTEGER,
    metric_name TEXT NOT NULL,
    baseline_value REAL,
    new_value REAL,
    change_percent REAL,
    unit TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patch_id) REFERENCES patches(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_issues_file_path ON issues(file_path);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);

CREATE INDEX IF NOT EXISTS idx_patches_issue_id ON patches(issue_id);
CREATE INDEX IF NOT EXISTS idx_patches_status ON patches(status);
CREATE INDEX IF NOT EXISTS idx_patches_confidence ON patches(confidence_score);
CREATE INDEX IF NOT EXISTS idx_patches_created_at ON patches(created_at);

CREATE INDEX IF NOT EXISTS idx_validation_results_patch_id ON validation_results(patch_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_status ON validation_results(status);

CREATE INDEX IF NOT EXISTS idx_applied_patches_patch_id ON applied_patches(patch_id);
CREATE INDEX IF NOT EXISTS idx_applied_patches_applied_at ON applied_patches(applied_at);

CREATE INDEX IF NOT EXISTS idx_build_history_commit_hash ON build_history(commit_hash);
CREATE INDEX IF NOT EXISTS idx_build_history_branch_name ON build_history(branch_name);
CREATE INDEX IF NOT EXISTS idx_build_history_created_at ON build_history(created_at);

CREATE INDEX IF NOT EXISTS idx_security_scans_patch_id ON security_scans(patch_id);
CREATE INDEX IF NOT EXISTS idx_security_scans_severity ON security_scans(severity);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_patch_id ON performance_metrics(patch_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON performance_metrics(metric_name);

-- Views for common queries
CREATE VIEW IF NOT EXISTS issue_summary AS
SELECT 
    i.id,
    i.file_path,
    i.issue_type,
    i.severity,
    i.status,
    COUNT(p.id) as patch_count,
    MAX(p.confidence_score) as best_confidence,
    i.created_at
FROM issues i
LEFT JOIN patches p ON i.id = p.issue_id
GROUP BY i.id;

CREATE VIEW IF NOT EXISTS patch_validation_summary AS
SELECT 
    p.id,
    p.issue_id,
    p.confidence_score,
    p.status,
    COUNT(v.id) as validation_count,
    SUM(CASE WHEN v.status = 'passed' THEN 1 ELSE 0 END) as passed_validations,
    SUM(CASE WHEN v.status = 'failed' THEN 1 ELSE 0 END) as failed_validations,
    p.created_at
FROM patches p
LEFT JOIN validation_results v ON p.id = v.patch_id
GROUP BY p.id;