#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

/**
 * @description Enhanced backup manager with rollback capabilities and validation
 */
class BackupManager {
  constructor(options = {}) {
    this.rootDir = process.cwd();
    this.backupDir = path.join(this.rootDir, '.backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.options = {
      compression: options.compression || false,
      verification: options.verification || true,
      maxBackups: options.maxBackups || 10,
      verbose: options.verbose || false,
      ...options
    };
    
    this.operationLog = [];
  }

  async createFullBackup(description = 'Full codebase backup') {
    console.log(chalk.blue('💾 Creating full codebase backup...'));
    
    const backupPath = path.join(this.backupDir, `full-backup-${this.timestamp}`);
    await fs.ensureDir(backupPath);
    
    // Create backup metadata
    const metadata = {
      type: 'full',
      description,
      timestamp: new Date().toISOString(),
      created_by: 'backup-script',
      source_directory: this.rootDir
    };
    
    // Copy all files except ignored patterns
    const ignorePatterns = [
      'node_modules/**',
      '.git/**',
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.turbo/**',
      '.backups/**',
      '**/*.log',
      '**/temp/**',
      '**/tmp/**'
    ];
    
    console.log(chalk.yellow('📁 Copying files...'));
    
    const allFiles = glob.sync('**/*', {
      cwd: this.rootDir,
      ignore: ignorePatterns,
      nodir: true,
      dot: true
    });
    
    let copiedFiles = 0;
    let totalSize = 0;
    
    for (const file of allFiles) {
      const sourcePath = path.join(this.rootDir, file);
      const destPath = path.join(backupPath, file);
      
      try {
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(sourcePath, destPath);
        
        const stats = await fs.stat(sourcePath);
        totalSize += stats.size;
        copiedFiles++;
        
        if (copiedFiles % 100 === 0) {
          console.log(chalk.gray(`  Copied ${copiedFiles} files...`));
        }
      } catch (error) {
        console.log(chalk.red(`  Failed to copy ${file}: ${error.message}`));
      }
    }
    
    metadata.files_count = copiedFiles;
    metadata.total_size = totalSize;
    metadata.total_size_formatted = this.formatBytes(totalSize);
    
    // Save metadata
    await fs.writeJson(path.join(backupPath, 'backup-metadata.json'), metadata, { spaces: 2 });
    
    console.log(chalk.green(`✅ Backup completed!`));
    console.log(chalk.white(`   Location: ${backupPath}`));
    console.log(chalk.white(`   Files: ${copiedFiles}`));
    console.log(chalk.white(`   Size: ${this.formatBytes(totalSize)}`));
    
    return backupPath;
  }

  async createSelectiveBackup(filePaths, description = 'Selective backup') {
    console.log(chalk.blue('💾 Creating selective backup...'));
    
    const backupPath = path.join(this.backupDir, `selective-backup-${this.timestamp}`);
    await fs.ensureDir(backupPath);
    
    const metadata = {
      type: 'selective',
      description,
      timestamp: new Date().toISOString(),
      created_by: 'backup-script',
      source_directory: this.rootDir,
      files: []
    };
    
    let copiedFiles = 0;
    let totalSize = 0;
    
    for (const filePath of filePaths) {
      const sourcePath = path.resolve(this.rootDir, filePath);
      const relativePath = path.relative(this.rootDir, sourcePath);
      const destPath = path.join(backupPath, relativePath);
      
      try {
        if (await fs.pathExists(sourcePath)) {
          await fs.ensureDir(path.dirname(destPath));
          await fs.copy(sourcePath, destPath);
          
          const stats = await fs.stat(sourcePath);
          totalSize += stats.size;
          copiedFiles++;
          
          metadata.files.push({
            path: relativePath,
            size: stats.size,
            modified: stats.mtime
          });
          
          console.log(chalk.gray(`  ✓ ${relativePath}`));
        } else {
          console.log(chalk.yellow(`  ⚠ File not found: ${relativePath}`));
        }
      } catch (error) {
        console.log(chalk.red(`  ✗ Failed to backup ${relativePath}: ${error.message}`));
      }
    }
    
    metadata.files_count = copiedFiles;
    metadata.total_size = totalSize;
    metadata.total_size_formatted = this.formatBytes(totalSize);
    
    // Save metadata
    await fs.writeJson(path.join(backupPath, 'backup-metadata.json'), metadata, { spaces: 2 });
    
    console.log(chalk.green(`✅ Selective backup completed!`));
    console.log(chalk.white(`   Location: ${backupPath}`));
    console.log(chalk.white(`   Files: ${copiedFiles}`));
    console.log(chalk.white(`   Size: ${this.formatBytes(totalSize)}`));
    
    return backupPath;
  }

