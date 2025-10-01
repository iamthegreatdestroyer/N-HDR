/*
 * HDR Empire Framework - HDR Empire Dashboard
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import EventEmitter from "events";
import { HDREmpireCommander } from "../command-interface/HDREmpireCommander.js";
import { SystemStatusMonitor } from "./SystemStatusMonitor.js";
import { CommandConsole } from "./CommandConsole.js";
import { ResourceManager } from "./ResourceManager.js";
import { ApplicationLauncher } from "./ApplicationLauncher.js";
import { SecurityControlCenter } from "./SecurityControlCenter.js";
import { SwarmMonitor } from "./SwarmMonitor.js";

/**
 * HDREmpireDashboard - Unified control center for HDR Empire Framework
 *
 * Provides centralized monitoring, command execution, and management
 * for all HDR systems and applications.
 *
 * Features:
 * - Real-time system status monitoring
 * - Natural language command interface
 * - Resource allocation and management
 * - Application lifecycle control
 * - Security management dashboard
 * - Swarm visualization and control
 * - Multi-dimensional navigation
 *
 * Integration:
 * - All 7 HDR systems (N-HDR, NS-HDR, O-HDR, Q-HDR, R-HDR, D-HDR, VB-HDR)
 * - Command Interface (HDREmpireCommander)
 * - Quantum Knowledge Explorer
 * - Consciousness State Workbench
 */
export class HDREmpireDashboard extends EventEmitter {
  constructor() {
    super();

    this.commander = null;
    this.systemMonitor = null;
    this.commandConsole = null;
    this.resourceManager = null;
    this.applicationLauncher = null;
    this.securityCenter = null;
    this.swarmMonitor = null;

    this.isInitialized = false;
    this.activeView = "overview";
    this.refreshInterval = null;
    this.refreshRate = 1000; // 1 second

    this.views = {
      overview: true,
      systems: true,
      applications: true,
      security: true,
      swarms: true,
      resources: true,
      console: true,
    };

    this.state = {
      systems: {},
      applications: {},
      security: {},
      swarms: {},
      resources: {},
      alerts: [],
      metrics: {},
    };
  }

  /**
   * Initialize the dashboard and all subsystems
   */
  async initialize(commander, options = {}) {
    try {
      if (this.isInitialized) {
        throw new Error("Dashboard already initialized");
      }

      console.log("Initializing HDR Empire Dashboard...");

      // Store commander reference
      this.commander = commander;

      // Configure refresh rate
      if (options.refreshRate) {
        this.refreshRate = options.refreshRate;
      }

      // Initialize all dashboard subsystems
      await this._initializeSubsystems(options);

      // Start auto-refresh
      if (!options.disableAutoRefresh) {
        this._startAutoRefresh();
      }

      // Subscribe to system events
      this._subscribeToEvents();

      this.isInitialized = true;

      this.emit("initialized", {
        timestamp: Date.now(),
        subsystems: Object.keys(this).filter(
          (key) =>
            this[key] &&
            typeof this[key] === "object" &&
            this[key].isInitialized
        ),
      });

      console.log("HDR Empire Dashboard initialized successfully");

      return {
        success: true,
        views: Object.keys(this.views),
        refreshRate: this.refreshRate,
      };
    } catch (error) {
      console.error("Dashboard initialization failed:", error);
      throw error;
    }
  }

  /**
   * Initialize all dashboard subsystems
   */
  async _initializeSubsystems(options) {
    // System Status Monitor
    this.systemMonitor = new SystemStatusMonitor();
    await this.systemMonitor.initialize(this.commander, {
      updateInterval: options.monitorUpdateInterval || 1000,
    });

    // Command Console
    this.commandConsole = new CommandConsole();
    await this.commandConsole.initialize(this.commander, {
      enableNLP: options.enableNLP !== false,
    });

    // Resource Manager
    this.resourceManager = new ResourceManager();
    await this.resourceManager.initialize(this.commander, {
      autoOptimize: options.autoOptimize !== false,
    });

    // Application Launcher
    this.applicationLauncher = new ApplicationLauncher();
    await this.applicationLauncher.initialize(this.commander, {
      autoStart: options.autoStartApps || [],
    });

    // Security Control Center
    this.securityCenter = new SecurityControlCenter();
    await this.securityCenter.initialize(this.commander, {
      securityLevel: options.securityLevel || "high",
    });

    // Swarm Monitor
    this.swarmMonitor = new SwarmMonitor();
    await this.swarmMonitor.initialize(this.commander, {
      visualization: options.enableSwarmVisualization !== false,
    });
  }

