/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * QUANTUM ENTANGLEMENT TESTS
 * Validates quantum entanglement functionality and state propagation.
 */

jest.mock('../quantum/quantum-entropy-generator');
jest.mock('../quantum/secure-task-execution');

const QuantumEntanglement = require('../../src/consciousness/quantum-entanglement');
const { QuantumEntropyGenerator } = require('../../src/quantum/quantum-entropy-generator');
const { SecureTaskExecution } = require('../../src/quantum/secure-task-execution');

describe('QuantumEntanglement', () => {
  let entanglement;
  let mockEntropy;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock entropy
    mockEntropy = Buffer.from([128]); // Mid-range entropy value
    
    // Mock QuantumEntropyGenerator
    QuantumEntropyGenerator.mockImplementation(() => ({
      generateEntropy: jest.fn().mockResolvedValue(mockEntropy)
    }));
    
    // Mock SecureTaskExecution
    SecureTaskExecution.mockImplementation(() => ({
      execute: jest.fn().mockImplementation(async (task) => task())
    }));
    
    // Create entanglement manager
    entanglement = new QuantumEntanglement({
      maxEntanglements: 10,
      coherenceThreshold: 0.5,
      measurementInterval: 100
    });
  });

  describe('Configuration', () => {
    test('should initialize with default options', () => {
      const defaultEntanglement = new QuantumEntanglement();
      expect(defaultEntanglement.options.maxEntanglements).toBe(1000);
      expect(defaultEntanglement.options.coherenceThreshold).toBe(0.5);
      expect(defaultEntanglement.options.measurementInterval).toBe(100);
    });

    test('should initialize with custom options', () => {
      expect(entanglement.options.maxEntanglements).toBe(10);
      expect(entanglement.options.coherenceThreshold).toBe(0.5);
      expect(entanglement.options.measurementInterval).toBe(100);
    });
  });

  describe('Entanglement Creation', () => {
    test('should create entanglement between nodes', async () => {
      const entId = await entanglement.createEntanglement('node1', 'node2');
      expect(entId).toMatch(/^ent-/);
      
      const stats = entanglement.getStatistics();
      expect(stats.entanglementCount).toBe(1);
    });

    test('should prevent self-entanglement', async () => {
      await expect(entanglement.createEntanglement('node1', 'node1'))
        .rejects.toThrow('Cannot entangle node with itself');
    });

    test('should enforce node entanglement limits', async () => {
      // Create maximum allowed entanglements for node1
      for (let i = 0; i < 5; i++) {
        await entanglement.createEntanglement('node1', `node${i+2}`);
      }
      
      // Attempt to create one more
      await expect(entanglement.createEntanglement('node1', 'node7'))
        .rejects.toThrow('Node entanglement limit exceeded');
    });
  });

  describe('State Updates', () => {
    let entanglementId;
    
    beforeEach(async () => {
      entanglementId = await entanglement.createEntanglement('node1', 'node2');
    });

    test('should propagate state updates', async () => {
      const state = { value: 1, phase: 0.5 };
      const affectedNodes = await entanglement.updateNodeState('node1', state);
      
      expect(affectedNodes).toContain('node2');
      
      const node2State = await entanglement.getEntangledState('node2');
      expect(node2State.states[0].correlation).toBeGreaterThan(0);
    });

    test('should maintain correlation history', async () => {
      // Multiple state updates
      for (let i = 0; i < 3; i++) {
        await entanglement.updateNodeState('node1', { value: i });
      }
      
      const state = await entanglement.getEntangledState('node2');
      expect(state.states[0].correlation).toBeDefined();
    });
  });

  describe('Entanglement Breaking', () => {
    let entanglementId;
    
    beforeEach(async () => {
      entanglementId = await entanglement.createEntanglement('node1', 'node2');
    });

    test('should break entanglement successfully', async () => {
      const success = await entanglement.breakEntanglement(entanglementId);
      expect(success).toBe(true);
      
      const stats = entanglement.getStatistics();
      expect(stats.entanglementCount).toBe(0);
    });

    test('should handle non-existent entanglement', async () => {
      const success = await entanglement.breakEntanglement('fake-id');
      expect(success).toBe(false);
    });

    test('should clean up node references', async () => {
      await entanglement.breakEntanglement(entanglementId);
      
      const node1State = await entanglement.getEntangledState('node1');
      const node2State = await entanglement.getEntangledState('node2');
      
      expect(node1State.entanglementCount).toBe(0);
      expect(node2State.entanglementCount).toBe(0);
    });
  });

  describe('State Retrieval', () => {
    beforeEach(async () => {
      // Create multiple entanglements
      await entanglement.createEntanglement('node1', 'node2');
      await entanglement.createEntanglement('node1', 'node3');
    });

    test('should retrieve entangled states', async () => {
      const state = await entanglement.getEntangledState('node1');
      expect(state.entanglementCount).toBe(2);
      expect(state.states.length).toBe(2);
    });

    test('should sort states by correlation', async () => {
      // Update one entanglement more frequently
      await entanglement.updateNodeState('node1', { value: 1 });
      await entanglement.updateNodeState('node1', { value: 2 });
      
      const state = await entanglement.getEntangledState('node1');
      expect(state.states[0].correlation).toBeGreaterThanOrEqual(state.states[1].correlation);
    });
  });

  describe('System Statistics', () => {
    beforeEach(async () => {
      // Create network of entanglements
      await entanglement.createEntanglement('node1', 'node2');
      await entanglement.createEntanglement('node2', 'node3');
      await entanglement.createEntanglement('node3', 'node1');
    });

    test('should calculate system-wide statistics', () => {
      const stats = entanglement.getStatistics();
      expect(stats.entanglementCount).toBe(3);
      expect(stats.averageCorrelation).toBeDefined();
      expect(stats.averageCoherence).toBeDefined();
    });

    test('should track per-node statistics', () => {
      const stats = entanglement.getStatistics();
      expect(stats.nodeStats.node1.entanglements).toBe(2);
      expect(stats.nodeStats.node2.entanglements).toBe(2);
      expect(stats.nodeStats.node3.entanglements).toBe(2);
    });

    test('should handle decoherence', async () => {
      // Wait for some decoherence
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const stats = entanglement.getStatistics();
      expect(stats.averageCoherence).toBeLessThan(1);
    });
  });
});