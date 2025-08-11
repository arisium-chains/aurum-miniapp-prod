/**
 * @description Next.js specific ESLint configuration
 * Extends base config with Next.js specific rules
 */

const baseConfig = require('./base.js');

module.exports = {
  ...baseConfig,
  extends: [
    ...(baseConfig.extends || []),
    'next/core-web-vitals',
    'eslint-config-next',
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  rules: {
    // Next.js specific rules
    '@next/next/no-img-element': 'error',
    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-sync-scripts': 'error',
    '@next/next/no-unwanted-polyfillio': 'error',

    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed in Next.js 11+
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react/no-unescaped-entities': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // JSX rules
    'jsx-quotes': ['error', 'prefer-double'],
    'react/jsx-boolean-value': ['error', 'never'],
    'react/jsx-curly-spacing': ['error', { when: 'never' }],
    'react/jsx-equals-spacing': ['error', 'never'],
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-tag-spacing': ['error', { beforeSelfClosing: 'always' }],
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',

    // Import organization
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['**/*.tsx'],
      rules: {
        // TypeScript + React specific rules
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_' },
        ],
      },
    },
  ],
};
