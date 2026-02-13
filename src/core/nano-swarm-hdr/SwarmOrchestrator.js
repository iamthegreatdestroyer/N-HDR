/**
 * NS-HDR Swarm Orchestrator
 *
 * Manages Claude-Flow powered multi-agent swarm
 * Task 9.3: Multi-Agent Swarm Architecture
 *
 * Features:
 * - Dynamic agent spawning & termination
 * - Load-balanced task distribution
 * - Auto-scaling based on queue depth
 * - Swarm-wide health monitoring
 * - Agent collaboration & messaging
 */

const EventEmitter = require("events");
const SwarmAgent = require("./SwarmAgent");

class SwarmOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();

    this.name = "nano-swarm-orchestrator";
    this.version = "1.0.0";
    this.config = {
      min_agents: config.min_agents || 3,
      max_agents: config.max_agents || 20,
      spawn_threshold_queue_size: config.spawn_threshold_queue_size || 10,
      terminate_idle_after_ms: config.terminate_idle_after_ms || 60000,
      health_check_interval: config.health_check_interval || 10000,
      state_dir: config.state_dir || "./data/swarm-state",
      ...config,
    };

    this.agents = new Map(); // agent_id → SwarmAgent
    this.task_queue = []; // Global task queue
    this.task_history = []; // Completed tasks
    this.created_at = new Date();
    this.is_running = false;

    // Health & metrics
    this.swarm_health = "initializing";
    this.metrics = {
      agents_spawned: 0,
      agents_terminated: 0,
      tasks_completed: 0,
      tasks_failed: 0,
      total_execution_time_ms: 0,
    };

    // Setup
    this.setupHealthMonitoring();
  }

  /**
   * Start orchestrator
   */
  async start() {
    try {
      this.is_running = true;
      this.created_at = new Date();

      // Spawn initial agents
      for (let i = 0; i < this.config.min_agents; i++) {
        await this.spawnAgent({
          type: "general",
          rank: i === 0 ? 1 : 0, // First agent is supervisor
        });
      }

      console.log(
        `${this.name} started with ${this.agents.size} initial agents`,
      );
      this.emit("started", { timestamp: new Date() });
      return true;
    } catch (e) {
      console.error("Failed to start orchestrator:", e);
      this.is_running = false;
      return false;
    }
  }

  /**
   * Spawn new agent with given config
   */
  async spawnAgent(config = {}) {
    if (this.agents.size >= this.config.max_agents) {
      return null; // Already at max capacity
    }

    try {
      const agent = new SwarmAgent({
        state_dir: this.config.state_dir,
        ...config,
      });

      // Initialize agent
      const initialized = await agent.initialize();
      if (!initialized) {
        throw new Error("Agent initialization failed");
      }

      // Register agent
      this.agents.set(agent.agent_id, agent);
      this.metrics.agents_spawned++;

      // Setup event handlers
      agent.on("task_complete", (task) => {
        this.onTaskComplete(agent.agent_id, task);
      });

      agent.on("task_error", (task, error) => {
        this.onTaskError(agent.agent_id, task, error);
      });

      agent.on("message_sent", (envelope) => {
        this.routeMessage(envelope);
      });

      agent.on("state_change", (old, new_state) => {
        this.onAgentStateChange(agent.agent_id, old, new_state);
      });

      console.log(
        `Spawned agent: ${agent.agent_id} (total: ${this.agents.size}/${this.config.max_agents})`,
      );

      this.emit("agent_spawned", {
        agent_id: agent.agent_id,
        timestamp: new Date(),
      });

      return agent;
    } catch (e) {
      console.error("Failed to spawn agent:", e);
      return null;
    }
  }

  /**
   * Spawn multiple agents
   */
  async spawnMultiple(count, config = {}) {
    const spawned = [];
    for (let i = 0; i < count; i++) {
      const agent = await this.spawnAgent(config);
      if (agent) {
        spawned.push(agent);
      }
    }
    return spawned;
  }

  /**
   * Distribute task to least-busy agent
   */
  async distributeTask(task) {
    // If task queue is full, queue for later
    if (this.task_queue.length > this.config.spawn_threshold_queue_size) {
      // Check if should spawn more agents
      if (this.agents.size < this.config.max_agents) {
        await this.spawnAgent({ type: "general" });
      }
    }

    // Find least-busy agent (fewest active tasks)
    let best_agent = null;
    let min_task_count = Infinity;

    for (const [, agent] of this.agents) {
      if (agent.state === "ready" && agent.active_tasks.size < min_task_count) {
        best_agent = agent;
        min_task_count = agent.active_tasks.size;
      }
    }

    // If no ready agents, queue task
    if (!best_agent) {
      this.task_queue.push(task);
      console.log(
        `Task queued (no ready agents). Queue size: ${this.task_queue.length}`,
      );
      return { queued: true, queue_position: this.task_queue.length };
    }

    // Execute on best agent
    console.log(
      `Distributing task ${task.id || task.type} to ${best_agent.agent_id}`,
    );
    return await best_agent.execute(task);
  }

  /**
   * Auto-scale agents based on queue depth
   */
  async scaleToQueueDepth() {
    const queue_depth = this.task_queue.length;
    const agents_needed = Math.ceil(queue_depth / 5); // Assume 5 tasks per agent

    const current_agents = this.agents.size;
    const desired_agents = Math.min(
      Math.max(agents_needed, this.config.min_agents),
      this.config.max_agents,
    );

    if (desired_agents > current_agents) {
      // Scale up
      const to_spawn = desired_agents - current_agents;
      console.log(
        `Scaling up: spawning ${to_spawn} agents (current: ${current_agents}, desired: ${desired_agents})`,
      );
      await this.spawnMultiple(to_spawn);
    } else if (
      desired_agents < current_agents &&
      desired_agents >= this.config.min_agents
    ) {
      // Scale down (terminate idle agents)
      const to_terminate = current_agents - desired_agents;
      console.log(
        `Scaling down: terminating ${to_terminate} idle agents (current: ${current_agents}, desired: ${desired_agents})`,
      );
      await this.terminateIdleAgents(to_terminate);
    }
  }

  /**
   * Terminate idle agents
   */
  async terminateIdleAgents(count) {
    let terminated = 0;
    const now = new Date();

    for (const [agent_id, agent] of this.agents) {
      if (terminated >= count) break;
      if (agent.state === "ready" && agent.active_tasks.size === 0) {
        const idle_time = now - agent.last_heartbeat;
        if (idle_time > this.config.terminate_idle_after_ms) {
          await this.terminateAgent(agent_id);
          terminated++;
        }
      }
    }
  }

  /**
   * Terminate specific agent
   */
  async terminateAgent(agent_id) {
    const agent = this.agents.get(agent_id);
    if (!agent) return;

    await agent.terminate();
    this.agents.delete(agent_id);
    this.metrics.agents_terminated++;

    this.emit("agent_terminated", {
      agent_id,
      timestamp: new Date(),
    });
  }

  /**
   * Route message between agents (A2A Protocol)
   */
  routeMessage(envelope) {
    const target_agent = this.agents.get(envelope.to_agent_id);
    if (!target_agent) {
      console.warn(
        `Target agent ${envelope.to_agent_id} not found for message ${envelope.id}`,
      );
      return;
    }

    // Deliver message asynchronously
    setImmediate(async () => {
      await target_agent.receiveMessage(envelope);
    });
  }

  /**
   * Setup health monitoring
   */
  setupHealthMonitoring() {
    this.health_interval = setInterval(() => {
      this.runHealthCheck();
    }, this.config.health_check_interval);
  }

  /**
   * Run health check
   */
  async runHealthCheck() {
    if (!this.is_running) return;

    const statuses = [];
    for (const [, agent] of this.agents) {
      const status = agent.getStatus();
      statuses.push({
        agent_id: status.agent_id,
        state: status.state,
        healthy: status.state === "ready" || status.state === "executing",
      });
    }

    const healthy_count = statuses.filter((s) => s.healthy).length;
    const health_percentage =
      (healthy_count / Math.max(statuses.length, 1)) * 100;

    this.swarm_health =
      health_percentage > 80
        ? "healthy"
        : health_percentage > 50
          ? "degraded"
          : "unhealthy";

    // Handle degraded health
    if (this.swarm_health === "unhealthy") {
      console.warn("Swarm health critical! Spawning replacement agents...");
      for (const status of statuses) {
        if (!status.healthy) {
          await this.terminateAgent(status.agent_id);
          await this.spawnAgent({ type: "general" });
        }
      }
    }

    // Scale based on queue depth
    await this.scaleToQueueDepth();

    this.emit("health_check", {
      timestamp: new Date(),
      swarm_health: this.swarm_health,
      healthy_agents: healthy_count,
      total_agents: statuses.length,
      queue_size: this.task_queue.length,
      metrics: this.metrics,
    });
  }

  /**
   * Event handlers
   */
  onTaskComplete(agent_id, task) {
    this.metrics.tasks_completed++;
    this.metrics.total_execution_time_ms += task.completed_at - task.started_at;

    // Add to history
    this.task_history.push({
      task_id: task.id,
      agent_id,
      status: "completed",
      completed_at: task.completed_at,
    });

    // Keep only last 1000 tasks
    if (this.task_history.length > 1000) {
      this.task_history.shift();
    }

    // Process next queued task if available
    if (this.task_queue.length > 0) {
      const next_task = this.task_queue.shift();
      this.distributeTask(next_task);
    }
  }

  onTaskError(agent_id, task, error) {
    this.metrics.tasks_failed++;
    this.task_history.push({
      task_id: task.id,
      agent_id,
      status: "failed",
      error: error.message,
      failed_at: new Date(),
    });
  }

  onAgentStateChange(agent_id, old_state, new_state) {
    this.emit("agent_state_changed", {
      agent_id,
      old_state,
      new_state,
      timestamp: new Date(),
    });
  }

  /**
   * Get swarm status
   */
  getSwarmStatus() {
    const agent_statuses = [];
    for (const [, agent] of this.agents) {
      agent_statuses.push(agent.getStatus());
    }

    return {
      swarm_name: this.name,
      swarm_health: this.swarm_health,
      uptime_seconds: (new Date() - this.created_at) / 1000,
      agents: {
        total: this.agents.size,
        min: this.config.min_agents,
        max: this.config.max_agents,
        statuses: agent_statuses,
      },
      tasks: {
        queued: this.task_queue.length,
        completed: this.metrics.tasks_completed,
        failed: this.metrics.tasks_failed,
        avg_execution_ms:
          this.metrics.tasks_completed > 0
            ? this.metrics.total_execution_time_ms /
              this.metrics.tasks_completed
            : 0,
      },
      metrics: this.metrics,
    };
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown() {
    console.log("Shutting down swarm orchestrator...");
    this.is_running = false;
    clearInterval(this.health_interval);

    // Terminate all agents
    for (const [agent_id] of this.agents) {
      await this.terminateAgent(agent_id);
    }

    this.emit("shutdown", { timestamp: new Date(), metrics: this.metrics });
    console.log("Swarm orchestrator shutdown complete");
  }
}

module.exports = SwarmOrchestrator;
