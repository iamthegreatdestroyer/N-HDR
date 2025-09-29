/**
 * Performance Monitor for Neural-HDR System
 * © 2025 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 * HDR EMPIRE - CONFIDENTIAL
 *
 * Real-time performance monitoring system for Neural-HDR components.
 */

const EventEmitter = require("events");

class PerformanceMonitor extends EventEmitter {
  constructor(analyzer, optimizer, options = {}) {
    super();
    this.analyzer = analyzer;
    this.optimizer = optimizer;
    this.options = {
      monitoringInterval: options.monitoringInterval || 1000,
      alertThreshold: options.alertThreshold || 3,
      metricRetention: options.metricRetention || 3600,
      detailedLogging: options.detailedLogging !== false,
      ...options,
    };

    this.metrics = new Map();
    this.alerts = new Map();
    this.monitoring = false;

    this._setupEventHandlers();
  }

  /**
   * Starts performance monitoring
   */
  start() {
    if (this.monitoring) {
      return;
    }

    this.monitoring = true;
    this._startMonitoring();
    this.emit("started");
  }

  /**
   * Stops performance monitoring
   */
  stop() {
    if (!this.monitoring) {
      return;
    }

    this.monitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    this.emit("stopped");
  }

  /**
   * Gets current performance metrics
   * @param {string} [component] - Optional component filter
   * @returns {Object} Current metrics
   */
  getCurrentMetrics(component) {
    if (component) {
      return this.metrics.get(component);
    }
    return Object.fromEntries(this.metrics);
  }

  /**
   * Gets active alerts
   * @param {string} [severity] - Optional severity filter
   * @returns {Array} Active alerts
   */
  getActiveAlerts(severity) {
    const alerts = Array.from(this.alerts.values());
    if (severity) {
      return alerts.filter((alert) => alert.severity === severity);
    }
    return alerts;
  }

  /**
   * Gets performance summary
   * @returns {Object} Performance summary
   */
  getPerformanceSummary() {
    const summary = {
      timestamp: Date.now(),
      components: {},
      alerts: this.getActiveAlerts(),
      optimizations: this.optimizer.getActiveOptimizations(),
      status: "healthy",
    };

    for (const [component, metrics] of this.metrics) {
      summary.components[component] = {
        status: this._getComponentStatus(component),
        metrics: metrics.current,
        alerts: this.getActiveAlerts().filter(
          (alert) => alert.component === component
        ),
      };
    }

    // Determine overall status
    if (this.getActiveAlerts("critical").length > 0) {
      summary.status = "critical";
    } else if (this.getActiveAlerts("warning").length > 0) {
      summary.status = "warning";
    }

    return summary;
  }

  /**
   * Sets up event handlers
   * @private
   */
  _setupEventHandlers() {
    this.analyzer.on("issues", (issues) => {
      issues.forEach((issue) => this._handleIssue(issue));
    });

    this.optimizer.on("optimization-started", (opt) => {
      this._logOptimization("started", opt);
    });

    this.optimizer.on("optimization-completed", (opt) => {
      this._logOptimization("completed", opt);
    });

    this.optimizer.on("optimization-failed", (opt) => {
      this._logOptimization("failed", opt);
    });
  }

  /**
   * Starts the monitoring loop
   * @private
   */
  _startMonitoring() {
    this.monitorInterval = setInterval(async () => {
      if (!this.monitoring) {
        return;
      }

      const currentMetrics = await this.analyzer.getCurrentMetrics();
      this._updateMetrics(currentMetrics);
      this._checkAlerts();

      if (this.options.detailedLogging) {
        this._logPerformanceData();
      }
    }, this.options.monitoringInterval);
  }

  /**
   * Updates stored metrics
   * @param {Object} newMetrics - New metrics data
   * @private
   */
  _updateMetrics(newMetrics) {
    for (const [component, data] of Object.entries(newMetrics)) {
      if (!this.metrics.has(component)) {
        this.metrics.set(component, {
          current: data,
          history: [],
        });
      } else {
        const metrics = this.metrics.get(component);
        metrics.history.push({
          timestamp: Date.now(),
          data: metrics.current,
        });
        metrics.current = data;

        // Trim history
        while (
          metrics.history.length > 0 &&
          Date.now() - metrics.history[0].timestamp >
            this.options.metricRetention * 1000
        ) {
          metrics.history.shift();
        }
      }
    }
  }

  /**
   * Checks for alert conditions
   * @private
   */
  _checkAlerts() {
    for (const [component, metrics] of this.metrics) {
      const status = this._getComponentStatus(component);
      if (status !== "healthy") {
        this._createAlert(component, status);
      } else {
        this._clearAlert(component);
      }
    }
  }

