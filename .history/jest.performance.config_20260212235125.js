/**
 * Jest Performance Test Configuration
 * © 2025 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 * HDR EMPIRE - CONFIDENTIAL
 */

export default {
  // Test environment
  testEnvironment: "node",

  // Test match pattern for performance tests
  testMatch: ["**/tests/performance/**/*.test.js"],

  // Transform files
  transform: {
    "^.+\\.js$": "babel-jest",
  },

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: "coverage/performance",
  coverageReporters: ["text", "lcov"],

  // Extended test timeout for performance tests
  testTimeout: 60000,

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/performance/setup.js"],

  // Global configuration
  globals: {
    TEST_MODE: "performance",
    PERFORMANCE_THRESHOLDS: {
      CPU_USAGE: 80,
      MEMORY_LIMIT: 1024 * 1024 * 1024, // 1GB
      MAX_LATENCY: 1000, // 1 second
      MIN_THROUGHPUT: 100, // operations per second
    },
  },

  // Reporter configuration
  reporters: ["default", ["./tests/performance/custom-reporter.js", {}]],

  // Ensure jest globals are available
  injectGlobals: true,
};