  /**
   * Subscribe to events from all subsystems
   */
  _subscribeToEvents() {
    // System monitor events
    this.systemMonitor.on("statusUpdate", (status) => {
      this.state.systems = status;
      this.emit("systemsUpdated", status);
    });

    this.systemMonitor.on("alert", (alert) => {
      this._handleAlert(alert);
    });

    // Command console events
    this.commandConsole.on("commandExecuted", (result) => {
      this.emit("commandResult", result);
    });

    // Application launcher events
    this.applicationLauncher.on("applicationStarted", (app) => {
      this.state.applications[app.id] = app;
      this.emit("applicationStateChanged", this.state.applications);
    });

    this.applicationLauncher.on("applicationStopped", (appId) => {
      delete this.state.applications[appId];
      this.emit("applicationStateChanged", this.state.applications);
    });

    // Security center events
    this.securityCenter.on("securityEvent", (event) => {
      this.state.security[event.id] = event;
      this.emit("securityAlert", event);

      if (event.severity === "critical") {
        this._handleAlert({
          type: "security",
          severity: "critical",
          message: event.message,
          timestamp: Date.now(),
        });
      }
    });

    // Swarm monitor events
    this.swarmMonitor.on("swarmUpdate", (swarms) => {
      this.state.swarms = swarms;
      this.emit("swarmsUpdated", swarms);
    });

    // Resource manager events
    this.resourceManager.on("resourcesUpdated", (resources) => {
      this.state.resources = resources;
      this.emit("resourcesUpdated", resources);
    });
  }

