/**
 * Metrics Exporter
 * Export system metrics to Prometheus and internal monitoring systems
 */

class MetricsExporter {
  constructor(config = {}) {
    this.config = {
      metricsPort: config.metricsPort || 9090,
      exportInterval: config.exportInterval || 15000,
      enablePrometheus: config.enablePrometheus !== false,
      enableInternal: config.enableInternal !== false,
      ...config
    }

    this.metrics = {
      // Counter metrics
      requestsTotal: 0,
      requestsSuccess: 0,
      requestsFailed: 0,
      podsCreated: 0,
      podsDeleted: 0,
      costsIncurred: 0,
      violationsDetected: 0,
      anomaliesDetected: 0,
      healingOperations: 0,

      // Gauge metrics
      activePods: 0,
      cpuUsagePercent: 0,
      memoryUsagePercent: 0,
      networkLatencyMs: 0,
      budgetUtilizedPercent: 0,
      circuitBreakerOpenCount: 0,

      // Histogram buckets
      requestLatencyBuckets: {
        '0.1': 0,
        '0.5': 0,
        '1': 0,
        '2.5': 0,
        '5': 0,
        '10': 0,
        'inf': 0
      },

      // Info metrics
      systemInfo: {
        startTime: Date.now(),
        version: '1.0.0',
        environment: 'production'
      }
    }

    this.eventBus = config.eventBus
    this.modules = {}
    this.exportHistory = []
    this.isRunning = false
  }

  /**
   * Register module
   */
  registerModule(name, module) {
    this.modules[name] = module
  }

  /**
   * Start exporter
   */
  async start() {
    if (this.isRunning) {
      console.warn('Metrics exporter already running')
      return
    }

    this.isRunning = true
    console.log(`Metrics exporter started on port ${this.config.metricsPort}`)

    // Subscribe to events
    if (this.eventBus) {
      this.eventBus.subscribe('request:completed', (data) => this.onRequestCompleted(data))
      this.eventBus.subscribe('pod:created', (data) => this.onPodCreated(data))
      this.eventBus.subscribe('pod:deleted', (data) => this.onPodDeleted(data))
      this.eventBus.subscribe('cost:incurred', (data) => this.onCostIncurred(data))
      this.eventBus.subscribe('compliance:violation', (data) => this.onViolationDetected(data))
      this.eventBus.subscribe('anomaly:detected', (data) => this.onAnomalyDetected(data))
      this.eventBus.subscribe('healing:completed', (data) => this.onHealingCompleted(data))
    }

    // Start periodic export
    this.exportInterval = setInterval(() => {
      this.exportMetrics()
    }, this.config.exportInterval)

    if (this.eventBus) {
      this.eventBus.publish('metricsExporter:started', { timestamp: Date.now() })
    }
  }

  /**
   * Stop exporter
   */
  async stop() {
    if (!this.isRunning) {
      console.warn('Metrics exporter not running')
      return
    }

    this.isRunning = false
    clearInterval(this.exportInterval)

    if (this.eventBus) {
      this.eventBus.publish('metricsExporter:stopped', { timestamp: Date.now() })
    }
  }

  /**
   * Record request completion
   */
  onRequestCompleted(data) {
    this.metrics.requestsTotal++

    if (data.error) {
      this.metrics.requestsFailed++
    } else {
      this.metrics.requestsSuccess++
    }

    // Record latency in appropriate bucket
    if (data.duration) {
      this.recordLatencyBucket(data.duration)
    }

    if (data.networkLatency) {
      this.metrics.networkLatencyMs = data.networkLatency
    }
  }

  /**
   * Record pod creation
   */
  onPodCreated(data) {
    this.metrics.podsCreated++
    this.metrics.activePods++
  }

  /**
   * Record pod deletion
   */
  onPodDeleted(data) {
    this.metrics.podsDeleted++
    this.metrics.activePods = Math.max(0, this.metrics.activePods - 1)
  }

  /**
   * Record cost incurred
   */
  onCostIncurred(data) {
    if (data.cost) {
      this.metrics.costsIncurred += data.cost
    }
  }

  /**
   * Record violation detected
   */
  onViolationDetected(data) {
    this.metrics.violationsDetected++
  }

  /**
   * Record anomaly detected
   */
  onAnomalyDetected(data) {
    this.metrics.anomaliesDetected++
  }

  /**
   * Record healing completed
   */
  onHealingCompleted(data) {
    this.metrics.healingOperations++
  }

