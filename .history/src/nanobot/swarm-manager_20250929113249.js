/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * SWARM MANAGER
 * Coordinates nanobot swarm behavior, distributed processing, and collective
 * consciousness acceleration through quantum-secured state synchronization.
 */

const crypto = require("crypto");
const { SecureTaskExecution } = require("../quantum/secure-task-execution");
const {
  QuantumEntropyGenerator,
} = require("../quantum/quantum-entropy-generator");
const {
  QuantumEntanglement,
} = require("../consciousness/quantum-entanglement");
const NanoBot = require("./nanobot");

/**
 * @class SwarmTopology
 * @description Manages swarm network topology and routing
 * @private
 */
class SwarmTopology {
  constructor() {
    this.nodes = new Map();
    this.connections = new Map();
    this.routes = new Map();
    this.metrics = {
      totalConnections: 0,
      averageLatency: 0,
      networkDiameter: 0,
      clusterCoefficient: 0,
    };
  }

  /**
   * Add node to topology
   * @param {string} nodeId - Node identifier
   * @param {Object} metadata - Node metadata
   */
  addNode(nodeId, metadata) {
    this.nodes.set(nodeId, {
      id: nodeId,
      metadata,
      connections: new Set(),
      lastSeen: Date.now(),
    });
    this._updateRoutes();
  }

  /**
   * Remove node from topology
   * @param {string} nodeId - Node identifier
   */
  removeNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Remove connections
    for (const connectedId of node.connections) {
      this.removeConnection(nodeId, connectedId);
    }

    this.nodes.delete(nodeId);
    this._updateRoutes();
  }

  /**
   * Add connection between nodes
   * @param {string} nodeId1 - First node ID
   * @param {string} nodeId2 - Second node ID
   * @param {Object} metadata - Connection metadata
   */
  addConnection(nodeId1, nodeId2, metadata = {}) {
    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);
    if (!node1 || !node2) return;

    const connectionId = this._getConnectionId(nodeId1, nodeId2);
    this.connections.set(connectionId, {
      nodes: [nodeId1, nodeId2],
      metadata,
      established: Date.now(),
    });

    node1.connections.add(nodeId2);
    node2.connections.add(nodeId1);

    this.metrics.totalConnections++;
    this._updateRoutes();
  }

  /**
   * Remove connection between nodes
   * @param {string} nodeId1 - First node ID
   * @param {string} nodeId2 - Second node ID
   */
  removeConnection(nodeId1, nodeId2) {
    const connectionId = this._getConnectionId(nodeId1, nodeId2);
    this.connections.delete(connectionId);

    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);

    if (node1) node1.connections.delete(nodeId2);
    if (node2) node2.connections.delete(nodeId1);

    this.metrics.totalConnections--;
    this._updateRoutes();
  }

  /**
   * Get optimal route between nodes
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @returns {Array} Route node IDs
   */
  getRoute(sourceId, targetId) {
    const routeKey = `${sourceId}-${targetId}`;
    return this.routes.get(routeKey) || [];
  }

  /**
   * Update node metadata
   * @param {string} nodeId - Node identifier
   * @param {Object} metadata - New metadata
   */
  updateNodeMetadata(nodeId, metadata) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    node.metadata = { ...node.metadata, ...metadata };
    node.lastSeen = Date.now();
  }

  /**
   * Get network metrics
   * @returns {Object} Network metrics
   */
  getMetrics() {
    this._updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get connection ID
   * @private
   * @param {string} id1 - First node ID
   * @param {string} id2 - Second node ID
   * @returns {string} Connection ID
   */
  _getConnectionId(id1, id2) {
    return [id1, id2].sort().join("-");
  }

  /**
   * Update routing tables
   * @private
   */
  _updateRoutes() {
    this.routes.clear();
    const nodeIds = Array.from(this.nodes.keys());

    // Floyd-Warshall algorithm for all-pairs shortest paths
    for (const source of nodeIds) {
      for (const target of nodeIds) {
        if (source === target) continue;

        const route = this._findShortestPath(source, target);
        if (route.length > 0) {
          this.routes.set(`${source}-${target}`, route);
        }
      }
    }
  }

  /**
   * Find shortest path between nodes
   * @private
   * @param {string} start - Start node ID
   * @param {string} end - End node ID
   * @returns {Array} Path node IDs
   */
  _findShortestPath(start, end) {
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set(this.nodes.keys());

    // Initialize distances
    for (const nodeId of this.nodes.keys()) {
      distances.set(nodeId, Infinity);
    }
    distances.set(start, 0);

    while (unvisited.size > 0) {
      // Find closest unvisited node
      let current = null;
      let shortestDistance = Infinity;

      for (const nodeId of unvisited) {
        const distance = distances.get(nodeId);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          current = nodeId;
        }
      }

      if (current === null || current === end) break;

      unvisited.delete(current);
      const currentNode = this.nodes.get(current);

      // Update neighbor distances
      for (const neighborId of currentNode.connections) {
        if (!unvisited.has(neighborId)) continue;

        const newDistance = distances.get(current) + 1;
        if (newDistance < distances.get(neighborId)) {
          distances.set(neighborId, newDistance);
          previous.set(neighborId, current);
        }
      }
    }

    // Build path
    const path = [];
    let current = end;

    while (current) {
      path.unshift(current);
      current = previous.get(current);
    }

    return path[0] === start ? path : [];
  }

  /**
   * Update network metrics
   * @private
   */
  _updateMetrics() {
    // Calculate network diameter
    let maxDistance = 0;
    for (const route of this.routes.values()) {
      maxDistance = Math.max(maxDistance, route.length - 1);
    }
    this.metrics.networkDiameter = maxDistance;

    // Calculate clustering coefficient
    let totalCoefficient = 0;
    let nodeCount = 0;

    for (const node of this.nodes.values()) {
      const neighbors = Array.from(node.connections);
      if (neighbors.length < 2) continue;

      let connections = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const connectionId = this._getConnectionId(
            neighbors[i],
            neighbors[j]
          );
          if (this.connections.has(connectionId)) {
            connections++;
          }
        }
      }

      const maxConnections = (neighbors.length * (neighbors.length - 1)) / 2;
      const coefficient = maxConnections > 0 ? connections / maxConnections : 0;
      totalCoefficient += coefficient;
      nodeCount++;
    }

    this.metrics.clusterCoefficient =
      nodeCount > 0 ? totalCoefficient / nodeCount : 0;
  }
}

