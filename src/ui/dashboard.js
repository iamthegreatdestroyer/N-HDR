/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Main dashboard component for Neural-HDR system
 */

const EventEmitter = require("events");

class Dashboard {
  constructor(options = {}) {
    this.options = {
      refreshRate: 1000,
      maxComponents: 10,
      theme: "dark",
      layout: "grid",
      ...options,
    };

    this._components = new Map();
    this._state = new Map();
    this._subscriptions = new Map();
    this._events = new EventEmitter();
    this._lastUpdate = Date.now();
    this._isRendering = false;
  }

  /**
   * Initialize the dashboard
   * @param {Object} controller - Neural-HDR controller instance
   */
  async initialize(controller) {
    this.controller = controller;
    this._setupEventHandlers();
    await this._initializeState();

    console.log("Dashboard initialized");
  }

  /**
   * Start dashboard rendering
   */
  async startRendering() {
    if (this._isRendering) return;

    this._isRendering = true;
    this._renderInterval = setInterval(
      () => this._render(),
      this.options.refreshRate
    );

    console.log("Dashboard rendering started");
  }

  /**
   * Stop dashboard rendering
   */
  async stopRendering() {
    if (!this._isRendering) return;

    clearInterval(this._renderInterval);
    this._isRendering = false;

    console.log("Dashboard rendering stopped");
  }

  /**
   * Register a component
   * @param {Object} component - UI component instance
   */
  registerComponent(component) {
    if (this._components.size >= this.options.maxComponents) {
      throw new Error("Maximum number of components reached");
    }

    this._components.set(component.id, component);
    this._initializeComponentState(component);

    console.log(`Registered component: ${component.id}`);
  }

  /**
   * Unregister a component
   * @param {string} componentId - Component ID
   */
  unregisterComponent(componentId) {
    this._components.delete(componentId);
    this._state.delete(componentId);

    console.log(`Unregistered component: ${componentId}`);
  }

  /**
   * Update component state
   * @param {string} componentId - Component ID
   * @param {Object} update - State update
   */
  updateState(componentId, update) {
    if (!this._state.has(componentId)) {
      throw new Error(`Component not found: ${componentId}`);
    }

    const currentState = this._state.get(componentId);
    const newState = { ...currentState, ...update };
    this._state.set(componentId, newState);

    this._events.emit("stateUpdate", {
      componentId,
      state: newState,
    });
  }

  /**
   * Get component state
   * @param {string} componentId - Component ID
   * @returns {Object} Component state
   */
  getState(componentId) {
    return this._state.get(componentId);
  }

  /**
   * Subscribe to state updates
   * @param {string} componentId - Component ID
   * @param {Function} handler - Update handler
   * @returns {Function} Unsubscribe function
   */
  subscribe(componentId, handler) {
    const subscription = (event) => {
      if (event.componentId === componentId) {
        handler(event.state);
      }
    };

    this._events.on("stateUpdate", subscription);
    return () => this._events.off("stateUpdate", subscription);
  }

  /**
   * Export dashboard metrics
   * @returns {Object} Dashboard metrics
   */
  exportMetrics() {
    const metrics = {
      timestamp: Date.now(),
      components: {},
      system: this._getSystemMetrics(),
    };

    for (const [id, component] of this._components) {
      metrics.components[id] = component.getMetrics();
    }

    return metrics;
  }

  /**
   * Initialize dashboard state
   * @private
   */
  async _initializeState() {
    // Initialize global state
    this._state.set("global", {
      theme: this.options.theme,
      layout: this.options.layout,
      startTime: Date.now(),
      systemStatus: "initializing",
    });

    // Initialize controller state
    if (this.controller) {
      this._state.set("controller", {
        status: this.controller.getStatus(),
        metrics: this.controller.getMetrics(),
        config: this.controller.getConfig(),
      });
    }
  }

  /**
   * Initialize component state
   * @private
   */
  _initializeComponentState(component) {
    this._state.set(component.id, {
      visible: true,
      position: component.defaultPosition || { x: 0, y: 0 },
      size: component.defaultSize || { width: 1, height: 1 },
      data: component.initialData || {},
    });
  }

