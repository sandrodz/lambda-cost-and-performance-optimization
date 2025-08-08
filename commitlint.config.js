const config = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow longer subject lines for detailed commit messages
    'subject-max-length': [2, 'always', 100],
    // Allow longer body lines for detailed explanations
    'body-max-line-length': [2, 'always', 120],
    // Enforce conventional commit types
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New features
        'fix',      // Bug fixes
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'build',    // Build system or dependency changes
        'ci',       // CI/CD configuration changes
        'chore',    // Maintenance tasks
        'revert',   // Reverting previous commits
        'types',    // Type definition changes
        'config',   // Configuration changes
      ],
    ],
    // Require scope for better categorization (but not enforced)
    'scope-empty': [1, 'never'],
    'scope-enum': [
      1,
      'always',
      [
        'deps',       // Dependencies
        'types',      // Type definitions
        'config',     // Configuration
        'eslint',     // ESLint related
        'prettier',   // Prettier related
        'husky',      // Git hooks
        'analysis',   // Analysis scripts
        'reporting',  // Reporting scripts
        'executor',   // Test executor
        'runner',     // Test runner
        'lambda',     // Lambda functions
        'aws',        // AWS related
        'cleanup',    // Code cleanup
        'docs',       // Documentation
      ],
    ],
  },
};

module.exports = config;
