/**
 * Swarm Health Manager
 * 
 * Monitors agent health, auto-replaces failed agents, tracks health history
 * Task 9.3: Health Monitoring & Auto-Recovery
 * 
 * Features:
 * - 10-second health check interval
 * - Automatic replacement of unhealthy agents
 * - Health history tracking (30-day retention)
 * - Anomaly detection & alerting
 * - Graceful degradation with partial swarm failure
 */

const EventEmitter = require("events");

class SwarmHealthManager extends EventEmitter {
  constructor(orchestrator, config = {}) {
    super();

    this.orchestrator = orchestrator;
    this.name = "swarm-health-manager";
    this.config = {
      check_interval: config.check_interval || 10000, // 10 seconds
      failure_threshold: config.failure_threshold || 3, // Failures before replacement
      replace_unhealthy: config.replace_unhealthy !== false, // Default true
      history_retention_days: config.history_retention_days || 30,
      anomaly_threshold: config.anomaly_threshold || 0.8, // 80% of agents healthy baseline
      ...config,
    };

    this.agent_health_history = new Map(); // agent_id → [health_records]
    this.failure_counts = new Map(); // agent_id → failure_count
    this.health_baseline = null; // Expected healthy agent percentage
    this.created_at = new Date();
    this.is_running = false;
    this.check_count = 0;
  }

  /**
   * Start health monitoring
   */
  async start() {
    try {
      this.is_running = true;
      this.health_baseline = this.config.anomaly_threshold;

      // Start periodic health checks
      this.check_interval = setInterval(() => {
        this.runHealthCheck();
      }, this.config.check_interval);

      console.log(`${this.name} started (check interval: ${this.config.check_interval}ms)`);
      this.emit("started", { timestamp: new Date() });
      return true;
    } catch (e) {
      console.error("Failed to start health manager:", e);
      this.is_running = false;
      return false;
    }
  }

  /**
   * Run health check across swarm
   */
  async runHealthCheck() {
    if (!this.is_running) return;

    this.check_count++;
    const check_id = `check-${this.check_count}`;
    const timestamp = new Date();

    try {
      const health_report = {
        check_id,
        timestamp,
        agents: [],
        swarm_summary: {},
      };

      // Check each agent
      for (const [agent_id, agent] of this.orchestrator.agents) {
        const health = this.assessAgentHealth(agent);

        health_report.agents.push({
          agent_id,
          health: health.status,
          response_time_ms: health.response_time,
          task_success_rate: health.success_rate,
          message_queue_depth: health.message_queue_depth,
          details: health,
        });

        // Track history
        if (!this.agent_health_history.has(agent_id)) {
          this.agent_health_history.set(agent_id, []);
        }
        this.agent_health_history.get(agent_id).push({
          timestamp,
          status: health.status,
          details: health,
        });

        // Handle unhealthy agent
        if (health.status === "unhealthy") {
          this.handleUnhealthyAgent(agent_id);
        } else {
          // Reset failure count on healthy check
          this.failure_counts.set(agent_id, 0);
        }
      }

      // Compute swarm-level metrics
      const agent_count = this.orchestrator.agents.size;
      const healthy_agents = health_report.agents.filter(
        (a) => a.health === "healthy"
      ).length;
      const degraded_agents = health_report.agents.filter(
        (a) => a.health === "degraded"
      ).length;
      const unhealthy_agents = health_report.agents.filter(
        (a) => a.health === "unhealthy"
      ).length;

      health_report.swarm_summary = {
        total_agents: agent_count,
        healthy_agents,
        degraded_agents,
        unhealthy_agents,
        health_percentage:
          agent_count > 0 ? (healthy_agents / agent_count) * 100 : 0,
        swarm_status: this.getSwarmStatus(
          healthy_agents / Math.max(agent_count, 1)
        ),
      };

      // Detect anomalies
      if (
        health_report.swarm_summary.health_percentage <
        this.health_baseline * 100
      ) {
        this.emit("anomaly_detected", {
          check_id,
          health_percentage:
            health_report.swarm_summary.health_percentage,
          baseline: this.health_baseline * 100,
          timestamp,
        });
      }

      // Cleanup old history
      this.cleanupOldHistory();

      // Emit report
      this.emit("health_check_complete", health_report);

      return health_report;
    } catch (e) {
      console.error(`Health check ${check_id} failed:`, e);
      this.emit("check_error", { check_id, error: e.message });
    }
  }

