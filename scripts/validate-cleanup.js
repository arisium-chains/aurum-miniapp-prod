#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

/**
 * @description Validation script to ensure safe cleanup operations
 */
class CleanupValidator {
  constructor() {
    this.rootDir = process.cwd();
    this.validationResults = {
      timestamp: new Date().toISOString(),
      safeToDelete: [],
      unsafeToDelete: [],
      requiresReview: [],
      errors: []
    };
  }

  /**
   * @description Main validation method
   * @param {Array<string>} filesToValidate - Files to validate for deletion
   * @returns {Promise<Object>} Validation results
   */
  async validateCleanup(filesToValidate) {
    console.log(chalk.blue('🔍 Validating cleanup safety...\n'));
    
    for (const filePath of filesToValidate) {
      try {
        const validation = await this.validateFile(filePath);
        
        if (validation.safe) {
          this.validationResults.safeToDelete.push({
            path: filePath,
            reason: validation.reason,
            confidence: validation.confidence
          });
        } else if (validation.needsReview) {
          this.validationResults.requiresReview.push({
            path: filePath,
            reason: validation.reason,
            warnings: validation.warnings
          });
        } else {
          this.validationResults.unsafeToDelete.push({
            path: filePath,
            reason: validation.reason,
            risks: validation.risks
          });
        }
      } catch (error) {
        this.validationResults.errors.push({
          path: filePath,
          error: error.message
        });
      }
    }

    this.generateValidationReport();
    await this.saveValidationResults();
    
    return this.validationResults;
  }

  /**
   * @description Validate individual file for safe deletion
   * @param {string} filePath - File path to validate
   * @returns {Promise<Object>} Validation result for the file
   */
  async validateFile(filePath) {
    const fullPath = path.resolve(this.rootDir, filePath);
    
    if (!await fs.pathExists(fullPath)) {
      return {
        safe: true,
        reason: 'File does not exist',
        confidence: 'high'
      };
    }

    const stats = await fs.stat(fullPath);
    const isDirectory = stats.isDirectory();
    
    // Check if it's a critical system file
    if (this.isCriticalFile(filePath)) {
      return {
        safe: false,
        reason: 'Critical system file',
        risks: ['System functionality', 'Build process', 'Dependencies']
      };
    }

    // Check if file is referenced in active code
    const references = await this.findFileReferences(filePath);
    if (references.length > 0) {
      return {
        safe: false,
        reason: 'File is actively referenced',
        risks: [`Referenced in ${references.length} files`, 'Runtime errors', 'Build failures'],
        references: references.slice(0, 5) // Limit to first 5 references
      };
    }

    // Check if it's a recent file (modified in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (stats.mtime > thirtyDaysAgo) {
      return {
        safe: false,
        needsReview: true,
        reason: 'Recently modified file',
        warnings: ['Modified within last 30 days', 'May be actively developed']
      };
    }

    // Check if it's a configuration file
    if (this.isConfigurationFile(filePath)) {
      return {
        safe: false,
        needsReview: true,
        reason: 'Configuration file',
        warnings: ['May affect build/runtime behavior', 'Review before deletion']
      };
    }

    // Check file size - large files need review
    if (stats.size > 10 * 1024 * 1024) { // > 10MB
      return {
        safe: false,
        needsReview: true,
        reason: 'Large file',
        warnings: [`File size: ${this.formatBytes(stats.size)}`, 'Significant space impact']
      };
    }

