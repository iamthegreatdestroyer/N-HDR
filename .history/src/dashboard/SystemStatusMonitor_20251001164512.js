/*
 * HDR Empire Framework - System Status Monitor
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import EventEmitter from "events";

/**
 * SystemStatusMonitor - Real-time monitoring of all HDR systems
 *
 * Continuously monitors health, performance, and status of:
 * - N-HDR (Neural)
 * - NS-HDR (Nano-Swarm)
 * - O-HDR (Omniscient)
 * - Q-HDR (Quantum)
 * - R-HDR (Reality)
 * - D-HDR (Dream)
 * - VB-HDR (Void-Blade)
 *
 * Features:
 * - Real-time status tracking
 * - Performance metrics collection
 * - Health check automation
 * - Alert generation
 * - Trend analysis
 */
export class SystemStatusMonitor extends EventEmitter {
  constructor() {
    super();

    this.commander = null;
    this.isInitialized = false;
    this.updateInterval = 1000;
    this.intervalTimer = null;

    this.systemStatus = {
      "neural-hdr": { status: "unknown", health: 0, metrics: {} },
      "nano-swarm": { status: "unknown", health: 0, metrics: {} },
      "omniscient-hdr": { status: "unknown", health: 0, metrics: {} },
      "quantum-hdr": { status: "unknown", health: 0, metrics: {} },
      "reality-hdr": { status: "unknown", health: 0, metrics: {} },
      "dream-hdr": { status: "unknown", health: 0, metrics: {} },
      "void-blade-hdr": { status: "unknown", health: 0, metrics: {} },
    };

    this.metrics = {
      updates: 0,
      alerts: 0,
      lastUpdate: null,
    };

    this.thresholds = {
      health: {
        critical: 30,
        warning: 60,
        good: 80,
      },
      responseTime: {
        critical: 5000,
        warning: 2000,
        good: 500,
      },
    };
  }

  /**
   * Initialize the monitor
   */
  async initialize(commander, options = {}) {
    try {
      if (this.isInitialized) {
        throw new Error("System monitor already initialized");
      }

      this.commander = commander;
      this.updateInterval = options.updateInterval || 1000;

      // Configure thresholds
      if (options.thresholds) {
        this.thresholds = { ...this.thresholds, ...options.thresholds };
      }

      // Perform initial status check
      await this.updateAllSystemStatus();

      // Start periodic updates
      this._startPeriodicUpdates();

      this.isInitialized = true;

      this.emit("initialized", {
        systems: Object.keys(this.systemStatus),
        updateInterval: this.updateInterval,
      });

      return { success: true };
    } catch (error) {
      console.error("System monitor initialization failed:", error);
      throw error;
    }
  }

  /**
   * Start periodic status updates
   */
  _startPeriodicUpdates() {
    this.intervalTimer = setInterval(async () => {
      await this.updateAllSystemStatus();
    }, this.updateInterval);
  }

  /**
   * Update status for all systems
   */
  async updateAllSystemStatus() {
    try {
      const updates = await Promise.allSettled([
        this.updateSystemStatus("neural-hdr"),
        this.updateSystemStatus("nano-swarm"),
        this.updateSystemStatus("omniscient-hdr"),
        this.updateSystemStatus("quantum-hdr"),
        this.updateSystemStatus("reality-hdr"),
        this.updateSystemStatus("dream-hdr"),
        this.updateSystemStatus("void-blade-hdr"),
      ]);

      this.metrics.updates++;
      this.metrics.lastUpdate = Date.now();

      this.emit("statusUpdate", this.systemStatus);

      return this.systemStatus;
    } catch (error) {
      console.error("Failed to update system status:", error);
      throw error;
    }
  }

  /**
   * Update status for a specific system
   */
  async updateSystemStatus(systemName) {
    try {
      const startTime = Date.now();

      // Get system status from commander
      const status = await this._querySystemStatus(systemName);

      const responseTime = Date.now() - startTime;

      // Calculate health score
      const health = this._calculateHealthScore(status, responseTime);

      // Update stored status
      this.systemStatus[systemName] = {
        status: status.active ? "active" : "inactive",
        health,
        responseTime,
        metrics: status.metrics || {},
        lastUpdate: Date.now(),
      };

      // Check for alerts
      this._checkAlerts(systemName, health, responseTime);

      return this.systemStatus[systemName];
    } catch (error) {
      this.systemStatus[systemName] = {
        status: "error",
        health: 0,
        error: error.message,
        lastUpdate: Date.now(),
      };

      this._emitAlert({
        system: systemName,
        severity: "critical",
        message: `System error: ${error.message}`,
      });

      throw error;
    }
  }

