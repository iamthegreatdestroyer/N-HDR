/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * STATE PRESERVATION TESTS
 * Validates state preservation functionality, security, and integrity checking.
 */

jest.mock("../quantum/vanishing-key-manager");
jest.mock("../quantum/secure-task-execution");

const StatePreservation = require("../../src/consciousness/state-preservation");
const {
  VanishingKeyManager,
} = require("../../src/quantum/vanishing-key-manager");
const {
  SecureTaskExecution,
} = require("../../src/quantum/secure-task-execution");

describe("StatePreservation", () => {
  let preservation;
  let mockKey;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock key
    mockKey = Buffer.from("0123456789abcdef0123456789abcdef");

    // Mock VanishingKeyManager
    VanishingKeyManager.mockImplementation(() => ({
      generateKey: jest.fn().mockResolvedValue(mockKey),
      storeKey: jest.fn().mockResolvedValue("key-123"),
      retrieveKey: jest.fn().mockResolvedValue(mockKey),
      deleteKey: jest.fn().mockResolvedValue(true),
    }));

    // Mock SecureTaskExecution
    SecureTaskExecution.mockImplementation(() => ({
      execute: jest.fn().mockImplementation(async (task) => task()),
    }));

    // Create preservation instance
    preservation = new StatePreservation({
      temporalResolution: 100,
      maxSnapshots: 5,
      integrityCheckInterval: 500,
    });
  });

  describe("Configuration", () => {
    test("should initialize with default options", () => {
      const defaultPreservation = new StatePreservation();
      expect(defaultPreservation.options.temporalResolution).toBe(1000);
      expect(defaultPreservation.options.maxSnapshots).toBe(1000);
      expect(defaultPreservation.options.integrityCheckInterval).toBe(5000);
    });

    test("should initialize with custom options", () => {
      expect(preservation.options.temporalResolution).toBe(100);
      expect(preservation.options.maxSnapshots).toBe(5);
      expect(preservation.options.integrityCheckInterval).toBe(500);
    });
  });

  describe("State Preservation", () => {
    const mockState = {
      nodes: [{ id: "node1" }, { id: "node2" }],
      connections: [{ source: "node1", target: "node2" }],
      emergenceScore: 0.75,
    };

    test("should preserve state successfully", async () => {
      const snapshotId = await preservation.preserveState("layer1", mockState);
      expect(snapshotId).toMatch(/layer1-\d+/);

      const snapshots = preservation.getSnapshots("layer1");
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].metadata.nodes).toBe(2);
      expect(snapshots[0].metadata.connections).toBe(1);
    });

    test("should enforce snapshot limit", async () => {
      // Create more snapshots than the limit
      for (let i = 0; i < 7; i++) {
        await preservation.preserveState("layer1", mockState);
      }

      const snapshots = preservation.getSnapshots("layer1");
      expect(snapshots).toHaveLength(5); // maxSnapshots limit
    });

    test("should fail gracefully on preservation error", async () => {
      // Mock security failure
      VanishingKeyManager.mockImplementation(() => ({
        generateKey: jest.fn().mockRejectedValue(new Error("Security failure")),
      }));

      await expect(
        preservation.preserveState("layer1", mockState)
      ).rejects.toThrow("Failed to preserve state");
    });
  });

  describe("State Restoration", () => {
    const mockState = {
      nodes: [{ id: "node1" }],
      connections: [],
      emergenceScore: 0.5,
    };
    let snapshotId;

    beforeEach(async () => {
      snapshotId = await preservation.preserveState("layer1", mockState);
    });

    test("should restore state successfully", async () => {
      const restored = await preservation.restoreState(snapshotId);
      expect(restored.nodes).toEqual(mockState.nodes);
      expect(restored.connections).toEqual(mockState.connections);
      expect(restored.emergenceScore).toBe(mockState.emergenceScore);
      expect(restored._restored).toBeDefined();
    });

    test("should fail for non-existent snapshot", async () => {
      await expect(preservation.restoreState("fake-id")).rejects.toThrow(
        "Snapshot not found"
      );
    });

    test("should fail on integrity check failure", async () => {
      // Corrupt the snapshot by modifying internal state
      const snapshot = preservation.snapshots.get(snapshotId);
      snapshot.state.data = "corrupted";

      await expect(preservation.restoreState(snapshotId)).rejects.toThrow(
        "Snapshot integrity verification failed"
      );
    });
  });

  describe("Snapshot Management", () => {
    beforeEach(async () => {
      // Create test snapshots
      await preservation.preserveState("layer1", {
        nodes: [],
        connections: [],
      });
      await preservation.preserveState("layer2", {
        nodes: [],
        connections: [],
      });
    });

    test("should list all snapshots", () => {
      const snapshots = preservation.getSnapshots();
      expect(snapshots).toHaveLength(2);
    });

    test("should filter snapshots by layer", () => {
      const layer1Snapshots = preservation.getSnapshots("layer1");
      expect(layer1Snapshots).toHaveLength(1);
      expect(layer1Snapshots[0].layerId).toBe("layer1");
    });

    test("should sort snapshots by timestamp", async () => {
      // Add another snapshot with delay
      await new Promise((resolve) => setTimeout(resolve, 10));
      await preservation.preserveState("layer1", {
        nodes: [],
        connections: [],
      });

      const snapshots = preservation.getSnapshots("layer1");
      expect(snapshots).toHaveLength(2);
      expect(snapshots[0].timestamp).toBeGreaterThan(snapshots[1].timestamp);
    });
  });

  describe("Integrity Verification", () => {
    beforeEach(async () => {
      // Create test snapshots
      await preservation.preserveState("layer1", {
        nodes: [],
        connections: [],
      });
      await preservation.preserveState("layer2", {
        nodes: [],
        connections: [],
      });
    });

    test("should verify all snapshots", async () => {
      const results = await preservation.verifyAllSnapshots();
      expect(results.total).toBe(2);
      expect(results.verified).toBe(2);
      expect(results.failed).toBe(0);
    });

    test("should detect corrupted snapshots", async () => {
      // Corrupt one snapshot
      const snapshotId = preservation.getSnapshots()[0].id;
      const snapshot = preservation.snapshots.get(snapshotId);
      snapshot.state.data = "corrupted";

      const results = await preservation.verifyAllSnapshots();
      expect(results.verified).toBe(1);
      expect(results.failed).toBe(1);
      expect(results.failures).toContain(snapshotId);
    });
  });
});
