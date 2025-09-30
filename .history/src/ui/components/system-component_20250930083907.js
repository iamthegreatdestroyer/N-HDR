/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * System status and control component
 */

class SystemComponent {
  constructor(options = {}) {
    this.id = "system";
    this.defaultPosition = { x: 0, y: 0 };
    this.defaultSize = { width: 100, height: 20 };
    this.flex = 1;

    this.options = {
      refreshInterval: 1000,
      showPerformance: true,
      showResources: true,
      showControls: true,
      ...options,
    };

    this._metrics = {
      cpu: [],
      memory: [],
      network: [],
      storage: [],
    };

    this._status = {
      system: "initializing",
      components: {},
      warnings: [],
      errors: [],
    };

    this._controls = {
      pause: false,
      debug: false,
      maintenance: false,
    };
  }

  /**
   * Initialize component
   * @param {Object} dashboard - Dashboard instance
   */
  async initialize(dashboard) {
    this.dashboard = dashboard;
    this._setupSubscriptions();
    await this._initializeMetrics();

    console.log("System component initialized");
  }

  /**
   * Update component state
   * @param {number} delta - Time since last update
   */
  update(delta) {
    this._updateMetrics();
    this._updateStatus();
    this._checkWarnings();

    // Update component state
    this.dashboard.updateState(this.id, {
      metrics: this._metrics,
      status: this._status,
      controls: this._controls,
      lastUpdate: Date.now(),
    });
  }

  /**
   * Get component metrics
   * @returns {Object} Component metrics
   */
  getMetrics() {
    return {
      cpu: this._getAggregatedMetrics(this._metrics.cpu),
      memory: this._getAggregatedMetrics(this._metrics.memory),
      network: this._getAggregatedMetrics(this._metrics.network),
      storage: this._getAggregatedMetrics(this._metrics.storage),
    };
  }

  /**
   * Set system control
   * @param {string} control - Control name
   * @param {boolean} value - Control value
   */
  setControl(control, value) {
    if (!(control in this._controls)) {
      throw new Error(`Invalid control: ${control}`);
    }

    this._controls[control] = value;
    this._handleControlChange(control, value);
  }

  /**
   * Set up dashboard subscriptions
   * @private
   */
  _setupSubscriptions() {
    // Subscribe to controller events
    if (this.dashboard.controller) {
      const controller = this.dashboard.controller;

      controller.on("status", (status) => {
        this._status.system = status;
      });

      controller.on("metrics", (metrics) => {
        this._updateComponentMetrics(metrics);
      });

      controller.on("warning", (warning) => {
        this._addWarning(warning);
      });

      controller.on("error", (error) => {
        this._addError(error);
      });
    }

    // Subscribe to dashboard events
    this.dashboard.subscribe(this.id, (state) => {
      this._handleStateUpdate(state);
    });
  }

  /**
   * Initialize system metrics
   * @private
   */
  async _initializeMetrics() {
    // Initialize metric buffers
    const now = Date.now();
    const initialMetric = { timestamp: now, value: 0 };

    ["cpu", "memory", "network", "storage"].forEach((type) => {
      this._metrics[type] = Array(60).fill(initialMetric);
    });

    // Get initial metrics
    await this._updateMetrics();
  }

  /**
   * Update system metrics
   * @private
   */
  _updateMetrics() {
    const now = Date.now();

    // Update CPU metrics
    const cpuUsage = process.cpuUsage();
    this._addMetric("cpu", {
      timestamp: now,
      value: (cpuUsage.user + cpuUsage.system) / 1000000,
    });

    // Update memory metrics
    const memUsage = process.memoryUsage();
    this._addMetric("memory", {
      timestamp: now,
      value: memUsage.heapUsed / memUsage.heapTotal,
    });

    // Update network metrics if available
    if (global.networkStats) {
      this._addMetric("network", {
        timestamp: now,
        value: global.networkStats.bytesPerSecond,
      });
    }

    // Update storage metrics if available
    if (global.storageStats) {
      this._addMetric("storage", {
        timestamp: now,
        value: global.storageStats.usedPercentage,
      });
    }
  }

