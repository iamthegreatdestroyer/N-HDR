/**
 * HDR Empire Framework - Real-Time Monitoring Dashboard
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import { EventEmitter } from 'events';
import DocumentationSwarmDeployer from '../nano-swarm/DocumentationSwarmDeployer.js';

/**
 * Real-Time Monitoring Dashboard for HDR Empire Protocol Execution
 * 
 * Tracks:
 * - Swarm activity across all deployments
 * - Implementation progress for each phase
 * - Resource utilization metrics
 * - Task queue status and completion rates
 * - System health and performance
 */
class HDRMonitoringDashboard extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      refreshInterval: config.refreshInterval || 1000, // 1 second
      historySize: config.historySize || 100,
      ...config
    };

    this.metrics = {
      phase1: {
        name: 'IP Protection & Documentation',
        status: 'in-progress',
        progress: 0,
        swarms: [],
        tasks: {
          total: 0,
          completed: 0,
          inProgress: 0,
          failed: 0
        }
      },
      phase2: {
        name: 'System Integration Demonstration',
        status: 'pending',
        progress: 0,
        swarms: [],
        tasks: {
          total: 0,
          completed: 0,
          inProgress: 0,
          failed: 0
        }
      },
      phase3: {
        name: 'Domain Selection & Application Development',
        status: 'pending',
        progress: 0,
        swarms: [],
        tasks: {
          total: 0,
          completed: 0,
          inProgress: 0,
          failed: 0
        }
      }
    };

    this.swarmRegistry = new Map();
    this.resourceMetrics = {
      cpu: [],
      memory: [],
      network: [],
      disk: []
    };

    this.taskQueue = {
      pending: [],
      processing: [],
      completed: [],
      failed: []
    };

    this.startTime = Date.now();
    this.updateInterval = null;
  }

  /**
   * Start real-time monitoring
   */
  start() {
    console.log('🚀 HDR Empire Monitoring Dashboard - ACTIVATED');
    console.log('═'.repeat(80));
    
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
      this.displayDashboard();
    }, this.config.refreshInterval);

    this.emit('dashboard-started');
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    console.log('\n🛑 Monitoring Dashboard - DEACTIVATED');
    this.emit('dashboard-stopped');
  }

  /**
   * Register a swarm for monitoring
   * @param {string} phase - Phase identifier (phase1, phase2, phase3)
   * @param {Object} swarmInfo - Swarm information
   */
  registerSwarm(phase, swarmInfo) {
    this.swarmRegistry.set(swarmInfo.swarmId, {
      phase,
      ...swarmInfo,
      registeredAt: Date.now()
    });

    this.metrics[phase].swarms.push(swarmInfo.swarmId);

    this.emit('swarm-registered', { phase, swarmId: swarmInfo.swarmId });
  }

  /**
   * Update task progress
   * @param {string} phase - Phase identifier
   * @param {Object} taskUpdate - Task status update
   */
  updateTaskProgress(phase, taskUpdate) {
    const phaseMetrics = this.metrics[phase];
    
    if (taskUpdate.status === 'completed') {
      phaseMetrics.tasks.completed++;
      phaseMetrics.tasks.inProgress = Math.max(0, phaseMetrics.tasks.inProgress - 1);
    } else if (taskUpdate.status === 'failed') {
      phaseMetrics.tasks.failed++;
      phaseMetrics.tasks.inProgress = Math.max(0, phaseMetrics.tasks.inProgress - 1);
    } else if (taskUpdate.status === 'in-progress') {
      phaseMetrics.tasks.inProgress++;
    }

    // Update phase progress
    phaseMetrics.progress = phaseMetrics.tasks.total > 0
      ? (phaseMetrics.tasks.completed / phaseMetrics.tasks.total) * 100
      : 0;

    // Update phase status
    if (phaseMetrics.progress === 100) {
      phaseMetrics.status = 'completed';
    } else if (phaseMetrics.progress > 0) {
      phaseMetrics.status = 'in-progress';
    }

    this.emit('task-updated', { phase, taskUpdate });
  }

  /**
   * Add tasks to phase
   * @param {string} phase - Phase identifier
   * @param {number} taskCount - Number of tasks added
   */
  addTasks(phase, taskCount) {
    this.metrics[phase].tasks.total += taskCount;
    this.emit('tasks-added', { phase, taskCount });
  }

  /**
   * Update resource metrics
   * @param {Object} resources - Current resource utilization
   */
  updateResourceMetrics(resources) {
    const timestamp = Date.now();

    if (resources.cpu !== undefined) {
      this.resourceMetrics.cpu.push({ timestamp, value: resources.cpu });
      if (this.resourceMetrics.cpu.length > this.config.historySize) {
        this.resourceMetrics.cpu.shift();
      }
    }

    if (resources.memory !== undefined) {
      this.resourceMetrics.memory.push({ timestamp, value: resources.memory });
      if (this.resourceMetrics.memory.length > this.config.historySize) {
        this.resourceMetrics.memory.shift();
      }
    }

    if (resources.network !== undefined) {
      this.resourceMetrics.network.push({ timestamp, value: resources.network });
      if (this.resourceMetrics.network.length > this.config.historySize) {
        this.resourceMetrics.network.shift();
      }
    }

    if (resources.disk !== undefined) {
      this.resourceMetrics.disk.push({ timestamp, value: resources.disk });
      if (this.resourceMetrics.disk.length > this.config.historySize) {
        this.resourceMetrics.disk.shift();
      }
    }
  }

  /**
   * Update all metrics
   * @private
   */
  updateMetrics() {
    // Simulate resource metrics (in production, use actual system metrics)
    const baseLoad = 0.3;
    const swarmLoad = this.swarmRegistry.size * 0.1;
    const taskLoad = this.getTotalActiveTasks() * 0.001;

    this.updateResourceMetrics({
      cpu: Math.min(100, (baseLoad + swarmLoad + taskLoad) * 100 + Math.random() * 10),
      memory: Math.min(100, 40 + (this.swarmRegistry.size * 5) + Math.random() * 10),
      network: Math.min(100, 20 + (this.getTotalActiveTasks() * 0.5) + Math.random() * 15),
      disk: Math.min(100, 50 + Math.random() * 5)
    });
  }

  /**
   * Display dashboard to console
   * @private
   */
  displayDashboard() {
    // Clear console for fresh display
    console.clear();

    const runtime = this.formatDuration(Date.now() - this.startTime);

    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + this.centerText('HDR EMPIRE PROTOCOL - EXECUTION DASHBOARD', 78) + '║');
    console.log('║' + this.centerText(`Runtime: ${runtime}`, 78) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
    console.log();

    // Phase Overview
    console.log('┌─ PHASE OVERVIEW ' + '─'.repeat(61) + '┐');
    
    for (const [phaseKey, phase] of Object.entries(this.metrics)) {
      const statusIcon = this.getStatusIcon(phase.status);
      const progressBar = this.createProgressBar(phase.progress, 30);
      
      console.log(`│ ${statusIcon} ${phase.name.padEnd(42)} ${progressBar} ${phase.progress.toFixed(0).padStart(3)}% │`);
      console.log(`│   Tasks: ${phase.tasks.completed}/${phase.tasks.total} completed, ${phase.tasks.inProgress} active, ${phase.tasks.failed} failed`.padEnd(78) + '│');
      console.log(`│   Swarms: ${phase.swarms.length} active`.padEnd(78) + '│');
      
      if (phaseKey !== 'phase3') {
        console.log('├' + '─'.repeat(78) + '┤');
      }
    }
    
    console.log('└' + '─'.repeat(78) + '┘');
    console.log();

    // Swarm Activity
    console.log('┌─ SWARM ACTIVITY ' + '─'.repeat(61) + '┐');
    console.log(`│ Total Swarms: ${this.swarmRegistry.size}`.padEnd(79) + '│');
    console.log(`│ Total Bots: ${this.getTotalBots()}`.padEnd(79) + '│');
    
    const recentSwarms = Array.from(this.swarmRegistry.values()).slice(-3);
    if (recentSwarms.length > 0) {
      console.log('├' + '─'.repeat(78) + '┤');
      console.log('│ Recent Swarms:'.padEnd(79) + '│');
      recentSwarms.forEach(swarm => {
        const age = this.formatDuration(Date.now() - swarm.registeredAt);
        console.log(`│   • ${swarm.swarmId.substring(0, 16)}... [${swarm.phase}] - ${age} ago`.padEnd(79) + '│');
      });
    }
    console.log('└' + '─'.repeat(78) + '┘');
    console.log();

    // Resource Utilization
    console.log('┌─ RESOURCE UTILIZATION ' + '─'.repeat(55) + '┐');
    
    const resources = {
      CPU: this.getLatestMetric('cpu'),
      Memory: this.getLatestMetric('memory'),
      Network: this.getLatestMetric('network'),
      Disk: this.getLatestMetric('disk')
    };

    for (const [name, value] of Object.entries(resources)) {
      const bar = this.createProgressBar(value, 40);
      const color = this.getResourceColor(value);
      console.log(`│ ${name.padEnd(10)} ${bar} ${value.toFixed(1).padStart(5)}% ${color}`.padEnd(87) + '│');
    }
    
    console.log('└' + '─'.repeat(78) + '┘');
    console.log();

    // Task Queue Status
    const totalTasks = this.getTotalTasks();
    const activeTasks = this.getTotalActiveTasks();
    const completedTasks = this.getTotalCompletedTasks();
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

    console.log('┌─ TASK QUEUE STATUS ' + '─'.repeat(58) + '┐');
    console.log(`│ Total Tasks: ${totalTasks}`.padEnd(79) + '│');
    console.log(`│ Active: ${activeTasks} | Completed: ${completedTasks} | Completion Rate: ${completionRate}%`.padEnd(79) + '│');
    console.log('└' + '─'.repeat(78) + '┘');

    console.log();
    console.log('Press Ctrl+C to stop monitoring'.padStart(50));
  }

  /**
   * Helper: Get status icon
   * @private
   */
  getStatusIcon(status) {
    const icons = {
      'pending': '⏳',
      'in-progress': '🔄',
      'completed': '✅',
      'failed': '❌'
    };
    return icons[status] || '❓';
  }

  /**
   * Helper: Create progress bar
   * @private
   */
  createProgressBar(percentage, width) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }

  /**
   * Helper: Center text
   * @private
   */
  centerText(text, width) {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text + ' '.repeat(width - padding - text.length);
  }

  /**
   * Helper: Format duration
   * @private
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Helper: Get resource color indicator
   * @private
   */
  getResourceColor(value) {
    if (value < 50) return '🟢';
    if (value < 75) return '🟡';
    if (value < 90) return '🟠';
    return '🔴';
  }

  /**
   * Helper: Get latest metric value
   * @private
   */
  getLatestMetric(type) {
    const metrics = this.resourceMetrics[type];
    return metrics.length > 0 ? metrics[metrics.length - 1].value : 0;
  }

  /**
   * Helper: Get total bots across all swarms
   * @private
   */
  getTotalBots() {
    return Array.from(this.swarmRegistry.values())
      .reduce((sum, swarm) => sum + (swarm.botCount || 0), 0);
  }

  /**
   * Helper: Get total tasks
   * @private
   */
  getTotalTasks() {
    return Object.values(this.metrics)
      .reduce((sum, phase) => sum + phase.tasks.total, 0);
  }

  /**
   * Helper: Get total active tasks
   * @private
   */
  getTotalActiveTasks() {
    return Object.values(this.metrics)
      .reduce((sum, phase) => sum + phase.tasks.inProgress, 0);
  }

  /**
   * Helper: Get total completed tasks
   * @private
   */
  getTotalCompletedTasks() {
    return Object.values(this.metrics)
      .reduce((sum, phase) => sum + phase.tasks.completed, 0);
  }

  /**
   * Get current dashboard snapshot
   * @returns {Object} Dashboard data
   */
  getSnapshot() {
    return {
      timestamp: Date.now(),
      runtime: Date.now() - this.startTime,
      phases: this.metrics,
      swarms: {
        total: this.swarmRegistry.size,
        totalBots: this.getTotalBots(),
        active: Array.from(this.swarmRegistry.values())
      },
      resources: {
        cpu: this.getLatestMetric('cpu'),
        memory: this.getLatestMetric('memory'),
        network: this.getLatestMetric('network'),
        disk: this.getLatestMetric('disk')
      },
      tasks: {
        total: this.getTotalTasks(),
        active: this.getTotalActiveTasks(),
        completed: this.getTotalCompletedTasks(),
        failed: Object.values(this.metrics).reduce((sum, phase) => sum + phase.tasks.failed, 0)
      }
    };
  }

  /**
   * Generate execution report
   * @returns {string} Markdown report
   */
  generateReport() {
    const snapshot = this.getSnapshot();
    const runtime = this.formatDuration(snapshot.runtime);

    return `# HDR Empire Protocol - Execution Report

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved**

**Generated:** ${new Date().toISOString()}  
**Runtime:** ${runtime}

---

## Executive Summary

The HDR Empire Protocol execution has been active for ${runtime} with the following achievements:

- **Total Swarms Deployed:** ${snapshot.swarms.total}
- **Total Bots Active:** ${snapshot.swarms.totalBots}
- **Total Tasks:** ${snapshot.tasks.total}
- **Tasks Completed:** ${snapshot.tasks.completed} (${(snapshot.tasks.completed / snapshot.tasks.total * 100).toFixed(1)}%)
- **Tasks Failed:** ${snapshot.tasks.failed}

## Phase Progress

### Phase 1: IP Protection & Documentation
- **Status:** ${this.metrics.phase1.status}
- **Progress:** ${this.metrics.phase1.progress.toFixed(1)}%
- **Tasks:** ${this.metrics.phase1.tasks.completed}/${this.metrics.phase1.tasks.total}
- **Swarms:** ${this.metrics.phase1.swarms.length}

### Phase 2: System Integration Demonstration
- **Status:** ${this.metrics.phase2.status}
- **Progress:** ${this.metrics.phase2.progress.toFixed(1)}%
- **Tasks:** ${this.metrics.phase2.tasks.completed}/${this.metrics.phase2.tasks.total}
- **Swarms:** ${this.metrics.phase2.swarms.length}

### Phase 3: Domain Selection & Application Development
- **Status:** ${this.metrics.phase3.status}
- **Progress:** ${this.metrics.phase3.progress.toFixed(1)}%
- **Tasks:** ${this.metrics.phase3.tasks.completed}/${this.metrics.phase3.tasks.total}
- **Swarms:** ${this.metrics.phase3.swarms.length}

## Resource Utilization

- **CPU:** ${snapshot.resources.cpu.toFixed(1)}%
- **Memory:** ${snapshot.resources.memory.toFixed(1)}%
- **Network:** ${snapshot.resources.network.toFixed(1)}%
- **Disk:** ${snapshot.resources.disk.toFixed(1)}%

---

**Report Version:** 1.0.0  
**Generated By:** HDR Monitoring Dashboard  
**Protected By:** VB-HDR Security Layer
`;
  }
}

export default HDRMonitoringDashboard;
