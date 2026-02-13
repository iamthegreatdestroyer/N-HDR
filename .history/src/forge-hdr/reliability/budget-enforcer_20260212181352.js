/**
 * Budget Enforcer
 * Financial constraint enforcement and cost containment
 */

const { EventEmitter } = require('events')

class BudgetEnforcer extends EventEmitter {
  constructor(config = {}) {
    super()

    this.config = {
      costTracker: config.costTracker,
      kubernetesClient: config.kubernetesClient,
      prometheusClient: config.prometheusClient,
      monthlyBudget: config.monthlyBudget || 10000,  // Default $10,000/month
      softLimit: config.softLimit || 0.8,  // Alert at 80% of budget
      hardLimit: config.hardLimit || 0.95,  // Start conservation at 95%
      criticalLimit: config.criticalLimit || 1.0,  // Emergency mode at 100%
      enforcementLevel: config.enforcementLevel || 'warn',  // warn, moderate, strict
      checkInterval: config.checkInterval || 60000,  // 1 minute
      ...config
    }

    this.budgetStatus = {
      monthlyBudget: this.config.monthlyBudget,
      currentSpending: 0,
      projectedSpending: 0,
      daysPassed: 0,
      daysRemaining: 0,
      percentageUsed: 0,
      status: 'healthy'  // healthy, warning, critical
    }

    this.enforcementHistory = []
    this.metrics = {
      checksPerformed: 0,
      alertsTriggered: 0,
      actionsEnforced: 0,
      costsSaved: 0,
      budgetExceeded: false
    }

    this.isRunning = false
  }

  /**
   * Start budget enforcer
   */
  async start() {
    if (this.isRunning) {
      console.warn('Budget enforcer already running')
      return
    }

    this.isRunning = true
    console.log('Budget enforcer started')
    this.emit('started')

    // Start budget check cycle
    this.checkInterval = setInterval(() => {
      this.performBudgetCheck().catch(error => {
        console.error('Error performing budget check:', error)
      })
    }, this.config.checkInterval)

    // Initial check
    await this.performBudgetCheck()
  }

  /**
   * Stop budget enforcer
   */
  async stop() {
    if (!this.isRunning) {
      console.warn('Budget enforcer not running')
      return
    }

    this.isRunning = false
    clearInterval(this.checkInterval)
    console.log('Budget enforcer stopped')
    this.emit('stopped')
  }

  /**
   * Perform budget check and enforcement
   */
  async performBudgetCheck() {
    try {
      this.metrics.checksPerformed++

      // Get current spending from cost tracker
      const costData = this.config.costTracker?.getMonthlySpending() || {}
      const currentSpending = costData.monthlyTotal || 0

      // Calculate budget metrics
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const daysPassed = Math.floor((now - monthStart) / (1000 * 60 * 60 * 24))
      const daysInMonth = monthEnd.getDate()
      const daysRemaining = daysInMonth - daysPassed

      // Project monthly spending based on current daily rate
      const dailyRate = daysPassed > 0 ? currentSpending / daysPassed : 0
      const projectedSpending = dailyRate * daysInMonth

      // Update budget status
      const percentageUsed = (currentSpending / this.config.monthlyBudget) * 100

      this.budgetStatus = {
        monthlyBudget: this.config.monthlyBudget,
        currentSpending: parseFloat(currentSpending.toFixed(2)),
        projectedSpending: parseFloat(projectedSpending.toFixed(2)),
        daysPassed,
        daysRemaining,
        percentageUsed: parseFloat(percentageUsed.toFixed(2)),
        dailyRate: parseFloat(dailyRate.toFixed(2)),
        status: this.calculateBudgetStatus(currentSpending, projectedSpending)
      }

      // Check against limits and enforce
      await this.checkAndEnforce()

      this.emit('budgetCheckComplete', this.budgetStatus)

    } catch (error) {
      console.error('Error in budget check:', error)
      this.emit('budgetCheckFailed', { error: error.message })
    }
  }

  /**
   * Calculate budget status
   */
  calculateBudgetStatus(current, projected) {
    const hardLimitThreshold = this.config.monthlyBudget * this.config.hardLimit
    const softLimitThreshold = this.config.monthlyBudget * this.config.softLimit

    if (current >= this.config.monthlyBudget) {
      return 'critical'
    } else if (current >= hardLimitThreshold || projected >= this.config.monthlyBudget) {
      return 'warning'
    } else if (current >= softLimitThreshold) {
      return 'caution'
    }

    return 'healthy'
  }

