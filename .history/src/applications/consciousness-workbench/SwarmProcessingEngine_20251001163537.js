/**
 * HDR Empire Framework - Swarm Processing Engine
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 *
 * NS-HDR swarm acceleration for consciousness state processing
 */

import EventEmitter from "events";
import NanoSwarmHDR from "../../core/nano-swarm/ns-hdr.js";

/**
 * Swarm Processing Engine
 *
 * Manages NS-HDR swarm deployment for accelerated consciousness
 * state capture, transformation, and analysis operations
 */
class SwarmProcessingEngine extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      defaultSwarmSize: config.swarmSize || 150,
      maxActiveSwarms: config.maxActiveSwarms || 5,
      replicationThreshold: config.replicationThreshold || 0.75,
      ...config,
    };

    this.swarmEngine = null;
    this.activeSwarms = new Map();
    this.processingMetrics = new Map();

    this.initialized = false;
  }

  /**
   * Initialize swarm engine
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
      throw new Error(`Swarm engine initialization failed: ${error.message}`);
    }
  }

  /**
   * Deploy processing swarm
   * @param {Object} task - Processing task
   * @returns {Promise<Object>} Deployed swarm
   */
  async deploySwarm(task) {
    if (!this.initialized) {
      throw new Error("Swarm engine not initialized");
    }

    // Check swarm limit
    if (this.activeSwarms.size >= this.config.maxActiveSwarms) {
      await this._terminateOldestSwarm();
    }

    try {
      const swarm = await this.swarmEngine.deploySwarm(
        "/consciousness-processing",
        {
          initialBots: task.swarmSize || this.config.defaultSwarmSize,
          specializations: [
            "state-capture",
            "state-transform",
            "state-analysis",
          ],
          taskTypes: [task.type],
          metadata: {
            taskType: task.type,
            deployedAt: Date.now(),
          },
        }
      );

      // Configure swarm
      swarm.replicationThreshold = this.config.replicationThreshold;

      // Track swarm
      this.activeSwarms.set(swarm.id, swarm);
      this.processingMetrics.set(swarm.id, {
        deployedAt: Date.now(),
        tasksProcessed: 0,
        efficiency: 1.0,
      });

      this.emit("swarm-deployed", {
        swarmId: swarm.id,
        taskType: task.type,
      });

      return swarm;
    } catch (error) {
      throw new Error(`Swarm deployment failed: ${error.message}`);
    }
  }

  /**
   * Process task with swarm
   * @param {string} swarmId - Swarm identifier
   * @param {Object} task - Task to process
   * @returns {Promise<Object>} Processing result
   */
  async processTask(swarmId, task) {
    const swarm = this.activeSwarms.get(swarmId);
    if (!swarm) {
      throw new Error(`Swarm ${swarmId} not found`);
    }

    try {
      const startTime = Date.now();

      // Assign task to swarm
      const result = await this.swarmEngine.assignTasks(swarmId, [task]);

      const processingTime = Date.now() - startTime;

      // Update metrics
      const metrics = this.processingMetrics.get(swarmId);
      metrics.tasksProcessed++;
      metrics.lastProcessingTime = processingTime;
      metrics.avgProcessingTime = metrics.avgProcessingTime
        ? (metrics.avgProcessingTime + processingTime) / 2
        : processingTime;

      this.emit("task-processed", {
        swarmId,
        taskType: task.type,
        processingTime,
      });

      return {
        result: result.results?.[0],
        processingTime,
        swarmId,
      };
    } catch (error) {
      throw new Error(`Task processing failed: ${error.message}`);
    }
  }

  /**
   * Get active swarm
   * @returns {Promise<Object>} Active swarm
   */
  async getActiveSwarm() {
    // Return first active swarm
    for (const swarm of this.activeSwarms.values()) {
      if (swarm.active !== false) {
        return swarm;
      }
    }

    // Deploy new swarm if none active
    return await this.deploySwarm({ type: "general" });
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
   * Get swarm statistics
   * @param {string} swarmId - Swarm identifier
   * @returns {Object|null} Swarm statistics
   */
  getSwarmStats(swarmId) {
    const swarm = this.activeSwarms.get(swarmId);
    if (!swarm) return null;

    const metrics = this.processingMetrics.get(swarmId);

    return {
      id: swarm.id,
      botCount: swarm.botCount,
      active: swarm.active !== false,
      tasksProcessed: metrics.tasksProcessed,
      avgProcessingTime: metrics.avgProcessingTime || 0,
      efficiency: metrics.efficiency,
      uptime: Date.now() - metrics.deployedAt,
    };
  }

  /**
   * Get all swarm statistics
   * @returns {Object} Statistics for all swarms
   */
  getAllStats() {
    const stats = {
      activeSwarms: this.activeSwarms.size,
      totalBots: 0,
      totalTasksProcessed: 0,
      avgEfficiency: 0,
      swarms: [],
    };

    for (const [swarmId, swarm] of this.activeSwarms) {
      const metrics = this.processingMetrics.get(swarmId);

      stats.totalBots += swarm.botCount;
      stats.totalTasksProcessed += metrics.tasksProcessed;
      stats.avgEfficiency += metrics.efficiency;

      stats.swarms.push({
        id: swarmId,
        botCount: swarm.botCount,
        tasksProcessed: metrics.tasksProcessed,
        efficiency: metrics.efficiency,
      });
    }

    if (stats.swarms.length > 0) {
      stats.avgEfficiency /= stats.swarms.length;
    }

    return stats;
  }

  /**
   * Terminate swarm
   * @param {string} swarmId - Swarm identifier
   * @returns {Promise<void>}
   */
  async terminateSwarm(swarmId) {
    const swarm = this.activeSwarms.get(swarmId);
    if (!swarm) return;

    try {
      await this.swarmEngine.terminateSwarm(swarmId);

      this.activeSwarms.delete(swarmId);
      this.processingMetrics.delete(swarmId);

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
   * Shutdown swarm engine
   */
  async shutdown() {
    await this.terminateAllSwarms();

    this.activeSwarms.clear();
    this.processingMetrics.clear();

    this.initialized = false;
    this.emit("shutdown");
  }

  /**
   * Terminate oldest swarm
   * @private
   */
  async _terminateOldestSwarm() {
    let oldestSwarmId = null;
    let oldestTime = Infinity;

    for (const [swarmId, metrics] of this.processingMetrics) {
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

export default SwarmProcessingEngine;
