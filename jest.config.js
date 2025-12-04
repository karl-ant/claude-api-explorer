export default {
  // Use node environment for pure utility functions
  testEnvironment: 'node',

  // Test file patterns
  testMatch: ['**/src/**/*.test.js'],

  // ES modules support
  transform: {},
  moduleNameMapper: {},

  // Coverage configuration
  collectCoverageFrom: [
    'src/utils/**/*.js',
    'src/config/**/*.js',
    '!src/**/*.test.js',
    '!src/utils/localStorage.js', // Browser API dependent
  ],

  coverageReporters: ['text', 'html', 'json'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 34,
      functions: 45,
      lines: 40,
      statements: 40,
    },
  },

  // Global test timeout
  testTimeout: 5000,

  // Verbose output
  verbose: true,
};
