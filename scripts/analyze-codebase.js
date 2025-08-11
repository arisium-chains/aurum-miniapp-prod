#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

/**
 * @description Advanced codebase analyzer for identifying unused files, duplicates, and optimization opportunities
 */
class CodebaseAnalyzer {
  constructor(options = {}) {
    this.rootDir = process.cwd();
    this.options = {
      full: options.full || false,
      reportOnly: options.reportOnly || false,
      verbose: options.verbose || false,
      outputFormat: options.outputFormat || 'console', // console, json, markdown
      ...options
    };
    
    this.analysis = {
      timestamp: new Date().toISOString(),
      totalFiles: 0,
      unusedFiles: [],
      duplicateFiles: [],
      largeFiles: [],
      outdatedDocs: [],
      emptyDirectories: [],
      duplicatePackageJsons: [],
      unusedDependencies: [],
      dependencyGraph: new Map(),
      circularDependencies: [],
      typeScriptIssues: [],
      configurationIssues: [],
      estimatedSpaceSaved: 0
    };
    
    // Enhanced file patterns to analyze
    this.codePatterns = [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.json',
      '**/*.mjs',
      '**/*.cjs'
    ];
    
    this.docPatterns = [
      '**/*.md',
      '**/*.txt',
      '**/README*',
      '**/CHANGELOG*',
      '**/DEPLOYMENT*',
      '**/DOCS*',
      '**/*.rst'
    ];
    
    this.configPatterns = [
      '**/package.json',
      '**/tsconfig*.json',
      '**/jest.config*',
      '**/vite.config*',
      '**/webpack.config*',
      '**/.eslintrc*',
      '**/prettier.config*',
      '**/next.config*',
      '**/tailwind.config*'
    ];
    
    // Enhanced patterns to ignore
    this.ignorePatterns = [
      'node_modules/**',
      '.git/**',
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.log',
      '.turbo/**',
      '.vercel/**',
      '.vscode/**',
      'tmp/**',
      'temp/**',
      '**/.DS_Store',
      '**/Thumbs.db'
    ];
  }

  /**
   * @description Main analysis method that orchestrates all analysis tasks
   * @returns {Promise<Object>} Complete analysis results
   */
  async analyze() {
    console.log(chalk.blue('🔍 Starting comprehensive codebase analysis...\n'));
    
    if (this.options.reportOnly) {
      return await this.loadExistingReport();
    }
    
    // Core analysis steps
    await this.findAllFiles();
    await this.buildDependencyGraph();
    await this.findDuplicateFiles();
    await this.findUnusedFiles();
    await this.findLargeFiles();
    await this.findOutdatedDocs();
    await this.findEmptyDirectories();
    await this.findDuplicatePackageJsons();
    await this.analyzeDockerComposeFiles();
    
    // Advanced analysis (only in full mode)
    if (this.options.full) {
      await this.analyzeUnusedDependencies();
      await this.findCircularDependencies();
      await this.analyzeTypeScriptIssues();
      await this.analyzeConfigurationIssues();
    }
    
    await this.generateRecommendations();
    this.generateReport();
    await this.saveReport();
    
    return this.analysis;
  }

  /**
   * @description Load existing analysis report
   * @returns {Promise<Object>} Existing analysis data
   */
  async loadExistingReport() {
    const reportPath = path.join(this.rootDir, 'codebase-analysis-report.json');
    if (await fs.pathExists(reportPath)) {
      console.log(chalk.blue('📄 Loading existing analysis report...'));
      this.analysis = await fs.readJson(reportPath);
      this.generateReport();
      return this.analysis;
    } else {
      console.log(chalk.yellow('No existing report found. Running full analysis...'));
      this.options.reportOnly = false;
      return await this.analyze();
    }
  }

