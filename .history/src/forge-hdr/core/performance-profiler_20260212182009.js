/**
 * Performance Profiler
 * Continuous performance profiling and optimization tracking
 */

class PerformanceProfiler {
  constructor(config = {}) {
    this.config = {
      enableContinuousProfiling: config.enableContinuousProfiling !== false,
      profilingInterval: config.profilingInterval || 10000,
      metricsRetention: config.metricsRetention || 3600000, // 1 hour
      topSlowEndpoints: config.topSlowEndpoints || 10,
      slowThresholdMs: config.slowThresholdMs || 500,
      ...config
    }

    this.requestMetrics = new Map() // Map<requestId, {timestamp, method, endpoint, duration, memory, cpu}>
    this.endpointMetrics = {} // Map<endpoint, {count, avgTime, maxTime, minTime, errors}>
    this.performanceHistory = []
    this.slowRequests = []
    this.profilingData = []

    this.metrics = {
      totalRequests: 0,
      totalDuration: 0,
      averageResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      slowRequests: 0,
      errorRequests: 0,
      averageMemoryUsage: 0,
      averageCpuUsage: 0,
      gcCount: 0,
      gcTotalPauseTime: 0
    }

    this.eventBus = config.eventBus
    this.isRunning = false
  }

  /**
   * Start performance profiler
   */
  async start() {
    if (this.isRunning) {
      console.warn('Performance profiler already running')
      return
    }

    this.isRunning = true

    // Start periodic profiling
    this.profilingInterval = setInterval(() => {
      this.collectProfileData()
    }, this.config.profilingInterval)

    console.log('Performance profiler started')
    if (this.eventBus) {
      this.eventBus.publish('performanceProfiler:started', { timestamp: Date.now() })
    }
  }

  /**
   * Stop performance profiler
   */
  async stop() {
    if (!this.isRunning) {
      console.warn('Performance profiler not running')
      return
    }

    this.isRunning = false

    if (this.profilingInterval) {
      clearInterval(this.profilingInterval)
    }

    console.log('Performance profiler stopped')
    if (this.eventBus) {
      this.eventBus.publish('performanceProfiler:stopped', { timestamp: Date.now() })
    }
  }

