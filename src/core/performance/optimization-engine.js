/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Optimization Engine - Automated system parameter optimization
 */

import eventBus from "../integration/event-bus.js";
import MetricsCollector from "../integration/metrics-collector.js";
import PerformanceAnalyzer from "./performance-analyzer.js";

class OptimizationEngine {
  constructor(options = {}) {
    this.options = {
      optimizationInterval: 300000, // 5 minutes
      learningRate: 0.1,
      explorationRate: 0.2,
      minSampleSize: 10,
      convergenceThreshold: 0.05,
      maxIterations: 100,
      parameterBounds: {
        "quantum.processingUnits": { min: 1, max: 32 },
        "quantum.tensorDimensions": { min: 2, max: 8 },
        "consciousness.layerCount": { min: 3, max: 12 },
        "nanoSwarm.parallelism": { min: 1, max: 16 },
        "system.batchSize": { min: 8, max: 256 },
      },
      ...options,
    };

    this.metrics = new MetricsCollector();
    this.analyzer = new PerformanceAnalyzer();
    this.currentState = {
      parameters: new Map(),
      performance: new Map(),
      history: [],
      iteration: 0,
    };

    this._setupMetrics();
  }

  /**
   * Start optimization process
   */
  async start() {
    // Initialize current parameters
    await this._initializeParameters();

    // Start optimization loop
    this._optimizationInterval = setInterval(
      () => this._runOptimizationCycle(),
      this.options.optimizationInterval
    );

    eventBus.publish("optimization.started", {
      timestamp: Date.now(),
      initialState: this.getCurrentState(),
    });
  }

  /**
   * Stop optimization process
   */
  async stop() {
    if (this._optimizationInterval) {
      clearInterval(this._optimizationInterval);
    }

    eventBus.publish("optimization.stopped", {
      timestamp: Date.now(),
      finalState: this.getCurrentState(),
    });
  }

  /**
   * Get current optimization state
   */
  getCurrentState() {
    return {
      parameters: Object.fromEntries(this.currentState.parameters),
      performance: Object.fromEntries(this.currentState.performance),
      iteration: this.currentState.iteration,
      improvements: this._calculateImprovements(),
    };
  }

  /**
   * Get optimization history
   */
  getHistory() {
    return this.currentState.history.map((entry) => ({
      timestamp: entry.timestamp,
      parameters: Object.fromEntries(entry.parameters),
      performance: Object.fromEntries(entry.performance),
      improvement: entry.improvement,
    }));
  }

  /**
   * Setup optimization metrics
   * @private
   */
  _setupMetrics() {
    // Optimization process metrics
    this.metrics.registerMetric("optimization.iteration", {
      type: "gauge",
      description: "Current optimization iteration",
    });

    this.metrics.registerMetric("optimization.improvement", {
      type: "gauge",
      description: "Performance improvement percentage",
    });

    this.metrics.registerMetric("optimization.convergence", {
      type: "gauge",
      description: "Optimization convergence measure",
    });

    // Parameter metrics
    Object.keys(this.options.parameterBounds).forEach((param) => {
      this.metrics.registerMetric(`optimization.parameter.${param}`, {
        type: "gauge",
        description: `Current value for ${param}`,
      });
    });
  }

  /**
   * Initialize system parameters
   * @private
   */
  async _initializeParameters() {
    // Set initial parameters to middle of allowed ranges
    Object.entries(this.options.parameterBounds).forEach(([param, bounds]) => {
      const initialValue = Math.floor((bounds.max + bounds.min) / 2);
      this.currentState.parameters.set(param, initialValue);
    });

    // Collect initial performance metrics
    await this._evaluatePerformance();
  }

