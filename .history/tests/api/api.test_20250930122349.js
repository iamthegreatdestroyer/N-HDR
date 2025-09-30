/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
 * technology suite. Unauthorized reproduction, distribution, or disclosure of this
 * software in whole or in part is strictly prohibited. All intellectual property
 * rights, including patent-pending technologies, are reserved.
 */

const request = require("supertest");
const express = require("express");
const { createTestSuite, assert, mock } = require("../test-framework");
const NeuralHDRApi = require("../../src/api/nhdr-api");
const config = require("../../config/nhdr-config");

// Create test suite
const apiSuite = createTestSuite("Neural-HDR API");

// Test variables
let app;
let api;
let mockNhdr;
let mockNsHdr;
let validToken;
let validBiometric;

// Setup and teardown
apiSuite.before(async () => {
  // Create Express app
  app = express();
  app.use(express.json());

  // Mock Neural-HDR and NS-HDR
  mockNhdr = {
    captureConsciousness: mock.fn(),
    restoreConsciousness: mock.fn(),
    mergeConsciousness: mock.fn(),
    createSharedConsciousness: mock.fn(),
    security: {
      validateAccess: mock.fn(),
      validateBiometric: mock.fn()
    }
  };

  mockNsHdr = {
    accelerateProcessing: mock.fn(),
    createProcessingNetwork: mock.fn(),
    getStatus: mock.fn()
  };

  // Initialize API with mocks
  api = new NeuralHDRApi(config);
  api.nhdr = mockNhdr;
  api.nsHdr = mockNsHdr;

  // Add API routes
  app.use(api.getRouter());

  // Create valid test credentials
  validToken = "test_token";
  validBiometric = {
    type: "fingerprint",
    data: "test_fingerprint_data"
  };

  // Configure mock responses
  mockNhdr.security.validateAccess.mockResolvedValue(true);
  mockNhdr.security.validateBiometric.mockResolvedValue({ valid: true, identity: { id: "test_user" } });
});

apiSuite.after(() => {
  app = null;
  api = null;
  mockNhdr = null;
  mockNsHdr = null;
});

// Authentication tests
apiSuite.test("should require authentication token", async () => {
  const response = await request(app)
    .post("/api/v1/consciousness/capture")
    .send({
      aiState: { id: "test" }
    });

  assert.equals(response.status, 401);
  assert.equals(response.body.error, "Authentication failed");
});

apiSuite.test("should validate biometric data", async () => {
  const response = await request(app)
    .post("/api/v1/consciousness/capture")
    .set("Authorization", \`Bearer \${validToken}\`)
    .send({
      aiState: { id: "test" }
    });

  assert.equals(response.status, 401);
  assert.equals(response.body.error, "Authentication failed");
  assert.equals(response.body.message, "Biometric data is required");
});

// Consciousness endpoints tests
apiSuite.test("should capture consciousness state", async () => {
  const testState = {
    id: "test_state",
    components: {
      memory: { usage: 0.75 }
    }
  };

  mockNhdr.captureConsciousness.mockResolvedValue(Buffer.from("test_nhdr_file"));

  const response = await request(app)
    .post("/api/v1/consciousness/capture")
    .set("Authorization", \`Bearer \${validToken}\`)
    .send({
      aiState: testState,
      biometricData: validBiometric
    });

  assert.equals(response.status, 200);
  assert.equals(response.body.success, true);
  assert.isType(typeof response.body.nhdrFile, "string");
});

apiSuite.test("should restore consciousness state", async () => {
  const testFile = Buffer.from("test_nhdr_file").toString("base64");
  const targetAI = {
    id: "test_ai",
    type: "neural_network"
  };

  mockNhdr.restoreConsciousness.mockResolvedValue(true);

  const response = await request(app)
    .post("/api/v1/consciousness/restore")
    .set("Authorization", \`Bearer \${validToken}\`)
    .send({
      nhdrFile: testFile,
      targetAI,
      biometricData: validBiometric
    });

  assert.equals(response.status, 200);
  assert.equals(response.body.success, true);
});

// NS-HDR endpoints tests
apiSuite.test("should create processing network", async () => {
  const mockNetwork = {
    id: "test_network",
    status: "active",
    nodeCount: 10
  };

  mockNsHdr.createProcessingNetwork.mockResolvedValue(mockNetwork);

  const response = await request(app)
    .post("/api/v1/swarm/network")
    .set("Authorization", \`Bearer \${validToken}\`)
    .send({
      biometricData: validBiometric
    });

  assert.equals(response.status, 200);
  assert.equals(response.body.success, true);
  assert.deepEquals(response.body.network, mockNetwork);
});

apiSuite.test("should accelerate processing", async () => {
  const testData = {
    id: "test_data",
    components: {
      processing: { priority: "high" }
    }
  };

  const mockResult = {
    id: "test_acceleration",
    speedupFactor: 2.5
  };

  mockNsHdr.accelerateProcessing.mockResolvedValue(mockResult);

  const response = await request(app)
    .post("/api/v1/swarm/accelerate")
    .set("Authorization", \`Bearer \${validToken}\`)
    .send({
      consciousnessData: testData,
      biometricData: validBiometric
    });

  assert.equals(response.status, 200);
  assert.equals(response.body.success, true);
  assert.deepEquals(response.body.accelerated, mockResult);
});

apiSuite.test("should get swarm status", async () => {
  const mockStatus = {
    status: "active",
    activeNodes: 10,
    taskQueue: 5
  };

  mockNsHdr.getStatus.mockReturnValue(mockStatus);

  const response = await request(app)
    .get("/api/v1/swarm/status")
    .set("Authorization", \`Bearer \${validToken}\`)
    .send({
      biometricData: validBiometric
    });

  assert.equals(response.status, 200);
  assert.deepEquals(response.body, mockStatus);
});

// Error handling tests
apiSuite.test("should handle invalid input data", async () => {
  const response = await request(app)
    .post("/api/v1/consciousness/capture")
    .set("Authorization", \`Bearer \${validToken}\`)
    .send({
      biometricData: validBiometric
      // Missing aiState
    });

  assert.equals(response.status, 400);
  assert.equals(response.body.error, "Invalid request");
});

apiSuite.test("should handle internal errors", async () => {
  mockNhdr.captureConsciousness.mockRejectedValue(new Error("Test error"));

  const response = await request(app)
    .post("/api/v1/consciousness/capture")
    .set("Authorization", \`Bearer \${validToken}\`)
    .send({
      aiState: { id: "test" },
      biometricData: validBiometric
    });

  assert.equals(response.status, 500);
  assert.equals(response.body.error, "Consciousness capture failed");
});

// Health endpoint test
apiSuite.test("should return health status", async () => {
  const response = await request(app)
    .get("/health");

  assert.equals(response.status, 200);
  assert.equals(response.body.status, "healthy");
  assert.isType(typeof response.body.version, "string");
  assert.isType(typeof response.body.timestamp, "number");
});

// Run the tests (if being run directly)
if (require.main === module) {
  apiSuite.run().then(() => {
    process.exit(0);
  });
}

module.exports = apiSuite;