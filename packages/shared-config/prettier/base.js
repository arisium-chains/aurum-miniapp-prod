/**
 * @description Base Prettier configuration for Aurum Miniapp monorepo
 * Matches the existing project formatting standards
 */

module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  bracketSameLine: false,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  embeddedLanguageFormatting: 'auto',
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  vueIndentScriptAndStyle: false,
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 100,
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};
