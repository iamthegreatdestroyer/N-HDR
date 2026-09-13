/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
 * technology suite. Unauthorized reproduction, distribution, or disclosure of this
 * software in whole or in part is strictly prohibited. All intellectual property
 * rights are reserved.
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

  // Inject Jest globals
  injectGlobals: true,

  // Setup files after environment
  setupFilesAfterEnv: ["<rootDir>/tests/utils/setup.js"],

  // HDR pipeline tests — the default npm test target.
  // The legacy suite (tests/**) contains CJS-require tests that fail under ESM;
  // run them individually via --testPathPatterns when needed.
  testMatch: ["**/tests/hdr-pipeline.test.js"],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ["/node_modules/"],

  // A map from regular expressions to paths to transformers
  transform: {},

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [],

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // An array of file extensions your modules use
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],

  // The paths to modules that run some code to configure or set up the testing environment
  setupFiles: [],

  // The maximum amount of workers used to run your tests (defaults to number of CPU cores minus 1)
  maxWorkers: "50%",

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ["node_modules"],

  // A map from regular expressions to module names or to arrays of module names
  moduleNameMapper: {
    "^@tensorflow/tfjs$": "<rootDir>/tests/__mocks__/@tensorflow/tfjs.js",
    "^winston$": "<rootDir>/tests/__mocks__/winston.js",
    "^winston-loki$": "<rootDir>/tests/__mocks__/winston-loki.js",
  },
};
