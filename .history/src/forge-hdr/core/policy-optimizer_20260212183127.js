/**
 * Policy Optimizer
 * ML-based optimization of policies from compliance and performance history
 */

class PolicyOptimizer {
  constructor(config = {}) {
    this.config = {
      optimizationInterval: config.optimizationInterval || 3600000,
      historyRetention: config.historyRetention || 30,
      confidenceThreshold: config.confidenceThreshold || 0.75,
      ...config
    }

    this.policies = {
      resourceAllocation: {
        minCpu: 100,
        maxCpu: 2000,
        minMemory: 256,
        maxMemory: 4096,
        optimizedAt: null
      },
      scalingPolicy: {
        minReplicas: 1,
        maxReplicas: 10,
        targetCpuPercent: 70,
        targetMemoryPercent: 80,
        scaleUpThreshold: 80,
        scaleDownThreshold: 20,
        optimizedAt: null
      },
      budgetPolicy: {
        monthlyBudget: 10000,
        dailyBudget: 333,
        alertThreshold: 75,
        hardLimit: 95,
        optimizedAt: null
      },
      compliancePolicy: {
        strictnessLevel: 'medium',
        autoRemediationEnabled: true,
        violationThreshold: 5,
        optimizedAt: null
      }
    }

    this.optimizationHistory = []
    this.recommendations = []
    this.performanceMetrics = {}
    this.complianceHistory = []
    this.costHistory = []
    this.eventBus = config.eventBus
    this.modules = {}
    this.isRunning = false
  }

  /**
   * Register module
   */
  registerModule(name, module) {
    this.modules[name] = module
  }

  /**
   * Start optimizer
   */
  async start() {
    if (this.isRunning) {
      console.warn('Policy optimizer already running')
      return
    }

    this.isRunning = true
    console.log('Policy optimizer started')

    // Subscribe to events
    if (this.eventBus) {
      this.eventBus.subscribe('compliance:report', (data) => this.onComplianceReport(data))
      this.eventBus.subscribe('cost:update', (data) => this.onCostUpdate(data))
      this.eventBus.subscribe('performance:update', (data) => this.onPerformanceUpdate(data))
    }

    // Start periodic optimization
    this.optimizationInterval = setInterval(() => {
      this.optimizePolicies()
    }, this.config.optimizationInterval)

    if (this.eventBus) {
      this.eventBus.publish('policyOptimizer:started', { timestamp: Date.now() })
    }
  }

  /**
   * Stop optimizer
   */
  async stop() {
    if (!this.isRunning) {
      console.warn('Policy optimizer not running')
      return
    }

    this.isRunning = false
    clearInterval(this.optimizationInterval)

    if (this.eventBus) {
      this.eventBus.publish('policyOptimizer:stopped', { timestamp: Date.now() })
    }
  }

  /**
   * Record compliance report
   */
  onComplianceReport(data) {
    this.complianceHistory.push({
      timestamp: Date.now(),
      violationCount: data.violationCount || 0,
      resourcesChecked: data.resourcesChecked || 0,
      complianceRate: data.complianceRate || 0
    })

    // Keep last N reports
    if (this.complianceHistory.length > this.config.historyRetention) {
      this.complianceHistory.shift()
    }
  }

  /**
   * Record cost update
   */
  onCostUpdate(data) {
    this.costHistory.push({
      timestamp: Date.now(),
      cost: data.cost || 0,
      budget: data.budget || 0,
      percentageUsed: (data.cost / data.budget) * 100 || 0
    })

    // Keep last N records
    if (this.costHistory.length > this.config.historyRetention) {
      this.costHistory.shift()
    }
  }

  /**
   * Record performance update
   */
  onPerformanceUpdate(data) {
    this.performanceMetrics = {
      timestamp: Date.now(),
      avgLatency: data.avgLatency || 0,
      p95Latency: data.p95Latency || 0,
      p99Latency: data.p99Latency || 0,
      cpuUsage: data.cpuUsage || 0,
      memoryUsage: data.memoryUsage || 0,
      errorRate: data.errorRate || 0
    }
  }

  /**
   * Analyze compliance trends
   */
  analyzeComplianceTrends() {
    if (this.complianceHistory.length < 2) {
      return null
    }

    const last10 = this.complianceHistory.slice(-10)
    const avgViolations = last10.reduce((sum, r) => sum + r.violationCount, 0) / last10.length
    const avgCompliance = last10.reduce((sum, r) => sum + r.complianceRate, 0) / last10.length

    const trend = avgViolations > 5 ? 'deteriorating' : avgViolations > 2 ? 'stable' : 'improving'

    return {
      avgViolations,
      avgCompliance,
      trend,
      confidence: Math.min(last10.length / 10, 1.0)
    }
  }

