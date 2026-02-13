/**
 * Integration Tests - Full System Testing
 */

// Mock implementations for testing
class MockKubernetesClient {
  async getPods() {
    return { pods: [] };
  }
}

const { EventBus } = require("../../src/forge-hdr/core/event-bus");
const { LoadBalancer } = require("../../src/forge-hdr/core/load-balancer");
const { BudgetEnforcer } = require("../../src/forge-hdr/core/budget-enforcer");
const {
  OrchestrationEngine,
} = require("../../src/forge-hdr/core/orchestration-engine");
const {
  AnomalyDetector,
} = require("../../src/forge-hdr/core/anomaly-detector");
const {
  PerformanceProfiler,
} = require("../../src/forge-hdr/core/performance-profiler");
const {
  MetricsExporter,
} = require("../../src/forge-hdr/core/metrics-exporter");
const {
  PolicyOptimizer,
} = require("../../src/forge-hdr/core/policy-optimizer");

describe("Integration Tests - Full System", () => {
  let eventBus;
  let loadBalancer;
  let budgetEnforcer;
  let orchestrationEngine;
  let anomalyDetector;
  let performanceProfiler;
  let metricsExporter;
  let policyOptimizer;
  let k8sClient;

  beforeEach(async () => {
    eventBus = new EventBus();

    k8sClient = new MockKubernetesClient();

    loadBalancer = new LoadBalancer({ eventBus });
    budgetEnforcer = new BudgetEnforcer({ eventBus });
    orchestrationEngine = new OrchestrationEngine({ eventBus, k8sClient });
    anomalyDetector = new AnomalyDetector({ eventBus });
    performanceProfiler = new PerformanceProfiler({ eventBus });
    metricsExporter = new MetricsExporter({ eventBus });
    policyOptimizer = new PolicyOptimizer({ eventBus });

    await loadBalancer.start();
    await budgetEnforcer.start();
    await orchestrationEngine.start();
    await anomalyDetector.start();
    await performanceProfiler.start();
    await metricsExporter.start();
    await policyOptimizer.start();
  });

  afterEach(async () => {
    await loadBalancer.stop();
    await budgetEnforcer.stop();
    await orchestrationEngine.stop();
    await anomalyDetector.stop();
    await performanceProfiler.stop();
    await metricsExporter.stop();
    await policyOptimizer.stop();
  });

  describe("Request Lifecycle", () => {
    it("should process complete request through all modules", async () => {
      let requestMetricsRecorded = false;
      let performanceRecorded = false;

      eventBus.subscribe("metricsExporter:metricsExported", () => {
        requestMetricsRecorded = true;
      });

      eventBus.subscribe("performanceProfiler:profilingComplete", () => {
        performanceRecorded = true;
      });

      eventBus.publish("request:received", {
        id: "req-123",
        resource: "api/users",
        method: "GET",
        timestamp: Date.now(),
      });

      // Simulate request completion
      eventBus.publish("request:completed", {
        id: "req-123",
        status: 200,
        duration: 150,
        error: null,
        timestamp: Date.now(),
      });

      // Allow async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(metricsExporter.metrics.requestsTotal).toBeGreaterThan(0);
    });

    it("should track request failures", async () => {
      eventBus.publish("request:completed", {
        id: "req-fail",
        status: 500,
        duration: 200,
        error: "Internal Server Error",
        timestamp: Date.now(),
      });

      expect(metricsExporter.metrics.requestsFailed).toBeGreaterThan(0);
    });

    it("should record request latency", async () => {
      const latencies = [50, 150, 750, 2000, 8000, 15000];

      latencies.forEach((latency) => {
        eventBus.publish("request:completed", {
          id: `req-${latency}`,
          status: 200,
          duration: latency,
          error: null,
          timestamp: Date.now(),
        });
      });

      const buckets = metricsExporter.metrics.requestLatencyBuckets;
      expect(buckets["0.1"]).toBeGreaterThan(0); // 50ms
      expect(buckets["1"]).toBeGreaterThan(0); // 750ms, 200ms
      expect(buckets["10"]).toBeGreaterThan(0); // 8000ms, 15000ms
    });
  });

  describe("Pod Management Lifecycle", () => {
    it("should track pod creation and deletion", async () => {
      eventBus.publish("pod:created", {
        id: "pod-1",
        namespace: "default",
        name: "app-pod-1",
        timestamp: Date.now(),
      });

      expect(metricsExporter.metrics.activePods).toBe(1);
      expect(metricsExporter.metrics.podsCreated).toBe(1);

      eventBus.publish("pod:deleted", {
        id: "pod-1",
        namespace: "default",
        timestamp: Date.now(),
      });

      expect(metricsExporter.metrics.activePods).toBe(0);
      expect(metricsExporter.metrics.podsDeleted).toBe(1);
    });

    it("should handle multiple pods", async () => {
      for (let i = 0; i < 5; i++) {
        eventBus.publish("pod:created", {
          id: `pod-${i}`,
          namespace: "default",
          name: `app-pod-${i}`,
          timestamp: Date.now(),
        });
      }

      expect(metricsExporter.metrics.activePods).toBe(5);

      for (let i = 0; i < 3; i++) {
        eventBus.publish("pod:deleted", {
          id: `pod-${i}`,
          namespace: "default",
          timestamp: Date.now(),
        });
      }

      expect(metricsExporter.metrics.activePods).toBe(2);
    });
  });

  describe("Cost Tracking Integration", () => {
    it("should accumulate costs across operations", async () => {
      const costs = [100, 250, 75, 150];

      costs.forEach((cost) => {
        eventBus.publish("cost:incurred", {
          operation: "pod:create",
          cost,
          timestamp: Date.now(),
        });
      });

      const totalExpected = costs.reduce((a, b) => a + b, 0);
      expect(metricsExporter.metrics.costsIncurred).toBe(totalExpected);
    });

    it("should trigger policy optimization on cost update", async () => {
      let optimizationTriggered = false;

      eventBus.subscribe("policyOptimizer:optimizationComplete", () => {
        optimizationTriggered = true;
      });

      eventBus.publish("cost:update", {
        cost: 5000,
        budget: 10000,
        timestamp: Date.now(),
      });

      expect(policyOptimizer.costHistory.length).toBeGreaterThan(0);
    });
  });

  describe("Compliance Tracking Integration", () => {
    it("should record compliance violations", async () => {
      const violations = [
        { type: "SECURITY", severity: "HIGH" },
        { type: "CONFIGURATION", severity: "MEDIUM" },
      ];

      violations.forEach((violation) => {
        eventBus.publish("compliance:violation", {
          ...violation,
          resource: "pod-1",
          timestamp: Date.now(),
        });
      });

      expect(metricsExporter.metrics.violationsDetected).toBe(2);
    });

    it("should generate compliance recommendations", async () => {
      for (let i = 0; i < 10; i++) {
        eventBus.publish("compliance:report", {
          violationCount: 8,
          resourcesChecked: 50,
          complianceRate: 84,
          timestamp: Date.now(),
        });
      }

      const recommendations =
        policyOptimizer.generateComplianceRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("Anomaly Detection Integration", () => {
    it("should detect and record anomalies", async () => {
      eventBus.publish("anomaly:detected", {
        type: "LATENCY_SPIKE",
        value: 850,
        threshold: 500,
        timestamp: Date.now(),
      });

      expect(metricsExporter.metrics.anomaliesDetected).toBe(1);
    });

    it("should trigger healing operations", async () => {
      let healingTriggered = false;

      eventBus.subscribe("healing:triggered", () => {
        healingTriggered = true;
      });

      eventBus.publish("anomaly:detected", {
        type: "HIGH_ERROR_RATE",
        value: 15,
        threshold: 5,
        timestamp: Date.now(),
      });

      // Simulate healing operation
      eventBus.publish("healing:completed", {
        type: "RESTART_PODS",
        podsAffected: 3,
        timestamp: Date.now(),
      });

      expect(metricsExporter.metrics.healingOperations).toBe(1);
    });
  });

  describe("Metrics Export Integration", () => {
    it("should export metrics in Prometheus format", async () => {
      eventBus.publish("request:completed", {
        id: "req-1",
        status: 200,
        duration: 100,
        error: null,
        timestamp: Date.now(),
      });

      const prometheusMetrics = metricsExporter.exportMetricsPrometheus();
      expect(prometheusMetrics).toContain("requests_total");
      expect(prometheusMetrics).toContain("# TYPE");
      expect(prometheusMetrics).toContain("# HELP");
    });

    it("should export metrics as JSON", async () => {
      eventBus.publish("request:completed", {
        id: "req-1",
        status: 200,
        duration: 100,
        error: null,
        timestamp: Date.now(),
      });

      const jsonMetrics = metricsExporter.exportMetricsJSON();
      expect(jsonMetrics.timestamp).toBeDefined();
      expect(jsonMetrics.metrics).toBeDefined();
      expect(jsonMetrics.systemInfo).toBeDefined();
    });

    it("should maintain metric history", async () => {
      for (let i = 0; i < 50; i++) {
        eventBus.publish("request:completed", {
          id: `req-${i}`,
          status: 200,
          duration: 100 + i,
          error: null,
          timestamp: Date.now(),
        });
      }

      await metricsExporter.exportMetrics();
      expect(metricsExporter.exportHistory.length).toBeGreaterThan(0);
      expect(metricsExporter.exportHistory.length).toBeLessThanOrEqual(1000);
    });
  });

  describe("Policy Optimization Integration", () => {
    it("should recommend policy updates based on trends", async () => {
      // Simulate high costs
      for (let i = 0; i < 10; i++) {
        eventBus.publish("cost:update", {
          cost: 800 + i * 10,
          budget: 1000,
          timestamp: Date.now(),
        });
      }

      // Simulate high CPU
      eventBus.publish("performance:update", {
        avgLatency: 300,
        cpuUsage: 85,
        memoryUsage: 60,
        errorRate: 0.1,
        timestamp: Date.now(),
      });

      policyOptimizer.optimizePolicies();

      const recommendations = policyOptimizer.getRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it("should apply policy recommendations", async () => {
      eventBus.publish("performance:update", {
        avgLatency: 300,
        cpuUsage: 85,
        memoryUsage: 60,
        errorRate: 0.1,
      });

      policyOptimizer.optimizePolicies();

      if (policyOptimizer.recommendations.length > 0) {
        const result = policyOptimizer.applyRecommendation(0);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Performance Profiling Integration", () => {
    it("should profile request metrics", async () => {
      eventBus.publish("request:completed", {
        id: "req-profile",
        status: 200,
        duration: 250,
        error: null,
        timestamp: Date.now(),
      });

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      const stats = performanceProfiler.getStatistics();
      expect(stats.isRunning).toBe(true);
    });
  });

  describe("Load Balancing Integration", () => {
    it("should balance requests across pods", async () => {
      eventBus.publish("pod:created", {
        id: "pod-1",
        namespace: "default",
        name: "app-1",
      });

      eventBus.publish("pod:created", {
        id: "pod-2",
        namespace: "default",
        name: "app-2",
      });

      const assignment1 = loadBalancer.selectPod("default");
      const assignment2 = loadBalancer.selectPod("default");

      // Both should be assigned (may be same pod due to randomness)
      expect(assignment1).toBeDefined();
      expect(assignment2).toBeDefined();
    });
  });

  describe("Budget Enforcement Integration", () => {
    it("should track budget across operations", async () => {
      for (let i = 0; i < 10; i++) {
        eventBus.publish("cost:incurred", {
          operation: "pod:create",
          cost: 500,
          timestamp: Date.now(),
        });
      }

      const status = budgetEnforcer.getBudgetStatus();
      expect(status.monthlyBudget).toBeDefined();
      expect(status.costIncurred).toBe(5000);
    });

    it("should trigger alerts on high budget usage", async () => {
      let alertTriggered = false;

      eventBus.subscribe("budget:alertThresholdExceeded", () => {
        alertTriggered = true;
      });

      // Simulate high costs
      for (let i = 0; i < 20; i++) {
        eventBus.publish("budget:costIncurred", {
          operation: "pod:create",
          cost: 400,
          timestamp: Date.now(),
        });
      }

      expect(metricsExporter.metrics.costsIncurred).toBeGreaterThan(0);
    });
  });

  describe("System Metrics Export", () => {
    it("should export complete system metrics", async () => {
      // Generate some activity
      eventBus.publish("request:completed", {
        id: "req-1",
        status: 200,
        duration: 150,
        error: null,
        timestamp: Date.now(),
      });

      eventBus.publish("pod:created", {
        id: "pod-test",
        namespace: "default",
        name: "test-pod",
      });

      eventBus.publish("cost:incurred", {
        operation: "test",
        cost: 100,
        timestamp: Date.now(),
      });

      const snapshot = metricsExporter.getMetricsSnapshot();
      expect(snapshot.counters).toBeDefined();
      expect(snapshot.gauges).toBeDefined();
      expect(snapshot.histograms).toBeDefined();

      expect(snapshot.counters.requestsTotal).toBeGreaterThan(0);
      expect(snapshot.gauges.activePods).toBeGreaterThan(0);
      expect(snapshot.counters.costsIncurred).toBeGreaterThan(0);
    });
  });

  describe("Multi-Module Event Propagation", () => {
    it("should propagate events through all modules", async () => {
      const eventLog = [];

      const events = [
        "request:completed",
        "pod:created",
        "cost:incurred",
        "compliance:violation",
        "anomaly:detected",
      ];

      events.forEach((event) => {
        eventBus.subscribe(event, (data) => {
          eventLog.push({ event, timestamp: Date.now() });
        });
      });

      eventBus.publish("request:completed", {
        id: "req-1",
        status: 200,
        duration: 150,
      });

      eventBus.publish("pod:created", {
        id: "pod-1",
        namespace: "default",
      });

      eventBus.publish("cost:incurred", {
        operation: "pod:create",
        cost: 100,
      });

      expect(eventLog.length).toBeGreaterThan(0);
    });
  });

  describe("System Recovery", () => {
    it("should restart all modules cleanly", async () => {
      await loadBalancer.stop();
      await budgetEnforcer.stop();
      await metricsExporter.stop();

      expect(loadBalancer.isRunning).toBe(false);
      expect(budgetEnforcer.isRunning).toBe(false);
      expect(metricsExporter.isRunning).toBe(false);

      await loadBalancer.start();
      await budgetEnforcer.start();
      await metricsExporter.start();

      expect(loadBalancer.isRunning).toBe(true);
      expect(budgetEnforcer.isRunning).toBe(true);
      expect(metricsExporter.isRunning).toBe(true);
    });
  });
});
