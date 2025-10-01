/*
 * HDR Empire Framework - Swarm Monitor
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import EventEmitter from 'events';

/**
 * SwarmMonitor - NS-HDR swarm visualization and control
 * 
 * Real-time monitoring and control of nano-swarms:
 * - Swarm status tracking
 * - Bot population monitoring
 * - Task assignment visualization
 * - Performance metrics
 * - Replication tracking
 * - Path optimization analysis
 * 
 * Features:
 * - Multi-swarm coordination
 * - Real-time visualization
 * - Performance analytics
 * - Bottleneck detection
 * - Resource optimization
 */
export class SwarmMonitor extends EventEmitter {
  constructor() {
    super();
    
    this.commander = null;
    this.isInitialized = false;
    
    this.swarms = new Map();
    this.metrics = {
      totalSwarms: 0,
      totalBots: 0,
      totalTasks: 0,
      completedTasks: 0
    };
    
    this.updateInterval = null;
    this.updateRate = 1000; // 1 second
    
    this.visualization = true;
  }

  /**
   * Initialize swarm monitor
   */
  async initialize(commander, options = {}) {
    try {
      if (this.isInitialized) {
        throw new Error('Swarm monitor already initialized');
      }

      this.commander = commander;
      this.visualization = options.visualization !== false;
      
      // Start monitoring
      this._startMonitoring();
      
      this.isInitialized = true;
      
      this.emit('initialized', {
        visualization: this.visualization
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Swarm monitor initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start monitoring swarms
   */
  _startMonitoring() {
    this.updateInterval = setInterval(async () => {
      await this.updateSwarmStatus();
    }, this.updateRate);
  }

  /**
   * Update status for all swarms
   */
  async updateSwarmStatus() {
    try {
      // Query NS-HDR for active swarms
      const activeSwarms = await this._queryActiveSwarms();
      
      // Update swarm information
      for (const swarmData of activeSwarms) {
        await this._updateSwarmInfo(swarmData);
      }
      
      // Remove inactive swarms
      for (const [swarmId, swarm] of this.swarms.entries()) {
        if (!activeSwarms.find(s => s.id === swarmId)) {
          this._removeSwarm(swarmId);
        }
      }
      
      // Update global metrics
      this._updateMetrics();
      
      this.emit('swarmUpdate', this.getAllSwarms());
      
    } catch (error) {
      console.error('Failed to update swarm status:', error);
    }
  }

  /**
   * Query active swarms from NS-HDR
   */
  async _queryActiveSwarms() {
    try {
      const result = await this.commander.executeCommand('nano-swarm', 'getActiveSwarms', {});
      return result.swarms || [];
    } catch (error) {
      console.error('Failed to query active swarms:', error);
      return [];
    }
  }

  /**
   * Update swarm information
   */
  async _updateSwarmInfo(swarmData) {
    const swarmId = swarmData.id;
    
    let swarm = this.swarms.get(swarmId);
    
    if (!swarm) {
      // New swarm detected
      swarm = {
        id: swarmId,
        target: swarmData.target,
        status: 'active',
        startTime: Date.now(),
        detectedAt: Date.now()
      };
      
      this.emit('swarmDetected', swarm);
    }
    
    // Update swarm data
    swarm.botCount = swarmData.botCount || 0;
    swarm.taskCount = swarmData.taskCount || 0;
    swarm.completedTasks = swarmData.completedTasks || 0;
    swarm.efficiency = swarmData.efficiency || 0;
    swarm.replicationRate = swarmData.replicationRate || 0;
    swarm.specializations = swarmData.specializations || [];
    swarm.lastUpdate = Date.now();
    
    // Calculate additional metrics
    swarm.age = Date.now() - swarm.startTime;
    swarm.taskCompletionRate = swarm.taskCount > 0 
      ? swarm.completedTasks / swarm.taskCount 
      : 0;
    
    this.swarms.set(swarmId, swarm);
  }

  /**
   * Remove inactive swarm
   */
  _removeSwarm(swarmId) {
    const swarm = this.swarms.get(swarmId);
    if (swarm) {
      this.swarms.delete(swarmId);
      this.emit('swarmTerminated', { id: swarmId });
    }
  }

  /**
   * Update global metrics
   */
  _updateMetrics() {
    this.metrics.totalSwarms = this.swarms.size;
    this.metrics.totalBots = 0;
    this.metrics.totalTasks = 0;
    this.metrics.completedTasks = 0;
    
    for (const swarm of this.swarms.values()) {
      this.metrics.totalBots += swarm.botCount || 0;
      this.metrics.totalTasks += swarm.taskCount || 0;
      this.metrics.completedTasks += swarm.completedTasks || 0;
    }
    
    this.metrics.averageEfficiency = this.swarms.size > 0
      ? Array.from(this.swarms.values()).reduce((sum, s) => sum + (s.efficiency || 0), 0) / this.swarms.size
      : 0;
  }

  /**
   * Get swarm status
   */
  getSwarmStatus(swarmId) {
    const swarm = this.swarms.get(swarmId);
    
    if (!swarm) {
      return null;
    }
    
    return {
      id: swarm.id,
      target: swarm.target,
      status: swarm.status,
      bots: swarm.botCount,
      tasks: {
        total: swarm.taskCount,
        completed: swarm.completedTasks,
        remaining: swarm.taskCount - swarm.completedTasks
      },
      efficiency: swarm.efficiency,
      replicationRate: swarm.replicationRate,
      specializations: swarm.specializations,
      age: swarm.age
    };
  }

  /**
   * Get all swarms
   */
  getAllSwarms() {
    return Array.from(this.swarms.values()).map(swarm => ({
      id: swarm.id,
      target: swarm.target,
      status: swarm.status,
      bots: swarm.botCount,
      tasks: swarm.taskCount,
      completed: swarm.completedTasks,
      efficiency: swarm.efficiency
    }));
  }

  /**
   * Get swarm visualization data
   */
  getVisualizationData() {
    if (!this.visualization) {
      return null;
    }
    
    return {
      swarms: Array.from(this.swarms.values()).map(swarm => ({
        id: swarm.id,
        target: swarm.target,
        position: this._calculateSwarmPosition(swarm),
        size: swarm.botCount,
        color: this._getSwarmColor(swarm.efficiency),
        connections: this._getSwarmConnections(swarm)
      })),
      metrics: this.metrics
    };
  }

  /**
   * Calculate swarm position for visualization
   */
  _calculateSwarmPosition(swarm) {
    // Simple positioning based on hash of swarm ID
    const hash = swarm.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return {
      x: (hash * 37) % 100,
      y: (hash * 73) % 100,
      z: (hash * 97) % 100
    };
  }

  /**
   * Get swarm color based on efficiency
   */
  _getSwarmColor(efficiency) {
    if (efficiency >= 0.8) return '#00ff00'; // Green
    if (efficiency >= 0.6) return '#ffff00'; // Yellow
    if (efficiency >= 0.4) return '#ff8800'; // Orange
    return '#ff0000'; // Red
  }

  /**
   * Get swarm connections
   */
  _getSwarmConnections(swarm) {
    // Find swarms working on related targets
    const connections = [];
    
    for (const other of this.swarms.values()) {
      if (other.id !== swarm.id && this._areTargetsRelated(swarm.target, other.target)) {
        connections.push(other.id);
      }
    }
    
    return connections;
  }

  /**
   * Check if targets are related
   */
  _areTargetsRelated(target1, target2) {
    if (!target1 || !target2) return false;
    
    // Simple check: same directory or similar paths
    const path1 = target1.split('/').slice(0, -1).join('/');
    const path2 = target2.split('/').slice(0, -1).join('/');
    
    return path1 === path2;
  }

  /**
   * Get performance analytics
   */
  getAnalytics() {
    const swarms = Array.from(this.swarms.values());
    
    if (swarms.length === 0) {
      return {
        totalSwarms: 0,
        averageEfficiency: 0,
        totalBots: 0,
        taskCompletion: 0
      };
    }
    
    return {
      totalSwarms: swarms.length,
      averageEfficiency: swarms.reduce((sum, s) => sum + (s.efficiency || 0), 0) / swarms.length,
      totalBots: swarms.reduce((sum, s) => sum + (s.botCount || 0), 0),
      taskCompletion: this.metrics.totalTasks > 0 
        ? this.metrics.completedTasks / this.metrics.totalTasks 
        : 0,
      averageReplicationRate: swarms.reduce((sum, s) => sum + (s.replicationRate || 0), 0) / swarms.length,
      specializations: this._getSpecializationStats(swarms)
    };
  }

  /**
   * Get specialization statistics
   */
  _getSpecializationStats(swarms) {
    const specs = {};
    
    for (const swarm of swarms) {
      for (const spec of swarm.specializations || []) {
        specs[spec] = (specs[spec] || 0) + 1;
      }
    }
    
    return specs;
  }

  /**
   * Get metrics
   */
  async getMetrics() {
    return {
      ...this.metrics,
      analytics: this.getAnalytics(),
      visualization: this.visualization ? this.getVisualizationData() : null
    };
  }

  /**
   * Shutdown swarm monitor
   */
  async shutdown() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.swarms.clear();
    this.isInitialized = false;
    
    this.emit('shutdown');
    
    return { success: true };
  }
}