  /**
   * Analyze cost trends
   */
  analyzeCostTrends() {
    if (this.costHistory.length < 2) {
      return null
    }

    const last10 = this.costHistory.slice(-10)
    const avgPercentageUsed = last10.reduce((sum, r) => sum + r.percentageUsed, 0) / last10.length

    const trend = avgPercentageUsed > 80 ? 'accelerating' : avgPercentageUsed > 50 ? 'stable' : 'decelerating'

    return {
      avgPercentageUsed,
      trend,
      confidence: Math.min(last10.length / 10, 1.0)
    }
  }

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends() {
    if (!this.performanceMetrics || Object.keys(this.performanceMetrics).length === 0) {
      return null
    }

    return {
      latency: this.performanceMetrics.avgLatency,
      cpuUsage: this.performanceMetrics.cpuUsage,
      memoryUsage: this.performanceMetrics.memoryUsage,
      errorRate: this.performanceMetrics.errorRate
    }
  }

  /**
   * Generate compliance recommendations
   */
  generateComplianceRecommendations() {
    const trends = this.analyzeComplianceTrends()
    const recommendations = []

    if (!trends) {
      return recommendations
    }

    // Increasing violations
    if (trends.trend === 'deteriorating' && trends.confidence > this.config.confidenceThreshold) {
      recommendations.push({
        type: 'COMPLIANCE_STRICTNESS',
        severity: 'HIGH',
        confidence: trends.confidence,
        recommendation: 'Increase policy strictness level to combat deteriorating compliance',
        currentValue: this.policies.compliancePolicy.strictnessLevel,
        suggestedValue: 'strict',
        rationale: `Average violations trending toward ${trends.avgViolations.toFixed(2)} (threshold: 5)`
      })

      recommendations.push({
        type: 'AUTO_REMEDIATION',
        severity: 'HIGH',
        confidence: trends.confidence,
        recommendation: 'Enable automatic remediation for quickly addressable violations',
        currentValue: this.policies.compliancePolicy.autoRemediationEnabled,
        suggestedValue: true,
        rationale: 'Automatic remediation can reduce violation count by 30-40%'
      })
    }

    // Improving compliance
    if (trends.trend === 'improving' && trends.confidence > this.config.confidenceThreshold) {
      recommendations.push({
        type: 'COMPLIANCE_RELAXATION',
        severity: 'LOW',
        confidence: trends.confidence,
        recommendation: 'Relax policy strictness to improve developer velocity',
        currentValue: this.policies.compliancePolicy.strictnessLevel,
        suggestedValue: 'medium',
        rationale: `Compliance trending toward ${trends.avgCompliance.toFixed(2)}%`
      })
    }

    return recommendations
  }

  /**
   * Generate budget recommendations
   */
  generateBudgetRecommendations() {
    const trends = this.analyzeCostTrends()
    const recommendations = []

    if (!trends) {
      return recommendations
    }

    // Accelerating costs
    if (trends.trend === 'accelerating' && trends.confidence > this.config.confidenceThreshold) {
      recommendations.push({
        type: 'BUDGET_INCREASE',
        severity: 'HIGH',
        confidence: trends.confidence,
        recommendation: 'Increase monthly budget allocation',
        currentValue: this.policies.budgetPolicy.monthlyBudget,
        suggestedValue: Math.ceil(this.policies.budgetPolicy.monthlyBudget * 1.2),
        rationale: `Cost trajectory at ${trends.avgPercentageUsed.toFixed(2)}% of budget`
      })

      recommendations.push({
        type: 'RESOURCE_OPTIMIZATION',
        severity: 'HIGH',
        confidence: trends.confidence,
        recommendation: 'Optimize resource allocation to reduce costs',
        rationale: 'Consider reserved instances, spot instances, or right-sizing'
      })
    }

    // Decelerating costs
    if (trends.trend === 'decelerating' && trends.confidence > this.config.confidenceThreshold) {
      recommendations.push({
        type: 'BUDGET_REDUCTION',
        severity: 'LOW',
        confidence: trends.confidence,
        recommendation: 'Reduce budget allocation',
        currentValue: this.policies.budgetPolicy.monthlyBudget,
        suggestedValue: Math.floor(this.policies.budgetPolicy.monthlyBudget * 0.9),
        rationale: `Cost trajectory at ${trends.avgPercentageUsed.toFixed(2)}% of budget`
      })
    }

    return recommendations
  }

