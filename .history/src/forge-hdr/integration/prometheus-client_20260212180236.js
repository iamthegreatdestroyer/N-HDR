/**
 * Prometheus Client
 * Manages metrics collection, definition, and reporting for FORGE-HDR
 */

const promClient = require('prom-client')

class PrometheusClient {
  constructor(config = {}) {
    this.config = {
      port: config.port || 9090,
      endpoint: config.endpoint || 'http://prometheus:9090',
      metricsInterval: config.metricsInterval || 30000,
      ...config
    }

    this.metrics = {}
    this.initialized = false
    this.lastMetrics = null
    this.metricsHistory = []
    this.maxHistory = 1440  // 24 hours at 1-minute resolution
  }

  /**
   * Initialize Prometheus metrics
   */
  initializeMetrics() {
    // Counter: Total optimizations executed
    this.metrics.optimizationCount = new promClient.Counter({
      name: 'forge_optimization_count',
      help: 'Total number of optimizations executed by FORGE-HDR',
      labelNames: ['type', 'status']
    })

    // Gauge: Cost savings in dollars
    this.metrics.costSaved = new promClient.Gauge({
      name: 'forge_cost_saved_dollars',
      help: 'Cumulative cost savings from FORGE-HDR optimizations',
      labelNames: ['optimization_type']
    })

    // Gauge: Topology stability (0-100)
    this.metrics.topologyStability = new promClient.Gauge({
      name: 'forge_topology_stability',
      help: 'Current topology stability score (0-100)',
      labelNames: []
    })

    // Counter: Decision rollbacks
    this.metrics.decisionRollbacks = new promClient.Counter({
      name: 'forge_decision_rollbacks',
      help: 'Number of optimization decisions rolled back due to failure',
      labelNames: ['type', 'reason']
    })

    // Counter: Cascade prevention events
    this.metrics.cascadePreventions = new promClient.Counter({
      name: 'forge_cascade_prevention_count',
      help: 'Number of cascading failures prevented by FORGE-HDR',
      labelNames: ['type', 'severity']
    })

    // Histogram: Optimization latency
    this.metrics.optimizationLatency = new promClient.Histogram({
      name: 'forge_optimization_latency_ms',
      help: 'Latency of optimization execution in milliseconds',
      labelNames: ['type'],
      buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
    })

    // Histogram: Analysis latency
    this.metrics.analysisLatency = new promClient.Histogram({
      name: 'forge_analysis_latency_ms',
      help: 'Latency of workload DNA analysis in milliseconds',
      labelNames: ['stage'],
      buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
    })

    // Gauge: Active decision count
    this.metrics.activeDecisions = new promClient.Gauge({
      name: 'forge_active_decisions',
      help: 'Number of currently active optimization decisions'
    })

    // Gauge: Queue depth
    this.metrics.analysisQueueDepth = new promClient.Gauge({
      name: 'forge_analysis_queue_depth',
      help: 'Number of pending analyses in queue'
    })

    this.initialized = true
  }