    // If it passes all checks, it's likely safe to delete
    return {
      safe: true,
      reason: 'No active references or critical dependencies found',
      confidence: this.calculateConfidence(filePath, stats)
    };
  }

  /**
   * @description Check if file is critical to system operation
   * @param {string} filePath - File path to check
   * @returns {boolean} True if file is critical
   */
  isCriticalFile(filePath) {
    const criticalPatterns = [
      /package\.json$/,
      /package-lock\.json$/,
      /yarn\.lock$/,
      /pnpm-lock\.yaml$/,
      /\.env$/,
      /\.env\.local$/,
      /\.env\.production$/,
      /tsconfig\.json$/,
      /next\.config\./,
      /docker-compose\./,
      /Dockerfile$/,
      /\.gitignore$/,
      /README\.md$/,
      /index\.(ts|js|tsx|jsx)$/,
      /main\.(ts|js)$/,
      /app\.(ts|js|tsx|jsx)$/
    ];

    return criticalPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * @description Check if file is a configuration file
   * @param {string} filePath - File path to check
   * @returns {boolean} True if file is a configuration file
   */
  isConfigurationFile(filePath) {
    const configPatterns = [
      /\.config\./,
      /\.rc$/,
      /\.json$/,
      /\.yaml$/,
      /\.yml$/,
      /\.toml$/,
      /\.ini$/
    ];

    return configPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * @description Find references to a file in the codebase
   * @param {string} targetFile - File to search for references
   * @returns {Promise<Array<string>>} List of files that reference the target
   */
  async findFileReferences(targetFile) {
    const references = [];
    const searchPatterns = [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.json',
      '**/*.md'
    ];

    const ignorePatterns = [
      'node_modules/**',
      '.git/**',
      '.next/**',
      'dist/**',
      'build/**',
      '.turbo/**'
    ];

    const files = glob.sync(searchPatterns, {
      cwd: this.rootDir,
      ignore: ignorePatterns,
      absolute: true
    });

    const fileName = path.basename(targetFile, path.extname(targetFile));
    const relativePath = targetFile;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for various reference patterns
        const patterns = [
          new RegExp(`['"\`].*${fileName}['"\`]`, 'g'),
          new RegExp(`['"\`].*${relativePath}['"\`]`, 'g'),
          new RegExp(`import.*from.*['"\`].*${fileName}['"\`]`, 'g'),
          new RegExp(`require\\(['"\`].*${fileName}['"\`]\\)`, 'g')
        ];

        if (patterns.some(pattern => pattern.test(content))) {
          references.push(path.relative(this.rootDir, file));
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return references;
  }

  /**
   * @description Calculate confidence level for deletion safety
   * @param {string} filePath - File path
   * @param {Object} stats - File stats
   * @returns {string} Confidence level
   */
  calculateConfidence(filePath, stats) {
    let score = 0;

    // Age factor (older = safer)
    const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 365) score += 3;
    else if (ageInDays > 180) score += 2;
    else if (ageInDays > 90) score += 1;

    // File type factor
    if (filePath.match(/\.(log|tmp|temp|bak|old)$/)) score += 2;
    if (filePath.includes('test') || filePath.includes('spec')) score += 1;
    if (filePath.includes('node_modules')) score += 3;

    // Size factor (smaller = safer for removal)
    if (stats.size < 1024) score += 1; // < 1KB
    else if (stats.size > 1024 * 1024) score -= 1; // > 1MB

    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * @description Generate validation report
   */
  generateValidationReport() {
    console.log('\n' + chalk.blue('📋 CLEANUP VALIDATION REPORT') + '\n');
    console.log(chalk.white('=' * 50));
    
    console.log(chalk.green(`✅ Safe to delete: ${this.validationResults.safeToDelete.length} files`));
    console.log(chalk.yellow(`⚠️  Requires review: ${this.validationResults.requiresReview.length} files`));
    console.log(chalk.red(`❌ Unsafe to delete: ${this.validationResults.unsafeToDelete.length} files`));
    console.log(chalk.red(`🚨 Validation errors: ${this.validationResults.errors.length} files`));

    if (this.validationResults.unsafeToDelete.length > 0) {
      console.log('\n' + chalk.red('❌ UNSAFE TO DELETE:'));
      this.validationResults.unsafeToDelete.slice(0, 10).forEach(item => {
        console.log(`  - ${item.path}: ${item.reason}`);
        if (item.risks) {
          item.risks.forEach(risk => console.log(`    ⚠️  ${risk}`));
        }
      });
    }

    if (this.validationResults.requiresReview.length > 0) {
      console.log('\n' + chalk.yellow('⚠️  REQUIRES REVIEW:'));
      this.validationResults.requiresReview.slice(0, 10).forEach(item => {
        console.log(`  - ${item.path}: ${item.reason}`);
      });
    }

    console.log('\n' + chalk.blue('💡 RECOMMENDATIONS:'));
    console.log('  1. Only proceed with files marked as "Safe to delete"');
    console.log('  2. Manually review files that "Require review"');
    console.log('  3. Never delete files marked as "Unsafe"');
    console.log('  4. Create backup before any deletion operations');
  }

  /**
   * @description Save validation results to file
   */
  async saveValidationResults() {
    const reportPath = path.join(this.rootDir, 'cleanup-validation-report.json');
    
    // Convert Map to object for JSON serialization
    const serializable = {
      ...this.validationResults,
      summary: {
        total: this.validationResults.safeToDelete.length + 
               this.validationResults.requiresReview.length + 
               this.validationResults.unsafeToDelete.length,
        safeCount: this.validationResults.safeToDelete.length,
        reviewCount: this.validationResults.requiresReview.length,
        unsafeCount: this.validationResults.unsafeToDelete.length,
        errorCount: this.validationResults.errors.length
      }
    };
    
    await fs.writeJson(reportPath, serializable, { spaces: 2 });
    console.log(chalk.green(`\n📄 Validation report saved to: ${reportPath}`));
  }

  /**
   * @description Format bytes to human readable format
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted size string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * @description CLI interface for cleanup validation
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(chalk.blue('Cleanup Validator Usage:'));
    console.log('  node scripts/validate-cleanup.js <file1> <file2> ...');
    console.log('  node scripts/validate-cleanup.js --from-analysis');
    console.log('\nOptions:');
    console.log('  --from-analysis    Use files from latest analysis report');
    process.exit(0);
  }

  const validator = new CleanupValidator();
  let filesToValidate = [];

  if (args.includes('--from-analysis')) {
    // Load files from analysis report
    const analysisReportPath = path.join(process.cwd(), 'codebase-analysis-report.json');
    if (await fs.pathExists(analysisReportPath)) {
      const analysis = await fs.readJson(analysisReportPath);
      filesToValidate = [
        ...analysis.unusedFiles.map(f => f.path),
        ...analysis.duplicateFiles.flatMap(d => d.files ? d.files.slice(1) : []) // Keep first of each duplicate set
      ];
      console.log(chalk.blue(`📋 Loaded ${filesToValidate.length} files from analysis report`));
    } else {
      console.log(chalk.red('Analysis report not found. Run "npm run analyze" first.'));
      process.exit(1);
    }
  } else {
    filesToValidate = args;
  }

  try {
    await validator.validateCleanup(filesToValidate);
  } catch (error) {
    console.error(chalk.red(`Validation failed: ${error.message}`));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CleanupValidator;