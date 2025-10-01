/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * EventBridge.js
 * Manages event communication between different HDR system components
 */

const { EventEmitter } = require("events");

class EventBridge extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxListeners: config.maxListeners || 100,
      bufferSize: config.bufferSize || 1000,
      eventTTL: config.eventTTL || 60000, // 1 minute
      ...config,
    };

    this.state = {
      initialized: false,
      error: null,
      timestamp: Date.now(),
    };

    this.eventBuffer = new Map();
    this.subscribers = new Map();
    this.routes = new Map();

    this.setMaxListeners(this.config.maxListeners);
  }

  /**
   * Initialize event bridge
   * @param {Object} parameters - Initialization parameters
   * @returns {Promise<Object>} Initialization status
   */
  async initialize(parameters = {}) {
    try {
      await this._setupRoutes(parameters);
      await this._initializeBuffer();

      this.state.initialized = true;
      this.emit("initialized", { timestamp: Date.now() });

      return {
        status: "initialized",
        routes: this.routes.size,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Bridge initialization failed: ${error.message}`);
    }
  }

  /**
   * Subscribe to events
   * @param {string} channel - Event channel
   * @param {function} handler - Event handler
   * @returns {string} Subscription ID
   */
  subscribe(channel, handler) {
    if (typeof handler !== "function") {
      throw new Error("Invalid handler: must be a function");
    }

    const subscriptionId = this._generateSubscriptionId();

    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Map());
    }

    this.subscribers.get(channel).set(subscriptionId, handler);
    this.emit("subscribed", { channel, subscriptionId, timestamp: Date.now() });

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   * @param {string} channel - Event channel
   * @param {string} subscriptionId - Subscription ID
   */
  unsubscribe(channel, subscriptionId) {
    const channelSubscribers = this.subscribers.get(channel);
    if (channelSubscribers && channelSubscribers.has(subscriptionId)) {
      channelSubscribers.delete(subscriptionId);
      this.emit("unsubscribed", {
        channel,
        subscriptionId,
        timestamp: Date.now(),
      });
    }

    if (channelSubscribers && channelSubscribers.size === 0) {
      this.subscribers.delete(channel);
    }
  }

  /**
   * Publish event
   * @param {string} channel - Event channel
   * @param {*} data - Event data
   * @returns {Promise<Object>} Publication status
   */
  async publish(channel, data) {
    if (!this.state.initialized) {
      throw new Error("Event bridge not initialized");
    }

    const event = {
      id: this._generateEventId(),
      channel,
      data,
      timestamp: Date.now(),
    };

    try {
      await this._bufferEvent(event);
      await this._routeEvent(event);

      const channelSubscribers = this.subscribers.get(channel);
      if (channelSubscribers) {
        for (const handler of channelSubscribers.values()) {
          try {
            await handler(event);
          } catch (error) {
            this.emit("handlerError", {
              error: error.message,
              event,
              timestamp: Date.now(),
            });
          }
        }
      }

      return {
        status: "published",
        eventId: event.id,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Event publication failed: ${error.message}`);
    }
  }

  /**
   * Add event route
   * @param {string} source - Source channel
   * @param {string} target - Target channel
   * @param {function} transformer - Optional event transformer
   * @returns {string} Route ID
   */
  addRoute(source, target, transformer = null) {
    if (transformer && typeof transformer !== "function") {
      throw new Error("Invalid transformer: must be a function");
    }

    const routeId = this._generateRouteId();
    this.routes.set(routeId, { source, target, transformer });

    this.emit("routeAdded", {
      routeId,
      source,
      target,
      timestamp: Date.now(),
    });

    return routeId;
  }

  /**
   * Remove event route
   * @param {string} routeId - Route ID
   */
  removeRoute(routeId) {
    if (this.routes.has(routeId)) {
      this.routes.delete(routeId);
      this.emit("routeRemoved", { routeId, timestamp: Date.now() });
    }
  }

  /**
   * Setup routes
   * @private
   * @param {Object} parameters - Setup parameters
   */
  async _setupRoutes(parameters) {
    if (parameters.routes) {
      for (const route of parameters.routes) {
        this.addRoute(route.source, route.target, route.transformer);
      }
    }
  }

  /**
   * Initialize event buffer
   * @private
   */
  async _initializeBuffer() {
    setInterval(() => {
      const now = Date.now();
      for (const [eventId, event] of this.eventBuffer) {
        if (now - event.timestamp > this.config.eventTTL) {
          this.eventBuffer.delete(eventId);
        }
      }
    }, this.config.eventTTL);
  }

  /**
   * Buffer event
   * @private
   * @param {Object} event - Event to buffer
   */
  async _bufferEvent(event) {
    if (this.eventBuffer.size >= this.config.bufferSize) {
      const oldest = [...this.eventBuffer.entries()].sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      )[0][0];
      this.eventBuffer.delete(oldest);
    }

    this.eventBuffer.set(event.id, event);
  }

  /**
   * Route event
   * @private
   * @param {Object} event - Event to route
   */
  async _routeEvent(event) {
    for (const route of this.routes.values()) {
      if (route.source === event.channel) {
        let routedData = event.data;

        if (route.transformer) {
          try {
            routedData = await route.transformer(event.data);
          } catch (error) {
            this.emit("transformError", {
              error: error.message,
              event,
              timestamp: Date.now(),
            });
            continue;
          }
        }

        await this.publish(route.target, routedData);
      }
    }
  }

  /**
   * Generate subscription ID
   * @private
   * @returns {string} Generated ID
   */
  _generateSubscriptionId() {
    return `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  /**
   * Generate event ID
   * @private
   * @returns {string} Generated ID
   */
  _generateEventId() {
    return `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  /**
   * Generate route ID
   * @private
   * @returns {string} Generated ID
   */
  _generateRouteId() {
    return `route-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  /**
   * Get bridge status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      subscribers: [...this.subscribers.values()].reduce(
        (total, channel) => total + channel.size,
        0
      ),
      routes: this.routes.size,
      bufferedEvents: this.eventBuffer.size,
      error: this.state.error,
      timestamp: Date.now(),
    };
  }

  /**
   * Get event from buffer
   * @param {string} eventId - Event ID
   * @returns {Object|null} Event data
   */
  getEvent(eventId) {
    return this.eventBuffer.get(eventId) || null;
  }

  /**
   * Clear event buffer
   */
  clearBuffer() {
    this.eventBuffer.clear();
    this.emit("bufferCleared", { timestamp: Date.now() });
  }

  /**
   * Cleanup bridge
   */
  async cleanup() {
    this.subscribers.clear();
    this.routes.clear();
    this.clearBuffer();

    this.state.initialized = false;
    this.emit("cleaned", { timestamp: Date.now() });
  }
}

module.exports = EventBridge;
