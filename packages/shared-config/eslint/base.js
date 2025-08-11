/**
 * @description Base ESLint configuration for Aurum Miniapp monorepo
 * Extends the existing project configuration with shared rules
 */

module.exports = {
  root: true,
  extends: ['@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',

    // General JavaScript rules
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',

    // Code style rules
    'arrow-spacing': 'error',
    'comma-dangle': ['error', 'es5'],
    'comma-spacing': 'error',
    'eol-last': 'error',
    indent: ['error', 2, { SwitchCase: 1 }],
    'key-spacing': 'error',
    'keyword-spacing': 'error',
    'no-trailing-spaces': 'error',
    'object-curly-spacing': ['error', 'always'],
    quotes: ['error', 'single', { avoidEscape: true }],
    semi: ['error', 'always'],
    'space-before-blocks': 'error',
    'space-infix-ops': 'error',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'coverage/',
    '*.js', // Allow JS config files
  ],
};
