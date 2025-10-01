/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * QUANTUM ENTANGLEMENT
 * Manages quantum entanglement between consciousness nodes, enabling
 * instantaneous state synchronization and non-local correlations.
 */

import crypto from "crypto";
import {
  QuantumEntropyGenerator,
} from "../quantum/quantum-entropy-generator.js";
import { SecureTaskExecution } from "../quantum/secure-task-execution.js";

/**
 * @class EntanglementPair
 * @description Represents a quantum entangled pair of nodes
 * @private
 */
class EntanglementPair {
  /**
   * Creates a new EntanglementPair
   * @param {string} id - Unique pair identifier
   * @param {string} node1Id - First node identifier
   * @param {string} node2Id - Second node identifier
   */
  constructor(id, node1Id, node2Id) {
    this.id = id;
    this.node1Id = node1Id;
    this.node2Id = node2Id;
    this.state = {
      phase: 0,
      amplitude: 1.0,
      coherence: 1.0,
      lastMeasurement: null,
    };
    this.correlationHistory = [];
    this.createdAt = Date.now();
    this.lastUpdate = Date.now();
  }

  /**
   * Update entanglement state
   * @param {number} phase - New phase value
   * @param {number} amplitude - New amplitude value
   */
  updateState(phase, amplitude) {
    this.state.phase = phase;
    this.state.amplitude = amplitude;
    this.state.coherence *= 0.99; // Gradual decoherence
    this.lastUpdate = Date.now();
  }

  /**
   * Record correlation measurement
   * @param {Object} measurement - Measurement data
   */
  recordMeasurement(measurement) {
    this.state.lastMeasurement = {
      ...measurement,
      timestamp: Date.now(),
    };
    this.correlationHistory.push(this.state.lastMeasurement);

    // Keep only last 1000 measurements
    if (this.correlationHistory.length > 1000) {
      this.correlationHistory.shift();
    }
  }

  /**
   * Calculate correlation strength
   * @returns {number} Correlation strength between 0 and 1
   */
  calculateCorrelation() {
    if (this.correlationHistory.length < 2) return 1.0;

    let correlationSum = 0;
    for (let i = 1; i < this.correlationHistory.length; i++) {
      const prev = this.correlationHistory[i - 1];
      const curr = this.correlationHistory[i];
      correlationSum += Math.cos(curr.phase - prev.phase);
    }

    return Math.abs(correlationSum / (this.correlationHistory.length - 1));
  }
}

/**
 * @class QuantumEntanglement
 * @description Manages quantum entanglement between consciousness nodes
 * @copyright © 2025 Stephen Bilodeau - PATENT PENDING
 * @license PROPRIETARY
 */
class QuantumEntanglement {
  /**
   * Creates a new QuantumEntanglement manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      maxEntanglements: options.maxEntanglements || 1000,
      coherenceThreshold: options.coherenceThreshold || 0.5,
      measurementInterval: options.measurementInterval || 100,
      ...options,
    };

    this.entanglements = new Map();
    this.nodeEntanglements = new Map();
    this.entropyGenerator = new QuantumEntropyGenerator();
    this.secureExecution = new SecureTaskExecution();

    // Start measurement cycle
    this._startMeasurementCycle();
  }

  /**
   * Create quantum entanglement between nodes
   * @param {string} node1Id - First node identifier
   * @param {string} node2Id - Second node identifier
   * @returns {Promise<string>} Entanglement pair identifier
   */
  async createEntanglement(node1Id, node2Id) {
    if (node1Id === node2Id) {
      throw new Error("Cannot entangle node with itself");
    }

    // Check entanglement limits
    if (
      this._getNodeEntanglementCount(node1Id) >= 5 ||
      this._getNodeEntanglementCount(node2Id) >= 5
    ) {
      throw new Error("Node entanglement limit exceeded");
    }

    // Generate entanglement ID using quantum entropy
    const entropy = await this.entropyGenerator.generateEntropy(32);
    const entanglementId = `ent-${Buffer.from(entropy).toString("hex")}`;

    // Create entangled pair
    const pair = new EntanglementPair(entanglementId, node1Id, node2Id);

    // Initialize quantum state
    await this._initializeQuantumState(pair);

    // Store entanglement
    this.entanglements.set(entanglementId, pair);
    this._addNodeEntanglement(node1Id, entanglementId);
    this._addNodeEntanglement(node2Id, entanglementId);

    return entanglementId;
  }