  /**
   * @description Build dependency graph for the codebase
   */
  async buildDependencyGraph() {
    console.log(chalk.yellow('🔗 Building dependency graph...'));
    
    const codeFiles = glob.sync('**/*.{ts,tsx,js,jsx}', {
      cwd: this.rootDir,
      ignore: this.ignorePatterns,
      absolute: true
    });

    for (const file of codeFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const relativePath = path.relative(this.rootDir, file);
        const dependencies = this.extractDependencies(content, relativePath);
        
        this.analysis.dependencyGraph.set(relativePath, {
          dependencies,
          dependents: [],
          type: this.getFileType(file),
          size: (await fs.stat(file)).size
        });
      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Build reverse dependencies (dependents)
    for (const [filePath, data] of this.analysis.dependencyGraph) {
      for (const dep of data.dependencies) {
        if (this.analysis.dependencyGraph.has(dep)) {
          this.analysis.dependencyGraph.get(dep).dependents.push(filePath);
        }
      }
    }
    
    console.log(chalk.green(`🔗 Built dependency graph for ${this.analysis.dependencyGraph.size} files`));
  }

  /**
   * @description Extract dependencies from file content
   * @param {string} content - File content
   * @param {string} filePath - Relative file path
   * @returns {Array<string>} Array of dependency file paths
   */
  extractDependencies(content, filePath) {
    const dependencies = [];
    const importRegex = /(?:import.*?from\s+['"`]([^'"`]+)['"`]|require\(['"`]([^'"`]+)['"`]\))/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1] || match[2];
      if (importPath && !importPath.startsWith('.') && !importPath.startsWith('/')) {
        // Skip external packages
        continue;
      }
      
      const resolvedPath = this.resolveImportPath(importPath, filePath);
      if (resolvedPath) {
        dependencies.push(resolvedPath);
      }
    }

    return dependencies;
  }

  /**
   * @description Resolve import path to actual file path
   * @param {string} importPath - Import path from code
   * @param {string} fromFile - File making the import
   * @returns {string|null} Resolved file path or null
   */
  resolveImportPath(importPath, fromFile) {
    const fromDir = path.dirname(fromFile);
    let resolvedPath;

    if (importPath.startsWith('.')) {
      resolvedPath = path.resolve(this.rootDir, fromDir, importPath);
    } else {
      return null; // External dependency
    }

    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    for (const ext of extensions) {
      const pathWithExt = resolvedPath + ext;
      if (fs.existsSync(path.join(this.rootDir, path.relative(this.rootDir, pathWithExt)))) {
        return path.relative(this.rootDir, pathWithExt);
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, 'index' + ext);
      if (fs.existsSync(indexPath)) {
        return path.relative(this.rootDir, indexPath);
      }
    }

    return null;
  }

  /**
   * @description Get file type based on extension and content
   * @param {string} filePath - File path
   * @returns {string} File type
   */
  getFileType(filePath) {
    const ext = path.extname(filePath);
    const basename = path.basename(filePath);
    
    if (basename.includes('.test.') || basename.includes('.spec.')) {
      return 'test';
    }
    
    switch (ext) {
      case '.ts': return 'typescript';
      case '.tsx': return 'react-typescript';
      case '.js': return 'javascript';
      case '.jsx': return 'react-javascript';
      case '.json': return 'json';
      default: return 'unknown';
    }
  }

  /**
   * @description Find circular dependencies in the codebase
   */
  async findCircularDependencies() {
    console.log(chalk.yellow('🔄 Analyzing circular dependencies...'));
    
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const findCycle = (node, path = []) => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        cycles.push([...path.slice(cycleStart), node]);
        return;
      }
      
      if (visited.has(node)) return;
      
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      
      const nodeData = this.analysis.dependencyGraph.get(node);
      if (nodeData) {
        for (const dep of nodeData.dependencies) {
          if (this.analysis.dependencyGraph.has(dep)) {
            findCycle(dep, [...path]);
          }
        }
      }
      
      recursionStack.delete(node);
      path.pop();
    };

    for (const node of this.analysis.dependencyGraph.keys()) {
      if (!visited.has(node)) {
        findCycle(node);
      }
    }

    this.analysis.circularDependencies = cycles.map(cycle => ({
      cycle,
      length: cycle.length,
      severity: cycle.length > 5 ? 'high' : cycle.length > 3 ? 'medium' : 'low'
    }));
    
    console.log(chalk.green(`🔄 Found ${this.analysis.circularDependencies.length} circular dependencies`));
  }

  /**
   * @description Analyze unused npm dependencies
   */
  async analyzeUnusedDependencies() {
    console.log(chalk.yellow('📦 Analyzing unused dependencies...'));
    
    const packageJsonFiles = glob.sync('**/package.json', {
      cwd: this.rootDir,
      ignore: this.ignorePatterns
    });

    for (const pkgFile of packageJsonFiles) {
      try {
        const pkgPath = path.join(this.rootDir, pkgFile);
        const pkg = await fs.readJson(pkgPath);
        const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (Object.keys(dependencies).length === 0) continue;

        const workspaceDir = path.dirname(pkgPath);
        const codeFiles = glob.sync('**/*.{ts,tsx,js,jsx}', {
          cwd: workspaceDir,
          ignore: this.ignorePatterns
        });

        const usedDeps = new Set();
        
        for (const codeFile of codeFiles) {
          try {
            const content = await fs.readFile(path.join(workspaceDir, codeFile), 'utf8');
            const imports = content.match(/(?:import.*?from\s+['"`]([^'"`]+)['"`]|require\(['"`]([^'"`]+)['"`]\))/g) || [];
            
            for (const imp of imports) {
              const match = imp.match(/['"`]([^'"`]+)['"`]/);
              if (match) {
                const depName = match[1].split('/')[0];
                if (dependencies[depName]) {
                  usedDeps.add(depName);
                }
              }
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }

        const unusedDeps = Object.keys(dependencies).filter(dep => !usedDeps.has(dep));
        
        if (unusedDeps.length > 0) {
          this.analysis.unusedDependencies.push({
            packageJson: pkgFile,
            unusedDependencies: unusedDeps,
            totalDependencies: Object.keys(dependencies).length,
            usedDependencies: Array.from(usedDeps)
          });
        }
      } catch (error) {
        // Skip invalid package.json files
      }
    }
    
    console.log(chalk.green(`📦 Found ${this.analysis.unusedDependencies.length} packages with unused dependencies`));
  }

  /**
   * @description Analyze TypeScript configuration issues
   */
  async analyzeTypeScriptIssues() {
    console.log(chalk.yellow('🔧 Analyzing TypeScript configuration...'));
    
    const tsConfigFiles = glob.sync('**/tsconfig*.json', {
      cwd: this.rootDir,
      ignore: this.ignorePatterns
    });

    for (const tsConfigFile of tsConfigFiles) {
      try {
        const configPath = path.join(this.rootDir, tsConfigFile);
        const config = await fs.readJson(configPath);
        
        const issues = [];
        
        // Check for common issues
        if (!config.compilerOptions?.strict) {
          issues.push({
            type: 'warning',
            message: 'Strict mode not enabled - consider enabling for better type safety'
          });
        }
        
        if (!config.compilerOptions?.skipLibCheck) {
          issues.push({
            type: 'performance',
            message: 'skipLibCheck not enabled - may slow down compilation'
          });
        }
        
        if (config.compilerOptions?.target && config.compilerOptions.target.toLowerCase() === 'es5') {
          issues.push({
            type: 'outdated',
            message: 'Target ES5 is outdated - consider upgrading to ES2020 or later'
          });
        }

        if (issues.length > 0) {
          this.analysis.typeScriptIssues.push({
            file: tsConfigFile,
            issues
          });
        }
      } catch (error) {
        this.analysis.typeScriptIssues.push({
          file: tsConfigFile,
          issues: [{
            type: 'error',
            message: `Invalid JSON: ${error.message}`
          }]
        });
      }
    }
    
    console.log(chalk.green(`🔧 Analyzed ${tsConfigFiles.length} TypeScript configuration files`));
  }

  /**
   * @description Analyze configuration issues across the codebase
   */
  async analyzeConfigurationIssues() {
    console.log(chalk.yellow('⚙️  Analyzing configuration files...'));
    
    const configFiles = glob.sync(this.configPatterns, {
      cwd: this.rootDir,
      ignore: this.ignorePatterns
    });

    const issues = [];
    const duplicateConfigs = new Map();

    for (const configFile of configFiles) {
      const configType = this.getConfigType(configFile);
      
      if (!duplicateConfigs.has(configType)) {
        duplicateConfigs.set(configType, []);
      }
      duplicateConfigs.get(configType).push(configFile);
    }

    // Find duplicate configurations
    for (const [type, files] of duplicateConfigs) {
      if (files.length > 1) {
        issues.push({
          type: 'duplicate_config',
          configType: type,
          files,
          recommendation: `Consider consolidating ${type} configurations`
        });
      }
    }

    this.analysis.configurationIssues = issues;
    console.log(chalk.green(`⚙️  Found ${issues.length} configuration issues`));
  }

  /**
   * @description Get configuration type from file path
   * @param {string} filePath - Configuration file path
   * @returns {string} Configuration type
   */
  getConfigType(filePath) {
    const basename = path.basename(filePath);
    
    if (basename.includes('eslint')) return 'eslint';
    if (basename.includes('prettier')) return 'prettier';
    if (basename.includes('tsconfig')) return 'typescript';
    if (basename.includes('jest')) return 'jest';
    if (basename.includes('vite')) return 'vite';
    if (basename.includes('webpack')) return 'webpack';
    if (basename.includes('next.config')) return 'nextjs';
    if (basename.includes('tailwind')) return 'tailwind';
    if (basename === 'package.json') return 'package';
    
    return 'other';
  }

  /**
   * @description Generate intelligent recommendations based on analysis
   */
  async generateRecommendations() {
    console.log(chalk.yellow('💡 Generating recommendations...'));
    
    this.analysis.recommendations = [];
    
    // Space optimization recommendations
    if (this.analysis.estimatedSpaceSaved > 100 * 1024 * 1024) { // > 100MB
      this.analysis.recommendations.push({
        type: 'space_optimization',
        priority: 'high',
        title: 'Significant space savings available',
        description: `You can save approximately ${this.formatBytes(this.analysis.estimatedSpaceSaved)} by cleaning up unused and duplicate files.`,
        actions: ['Run cleanup script', 'Review unused files before deletion']
      });
    }
    
    // Dependency recommendations
    if (this.analysis.unusedDependencies.length > 0) {
      const totalUnused = this.analysis.unusedDependencies.reduce((sum, pkg) => sum + pkg.unusedDependencies.length, 0);
      this.analysis.recommendations.push({
        type: 'dependency_optimization',
        priority: 'medium',
        title: 'Remove unused dependencies',
        description: `Found ${totalUnused} unused dependencies across ${this.analysis.unusedDependencies.length} packages.`,
        actions: ['Review and remove unused dependencies', 'Update package.json files']
      });
    }
    
    // Circular dependency recommendations
    if (this.analysis.circularDependencies.length > 0) {
      const highSeverity = this.analysis.circularDependencies.filter(c => c.severity === 'high').length;
      this.analysis.recommendations.push({
        type: 'code_quality',
        priority: highSeverity > 0 ? 'high' : 'medium',
        title: 'Resolve circular dependencies',
        description: `Found ${this.analysis.circularDependencies.length} circular dependencies, ${highSeverity} with high severity.`,
        actions: ['Refactor code to break circular dependencies', 'Consider dependency injection patterns']
      });
    }
    
    console.log(chalk.green(`💡 Generated ${this.analysis.recommendations.length} recommendations`));
  }

  async findAllFiles() {
    const allPatterns = [...this.codePatterns, ...this.docPatterns];
    
    for (const pattern of allPatterns) {
      const files = glob.sync(pattern, {
        cwd: this.rootDir,
        ignore: this.ignorePatterns,
        absolute: true
      });
      this.analysis.totalFiles += files.length;
    }
    
    console.log(chalk.green(`📊 Found ${this.analysis.totalFiles} files to analyze`));
  }

  async findDuplicateFiles() {
    console.log(chalk.yellow('🔍 Analyzing duplicate files...'));
    
    const fileHashes = new Map();
    const files = glob.sync('**/*', {
      cwd: this.rootDir,
      ignore: this.ignorePatterns,
      nodir: true,
      absolute: true
    });

    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        if (stats.size > 0) {
          const content = await fs.readFile(file, 'utf8');
          const hash = this.simpleHash(content);
          
          if (!fileHashes.has(hash)) {
            fileHashes.set(hash, []);
          }
          fileHashes.get(hash).push({
            path: path.relative(this.rootDir, file),
            size: stats.size
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Find duplicates
    for (const [hash, files] of fileHashes) {
      if (files.length > 1) {
        this.analysis.duplicateFiles.push({
          files: files.map(f => f.path),
          size: files[0].size,
          count: files.length
        });
        this.analysis.estimatedSpaceSaved += files[0].size * (files.length - 1);
      }
    }
    
    console.log(chalk.green(`📋 Found ${this.analysis.duplicateFiles.length} sets of duplicate files`));
  }

  async findUnusedFiles() {
    console.log(chalk.yellow('🔍 Analyzing potentially unused files...'));
    
    // Find TypeScript/JavaScript files that might be unused
    const codeFiles = glob.sync('**/*.{ts,tsx,js,jsx}', {
      cwd: this.rootDir,
      ignore: this.ignorePatterns,
      absolute: true
    });

    const allContent = [];
    for (const file of codeFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        allContent.push({ file, content });
      } catch (error) {
        // Skip files that can't be read
      }
    }

    for (const { file, content } of allContent) {
      const relativePath = path.relative(this.rootDir, file);
      const fileName = path.basename(file, path.extname(file));
      
      // Skip certain files that are likely entry points
      if (this.isLikelyEntryPoint(relativePath)) {
        continue;
      }

      let isReferenced = false;
      
      // Check if this file is imported/required in other files
      for (const { content: otherContent } of allContent) {
        if (this.isFileReferenced(relativePath, fileName, otherContent)) {
          isReferenced = true;
          break;
        }
      }

      if (!isReferenced) {
        const stats = await fs.stat(file);
        this.analysis.unusedFiles.push({
          path: relativePath,
          size: stats.size,
          lastModified: stats.mtime
        });
        this.analysis.estimatedSpaceSaved += stats.size;
      }
    }
    
    console.log(chalk.green(`📋 Found ${this.analysis.unusedFiles.length} potentially unused files`));
  }

  async findLargeFiles() {
    console.log(chalk.yellow('🔍 Analyzing large files...'));
    
    const files = glob.sync('**/*', {
      cwd: this.rootDir,
      ignore: this.ignorePatterns,
      nodir: true,
      absolute: true
    });

    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        if (stats.size > 1024 * 1024) { // Files larger than 1MB
          this.analysis.largeFiles.push({
            path: path.relative(this.rootDir, file),
            size: stats.size,
            sizeFormatted: this.formatBytes(stats.size)
          });
        }
      } catch (error) {
        // Skip files that can't be accessed
      }
    }
    
    this.analysis.largeFiles.sort((a, b) => b.size - a.size);
    console.log(chalk.green(`📋 Found ${this.analysis.largeFiles.length} large files (>1MB)`));
  }

  async findOutdatedDocs() {
    console.log(chalk.yellow('🔍 Analyzing documentation files...'));
    
    const docFiles = glob.sync('**/*.md', {
      cwd: this.rootDir,
      ignore: this.ignorePatterns,
      absolute: true
    });

    const potentiallyOutdated = [];
    const duplicateTopics = new Map();

    for (const file of docFiles) {
      try {
        const stats = await fs.stat(file);
        const content = await fs.readFile(file, 'utf8');
        const relativePath = path.relative(this.rootDir, file);
        
        // Check for potentially outdated docs (not modified in 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        if (stats.mtime < sixMonthsAgo) {
          potentiallyOutdated.push({
            path: relativePath,
            lastModified: stats.mtime,
            size: stats.size
          });
        }

        // Check for duplicate topics by analyzing titles
        const title = this.extractTitle(content);
        if (title) {
          if (!duplicateTopics.has(title)) {
            duplicateTopics.set(title, []);
          }
          duplicateTopics.get(title).push(relativePath);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    // Find duplicate documentation topics
    for (const [title, files] of duplicateTopics) {
      if (files.length > 1) {
        this.analysis.outdatedDocs.push({
          type: 'duplicate_topic',
          title,
          files,
          recommendation: 'Consider consolidating these documents'
        });
      }
    }

    // Add potentially outdated docs
    for (const doc of potentiallyOutdated) {
      this.analysis.outdatedDocs.push({
        type: 'potentially_outdated',
        ...doc,
        recommendation: 'Review and update or remove if no longer relevant'
      });
    }
    
    console.log(chalk.green(`📋 Found ${this.analysis.outdatedDocs.length} documentation issues`));
  }

  async findEmptyDirectories() {
    console.log(chalk.yellow('🔍 Finding empty directories...'));
    
    const allDirs = glob.sync('**/', {
      cwd: this.rootDir,
      ignore: this.ignorePatterns,
      absolute: true
    });

    for (const dir of allDirs) {
      try {
        const contents = await fs.readdir(dir);
        if (contents.length === 0) {
          this.analysis.emptyDirectories.push(path.relative(this.rootDir, dir));
        }
      } catch (error) {
        // Skip directories that can't be accessed
      }
    }
    
    console.log(chalk.green(`📋 Found ${this.analysis.emptyDirectories.length} empty directories`));
  }

  async findDuplicatePackageJsons() {
    console.log(chalk.yellow('🔍 Analyzing package.json files...'));
    
    const packageFiles = glob.sync('**/package.json', {
      cwd: this.rootDir,
      ignore: this.ignorePatterns,
      absolute: true
    });

    const packages = [];
    for (const file of packageFiles) {
      try {
        const content = await fs.readJson(file);
        packages.push({
          path: path.relative(this.rootDir, file),
          content,
          dependencies: Object.keys(content.dependencies || {}),
          devDependencies: Object.keys(content.devDependencies || {})
        });
      } catch (error) {
        // Skip invalid package.json files
      }
    }

    // Find packages with similar dependencies
    for (let i = 0; i < packages.length; i++) {
      for (let j = i + 1; j < packages.length; j++) {
        const pkg1 = packages[i];
        const pkg2 = packages[j];
        
        const commonDeps = pkg1.dependencies.filter(dep => pkg2.dependencies.includes(dep));
        const commonDevDeps = pkg1.devDependencies.filter(dep => pkg2.devDependencies.includes(dep));
        
        if (commonDeps.length > 5 || commonDevDeps.length > 3) {
          this.analysis.duplicatePackageJsons.push({
            files: [pkg1.path, pkg2.path],
            commonDependencies: commonDeps,
            commonDevDependencies: commonDevDeps,
            recommendation: 'Consider moving common dependencies to shared package or workspace root'
          });
        }
      }
    }
    
    console.log(chalk.green(`📋 Found ${this.analysis.duplicatePackageJsons.length} package.json files with similar dependencies`));
  }

  async analyzeDockerComposeFiles() {
    console.log(chalk.yellow('🔍 Analyzing Docker Compose files...'));
    
    const dockerComposeFiles = glob.sync('**/docker-compose*.yml', {
      cwd: this.rootDir,
      ignore: this.ignorePatterns
    });

    if (dockerComposeFiles.length > 1) {
      this.analysis.duplicateFiles.push({
        type: 'docker-compose',
        files: dockerComposeFiles,
        recommendation: 'Consolidate into single docker-compose.yml with override files'
      });
    }
    
    console.log(chalk.green(`📋 Found ${dockerComposeFiles.length} Docker Compose files`));
  }

  // Helper methods
  simpleHash(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  isLikelyEntryPoint(filePath) {
    const entryPoints = [
      'index.ts', 'index.js', 'main.ts', 'main.js',
      'app.ts', 'app.js', 'server.ts', 'server.js',
      'page.tsx', 'layout.tsx', 'route.ts'
    ];
    
    const fileName = path.basename(filePath);
    return entryPoints.includes(fileName) || 
           filePath.includes('pages/') || 
           filePath.includes('app/') ||
           filePath.includes('src/app/');
  }

  isFileReferenced(filePath, fileName, content) {
    // Check for various import/require patterns
    const patterns = [
      new RegExp(`import.*from.*['"\`].*${fileName}['"\`]`, 'g'),
      new RegExp(`require\\(['"\`].*${fileName}['"\`]\\)`, 'g'),
      new RegExp(`import.*['"\`].*${filePath}['"\`]`, 'g'),
      new RegExp(`require\\(['"\`].*${filePath}['"\`]\\)`, 'g')
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  extractTitle(content) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  generateReport() {
    console.log('\n' + chalk.blue('📊 CODEBASE ANALYSIS REPORT') + '\n');
    console.log(chalk.white('=' * 50));
    
    console.log(chalk.green(`📁 Total files analyzed: ${this.analysis.totalFiles}`));
    console.log(chalk.yellow(`🗑️  Potentially unused files: ${this.analysis.unusedFiles.length}`));
    console.log(chalk.yellow(`📋 Duplicate file sets: ${this.analysis.duplicateFiles.length}`));
    console.log(chalk.yellow(`📄 Large files (>1MB): ${this.analysis.largeFiles.length}`));
    console.log(chalk.yellow(`📚 Documentation issues: ${this.analysis.outdatedDocs.length}`));
    console.log(chalk.yellow(`📁 Empty directories: ${this.analysis.emptyDirectories.length}`));
    console.log(chalk.yellow(`📦 Package.json similarities: ${this.analysis.duplicatePackageJsons.length}`));
    console.log(chalk.green(`💾 Estimated space that could be saved: ${this.formatBytes(this.analysis.estimatedSpaceSaved)}`));
    
    if (this.analysis.unusedFiles.length > 0) {
      console.log('\n' + chalk.red('🗑️  POTENTIALLY UNUSED FILES:'));
      this.analysis.unusedFiles.slice(0, 10).forEach(file => {
        console.log(`  - ${file.path} (${this.formatBytes(file.size)})`);
      });
      if (this.analysis.unusedFiles.length > 10) {
        console.log(`  ... and ${this.analysis.unusedFiles.length - 10} more`);
      }
    }
    
    if (this.analysis.duplicateFiles.length > 0) {
      console.log('\n' + chalk.red('📋 DUPLICATE FILES:'));
      this.analysis.duplicateFiles.slice(0, 5).forEach(duplicate => {
        console.log(`  - ${duplicate.files.join(', ')} (${this.formatBytes(duplicate.size)} each)`);
      });
      if (this.analysis.duplicateFiles.length > 5) {
        console.log(`  ... and ${this.analysis.duplicateFiles.length - 5} more sets`);
      }
    }
    
    if (this.analysis.largeFiles.length > 0) {
      console.log('\n' + chalk.red('📄 LARGE FILES:'));
      this.analysis.largeFiles.slice(0, 5).forEach(file => {
        console.log(`  - ${file.path} (${file.sizeFormatted})`);
      });
    }
    
    console.log('\n' + chalk.blue('💡 RECOMMENDATIONS:'));
    console.log('  1. Review potentially unused files before deletion');
    console.log('  2. Consolidate duplicate files where appropriate');
    console.log('  3. Consider compressing or optimizing large files');
    console.log('  4. Update or remove outdated documentation');
    console.log('  5. Remove empty directories');
    console.log('  6. Consolidate similar package.json configurations');
  }

  async saveReport() {
    const reportPath = path.join(this.rootDir, 'codebase-analysis-report.json');
    await fs.writeJson(reportPath, this.analysis, { spaces: 2 });
    console.log(chalk.green(`\n📄 Detailed report saved to: ${reportPath}`));
  }
}

/**
 * @description CLI interface for the codebase analyzer
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--full':
        options.full = true;
        break;
      case '--report-only':
        options.reportOnly = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--format':
        options.outputFormat = args[++i] || 'console';
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }
  
  try {
    const analyzer = new CodebaseAnalyzer(options);
    await analyzer.analyze();
  } catch (error) {
    console.error(chalk.red(`Analysis failed: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * @description Show CLI help information
 */
function showHelp() {
  console.log(chalk.blue('Codebase Analyzer - Advanced code analysis and cleanup tool\n'));
  
  console.log(chalk.white('Usage:'));
  console.log('  node scripts/analyze-codebase.js [options]\n');
  
  console.log(chalk.white('Options:'));
  console.log('  --full              Run full analysis including dependency graph, circular deps, etc.');
  console.log('  --report-only       Load and display existing analysis report');
  console.log('  --verbose           Show detailed output and error information');
  console.log('  --format <type>     Output format: console, json, markdown (default: console)');
  console.log('  --help, -h          Show this help message\n');
  
  console.log(chalk.white('Examples:'));
  console.log('  node scripts/analyze-codebase.js');
  console.log('  node scripts/analyze-codebase.js --full');
  console.log('  node scripts/analyze-codebase.js --report-only');
  console.log('  node scripts/analyze-codebase.js --full --verbose --format json');
}

// Run the analysis
if (require.main === module) {
  main();
}

module.exports = CodebaseAnalyzer;