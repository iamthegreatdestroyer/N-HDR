/**
 * Swarm Event Bus
 * 
 * Centralized event management for swarm orchestration
 * Task 9.3: Cross-System Event Coordination
 * 
 * Features:
 * - Global event routing across all swarm systems
 * - Event filtering and subscriptions
 * - Event history with replay capability
 * - Priority-based event handling
 * - Event aggregation and batching
 * - Dead letter queue for failed event handlers
 */

const EventEmitter = require("events");

class SwarmEventBus extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(100); // Support many listeners

    this.name = "swarm-event-bus";
    this.config = {
      event_history_size: config.event_history_size || 1000,
      enable_history: config.enable_history || true,
      enable_priority: config.enable_priority || true,
      dead_letter_queue_size: config.dead_letter_queue_size || 100,
      ...config,
    };

    this.event_history = [];
    this.dead_letter_queue = [];
    this.subscriptions = new Map(); // topic → [{ callback, priority, once_only }]
    this.event_counts = {};
    this.last_event = null;
    this.is_running = false;
    this.created_at = new Date();
  }

  /**
   * Register event subscription
   */
  subscribe(topic, callback, config = {}) {
    const subscription = {
      topic,
      callback,
      priority: config.priority || "normal", // high, normal, low
      once_only: config.once_only || false,
      created_at: new Date(),
      call_count: 0,
    };

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }

    this.subscriptions.get(topic).push(subscription);

    // Sort by priority
    this.sortSubscriptionsByPriority(topic);

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(topic);
      const index = subs.indexOf(subscription);
      if (index > -1) {
        subs.splice(index, 1);
      }
    };
  }

  /**
   * Sort subscriptions by priority
   */
  sortSubscriptionsByPriority(topic) {
    const priority_order = { high: 0, normal: 1, low: 2 };
    const subs = this.subscriptions.get(topic);

    subs.sort((a, b) => {
      const priority_a = priority_order[a.priority] || 1;
      const priority_b = priority_order[b.priority] || 1;
      return priority_a - priority_b;
    });
  }

  /**
   * Publish event to all subscribers
   */
  async publishEvent(topic, data = {}, options = {}) {
    const event = {
      topic,
      data,
      timestamp: new Date(),
      event_id: this.generateEventId(),
      priority: options.priority || "normal",
      source: options.source || "unknown",
    };

    this.last_event = event;

    // Track event count
    this.event_counts[topic] = (this.event_counts[topic] || 0) + 1;

    // Store in history
    if (this.config.enable_history) {
      this.event_history.push(event);

      // Trim history
      if (
        this.event_history.length >
        this.config.event_history_size
      ) {
        this.event_history.shift();
      }
    }

    // Get subscribers for this topic
    const subs = this.subscriptions.get(topic) || [];

    // Handle wildcard subscriptions
    const wildcard_subs = this.subscriptions.get("*") || [];
    const all_subs = [...subs, ...wildcard_subs];

    // Process subscriptions
    for (const subscription of all_subs) {
      try {
        // Call subscription handler
        if (subscription.once_only) {
          await subscription.callback(event);
          // Remove after handling
          const index = all_subs.indexOf(subscription);
          if (index > -1) {
            const topic_subs = this.subscriptions.get(
              subscription.topic
            );
            const sub_index = topic_subs.indexOf(subscription);
            if (sub_index > -1) {
              topic_subs.splice(sub_index, 1);
            }
          }
        } else {
          await subscription.callback(event);
        }

        subscription.call_count++;
      } catch (e) {
        // Move failed event to DLQ
        this.moveToDeadLetterQueue(event, subscription, e);

        this.emit("subscription_error", {
          topic,
          error: e.message,
        });
      }
    }

    // Emit on the event bus itself (for direct listeners)
    this.emit(topic, event);

    return event;
  }

  /**
   * Move failed event to dead letter queue
   */
  moveToDeadLetterQueue(event, subscription, error) {
    const dlq_entry = {
      event,
      subscription_topic: subscription.topic,
      error: error.message,
      failed_at: new Date(),
    };

    this.dead_letter_queue.push(dlq_entry);

    // Keep only last N DLQ entries
    if (
      this.dead_letter_queue.length >
      this.config.dead_letter_queue_size
    ) {
      this.dead_letter_queue.shift();
    }

    this.emit("dead_letter_queue_added", dlq_entry);
  }

  /**
   * Publish multiple events (batch)
   */
  async publishBatch(events) {
    const published = [];

    for (const event_spec of events) {
      const published_event = await this.publishEvent(
        event_spec.topic,
        event_spec.data,
        event_spec.options
      );
      published.push(published_event);
    }

    return published;
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Get event history
   */
  getEventHistory(topic = null, limit = 100) {
    if (!topic) {
      return this.event_history.slice(-limit);
    }

    return this.event_history
      .filter((e) => e.topic === topic)
      .slice(-limit);
  }

  /**
   * Query event history with filters
   */
  queryEventHistory(filters = {}) {
    let results = this.event_history;

    if (filters.topic) {
      results = results.filter((e) => e.topic === filters.topic);
    }

    if (filters.source) {
      results = results.filter((e) => e.source === filters.source);
    }

    if (filters.since) {
      results = results.filter(
        (e) => e.timestamp >= new Date(filters.since)
      );
    }

    if (filters.until) {
      results = results.filter(
        (e) => e.timestamp <= new Date(filters.until)
      );
    }

    if (filters.priority) {
      results = results.filter(
        (e) => e.priority === filters.priority
      );
    }

    return results.slice(
      -(filters.limit || 100)
    );
  }

  /**
   * Get event statistics
   */
  getEventStatistics() {
    const uptime_seconds =
      (new Date() - this.created_at) / 1000;

    return {
      uptime_seconds,
      total_events_published: Object.values(
        this.event_counts
      ).reduce((a, b) => a + b, 0),
      event_count_by_topic: { ...this.event_counts },
      total_subscriptions: Array.from(
        this.subscriptions.values()
      ).reduce((sum, subs) => sum + subs.length, 0),
      subscriptions_by_topic: Array.from(
        this.subscriptions.entries()
      ).reduce((obj, [topic, subs]) => {
        obj[topic] = subs.length;
        return obj;
      }, {}),
      dead_letter_queue_size: this.dead_letter_queue.length,
      event_history_size: this.event_history.length,
    };
  }

  /**
   * Get dead letter queue entries
   */
  getDeadLetterQueue(limit = 50) {
    return this.dead_letter_queue.slice(-limit);
  }

  /**
   * Replay historical events to a new subscription
   */
  async replayEvents(topic, callback, limit = 50) {
    const events = topic
      ? this.getEventHistory(topic, limit)
      : this.event_history.slice(-limit);

    const replayed = [];

    for (const event of events) {
      try {
        await callback(event);
        replayed.push(event);
      } catch (e) {
        console.error(
          `Error replaying event ${event.event_id}:`,
          e
        );
      }
    }

    return replayed;
  }

  /**
   * Start event bus
   */
  start() {
    this.is_running = true;
    this.created_at = new Date();
    console.log(`${this.name} started`);
    this.emit("started", { timestamp: new Date() });
    return true;
  }

  /**
   * Stop event bus
   */
  stop() {
    this.is_running = false;
    console.log(`${this.name} stopped`);
    this.emit("stopped", { timestamp: new Date() });
    return true;
  }

  /**
   * Get last event
   */
  getLastEvent() {
    return this.last_event;
  }

  /**
   * Clear event history
   */
  clearHistory() {
    const previous_count = this.event_history.length;
    this.event_history = [];
    return { cleared: previous_count };
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue() {
    const previous_count = this.dead_letter_queue.length;
    this.dead_letter_queue = [];
    return { cleared: previous_count };
  }

  /**
   * Get subscription info for topic
   */
  getSubscriptions(topic) {
    const subs = this.subscriptions.get(topic) || [];
    return subs.map((sub) => ({
      priority: sub.priority,
      once_only: sub.once_only,
      call_count: sub.call_count,
      created_at: sub.created_at,
    }));
  }
}

module.exports = SwarmEventBus;
