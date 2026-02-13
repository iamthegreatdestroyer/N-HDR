/**
 * Orchestration Engine
 * Core FORGE-HDR orchestrator that coordinates all reliability and efficiency modules
 */

const { EventEmitter } = require('events')

class OrchestrationEngine extends EventEmitter {
  constructor(config = {}) {
    super()

    this.config = {
      orchestrationInterval: config.orchestrationInterval || 5000,
      enableAutoOrchestration: config.enableAutoOrchestration !== false,
      decisionThreshold: config.decisionThreshold || 0.7,
      ...config
    }

    // Injected dependencies (all 10 prior modules + event bus)
    this.kubernetesClient = config.kubernetesClient
    this.prometheusClient = config.prometheusClient
    this.topologyAnalyzer = config.topologyAnalyzer
    this.resourceOptimizer = config.resourceOptimizer
    this.rateLimiter = config.rateLimiter
    this.loadBalancer = config.loadBalancer
    this.budgetEnforcer = config.budgetEnforcer
    this.circuitBreaker = config.circuitBreaker
    this.costTracker = config.costTracker
    this.selfHealer = config.selfHealer
    this.eventBus = config.eventBus

    this.isRunning = false
    this.orchestrationCount = 0
    this.decisionHistory = []
    this.orchestrationLog = []

    this.state = {
      topology: null,
      metrics: null,
      budgetStatus: null,
      systemHealth: 'unknown',
      lastOrchestration: null,
      activeDecisions: []
    }

    this.metrics = {
      orchestrationCycles: 0,
      decisionsExecuted: 0,
      decisionsRejected: 0,
      averageCycleDuration: 0,
      totalCycleDuration: 0,
      errorsCaught: 0
    }

    this.setupEventListeners()
  }

  /**
   * Setup event listeners from all modules
   */
  setupEventListeners() {
    if (this.eventBus) {
      this.eventBus.subscribe('kubernetesClient:topologyUpdated', (event) => {
        this.state.topology = event.data
      })

      this.eventBus.subscribe('prometheusClient:metricsUpdated', (event) => {
        this.state.metrics = event.data
      })

      this.eventBus.subscribe('budgetEnforcer:budgetCheckComplete', (event) => {
        this.state.budgetStatus = event.data
      })

      this.eventBus.subscribe('selfHealer:repairStarted', (event) => {
        this.logDecision('repair', event.data)
      })

      this.eventBus.subscribe('circuitBreaker:stateChanged', (event) => {
        this.evaluateCircuitBreakerImpact(event.data)
      })

      this.eventBus.subscribe('budgetEnforcer:hardLimitExceeded', (event) => {
        this.evaluateBudgetAction(event.data)
      })
    }
  }

  /**
   * Start orchestration engine
   */
  async start() {
    if (this.isRunning) {
      console.warn('Orchestration engine already running')
      return
    }

    try {
      this.isRunning = true

      // Validate all dependencies
      this.validateDependencies()

      // Initial state collection
      await this.collectSystemState()

      // Start orchestration loop if enabled
      if (this.config.enableAutoOrchestration) {
        this.orchestrationLoop()
      }

      console.log('Orchestration engine started')
      if (this.eventBus) {
        this.eventBus.publish('orchestrationEngine:started', { timestamp: Date.now() })
      }
      this.emit('engineStarted')

    } catch (error) {
      this.isRunning = false
      console.error('Failed to start orchestration engine:', error)
      this.emit('engineStartError', { error: error.message })
      throw error
    }
  }

  /**
   * Stop orchestration engine
   */
  async stop() {
    if (!this.isRunning) {
      console.warn('Orchestration engine not running')
      return
    }

    this.isRunning = false

    if (this.orchestrationTimer) {
      clearInterval(this.orchestrationTimer)
    }

    console.log('Orchestration engine stopped')
    if (this.eventBus) {
      this.eventBus.publish('orchestrationEngine:stopped', { timestamp: Date.now() })
    }
    this.emit('engineStopped')
  }

  /**
   * Main orchestration loop (runs every N milliseconds)
   */
  orchestrationLoop() {
    if (!this.isRunning) return

    this.orchestrationTimer = setInterval(async () => {
      try {
        await this.performOrchestration()
      } catch (error) {
        this.metrics.errorsCaught++
        console.error('Orchestration cycle error:', error)
        if (this.eventBus) {
          this.eventBus.publish('orchestrationEngine:cycleError', {
            error: error.message
          })
        }
      }
    }, this.config.orchestrationInterval)
  }

