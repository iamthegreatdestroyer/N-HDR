/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Event bus system for internal system communication
 */

const EventEmitter = require("events");

class EventBus {
  constructor(options = {}) {
    this.options = {
      maxListeners: 100,
      enableDebug: false,
      bufferSize: 1000,
      ...options,
    };

    this._emitter = new EventEmitter();
    this._emitter.setMaxListeners(this.options.maxListeners);

    this._eventBuffer = new Map();
    this._subscribers = new Map();
    this._middlewares = new Map();
    this._debug = this.options.enableDebug ? console.debug : () => {};
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {Object} options - Subscription options
   * @returns {Function} Unsubscribe function
   */
  subscribe(event, handler, options = {}) {
    const subscription = {
      handler,
      options: {
        buffer: false,
        replay: false,
        priority: 0,
        ...options,
      },
    };

    if (!this._subscribers.has(event)) {
      this._subscribers.set(event, new Set());
    }

    this._subscribers.get(event).add(subscription);
    this._emitter.on(event, subscription.handler);

    // Replay buffered events if requested
    if (subscription.options.replay && this._eventBuffer.has(event)) {
      const buffered = this._eventBuffer.get(event);
      buffered.forEach((data) => handler(data));
    }

    this._debug(`Subscribed to event: ${event}`);

    // Return unsubscribe function
    return () => {
      this._subscribers.get(event).delete(subscription);
      this._emitter.removeListener(event, handler);
      this._debug(`Unsubscribed from event: ${event}`);
    };
  }

  /**
   * Publish an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @returns {Promise<void>}
   */
  async publish(event, data) {
    try {
      // Apply middlewares
      const middlewares = this._middlewares.get(event) || [];
      let processedData = data;

      for (const middleware of middlewares) {
        processedData = await middleware(processedData);
      }

      // Buffer event if needed
      const subscribers = this._subscribers.get(event) || new Set();
      const shouldBuffer = Array.from(subscribers).some(
        (sub) => sub.options.buffer
      );

      if (shouldBuffer) {
        this._bufferEvent(event, processedData);
      }

      // Sort subscribers by priority
      const sortedSubscribers = Array.from(subscribers).sort(
        (a, b) => b.options.priority - a.options.priority
      );

      // Emit to subscribers
      this._emitter.emit(event, processedData);
      this._debug(`Published event: ${event}`, processedData);
    } catch (error) {
      this._debug(`Error publishing event: ${event}`, error);
      throw error;
    }
  }

  /**
   * Add middleware for event processing
   * @param {string} event - Event name
   * @param {Function} middleware - Middleware function
   */
  addMiddleware(event, middleware) {
    if (!this._middlewares.has(event)) {
      this._middlewares.set(event, []);
    }

    this._middlewares.get(event).push(middleware);
    this._debug(`Added middleware for event: ${event}`);
  }

  /**
   * Remove middleware
   * @param {string} event - Event name
   * @param {Function} middleware - Middleware function to remove
   */
  removeMiddleware(event, middleware) {
    if (this._middlewares.has(event)) {
      const middlewares = this._middlewares.get(event);
      const index = middlewares.indexOf(middleware);

      if (index !== -1) {
        middlewares.splice(index, 1);
        this._debug(`Removed middleware for event: ${event}`);
      }
    }
  }

  /**
   * Get event subscribers
   * @param {string} event - Event name
   * @returns {Set} Set of subscribers
   */
  getSubscribers(event) {
    return this._subscribers.get(event) || new Set();
  }

  /**
   * Clear event buffer
   * @param {string} [event] - Event name (optional)
   */
  clearBuffer(event) {
    if (event) {
      this._eventBuffer.delete(event);
      this._debug(`Cleared buffer for event: ${event}`);
    } else {
      this._eventBuffer.clear();
      this._debug("Cleared all event buffers");
    }
  }

  /**
   * Buffer an event
   * @private
   */
  _bufferEvent(event, data) {
    if (!this._eventBuffer.has(event)) {
      this._eventBuffer.set(event, []);
    }

    const buffer = this._eventBuffer.get(event);
    buffer.push(data);

    // Maintain buffer size
    if (buffer.length > this.options.bufferSize) {
      buffer.shift();
    }
  }

  /**
   * Get buffered events
   * @param {string} event - Event name
   * @returns {Array} Buffered events
   */
  getBufferedEvents(event) {
    return this._eventBuffer.get(event) || [];
  }

  /**
   * Subscribe to multiple events
   * @param {Object} subscriptions - Map of event names to handlers
   * @param {Object} options - Subscription options
   * @returns {Function} Unsubscribe function for all subscriptions
   */
  subscribeAll(subscriptions, options = {}) {
    const unsubscribeFunctions = [];

    for (const [event, handler] of Object.entries(subscriptions)) {
      const unsubscribe = this.subscribe(event, handler, options);
      unsubscribeFunctions.push(unsubscribe);
    }

    return () => unsubscribeFunctions.forEach((fn) => fn());
  }

  /**
   * Publish multiple events
   * @param {Object} events - Map of event names to data
   * @returns {Promise<void>}
   */
  async publishAll(events) {
    const publications = Object.entries(events).map(([event, data]) =>
      this.publish(event, data)
    );

    await Promise.all(publications);
  }

  /**
   * Subscribe to events matching a pattern
   * @param {RegExp} pattern - Event name pattern
   * @param {Function} handler - Event handler
   * @param {Object} options - Subscription options
   * @returns {Function} Unsubscribe function
   */
  subscribePattern(pattern, handler, options = {}) {
    const matchingEvents = Array.from(this._subscribers.keys()).filter(
      (event) => pattern.test(event)
    );

    return this.subscribeAll(
      matchingEvents.reduce((acc, event) => {
        acc[event] = handler;
        return acc;
      }, {}),
      options
    );
  }

  /**
   * Get event statistics
   * @returns {Object} Event statistics
   */
  getStatistics() {
    const stats = {
      totalEvents: 0,
      totalSubscribers: 0,
      totalMiddlewares: 0,
      eventsBuffered: 0,
      eventTypes: new Set(),
      subscribersByEvent: {},
      middlewaresByEvent: {},
    };

    // Count events and subscribers
    for (const [event, subscribers] of this._subscribers) {
      stats.eventTypes.add(event);
      stats.totalSubscribers += subscribers.size;
      stats.subscribersByEvent[event] = subscribers.size;
    }

    // Count middlewares
    for (const [event, middlewares] of this._middlewares) {
      stats.totalMiddlewares += middlewares.length;
      stats.middlewaresByEvent[event] = middlewares.length;
    }

    // Count buffered events
    for (const [event, buffer] of this._eventBuffer) {
      stats.eventsBuffered += buffer.length;
    }

    stats.totalEvents = stats.eventTypes.size;
    stats.eventTypes = Array.from(stats.eventTypes);

    return stats;
  }
}

module.exports = EventBus;
