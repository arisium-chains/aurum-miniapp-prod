# @shared/config

Unified tooling configurations for the Aurum Miniapp monorepo. This package provides standardized configuration files for ESLint, TypeScript, Jest, and Prettier to ensure consistent code quality, formatting, and testing practices across all applications and services.

## Installation

This package is automatically available in the monorepo workspace. No separate installation required.

## Usage

### ESLint Configuration

#### Base Configuration

```javascript
// .eslintrc.js
module.exports = {
  extends: ['@shared/config/eslint/base'],
  // Add project-specific overrides here
};
```

#### Next.js Configuration

```javascript
// .eslintrc.js (for Next.js projects)
module.exports = {
  extends: ['@shared/config/eslint/nextjs'],
  // Add project-specific overrides here
};
```

### TypeScript Configuration

#### Base Configuration

```json
// tsconfig.json
{
  "extends": "@shared/config/typescript/base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

#### Next.js Configuration

```json
// tsconfig.json (for Next.js projects)
{
  "extends": "@shared/config/typescript/nextjs.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Jest Configuration

```javascript
// jest.config.js
const { jest } = require('@shared/config');

module.exports = {
  ...jest,
  // Add project-specific test configuration
  testMatch: ['<rootDir>/src/**/*.test.{js,ts,tsx}'],
};
```

### Prettier Configuration

```javascript
// prettier.config.js
const { prettier } = require('@shared/config');

module.exports = prettier;
```

## Configuration Files

### ESLint Configurations

#### `eslint/base.js`

Base ESLint configuration with TypeScript support:

- TypeScript parser and plugin
- Essential rules for code quality
- Import/export rules
- Promise handling rules
- Security best practices

#### `eslint/nextjs.js`

Next.js specific ESLint configuration:

- Extends base configuration
- Next.js specific rules and plugins
- React hooks rules
- JSX accessibility rules

### TypeScript Configurations

#### `typescript/base.json`

Strict TypeScript configuration for general use:

- Strict mode enabled
- Module resolution settings
- Target ES2020
- Declaration file generation
- Source maps enabled

#### `typescript/nextjs.json`

Next.js optimized TypeScript configuration:

- Extends base configuration
- JSX preserve mode
- Next.js specific lib includes
- Incremental compilation
- Module resolution for Next.js

### Testing Configuration

#### `jest/base.js`

Jest testing configuration:

- TypeScript support with ts-jest
- Coverage thresholds (80% minimum)
- Test environment setup
- Module name mapping
- Coverage reporting

### Code Formatting

#### `prettier/base.js`

Prettier formatting rules:

- 2-space indentation
- Single quotes
- No trailing commas
- Print width 80 characters
- TypeScript/JavaScript support

## Configuration Utilities

The main entry point (`index.js`) provides utility functions for working with configurations:

### `validateConfig(config, schema)`

Validates configuration objects against schemas:

```javascript
const { validateConfig } = require('@shared/config');

const config = {
  /* your config */
};
const isValid = validateConfig(config, 'eslint');
```

### `mergeConfigs(base, override)`

Merges configuration objects with deep merging:

```javascript
const { mergeConfigs } = require('@shared/config');

const customConfig = mergeConfigs(baseConfig, {
  rules: {
    'custom-rule': 'error',
  },
});
```

### `getConfigPath(configType, variant)`

Gets the path to a specific configuration file:

```javascript
const { getConfigPath } = require('@shared/config');

const eslintPath = getConfigPath('eslint', 'base');
const nextjsPath = getConfigPath('typescript', 'nextjs');
```

## Customization

### Extending Configurations

You can extend the base configurations for project-specific needs:

```javascript
// Custom ESLint configuration
module.exports = {
  extends: ['@shared/config/eslint/base'],
  rules: {
    // Override or add custom rules
    'prefer-const': 'error',
    '@typescript-eslint/no-unused-vars': 'warn',
  },
  env: {
    // Add custom environments
    jest: true,
  },
};
```

### Environment-Specific Overrides

```json
// Custom TypeScript configuration
{
  "extends": "@shared/config/typescript/base.json",
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

## Best Practices

### ESLint

- Always extend base configuration rather than replacing
- Use project-specific rules sparingly
- Configure environments appropriately (node, browser, jest)
- Enable parser options for your project's needs

### TypeScript

- Use strict mode for new projects
- Configure path mapping for cleaner imports
- Set appropriate target based on runtime environment
- Enable declaration files for library packages

### Testing

- Maintain minimum 80% code coverage
- Use descriptive test file patterns
- Configure appropriate test environments
- Set up module mocking for external dependencies

### Code Formatting

- Use automated formatting in CI/CD
- Configure editor integration
- Avoid overriding formatting rules
- Ensure consistency across all file types

## Integration with Development Tools

### VS Code Settings

```json
// .vscode/settings.json
{
  "eslint.workingDirectories": ["packages/*", "apps/*"],
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint src --ext .ts,.tsx,.js,.jsx --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write src/**/*.{ts,tsx,js,jsx,json,md}",
    "test": "jest",
    "test:coverage": "jest --coverage"
  }
}
```

## Troubleshooting

### Common Issues

#### ESLint Configuration Not Found

```bash
# Ensure the package is built
npm run build --workspace=packages/shared-config

# Check ESLint working directories
npx eslint --print-config src/index.ts
```

#### TypeScript Path Resolution

```json
// Ensure baseUrl and paths are configured correctly
{
  "extends": "@shared/config/typescript/base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["packages/*/src"]
    }
  }
}
```

#### Jest Module Resolution

```javascript
// Configure moduleNameMapping for Jest
module.exports = {
  ...require('@shared/config').jest,
  moduleNameMapping: {
    '^@shared/(.*)$': '<rootDir>/../$1/src',
  },
};
```

### Validation Errors

The configuration utilities provide validation to catch common mistakes:

```javascript
const { validateConfig } = require('@shared/config');

// This will throw an error if the configuration is invalid
try {
  validateConfig(myConfig, 'eslint');
} catch (error) {
  console.error('Invalid ESLint configuration:', error.message);
}
```

## Contributing

### Adding New Configurations

1. Create configuration file in appropriate directory (`eslint/`, `typescript/`, etc.)
2. Export from main `index.js` file
3. Add validation schema if needed
4. Update this README with usage examples
5. Add tests for new configurations

### Configuration Guidelines

- Follow existing naming conventions
- Provide both base and specialized configurations
- Document all non-obvious configuration options
- Ensure configurations are composable
- Test configurations with real projects

## Version History

- **v1.0.0** - Initial release with core configurations
  - Base ESLint configuration with TypeScript support
  - Next.js specific ESLint rules
  - Strict TypeScript configurations
  - Jest testing setup with coverage requirements
  - Prettier formatting standards
  - Configuration validation utilities