  /**
   * Perform single orchestration cycle
   */
  async performOrchestration() {
    const startTime = Date.now()
    this.metrics.orchestrationCycles++

    try {
      // Step 1: Collect current system state
      await this.collectSystemState()

      // Step 2: Analyze system health
      const healthAnalysis = this.analyzeSystemHealth()

      // Step 3: Evaluate budget constraints
      const budgetAllowed = this.evaluateBudgetConstraints()

      // Step 4: Generate optimization decisions
      const decisions = this.generateDecisions(healthAnalysis, budgetAllowed)

      // Step 5: Execute approved decisions
      const executed = await this.executeDecisions(decisions)

      this.metrics.decisionsExecuted += executed.length
      this.metrics.decisionsRejected += (decisions.length - executed.length)

      // Step 6: Record orchestration event
      this.state.lastOrchestration = {
        timestamp: Date.now(),
        cycleNumber: this.orchestrationCount++,
        healthAnalysis,
        budgetStatus: this.state.budgetStatus,
        decisionsGenerated: decisions.length,
        decisionsExecuted: executed.length,
        durationMs: Date.now() - startTime
      }

      // Update metrics
      const cycleDuration = Date.now() - startTime
      this.metrics.totalCycleDuration += cycleDuration
      this.metrics.averageCycleDuration = this.metrics.totalCycleDuration / this.metrics.orchestrationCycles

      // Publish orchestration complete event
      if (this.eventBus) {
        this.eventBus.publish('orchestrationEngine:cycleComplete', {
          cycle: this.state.lastOrchestration,
          metrics: this.metrics
        })
      }

    } catch (error) {
      this.metrics.errorsCaught++
      console.error('Orchestration cycle failed:', error)
    }
  }

  /**
   * Collect current system state
   */
  async collectSystemState() {
    try {
      // Collect topology
      if (this.kubernetesClient && this.topologyAnalyzer) {
        const topology = await this.topologyAnalyzer.analyzeTopology()
        this.state.topology = topology
      }

      // Collect metrics
      if (this.prometheusClient) {
        const metrics = await this.prometheusClient.getCurrentMetrics()
        this.state.metrics = metrics
      }

      // Collect budget status
      if (this.budgetEnforcer) {
        const budgetStatus = this.budgetEnforcer.getBudgetStatus()
        this.state.budgetStatus = budgetStatus
      }

    } catch (error) {
      console.error('Error collecting system state:', error)
      this.metrics.errorsCaught++
    }
  }

  /**
   * Analyze system health
   */
  analyzeSystemHealth() {
    const analysis = {
      timestamp: Date.now(),
      metrics: {
        cpuUtilization: 0,
        memoryUtilization: 0,
        networkLatency: 0,
        errorRate: 0,
        podHealth: 0
      },
      issues: [],
      recommendations: []
    }

    if (!this.state.metrics) return analysis

    // Analyze CPU utilization
    const avgCpu = this.calculateAverageMetric('cpu')
    analysis.metrics.cpuUtilization = avgCpu
    if (avgCpu > 80) {
      analysis.issues.push('High CPU utilization')
      analysis.recommendations.push('Consider horizontal scaling')
    }

    // Analyze memory utilization
    const avgMemory = this.calculateAverageMetric('memory')
    analysis.metrics.memoryUtilization = avgMemory
    if (avgMemory > 80) {
      analysis.issues.push('High memory utilization')
      analysis.recommendations.push('Consider pod consolidation')
    }

    // Analyze latency
    const avgLatency = this.calculateAverageMetric('latency')
    analysis.metrics.networkLatency = avgLatency
    if (avgLatency > 500) {
      analysis.issues.push('High network latency')
      analysis.recommendations.push('Consider geographically closer resources')
    }

    // Analyze error rate
    const avgError = this.calculateAverageMetric('errorRate')
    analysis.metrics.errorRate = avgError
    if (avgError > 5) {
      analysis.issues.push('High error rate')
      analysis.recommendations.push('Investigate error sources, trigger self-healing')
    }

    // Calculate overall health
    const healthScore = (
      (1 - avgCpu / 100) * 0.25 +
      (1 - avgMemory / 100) * 0.25 +
      (1 - avgLatency / 1000) * 0.25 +
      (1 - avgError / 100) * 0.25
    ) * 100

    analysis.systemHealth = Math.max(0, healthScore)

    if (analysis.systemHealth > 80) {
      this.state.systemHealth = 'healthy'
    } else if (analysis.systemHealth > 50) {
      this.state.systemHealth = 'degraded'
    } else {
      this.state.systemHealth = 'unhealthy'
    }

    return analysis
  }

