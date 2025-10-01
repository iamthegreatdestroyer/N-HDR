/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * SystemMonitor.js
 * Monitoring system for real-time HDR component health tracking
 */

import VoidBladeHDR from "../void-blade-hdr/VoidBladeHDR.js";
import EventEmitter from "events";

class SystemMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    this.security = new VoidBladeHDR(config.security);
    this.monitoredSystems = new Map();
    this.healthMetrics = new Map();
    this.alertThresholds = new Map();
    this.monitoringHistory = [];
    this.state = {
      initialized: false,
      secure: false,
      monitoring: false,
    };

    // Setup monitoring intervals
    this.intervals = {
      health: null,
      metrics: null,
      alerts: null,
    };
  }

  /**
   * Initialize monitor
   * @param {Object} parameters Monitor initialization parameters
   * @returns {Promise<Object>} Initialization status
   */
  async initialize(parameters) {
    try {
      await this._setupSecurity();
      await this._loadAlertThresholds();

      this.state.initialized = true;
      this.state.secure = true;

      return {
        status: "initialized",
        systems: this.monitoredSystems.size,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Monitor initialization failed: ${error.message}`);
    }
  }

  /**
   * Start global monitoring
   * @returns {Promise<Object>} Monitoring status
   */
  async startGlobalMonitoring() {
    if (!this.state.initialized) {
      throw new Error("Monitor not initialized");
    }

    try {
      // Start health checks
      this.intervals.health = setInterval(
        () => this._checkSystemHealth(),
        5000 // Every 5 seconds
      );

      // Start metrics collection
      this.intervals.metrics = setInterval(
        () => this._collectMetrics(),
        10000 // Every 10 seconds
      );

      // Start alert monitoring
      this.intervals.alerts = setInterval(
        () => this._checkAlertThresholds(),
        1000 // Every second
      );

      this.state.monitoring = true;
      return {
        status: "monitoring",
        systems: this.monitoredSystems.size,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Global monitoring start failed: ${error.message}`);
    }
  }

  /**
   * Stop global monitoring
   * @returns {Promise<Object>} Status after stopping
   */
  async stopGlobalMonitoring() {
    Object.values(this.intervals).forEach((interval) => {
      if (interval) clearInterval(interval);
    });

    this.state.monitoring = false;
    return {
      status: "stopped",
      timestamp: Date.now(),
    };
  }

  /**
   * Start monitoring specific system
   * @param {Object} registration System registration details
   * @returns {Promise<Object>} Monitoring status
   */
  async startMonitoring(registration) {
    if (!this.state.initialized) {
      throw new Error("Monitor not initialized");
    }

    try {
      await this._validateRegistration(registration);
      const securityZone = await this._createSecurityZone(registration.id);

      const monitoring = {
        id: registration.id,
        type: registration.type,
        security: {
          zoneId: securityZone.id,
          level: securityZone.level,
        },
        metrics: new Map(),
        health: "unknown",
        lastCheck: Date.now(),
        alerts: [],
      };

      this.monitoredSystems.set(registration.id, monitoring);
      this._recordMonitoringStart(monitoring);

      return {
        status: "monitoring",
        systemId: registration.id,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`System monitoring start failed: ${error.message}`);
    }
  }

  /**
   * Stop monitoring specific system
   * @param {string} systemId System ID
   * @returns {Promise<Object>} Status after stopping
   */
  async stopMonitoring(systemId) {
    const monitoring = this.monitoredSystems.get(systemId);
    if (!monitoring) {
      throw new Error(`System not monitored: ${systemId}`);
    }

    await this.security.verifyAccess(monitoring.security.zoneId);
    await this.security.deactivateZone(monitoring.security.zoneId);

    this.monitoredSystems.delete(systemId);
    this._recordMonitoringStop(systemId);

    return {
      status: "stopped",
      systemId,
      timestamp: Date.now(),
    };
  }

  /**
   * Get system status
   * @param {string} systemId System ID
   * @returns {Promise<Object>} System status
   */
  async getStatus(systemId) {
    const monitoring = this.monitoredSystems.get(systemId);
    if (!monitoring) {
      throw new Error(`System not monitored: ${systemId}`);
    }

    await this.security.verifyAccess(monitoring.security.zoneId);

    return {
      id: systemId,
      health: monitoring.health,
      metrics: Object.fromEntries(monitoring.metrics),
      alerts: monitoring.alerts,
      lastCheck: monitoring.lastCheck,
    };
  }

  /**
   * Set alert threshold
   * @param {string} metric Metric name
   * @param {Object} threshold Threshold configuration
   * @returns {Promise<Object>} Updated threshold
   */
  async setAlertThreshold(metric, threshold) {
    await this._validateThreshold(threshold);

    const registration = {
      metric,
      ...threshold,
      timestamp: Date.now(),
    };

    this.alertThresholds.set(metric, registration);
    this._recordThresholdUpdate(registration);

    return registration;
  }

  /**
   * Get health metrics
   * @param {string} systemId System ID
   * @returns {Promise<Object>} Health metrics
   */
  async getHealthMetrics(systemId) {
    const monitoring = this.monitoredSystems.get(systemId);
    if (!monitoring) {
      throw new Error(`System not monitored: ${systemId}`);
    }

    await this.security.verifyAccess(monitoring.security.zoneId);

    return {
      systemId,
      metrics: Object.fromEntries(monitoring.metrics),
      timestamp: Date.now(),
    };
  }

  /**
   * Set up monitor security
   * @private
   */
  async _setupSecurity() {
    const zone = await this.security.createSecurityZone({
      type: "system-monitor",
      level: "maximum",
    });

    await this.security.activateBarrier(zone.id, {
      type: "quantum",
      strength: "maximum",
    });
  }

  /**
   * Load alert thresholds
   * @private
   */
  async _loadAlertThresholds() {
    // Load core monitoring thresholds
    this.alertThresholds.set("cpuUsage", {
      warning: 80,
      critical: 90,
      interval: 1000,
    });

    this.alertThresholds.set("memoryUsage", {
      warning: 85,
      critical: 95,
      interval: 1000,
    });

    this.alertThresholds.set("responseTime", {
      warning: 1000,
      critical: 2000,
      interval: 5000,
    });
  }

  /**
   * Validate registration
   * @private
   * @param {Object} registration Registration to validate
   */
  async _validateRegistration(registration) {
    if (!registration.id || !registration.type) {
      throw new Error("Invalid registration format");
    }
  }

  /**
   * Create security zone
   * @private
   * @param {string} systemId System ID
   * @returns {Promise<Object>} Security zone details
   */
  async _createSecurityZone(systemId) {
    return await this.security.createSecurityZone({
      type: "monitored-system",
      systemId,
      level: "maximum",
    });
  }

  /**
   * Check system health
   * @private
   */
  async _checkSystemHealth() {
    for (const [systemId, monitoring] of this.monitoredSystems) {
      try {
        const metrics = await this._collectSystemMetrics(systemId);
        const health = this._calculateHealth(metrics);

        monitoring.metrics = metrics;
        monitoring.health = health;
        monitoring.lastCheck = Date.now();

        this.emit("health-update", {
          systemId,
          health,
          timestamp: Date.now(),
        });
      } catch (error) {
        monitoring.health = "error";
        monitoring.lastCheck = Date.now();

        this.emit("monitoring-error", {
          systemId,
          error: error.message,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Collect metrics
   * @private
   */
  async _collectMetrics() {
    for (const [systemId, monitoring] of this.monitoredSystems) {
      try {
        const metrics = await this._collectSystemMetrics(systemId);
        this.healthMetrics.set(systemId, metrics);

        this.emit("metrics-collected", {
          systemId,
          metrics,
          timestamp: Date.now(),
        });
      } catch (error) {
        this.emit("metrics-error", {
          systemId,
          error: error.message,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Check alert thresholds
   * @private
   */
  async _checkAlertThresholds() {
    for (const [systemId, monitoring] of this.monitoredSystems) {
      try {
        const metrics = monitoring.metrics;
        const alerts = [];

        for (const [metric, threshold] of this.alertThresholds) {
          const value = metrics.get(metric);
          if (value === undefined) continue;

          if (value >= threshold.critical) {
            alerts.push({
              level: "critical",
              metric,
              value,
              threshold: threshold.critical,
            });
          } else if (value >= threshold.warning) {
            alerts.push({
              level: "warning",
              metric,
              value,
              threshold: threshold.warning,
            });
          }
        }

        if (alerts.length > 0) {
          monitoring.alerts = alerts;
          this.emit("alerts", {
            systemId,
            alerts,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        this.emit("alert-error", {
          systemId,
          error: error.message,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Collect system metrics
   * @private
   * @param {string} systemId System ID
   * @returns {Promise<Map>} System metrics
   */
  async _collectSystemMetrics(systemId) {
    const metrics = new Map();

    // Simulate metric collection
    metrics.set("cpuUsage", Math.random() * 100);
    metrics.set("memoryUsage", Math.random() * 100);
    metrics.set("responseTime", Math.random() * 2000);
    metrics.set("throughput", Math.random() * 1000);
    metrics.set("errorRate", Math.random() * 1);

    return metrics;
  }

  /**
   * Calculate system health
   * @private
   * @param {Map} metrics System metrics
   * @returns {string} Health status
   */
  _calculateHealth(metrics) {
    // Simple health calculation based on critical thresholds
    for (const [metric, threshold] of this.alertThresholds) {
      const value = metrics.get(metric);
      if (value === undefined) continue;

      if (value >= threshold.critical) {
        return "critical";
      }
    }

    // Check warning thresholds
    let hasWarnings = false;
    for (const [metric, threshold] of this.alertThresholds) {
      const value = metrics.get(metric);
      if (value === undefined) continue;

      if (value >= threshold.warning) {
        hasWarnings = true;
        break;
      }
    }

    return hasWarnings ? "warning" : "healthy";
  }

  /**
   * Validate threshold configuration
   * @private
   * @param {Object} threshold Threshold to validate
   */
  async _validateThreshold(threshold) {
    if (
      typeof threshold.warning !== "number" ||
      typeof threshold.critical !== "number"
    ) {
      throw new Error("Invalid threshold values");
    }

    if (threshold.warning >= threshold.critical) {
      throw new Error("Warning threshold must be less than critical");
    }
  }

  /**
   * Record monitoring start
   * @private
   * @param {Object} monitoring Monitoring configuration
   */
  _recordMonitoringStart(monitoring) {
    this.monitoringHistory.push({
      type: "start",
      monitoring,
      timestamp: Date.now(),
    });
  }

  /**
   * Record monitoring stop
   * @private
   * @param {string} systemId System ID
   */
  _recordMonitoringStop(systemId) {
    this.monitoringHistory.push({
      type: "stop",
      systemId,
      timestamp: Date.now(),
    });
  }

  /**
   * Record threshold update
   * @private
   * @param {Object} threshold Updated threshold
   */
  _recordThresholdUpdate(threshold) {
    this.monitoringHistory.push({
      type: "threshold-update",
      threshold,
      timestamp: Date.now(),
    });
  }

  /**
   * Get monitor status
   * @returns {Object} Monitor status
   */
  getMonitorStatus() {
    return {
      initialized: this.state.initialized,
      secure: this.state.secure,
      monitoring: this.state.monitoring,
      systems: this.monitoredSystems.size,
      metrics: this.healthMetrics.size,
      thresholds: this.alertThresholds.size,
      timestamp: Date.now(),
    };
  }
}

export default SystemMonitor;
