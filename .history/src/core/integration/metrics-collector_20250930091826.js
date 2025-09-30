/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Metrics Collector - System-wide metrics collection and analysis service
 */

const eventBus = require("./event-bus");

class MetricsCollector {
  constructor(options = {}) {
    if (MetricsCollector.instance) {
      return MetricsCollector.instance;
    }
    MetricsCollector.instance = this;

    this.options = {
      collectionInterval: 5000, // 5 seconds
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      samplingRate: 1.0, // 100% sampling
      historyLimit: 1000, // per metric
      ...options,
    };

    this._metrics = new Map();
    this._history = new Map();
    this._subscribers = new Map();
    this._alarms = new Map();

    this._setupSubscriptions();
    this._startCollection();
  }

  /**
   * Register metric
   * @param {string} name - Metric name
   * @param {Object} options - Metric options
   */
  registerMetric(name, options = {}) {
    this._metrics.set(name, {
      type: options.type || "gauge",
      unit: options.unit || "",
      description: options.description || "",
      tags: options.tags || [],
      aggregation: options.aggregation || "avg",
      thresholds: options.thresholds || {},
      value: 0,
      lastUpdate: Date.now(),
    });

    // Initialize history
    if (!this._history.has(name)) {
      this._history.set(name, []);
    }
  }

  /**
   * Record metric value
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} tags - Additional tags
   */
  recordMetric(name, value, tags = {}) {
    if (!this._metrics.has(name)) {
      this.registerMetric(name);
    }

    const metric = this._metrics.get(name);
    const timestamp = Date.now();

    // Update current value
    metric.value = value;
    metric.lastUpdate = timestamp;

    // Add to history
    const history = this._history.get(name);
    history.push({ timestamp, value, tags });

    // Maintain history limit
    while (history.length > this.options.historyLimit) {
      history.shift();
    }

    // Check thresholds
    this._checkThresholds(name, value, tags);

    // Publish update
    eventBus.publish("metrics.update", {
      name,
      value,
      tags,
      timestamp,
    });
  }

  /**
   * Get current metric value
   * @param {string} name - Metric name
   */
  getMetric(name) {
    return this._metrics.get(name);
  }

