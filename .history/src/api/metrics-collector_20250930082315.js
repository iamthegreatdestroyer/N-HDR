/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Metrics collection system for monitoring and analytics
 */

class MetricsCollector {
  constructor(options = {}) {
    this.options = {
      sampleInterval: 5000,
      bufferSize: 1000,
      enableAggregation: true,
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      ...options
    };

    this._metrics = new Map();
    this._aggregations = new Map();
    this._buffer = new Map();
    this._collectors = new Map();
    this._lastCleanup = Date.now();
  }

  /**
   * Start metrics collection
   */
  async start() {
    // Register default collectors
    this._registerDefaultCollectors();

    // Start collection interval
    this._collectionInterval = setInterval(
      () => this._collectMetrics(),
      this.options.sampleInterval
    );

    console.log('Metrics collection started');
  }

  /**
   * Stop metrics collection
   */
  async stop() {
    if (this._collectionInterval) {
      clearInterval(this._collectionInterval);
      this._collectionInterval = null;
    }

    console.log('Metrics collection stopped');
  }

  /**
   * Record a metric value
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} tags - Metric tags
   */
  record(name, value, tags = {}) {
    const timestamp = Date.now();
    const metric = {
      timestamp,
      value,
      tags
    };

    if (!this._metrics.has(name)) {
      this._metrics.set(name, []);
    }

    const metrics = this._metrics.get(name);
    metrics.push(metric);

    // Buffer management
    if (metrics.length > this.options.bufferSize) {
      metrics.shift();
    }

    // Cleanup old metrics if needed
    this._cleanupOldMetrics();

    // Update aggregations
    if (this.options.enableAggregation) {
      this._updateAggregations(name, metric);
    }
  }

  /**
   * Register a custom metric collector
   * @param {string} name - Collector name
   * @param {Function} collector - Collector function
   * @param {Object} options - Collector options
   */
  registerCollector(name, collector, options = {}) {
    this._collectors.set(name, {
      collector,
      options: {
        interval: this.options.sampleInterval,
        enabled: true,
        ...options
      }
    });

    console.log(`Registered collector: ${name}`);
  }

  /**
   * Get metric values
   * @param {string} name - Metric name
   * @param {Object} query - Query parameters
   * @returns {Array} Metric values
   */
  getMetrics(name, query = {}) {
    const metrics = this._metrics.get(name) || [];
    return this._filterMetrics(metrics, query);
  }

  /**
   * Get metric aggregations
   * @param {string} name - Metric name
   * @param {string} aggregation - Aggregation type
   * @returns {Object} Aggregated values
   */
  getAggregation(name, aggregation) {
    const metricAggs = this._aggregations.get(name);
    return metricAggs ? metricAggs[aggregation] : null;
  }

  /**
   * Register default metric collectors
   * @private
   */
  _registerDefaultCollectors() {
    // System metrics
    this.registerCollector('system.memory', async () => {
      const used = process.memoryUsage();
      this.record('system.memory.heapUsed', used.heapUsed);
      this.record('system.memory.heapTotal', used.heapTotal);
      this.record('system.memory.rss', used.rss);
    });

    // CPU metrics
    this.registerCollector('system.cpu', async () => {
      const cpuUsage = process.cpuUsage();
      this.record('system.cpu.user', cpuUsage.user);
      this.record('system.cpu.system', cpuUsage.system);
    });

    // Event bus metrics
    this.registerCollector('eventBus', async () => {
      if (global.eventBus) {
        const stats = global.eventBus.getStatistics();
        this.record('eventBus.totalEvents', stats.totalEvents);
        this.record('eventBus.totalSubscribers', stats.totalSubscribers);
      }
    });

    // API metrics
    this.registerCollector('api', async () => {
      if (global.apiServer) {
        const stats = global.apiServer.getStatistics();
        this.record('api.requestCount', stats.requestCount);
        this.record('api.errorCount', stats.errorCount);
      }
    });
  }