  async createPreCleanupBackup(analysisReport) {
    console.log(chalk.blue('💾 Creating pre-cleanup backup...'));
    
    const filesToBackup = [];
    
    // Add potentially unused files
    if (analysisReport.unusedFiles) {
      filesToBackup.push(...analysisReport.unusedFiles.map(f => f.path));
    }
    
    // Add duplicate files (keep one of each set)
    if (analysisReport.duplicateFiles) {
      for (const duplicateSet of analysisReport.duplicateFiles) {
        if (duplicateSet.files && duplicateSet.files.length > 1) {
          // Backup all but the first file in each duplicate set
          filesToBackup.push(...duplicateSet.files.slice(1));
        }
      }
    }
    
    // Add outdated documentation
    if (analysisReport.outdatedDocs) {
      for (const doc of analysisReport.outdatedDocs) {
        if (doc.path) {
          filesToBackup.push(doc.path);
        } else if (doc.files) {
          filesToBackup.push(...doc.files);
        }
      }
    }
    
    if (filesToBackup.length === 0) {
      console.log(chalk.yellow('No files identified for backup based on analysis report'));
      return null;
    }
    
    return await this.createSelectiveBackup(
      filesToBackup, 
      'Pre-cleanup backup of files identified for removal or modification'
    );
  }

  async listBackups() {
    console.log(chalk.blue('📋 Available backups:'));
    
    if (!await fs.pathExists(this.backupDir)) {
      console.log(chalk.yellow('No backups found'));
      return [];
    }
    
    const backupDirs = await fs.readdir(this.backupDir);
    const backups = [];
    
    for (const dir of backupDirs) {
      const backupPath = path.join(this.backupDir, dir);
      const metadataPath = path.join(backupPath, 'backup-metadata.json');
      
      if (await fs.pathExists(metadataPath)) {
        try {
          const metadata = await fs.readJson(metadataPath);
          backups.push({
            name: dir,
            path: backupPath,
            ...metadata
          });
        } catch (error) {
          console.log(chalk.red(`Failed to read metadata for ${dir}`));
        }
      }
    }
    
    // Sort by timestamp (newest first)
    backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (backups.length === 0) {
      console.log(chalk.yellow('No valid backups found'));
      return [];
    }
    
    backups.forEach((backup, index) => {
      const date = new Date(backup.timestamp).toLocaleString();
      console.log(chalk.white(`${index + 1}. ${backup.name}`));
      console.log(chalk.gray(`   Type: ${backup.type}`));
      console.log(chalk.gray(`   Created: ${date}`));
      console.log(chalk.gray(`   Description: ${backup.description}`));
      console.log(chalk.gray(`   Files: ${backup.files_count}`));
      console.log(chalk.gray(`   Size: ${backup.total_size_formatted}`));
      console.log('');
    });
    
    return backups;
  }

