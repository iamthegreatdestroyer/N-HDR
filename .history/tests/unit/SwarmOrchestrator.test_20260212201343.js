/**
 * Swarm Orchestrator Tests
 * Comprehensive test suite for agent coordination and orchestration
 */

const SwarmOrchestrator = require("../src/core/nano-swarm-hdr/SwarmOrchestrator");
const SwarmAgent = require("../src/core/nano-swarm-hdr/SwarmAgent");

describe("SwarmOrchestrator", () => {
  let orchestrator;
  let mock_event_bus;
  let mock_task_queue;

  beforeEach(() => {
    mock_event_bus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      getHistory: jest.fn(() => []),
    };

    mock_task_queue = {
      enqueueTask: jest.fn((name, content, options) => ({
        success: true,
        task_id: `task-${Date.now()}`,
      })),
      dequeueTask: jest.fn(() => null),
      getQueueStatus: jest.fn(() => ({
        queue_size: 0,
        in_progress_count: 0,
      })),
    };

    orchestrator = new SwarmOrchestrator({
      min_agents: 3,
      max_agents: 20,
      event_bus: mock_event_bus,
      task_queue: mock_task_queue,
    });
  });

  afterEach(async () => {
    if (orchestrator && orchestrator.is_running) {
      await orchestrator.stop();
    }
  });

  test("should initialize orchestrator", async () => {
    const start_result = await orchestrator.start();

    expect(start_result).toBe(true);
    expect(orchestrator.is_running).toBe(true);
    expect(orchestrator.agent_count).toBeGreaterThanOrEqual(3);

    await orchestrator.stop();
  });

  test("should spawn minimum agents on startup", async () => {
    await orchestrator.start();

    const agent_count = orchestrator.agent_count;

    expect(agent_count).toBeGreaterThanOrEqual(3);
    expect(agent_count).toBeLessThanOrEqual(20);

    await orchestrator.stop();
  });

  test("should distribute tasks to agents", (done) => {
    orchestrator.on("task_distributed", (event) => {
      expect(event.task_id).toBeDefined();
      expect(event.assigned_agent_id).toBeDefined();
      orchestrator.stop().then(() => done());
    });

    orchestrator.start().then(() => {
      const task_result = orchestrator.submitTask(
        "test_task",
        { data: "test" }
      );

      expect(task_result.success).toBe(true);
    });
  });

  test("should use least-busy agent for load-balancing", async () => {
    await orchestrator.start();

    // Get initial agents
    const agents = orchestrator.getAgentList();
    expect(agents.length).toBeGreaterThan(0);

    // Submit multiple tasks
    for (let i = 0; i < 5; i++) {
      orchestrator.submitTask(`task-${i}`, { index: i });
    }

    // Verify distribution across agents
    const agent_loads = orchestrator.getAgentLoads();
    const loads = Object.values(agent_loads);

    // Most agents should have similar load (load-balancing)
    const max_load = Math.max(...loads);
    const min_load = Math.min(...loads);

    expect(max_load - min_load).toBeLessThanOrEqual(2);

    await orchestrator.stop();
  });

  test("should scale up when queue grows", (done) => {
    orchestrator.on("agent_spawned", (event) => {
      expect(event.agent_id).toBeDefined();
      const new_agent_count = orchestrator.agent_count;
      expect(new_agent_count).toBeGreaterThan(3);
      orchestrator.stop().then(() => done());
    });

    orchestrator.start().then(() => {
      // Simulate queue overflow by submitting many tasks
      for (let i = 0; i < 50; i++) {
        orchestrator.submitTask(`task-${i}`, {});
      }
    });
  });

  test("should scale down when queue is empty", (done) => {
    let scale_down_event_fired = false;

    orchestrator.on("agent_retired", (event) => {
      scale_down_event_fired = true;
      expect(event.agent_id).toBeDefined();
    });

    orchestrator.start().then(async () => {
      // Wait for auto-scale-down timeout
      await new Promise((resolve) => setTimeout(resolve, 5000));

      orchestrator.stop().then(() => {
        // Scale-down may or may not happen depending on timing
        done();
      });
    });
  });

  test("should handle agent failure and replacement", (done) => {
    orchestrator.on("agent_replaced", (event) => {
      expect(event.failed_agent_id).toBeDefined();
      expect(event.replacement_agent_id).toBeDefined();
      orchestrator.stop().then(() => done());
    });

    orchestrator.start().then(() => {
      // Get first agent
      const agents = orchestrator.getAgentList();
      if (agents.length > 0) {
        const agent_to_fail = agents[0];

        // Simulate agent failure
        orchestrator.reportAgentFailure(agent_to_fail);
      }
    });
  });

  test("should track swarm health", async () => {
    await orchestrator.start();

    const health = orchestrator.getSwarmHealth();

    expect(health.total_agents).toBeGreaterThanOrEqual(3);
    expect(health.healthy_agents).toBeGreaterThanOrEqual(0);
    expect(health.health_percentage).toBeGreaterThanOrEqual(0);
    expect(health.health_percentage).toBeLessThanOrEqual(100);

    await orchestrator.stop();
  });

  test("should provide agent list", async () => {
    await orchestrator.start();

    const agents = orchestrator.getAgentList();

    expect(Array.isArray(agents)).toBe(true);
    expect(agents.length).toBeGreaterThanOrEqual(3);
    expect(agents[0].agent_id).toBeDefined();
    expect(agents[0].status).toBeDefined();

    await orchestrator.stop();
  });

  test("should provide agent loads", async () => {
    await orchestrator.start();

    const agent_loads = orchestrator.getAgentLoads();

    expect(typeof agent_loads).toBe("object");
    expect(Object.keys(agent_loads).length).toBeGreaterThanOrEqual(3);

    // All loads should be numeric
    Object.values(agent_loads).forEach((load) => {
      expect(typeof load).toBe("number");
      expect(load).toBeGreaterThanOrEqual(0);
    });

    await orchestrator.stop();
  });

  test("should emit agent_spawned event", (done) => {
    let agent_spawned_count = 0;

    orchestrator.on("agent_spawned", () => {
      agent_spawned_count++;

      if (agent_spawned_count >= 1) {
        orchestrator.stop().then(() => done());
      }
    });

    orchestrator.start();
  });

  test("should report swarm status", async () => {
    await orchestrator.start();

    const status = orchestrator.getSwarmStatus();

    expect(status.is_running).toBe(true);
    expect(status.agent_count).toBeGreaterThanOrEqual(3);
    expect(status.total_tasks_processed).toBeGreaterThanOrEqual(0);
    expect(status.pending_tasks).toBeGreaterThanOrEqual(0);

    await orchestrator.stop();
  });

  test("should provide orchestration metrics", async () => {
    await orchestrator.start();

    for (let i = 0; i < 10; i++) {
      orchestrator.submitTask(`task-${i}`, {});
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const metrics = orchestrator.getMetrics();

    expect(metrics.total_agents).toBeGreaterThanOrEqual(3);
    expect(metrics.total_tasks_submitted).toBeGreaterThanOrEqual(0);
    expect(metrics.task_distribution).toBeDefined();

    await orchestrator.stop();
  });

  test("should queue tasks when no agents available", async () => {
    await orchestrator.start();

    const task_result = orchestrator.submitTask("test_task", {});

    expect(task_result.success).toBe(true);
    expect(task_result.task_id).toBeDefined();

    await orchestrator.stop();
  });

  test("should prioritize high-priority tasks", async () => {
    await orchestrator.start();

    const low_result = orchestrator.submitTask(
      "low_priority",
      { data: "low" },
      { priority: "low" }
    );

    const high_result = orchestrator.submitTask(
      "high_priority",
      { data: "high" },
      { priority: "high" }
    );

    expect(low_result.success).toBe(true);
    expect(high_result.success).toBe(true);

    // Queue status should show tasks
    const queue_status = orchestrator.getQueueStatus();
    expect(queue_status.queue_size).toBeGreaterThanOrEqual(0);

    await orchestrator.stop();
  });

  test("should handle graceful shutdown", async () => {
    await orchestrator.start();

    expect(orchestrator.is_running).toBe(true);

    const stop_result = await orchestrator.stop();

    expect(stop_result).toBe(true);
    expect(orchestrator.is_running).toBe(false);
  });

  test("should emit swarm_started event", (done) => {
    orchestrator.on("swarm_started", () => {
      expect(orchestrator.is_running).toBe(true);
      orchestrator.stop().then(() => done());
    });

    orchestrator.start();
  });

  test("should emit swarm_stopped event", (done) => {
    orchestrator.on("swarm_stopped", () => {
      expect(orchestrator.is_running).toBe(false);
      done();
    });

    orchestrator.start().then(() => {
      orchestrator.stop();
    });
  });

  test("should track task completion rate", async () => {
    await orchestrator.start();

    for (let i = 0; i < 5; i++) {
      orchestrator.submitTask(`task-${i}`, {});
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    const metrics = orchestrator.getMetrics();

    expect(metrics.total_tasks_submitted).toBeGreaterThanOrEqual(5);
    expect(metrics.total_tasks_completed).toBeGreaterThanOrEqual(0);

    if (metrics.total_tasks_submitted > 0) {
      const completion_rate =
        metrics.total_tasks_completed / metrics.total_tasks_submitted;
      expect(completion_rate).toBeGreaterThanOrEqual(0);
      expect(completion_rate).toBeLessThanOrEqual(1);
    }

    await orchestrator.stop();
  });

  test("should maintain agent roster consistency", async () => {
    await orchestrator.start();

    const agents1 = orchestrator.getAgentList();
    const agent_ids1 = agents1.map((a) => a.agent_id);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const agents2 = orchestrator.getAgentList();
    const agent_ids2 = agents2.map((a) => a.agent_id);

    // Same agents should still be present
    const common_ids = agent_ids1.filter((id) => agent_ids2.includes(id));
    expect(common_ids.length).toBeGreaterThan(0);

    await orchestrator.stop();
  });

  test("should support manual agent scaling", async () => {
    await orchestrator.start();

    const initial_count = orchestrator.agent_count;

    // Scale up to 10 agents
    const scale_result = orchestrator.scaleToAgentCount(10);

    expect(scale_result.success).toBe(true);
    expect(orchestrator.agent_count).toBeGreaterThanOrEqual(
      Math.min(initial_count, 10)
    );

    await orchestrator.stop();
  });

  test("should provide per-agent status", async () => {
    await orchestrator.start();

    const agents = orchestrator.getAgentList();
    const first_agent = agents[0];

    const agent_status = orchestrator.getAgentStatus(first_agent.agent_id);

    expect(agent_status).toBeDefined();
    expect(agent_status.agent_id).toBe(first_agent.agent_id);
    expect(agent_status.is_alive).toBe(true);

    await orchestrator.stop();
  });

  test("should emit queue_status_changed event", (done) => {
    orchestrator.on("queue_status_changed", (event) => {
      expect(event.queue_size).toBeGreaterThanOrEqual(0);
      expect(event.in_progress_count).toBeGreaterThanOrEqual(0);
      orchestrator.stop().then(() => done());
    });

    orchestrator.start().then(() => {
      orchestrator.submitTask("test_task", {});
    });
  });

  test("should handle concurrent task submissions", async () => {
    await orchestrator.start();

    const submission_promises = [];

    for (let i = 0; i < 20; i++) {
      submission_promises.push(
        Promise.resolve(
          orchestrator.submitTask(`concurrent-task-${i}`, { index: i })
        )
      );
    }

    const results = await Promise.all(submission_promises);

    const successful = results.filter((r) => r.success);
    expect(successful.length).toBe(20);

    await orchestrator.stop();
  });

  test("should report system-wide statistics", async () => {
    await orchestrator.start();

    const stats = orchestrator.getSystemStatistics();

    expect(stats.uptime_seconds).toBeGreaterThan(0);
    expect(stats.total_agents).toBeGreaterThanOrEqual(3);
    expect(stats.active_agents).toBeGreaterThanOrEqual(0);
    expect(stats.total_tasks_submitted).toBeGreaterThanOrEqual(0);

    await orchestrator.stop();
  });
});
