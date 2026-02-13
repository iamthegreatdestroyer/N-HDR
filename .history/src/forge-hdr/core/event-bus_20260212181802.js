/**
 * Event Bus
 * Central pub/sub event distribution for all FORGE-HDR modules
 */

const { EventEmitter } = require("events");

class EventBus extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      maxListeners: config.maxListeners || 100,
      eventTimeout: config.eventTimeout || 5000,
      bufferSize: config.bufferSize || 1000,
      enableLogging: config.enableLogging !== false,
      ...config,
    };

    this.setMaxListeners(this.config.maxListeners);

    this.eventLog = [];
    this.subscriptions = new Map();
    this.deadLetterQueue = [];
    this.metrics = {
      eventsPublished: 0,
      eventsProcessed: 0,
      eventsFailed: 0,
      subscribersCount: 0,
      deadLetterCount: 0,
    };

    this.isRunning = false;
  }

  /**
   * Start event bus
   */
  async start() {
    if (this.isRunning) {
      console.warn("Event bus already running");
      return;
    }

    this.isRunning = true;
    console.log("Event bus started");
    this.emit("busStarted");
  }

  /**
   * Stop event bus
   */
  async stop() {
    if (!this.isRunning) {
      console.warn("Event bus not running");
      return;
    }

    this.isRunning = false;
    this.removeAllListeners();
    this.eventLog = [];
    this.subscriptions.clear();
    console.log("Event bus stopped");
    this.emit("busStopped");
  }

  /**
   * Publish event to bus
   */
  publish(eventName, data = {}, priority = "normal") {
    if (!this.isRunning) {
      console.warn("Event bus not running, buffering event:", eventName);
      this.bufferEvent(eventName, data);
      return;
    }

    try {
      this.metrics.eventsPublished++;

      const event = {
        name: eventName,
        data,
        priority,
        timestamp: Date.now(),
        id: this.generateEventId(),
        source: this.getCurrentSource(),
      };

      // Log event
      this.logEvent(event);

      // Emit event with timeout handling
      this.emitWithTimeout(event);

      return event.id;
    } catch (error) {
      this.metrics.eventsFailed++;
      this.addToDeadLetterQueue(eventName, data, error);
      console.error("Error publishing event:", eventName, error);
      return null;
    }
  }

  /**
   * Subscribe to event
   */
  subscribe(eventName, handler, priority = "normal") {
    if (!handler || typeof handler !== "function") {
      throw new Error("Handler must be a function");
    }

    // Wrap handler with error handling
    const wrappedHandler = this.wrapHandler(handler, eventName);

    // Track subscription
    if (!this.subscriptions.has(eventName)) {
      this.subscriptions.set(eventName, []);
    }

    const subscription = {
      handler: wrappedHandler,
      priority,
      subscribedAt: Date.now(),
      id: this.generateSubscriptionId(),
    };

    this.subscriptions.get(eventName).push(subscription);

    // Register with EventEmitter
    this.on(eventName, wrappedHandler);

    this.metrics.subscribersCount++;

    return subscription.id;
  }

  /**
   * Unsubscribe from event
   */
  unsubscribe(subscriptionId) {
    let found = false;

    for (const [eventName, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex((s) => s.id === subscriptionId);
      if (index !== -1) {
        const subscription = subscriptions[index];
        this.off(eventName, subscription.handler);
        subscriptions.splice(index, 1);
        found = true;
        this.metrics.subscribersCount--;
        break;
      }
    }

    return found;
  }

  /**
   * Wrap handler with error handling and timeout
   */
  wrapHandler(handler, eventName) {
    return async (event) => {
      try {
        await Promise.race([
          handler(event),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Handler timeout")),
              this.config.eventTimeout,
            ),
          ),
        ]);

        this.metrics.eventsProcessed++;
      } catch (error) {
        this.metrics.eventsFailed++;
        console.error(`Error in handler for event ${eventName}:`, error);

        this.emit("handlerError", {
          eventName,
          error: error.message,
          handler: handler.name,
        });
      }
    };
  }

  /**
   * Emit event with timeout
   */
  emitWithTimeout(event) {
    try {
      // Sort by priority if multiple subscribers
      const subscribers = this.subscriptions.get(event.name) || [];
      const sorted = [...subscribers].sort((a, b) => {
        const priorityMap = { high: 3, normal: 2, low: 1 };
        return priorityMap[b.priority] - priorityMap[a.priority];
      });

      // Emit event
      super.emit(event.name, event);

      // Also emit to wildcard subscribers
      if (event.name !== "*") {
        super.emit("*", event);
      }
    } catch (error) {
      console.error("Error emitting event:", event.name, error);
    }
  }

  /**
   * Publish event and wait for response
   */
  async publishAndWait(
    eventName,
    data = {},
    timeout = this.config.eventTimeout,
  ) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Event response timeout for ${eventName}`));
      }, timeout);

      const handler = (event) => {
        clearTimeout(timeoutId);
        this.unsubscribe(subscriptionId);
        resolve(event.data);
      };

      const subscriptionId = this.subscribe(eventName + ":response", handler);
      this.publish(eventName, data);
    });
  }

  /**
   * Publish async event (fire and forget)
   */
  publishAsync(eventName, data = {}, priority = "normal") {
    setImmediate(() => {
      this.publish(eventName, data, priority);
    });
  }

  /**
   * Log event to buffer
   */
  logEvent(event) {
    if (!this.config.enableLogging) return;

    const logEntry = {
      ...event,
      processedAt: Date.now(),
    };

    this.eventLog.push(logEntry);

    // Keep buffer size bounded
    if (this.eventLog.length > this.config.bufferSize) {
      this.eventLog.shift();
    }
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit = 50, filter = {}) {
    let events = this.eventLog;

    if (filter.name) {
      events = events.filter((e) => e.name === filter.name);
    }

    if (filter.minPriority) {
      const priorityMap = { high: 3, normal: 2, low: 1 };
      const minLevel = priorityMap[filter.minPriority] || 0;
      events = events.filter((e) => (priorityMap[e.priority] || 0) >= minLevel);
    }

    if (filter.timeRange) {
      const start = Date.now() - filter.timeRange;
      events = events.filter((e) => e.timestamp > start);
    }

    return events.slice(-limit);
  }

  /**
   * Get event statistics
   */
  getEventStatistics(eventName = null) {
    let relevantEvents = this.eventLog;

    if (eventName) {
      relevantEvents = relevantEvents.filter((e) => e.name === eventName);
    }

    const byName = {};
    for (const event of relevantEvents) {
      if (!byName[event.name]) {
        byName[event.name] = { count: 0, lastOccurrence: 0 };
      }
      byName[event.name].count++;
      byName[event.name].lastOccurrence = event.timestamp;
    }

    return {
      totalEvents: relevantEvents.length,
      uniqueEventTypes: Object.keys(byName).length,
      byEventName: byName,
      metrics: this.metrics,
    };
  }

  /**
   * Add to dead letter queue
   */
  addToDeadLetterQueue(eventName, data, error) {
    const dlqEntry = {
      eventName,
      data,
      error: error.message,
      timestamp: Date.now(),
      id: this.generateEventId(),
    };

    this.deadLetterQueue.push(dlqEntry);
    this.metrics.deadLetterCount++;

    // Keep DLQ bounded
    if (this.deadLetterQueue.length > 100) {
      this.deadLetterQueue.shift();
    }

    this.emit("deadLetterEvent", dlqEntry);
  }

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(limit = 50) {
    return this.deadLetterQueue.slice(-limit);
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue() {
    const count = this.deadLetterQueue.length;
    this.deadLetterQueue = [];
    this.metrics.deadLetterCount = 0;

    return count;
  }

  /**
   * Retry dead letter queue events
   */
  async retryDeadLetterQueue() {
    const dlqCopy = [...this.deadLetterQueue];
    this.clearDeadLetterQueue();

    let successful = 0;
    let failed = 0;

    for (const entry of dlqCopy) {
      try {
        this.publish(entry.eventName, entry.data);
        successful++;
      } catch (error) {
        this.addToDeadLetterQueue(entry.eventName, entry.data, error);
        failed++;
      }
    }

    this.emit("deadLetterRetry", { successful, failed });

    return { successful, failed };
  }

  /**
   * Buffer event when bus not running
   */
  bufferEvent(eventName, data) {
    if (!this.eventBuffer) {
      this.eventBuffer = [];
    }

    this.eventBuffer.push({
      eventName,
      data,
      bufferedAt: Date.now(),
    });

    // Keep buffer bounded
    if (this.eventBuffer.length > 100) {
      this.eventBuffer.shift();
    }
  }

  /**
   * Flush buffered events
   */
  flushBuffer() {
    if (!this.eventBuffer || this.eventBuffer.length === 0) return 0;

    const count = this.eventBuffer.length;

    for (const buffered of this.eventBuffer) {
      this.publish(buffered.eventName, buffered.data);
    }

    this.eventBuffer = [];

    return count;
  }

  /**
   * Get subscription info
   */
  getSubscriptions(eventName = null) {
    if (eventName) {
      return this.subscriptions.get(eventName) || [];
    }

    const allSubscriptions = {};
    for (const [name, subs] of this.subscriptions.entries()) {
      allSubscriptions[name] = subs.map((s) => ({
        id: s.id,
        priority: s.priority,
        subscribedAt: new Date(s.subscribedAt).toISOString(),
      }));
    }

    return allSubscriptions;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      isRunning: this.isRunning,
      configuration: {
        maxListeners: this.config.maxListeners,
        eventTimeout: this.config.eventTimeout,
        bufferSize: this.config.bufferSize,
        enableLogging: this.config.enableLogging,
      },
      metrics: this.metrics,
      eventLogSize: this.eventLog.length,
      deadLetterQueueSize: this.deadLetterQueue.length,
      subscriptionsCount: this.subscriptions.size,
      eventTypes: Array.from(this.subscriptions.keys()),
      recentEvents: this.getRecentEvents(5),
    };
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate subscription ID
   */
  generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current source (for logging which module published)
   */
  getCurrentSource() {
    const stack = new Error().stack;
    const lines = stack.split("\n");
    const callerLine = lines[3] || "";
    const match = callerLine.match(/at\s+(\S+)/);
    return match ? match[1] : "unknown";
  }
}

module.exports = { EventBus };
