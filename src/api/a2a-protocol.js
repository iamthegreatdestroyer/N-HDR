/**
 * A2A Protocol - Agent-to-Agent Communication API
 *
 * RESTful endpoints for inter-agent messaging & coordination
 * Task 9.3: A2A Protocol Implementation
 *
 * Features:
 * - RESTful agent messaging with envelope structure
 * - Agent discovery via registry
 * - Task submission & routing
 * - Swarm-wide status queries
 * - Message correlation & tracing
 */

const express = require("express");
const crypto = require("crypto");

class A2AProtocol {
  constructor(orchestrator, port = 3002) {
    this.orchestrator = orchestrator;
    this.port = port;
    this.app = express();

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json());

    // Request logging
    this.app.use((req, res, next) => {
      const request_id = crypto.randomBytes(4).toString("hex");
      req.request_id = request_id;
      console.log(
        `[${request_id}] ${req.method} ${req.path} - ${new Date().toISOString()}`,
      );
      next();
    });

    // Error handling
    this.app.use((err, req, res, next) => {
      console.error(`[${req.request_id}] Error:`, err);
      res.status(err.status || 500).json({
        success: false,
        error: err.message,
        request_id: req.request_id,
      });
    });
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    /**
     * POST /api/a2a/agent/{agent_id}/message
     * Send message to specific agent
     */
    this.app.post("/api/a2a/agent/:agent_id/message", (req, res) => {
      try {
        const { agent_id } = req.params;
        const { from_agent_id, content, content_type, priority } = req.body;

        // Validate
        if (!from_agent_id || !content) {
          return res.status(400).json({
            success: false,
            error: "Missing required fields: from_agent_id, content",
          });
        }

        // Create envelope
        const envelope = {
          id: `msg-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
          from_agent_id,
          to_agent_id: agent_id,
          content,
          content_type: content_type || "text",
          timestamp: new Date().toISOString(),
          priority: priority || "normal",
          request_id: req.request_id,
        };

        // Route message
        this.orchestrator.routeMessage(envelope);

        res.json({
          success: true,
          message_id: envelope.id,
          timestamp: envelope.timestamp,
        });
      } catch (e) {
        res.status(500).json({
          success: false,
          error: e.message,
        });
      }
    });

    /**
     * GET /api/a2a/agent/{agent_id}
     * Get specific agent status
     */
    this.app.get("/api/a2a/agent/:agent_id", (req, res) => {
      try {
        const { agent_id } = req.params;
        const agent = this.orchestrator.agents.get(agent_id);

        if (!agent) {
          return res.status(404).json({
            success: false,
            error: `Agent ${agent_id} not found`,
          });
        }

        res.json({
          success: true,
          agent: agent.getStatus(),
        });
      } catch (e) {
        res.status(500).json({
          success: false,
          error: e.message,
        });
      }
    });

    /**
     * GET /api/a2a/platform/agents
     * List all agents in swarm
     */
    this.app.get("/api/a2a/platform/agents", (req, res) => {
      try {
        const agents = [];
        for (const [, agent] of this.orchestrator.agents) {
          agents.push(agent.getStatus());
        }

        res.json({
          success: true,
          agents,
          total: agents.length,
        });
      } catch (e) {
        res.status(500).json({
          success: false,
          error: e.message,
        });
      }
    });

    /**
     * POST /api/a2a/platform/task
     * Submit task to swarm (auto-distributed)
     */
    this.app.post("/api/a2a/platform/task", async (req, res) => {
      try {
        const { type, content, priority } = req.body;

        if (!type) {
          return res.status(400).json({
            success: false,
            error: "Missing required field: type",
          });
        }

        // Create task
        const task = {
          id: `task-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
          type,
          content,
          priority: priority || "normal",
          submitted_at: new Date().toISOString(),
          request_id: req.request_id,
        };

        // Distribute to orchestrator
        const result = await this.orchestrator.distributeTask(task);

        res.json({
          success: true,
          task_id: task.id,
          queued: result.queued || false,
          queue_position: result.queue_position,
        });
      } catch (e) {
        res.status(500).json({
          success: false,
          error: e.message,
        });
      }
    });

    /**
     * GET /api/a2a/platform/status
     * Get swarm-wide status
     */
    this.app.get("/api/a2a/platform/status", (req, res) => {
      try {
        const status = this.orchestrator.getSwarmStatus();
        res.json({
          success: true,
          ...status,
        });
      } catch (e) {
        res.status(500).json({
          success: false,
          error: e.message,
        });
      }
    });

    /**
     * POST /api/a2a/platform/scale
     * Auto-scale based on queue depth
     */
    this.app.post("/api/a2a/platform/scale", async (req, res) => {
      try {
        await this.orchestrator.scaleToQueueDepth();

        res.json({
          success: true,
          agents_total: this.orchestrator.agents.size,
          agents_min: this.orchestrator.config.min_agents,
          agents_max: this.orchestrator.config.max_agents,
        });
      } catch (e) {
        res.status(500).json({
          success: false,
          error: e.message,
        });
      }
    });

    /**
     * Health check endpoint
     */
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        service: "a2a-protocol",
        timestamp: new Date().toISOString(),
        agents: this.orchestrator.agents.size,
      });
    });
  }

  /**
   * Start A2A server
   */
  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`A2A Protocol server started on port ${this.port}`);
        resolve(this.server);
      });
    });
  }

  /**
   * Stop A2A server
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log("A2A Protocol server stopped");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = A2AProtocol;
