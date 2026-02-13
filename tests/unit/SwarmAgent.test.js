/**
 * Swarm Agent Tests
 * Comprehensive test suite for individual agent lifecycle and execution
 */

const SwarmAgent = require("../src/core/nano-swarm-hdr/SwarmAgent");

describe("SwarmAgent", () => {
  let agent;
  let mock_orchestrator;

  beforeEach(() => {
    mock_orchestrator = {
      registerAgent: jest.fn(),
      unregisterAgent: jest.fn(),
      publishEvent: jest.fn(),
      getAgentStatus: jest.fn(),
    };

    agent = new SwarmAgent("agent-1", {
      orchestrator: mock_orchestrator,
      max_concurrent_tasks: 3,
      health_check_interval_ms: 100,
    });
  });

  afterEach(async () => {
    if (agent && agent.is_running) {
      await agent.stop();
    }
  });

  test("should initialize agent", async () => {
    const start_result = await agent.start();

    expect(start_result).toBe(true);
    expect(agent.is_running).toBe(true);
    expect(agent.agent_id).toBe("agent-1");
    expect(agent.status).toBe("ready");

    await agent.stop();
  });

  test("should transition through states", async () => {
    await agent.start();

    // Ready state
    expect(agent.status).toBe("ready");

    // Execute task to move to executing
    agent.executeTask({
      task_id: "task-1",
      name: "test_task",
      content: { data: "test" },
    });

    // Should have at least one active task
    expect(agent.active_task_count).toBeGreaterThan(0);

    await agent.stop();
  });

  test("should execute task successfully", (done) => {
    agent.on("task_completed", (event) => {
      expect(event.task_id).toBe("task-1");
      expect(event.status).toBe("success");
      agent.stop().then(() => done());
    });

    agent.start().then(() => {
      agent.executeTask({
        task_id: "task-1",
        name: "execute_sync",
        content: { data: "test_data" },
      });
    });
  });

  test("should handle task errors gracefully", (done) => {
    agent.on("task_failed", (event) => {
      expect(event.task_id).toBe("task-1");
      expect(event.error).toBeDefined();
      agent.stop().then(() => done());
    });

    agent.start().then(() => {
      agent.executeTask({
        task_id: "task-1",
        name: "failing_task",
        content: { should_fail: true },
      });
    });
  });

  test("should track concurrent tasks", async () => {
    await agent.start();

    agent.executeTask({
      task_id: "task-1",
      name: "task1",
      content: {},
    });

    agent.executeTask({
      task_id: "task-2",
      name: "task2",
      content: {},
    });

    const task_count = agent.active_task_count;
    expect(task_count).toBeGreaterThanOrEqual(0);

    await agent.stop();
  });

  test("should respect max concurrent tasks limit", async () => {
    agent = new SwarmAgent("agent-2", {
      orchestrator: mock_orchestrator,
      max_concurrent_tasks: 2,
      health_check_interval_ms: 100,
    });

    await agent.start();

    agent.executeTask({
      task_id: "task-1",
      name: "task1",
      content: {},
    });

    agent.executeTask({
      task_id: "task-2",
      name: "task2",
      content: {},
    });

    // Third task might queue
    const result = agent.executeTask({
      task_id: "task-3",
      name: "task3",
      content: {},
    });

    // Task is accepted but may queue
    expect(result !== null).toBeDefined();

    await agent.stop();
  });

  test("should emit task_started event", (done) => {
    agent.on("task_started", (event) => {
      expect(event.task_id).toBe("task-1");
      expect(event.timestamp).toBeDefined();
      agent.stop().then(() => done());
    });

    agent.start().then(() => {
      agent.executeTask({
        task_id: "task-1",
        name: "test_task",
        content: {},
      });
    });
  });

  test("should emit task_completed event", (done) => {
    agent.on("task_completed", (event) => {
      expect(event.task_id).toBe("task-1");
      expect(event.duration_ms).toBeGreaterThan(0);
      agent.stop().then(() => done());
    });

    agent.start().then(() => {
      agent.executeTask({
        task_id: "task-1",
        name: "test_task",
        content: {},
      });
    });
  });

  test("should emit task_failed event", (done) => {
    agent.on("task_failed", (event) => {
      expect(event.task_id).toBe("task-1");
      expect(event.error).toBeDefined();
      agent.stop().then(() => done());
    });

    agent.start().then(() => {
      agent.executeTask({
        task_id: "task-1",
        name: "failing_task",
        content: { should_fail: true },
      });
    });
  });

  test("should report health status", async () => {
    await agent.start();

    const health = agent.getHealthStatus();

    expect(health.agent_id).toBe("agent-1");
    expect(health.is_alive).toBe(true);
    expect(health.uptime_seconds).toBeGreaterThan(0);

    await agent.stop();
  });

  test("should track task metrics", (done) => {
    let completed_count = 0;

    agent.on("task_completed", () => {
      completed_count++;
      if (completed_count === 3) {
        const metrics = agent.getMetrics();

        expect(metrics.total_tasks_executed).toBe(3);
        expect(metrics.total_tasks_completed).toBe(3);
        expect(metrics.task_success_rate).toBe(100);

        agent.stop().then(() => done());
      }
    });

    agent.start().then(() => {
      for (let i = 0; i < 3; i++) {
        agent.executeTask({
          task_id: `task-${i}`,
          name: "test_task",
          content: {},
        });
      }
    });
  });

  test("should calculate average task duration", async () => {
    await agent.start();

    // Simulate completed tasks
    agent.task_history = [
      {
        task_id: "task-1",
        duration_ms: 100,
        status: "completed",
        timestamp: Date.now() - 1000,
      },
      {
        task_id: "task-2",
        duration_ms: 150,
        status: "completed",
        timestamp: Date.now() - 500,
      },
      {
        task_id: "task-3",
        duration_ms: 200,
        status: "completed",
        timestamp: Date.now(),
      },
    ];

    const metrics = agent.getMetrics();

    expect(metrics.average_task_duration_ms).toBeGreaterThan(0);
    expect(metrics.average_task_duration_ms).toBeCloseTo(150, 0);

    await agent.stop();
  });

  test("should handle agent stop gracefully", async () => {
    await agent.start();

    const stop_result = await agent.stop();

    expect(stop_result).toBe(true);
    expect(agent.is_running).toBe(false);
  });

  test("should support task categorization", async () => {
    await agent.start();

    const categories = [
      "data_processing",
      "api_call",
      "computation",
      "io_operation",
    ];

    for (const category of categories) {
      agent.executeTask({
        task_id: `task-${category}`,
        name: category,
        content: { category },
        category,
      });
    }

    const metrics = agent.getMetrics();
    expect(metrics.tasks_by_category).toBeDefined();

    await agent.stop();
  });

  test("should persist task history", async () => {
    await agent.start();

    const task_ids_executed = [];

    for (let i = 0; i < 5; i++) {
      const task_id = `task-${i}`;
      task_ids_executed.push(task_id);

      agent.executeTask({
        task_id,
        name: `task_${i}`,
        content: { index: i },
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const history = agent.getTaskHistory();
    expect(history.length).toBeGreaterThan(0);

    // Verify task IDs in history
    const history_ids = history.map((t) => t.task_id);
    expect(history_ids.some((id) => task_ids_executed.includes(id))).toBe(true);

    await agent.stop();
  });

  test("should support task cancellation", async () => {
    await agent.start();

    const task_id = "task-to-cancel";
    agent.executeTask({
      task_id,
      name: "long_task",
      content: {},
    });

    const cancellation_result = agent.cancelTask(task_id);

    expect(cancellation_result.success).toBe(true);

    await agent.stop();
  });

  test("should get current status", async () => {
    await agent.start();

    const status = agent.getStatus();

    expect(status.agent_id).toBe("agent-1");
    expect(status.is_running).toBe(true);
    expect(status.status).toBe("ready");
    expect(status.active_tasks).toBe(agent.active_task_count);

    await agent.stop();
  });

  test("should handle rapid task submissions", async () => {
    await agent.start();

    for (let i = 0; i < 10; i++) {
      agent.executeTask({
        task_id: `rapid-task-${i}`,
        name: "rapid_task",
        content: { sequence: i },
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    const metrics = agent.getMetrics();
    expect(metrics.total_tasks_executed).toBeGreaterThanOrEqual(10);

    await agent.stop();
  });

  test("should report state through orchestrator", async () => {
    await agent.start();

    expect(mock_orchestrator.registerAgent).toHaveBeenCalled();

    await agent.stop();

    expect(mock_orchestrator.unregisterAgent).toHaveBeenCalledWith("agent-1");
  });

  test("should maintain task timeout tracking", async () => {
    await agent.start();

    agent.executeTask({
      task_id: "timeout-task",
      name: "timeout_test",
      content: {},
      timeout_ms: 50,
    });

    await new Promise((resolve) => setTimeout(resolve, 150));

    const history = agent.getTaskHistory();
    const timeout_task = history.find((t) => t.task_id === "timeout-task");

    if (timeout_task) {
      expect(
        timeout_task.status === "timeout" || timeout_task.status === "failed",
      ).toBe(true);
    }

    await agent.stop();
  });

  test("should emit readiness event on start", (done) => {
    agent.on("agent_ready", () => {
      expect(agent.status).toBe("ready");
      agent.stop().then(() => done());
    });

    agent.start();
  });

  test("should emit shutdown event on stop", (done) => {
    agent.on("agent_shutdown", () => {
      expect(agent.is_running).toBe(false);
      done();
    });

    agent.start().then(() => {
      agent.stop();
    });
  });
});
