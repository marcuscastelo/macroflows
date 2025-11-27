/* global process, NodeJS, ApexCharts */
import js from '@eslint/js'
import pluginTs from '@typescript-eslint/eslint-plugin'
import parserTs from '@typescript-eslint/parser'
import pluginA11y from 'eslint-plugin-jsx-a11y'
import pluginPrettier from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import pluginSolid from 'eslint-plugin-solid'
import globals from 'globals'
import eslintPluginImport from 'eslint-plugin-import'
import love from 'eslint-config-love'

/** @type {import('eslint').Linter.Config} */
export default [
  {
    ...love,
    files: ['**/*.ts', '**/*.tsx'],

    languageOptions: {
      parser: parserTs,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: ['./tsconfig.json'],
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        process: 'readonly',
        NodeJS: 'readonly',
        ApexCharts: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': pluginTs,
      solid: pluginSolid,
      prettier: pluginPrettier,
      'jsx-a11y': pluginA11y,
      simpleImportSort,
      import: eslintPluginImport,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginTs.configs['recommended-type-checked'].rules,

      "object-shorthand": ["warn", "always"],

      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
      'no-restricted-imports': [
        'error',
        {
          patterns: ['../*', './*'],
          paths: [
            {
              name: 'zod',
              message: "Please use 'zod/v4' instead.",
            },
            {
              name: '~/shared/utils/supabase',
              message: "Direct import of '~/shared/utils/supabase' is restricted to infrastructure layer only. Use repository abstractions in application/domain layers.",
            },
            {
              name: 'axios',
              message: "Direct import of 'axios' is restricted to infrastructure layer only. Use repository abstractions in application/domain layers.",
            },
          ],
        },
      ],
      'import/no-unresolved': ['error'],
      'import/no-empty-named-blocks': ['warn'],

      eqeqeq: ["error", "always"],

      'prettier/prettier': [
        'error',
        {
          printWidth: 80,
          tabWidth: 2,
          singleQuote: true,
          trailingComma: 'all',
          arrowParens: 'always',
          semi: false,
          endOfLine: 'auto',
        },
      ],

      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-throw-literal': 'off',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],

      "require-await": "off",
      "@typescript-eslint/require-await": "off",

      'no-unused-vars': 'off',
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "args": "all",
          "argsIgnorePattern": "^_",
          "caughtErrors": "all",
          "caughtErrorsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ],

      'jsx-a11y/alt-text': [
        'warn',
        {
          elements: ['img'],
          img: ['Image'],
        },
      ],
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',

      // TODO: Re-enable console restriction after refactoring logging & observability system
      'no-console': 'off', // Ban all console usage by default
      // TODO: Re-enable console restriction after refactoring logging & observability system
      // Issue URL: https://github.com/marcuscastelo/macroflows/issues/1056
      // Ban inline dynamic imports in application code
      // Dynamic imports should only be used for legitimate code-splitting via lazyImport or lazy()
      // For allowed patterns, see: src/shared/solid/lazyImport.ts and lazy component files
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression',
          message: 'Inline dynamic imports are forbidden. Use static imports at the top of the file, or use lazyImport() for code-splitting. See src/shared/solid/lazyImport.ts for approved patterns.'
        },
      ],

      ...pluginSolid.configs.recommended.rules,
      'solid/reactivity': 'error',
    },
    settings: {
      'import/parsers': {
        [parserTs]: ['.ts', '.tsx', '.d.ts'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json'],
        },
      },
    },
  },
  {
    // Allow console usage in error handling, telemetry, and testing infrastructure
    files: [
      'src/shared/error/**/*.ts',
      'src/shared/error/**/*.tsx', 
      'src/modules/observability/**/*.ts',
      'src/modules/observability/**/*.tsx',

      '**/*.test.ts',
      '**/*.test.tsx',
      'vitest.setup.ts'
    ],
    rules: {
      'no-console': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='JSON'][callee.property.name='parse'], CallExpression[callee.object.type='Identifier'][callee.property.name='parse']",
          message: 'Direct JSON.parse or Zod schema .parse() calls are forbidden. Use parseWithStack for stack trace and consistency.'
        },
        // Note: Console usage allowed in error handling infrastructure
      ],
    },
  },
  {
    // Allow external dependencies only in infrastructure layer
    files: [
      '**/infrastructure/**/*.ts', 
      '**/infrastructure/**/*.tsx', 
      'src/shared/utils/supabase.ts', 
      'src/shared/console/**/*.ts', 
      'src/shared/hooks/**/*.ts', 
      'src/shared/utils/**/*.ts', 
      'src/sections/**/*.tsx',
      'vitest.setup.ts'
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['../*', './/*'],
          paths: [
            {
              name: 'zod',
              message: "Please use 'zod/v4' instead.",
            },
            // Note: supabase, axios restrictions removed for infrastructure layer
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='JSON'][callee.property.name='parse'], CallExpression[callee.object.type='Identifier'][callee.property.name='parse']",
          message: 'Direct JSON.parse or Zod schema .parse() calls are forbidden. Use parseWithStack for stack trace and consistency.'
        },
        // Note: localStorage, navigator restrictions removed for infrastructure layer
      ],
    },
  },
  {
    files: ['.eslintrc.js', '.eslintrc.cjs', 'eslint.config.js'],
    languageOptions: {
      sourceType: 'script',
      globals: globals.node,
    },
  },
  {
    ignores: [
      'node_modules',
      'src/sections/datepicker',
      '.vercel',
      '.vinxi',
      'dist',
      'build',
      'coverage',
      'public',
      'out',
      '.output',
    ],
  },
  {
    files: ['src/app-version.ts'],
    rules: {
      'import/no-unresolved': 'off',
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'import/order': 'off',
      'simple-import-sort/imports': 'off',
      'simple-import-sort/exports': 'off',
      'prettier/prettier': 'off',
    },
  },
  {
    // Allow dynamic imports for code-splitting and lazy loading
    // These files use dynamic imports for legitimate code-splitting purposes
    // Note: We preserve the JSON.parse restriction from other config blocks
    files: [
      // Lazy loading utility
      'src/shared/solid/lazyImport.ts',
      // App entry point with lazy components
      'src/app.tsx',
      // Lazy-loaded component files that use lazyImport()
      'src/routes/**/*.tsx',
      'src/sections/**/*.tsx',
      // Infrastructure code that needs dynamic imports for SSR/client detection
      'src/modules/observability/**/*.ts',
      // Test files that need dynamic imports for mocking
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
    rules: {
      // Override: Remove only the ImportExpression restriction while preserving JSON.parse restriction
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='JSON'][callee.property.name='parse'], CallExpression[callee.object.type='Identifier'][callee.property.name='parse']",
          message: 'Direct JSON.parse or Zod schema .parse() calls are forbidden. Use parseWithStack for stack trace and consistency.'
        },
        // Note: Dynamic imports (ImportExpression) are allowed in these files for code-splitting
      ],
    },
  },
]
