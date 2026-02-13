/**
 * Rate Limiter
 * Token bucket-based rate limiting with burst allowance
 */

const { EventEmitter } = require('events')

class RateLimiter extends EventEmitter {
  constructor(config = {}) {
    super()

    this.config = {
      requestsPerSecond: config.requestsPerSecond || 100,
      burstSize: config.burstSize || 200,
      windowSize: config.windowSize || 1000,  // 1 second
      cleanupInterval: config.cleanupInterval || 60000,
      ...config
    }

    this.buckets = new Map()  // Per-service rate limiter
    this.globalBucket = {
      tokens: this.config.burstSize,
      lastRefill: Date.now(),
      requests: 0,
      rejected: 0,
      accepted: 0
    }
    this.requestLog = []
    this.metrics = {
      totalRequests: 0,
      acceptedRequests: 0,
      rejectedRequests: 0,
      totalBuckets: 0
    }

    this.isRunning = false
  }

  /**
   * Start rate limiter
   */
  start() {
    if (this.isRunning) {
      console.warn('Rate limiter already running')
      return
    }

    this.isRunning = true
    console.log('Rate limiter started')
    this.emit('started')

    // Periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Stop rate limiter
   */
  stop() {
    if (!this.isRunning) {
      console.warn('Rate limiter not running')
      return
    }

    this.isRunning = false
    clearInterval(this.cleanupInterval)
    console.log('Rate limiter stopped')
    this.emit('stopped')
  }

  /**
   * Check if request is allowed (global limit)
   */
  checkGlobalRate() {
    const now = Date.now()
    const timePassed = now - this.globalBucket.lastRefill

    // Refill tokens
    const tokensToAdd = (timePassed / 1000) * this.config.requestsPerSecond
    this.globalBucket.tokens = Math.min(
      this.config.burstSize,
      this.globalBucket.tokens + tokensToAdd
    )
    this.globalBucket.lastRefill = now

    // Check if request is allowed
    if (this.globalBucket.tokens >= 1) {
      this.globalBucket.tokens -= 1
      this.globalBucket.accepted++
      this.metrics.acceptedRequests++
      this.recordRequest(true)
      
      this.emit('requestAccepted', { 
        bucket: 'global',
        remainingTokens: this.globalBucket.tokens 
      })

      return true
    } else {
      this.globalBucket.rejected++
      this.metrics.rejectedRequests++
      this.recordRequest(false)

      this.emit('requestRejected', { 
        bucket: 'global',
        reason: 'rate_limit_exceeded' 
      })

      return false
    }
  }

  /**
   * Check per-service rate limit
   */
  checkServiceRate(serviceName, limit) {
    if (!this.buckets.has(serviceName)) {
      this.createBucket(serviceName, limit)
    }

    const bucket = this.buckets.get(serviceName)
    const now = Date.now()

    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill
    const tokensToAdd = (timePassed / 1000) * bucket.rps
    bucket.tokens = Math.min(bucket.burstSize, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now

    // Check if request is allowed
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1
      bucket.accepted++
      this.metrics.acceptedRequests++

      this.emit('requestAccepted', {
        bucket: serviceName,
        remainingTokens: bucket.tokens
      })

      return true
    } else {
      bucket.rejected++
      this.metrics.rejectedRequests++

      this.emit('requestRejected', {
        bucket: serviceName,
        reason: 'service_rate_limit_exceeded'
      })

      return false
    }
  }

  /**
   * Create new rate limit bucket
   */
  createBucket(serviceName, rps) {
    const bucket = {
      serviceName,
      rps: rps || this.config.requestsPerSecond,
      tokens: rps ? rps * 2 : this.config.burstSize,
      burstSize: rps ? rps * 2 : this.config.burstSize,
      lastRefill: Date.now(),
      requests: 0,
      accepted: 0,
      rejected: 0,
      createdAt: Date.now()
    }

    this.buckets.set(serviceName, bucket)
    this.metrics.totalBuckets++

    this.emit('bucketCreated', {
      serviceName,
      rps: bucket.rps
    })

    return bucket
  }

  /**
   * Check combined rate limits (global + service)
   */
  checkRate(serviceName, serviceLimit) {
    this.metrics.totalRequests++

    // Check global limit first
    if (!this.checkGlobalRate()) {
      return false
    }

    // Then check service-specific limit
    if (serviceName) {
      return this.checkServiceRate(serviceName, serviceLimit)
    }

    return true
  }

  /**
   * Record request for analytics
   */
  recordRequest(accepted) {
    this.requestLog.push({
      timestamp: Date.now(),
      accepted
    })

    // Keep recent log
    const windowStart = Date.now() - this.config.windowSize
    this.requestLog = this.requestLog.filter(r => r.timestamp > windowStart)
  }

  /**
   * Get bucket status
   */
  getBucketStatus(serviceName) {
    if (serviceName && this.buckets.has(serviceName)) {
      const bucket = this.buckets.get(serviceName)
      return {
        serviceName: bucket.serviceName,
        tokensAvailable: Math.floor(bucket.tokens),
        rps: bucket.rps,
        burstSize: bucket.burstSize,
        accepted: bucket.accepted,
        rejected: bucket.rejected,
        utilizationRate: bucket.accepted / (bucket.accepted + bucket.rejected || 1)
      }
    }

    // Return global status
    return {
      bucket: 'global',
      tokensAvailable: Math.floor(this.globalBucket.tokens),
      rps: this.config.requestsPerSecond,
      burstSize: this.config.burstSize,
      accepted: this.globalBucket.accepted,
      rejected: this.globalBucket.rejected,
      utilizationRate: this.globalBucket.accepted / (this.globalBucket.accepted + this.globalBucket.rejected || 1)
    }
  }

  /**
   * Get all buckets status
   */
  getAllBucketsStatus() {
    const status = {
      global: this.getBucketStatus(),
      services: {}
    }

    for (const [serviceName] of this.buckets) {
      status.services[serviceName] = this.getBucketStatus(serviceName)
    }

    return status
  }

  /**
   * Update service rate limit
   */
  updateServiceLimit(serviceName, newRps) {
    if (!this.buckets.has(serviceName)) {
      this.createBucket(serviceName, newRps)
      return
    }

    const bucket = this.buckets.get(serviceName)
    bucket.rps = newRps
    bucket.burstSize = newRps * 2
    bucket.tokens = Math.min(bucket.tokens, bucket.burstSize)

    this.emit('bucketUpdated', {
      serviceName,
      newRps
    })
  }

  /**
   * Reset bucket
   */
  resetBucket(serviceName) {
    if (serviceName) {
      const bucket = this.buckets.get(serviceName)
      if (bucket) {
        bucket.tokens = bucket.burstSize
        bucket.requests = 0
        bucket.accepted = 0
        bucket.rejected = 0
        bucket.lastRefill = Date.now()

        this.emit('bucketReset', { serviceName })
      }
    } else {
      this.globalBucket.tokens = this.globalBucket.burstSize
      this.globalBucket.requests = 0
      this.globalBucket.accepted = 0
      this.globalBucket.rejected = 0
      this.globalBucket.lastRefill = Date.now()

      this.emit('bucketReset', { serviceName: 'global' })
    }
  }

  /**
   * Get current request rate
   */
  getCurrentRate() {
    const now = Date.now()
    const windowStart = now - this.config.windowSize

    const recentRequests = this.requestLog.filter(r => r.timestamp > windowStart)
    const accepted = recentRequests.filter(r => r.accepted).length
    const rejected = recentRequests.filter(r => !r.accepted).length

    const rps = (recentRequests.length / (this.config.windowSize / 1000)).toFixed(2)
    const acceptanceRate = recentRequests.length > 0 ? 
      (accepted / recentRequests.length * 100).toFixed(2) : 100

    return {
      currentRps: parseFloat(rps),
      requestsInWindow: recentRequests.length,
      acceptedInWindow: accepted,
      rejectedInWindow: rejected,
      acceptanceRate: parseFloat(acceptanceRate),
      windowSizeMs: this.config.windowSize
    }
  }

  /**
   * Cleanup old buckets
   */
  cleanup() {
    const now = Date.now()
    const maxAge = 3600000  // 1 hour

    for (const [serviceName, bucket] of this.buckets) {
      // Remove unused buckets
      if (bucket.requests === 0 && now - bucket.createdAt > maxAge) {
        this.buckets.delete(serviceName)
        this.metrics.totalBuckets--

        this.emit('bucketRemoved', { serviceName })
      }
    }

    // Prune old request logs
    const windowStart = now - this.config.windowSize
    this.requestLog = this.requestLog.filter(r => r.timestamp > windowStart)
  }

  /**
   * Get rate limiter statistics
   */
  getStatistics() {
    return {
      isRunning: this.isRunning,
      global: {
        accepted: this.globalBucket.accepted,
        rejected: this.globalBucket.rejected,
        tokensAvailable: Math.floor(this.globalBucket.tokens),
        tokensCapacity: this.config.burstSize
      },
      services: {
        count: this.buckets.size,
        buckets: Array.from(this.buckets.values()).map(b => ({
          name: b.serviceName,
          rps: b.rps,
          accepted: b.accepted,
          rejected: b.rejected,
          tokensAvailable: Math.floor(b.tokens)
        }))
      },
      metrics: {
        ...this.metrics,
        acceptanceRate: this.metrics.totalRequests > 0 ? 
          (this.metrics.acceptedRequests / this.metrics.totalRequests * 100).toFixed(2) : 100
      },
      currentRate: this.getCurrentRate()
    }
  }
}

module.exports = { RateLimiter }
