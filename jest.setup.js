// Jest setup file for global test configuration

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random port for tests

// Global test timeout
jest.setTimeout(10000);

// Mock console.log to reduce test noise (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Global test utilities
global.testUtils = {
  // Helper to wait for a specific time
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate test data
  generateTestData: () => ({
    timestamp: new Date().toISOString(),
    testId: Math.random().toString(36).substring(7)
  })
};

// Setup global error handling for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
