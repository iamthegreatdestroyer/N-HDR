/**
 * Neural-HDR (N-HDR): Claude-Flow Multi-Agent Task Orchestrator
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Phase 9.3: Claude-Flow — swarm-powered multi-agent orchestration for
 * autonomous task decomposition, parallel execution, and result synthesis.
 *
 * File: claude-flow.js
 * Created: 2026-02-01
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import { EventEmitter } from "events";
import config from "../../../config/nhdr-config.js";

// ─────────────────────────────────────────────────────────────
// Agent Role Definitions
// ─────────────────────────────────────────────────────────────

/**
 * @enum {string} Pre-defined agent specializations
 */
export const AgentRole = Object.freeze({
  ARCHITECT: "architect", // System design & decomposition
  ENGINEER: "engineer", // Core implementation
  ANALYST: "analyst", // Data analysis & optimisation
  SECURITY: "security", // Security hardening
  REVIEWER: "reviewer", // Quality assurance
  SYNTHESIZER: "synthesizer", // Result merging & insight extraction
  EXPLORER: "explorer", // Research & discovery
});

/**
 * @enum {string} Task lifecycle states
 */
export const TaskState = Object.freeze({
  PENDING: "pending",
  QUEUED: "queued",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
});

/**
 * @enum {string} Orchestration strategies
 */
export const Strategy = Object.freeze({
  PARALLEL: "parallel", // Run all sub-tasks concurrently
  PIPELINE: "pipeline", // Sequential with output piping
  MAP_REDUCE: "map_reduce", // Split, parallel process, merge
  CONSENSUS: "consensus", // Multiple agents, vote on result
  HIERARCHICAL: "hierarchical", // Tree-structured delegation
});

// ─────────────────────────────────────────────────────────────
// Claude-Flow Orchestrator
// ─────────────────────────────────────────────────────────────

class ClaudeFlowOrchestrator extends EventEmitter {
  /**
   * @param {Object} opts
   * @param {number} [opts.maxConcurrentAgents=8]   Agent pool ceiling
   * @param {number} [opts.taskTimeoutMs=300000]    Per-task timeout (5 min)
   * @param {string} [opts.defaultStrategy='parallel']
   * @param {boolean}[opts.enableSwarmAcceleration=true]
   */
  constructor(opts = {}) {
    super();

    this.maxConcurrentAgents = opts.maxConcurrentAgents ?? 8;
    this.taskTimeoutMs = opts.taskTimeoutMs ?? 300_000;
    this.defaultStrategy = opts.defaultStrategy ?? Strategy.PARALLEL;
    this.enableSwarmAcceleration = opts.enableSwarmAcceleration ?? true;

    // Agent pool
    this.agents = new Map(); // id → AgentDescriptor
    this.agentSeq = 0;

    // Task management
    this.tasks = new Map(); // id → TaskDescriptor
    this.taskSeq = 0;
    this.taskQueue = []; // pending task ids
    this.activeCount = 0;

    // Workflows (compound task graphs)
    this.workflows = new Map(); // id → WorkflowDescriptor
    this.workflowSeq = 0;

    // Metrics
    this.metrics = {
      tasksCreated: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      totalLatencyMs: 0,
      agentUtilisation: 0,
      workflowsRun: 0,
    };

    // Swarm integration reference (set via connectSwarm)
    this._swarmHDR = null;
  }

  // ───────────────── Agent Management ─────────────────

  /**
   * Register an agent with the orchestrator.
   * An "agent" here is a logical execution unit — it can be backed by an
   * LLM call, a local function, or a remote MCP tool.
   *
   * @param {Object}   descriptor
   * @param {string}   descriptor.role       One of AgentRole values
   * @param {string}   [descriptor.name]     Human-readable label
   * @param {Function} descriptor.execute    async (task) => result
   * @param {string[]} [descriptor.capabilities]  Skill tags
   * @param {number}   [descriptor.maxConcurrency=1]
   * @returns {string} Agent ID
   */
  registerAgent(descriptor) {
    const id = `agent-${++this.agentSeq}-${descriptor.role}`;
    const agent = {
      id,
      role: descriptor.role,
      name: descriptor.name ?? id,
      execute: descriptor.execute,
      capabilities: descriptor.capabilities ?? [],
      maxConcurrency: descriptor.maxConcurrency ?? 1,
      activeTasks: 0,
      totalTasks: 0,
      totalLatencyMs: 0,
      state: "idle",
      createdAt: Date.now(),
    };

    this.agents.set(id, agent);
    this.emit("agent:registered", { agentId: id, role: agent.role });
    return id;
  }

