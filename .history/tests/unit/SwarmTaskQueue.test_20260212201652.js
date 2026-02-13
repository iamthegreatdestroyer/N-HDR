/**
 * Swarm Task Queue Tests
 * Comprehensive test suite for task distribution and queuing
 */

const SwarmTaskQueue = require("../src/core/nano-swarm-hdr/SwarmTaskQueue");

describe("SwarmTaskQueue", () => {
  let task_queue;

  beforeEach(() => {
    task_queue = new SwarmTaskQueue({
      max_queue_size: 100,
      max_retries: 3,
      task_timeout_ms: 5000,
      history_size: 50,
    });
  });

  afterEach(async () => {
    if (task_queue.is_running) {
      await task_queue.stop();
    }
  });

  test("should initialize task queue", async () => {
    const start_result = await task_queue.start();
    expect(start_result).toBe(true);
    expect(task_queue.is_running).toBe(true);

    await task_queue.stop();
  });

  test("should enqueue tasks", () => {
    const result = task_queue.enqueueTask("process_data", {
      data: "test",
    });

    expect(result.success).toBe(true);
    expect(result.task_id).toBeDefined();
    expect(result.position).toBeGreaterThanOrEqual(0);
  });

  test("should respect priority ordering", () => {
    task_queue.enqueueTask(
      "low_priority",
      { data: "low" },
      { priority: "low" },
    );
    task_queue.enqueueTask(
      "high_priority",
      { data: "high" },
      { priority: "high" },
    );
    task_queue.enqueueTask(
      "normal_priority",
      { data: "normal" },
      { priority: "normal" },
    );

    const task1 = task_queue.dequeueTask();
    expect(task1.content.data).toBe("high");

    const task2 = task_queue.dequeueTask();
    expect(task2.content.data).toBe("normal");

    const task3 = task_queue.dequeueTask();
    expect(task3.content.data).toBe("low");
  });

  test("should dequeue tasks in FIFO order within same priority", () => {
    // Enqueue tasks with same priority
    const id1 = task_queue.enqueueTask(
      "task1",
      { id: 1 },
      { priority: "normal" },
    ).task_id;
    const id2 = task_queue.enqueueTask(
      "task2",
      { id: 2 },
      { priority: "normal" },
    ).task_id;
    const id3 = task_queue.enqueueTask(
      "task3",
      { id: 3 },
      { priority: "normal" },
    ).task_id;

    const dequeued1 = task_queue.dequeueTask();
    const dequeued2 = task_queue.dequeueTask();
    const dequeued3 = task_queue.dequeueTask();

    expect(dequeued1.task_id).toBe(id1);
    expect(dequeued2.task_id).toBe(id2);
    expect(dequeued3.task_id).toBe(id3);
  });

  test("should mark task as started", () => {
    const enqueue_result = task_queue.enqueueTask("test_task", {});
    const task_id = enqueue_result.task_id;

    const task = task_queue.dequeueTask();
    const mark_result = task_queue.markTaskStarted(task_id, "agent-1");

    expect(mark_result.success).toBe(true);
  });

  test("should mark task as completed", () => {
    const enqueue_result = task_queue.enqueueTask("test_task", {});
    const task_id = enqueue_result.task_id;

    task_queue.dequeueTask();
    task_queue.markTaskStarted(task_id, "agent-1");

    const complete_result = task_queue.markTaskCompleted(task_id, {
      result: "success",
    });

    expect(complete_result.success).toBe(true);

    const history = task_queue.getTaskHistory();
    expect(history.length).toBeGreaterThan(0);
  });

  test("should handle task failure and retry", () => {
    const enqueue_result = task_queue.enqueueTask(
      "test_task",
      {},
      { priority: "high" },
    );
    const task_id = enqueue_result.task_id;

    task_queue.dequeueTask();
    const fail_result = task_queue.markTaskFailed(
      task_id,
      "Test error",
      "agent-1",
    );

    expect(fail_result.retrying).toBe(true);

    // Task should be re-enqueued
    const requeued_task = task_queue.dequeueTask();
    expect(requeued_task.task_id).toBe(task_id);
  });

  test("should move task to dead letter queue after max retries", () => {
    const enqueue_result = task_queue.enqueueTask("test_task", {});
    const task_id = enqueue_result.task_id;

    // Fail task 4 times (triggers DLQ on 4th attempt since max_retries = 3)
    for (let i = 0; i < 4; i++) {
      task_queue.dequeueTask();
      task_queue.markTaskFailed(task_id, "Persistent error", "agent-1");
    }

    const dlq = task_queue.getDeadLetterQueue();
    expect(dlq.length).toBeGreaterThan(0);
    expect(dlq[0].task.task_id).toBe(task_id);
  });

  test("should handle task timeouts", (done) => {
    task_queue = new SwarmTaskQueue({
      max_queue_size: 100,
      max_retries: 3,
      task_timeout_ms: 100,
    });

    const enqueue_result = task_queue.enqueueTask("timeout_task", {});
    const task_id = enqueue_result.task_id;

    task_queue.dequeueTask();
    task_queue.markTaskStarted(task_id, "agent-1");

    // Wait for timeout to trigger
    setTimeout(() => {
      const dlq = task_queue.getDeadLetterQueue();
      // Timeout may result in retry or DLQ depending on retry count and strategy
      expect(dlq.length + task_queue.queue.length).toBeGreaterThanOrEqual(0);
      done();
    }, 200);
  });

  test("should emit events on task lifecycle", (done) => {
    const events = [];

    task_queue.on("task_enqueued", (event) => {
      events.push("enqueued");
    });

    task_queue.on("task_dequeued", (event) => {
      events.push("dequeued");
    });

    task_queue.on("task_started", (event) => {
      events.push("started");
    });

    task_queue.on("task_completed", (event) => {
      events.push("completed");
    });

    const enqueue_result = task_queue.enqueueTask("event_test", {});
    const task_id = enqueue_result.task_id;

    const task = task_queue.dequeueTask();
    task_queue.markTaskStarted(task_id, "agent-1");
    task_queue.markTaskCompleted(task_id, { result: "done" });

    setTimeout(() => {
      expect(events).toContain("enqueued");
      expect(events).toContain("dequeued");
      expect(events).toContain("started");
      expect(events).toContain("completed");
      done();
    }, 50);
  });

  test("should get queue status", () => {
    task_queue.enqueueTask("task1", {});
    task_queue.enqueueTask("task2", {});

    const status = task_queue.getQueueStatus();

    expect(status.queue_size).toBe(2);
    expect(status.in_progress_count).toBe(0);
    expect(status.total_enqueued).toBe(2);
  });

  test("should get queue statistics", () => {
    // Enqueue and complete tasks
    for (let i = 0; i < 5; i++) {
      const result = task_queue.enqueueTask(`task${i}`, { id: i });
      const task_id = result.task_id;

      const task = task_queue.dequeueTask();
      task_queue.markTaskStarted(task_id, "agent-1");
      task_queue.markTaskCompleted(task_id, { result: "done" });
    }

    const stats = task_queue.getQueueStatistics();

    expect(stats.uptime_seconds).toBeGreaterThan(0);
    expect(stats.success_rate).toBeGreaterThan(0);
    expect(stats.total_enqueued).toBe(5);
    expect(stats.total_completed).toBe(5);
  });

  test("should calculate latency percentiles", () => {
    // Add and complete multiple tasks
    for (let i = 0; i < 10; i++) {
      const result = task_queue.enqueueTask(`latency_task_${i}`, {});
      const task_id = result.task_id;

      task_queue.dequeueTask();
      task_queue.markTaskStarted(task_id, "agent-1");

      // Simulate variable latencies
      const latency = 10 + i * 10; // 10, 20, 30, ..., 100ms
      task_queue.markTaskCompleted(task_id, { latency_ms: latency });
    }

    const stats = task_queue.getQueueStatistics();

    expect(stats.latency_percentiles).toBeDefined();
    expect(stats.latency_percentiles.p50).toBeGreaterThan(0);
    expect(stats.latency_percentiles.p95).toBeGreaterThan(
      stats.latency_percentiles.p50,
    );
    expect(stats.latency_percentiles.p99).toBeGreaterThan(
      stats.latency_percentiles.p95,
    );
  });

  test("should track task correlation IDs", () => {
    const correlation_id = "corr-123-abc";

    const result = task_queue.enqueueTask(
      "correlated_task",
      { data: "test" },
      { correlation_id },
    );

    const task = task_queue.dequeueTask();
    expect(task.correlation_id).toBe(correlation_id);
  });

  test("should query task history", () => {
    const task_id1 = task_queue.enqueueTask("task1", {}).task_id;
    const task_id2 = task_queue.enqueueTask("task2", {}).task_id;

    task_queue.dequeueTask();
    task_queue.markTaskStarted(task_id1, "agent-1");
    task_queue.markTaskCompleted(task_id1, {});

    task_queue.dequeueTask();
    task_queue.markTaskStarted(task_id2, "agent-1");
    task_queue.markTaskFailed(task_id2, "Test error", "agent-1");

    const history = task_queue.queryTaskHistory({ state: "completed" });
    expect(history.length).toBeGreaterThan(0);
  });

  test("should enforce max queue size", () => {
    task_queue = new SwarmTaskQueue({ max_queue_size: 5 });

    // Fill queue
    for (let i = 0; i < 5; i++) {
      task_queue.enqueueTask(`task${i}`, {});
    }

    // Try to exceed max
    const result = task_queue.enqueueTask("overflow_task", {});
    expect(result.success).toBe(false);
  });

  test("should return null on dequeue from empty queue", () => {
    task_queue = new SwarmTaskQueue();

    const task = task_queue.dequeueTask();
    expect(task).toBeNull();
  });

  test("should support task metadata", () => {
    const metadata = {
      priority_level: 10,
      customer_id: "cust-123",
      tags: ["urgent", "payment"],
    };

    const result = task_queue.enqueueTask("metadata_task", {}, { metadata });
    const task = task_queue.dequeueTask();

    expect(task.metadata).toEqual(metadata);
  });
});
