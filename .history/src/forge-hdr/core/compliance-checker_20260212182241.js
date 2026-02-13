/**
 * Compliance Checker
 * Validates pod/resource configurations against compliance policies
 */

class ComplianceChecker {
  constructor(config = {}) {
    this.config = {
      enableAutoCheck: config.enableAutoCheck !== false,
      checkInterval: config.checkInterval || 30000,
      severityThreshold: config.severityThreshold || 'medium',
      ...config
    }

    this.policies = new Map()
    this.violations = new Map()
    this.checkHistory = []
    this.complianceStatus = {}
    this.eventBus = config.eventBus
    this.isRunning = false

    this.initializeDefaultPolicies()
  }

  /**
   * Initialize default compliance policies
   */
  initializeDefaultPolicies() {
    // Resource limits policy
    this.addPolicy('resource-limits', {
      description: 'Pods must have CPU and memory limits',
      severity: 'high',
      check: (pod) => {
        if (!pod.spec?.containers) return { passed: true }

        const issues = []
        for (const container of pod.spec.containers) {
          if (!container.resources?.limits?.cpu) {
            issues.push(`Container ${container.name} missing CPU limit`)
          }
          if (!container.resources?.limits?.memory) {
            issues.push(`Container ${container.name} missing memory limit`)
          }
        }

        return {
          passed: issues.length === 0,
          issues
        }
      }
    })

    // Resource requests policy
    this.addPolicy('resource-requests', {
      description: 'Pods must have CPU and memory requests',
      severity: 'medium',
      check: (pod) => {
        if (!pod.spec?.containers) return { passed: true }

        const issues = []
        for (const container of pod.spec.containers) {
          if (!container.resources?.requests?.cpu) {
            issues.push(`Container ${container.name} missing CPU request`)
          }
          if (!container.resources?.requests?.memory) {
            issues.push(`Container ${container.name} missing memory request`)
          }
        }

        return {
          passed: issues.length === 0,
          issues
        }
      }
    })

    // Security context policy
    this.addPolicy('security-context', {
      description: 'Pods must have security context configured',
      severity: 'high',
      check: (pod) => {
        if (!pod.spec?.containers) return { passed: true }

        const issues = []
        for (const container of pod.spec.containers) {
          const sc = container.securityContext || pod.spec.securityContext

          if (!sc) {
            issues.push(`Container ${container.name} missing security context`)
          } else {
            if (sc.runAsNonRoot === undefined) {
              issues.push(`Container ${container.name} should run as non-root`)
            }
            if (sc.readOnlyRootFilesystem === undefined) {
              issues.push(`Container ${container.name} should have read-only root filesystem`)
            }
          }
        }

        return {
          passed: issues.length === 0,
          issues
        }
      }
    })

    // Health checks policy
    this.addPolicy('health-checks', {
      description: 'Pods should have liveness and readiness probes',
      severity: 'medium',
      check: (pod) => {
        if (!pod.spec?.containers) return { passed: true }

        const issues = []
        for (const container of pod.spec.containers) {
          if (!container.livenessProbe) {
            issues.push(`Container ${container.name} missing liveness probe`)
          }
          if (!container.readinessProbe) {
            issues.push(`Container ${container.name} missing readiness probe`)
          }
        }

        return {
          passed: issues.length === 0,
          issues
        }
      }
    })

    // Image policy
    this.addPolicy('image-policy', {
      description: 'Container images must use specific registries and tags',
      severity: 'high',
      check: (pod) => {
        if (!pod.spec?.containers) return { passed: true }

        const issues = []
        const allowedRegistries = ['gcr.io', 'docker.io/library', 'quay.io']

        for (const container of pod.spec.containers) {
          const image = container.image

          // Check for latest tag
          if (image.endsWith(':latest')) {
            issues.push(`Container ${container.name} uses 'latest' tag (${image})`)
          }

          // Check registry
          const registryAllowed = allowedRegistries.some(r => image.startsWith(r))
          if (!registryAllowed && !image.includes(':')) {
            issues.push(`Container ${container.name} registry not in allowed list (${image})`)
          }
        }

        return {
          passed: issues.length === 0,
          issues
        }
      }
    })

    // Replica policy
    this.addPolicy('replica-policy', {
      description: 'Deployments should have multiple replicas for HA',
      severity: 'medium',
      check: (resource) => {
        if (resource.kind !== 'Deployment') return { passed: true }
        if (!resource.spec?.replicas || resource.spec.replicas < 2) {
          return {
            passed: false,
            issues: [`Deployment has ${resource.spec?.replicas || 0} replicas, should have at least 2`]
          }
        }

        return { passed: true }
      }
    })

    // Network policy
    this.addPolicy('network-policy', {
      description: 'Pods should be restricted by network policies',
      severity: 'medium',
      check: (pod) => {
        // Check pod labels for network policy selection
        if (!pod.metadata?.labels?.['network-policy']) {
          return {
            passed: false,
            issues: ['Pod not selected by any network policy']
          }
        }

        return { passed: true }
      }
    })

    // Resource ratio policy
    this.addPolicy('resource-ratio', {
      description: 'Memory limit should be 2x the request',
      severity: 'low',
      check: (pod) => {
        if (!pod.spec?.containers) return { passed: true }

        const issues = []
        for (const container of pod.spec.containers) {
          const request = this.parseMemory(container.resources?.requests?.memory)
          const limit = this.parseMemory(container.resources?.limits?.memory)

          if (request && limit && limit < request * 2) {
            issues.push(`Container ${container.name} memory limit should be 2x request (${request}Mi req, ${limit}Mi limit)`)
          }
        }

        return {
          passed: issues.length === 0,
          issues
        }
      }
    })
  }

