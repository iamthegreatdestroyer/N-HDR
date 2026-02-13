/**
 * NS-HDR Swarm Agent Class
 * 
 * Individual agent in Claude-Flow powered swarm
 * Task 9.3: Multi-Agent Swarm Architecture
 * 
 * Features:
 * - Agent lifecycle management (initialize → ready → executing → terminated)
 * - Task execution with Claude API
 * - Inter-agent messaging (A2A Protocol)
 * - State persistence & recovery
 * - Health monitoring
 */

const EventEmitter = require("events");
const crypto = require("crypto");
const fs = require("fs").promises;
const path = require("path");

class SwarmAgent extends EventEmitter {
  constructor(config = {}) {
    super();

    // Agent identification
    this.agent_id = config.agent_id || `agent-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    this.name = config.name || `Agent-${this.agent_id.split("-")[1]}`;
    this.type = config.type || "general"; // general, specialized, supervisor
    this.rank = config.rank || 0; // 0=peer, 1-10=seniority

    // State management
    this.state = "initializing"; // initializing, ready, executing, paused, terminated
    this.created_at = new Date();
    this.last_heartbeat = new Date();
    this.task_count = 0;
    this.success_count = 0;

    // Configuration
    this.config = {
      state_dir: config.state_dir || "./data/agent-states",
      max_tasks_concurrent: config.max_tasks_concurrent || 5,
      heartbeat_interval: config.heartbeat_interval || 5000,
      timeout_ms: config.timeout_ms || 30000,
      ...config,
    };

    // Message & task handling
    this.message_queue = []; // Incoming messages
    this.task_queue = []; // Pending tasks
    this.active_tasks = new Map(); // task_id → task_info
    this.message_history = []; // Last 100 messages
    this.callbacks = new Map(); // Event handlers

    // Initialize callbacks
    this.on("state_change", (old_state, new_state) => {
      console.log(`[${this.agent_id}] State: ${old_state} → ${new_state}`);
    });

    this.on("message_received", (msg) => {
      console.log(`[${this.agent_id}] Message from ${msg.from_agent_id}: ${msg.content_preview}`);
    });

    this.on("task_complete", (task) => {
      this.success_count++;
      console.log(`[${this.agent_id}] Task ${task.id} completed successfully`);
    });

    this.on("task_error", (task, error) => {
      console.error(`[${this.agent_id}] Task ${task.id} failed: ${error.message}`);
    });
  }

  /**
   * Initialize agent - load prior state if exists
   */
  async initialize() {
    try {
      this.setState("initializing");

      // Try to load persisted state
      await this.loadPersistedState();

      // Start heartbeat
      this.heartbeat_interval = setInterval(() => {
        this.last_heartbeat = new Date();
        this.emit("heartbeat", {
          agent_id: this.agent_id,
          timestamp: this.last_heartbeat,
          task_count: this.task_count,
          active_tasks: this.active_tasks.size,
        });
      }, this.config.heartbeat_interval);

      this.setState("ready");
      console.log(`[${this.agent_id}] Initialized and ready`);
      return true;
    } catch (e) {
      console.error(`Failed to initialize ${this.agent_id}:`, e);
      this.setState("terminated");
      return false;
    }
  }

  /**
   * Execute a task
   */
  async execute(task) {
    if (this.active_tasks.size >= this.config.max_tasks_concurrent) {
      // Queue for later
      this.task_queue.push(task);
      return { queued: true, position: this.task_queue.length };
    }

    this.setState("executing");
    const task_id = task.id || `task-${Date.now()}`;

    try {
      // Register active task
      const task_info = {
        id: task_id,
        type: task.type,
        status: "executing",
        started_at: new Date(),
        progress: 0,
      };
      this.active_tasks.set(task_id, task_info);
      this.task_count++;

      console.log(`[${this.agent_id}] Executing task ${task_id}: ${task.type}`);

      // Execute task logic (varies by task type)
      let result;
      switch (task.type) {
        case "think":
          result = await this.thinkTask(task);
          break;
        case "communicate":
          result = await this.communicateTask(task);
          break;
        case "coordinate":
          result = await this.coordinateTask(task);
          break;
        case "learn":
          result = await this.learnTask(task);
          break;
        default:
          result = await this.genericTask(task);
      }

      // Update task status
      task_info.status = "completed";
      task_info.completed_at = new Date();
      task_info.result = result;
      this.active_tasks.set(task_id, task_info);

      this.emit("task_complete", task_info);

      // Process next queued task if available
      if (this.task_queue.length > 0) {
        const next_task = this.task_queue.shift();
        setImmediate(() => this.execute(next_task));
      } else {
        this.setState("ready");
      }

      return {
        success: true,
        task_id,
        result,
        duration_ms: Date.now() - task_info.started_at,
      };
    } catch (e) {
      const task_info = this.active_tasks.get(task_id);
      if (task_info) {
        task_info.status = "failed";
        task_info.error = e.message;
      }

      this.emit("task_error", { id: task_id, type: task.type }, e);

      return {
        success: false,
        task_id,
        error: e.message,
      };
    }
  }

  /**
   * Send message to another agent (A2A Protocol)
   */
  async sendMessage(target_agent_id, message) {
    const msg_id = `msg-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;

    const envelope = {
      id: msg_id,
      from_agent_id: this.agent_id,
      to_agent_id: target_agent_id,
      content: message.content || message,
      content_type: message.type || "text",
      timestamp: new Date().toISOString(),
      priority: message.priority || "normal",
    };

    // In production, this would call A2A Protocol API endpoint:
    // POST /api/a2a/agent/{target_agent_id}/message
    //
    // For now, emit locally
    this.emit("message_sent", envelope);

    console.log(
      `[${this.agent_id}] Sent message to ${target_agent_id}: ${message.content?.substring(0, 50)}...`
    );

    return msg_id;
  }

