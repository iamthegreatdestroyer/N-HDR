/**
 * Swarm Message Router
 * 
 * Routes messages between agents, handles delivery guarantees, tracks routing metrics
 * Task 9.3: Inter-Agent Communication (A2A Protocol Foundation)
 * 
 * Features:
 * - Message envelope routing with metadata
 * - Delivery guarantees (at-least-once)
 * - Message priority handling
 * - Routing table & agent discovery
 * - Message history & audit trail
 * - Dead letter queue for undeliverable messages
 */

const EventEmitter = require("events");
const crypto = require("crypto");

class SwarmMessageRouter extends EventEmitter {
  constructor(orchestrator, config = {}) {
    super();

    this.orchestrator = orchestrator;
    this.name = "swarm-message-router";
    this.config = {
      max_retry_attempts: config.max_retry_attempts || 3,
      retry_delay_ms: config.retry_delay_ms || 100,
      max_queue_size: config.max_queue_size || 10000,
      message_history_size: config.message_history_size || 1000,
      dead_letter_queue_size: config.dead_letter_queue_size || 100,
      enable_audit_trail: config.enable_audit_trail !== false,
      ...config,
    };

    this.message_queue = []; // Messages waiting for delivery
    this.message_history = []; // Last N messages (for audit)
    this.dead_letter_queue = []; // Messages that couldn't be delivered
    this.routing_table = new Map(); // agent_id → routing info
    this.in_flight_messages = new Map(); // message_id → in-flight metadata
    this.created_at = new Date();
  }

  /**
   * Route a message from source to destination agent(s)
   */
  async routeMessage(envelope) {
    if (!envelope) {
      throw new Error("Envelope required for routing");
    }

    // Add metadata
    const message_id = envelope.id || this.generateMessageId();
    const routed_at = new Date();

    const routing_context = {
      message_id,
      from_agent_id: envelope.from_agent_id,
      to_agent_id: envelope.to_agent_id || null, // Can be null for broadcast
      content_type: envelope.content_type || "text",
      priority: envelope.priority || "normal",
      routed_at,
      retry_count: 0,
      status: "pending",
    };

    // Track in-flight
    this.in_flight_messages.set(message_id, routing_context);

    try {
      // Broadcast vs targeted routing
      if (!envelope.to_agent_id) {
        return await this.broadcastMessage(envelope, routing_context);
      } else {
        return await this.deliverToAgent(envelope, routing_context);
      }
    } catch (e) {
      console.error(`Message routing failed: ${e.message}`);
      routing_context.status = "failed";
      routing_context.error = e.message;
      this.moveToDeadLetterQueue(envelope, routing_context);
      this.emit("message_failed", routing_context);
      throw e;
    }
  }