  async restoreBackup(backupName) {
    console.log(chalk.blue(`🔄 Restoring backup: ${backupName}`));
    
    const backupPath = path.join(this.backupDir, backupName);
    const metadataPath = path.join(backupPath, 'backup-metadata.json');
    
    if (!await fs.pathExists(backupPath)) {
      throw new Error(`Backup not found: ${backupName}`);
    }
    
    if (!await fs.pathExists(metadataPath)) {
      throw new Error(`Backup metadata not found: ${backupName}`);
    }
    
    const metadata = await fs.readJson(metadataPath);
    
    console.log(chalk.yellow('⚠️  This will overwrite existing files!'));
    console.log(chalk.white(`Backup type: ${metadata.type}`));
    console.log(chalk.white(`Created: ${new Date(metadata.timestamp).toLocaleString()}`));
    console.log(chalk.white(`Files: ${metadata.files_count}`));
    
    // In a real implementation, you might want to add a confirmation prompt here
    
    const backupFiles = glob.sync('**/*', {
      cwd: backupPath,
      nodir: true,
      ignore: ['backup-metadata.json']
    });
    
    let restoredFiles = 0;
    
    for (const file of backupFiles) {
      const sourcePath = path.join(backupPath, file);
      const destPath = path.join(this.rootDir, file);
      
      try {
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(sourcePath, destPath);
        restoredFiles++;
        
        if (restoredFiles % 50 === 0) {
          console.log(chalk.gray(`  Restored ${restoredFiles} files...`));
        }
      } catch (error) {
        console.log(chalk.red(`  Failed to restore ${file}: ${error.message}`));
      }
    }
    
    console.log(chalk.green(`✅ Restore completed!`));
    console.log(chalk.white(`   Restored ${restoredFiles} files`));
  }

  async cleanOldBackups(keepCount = 5) {
    console.log(chalk.blue(`🧹 Cleaning old backups (keeping ${keepCount} most recent)...`));
    
    const backups = await this.listBackups();
    
    if (backups.length <= keepCount) {
      console.log(chalk.green('No old backups to clean'));
      return;
    }
    
    const backupsToDelete = backups.slice(keepCount);
    let deletedCount = 0;
    let freedSpace = 0;
    
    for (const backup of backupsToDelete) {
      try {
        await fs.remove(backup.path);
        deletedCount++;
        freedSpace += backup.total_size || 0;
        console.log(chalk.gray(`  Deleted: ${backup.name}`));
      } catch (error) {
        console.log(chalk.red(`  Failed to delete ${backup.name}: ${error.message}`));
      }
    }
    
    console.log(chalk.green(`✅ Cleaned ${deletedCount} old backups`));
    console.log(chalk.white(`   Freed space: ${this.formatBytes(freedSpace)}`));
  }

  /**
   * @description Verify backup integrity
   * @param {string} backupPath - Path to backup to verify
   * @returns {Promise<Object>} Verification results
   */
  async verifyBackup(backupPath) {
    console.log(chalk.blue(`🔍 Verifying backup integrity: ${path.basename(backupPath)}`));
    
    const metadataPath = path.join(backupPath, 'backup-metadata.json');
    
    if (!await fs.pathExists(metadataPath)) {
      throw new Error('Backup metadata not found');
    }
    
    const metadata = await fs.readJson(metadataPath);
    const verification = {
      valid: true,
      errors: [],
      warnings: [],
      fileCount: 0,
      totalSize: 0
    };
    
    const backupFiles = glob.sync('**/*', {
      cwd: backupPath,
      nodir: true,
      ignore: ['backup-metadata.json']
    });
    
    for (const file of backupFiles) {
      const filePath = path.join(backupPath, file);
      
      try {
        const stats = await fs.stat(filePath);
        verification.fileCount++;
        verification.totalSize += stats.size;
      } catch (error) {
        verification.errors.push(`Cannot access file: ${file}`);
        verification.valid = false;
      }
    }
    
    // Check against metadata
    if (metadata.files_count && Math.abs(verification.fileCount - metadata.files_count) > 5) {
      verification.warnings.push(`File count mismatch: expected ${metadata.files_count}, found ${verification.fileCount}`);
    }
    
    if (metadata.total_size && Math.abs(verification.totalSize - metadata.total_size) > (metadata.total_size * 0.1)) {
      verification.warnings.push(`Size mismatch: expected ${this.formatBytes(metadata.total_size)}, found ${this.formatBytes(verification.totalSize)}`);
    }
    
    console.log(verification.valid ?
      chalk.green('✅ Backup verification passed') :
      chalk.red('❌ Backup verification failed')
    );
    
    if (verification.errors.length > 0) {
      verification.errors.forEach(error => console.log(chalk.red(`  Error: ${error}`)));
    }
    
    if (verification.warnings.length > 0) {
      verification.warnings.forEach(warning => console.log(chalk.yellow(`  Warning: ${warning}`)));
    }
    
    return verification;
  }

