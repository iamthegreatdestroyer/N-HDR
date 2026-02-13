/**
 * Resource Optimizer
 * Main optimization engine for HDR cluster resources
 */

const { EventEmitter } = require('events')

class ResourceOptimizer extends EventEmitter {
  constructor(config = {}) {
    super()

    this.config = {
      kubernetesClient: config.kubernetesClient,
      prometheusClient: config.prometheusClient,
      topologyAnalyzer: config.topologyAnalyzer,
      costTracker: config.costTracker,
      circuitBreaker: config.circuitBreaker,
      selfHealer: config.selfHealer,
      optimizationInterval: config.optimizationInterval || 60000,  // 1 minute
      aggressiveness: config.aggressiveness || 0.5,  // 0-1 scale
      ...config
    }

    this.optimizations = []
    this.appliedOptimizations = new Map()
    this.optimizationHistory = []
    this.metrics = {
      totalOptimizations: 0,
      successfulOptimizations: 0,
      failedOptimizations: 0,
      costSavings: 0,
      performanceImprovement: 0
    }

    this.isRunning = false
  }

  /**
   * Start optimization cycle
   */
  async start() {
    if (this.isRunning) {
      console.warn('Optimizer already running')
      return
    }

    this.isRunning = true
    console.log('Resource optimizer started')
    this.emit('started')

    // Initial optimization pass
    await this.performOptimization()

    // Schedule periodic optimization
    this.optimizationInterval = setInterval(() => {
      this.performOptimization().catch(error => {
        console.error('Error during optimization:', error)
      })
    }, this.config.optimizationInterval)
  }

  /**
   * Stop optimization
   */
  async stop() {
    if (!this.isRunning) {
      console.warn('Optimizer not running')
      return
    }

    this.isRunning = false
    clearInterval(this.optimizationInterval)
    console.log('Resource optimizer stopped')
    this.emit('stopped')
  }

  /**
   * Perform optimization cycle
   */
  async performOptimization() {
    try {
      console.log('Starting optimization cycle')

      // Collect metrics and topology
      const topology = this.config.topologyAnalyzer?.topology || {}
      const metrics = await this.config.prometheusClient?.getCurrentMetrics()

      if (!topology.pods || topology.pods.length === 0) {
        console.warn('No topology data available')
        return
      }

      // Identify optimization opportunities
      const opportunities = await this.identifyOptimizations(topology, metrics)

      console.log(`Found ${opportunities.length} optimization opportunities`)

      // Evaluate and rank opportunities
      const ranked = this.rankOptimizations(opportunities)

      // Apply top opportunities  
      const applied = await this.applyOptimizations(ranked)

      // Record results
      this.recordOptimizationCycle({
        opportunitiesFound: opportunities.length,
        opportunitiesApplied: applied.length,
        totalCostSavings: applied.reduce((sum, opt) => sum + opt.estimatedSavings, 0),
        improvements: this.calculateImprovements(applied)
      })

      this.emit('optimizationCycleComplete', {
        opportunities: opportunities.length,
        applied: applied.length,
        improvements: this.calculateImprovements(applied)
      })

    } catch (error) {
      console.error('Error during optimization cycle:', error)
      this.emit('optimizationCycleFailed', { error: error.message })
    }
  }

  /**
   * Identify optimization opportunities
   */
  async identifyOptimizations(topology, metrics) {
    const opportunities = []

    // Strategy 1: Scale down over-provisioned pods
    opportunities.push(...this.findOverProvisionedPods(topology, metrics))

    // Strategy 2: Consolidate workloads
    opportunities.push(...this.findConsolidationOpportunities(topology))

    // Strategy 3: Scale to zero idle workloads
    opportunities.push(...this.findIdleWorkloads(topology, metrics))

    // Strategy 4: Optimize resource requests/limits
    opportunities.push(...this.findResourceRequestMismatches(topology, metrics))

    // Strategy 5: Vertical scaling
    opportunities.push(...this.findVerticalScalingOpportunities(topology, metrics))

    // Strategy 6: Node consolidation
    opportunities.push(...this.findNodeConsolidationOpportunities(topology, metrics))

    // Strategy 7: Network optimization
    opportunities.push(...this.findNetworkOptimizations(topology))

    return opportunities
  }

