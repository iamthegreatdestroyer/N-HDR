/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * CONSCIOUSNESS LAYER TESTS
 * Validates consciousness layer functionality, emergence behavior, and node interaction.
 */

const ConsciousnessLayer = require("../../src/consciousness/consciousness-layer");

describe("ConsciousnessLayer", () => {
  let layer;

  beforeEach(() => {
    layer = new ConsciousnessLayer(3, "TestLayer", "#FF0000");
  });

  describe("Basic Operations", () => {
    test("should create layer with correct dimensions", () => {
      expect(layer.dimension).toBe(3);
      expect(layer.name).toBe("TestLayer");
      expect(layer.color).toBe("#FF0000");
      expect(layer.nodes.size).toBe(0);
    });

    test("should add nodes with generated positions", () => {
      const node = layer.addNode("test1", { value: 1 });
      expect(node).toBeDefined();
      expect(node.position.length).toBe(3);
      expect(layer.nodes.size).toBe(1);
    });

    test("should add nodes with specified positions", () => {
      const position = [0.1, 0.2, 0.3];
      const node = layer.addNode("test1", { value: 1 }, position);
      expect(node.position).toEqual(position);
    });

    test("should reject positions with wrong dimensions", () => {
      expect(() => {
        layer.addNode("test1", { value: 1 }, [0.1, 0.2]);
      }).toThrow();
    });
  });

  describe("Node Connections", () => {
    test("should connect nodes successfully", () => {
      const node1 = layer.addNode("test1", { value: 1 });
      const node2 = layer.addNode("test2", { value: 2 });

      const success = layer.connectNodes("test1", "test2");
      expect(success).toBe(true);

      expect(node1.connections.has("test2")).toBe(true);
      expect(node2.connections.has("test1")).toBe(true);
    });

    test("should fail to connect non-existent nodes", () => {
      const success = layer.connectNodes("fake1", "fake2");
      expect(success).toBe(false);
    });

    test("should automatically connect nearby nodes", () => {
      // Add nodes at specific positions
      layer.addNode("test1", { value: 1 }, [0, 0, 0]);
      layer.addNode("test2", { value: 2 }, [0.05, 0, 0]);
      layer.addNode("test3", { value: 3 }, [0.5, 0.5, 0.5]);

      const node1 = layer.nodes.get("test1");
      expect(node1.connections.size).toBeGreaterThan(0);
    });
  });

  describe("Activity Processing", () => {
    test("should process activity through the network", () => {
      // Create small test network
      layer.addNode("input", { type: "input" }, [0, 0, 0]);
      layer.addNode("hidden", { type: "hidden" }, [0.1, 0, 0]);
      layer.addNode("output", { type: "output" }, [0.2, 0, 0]);

      layer.connectNodes("input", "hidden");
      layer.connectNodes("hidden", "output");

      const result = layer.processActivity({ input: 1.0 });
      expect(result.activeNodes.length).toBeGreaterThan(0);
      expect(result.emergenceScore).toBeDefined();
    });

    test("should update node states during processing", () => {
      const node = layer.addNode("test", { value: 1 });
      layer.processActivity({ test: 0.6 }); // Above threshold

      expect(node.state.refractory).toBe(true);
      expect(node.activity).toBe(1);
    });
  });

  describe("Emergence Calculation", () => {
    test("should calculate emergence score", () => {
      // Create network with some activity
      for (let i = 0; i < 5; i++) {
        layer.addNode(`node${i}`, { value: i });
      }

      // Connect nodes
      for (let i = 0; i < 4; i++) {
        layer.connectNodes(`node${i}`, `node${i + 1}`);
      }

      // Process some activity
      layer.processActivity({ node0: 1.0 });

      const score = layer.calculateEmergence();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test("should identify emergent patterns", () => {
      // Create grid-like network
      const positions = [
        [0, 0, 0],
        [0.1, 0, 0],
        [0.2, 0, 0],
        [0, 0.1, 0],
        [0.1, 0.1, 0],
        [0.2, 0.1, 0],
        [0, 0.2, 0],
        [0.1, 0.2, 0],
        [0.2, 0.2, 0],
      ];

      positions.forEach((pos, i) => {
        layer.addNode(`node${i}`, { value: i }, pos);
      });

      // Create connections
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          if (Math.random() < 0.3) {
            // 30% chance of connection
            layer.connectNodes(`node${i}`, `node${j}`);
          }
        }
      }

      // Simulate network activity
      for (let i = 0; i < 5; i++) {
        layer.processActivity({
          [`node${Math.floor(Math.random() * positions.length)}`]: 1.0,
        });
      }

      const score = layer.calculateEmergence();
      expect(score).toBeGreaterThan(0); // Should detect some emergence
    });
  });

  describe("State Export/Import", () => {
    test("should export and import layer state", () => {
      // Create test network
      layer.addNode("test1", { value: 1 }, [0, 0, 0]);
      layer.addNode("test2", { value: 2 }, [0.1, 0, 0]);
      layer.connectNodes("test1", "test2");

      // Export state
      const state = layer.export();

      // Create new layer and import state
      const newLayer = new ConsciousnessLayer(3, "TestLayer", "#FF0000");
      newLayer.import(state);

      // Verify imported state
      expect(newLayer.nodes.size).toBe(layer.nodes.size);
      expect(newLayer.nodes.get("test1")).toBeDefined();
      expect(newLayer.nodes.get("test2")).toBeDefined();

      const node1 = newLayer.nodes.get("test1");
      expect(node1.connections.has("test2")).toBe(true);
    });

    test("should preserve node connections after import", () => {
      // Create complex network
      for (let i = 0; i < 5; i++) {
        layer.addNode(`node${i}`, { value: i });
      }

      for (let i = 0; i < 4; i++) {
        layer.connectNodes(`node${i}`, `node${i + 1}`);
      }

      // Export and import
      const state = layer.export();
      const newLayer = new ConsciousnessLayer(3, "TestLayer", "#FF0000");
      newLayer.import(state);

      // Verify connections
      for (let i = 0; i < 4; i++) {
        const node = newLayer.nodes.get(`node${i}`);
        expect(node.connections.has(`node${i + 1}`)).toBe(true);
      }
    });
  });
});
