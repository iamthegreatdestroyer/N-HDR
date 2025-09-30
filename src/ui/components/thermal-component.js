/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Thermal visualization and management component
 */

class ThermalComponent {
  constructor(options = {}) {
    this.id = "thermal";
    this.defaultPosition = { x: 0, y: 20 };
    this.defaultSize = { width: 50, height: 30 };
    this.flex = 1;

    this.options = {
      refreshInterval: 1000,
      maxTemperature: 85, // °C
      warningTemperature: 75, // °C
      criticalTemperature: 80, // °C
      historyLength: 300, // 5 minutes at 1s interval
      enablePrediction: true,
      ...options,
    };

    this._data = {
      current: {
        cpu: 0,
        memory: 0,
        system: 0,
      },
      history: {
        cpu: [],
        memory: [],
        system: [],
      },
      predictions: {
        cpu: null,
        memory: null,
        system: null,
      },
      zones: [],
      throttling: 0,
      status: "normal",
    };

    this._alerts = [];
    this._lastUpdate = Date.now();
  }

  /**
   * Initialize component
   * @param {Object} dashboard - Dashboard instance
   */
  async initialize(dashboard) {
    this.dashboard = dashboard;
    this._setupSubscriptions();
    await this._initializeData();

    console.log("Thermal component initialized");
  }

  /**
   * Update component state
   * @param {number} delta - Time since last update
   */
  update(delta) {
    this._updateTemperatures();
    this._updatePredictions();
    this._checkThresholds();
    this._updateStatus();

    // Update component state
    this.dashboard.updateState(this.id, {
      data: this._data,
      alerts: this._alerts,
      lastUpdate: Date.now(),
    });
  }

  /**
   * Get component metrics
   * @returns {Object} Component metrics
   */
  getMetrics() {
    return {
      temperature: {
        current: this._data.current,
        average: this._calculateAverages(),
        max: this._getMaxTemperatures(),
        throttling: this._data.throttling,
      },
      status: this._data.status,
      alertCount: this._alerts.length,
    };
  }

  /**
   * Set up dashboard subscriptions
   * @private
   */
  _setupSubscriptions() {
    if (this.dashboard.controller) {
      const controller = this.dashboard.controller;

      // Subscribe to thermal manager events
      if (controller.thermalManager) {
        const thermal = controller.thermalManager;

        thermal.on("temperature", (temps) => {
          this._updateTemperatureData(temps);
        });

        thermal.on("throttling", (level) => {
          this._data.throttling = level;
        });

        thermal.on("warning", (warning) => {
          this._addAlert("warning", warning);
        });

        thermal.on("critical", (alert) => {
          this._addAlert("critical", alert);
        });
      }
    }

    // Subscribe to dashboard events
    this.dashboard.subscribe(this.id, (state) => {
      this._handleStateUpdate(state);
    });
  }

  /**
   * Initialize thermal data
   * @private
   */
  async _initializeData() {
    const now = Date.now();
    const initialData = { timestamp: now, value: 0 };

    // Initialize history buffers
    ["cpu", "memory", "system"].forEach((type) => {
      this._data.history[type] = Array(this.options.historyLength).fill(
        initialData
      );
    });

    // Get initial thermal zones if available
    if (this.dashboard.controller?.thermalManager) {
      this._data.zones =
        await this.dashboard.controller.thermalManager.getThermalZones();
    }

    // Get initial temperatures
    await this._updateTemperatures();
  }

  /**
   * Update temperature data
   * @private
   */
  _updateTemperatureData(temps) {
    const now = Date.now();

    // Update current temperatures
    Object.entries(temps).forEach(([type, value]) => {
      if (type in this._data.current) {
        this._data.current[type] = value;

        // Add to history
        this._data.history[type].push({
          timestamp: now,
          value: value,
        });

        // Maintain history length
        if (this._data.history[type].length > this.options.historyLength) {
          this._data.history[type].shift();
        }
      }
    });
  }