  /**
   * Find over-provisioned pods
   */
  findOverProvisionedPods(topology, metrics) {
    const opportunities = []

    for (const pod of topology.pods) {
      const podMetrics = metrics?.pods?.[`${pod.namespace}/${pod.name}`]
      if (!podMetrics) continue

      const cpuUsage = podMetrics.cpu || 0
      const memoryUsage = podMetrics.memory || 0

      const cpuRequest = pod.requests?.cpu || 0.1
      const memoryRequest = pod.requests?.memory || 128

      // If using < 30% of requests, opportunity to reduce
      if (cpuUsage < cpuRequest * 0.3 || memoryUsage < memoryRequest * 0.3) {
        const newCpu = Math.max(cpuUsage * 1.2, 0.05)  // Add 20% headroom
        const newMemory = Math.max(memoryUsage * 1.2, 64)

        opportunities.push({
          type: 'cpu-downscale',
          pod: pod.name,
          namespace: pod.namespace,
          currentRequest: { cpu: cpuRequest, memory: memoryRequest },
          recommendedRequest: { cpu: newCpu, memory: newMemory },
          estimatedSavings: (cpuRequest - newCpu) * 30 + (memoryRequest - newMemory) * 0.05,
          confidence: 0.9,
          riskLevel: 'low'
        })
      }
    }

    return opportunities
  }

  /**
   * Find workload consolidation opportunities
   */
  findConsolidationOpportunities(topology) {
    const opportunities = []

    // Group pods by namespace
    const byNamespace = new Map()
    for (const pod of topology.pods) {
      if (!byNamespace.has(pod.namespace)) {
        byNamespace.set(pod.namespace, [])
      }
      byNamespace.get(pod.namespace).push(pod)
    }

    // Look for namespaces with few pods spread across many nodes
    for (const [namespace, pods] of byNamespace) {
      if (pods.length >= 2 && pods.length <= 5) {
        const nodes = new Set(pods.map(p => p.node))

        if (nodes.size > 1) {
          opportunities.push({
            type: 'consolidate-workload',
            namespace,
            podCount: pods.length,
            nodeCount: nodes.size,
            estimatedSavings: nodes.size * 10,  // Rough estimate
            confidence: 0.7,
            riskLevel: 'medium'
          })
        }
      }
    }

    return opportunities
  }

  /**
   * Find idle workloads
   */
  findIdleWorkloads(topology, metrics) {
    const opportunities = []

    for (const pod of topology.pods) {
      const podMetrics = metrics?.pods?.[`${pod.namespace}/${pod.name}`]
      if (!podMetrics) continue

      // If pod has zero requests for > 5 minutes, might be idle
      if (podMetrics.cpu === 0 && podMetrics.memory === 0 && podMetrics.uptime > 300) {
        opportunities.push({
          type: 'scale-to-zero',
          pod: pod.name,
          namespace: pod.namespace,
          estimatedSavings: (pod.requests?.cpu || 0.1) * 24,
          confidence: 0.5,
          riskLevel: 'high'
        })
      }
    }

    return opportunities
  }

  /**
   * Find resource request mismatches
   */
  findResourceRequestMismatches(topology, metrics) {
    const opportunities = []

    for (const pod of topology.pods) {
      const podMetrics = metrics?.pods?.[`${pod.namespace}/${pod.name}`]
      if (!podMetrics) continue

      const peakCpu = podMetrics.peakCpu || podMetrics.cpu
      const peakMemory = podMetrics.peakMemory || podMetrics.memory

      const cpuRequest = pod.requests?.cpu || 0.1
      const memoryRequest = pod.requests?.memory || 128

      // If peak usage is > 80% of request, request might be too low
      if (peakCpu > cpuRequest * 0.8) {
        const newCpu = peakCpu * 1.25  // Add 25% headroom

        opportunities.push({
          type: 'increase-cpu-request',
          pod: pod.name,
          namespace: pod.namespace,
          currentRequest: cpuRequest,
          recommendedRequest: newCpu,
          estimatedSavings: -5,  // Negative = cost increase, but prevents OOM
          confidence: 0.95,
          riskLevel: 'low'
        })
      }
    }

    return opportunities
  }