  /**
   * Run optimization cycle
   * @private
   */
  async _runOptimizationCycle() {
    try {
      this.currentState.iteration++;

      // Store current state
      const previousState = this._cloneState();

      // Generate parameter candidates
      const candidates = this._generateCandidates();

      // Evaluate candidates
      const evaluations = await this._evaluateCandidates(candidates);

      // Select best parameters
      const bestCandidate = this._selectBestCandidate(evaluations);

      // Update parameters if improvement found
      if (bestCandidate.improvement > this.options.convergenceThreshold) {
        this.currentState.parameters = new Map(bestCandidate.parameters);
        await this._evaluatePerformance();

        // Record improvement
        this.currentState.history.push({
          timestamp: Date.now(),
          parameters: new Map(this.currentState.parameters),
          performance: new Map(this.currentState.performance),
          improvement: bestCandidate.improvement,
        });

        // Publish optimization event
        eventBus.publish("optimization.improvement", {
          timestamp: Date.now(),
          improvement: bestCandidate.improvement,
          parameters: Object.fromEntries(bestCandidate.parameters),
        });
      }

      // Update metrics
      this._updateMetrics();

      // Check convergence
      if (this._checkConvergence(previousState)) {
        await this.stop();
        eventBus.publish("optimization.converged", {
          timestamp: Date.now(),
          finalState: this.getCurrentState(),
        });
      }
    } catch (error) {
      eventBus.publish("optimization.error", {
        timestamp: Date.now(),
        error: error.message,
      });
    }
  }

  /**
   * Generate parameter candidates
   * @private
   */
  _generateCandidates() {
    const candidates = [];
    const numCandidates = Math.ceil(1 / this.options.learningRate);

    for (let i = 0; i < numCandidates; i++) {
      const candidate = new Map();

      // Generate candidate parameters
      for (const [param, bounds] of Object.entries(
        this.options.parameterBounds
      )) {
        const currentValue = this.currentState.parameters.get(param);
        const range = bounds.max - bounds.min;

        // Calculate new value with exploration
        let newValue;
        if (Math.random() < this.options.explorationRate) {
          // Random exploration
          newValue = bounds.min + Math.random() * range;
        } else {
          // Local optimization
          const delta =
            (Math.random() - 0.5) * 2 * range * this.options.learningRate;
          newValue = currentValue + delta;
        }

        // Clamp to bounds
        newValue = Math.max(
          bounds.min,
          Math.min(bounds.max, Math.floor(newValue))
        );
        candidate.set(param, newValue);
      }

      candidates.push(candidate);
    }

    return candidates;
  }

  /**
   * Evaluate parameter candidates
   * @private
   */
  async _evaluateCandidates(candidates) {
    const evaluations = [];

    for (const candidate of candidates) {
      // Apply candidate parameters
      this._applyParameters(candidate);

      // Wait for system to stabilize
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Evaluate performance
      const performance = await this._evaluatePerformance();

      // Calculate improvement
      const improvement = this._calculateImprovement(performance);

      evaluations.push({
        parameters: candidate,
        performance: new Map(performance),
        improvement,
      });
    }

    return evaluations;
  }