  /**
   * Get metric history
   * @param {string} name - Metric name
   * @param {Object} options - Query options
   */
  getMetricHistory(name, options = {}) {
    const history = this._history.get(name) || [];
    const now = Date.now();

    return history.filter((entry) => {
      // Apply time range filter
      if (options.timeRange) {
        if (now - entry.timestamp > options.timeRange) {
          return false;
        }
      }

      // Apply tag filters
      if (options.tags) {
        for (const [key, value] of Object.entries(options.tags)) {
          if (entry.tags[key] !== value) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Set metric alarm
   * @param {string} name - Metric name
   * @param {Object} conditions - Alarm conditions
   */
  setAlarm(name, conditions) {
    this._alarms.set(name, {
      conditions,
      status: "ok",
      lastTriggered: null,
      incidents: [],
    });
  }

  /**
   * Get all active alarms
   */
  getActiveAlarms() {
    const activeAlarms = [];
    this._alarms.forEach((alarm, name) => {
      if (alarm.status !== "ok") {
        activeAlarms.push({
          name,
          ...alarm,
        });
      }
    });
    return activeAlarms;
  }

  /**
   * Subscribe to metric updates
   * @param {string} name - Metric name
   * @param {Function} callback - Update callback
   */
  subscribe(name, callback) {
    const subId = `sub_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    if (!this._subscribers.has(name)) {
      this._subscribers.set(name, new Map());
    }

    this._subscribers.get(name).set(subId, callback);
    return subId;
  }

  /**
   * Unsubscribe from metric updates
   * @param {string} name - Metric name
   * @param {string} subId - Subscription ID
   */
  unsubscribe(name, subId) {
    const subscribers = this._subscribers.get(name);
    if (subscribers) {
      subscribers.delete(subId);
    }
  }

  /**
   * Get system-wide metrics summary
   */
  getMetricsSummary() {
    const summary = {
      totalMetrics: this._metrics.size,
      activeAlarms: this.getActiveAlarms().length,
      lastUpdate: Date.now(),
      categories: {},
    };

    // Group metrics by category
    this._metrics.forEach((metric, name) => {
      const category = name.split(".")[0];
      if (!summary.categories[category]) {
        summary.categories[category] = {
          count: 0,
          metrics: {},
        };
      }

      summary.categories[category].count++;
      summary.categories[category].metrics[name] = {
        value: metric.value,
        unit: metric.unit,
        lastUpdate: metric.lastUpdate,
      };
    });

    return summary;
  }

  /**
   * Set up event subscriptions
   * @private
   */
  _setupSubscriptions() {
    // Subscribe to component metrics
    eventBus.subscribe("api.metrics", (data) => {
      this._handleApiMetrics(data);
    });

    eventBus.subscribe("websocket.metrics", (data) => {
      this._handleWebSocketMetrics(data);
    });

    eventBus.subscribe("system.metrics", (data) => {
      this._handleSystemMetrics(data);
    });
  }

  /**
   * Start metrics collection
   * @private
   */
  _startCollection() {
    setInterval(() => {
      this._collectSystemMetrics();
    }, this.options.collectionInterval);
  }

  /**
   * Collect system metrics
   * @private
   */
  _collectSystemMetrics() {
    // Collect CPU metrics
    this.recordMetric("system.cpu.usage", process.cpuUsage().user);
    this.recordMetric("system.cpu.system", process.cpuUsage().system);

    // Collect memory metrics
    const memory = process.memoryUsage();
    this.recordMetric("system.memory.heapUsed", memory.heapUsed);
    this.recordMetric("system.memory.heapTotal", memory.heapTotal);
    this.recordMetric("system.memory.external", memory.external);

    // Collect process metrics
    this.recordMetric("system.process.uptime", process.uptime());
  }

  /**
   * Check metric thresholds
   * @private
   */
  _checkThresholds(name, value, tags) {
    const metric = this._metrics.get(name);
    const alarm = this._alarms.get(name);

    if (!metric || !alarm) return;

    const { conditions } = alarm;
    let triggered = false;

    // Check conditions
    if (conditions.min && value < conditions.min) {
      triggered = true;
    }
    if (conditions.max && value > conditions.max) {
      triggered = true;
    }

    if (triggered && alarm.status === "ok") {
      // Alarm triggered
      alarm.status = "alert";
      alarm.lastTriggered = Date.now();
      alarm.incidents.push({
        timestamp: Date.now(),
        value,
        tags,
      });

      // Notify system
      eventBus.publish("metrics.alarm", {
        name,
        value,
        tags,
        condition: conditions,
        timestamp: Date.now(),
      });
    } else if (!triggered && alarm.status === "alert") {
      // Alarm resolved
      alarm.status = "ok";

      // Notify system
      eventBus.publish("metrics.alarm.resolved", {
        name,
        value,
        tags,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Handle API metrics
   * @private
   */
  _handleApiMetrics(data) {
    Object.entries(data).forEach(([key, value]) => {
      this.recordMetric(`api.${key}`, value);
    });
  }

  /**
   * Handle WebSocket metrics
   * @private
   */
  _handleWebSocketMetrics(data) {
    Object.entries(data).forEach(([key, value]) => {
      this.recordMetric(`websocket.${key}`, value);
    });
  }

  /**
   * Handle system metrics
   * @private
   */
  _handleSystemMetrics(data) {
    Object.entries(data).forEach(([key, value]) => {
      this.recordMetric(`system.${key}`, value);
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear all data
    this._metrics.clear();
    this._history.clear();
    this._subscribers.clear();
    this._alarms.clear();
  }
}

module.exports = MetricsCollector;