  /**
   * Collect metrics from registered collectors
   * @private
   */
  async _collectMetrics() {
    const timestamp = Date.now();

    for (const [name, { collector, options }] of this._collectors) {
      if (!options.enabled) continue;

      try {
        if (timestamp % options.interval === 0) {
          await collector();
        }
      } catch (error) {
        console.error(`Error collecting metrics for ${name}:`, error);
      }
    }
  }

  /**
   * Update metric aggregations
   * @private
   */
  _updateAggregations(name, metric) {
    if (!this._aggregations.has(name)) {
      this._aggregations.set(name, {
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        avg: 0,
        last: null
      });
    }

    const aggs = this._aggregations.get(name);
    const value = metric.value;

    aggs.count++;
    aggs.sum += value;
    aggs.min = Math.min(aggs.min, value);
    aggs.max = Math.max(aggs.max, value);
    aggs.avg = aggs.sum / aggs.count;
    aggs.last = value;
  }

  /**
   * Filter metrics based on query
   * @private
   */
  _filterMetrics(metrics, query) {
    let filtered = metrics;

    if (query.start) {
      filtered = filtered.filter(m => m.timestamp >= query.start);
    }

    if (query.end) {
      filtered = filtered.filter(m => m.timestamp <= query.end);
    }

    if (query.tags) {
      filtered = filtered.filter(m => {
        return Object.entries(query.tags).every(
          ([key, value]) => m.tags[key] === value
        );
      });
    }

    return filtered;
  }

  /**
   * Clean up old metrics
   * @private
   */
  _cleanupOldMetrics() {
    const now = Date.now();

    // Only cleanup periodically
    if (now - this._lastCleanup < this.options.sampleInterval * 10) {
      return;
    }

    const cutoff = now - this.options.retentionPeriod;

    for (const [name, metrics] of this._metrics) {
      const filtered = metrics.filter(m => m.timestamp >= cutoff);
      this._metrics.set(name, filtered);
    }

    this._lastCleanup = now;
  }

  /**
   * Get all metric names
   * @returns {Array} Metric names
   */
  getMetricNames() {
    return Array.from(this._metrics.keys());
  }

  /**
   * Get collector names
   * @returns {Array} Collector names
   */
  getCollectorNames() {
    return Array.from(this._collectors.keys());
  }

  /**
   * Enable/disable a collector
   * @param {string} name - Collector name
   * @param {boolean} enabled - Whether to enable the collector
   */
  setCollectorEnabled(name, enabled) {
    const collector = this._collectors.get(name);
    if (collector) {
      collector.options.enabled = enabled;
      console.log(`${enabled ? 'Enabled' : 'Disabled'} collector: ${name}`);
    }
  }

  /**
   * Get collector status
   * @returns {Object} Collector status
   */
  getCollectorStatus() {
    const status = {};
    
    for (const [name, { options }] of this._collectors) {
      status[name] = {
        enabled: options.enabled,
        interval: options.interval
      };
    }

    return status;
  }

  /**
   * Get metrics snapshot
   * @returns {Object} Current metrics snapshot
   */
  getSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      metrics: {},
      aggregations: {}
    };

    for (const [name, metrics] of this._metrics) {
      snapshot.metrics[name] = metrics[metrics.length - 1];
    }

    for (const [name, aggs] of this._aggregations) {
      snapshot.aggregations[name] = { ...aggs };
    }

    return snapshot;
  }

  /**
   * Reset metrics
   * @param {string} [name] - Metric name (optional)
   */
  reset(name) {
    if (name) {
      this._metrics.delete(name);
      this._aggregations.delete(name);
      console.log(`Reset metrics for: ${name}`);
    } else {
      this._metrics.clear();
      this._aggregations.clear();
      console.log('Reset all metrics');
    }
  }
}

module.exports = MetricsCollector;