  /**
   * Update node state and propagate through entanglement
   * @param {string} nodeId - Node identifier
   * @param {Object} state - New state
   * @returns {Promise<Array>} Array of affected node IDs
   */
  async updateNodeState(nodeId, state) {
    const affectedNodes = new Set();
    const entanglementIds = this.nodeEntanglements.get(nodeId) || [];

    await this.secureExecution.execute(async () => {
      for (const entId of entanglementIds) {
        const pair = this.entanglements.get(entId);
        if (!pair) continue;

        // Calculate quantum state changes
        const { phase, amplitude } = await this._calculateQuantumState(state);
        pair.updateState(phase, amplitude);

        // Identify target node
        const targetId = pair.node1Id === nodeId ? pair.node2Id : pair.node1Id;
        affectedNodes.add(targetId);

        // Record measurement
        pair.recordMeasurement({
          sourceId: nodeId,
          targetId,
          phase,
          amplitude,
          state: { ...state },
        });
      }
    });

    return Array.from(affectedNodes);
  }

  /**
   * Get entangled state for node
   * @param {string} nodeId - Node identifier
   * @returns {Promise<Object>} Entangled state
   */
  async getEntangledState(nodeId) {
    const entanglementIds = this.nodeEntanglements.get(nodeId) || [];
    const states = [];

    for (const entId of entanglementIds) {
      const pair = this.entanglements.get(entId);
      if (!pair || pair.state.coherence < this.options.coherenceThreshold) {
        continue;
      }

      states.push({
        entanglementId: pair.id,
        partnerId: pair.node1Id === nodeId ? pair.node2Id : pair.node1Id,
        state: { ...pair.state },
        correlation: pair.calculateCorrelation(),
      });
    }

    return {
      nodeId,
      entanglementCount: states.length,
      states: states.sort((a, b) => b.correlation - a.correlation),
    };
  }

  /**
   * Break quantum entanglement
   * @param {string} entanglementId - Entanglement identifier
   * @returns {Promise<boolean>} True if successfully broken
   */
  async breakEntanglement(entanglementId) {
    const pair = this.entanglements.get(entanglementId);
    if (!pair) return false;

    // Record final measurement
    const finalState = {
      phase: pair.state.phase,
      amplitude: 0,
      coherence: 0,
      type: "termination",
    };
    pair.recordMeasurement(finalState);

    // Remove from tracking
    this._removeNodeEntanglement(pair.node1Id, entanglementId);
    this._removeNodeEntanglement(pair.node2Id, entanglementId);
    this.entanglements.delete(entanglementId);

    return true;
  }

  /**
   * Get system-wide entanglement statistics
   * @returns {Object} Entanglement statistics
   */
  getStatistics() {
    let totalCorrelation = 0;
    let totalCoherence = 0;
    const nodeStats = new Map();

    for (const pair of this.entanglements.values()) {
      totalCorrelation += pair.calculateCorrelation();
      totalCoherence += pair.state.coherence;

      // Update node stats
      this._updateNodeStats(nodeStats, pair.node1Id);
      this._updateNodeStats(nodeStats, pair.node2Id);
    }

    const entanglementCount = this.entanglements.size;
    return {
      entanglementCount,
      averageCorrelation: entanglementCount
        ? totalCorrelation / entanglementCount
        : 0,
      averageCoherence: entanglementCount
        ? totalCoherence / entanglementCount
        : 0,
      nodeStats: Object.fromEntries(nodeStats),
    };
  }

