/**
 * Integration Test Setup
 * © 2025 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 * HDR EMPIRE - CONFIDENTIAL
 */

// Set test timeout
jest.setTimeout(30000);

// Mock hardware-specific features for consistent testing
jest.mock("os", () => ({
  ...jest.requireActual("os"),
  cpus: () =>
    Array(4)
      .fill()
      .map(() => ({
        model: "Test CPU",
        speed: 2500,
        times: {
          user: 0,
          nice: 0,
          sys: 0,
          idle: 0,
          irq: 0,
        },
      })),
}));

// Global test setup
beforeAll(async () => {
  // Set up test environment
  process.env.NODE_ENV = "test";

  // Initialize any required resources
  console.log("Setting up integration test environment...");
});

// Global test teardown
afterAll(async () => {
  // Clean up test environment
  console.log("Cleaning up integration test environment...");
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
