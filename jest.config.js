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

  // Coverage thresholds (re-baselined for v4.0: measured 94/77/80/82)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 70,
      lines: 75,
      statements: 75,
    },
  },

  // Global test timeout
  testTimeout: 5000,

  // Verbose output
  verbose: true,
};
