/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Event Bus - Central event management and communication system
 */

import EventEmitter from "events";

class EventBus {
  constructor() {
    if (EventBus.instance) {
      return EventBus.instance;
    }
    EventBus.instance = this;

    this._emitter = new EventEmitter();
    this._channels = new Map();
    this._subscribers = new Map();
    this._history = new Map();
    this._metrics = {
      totalEvents: 0,
      activeChannels: 0,
      totalSubscribers: 0,
      eventsPerSecond: 0,
    };

    // Configure event emitter
    this._emitter.setMaxListeners(0); // Unlimited listeners
    this._startMetricsTracking();
  }

  /**
   * Subscribe to events on a channel
   * @param {string} channel - Event channel name
   * @param {Function} callback - Event handler callback
   * @param {Object} options - Subscription options
   * @returns {string} Subscription ID
   */
  subscribe(channel, callback, options = {}) {
    const subId = `sub_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const subscription = {
      id: subId,
      channel,
      callback,
      options: {
        retainHistory: false,
        priority: 0,
        filter: null,
        ...options,
      },
    };

    // Store subscription
    this._subscribers.set(subId, subscription);

    // Add to channel tracking
    if (!this._channels.has(channel)) {
      this._channels.set(channel, new Set());
    }
    this._channels.get(channel).add(subId);

    // Setup event listener
    this._emitter.on(channel, (data) => {
      if (this._shouldProcessEvent(subscription, data)) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${channel}:`, error);
        }
      }
    });

    // Update metrics
    this._metrics.totalSubscribers++;
    this._metrics.activeChannels = this._channels.size;

    return subId;
  }

  /**
   * Unsubscribe from events
   * @param {string} subscriptionId - Subscription ID to remove
   */
  unsubscribe(subscriptionId) {
    const subscription = this._subscribers.get(subscriptionId);
    if (subscription) {
      // Remove from channel tracking
      const channel = this._channels.get(subscription.channel);
      if (channel) {
        channel.delete(subscriptionId);
        if (channel.size === 0) {
          this._channels.delete(subscription.channel);
        }
      }

      // Remove subscription
      this._subscribers.delete(subscriptionId);

      // Remove event listener
      this._emitter.removeListener(subscription.channel, subscription.callback);

      // Update metrics
      this._metrics.totalSubscribers--;
      this._metrics.activeChannels = this._channels.size;
    }
  }

  /**
   * Publish event to channel
   * @param {string} channel - Event channel name
   * @param {*} data - Event data
   * @param {Object} options - Publication options
   */
  publish(channel, data, options = {}) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channel,
      data,
      timestamp: Date.now(),
      options: {
        persistent: false,
        priority: 0,
        ...options,
      },
    };

    // Store in history if needed
    if (options.persistent) {
      this._addToHistory(channel, event);
    }

    // Emit event
    this._emitter.emit(channel, event);

    // Update metrics
    this._metrics.totalEvents++;
  }

  /**
   * Get event history for channel
   * @param {string} channel - Event channel name
   * @returns {Array} Channel event history
   */
  getHistory(channel) {
    return this._history.get(channel) || [];
  }

  /**
   * Clear event history for channel
   * @param {string} channel - Event channel name
   */
  clearHistory(channel) {
    this._history.delete(channel);
  }

  /**
   * Get event bus metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return { ...this._metrics };
  }

  /**
   * Check if event should be processed
   * @private
   */
  _shouldProcessEvent(subscription, event) {
    // Check priority
    if (
      subscription.options.priority > 0 &&
      event.options.priority < subscription.options.priority
    ) {
      return false;
    }

    // Apply filter if exists
    if (
      subscription.options.filter &&
      !subscription.options.filter(event.data)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Add event to history
   * @private
   */
  _addToHistory(channel, event) {
    if (!this._history.has(channel)) {
      this._history.set(channel, []);
    }

    const history = this._history.get(channel);
    history.push(event);

    // Limit history size
    while (history.length > 1000) {
      history.shift();
    }
  }

  /**
   * Start metrics tracking
   * @private
   */
  _startMetricsTracking() {
    let lastCount = 0;
    let lastCheck = Date.now();

    setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastCheck;
      const eventsDelta = this._metrics.totalEvents - lastCount;

      this._metrics.eventsPerSecond = (eventsDelta / elapsed) * 1000;

      lastCount = this._metrics.totalEvents;
      lastCheck = now;
    }, 1000);
  }

  /**
   * Reset event bus
   */
  reset() {
    this._channels.clear();
    this._subscribers.clear();
    this._history.clear();
    this._metrics = {
      totalEvents: 0,
      activeChannels: 0,
      totalSubscribers: 0,
      eventsPerSecond: 0,
    };
    this._emitter.removeAllListeners();
  }
}

// Export singleton instance
export default new EventBus();
