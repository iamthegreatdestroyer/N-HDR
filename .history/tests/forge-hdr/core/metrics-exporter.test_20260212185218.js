/**
 * Metrics Exporter Tests
 */

const {
  MetricsExporter,
} = require("../../src/forge-hdr/core/metrics-exporter");

describe("MetricsExporter", () => {
  let exporter;
  let eventBus;

  beforeEach(() => {
    eventBus = {
      subscribers: {},
      subscribe(event, callback) {
        if (!this.subscribers[event]) {
          this.subscribers[event] = [];
        }
        this.subscribers[event].push(callback);
      },
      publish(event, data) {
        if (this.subscribers[event]) {
          this.subscribers[event].forEach((cb) => cb(data));
        }
      },
    };

    exporter = new MetricsExporter({
      metricsPort: 9090,
      exportInterval: 1000,
      eventBus,
    });
  });

  afterEach(() => {
    if (exporter.isRunning) {
      exporter.stop();
    }
  });

  describe("Initialization", () => {
    it("should initialize with default config", () => {
      const exp = new MetricsExporter();
      expect(exp.config.metricsPort).toBe(9090);
      expect(exp.config.exportInterval).toBe(15000);
    });

    it("should initialize metrics to zero", () => {
      expect(exporter.metrics.requestsTotal).toBe(0);
      expect(exporter.metrics.requestsSuccess).toBe(0);
      expect(exporter.metrics.requestsFailed).toBe(0);
    });

    it("should have request latency buckets", () => {
      const { requestLatencyBuckets } = exporter.metrics;
      expect(requestLatencyBuckets["0.1"]).toBe(0);
      expect(requestLatencyBuckets["1"]).toBe(0);
      expect(requestLatencyBuckets["10"]).toBe(0);
    });
  });

  describe("Start/Stop", () => {
    it("should start exporter", async () => {
      await exporter.start();
      expect(exporter.isRunning).toBe(true);
    });

    it("should stop exporter", async () => {
      await exporter.start();
      expect(exporter.isRunning).toBe(true);
      await exporter.stop();
      expect(exporter.isRunning).toBe(false);
    });

    it("should publish start event", async () => {
      let eventFired = false;
      eventBus.subscribe("metricsExporter:started", () => {
        eventFired = true;
      });

      await exporter.start();
      expect(eventFired).toBe(true);
    });

    it("should not double-start", async () => {
      await exporter.start();
      const warn = jest.spyOn(console, "warn").mockImplementation();

      await exporter.start();
      expect(warn).toHaveBeenCalledWith("Metrics exporter already running");

      warn.mockRestore();
    });
  });

  describe("Request Completion Events", () => {
    beforeEach(async () => {
      await exporter.start();
    });

    it("should count successful requests", () => {
      exporter.onRequestCompleted({ error: false });
      expect(exporter.metrics.requestsTotal).toBe(1);
      expect(exporter.metrics.requestsSuccess).toBe(1);
      expect(exporter.metrics.requestsFailed).toBe(0);
    });

    it("should count failed requests", () => {
      exporter.onRequestCompleted({ error: true });
      expect(exporter.metrics.requestsTotal).toBe(1);
      expect(exporter.metrics.requestsSuccess).toBe(0);
      expect(exporter.metrics.requestsFailed).toBe(1);
    });

    it("should record latency in bucket", () => {
      exporter.onRequestCompleted({ duration: 50 }); // 0.05 seconds
      expect(exporter.metrics.requestLatencyBuckets["0.1"]).toBe(1);

      exporter.onRequestCompleted({ duration: 750 }); // 0.75 seconds
      expect(exporter.metrics.requestLatencyBuckets["1"]).toBe(1);

      exporter.onRequestCompleted({ duration: 5500 }); // 5.5 seconds
      expect(exporter.metrics.requestLatencyBuckets["10"]).toBe(1);
    });

    it("should record network latency", () => {
      exporter.onRequestCompleted({ networkLatency: 45 });
      expect(exporter.metrics.networkLatencyMs).toBe(45);
    });
  });

  describe("Pod Management Events", () => {
    beforeEach(async () => {
      await exporter.start();
    });

    it("should count pod creation", () => {
      exporter.onPodCreated({});
      exporter.onPodCreated({});
      expect(exporter.metrics.podsCreated).toBe(2);
      expect(exporter.metrics.activePods).toBe(2);
    });

    it("should count pod deletion", () => {
      exporter.onPodCreated({});
      exporter.onPodCreated({});
      expect(exporter.metrics.activePods).toBe(2);

      exporter.onPodDeleted({});
      expect(exporter.metrics.podsDeleted).toBe(1);
      expect(exporter.metrics.activePods).toBe(1);
    });

    it("should not allow negative active pods", () => {
      exporter.onPodDeleted({});
      exporter.onPodDeleted({});
      expect(exporter.metrics.activePods).toBe(0);
    });
  });

  describe("Cost Events", () => {
    beforeEach(async () => {
      await exporter.start();
    });

    it("should accumulate costs", () => {
      exporter.onCostIncurred({ cost: 10 });
      exporter.onCostIncurred({ cost: 20 });
      expect(exporter.metrics.costsIncurred).toBe(30);
    });
  });

  describe("Compliance Events", () => {
    beforeEach(async () => {
      await exporter.start();
    });

    it("should count violations", () => {
      exporter.onViolationDetected({});
      exporter.onViolationDetected({});
      expect(exporter.metrics.violationsDetected).toBe(2);
    });

    it("should count anomalies", () => {
      exporter.onAnomalyDetected({});
      expect(exporter.metrics.anomaliesDetected).toBe(1);
    });

    it("should count healing operations", () => {
      exporter.onHealingCompleted({});
      exporter.onHealingCompleted({});
      expect(exporter.metrics.healingOperations).toBe(2);
    });
  });

  describe("Metrics Export", () => {
    beforeEach(async () => {
      await exporter.start();
    });

    it("should export metrics in Prometheus format", () => {
      exporter.metrics.requestsTotal = 100;
      exporter.metrics.requestsSuccess = 95;
      exporter.metrics.requestsFailed = 5;

      const prometheus = exporter.exportMetricsPrometheus();
      expect(prometheus).toContain("requests_total 100");
      expect(prometheus).toContain("requests_success 95");
      expect(prometheus).toContain("requests_failed 5");
      expect(prometheus).toContain("# TYPE requests_total counter");
    });

    it("should export metrics as JSON", () => {
      exporter.metrics.activePods = 5;
      const json = exporter.exportMetricsJSON();

      expect(json.timestamp).toBeDefined();
      expect(json.metrics).toBeDefined();
      expect(json.metrics.activePods).toBe(5);
    });

    it("should generate metrics snapshot", () => {
      exporter.metrics.requestsTotal = 100;
      exporter.metrics.activePods = 3;
      exporter.metrics.cpuUsagePercent = 45.5;

      const snapshot = exporter.getMetricsSnapshot();
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.counters.requestsTotal).toBe(100);
      expect(snapshot.gauges.activePods).toBe(3);
      expect(snapshot.gauges.cpuUsagePercent).toBe(45.5);
    });
  });

  describe("Gauge Updates", () => {
    beforeEach(async () => {
      await exporter.start();
    });

    it("should update memory usage gauge", () => {
      const beforeUpdate = exporter.metrics.memoryUsagePercent;
      exporter.updateGaugeMetrics();
      // Memory usage should be between 0 and 100
      expect(exporter.metrics.memoryUsagePercent).toBeGreaterThanOrEqual(0);
      expect(exporter.metrics.memoryUsagePercent).toBeLessThanOrEqual(100);
    });
  });

  describe("Metrics Reset", () => {
    beforeEach(async () => {
      await exporter.start();
      exporter.metrics.requestsTotal = 100;
      exporter.metrics.requestsSuccess = 95;
      exporter.metrics.podsCreated = 10;
    });

    it("should reset all counter metrics", () => {
      exporter.resetMetrics();
      expect(exporter.metrics.requestsTotal).toBe(0);
      expect(exporter.metrics.requestsSuccess).toBe(0);
      expect(exporter.metrics.requestsFailed).toBe(0);
      expect(exporter.metrics.podsCreated).toBe(0);
    });

    it("should reset latency buckets", () => {
      exporter.metrics.requestLatencyBuckets["1"] = 50;
      exporter.resetMetrics();
      expect(exporter.metrics.requestLatencyBuckets["1"]).toBe(0);
    });

    it("should publish reset event", async () => {
      let eventFired = false;
      eventBus.subscribe("metricsExporter:metricsReset", () => {
        eventFired = true;
      });

      exporter.resetMetrics();
      expect(eventFired).toBe(true);
    });
  });

  describe("Latency Bucket Recording", () => {
    it("should correctly categorize latencies", () => {
      exporter.recordLatencyBucket(50); // 0.05s → 0.1s bucket
      exporter.recordLatencyBucket(300); // 0.3s → 0.5s bucket
      exporter.recordLatencyBucket(1200); // 1.2s → 2.5s bucket
      exporter.recordLatencyBucket(7000); // 7s → 10s bucket
      exporter.recordLatencyBucket(15000); // 15s → inf bucket

      expect(exporter.metrics.requestLatencyBuckets["0.1"]).toBe(1);
      expect(exporter.metrics.requestLatencyBuckets["0.5"]).toBe(1);
      expect(exporter.metrics.requestLatencyBuckets["2.5"]).toBe(1);
      expect(exporter.metrics.requestLatencyBuckets["10"]).toBe(1);
      expect(exporter.metrics.requestLatencyBuckets["inf"]).toBe(1);
    });
  });

  describe("Statistics", () => {
    it("should return statistics", async () => {
      await exporter.start();
      const stats = exporter.getStatistics();

      expect(stats.isRunning).toBe(true);
      expect(stats.metricsPort).toBe(9090);
      expect(stats.exportInterval).toBe(1000);
    });
  });

  describe("Module Integration", () => {
    it("should update metrics from registered modules", async () => {
      const mockModule = {
        getBudgetStatus: () => ({
          percentageUsed: 65.5,
        }),
      };

      exporter.registerModule("budgetEnforcer", mockModule);
      exporter.updateGaugeMetrics();

      expect(exporter.metrics.budgetUtilizedPercent).toBe(65.5);
    });
  });
});