  /**
   * Record request metric
   */
  recordRequest(requestId, data = {}) {
    const metric = {
      requestId,
      timestamp: Date.now(),
      method: data.method || 'unknown',
      endpoint: data.endpoint || 'unknown',
      duration: data.duration || 0,
      memory: data.memory || process.memoryUsage().heapUsed,
      cpu: data.cpu || 0,
      statusCode: data.statusCode || 200,
      userId: data.userId,
      source: data.source,
      ...data
    }

    this.requestMetrics.set(requestId, metric)
    this.updateEndpointMetrics(metric)
    this.updateAggregateMetrics(metric)

    // Check if request is slow
    if (metric.duration > this.config.slowThresholdMs) {
      this.logSlowRequest(metric)
    }

    // Keep metrics bounded
    if (this.requestMetrics.size > 10000) {
      const oldest = Array.from(this.requestMetrics.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
      this.requestMetrics.delete(oldest[0])
    }

    return metric
  }

  /**
   * Update endpoint metrics
   */
  updateEndpointMetrics(metric) {
    const endpoint = metric.endpoint

    if (!this.endpointMetrics[endpoint]) {
      this.endpointMetrics[endpoint] = {
        count: 0,
        totalTime: 0,
        maxTime: 0,
        minTime: Infinity,
        errors: 0,
        slowCount: 0,
        requests: []
      }
    }

    const stats = this.endpointMetrics[endpoint]
    stats.count++
    stats.totalTime += metric.duration
    stats.maxTime = Math.max(stats.maxTime, metric.duration)
    stats.minTime = Math.min(stats.minTime, metric.duration)

    if (metric.statusCode >= 400) {
      stats.errors++
    }

    if (metric.duration > this.config.slowThresholdMs) {
      stats.slowCount++
    }

    stats.requests.push({
      timestamp: metric.timestamp,
      duration: metric.duration,
      statusCode: metric.statusCode
    })

    // Keep request history bounded
    if (stats.requests.length > 100) {
      stats.requests.shift()
    }

    stats.avgTime = stats.totalTime / stats.count
  }

  /**
   * Update aggregate metrics
   */
  updateAggregateMetrics(metric) {
    this.metrics.totalRequests++
    this.metrics.totalDuration += metric.duration

    if (metric.statusCode >= 400) {
      this.metrics.errorRequests++
    }

    if (metric.duration > this.config.slowThresholdMs) {
      this.metrics.slowRequests++
    }

    this.metrics.averageResponseTime = this.metrics.totalDuration / this.metrics.totalRequests

    // Update memory and CPU
    this.metrics.averageMemoryUsage = (this.metrics.averageMemoryUsage + (metric.memory || 0)) / 2
    this.metrics.averageCpuUsage = (this.metrics.averageCpuUsage + (metric.cpu || 0)) / 2
  }

  /**
   * Log slow request
   */
  logSlowRequest(metric) {
    const slowLog = {
      ...metric,
      loggedAt: Date.now(),
      id: this.generateProfileId()
    }

    this.slowRequests.push(slowLog)

    // Keep bounded
    if (this.slowRequests.length > 1000) {
      this.slowRequests.shift()
    }

    // Emit event
    if (this.eventBus) {
      this.eventBus.publish('performanceProfiler:slowRequest', {
        endpoint: metric.endpoint,
        duration: metric.duration,
        threshold: this.config.slowThresholdMs,
        severity: this.calculateSlownessSeverity(metric.duration)
      })
    }
  }

  /**
   * Calculate slowness severity
   */
  calculateSlownessSeverity(duration, threshold = this.config.slowThresholdMs) {
    const ratio = duration / threshold

    if (ratio > 5) return 'critical'
    if (ratio > 3) return 'high'
    if (ratio > 1.5) return 'medium'
    return 'low'
  }

  /**
   * Collect periodic profile data
   */
  collectProfileData() {
    const memUsage = process.memoryUsage()
    const uptime = process.uptime()

    const profileSnapshot = {
      timestamp: Date.now(),
      uptime,
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers
      },
      metrics: {
        totalRequests: this.metrics.totalRequests,
        slowRequests: this.metrics.slowRequests,
        errorRequests: this.metrics.errorRequests,
        averageResponseTime: this.metrics.averageResponseTime
      }
    }

    this.profilingData.push(profileSnapshot)

    // Keep bounded
    if (this.profilingData.length > 360) { // 1 hour of 10-second intervals
      this.profilingData.shift()
    }

    // Calculate percentiles
    this.updatePercentiles()

    // Emit profiling snapshot
    if (this.eventBus) {
      this.eventBus.publish('performanceProfiler:snapshot', profileSnapshot)
    }

    return profileSnapshot
  }

  /**
   * Update response time percentiles
   */
  updatePercentiles() {
    const allDurations = Array.from(this.requestMetrics.values())
      .map(m => m.duration)
      .sort((a, b) => a - b)

    if (allDurations.length === 0) return

    this.metrics.p50ResponseTime = allDurations[Math.floor(allDurations.length * 0.50)]
    this.metrics.p95ResponseTime = allDurations[Math.floor(allDurations.length * 0.95)]
    this.metrics.p99ResponseTime = allDurations[Math.floor(allDurations.length * 0.99)]
  }

  /**
   * Get top slow endpoints
   */
  getTopSlowEndpoints(limit = this.config.topSlowEndpoints) {
    const endpoints = Object.entries(this.endpointMetrics)
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgTime: stats.avgTime,
        maxTime: stats.maxTime,
        minTime: stats.minTime,
        errorRate: stats.errors / stats.count,
        slowRate: stats.slowCount / stats.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit)