  /**
   * Remove an agent from the pool (gracefully waits for active tasks).
   * @param {string} agentId
   */
  async deregisterAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Wait for active tasks to drain
    while (agent.activeTasks > 0) {
      await new Promise((r) => setTimeout(r, 250));
    }

    this.agents.delete(agentId);
    this.emit("agent:deregistered", { agentId });
  }

  // ───────────────── Task Lifecycle ─────────────────

  /**
   * Create a task and optionally submit it for execution.
   *
   * @param {Object}   spec
   * @param {string}   spec.title          Human-readable summary
   * @param {string}   [spec.description]  Detailed instructions / prompt
   * @param {Object}   [spec.input]        Structured input data
   * @param {string}   [spec.requiredRole] AgentRole needed
   * @param {string[]} [spec.requiredCapabilities] Skill tags that agent must have
   * @param {number}   [spec.priority=5]   1 (highest) – 10 (lowest)
   * @param {string}   [spec.parentTaskId] For sub-tasks within a workflow
   * @param {string}   [spec.workflowId]   Associated workflow
   * @param {boolean}  [spec.autoSubmit=true]
   * @returns {string} Task ID
   */
  createTask(spec) {
    const id = `task-${++this.taskSeq}-${Date.now().toString(36)}`;
    const task = {
      id,
      title: spec.title,
      description: spec.description ?? "",
      input: spec.input ?? {},
      requiredRole: spec.requiredRole ?? null,
      requiredCapabilities: spec.requiredCapabilities ?? [],
      priority: spec.priority ?? 5,
      parentTaskId: spec.parentTaskId ?? null,
      workflowId: spec.workflowId ?? null,
      state: TaskState.PENDING,
      assignedAgent: null,
      result: null,
      error: null,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
    };

    this.tasks.set(id, task);
    this.metrics.tasksCreated++;
    this.emit("task:created", { taskId: id });

    if (spec.autoSubmit !== false) {
      this._enqueue(id);
    }

    return id;
  }

  /**
   * Wait for a task to reach a terminal state.
   * @param {string} taskId
   * @param {number} [timeoutMs]
   * @returns {Promise<Object>} The completed TaskDescriptor
   */
  awaitTask(taskId, timeoutMs) {
    const timeout = timeoutMs ?? this.taskTimeoutMs;
    return new Promise((resolve, reject) => {
      const task = this.tasks.get(taskId);
      if (!task) return reject(new Error(`Task ${taskId} not found`));
      if (task.state === TaskState.COMPLETED) return resolve(task);
      if (task.state === TaskState.FAILED) return reject(task.error);

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Task ${taskId} timed out after ${timeout}ms`));
      }, timeout);

      const onComplete = (evt) => {
        if (evt.taskId !== taskId) return;
        cleanup();
        resolve(this.tasks.get(taskId));
      };
      const onFail = (evt) => {
        if (evt.taskId !== taskId) return;
        cleanup();
        reject(this.tasks.get(taskId).error);
      };

      const cleanup = () => {
        clearTimeout(timer);
        this.removeListener("task:completed", onComplete);
        this.removeListener("task:failed", onFail);
      };

      this.on("task:completed", onComplete);
      this.on("task:failed", onFail);
    });
  }

  // ───────────────── Workflow Orchestration ─────────────────

  /**
   * Create and execute a compound workflow.
   *
   * A workflow is a set of tasks connected by a strategy.
   *
   * @param {Object}   spec
   * @param {string}   spec.name
   * @param {string}   [spec.strategy]       One of Strategy values
   * @param {Object[]} spec.steps            Array of task specs (same shape as createTask)
   * @param {Function} [spec.reducer]        For MAP_REDUCE — async (results) => mergedResult
   * @param {Function} [spec.voter]          For CONSENSUS  — async (results) => bestResult
   * @returns {Promise<Object>} Workflow result
   */
  async executeWorkflow(spec) {
    const wfId = `wf-${++this.workflowSeq}-${Date.now().toString(36)}`;
    const strategy = spec.strategy ?? this.defaultStrategy;

    const workflow = {
      id: wfId,
      name: spec.name,
      strategy,
      steps: spec.steps,
      taskIds: [],
      state: "running",
      startedAt: Date.now(),
      result: null,
    };
    this.workflows.set(wfId, workflow);
    this.metrics.workflowsRun++;

    this.emit("workflow:started", { workflowId: wfId, strategy });

    let result;
    try {
      switch (strategy) {
        case Strategy.PARALLEL:
          result = await this._runParallel(workflow, spec);
          break;
        case Strategy.PIPELINE:
          result = await this._runPipeline(workflow, spec);
          break;
        case Strategy.MAP_REDUCE:
          result = await this._runMapReduce(workflow, spec);
          break;
        case Strategy.CONSENSUS:
          result = await this._runConsensus(workflow, spec);
          break;
        case Strategy.HIERARCHICAL:
          result = await this._runHierarchical(workflow, spec);
          break;
        default:
          throw new Error(`Unknown strategy: ${strategy}`);
      }
    } catch (err) {
      workflow.state = "failed";
      workflow.error = err;
      this.emit("workflow:failed", { workflowId: wfId, error: err.message });
      throw err;
    }

    workflow.state = "completed";
    workflow.result = result;
    workflow.completedAt = Date.now();

    this.emit("workflow:completed", {
      workflowId: wfId,
      durationMs: workflow.completedAt - workflow.startedAt,
    });

    return result;
  }

  // ───────────────── Swarm Integration ─────────────────

  /**
   * Connect this orchestrator to a NanoSwarmHDR instance so that
   * swarm-level acceleration can be applied to task routing.
   *
   * @param {NanoSwarmHDR} swarmHDR
   */
  connectSwarm(swarmHDR) {
    this._swarmHDR = swarmHDR;
    this.emit("swarm:connected", { swarmSize: swarmHDR.swarmSize });
  }

  /**
   * Deploy a specialised swarm for the given workflow.
   * @param {string} workflowId
   * @param {Object} [opts]
   * @returns {Promise<Object>} Deployed swarm descriptor
   */
  async deployWorkflowSwarm(workflowId, opts = {}) {
    if (!this._swarmHDR) throw new Error("Swarm not connected");

    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    const specializations = [
      ...new Set(workflow.steps.map((s) => s.requiredRole).filter(Boolean)),
    ];

    return this._swarmHDR.deploySwarm(`workflow/${workflowId}`, {
      initialBots: opts.bots ?? specializations.length * 25,
      specializations,
      taskTypes: workflow.steps.map((s) => s.title),
      ...opts,
    });
  }

  // ───────────────── Diagnostics ─────────────────

  /**
   * Return orchestrator health and performance metrics.
   * @returns {Object}
   */
  getStatus() {
    const agents = Array.from(this.agents.values()).map((a) => ({
      id: a.id,
      role: a.role,
      name: a.name,
      state: a.state,
      activeTasks: a.activeTasks,
      totalTasks: a.totalTasks,
      avgLatencyMs:
        a.totalTasks > 0 ? Math.round(a.totalLatencyMs / a.totalTasks) : 0,
    }));

    return {
      agents,
      agentCount: this.agents.size,
      activeCount: this.activeCount,
      queueLength: this.taskQueue.length,
      metrics: { ...this.metrics },
      swarmConnected: !!this._swarmHDR,
    };
  }

  /**
   * Get a single task's full descriptor.
   * @param {string} taskId
   * @returns {Object|null}
   */
  getTask(taskId) {
    return this.tasks.get(taskId) ?? null;
  }

  // ═══════════════════════════════════════════════════
  //  INTERNAL — scheduling, strategy runners
  // ═══════════════════════════════════════════════════

  /** @private Place task in the priority queue and kick the scheduler. */
  _enqueue(taskId) {
    const task = this.tasks.get(taskId);
    task.state = TaskState.QUEUED;
    this.taskQueue.push(taskId);
    // Sort by priority (lower = higher priority)
    this.taskQueue.sort(
      (a, b) => this.tasks.get(a).priority - this.tasks.get(b).priority,
    );
    this._schedule();
  }

  /** @private Try to assign queued tasks to available agents. */
  _schedule() {
    while (
      this.taskQueue.length > 0 &&
      this.activeCount < this.maxConcurrentAgents
    ) {
      const taskId = this.taskQueue.shift();
      const task = this.tasks.get(taskId);

      const agent = this._selectAgent(task);
      if (!agent) {
        // No eligible agent — put back at head
        this.taskQueue.unshift(taskId);
        break;
      }

      this._dispatch(task, agent);
    }
  }

  /** @private Find the best idle agent for a task. */
  _selectAgent(task) {
    let best = null;
    let bestScore = -Infinity;

    for (const agent of this.agents.values()) {
      if (agent.activeTasks >= agent.maxConcurrency) continue;

      let score = 0;

      // Role match is strongly preferred
      if (task.requiredRole && agent.role === task.requiredRole) {
        score += 100;
      } else if (task.requiredRole && agent.role !== task.requiredRole) {
        continue; // hard constraint
      }

      // Capability matching
      const capMatch = task.requiredCapabilities.filter((c) =>
        agent.capabilities.includes(c),
      ).length;
      score += capMatch * 20;

      // Prefer less-loaded agents
      score -= agent.activeTasks * 10;

      // Prefer faster agents (lower avg latency)
      if (agent.totalTasks > 0) {
        const avgLat = agent.totalLatencyMs / agent.totalTasks;
        score -= avgLat / 1000; // penalty proportional to seconds
      }

      if (score > bestScore) {
        bestScore = score;
        best = agent;
      }
    }

    return best;
  }

  /** @private Dispatch task to agent. */
  _dispatch(task, agent) {
    task.state = TaskState.ASSIGNED;
    task.assignedAgent = agent.id;
    task.startedAt = Date.now();

    agent.activeTasks++;
    agent.state = "busy";
    this.activeCount++;

    this.emit("task:assigned", { taskId: task.id, agentId: agent.id });

    // Run asynchronously
    this._executeTask(task, agent)
      .then((result) => {
        task.result = result;
        task.state = TaskState.COMPLETED;
        task.completedAt = Date.now();

        const latency = task.completedAt - task.startedAt;
        agent.totalLatencyMs += latency;
        agent.totalTasks++;
        this.metrics.tasksCompleted++;
        this.metrics.totalLatencyMs += latency;

        this.emit("task:completed", { taskId: task.id, latencyMs: latency });
      })
      .catch((err) => {
        task.error = err;
        task.state = TaskState.FAILED;
        task.completedAt = Date.now();

        agent.totalTasks++;
        this.metrics.tasksFailed++;

        this.emit("task:failed", { taskId: task.id, error: err.message });
      })
      .finally(() => {
        agent.activeTasks--;
        agent.state = agent.activeTasks > 0 ? "busy" : "idle";
        this.activeCount--;

        // Update utilisation metric
        this.metrics.agentUtilisation =
          this.activeCount / Math.max(1, this.agents.size);

        // Reschedule queued tasks
        this._schedule();
      });
  }

  /** @private Execute task via agent's execute function with timeout. */
  async _executeTask(task, agent) {
    task.state = TaskState.IN_PROGRESS;
    this.emit("task:started", { taskId: task.id, agentId: agent.id });

    return Promise.race([
      agent.execute({
        id: task.id,
        title: task.title,
        description: task.description,
        input: task.input,
        workflowId: task.workflowId,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Task ${task.id} timed out`)),
          this.taskTimeoutMs,
        ),
      ),
    ]);
  }

  // ───── Strategy Runners ─────

  /** @private All steps in parallel, return array of results. */
  async _runParallel(workflow, spec) {
    const ids = spec.steps.map((step) =>
      this.createTask({ ...step, workflowId: workflow.id }),
    );
    workflow.taskIds = ids;

    const results = await Promise.all(ids.map((id) => this.awaitTask(id)));
    return results.map((t) => t.result);
  }

  /** @private Sequential: output of step N becomes input of step N+1. */
  async _runPipeline(workflow, spec) {
    let pipeInput = {};
    const results = [];

    for (const step of spec.steps) {
      const merged = { ...step.input, ...pipeInput };
      const taskId = this.createTask({
        ...step,
        input: merged,
        workflowId: workflow.id,
      });
      workflow.taskIds.push(taskId);

      const completed = await this.awaitTask(taskId);
      results.push(completed.result);
      // Pipe output → next input
      pipeInput =
        typeof completed.result === "object"
          ? completed.result
          : { previousResult: completed.result };
    }

    return results;
  }

  /** @private Generate tasks in parallel, then reduce results. */
  async _runMapReduce(workflow, spec) {
    const reducer = spec.reducer ?? ((results) => results);

    // Map phase
    const ids = spec.steps.map((step) =>
      this.createTask({ ...step, workflowId: workflow.id }),
    );
    workflow.taskIds = ids;

    const completed = await Promise.all(ids.map((id) => this.awaitTask(id)));
    const mapped = completed.map((t) => t.result);

    // Reduce phase
    return reducer(mapped);
  }

  /** @private Same task executed by multiple agents, best result chosen. */
  async _runConsensus(workflow, spec) {
    const voter = spec.voter ?? ((results) => results[0]);

    // Clone the base step for each available agent with matching role
    const baseStep = spec.steps[0]; // consensus uses first step as template

    const eligibleAgents = Array.from(this.agents.values()).filter(
      (a) => !baseStep.requiredRole || a.role === baseStep.requiredRole,
    );

    if (eligibleAgents.length === 0) {
      throw new Error("No eligible agents for consensus");
    }

    // Submit one task per eligible agent (max 5)
    const copies = Math.min(eligibleAgents.length, 5);
    const ids = [];
    for (let i = 0; i < copies; i++) {
      const taskId = this.createTask({
        ...baseStep,
        title: `${baseStep.title} [consensus-${i}]`,
        workflowId: workflow.id,
      });
      ids.push(taskId);
    }
    workflow.taskIds = ids;

    const completed = await Promise.allSettled(
      ids.map((id) => this.awaitTask(id)),
    );

    const successes = completed
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value.result);

    if (successes.length === 0) {
      throw new Error("All consensus agents failed");
    }

    return voter(successes);
  }

  /** @private Tree-structured delegation: first task decomposes into sub-tasks. */
  async _runHierarchical(workflow, spec) {
    // Execute root task (it should return an array of sub-task specs)
    const rootStep = spec.steps[0];
    const rootId = this.createTask({
      ...rootStep,
      workflowId: workflow.id,
    });
    workflow.taskIds.push(rootId);

    const rootCompleted = await this.awaitTask(rootId);
    const subSpecs = rootCompleted.result;

    // If root returned sub-tasks, execute them in parallel
    if (Array.isArray(subSpecs) && subSpecs.length > 0) {
      const subIds = subSpecs.map((sub) =>
        this.createTask({
          ...sub,
          parentTaskId: rootId,
          workflowId: workflow.id,
        }),
      );
      workflow.taskIds.push(...subIds);

      const subResults = await Promise.all(
        subIds.map((id) => this.awaitTask(id)),
      );

      return {
        root: rootCompleted.result,
        children: subResults.map((t) => t.result),
      };
    }

    return rootCompleted.result;
  }
}

