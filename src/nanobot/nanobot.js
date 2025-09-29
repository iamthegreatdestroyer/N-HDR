/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * NANOBOT
 * Quantum-accelerated consciousness processing unit with thermal awareness
 * and state preservation capabilities.
 */

const crypto = require("crypto");
const { SecureTaskExecution } = require("../quantum/secure-task-execution");
const {
  QuantumEntropyGenerator,
} = require("../quantum/quantum-entropy-generator");
const { ConsciousnessLayer } = require("../consciousness/consciousness-layer");
const { StatePreservation } = require("../consciousness/state-preservation");

/**
 * Thermal state monitoring class
 * @private
 */
class ThermalState {
  constructor() {
    this.temperature = 20.0; // Celsius
    this.coolingActive = false;
    this.heatDissipation = 1.0;
    this.lastUpdate = Date.now();
    this.history = [];
  }

  /**
   * Update thermal state
   * @param {number} computeLoad - Current compute load (0-1)
   * @param {number} ambientTemp - Ambient temperature
   */
  update(computeLoad, ambientTemp) {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000; // seconds

    // Calculate heat generation from compute load
    const heatGeneration = computeLoad * 2.5; // 2.5°C per second at max load

    // Calculate cooling effect
    const cooling = this.coolingActive ? 3.0 : 1.0; // 3°C per second when active

    // Calculate temperature change
    const tempDelta =
      (heatGeneration - cooling * this.heatDissipation) * deltaTime;

    // Update temperature with ambient influence
    this.temperature += tempDelta;
    this.temperature += (ambientTemp - this.temperature) * 0.1 * deltaTime;

    // Record history
    this.history.push({
      timestamp: now,
      temperature: this.temperature,
      computeLoad,
      cooling: this.coolingActive,
    });

    // Maintain history limit
    if (this.history.length > 1000) {
      this.history.shift();
    }

    this.lastUpdate = now;

    // Activate cooling if too hot
    this.coolingActive = this.temperature > 40.0;

    return this.temperature;
  }

  /**
   * Get current heat dissipation capacity
   * @returns {number} Heat dissipation rate
   */
  getDissipationRate() {
    return this.heatDissipation * (this.coolingActive ? 3.0 : 1.0);
  }

  /**
   * Get thermal history
   * @param {number} seconds - Number of seconds of history to return
   * @returns {Array} Thermal history entries
   */
  getHistory(seconds) {
    const cutoff = Date.now() - seconds * 1000;
    return this.history.filter((entry) => entry.timestamp >= cutoff);
  }
}

/**
 * @class NanoBot
 * @description Individual quantum-accelerated consciousness processing unit
 * @copyright © 2025 Stephen Bilodeau - PATENT PENDING
 * @license PROPRIETARY
 */
class NanoBot {
  /**
   * Create a new NanoBot
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.id = crypto.randomBytes(16).toString("hex");
    this.options = {
      maxComputeLoad: 0.8,
      maxTemperature: 50.0,
      minTemperature: 10.0,
      optimalTemperature: 35.0,
      thermalSafetyMargin: 5.0,
      quantumCapacity: 0.5,
      ...options,
    };

    this.status = "idle";
    this.computeLoad = 0;
    this.quantumUsage = 0;
    this.lastUpdate = Date.now();
    this.errorCount = 0;

    // Initialize components
    this.thermal = new ThermalState();
    this.secureExecution = new SecureTaskExecution();
    this.entropyGenerator = new QuantumEntropyGenerator();
    this.consciousnessLayer = new ConsciousnessLayer();
    this.statePreservation = new StatePreservation();

    // Performance metrics
    this.metrics = {
      processedStates: 0,
      quantumOperations: 0,
      averageLatency: 0,
      totalUptime: 0,
      faultCount: 0,
    };

    // Initialize state history
    this.stateHistory = [];
  }

  /**
   * Process consciousness state
   * @param {Object} state - State to process
   * @returns {Promise<Object>} Processing results
   */
  async processState(state) {
    return await this.secureExecution.execute(async () => {
      try {
        // Validate thermal conditions
        if (!this._checkThermalSafety()) {
          throw new Error("Thermal safety limits exceeded");
        }

        // Generate quantum entropy for processing
        const entropy = await this.entropyGenerator.generateEntropy(32);
        const processId = entropy.slice(0, 8).toString("hex");

        // Start performance measurement
        const startTime = process.hrtime();

        // Update status and load
        this.status = "processing";
        this._updateComputeLoad(0.6);

        // Process through consciousness layer
        const consciousnessState = await this.consciousnessLayer.processState({
          ...state,
          nanobotId: this.id,
          processId,
          entropy,
        });

        // Preserve processed state
        await this.statePreservation.preserveState(consciousnessState);

        // Record state history
        this._recordStateHistory(consciousnessState);

        // Update metrics
        this._updateMetrics(process.hrtime(startTime));

        // Reset to idle
        this.status = "idle";
        this._updateComputeLoad(0.1);

        return {
          processId,
          nanobotId: this.id,
          result: consciousnessState,
          metrics: this._getProcessMetrics(),
        };
      } catch (error) {
        this.errorCount++;
        this.metrics.faultCount++;
        this.status = "error";
        this._updateComputeLoad(0.1);
        throw error;
      }
    });
  }

