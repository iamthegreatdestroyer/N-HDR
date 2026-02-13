/**
 * FORGE-HDR Core Engine
 * Self-aware infrastructure system for autonomous topology optimization
 *
 * Copyright (c) 2025-2026 Stephen Bilodeau
 * Patent Pending: Self-Building Infrastructure System
 * CONFIDENTIAL - HDR Empire Framework
 */

const EventEmitter = require("events");
const { WorkloadDNAAnalyzer } = require("./workload/dna-analyzer.js");
const { TopologyOptimizer } = require("./topology/optimizer.js");
const { SelfHealer } = require("./reliability/self-healer.js");
const { CostTracker } = require("./finops/cost-tracker.js");
const { DecisionLogger } = require("./audit/decision-logger.js");
const { PrometheusClient } = require("./integration/prometheus-client.js");
const { KubernetesClient } = require("./integration/kubernetes-client.js");

/**
 * FORGE-HDR Core: Infrastructure evolution engine
 *
 * Architecture:
 * ┌──────────────────────────────┐
 * │  FORGE-HDR Core              │
 * ├──────────────────────────────┤
 * │ WorkloadDNA                  │ ← Analyzes traffic patterns
 * │ TopologyOptimizer            │ ← Generates optimal topology
 * │ SelfHealer                   │ ← Repairs failures
 * │ CostTracker                  │ ← Minimizes expenses
 * │ DecisionLogger               │ ← Immutable audit trail
 * └──────────────────────────────┘
 */