// ─────────────────────────────────────────────────────────────
// Factory: Create a pre-configured orchestrator with HDR agents
// ─────────────────────────────────────────────────────────────

/**
 * Build a ClaudeFlowOrchestrator pre-populated with default HDR agent
 * stubs suitable for consciousness-processing workflows.
 *
 * Real LLM or MCP-backed agents can be swapped in after creation.
 *
 * @param {Object} [opts]  Passed to ClaudeFlowOrchestrator constructor
 * @returns {ClaudeFlowOrchestrator}
 */
export function createHDROrchestrator(opts = {}) {
  const orchestrator = new ClaudeFlowOrchestrator(opts);

  // Register default agent stubs
  const defaultStubs = [
    {
      role: AgentRole.ARCHITECT,
      name: "HDR Architect",
      capabilities: ["system-design", "decomposition", "planning"],
      execute: async (task) => ({
        plan: `Architecture plan for: ${task.title}`,
        subTasks: [],
        timestamp: Date.now(),
      }),
    },
    {
      role: AgentRole.ENGINEER,
      name: "HDR Engineer",
      capabilities: ["implementation", "coding", "integration"],
      maxConcurrency: 3,
      execute: async (task) => ({
        code: `Implementation for: ${task.title}`,
        status: "complete",
        timestamp: Date.now(),
      }),
    },
    {
      role: AgentRole.ANALYST,
      name: "HDR Analyst",
      capabilities: ["analysis", "optimization", "metrics"],
      execute: async (task) => ({
        analysis: `Analysis of: ${task.title}`,
        metrics: {},
        timestamp: Date.now(),
      }),
    },
    {
      role: AgentRole.SECURITY,
      name: "HDR Security",
      capabilities: ["audit", "hardening", "compliance", "pqc"],
      execute: async (task) => ({
        auditResult: `Security review for: ${task.title}`,
        vulnerabilities: [],
        timestamp: Date.now(),
      }),
    },
    {
      role: AgentRole.REVIEWER,
      name: "HDR Reviewer",
      capabilities: ["review", "qa", "testing"],
      execute: async (task) => ({
        review: `QA review for: ${task.title}`,
        approved: true,
        timestamp: Date.now(),
      }),
    },
    {
      role: AgentRole.SYNTHESIZER,
      name: "HDR Synthesizer",
      capabilities: ["synthesis", "merging", "summarization"],
      execute: async (task) => ({
        synthesis: `Synthesized output for: ${task.title}`,
        sources: Object.keys(task.input),
        timestamp: Date.now(),
      }),
    },
  ];

  for (const stub of defaultStubs) {
    orchestrator.registerAgent(stub);
  }

  return orchestrator;
}

export { ClaudeFlowOrchestrator };
export default ClaudeFlowOrchestrator;
