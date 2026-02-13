/**
 * Configuration Manager
 * Dynamic configuration management with hot-reload support
 */

class ConfigurationManager {
  constructor(config = {}) {
    this.config = {
      enableHotReload: config.enableHotReload !== false,
      reloadInterval: config.reloadInterval || 30000,
      persistConfig: config.persistConfig !== false,
      ...config
    }

    this.configurations = new Map()
    this.defaults = new Map()
    this.subscribers = new Map()
    this.configHistory = []
    this.eventBus = config.eventBus
    this.isRunning = false

    this.initializeDefaults()
  }

  /**
   * Initialize default configurations
   */
  initializeDefaults() {
    // Server configuration
    this.setDefault('server', {
      host: '0.0.0.0',
      port: 3000,
      timeout: 30000,
      maxConnections: 1000,
      enableHttps: false,
      tlsCert: null,
      tlsKey: null
    })

    // Kubernetes configuration
    this.setDefault('kubernetes', {
      namespace: 'default',
      watchInterval: 5000,
      maxRetries: 3,
      retryDelay: 1000,
      operationTimeout: 30000,
      enableMetrics: true,
      metricsPort: 9090
    })

    // Resource configuration
    this.setDefault('resources', {
      cpuLimit: '2000m',
      cpuRequest: '500m',
      memoryLimit: '2Gi',
      memoryRequest: '512Mi',
      maxReplicas: 10,
      minReplicas: 2
    })

    // Budget configuration
    this.setDefault('budget', {
      enabled: true,
      monthlyBudgetUsd: 5000,
      dailyBudgetUsd: 200,
      alertThresholdPercent: 80,
      hardLimitPercent: 95,
      scalingCost: 10.5
    })

    // Rate limiting configuration
    this.setDefault('rateLimit', {
      enabled: true,
      strategy: 'slidingWindow',
      windowSizeMs: 60000,
      requestsPerWindow: 1000,
      burst: 100,
      cleanupInterval: 300000
    })

    // Performance configuration
    this.setDefault('performance', {
      enableProfiling: true,
      profilingInterval: 10000,
      slowThresholdMs: 500,
      retainHistoryMs: 3600000,
      topSlowEndpoints: 10
    })

    // Compliance configuration
    this.setDefault('compliance', {
      enableChecking: true,
      checkInterval: 30000,
      severityThreshold: 'medium',
      autoRemediateViolations: false
    })

    // Monitoring configuration
    this.setDefault('monitoring', {
      enableMetrics: true,
      enableTracing: true,
      enableLogging: true,
      metricsInterval: 15000,
      loggingLevel: 'info'
    })

    // Circuit breaker configuration
    this.setDefault('circuitBreaker', {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      halfOpenRequests: 1
    })

    // Self-healing configuration
    this.setDefault('selfHealer', {
      enabled: true,
      autoRepair: true,
      repairCheckInterval: 15000,
      maxRepairAttempts: 3,
      backoffMultiplier: 2
    })

    // Anomaly detection
    this.setDefault('anomalyDetection', {
      enabled: true,
      method: 'zscore',
      sensitivity: 'normal',
      windowSize: 30,
      minDataPoints: 10
    })

    // Cache configuration
    this.setDefault('cache', {
      enabled: true,
      ttl: 300000,
      maxSize: 1000,
      strategy: 'lru'
    })

    // Load all defaults into memory
    this.defaults.forEach((value, key) => {
      this.setConfig(key, JSON.parse(JSON.stringify(value)))
    })
  }

  /**
   * Set default configuration
   */
  setDefault(section, config) {
    this.defaults.set(section, JSON.parse(JSON.stringify(config)))
  }

  /**
   * Set configuration
   */
  setConfig(section, config) {
    const mergedConfig = {
      ...this.defaults.get(section),
      ...config
    }

    this.configurations.set(section, mergedConfig)

    // Record in history
    this.configHistory.push({
      timestamp: Date.now(),
      section,
      action: 'updated',
      config: JSON.parse(JSON.stringify(mergedConfig))
    })

    if (this.configHistory.length > 1000) {
      this.configHistory.shift()
    }

    // Notify subscribers
    this.notifySubscribers(section, mergedConfig)

    // Emit event
    if (this.eventBus) {
      this.eventBus.publish('configurationManager:configUpdated', {
        section,
        config: mergedConfig,
        timestamp: Date.now()
      })
    }

    return mergedConfig
  }

  /**
   * Get configuration
   */
  getConfig(section) {
    if (!section) {
      // Return all configurations
      const allConfig = {}
      this.configurations.forEach((value, key) => {
        allConfig[key] = JSON.parse(JSON.stringify(value))
      })
      return allConfig
    }

    const config = this.configurations.get(section)
    return config ? JSON.parse(JSON.stringify(config)) : null
  }