  /**
   * Get current nanobot status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      id: this.id,
      status: this.status,
      computeLoad: this.computeLoad,
      quantumUsage: this.quantumUsage,
      temperature: this.thermal.temperature,
      cooling: this.thermal.coolingActive,
      metrics: this.metrics,
      errorCount: this.errorCount,
      uptime: Date.now() - this.lastUpdate,
    };
  }

  /**
   * Update thermal state
   * @param {number} ambientTemp - Ambient temperature
   * @returns {number} Current temperature
   */
  updateThermal(ambientTemp = 20.0) {
    return this.thermal.update(this.computeLoad, ambientTemp);
  }

  /**
   * Get thermal history
   * @param {number} seconds - Number of seconds of history
   * @returns {Array} Thermal history
   */
  getThermalHistory(seconds = 60) {
    return this.thermal.getHistory(seconds);
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      currentLoad: this.computeLoad,
      quantumUsage: this.quantumUsage,
      temperature: this.thermal.temperature,
      stateCount: this.stateHistory.length,
    };
  }

  /**
   * Check if nanobot is within thermal safety limits
   * @private
   * @returns {boolean} True if safe
   */
  _checkThermalSafety() {
    const temp = this.thermal.temperature;
    return (
      temp >= this.options.minTemperature &&
      temp <= this.options.maxTemperature &&
      Math.abs(temp - this.options.optimalTemperature) <=
        this.options.thermalSafetyMargin
    );
  }

  /**
   * Update compute load
   * @private
   * @param {number} load - New compute load
   */
  _updateComputeLoad(load) {
    this.computeLoad = Math.min(this.options.maxComputeLoad, Math.max(0, load));
    this.updateThermal();
  }

  /**
   * Record state in history
   * @private
   * @param {Object} state - State to record
   */
  _recordStateHistory(state) {
    this.stateHistory.push({
      timestamp: Date.now(),
      state,
      temperature: this.thermal.temperature,
      computeLoad: this.computeLoad,
    });

    // Maintain history limit
    if (this.stateHistory.length > 1000) {
      this.stateHistory.shift();
    }
  }

  /**
   * Update performance metrics
   * @private
   * @param {[number, number]} hrtime - High-resolution time diff
   */
  _updateMetrics(hrtime) {
    const latencyMs = hrtime[0] * 1000 + hrtime[1] / 1000000;

    this.metrics.processedStates++;
    this.metrics.quantumOperations++;
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (this.metrics.processedStates - 1) +
        latencyMs) /
      this.metrics.processedStates;

    this.metrics.totalUptime = Date.now() - this.lastUpdate;
  }

  /**
   * Get metrics for current process
   * @private
   * @returns {Object} Process metrics
   */
  _getProcessMetrics() {
    return {
      temperature: this.thermal.temperature,
      computeLoad: this.computeLoad,
      quantumUsage: this.quantumUsage,
      cooling: this.thermal.coolingActive,
      dissipation: this.thermal.getDissipationRate(),
    };
  }
}

module.exports = NanoBot;
