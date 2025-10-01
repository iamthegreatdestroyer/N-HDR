/*
 * HDR Empire Framework - Application Launcher
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
 * ApplicationLauncher - Manage HDR applications
 *
 * Controls lifecycle of HDR applications:
 * - Quantum Knowledge Explorer
 * - Consciousness State Workbench
 * - Custom applications
 *
 * Features:
 * - Application discovery
 * - Launch management
 * - Status monitoring
 * - Graceful shutdown
 * - Auto-restart on failure
 * - Resource coordination
 */
export class ApplicationLauncher extends EventEmitter {
  constructor() {
    super();

    this.commander = null;
    this.isInitialized = false;

    this.applications = new Map();

    this.registry = {
      "quantum-knowledge-explorer": {
        name: "Quantum Knowledge Explorer",
        path: "../applications/quantum-knowledge-explorer/QuantumKnowledgeExplorer.js",
        description: "Multi-dimensional knowledge exploration and navigation",
        systems: ["O-HDR", "Q-HDR", "R-HDR", "NS-HDR", "D-HDR", "VB-HDR"],
      },
      "consciousness-workbench": {
        name: "Consciousness State Workbench",
        path: "../applications/consciousness-workbench/ConsciousnessWorkbench.js",
        description: "AI consciousness state management and visualization",
        systems: ["N-HDR", "NS-HDR", "VB-HDR"],
      },
    };

    this.autoRestart = true;
    this.restartDelay = 5000; // 5 seconds
  }

  /**
   * Initialize application launcher
   */
  async initialize(commander, options = {}) {
    try {
      if (this.isInitialized) {
        throw new Error("Application launcher already initialized");
      }

      this.commander = commander;
      this.autoRestart = options.autoRestart !== false;

      // Register custom applications if provided
      if (options.customApps) {
        for (const [id, config] of Object.entries(options.customApps)) {
          this.registry[id] = config;
        }
      }

      // Auto-start applications if specified
      if (options.autoStart && Array.isArray(options.autoStart)) {
        for (const appId of options.autoStart) {
          try {
            await this.launch(appId);
          } catch (error) {
            console.error(`Failed to auto-start ${appId}:`, error.message);
          }
        }
      }

      this.isInitialized = true;

      this.emit("initialized", {
        applications: Object.keys(this.registry),
        autoRestart: this.autoRestart,
      });

      return { success: true };
    } catch (error) {
      console.error("Application launcher initialization failed:", error);
      throw error;
    }
  }

  /**
   * Launch an application
   */
  async launch(appId, config = {}) {
    try {
      if (!this.registry[appId]) {
        throw new Error(`Unknown application: ${appId}`);
      }

      if (this.applications.has(appId)) {
        throw new Error(`Application already running: ${appId}`);
      }

      const appConfig = this.registry[appId];

      console.log(`Launching ${appConfig.name}...`);

      // Dynamically import application
      const AppClass = await this._loadApplication(appConfig.path);

      // Create instance
      const instance = new AppClass();

      // Initialize application
      await instance.initialize(this.commander, config);

      // Store application info
      const appInfo = {
        id: appId,
        name: appConfig.name,
        description: appConfig.description,
        systems: appConfig.systems,
        instance,
        status: "running",
        startTime: Date.now(),
        config,
      };

      this.applications.set(appId, appInfo);

      // Subscribe to application events
      this._subscribeToAppEvents(appId, instance);

      this.emit("applicationStarted", appInfo);

      console.log(`${appConfig.name} launched successfully`);

      return {
        success: true,
        application: {
          id: appId,
          name: appConfig.name,
          status: "running",
        },
      };
    } catch (error) {
      console.error(`Failed to launch application ${appId}:`, error);
      throw error;
    }
  }

  /**
   * Load application module
   */
  async _loadApplication(path) {
    try {
      const module = await import(path);
      // Get default export or first exported class
      return module.default || Object.values(module)[0];
    } catch (error) {
      console.error(`Failed to load application from ${path}:`, error);
      throw new Error(`Application module not found: ${path}`);
    }
  }