  /**
   * Set up event handlers
   * @private
   */
  _setupEventHandlers() {
    if (this.controller) {
      // Handle controller events
      this.controller.on("status", (status) => {
        this.updateState("controller", { status });
      });

      this.controller.on("metrics", (metrics) => {
        this.updateState("controller", { metrics });
      });

      // Handle system events
      this.controller.on("error", (error) => {
        this._handleError(error);
      });
    }

    // Handle window events if in browser environment
    if (typeof window !== "undefined") {
      window.addEventListener("resize", () => {
        this._handleResize();
      });
    }
  }

  /**
   * Render dashboard
   * @private
   */
  _render() {
    const now = Date.now();
    const delta = now - this._lastUpdate;

    // Update component states
    for (const component of this._components.values()) {
      if (component.update) {
        component.update(delta);
      }
    }

    // Update system state
    this._updateSystemState();

    // Emit render event
    this._events.emit("render", {
      timestamp: now,
      delta,
    });

    this._lastUpdate = now;
  }

  /**
   * Update system state
   * @private
   */
  _updateSystemState() {
    const metrics = this._getSystemMetrics();

    this.updateState("global", {
      systemStatus: metrics.status,
      lastUpdate: Date.now(),
      performance: metrics.performance,
    });
  }

  /**
   * Get system metrics
   * @private
   */
  _getSystemMetrics() {
    return {
      status: this._isRendering ? "running" : "stopped",
      uptime: Date.now() - this._state.get("global").startTime,
      performance: {
        fps: 1000 / (Date.now() - this._lastUpdate),
        componentCount: this._components.size,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };
  }

  /**
   * Handle system error
   * @private
   */
  _handleError(error) {
    console.error("Dashboard error:", error);

    this._events.emit("error", {
      timestamp: Date.now(),
      error: error.message,
    });

    this.updateState("global", {
      systemStatus: "error",
      lastError: error.message,
    });
  }

  /**
   * Handle window resize
   * @private
   */
  _handleResize() {
    // Update layout if needed
    if (this.options.layout === "auto") {
      this._updateLayout();
    }

    this._events.emit("resize", {
      timestamp: Date.now(),
      size: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });
  }

  /**
   * Update component layout
   * @private
   */
  _updateLayout() {
    // Implementation depends on layout strategy
    switch (this.options.layout) {
      case "grid":
        this._updateGridLayout();
        break;
      case "flex":
        this._updateFlexLayout();
        break;
      case "free":
        // No automatic layout
        break;
    }
  }

  /**
   * Update grid layout
   * @private
   */
  _updateGridLayout() {
    const components = Array.from(this._components.values());
    const sqrt = Math.ceil(Math.sqrt(components.length));
    const cellSize = {
      width: 100 / sqrt,
      height: 100 / sqrt,
    };

    components.forEach((component, index) => {
      const row = Math.floor(index / sqrt);
      const col = index % sqrt;

      this.updateState(component.id, {
        position: {
          x: col * cellSize.width,
          y: row * cellSize.height,
        },
        size: cellSize,
      });
    });
  }

  /**
   * Update flex layout
   * @private
   */
  _updateFlexLayout() {
    const components = Array.from(this._components.values());
    const totalFlex = components.reduce(
      (sum, comp) => sum + (comp.flex || 1),
      0
    );

    let currentPosition = 0;
    components.forEach((component) => {
      const flex = component.flex || 1;
      const size = (flex / totalFlex) * 100;

      this.updateState(component.id, {
        position: {
          x: currentPosition,
          y: 0,
        },
        size: {
          width: size,
          height: 100,
        },
      });

      currentPosition += size;
    });
  }

  /**
   * Shutdown dashboard
   */
  async shutdown() {
    await this.stopRendering();

    // Cleanup components
    for (const component of this._components.values()) {
      if (component.cleanup) {
        await component.cleanup();
      }
    }

    this._components.clear();
    this._state.clear();
    this._events.removeAllListeners();

    console.log("Dashboard shutdown complete");
  }
}

module.exports = Dashboard;