  /**
   * Find vertical scaling opportunities
   */
  findVerticalScalingOpportunities(topology, metrics) {
    const opportunities = []

    // Group pods by deployment
    const byDeployment = new Map()
    for (const pod of topology.pods) {
      const depName = pod.owner?.name || 'unknown'
      if (!byDeployment.has(depName)) {
        byDeployment.set(depName, [])
      }
      byDeployment.get(depName).push(pod)
    }

    // Look for deployments with low replica count but high per-pod load
    for (const [depName, pods] of byDeployment) {
      if (pods.length === 1 && pods[0].requests?.cpu > 2) {
        opportunities.push({
          type: 'horizontal-scale',
          deployment: depName,
          currentReplicas: 1,
          recommendedReplicas: 3,
          estimatedSavings: 0,  // No direct savings, but improved reliability
          confidence: 0.7,
          riskLevel: 'low'
        })
      }
    }

    return opportunities
  }

  /**
   * Find node consolidation opportunities
   */
  findNodeConsolidationOpportunities(topology, metrics) {
    const opportunities = []

    const nodeUtilization = new Map()
    for (const node of topology.nodes) {
      let totalCpu = 0
      let totalMemory = 0

      for (const pod of topology.pods) {
        if (pod.node === node.name) {
          totalCpu += pod.requests?.cpu || 0.1
          totalMemory += pod.requests?.memory || 128
        }
      }

      const cpuPercent = totalCpu / (node.capacity?.cpu || 1)
      const memPercent = totalMemory / (node.capacity?.memory || 1024)

      nodeUtilization.set(node.name, {
        cpu: cpuPercent,
        memory: memPercent,
        avgUtilization: (cpuPercent + memPercent) / 2
      })
    }

    // Find low utilization nodes
    for (const [nodeName, util] of nodeUtilization) {
      if (util.avgUtilization < 0.3) {  // Less than 30% utilized
        opportunities.push({
          type: 'scale-down-node',
          node: nodeName,
          utilization: util.avgUtilization,
          estimatedSavings: 100,  // Cost of one node
          confidence: 0.8,
          riskLevel: 'high'
        })
      }
    }

    return opportunities
  }

  /**
   * Find network optimization opportunities
   */
  findNetworkOptimizations(topology) {
    const opportunities = []

    const analyzer = this.config.topologyAnalyzer
    if (analyzer?.bottlenecks && analyzer.bottlenecks.length > 0) {
      opportunities.push({
        type: 'network-optimization',
        bottleneckCount: analyzer.bottlenecks.length,
        estimatedSavings: analyzer.bottlenecks.length * 5,
        confidence: 0.6,
        riskLevel: 'medium'
      })
    }

    return opportunities
  }