  /**
   * Assess individual agent health
   */
  assessAgentHealth(agent) {
    const start = Date.now();

    // Get agent status
    const status = agent.getStatus();

    const response_time = Date.now() - start;

    // Health scoring (0-100)
    let health_score = 100;

    // Penalize based on state
    if (status.state === "terminated") {
      health_score -= 50;
    } else if (status.state === "paused") {
      health_score -= 20;
    }

    // Penalize based on task queue depth
    if (status.queued_tasks > 15) {
      health_score -= 10;
    }

    // Penalize based on success rate
    if (status.success_rate < 80) {
      health_score -= 20;
    }

    // Penalize based on active tasks count
    if (status.active_tasks > 10) {
      health_score -= 5;
    }

    // Penalize based on response time
    if (response_time > 100) {
      health_score -= 5;
    }

    // Determine status
    let health_status;
    if (health_score >= 80) {
      health_status = "healthy";
    } else if (health_score >= 50) {
      health_status = "degraded";
    } else {
      health_status = "unhealthy";
    }

    return {
      status: health_status,
      health_score,
      response_time,
      agent_state: status.state,
      success_rate: status.success_rate,
      uptime_seconds: status.uptime_seconds,
      task_count: status.task_count,
      success_count: status.success_count,
      active_tasks: status.active_tasks,
      message_queue_depth: status.queued_tasks || 0,
    };
  }

  /**
   * Handle unhealthy agent
   */
  async handleUnhealthyAgent(agent_id) {
    const current_failures = (this.failure_counts.get(agent_id) || 0) + 1;
    this.failure_counts.set(agent_id, current_failures);

    console.warn(
      `Agent ${agent_id} unhealthy (failure count: ${current_failures}/${this.config.failure_threshold})`
    );

    // Replace after threshold failures
    if (
      current_failures >= this.config.failure_threshold &&
      this.config.replace_unhealthy
    ) {
      console.warn(
        `Replacing unhealthy agent ${agent_id} (exceeded failure threshold)`
      );

      await this.orchestrator.terminateAgent(agent_id);
      const replacement = await this.orchestrator.spawnAgent({
        type: "general",
      });

      this.emit("agent_replaced", {
        removed_agent: agent_id,
        replaced_with: replacement ? replacement.agent_id : null,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get overall swarm status
   */
  getSwarmStatus(health_percentage) {
    if (health_percentage >= 0.9) {
      return "healthy";
    } else if (health_percentage >= 0.7) {
      return "degraded";
    } else if (health_percentage >= 0.5) {
      return "critical";
    } else {
      return "failure";
    }
  }

  /**
   * Cleanup old health history (older than retention period)
   */
  cleanupOldHistory() {
    const cutoff_date = new Date(
      Date.now() - this.config.history_retention_days * 24 * 60 * 60 * 1000
    );

    for (const [agent_id, history] of this.agent_health_history) {
      // Keep only recent entries
      const filtered = history.filter(
        (h) => new Date(h.timestamp) > cutoff_date
      );
      if (filtered.length > 0) {
        this.agent_health_history.set(agent_id, filtered);
      } else {
        // Remove if no history left
        this.agent_health_history.delete(agent_id);
      }
    }
  }

  /**
   * Get health history for agent
   */
  getAgentHealthHistory(agent_id) {
    return this.agent_health_history.get(agent_id) || [];
  }

  /**
   * Get swarm health statistics
   */
  getHealthStatistics() {
    const stats = {
      total_checks: this.check_count,
      uptime_seconds: (new Date() - this.created_at) / 1000,
      agents_monitored: this.orchestrator.agents.size,
      agents_replaced: 0,
      current_health_percentage: 0,
    };

    let healthy_count = 0;
    for (const [, agent] of this.orchestrator.agents) {
      const health = this.assessAgentHealth(agent);
      if (health.status === "healthy") {
        healthy_count++;
      }
    }

    stats.current_health_percentage =
      this.orchestrator.agents.size > 0
        ? (healthy_count / this.orchestrator.agents.size) * 100
        : 0;

    // Count replacements from history
    for (const [, history] of this.agent_health_history) {
      if (
        history[history.length - 1]?.details?.health_score < 50 &&
        history[0]?.timestamp
      ) {
        stats.agents_replaced++;
      }
    }

    return stats;
  }

  /**
   * Stop health monitoring
   */
  async stop() {
    console.log("Stopping health manager...");
    this.is_running = false;
    clearInterval(this.check_interval);
    this.emit("stopped", { timestamp: new Date() });
  }
}

module.exports = SwarmHealthManager;
