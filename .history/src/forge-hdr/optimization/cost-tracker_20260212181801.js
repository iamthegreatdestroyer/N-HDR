/**
 * Cost Tracker
 * Tracks financial impact of optimizations and resource usage
 */

const { EventEmitter } = require("events");

class CostTracker extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      cloudProvider: config.cloudProvider || "aws", // aws, gcp, azure
      currency: config.currency || "USD",
      costingModels: config.costingModels || {},
      trackingInterval: config.trackingInterval || 60000, // 1 minute
      ...config,
    };

    this.costs = {
      compute: {
        cpu: 0,
        memory: 0,
        storage: 0,
      },
      network: {
        egress: 0,
        ingress: 0,
        interZone: 0,
      },
      database: 0,
      licenses: 0,
      total: 0,
    };

    this.savings = {
      cpuOptimization: 0,
      memoryOptimization: 0,
      scaleDownEvents: 0,
      spotInstances: 0,
      rightSizing: 0,
      total: 0,
    };

    this.history = [];
    this.resourceSnapshots = [];
    this.optimizationImpact = new Map();
  }

  /**
   * Start cost tracking
   */
  async start() {
    console.log("Cost tracker started");
    this.emit("started");

    // Initial snapshot
    await this.recordSnapshot();

    // Schedule periodic snapshots
    this.snapshotInterval = setInterval(() => {
      this.recordSnapshot().catch((error) => {
        console.error("Error recording cost snapshot:", error);
      });
    }, this.config.trackingInterval);
  }

  /**
   * Stop cost tracking
   */
  async stop() {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    console.log("Cost tracker stopped");
    this.emit("stopped");
  }

  /**
   * Record a resource usage snapshot
   */
  async recordSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      costs: { ...this.costs },
      resources: {
        computeUnits: 0,
        memoryGB: 0,
        storageGB: 0,
        networkGB: 0,
      },
      metrics: {
        cpuUtilization: 0,
        memoryUtilization: 0,
        networkUtilization: 0,
      },
    };

    this.resourceSnapshots.push(snapshot);

    // Keep history to reasonable size
    if (this.resourceSnapshots.length > 1440) {
      // ~24 hours at 1 min intervals
      this.resourceSnapshots.shift();
    }

    return snapshot;
  }

  /**
   * Track optimization impact
   */
  trackOptimization(optimization) {
    const {
      type, // cpu-downscale, memory-reduction, network-optimization, etc.
      resourceReduction, // How much resource was reduced (units depend on type)
      estimatedCostSavings, // In currency units per month
      duration, // How long the optimization will be active
    } = optimization;

    const id = `${type}-${Date.now()}`;

    this.optimizationImpact.set(id, {
      id,
      type,
      startTime: Date.now(),
      resourceReduction,
      estimatedCostSavings,
      duration,
      actualSavings: 0,
      status: "active",
    });

    // Update savings based on type
    this.applyCostSavings(type, estimatedCostSavings);

    this.emit("optimizationTracked", {
      id,
      type,
      estimatedSavings: estimatedCostSavings,
    });

    console.log(`Tracked ${type} optimization: $${estimatedCostSavings}/month`);

    return id;
  }

  /**
   * Apply cost savings based on optimization type
   */
  applyCostSavings(type, amount) {
    switch (type) {
      case "cpu-downscale":
        this.savings.cpuOptimization += amount;
        break;
      case "memory-reduction":
        this.savings.memoryOptimization += amount;
        break;
      case "scale-down":
        this.savings.scaleDownEvents += amount;
        break;
      case "spot-instances":
        this.savings.spotInstances += amount;
        break;
      case "right-sizing":
        this.savings.rightSizing += amount;
        break;
      default:
        break;
    }

    this.savings.total += amount;
    this.emit("savingsUpdated", {
      category: type,
      amount,
      totalSavings: this.savings.total,
    });
  }

  /**
   * Update hourly costs
   */
  updateCosts(resources) {
    // Calculate costs based on resource usage

    if (resources.compute) {
      // CPU cost (example: $0.03 per CPU-hour on AWS)
      this.costs.compute.cpu += ((resources.compute.cpu || 0) * 0.03) / 60;

      // Memory cost (example: $0.005 per GB-hour on AWS)
      this.costs.compute.memory +=
        ((resources.compute.memory || 0) * 0.005) / 60;

      // Storage cost (example: $0.10 per GB-month = $0.0000034 per GB-minute)
      this.costs.compute.storage +=
        (resources.compute.storage || 0) * 0.0000034;
    }

    if (resources.network) {
      // Egress cost (example: $0.02 per GB)
      this.costs.network.egress += (resources.network.egress || 0) * 0.02;

      // Ingress is usually free
      this.costs.network.ingress += 0;

      // Inter-zone transfer (example: $0.01 per GB)
      this.costs.network.interZone += (resources.network.interZone || 0) * 0.01;
    }

    // Recalculate total
    this.recalculateTotalCost();
  }

  /**
   * Recalculate total cost
   */
  recalculateTotalCost() {
    const computeTotal =
      this.costs.compute.cpu +
      this.costs.compute.memory +
      this.costs.compute.storage;

    const networkTotal =
      this.costs.network.egress +
      this.costs.network.ingress +
      this.costs.network.interZone;

    this.costs.total =
      computeTotal + networkTotal + this.costs.database + this.costs.licenses;
  }

  /**
   * Get cost projection for a period
   */
  projectCosts(days = 30) {
    // Get average daily cost from recent history
    const recentCosts = this.resourceSnapshots.slice(-1440); // Last day

    if (recentCosts.length === 0) {
      return {
        days,
        projectedCost: 0,
        breakdown: {},
      };
    }

    const avgCost =
      recentCosts.reduce((sum, s) => sum + s.costs.total, 0) /
      recentCosts.length;
    const projectedCost = avgCost * days;

    return {
      days,
      projectedCost,
      breakdown: {
        compute:
          ((this.costs.compute.cpu + this.costs.compute.memory) /
            this.costs.total) *
          projectedCost,
        storage:
          (this.costs.compute.storage / this.costs.total) * projectedCost,
        network:
          ((this.costs.network.egress + this.costs.network.interZone) /
            this.costs.total) *
          projectedCost,
        other:
          ((this.costs.database + this.costs.licenses) / this.costs.total) *
          projectedCost,
      },
    };
  }

  /**
   * Calculate ROI for an optimization
   */
  calculateROI(optimizationId, interval = 30) {
    const optimization = this.optimizationImpact.get(optimizationId);
    if (!optimization) return null;

    // Assume implementation cost is 1 hour of engineer time @ $150/hour
    const implementationCost = optimization.type.includes("manual") ? 150 : 50;

    const monthlySavings = optimization.estimatedCostSavings;
    const paybackPeriod = implementationCost / (monthlySavings / 30); // Days to break even

    return {
      optimizationId,
      implementationCost,
      monthlySavings,
      savingsInInterval: monthlySavings * (interval / 30),
      paybackPeriod,
      roi:
        ((monthlySavings * 12 - implementationCost) / implementationCost) * 100,
    };
  }

  /**
   * Get cost overview
   */
  getOverview() {
    const currentMonth = this.getMonthlyEstimate();
    const previousMonth = this.getMonthlyEstimate(-30);

    return {
      currentMonth,
      previousMonth,
      monthOverMonth: {
        costChange: currentMonth - previousMonth,
        percentChange:
          (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(2) +
          "%",
      },
      savings: this.savings,
      breakdown: {
        compute: {
          cpu: this.costs.compute.cpu,
          memory: this.costs.compute.memory,
          storage: this.costs.compute.storage,
        },
        network: {
          egress: this.costs.network.egress,
          interZone: this.costs.network.interZone,
        },
        database: this.costs.database,
        licenses: this.costs.licenses,
      },
      activeOptimizations: this.getActiveOptimizations(),
      projections: {
        next30Days: this.projectCosts(30),
        next90Days: this.projectCosts(90),
      },
    };
  }

  /**
   * Get monthly cost estimate
   */
  getMonthlyEstimate(daysBack = 0) {
    const cutoffTime = Date.now() - Math.abs(daysBack) * 24 * 60 * 60 * 1000;
    const endTime = Date.now() - Math.max(0, daysBack) * 24 * 60 * 60 * 1000;

    const relevantSnapshots = this.resourceSnapshots.filter(
      (s) => s.timestamp >= cutoffTime && s.timestamp <= endTime,
    );

    if (relevantSnapshots.length === 0) return 0;

    const totalCost = relevantSnapshots.reduce(
      (sum, s) => sum + s.costs.total,
      0,
    );
    const avgDailyCost = totalCost / (Math.abs(daysBack) || 1);
    const monthlyEstimate = avgDailyCost * 30;

    return monthlyEstimate;
  }

  /**
   * Get active optimizations
   */
  getActiveOptimizations() {
    const active = [];

    for (const [id, opt] of this.optimizationImpact) {
      if (opt.status === "active") {
        const ageMs = Date.now() - opt.startTime;
        active.push({
          ...opt,
          ageMs,
          daysActive: Math.floor(ageMs / (24 * 60 * 60 * 1000)),
        });
      }
    }

    return active;
  }

  /**
   * Generate cost report
   */
  generateReport(period = 30) {
    const startTime = Date.now() - period * 24 * 60 * 60 * 1000;
    const relevantSnapshots = this.resourceSnapshots.filter(
      (s) => s.timestamp >= startTime,
    );

    const totalCost = relevantSnapshots.reduce(
      (sum, s) => sum + s.costs.total,
      0,
    );
    const avgDailyCost = totalCost / period;
    const maxDailyCost = Math.max(
      ...relevantSnapshots.map((s) => s.costs.total),
    );
    const minDailyCost = Math.min(
      ...relevantSnapshots.map((s) => s.costs.total),
    );

    return {
      period,
      startDate: new Date(startTime).toISOString(),
      endDate: new Date().toISOString(),
      totalCost,
      averageDailyCost: avgDailyCost,
      maxDailyCost,
      minDailyCost,
      totalSavings: this.savings.total,
      roi: this.calculateAggregateROI(),
      breakdown: this.costs,
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Calculate aggregate ROI
   */
  calculateAggregateROI() {
    const totalSavings = this.savings.total;
    let totalCost = 0;

    for (const [, opt] of this.optimizationImpact) {
      // Rough estimate of implementation cost
      totalCost += opt.type.includes("manual") ? 150 : 50;
    }

    if (totalCost === 0) return 0;

    return ((totalSavings * 12 - totalCost) / totalCost) * 100;
  }

  /**
   * Generate cost optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Check for high compute costs
    if (this.costs.compute.cpu > this.costs.compute.memory) {
      recommendations.push({
        category: "computation",
        title: "CPU Optimization Opportunity",
        description:
          "High CPU costs detected. Consider vertical scaling or algorithm optimization.",
        potentialSavings: this.costs.compute.cpu * 0.15,
        priority: "high",
      });
    }

    // Check for high storage costs
    if (this.costs.compute.storage > 1000) {
      // > $1000/month
      recommendations.push({
        category: "storage",
        title: "Storage Cleanup Opportunity",
        description:
          "Storage costs are high. Review for unused data and optimize retention policies.",
        potentialSavings: this.costs.compute.storage * 0.2,
        priority: "medium",
      });
    }

    // Check for high network costs
    if (this.costs.network.egress > 500) {
      // > $500/month
      recommendations.push({
        category: "network",
        title: "Network Optimization Opportunity",
        description:
          "Egress costs are high. Consider CDN or data locality optimization.",
        potentialSavings: this.costs.network.egress * 0.3,
        priority: "high",
      });
    }

    return recommendations;
  }

  /**
   * Export cost data
   */
  exportData(format = "json") {
    const data = {
      exportTime: new Date().toISOString(),
      period: {
        from: this.resourceSnapshots[0]?.timestamp,
        to: this.resourceSnapshots[this.resourceSnapshots.length - 1]
          ?.timestamp,
      },
      summary: this.getOverview(),
      snapshots: this.resourceSnapshots,
      optimizations: Array.from(this.optimizationImpact.values()),
    };

    if (format === "csv") {
      return this.convertToCSV(data);
    }

    return data;
  }

  /**
   * Convert data to CSV
   */
  convertToCSV(data) {
    let csv =
      "Timestamp,CPU Cost,Memory Cost,Storage Cost,Network Egress,Total Cost\n";

    for (const snapshot of data.snapshots) {
      csv += `${new Date(snapshot.timestamp).toISOString()},`;
      csv += `${snapshot.costs.compute.cpu},`;
      csv += `${snapshot.costs.compute.memory},`;
      csv += `${snapshot.costs.compute.storage},`;
      csv += `${snapshot.costs.network.egress},`;
      csv += `${snapshot.costs.total}\n`;
    }

    return csv;
  }
}

module.exports = { CostTracker };
