/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Integration Manager - System component coordination and integration service
 */

import eventBus from "./event-bus.js";
import ApiServer from "./api-server.js";
import WebSocketServer from "./websocket-server.js";
import MetricsCollector from "./metrics-collector.js";

class IntegrationManager {
  constructor(options = {}) {
    if (IntegrationManager.instance) {
      return IntegrationManager.instance;
    }
    IntegrationManager.instance = this;

    this.options = {
      startupTimeout: 30000, // 30 seconds
      shutdownTimeout: 10000, // 10 seconds
      healthCheckInterval: 5000, // 5 seconds
      autoRestart: true,
      ...options,
    };

    this._components = new Map();
    this._dependencies = new Map();
    this._state = {
      status: "initializing",
      startTime: null,
      lastHealthCheck: null,
      errors: [],
    };

    this._setupEventHandlers();
  }

  /**
   * Start the integration manager
   */
  async start() {
    this._state.status = "starting";
    this._state.startTime = Date.now();

    try {
      // Initialize core components
      await this._initializeComponents();

      // Start components in dependency order
      await this._startComponents();

      this._state.status = "running";
      console.log("Integration Manager started successfully");

      // Start health monitoring
      this._startHealthMonitoring();
    } catch (error) {
      this._state.status = "error";
      this._state.errors.push({
        timestamp: Date.now(),
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Stop the integration manager
   */
  async stop() {
    this._state.status = "stopping";

    try {
      // Stop components in reverse dependency order
      await this._stopComponents();

      this._state.status = "stopped";
      console.log("Integration Manager stopped successfully");
    } catch (error) {
      this._state.status = "error";
      this._state.errors.push({
        timestamp: Date.now(),
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      ...this._state,
      components: Array.from(this._components.entries()).map(
        ([name, component]) => ({
          name,
          status: component.status,
          uptime: component.startTime ? Date.now() - component.startTime : 0,
        })
      ),
    };
  }

  /**
   * Register system component
   * @param {string} name - Component name
   * @param {Object} component - Component instance
   * @param {Array} dependencies - Component dependencies
   */
  registerComponent(name, component, dependencies = []) {
    this._components.set(name, {
      instance: component,
      status: "registered",
      startTime: null,
      dependencies,
    });

    this._dependencies.set(name, new Set(dependencies));

    // Notify system
    eventBus.publish("integration.component.registered", {
      name,
      dependencies,
      timestamp: Date.now(),
    });
  }

  /**
   * Initialize core components
   * @private
   */
  async _initializeComponents() {
    // Register core components
    this.registerComponent("eventBus", eventBus, []);

    this.registerComponent("metricsCollector", new MetricsCollector(), [
      "eventBus",
    ]);

    this.registerComponent("apiServer", new ApiServer(), [
      "eventBus",
      "metricsCollector",
    ]);

    this.registerComponent("websocketServer", new WebSocketServer(), [
      "eventBus",
      "metricsCollector",
    ]);

    // Initialize metrics
    const metrics = this._components.get("metricsCollector").instance;

    // Register system metrics
    metrics.registerMetric("system.components.total", {
      type: "gauge",
      description: "Total number of registered components",
    });

    metrics.registerMetric("system.components.active", {
      type: "gauge",
      description: "Number of active components",
    });

    metrics.registerMetric("system.startup.duration", {
      type: "gauge",
      unit: "ms",
      description: "System startup duration",
    });
  }

  /**
   * Start components in dependency order
   * @private
   */
  async _startComponents() {
    const started = new Set();
    const pending = new Set(this._components.keys());
    const startTimeout = setTimeout(() => {
      throw new Error("Component startup timeout exceeded");
    }, this.options.startupTimeout);

    try {
      while (pending.size > 0) {
        let startedInRound = false;

        for (const name of pending) {
          const dependencies = this._dependencies.get(name);

          // Check if all dependencies are started
          if (Array.from(dependencies).every((dep) => started.has(dep))) {
            const component = this._components.get(name);

            // Start component
            if (component.instance.start) {
              await component.instance.start();
            }

            component.status = "running";
            component.startTime = Date.now();

            started.add(name);
            pending.delete(name);
            startedInRound = true;

            // Notify system
            eventBus.publish("integration.component.started", {
              name,
              timestamp: Date.now(),
            });
          }
        }

        if (!startedInRound && pending.size > 0) {
          throw new Error("Circular component dependency detected");
        }
      }
    } finally {
      clearTimeout(startTimeout);
    }

    // Record startup metrics
    const metrics = this._components.get("metricsCollector").instance;
    metrics.recordMetric(
      "system.startup.duration",
      Date.now() - this._state.startTime
    );
  }

  /**
   * Stop components in reverse dependency order
   * @private
   */
  async _stopComponents() {
    const stopped = new Set();
    const pending = new Set(this._components.keys());
    const stopTimeout = setTimeout(() => {
      throw new Error("Component shutdown timeout exceeded");
    }, this.options.shutdownTimeout);

    try {
      while (pending.size > 0) {
        let stoppedInRound = false;

        for (const name of pending) {
          // Check if all dependents are stopped
          const hasDependents = Array.from(this._dependencies.entries()).some(
            ([depName, deps]) => deps.has(name) && !stopped.has(depName)
          );

          if (!hasDependents) {
            const component = this._components.get(name);

            // Stop component
            if (component.instance.stop) {
              await component.instance.stop();
            }

            component.status = "stopped";
            component.startTime = null;

            stopped.add(name);
            pending.delete(name);
            stoppedInRound = true;

            // Notify system
            eventBus.publish("integration.component.stopped", {
              name,
              timestamp: Date.now(),
            });
          }
        }

        if (!stoppedInRound && pending.size > 0) {
          throw new Error("Error stopping components");
        }
      }
    } finally {
      clearTimeout(stopTimeout);
    }
  }

  /**
   * Start health monitoring
   * @private
   */
  _startHealthMonitoring() {
    setInterval(() => {
      this._checkComponentHealth();
    }, this.options.healthCheckInterval);
  }

  /**
   * Check component health
   * @private
   */
  _checkComponentHealth() {
    const metrics = this._components.get("metricsCollector").instance;
    let activeCount = 0;

    this._components.forEach((component, name) => {
      if (component.status === "running") {
        activeCount++;

        // Check component health
        if (component.instance.getMetrics) {
          const componentMetrics = component.instance.getMetrics();
          Object.entries(componentMetrics).forEach(([key, value]) => {
            metrics.recordMetric(`component.${name}.${key}`, value);
          });
        }
      } else if (component.status === "error" && this.options.autoRestart) {
        this._restartComponent(name);
      }
    });

    // Update system metrics
    metrics.recordMetric("system.components.total", this._components.size);
    metrics.recordMetric("system.components.active", activeCount);

    this._state.lastHealthCheck = Date.now();
  }

  /**
   * Restart failed component
   * @private
   */
  async _restartComponent(name) {
    try {
      const component = this._components.get(name);

      // Stop component if needed
      if (component.instance.stop) {
        await component.instance.stop();
      }

      // Start component
      if (component.instance.start) {
        await component.instance.start();
      }

      component.status = "running";
      component.startTime = Date.now();

      // Notify system
      eventBus.publish("integration.component.restarted", {
        name,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`Failed to restart component ${name}:`, error);
      this._state.errors.push({
        timestamp: Date.now(),
        component: name,
        error: error.message,
      });
    }
  }

  /**
   * Set up event handlers
   * @private
   */
  _setupEventHandlers() {
    eventBus.subscribe("system.error", (error) => {
      this._handleSystemError(error);
    });

    eventBus.subscribe("component.error", (error) => {
      this._handleComponentError(error);
    });
  }

  /**
   * Handle system error
   * @private
   */
  _handleSystemError(error) {
    this._state.errors.push({
      timestamp: Date.now(),
      error: error.message,
      type: "system",
    });

    // Notify metrics
    const metrics = this._components.get("metricsCollector").instance;
    metrics.recordMetric("system.errors", 1, { type: "system" });
  }

  /**
   * Handle component error
   * @private
   */
  _handleComponentError(error) {
    this._state.errors.push({
      timestamp: Date.now(),
      error: error.message,
      component: error.component,
      type: "component",
    });

    // Notify metrics
    const metrics = this._components.get("metricsCollector").instance;
    metrics.recordMetric("system.errors", 1, {
      type: "component",
      component: error.component,
    });

    // Check if component needs restart
    if (this.options.autoRestart) {
      this._restartComponent(error.component);
    }
  }
}

export default IntegrationManager;
