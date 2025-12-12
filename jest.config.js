export default {
  // Test environment
  testEnvironment: 'node',

  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['text', 'lcov', 'html', 'cobertura'],

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },

  // The glob patterns Jest uses to detect test files
  testMatch: ['**/__tests__/**/*.(js|ts)', '**/*.(test|spec).(js|ts)'],

  // Test timeout
  testTimeout: 10000,

  // Setup files after environment
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Coverage collection from these files
  collectCoverageFrom: [
    '*.ts',
    '!jest.config.js',
    '!jest.setup.js',
    '!eslint.config.js',
    '!coverage/**',
    '!node_modules/**',
    '!dist/**'
  ],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/coverage/', '/dist/'],

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Verbose output
  verbose: true,

  // Force exit
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true
};