    return endpoints
  }

  /**
   * Get endpoint performance report
   */
  getEndpointReport(endpoint) {
    const stats = this.endpointMetrics[endpoint]

    if (!stats) {
      return {
        endpoint,
        found: false
      }
    }

    return {
      endpoint,
      found: true,
      metrics: {
        count: stats.count,
        avgTime: stats.avgTime.toFixed(2),
        maxTime: stats.maxTime,
        minTime: stats.minTime,
        errorRate: (stats.errors / stats.count * 100).toFixed(2) + '%',
        slowRate: (stats.slowCount / stats.count * 100).toFixed(2) + '%'
      },
      recentRequests: stats.requests.slice(-10)
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const memUsage = process.memoryUsage()
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2)

    return {
      uptime: process.uptime().toFixed(2),
      requests: {
        total: this.metrics.totalRequests,
        slow: this.metrics.slowRequests,
        errors: this.metrics.errorRequests,
        slowRate: (this.metrics.slowRequests / this.metrics.totalRequests * 100 || 0).toFixed(2) + '%',
        errorRate: (this.metrics.errorRequests / this.metrics.totalRequests * 100 || 0).toFixed(2) + '%'
      },
      responseTime: {
        avg: this.metrics.averageResponseTime.toFixed(2) + 'ms',
        p50: this.metrics.p50ResponseTime?.toFixed(2) + 'ms',
        p95: this.metrics.p95ResponseTime?.toFixed(2) + 'ms',
        p99: this.metrics.p99ResponseTime?.toFixed(2) + 'ms'
      },
      memory: {
        heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
        heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + 'MB',
        heapUsedPercent: heapUsedPercent + '%',
        rss: (memUsage.rss / 1024 / 1024).toFixed(2) + 'MB'
      },
      topSlowEndpoints: this.getTopSlowEndpoints(5)
    }
  }

  /**
   * Get slow requests
   */
  getSlowRequests(limit = 50, endpoint = null) {
    let requests = this.slowRequests

    if (endpoint) {
      requests = requests.filter(r => r.endpoint === endpoint)
    }

    return requests.slice(-limit)
  }

  /**
   * Get profile history
   */
  getProfileHistory(limit = 100) {
    return this.profilingData.slice(-limit)
  }

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends(timeWindowMs = 300000) { // 5 minutes default
    const now = Date.now()
    const cutoff = now - timeWindowMs

    const recentMetrics = Array.from(this.requestMetrics.values())
      .filter(m => m.timestamp > cutoff)

    if (recentMetrics.length === 0) {
      return { trend: 'insufficient_data', confidence: 0 }
    }

    const oldMetrics = Array.from(this.requestMetrics.values())
      .filter(m => m.timestamp <= cutoff && m.timestamp > cutoff - timeWindowMs)

    if (oldMetrics.length === 0) {
      return { trend: 'no_comparison_data', confidence: 0 }
    }

    const recentAvg = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
    const oldAvg = oldMetrics.reduce((sum, m) => sum + m.duration, 0) / oldMetrics.length

    const percentChange = ((recentAvg - oldAvg) / oldAvg * 100)

    return {
      trend: percentChange > 10 ? 'degrading' : percentChange < -10 ? 'improving' : 'stable',
      percentChange: percentChange.toFixed(2),
      recentAvgTime: recentAvg.toFixed(2),
      previousAvgTime: oldAvg.toFixed(2),
      recentSampleSize: recentMetrics.length,
      previousSampleSize: oldMetrics.length,
      confidence: Math.min(recentMetrics.length / 100, 1.0)
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      isRunning: this.isRunning,
      metrics: this.metrics,
      totalEndpoints: Object.keys(this.endpointMetrics).length,
      slowRequests: this.slowRequests.length,
      profiling: {
        dataPoints: this.profilingData.length,
        requestMetrics: this.requestMetrics.size
      },
      configuration: {
        slowThresholdMs: this.config.slowThresholdMs,
        topSlowEndpoints: this.config.topSlowEndpoints,
        profilingInterval: this.config.profilingInterval
      }
    }
  }

  /**
   * Generate profile ID
   */
  generateProfileId() {
    return `prof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

module.exports = { PerformanceProfiler }
