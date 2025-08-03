import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import security from 'eslint-plugin-security'
import microsoftSdl from '@microsoft/eslint-plugin-sdl'
import noUnsanitized from 'eslint-plugin-no-unsanitized'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
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
      'security': security,
      '@microsoft/sdl': microsoftSdl,
      'no-unsanitized': noUnsanitized,
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
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off', // Too noisy, TypeScript inference is good
      '@typescript-eslint/explicit-member-accessibility': ['warn', {
        accessibility: 'explicit',
        overrides: {
          accessors: 'explicit',
          constructors: 'no-public',
          methods: 'explicit',
          properties: 'explicit',
          parameterProperties: 'explicit'
        }
      }],
      '@typescript-eslint/no-explicit-any': 'warn', // Allow with warning for gradual cleanup
      '@typescript-eslint/no-non-null-assertion': 'warn', // Allow with warning for gradual cleanup
      'prefer-const': 'error',
      'no-var': 'error',
      // Security-specific rules
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
    },
  },
)