/**
 * @class SwarmManager
 * @description Coordinates nanobot swarm behavior and distributed processing
 * @copyright © 2025 Stephen Bilodeau - PATENT PENDING
 * @license PROPRIETARY
 */
class SwarmManager {
  /**
   * Create a new SwarmManager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.id = crypto.randomBytes(16).toString("hex");
    this.options = {
      maxBots: 1000,
      minBots: 10,
      optimalTemperature: 35.0,
      loadBalancingInterval: 1000,
      heartbeatInterval: 5000,
      stateUpdateInterval: 100,
      quantumSyncInterval: 1000,
      ...options,
    };

    this.nanobots = new Map();
    this.topology = new SwarmTopology();
    this.status = "initializing";
    this.lastUpdate = Date.now();

    // Initialize components
    this.secureExecution = new SecureTaskExecution();
    this.entropyGenerator = new QuantumEntropyGenerator();
    this.quantumEntanglement = new QuantumEntanglement();

    // Performance metrics
    this.metrics = {
      totalProcessedStates: 0,
      averageLatency: 0,
      throughput: 0,
      faultRate: 0,
      uptime: 0,
    };

    // Initialize monitoring
    this._startMonitoring();
  }

  /**
   * Add nanobot to swarm
   * @param {NanoBot} nanobot - Nanobot instance
   * @returns {Promise<boolean>} Success status
   */
  async addNanobot(nanobot) {
    return await this.secureExecution.execute(async () => {
      if (this.nanobots.size >= this.options.maxBots) {
        throw new Error("Maximum swarm size reached");
      }

      // Add to swarm
      this.nanobots.set(nanobot.id, nanobot);

      // Add to topology
      this.topology.addNode(nanobot.id, {
        type: "nanobot",
        status: nanobot.status,
        temperature: nanobot.thermal.temperature,
      });

      // Establish quantum entanglement
      await this._establishEntanglement(nanobot);

      // Connect to nearby bots
      await this._connectToSwarm(nanobot);

      return true;
    });
  }

