/**
 * Circuit Breaker
 * Prevents cascade failures by breaking requests when service is stressed
 */

const { EventEmitter } = require('events')

class CircuitBreaker extends EventEmitter {
  constructor(config = {}) {
    super()

    this.config = {
      name: config.name || 'circuit-breaker',
      failureThreshold: config.failureThreshold || 0.5,  // 50% failure rate
      successThreshold: config.successThreshold || 0.5,  // 50% success to recover
      timeout: config.timeout || 60000,  // 60 seconds
      windowSize: config.windowSize || 10000,  // 10 second sliding window
      statusCheckInterval: config.statusCheckInterval || 5000,  // 5 seconds
      ...config
    }

    this.state = 'CLOSED'  // CLOSED, OPEN, HALF_OPEN
    this.metrics = {
      requests: 0,
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      lastCheckTime: Date.now()
    }

    this.requestLog = []  // Sliding window of requests
    this.consecutiveFailures = 0
    this.openedAt = null
  }

  /**
   * Execute a request through the circuit breaker
   */
  async execute(executor) {
    // Check if circuit should be opened/closed
    this.evaluateState()

    if (this.state === 'OPEN') {
      const error = new Error('Circuit breaker is OPEN')
      error.code = 'CIRCUIT_BREAKER_OPEN'
      throw error
    }

    try {
      const result = await executor()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  /**
   * Record a successful request
   */
  recordSuccess() {
    this.metrics.successes++
    this.metrics.requests++
    this.consecutiveFailures = 0

    this.recordRequest(true)

    if (this.state === 'HALF_OPEN') {
      // Enough successes to close circuit
      if (this.successRate() >= this.config.successThreshold) {
        this.closeCircuit()
      }
    }

    this.emit('success', {
      state: this.state,
      successRate: this.successRate(),
      failureRate: this.failureRate()
    })
  }

  /**
   * Record a failed request
   */
  recordFailure() {
    this.metrics.failures++
    this.metrics.requests++
    this.metrics.lastFailureTime = Date.now()
    this.consecutiveFailures++

    this.recordRequest(false)

    if (this.state === 'CLOSED') {
      // Too many failures - open circuit
      if (this.failureRate() >= this.config.failureThreshold) {
        this.openCircuit()
      }
    } else if (this.state === 'HALF_OPEN') {
      // Any failure while testing - reopen
      this.openCircuit()
    }

    this.emit('failure', {
      state: this.state,
      failureRate: this.failureRate(),
      consecutiveFailures: this.consecutiveFailures
    })
  }

  /**
   * Open the circuit (rejecting requests)
   */
  openCircuit() {
    this.state = 'OPEN'
    this.openedAt = Date.now()

    console.warn(`Circuit breaker "${this.config.name}" opened`)
    this.emit('opened', {
      failureRate: this.failureRate(),
      consecutiveFailures: this.consecutiveFailures,
      timeout: this.config.timeout
    })
  }

  /**
   * Close the circuit (accepting requests)
   */
  closeCircuit() {
    this.state = 'CLOSED'
    this.openedAt = null
    this.consecutiveFailures = 0
    this.requestLog = []  // Reset sliding window

    console.log(`Circuit breaker "${this.config.name}" closed`)
    this.emit('closed', {
      successRate: this.successRate()
    })
  }

  /**
   * Move to half-open state (testing)
   */
  halfOpen() {
    this.state = 'HALF_OPEN'
    this.consecutiveFailures = 0
    this.requestLog = []

    console.log(`Circuit breaker "${this.config.name}" half-open (testing)`)
    this.emit('halfOpen', {
      testingTimeout: this.config.timeout
    })
  }

  /**
   * Evaluate if circuit state should change
   */
  evaluateState() {
    if (this.state === 'OPEN') {
      // Check if enough time has passed to transition to HALF_OPEN
      const timeInOpen = Date.now() - this.openedAt
      
      if (timeInOpen >= this.config.timeout) {
        this.halfOpen()
      }
    } else {
      // Clean old requests from sliding window
      this.cleanOldRequests()
    }
  }

  /**
   * Clean requests older than window size
   */
  cleanOldRequests() {
    const cutoffTime = Date.now() - this.config.windowSize
    
    while (this.requestLog.length > 0 && this.requestLog[0].timestamp < cutoffTime) {
      const removed = this.requestLog.shift()
      
      if (removed.success) {
        this.metrics.successes--
      } else {
        this.metrics.failures--
      }
    }

    this.metrics.requests = this.requestLog.length
  }

  /**
   * Record a request in the sliding window
   */
  recordRequest(success) {
    this.requestLog.push({
      timestamp: Date.now(),
      success
    })

    // Keep window size reasonable
    if (this.requestLog.length > 1000) {
      this.requestLog.shift()
    }
  }

  /**
   * Calculate failure rate
   */
  failureRate() {
    if (this.metrics.requests === 0) return 0
    return this.metrics.failures / this.metrics.requests
  }

  /**
   * Calculate success rate
   */
  successRate() {
    if (this.metrics.requests === 0) return 0
    return this.metrics.successes / this.metrics.requests
  }

  /**
   * Get current state
   */
  getState() {
    return {
      state: this.state,
      name: this.config.name,
      metrics: {
        requests: this.metrics.requests,
        failures: this.metrics.failures,
        successes: this.metrics.successes,
        failureRate: this.failureRate(),
        successRate: this.successRate(),
        consecutiveFailures: this.consecutiveFailures,
        lastFailureTime: this.metrics.lastFailureTime
      },
      config: {
        failureThreshold: this.config.failureThreshold,
        successThreshold: this.config.successThreshold,
        timeout: this.config.timeout,
        windowSize: this.config.windowSize
      },
      openedAt: this.openedAt
    }
  }

  /**
   * Reset circuit breaker
   */
  reset() {
    this.state = 'CLOSED'
    this.metrics = {
      requests: 0,
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      lastCheckTime: Date.now()
    }
    this.requestLog = []
    this.consecutiveFailures = 0
    this.openedAt = null

    console.log(`Circuit breaker "${this.config.name}" reset`)
    this.emit('reset')
  }

  /**
   * Force circuit to OPEN state
   */
  forceOpen() {
    this.openCircuit()
  }

  /**
   * Force circuit to CLOSED state
   */
  forceClose() {
    this.closeCircuit()
  }
}

/**
 * Circuit Breaker Pool
 * Manages multiple circuit breakers for different services
 */
class CircuitBreakerPool extends EventEmitter {
  constructor(config = {}) {
    super()

    this.config = {
      failureThreshold: config.failureThreshold || 0.5,
      successThreshold: config.successThreshold || 0.5,
      timeout: config.timeout || 60000,
      windowSize: config.windowSize || 10000,
      ...config
    }

    this.breakers = new Map()
  }

  /**
   * Get or create circuit breaker
   */
  getBreaker(name) {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker({
        name,
        failureThreshold: this.config.failureThreshold,
        successThreshold: this.config.successThreshold,
        timeout: this.config.timeout,
        windowSize: this.config.windowSize
      })

      breaker.on('opened', (stats) => {
        console.warn(`[${name}] Circuit opened:`, stats)
        this.emit('breakerOpened', { name, ...stats })
      })

      breaker.on('closed', (stats) => {
        console.log(`[${name}] Circuit closed:`, stats)
        this.emit('breakerClosed', { name, ...stats })
      })

      this.breakers.set(name, breaker)
    }

    return this.breakers.get(name)
  }

  /**
   * Execute through a circuit breaker
   */
  async execute(name, executor) {
    const breaker = this.getBreaker(name)
    return breaker.execute(executor)
  }

  /**
   * Get statistics for all breakers
   */
  getStatistics() {
    const stats = {
      total: this.breakers.size,
      open: 0,
      closed: 0,
      halfOpen: 0,
      breakers: {}
    }

    for (const [name, breaker] of this.breakers) {
      const state = breaker.getState()
      stats.breakers[name] = state

      if (breaker.state === 'OPEN') stats.open++
      else if (breaker.state === 'CLOSED') stats.closed++
      else if (breaker.state === 'HALF_OPEN') stats.halfOpen++
    }

    return stats
  }

  /**
   * Get breaker state
   */
  getState(name) {
    const breaker = this.breakers.get(name)
    if (!breaker) return null
    return breaker.getState()
  }

  /**
   * Reset all breakers
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset()
    }
    this.emit('resetAll')
  }

  /**
   * Reset specific breaker
   */
  reset(name) {
    const breaker = this.breakers.get(name)
    if (breaker) {
      breaker.reset()
    }
  }
}

module.exports = { CircuitBreaker, CircuitBreakerPool }