  /**
   * @description Create incremental backup based on changes since last backup
   * @param {string} description - Backup description
   * @returns {Promise<string>} Backup path
   */
  async createIncrementalBackup(description = 'Incremental backup') {
    console.log(chalk.blue('📦 Creating incremental backup...'));
    
    const lastBackup = await this.getLatestBackup();
    if (!lastBackup) {
      console.log(chalk.yellow('No previous backup found, creating full backup instead...'));
      return await this.createFullBackup(description);
    }
    
    const changedFiles = await this.findChangedFilesSince(lastBackup.timestamp);
    
    if (changedFiles.length === 0) {
      console.log(chalk.green('No changes detected since last backup'));
      return null;
    }
    
    console.log(chalk.blue(`Found ${changedFiles.length} changed files`));
    
    return await this.createSelectiveBackup(
      changedFiles,
      `${description} (incremental since ${new Date(lastBackup.timestamp).toLocaleString()})`
    );
  }

  /**
   * @description Find files changed since a specific timestamp
   * @param {string} since - ISO timestamp to compare against
   * @returns {Promise<Array<string>>} List of changed file paths
   */
  async findChangedFilesSince(since) {
    const sinceDate = new Date(since);
    const changedFiles = [];
    
    const allFiles = glob.sync('**/*', {
      cwd: this.rootDir,
      ignore: this.getIgnorePatterns(),
      nodir: true,
      dot: true
    });
    
    for (const file of allFiles) {
      try {
        const filePath = path.join(this.rootDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime > sinceDate) {
          changedFiles.push(file);
        }
      } catch (error) {
        // Skip files that can't be accessed
      }
    }
    
    return changedFiles;
  }

  /**
   * @description Get the latest backup metadata
   * @returns {Promise<Object|null>} Latest backup metadata or null
   */
  async getLatestBackup() {
    const backups = await this.listBackups();
    return backups.length > 0 ? backups[0] : null;
  }

  /**
   * @description Create rollback script for a backup operation
   * @param {string} backupPath - Path to the backup
   * @param {Array<string>} operationsLog - Log of operations performed
   * @returns {Promise<void>}
   */
  async createRollbackScript(backupPath, operationsLog = []) {
    const rollbackScript = {
      timestamp: new Date().toISOString(),
      backupPath,
      operations: operationsLog,
      rollbackInstructions: []
    };
    
    // Generate rollback instructions based on operations
    for (const operation of operationsLog) {
      if (operation.type === 'delete') {
        rollbackScript.rollbackInstructions.push({
          action: 'restore',
          source: path.join(backupPath, operation.path),
          target: operation.path,
          description: `Restore deleted file: ${operation.path}`
        });
      } else if (operation.type === 'modify') {
        rollbackScript.rollbackInstructions.push({
          action: 'restore',
          source: path.join(backupPath, operation.path),
          target: operation.path,
          description: `Restore modified file: ${operation.path}`
        });
      }
    }
    
    const scriptPath = path.join(backupPath, 'rollback-script.json');
    await fs.writeJson(scriptPath, rollbackScript, { spaces: 2 });
    
    console.log(chalk.green(`📜 Rollback script created: ${scriptPath}`));
    
    return scriptPath;
  }

  /**
   * @description Execute rollback operation
   * @param {string} backupName - Name of backup to rollback to
   * @returns {Promise<void>}
   */
  async executeRollback(backupName) {
    console.log(chalk.blue(`🔄 Executing rollback to: ${backupName}`));
    
    const backupPath = path.join(this.backupDir, backupName);
    const rollbackScriptPath = path.join(backupPath, 'rollback-script.json');
    
    if (!await fs.pathExists(rollbackScriptPath)) {
      console.log(chalk.yellow('⚠️  No rollback script found, performing standard restore...'));
      return await this.restoreBackup(backupName);
    }
    
    const rollbackScript = await fs.readJson(rollbackScriptPath);
    
    console.log(chalk.white(`Rollback instructions: ${rollbackScript.rollbackInstructions.length} operations`));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const instruction of rollbackScript.rollbackInstructions) {
      try {
        switch (instruction.action) {
          case 'restore':
            await fs.ensureDir(path.dirname(instruction.target));
            await fs.copy(instruction.source, instruction.target);
            console.log(chalk.gray(`  ✓ ${instruction.description}`));
            successCount++;
            break;
          default:
            console.log(chalk.yellow(`  ? Unknown action: ${instruction.action}`));
        }
      } catch (error) {
        console.log(chalk.red(`  ✗ Failed: ${instruction.description} - ${error.message}`));
        errorCount++;
      }
    }
    
