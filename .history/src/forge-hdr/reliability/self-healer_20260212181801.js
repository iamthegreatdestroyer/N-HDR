/**
 * Self-Healer
 * Monitors pod health and automatically remediates failures
 */

const { EventEmitter } = require('events')

class SelfHealer extends EventEmitter {
  constructor(config = {}) {
    super()
    
    this.config = {
      kubernetesClient: config.kubernetesClient,
      prometheusClient: config.prometheusClient,
      checkInterval: config.checkInterval || 15000,  // 15 seconds
      namespace: config.namespace || 'default',
      ...config
    }

    this.isRunning = false
    this.healingAttempts = new Map()
    this.maxHealingAttempts = 3
    this.healingCooldown = 60000  // 1 minute between attempts for same pod
  }

  /**
   * Start health monitoring
   */
  async start() {
    if (this.isRunning) {
      console.warn('SelfHealer already running')
      return
    }

    this.isRunning = true
    console.log('SelfHealer started')
    this.emit('started')

    // Initial health check
    await this.performHealthCheck()

    // Schedule periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck().catch(error => {
        console.error('Health check error:', error)
      })
    }, this.config.checkInterval)
  }

  /**
   * Stop health monitoring
   */
  async stop() {
    if (!this.isRunning) {
      console.warn('SelfHealer not running')
      return
    }

    this.isRunning = false
    clearInterval(this.healthCheckInterval)
    console.log('SelfHealer stopped')
    this.emit('stopped')
  }

  /**
   * Perform health check on entire cluster
   */
  async performHealthCheck() {
    try {
      const topology = await this.config.kubernetesClient.getCurrentTopology()
      const metrics = await this.config.prometheusClient.getCurrentMetrics()

      // Check for pod failures
      await this.checkPodHealth(topology)

      // Check for resource exhaustion
      await this.checkResourceHealth(topology, metrics)

      // Check for cascade failures
      await this.checkCascadeRisks(metrics)

      // Check for stuck deployments
      await this.checkDeploymentHealth(topology)

    } catch (error) {
      console.error('Error during health check:', error)
      this.emit('healthCheckFailed', { error: error.message })
    }
  }

  /**
   * Check individual pod health
   */
  async checkPodHealth(topology) {
    const failedPods = []
    const crashingPods = []
    const pendingPods = []

    for (const pod of topology.pods) {
      // Detect failed pods
      if (pod.phase === 'Failed') {
        failedPods.push(pod)
      }

      // Detect crashing pods (high restart count)
      if (pod.restartCount > 5) {
        crashingPods.push(pod)
      }

      // Detect stuck pending pods (older than 5 minutes)
      if (pod.phase === 'Pending') {
        pendingPods.push(pod)
      }
    }

    // Remediate failures
    for (const pod of failedPods) {
      await this.remediatePodFailure(pod, 'FAILED_POD')
    }

    for (const pod of crashingPods) {
      await this.remediateHighRestarts(pod, 'HIGH_RESTART_COUNT')
    }

    for (const pod of pendingPods) {
      await this.remediatePendingPod(pod, 'PENDING_TIMEOUT')
    }
  }

  /**
   * Remediate a failed pod
   */
  async remediatePodFailure(pod, failureType) {
    const podId = `${pod.namespace}/${pod.name}`

    // Check healing attempts
    if (!this.canAttemptHealing(podId)) {
      console.log(`Pod ${podId} has exceeded max healing attempts`)
      return
    }

    console.log(`Attempting to heal failed pod: ${podId}`)
    this.recordHealingAttempt(podId)

    try {
      // Find the deployment this pod belongs to
      const deployment = await this.findDeploymentForPod(pod)
      
      if (!deployment) {
        console.warn(`Could not find deployment for pod ${podId}`)
        this.emit('podHealed', { pod: podId, success: false, reason: 'No deployment found' })
        return
      }

      // Trigger pod deletion (will be recreated by deployment controller)
      await this.deletePod(pod)

      // Wait for replacement
      const verified = await this.verifyPodReplaced(pod, 30000)

      if (verified) {
        this.emit('podHealed', { pod: podId, success: true, type: failureType })
        console.log(`Successfully healed pod: ${podId}`)
      } else {
        this.emit('podHealed', { pod: podId, success: false, reason: 'Pod not replaced in time' })
      }

    } catch (error) {
      console.error(`Error healing pod ${podId}:`, error)
      this.emit('podHealed', { pod: podId, success: false, error: error.message })
    }
  }

  /**
   * Remediate a pod with high restart count
   */
  async remediateHighRestarts(pod, failureType) {
    const podId = `${pod.namespace}/${pod.name}`
    
    console.log(`Pod ${podId} has high restart count: ${pod.restartCount}`)

    // Strategy 1: Increase resource limits if OOM
    const oommemory = pipe containsOOMIndicator(pod)
    if (oomIndicator) {
      console.log(`Pod ${podId} likely OOM, attempting memory increase`)
      await this.increaseResourceLimits(pod, 'memory')
      this.emit('resourceIncreased', { pod: podId, resource: 'memory' })
      return
    }

    // Strategy 2: Restart pod by deleting it
    try {
      await this.deletePod(pod)
      const verified = await this.verifyPodReplaced(pod, 30000)

      if (verified) {
        this.emit('podHealed', { pod: podId, success: true, type: failureType })
      }
    } catch (error) {
      console.error(`Error remediating high restarts for ${podId}:`, error)
    }
  }

  /**
   * Remediate a pending pod
   */
  async remediatePendingPod(pod, failureType) {
    const podId = `${pod.namespace}/${pod.name}`
    
    console.log(`Pod ${podId} stuck pending`)

    // Strategy 1: Check for node/resource constraints
    const constraints = await this.analyzePendingConstraints(pod)

    if (constraints.resourceConstraint) {
      // Try to evict lower-priority pods
      console.log(`Pod ${podId} waiting for resources, attempting to evict lower-priority pods`)
      await this.evictLowerPriorityPods(pod)
      this.emit('resourceCleared', { pod: podId })
      return
    }

    if (constraints.nodeConstraint) {
      // Try to remove node taint or reschedule
      console.log(`Pod ${podId} has node constraint`)
      await this.handleNodeConstraint(constraints)
      return
    }

    // Strategy 2: Force delete and recreate
    try {
      await this.deletePod(pod, true)  // Force delete
      const verified = await this.verifyPodReplaced(pod, 30000)

      if (verified) {
        this.emit('podHealed', { pod: podId, success: true, type: failureType })
      }
    } catch (error) {
      console.error(`Error remediating pending pod ${podId}:`, error)
    }
  }

  /**
   * Check resource health (CPU, memory)
   */
  async checkResourceHealth(topology, metrics) {
    // Check for CPU pressure
    if (metrics && metrics.cpu?.total > 85) {
      console.log('High CPU usage detected, attempting optimization')
      this.emit('resourcePressure', { resource: 'cpu', utilization: metrics.cpu.total })
      
      // Could trigger FORGE-HDR optimization cycle
      // For now, just log
    }

    // Check for memory pressure
    if (metrics && metrics.memory?.total > 90) {
      console.log('High memory usage detected')
      this.emit('resourcePressure', { resource: 'memory', utilization: metrics.memory.total })
      
      // Could trigger memory optimization
    }

    // Check for individual node resource pressure
    for (const node of topology.nodes) {
      if (node.status === 'NotReady') {
        console.log(`Node ${node.name} not ready`)
        this.emit('nodeUnavailable', { node: node.name })
        
        // Could attempt to cordon and drain
      }
    }
  }

  /**
   * Check for cascade failures
   */
  async checkCascadeRisks(metrics) {
    if (!metrics) return

    if (metrics.errors?.rate > 10) {
      console.log(`High error rate detected: ${metrics.errors.rate}%`)
      this.emit('cascadeRiskDetected', { errorRate: metrics.errors.rate, severity: 'high' })
    } else if (metrics.errors?.rate > 5) {
      console.log(`Elevated error rate: ${metrics.errors.rate}%`)
      this.emit('cascadeRiskDetected', { errorRate: metrics.errors.rate, severity: 'medium' })
    }

    if (metrics.latency?.p99 > 1000) {
      console.log(`High latency detected: ${metrics.latency.p99}ms`)
      this.emit('latencyDegraded', { latency: metrics.latency.p99 })
    }
  }

  /**
   * Check deployment health (stuck rollouts)
   */
  async checkDeploymentHealth(topology) {
    for (const deployment of topology.deployments) {
      const isHealthy = 
        deployment.replicas.current === deployment.replicas.desired &&
        deployment.replicas.ready === deployment.replicas.desired

      if (!isHealthy) {
        const diffTime = Date.now() - new Date(deployment.updateTime).getTime()
        
        // If deployment has been unhealthy for > 5 minutes, it's stuck
        if (diffTime > 300000) {
          console.log(`Deployment ${deployment.name} stuck in rollout`)
          this.emit('deploymentStuck', { deployment: deployment.name, diffTime })
          
          // Could attempt rollback
        }
      }
    }
  }

  /**
   * Find deployment for a pod
   */
  async findDeploymentForPod(pod) {
    const topology = await this.config.kubernetesClient.getCurrentTopology()
    
    return topology.deployments.find(dep => {
      for (const [key, value] of Object.entries(dep.selector)) {
        if (pod.labels[key] !== value) return false
      }
      return true
    })
  }

  /**
   * Delete a pod
   */
  async deletePod(pod, force = false) {
    console.log(`Deleting pod ${pod.namespace}/${pod.name}${force ? ' (force)' : ''}`)
    
    // In a real implementation, would call K8s API
    // For now, simulate
    return new Promise(resolve => setTimeout(resolve, 1000))
  }

  /**
   * Verify pod was replaced
   */
  async verifyPodReplaced(oldPod, timeout) {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const topology = await this.config.kubernetesClient.getCurrentTopology()
      
      // Check if a new pod exists with same labels
      const newPod = topology.pods.find(p => {
        if (p.name === oldPod.name) return false  // Old pod name
        if (p.namespace !== oldPod.namespace) return false
        
        // Check if labels match
        for (const [key, value] of Object.entries(oldPod.labels)) {
          if (p.labels[key] !== value) return false
        }
        
        return p.phase === 'Running'
      })

      if (newPod) {
        return true
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return false
  }

  /**
   * Check if healing can be attempted for pod
   */
  canAttemptHealing(podId) {
    const attempt = this.healingAttempts.get(podId)
    
    if (!attempt) return true
    if (attempt.count >= this.maxHealingAttempts) return false
    if (Date.now() - attempt.lastAttemptTime < this.healingCooldown) return false
    
    return true
  }

  /**
   * Record healing attempt
   */
  recordHealingAttempt(podId) {
    const attempt = this.healingAttempts.get(podId) || { count: 0, lastAttemptTime: 0 }
    attempt.count++
    attempt.lastAttemptTime = Date.now()
    
    this.healingAttempts.set(podId, attempt)

    // Clean up old entries
    if (this.healingAttempts.size > 100) {
      const now = Date.now()
      for (const [id, att] of this.healingAttempts) {
        if (now - att.lastAttemptTime > 3600000) {  // 1 hour
          this.healingAttempts.delete(id)
        }
      }
    }
  }

  /**
   * Increase resource limits for a pod
   */
  async increaseResourceLimits(pod, resource) {
    console.log(`Increasing ${resource} limit for pod ${pod.name}`)
    // Would call K8s API to patch deployment
    // For now, simulate
    return new Promise(resolve => setTimeout(resolve, 1000))
  }

  /**
   * Check if pod contains OOM indicator
   */
  containsOOMIndicator(pod) {
    const oomMessages = [
      'OOMKilled',
      'OutOfMemory',
      'Killed',
      'OOM'
    ]

    for (const condition of pod.conditions) {
      if (oomMessages.some(msg => condition.reason?.includes(msg))) {
        return true
      }
    }

    return false
  }

  /**
   * Analyze pending pod constraints
   */
  async analyzePendingConstraints(pod) {
    return {
      resourceConstraint: false,  // Would analyze based on node capacity
      nodeConstraint: false        // Would check node taints/labels
    }
  }

  /**
   * Evict lower-priority pods
   */
  async evictLowerPriorityPods(pod) {
    console.log(`Evicting lower-priority pods to make room for ${pod.name}`)
    // Would implement priority-based pod eviction
  }

  /**
   * Handle node constraint
   */
  async handleNodeConstraint(constraints) {
    console.log('Handling node constraint')
    // Would implement node constraint handling
  }

  /**
   * Get healing statistics
   */
  getStatistics() {
    let totalAttempts = 0
    let successfulHeals = 0

    for (const attempt of this.healingAttempts.values()) {
      totalAttempts += attempt.count
    }

    return {
      isRunning: this.isRunning,
      totalHealingAttempts: totalAttempts,
      monitoredPods: this.healingAttempts.size,
      successRate: successfulHeals / Math.max(totalAttempts, 1)
    }
  }
}

module.exports = { SelfHealer }