  /**
   * Start auto-refresh timer
   */
  _startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this._refreshDashboard();
    }, this.refreshRate);
  }

  /**
   * Refresh all dashboard data
   */
  async _refreshDashboard() {
    try {
      // Collect metrics from all subsystems
      const metrics = {
        systems: await this.systemMonitor.getMetrics(),
        applications: await this.applicationLauncher.getMetrics(),
        security: await this.securityCenter.getMetrics(),
        swarms: await this.swarmMonitor.getMetrics(),
        resources: await this.resourceManager.getMetrics(),
        timestamp: Date.now(),
      };

      this.state.metrics = metrics;
      this.emit("dashboardRefreshed", metrics);
    } catch (error) {
      console.error("Dashboard refresh failed:", error);
    }
  }

  /**
   * Handle system alerts
   */
  _handleAlert(alert) {
    this.state.alerts.push({
      ...alert,
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
    });

    // Keep only last 100 alerts
    if (this.state.alerts.length > 100) {
      this.state.alerts = this.state.alerts.slice(-100);
    }

    this.emit("alert", alert);
  }

  /**
   * Switch active view
   */
  async setActiveView(viewName) {
    if (!this.views[viewName]) {
      throw new Error(`Invalid view: ${viewName}`);
    }

    this.activeView = viewName;
    this.emit("viewChanged", viewName);

    return {
      view: viewName,
      data: await this._getViewData(viewName),
    };
  }

  /**
   * Get data for specific view
   */
  async _getViewData(viewName) {
    switch (viewName) {
      case "overview":
        return this._getOverviewData();
      case "systems":
        return this.state.systems;
      case "applications":
        return this.state.applications;
      case "security":
        return this.state.security;
      case "swarms":
        return this.state.swarms;
      case "resources":
        return this.state.resources;
      case "console":
        return await this.commandConsole.getHistory();
      default:
        return {};
    }
  }

  /**
   * Get overview dashboard data
   */
  _getOverviewData() {
    return {
      systems: {
        total: Object.keys(this.state.systems).length,
        active: Object.values(this.state.systems).filter(
          (s) => s.status === "active"
        ).length,
        status: this._getSystemsOverallStatus(),
      },
      applications: {
        total: Object.keys(this.state.applications).length,
        running: Object.values(this.state.applications).filter(
          (a) => a.status === "running"
        ).length,
      },
      security: {
        level: this.securityCenter?.getSecurityLevel() || "unknown",
        alerts: Object.values(this.state.security).filter(
          (e) => e.severity === "high" || e.severity === "critical"
        ).length,
      },
      swarms: {
        total: Object.keys(this.state.swarms).length,
        active: Object.values(this.state.swarms).filter(
          (s) => s.status === "active"
        ).length,
        bots: Object.values(this.state.swarms).reduce(
          (sum, s) => sum + (s.botCount || 0),
          0
        ),
      },
      resources: {
        cpu: this.state.resources.cpu || 0,
        memory: this.state.resources.memory || 0,
        storage: this.state.resources.storage || 0,
      },
      alerts: this.state.alerts.filter(
        (a) => Date.now() - a.timestamp < 3600000 // Last hour
      ).length,
      metrics: this.state.metrics,
    };
  }

  /**
   * Get overall systems status
   */
  _getSystemsOverallStatus() {
    const systems = Object.values(this.state.systems);
    if (systems.length === 0) return "unknown";

    if (systems.some((s) => s.status === "error")) return "error";
    if (systems.some((s) => s.status === "warning")) return "warning";
    if (systems.every((s) => s.status === "active")) return "active";

    return "partial";
  }

  /**
   * Execute command through console
   */
  async executeCommand(command, options = {}) {
    return await this.commandConsole.execute(command, options);
  }

  /**
   * Launch application
   */
  async launchApplication(appName, config = {}) {
    return await this.applicationLauncher.launch(appName, config);
  }

  /**
   * Get current dashboard state
   */
  getState() {
    return {
      ...this.state,
      activeView: this.activeView,
      isInitialized: this.isInitialized,
      refreshRate: this.refreshRate,
    };
  }

  /**
   * Get dashboard status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      activeView: this.activeView,
      subsystems: {
        systemMonitor: this.systemMonitor?.isInitialized || false,
        commandConsole: this.commandConsole?.isInitialized || false,
        resourceManager: this.resourceManager?.isInitialized || false,
        applicationLauncher: this.applicationLauncher?.isInitialized || false,
        securityCenter: this.securityCenter?.isInitialized || false,
        swarmMonitor: this.swarmMonitor?.isInitialized || false,
      },
      autoRefresh: !!this.refreshInterval,
      refreshRate: this.refreshRate,
    };
  }

  /**
   * Clear all alerts
   */
  clearAlerts() {
    const count = this.state.alerts.length;
    this.state.alerts = [];
    this.emit("alertsCleared", { count });
    return { cleared: count };
  }

  /**
   * Shutdown dashboard
   */
  async shutdown() {
    try {
      console.log("Shutting down HDR Empire Dashboard...");

      // Stop auto-refresh
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }

      // Shutdown all subsystems
      if (this.systemMonitor) await this.systemMonitor.shutdown();
      if (this.commandConsole) await this.commandConsole.shutdown();
      if (this.resourceManager) await this.resourceManager.shutdown();
      if (this.applicationLauncher) await this.applicationLauncher.shutdown();
      if (this.securityCenter) await this.securityCenter.shutdown();
      if (this.swarmMonitor) await this.swarmMonitor.shutdown();

      this.isInitialized = false;

      this.emit("shutdown", {
        timestamp: Date.now(),
      });

      console.log("HDR Empire Dashboard shutdown complete");

      return { success: true };
    } catch (error) {
      console.error("Dashboard shutdown failed:", error);
      throw error;
    }
  }
}
