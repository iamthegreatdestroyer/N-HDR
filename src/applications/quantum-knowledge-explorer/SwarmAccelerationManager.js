/**
 * HDR Empire Framework - Swarm Acceleration Manager
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 *
 * NS-HDR powered swarm deployment and management for accelerated processing
 */

import EventEmitter from "events";
import NanoSwarmHDR from "../../core/nano-swarm/ns-hdr.js";

/**
 * Swarm Acceleration Manager
 *
 * Manages NS-HDR nanobot swarms for parallel processing acceleration
 * across exploration, analysis, and computational tasks
 */
class SwarmAccelerationManager extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      defaultSwarmSize: config.swarmSize || 200,
      maxActiveSwarms: config.maxActiveSwarms || 10,
      replicationThreshold: config.replicationThreshold || 0.75,
      vanishingKeys: config.vanishingKeys !== false,
      ...config,
    };

    this.swarmEngine = null;
    this.activeSwarms = new Map();
    this.swarmMetrics = new Map();
    this.taskQueues = new Map();

    this.initialized = false;
  }

  /**
   * Initialize the swarm manager
   */
  async initialize() {
    try {
      this.swarmEngine = new NanoSwarmHDR();

      if (this.swarmEngine.initialize) {
        await this.swarmEngine.initialize();
      }

      this.initialized = true;
      this.emit("initialized");
    } catch (error) {
      throw new Error(`Swarm manager initialization failed: ${error.message}`);
    }
  }

  /**
   * Deploy exploration swarm
   * @param {Object} params - Deployment parameters
   * @returns {Promise<Object>} Deployed swarm
   */
  async deployExplorationSwarm(params) {
    if (!this.initialized) {
      throw new Error("Swarm manager not initialized");
    }

    // Check swarm limit
    if (this.activeSwarms.size >= this.config.maxActiveSwarms) {
      await this._terminateOldestSwarm();
    }

    const { query, dimensions, swarmSize } = params;

    try {
      // Deploy NS-HDR swarm
      const swarm = await this.swarmEngine.deploySwarm("/exploration-space", {
        initialBots: swarmSize || this.config.defaultSwarmSize,
        specializations: ["exploration", "analysis", "navigation"],
        taskTypes: [
          "crystal-search",
          "pathway-exploration",
          "reality-compression",
        ],
        metadata: {
          query: query.text || query.topic,
          dimensions,
          deployedAt: Date.now(),
        },
      });

      // Configure swarm behavior
      swarm.replicationThreshold = this.config.replicationThreshold;
      swarm.vanishingKeys = this.config.vanishingKeys;

      // Track swarm
      this.activeSwarms.set(swarm.id, swarm);
      this.swarmMetrics.set(swarm.id, {
        deployedAt: Date.now(),
        tasksCompleted: 0,
        botsSpawned: swarm.botCount,
        efficiency: 1.0,
      });

      this.emit("swarm-deployed", {
        swarmId: swarm.id,
        botCount: swarm.botCount,
        specializations: swarm.specializations,
      });

      return swarm;
    } catch (error) {
      throw new Error(`Swarm deployment failed: ${error.message}`);
    }
  }

  /**
   * Assign tasks to swarm
   * @param {string} swarmId - Swarm identifier
   * @param {Array} tasks - Tasks to assign
   * @returns {Promise<Object>} Task assignment result
   */
  async assignTasks(swarmId, tasks) {
    const swarm = this.activeSwarms.get(swarmId);
    if (!swarm) {
      throw new Error(`Swarm ${swarmId} not found`);
    }

    try {
      // Queue tasks
      if (!this.taskQueues.has(swarmId)) {
        this.taskQueues.set(swarmId, []);
      }
      this.taskQueues.get(swarmId).push(...tasks);

      // Assign tasks to swarm engine
      const result = await this.swarmEngine.assignTasks(swarmId, tasks);

      // Update metrics
      const metrics = this.swarmMetrics.get(swarmId);
      metrics.tasksCompleted += result.tasksCompleted || 0;
      metrics.efficiency = result.efficiency || metrics.efficiency;

      this.emit("tasks-assigned", {
        swarmId,
        taskCount: tasks.length,
        completed: result.tasksCompleted,
      });

      return result;
    } catch (error) {
      throw new Error(`Task assignment failed: ${error.message}`);
    }
  }

  /**
   * Get swarm status
   * @param {string} swarmId - Swarm identifier
   * @returns {Object} Swarm status
   */
  getSwarmStatus(swarmId) {
    const swarm = this.activeSwarms.get(swarmId);
    if (!swarm) {
      return null;
    }

    const metrics = this.swarmMetrics.get(swarmId);
    const taskQueue = this.taskQueues.get(swarmId) || [];

    return {
      id: swarm.id,
      botCount: swarm.botCount,
      specializations: swarm.specializations,
      active: swarm.active !== false,
      tasksCompleted: metrics.tasksCompleted,
      tasksPending: taskQueue.length,
      efficiency: metrics.efficiency,
      uptime: Date.now() - metrics.deployedAt,
      replicationThreshold: swarm.replicationThreshold,
    };
  }

  /**
   * Get active swarm (any available swarm)
   * @returns {Object|null} Active swarm
   */
  async getActiveSwarm() {
    // Return first active swarm
    for (const swarm of this.activeSwarms.values()) {
      if (swarm.active !== false) {
        return swarm;
      }
    }

    // Deploy new swarm if none active
    return await this.deployExplorationSwarm({
      query: { text: "default" },
      dimensions: 6,
    });
  }

  /**
   * Get active swarm count
   * @returns {number} Active swarm count
   */
  getActiveSwarmCount() {
    let count = 0;
    for (const swarm of this.activeSwarms.values()) {
      if (swarm.active !== false) {
        count++;
      }
    }
    return count;
  }

  /**
   * Terminate swarm
   * @param {string} swarmId - Swarm identifier
   * @returns {Promise<void>}
   */
  async terminateSwarm(swarmId) {
    const swarm = this.activeSwarms.get(swarmId);
    if (!swarm) {
      return;
    }

    try {
      // Terminate through swarm engine
      await this.swarmEngine.terminateSwarm(swarmId);

      // Clean up tracking
      this.activeSwarms.delete(swarmId);
      this.swarmMetrics.delete(swarmId);
      this.taskQueues.delete(swarmId);

      this.emit("swarm-terminated", { swarmId });
    } catch (error) {
      console.error(`Swarm termination error: ${error.message}`);
    }
  }

  /**
   * Terminate all swarms
   * @returns {Promise<void>}
   */
  async terminateAllSwarms() {
    const swarmIds = Array.from(this.activeSwarms.keys());

    for (const swarmId of swarmIds) {
      await this.terminateSwarm(swarmId);
    }

    this.emit("all-swarms-terminated");
  }

  /**
   * Get manager statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const stats = {
      activeSwarms: this.activeSwarms.size,
      totalBots: 0,
      totalTasksCompleted: 0,
      avgEfficiency: 0,
      swarms: [],
    };

    for (const [swarmId, swarm] of this.activeSwarms) {
      const metrics = this.swarmMetrics.get(swarmId);

      stats.totalBots += swarm.botCount;
      stats.totalTasksCompleted += metrics.tasksCompleted;
      stats.avgEfficiency += metrics.efficiency;

      stats.swarms.push({
        id: swarmId,
        botCount: swarm.botCount,
        tasksCompleted: metrics.tasksCompleted,
        efficiency: metrics.efficiency,
      });
    }

    if (stats.swarms.length > 0) {
      stats.avgEfficiency /= stats.swarms.length;
    }

    return stats;
  }

  /**
   * Shutdown manager
   */
  async shutdown() {
    await this.terminateAllSwarms();

    this.activeSwarms.clear();
    this.swarmMetrics.clear();
    this.taskQueues.clear();

    this.initialized = false;
    this.emit("shutdown");
  }

  /**
   * Terminate oldest swarm to make room
   * @private
   */
  async _terminateOldestSwarm() {
    let oldestSwarmId = null;
    let oldestTime = Infinity;

    for (const [swarmId, metrics] of this.swarmMetrics) {
      if (metrics.deployedAt < oldestTime) {
        oldestTime = metrics.deployedAt;
        oldestSwarmId = swarmId;
      }
    }

    if (oldestSwarmId) {
      await this.terminateSwarm(oldestSwarmId);
    }
  }
}

export default SwarmAccelerationManager;
