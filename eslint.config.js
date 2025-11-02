import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'writable',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        jest: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    },
    rules: {
      // Best Practices
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Variables
      'no-undef': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      'no-use-before-define': 'error',

      // Stylistic Issues
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',

      // ES6+
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'no-var': 'error',

      // Node.js specific
      'no-process-exit': 'error',
      'handle-callback-err': 'error'
    },
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'coverage/**', 'dist/**', '*.min.js']
  },
  {
    // Test files specific configuration
    files: ['**/*.test.js', '**/*.spec.js', '**/jest.setup.js'],
    rules: {
      'no-console': 'off' // Allow console in tests
    }
  },
  {
    // Main application file - allow process.exit for graceful shutdown
    files: ['main.js'],
    rules: {
      'no-process-exit': 'off',
      'no-console': 'off' // Main file needs console for server logs
    }
  }
];