  /**
   * Subscribe to application events
   */
  _subscribeToAppEvents(appId, instance) {
    instance.on("error", (error) => {
      this._handleApplicationError(appId, error);
    });

    instance.on("status", (status) => {
      const appInfo = this.applications.get(appId);
      if (appInfo) {
        appInfo.status = status.status;
        this.emit("applicationStatusChanged", {
          id: appId,
          status: status.status,
        });
      }
    });
  }

  /**
   * Handle application error
   */
  async _handleApplicationError(appId, error) {
    console.error(`Application ${appId} encountered error:`, error);

    const appInfo = this.applications.get(appId);
    if (!appInfo) return;

    appInfo.status = "error";
    appInfo.lastError = error.message;

    this.emit("applicationError", {
      id: appId,
      error: error.message,
    });

    // Auto-restart if enabled
    if (this.autoRestart) {
      console.log(
        `Scheduling restart for ${appId} in ${this.restartDelay}ms...`
      );

      setTimeout(async () => {
        try {
          await this.stop(appId);
          await this.launch(appId, appInfo.config);
          console.log(`Successfully restarted ${appId}`);
        } catch (restartError) {
          console.error(`Failed to restart ${appId}:`, restartError);
        }
      }, this.restartDelay);
    }
  }

  /**
   * Stop an application
   */
  async stop(appId) {
    try {
      if (!this.applications.has(appId)) {
        throw new Error(`Application not running: ${appId}`);
      }

      const appInfo = this.applications.get(appId);

      console.log(`Stopping ${appInfo.name}...`);

      // Shutdown application
      if (appInfo.instance && typeof appInfo.instance.shutdown === "function") {
        await appInfo.instance.shutdown();
      }

      // Remove from registry
      this.applications.delete(appId);

      this.emit("applicationStopped", appId);

      console.log(`${appInfo.name} stopped successfully`);

      return { success: true };
    } catch (error) {
      console.error(`Failed to stop application ${appId}:`, error);
      throw error;
    }
  }

  /**
   * Restart an application
   */
  async restart(appId) {
    const appInfo = this.applications.get(appId);
    if (!appInfo) {
      throw new Error(`Application not running: ${appId}`);
    }

    const config = appInfo.config;

    await this.stop(appId);
    await this.launch(appId, config);

    return { success: true };
  }

  /**
   * Get application status
   */
  getApplicationStatus(appId) {
    const appInfo = this.applications.get(appId);

    if (!appInfo) {
      return {
        id: appId,
        status: "stopped",
      };
    }

    return {
      id: appId,
      name: appInfo.name,
      description: appInfo.description,
      status: appInfo.status,
      startTime: appInfo.startTime,
      uptime: Date.now() - appInfo.startTime,
      systems: appInfo.systems,
    };
  }

  /**
   * Get all running applications
   */
  getRunningApplications() {
    return Array.from(this.applications.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      status: info.status,
      uptime: Date.now() - info.startTime,
    }));
  }

  /**
   * Get available applications
   */
  getAvailableApplications() {
    return Object.entries(this.registry).map(([id, config]) => ({
      id,
      name: config.name,
      description: config.description,
      systems: config.systems,
      running: this.applications.has(id),
    }));
  }

  /**
   * Get metrics
   */
  async getMetrics() {
    const running = this.getRunningApplications();

    return {
      total: Object.keys(this.registry).length,
      running: running.length,
      stopped: Object.keys(this.registry).length - running.length,
      applications: running.map((app) => ({
        id: app.id,
        name: app.name,
        status: app.status,
        uptime: app.uptime,
      })),
    };
  }

  /**
   * Shutdown all applications
   */
  async shutdown() {
    try {
      console.log("Shutting down all applications...");

      // Stop all running applications
      const stopPromises = Array.from(this.applications.keys()).map((appId) =>
        this.stop(appId).catch((error) => {
          console.error(`Failed to stop ${appId}:`, error);
        })
      );

      await Promise.all(stopPromises);

      this.isInitialized = false;

      this.emit("shutdown");

      console.log("All applications shut down");

      return { success: true };
    } catch (error) {
      console.error("Application launcher shutdown failed:", error);
      throw error;
    }
  }
}
