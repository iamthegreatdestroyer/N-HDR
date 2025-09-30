/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Nano-swarm visualization and management component
 */

class SwarmComponent {
  constructor(options = {}) {
    this.id = "swarm";
    this.defaultPosition = { x: 110, y: 20 };
    this.defaultSize = { width: 55, height: 35 };
    this.flex = 1.5;

    this.options = {
      refreshInterval: 250, // Faster refresh for real-time swarm updates
      maxNodes: 1000,
      visualizationMode: "dynamic", // 'dynamic', 'topology', 'heatmap'
      swarmColors: {
        active: "#4BFF83",
        idle: "#4B83FF",
        error: "#FF4B4B",
        optimizing: "#FFB74B",
      },
      enableOptimization: true,
      topologyUpdateInterval: 1000,
      ...options,
    };

    this._data = {
      nodes: new Map(),
      topology: null,
      activeProcesses: new Map(),
      optimization: {
        status: "idle",
        progress: 0,
        target: null,
      },
      metrics: {
        totalNodes: 0,
        activeNodes: 0,
        efficiency: 0,
        loadBalance: 0,
      },
      status: "initializing",
    };

    this._events = [];
    this._lastUpdate = Date.now();
    this._optimizationQueue = [];
  }

  /**
   * Initialize component
   * @param {Object} dashboard - Dashboard instance
   */
  async initialize(dashboard) {
    this.dashboard = dashboard;
    this._setupSubscriptions();
    await this._initializeData();

    console.log("Swarm component initialized");
  }

  /**
   * Update component state
   * @param {number} delta - Time since last update
   */
  update(delta) {
    this._updateNodesStatus();
    this._updateTopology();
    this._processOptimizationQueue();
    this._updateMetrics();

    // Update visualization data
    const visualData = this._prepareVisualizationData();

    // Update component state
    this.dashboard.updateState(this.id, {
      data: {
        ...this._data,
        visualization: visualData,
      },
      events: this._events.slice(-20), // Keep last 20 events
      lastUpdate: Date.now(),
    });
  }

  /**
   * Get component metrics
   * @returns {Object} Component metrics
   */
  getMetrics() {
    return {
      nodes: {
        total: this._data.metrics.totalNodes,
        active: this._data.metrics.activeNodes,
        efficiency: this._data.metrics.efficiency,
      },
      processes: {
        active: this._data.activeProcesses.size,
        queued: this._optimizationQueue.length,
      },
      optimization: {
        status: this._data.optimization.status,
        progress: this._data.optimization.progress,
      },
      loadBalance: this._data.metrics.loadBalance,
    };
  }

  /**
   * Start swarm optimization
   * @param {Object} target - Optimization target configuration
   */
  async startOptimization(target) {
    if (this._data.optimization.status !== "idle") {
      throw new Error("Optimization already in progress");
    }

    this._data.optimization = {
      status: "initializing",
      progress: 0,
      target,
    };

    try {
      if (this.dashboard.controller?.swarmManager) {
        const manager = this.dashboard.controller.swarmManager;

        // Validate swarm state
        await manager.validateState();

        // Initialize optimization
        await manager.initializeOptimization(target);

        this._data.optimization.status = "running";
        console.log("Swarm optimization initialized");
      }
    } catch (error) {
      this._data.optimization.status = "error";
      throw error;
    }
  }

  /**
   * Add nodes to swarm
   * @param {Array} nodes - Node configurations to add
   */
  async addNodes(nodes) {
    if (!Array.isArray(nodes)) {
      throw new Error("Nodes must be an array");
    }

    try {
      if (this.dashboard.controller?.swarmManager) {
        const manager = this.dashboard.controller.swarmManager;

        // Add nodes to swarm
        const results = await manager.addNodes(nodes);

        // Update node data
        results.forEach((node) => {
          this._data.nodes.set(node.id, {
            config: node,
            status: "initializing",
            metrics: {},
            lastUpdate: Date.now(),
          });
        });

        await this._updateTopology();
      }
    } catch (error) {
      console.error("Failed to add nodes:", error);
      throw error;
    }
  }

  /**
   * Set up dashboard subscriptions
   * @private
   */
  _setupSubscriptions() {
    if (this.dashboard.controller) {
      const controller = this.dashboard.controller;

      // Subscribe to swarm manager events
      if (controller.swarmManager) {
        const swarm = controller.swarmManager;

        swarm.on("nodeUpdate", (node) => {
          this._handleNodeUpdate(node);
        });

        swarm.on("topologyChange", (topology) => {
          this._handleTopologyChange(topology);
        });

        swarm.on("optimizationProgress", (progress) => {
          this._handleOptimizationProgress(progress);
        });

        swarm.on("error", (error) => {
          this._handleSwarmError(error);
        });
      }
    }

    // Subscribe to dashboard events
    this.dashboard.subscribe(this.id, (state) => {
      this._handleStateUpdate(state);
    });
  }

  /**
   * Initialize swarm data
   * @private
   */
  async _initializeData() {
    if (!this.dashboard.controller?.swarmManager) return;

    const manager = this.dashboard.controller.swarmManager;

    // Get initial nodes
    const nodes = await manager.getNodes();
    nodes.forEach((node) => {
      this._data.nodes.set(node.id, {
        config: node,
        status: "idle",
        metrics: {},
        lastUpdate: Date.now(),
      });
    });

    // Get initial topology
    this._data.topology = await manager.getTopology();

    // Get active processes
    const processes = await manager.getActiveProcesses();
    processes.forEach((process) => {
      this._data.activeProcesses.set(process.id, process);
    });

    // Update initial metrics
    await this._updateMetrics();

    this._data.status = "ready";
  }

