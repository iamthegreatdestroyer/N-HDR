/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Quantum Processor Unit Tests
 */

const QuantumProcessor = require("../../src/core/quantum/quantum-processor");
const tf = require("@tensorflow/tfjs");
const { generateQuantumState, tensorUtils } = require("../utils/test-utils");

describe("QuantumProcessor", () => {
  let processor;
  let config;

  beforeEach(async () => {
    config = {
      dimensions: 8,
      optimizationLevel: "aggressive",
      errorCorrection: true,
      decoherenceThreshold: 0.1,
    };

    processor = new QuantumProcessor(config);
    await processor.initialize();
  });

  afterEach(async () => {
    await processor.cleanup();
  });

  describe("initialization", () => {
    it("should initialize successfully", () => {
      expect(processor.state.initialized).toBe(true);
      expect(processor.state.error).toBeNull();
      expect(processor.config).toEqual(config);
    });

    it("should set up quantum registers", () => {
      expect(processor.registers.size).toBeGreaterThan(0);
      expect(processor.registers.has("main")).toBe(true);
      expect(processor.registers.has("auxiliary")).toBe(true);
    });

    it("should initialize error correction", () => {
      expect(processor.errorCorrection).toBeDefined();
      expect(processor.errorCorrection.active).toBe(true);
    });
  });

  describe("quantum operations", () => {
    it("should apply quantum gates", async () => {
      const state = generateQuantumState(2);
      const hadamard = await processor.applyGate("hadamard", state, 0);

      expect(hadamard).toBeDefined();
      expect(hadamard.length).toBe(state.length);
      expect(Math.abs(hadamard[0] - 1 / Math.sqrt(2))).toBeLessThan(1e-10);
    });

    it("should handle entanglement", async () => {
      const state = generateQuantumState(2);
      const entangled = await processor.entangle(state, 0, 1);

      expect(entangled).toBeDefined();
      expect(entangled.length).toBe(state.length);
      expect(processor.isEntangled(entangled, 0, 1)).toBe(true);
    });

    it("should measure quantum states", async () => {
      const state = generateQuantumState(3);
      const measurement = await processor.measure(state);

      expect(measurement).toBeDefined();
      expect(measurement.result).toBeDefined();
      expect(measurement.probability).toBeGreaterThan(0);
      expect(measurement.probability).toBeLessThanOrEqual(1);
    });
  });

  describe("quantum error correction", () => {
    it("should detect errors", async () => {
      const state = generateQuantumState(4);
      const error = await processor.injectError(state, 0.1);
      const detected = await processor.detectErrors(error);

      expect(detected).toBeDefined();
      expect(detected.hasErrors).toBe(true);
      expect(detected.errorLocations.length).toBeGreaterThan(0);
    });

    it("should correct errors", async () => {
      const state = generateQuantumState(4);
      const error = await processor.injectError(state, 0.1);
      const corrected = await processor.correctErrors(error);

      expect(corrected).toBeDefined();
      const fidelity = await processor.calculateFidelity(state, corrected);
      expect(fidelity).toBeGreaterThan(0.9);
    });

    it("should handle error syndromes", async () => {
      const state = generateQuantumState(4);
      const syndrome = await processor.generateSyndrome(state);

      expect(syndrome).toBeDefined();
      expect(syndrome.pattern).toBeDefined();
      expect(syndrome.weight).toBeGreaterThanOrEqual(0);
    });
  });

  describe("quantum optimization", () => {
    it("should optimize quantum circuits", async () => {
      const circuit = [
        { type: "hadamard", target: 0 },
        { type: "cnot", control: 0, target: 1 },
        { type: "phase", target: 1 },
      ];

      const optimized = await processor.optimizeCircuit(circuit);
      expect(optimized.length).toBeLessThanOrEqual(circuit.length);
    });

    it("should reduce gate count", async () => {
      const circuit = [
        { type: "hadamard", target: 0 },
        { type: "hadamard", target: 0 },
      ];

      const optimized = await processor.optimizeCircuit(circuit);
      expect(optimized.length).toBe(0); // H*H = I
    });

    it("should preserve circuit functionality", async () => {
      const state = generateQuantumState(2);
      const circuit = [
        { type: "hadamard", target: 0 },
        { type: "cnot", control: 0, target: 1 },
      ];

      const original = await processor.executeCircuit(circuit, state);
      const optimized = await processor.optimizeAndExecute(circuit, state);

      const fidelity = await processor.calculateFidelity(original, optimized);
      expect(fidelity).toBeGreaterThan(0.99);
    });
  });

  describe("decoherence management", () => {
    it("should track decoherence", async () => {
      const state = generateQuantumState(4);
      const tracked = await processor.trackDecoherence(state, 100);

      expect(tracked).toBeDefined();
      expect(tracked.coherence).toBeLessThan(1);
      expect(tracked.time).toBe(100);
    });

    it("should mitigate decoherence", async () => {
      const state = generateQuantumState(4);
      const decoherent = await processor.applyDecoherence(state, 0.5);
      const mitigated = await processor.mitigateDecoherence(decoherent);

      const fidelity = await processor.calculateFidelity(state, mitigated);
      expect(fidelity).toBeGreaterThan(0.8);
    });

    it("should handle decoherence thresholds", async () => {
      const state = generateQuantumState(4);
      await processor.setDecoherenceThreshold(0.5);

      const result = await processor.checkDecoherence(state);
      expect(result.aboveThreshold).toBeDefined();
      expect(result.value).toBeGreaterThanOrEqual(0);
    });
  });

  describe("error handling", () => {
    it("should handle initialization errors", async () => {
      const invalidConfig = { ...config, dimensions: -1 };
      const invalidProcessor = new QuantumProcessor(invalidConfig);

      await expect(invalidProcessor.initialize()).rejects.toThrow();
    });

    it("should handle operation errors", async () => {
      const invalidState = new Float32Array(3); // Invalid size
      await expect(
        processor.applyGate("hadamard", invalidState, 0)
      ).rejects.toThrow();
    });

    it("should handle measurement errors", async () => {
      processor.state.initialized = false;
      const state = generateQuantumState(4);
      await expect(processor.measure(state)).rejects.toThrow();
    });
  });

  describe("utilities", () => {
    it("should calculate quantum metrics", async () => {
      const state = generateQuantumState(4);
      const metrics = await processor.calculateMetrics(state);

      expect(metrics).toBeDefined();
      expect(metrics.purity).toBeGreaterThan(0);
      expect(metrics.entropy).toBeGreaterThanOrEqual(0);
    });

    it("should validate quantum states", () => {
      const valid = generateQuantumState(4);
      const invalid = new Float32Array(3);

      expect(() => processor.validateState(valid)).not.toThrow();
      expect(() => processor.validateState(invalid)).toThrow();
    });

    it("should manage quantum registers", async () => {
      const register = await processor.createRegister(4);
      expect(register).toBeDefined();
      expect(register.size).toBe(4);
      expect(register.initialized).toBe(true);

      const cleared = await processor.clearRegister(register);
      expect(cleared).toBe(true);
      expect(register.initialized).toBe(false);
    });
  });
});