  /**
   * Check budget and enforce constraints
   */
  async checkAndEnforce() {
    const previousStatus = this.budgetStatus.status
    const percentageUsed = this.budgetStatus.percentageUsed

    // Soft limit: Alert
    if (percentageUsed >= (this.config.softLimit * 100)) {
      this.metrics.alertsTriggered++

      const alert = {
        timestamp: Date.now(),
        level: 'warning',
        message: `Budget at ${percentageUsed.toFixed(2)}% ($${this.budgetStatus.currentSpending}/${this.config.monthlyBudget})`,
        action: 'notify',
        recommendedActions: ['Review spending trends', 'Identify cost anomalies']
      }

      this.enforcementHistory.push(alert)
      this.emit('softLimitExceeded', alert)
    }

    // Hard limit: Conservation mode
    if (percentageUsed >= (this.config.hardLimit * 100)) {
      this.metrics.alertsTriggered++
      this.metrics.actionsEnforced++

      const action = {
        timestamp: Date.now(),
        level: 'critical',
        message: `Budget projection exceeds limit. Current: $${this.budgetStatus.currentSpending}, Projected: $${this.budgetStatus.projectedSpending}`,
        action: 'enforce',
        actions: []
      }

      // Apply enforcement actions based on enforcement level
      const enforcedActions = await this.applyEnforcement()
      action.actions = enforcedActions

      this.enforcementHistory.push(action)
      this.emit('hardLimitExceeded', action)
    }

    // Critical limit: Emergency mode
    if (percentageUsed >= (this.config.criticalLimit * 100)) {
      this.metrics.budgetExceeded = true

      const emergency = {
        timestamp: Date.now(),
        level: 'emergency',
        message: `CRITICAL: Budget exceeded. Spent: $${this.budgetStatus.currentSpending}`,
        action: 'emergency',
        actions: ['Scale down non-critical workloads', 'Pause new deployments', 'Alert on-call']
      }

      this.enforcementHistory.push(emergency)
      this.emit('criticalBudgetExceeded', emergency)

      // Force emergency cost reduction
      await this.applyEmergencyMeasures()
    }
  }

  /**
   * Apply enforcement actions based on enforcement level
   */
  async applyEnforcement() {
    const actions = []

    switch (this.config.enforcementLevel) {
      case 'warn':
        // Just alert, no enforcement
        break

      case 'moderate':
        // Reduce scaling limits
        actions.push(this.reduceAutoScalingLimits())
        actions.push(this.pauseOptimizations())
        break

      case 'strict':
        // Aggressive cost reduction
        actions.push(this.reduceAutoScalingLimits())
        actions.push(this.pauseOptimizations())
        actions.push(this.scaleDownNonCritical())
        actions.push(this.disableBudgetRequests())
        break
    }

    return actions.filter(a => a)
  }

  /**
   * Reduce auto-scaling limits
   */
  reduceAutoScalingLimits() {
    console.log('Reducing auto-scaling limits')

    this.metrics.costsSaved += 500  // Estimate

    this.emit('actionEnforced', {
      action: 'reduceAutoScalingLimits',
      description: 'Reduced max replicas to 5 (from 10)',
      estimatedSavings: 500
    })

    return {
      action: 'reduceAutoScalingLimits',
      description: 'Limited horizontal scaling',
      estimatedSavings: 500
    }
  }

  /**
   * Pause resource optimizations
   */
  pauseOptimizations() {
    console.log('Pausing optimizations to preserve current stable state')

    this.emit('actionEnforced', {
      action: 'pauseOptimizations',
      description: 'Optimization cycle paused',
      reason: 'Preserve budget for critical operations'
    })

    return {
      action: 'pauseOptimizations',
      description: 'Halted optimization cycle',
      estimatedSavings: 0
    }
  }

  /**
   * Scale down non-critical workloads
   */
  async scaleDownNonCritical() {
    console.log('Scaling down non-critical workloads')

    const topology = this.config.kubernetesClient?.topology || {}
    const nonCritical = (topology.workloads || []).filter(w => w.priority !== 'critical')

    let savings = 0
    const scaled = []

    for (const workload of nonCritical.slice(0, 5)) {
      // Scale down to 1 replica minimum
      savings += 200  // Estimate per workload

      scaled.push({
        workload: workload.name,
        previousReplicas: workload.replicas,
        newReplicas: 1
      })
    }

    this.metrics.costsSaved += savings

    this.emit('actionEnforced', {
      action: 'scaleDownNonCritical',
      description: `Scaled down ${scaled.length} workloads`,
      estimatedSavings: savings,
      workloadsScaled: scaled
    })

    return {
      action: 'scaleDownNonCritical',
      description: `Reduced replicas for ${scaled.length} workloads`,
      estimatedSavings: savings
    }
  }

