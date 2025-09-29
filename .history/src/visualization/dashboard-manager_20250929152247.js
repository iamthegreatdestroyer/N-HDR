/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * 
 * DASHBOARD MANAGER
 * Centralized visualization and monitoring system for N-HDR operations
 */

const EventEmitter = require('events');
const crypto = require('crypto');

/**
 * @class DashboardManager
 * @extends EventEmitter
 * @description Manages visualization and real-time monitoring of the N-HDR system
 */
class DashboardManager extends EventEmitter {
  /**
   * Create new DashboardManager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super();
    this.id = crypto.randomBytes(16).toString('hex');
    this.options = {
      updateInterval: options.updateInterval || 1000,
      maxHistory: options.maxHistory || 1000,
      metricsBuffer: options.metricsBuffer || 100,
      ...options
    };

    this.views = new Map();
    this.metrics = new Map();
    this.history = new Map();
    this.subscriptions = new Map();
    this.status = 'initializing';
    this.lastUpdate = Date.now();
  }

  /**
   * Initialize dashboard system
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Initialize base metric collectors
      this._initializeMetricCollectors();

      // Start update cycle
      this._startUpdateCycle();

      this.status = 'ready';
      return true;
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  /**
   * Register a visualization view
   * @param {string} viewId - View identifier
   * @param {Object} view - View instance
   * @returns {boolean} Success status
   */
  registerView(viewId, view) {
    if (this.views.has(viewId)) {
      throw new Error(`View '${viewId}' already registered`);
    }

    // Validate view interface
    if (!view.render || !view.update || !view.cleanup) {
      throw new Error('Invalid view interface');
    }

    this.views.set(viewId, view);
    return true;
  }

  /**
   * Unregister a visualization view
   * @param {string} viewId - View identifier
   * @returns {boolean} Success status
   */
  unregisterView(viewId) {
    if (!this.views.has(viewId)) {
      return false;
    }

    const view = this.views.get(viewId);
    if (view.cleanup) {
      view.cleanup();
    }

    this.views.delete(viewId);
    return true;
  }

  /**
   * Subscribe to metric updates
   * @param {string} metricId - Metric identifier
   * @param {Function} callback - Update callback
   * @returns {string} Subscription ID
   */
  subscribeToMetric(metricId, callback) {
    const subscriptionId = crypto.randomBytes(8).toString('hex');
    
    if (!this.subscriptions.has(metricId)) {
      this.subscriptions.set(metricId, new Map());
    }

    this.subscriptions.get(metricId).set(subscriptionId, callback);
    return subscriptionId;
  }

  /**
   * Unsubscribe from metric updates
   * @param {string} metricId - Metric identifier
   * @param {string} subscriptionId - Subscription identifier
   * @returns {boolean} Success status
   */
  unsubscribeFromMetric(metricId, subscriptionId) {
    if (!this.subscriptions.has(metricId)) {
      return false;
    }

    return this.subscriptions.get(metricId).delete(subscriptionId);
  }

  /**
   * Update dashboard metrics
   * @param {string} metricId - Metric identifier
   * @param {Object} value - Metric value
   */
  updateMetric(metricId, value) {
    this.metrics.set(metricId, {
      value,
      timestamp: Date.now()
    });

    // Update history
    if (!this.history.has(metricId)) {
      this.history.set(metricId, []);
    }

    const history = this.history.get(metricId);
    history.push({
      value,
      timestamp: Date.now()
    });

    // Maintain history limit
    if (history.length > this.options.maxHistory) {
      history.shift();
    }

    // Notify subscribers
    this._notifySubscribers(metricId, value);
  }

  /**
   * Get current metric value
   * @param {string} metricId - Metric identifier
   * @returns {Object|null} Current metric value
   */
  getMetric(metricId) {
    return this.metrics.has(metricId) ? this.metrics.get(metricId) : null;
  }

  /**
   * Get metric history
   * @param {string} metricId - Metric identifier
   * @param {number} [limit] - History limit
   * @returns {Array} Metric history
   */
  getMetricHistory(metricId, limit = null) {
    if (!this.history.has(metricId)) {
      return [];
    }

    const history = this.history.get(metricId);
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get dashboard status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      id: this.id,
      status: this.status,
      views: Array.from(this.views.keys()),
      metrics: Array.from(this.metrics.keys()),
      subscriptions: Array.from(this.subscriptions.keys()),
      lastUpdate: this.lastUpdate
    };
  }

  /**
   * Clean up dashboard resources
   */
  cleanup() {
    // Stop update cycle
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }

    // Clean up views
    for (const view of this.views.values()) {
      if (view.cleanup) {
        view.cleanup();
      }
    }

    // Clear collections
    this.views.clear();
    this.metrics.clear();
    this.history.clear();
    this.subscriptions.clear();

    this.status = 'stopped';
  }

  /**
   * Initialize metric collectors
   * @private
   */
  _initializeMetricCollectors() {
    // System metrics
    this.metrics.set('system.uptime', { value: 0, timestamp: Date.now() });
    this.metrics.set('system.memory', { value: 0, timestamp: Date.now() });
    this.metrics.set('system.cpu', { value: 0, timestamp: Date.now() });

    // Performance metrics
    this.metrics.set('performance.throughput', { value: 0, timestamp: Date.now() });
    this.metrics.set('performance.latency', { value: 0, timestamp: Date.now() });
    this.metrics.set('performance.efficiency', { value: 0, timestamp: Date.now() });

    // Initialize history for each metric
    for (const metricId of this.metrics.keys()) {
      this.history.set(metricId, []);
    }
  }

  /**
   * Start metric update cycle
   * @private
   */
  _startUpdateCycle() {
    this._updateInterval = setInterval(() => {
      try {
        this._updateMetrics();
        this._updateViews();
        this.lastUpdate = Date.now();
      } catch (error) {
        console.error('Dashboard update error:', error);
      }
    }, this.options.updateInterval);
  }

  /**
   * Update system metrics
   * @private
   */
  _updateMetrics() {
    // Update system metrics
    this.updateMetric('system.uptime', process.uptime());
    this.updateMetric('system.memory', process.memoryUsage());
    this.updateMetric('system.cpu', process.cpuUsage());

    // Emit update event
    this.emit('metricsUpdated', {
      timestamp: Date.now(),
      metrics: Array.from(this.metrics.entries())
    });
  }

  /**
   * Update visualization views
   * @private
   */
  _updateViews() {
    for (const view of this.views.values()) {
      try {
        view.update(this.metrics);
      } catch (error) {
        console.error('View update error:', error);
      }
    }
  }

  /**
   * Notify metric subscribers
   * @param {string} metricId - Metric identifier
   * @param {Object} value - Metric value
   * @private
   */
  _notifySubscribers(metricId, value) {
    if (!this.subscriptions.has(metricId)) {
      return;
    }

    for (const callback of this.subscriptions.get(metricId).values()) {
      try {
        callback(value);
      } catch (error) {
        console.error('Subscriber notification error:', error);
      }
    }
  }
}

module.exports = DashboardManager;