  /**
   * Fetch current metrics from Prometheus
   */
  async fetchMetrics() {
    try {
      const response = await fetch(`${this.config.endpoint}/api/v1/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          query: this.buildPrometheusQuery()
        })
      })

      if (!response.ok) {
        throw new Error(`Prometheus returned ${response.status}`)
      }

      const data = await response.json()
      const metrics = this.parseMetricsResponse(data)

      // Store in history
      this.lastMetrics = metrics
      this.metricsHistory.push({
        timestamp: new Date(),
        metrics: metrics
      })

      // Keep history size reasonable
      if (this.metricsHistory.length > this.maxHistory) {
        this.metricsHistory = this.metricsHistory.slice(-this.maxHistory)
      }

      return metrics
    } catch (error) {
      console.error('Error fetching Prometheus metrics:', error)
      return this.getDefaultMetrics()
    }
  }

  /**
   * Build comprehensive Prometheus query for all relevant metrics
   */
  buildPrometheusQuery() {
    return `{
      container_cpu_usage_seconds_total,
      container_memory_usage_bytes,
      rate(http_requests_total[5m]),
      rate(http_request_duration_seconds_bucket[5m]),
      kube_pod_container_status_restarts_total,
      kubelet_volume_stats_used_bytes,
      up
    }`
  }

  /**
   * Parse Prometheus response into structured metrics
   */
  parseMetricsResponse(data) {
    const metrics = {
      timestamp: new Date(),
      cpu: {},
      memory: {},
      network: {},
      errors: {},
      latency: {}
    }

    if (!data || !data.data || !data.data.result) {
      return metrics
    }

    // Parse each metric result
    data.data.result.forEach(result => {
      const metric = result.metric
      const value = parseFloat(result.value[1])

      // CPU metrics
      if (metric.__name__ === 'container_cpu_usage_seconds_total') {
        metrics.cpu[metric.pod] = (metrics.cpu[metric.pod] || 0) + value
      }

      // Memory metrics
      if (metric.__name__ === 'container_memory_usage_bytes') {
        metrics.memory[metric.pod] = value
      }

      // Network metrics
      if (metric.__name__ === 'rate(requests_total)') {
        metrics.network.requestRate = (metrics.network.requestRate || 0) + value
      }

      // Error metrics
      if (metric.__name__ === 'rate(errors_total)') {
        metrics.errors.rate = (metrics.errors.rate || 0) + value
      }

      // Latency metrics
      if (metric.__name__ === 'rate(request_duration_seconds)') {
        metrics.latency.p99 = value
      }
    })

    // Calculate aggregates
    metrics.cpu.total = Object.values(metrics.cpu).reduce((a, b) => a + b, 0)
    metrics.cpu.average = metrics.cpu.total / Object.keys(metrics.cpu).length
    metrics.memory.total = Object.values(metrics.memory).reduce((a, b) => a + b, 0)
    metrics.memory.average = metrics.memory.total / Object.keys(metrics.memory).length

    return metrics
  }

  /**
   * Query historical metrics from local history
   */
  queryHistory(startTime, endTime, field) {
    return this.metricsHistory.filter(entry => {
      return entry.timestamp >= startTime && entry.timestamp <= endTime
    }).map(entry => {
      return {
        timestamp: entry.timestamp,
        value: this.getFieldValue(entry.metrics, field)
      }
    })
  }

  /**
   * Helper to get nested field value
   */
  getFieldValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj)
  }

  /**
   * Record optimization execution
   */
  recordOptimization(type, status, latencyMs) {
    this.metrics.optimizationCount.labels(type, status).inc()
    this.metrics.optimizationLatency.labels(type).observe(latencyMs)
  }

  /**
   * Record cost savings
   */
  recordCostSaving(type, amount) {
    this.metrics.costSaved.labels(type).set(
      (this.metrics.costSaved.labels(type).get()?.values[0]?.value || 0) + amount
    )
  }

  /**
   * Update topology stability metric
   */
  updateTopologyStability(score) {
    this.metrics.topologyStability.set(score)
  }

  /**
   * Record optimization rollback
   */
  recordRollback(type, reason) {
    this.metrics.decisionRollbacks.labels(type, reason).inc()
  }

  /**
   * Record cascade prevention
   */
  recordCascadePrevention(type, severity) {
    this.metrics.cascadePreventions.labels(type, severity).inc()
  }

  /**
   * Record analysis latency
   */
  recordAnalysisLatency(stage, latencyMs) {
    this.metrics.analysisLatency.labels(stage).observe(latencyMs)
  }

  /**
   * Update active decisions count
   */
  updateActiveDecisions(count) {
    this.metrics.activeDecisions.set(count)
  }

  /**
   * Update queue depth
   */
  updateQueueDepth(depth) {
    this.metrics.analysisQueueDepth.set(depth)
  }

  /**
   * Get current metrics summary
   */
  getCurrentMetrics() {
    if (!this.lastMetrics) {
      return this.getDefaultMetrics()
    }

    return {
      timestamp: this.lastMetrics.timestamp,
      cpu: this.lastMetrics.cpu,
      memory: this.lastMetrics.memory,
      network: this.lastMetrics.network,
      errors: this.lastMetrics.errors,
      latency: this.lastMetrics.latency,
      stability: this.metrics.topologyStability.get(),
      optimizationCount: this.metrics.optimizationCount.get(),
      totalSavings: this.metrics.costSaved.get()
    }
  }

  /**
   * Get default metrics when Prometheus is unavailable
   */
  getDefaultMetrics() {
    return {
      timestamp: new Date(),
      cpu: { total: 0, average: 0 },
      memory: { total: 0, average: 0 },
      network: { requestRate: 0 },
      errors: { rate: 0 },
      latency: { p99: 0 },
      stability: 80,
      optimizationCount: 0,
      totalSavings: 0
    }
  }

  /**
   * Export all metrics in Prometheus format
   */
  async exportMetrics() {
    return promClient.register.metrics()
  }

  /**
   * Reset metrics (for testing)
   */
  reset() {
    promClient.register.resetMetrics()
    this.metricsHistory = []
    this.lastMetrics = null
  }

  /**
   * Get metrics summary over time range
   */
  getMetricsSummary(minutes = 60) {
    const cutoff = new Date(Date.now() - minutes * 60000)
    const recentHistory = this.metricsHistory.filter(entry => entry.timestamp >= cutoff)

    if (recentHistory.length === 0) {
      return this.getDefaultMetrics()
    }

    return {
      period: `${minutes}m`,
      count: recentHistory.length,
      cpuAverage: this.calculateAverage(recentHistory, 'metrics.cpu.average'),
      cpuMax: this.calculateMax(recentHistory, 'metrics.cpu.total'),
      memoryAverage: this.calculateAverage(recentHistory, 'metrics.memory.average'),
      memoryMax: this.calculateMax(recentHistory, 'metrics.memory.total'),
      networkAverage: this.calculateAverage(recentHistory, 'metrics.network.requestRate'),
      errorRate: this.calculateAverage(recentHistory, 'metrics.errors.rate'),
      latencyP99: this.calculateAverage(recentHistory, 'metrics.latency.p99')
    }
  }

  /**
   * Helper: Calculate average of field across history
   */
  calculateAverage(history, path) {
    const values = history.map(entry => this.getFieldValue(entry, path)).filter(v => v > 0)
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }

  /**
   * Helper: Calculate max of field across history
   */
  calculateMax(history, path) {
    const values = history.map(entry => this.getFieldValue(entry, path)).filter(v => v > 0)
    return values.length > 0 ? Math.max(...values) : 0
  }
}

module.exports = { PrometheusClient }