class ForgeHDRCore extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      metricsInterval: config.metricsInterval || 30000,
      optimizationInterval: config.optimizationInterval || 300000,
      maxConcurrentChanges: config.maxConcurrentChanges || 3,
      safetyThresholds: {
        maxCpuIncrease: 15, // Max % CPU increase from optimization
        minAvailability: 99.5, // Min availability to maintain
        maxLatencyIncrease: 5, // Max ms latency increase
      },
      ...config,
    };

    // Core components
    this.prometheus = new PrometheusClient(config.prometheus);
    this.kubernetes = new KubernetesClient(config.kubernetes);
    this.dnaAnalyzer = new WorkloadDNAAnalyzer(config.dna);
    this.topologyOptimizer = new TopologyOptimizer(config.topology);
    this.selfHealer = new SelfHealer(config.healing);
    this.costTracker = new CostTracker(config.costs);
    this.decisionLogger = new DecisionLogger(config.audit);

    // State tracking
    this.decisions = [];
    this.snapshots = new Map();
    this.isRunning = false;
    this.currentOptimization = null;
    this.metrics = {};

    // Initialize metrics
    this.initializeMetrics();
  }

  /**
   * Initialize Prometheus metrics
   */
  initializeMetrics() {
    this.prometheus.defineCounter(
      "forge_optimization_count",
      "Total optimizations executed by FORGE-HDR",
    );

    this.prometheus.defineGauge(
      "forge_cost_saved_dollars",
      "Total cloud costs saved by FORGE-HDR optimizations",
    );

    this.prometheus.defineGauge(
      "forge_topology_stability",
      "Current topology stability score (0-100)",
    );

    this.prometheus.defineCounter(
      "forge_decision_rollbacks",
      "Optimizations that required rollback",
    );

    this.prometheus.defineCounter(
      "forge_cascade_prevention_count",
      "Cascading failures prevented by FORGE-HDR",
    );

    this.prometheus.defineHistogram(
      "forge_optimization_latency_ms",
      "Time to execute topology optimization",
    );

    this.prometheus.defineHistogram(
      "forge_analysis_latency_ms",
      "Time to analyze current topology",
    );
  }

  /**
   * Start FORGE-HDR autonomous operation
   */
  async start() {
    if (this.isRunning) return;

    console.log("[FORGE-HDR] Starting autonomous operation...");
    this.isRunning = true;

    // Start continuous analysis loop
    this.analysisInterval = setInterval(() => {
      this.analyze().catch((err) => {
        console.error("[FORGE-HDR] Analysis error:", err);
        this.emit("error", { phase: "analyze", error: err });
      });
    }, this.config.optimizationInterval);

    // Start metrics collection
    this.metricsInterval = setInterval(() => {
      this.updateMetrics().catch((err) => {
        console.error("[FORGE-HDR] Metrics error:", err);
      });
    }, this.config.metricsInterval);

    // Start self-healing
    this.selfHealer.start().catch((err) => {
      console.error("[FORGE-HDR] Self-healing error:", err);
    });

    this.emit("started", { timestamp: new Date() });
  }

  /**
   * Stop FORGE-HDR operation
   */
  async stop() {
    if (!this.isRunning) return;

    console.log("[FORGE-HDR] Stopping operation...");
    this.isRunning = false;

    clearInterval(this.analysisInterval);
    clearInterval(this.metricsInterval);
    await this.selfHealer.stop();

    this.emit("stopped", { timestamp: new Date() });
  }

  /**
   * Analyze current infrastructure and identify optimizations
   */
  async analyze() {
    const startTime = Date.now();

    try {
      // Gather current state
      const metrics = await this.prometheus.fetchMetrics();
      const topology = await this.kubernetes.getCurrentTopology();
      const costs = await this.costTracker.getCurrentCosts(topology);

      // Store in metrics object
      this.metrics = { metrics, topology, costs, timestamp: new Date() };

      // Emit analysis event
      this.emit("analysis", {
        timestamp: new Date(),
        metrics: Object.keys(metrics).length,
        pods: topology.pods?.length || 0,
        services: topology.services?.length || 0,
      });

      // Analyze workload patterns
      const dna = this.dnaAnalyzer.analyze({
        metrics,
        topology,
        historicalData: this.decisions,
      });

      // Identify optimization opportunities
      const opportunities = this.findOptimizations(dna, topology, costs);

      if (opportunities.length > 0) {
        this.emit("optimization-found", {
          count: opportunities.length,
          opportunities: opportunities.map((o) => ({
            type: o.type,
            severity: o.severity,
            estimatedSavings: o.estimatedSavings,
          })),
        });

        // Generate proposal
        const proposal = this.topologyOptimizer.generateOptimization({
          dna,
          topology,
          opportunities,
          constraints: this.config.safetyThresholds,
        });

        // Execute if safe
        if (this.isSafeToExecute(proposal, topology)) {
          await this.executeOptimization(proposal, topology);
        } else {
          this.emit("optimization-blocked", {
            reason: "Safety constraints violated",
            proposal: proposal.id,
          });
        }
      }

      // Record analysis latency
      this.prometheus.recordHistogram(
        "forge_analysis_latency_ms",
        Date.now() - startTime,
      );

      return {
        success: true,
        opportunities: opportunities.length,
        time: Date.now() - startTime,
      };
    } catch (error) {
      this.emit("error", { phase: "analyze", error });
      throw error;
    }
  }

  /**
   * Find optimization opportunities in workload DNA
   */
  findOptimizations(dna, topology, costs) {
    const opportunities = [];

    // Over-provisioning opportunity
    if (dna.cpuProfile.averageUtilization < 30) {
      opportunities.push({
        type: "OVER_PROVISION_CPU",
        severity: "HIGH",
        description: "CPU utilization consistently below 30%",
        recommendation: `Scale down to ${Math.ceil(dna.cpuProfile.currentReplicas * 0.67)} replicas`,
        estimatedSavings: costs.current * 0.33,
        priority: 1,
      });
    }

    // Insufficient scaling opportunity
    if (dna.peakTrafficSurges > 85) {
      opportunities.push({
        type: "INSUFFICIENT_SCALING",
        severity: "CRITICAL",
        description: "Traffic surges exceed current scaling capacity",
        recommendation: `Increase HPA max to ${dna.recommendedMaxReplicas}`,
        estimatedLatencyReduction: dna.estimatedLatencyReduction,
        priority: 2,
      });
    }

    // Node affinity optimization
    if (dna.nodeAffinity.inefficiencies > 20) {
      opportunities.push({
        type: "NODE_AFFINITY",
        severity: "MEDIUM",
        description: "Inefficient pod/node placement",
        recommendation: "Rebalance pod distribution across nodes",
        estimatedNetworkReduction: 15,
        priority: 3,
      });
    }

    // Memory profile optimization
    if (dna.memoryProfile.averageUtilization > 75) {
      opportunities.push({
        type: "MEMORY_CONTENTION",
        severity: "HIGH",
        description: "Memory contention detected",
        recommendation: `Request ${dna.memoryProfile.recommendedRequest}Mi per pod`,
        preventsCascade: true,
        priority: 2,
      });
    }

    // Cascading failure risk
    if (dna.cascadeRisk.score > 60) {
      opportunities.push({
        type: "CASCADE_PREVENTION",
        severity: "CRITICAL",
        description: "System vulnerable to cascading failures",
        recommendation: "Add circuit breakers and bulkheads",
        preventsCascade: true,
        priority: 1,
      });
    }

    // Sort by priority
    opportunities.sort((a, b) => a.priority - b.priority);

    return opportunities;
  }

  /**
   * Verify optimization is safe before execution
   */
  isSafeToExecute(proposal, currentTopology) {
    // Check if topology is currently stable
    if (!this.isTopologyStable()) {
      console.warn("[FORGE-HDR] Topology unstable, deferring optimization");
      return false;
    }

    // Verify resource constraints
    const projectedDelta = proposal.projectedResourceDelta || {};

    if (
      projectedDelta.cpuIncrease > this.config.safetyThresholds.maxCpuIncrease
    ) {
      console.warn("[FORGE-HDR] CPU increase exceeds safe threshold");
      return false;
    }

    // Verify availability guarantee
    const projectedAvailability = this.estimateAvailability(proposal);
    if (projectedAvailability < this.config.safetyThresholds.minAvailability) {
      console.warn("[FORGE-HDR] Availability would drop below threshold");
      return false;
    }

    // Verify no critical services affected negatively
    if (
      proposal.affectedServices?.some(
        (s) => s.criticality === "CRITICAL" && s.projectedPerfDegradation > 5,
      )
    ) {
      console.warn("[FORGE-HDR] Critical service would degrade");
      return false;
    }

    return true;
  }

  /**
   * Check if topology is currently stable
   */
  isTopologyStable() {
    if (!this.metrics.topology) return false;

    const errorRate = this.metrics.metrics.http_requests_error_rate || 0;
    const latencyP99 = this.metrics.metrics.http_request_latency_p99_ms || 0;

    return errorRate < 1 && latencyP99 < 500;
  }

  /**
   * Estimate projected availability after optimization
   */
  estimateAvailability(proposal) {
    // Simplified estimation - real version would be more complex
    const currentAvailability =
      this.metrics.metrics.system_availability_percent || 99.9;
    const riskReduction = proposal.resilience?.riskReduction || 0;
    const riskIncrease = proposal.resilience?.riskIncrease || 0;

    return currentAvailability + riskReduction - riskIncrease;
  }

  /**
   * Execute approved optimization
   */
  async executeOptimization(proposal, previousTopology) {
    const optimizationStartTime = Date.now();
    const optimizationId = `opt-${Date.now()}`;

    try {
      console.log(`[FORGE-HDR] Executing optimization ${optimizationId}...`);

      // Create snapshot for rollback
      const snapshot = {
        id: optimizationId,
        timestamp: new Date(),
        topology: JSON.parse(JSON.stringify(previousTopology)),
        metrics: JSON.parse(JSON.stringify(this.metrics.metrics)),
      };
      this.snapshots.set(optimizationId, snapshot);

      // Apply changes to Kubernetes
      const applyResult = await this.kubernetes.applyOptimization({
        optimizationId,
        proposal,
        dryRun: false,
      });

      // Verify changes applied correctly
      await this.verifyOptimization(proposal);

      // Record decision
      const decision = {
        id: optimizationId,
        timestamp: new Date(),
        proposal,
        executed: true,
        snapshot,
        result: applyResult,
      };

      this.decisions.push(decision);
      await this.decisionLogger.log(decision);

      // Update metrics
      this.prometheus.incrementCounter("forge_optimization_count");
      if (proposal.projectedSavings) {
        this.prometheus.gaugeSet(
          "forge_cost_saved_dollars",
          (this.costTracker.totalSavings += proposal.projectedSavings),
        );
      }

      this.prometheus.recordHistogram(
        "forge_optimization_latency_ms",
        Date.now() - optimizationStartTime,
      );

      this.emit("optimization-applied", {
        optimizationId,
        proposal,
        duration: Date.now() - optimizationStartTime,
        savings: proposal.projectedSavings || 0,
      });

      return { success: true, optimizationId };
    } catch (error) {
      console.error(
        `[FORGE-HDR] Optimization ${optimizationId} failed:`,
        error,
      );

      // Attempt rollback
      await this.rollback(optimizationId);

      this.emit("error", {
        phase: "execute",
        optimizationId,
        error,
      });

      throw error;
    }
  }

  /**
   * Verify optimization applied correctly
   */
  async verifyOptimization(proposal) {
    // Wait for changes to stabilize
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const newTopology = await this.kubernetes.getCurrentTopology();

    // Basic verification - more sophisticated in production
    if (!newTopology || !newTopology.pods) {
      throw new Error("Topology verification failed: invalid state");
    }

    // Verify availability maintained
    const errorRate = this.metrics.metrics.http_requests_error_rate || 0;
    if (errorRate > 2) {
      throw new Error(
        `Topology verification failed: error rate ${errorRate}% > threshold`,
      );
    }

    return true;
  }

  /**
   * Rollback optimization to previous state
   */
  async rollback(optimizationId) {
    console.warn(`[FORGE-HDR] Rolling back optimization ${optimizationId}...`);

    const snapshot = this.snapshots.get(optimizationId);
    if (!snapshot) {
      throw new Error(`Snapshot not found for ${optimizationId}`);
    }

    try {
      // Restore previous topology
      await this.kubernetes.restoreTopology(snapshot.topology);

      // Wait for stabilization
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify restoration
      const currentTopology = await this.kubernetes.getCurrentTopology();
      if (!this.topologiesMatch(currentTopology, snapshot.topology)) {
        throw new Error("Topology restoration verification failed");
      }

      this.prometheus.incrementCounter("forge_decision_rollbacks");

      this.emit("rollback-completed", {
        optimizationId,
        timestamp: new Date(),
      });

      return { success: true, optimizationId };
    } catch (error) {
      this.emit("error", {
        phase: "rollback",
        optimizationId,
        error,
        severity: "CRITICAL",
      });
      throw error;
    }
  }

  /**
   * Check if two topologies match (basic comparison)
   */
  topologiesMatch(topology1, topology2) {
    return (
      topology1?.pods?.length === topology2?.pods?.length &&
      topology1?.services?.length === topology2?.services?.length
    );
  }

  /**
   * Update metrics periodically
   */
  async updateMetrics() {
    try {
      this.metrics = {
        metrics: await this.prometheus.fetchMetrics(),
        timestamp: new Date(),
      };

      // Update stability score
      const stability = this.calculateStability(this.metrics.metrics);
      this.prometheus.gaugeSet("forge_topology_stability", stability);
    } catch (error) {
      console.error("[FORGE-HDR] Metrics update error:", error);
    }
  }

  /**
   * Calculate topology stability score (0-100)
   */
  calculateStability(metrics) {
    const errorRateScore = Math.max(
      0,
      100 - (metrics.http_requests_error_rate || 0) * 10,
    );
    const availabilityScore = metrics.system_availability_percent || 100;
    const latencyScore = Math.max(
      0,
      100 - (metrics.http_request_latency_p99_ms || 0) / 5,
    );

    return Math.round((errorRateScore + availabilityScore + latencyScore) / 3);
  }

  /**
   * Get FORGE-HDR status
   */
  getStatus() {
    return {
      running: this.isRunning,
      optimizations: this.decisions.length,
      snapshots: this.snapshots.size,
      lastMetrics: this.metrics.timestamp,
      totalSavings: this.costTracker.totalSavings,
      stability: this.calculateStability(this.metrics.metrics || {}),
    };
  }

  /**
   * Get decision history
   */
  getDecisions(limit = 50) {
    return this.decisions.slice(-limit).map((d) => ({
      id: d.id,
      timestamp: d.timestamp,
      type: d.proposal?.type,
      executed: d.executed,
      savings: d.proposal?.projectedSavings,
    }));
  }
}

module.exports = { ForgeHDRCore };