  /**
   * Update all temperatures
   * @private
   */
  _updateTemperatures() {
    if (!this.dashboard.controller?.thermalManager) return;

    const thermal = this.dashboard.controller.thermalManager;
    const temps = {
      cpu: thermal.getCpuTemperature(),
      memory: thermal.getMemoryTemperature(),
      system: thermal.getSystemTemperature(),
    };

    this._updateTemperatureData(temps);
  }

  /**
   * Update temperature predictions
   * @private
   */
  _updatePredictions() {
    if (!this.options.enablePrediction) return;

    ["cpu", "memory", "system"].forEach((type) => {
      const history = this._data.history[type];
      if (history.length >= 60) {
        // Need at least 1 minute of data
        this._data.predictions[type] = this._predictTemperature(history);
      }
    });
  }

  /**
   * Predict temperature trend
   * @private
   */
  _predictTemperature(history) {
    // Use linear regression for prediction
    const recent = history.slice(-60); // Last minute
    const x = recent.map((_, i) => i);
    const y = recent.map((point) => point.value);

    const { slope, intercept } = this._linearRegression(x, y);
    const prediction = {
      in1min: intercept + slope * 120, // Predict 1 minute ahead
      in5min: intercept + slope * 300, // Predict 5 minutes ahead
      trend: slope > 0 ? "rising" : slope < 0 ? "falling" : "stable",
    };

    return prediction;
  }

  /**
   * Calculate linear regression
   * @private
   */
  _linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Check temperature thresholds
   * @private
   */
  _checkThresholds() {
    Object.entries(this._data.current).forEach(([type, temp]) => {
      // Check warning threshold
      if (temp >= this.options.warningTemperature) {
        this._addAlert("warning", {
          component: type,
          temperature: temp,
          threshold: this.options.warningTemperature,
          message: `High temperature warning for ${type}`,
        });
      }

      // Check critical threshold
      if (temp >= this.options.criticalTemperature) {
        this._addAlert("critical", {
          component: type,
          temperature: temp,
          threshold: this.options.criticalTemperature,
          message: `Critical temperature alert for ${type}`,
        });
      }
    });
  }

  /**
   * Update component status
   * @private
   */
  _updateStatus() {
    const maxTemp = Math.max(...Object.values(this._data.current));

    if (maxTemp >= this.options.criticalTemperature) {
      this._data.status = "critical";
    } else if (maxTemp >= this.options.warningTemperature) {
      this._data.status = "warning";
    } else {
      this._data.status = "normal";
    }

    // Clean up old alerts
    const now = Date.now();
    this._alerts = this._alerts.filter(
      (alert) => now - alert.timestamp < 5 * 60 * 1000 // Keep 5 minutes
    );
  }

  /**
   * Add thermal alert
   * @private
   */
  _addAlert(level, data) {
    this._alerts.push({
      level,
      ...data,
      timestamp: Date.now(),
    });

    // Notify dashboard of critical alerts
    if (level === "critical") {
      this.dashboard._events.emit("thermalAlert", {
        component: this.id,
        ...data,
      });
    }
  }

  /**
   * Calculate temperature averages
   * @private
   */
  _calculateAverages() {
    const averages = {};

    Object.entries(this._data.history).forEach(([type, history]) => {
      const values = history.map((point) => point.value);
      averages[type] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    return averages;
  }

  /**
   * Get maximum temperatures
   * @private
   */
  _getMaxTemperatures() {
    const maxTemps = {};

    Object.entries(this._data.history).forEach(([type, history]) => {
      const values = history.map((point) => point.value);
      maxTemps[type] = Math.max(...values);
    });

    return maxTemps;
  }

  /**
   * Handle state update
   * @private
   */
  _handleStateUpdate(state) {
    // Handle any necessary state updates
    if (state.options) {
      this.options = {
        ...this.options,
        ...state.options,
      };
    }
  }

  /**
   * Cleanup component
   */
  async cleanup() {
    // Clear data and alerts
    this._data = {
      current: {},
      history: {},
      predictions: {},
      zones: [],
      throttling: 0,
      status: "shutdown",
    };
    this._alerts = [];

    console.log("Thermal component cleanup complete");
  }
}

module.exports = ThermalComponent;
