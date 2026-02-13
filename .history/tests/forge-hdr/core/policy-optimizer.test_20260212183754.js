/**
 * Policy Optimizer Tests
 */

const { PolicyOptimizer } = require('../../src/forge-hdr/core/policy-optimizer')

describe('PolicyOptimizer', () => {
  let optimizer
  let eventBus

  beforeEach(() => {
    eventBus = {
      subscribers: {},
      subscribe(event, callback) {
        if (!this.subscribers[event]) {
          this.subscribers[event] = []
        }
        this.subscribers[event].push(callback)
      },
      publish(event, data) {
        if (this.subscribers[event]) {
          this.subscribers[event].forEach((cb) => cb(data))
        }
      }
    }

    optimizer = new PolicyOptimizer({
      confidenceThreshold: 0.75,
      historyRetention: 30,
      eventBus
    })
  })

  afterEach(() => {
    if (optimizer.isRunning) {
      optimizer.stop()
    }
  })

  describe('Initialization', () => {
    it('should initialize with default policies', () => {
      const policies = optimizer.getPolicies()
      expect(policies.policies.resourceAllocation).toBeDefined()
      expect(policies.policies.scalingPolicy).toBeDefined()
      expect(policies.policies.budgetPolicy).toBeDefined()
      expect(policies.policies.compliancePolicy).toBeDefined()
    })

    it('should have correct default values', () => {
      const policies = optimizer.getPolicies().policies
      expect(policies.budgetPolicy.monthlyBudget).toBe(10000)
      expect(policies.scalingPolicy.minReplicas).toBe(1)
      expect(policies.scalingPolicy.maxReplicas).toBe(10)
    })
  })

  describe('Start/Stop', () => {
    it('should start optimizer', async () => {
      await optimizer.start()
      expect(optimizer.isRunning).toBe(true)
    })

    it('should stop optimizer', async () => {
      await optimizer.start()
      await optimizer.stop()
      expect(optimizer.isRunning).toBe(false)
    })

    it('should not double-start', async () => {
      await optimizer.start()
      const warn = jest.spyOn(console, 'warn').mockImplementation()

      await optimizer.start()
      expect(warn).toHaveBeenCalledWith('Policy optimizer already running')

      warn.mockRestore()
    })
  })

  describe('Compliance Recording', () => {
    it('should record compliance reports', async () => {
      await optimizer.start()

      optimizer.onComplianceReport({
        violationCount: 3,
        resourcesChecked: 50,
        complianceRate: 94
      })

      expect(optimizer.complianceHistory.length).toBe(1)
      expect(optimizer.complianceHistory[0].violationCount).toBe(3)
      expect(optimizer.complianceHistory[0].complianceRate).toBe(94)
    })

    it('should maintain bounded history', async () => {
      await optimizer.start()

      for (let i = 0; i < 40; i++) {
        optimizer.onComplianceReport({
          violationCount: i,
          resourcesChecked: 50,
          complianceRate: 90
        })
      }

      expect(optimizer.complianceHistory.length).toBeLessThanOrEqual(30)
    })
  })

  describe('Cost Recording', () => {
    it('should record cost updates', async () => {
      await optimizer.start()

      optimizer.onCostUpdate({
        cost: 500,
        budget: 1000,
        percentageUsed: 50
      })

      expect(optimizer.costHistory.length).toBe(1)
      expect(optimizer.costHistory[0].cost).toBe(500)
      expect(optimizer.costHistory[0].percentageUsed).toBe(50)
    })
  })

  describe('Performance Recording', () => {
    it('should record performance updates', async () => {
      await optimizer.start()

      optimizer.onPerformanceUpdate({
        avgLatency: 120,
        cpuUsage: 65,
        memoryUsage: 72,
        errorRate: 0.5
      })

      expect(optimizer.performanceMetrics.avgLatency).toBe(120)
      expect(optimizer.performanceMetrics.cpuUsage).toBe(65)
    })
  })

  describe('Compliance Trend Analysis', () => {
    beforeEach(async () => {
      await optimizer.start()
    })

    it('should detect improving compliance', () => {
      const reports = [
        { violationCount: 10, resourcesChecked: 50, complianceRate: 80 },
        { violationCount: 8, resourcesChecked: 50, complianceRate: 84 },
        { violationCount: 5, resourcesChecked: 50, complianceRate: 90 },
        { violationCount: 3, resourcesChecked: 50, complianceRate: 94 }
      ]

      reports.forEach((r) => optimizer.onComplianceReport(r))

      const trends = optimizer.analyzeComplianceTrends()
      expect(trends.trend).toBe('improving')
      expect(trends.avgViolations).toBeLessThan(7)
    })

    it('should detect deteriorating compliance', () => {
      const reports = [
        { violationCount: 1, resourcesChecked: 50, complianceRate: 98 },
        { violationCount: 3, resourcesChecked: 50, complianceRate: 94 },
        { violationCount: 6, resourcesChecked: 50, complianceRate: 88 },
        { violationCount: 8, resourcesChecked: 50, complianceRate: 84 }
      ]

      reports.forEach((r) => optimizer.onComplianceReport(r))

      const trends = optimizer.analyzeComplianceTrends()
      expect(trends.trend).toBe('deteriorating')
      expect(trends.avgViolations).toBeGreaterThan(4)
    })

    it('should return null with insufficient data', () => {
      const trends = optimizer.analyzeComplianceTrends()
      expect(trends).toBeNull()
    })
  })

  describe('Cost Trend Analysis', () => {
    beforeEach(async () => {
      await optimizer.start()
    })

    it('should detect accelerating costs', () => {
      const costs = [
        { cost: 100, budget: 1000, percentageUsed: 10 },
        { cost: 300, budget: 1000, percentageUsed: 30 },
        { cost: 600, budget: 1000, percentageUsed: 60 },
        { cost: 850, budget: 1000, percentageUsed: 85 }
      ]

      costs.forEach((c) => optimizer.onCostUpdate(c))

      const trends = optimizer.analyzeCostTrends()
      expect(trends.trend).toBe('accelerating')
      expect(trends.avgPercentageUsed).toBeGreaterThan(50)
    })

    it('should detect decelerating costs', () => {
      const costs = [
        { cost: 900, budget: 1000, percentageUsed: 90 },
        { cost: 700, budget: 1000, percentageUsed: 70 },
        { cost: 400, budget: 1000, percentageUsed: 40 },
        { cost: 150, budget: 1000, percentageUsed: 15 }
      ]

      costs.forEach((c) => optimizer.onCostUpdate(c))

      const trends = optimizer.analyzeCostTrends()
      expect(trends.trend).toBe('decelerating')
    })
  })

  describe('Compliance Recommendations', () => {
    beforeEach(async () => {
      await optimizer.start()
    })

    it('should recommend strictness increase for deteriorating compliance', () => {
      for (let i = 0; i < 10; i++) {
        optimizer.onComplianceReport({
          violationCount: 7 + i,
          resourcesChecked: 50,
          complianceRate: 86 - i
        })
      }

      const recs = optimizer.generateComplianceRecommendations()
      const strictnessRec = recs.find((r) => r.type === 'COMPLIANCE_STRICTNESS')

      expect(strictnessRec).toBeDefined()
      expect(strictnessRec.severity).toBe('HIGH')
      expect(strictnessRec.suggestedValue).toBe('strict')
    })

    it('should recommend auto-remediation', () => {
      for (let i = 0; i < 10; i++) {
        optimizer.onComplianceReport({
          violationCount: 8,
          resourcesChecked: 50,
          complianceRate: 84
        })
      }

      const recs = optimizer.generateComplianceRecommendations()
      const remediationRec = recs.find((r) => r.type === 'AUTO_REMEDIATION')

      expect(remediationRec).toBeDefined()
      expect(remediationRec.suggestedValue).toBe(true)
    })

    it('should recommend relaxation for improving compliance', () => {
      for (let i = 0; i < 10; i++) {
        optimizer.onComplianceReport({
          violationCount: 2 - Math.min(i * 0.1, 1),
          resourcesChecked: 50,
          complianceRate: 98 + i
        })
      }

      const recs = optimizer.generateComplianceRecommendations()
      const relaxRec = recs.find((r) => r.type === 'COMPLIANCE_RELAXATION')

      expect(relaxRec).toBeDefined()
      expect(relaxRec.severity).toBe('LOW')
    })
  })

  describe('Budget Recommendations', () => {
    beforeEach(async () => {
      await optimizer.start()
    })

    it('should recommend budget increase for accelerating costs', () => {
      for (let i = 0; i < 10; i++) {
        optimizer.onCostUpdate({
          cost: 800 + i * 10,
          budget: 1000,
          percentageUsed: 80 + i
        })
      }

      const recs = optimizer.generateBudgetRecommendations()
      const budgetRec = recs.find((r) => r.type === 'BUDGET_INCREASE')

      expect(budgetRec).toBeDefined()
      expect(budgetRec.severity).toBe('HIGH')
      expect(budgetRec.suggestedValue).toBeGreaterThan(1000)
    })

    it('should recommend resource optimization', () => {
      for (let i = 0; i < 10; i++) {
        optimizer.onCostUpdate({
          cost: 850,
          budget: 1000,
          percentageUsed: 85
        })
      }

      const recs = optimizer.generateBudgetRecommendations()
      const optimRec = recs.find((r) => r.type === 'RESOURCE_OPTIMIZATION')

      expect(optimRec).toBeDefined()
    })

    it('should recommend budget reduction for decelerating costs', () => {
      for (let i = 0; i < 10; i++) {
        optimizer.onCostUpdate({
          cost: 400 - i * 10,
          budget: 1000,
          percentageUsed: 40 - i
        })
      }

      const recs = optimizer.generateBudgetRecommendations()
      const reduceRec = recs.find((r) => r.type === 'BUDGET_REDUCTION')

      expect(reduceRec).toBeDefined()
      expect(reduceRec.severity).toBe('LOW')
    })
  })

  describe('Scaling Recommendations', () => {
    beforeEach(async () => {
      await optimizer.start()
    })

    it('should recommend scale up for high CPU usage', () => {
      optimizer.onPerformanceUpdate({
        avgLatency: 300,
        cpuUsage: 85,
        memoryUsage: 50,
        errorRate: 0.1
      })

      const recs = optimizer.generateScalingRecommendations()
      const cpuRec = recs.find((r) => r.type === 'SCALE_UP_CPU')

      expect(cpuRec).toBeDefined()
      expect(cpuRec.severity).toBe('HIGH')
    })

    it('should recommend scale up for high memory usage', () => {
      optimizer.onPerformanceUpdate({
        avgLatency: 200,
        cpuUsage: 50,
        memoryUsage: 82,
        errorRate: 0.1
      })

      const recs = optimizer.generateScalingRecommendations()
      const memRec = recs.find((r) => r.type === 'SCALE_UP_MEMORY')

      expect(memRec).toBeDefined()
    })

    it('should recommend latency reduction for high latency', () => {
      optimizer.onPerformanceUpdate({
        avgLatency: 600,
        cpuUsage: 40,
        memoryUsage: 40,
        errorRate: 0.1
      })

      const recs = optimizer.generateScalingRecommendations()
      const latencyRec = recs.find((r) => r.type === 'REDUCE_LATENCY')

      expect(latencyRec).toBeDefined()
    })
  })

  describe('Policy Optimization', () => {
    beforeEach(async () => {
      await optimizer.start()
    })

    it('should generate recommendations during optimization', () => {
      optimizer.onPerformanceUpdate({
        avgLatency: 100,
        cpuUsage: 50,
        memoryUsage: 50
      })

      optimizer.optimizePolicies()

      expect(optimizer.optimizationHistory.length).toBe(1)
    })

    it('should publish optimization complete event', async () => {
      let eventFired = false
      eventBus.subscribe('policyOptimizer:optimizationComplete', () => {
        eventFired = true
      })

      optimizer.optimizePolicies()
      expect(eventFired).toBe(true)
    })
  })

  describe('Recommendation Application', () => {
    beforeEach(async () => {
      await optimizer.start()

      optimizer.recommendations = [
        {
          type: 'COMPLIANCE_STRICTNESS',
          suggestedValue: 'strict'
        },
        {
          type: 'BUDGET_INCREASE',
          suggestedValue: 12000
        },
        {
          type: 'SCALE_UP_CPU',
          suggestedValue: 3000
        }
      ]
    })

    it('should apply compliance strictness recommendation', () => {
      optimizer.applyRecommendation(0)
      expect(optimizer.policies.compliancePolicy.strictnessLevel).toBe('strict')
      expect(optimizer.policies.compliancePolicy.optimizedAt).toBeDefined()
    })

    it('should apply budget recommendation', () => {
      optimizer.applyRecommendation(1)
      expect(optimizer.policies.budgetPolicy.monthlyBudget).toBe(12000)
    })

    it('should apply CPU scaling recommendation', () => {
      optimizer.applyRecommendation(2)
      expect(optimizer.policies.resourceAllocation.maxCpu).toBe(3000)
    })

    it('should return error for invalid index', () => {
      const result = optimizer.applyRecommendation(99)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should publish recommendation applied event', async () => {
      let eventFired = false
      let eventData = null

      eventBus.subscribe('policyOptimizer:recommendationApplied', (data) => {
        eventFired = true
        eventData = data
      })

      optimizer.applyRecommendation(0)
      expect(eventFired).toBe(true)
      expect(eventData.recommendationType).toBe('COMPLIANCE_STRICTNESS')
    })
  })

  describe('Statistics', () => {
    it('should return statistics', async () => {
      await optimizer.start()
      optimizer.onComplianceReport({ violationCount: 5, resourcesChecked: 50, complianceRate: 90 })

      const stats = optimizer.getStatistics()
      expect(stats.isRunning).toBe(true)
      expect(stats.complianceHistorySize).toBe(1)
    })
  })

  describe('Performance Trend Analysis', () => {
    it('should analyze performance trends', async () => {
      await optimizer.start()

      optimizer.onPerformanceUpdate({
        avgLatency: 250,
        p95Latency: 500,
        p99Latency: 750,
        cpuUsage: 65,
        memoryUsage: 72,
        errorRate: 0.5
      })

      const trends = optimizer.analyzePerformanceTrends()
      expect(trends.latency).toBe(250)
      expect(trends.cpuUsage).toBe(65)
      expect(trends.memoryUsage).toBe(72)
    })
  })
})
