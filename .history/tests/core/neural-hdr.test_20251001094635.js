/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Neural-HDR Core Unit Tests
 */

const NeuralHDR = require("../../src/core/neural-hdr");
const SecurityManager = require("../../src/core/security/security-manager");
const QuantumProcessor = require("../../src/core/quantum/quantum-processor");
const {
  createMockConsciousnessState,
  createMockNanoSwarm,
  generateTestKey,
} = require("../utils/test-utils");

describe("NeuralHDR Core", () => {
  let neuralHdr;
  let securityManager;
  let quantumProcessor;
  let config;

  beforeEach(async () => {
    config = {
      quantumLayers: 6,
      security: {
        encryption: {
          algorithm: "aes-256-gcm",
          keySize: 256,
        },
        protection: {
          integrityCheck: true,
          tamperDetection: true,
        },
      },
      consciousness: {
        layers: [
          { name: "base", dimensions: 16 },
          { name: "cognitive", dimensions: 32 },
          { name: "memory", dimensions: 64 },
          { name: "emotional", dimensions: 24 },
          { name: "executive", dimensions: 48 },
          { name: "meta", dimensions: 8 },
        ],
      },
      acceleration: {
        nanoSwarmIntegration: true,
        swarmSize: 16,
        optimizationLevel: "aggressive",
      },
    };

    securityManager = new SecurityManager(config.security);
    quantumProcessor = new QuantumProcessor(config.quantumLayers);

    neuralHdr = new NeuralHDR(config);
    await neuralHdr.initialize();
  });

  afterEach(async () => {
    await neuralHdr.cleanup();
  });

  describe("initialization", () => {
    it("should initialize successfully", () => {
      expect(neuralHdr.state.initialized).toBe(true);
      expect(neuralHdr.state.error).toBeNull();
      expect(neuralHdr.config).toEqual(config);
    });

    it("should set up quantum layers", () => {
      expect(neuralHdr.layers.size).toBe(config.consciousness.layers.length);
      config.consciousness.layers.forEach((layer) => {
        expect(neuralHdr.layers.has(layer.name)).toBe(true);
      });
    });

    it("should initialize security", () => {
      expect(neuralHdr.security).toBeDefined();
      expect(neuralHdr.security.state.initialized).toBe(true);
    });

    it("should initialize quantum processor", () => {
      expect(neuralHdr.quantum).toBeDefined();
      expect(neuralHdr.quantum.state.initialized).toBe(true);
    });
  });

  describe("consciousness operations", () => {
    it("should capture consciousness state", async () => {
      const state = createMockConsciousnessState();
      const capture = await neuralHdr.captureState(state);

      expect(capture).toBeDefined();
      expect(capture.id).toMatch(/^nhdr-/);
      expect(capture.timestamp).toBeDefined();
      expect(capture.layers).toHaveLength(config.consciousness.layers.length);
    });

    it("should preserve consciousness state", async () => {
      const state = createMockConsciousnessState();
      const capture = await neuralHdr.captureState(state);
      const preserved = await neuralHdr.preserveState(capture);

      expect(preserved).toBeDefined();
      expect(preserved.id).toBe(capture.id);
      expect(preserved.encrypted).toBe(true);
      expect(preserved.signature).toBeDefined();
    });

    it("should transfer consciousness state", async () => {
      const state = createMockConsciousnessState();
      const capture = await neuralHdr.captureState(state);
      const preserved = await neuralHdr.preserveState(capture);
      const transferred = await neuralHdr.transferState(preserved);

      expect(transferred).toBeDefined();
      expect(transferred.id).toBe(preserved.id);
      expect(transferred.verified).toBe(true);
      expect(transferred.state).toBeDefined();
    });
  });

  describe("nano-swarm integration", () => {
    it("should integrate with NS-HDR", async () => {
      const swarm = createMockNanoSwarm(config.acceleration.swarmSize);
      const integrated = await neuralHdr.integrateNanoSwarm(swarm);

      expect(integrated).toBe(true);
      expect(neuralHdr.swarm).toBeDefined();
      expect(neuralHdr.swarm.size).toBe(config.acceleration.swarmSize);
    });

    it("should accelerate processing", async () => {
      const swarm = createMockNanoSwarm(config.acceleration.swarmSize);
      await neuralHdr.integrateNanoSwarm(swarm);

      const state = createMockConsciousnessState();
      const startTime = Date.now();
      const result = await neuralHdr.accelerateProcessing(state);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("error handling", () => {
    it("should handle initialization errors", async () => {
      const invalidConfig = { ...config, quantumLayers: -1 };
      const invalidHdr = new NeuralHDR(invalidConfig);

      await expect(invalidHdr.initialize()).rejects.toThrow();
    });

    it("should handle security errors", async () => {
      const state = createMockConsciousnessState();
      neuralHdr.security.state.initialized = false;

      await expect(neuralHdr.preserveState(state)).rejects.toThrow();
    });

    it("should handle quantum errors", async () => {
      const state = createMockConsciousnessState();
      neuralHdr.quantum.state.initialized = false;

      await expect(neuralHdr.captureState(state)).rejects.toThrow();
    });
  });

  describe("state transitions", () => {
    it("should handle state transitions", async () => {
      const states = [
        createMockConsciousnessState({ level: 0.3 }),
        createMockConsciousnessState({ level: 0.6 }),
        createMockConsciousnessState({ level: 0.9 }),
      ];

      for (const state of states) {
        const capture = await neuralHdr.captureState(state);
        expect(capture).toBeDefined();
        expect(capture.state.level).toBe(state.level);
      }

      expect(neuralHdr.transitions.size).toBe(2); // n-1 transitions
    });

    it("should maintain temporal consistency", async () => {
      const state1 = createMockConsciousnessState();
      const state2 = createMockConsciousnessState();

      const capture1 = await neuralHdr.captureState(state1);
      const capture2 = await neuralHdr.captureState(state2);

      expect(capture2.timestamp).toBeGreaterThan(capture1.timestamp);
    });
  });

  describe("utilities", () => {
    it("should generate valid state IDs", () => {
      const id = neuralHdr._generateStateId();
      expect(id).toMatch(/^nhdr-\d+-[a-z0-9]+$/);
    });

    it("should validate consciousness states", () => {
      const valid = createMockConsciousnessState();
      const invalid = { foo: "bar" };

      expect(() => neuralHdr._validateState(valid)).not.toThrow();
      expect(() => neuralHdr._validateState(invalid)).toThrow();
    });

    it("should manage layer operations", async () => {
      const layer = config.consciousness.layers[0];
      const state = createMockConsciousnessState();

      const processed = await neuralHdr._processLayer(layer, state);
      expect(processed).toBeDefined();
      expect(processed.dimensions).toBe(layer.dimensions);
    });
  });
});