  /**
   * Calculate average metric across pods
   */
  calculateAverageMetric(metric) {
    if (!this.state.metrics || !this.state.metrics.pods) return 0

    const values = Object.values(this.state.metrics.pods)
      .map(pod => pod[metric])
      .filter(val => typeof val === 'number')

    if (values.length === 0) return 0

    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  /**
   * Evaluate budget constraints
   */
  evaluateBudgetConstraints() {
    if (!this.budgetEnforcer || !this.state.budgetStatus) {
      return true
    }

    const status = this.state.budgetStatus.status

    return status !== 'critical' && status !== 'warning'
  }

  /**
   * Generate optimization decisions
   */
  generateDecisions(healthAnalysis, budgetAllowed) {
    const decisions = []

    // Decision 1: Scaling decisions
    if (healthAnalysis.metrics.cpuUtilization > 80 && budgetAllowed) {
      decisions.push({
        type: 'scale-up',
        target: 'cpu-intensive-services',
        action: 'increase-replicas',
        estimatedCost: 100,
        priority: 'high',
        confidence: healthAnalysis.metrics.cpuUtilization / 100
      })
    }

    if (healthAnalysis.metrics.cpuUtilization < 30) {
      decisions.push({
        type: 'scale-down',
        target: 'underutilized-services',
        action: 'decrease-replicas',
        estimatedSavings: 50,
        priority: 'normal',
        confidence: 0.8
      })
    }

    // Decision 2: Rate limiting decisions
    if (healthAnalysis.metrics.errorRate > 5 && this.rateLimiter) {
      decisions.push({
        type: 'rate-limit',
        target: 'high-error-services',
        action: 'enable-rate-limiting',
        estimatedSavings: 30,
        priority: 'high',
        confidence: Math.min(healthAnalysis.metrics.errorRate / 100, 1.0)
      })
    }

    // Decision 3: Load balancing decisions
    if (this.loadBalancer) {
      decisions.push({
        type: 'rebalance',
        target: 'traffic-distribution',
        action: 'optimize-load-balancing',
        estimatedImprovement: 'latency reduction',
        priority: 'normal',
        confidence: 0.75
      })
    }

    // Decision 4: Self-healing decisions
    if (healthAnalysis.metrics.errorRate > 5 && this.selfHealer) {
      decisions.push({
        type: 'heal',
        target: 'failed-pods',
        action: 'trigger-repair',
        priority: 'high',
        confidence: Math.min(healthAnalysis.metrics.errorRate / 100, 1.0)
      })
    }

    // Decision 5: Resource optimization
    if (this.resourceOptimizer) {
      decisions.push({
        type: 'optimize',
        target: 'resource-requests',
        action: 'rightsize-resources',
        estimatedSavings: 200,
        priority: budgetAllowed ? 'normal' : 'critical',
        confidence: 0.8
      })
    }

    // Filter by confidence threshold
    return decisions.filter(d => d.confidence >= this.config.decisionThreshold)
  }

  /**
   * Execute approved decisions
   */
  async executeDecisions(decisions) {
    const executed = []

    for (const decision of decisions) {
      try {
        // Validate budget before execution
        if (decision.estimatedCost && !this.budgetEnforcer?.canPerformAction(decision.estimatedCost)) {
          console.warn(`Decision rejected due to budget constraints: ${decision.type}`)
          continue
        }

        // Execute decision based on type
        await this.executeDecision(decision)
        executed.push(decision)

        // Log decision
        this.logDecision(decision.type, decision)

        // Emit event
        if (this.eventBus) {
          this.eventBus.publish('orchestrationEngine:decisionExecuted', decision)
        }

      } catch (error) {
        console.error(`Failed to execute decision ${decision.type}:`, error)
        this.metrics.errorsCaught++
      }
    }

    return executed
  }

  /**
   * Execute single decision
   */
  async executeDecision(decision) {
    switch (decision.type) {
      case 'scale-up':
        if (this.resourceOptimizer) {
          await this.resourceOptimizer.optimizeForPerformance({
            target: decision.target,
            action: 'scale-up'
          })
        }
        break

      case 'scale-down':
        if (this.resourceOptimizer) {
          await this.resourceOptimizer.optimizeForCost({
            target: decision.target,
            action: 'scale-down'
          })
        }
        break

      case 'rate-limit':
        if (this.rateLimiter) {
          this.rateLimiter.updateRateLimit(decision.target, {
            enabled: true,
            strategy: 'adaptive'
          })
        }
        break

      case 'rebalance':
        if (this.loadBalancer) {
          await this.loadBalancer.updatePodMetrics()
        }
        break

      case 'heal':
        if (this.selfHealer) {
          await this.selfHealer.identifyAndRepair()
        }
        break

      case 'optimize':
        if (this.resourceOptimizer) {
          await this.resourceOptimizer.analyzeAndOptimize()
        }
        break

      default:
        console.warn(`Unknown decision type: ${decision.type}`)
    }
  }

  /**
   * Evaluate circuit breaker impact
   */
  evaluateCircuitBreakerImpact(cbData) {
    if (cbData.state === 'OPEN') {
      // Trigger self-healing if available
      if (this.selfHealer) {
        this.selfHealer.identifyAndRepair()
      }

      // Shift traffic away from blocked pods
      if (this.loadBalancer) {
        this.loadBalancer.shiftTraffic(cbData.service, 100)
      }
    } else if (cbData.state === 'HALF_OPEN') {
      // Monitor recovery
      console.log(`Circuit breaker half-open for ${cbData.service}`)
    } else if (cbData.state === 'CLOSED') {
      // Restore traffic
      if (this.loadBalancer) {
        this.loadBalancer.restoreTraffic(cbData.service)
      }
    }
  }

  /**
   * Evaluate budget action impact
   */
  evaluateBudgetAction(budgetData) {
    // Hard limit triggered - reduce resource consumption
    console.log('Budget hard limit exceeded, triggering cost reduction')

    // Pause non-critical optimizations
    if (this.resourceOptimizer) {
      // Disable performance optimization mode
    }

    // Log action
    this.logDecision('budget-reduction', budgetData)
  }

  /**
   * Manual decision request (from external API)
   */
  async executeManualDecision(decision) {
    if (!this.isRunning) {
      throw new Error('Orchestration engine not running')
    }

    return this.executeDecisions([decision])
  }

  /**
   * Get current system state
   */
  getSystemState() {
    return {
      isRunning: this.isRunning,
      state: this.state,
      metrics: this.metrics,
      configuration: {
        orchestrationInterval: this.config.orchestrationInterval,
        enableAutoOrchestration: this.config.enableAutoOrchestration,
        decisionThreshold: this.config.decisionThreshold
      }
    }
  }

  /**
   * Get decision history
   */
  getDecisionHistory(limit = 50) {
    return this.decisionHistory.slice(-limit)
  }

  /**
   * Log decision
   */
  logDecision(type, data) {
    const entry = {
      type,
      data,
      timestamp: Date.now(),
      id: this.generateDecisionId()
    }

    this.decisionHistory.push(entry)

    // Keep history bounded
    if (this.decisionHistory.length > 1000) {
      this.decisionHistory.shift()
    }

    this.orchestrationLog.push(entry)
  }

  /**
   * Get orchestration log
   */
  getOrchestrationLog(limit = 100) {
    return this.orchestrationLog.slice(-limit)
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      isRunning: this.isRunning,
      systemState: this.state,
      metrics: this.metrics,
      systemHealth: this.state.systemHealth,
      recentDecisions: this.decisionHistory.slice(-10),
      lastOrchestration: this.state.lastOrchestration
    }
  }

  /**
   * Validate all dependencies
   */
  validateDependencies() {
    const required = [
      'kubernetesClient',
      'prometheusClient',
      'topologyAnalyzer',
      'resourceOptimizer',
      'rateLimiter',
      'loadBalancer',
      'budgetEnforcer',
      'circuitBreaker',
      'costTracker',
      'selfHealer'
    ]

    for (const dep of required) {
      if (!this[dep]) {
        throw new Error(`Missing required dependency: ${dep}`)
      }
    }
  }

  /**
   * Generate unique decision ID
   */
  generateDecisionId() {
    return `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

module.exports = { OrchestrationEngine }
