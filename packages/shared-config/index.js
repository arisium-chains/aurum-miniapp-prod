/**
 * @description Main entry point for shared configurations
 * Exports all available configuration presets for easy consumption
 */

module.exports = {
  // ESLint configurations
  eslint: {
    base: require('./eslint/base.js'),
    nextjs: require('./eslint/nextjs.js'),
  },

  // TypeScript configurations
  typescript: {
    base: require('./typescript/base.json'),
    nextjs: require('./typescript/nextjs.json'),
  },

  // Jest configurations
  jest: {
    base: require('./jest/base.js'),
  },

  // Prettier configurations
  prettier: {
    base: require('./prettier/base.js'),
  },

  // Utility functions for configuration validation
  utils: {
    /**
     * @description Validates if a configuration object has required properties
     * @param {object} config - Configuration object to validate
     * @param {string[]} requiredKeys - Array of required property names
     * @returns {boolean} True if valid, false otherwise
     */
    validateConfig: (config, requiredKeys) => {
      if (!config || typeof config !== 'object') {
        return false;
      }

      return requiredKeys.every(key => key in config);
    },

    /**
     * @description Merges configuration objects with proper precedence
     * @param {object} baseConfig - Base configuration
     * @param {object} overrideConfig - Override configuration
     * @returns {object} Merged configuration
     */
    mergeConfigs: (baseConfig, overrideConfig) => {
      return {
        ...baseConfig,
        ...overrideConfig,
        // Special handling for nested objects
        ...(baseConfig.rules &&
          overrideConfig.rules && {
            rules: {
              ...baseConfig.rules,
              ...overrideConfig.rules,
            },
          }),
      };
    },

    /**
     * @description Gets the appropriate configuration based on project type
     * @param {string} projectType - Type of project ('nextjs', 'node', 'react', etc.)
     * @param {string} configType - Type of configuration ('eslint', 'typescript', etc.)
     * @returns {object|null} Configuration object or null if not found
     */
    getConfigForProject: (projectType, configType) => {
      const configs = module.exports;

      if (!configs[configType]) {
        return null;
      }

      // Try to get project-specific config first, fall back to base
      return (
        configs[configType][projectType] || configs[configType].base || null
      );
    },
  },
};