  /**
   * Rank optimizations by ROI and safety
   */
  rankOptimizations(opportunities) {
    return opportunities
      .map(opp => ({
        ...opp,
        score: this.calculateOptimizationScore(opp)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.ceil(opportunities.length * this.config.aggressiveness))
  }

  /**
   * Calculate optimization score
   */
  calculateOptimizationScore(opportunity) {
    let score = 0

    // Factor: Estimated savings
    score += opportunity.estimatedSavings * 0.4

    // Factor: Confidence level
    score += opportunity.confidence * 100 * 0.3

    // Factor: Risk level (lower risk = higher score)
    const riskFactor = {
      'low': 1.0,
      'medium': 0.7,
      'high': 0.3
    }
    score += riskFactor[opportunity.riskLevel] * 100 * 0.3

    return score
  }

  /**
   * Apply optimizations
   */
  async applyOptimizations(rankedOptimizations) {
    const applied = []

    for (const opportunity of rankedOptimizations) {
      try {
        // Check circuit breaker before applying
        if (this.config.circuitBreaker) {
          await this.config.circuitBreaker.execute(() => this.applyOptimization(opportunity))
        } else {
          await this.applyOptimization(opportunity)
        }

        applied.push(opportunity)
        this.metrics.successfulOptimizations++

        this.emit('optimizationApplied', {
          type: opportunity.type,
          savings: opportunity.estimatedSavings
        })

      } catch (error) {
        console.error(`Failed to apply ${opportunity.type}:`, error)
        this.metrics.failedOptimizations++

        this.emit('optimizationFailed', {
          type: opportunity.type,
          error: error.message
        })
      }

      this.metrics.totalOptimizations++
    }

    return applied
  }

  /**
   * Apply a single optimization
   */
  async applyOptimization(opportunity) {
    console.log(`Applying optimization: ${opportunity.type}`)

    switch (opportunity.type) {
      case 'cpu-downscale':
        await this.applyResourceReduction(opportunity)
        break

      case 'consolidate-workload':
        await this.consolidateWorkload(opportunity)
        break

      case 'scale-to-zero':
        await this.scaleToZero(opportunity)
        break

      case 'increase-cpu-request':
        await this.increaseResourceRequest(opportunity)
        break

      case 'horizontal-scale':
        await this.scaleHorizontally(opportunity)
        break

      case 'scale-down-node':
        await this.scaleDownNode(opportunity)
        break

      case 'network-optimization':
        await this.optimizeNetwork(opportunity)
        break

      default:
        throw new Error(`Unknown optimization type: ${opportunity.type}`)
    }

    // Track in cost tracker
    if (this.config.costTracker) {
      this.config.costTracker.trackOptimization({
        type: opportunity.type,
        resourceReduction: opportunity.estimatedSavings,
        estimatedCostSavings: opportunity.estimatedSavings,
        duration: 3600000  // 1 hour
      })
    }
  }

  /**
   * Apply resource reduction
   */
  async applyResourceReduction(opportunity) {
    console.log(`Reducing CPU/memory for ${opportunity.pod}`)
    // Would call K8s API to patch pod
  }

  /**
   * Consolidate workload
   */
  async consolidateWorkload(opportunity) {
    console.log(`Consolidating workload in ${opportunity.namespace}`)
    // Would implement pod consolidation logic
  }

  /**
   * Scale to zero
   */
  async scaleToZero(opportunity) {
    console.log(`Scaling ${opportunity.pod} to zero`)
    // Would update deployment replica count
  }

  /**
   * Increase resource request
   */
  async increaseResourceRequest(opportunity) {
    console.log(`Increasing CPU request for ${opportunity.pod}`)
    // Would patch deployment
  }

  /**
   * Horizontal scaling
   */
  async scaleHorizontally(opportunity) {
    console.log(`Scaling ${opportunity.deployment} to ${opportunity.recommendedReplicas} replicas`)
    // Would update deployment replica count
  }

  /**
   * Scale down node
   */
  async scaleDownNode(opportunity) {
    console.log(`Scaling down node ${opportunity.node}`)
    // Would drain and remove node
  }

  /**
   * Optimize network
   */
  async optimizeNetwork(opportunity) {
    console.log(`Optimizing network for ${opportunity.bottleneckCount} bottlenecks`)
    // Would implement network policy changes
  }

  /**
   * Record optimization cycle
   */
  recordOptimizationCycle(result) {
    this.optimizationHistory.push({
      timestamp: Date.now(),
      ...result
    })

    // Keep reasonable history size
    if (this.optimizationHistory.length > 1000) {
      this.optimizationHistory.shift()
    }

    this.metrics.costSavings += result.totalCostSavings
  }

  /**
   * Calculate improvements
   */
  calculateImprovements(applied) {
    return {
      totalSavings: applied.reduce((sum, opt) => sum + opt.estimatedSavings, 0),
      optimizationCount: applied.length,
      avgConfidence: applied.length > 0 ? 
        applied.reduce((sum, opt) => sum + opt.confidence, 0) / applied.length : 0
    }
  }

  /**
   * Get optimizer statistics
   */
  getStatistics() {
    return {
      isRunning: this.isRunning,
      metrics: {
        ...this.metrics,
        successRate: this.metrics.totalOptimizations > 0 ? 
          this.metrics.successfulOptimizations / this.metrics.totalOptimizations : 0
      },
      recentOptimizations: this.optimizationHistory.slice(-10),
      appliedOptimizations: Array.from(this.appliedOptimizations.values())
    }
  }
}

module.exports = { ResourceOptimizer }
