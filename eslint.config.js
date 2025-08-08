import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  {
    files: ['scripts/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        // Remove type-aware linting for now to avoid parsing errors
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettier,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',
      
      // Basic TypeScript rules (without type checking)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      
      // General code quality rules
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off', // Allow console.log
      'no-undef': 'off', // TypeScript handles this
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      
      // Import/Export rules
      'no-duplicate-imports': 'error',
      
      // Style rules (handled by Prettier, but keep some logical ones)
      'no-trailing-spaces': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.aws-sam/',
      'src/test-functions/*/node_modules/',
      '*.js',
    ],
  },
];