  /**
   * Remove nanobot from swarm
   * @param {string} nanobotId - Nanobot identifier
   * @returns {Promise<boolean>} Success status
   */
  async removeNanobot(nanobotId) {
    return await this.secureExecution.execute(async () => {
      const nanobot = this.nanobots.get(nanobotId);
      if (!nanobot) return false;

      // Remove from topology
      this.topology.removeNode(nanobotId);

      // Break quantum entanglement
      await this._breakEntanglement(nanobot);

      // Remove from swarm
      this.nanobots.delete(nanobotId);

      return true;
    });
  }

  /**
   * Process consciousness state across swarm
   * @param {Object} state - State to process
   * @returns {Promise<Object>} Processing results
   */
  async processState(state) {
    return await this.secureExecution.execute(async () => {
      if (this.nanobots.size < this.options.minBots) {
        throw new Error("Insufficient swarm size for processing");
      }

      // Generate quantum entropy for distribution
      const entropy = await this.entropyGenerator.generateEntropy(32);
      const processId = entropy.slice(0, 8).toString("hex");

      // Distribute state across swarm
      const distributedStates = this._distributeState(state, entropy);
      const processingStart = process.hrtime();

      // Process states in parallel
      const results = await Promise.all(
        Array.from(distributedStates.entries()).map(
          async ([botId, subState]) => {
            const bot = this.nanobots.get(botId);
            if (!bot) return null;
            return await bot.processState(subState);
          }
        )
      );

      // Merge results
      const mergedResult = await this._mergeResults(results, entropy);

      // Update metrics
      this._updateMetrics(process.hrtime(processingStart));

      return {
        processId,
        swarmId: this.id,
        result: mergedResult,
        metrics: this._getProcessMetrics(),
      };
    });
  }

  /**
   * Get swarm status
   * @returns {Object} Status information
   */
  getStatus() {
    const status = {
      id: this.id,
      size: this.nanobots.size,
      status: this.status,
      topology: this.topology.getMetrics(),
      metrics: this.metrics,
      nanobots: Array.from(this.nanobots.values()).map((bot) => ({
        id: bot.id,
        status: bot.status,
        metrics: bot.getMetrics(),
      })),
    };

    status.metrics.uptime = Date.now() - this.lastUpdate;
    return status;
  }

  /**
   * Get swarm metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      topology: this.topology.getMetrics(),
      temperature: this._getAverageTemperature(),
      load: this._getAverageLoad(),
      efficiency: this._calculateEfficiency(),
    };
  }

  /**
   * Establish quantum entanglement
   * @private
   * @param {NanoBot} nanobot - Nanobot to entangle
   */
  async _establishEntanglement(nanobot) {
    const entanglementState = await this.quantumEntanglement.createEntanglement(
      {
        sourceId: this.id,
        targetId: nanobot.id,
        strength: 1.0,
      }
    );

    await this.quantumEntanglement.synchronizeState(entanglementState);
  }

  /**
   * Break quantum entanglement
   * @private
   * @param {NanoBot} nanobot - Nanobot to disentangle
   */
  async _breakEntanglement(nanobot) {
    await this.quantumEntanglement.breakEntanglement(this.id, nanobot.id);
  }

  /**
   * Connect nanobot to swarm
   * @private
   * @param {NanoBot} nanobot - Nanobot to connect
   */
  async _connectToSwarm(nanobot) {
    // Find nearby bots
    const nearbyBots = this._findNearbyBots(nanobot);

    // Establish connections
    for (const nearby of nearbyBots) {
      this.topology.addConnection(nanobot.id, nearby.id, {
        type: "quantum",
        established: Date.now(),
      });
    }
  }

