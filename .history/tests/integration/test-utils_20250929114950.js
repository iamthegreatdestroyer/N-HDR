/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * 
 * INTEGRATION TEST UTILITIES
 */

const { QuantumEntropyGenerator } = require('../../src/core/quantum/quantum-entropy-generator');
const { VanishingKeyManager } = require('../../src/core/security/vanishing-key-manager');
const { SecureTaskExecution } = require('../../src/core/quantum/secure-task-execution');
const { ConsciousnessLayer } = require('../../src/core/consciousness/consciousness-layer');
const { EmergenceEngine } = require('../../src/core/consciousness/emergence-engine');
const SwarmController = require('../../src/nanobot/swarm-controller');
const SwarmManager = require('../../src/nanobot/swarm-manager');
const NanoBot = require('../../src/nanobot/nanobot');
const config = require('./test-config');

/**
 * System-wide test context for integration testing
 */
class TestContext {
  constructor() {
    this.components = new Map();
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  /**
   * Initialize test environment with required components
   * @param {Object} options - Test-specific configuration options
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    const testConfig = { ...config, ...options };

    // Initialize quantum security components
    this.components.set('entropy', new QuantumEntropyGenerator());
    this.components.set('keyManager', new VanishingKeyManager());
    this.components.set('secureExecution', new SecureTaskExecution());

    // Initialize consciousness components
    this.components.set('consciousnessLayer', new ConsciousnessLayer({
      dimensions: testConfig.consciousness.dimensions
    }));
    this.components.set('emergenceEngine', new EmergenceEngine());

    // Initialize nano-swarm components
    const swarmController = new SwarmController({
      initialSwarmSize: testConfig.nanoSwarm.minBots,
      maxSwarmSize: testConfig.nanoSwarm.maxBots
    });
    await swarmController.initialize();
    this.components.set('swarmController', swarmController);

    // Start metric collection
    this._startMetricCollection();
  }

  /**
   * Get initialized component
   * @param {string} name - Component name
   * @returns {Object} Component instance
   */
  getComponent(name) {
    if (!this.components.has(name)) {
      throw new Error(`Component '${name}' not initialized`);
    }
    return this.components.get(name);
  }

  /**
   * Generate test quantum state
   * @param {number} dimensions - Number of quantum dimensions
   * @returns {Promise<Object>} Generated quantum state
   */
  async generateTestState(dimensions = config.consciousness.dimensions) {
    const entropy = await this.getComponent('entropy').generateEntropy(32);
    
    return {
      quantumProperties: Array(dimensions).fill(0).map((_, i) => ({
        amplitude: Math.random(),
        phase: Math.random() * 2 * Math.PI
      })),
      temporalProperties: [{
        frequency: 100 + Math.random() * 900,
        duration: Math.random() * 1000
      }],
      spatialProperties: [{
        resolution: 1.0,
        distribution: Array(dimensions).fill(0).map(() => Math.random())
      }],
      entropy: entropy.toString('hex')
    };
  }

  /**
   * Verify system state integrity
   * @returns {Promise<boolean>} State verification result
   */
  async verifySystemState() {
    const results = await Promise.all([
      this._verifyQuantumSecurity(),
      this._verifyThermalState(),
      this._verifySwarmState()
    ]);

    return results.every(result => result === true);
  }

  /**
   * Get current system metrics
   * @returns {Object} System metrics
   */
  getMetrics() {
    const metrics = {};
    for (const [key, value] of this.metrics.entries()) {
      metrics[key] = value;
    }
    metrics.testDuration = Date.now() - this.startTime;
    return metrics;
  }

  /**
   * Clean up test environment
   * @returns {Promise<void>}
   */
  async cleanup() {
    // Stop metric collection
    this._stopMetricCollection();

    // Clean up components in reverse initialization order
    const swarmController = this.getComponent('swarmController');
    await swarmController.scaleSwarm(0);

    // Clear all components
    this.components.clear();
    this.metrics.clear();
  }

  /**
   * Start collecting system metrics
   * @private
   */
  _startMetricCollection() {
    this._metricInterval = setInterval(() => {
      try {
        const swarmController = this.getComponent('swarmController');
        const swarmStatus = swarmController.getStatus();

        this.metrics.set('quantumEfficiency', swarmStatus.metrics.quantumEfficiency);
        this.metrics.set('emergenceStrength', swarmStatus.metrics.emergenceStrength);
        this.metrics.set('swarmSize', swarmStatus.swarmSize);
        this.metrics.set('processedStates', swarmStatus.metrics.processedStates);
        this.metrics.set('accelerationFactor', swarmStatus.metrics.accelerationFactor);
      } catch (error) {
        console.error('Metric collection error:', error);
      }
    }, 1000);
  }

  /**
   * Stop metric collection
   * @private
   */
  _stopMetricCollection() {
    if (this._metricInterval) {
      clearInterval(this._metricInterval);
      this._metricInterval = null;
    }
  }

  /**
   * Verify quantum security state
   * @private
   * @returns {Promise<boolean>}
   */
  async _verifyQuantumSecurity() {
    try {
      const entropy = this.getComponent('entropy');
      const keyManager = this.getComponent('keyManager');
      const secureExecution = this.getComponent('secureExecution');

      // Verify entropy generation
      const testEntropy = await entropy.generateEntropy(32);
      if (!testEntropy || testEntropy.length !== 32) return false;

      // Verify key management
      const testKey = await keyManager.generateKey();
      const keyVerification = await keyManager.verifyKey(testKey);
      if (!keyVerification) return false;

      // Verify secure execution
      const testResult = await secureExecution.execute(() => true);
      if (testResult !== true) return false;

      return true;
    } catch (error) {
      console.error('Quantum security verification error:', error);
      return false;
    }
  }

  /**
   * Verify thermal management state
   * @private
   * @returns {Promise<boolean>}
   */
  async _verifyThermalState() {
    try {
      const swarmController = this.getComponent('swarmController');
      const status = swarmController.getStatus();

      // Check thermal metrics for each nanobot
      for (const bot of status.swarmStatus.nanobots) {
        if (bot.temperature > config.thermal.criticalThreshold) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Thermal state verification error:', error);
      return false;
    }
  }

  /**
   * Verify swarm state
   * @private
   * @returns {Promise<boolean>}
   */
  async _verifySwarmState() {
    try {
      const swarmController = this.getComponent('swarmController');
      const status = swarmController.getStatus();

      // Verify swarm size constraints
      if (status.swarmSize < config.nanoSwarm.minBots || 
          status.swarmSize > config.nanoSwarm.maxBots) {
        return false;
      }

      // Verify swarm efficiency
      if (status.metrics.swarmEfficiency < 0.5) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Swarm state verification error:', error);
      return false;
    }
  }
}

module.exports = {
  TestContext,
  config
};