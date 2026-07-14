/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * SystemMonitor.js
 * Real-time system metrics and state visualization
 */

import { EventEmitter } from "events";
import os from "os";
import { monitorEventLoopDelay } from "perf_hooks";
import tf from "@tensorflow/tfjs";

class SystemMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      samplingRate: config.samplingRate || 1000,
      metricBufferSize: config.metricBufferSize || 1000,
      anomalyThreshold: config.anomalyThreshold || 2.0,
      ...config,
    };

    this.state = {
      initialized: false,
      monitoring: false,
      error: null,
      timestamp: Date.now(),
    };

    this.metrics = new Map();
    this.anomalies = new Map();
    this.monitors = new Map();
    this.samplingTimer = null;

    // Real-telemetry sampling state (deltas between samples).
    this._lastCpuSnapshot = null; // aggregate os.cpus() times snapshot
    this._lastProcessCpu = null; // process.cpuUsage() snapshot
    this._eventLoopMonitor = null; // perf_hooks event-loop delay histogram
  }

  /**
   * Initialize system monitor
   * @param {Object} parameters - Initialization parameters
   * @returns {Promise<Object>} Initialization status
   */
  async initialize(parameters = {}) {
    try {
      await this._initializeMetrics();
      await this._setupMonitors(parameters);

      this._startMonitoring();

      this.state.initialized = true;
      this.emit("initialized", { timestamp: Date.now() });

      return {
        status: "initialized",
        metrics: this.metrics.size,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Monitor initialization failed: ${error.message}`);
    }
  }

  /**
   * Register metric
   * @param {string} name - Metric name
   * @param {Object} config - Metric configuration
   * @returns {string} Metric ID
   */
  registerMetric(name, config = {}) {
    const metricId = this._generateMetricId();

    this.metrics.set(metricId, {
      name,
      config,
      values: [],
      statistics: {},
      timestamp: Date.now(),
    });

    this.emit("metricRegistered", { metricId, name, timestamp: Date.now() });
    return metricId;
  }

  /**
   * Update metric value
   * @param {string} metricId - Metric ID
   * @param {number} value - Metric value
   */
  updateMetric(metricId, value) {
    const metric = this.metrics.get(metricId);
    if (!metric) return;

    metric.values.push({
      value,
      timestamp: Date.now(),
    });

    while (metric.values.length > this.config.metricBufferSize) {
      metric.values.shift();
    }

    this._updateStatistics(metricId);
    this._checkAnomaly(metricId);

    this.emit("metricUpdated", { metricId, value, timestamp: Date.now() });
  }

  /**
   * Get metric data
   * @param {string} metricId - Metric ID
   * @param {number} limit - Data limit
   * @returns {Object} Metric data
   */
  getMetricData(metricId, limit = null) {
    const metric = this.metrics.get(metricId);
    if (!metric) return null;

    const values = limit ? metric.values.slice(-limit) : metric.values;

    return {
      name: metric.name,
      values,
      statistics: metric.statistics,
      timestamp: Date.now(),
    };
  }

  /**
   * Initialize metrics
   * @private
   */
  async _initializeMetrics() {
    // Register default system metrics.
    // NOTE: metric IDs are generated, so collectors resolve them by name via
    // _metricIdByName(); the string keys here must stay in sync with the
    // _updateMetricByName() calls in the _check*Metrics() collectors.
    this.registerMetric("cpu_usage", { unit: "percent" });
    this.registerMetric("memory_usage", { unit: "bytes" });
    this.registerMetric("event_loop_latency", { unit: "ms" });
    this.registerMetric("neural_activity", { unit: "ms_cpu" });
    // Domain-simulation metrics: these model the consciousness engine's internal
    // state, NOT host hardware. There is no real sensor for them, so they remain
    // synthetic model outputs (clearly flagged, not passed off as telemetry).
    this.registerMetric("quantum_coherence", { unit: "ratio", simulated: true });
    this.registerMetric("dream_depth", { unit: "level", simulated: true });

    // Start the event-loop delay histogram used as a real responsiveness signal.
    this._eventLoopMonitor = monitorEventLoopDelay({ resolution: 20 });
    this._eventLoopMonitor.enable();
  }

  /**
   * Setup monitors
   * @private
   * @param {Object} parameters - Setup parameters
   */
  async _setupMonitors(parameters) {
    this.monitors.set("system", {
      check: this._checkSystemMetrics.bind(this),
      interval: 1000,
    });

    this.monitors.set("quantum", {
      check: this._checkQuantumMetrics.bind(this),
      interval: 500,
    });

    this.monitors.set("neural", {
      check: this._checkNeuralMetrics.bind(this),
      interval: 200,
    });

    this.monitors.set("dream", {
      check: this._checkDreamMetrics.bind(this),
      interval: 1000,
    });
  }

  /**
   * Start monitoring
   * @private
   */
  _startMonitoring() {
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
    }

    this.state.monitoring = true;
    this.samplingTimer = setInterval(() => {
      this._sampleMetrics();
    }, this.config.samplingRate);
  }

  /**
   * Sample metrics
   * @private
   */
  async _sampleMetrics() {
    for (const [name, monitor] of this.monitors) {
      try {
        await monitor.check();
      } catch (error) {
        this.emit("monitorError", {
          monitor: name,
          error: error.message,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Update statistics
   * @private
   * @param {string} metricId - Metric ID
   */
  _updateStatistics(metricId) {
    const metric = this.metrics.get(metricId);
    if (!metric || metric.values.length === 0) return;

    const values = metric.values.map((v) => v.value);
    const tensor = tf.tensor1d(values);

    metric.statistics = {
      mean: tensor.mean().arraySync(),
      std: tensor.std().arraySync(),
      min: tensor.min().arraySync(),
      max: tensor.max().arraySync(),
      timestamp: Date.now(),
    };

    tensor.dispose();
  }

  /**
   * Check for anomalies
   * @private
   * @param {string} metricId - Metric ID
   */
  _checkAnomaly(metricId) {
    const metric = this.metrics.get(metricId);
    if (!metric || !metric.statistics) return;

    const lastValue = metric.values[metric.values.length - 1].value;
    const zscore = Math.abs(
      (lastValue - metric.statistics.mean) / metric.statistics.std
    );

    if (zscore > this.config.anomalyThreshold) {
      const anomaly = {
        value: lastValue,
        zscore,
        timestamp: Date.now(),
      };

      this.anomalies.set(metricId, anomaly);
      this.emit("anomalyDetected", { metricId, anomaly });
    } else if (this.anomalies.has(metricId)) {
      this.anomalies.delete(metricId);
      this.emit("anomalyResolved", { metricId, timestamp: Date.now() });
    }
  }

  /**
   * Resolve a registered metric's generated ID from its human name.
   * @private
   * @param {string} name - Metric name
   * @returns {string|null} Metric ID or null if not registered
   */
  _metricIdByName(name) {
    for (const [id, metric] of this.metrics) {
      if (metric.name === name) return id;
    }
    return null;
  }

  /**
   * Update a metric by its registered name (convenience for collectors).
   * @private
   */
  _updateMetricByName(name, value) {
    const id = this._metricIdByName(name);
    if (id) this.updateMetric(id, value);
  }

  /**
   * Take an aggregate snapshot of CPU busy/total ticks across all cores.
   * @private
   * @returns {{idle: number, total: number}}
   */
  _readCpuSnapshot() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
      for (const t of Object.values(cpu.times)) total += t;
      idle += cpu.times.idle;
    }
    return { idle, total };
  }

  /**
   * Check system metrics (REAL host telemetry via Node's os / perf_hooks).
   * @private
   */
  async _checkSystemMetrics() {
    // CPU utilisation: derived from the delta of os.cpus() idle/total ticks
    // between samples. First sample has no delta, so fall back to the 1-minute
    // load average normalised by core count.
    const snapshot = this._readCpuSnapshot();
    let cpuPercent;
    if (this._lastCpuSnapshot) {
      const idleDelta = snapshot.idle - this._lastCpuSnapshot.idle;
      const totalDelta = snapshot.total - this._lastCpuSnapshot.total;
      cpuPercent = totalDelta > 0 ? (1 - idleDelta / totalDelta) * 100 : 0;
    } else {
      const cores = os.cpus().length || 1;
      cpuPercent = Math.min(100, (os.loadavg()[0] / cores) * 100);
    }
    this._lastCpuSnapshot = snapshot;
    this._updateMetricByName("cpu_usage", Number(cpuPercent.toFixed(2)));

    // Memory: real bytes in use = total - free.
    const usedBytes = os.totalmem() - os.freemem();
    this._updateMetricByName("memory_usage", usedBytes);

    // Event-loop latency (ms): a real process-responsiveness signal from the
    // perf_hooks histogram. Reset after each read so it reflects the last window.
    if (this._eventLoopMonitor) {
      const latencyMs = this._eventLoopMonitor.mean / 1e6; // ns -> ms
      this._updateMetricByName(
        "event_loop_latency",
        Number(latencyMs.toFixed(3))
      );
      this._eventLoopMonitor.reset();
    }
  }

  /**
   * Check quantum metrics.
   * @private
   *
   * Domain-simulation metric: the "quantum coherence" of the consciousness
   * engine has no physical sensor. This is an intentionally synthetic model
   * output (see registration flag `simulated: true`), not host telemetry.
   */
  async _checkQuantumMetrics() {
    this._updateMetricByName("quantum_coherence", Math.random());
  }

  /**
   * Check neural metrics (REAL process activity via process.cpuUsage()).
   * @private
   *
   * Reports the CPU time (ms) this process consumed since the previous sample —
   * a genuine measure of compute activity rather than random noise.
   */
  async _checkNeuralMetrics() {
    const now = process.cpuUsage();
    let activityMs = 0;
    if (this._lastProcessCpu) {
      const userDelta = now.user - this._lastProcessCpu.user;
      const systemDelta = now.system - this._lastProcessCpu.system;
      activityMs = (userDelta + systemDelta) / 1000; // microseconds -> ms
    }
    this._lastProcessCpu = now;
    this._updateMetricByName("neural_activity", Number(activityMs.toFixed(2)));
  }

  /**
   * Check dream metrics.
   * @private
   *
   * Domain-simulation metric: "dream depth" is an internal model state with no
   * physical sensor. Intentionally synthetic (see `simulated: true`), not
   * host telemetry.
   */
  async _checkDreamMetrics() {
    this._updateMetricByName("dream_depth", Math.floor(Math.random() * 10));
  }

  /**
   * Generate metric ID
   * @private
   * @returns {string} Generated ID
   */
  _generateMetricId() {
    return `metric-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  /**
   * Get monitor status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      monitoring: this.state.monitoring,
      metrics: this.metrics.size,
      anomalies: this.anomalies.size,
      error: this.state.error,
      timestamp: Date.now(),
    };
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
      this.samplingTimer = null;
    }
    this.state.monitoring = false;
    this.emit("monitoringStopped", { timestamp: Date.now() });
  }

  /**
   * Cleanup monitor
   */
  async cleanup() {
    this.stopMonitoring();

    if (this._eventLoopMonitor) {
      this._eventLoopMonitor.disable();
      this._eventLoopMonitor = null;
    }
    this._lastCpuSnapshot = null;
    this._lastProcessCpu = null;

    this.metrics.clear();
    this.anomalies.clear();
    this.monitors.clear();

    this.state.initialized = false;
    this.emit("cleaned", { timestamp: Date.now() });
  }
}

export default SystemMonitor;