  /**
   * Gets component status
   * @param {string} component - Component to check
   * @returns {string} Component status
   * @private
   */
  _getComponentStatus(component) {
    const metrics = this.metrics.get(component);
    if (!metrics) {
      return "unknown";
    }

    // Check for critical conditions
    if (this._hasThresholdViolation(component, "critical")) {
      return "critical";
    }

    // Check for warning conditions
    if (this._hasThresholdViolation(component, "warning")) {
      return "warning";
    }

    return "healthy";
  }

  /**
   * Checks for threshold violations
   * @param {string} component - Component to check
   * @param {string} level - Threshold level
   * @returns {boolean} Whether threshold is violated
   * @private
   */
  _hasThresholdViolation(component, level) {
    const metrics = this.metrics.get(component);
    if (!metrics) {
      return false;
    }

    switch (component) {
      case "cpu":
        const avgCpu = Array.isArray(metrics.current)
          ? metrics.current.reduce((a, b) => a + b, 0) / metrics.current.length
          : metrics.current;
        return level === "critical" ? avgCpu > 90 : avgCpu > 80;

      case "memory":
        const memUsage = (metrics.current.used / metrics.current.total) * 100;
        return level === "critical" ? memUsage > 90 : memUsage > 80;

      case "thermal":
        return level === "critical"
          ? metrics.current.temperature > 80
          : metrics.current.temperature > 70;

      case "quantum":
        return level === "critical"
          ? metrics.current.entropyQuality < 0.7
          : metrics.current.entropyQuality < 0.8;

      default:
        return false;
    }
  }

  /**
   * Creates an alert
   * @param {string} component - Component with issue
   * @param {string} status - Component status
   * @private
   */
  _createAlert(component, status) {
    const existingAlert = this.alerts.get(component);
    if (existingAlert && existingAlert.severity === status) {
      return;
    }

    const alert = {
      id: `${component}-${Date.now()}`,
      component,
      severity: status,
      timestamp: Date.now(),
      message: this._generateAlertMessage(component, status),
    };

    this.alerts.set(component, alert);
    this.emit("alert", alert);
  }

  /**
   * Clears an alert
   * @param {string} component - Component to clear alert for
   * @private
   */
  _clearAlert(component) {
    if (this.alerts.has(component)) {
      const alert = this.alerts.get(component);
      this.alerts.delete(component);
      this.emit("alert-cleared", alert);
    }
  }

  /**
   * Generates alert message
   * @param {string} component - Component with issue
   * @param {string} status - Component status
   * @returns {string} Alert message
   * @private
   */
  _generateAlertMessage(component, status) {
    const metrics = this.metrics.get(component);
    if (!metrics) {
      return `${status.toUpperCase()}: Issue detected in ${component}`;
    }

    switch (component) {
      case "cpu":
        const avgCpu = Array.isArray(metrics.current)
          ? metrics.current.reduce((a, b) => a + b, 0) / metrics.current.length
          : metrics.current;
        return `${status.toUpperCase()}: CPU usage at ${avgCpu.toFixed(1)}%`;

      case "memory":
        const memUsage = (metrics.current.used / metrics.current.total) * 100;
        return `${status.toUpperCase()}: Memory usage at ${memUsage.toFixed(
          1
        )}%`;

      case "thermal":
        return `${status.toUpperCase()}: Temperature at ${
          metrics.current.temperature
        }°C`;

      case "quantum":
        return `${status.toUpperCase()}: Entropy quality at ${metrics.current.entropyQuality.toFixed(
          2
        )}`;

      default:
        return `${status.toUpperCase()}: Issue detected in ${component}`;
    }
  }

  /**
   * Handles performance issues
   * @param {Object} issue - Performance issue
   * @private
   */
  _handleIssue(issue) {
    this._createAlert(issue.component, issue.severity);
  }

  /**
   * Logs optimization events
   * @param {string} event - Event type
   * @param {Object} optimization - Optimization details
   * @private
   */
  _logOptimization(event, optimization) {
    if (!this.options.detailedLogging) {
      return;
    }

    const message = `Optimization ${event} for ${optimization.component}: ${optimization.strategy.action}`;
    this.emit("log", {
      type: "optimization",
      event,
      message,
      optimization,
    });
  }

  /**
   * Logs performance data
   * @private
   */
  _logPerformanceData() {
    const summary = this.getPerformanceSummary();
    this.emit("log", {
      type: "performance",
      timestamp: Date.now(),
      summary,
    });
  }
}

module.exports = PerformanceMonitor;