  /**
   * Receive message from another agent
   */
  async receiveMessage(envelope) {
    // Store in history
    this.message_history.push({
      ...envelope,
      received_at: new Date().toISOString(),
    });

    // Keep only last 100 messages
    if (this.message_history.length > 100) {
      this.message_history.shift();
    }

    // Process message
    const content_preview = (envelope.content || "").substring(0, 40);
    this.emit("message_received", {
      ...envelope,
      content_preview,
    });

    // Handle message (varies by type)
    switch (envelope.content_type) {
      case "task":
        this.task_queue.push(JSON.parse(envelope.content));
        break;
      case "broadcast":
        // Handle broadcast message (e.g., swarm-wide announcement)
        this.emit("broadcast_received", envelope);
        break;
      case "query":
        // Respond to query
        return await this.respondToQuery(envelope);
      default:
        // Log unknown message type
        console.log(`[${this.agent_id}] Unknown message type: ${envelope.content_type}`);
    }
  }

  /**
   * Persist agent state to disk
   */
  async persistState() {
    try {
      await fs.mkdir(this.config.state_dir, { recursive: true });

      const state_file = path.join(this.config.state_dir, `${this.agent_id}-state.json`);

      const serializable_state = {
        agent_id: this.agent_id,
        name: this.name,
        type: this.type,
        rank: this.rank,
        state: this.state,
        created_at: this.created_at.toISOString(),
        last_heartbeat: this.last_heartbeat.toISOString(),
        task_count: this.task_count,
        success_count: this.success_count,
        message_history: this.message_history.slice(-20), // Last 20 messages
        active_task_ids: Array.from(this.active_tasks.keys()),
        queued_task_count: this.task_queue.length,
      };

      await fs.writeFile(state_file, JSON.stringify(serializable_state, null, 2));
      return true;
    } catch (e) {
      console.error(`Failed to persist state for ${this.agent_id}:`, e);
      return false;
    }
  }

  /**
   * Load agent state from disk
   */
  async loadPersistedState() {
    try {
      const state_file = path.join(this.config.state_dir, `${this.agent_id}-state.json`);
      const data = await fs.readFile(state_file, "utf-8");
      const persisted = JSON.parse(data);

      // Restore state
      this.name = persisted.name || this.name;
      this.type = persisted.type || this.type;
      this.rank = persisted.rank || this.rank;
      this.task_count = persisted.task_count || 0;
      this.success_count = persisted.success_count || 0;
      this.message_history = persisted.message_history || [];

      console.log(`[${this.agent_id}] Loaded persisted state: ${persisted.task_count} tasks completed`);
      return true;
    } catch (e) {
      // File doesn't exist or can't be read - this is normal for new agents
      console.log(`[${this.agent_id}] No persisted state found (new agent)`);
      return false;
    }
  }

  /**
   * State transition with event emission
   */
  setState(new_state) {
    const old_state = this.state;
    this.state = new_state;
    this.emit("state_change", old_state, new_state);
  }

  /**
   * Terminate agent and cleanup
   */
  async terminate() {
    this.setState("terminated");
    clearInterval(this.heartbeat_interval);

    // Persist final state
    await this.persistState();

    // Emit close event
    this.emit("terminated", {
      agent_id: this.agent_id,
      uptime_seconds: (new Date() - this.created_at) / 1000,
      tasks_completed: this.success_count,
      total_tasks: this.task_count,
    });

    console.log(`[${this.agent_id}] Terminated (${this.success_count}/${this.task_count} tasks successful)`);
  }

  // Task implementation stubs
  async thinkTask(task) {
    // Simulate thinking (in production, would call Claude API)
    await new Promise((r) => setTimeout(r, 500));
    return { thought: task.prompt, confidence: 0.95 };
  }

  async communicateTask(task) {
    // Send message to target agent
    await this.sendMessage(task.target_agent_id, task.message);
    return { sent: true, message_id: `msg-${Date.now()}` };
  }

  async coordinateTask(task) {
    // Coordinate with other agents
    return { coordination_id: `coord-${Date.now()}`, agents_involved: 3 };
  }

  async learnTask(task) {
    // Learn from experience
    return { learning_complete: true, new_patterns: task.patterns || [] };
  }

  async genericTask(task) {
    // Generic task handling
    return { executed: true, result: "Task executed" };
  }

  async respondToQuery(envelope) {
    // Respond to query message
    return {
      response: "Query acknowledged",
      query_id: envelope.id,
      responder_id: this.agent_id,
    };
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      agent_id: this.agent_id,
      name: this.name,
      type: this.type,
      rank: this.rank,
      state: this.state,
      uptime_seconds: (new Date() - this.created_at) / 1000,
      task_count: this.task_count,
      success_count: this.success_count,
      success_rate: this.task_count > 0 ? (this.success_count / this.task_count) * 100 : 0,
      active_tasks: this.active_tasks.size,
      queued_tasks: this.task_queue.length,
      last_heartbeat: this.last_heartbeat.toISOString(),
    };
  }
}

module.exports = SwarmAgent;