  /**
   * Generate scaling recommendations
   */
  generateScalingRecommendations() {
    const perf = this.analyzePerformanceTrends()
    const recommendations = []

    if (!perf) {
      return recommendations
    }

    // High CPU usage
    if (perf.cpuUsage > 80) {
      recommendations.push({
        type: 'SCALE_UP_CPU',
        severity: 'HIGH',
        confidence: 0.9,
        recommendation: 'Increase CPU allocation or replica count',
        currentValue: this.policies.resourceAllocation.maxCpu,
        suggestedValue: Math.ceil(this.policies.resourceAllocation.maxCpu * 1.5),
        rationale: `CPU usage at ${perf.cpuUsage.toFixed(2)}%`
      })
    }

    // High memory usage
    if (perf.memoryUsage > 80) {
      recommendations.push({
        type: 'SCALE_UP_MEMORY',
        severity: 'HIGH',
        confidence: 0.9,
        recommendation: 'Increase memory allocation',
        currentValue: this.policies.resourceAllocation.maxMemory,
        suggestedValue: Math.ceil(this.policies.resourceAllocation.maxMemory * 1.5),
        rationale: `Memory usage at ${perf.memoryUsage.toFixed(2)}%`
      })
    }

    // High latency
    if (perf.latency > 500) {
      recommendations.push({
        type: 'REDUCE_LATENCY',
        severity: 'MEDIUM',
        confidence: 0.85,
        recommendation: 'Reduce request latency through scaling or optimization',
        currentValue: this.policies.scalingPolicy.maxReplicas,
        suggestedValue: Math.ceil(this.policies.scalingPolicy.maxReplicas * 1.3),
        rationale: `P95 latency at ${perf.p95Latency.toFixed(2)}ms`
      })
    }

    return recommendations
  }

  /**
   * Optimize policies
   */
  optimizePolicies() {
    const recommendations = [
      ...this.generateComplianceRecommendations(),
      ...this.generateBudgetRecommendations(),
      ...this.generateScalingRecommendations()
    ]

    // Store recommendations
    this.recommendations = recommendations.slice(0, 20) // Keep top 20

    // Log optimization
    this.optimizationHistory.push({
      timestamp: Date.now(),
      policiesUpdated: 0,
      recommendationsGenerated: recommendations.length,
      recommendations: recommendations
    })

    // Keep optimization history
    if (this.optimizationHistory.length > 100) {
      this.optimizationHistory.shift()
    }

    if (this.eventBus) {
      this.eventBus.publish('policyOptimizer:optimizationComplete', {
        timestamp: Date.now(),
        recommendationsCount: recommendations.length
      })
    }
  }

  /**
   * Apply recommendation
   */
  applyRecommendation(recommendationIndex) {
    if (recommendationIndex < 0 || recommendationIndex >= this.recommendations.length) {
      return { success: false, error: 'Invalid recommendation index' }
    }

    const rec = this.recommendations[recommendationIndex]

    // Apply based on type
    if (rec.type === 'COMPLIANCE_STRICTNESS') {
      this.policies.compliancePolicy.strictnessLevel = rec.suggestedValue
      this.policies.compliancePolicy.optimizedAt = Date.now()
    } else if (rec.type === 'BUDGET_INCREASE') {
      this.policies.budgetPolicy.monthlyBudget = rec.suggestedValue
      this.policies.budgetPolicy.optimizedAt = Date.now()
    } else if (rec.type === 'SCALE_UP_CPU') {
      this.policies.resourceAllocation.maxCpu = rec.suggestedValue
      this.policies.resourceAllocation.optimizedAt = Date.now()
    } else if (rec.type === 'AUTO_REMEDIATION') {
      this.policies.compliancePolicy.autoRemediationEnabled = rec.suggestedValue
      this.policies.compliancePolicy.optimizedAt = Date.now()
    }

    if (this.eventBus) {
      this.eventBus.publish('policyOptimizer:recommendationApplied', {
        timestamp: Date.now(),
        recommendationType: rec.type,
        newValue: rec.suggestedValue
      })
    }

    return { success: true, appliedRecommendation: rec }
  }

  /**
   * Get current policies
   */
  getPolicies() {
    return {
      timestamp: Date.now(),
      policies: this.policies
    }
  }

  /**
   * Get recommendations
   */
  getRecommendations() {
    return {
      timestamp: Date.now(),
      count: this.recommendations.length,
      recommendations: this.recommendations
    }
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory() {
    return {
      timestamp: Date.now(),
      count: this.optimizationHistory.length,
      history: this.optimizationHistory.slice(-10) // Last 10
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      isRunning: this.isRunning,
      optimizationInterval: this.config.optimizationInterval,
      complianceHistorySize: this.complianceHistory.length,
      costHistorySize: this.costHistory.length,
      recommendationsCount: this.recommendations.length,
      optimizationCount: this.optimizationHistory.length
    }
  }
}

module.exports = { PolicyOptimizer }
