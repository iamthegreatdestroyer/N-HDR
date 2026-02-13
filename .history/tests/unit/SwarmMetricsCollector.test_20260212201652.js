/**
 * Swarm Metrics Collector Tests
 * Comprehensive test suite for metrics collection and analysis
 */

const SwarmMetricsCollector = require("../src/core/nano-swarm-hdr/SwarmMetricsCollector");

describe("SwarmMetricsCollector", () => {
  let collector;
  let mock_orchestrator;

  beforeEach(() => {
    // Create mock orchestrator
    mock_orchestrator = {
      agents: new Map([
        [
          "agent-1",
          {
            getStatus: () => ({
              agent_id: "agent-1",
              task_count: 10,
              success_count: 8,
              active_tasks: 2,
              last_task_duration_ms: 150,
            }),
          },
        ],
        [
          "agent-2",
          {
            getStatus: () => ({
              agent_id: "agent-2",
              task_count: 15,
              success_count: 14,
              active_tasks: 1,
              last_task_duration_ms: 200,
            }),
          },
        ],
      ]),
      getSwarmStatus: () => ({
        metrics: {
          tasks_completed: 50,
          tasks_failed: 3,
        },
        tasks: {
          queued: 5,
        },
      }),
    };

    collector = new SwarmMetricsCollector(mock_orchestrator, {
      collection_interval: 100,
      history_size: 10,
    });
  });

  afterEach(async () => {
    if (collector.is_running) {
      await collector.stop();
    }
  });

  test("should initialize metrics correctly", () => {
    const metrics = collector.getCurrentMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.swarm_size).toBe(0);
    expect(metrics.health_score).toBe(0);
  });

  test("should start and stop collector", async () => {
    const start_result = await collector.start();
    expect(start_result).toBe(true);
    expect(collector.is_running).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 150));

    const stop_result = await collector.stop();
    expect(collector.is_running).toBe(false);
  });

  test("should collect metrics with swarm status", (done) => {
    collector.on("metrics_collected", (event) => {
      expect(event.metrics).toBeDefined();
      expect(event.metrics.swarm_size).toBe(2);
      expect(event.metrics.completed_tasks).toBe(50);
      expect(event.metrics.failed_tasks).toBe(3);
      expect(event.collection_count).toBeGreaterThan(0);

      collector.stop().then(() => {
        done();
      });
    });

    collector.start();
  });

  test("should calculate health score", (done) => {
    collector.on("metrics_collected", (event) => {
      const health_score = event.metrics.health_score;
      expect(health_score).toBeGreaterThanOrEqual(0);
      expect(health_score).toBeLessThanOrEqual(100);

      collector.stop().then(() => {
        done();
      });
    });

    collector.start();
  });

  test("should maintain history", (done) => {
    let collection_count = 0;

    collector.on("metrics_collected", () => {
      collection_count++;

      if (collection_count === 3) {
        const history = collector.getHistoricalMetrics();
        expect(history.length).toBeGreaterThan(0);

        collector.stop().then(() => {
          done();
        });
      }
    });

    collector.start();
  });

  test("should calculate percentiles", (done) => {
    collector.on("metrics_collected", (event) => {
      const latencies = event.metrics.task_latencies;
      expect(latencies).toBeDefined();
      expect(latencies.p50).toBeGreaterThanOrEqual(0);
      expect(latencies.p95).toBeGreaterThanOrEqual(latencies.p50);
      expect(latencies.p99).toBeGreaterThanOrEqual(latencies.p95);

      collector.stop().then(() => {
        done();
      });
    });

    collector.start();
  });

  test("should detect anomalies", (done) => {
    collector.on("anomaly_detected", (event) => {
      expect(event.anomalies).toBeDefined();
      expect(event.anomalies.length).toBeGreaterThan(0);

      collector.stop().then(() => {
        done();
      });
    });

    // Force anomaly by modifying metrics
    collector.on("metrics_collected", (event) => {
      if (collector.collection_count > 5) {
        // After enough baseline
      }
    });

    collector.start();
  });

  test("should get statistics", (done) => {
    let ready = false;

    collector.on("metrics_collected", () => {
      if (!ready && collector.collection_count > 2) {
        ready = true;

        const stats = collector.getStatistics(60);
        expect(stats).toBeDefined();
        expect(stats.sample_count).toBeGreaterThan(0);
        expect(stats.average_health_score).toBeGreaterThanOrEqual(0);
        expect(stats.average_health_score).toBeLessThanOrEqual(100);

        collector.stop().then(() => {
          done();
        });
      }
    });

    collector.start();
  });

  test("should get agent-specific metrics", () => {
    collector.collectMetrics();

    const agent_metrics = collector.getAgentMetrics("agent-1");
    expect(agent_metrics).toBeDefined();
    expect(agent_metrics.task_count).toBeGreaterThan(0);
  });
});