  /**
   * Query system status from commander
   */
  async _querySystemStatus(systemName) {
    try {
      // Try to get system status
      const result = await this.commander.executeCommand(
        systemName,
        "getStatus",
        {}
      );

      return {
        active: true,
        metrics: result || {},
      };
    } catch (error) {
      return {
        active: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate health score (0-100)
   */
  _calculateHealthScore(status, responseTime) {
    let score = 100;

    // Penalize for slow response
    if (responseTime > this.thresholds.responseTime.critical) {
      score -= 40;
    } else if (responseTime > this.thresholds.responseTime.warning) {
      score -= 20;
    } else if (responseTime > this.thresholds.responseTime.good) {
      score -= 10;
    }

    // Penalize for errors
    if (!status.active) {
      score = 0;
    } else if (status.error) {
      score -= 30;
    }

    // Bonus for good metrics
    if (status.metrics) {
      if (status.metrics.successRate > 0.95) score += 10;
      if (status.metrics.uptime > 0.99) score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check for alert conditions
   */
  _checkAlerts(systemName, health, responseTime) {
    // Critical health
    if (health < this.thresholds.health.critical) {
      this._emitAlert({
        system: systemName,
        severity: "critical",
        message: `Critical health: ${health}%`,
      });
    }
    // Warning health
    else if (health < this.thresholds.health.warning) {
      this._emitAlert({
        system: systemName,
        severity: "warning",
        message: `Low health: ${health}%`,
      });
    }

    // Critical response time
    if (responseTime > this.thresholds.responseTime.critical) {
      this._emitAlert({
        system: systemName,
        severity: "critical",
        message: `Critical response time: ${responseTime}ms`,
      });
    }
    // Warning response time
    else if (responseTime > this.thresholds.responseTime.warning) {
      this._emitAlert({
        system: systemName,
        severity: "warning",
        message: `Slow response time: ${responseTime}ms`,
      });
    }
  }

  /**
   * Emit alert event
   */
  _emitAlert(alert) {
    this.metrics.alerts++;

    this.emit("alert", {
      ...alert,
      timestamp: Date.now(),
    });
  }

  /**
   * Get status for specific system
   */
  getSystemStatus(systemName) {
    return this.systemStatus[systemName] || null;
  }

  /**
   * Get all system statuses
   */
  getAllSystemStatus() {
    return { ...this.systemStatus };
  }

  /**
   * Get overall health summary
   */
  getHealthSummary() {
    const systems = Object.values(this.systemStatus);
    const totalHealth = systems.reduce((sum, s) => sum + s.health, 0);
    const avgHealth = totalHealth / systems.length;

    const active = systems.filter((s) => s.status === "active").length;
    const inactive = systems.filter((s) => s.status === "inactive").length;
    const errors = systems.filter((s) => s.status === "error").length;

    return {
      overall: avgHealth,
      active,
      inactive,
      errors,
      status: this._getOverallStatus(avgHealth, errors),
    };
  }

  /**
   * Get overall status classification
   */
  _getOverallStatus(avgHealth, errors) {
    if (errors > 0) return "critical";
    if (avgHealth < this.thresholds.health.critical) return "critical";
    if (avgHealth < this.thresholds.health.warning) return "warning";
    if (avgHealth < this.thresholds.health.good) return "fair";
    return "excellent";
  }

  /**
   * Get metrics
   */
  async getMetrics() {
    return {
      ...this.metrics,
      health: this.getHealthSummary(),
      systems: Object.keys(this.systemStatus).reduce((obj, name) => {
        obj[name] = {
          health: this.systemStatus[name].health,
          status: this.systemStatus[name].status,
          responseTime: this.systemStatus[name].responseTime,
        };
        return obj;
      }, {}),
    };
  }

  /**
   * Shutdown monitor
   */
  async shutdown() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }

    this.isInitialized = false;
    this.emit("shutdown");

    return { success: true };
  }
}