  /**
   * Initialize quantum state for entanglement pair
   * @private
   * @param {EntanglementPair} pair - Entanglement pair
   */
  async _initializeQuantumState(pair) {
    const entropy = await this.entropyGenerator.generateEntropy(16);
    const phase =
      (crypto.createHash("sha256").update(entropy).digest()[0] / 255) *
      2 *
      Math.PI;

    pair.updateState(phase, 1.0);
  }

  /**
   * Calculate quantum state from node state
   * @private
   * @param {Object} state - Node state
   * @returns {Promise<Object>} Quantum state
   */
  async _calculateQuantumState(state) {
    const entropy = await this.entropyGenerator.generateEntropy(8);
    const entropyValue = entropy[0] / 255;

    // Calculate phase based on state and entropy
    const stateHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(state))
      .digest();
    const statePhase = (stateHash[0] / 255) * 2 * Math.PI;

    // Combine with entropy for final phase
    const phase = (statePhase + entropyValue * Math.PI) % (2 * Math.PI);
    const amplitude = Math.sqrt(1 - entropyValue * 0.1); // Slight random reduction

    return { phase, amplitude };
  }

  /**
   * Start periodic measurement cycle
   * @private
   */
  _startMeasurementCycle() {
    setInterval(() => {
      for (const pair of this.entanglements.values()) {
        // Apply decoherence
        pair.state.coherence *= 0.999;

        // Break entanglement if coherence is too low
        if (pair.state.coherence < this.options.coherenceThreshold) {
          this.breakEntanglement(pair.id);
        }
      }
    }, this.options.measurementInterval);
  }

  /**
   * Get number of entanglements for node
   * @private
   * @param {string} nodeId - Node identifier
   * @returns {number} Number of entanglements
   */
  _getNodeEntanglementCount(nodeId) {
    const entanglements = this.nodeEntanglements.get(nodeId);
    return entanglements ? entanglements.size : 0;
  }

  /**
   * Add entanglement to node tracking
   * @private
   * @param {string} nodeId - Node identifier
   * @param {string} entanglementId - Entanglement identifier
   */
  _addNodeEntanglement(nodeId, entanglementId) {
    if (!this.nodeEntanglements.has(nodeId)) {
      this.nodeEntanglements.set(nodeId, new Set());
    }
    this.nodeEntanglements.get(nodeId).add(entanglementId);
  }

  /**
   * Remove entanglement from node tracking
   * @private
   * @param {string} nodeId - Node identifier
   * @param {string} entanglementId - Entanglement identifier
   */
  _removeNodeEntanglement(nodeId, entanglementId) {
    const entanglements = this.nodeEntanglements.get(nodeId);
    if (entanglements) {
      entanglements.delete(entanglementId);
      if (entanglements.size === 0) {
        this.nodeEntanglements.delete(nodeId);
      }
    }
  }

  /**
   * Update node statistics
   * @private
   * @param {Map} stats - Statistics map
   * @param {string} nodeId - Node identifier
   */
  _updateNodeStats(stats, nodeId) {
    if (!stats.has(nodeId)) {
      stats.set(nodeId, {
        entanglements: 0,
        totalCorrelation: 0,
        averageCorrelation: 0,
      });
    }

    const nodeStats = stats.get(nodeId);
    const entanglements = this.nodeEntanglements.get(nodeId) || new Set();

    nodeStats.entanglements = entanglements.size;
    nodeStats.totalCorrelation = 0;

    for (const entId of entanglements) {
      const pair = this.entanglements.get(entId);
      if (pair) {
        nodeStats.totalCorrelation += pair.calculateCorrelation();
      }
    }

    nodeStats.averageCorrelation = nodeStats.entanglements
      ? nodeStats.totalCorrelation / nodeStats.entanglements
      : 0;
  }
}

export default QuantumEntanglement;