    console.log(chalk.green(`✅ Rollback completed!`));
    console.log(chalk.white(`   Successful operations: ${successCount}`));
    if (errorCount > 0) {
      console.log(chalk.red(`   Failed operations: ${errorCount}`));
    }
  }

  /**
   * @description Log operation for rollback purposes
   * @param {Object} operation - Operation details
   */
  logOperation(operation) {
    this.operationLog.push({
      ...operation,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * @description Get ignore patterns for backup operations
   * @returns {Array<string>} Ignore patterns
   */
  getIgnorePatterns() {
    return [
      'node_modules/**',
      '.git/**',
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.turbo/**',
      '.backups/**',
      '**/*.log',
      '**/temp/**',
      '**/tmp/**',
      '**/.DS_Store',
      '**/Thumbs.db'
    ];
  }

  /**
   * @description Check backup storage health and cleanup if needed
   * @returns {Promise<Object>} Health check results
   */
  async checkBackupHealth() {
    console.log(chalk.blue('🔍 Checking backup storage health...'));
    
    const health = {
      totalBackups: 0,
      totalSize: 0,
      corruptedBackups: [],
      oldBackups: [],
      recommendations: []
    };
    
    if (!await fs.pathExists(this.backupDir)) {
      console.log(chalk.yellow('Backup directory does not exist'));
      return health;
    }
    
    const backups = await this.listBackups();
    health.totalBackups = backups.length;
    
    // Check each backup
    for (const backup of backups) {
      health.totalSize += backup.total_size || 0;
      
      // Check for corruption
      try {
        const verification = await this.verifyBackup(backup.path);
        if (!verification.valid) {
          health.corruptedBackups.push(backup.name);
        }
      } catch (error) {
        health.corruptedBackups.push(backup.name);
      }
      
      // Check age (older than 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      if (new Date(backup.timestamp) < sixMonthsAgo) {
        health.oldBackups.push(backup.name);
      }
    }
    
    // Generate recommendations
    if (health.totalBackups > this.options.maxBackups) {
      health.recommendations.push(`Consider cleaning old backups (${health.totalBackups} > ${this.options.maxBackups})`);
    }
    
    if (health.totalSize > 1024 * 1024 * 1024) { // > 1GB
      health.recommendations.push(`Backup storage is large (${this.formatBytes(health.totalSize)})`);
    }
    
    if (health.corruptedBackups.length > 0) {
      health.recommendations.push(`${health.corruptedBackups.length} corrupted backups found - consider removing`);
    }
    
    console.log(chalk.green(`📊 Backup health check completed`));
    console.log(chalk.white(`   Total backups: ${health.totalBackups}`));
    console.log(chalk.white(`   Total size: ${this.formatBytes(health.totalSize)}`));
    
    if (health.corruptedBackups.length > 0) {
      console.log(chalk.red(`   Corrupted: ${health.corruptedBackups.length}`));
    }
    
    if (health.recommendations.length > 0) {
      console.log(chalk.yellow('\n💡 Recommendations:'));
      health.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
    return health;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Enhanced CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Parse options
  const options = {};
  let commandArgs = [];
  
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const [key, value] = args[i].substring(2).split('=');
      options[key] = value || true;
    } else {
      commandArgs.push(args[i]);
    }
  }
  
  const backupManager = new BackupManager(options);
  
  try {
    switch (command) {
      case 'full':
        const description = commandArgs[0] || 'Full backup via CLI';
        await backupManager.createFullBackup(description);
        break;
        
      case 'incremental':
        const incDescription = commandArgs[0] || 'Incremental backup via CLI';
        await backupManager.createIncrementalBackup(incDescription);
        break;
        
      case 'selective':
        if (commandArgs.length === 0) {
          console.log(chalk.red('Please specify files to backup'));
          process.exit(1);
        }
        await backupManager.createSelectiveBackup(commandArgs, 'Selective backup via CLI');
        break;
        
      case 'list':
        await backupManager.listBackups();
        break;
        
      case 'restore':
        const backupName = commandArgs[0];
        if (!backupName) {
          console.log(chalk.red('Please specify backup name to restore'));
          process.exit(1);
        }
        await backupManager.restoreBackup(backupName);
        break;
        
      case 'rollback':
        const rollbackName = commandArgs[0];
        if (!rollbackName) {
          console.log(chalk.red('Please specify backup name to rollback to'));
          process.exit(1);
        }
        await backupManager.executeRollback(rollbackName);
        break;
        
      case 'verify':
        const verifyName = commandArgs[0];
        if (!verifyName) {
          console.log(chalk.red('Please specify backup name to verify'));
          process.exit(1);
        }
        const backupPath = path.join(backupManager.backupDir, verifyName);
        await backupManager.verifyBackup(backupPath);
        break;
        
      case 'health':
        await backupManager.checkBackupHealth();
        break;
        
      case 'clean':
        const keepCount = parseInt(commandArgs[0]) || 5;
        await backupManager.cleanOldBackups(keepCount);
        break;
        
      case 'pre-cleanup':
        const reportPath = commandArgs[0] || 'codebase-analysis-report.json';
        if (await fs.pathExists(reportPath)) {
          const report = await fs.readJson(reportPath);
          await backupManager.createPreCleanupBackup(report);
        } else {
          console.log(chalk.red(`Analysis report not found: ${reportPath}`));
          console.log(chalk.yellow('Run "npm run analyze" first to generate the report'));
        }
        break;
        
      case '--help':
      case '-h':
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.log(chalk.red(`Error: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * @description Show comprehensive help information
 */
function showHelp() {
  console.log(chalk.blue('Enhanced Backup Manager - Safe backup and restore operations\n'));
  
  console.log(chalk.white('Usage:'));
  console.log('  node scripts/backup.js <command> [arguments] [options]\n');
  
  console.log(chalk.white('Commands:'));
  console.log('  full [description]              Create full codebase backup');
  console.log('  incremental [description]       Create incremental backup (changes only)');
  console.log('  selective <files...>            Create backup of specific files');
  console.log('  pre-cleanup [report-path]       Create backup based on analysis report');
  console.log('  list                            List all available backups');
  console.log('  restore <backup-name>           Restore a specific backup');
  console.log('  rollback <backup-name>          Execute rollback using rollback script');
  console.log('  verify <backup-name>            Verify backup integrity');
  console.log('  health                          Check backup storage health');
  console.log('  clean [keep-count]              Clean old backups (default: keep 5)');
  console.log('  help, --help, -h                Show this help message\n');
  
  console.log(chalk.white('Options:'));
  console.log('  --verbose                       Show detailed output');
  console.log('  --compression                   Enable compression (future feature)');
  console.log('  --verification                  Enable backup verification (default: true)');
  console.log('  --maxBackups=<number>           Maximum backups to keep (default: 10)\n');
  
  console.log(chalk.white('Examples:'));
  console.log('  node scripts/backup.js full "Before major refactor"');
  console.log('  node scripts/backup.js incremental');
  console.log('  node scripts/backup.js selective package.json turbo.json --verbose');
  console.log('  node scripts/backup.js pre-cleanup');
  console.log('  node scripts/backup.js verify full-backup-2024-01-01T10-00-00-000Z');
  console.log('  node scripts/backup.js rollback selective-backup-2024-01-01T09-30-00-000Z');
  console.log('  node scripts/backup.js health');
  console.log('  node scripts/backup.js clean 3');
}

if (require.main === module) {
  main();
}

module.exports = BackupManager;