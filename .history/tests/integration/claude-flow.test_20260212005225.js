/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Claude-Flow Orchestrator Integration Tests — Phase 9.7
 * Tests multi-agent task orchestration, workflow execution,
 * agent management, and swarm bridge.
 */

import ClaudeFlowOrchestrator, {
  AgentRole,
  TaskState,
  Strategy,
  createHDROrchestrator,
} from "../../src/core/nano-swarm/claude-flow.js";

describe("Claude-Flow Orchestrator Integration", () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new ClaudeFlowOrchestrator({
      maxConcurrentAgents: 4,
      taskTimeoutMs: 5000,
      defaultStrategy: Strategy.PARALLEL,
    });
  });

  // ─── Factory ──────────────────────────────────────────────────────────────

  describe("factory", () => {
    it("should create orchestrator via factory function", () => {
      const o = createHDROrchestrator({ maxConcurrentAgents: 2 });
      expect(o).toBeInstanceOf(ClaudeFlowOrchestrator);
      expect(o.maxConcurrentAgents).toBe(2);
    });

    it("should use default options", () => {
      const o = createHDROrchestrator();
      expect(o.maxConcurrentAgents).toBe(8);
      expect(o.defaultStrategy).toBe(Strategy.PARALLEL);
    });
  });

  // ─── Enums ────────────────────────────────────────────────────────────────

  describe("enums", () => {
    it("should have all agent roles", () => {
      expect(AgentRole.ANALYZER).toBeDefined();
      expect(AgentRole.EXECUTOR).toBeDefined();
      expect(AgentRole.VALIDATOR).toBeDefined();
      expect(AgentRole.COORDINATOR).toBeDefined();
      expect(Object.keys(AgentRole).length).toBeGreaterThanOrEqual(4);
    });

    it("should have all task states", () => {
      expect(TaskState.PENDING).toBeDefined();
      expect(TaskState.RUNNING).toBeDefined();
      expect(TaskState.COMPLETED).toBeDefined();
      expect(TaskState.FAILED).toBeDefined();
    });

    it("should have all strategies", () => {
      expect(Strategy.SEQUENTIAL).toBeDefined();
      expect(Strategy.PARALLEL).toBeDefined();
      expect(Strategy.PIPELINE).toBeDefined();
      expect(Strategy.CONSENSUS).toBeDefined();
      expect(Strategy.HIERARCHICAL).toBeDefined();
    });

    it("enums should be frozen", () => {
      expect(Object.isFrozen(AgentRole)).toBe(true);
      expect(Object.isFrozen(TaskState)).toBe(true);
      expect(Object.isFrozen(Strategy)).toBe(true);
    });
  });

  // ─── Agent Management ─────────────────────────────────────────────────────

  describe("agent management", () => {
    it("should register an agent", () => {
      const id = orchestrator.registerAgent({
        role: AgentRole.ANALYZER,
        name: "test-analyzer",
        execute: async (task) => ({ result: "analyzed" }),
        capabilities: ["analysis", "parsing"],
      });

      expect(id).toBeDefined();
      expect(typeof id).toBe("string");
      expect(orchestrator.agents.size).toBe(1);
    });

    it("should register multiple agents", () => {
      orchestrator.registerAgent({
        role: AgentRole.ANALYZER,
        name: "a1",
        execute: async () => ({}),
      });
      orchestrator.registerAgent({
        role: AgentRole.EXECUTOR,
        name: "e1",
        execute: async () => ({}),
      });

      expect(orchestrator.agents.size).toBe(2);
    });

    it("should assign unique IDs", () => {
      const id1 = orchestrator.registerAgent({
        role: AgentRole.ANALYZER,
        execute: async () => ({}),
      });
      const id2 = orchestrator.registerAgent({
        role: AgentRole.EXECUTOR,
        execute: async () => ({}),
      });

      expect(id1).not.toBe(id2);
    });
  });

  // ─── Task Submission & Execution ──────────────────────────────────────────

  describe("task execution", () => {
    beforeEach(() => {
      orchestrator.registerAgent({
        role: AgentRole.EXECUTOR,
        name: "simple-exec",
        execute: async (task) => ({
          output: `executed: ${task.payload?.input ?? "no-input"}`,
        }),
        capabilities: ["general"],
      });
    });

    it("should submit a task", () => {
      const taskId = orchestrator.submitTask({
        payload: { input: "hello" },
        requiredCapabilities: ["general"],
      });

      expect(taskId).toBeDefined();
      expect(orchestrator.tasks.has(taskId)).toBe(true);
    });

    it("should execute a task and complete", async () => {
      const taskId = orchestrator.submitTask({
        payload: { input: "test-data" },
        requiredCapabilities: ["general"],
      });

      // Process the queue
      await orchestrator.processQueue();

      const task = orchestrator.tasks.get(taskId);
      expect(task.state).toBe(TaskState.COMPLETED);
      expect(task.result.output).toContain("test-data");
    });

    it("should track metrics", async () => {
      orchestrator.submitTask({
        payload: { input: "m1" },
        requiredCapabilities: ["general"],
      });

      await orchestrator.processQueue();

      expect(orchestrator.metrics.tasksCreated).toBeGreaterThanOrEqual(1);
      expect(orchestrator.metrics.tasksCompleted).toBeGreaterThanOrEqual(1);
    });

    it("should handle task failure gracefully", async () => {
      orchestrator.registerAgent({
        role: AgentRole.EXECUTOR,
        name: "failing-agent",
        execute: async () => {
          throw new Error("Intentional failure");
        },
        capabilities: ["fail"],
      });

      const taskId = orchestrator.submitTask({
        payload: {},
        requiredCapabilities: ["fail"],
      });

      await orchestrator.processQueue();

      const task = orchestrator.tasks.get(taskId);
      expect(task.state).toBe(TaskState.FAILED);
    });
  });

  // ─── Events ───────────────────────────────────────────────────────────────

  describe("events", () => {
    it("should emit task:complete event", async () => {
      orchestrator.registerAgent({
        role: AgentRole.EXECUTOR,
        name: "evt-agent",
        execute: async () => ({ done: true }),
        capabilities: ["evt"],
      });

      const completePromise = new Promise((resolve) =>
        orchestrator.once("task:complete", resolve),
      );

      orchestrator.submitTask({
        payload: {},
        requiredCapabilities: ["evt"],
      });

      await orchestrator.processQueue();
      const evt = await completePromise;
      expect(evt).toBeDefined();
    });
  });

  // ─── Constructor Defaults ─────────────────────────────────────────────────

  describe("constructor defaults", () => {
    it("should use defaults when no options provided", () => {
      const o = new ClaudeFlowOrchestrator();
      expect(o.maxConcurrentAgents).toBe(8);
      expect(o.taskTimeoutMs).toBe(300_000);
      expect(o.defaultStrategy).toBe(Strategy.PARALLEL);
      expect(o.enableSwarmAcceleration).toBe(true);
    });
  });
});