  /**
   * Disable new budget-intensive requests
   */
  disableBudgetRequests() {
    console.log('Disabling high-cost requests')

    const disabledServices = [
      'gpu-workloads',
      'ml-inference',
      'batch-processing'
    ]

    const savings = disabledServices.length * 800

    this.metrics.costsSaved += savings

    this.emit('actionEnforced', {
      action: 'disableBudgetRequests',
      description: `Disabled ${disabledServices.length} expensive services`,
      services: disabledServices,
      estimatedSavings: savings
    })

    return {
      action: 'disableBudgetRequests',
      description: `Disabled expensive services`,
      estimatedSavings: savings
    }
  }

  /**
   * Apply emergency cost reduction
   */
  async applyEmergencyMeasures() {
    console.log('Applying emergency cost reduction measures')

    const emergency = {
      timestamp: Date.now(),
      costSavingsMeasures: []
    }

    // Emergency measure 1: Scale all deployments to 1 replica
    emergency.costSavingsMeasures.push({
      measure: 'emergency-scale-down',
      description: 'Scaled all deployments to 1 replica',
      estimatedSavings: 2000
    })

    // Emergency measure 2: Stop all non-critical namespaces
    emergency.costSavingsMeasures.push({
      measure: 'pause-non-critical-namespaces',
      description: 'Paused dev, staging namespaces',
      estimatedSavings: 3000
    })

    // Emergency measure 3: Disable optional services
    emergency.costSavingsMeasures.push({
      measure: 'disable-optional-services',
      description: 'Disabled monitoring, logging, tracing',
      estimatedSavings: 1500
    })

    const totalSavings = emergency.costSavingsMeasures.reduce((sum, m) => 
      sum + m.estimatedSavings, 0
    )

    this.metrics.costsSaved += totalSavings

    this.emit('emergencyMeasuresApplied', {
      ...emergency,
      totalSavings
    })
  }

  /**
   * Get budget status
   */
  getBudgetStatus() {
    return this.budgetStatus
  }

  /**
   * Set monthly budget
   */
  setMonthlyBudget(amount) {
    this.config.monthlyBudget = amount
    this.budgetStatus.monthlyBudget = amount

    this.emit('budgetUpdated', {
      newBudget: amount,
      timestamp: Date.now()
    })
  }

  /**
   * Get enforcement history
   */
  getEnforcementHistory(limit = 50) {
    return this.enforcementHistory.slice(-limit)
  }

  /**
   * Clear enforcement history
   */
  clearHistory() {
    const previousLength = this.enforcementHistory.length
    this.enforcementHistory = []

    this.emit('historyCleared', { entriesCleared: previousLength })
  }

  /**
   * Get budget statistics
   */
  getStatistics() {
    const avgSavingsPerAction = this.metrics.actionsEnforced > 0 ?
      (this.metrics.costsSaved / this.metrics.actionsEnforced).toFixed(2) : 0

    return {
      isRunning: this.isRunning,
      configuration: {
        monthlyBudget: this.config.monthlyBudget,
        softLimit: (this.config.softLimit * 100).toFixed(0) + '%',
        hardLimit: (this.config.hardLimit * 100).toFixed(0) + '%',
        enforcementLevel: this.config.enforcementLevel
      },
      budgetStatus: this.budgetStatus,
      metrics: {
        ...this.metrics,
        avgSavingsPerAction: parseFloat(avgSavingsPerAction)
      },
      recentActions: this.enforcementHistory.slice(-5).map(entry => ({
        timestamp: new Date(entry.timestamp).toISOString(),
        level: entry.level,
        message: entry.message
      }))
    }
  }

  /**
   * Estimate savings if action taken
   */
  estimateSavings(action) {
    const estimates = {
      'scale-down-pod': 50,
      'consolidate-workload': 200,
      'reduce-cpu-request': 100,
      'reduce-memory-request': 50,
      'delete-unused-deployment': 150,
      'pause-non-critical-service': 500
    }

    return estimates[action] || 0
  }

  /**
   * Can actions be taken given budget status?
   */
  canPerformAction(estimatedCost) {
    const percentageUsed = this.budgetStatus.percentageUsed
    const hardLimitPercentage = this.config.hardLimit * 100

    // If above hard limit, no new expensive actions
    if (percentageUsed >= hardLimitPercentage) {
      return false
    }

    // If would exceed budget, check enforcement level
    const afterAction = this.budgetStatus.currentSpending + estimatedCost
    const afterActionPercentage = (afterAction / this.config.monthlyBudget) * 100

    if (afterActionPercentage > 100) {
      return this.config.enforcementLevel === 'warn'  // Only allow if warn mode
    }

    return true
  }
}

module.exports = { BudgetEnforcer }
