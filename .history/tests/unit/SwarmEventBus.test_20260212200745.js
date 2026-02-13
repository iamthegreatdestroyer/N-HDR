/**
 * Swarm Event Bus Tests
 * Comprehensive test suite for event coordination
 */

const SwarmEventBus = require("../src/core/nano-swarm-hdr/SwarmEventBus");

describe("SwarmEventBus", () => {
  let event_bus;

  beforeEach(() => {
    event_bus = new SwarmEventBus({
      event_history_size: 100,
    });
  });

  afterEach(async () => {
    if (event_bus.is_running) {
      await event_bus.stop();
    }
  });

  test("should initialize event bus", async () => {
    const start_result = await event_bus.start();
    expect(start_result).toBe(true);
    expect(event_bus.is_running).toBe(true);

    await event_bus.stop();
  });

  test("should publish and subscribe to events", (done) => {
    const received_events = [];

    event_bus.subscribe("test.event", (event) => {
      received_events.push(event);

      if (received_events.length === 1) {
        expect(event.topic).toBe("test.event");
        expect(event.data.message).toBe("Hello");
        done();
      }
    });

    event_bus.publishEvent("test.event", { message: "Hello" });
  });

  test("should respect subscription priority", (done) => {
    const execution_order = [];

    // Subscribe with different priorities
    event_bus.subscribe(
      "priority.test",
      () => {
        execution_order.push("high");
      },
      { priority: "high" }
    );

    event_bus.subscribe(
      "priority.test",
      () => {
        execution_order.push("low");
      },
      { priority: "low" }
    );

    event_bus.subscribe(
      "priority.test",
      () => {
        execution_order.push("normal");
      },
      { priority: "normal" }
    );

    event_bus.publishEvent("priority.test", {});

    setTimeout(() => {
      expect(execution_order).toEqual(["high", "normal", "low"]);
      done();
    }, 50);
  });

  test("should support one-time subscriptions", (done) => {
    let call_count = 0;

    event_bus.subscribe(
      "once.event",
      () => {
        call_count++;
      },
      { once_only: true }
    );

    event_bus.publishEvent("once.event", {});
    event_bus.publishEvent("once.event", {});

    setTimeout(() => {
      expect(call_count).toBe(1);
      done();
    }, 50);
  });

  test("should handle subscription errors gracefully", (done) => {
    let error_event_received = false;

    event_bus.on("subscription_error", () => {
      error_event_received = true;
    });

    // Subscribe with error-throwing callback
    event_bus.subscribe("error.event", () => {
      throw new Error("Subscription error");
    });

    event_bus.publishEvent("error.event", {});

    setTimeout(() => {
      expect(error_event_received).toBe(true);
      done();
    }, 50);
  });

  test("should maintain event history", () => {
    event_bus.publishEvent("history.test", { data: 1 });
    event_bus.publishEvent("history.test", { data: 2 });
    event_bus.publishEvent("history.test", { data: 3 });

    const history = event_bus.getEventHistory("history.test");
    expect(history.length).toBe(3);
    expect(history[0].data.data).toBe(1);
    expect(history[2].data.data).toBe(3);
  });

  test("should replay events", (done) => {
    const replay_events = [];

    event_bus.publishEvent("replay.event", { id: 1 });
    event_bus.publishEvent("replay.event", { id: 2 });

    event_bus.replayEvents("replay.event", (event) => {
      replay_events.push(event);
    });

    setTimeout(() => {
      expect(replay_events.length).toBe(2);
      expect(replay_events[0].data.id).toBe(1);
      expect(replay_events[1].data.id).toBe(2);
      done();
    }, 50);
  });

  test("should support wildcard subscriptions", (done) => {
    const received_topics = [];

    event_bus.subscribe("*", (event) => {
      received_topics.push(event.topic);
    });

    event_bus.publishEvent("topic.a", {});
    event_bus.publishEvent("topic.b", {});
    event_bus.publishEvent("completely.different", {});

    setTimeout(() => {
      expect(received_topics.length).toBe(3);
      expect(received_topics).toContain("topic.a");
      expect(received_topics).toContain("topic.b");
      expect(received_topics).toContain("completely.different");
      done();
    }, 50);
  });

  test("should query event history", () => {
    event_bus.publishEvent("query.test", { value: 1 }, {}, "source-1");
    event_bus.publishEvent("query.test", { value: 2 }, {}, "source-2");
    event_bus.publishEvent("other.topic", { value: 3 }, {}, "source-1");

    const results = event_bus.queryEventHistory({
      topic: "query.test",
      source: "source-1",
    });

    expect(results.length).toBe(1);
    expect(results[0].data.value).toBe(1);
  });

  test("should track dead letter queue", (done) => {
    event_bus.on("dead_letter_queue_added", () => {
      const dlq = event_bus.getDeadLetterQueue();
      expect(dlq.length).toBeGreaterThan(0);
      done();
    });

    event_bus.subscribe("dlq.test", () => {
      throw new Error("DLQ test error");
    });

    event_bus.publishEvent("dlq.test", {});
  });

  test("should get event statistics", () => {
    event_bus.publishEvent("stat.topic", {});
    event_bus.publishEvent("stat.topic", {});
    event_bus.publishEvent("other.topic", {});

    const stats = event_bus.getEventStatistics();
    expect(stats.total_events_published).toBe(3);
    expect(stats.event_count_by_topic).toBeDefined();
    expect(stats.event_count_by_topic["stat.topic"]).toBe(2);
  });

  test("should clear history", () => {
    event_bus.publishEvent("clear.test", {});
    event_bus.publishEvent("clear.test", {});

    let history = event_bus.getEventHistory();
    expect(history.length).toBeGreaterThan(0);

    event_bus.clearHistory();

    history = event_bus.getEventHistory();
    expect(history.length).toBe(0);
  });

  test("should clear dead letter queue", (done) => {
    event_bus.on("dead_letter_queue_added", () => {
      let dlq = event_bus.getDeadLetterQueue();
      expect(dlq.length).toBeGreaterThan(0);

      event_bus.clearDeadLetterQueue();

      dlq = event_bus.getDeadLetterQueue();
      expect(dlq.length).toBe(0);
      done();
    });

    event_bus.subscribe("dlq.clear", () => {
      throw new Error("Clear DLQ test");
    });

    event_bus.publishEvent("dlq.clear", {});
  });

  test("should support batch publishing", () => {
    const events_to_publish = [
      { topic: "batch.a", data: { id: 1 } },
      { topic: "batch.b", data: { id: 2 } },
      { topic: "batch.c", data: { id: 3 } },
    ];

    const results = event_bus.publishBatch(events_to_publish);

    expect(results.length).toBe(3);
    expect(results[0].topic).toBe("batch.a");
    expect(results[1].topic).toBe("batch.b");
    expect(results[2].topic).toBe("batch.c");
  });

  test("should unsubscribe correctly", (done) => {
    let call_count = 0;

    const unsubscribe = event_bus.subscribe("unsub.test", () => {
      call_count++;
    });

    event_bus.publishEvent("unsub.test", {});

    setTimeout(() => {
      expect(call_count).toBe(1);

      unsubscribe();

      event_bus.publishEvent("unsub.test", {});

      setTimeout(() => {
        expect(call_count).toBe(1); // Still 1, not called again
        done();
      }, 50);
    }, 50);
  });

  test("should emit event_id in published events", () => {
    let published_event = null;

    event_bus.subscribe("event_id.test", (event) => {
      published_event = event;
    });

    event_bus.publishEvent("event_id.test", { data: "test" });

    expect(published_event).toBeDefined();
    expect(published_event.event_id).toBeDefined();
    expect(published_event.event_id).toMatch(/^evt-/);
  });
});
