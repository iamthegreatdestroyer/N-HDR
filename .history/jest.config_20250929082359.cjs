/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * 
 * This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
 * technology suite. Unauthorized reproduction, distribution, or disclosure of this
 * software in whole or in part is strictly prohibited. All intellectual property
 * rights, including patent-pending technologies, are reserved.
 * 
 * File: jest.config.cjs
 * Created: 2025-09-29
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

module.exports = {
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ["html", "lcov", "text", "text-summary"],

  // The test environment that will be used for testing
  testEnvironment: "node",

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/tests/**/*.test.[jt]s?(x)",
    "**/tests/**/*.spec.[jt]s?(x)"
  ],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ["/node_modules/"],

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    "/node_modules/(?!(@tensorflow|three|crypto-js|node-forge)/)"
  ],

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // An array of file extensions your modules use
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],

  // The paths to modules that run some code to configure or set up the testing environment
  setupFiles: [],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: [],

  // The maximum amount of workers used to run your tests (defaults to number of CPU cores minus 1)
  maxWorkers: "50%",

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ["node_modules"],

  // A map from regular expressions to module names or to arrays of module names
  moduleNameMapper: {}
};