  /**
   * Add custom compliance policy
   */
  addPolicy(name, policy) {
    this.policies.set(name, {
      name,
      description: policy.description || '',
      severity: policy.severity || 'medium',
      check: policy.check,
      enabled: policy.enabled !== false,
      createdAt: Date.now()
    })
  }

  /**
   * Start compliance checker
   */
  async start() {
    if (this.isRunning) {
      console.warn('Compliance checker already running')
      return
    }

    this.isRunning = true

    // Run initial check
    await this.performComplianceCheck()

    // Start periodic checks
    this.checkInterval = setInterval(() => {
      this.performComplianceCheck().catch(err => {
        console.error('Compliance check error:', err)
      })
    }, this.config.checkInterval)

    console.log('Compliance checker started')
    if (this.eventBus) {
      this.eventBus.publish('complianceChecker:started', { timestamp: Date.now() })
    }
  }

  /**
   * Stop compliance checker
   */
  async stop() {
    if (!this.isRunning) {
      console.warn('Compliance checker not running')
      return
    }

    this.isRunning = false

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    console.log('Compliance checker stopped')
    if (this.eventBus) {
      this.eventBus.publish('complianceChecker:stopped', { timestamp: Date.now() })
    }
  }

  /**
   * Check pod compliance
   */
  checkPodCompliance(pod) {
    const violations = []
    let totalSeverity = 0
    let severityCount = 0

    for (const [policyName, policy] of this.policies) {
      if (!policy.enabled) continue

      try {
        const result = policy.check(pod)

        if (!result.passed && result.issues) {
          violations.push({
            policy: policyName,
            severity: policy.severity,
            issues: result.issues,
            timestamp: Date.now()
          })

          // Aggregate severity (high=3, medium=2, low=1)
          const severityScore = policy.severity === 'high' ? 3 : policy.severity === 'medium' ? 2 : 1
          totalSeverity += severityScore
          severityCount++
        }
      } catch (err) {
        console.error(`Error checking policy ${policyName}:`, err)
      }
    }

    return {
      resource: `${pod.metadata?.namespace}/${pod.metadata?.name}`,
      compliant: violations.length === 0,
      violations,
      violationCount: violations.length,
      averageSeverity: severityCount > 0 ? totalSeverity / severityCount : 0
    }
  }

  /**
   * Check resource compliance (generic)
   */
  checkResourceCompliance(resource) {
    const violations = []
    let totalSeverity = 0
    let severityCount = 0

    for (const [policyName, policy] of this.policies) {
      if (!policy.enabled) continue

      try {
        const result = policy.check(resource)

        if (!result.passed && result.issues) {
          violations.push({
            policy: policyName,
            severity: policy.severity,
            issues: result.issues,
            timestamp: Date.now()
          })

          const severityScore = policy.severity === 'high' ? 3 : policy.severity === 'medium' ? 2 : 1
          totalSeverity += severityScore
          severityCount++
        }
      } catch (err) {
        console.error(`Error checking policy ${policyName}:`, err)
      }
    }

    return {
      resource: `${resource.metadata?.namespace}/${resource.metadata?.name}`,
      kind: resource.kind,
      compliant: violations.length === 0,
      violations,
      violationCount: violations.length,
      averageSeverity: severityCount > 0 ? totalSeverity / severityCount : 0
    }
  }