  /**
   * Apply system parameters
   * @private
   */
  _applyParameters(parameters) {
    // Publish parameter updates
    parameters.forEach((value, param) => {
      eventBus.publish("system.parameter.update", {
        parameter: param,
        value: value,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Evaluate system performance
   * @private
   */
  async _evaluatePerformance() {
    // Get current analysis from Performance Analyzer
    const analysis = await this.analyzer.getCurrentAnalysis();

    // Extract key performance indicators
    const performance = new Map([
      ["throughput", this._calculateThroughput(analysis)],
      ["latency", this._calculateLatency(analysis)],
      ["errorRate", this._calculateErrorRate(analysis)],
      ["resourceUtilization", this._calculateResourceUtilization(analysis)],
    ]);

    this.currentState.performance = performance;
    return performance;
  }

  /**
   * Calculate system throughput
   * @private
   */
  _calculateThroughput(analysis) {
    const metrics = analysis.metrics || {};
    return metrics.throughput || 0;
  }

  /**
   * Calculate system latency
   * @private
   */
  _calculateLatency(analysis) {
    const metrics = analysis.metrics || {};
    return metrics.responseTimes
      ? this._calculatePercentile(metrics.responseTimes, 95)
      : 0;
  }

  /**
   * Calculate error rate
   * @private
   */
  _calculateErrorRate(analysis) {
    const metrics = analysis.metrics || {};
    return metrics.errorRates || 0;
  }

  /**
   * Calculate resource utilization
   * @private
   */
  _calculateResourceUtilization(analysis) {
    const metrics = analysis.metrics || {};
    const cpu = metrics.cpu ? metrics.cpu.utilization : 0;
    const memory = metrics.memory
      ? metrics.memory.heapUsed / metrics.memory.heapTotal
      : 0;

    return (cpu + memory) / 2; // Average of CPU and memory utilization
  }

  /**
   * Select best parameter candidate
   * @private
   */
  _selectBestCandidate(evaluations) {
    return evaluations.reduce((best, current) => {
      return current.improvement > best.improvement ? current : best;
    });
  }

  /**
   * Calculate performance improvement
   * @private
   */
  _calculateImprovement(newPerformance) {
    const weights = {
      throughput: 0.4,
      latency: 0.3,
      errorRate: 0.2,
      resourceUtilization: 0.1,
    };

    let improvement = 0;
    let baselineMetric = 0;
    let newMetric = 0;

    for (const [metric, weight] of Object.entries(weights)) {
      const baseline = this.currentState.performance.get(metric) || 0;
      const current = newPerformance.get(metric) || 0;

      // For latency and error rate, lower is better
      const isInverse = metric === "latency" || metric === "errorRate";

      baselineMetric += weight * (isInverse ? -baseline : baseline);
      newMetric += weight * (isInverse ? -current : current);
    }

    improvement = (newMetric - baselineMetric) / Math.abs(baselineMetric);
    return Math.max(improvement, 0); // Only consider improvements
  }

  /**
   * Calculate improvements over time
   * @private
   */
  _calculateImprovements() {
    if (this.currentState.history.length < 2) return 0;

    const initial = this.currentState.history[0].performance;
    const current = this.currentState.performance;

    return (
      Array.from(current.entries()).reduce((total, [metric, value]) => {
        const initialValue = initial.get(metric) || 0;
        const improvement = (value - initialValue) / Math.abs(initialValue);
        return total + improvement;
      }, 0) / current.size
    );
  }

  /**
   * Check optimization convergence
   * @private
   */
  _checkConvergence(previousState) {
    if (this.currentState.iteration >= this.options.maxIterations) {
      return true;
    }

    if (this.currentState.history.length < this.options.minSampleSize) {
      return false;
    }

    // Calculate recent improvements
    const recentImprovements = this.currentState.history
      .slice(-this.options.minSampleSize)
      .map((entry) => entry.improvement);

    // Check if improvements are below threshold
    const avgImprovement =
      recentImprovements.reduce((a, b) => a + b, 0) / recentImprovements.length;

    return avgImprovement < this.options.convergenceThreshold;
  }

  /**
   * Update optimization metrics
   * @private
   */
  _updateMetrics() {
    this.metrics.recordMetric(
      "optimization.iteration",
      this.currentState.iteration
    );

    this.metrics.recordMetric(
      "optimization.improvement",
      this._calculateImprovements()
    );

    // Update parameter metrics
    this.currentState.parameters.forEach((value, param) => {
      this.metrics.recordMetric(`optimization.parameter.${param}`, value);
    });
  }

  /**
   * Clone current state
   * @private
   */
  _cloneState() {
    return {
      parameters: new Map(this.currentState.parameters),
      performance: new Map(this.currentState.performance),
      iteration: this.currentState.iteration,
    };
  }

  /**
   * Calculate percentile value
   * @private
   */
  _calculatePercentile(values, percentile) {
    if (!values || values.length === 0) return 0;

    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

export default OptimizationEngine;
