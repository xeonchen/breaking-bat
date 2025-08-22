import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import security from 'eslint-plugin-security';
import microsoftSdl from '@microsoft/eslint-plugin-sdl';
import noUnsanitized from 'eslint-plugin-no-unsanitized';
import tseslint from 'typescript-eslint';
import noDomainViolations from './tools/eslint-rules/no-domain-violations.cjs';
import noApplicationViolations from './tools/eslint-rules/no-application-violations.cjs';
import noInfrastructureViolations from './tools/eslint-rules/no-infrastructure-violations.cjs';
import noPresentationViolations from './tools/eslint-rules/no-presentation-violations.cjs';

export default tseslint.config(
  { ignores: ['coverage', 'dist', 'docs/**'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      security: security,
      '@microsoft/sdl': microsoftSdl,
      'no-unsanitized': noUnsanitized,
      'clean-architecture': {
        rules: {
          'no-domain-violations': noDomainViolations,
          'no-application-violations': noApplicationViolations,
          'no-infrastructure-violations': noInfrastructureViolations,
          'no-presentation-violations': noPresentationViolations,
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...security.configs.recommended.rules,
      ...microsoftSdl.configs.recommended.rules,
      ...noUnsanitized.configs['recommended-legacy'].rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Clean Architecture rules (consistent everywhere)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off', // Too noisy, TypeScript inference is good
      '@typescript-eslint/explicit-member-accessibility': [
        'warn',
        {
          accessibility: 'explicit',
          overrides: {
            accessors: 'explicit',
            constructors: 'no-public',
            methods: 'explicit',
            properties: 'explicit',
            parameterProperties: 'explicit',
          },
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // Allow with warning for gradual cleanup
      '@typescript-eslint/no-non-null-assertion': 'warn', // Allow with warning for gradual cleanup
      'prefer-const': 'error',
      'no-var': 'error',
      // Whitespace and formatting rules
      'no-trailing-spaces': [
        'error',
        {
          skipBlankLines: false,
          ignoreComments: false,
        },
      ],
      // Security-specific rules
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
      // Clean Architecture violations
      'clean-architecture/no-domain-violations': 'error',
      'clean-architecture/no-application-violations': 'error',
      'clean-architecture/no-infrastructure-violations': 'error',
      'clean-architecture/no-presentation-violations': 'error',
    },
  },
  // Relaxed rules for test files
  {
    files: [
      '**/*.test.{ts,tsx}',
      '**/tests/**/*.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
    ],
    rules: {
      // Allow any types in tests for mocking private APIs
      '@typescript-eslint/no-explicit-any': 'off',

      // Allow non-null assertions in tests when we control test data
      '@typescript-eslint/no-non-null-assertion': 'off',

      // Allow unused variables in tests (mock functions, etc.)
      '@typescript-eslint/no-unused-vars': 'off',

      // Allow security warnings in test files - these are false positives for test data
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',

      // Allow explicit member accessibility warnings in tests
      '@typescript-eslint/explicit-member-accessibility': 'off',
    },
  }
);
