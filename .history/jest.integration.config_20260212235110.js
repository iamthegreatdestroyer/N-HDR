/**
 * Jest Integration Test Configuration
 * © 2025 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 * HDR EMPIRE - CONFIDENTIAL
 */

export default {
  // Test environment
  testEnvironment: "node",

  // Test match pattern for integration tests
  testMatch: ["**/tests/integration/**/*.test.js"],

  // Transform files
  transform: {
    "^.+\\.js$": "babel-jest",
  },

  // ESM support
  extensionsToTreatAsEsm: [".js"],
  collectCoverageFrom: ["src/**/*.js"],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: "coverage/integration",
  coverageReporters: ["text", "lcov"],

  // Test timeout
  testTimeout: 30000,

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/integration/setup.js"],

  // Global configuration
  globals: {
    TEST_MODE: "integration",
  },

  // Ensure jest globals are available
  injectGlobals: true,
};