  /**
   * Deliver message to specific agent with retry logic
   */
  async deliverToAgent(envelope, routing_context) {
    const target_agent = this.orchestrator.agents.get(
      envelope.to_agent_id
    );

    if (!target_agent) {
      throw new Error(`Target agent not found: ${envelope.to_agent_id}`);
    }

    // Retry loop
    for (
      let attempt = 0;
      attempt < this.config.max_retry_attempts;
      attempt++
    ) {
      try {
        routing_context.retry_count = attempt;

        // Deliver message (async)
        await new Promise((resolve) => {
          setImmediate(() => {
            target_agent.receiveMessage(envelope);
            resolve();
          });
        });

        routing_context.status = "delivered";
        routing_context.delivered_at = new Date();

        // Record in history
        this.recordMessage(envelope, routing_context);

        // Emit success
        this.emit("message_delivered", {
          message_id: routing_context.message_id,
          to_agent_id: envelope.to_agent_id,
          attempts: attempt + 1,
          timestamp: routing_context.delivered_at,
        });

        // Update routing table
        this.updateRoutingTable(envelope.to_agent_id);

        return routing_context;
      } catch (e) {
        if (attempt < this.config.max_retry_attempts - 1) {
          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              this.config.retry_delay_ms * Math.pow(2, attempt)
            )
          );
        } else {
          throw e;
        }
      }
    }
  }

  /**
   * Broadcast message to all agents
   */
  async broadcastMessage(envelope, routing_context) {
    const target_agents = Array.from(this.orchestrator.agents.values());
    const delivery_results = {
      total: target_agents.length,
      successful: 0,
      failed: 0,
      failed_agents: [],
    };

    for (const agent of target_agents) {
      try {
        await new Promise((resolve) => {
          setImmediate(() => {
            agent.receiveMessage(envelope);
            resolve();
          });
        });

        delivery_results.successful++;
      } catch (e) {
        delivery_results.failed++;
        delivery_results.failed_agents.push(agent.agent_id);
      }
    }

    routing_context.status =
      delivery_results.failed === 0 ? "delivered" : "partial";
    routing_context.broadcast_results = delivery_results;
    routing_context.delivered_at = new Date();

    // Record in history
    this.recordMessage(envelope, routing_context);

    this.emit("broadcast_complete", {
      message_id: routing_context.message_id,
      ...delivery_results,
      timestamp: routing_context.delivered_at,
    });

    return routing_context;
  }

  /**
   * Queue message if all agents busy
   */
  queueMessage(envelope) {
    if (this.message_queue.length >= this.config.max_queue_size) {
      throw new Error("Message queue full");
    }

    this.message_queue.push({
      envelope,
      queued_at: new Date(),
      priority: envelope.priority || "normal",
    });

    this.emit("message_queued", {
      message_id: envelope.id,
      queue_size: this.message_queue.length,
    });

    return {
      queued: true,
      queue_position: this.message_queue.length - 1,
    };
  }

  /**
   * Process queued messages (called when agents become available)
   */
  async processQueuedMessages() {
    // Sort by priority (high → normal → low)
    this.message_queue.sort((a, b) => {
      const priority_order = { high: 0, normal: 1, low: 2 };
      return priority_order[a.priority] - priority_order[b.priority];
    });

    // Process up to 10 messages per flush
    const to_process = this.message_queue.splice(0, 10);

    for (const item of to_process) {
      try {
        await this.routeMessage(item.envelope);
      } catch (e) {
        // If still can't deliver, re-queue at end
        this.message_queue.push(item);
      }
    }

    this.emit("queue_flushed", {
      processed: to_process.length,
      remaining: this.message_queue.length,
    });
  }

  /**
   * Record message in history for audit
   */
  recordMessage(envelope, routing_context) {
    if (!this.config.enable_audit_trail) {
      return;
    }

    const record = {
      message_id: routing_context.message_id,
      from_agent_id: envelope.from_agent_id,
      to_agent_id: envelope.to_agent_id,
      content_type: envelope.content_type,
      priority: envelope.priority,
      status: routing_context.status,
      routed_at: routing_context.routed_at,
      delivered_at: routing_context.delivered_at,
      retry_count: routing_context.retry_count,
    };

    this.message_history.push(record);

    // Keep only last N messages
    if (
      this.message_history.length >
      this.config.message_history_size
    ) {
      this.message_history.shift();
    }
  }

  /**
   * Move failed message to dead letter queue
   */
  moveToDeadLetterQueue(envelope, routing_context) {
    const dlq_entry = {
      message_id: routing_context.message_id,
      envelope,
      failed_at: new Date(),
      failures: routing_context.retry_count,
      error: routing_context.error,
    };

    this.dead_letter_queue.push(dlq_entry);

    // Keep only last N entries
    if (
      this.dead_letter_queue.length >
      this.config.dead_letter_queue_size
    ) {
      this.dead_letter_queue.shift();
    }

    this.emit("dead_letter_added", {
      message_id: routing_context.message_id,
      dlq_size: this.dead_letter_queue.length,
    });
  }

  /**
   * Update routing table entry
   */
  updateRoutingTable(agent_id) {
    const entry = this.routing_table.get(agent_id) || {
      agent_id,
      messages_sent: 0,
      messages_delivered: 0,
      last_contact: null,
    };

    entry.messages_delivered++;
    entry.last_contact = new Date();

    this.routing_table.set(agent_id, entry);
  }

  /**
   * Discover agents (build routing table)
   */
  async discoverAgents() {
    const discovered = [];

    for (const [agent_id, agent] of this.orchestrator.agents) {
      const status = agent.getStatus();

      discovered.push({
        agent_id,
        name: status.name,
        state: status.state,
        is_available: status.state === "ready",
      });

      // Update routing table
      if (!this.routing_table.has(agent_id)) {
        this.routing_table.set(agent_id, {
          agent_id,
          messages_sent: 0,
          messages_delivered: 0,
          last_contact: new Date(),
        });
      }
    }

    this.emit("discovery_complete", {
      discovered_agents: discovered.length,
      timestamp: new Date(),
    });

    return discovered;
  }

  /**
   * Get routing statistics
   */
  getRoutingStats() {
    const stats = {
      message_queue_size: this.message_queue.length,
      in_flight_count: this.in_flight_messages.size,
      history_size: this.message_history.length,
      dead_letter_queue_size: this.dead_letter_queue.length,
      known_agents: this.routing_table.size,
      uptime_seconds: (new Date() - this.created_at) / 1000,
    };

    // Calculate success rate
    let total_delivered = 0;
    let total_messages = 0;

    for (const entry of this.routing_table.values()) {
      total_delivered += entry.messages_delivered;
    }

    if (total_delivered > 0) {
      stats.delivery_success_rate = (
        (total_delivered / (total_delivered + this.dead_letter_queue.length)) *
        100
      ).toFixed(2);
    }

    return stats;
  }

  /**
   * Get message history (filtered)
   */
  getMessageHistory(filters = {}) {
    let history = [...this.message_history];

    if (filters.from_agent_id) {
      history = history.filter(
        (m) => m.from_agent_id === filters.from_agent_id
      );
    }

    if (filters.to_agent_id) {
      history = history.filter((m) => m.to_agent_id === filters.to_agent_id);
    }

    if (filters.status) {
      history = history.filter((m) => m.status === filters.status);
    }

    // Return most recent first
    return history.reverse().slice(0, filters.limit || 100);
  }

  /**
   * Get dead letter queue entries
   */
  getDeadLetters(limit = 50) {
    return this.dead_letter_queue.slice(-limit);
  }

  /**
   * Generate message ID
   */
  generateMessageId() {
    return `msg-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  }
}

module.exports = SwarmMessageRouter;