  /**
   * Update partial configuration
   */
  updateConfig(section, partialConfig) {
    const current = this.configurations.get(section) || {}
    const updated = {
      ...current,
      ...partialConfig
    }

    return this.setConfig(section, updated)
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(section, callback) {
    if (!this.subscribers.has(section)) {
      this.subscribers.set(section, [])
    }

    const subscribers = this.subscribers.get(section)
    subscribers.push(callback)

    // Return unsubscribe function
    return () => {
      const index = subscribers.indexOf(callback)
      if (index > -1) {
        subscribers.splice(index, 1)
      }
    }
  }

  /**
   * Notify subscribers
   */
  notifySubscribers(section, config) {
    const subscribers = this.subscribers.get(section) || []

    subscribers.forEach(callback => {
      try {
        callback(config)
      } catch (err) {
        console.error(`Error notifying subscriber for section ${section}:`, err)
      }
    })
  }

  /**
   * Start configuration manager
   */
  async start() {
    if (this.isRunning) {
      console.warn('Configuration manager already running')
      return
    }

    this.isRunning = true

    // Start hot-reload if enabled
    if (this.config.enableHotReload) {
      this.reloadInterval = setInterval(() => {
        this.checkForConfigChanges()
      }, this.config.reloadInterval)
    }

    console.log('Configuration manager started')
    if (this.eventBus) {
      this.eventBus.publish('configurationManager:started', { timestamp: Date.now() })
    }
  }

  /**
   * Stop configuration manager
   */
  async stop() {
    if (!this.isRunning) {
      console.warn('Configuration manager not running')
      return
    }

    this.isRunning = false

    if (this.reloadInterval) {
      clearInterval(this.reloadInterval)
    }

    console.log('Configuration manager stopped')
    if (this.eventBus) {
      this.eventBus.publish('configurationManager:stopped', { timestamp: Date.now() })
    }
  }

  /**
   * Check for configuration changes
   */
  checkForConfigChanges() {
    // This would typically check external config sources (etcd, Consul, etc.)
    // For now, just emit a check event
    if (this.eventBus) {
      this.eventBus.publish('configurationManager:checkComplete', {
        timestamp: Date.now()
      })
    }
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(section) {
    const defaultConfig = this.defaults.get(section)

    if (!defaultConfig) {
      throw new Error(`No default configuration for section: ${section}`)
    }

    return this.setConfig(section, JSON.parse(JSON.stringify(defaultConfig)))
  }

  /**
   * Reset all configurations to defaults
   */
  resetAllConfigs() {
    this.defaults.forEach((config, section) => {
      this.resetConfig(section)
    })
  }

  /**
   * Validate configuration
   */
  validateConfig(section, config) {
    const validators = {
      server: this.validateServer.bind(this),
      kubernetes: this.validateKubernetes.bind(this),
      resources: this.validateResources.bind(this),
      budget: this.validateBudget.bind(this),
      rateLimit: this.validateRateLimit.bind(this),
      performance: this.validatePerformance.bind(this)
    }

    const validator = validators[section]

    if (validator) {
      return validator(config)
    }

    return { valid: true }
  }

  validateServer(config) {
    const errors = []

    if (config.port && (config.port < 1 || config.port > 65535)) {
      errors.push('Port must be between 1 and 65535')
    }

    if (config.timeout && config.timeout < 1000) {
      errors.push('Timeout must be at least 1000ms')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  validateKubernetes(config) {
    const errors = []

    if (config.namespace && typeof config.namespace !== 'string') {
      errors.push('Namespace must be a string')
    }

    if (config.watchInterval && config.watchInterval < 1000) {
      errors.push('Watch interval must be at least 1000ms')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  validateResources(config) {
    const errors = []

    const cpuPattern = /^\d+m?$/
    if (config.cpuLimit && !cpuPattern.test(config.cpuLimit)) {
      errors.push('Invalid CPU limit format')
    }

    if (config.maxReplicas && config.maxReplicas < 1) {
      errors.push('Max replicas must be at least 1')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  validateBudget(config) {
    const errors = []

    if (config.monthlyBudgetUsd && config.monthlyBudgetUsd <= 0) {
      errors.push('Monthly budget must be positive')
    }

    if (config.alertThresholdPercent && (config.alertThresholdPercent < 0 || config.alertThresholdPercent > 100)) {
      errors.push('Alert threshold must be 0-100%')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  validateRateLimit(config) {
    const errors = []

    if (config.requestsPerWindow && config.requestsPerWindow < 1) {
      errors.push('Requests per window must be at least 1')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  validatePerformance(config) {
    const errors = []

    if (config.slowThresholdMs && config.slowThresholdMs < 100) {
      errors.push('Slow threshold must be at least 100ms')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get configuration history
   */
  getConfigHistory(section = null, limit = 100) {
    let history = this.configHistory

    if (section) {
      history = history.filter(h => h.section === section)
    }

    return history.slice(-limit)
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const sectionCounts = {}
    
    this.configurations.forEach((_, section) => {
      sectionCounts[section] = 1
    })

    return {
      isRunning: this.isRunning,
      configSections: this.configurations.size,
      historyEntries: this.configHistory.length,
      subscriberCount: Array.from(this.subscribers.values()).reduce((sum, arr) => sum + arr.length, 0),
      configuration: {
        enableHotReload: this.config.enableHotReload,
        reloadInterval: this.config.reloadInterval,
        persistConfig: this.config.persistConfig
      }
    }
  }
}

module.exports = { ConfigurationManager }
