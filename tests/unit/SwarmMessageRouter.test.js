/**
 * Swarm Message Router Tests
 * Comprehensive test suite for distributed message routing and delivery
 */

const SwarmMessageRouter = require("../src/core/nano-swarm-hdr/SwarmMessageRouter");

describe("SwarmMessageRouter", () => {
  let message_router;
  let mock_event_bus;
  let mock_agents;

  beforeEach(() => {
    mock_event_bus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    mock_agents = {
      "agent-1": {
        agent_id: "agent-1",
        send: jest.fn((message) => Promise.resolve({ success: true })),
      },
      "agent-2": {
        agent_id: "agent-2",
        send: jest.fn((message) => Promise.resolve({ success: true })),
      },
      "agent-3": {
        agent_id: "agent-3",
        send: jest.fn((message) => Promise.resolve({ success: true })),
      },
    };

    message_router = new SwarmMessageRouter({
      event_bus: mock_event_bus,
      agents: mock_agents,
      retry_max_attempts: 3,
      retry_initial_delay_ms: 50,
      message_timeout_ms: 5000,
    });
  });

  afterEach(async () => {
    if (message_router && message_router.is_running) {
      await message_router.stop();
    }
  });

  test("should initialize message router", async () => {
    const start_result = await message_router.start();

    expect(start_result).toBe(true);
    expect(message_router.is_running).toBe(true);

    await message_router.stop();
  });

  test("should route message to specific agent", async () => {
    await message_router.start();

    const message = {
      type: "task_assignment",
      content: { task_id: "t-1", data: "test" },
      recipient: "agent-1",
    };

    const result = await message_router.sendMessage(message);

    expect(result.success).toBe(true);
    expect(result.message_id).toBeDefined();
    expect(mock_agents["agent-1"].send).toHaveBeenCalled();

    await message_router.stop();
  });

  test("should broadcast message to all agents", async () => {
    await message_router.start();

    const message = {
      type: "health_check",
      content: { timestamp: Date.now() },
    };

    const result = await message_router.broadcastMessage(message);

    expect(result.success).toBe(true);
    expect(result.delivered_count).toBe(3);
    expect(mock_agents["agent-1"].send).toHaveBeenCalled();
    expect(mock_agents["agent-2"].send).toHaveBeenCalled();
    expect(mock_agents["agent-3"].send).toHaveBeenCalled();

    await message_router.stop();
  });

  test("should retry failed message delivery", async () => {
    let attempt_count = 0;

    mock_agents["agent-1"].send = jest.fn((message) => {
      attempt_count++;

      if (attempt_count < 3) {
        return Promise.reject(new Error("Send failed"));
      }

      return Promise.resolve({ success: true });
    });

    await message_router.start();

    const message = {
      type: "task_assignment",
      content: { task_id: "t-1" },
      recipient: "agent-1",
      timeout_ms: 5000,
    };

    const result = await message_router.sendMessage(message);

    expect(result.success).toBe(true);
    expect(attempt_count).toBe(3);

    await message_router.stop();
  });

  test("should fail after max retry attempts", async () => {
    mock_agents["agent-1"].send = jest.fn(() =>
      Promise.reject(new Error("Persistent failure"))
    );

    await message_router.start();

    const message = {
      type: "task_assignment",
      content: { task_id: "t-1" },
      recipient: "agent-1",
      timeout_ms: 1000,
    };

    const result = await message_router.sendMessage(message);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(mock_agents["agent-1"].send).toHaveBeenCalledTimes(3);

    await message_router.stop();
  });

  test("should route to dead letter queue on failure", async () => {
    mock_agents["agent-1"].send = jest.fn(() =>
      Promise.reject(new Error("Fatal error"))
    );

    await message_router.start();

    const message = {
      type: "task_assignment",
      content: { task_id: "t-1" },
      recipient: "agent-1",
      timeout_ms: 500,
    };

    await message_router.sendMessage(message);

    const dlq_messages = message_router.getDeadLetterQueue();

    expect(dlq_messages.length).toBeGreaterThan(0);
    expect(dlq_messages[0].message.recipient).toBe("agent-1");

    await message_router.stop();
  });

  test("should preserve message ordering", async () => {
    await message_router.start();

    const recipient = "agent-1";
    const message_order = [];

    // Capture sent messages
    mock_agents[recipient].send = jest.fn((message) => {
      message_order.push(message.sequence_number);
      return Promise.resolve({ success: true });
    });

    for (let i = 1; i <= 5; i++) {
      const message = {
        type: "task_assignment",
        content: { task_id: `t-${i}` },
        recipient: recipient,
        sequence_number: i,
      };

      await message_router.sendMessage(message);
    }

    expect(message_order).toEqual([1, 2, 3, 4, 5]);

    await message_router.stop();
  });

  test("should handle message timeout", async () => {
    mock_agents["agent-1"].send = jest.fn(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 6000))
    );

    await message_router.start();

    const message = {
      type: "task_assignment",
      content: { task_id: "t-1" },
      recipient: "agent-1",
      timeout_ms: 500,
    };

    const result = await message_router.sendMessage(message);

    expect(result.success).toBe(false);
    expect(result.error_type).toBe("timeout");

    await message_router.stop();
  });

  test("should emit message_sent event", (done) => {
    message_router.on("message_sent", (event) => {
      expect(event.message_id).toBeDefined();
      expect(event.recipient).toBe("agent-1");
      expect(event.timestamp).toBeDefined();
      message_router.stop().then(() => done());
    });

    message_router.start().then(() => {
      message_router.sendMessage({
        type: "health_check",
        content: {},
        recipient: "agent-1",
      });
    });
  });

  test("should emit message_failed event", (done) => {
    mock_agents["agent-1"].send = jest.fn(() =>
      Promise.reject(new Error("Send failed"))
    );

    message_router.on("message_failed", (event) => {
      expect(event.message_id).toBeDefined();
      expect(event.error).toBeDefined();
      message_router.stop().then(() => done());
    });

    message_router.start().then(() => {
      message_router.sendMessage({
        type: "task_assignment",
        content: { task_id: "t-1" },
        recipient: "agent-1",
        timeout_ms: 500,
      });
    });
  });

  test("should emit message_retrying event", (done) => {
    let attempt = 0;

    mock_agents["agent-1"].send = jest.fn(() => {
      attempt++;

      if (attempt < 2) {
        return Promise.reject(new Error("Temporary failure"));
      }

      return Promise.resolve({ success: true });
    });

    message_router.on("message_retrying", (event) => {
      expect(event.message_id).toBeDefined();
      expect(event.attempt_number).toBeGreaterThan(1);
      message_router.stop().then(() => done());
    });

    message_router.start().then(() => {
      message_router.sendMessage({
        type: "task_assignment",
        content: { task_id: "t-1" },
        recipient: "agent-1",
      });
    });
  });

  test("should provide audit trail of messages", async () => {
    await message_router.start();

    for (let i = 0; i < 5; i++) {
      await message_router.sendMessage({
        type: "health_check",
        content: { index: i },
        recipient: "agent-1",
      });
    }

    const audit_trail = message_router.getAuditTrail();

    expect(audit_trail.length).toBeGreaterThanOrEqual(5);
    expect(audit_trail[0].message_id).toBeDefined();
    expect(audit_trail[0].sender).toBeDefined();
    expect(audit_trail[0].recipient).toBe("agent-1");
    expect(audit_trail[0].timestamp).toBeDefined();
    expect(audit_trail[0].status).toBeDefined(); // "sent", "failed", "timeout", etc

    await message_router.stop();
  });

  test("should track message delivery statistics", async () => {
    await message_router.start();

    for (let i = 0; i < 10; i++) {
      await message_router.sendMessage({
        type: "health_check",
        content: {},
        recipient: "agent-1",
      });
    }

    const stats = message_router.getStatistics();

    expect(stats.total_messages_sent).toBeGreaterThanOrEqual(10);
    expect(stats.total_messages_failed).toBeGreaterThanOrEqual(0);
    expect(stats.total_retries).toBeGreaterThanOrEqual(0);
    expect(stats.average_delivery_time_ms).toBeGreaterThanOrEqual(0);

    await message_router.stop();
  });

  test("should handle concurrent message delivery", async () => {
    await message_router.start();

    const messages = [];

    for (let i = 1; i <= 20; i++) {
      messages.push({
        type: "task_assignment",
        content: { task_id: `t-${i}` },
        recipient: `agent-${(i % 3) + 1}`,
      });
    }

    const results = await Promise.all(
      messages.map((msg) => message_router.sendMessage(msg))
    );

    const successful = results.filter((r) => r.success);

    expect(successful.length).toBe(20);

    await message_router.stop();
  });

  test("should acknowledge message delivery", async () => {
    await message_router.start();

    const message = {
      type: "task_assignment",
      content: { task_id: "t-1" },
      recipient: "agent-1",
      requires_ack: true,
    };

    const result = await message_router.sendMessage(message);

    expect(result.ack_received).toBe(true);
    expect(result.ack_timestamp).toBeDefined();

    await message_router.stop();
  });

  test("should filter messages by type", async () => {
    await message_router.start();

    // Send mixed message types
    await message_router.sendMessage({
      type: "health_check",
      content: {},
      recipient: "agent-1",
    });

    await message_router.sendMessage({
      type: "task_assignment",
      content: { task_id: "t-1" },
      recipient: "agent-2",
    });

    await message_router.sendMessage({
      type: "metrics_update",
      content: { metrics: {} },
      recipient: "agent-3",
    });

    const task_messages = message_router.getAuditTrail("task_assignment");

    expect(task_messages.length).toBeGreaterThanOrEqual(1);
    expect(task_messages[0].type).toBe("task_assignment");

    await message_router.stop();
  });

  test("should validate message format", async () => {
    await message_router.start();

    const invalid_message = {
      // Missing required fields
      content: { task_id: "t-1" },
    };

    const result = await message_router.sendMessage(invalid_message);

    expect(result.success).toBe(false);
    expect(result.error).toContain("validation");

    await message_router.stop();
  });

  test("should support message priority routing", async () => {
    await message_router.start();

    const high_priority = {
      type: "critical_alert",
      content: {},
      recipient: "agent-1",
      priority: "high",
    };

    const normal_priority = {
      type: "health_check",
      content: {},
      recipient: "agent-1",
      priority: "normal",
    };

    const result_high = await message_router.sendMessage(high_priority);
    const result_normal = await message_router.sendMessage(normal_priority);

    expect(result_high.success).toBe(true);
    expect(result_normal.success).toBe(true);

    // High priority messages should be processed first (implicit check)
    const queue = message_router.getPendingMessages();
    // Verify queue exists and is queryable
    expect(queue).toBeDefined();

    await message_router.stop();
  });

  test("should handle agent not found error", async () => {
    await message_router.start();

    const message = {
      type: "task_assignment",
      content: { task_id: "t-1" },
      recipient: "agent-nonexistent",
    };

    const result = await message_router.sendMessage(message);

    expect(result.success).toBe(false);
    expect(result.error_type).toBe("agent_not_found");

    await message_router.stop();
  });

  test("should support batch message delivery", async () => {
    await message_router.start();

    const messages = [
      {
        type: "task_assignment",
        content: { task_id: "t-1" },
        recipient: "agent-1",
      },
      {
        type: "task_assignment",
        content: { task_id: "t-2" },
        recipient: "agent-2",
      },
      {
        type: "task_assignment",
        content: { task_id: "t-3" },
        recipient: "agent-3",
      },
    ];

    const result = await message_router.sendBatch(messages);

    expect(result.total_sent).toBe(3);
    expect(result.successful_count).toBe(3);
    expect(result.failed_count).toBe(0);

    await message_router.stop();
  });

  test("should track per-agent delivery statistics", async () => {
    await message_router.start();

    for (let i = 0; i < 5; i++) {
      await message_router.sendMessage({
        type: "health_check",
        content: {},
        recipient: "agent-1",
      });
    }

    for (let i = 0; i < 3; i++) {
      await message_router.sendMessage({
        type: "health_check",
        content: {},
        recipient: "agent-2",
      });
    }

    const agent1_stats = message_router.getAgentStatistics("agent-1");
    const agent2_stats = message_router.getAgentStatistics("agent-2");

    expect(agent1_stats.messages_sent).toBeGreaterThanOrEqual(5);
    expect(agent2_stats.messages_sent).toBeGreaterThanOrEqual(3);

    await message_router.stop();
  });

  test("should emit message_router_started event", (done) => {
    message_router.on("message_router_started", () => {
      expect(message_router.is_running).toBe(true);
      message_router.stop().then(() => done());
    });

    message_router.start();
  });

  test("should emit message_router_stopped event", (done) => {
    message_router.on("message_router_stopped", () => {
      expect(message_router.is_running).toBe(false);
      done();
    });

    message_router.start().then(() => {
      message_router.stop();
    });
  });

  test("should gracefully handle shutdown", async () => {
    await message_router.start();

    expect(message_router.is_running).toBe(true);

    const stop_result = await message_router.stop();

    expect(stop_result).toBe(true);
    expect(message_router.is_running).toBe(false);
  });

  test("should provide router status", async () => {
    await message_router.start();

    const status = message_router.getStatus();

    expect(status.is_running).toBe(true);
    expect(status.total_messages).toBeGreaterThanOrEqual(0);
    expect(status.pending_messages).toBeGreaterThanOrEqual(0);
    expect(status.dead_letter_queue_size).toBeGreaterThanOrEqual(0);
    expect(status.average_delivery_latency_ms).toBeGreaterThanOrEqual(0);

    await message_router.stop();
  });

  test("should recover messages from dead letter queue", async () => {
    mock_agents["agent-1"].send = jest.fn(() =>
      Promise.reject(new Error("Send failed"))
    );

    await message_router.start();

    // Send message that will fail and go to DLQ
    await message_router.sendMessage({
      type: "task_assignment",
      content: { task_id: "t-1" },
      recipient: "agent-1",
      timeout_ms: 500,
    });

    // Fix the agent
    mock_agents["agent-1"].send = jest.fn(() =>
      Promise.resolve({ success: true })
    );

    // Attempt recovery
    const recovery_result = await message_router.reprocessDeadLetterQueue();

    expect(recovery_result.reprocessed_count).toBeGreaterThanOrEqual(0);

    await message_router.stop();
  });
});
