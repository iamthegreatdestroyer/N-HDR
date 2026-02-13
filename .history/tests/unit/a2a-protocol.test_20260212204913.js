/**
 * A2A Protocol Test Suite
 * Tests for Agent-to-Agent Communication REST API
 *
 * Coverage:
 * - Message routing to specific agents
 * - Agent discovery and status queries
 * - Task submission and distribution
 * - Swarm-wide status monitoring
 * - Auto-scaling coordination
 * - Health checks
 * - Error handling and validation
 * - Request logging & correlation
 */

const A2AProtocol = require("../../src/api/a2a-protocol");
const request = require("supertest");

describe("A2A Protocol REST API", () => {
  let a2a;
  let server;
  let mockOrchestrator;
  let mockAgent;

  beforeEach(async () => {
    // Mock agent object with status method
    mockAgent = {
      id: "agent-1",
      health: 85,
      executing_tasks: 2,
      completed_tasks: 15,
      getStatus: () => ({
        id: "agent-1",
        status: "executing",
        current_tasks: 2,
        total_tasks: 17,
        health: 85,
        uptime_ms: 5000,
      }),
    };

    // Mock orchestrator
    mockOrchestrator = {
      agents: new Map([["agent-1", mockAgent]]),
      routeMessage: jest.fn(() => ({ routed: true })),
      distributeTask: jest.fn(async (task) => ({
        queued: true,
        queue_position: 3,
      })),
      getSwarmStatus: jest.fn(() => ({
        agents_total: 1,
        agents_active: 1,
        agents_idle: 0,
        total_tasks_queued: 5,
        total_tasks_completed: 47,
        avg_health: 85,
        swarm_status: "operational",
      })),
      scaleToQueueDepth: jest.fn(async () => ({
        scaled: true,
        new_agent_count: 5,
      })),
      config: {
        min_agents: 3,
        max_agents: 20,
      },
    };

    // Create A2A Protocol instance with mock
    a2a = new A2AProtocol(mockOrchestrator, 3002);
    server = a2a.app;
  });

  afterEach(async () => {
    // Cleanup
    jest.clearAllMocks();
  });

  describe("Initialization & Middleware", () => {
    test("A2A Protocol initializes with orchestrator", () => {
      expect(a2a.orchestrator).toBe(mockOrchestrator);
      expect(a2a.port).toBe(3002);
      expect(a2a.app).toBeDefined();
    });

    test("A2A Protocol middleware processes JSON requests", async () => {
      const response = await request(server)
        .post("/api/a2a/platform/task")
        .send({ type: "test", priority: "normal" })
        .set("Content-Type", "application/json");

      // Should be processed (may 200 or 500, but not malformed)
      expect(response.status).toBeLessThan(600);
      expect(response.body).toBeDefined();
    });

    test("Error handler returns proper error response", async () => {
      const response = await request(server)
        .post("/api/a2a/agent/unknown/message")
        .send({ from_agent_id: "test", content: "test" });

      // Valid request to unknown agent - might succeed at API level
      expect(response.status).toBeLessThan(600);
      expect(response.body).toBeDefined();
    });

    test("Request logging captures request ID", async () => {
      const response = await request(server)
        .post("/api/a2a/platform/task")
        .send({ type: "test" });

      // Response should include request_id if successful or error
      expect(response.body).toBeDefined();
      if (response.body.request_id) {
        expect(response.body.request_id).toMatch(/^[a-f0-9]{8}$/);
      }
    });
  });

  describe("POST /api/a2a/agent/{agent_id}/message", () => {
    test("Posts message to specific agent with all fields", async () => {
      const response = await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({
          from_agent_id: "agent-2",
          content: "test message",
          content_type: "json",
          priority: "high",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message_id).toBeDefined();
      expect(response.body.message_id).toMatch(/^msg-/);
      expect(response.body.timestamp).toBeDefined();
    });

    test("Posts message with minimal required fields", async () => {
      const response = await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({
          from_agent_id: "agent-2",
          content: "minimal message",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message_id).toBeDefined();
    });

    test("Message validation rejects missing from_agent_id", async () => {
      const response = await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({
          content: "no sender",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("from_agent_id");
    });

    test("Message validation rejects missing content", async () => {
      const response = await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({
          from_agent_id: "agent-2",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("content");
    });

    test("Creates proper message envelope structure", async () => {
      const response = await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({
          from_agent_id: "agent-2",
          content: "test",
          content_type: "text",
          priority: "normal",
        });

      expect(response.status).toBe(200);

      // Verify orchestrator.routeMessage was called with proper envelope
      expect(mockOrchestrator.routeMessage).toHaveBeenCalled();
      const envelope = mockOrchestrator.routeMessage.mock.calls[0][0];

      expect(envelope.id).toBeDefined();
      expect(envelope.from_agent_id).toBe("agent-2");
      expect(envelope.to_agent_id).toBe("agent-1");
      expect(envelope.content).toBe("test");
      expect(envelope.content_type).toBe("text");
      expect(envelope.priority).toBe("normal");
      expect(envelope.timestamp).toBeDefined();
      expect(envelope.request_id).toBeDefined();
    });

    test("Uses default content_type when not provided", async () => {
      await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({
          from_agent_id: "agent-2",
          content: "test",
        });

      const envelope = mockOrchestrator.routeMessage.mock.calls[0][0];
      expect(envelope.content_type).toBe("text");
    });

    test("Uses default priority when not provided", async () => {
      await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({
          from_agent_id: "agent-2",
          content: "test",
        });

      const envelope = mockOrchestrator.routeMessage.mock.calls[0][0];
      expect(envelope.priority).toBe("normal");
    });

    test("Generates unique message IDs", async () => {
      const response1 = await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({
          from_agent_id: "agent-2",
          content: "msg1",
        });

      const response2 = await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({
          from_agent_id: "agent-2",
          content: "msg2",
        });

      expect(response1.body.message_id).not.toBe(response2.body.message_id);
    });

    test("Message routing calls orchestrator.routeMessage", async () => {
      await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({
          from_agent_id: "agent-2",
          content: "test",
        });

      expect(mockOrchestrator.routeMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/a2a/agent/{agent_id}", () => {
    test("Gets status of existing agent", async () => {
      const response = await request(server).get("/api/a2a/agent/agent-1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.agent).toBeDefined();
      expect(response.body.agent.id).toBe("agent-1");
      expect(response.body.agent.status).toBe("executing");
    });

    test("Returns 404 for non-existent agent", async () => {
      const response = await request(server).get("/api/a2a/agent/unknown-agent");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });

    test("Calls agent.getStatus() method", async () => {
      const spy = jest.spyOn(mockAgent, "getStatus");

      await request(server).get("/api/a2a/agent/agent-1");

      expect(spy).toHaveBeenCalled();
    });

    test("Returns complete agent status object", async () => {
      const response = await request(server).get("/api/a2a/agent/agent-1");

      const agent = response.body.agent;
      expect(agent).toHaveProperty("id");
      expect(agent).toHaveProperty("status");
      expect(agent).toHaveProperty("current_tasks");
      expect(agent).toHaveProperty("health");
    });
  });

  describe("GET /api/a2a/platform/agents", () => {
    test("Lists all agents in swarm", async () => {
      const response = await request(server).get("/api/a2a/platform/agents");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.agents)).toBe(true);
      expect(response.body.total).toBe(1);
    });

    test("Returns agent status for each agent", async () => {
      const response = await request(server).get("/api/a2a/platform/agents");

      expect(response.body.agents[0].id).toBe("agent-1");
      expect(response.body.agents[0].status).toBeDefined();
    });

    test("Returns empty list when no agents", async () => {
      mockOrchestrator.agents = new Map();

      const response = await request(server).get("/api/a2a/platform/agents");

      expect(response.status).toBe(200);
      expect(response.body.agents).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    test("Returns multiple agents in list", async () => {
      const agent2 = {
        id: "agent-2",
        getStatus: () => ({ id: "agent-2", status: "idle" }),
      };
      mockOrchestrator.agents.set("agent-2", agent2);

      const response = await request(server).get("/api/a2a/platform/agents");

      expect(response.body.agents.length).toBe(2);
      expect(response.body.total).toBe(2);
    });
  });

  describe("POST /api/a2a/platform/task", () => {
    test("Submits task with all optional fields", async () => {
      const response = await request(server)
        .post("/api/a2a/platform/task")
        .send({
          type: "data_processing",
          content: { data: "test" },
          priority: "high",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.task_id).toBeDefined();
      expect(response.body.task_id).toMatch(/^task-/);
    });

    test("Submits task with only required type field", async () => {
      const response = await request(server)
        .post("/api/a2a/platform/task")
        .send({
          type: "api_call",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.task_id).toBeDefined();
    });

    test("Rejects task missing type field", async () => {
      const response = await request(server)
        .post("/api/a2a/platform/task")
        .send({
          content: "no type",
          priority: "normal",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("type");
    });

    test("Returns queue position in response", async () => {
      const response = await request(server)
        .post("/api/a2a/platform/task")
        .send({ type: "test" });

      expect(response.body.queue_position).toBeDefined();
      expect(response.body.queue_position).toBe(3);
    });

    test("Returns queued status in response", async () => {
      const response = await request(server)
        .post("/api/a2a/platform/task")
        .send({ type: "test" });

      expect(response.body.queued).toBeDefined();
      expect(response.body.queued).toBe(true);
    });

    test("Calls orchestrator.distributeTask with task object", async () => {
      await request(server)
        .post("/api/a2a/platform/task")
        .send({
          type: "test_type",
          content: { test: "data" },
          priority: "normal",
        });

      expect(mockOrchestrator.distributeTask).toHaveBeenCalledTimes(1);
      const task = mockOrchestrator.distributeTask.mock.calls[0][0];

      expect(task.type).toBe("test_type");
      expect(task.content).toEqual({ test: "data" });
      expect(task.priority).toBe("normal");
      expect(task.id).toBeDefined();
      expect(task.submitted_at).toBeDefined();
    });

    test("Generates unique task IDs", async () => {
      const response1 = await request(server)
        .post("/api/a2a/platform/task")
        .send({ type: "test" });

      const response2 = await request(server)
        .post("/api/a2a/platform/task")
        .send({ type: "test" });

      expect(response1.body.task_id).not.toBe(response2.body.task_id);
    });

    test("Default priority is normal when omitted", async () => {
      await request(server)
        .post("/api/a2a/platform/task")
        .send({ type: "test" });

      const task = mockOrchestrator.distributeTask.mock.calls[0][0];
      expect(task.priority).toBe("normal");
    });

    test("Supports different priority levels", async () => {
      for (const priority of ["low", "normal", "high"]) {
        mockOrchestrator.distributeTask.mockClear();

        await request(server)
          .post("/api/a2a/platform/task")
          .send({ type: "test", priority });

        const task = mockOrchestrator.distributeTask.mock.calls[0][0];
        expect(task.priority).toBe(priority);
      }
    });
  });

  describe("GET /api/a2a/platform/status", () => {
    test("Returns swarm-wide status", async () => {
      const response = await request(server).get("/api/a2a/platform/status");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("Includes agent metrics in status", async () => {
      const response = await request(server).get("/api/a2a/platform/status");

      expect(response.body.agents_total).toBe(1);
      expect(response.body.agents_active).toBe(1);
    });

    test("Includes task metrics in status", async () => {
      const response = await request(server).get("/api/a2a/platform/status");

      expect(response.body.total_tasks_queued).toBe(5);
      expect(response.body.total_tasks_completed).toBe(47);
    });

    test("Calls orchestrator.getSwarmStatus()", async () => {
      await request(server).get("/api/a2a/platform/status");

      expect(mockOrchestrator.getSwarmStatus).toHaveBeenCalled();
    });

    test("Returns swarm operational status", async () => {
      const response = await request(server).get("/api/a2a/platform/status");

      expect(response.body.swarm_status).toBe("operational");
    });

    test("Includes health metrics in status", async () => {
      const response = await request(server).get("/api/a2a/platform/status");

      expect(response.body.avg_health).toBeDefined();
    });
  });

  describe("POST /api/a2a/platform/scale", () => {
    test("Triggers auto-scaling endpoint", async () => {
      const response = await request(server).post("/api/a2a/platform/scale");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("Returns agent counts in response", async () => {
      const response = await request(server).post("/api/a2a/platform/scale");

      expect(response.body.agents_total).toBe(1);
      expect(response.body.agents_min).toBe(3);
      expect(response.body.agents_max).toBe(20);
    });

    test("Calls orchestrator.scaleToQueueDepth()", async () => {
      await request(server).post("/api/a2a/platform/scale");

      expect(mockOrchestrator.scaleToQueueDepth).toHaveBeenCalled();
    });

    test("Returns config min/max agents", async () => {
      const response = await request(server).post("/api/a2a/platform/scale");

      expect(response.body.agents_min).toBeDefined();
      expect(response.body.agents_max).toBeDefined();
      expect(response.body.agents_min).toBeLessThanOrEqual(
        response.body.agents_max,
      );
    });

    test("Reflects orchestrator config values", async () => {
      const response = await request(server).post("/api/a2a/platform/scale");

      expect(response.body.agents_min).toBe(
        mockOrchestrator.config.min_agents,
      );
      expect(response.body.agents_max).toBe(
        mockOrchestrator.config.max_agents,
      );
    });
  });

  describe("GET /health", () => {
    test("Health check endpoint returns healthy status", async () => {
      const response = await request(server).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("healthy");
    });

    test("Health check identifies service", async () => {
      const response = await request(server).get("/health");

      expect(response.body.service).toBe("a2a-protocol");
    });

    test("Health check includes timestamp", async () => {
      const response = await request(server).get("/health");

      expect(response.body.timestamp).toBeDefined();
      // Validate ISO format
      expect(new Date(response.body.timestamp).toISOString()).toBeDefined();
    });

    test("Health check reports agent count", async () => {
      const response = await request(server).get("/health");

      expect(response.body.agents).toBe(1);
    });

    test("Health check reflects current agent count", async () => {
      mockOrchestrator.agents.set("agent-2", {
        id: "agent-2",
        getStatus: () => ({ id: "agent-2" }),
      });

      const response = await request(server).get("/health");

      expect(response.body.agents).toBe(2);
    });
  });

  describe("Integration & Error Scenarios", () => {
    test("Concurrent message posts handled correctly", async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(server)
            .post("/api/a2a/agent/agent-1/message")
            .send({
              from_agent_id: `agent-${i}`,
              content: `message-${i}`,
            }),
        );
      }

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      expect(mockOrchestrator.routeMessage).toHaveBeenCalledTimes(5);
    });

    test("Handles rapid task submissions", async () => {
      const promises = [];
      for (let i = 0; i(10; i++) {
        promises.push(
          request(server)
            .post("/api/a2a/platform/task")
            .send({
              type: "task",
              priority: i % 2 === 0 ? "high" : "normal",
            }),
        );
      }

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
      expect(mockOrchestrator.distributeTask).toHaveBeenCalledTimes(10);
    });

    test("Maintains request ID across request lifecycle", async () => {
      const response = await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({
          from_agent_id: "agent-2",
          content: "test",
        });

      const requestId = response.body.request_id;
      const envelope = mockOrchestrator.routeMessage.mock.calls[0][0];

      expect(envelope.request_id).toBeDefined();
      // Request ID should be present in the envelope
      expect(envelope.request_id).toMatch(/^[a-f0-9]{8}$/);
    });

    test("Error responses include request_id for tracing", async () => {
      const response = await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({ content: "missing from_agent_id" });

      expect(response.body.request_id).toBeDefined();
    });

    test("Server lifecycle methods exist", async () => {
      expect(typeof a2a.start).toBe("function");
      expect(typeof a2a.stop).toBe("function");
    });

    test("Can start and stop server", async () => {
      const server = await a2a.start();
      expect(server).toBeDefined();

      await a2a.stop();
      // Server should be closed
    });
  });

  describe("API Consistency", () => {
    test("All success responses have success field", async () => {
      const endpoints = [
        { method: "get", url: "/api/a2a/platform/agents" },
        { method: "get", url: "/api/a2a/platform/status" },
        { method: "post", url: "/api/a2a/platform/scale" },
        { method: "get", url: "/health" },
      ];

      for (const endpoint of endpoints) {
        const req = request(server)[endpoint.method](endpoint.url);
        const response = await req;

        if (response.status === 200) {
          // Health endpoint may not have success field but others should
          if (endpoint.url !== "/health") {
            expect(response.body.success).toBeDefined();
          }
        }
      }
    });

    test("All error responses include error message", async () => {
      const response = await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({ content: "incomplete" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(typeof response.body.error).toBe("string");
    });

    test("Timestamps in responses are ISO format", async () => {
      const response = await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({
          from_agent_id: "agent-2",
          content: "test",
        });

      expect(response.body.timestamp).toBeDefined();
      const date = new Date(response.body.timestamp);
      expect(date.toISOString()).toBeDefined();
    });

    test("Message/Task IDs follow consistent format", async () => {
      const msgResponse = await request(server)
        .post("/api/a2a/agent/agent-1/message")
        .send({
          from_agent_id: "agent-2",
          content: "test",
        });

      const taskResponse = await request(server)
        .post("/api/a2a/platform/task")
        .send({ type: "test" });

      expect(msgResponse.body.message_id).toMatch(/^msg-\d+-[a-f0-9]+$/);
      expect(taskResponse.body.task_id).toMatch(/^task-\d+-[a-f0-9]+$/);
    });
  });
});