  /**
   * Perform compliance check on collection
   */
  async performComplianceCheck(resources = []) {
    const checkResult = {
      timestamp: Date.now(),
      resourcesChecked: resources.length,
      compliantResources: 0,
      nonCompliantResources: 0,
      totalViolations: 0,
      violationsBySeverity: { high: 0, medium: 0, low: 0 }
    }

    const results = []

    for (const resource of resources) {
      const result = resource.kind === 'Pod'
        ? this.checkPodCompliance(resource)
        : this.checkResourceCompliance(resource)

      results.push(result)

      if (result.compliant) {
        checkResult.compliantResources++
      } else {
        checkResult.nonCompliantResources++
        checkResult.totalViolations += result.violationCount

        for (const violation of result.violations) {
          checkResult.violationsBySeverity[violation.severity]++
        }

        // Store violations
        this.violations.set(result.resource, {
          timestamp: Date.now(),
          kind: resource.kind,
          violations: result.violations,
          violationCount: result.violationCount
        })
      }
    }

    // Store check history
    this.checkHistory.push(checkResult)
    if (this.checkHistory.length > 1000) {
      this.checkHistory.shift()
    }

    // Emit event if high severity violations
    if (checkResult.violationsBySeverity.high > 0 && this.eventBus) {
      this.eventBus.publish('complianceChecker:criticalViolations', checkResult)
    }

    return {
      checkResult,
      results
    }
  }

  /**
   * Get compliance report
   */
  getComplianceReport(resourceName = null) {
    if (resourceName) {
      return this.violations.get(resourceName) || { found: false }
    }

    return {
      totalResources: this.violations.size,
      violations: Array.from(this.violations.values()),
      summary: this.complianceSummary()
    }
  }

  /**
   * Get compliance summary
   */
  complianceSummary() {
    let totalResources = 0
    let totalViolations = 0
    const severityCounts = { high: 0, medium: 0, low: 0 }

    for (const [, data] of this.violations) {
      totalResources++
      totalViolations += data.violationCount

      for (const violation of data.violations) {
        severityCounts[violation.severity]++
      }
    }

    return {
      nonCompliantResources: totalResources,
      totalViolations,
      violationsBySeverity: severityCounts,
      complianceRate: totalResources === 0 ? 100 : 0 // Would need total resources count for accurate rate
    }
  }

  /**
   * Get policy details
   */
  getPolicyDetails(policyName) {
    const policy = this.policies.get(policyName)

    if (!policy) {
      return { found: false }
    }

    return {
      found: true,
      ...policy,
      affectedResources: Array.from(this.violations.values())
        .filter(v => v.violations.some(vi => vi.policy === policyName))
        .length
    }
  }

  /**
   * Get violation statistics
   */
  getViolationStatistics() {
    const stats = {
      byPolicy: {},
      bySeverity: { high: 0, medium: 0, low: 0 },
      trend: []
    }

    for (const [, data] of this.violations) {
      for (const violation of data.violations) {
        stats.byPolicy[violation.policy] = (stats.byPolicy[violation.policy] || 0) + 1
        stats.bySeverity[violation.severity]++
      }
    }

    // Get trend from check history
    if (this.checkHistory.length > 0) {
      stats.trend = this.checkHistory.slice(-10).map(check => ({
        timestamp: check.timestamp,
        nonCompliant: check.nonCompliantResources,
        violations: check.totalViolations,
        criticalViolations: check.violationsBySeverity.high
      }))
    }

    return stats
  }

  /**
   * Parse memory value to MB
   */
  parseMemory(memoryStr) {
    if (!memoryStr) return null

    if (memoryStr.endsWith('Mi')) {
      return parseInt(memoryStr)
    } else if (memoryStr.endsWith('Gi')) {
      return parseInt(memoryStr) * 1024
    } else if (memoryStr.endsWith('Ki')) {
      return parseInt(memoryStr) / 1024
    }

    return parseInt(memoryStr)
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      isRunning: this.isRunning,
      policies: {
        total: this.policies.size,
        enabled: Array.from(this.policies.values()).filter(p => p.enabled).length
      },
      violations: this.violations.size,
      checkHistory: this.checkHistory.length,
      configuration: {
        checkInterval: this.config.checkInterval,
        severityThreshold: this.config.severityThreshold
      }
    }
  }
}

module.exports = { ComplianceChecker }