  /**
   * Record latency in histogram bucket
   */
  recordLatencyBucket(latencyMs) {
    const latencySec = latencyMs / 1000

    if (latencySec <= 0.1) {
      this.metrics.requestLatencyBuckets['0.1']++
    } else if (latencySec <= 0.5) {
      this.metrics.requestLatencyBuckets['0.5']++
    } else if (latencySec <= 1) {
      this.metrics.requestLatencyBuckets['1']++
    } else if (latencySec <= 2.5) {
      this.metrics.requestLatencyBuckets['2.5']++
    } else if (latencySec <= 5) {
      this.metrics.requestLatencyBuckets['5']++
    } else if (latencySec <= 10) {
      this.metrics.requestLatencyBuckets['10']++
    } else {
      this.metrics.requestLatencyBuckets['inf']++
    }
  }

  /**
   * Update gauge metrics from modules
   */
  updateGaugeMetrics() {
    // CPU and memory from process
    const usage = process.memoryUsage()
    this.metrics.memoryUsagePercent = (usage.heapUsed / usage.heapTotal) * 100

    try {
      const cpuUsage = process.cpuUsage()
      this.metrics.cpuUsagePercent = (cpuUsage.user / 1000000000) * 100
    } catch (err) {
      // CPU usage may not be available
    }

    // Budget utilization from budget enforcer
    if (this.modules.budgetEnforcer) {
      const status = this.modules.budgetEnforcer.getBudgetStatus()
      if (status && status.percentageUsed) {
        this.metrics.budgetUtilizedPercent = status.percentageUsed
      }
    }

    // Circuit breaker status
    if (this.modules.circuitBreaker) {
      const status = this.modules.circuitBreaker.getStatus()
      if (status) {
        this.metrics.circuitBreakerOpenCount = Object.values(status).filter(s => s.state === 'open').length
      }
    }

    // Active pod count from topology analyzer
    if (this.modules.topologyAnalyzer) {
      try {
        const topology = this.modules.topologyAnalyzer.getTopology()
        if (topology && topology.pods) {
          this.metrics.activePods = topology.pods.length
        }
      } catch (err) {
        // Topology may not be available
      }
    }
  }

  /**
   * Export metrics to Prometheus format
   */
  exportMetricsPrometheus() {
    let output = ''

    // Counter metrics
    output += `# HELP requests_total Total number of HTTP requests\n`
    output += `# TYPE requests_total counter\n`
    output += `requests_total ${this.metrics.requestsTotal}\n`

    output += `# HELP requests_success Total successful HTTP requests\n`
    output += `# TYPE requests_success counter\n`
    output += `requests_success ${this.metrics.requestsSuccess}\n`

    output += `# HELP requests_failed Total failed HTTP requests\n`
    output += `# TYPE requests_failed counter\n`
    output += `requests_failed ${this.metrics.requestsFailed}\n`

    output += `# HELP pods_created Total pods created\n`
    output += `# TYPE pods_created counter\n`
    output += `pods_created ${this.metrics.podsCreated}\n`

    output += `# HELP pods_deleted Total pods deleted\n`
    output += `# TYPE pods_deleted counter\n`
    output += `pods_deleted ${this.metrics.podsDeleted}\n`

    output += `# HELP costs_incurred Total costs incurred\n`
    output += `# TYPE costs_incurred counter\n`
    output += `costs_incurred ${this.metrics.costsIncurred}\n`

    output += `# HELP violations_detected Total compliance violations detected\n`
    output += `# TYPE violations_detected counter\n`
    output += `violations_detected ${this.metrics.violationsDetected}\n`

    output += `# HELP anomalies_detected Total anomalies detected\n`
    output += `# TYPE anomalies_detected counter\n`
    output += `anomalies_detected ${this.metrics.anomaliesDetected}\n`

    output += `# HELP healing_operations Total healing operations completed\n`
    output += `# TYPE healing_operations counter\n`
    output += `healing_operations ${this.metrics.healingOperations}\n`

    // Gauge metrics
    output += `# HELP active_pods Current number of active pods\n`
    output += `# TYPE active_pods gauge\n`
    output += `active_pods ${this.metrics.activePods}\n`

    output += `# HELP cpu_usage_percent CPU usage percentage\n`
    output += `# TYPE cpu_usage_percent gauge\n`
    output += `cpu_usage_percent ${this.metrics.cpuUsagePercent.toFixed(2)}\n`

    output += `# HELP memory_usage_percent Memory usage percentage\n`
    output += `# TYPE memory_usage_percent gauge\n`
    output += `memory_usage_percent ${this.metrics.memoryUsagePercent.toFixed(2)}\n`

    output += `# HELP network_latency_ms Network latency in milliseconds\n`
    output += `# TYPE network_latency_ms gauge\n`
    output += `network_latency_ms ${this.metrics.networkLatencyMs}\n`

    output += `# HELP budget_utilized_percent Budget utilization percentage\n`
    output += `# TYPE budget_utilized_percent gauge\n`
    output += `budget_utilized_percent ${this.metrics.budgetUtilizedPercent.toFixed(2)}\n`

    output += `# HELP circuit_breaker_open_count Number of open circuit breakers\n`
    output += `# TYPE circuit_breaker_open_count gauge\n`
    output += `circuit_breaker_open_count ${this.metrics.circuitBreakerOpenCount}\n`

    // Histogram metrics
    output += `# HELP request_latency_seconds Request latency histogram\n`
    output += `# TYPE request_latency_seconds histogram\n`

    for (const [bucket, count] of Object.entries(this.metrics.requestLatencyBuckets)) {
      output += `request_latency_seconds_bucket{le="${bucket}"} ${count}\n`
    }

    output += `request_latency_seconds_sum 0\n`
    output += `request_latency_seconds_count ${this.metrics.requestsTotal}\n`

    return output
  }