  /**
   * Update nodes status
   * @private
   */
  _updateNodesStatus() {
    const now = Date.now();

    this._data.nodes.forEach((node, nodeId) => {
      // Check node health
      if (now - node.lastUpdate > 5000) {
        node.status = "error";
      }

      // Update node metrics
      if (this.dashboard.controller?.swarmManager) {
        const metrics =
          this.dashboard.controller.swarmManager.getNodeMetrics(nodeId);
        if (metrics) {
          node.metrics = metrics;
        }
      }
    });
  }

  /**
   * Update swarm topology
   * @private
   */
  _updateTopology() {
    if (!this.dashboard.controller?.swarmManager) return;

    const now = Date.now();
    if (now - this._lastUpdate >= this.options.topologyUpdateInterval) {
      this._data.topology =
        this.dashboard.controller.swarmManager.getTopology();
      this._lastUpdate = now;
    }
  }

  /**
   * Process optimization queue
   * @private
   */
  _processOptimizationQueue() {
    if (this._data.optimization.status !== "running") return;

    // Process optimization tasks
    while (this._optimizationQueue.length > 0) {
      const task = this._optimizationQueue[0];

      try {
        this._executeOptimizationTask(task);
        this._optimizationQueue.shift(); // Remove completed task
      } catch (error) {
        console.error("Optimization task failed:", error);
        break;
      }
    }

    // Check if optimization is complete
    if (
      this._optimizationQueue.length === 0 &&
      this._data.optimization.progress >= 100
    ) {
      this._data.optimization.status = "complete";
    }
  }

  /**
   * Update swarm metrics
   * @private
   */
  _updateMetrics() {
    // Update basic metrics
    this._data.metrics.totalNodes = this._data.nodes.size;
    this._data.metrics.activeNodes = Array.from(
      this._data.nodes.values()
    ).filter((node) => node.status === "active").length;

    // Calculate efficiency
    this._data.metrics.efficiency = this._calculateEfficiency();

    // Calculate load balance
    this._data.metrics.loadBalance = this._calculateLoadBalance();
  }

  /**
   * Prepare visualization data
   * @private
   */
  _prepareVisualizationData() {
    return {
      mode: this.options.visualizationMode,
      nodes: Array.from(this._data.nodes.entries()).map(([id, node]) => ({
        id,
        position: node.config.position,
        color: this.options.swarmColors[node.status],
        status: node.status,
        metrics: node.metrics,
      })),
      topology: this._data.topology,
      activeProcesses: Array.from(this._data.activeProcesses.values()),
      optimization: this._data.optimization,
    };
  }

  /**
   * Calculate swarm efficiency
   * @private
   */
  _calculateEfficiency() {
    if (this._data.nodes.size === 0) return 0;

    let totalEfficiency = 0;
    this._data.nodes.forEach((node) => {
      if (node.metrics.efficiency) {
        totalEfficiency += node.metrics.efficiency;
      }
    });

    return totalEfficiency / this._data.nodes.size;
  }

  /**
   * Calculate load balance
   * @private
   */
  _calculateLoadBalance() {
    if (this._data.nodes.size === 0) return 0;

    const loads = Array.from(this._data.nodes.values()).map(
      (node) => node.metrics.load || 0
    );

    const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance =
      loads.reduce((acc, load) => {
        const diff = load - avgLoad;
        return acc + diff * diff;
      }, 0) / loads.length;

    // Convert variance to a 0-100 score (inverse relationship)
    return Math.max(0, 100 - variance * 100);
  }

  /**
   * Execute optimization task
   * @private
   */
  _executeOptimizationTask(task) {
    if (!this.dashboard.controller?.swarmManager) {
      throw new Error("Swarm manager not available");
    }

    return this.dashboard.controller.swarmManager.executeOptimization(task);
  }

  /**
   * Handle node update
   * @private
   */
  _handleNodeUpdate(node) {
    const nodeData = this._data.nodes.get(node.id);
    if (nodeData) {
      nodeData.status = node.status;
      nodeData.metrics = node.metrics;
      nodeData.lastUpdate = Date.now();
    }
  }

  /**
   * Handle topology change
   * @private
   */
  _handleTopologyChange(topology) {
    this._data.topology = topology;
  }

  /**
   * Handle optimization progress
   * @private
   */
  _handleOptimizationProgress(progress) {
    if (this._data.optimization.status === "running") {
      this._data.optimization.progress = progress;
    }
  }

  /**
   * Handle swarm error
   * @private
   */
  _handleSwarmError(error) {
    this._events.push({
      type: "error",
      message: error.message,
      timestamp: Date.now(),
    });

    // Notify dashboard of critical errors
    this.dashboard._events.emit("swarmError", {
      component: this.id,
      error,
    });
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
    // Cancel optimization
    this._data.optimization = {
      status: "shutdown",
      progress: 0,
      target: null,
    };
    this._optimizationQueue = [];

    // Clear data
    this._data.nodes.clear();
    this._data.topology = null;
    this._data.activeProcesses.clear();
    this._events = [];

    console.log("Swarm component cleanup complete");
  }
}

module.exports = SwarmComponent;
