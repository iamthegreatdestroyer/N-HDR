/**
 * Swarm Health Manager Tests
 * Comprehensive test suite for health monitoring and orchestration
 */

const SwarmHealthManager = require("../src/core/nano-swarm-hdr/SwarmHealthManager");

describe("SwarmHealthManager", () => {
  let health_manager;
  let mock_metrics_collector;
  let mock_event_bus;

  beforeEach(() => {
    mock_metrics_collector = {
      getMetrics: jest.fn(() => ({
        total_tasks_executed: 100,
        total_tasks_completed: 95,
        task_success_rate: 95,
        average_task_duration_ms: 150,
        active_agent_count: 5,
        p50_latency_ms: 100,
        p95_latency_ms: 200,
        p99_latency_ms: 300,
      })),
      getHealthScore: jest.fn(() => 85),
      getAnomalies: jest.fn(() => []),
    };

    mock_event_bus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    health_manager = new SwarmHealthManager({
      metrics_collector: mock_metrics_collector,
      event_bus: mock_event_bus,
      health_check_interval_ms: 100,
      anomaly_detection_threshold: 0.7,
    });
  });

  afterEach(async () => {
    if (health_manager && health_manager.is_running) {
      await health_manager.stop();
    }
  });

  test("should initialize health manager", async () => {
    const start_result = await health_manager.start();

    expect(start_result).toBe(true);
    expect(health_manager.is_running).toBe(true);

    await health_manager.stop();
  });

  test("should perform health checks at interval", async () => {
    await health_manager.start();

    // Wait for health checks to run
    await new Promise((resolve) => setTimeout(resolve, 150));

    const health_history = health_manager.getHealthHistory();

    expect(health_history.length).toBeGreaterThan(0);

    await health_manager.stop();
  });

  test("should score health on scale 0-100", async () => {
    await health_manager.start();

    const current_health = health_manager.getCurrentHealth();

    expect(current_health.overall_health_score).toBeGreaterThanOrEqual(0);
    expect(current_health.overall_health_score).toBeLessThanOrEqual(100);

    await health_manager.stop();
  });

  test("should detect anomalies above threshold", (done) => {
    // Mock metrics that would trigger anomaly
    mock_metrics_collector.getAnomalies = jest.fn(() => [
      {
        anomaly_type: "high_latency",
        value: 500,
        threshold: 300,
        severity: "warning",
      },
    ]);

    health_manager.on("health_anomaly_detected", (event) => {
      expect(event.anomaly_type).toBeDefined();
      expect(event.severity).toBeDefined();
      health_manager.stop().then(() => done());
    });

    health_manager.start();
  });

  test("should emit health_check_complete event", (done) => {
    health_manager.on("health_check_complete", (event) => {
      expect(event.timestamp).toBeDefined();
      expect(event.health_score).toBeGreaterThanOrEqual(0);
      expect(event.health_score).toBeLessThanOrEqual(100);
      health_manager.stop().then(() => done());
    });

    health_manager.start();
  });

  test("should track three health failures for agent replacement", (done) => {
    let failure_count = 0;

    health_manager.on("agent_failure_registered", (event) => {
      failure_count++;

      if (failure_count >= 3) {
        expect(event.failure_count).toBe(3);
        health_manager.stop().then(() => done());
      }
    });

    health_manager.start().then(() => {
      // Simulate 3 consecutive failures for an agent
      health_manager.registerAgentFailure("agent-1");
      health_manager.registerAgentFailure("agent-1");
      health_manager.registerAgentFailure("agent-1");
    });
  });

  test("should trigger replacement after 3 failures", (done) => {
    health_manager.on("replacement_required", (event) => {
      expect(event.agent_id).toBe("agent-1");
      expect(event.failure_count).toBe(3);
      health_manager.stop().then(() => done());
    });

    health_manager.start().then(() => {
      // Register 3 failures
      for (let i = 0; i < 3; i++) {
        health_manager.registerAgentFailure("agent-1");
      }
    });
  });

  test("should track per-agent health scores", async () => {
    await health_manager.start();

    health_manager.updateAgentHealth("agent-1", {
      is_alive: true,
      uptime_seconds: 3600,
      task_success_rate: 98,
    });

    const agent_health = health_manager.getAgentHealth("agent-1");

    expect(agent_health).toBeDefined();
    expect(agent_health.health_score).toBeGreaterThanOrEqual(0);
    expect(agent_health.health_score).toBeLessThanOrEqual(100);

    await health_manager.stop();
  });

  test("should calculate system health from agent health", async () => {
    await health_manager.start();

    // Update multiple agents
    for (let i = 1; i <= 5; i++) {
      health_manager.updateAgentHealth(`agent-${i}`, {
        is_alive: true,
        uptime_seconds: 3600,
        task_success_rate: 90 + Math.random() * 10,
      });
    }

    const system_health = health_manager.getSystemHealth();

    expect(system_health.overall_health).toBeGreaterThanOrEqual(0);
    expect(system_health.overall_health).toBeLessThanOrEqual(100);
    expect(system_health.healthy_agents).toBeGreaterThanOrEqual(0);
    expect(system_health.monitored_agents).toBeGreaterThanOrEqual(0);

    await health_manager.stop();
  });

  test("should identify dead agents", async () => {
    await health_manager.start();

    // Mark agent as dead
    health_manager.updateAgentHealth("dead-agent", {
      is_alive: false,
      uptime_seconds: 0,
      task_success_rate: 0,
    });

    const dead_agents = health_manager.getDeadAgents();

    expect(Array.isArray(dead_agents)).toBe(true);
    expect(dead_agents.some((a) => a === "dead-agent")).toBe(true);

    await health_manager.stop();
  });

  test("should reset failure count on successful health check", async () => {
    await health_manager.start();

    health_manager.registerAgentFailure("agent-1");
    health_manager.registerAgentFailure("agent-1");

    // Report successful health
    health_manager.updateAgentHealth("agent-1", {
      is_alive: true,
      uptime_seconds: 3600,
      task_success_rate: 95,
    });

    const failure_count = health_manager.getAgentFailureCount("agent-1");

    expect(failure_count).toBeLessThan(2);

    await health_manager.stop();
  });

  test("should provide health history", async () => {
    await health_manager.start();

    // Wait for health checks
    await new Promise((resolve) => setTimeout(resolve, 250));

    const history = health_manager.getHealthHistory();

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].timestamp).toBeDefined();
    expect(history[0].health_score).toBeGreaterThanOrEqual(0);

    await health_manager.stop();
  });

  test("should query health history by time range", async () => {
    await health_manager.start();

    await new Promise((resolve) => setTimeout(resolve, 250));

    const now = Date.now();
    const one_minute_ago = now - 60000;

    const history = health_manager.getHealthHistoryRange(one_minute_ago, now);

    expect(Array.isArray(history)).toBe(true);

    await health_manager.stop();
  });

  test("should emit health_critical event when score drops", (done) => {
    // Mock critical health
    mock_metrics_collector.getHealthScore = jest.fn(() => 15);

    health_manager.on("health_critical", (event) => {
      expect(event.health_score).toBeLessThan(30);
      health_manager.stop().then(() => done());
    });

    health_manager.start();
  });

  test("should emit health_warning event", (done) => {
    // Mock warning health
    mock_metrics_collector.getHealthScore = jest.fn(() => 45);

    health_manager.on("health_warning", (event) => {
      expect(event.health_score).toBeLessThan(60);
      health_manager.stop().then(() => done());
    });

    health_manager.start();
  });

  test("should maintain health metrics over time", async () => {
    await health_manager.start();

    const metrics1 = health_manager.getCurrentHealth();
    expect(metrics1.check_count).toBe(0);

    // Wait for health checks
    await new Promise((resolve) => setTimeout(resolve, 250));

    const metrics2 = health_manager.getCurrentHealth();
    expect(metrics2.check_count).toBeGreaterThan(0);

    await health_manager.stop();
  });

  test("should support health trend analysis", async () => {
    await health_manager.start();

    // Perform multiple health checks
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const trend = health_manager.getHealthTrend();

    expect(trend).toBeDefined();
    expect(trend.trend_direction).toBeDefined(); // "improving", "declining", "stable"

    await health_manager.stop();
  });

  test("should calculate health percentiles", async () => {
    await health_manager.start();

    // Wait for multiple health checks
    await new Promise((resolve) => setTimeout(resolve, 500));

    const percentiles = health_manager.getHealthPercentiles();

    expect(percentiles.p50).toBeGreaterThanOrEqual(0);
    expect(percentiles.p95).toBeGreaterThanOrEqual(percentiles.p50);
    expect(percentiles.p99).toBeGreaterThanOrEqual(percentiles.p95);

    await health_manager.stop();
  });

  test("should handle graceful shutdown", async () => {
    await health_manager.start();

    expect(health_manager.is_running).toBe(true);

    const stop_result = await health_manager.stop();

    expect(stop_result).toBe(true);
    expect(health_manager.is_running).toBe(false);
  });

  test("should emit health_manager_started event", (done) => {
    health_manager.on("health_manager_started", () => {
      expect(health_manager.is_running).toBe(true);
      health_manager.stop().then(() => done());
    });

    health_manager.start();
  });

  test("should emit health_manager_stopped event", (done) => {
    health_manager.on("health_manager_stopped", () => {
      expect(health_manager.is_running).toBe(false);
      done();
    });

    health_manager.start().then(() => {
      health_manager.stop();
    });
  });

  test("should provide health report", async () => {
    await health_manager.start();

    const report = health_manager.getHealthReport();

    expect(report.overall_health).toBeGreaterThanOrEqual(0);
    expect(report.overall_health).toBeLessThanOrEqual(100);
    expect(report.total_checks).toBeGreaterThanOrEqual(0);
    expect(report.agents_monitored).toBeGreaterThanOrEqual(0);
    expect(report.critical_count).toBeGreaterThanOrEqual(0);
    expect(report.warning_count).toBeGreaterThanOrEqual(0);

    await health_manager.stop();
  });

  test("should clear old health history", async () => {
    await health_manager.start();

    // Wait for health checks
    await new Promise((resolve) => setTimeout(resolve, 250));

    const history_before = health_manager.getHealthHistory();
    const before_count = history_before.length;

    // Clear old entries (older than 10ms)
    health_manager.clearHealthHistoryOlderThan(Date.now() - 10);

    const history_after = health_manager.getHealthHistory();

    expect(history_after.length).toBeLessThanOrEqual(before_count);

    await health_manager.stop();
  });

  test("should support anomaly threshold customization", async () => {
    const custom_health_manager = new SwarmHealthManager({
      metrics_collector: mock_metrics_collector,
      event_bus: mock_event_bus,
      anomaly_detection_threshold: 0.5, // Lower threshold = more sensitive
    });

    await custom_health_manager.start();

    expect(custom_health_manager.anomaly_threshold).toBe(0.5);

    await custom_health_manager.stop();
  });

  test("should aggregate health metrics from multiple sources", async () => {
    await health_manager.start();

    // Update health from multiple agents
    health_manager.updateAgentHealth("agent-1", {
      is_alive: true,
      uptime_seconds: 3600,
      task_success_rate: 95,
    });

    health_manager.updateAgentHealth("agent-2", {
      is_alive: true,
      uptime_seconds: 1800,
      task_success_rate: 92,
    });

    health_manager.updateAgentHealth("agent-3", {
      is_alive: false,
      uptime_seconds: 0,
      task_success_rate: 0,
    });

    const aggregated = health_manager.getAggregatedHealth();

    expect(aggregated.total_agents).toBe(3);
    expect(aggregated.healthy_agents).toBe(2);
    expect(aggregated.dead_agents).toBe(1);

    await health_manager.stop();
  });

  test("should provide failure count per agent", async () => {
    await health_manager.start();

    health_manager.registerAgentFailure("agent-1");
    health_manager.registerAgentFailure("agent-1");

    const failure_count = health_manager.getAgentFailureCount("agent-1");

    expect(failure_count).toBe(2);

    await health_manager.stop();
  });

  test("should emit health_status_changed event", (done) => {
    health_manager.on("health_status_changed", (event) => {
      expect(event.previous_status).toBeDefined();
      expect(event.current_status).toBeDefined();
      expect(event.timestamp).toBeDefined();
      health_manager.stop().then(() => done());
    });

    health_manager.start();
  });
});