  /**
   * Find nearby nanobots
   * @private
   * @param {NanoBot} nanobot - Target nanobot
   * @returns {Array} Nearby nanobots
   */
  _findNearbyBots(nanobot) {
    const nearby = [];
    const maxConnections = 5;

    // Simple proximity simulation
    for (const [id, bot] of this.nanobots) {
      if (id === nanobot.id) continue;
      if (nearby.length >= maxConnections) break;

      // Add to nearby list if not at connection capacity
      const botNode = this.topology.nodes.get(id);
      if (botNode && botNode.connections.size < maxConnections) {
        nearby.push(bot);
      }
    }

    return nearby;
  }

  /**
   * Distribute state across swarm
   * @private
   * @param {Object} state - State to distribute
   * @param {Buffer} entropy - Quantum entropy
   * @returns {Map} Distributed states by bot ID
   */
  _distributeState(state, entropy) {
    const distribution = new Map();
    const availableBots = Array.from(this.nanobots.values()).filter(
      (bot) => bot.status === "idle"
    );

    if (availableBots.length === 0) return distribution;

    // Calculate state partitions
    const partitionSize = Math.ceil(
      Object.keys(state).length / availableBots.length
    );
    let currentIndex = 0;

    for (const bot of availableBots) {
      const partitionEntries = Object.entries(state).slice(
        currentIndex,
        currentIndex + partitionSize
      );

      if (partitionEntries.length === 0) break;

      distribution.set(bot.id, {
        ...Object.fromEntries(partitionEntries),
        partitionId: currentIndex,
        totalPartitions: availableBots.length,
        entropy: entropy.slice(currentIndex, currentIndex + 4),
      });

      currentIndex += partitionSize;
    }

    return distribution;
  }

  /**
   * Merge processing results
   * @private
   * @param {Array} results - Processing results
   * @param {Buffer} entropy - Quantum entropy
   * @returns {Promise<Object>} Merged results
   */
  async _mergeResults(results, entropy) {
    // Filter valid results
    const validResults = results.filter((r) => r !== null);
    if (validResults.length === 0) {
      throw new Error("No valid processing results");
    }

    // Merge state data
    const merged = {
      states: validResults.map((r) => r.result),
      entropy: entropy.toString("hex"),
      timestamp: Date.now(),
    };

    // Calculate aggregate metrics
    merged.metrics = {
      processingTime:
        validResults.reduce((sum, r) => sum + r.metrics.averageLatency, 0) /
        validResults.length,
      successRate: validResults.length / results.length,
      temperature:
        validResults.reduce((sum, r) => sum + r.metrics.temperature, 0) /
        validResults.length,
      quantumUsage:
        validResults.reduce((sum, r) => sum + r.metrics.quantumUsage, 0) /
        validResults.length,
    };

    return merged;
  }

  /**
   * Start monitoring routines
   * @private
   */
  _startMonitoring() {
    // Load balancing
    setInterval(() => {
      this._balanceLoad();
    }, this.options.loadBalancingInterval);

    // Heartbeat monitoring
    setInterval(() => {
      this._checkHeartbeats();
    }, this.options.heartbeatInterval);

    // State synchronization
    setInterval(() => {
      this._synchronizeStates();
    }, this.options.stateUpdateInterval);

    // Quantum synchronization
    setInterval(() => {
      this._synchronizeQuantumStates();
    }, this.options.quantumSyncInterval);
  }

  /**
   * Balance load across swarm
   * @private
   */
  _balanceLoad() {
    const bots = Array.from(this.nanobots.values());
    if (bots.length === 0) return;

    // Calculate average load
    const avgLoad =
      bots.reduce((sum, bot) => sum + bot.computeLoad, 0) / bots.length;

    // Adjust individual bot loads
    for (const bot of bots) {
      if (bot.computeLoad > avgLoad * 1.2) {
        bot._updateComputeLoad(bot.computeLoad * 0.9);
      } else if (bot.computeLoad < avgLoad * 0.8) {
        bot._updateComputeLoad(bot.computeLoad * 1.1);
      }
    }
  }

  /**
   * Check nanobot heartbeats
   * @private
   */
  _checkHeartbeats() {
    const now = Date.now();
    const timeout = this.options.heartbeatInterval * 3;

    for (const [id, bot] of this.nanobots) {
      if (now - bot.lastUpdate > timeout) {
        this.removeNanobot(id).catch(console.error);
      }
    }
  }