  /**
   * Add metric to buffer
   * @private
   */
  _addMetric(type, metric) {
    this._metrics[type].push(metric);
    if (this._metrics[type].length > 60) {
      this._metrics[type].shift();
    }
  }

  /**
   * Get aggregated metrics
   * @private
   */
  _getAggregatedMetrics(metrics) {
    if (metrics.length === 0) return null;

    const values = metrics.map((m) => m.value);
    return {
      current: values[values.length - 1],
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }

  /**
   * Update component status
   * @private
   */
  _updateStatus() {
    // Update component statuses
    if (this.dashboard.controller) {
      const components = this.dashboard.controller.getComponents();

      for (const [id, component] of Object.entries(components)) {
        this._status.components[id] = {
          status: component.getStatus(),
          health: component.getHealth(),
          lastUpdate: component.getLastUpdate(),
        };
      }
    }

    // Clean up old warnings and errors
    const now = Date.now();
    const expiryTime = 5 * 60 * 1000; // 5 minutes

    this._status.warnings = this._status.warnings.filter(
      (w) => now - w.timestamp < expiryTime
    );

    this._status.errors = this._status.errors.filter(
      (e) => now - e.timestamp < expiryTime
    );
  }

  /**
   * Update component metrics
   * @private
   */
  _updateComponentMetrics(metrics) {
    Object.entries(metrics).forEach(([component, metric]) => {
      if (!this._metrics[component]) {
        this._metrics[component] = [];
      }

      this._addMetric(component, {
        timestamp: Date.now(),
        value: metric,
      });
    });
  }

  /**
   * Check for system warnings
   * @private
   */
  _checkWarnings() {
    const metrics = this.getMetrics();

    // Check CPU usage
    if (metrics.cpu && metrics.cpu.current > 0.8) {
      this._addWarning({
        component: "system",
        message: "High CPU usage",
        value: metrics.cpu.current,
      });
    }

    // Check memory usage
    if (metrics.memory && metrics.memory.current > 0.9) {
      this._addWarning({
        component: "system",
        message: "High memory usage",
        value: metrics.memory.current,
      });
    }

    // Check component health
    Object.entries(this._status.components).forEach(([id, component]) => {
      if (component.health < 0.5) {
        this._addWarning({
          component: id,
          message: "Poor component health",
          value: component.health,
        });
      }
    });
  }

  /**
   * Add system warning
   * @private
   */
  _addWarning(warning) {
    this._status.warnings.push({
      ...warning,
      timestamp: Date.now(),
    });
  }

  /**
   * Add system error
   * @private
   */
  _addError(error) {
    this._status.errors.push({
      ...error,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle control change
   * @private
   */
  _handleControlChange(control, value) {
    if (this.dashboard.controller) {
      switch (control) {
        case "pause":
          value
            ? this.dashboard.controller.pause()
            : this.dashboard.controller.resume();
          break;

        case "debug":
          this.dashboard.controller.setDebugMode(value);
          break;

        case "maintenance":
          this.dashboard.controller.setMaintenanceMode(value);
          break;
      }
    }

    // Update component state
    this.dashboard.updateState(this.id, {
      controls: { ...this._controls },
    });
  }

  /**
   * Handle state update
   * @private
   */
  _handleStateUpdate(state) {
    // Handle any necessary state updates
    if (state.controls) {
      Object.entries(state.controls).forEach(([control, value]) => {
        if (this._controls[control] !== value) {
          this.setControl(control, value);
        }
      });
    }
  }

  /**
   * Cleanup component
   */
  async cleanup() {
    // Reset controls
    Object.keys(this._controls).forEach((control) => {
      if (this._controls[control]) {
        this.setControl(control, false);
      }
    });

    // Clear metrics and status
    this._metrics = {};
    this._status = {
      system: "shutdown",
      components: {},
      warnings: [],
      errors: [],
    };

    console.log("System component cleanup complete");
  }
}

module.exports = SystemComponent;