  /**
   * Export metrics to JSON format
   */
  exportMetricsJSON() {
    return {
      timestamp: Date.now(),
      uptime: Math.floor(process.uptime()),
      metrics: this.metrics,
      systemInfo: this.metrics.systemInfo
    }
  }

  /**
   * Export metrics
   */
  exportMetrics() {
    // Update gauge metrics from modules
    this.updateGaugeMetrics()

    const exportData = {
      timestamp: Date.now(),
      prometheus: this.config.enablePrometheus ? this.exportMetricsPrometheus() : null,
      json: this.config.enableInternal ? this.exportMetricsJSON() : null
    }

    // Keep export history (last 1000)
    this.exportHistory.push(exportData)
    if (this.exportHistory.length > 1000) {
      this.exportHistory.shift()
    }

    // Publish export event
    if (this.eventBus) {
      this.eventBus.publish('metricsExporter:metricsExported', {
        timestamp: exportData.timestamp,
        metricsCount: Object.keys(this.metrics).length
      })
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    this.updateGaugeMetrics()
    return {
      timestamp: Date.now(),
      metrics: this.metrics
    }
  }

  /**
   * Get metrics in Prometheus format
   */
  getPrometheusMetrics() {
    return this.exportMetricsPrometheus()
  }

  /**
   * Get metrics snapshot
   */
  getMetricsSnapshot() {
    const metrics = this.getMetrics()

    return {
      timestamp: metrics.timestamp,
      counters: {
        requestsTotal: this.metrics.requestsTotal,
        requestsSuccess: this.metrics.requestsSuccess,
        requestsFailed: this.metrics.requestsFailed,
        podsCreated: this.metrics.podsCreated,
        podsDeleted: this.metrics.podsDeleted,
        costsIncurred: this.metrics.costsIncurred,
        violationsDetected: this.metrics.violationsDetected,
        anomaliesDetected: this.metrics.anomaliesDetected,
        healingOperations: this.metrics.healingOperations
      },
      gauges: {
        activePods: this.metrics.activePods,
        cpuUsagePercent: this.metrics.cpuUsagePercent,
        memoryUsagePercent: this.metrics.memoryUsagePercent,
        networkLatencyMs: this.metrics.networkLatencyMs,
        budgetUtilizedPercent: this.metrics.budgetUtilizedPercent,
        circuitBreakerOpenCount: this.metrics.circuitBreakerOpenCount
      },
      histograms: {
        requestLatency: this.metrics.requestLatencyBuckets
      }
    }
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics.requestsTotal = 0
    this.metrics.requestsSuccess = 0
    this.metrics.requestsFailed = 0
    this.metrics.podsCreated = 0
    this.metrics.podsDeleted = 0
    this.metrics.costsIncurred = 0
    this.metrics.violationsDetected = 0
    this.metrics.anomaliesDetected = 0
    this.metrics.healingOperations = 0

    for (const bucket in this.metrics.requestLatencyBuckets) {
      this.metrics.requestLatencyBuckets[bucket] = 0
    }

    if (this.eventBus) {
      this.eventBus.publish('metricsExporter:metricsReset', { timestamp: Date.now() })
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      isRunning: this.isRunning,
      metricsPort: this.config.metricsPort,
      exportInterval: this.config.exportInterval,
      exportHistorySize: this.exportHistory.length,
      configuration: {
        enablePrometheus: this.config.enablePrometheus,
        enableInternal: this.config.enableInternal
      }
    }
  }
}

module.exports = { MetricsExporter }