  /**
   * Synchronize nanobot states
   * @private
   */
  async _synchronizeStates() {
    for (const bot of this.nanobots.values()) {
      this.topology.updateNodeMetadata(bot.id, {
        status: bot.status,
        temperature: bot.thermal.temperature,
        load: bot.computeLoad,
      });
    }
  }

  /**
   * Synchronize quantum states
   * @private
   */
  async _synchronizeQuantumStates() {
    try {
      const entangledPairs = this.quantumEntanglement.getEntangledPairs();

      for (const pair of entangledPairs) {
        if (this.nanobots.has(pair.targetId)) {
          await this.quantumEntanglement.synchronizeState(pair);
        }
      }
    } catch (error) {
      console.error("Quantum synchronization error:", error);
    }
  }

  /**
   * Update performance metrics
   * @private
   * @param {[number, number]} hrtime - High-resolution time diff
   */
  _updateMetrics(hrtime) {
    const latencyMs = hrtime[0] * 1000 + hrtime[1] / 1000000;

    this.metrics.totalProcessedStates++;
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (this.metrics.totalProcessedStates - 1) +
        latencyMs) /
      this.metrics.totalProcessedStates;

    this.metrics.throughput =
      this.metrics.totalProcessedStates /
      ((Date.now() - this.lastUpdate) / 1000);

    const faults = Array.from(this.nanobots.values()).reduce(
      (sum, bot) => sum + bot.metrics.faultCount,
      0
    );
    this.metrics.faultRate = faults / this.metrics.totalProcessedStates;
  }

  /**
   * Get process metrics
   * @private
   * @returns {Object} Current process metrics
   */
  _getProcessMetrics() {
    return {
      swarmSize: this.nanobots.size,
      temperature: this._getAverageTemperature(),
      load: this._getAverageLoad(),
      topology: this.topology.getMetrics(),
      efficiency: this._calculateEfficiency(),
    };
  }

  /**
   * Get average swarm temperature
   * @private
   * @returns {number} Average temperature
   */
  _getAverageTemperature() {
    if (this.nanobots.size === 0) return this.options.optimalTemperature;

    return (
      Array.from(this.nanobots.values()).reduce(
        (sum, bot) => sum + bot.thermal.temperature,
        0
      ) / this.nanobots.size
    );
  }

  /**
   * Get average swarm load
   * @private
   * @returns {number} Average load
   */
  _getAverageLoad() {
    if (this.nanobots.size === 0) return 0;

    return (
      Array.from(this.nanobots.values()).reduce(
        (sum, bot) => sum + bot.computeLoad,
        0
      ) / this.nanobots.size
    );
  }

  /**
   * Calculate swarm efficiency
   * @private
   * @returns {number} Efficiency score
   */
  _calculateEfficiency() {
    if (this.nanobots.size === 0) return 0;

    const metrics = {
      temperatureOptimality: 0,
      loadBalance: 0,
      quantumSync: 0,
      networkEfficiency: 0,
    };

    // Temperature optimality
    const avgTemp = this._getAverageTemperature();
    metrics.temperatureOptimality =
      1 - Math.min(1, Math.abs(avgTemp - this.options.optimalTemperature) / 20);

    // Load balance
    const loads = Array.from(this.nanobots.values()).map(
      (bot) => bot.computeLoad
    );
    const avgLoad = loads.reduce((sum, load) => sum + load, 0) / loads.length;
    const loadVariance =
      loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) /
      loads.length;
    metrics.loadBalance = 1 - Math.min(1, loadVariance * 4);

    // Quantum synchronization
    const entangledPairs = this.quantumEntanglement.getEntangledPairs();
    metrics.quantumSync = Math.min(
      1,
      entangledPairs.length / this.nanobots.size
    );

    // Network efficiency
    const topology = this.topology.getMetrics();
    metrics.networkEfficiency = Math.min(
      1,
      topology.clusterCoefficient * 0.7 +
        (1 - topology.networkDiameter / this.nanobots.size) * 0.3
    );

    // Calculate overall efficiency
    return Object.values(metrics).reduce((sum, val) => sum + val, 0) / 4;
  }
}

module.exports = SwarmManager;
