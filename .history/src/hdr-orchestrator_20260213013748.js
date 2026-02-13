/**
 * HDR Integration Orchestrator
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 *
 * Central coordinator for GENESIS-ORACLE-D-HDR workflow orchestration
 * - Manages multi-agent evolutionary breeding and prediction
 * - Orchestrates consequence simulation and exploration
 * - Agent card publishing and marketplace management
 * - System health monitoring and metrics collection
 *
 * Phase 10: Intelligence Layer - Week 4
 */

import { EventEmitter } from "events";
import pino from "pino";

const logger = pino({
  name: "hdr-orchestrator",
  level: process.env.LOG_LEVEL || "info",
});

/**
 * HDR Integration Orchestrator - Central coordination engine
 */
export class HDRIntegrationOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();

    this.genesis = config.genesis;
    this.oracle = config.oracle;
    this.diffusion = config.diffusion;

    this.config = {
      maxConcurrentWorkflows: config.maxConcurrentWorkflows || 5,
      workflowTimeout: config.workflowTimeout || 60000,
      agentCardRegistry: config.agentCardRegistry || new Map(),
      plugins: [],
      ...config,
    };

    this.state = "idle";
    this.workflowQueue = [];
    this.activeWorkflows = new Map();
    this.agentCardRegistry = new Map();
    this.systemMetrics = {
      workflowsExecuted: 0,
      agentsCreated: 0,
      predictionsGenerated: 0,
      consequencesExplored: 0,
      agentCardsPublished: 0,
      uptime: Date.now(),
    };

    logger.info("HDR Integration Orchestrator initialized", {
      hasGenesis: !!this.genesis,
      hasOracle: !!this.oracle,
      hasDiffusion: !!this.diffusion,
    });
  }

  /**
   * Execute integrated workflow: GENESIS → ORACLE → D-HDR
   */
  async executeWorkflow(workflowSpec = {}) {
    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      logger.info(`Starting workflow: ${workflowId}`, workflowSpec);
      this.emit("workflow:started", { workflowId, spec: workflowSpec });

      this.state = "running";
      const result = {
        workflowId,
        status: "in_progress",
        startedAt: new Date(),
        steps: {},
      };

      // Step 1: GENESIS - Breed agent
      if (this.genesis && workflowSpec.task === "breed_and_analyze_agent") {
        logger.info(`[${workflowId}] GENESIS: Breeding agent`);
        const agent = this.genesis.breed({
          baseAgent: workflowSpec.baseAgent || {
            analyticalPower: 0.5,
            creativity: 0.6,
          },
          targetFitness: workflowSpec.targetFitness || 0.8,
        });

        result.steps.genesis = { agent, status: "completed" };
        result.agent = agent;
        this.systemMetrics.agentsCreated++;
        this.emit("agent:bred", { workflowId, agent });
      }

      // Step 2: ORACLE - Predict outcomes
      if (this.oracle && result.agent) {
        logger.info(`[${workflowId}] ORACLE: Predicting outcomes`);
        const prediction = this.oracle.predictAgentOutcome(
          result.agent,
          workflowSpec.context || {},
        );

        result.steps.oracle = { prediction, status: "completed" };
        result.prediction = prediction;
        this.systemMetrics.predictionsGenerated++;
        this.emit("prediction:made", { workflowId, prediction });
      }

      // Step 3: D-HDR - Explore consequences
      if (this.diffusion && result.agent && result.prediction) {
        logger.info(`[${workflowId}] D-HDR: Exploring decision space`);
        const consequences = this.diffusion.exploreDecisionSpace(
          workflowSpec.task || "deploy_agent",
          {
            agentFitness: result.agent.fitnessScore || 0.5,
            predictionConfidence:
              result.prediction.confidence ||
              result.prediction.predicted_success_rate ||
              0.5,
          },
          workflowSpec.consequenceCount || 3,
        );

        result.steps.diffusion = { consequences, status: "completed" };
        result.consequences = consequences;
        this.systemMetrics.consequencesExplored++;
        this.emit("consequence:explored", { workflowId, consequences });
      }

      result.status = "completed";
      result.completedAt = new Date();
      this.state = "idle";

      this.emit("workflow:completed", result);
      logger.info(`Workflow completed: ${workflowId}`, {
        duration: result.completedAt - result.startedAt,
      });

      return result;
    } catch (error) {
      logger.error(
        { workflowId, error: error.message },
        "Workflow execution failed",
      );
      this.state = "error";
      this.emit("workflow:failed", { workflowId, error: error.message });
      throw error;
    }
  }

  /**
   * Publish agent card to marketplace
   */
  publishAgentCard(agentCard) {
    try {
      logger.info(`Publishing agent card: ${agentCard?.id}`);

      // Validate card structure
      const validation_errors = [];

      if (!agentCard) {
        validation_errors.push("Agent card object is required");
      }
      if (!agentCard?.id) {
        validation_errors.push("Agent card must have an id");
      }
      if (!agentCard?.name) {
        validation_errors.push("Agent card must have a name");
      }
      if (!agentCard?.specialization) {
        validation_errors.push("Agent card must have a specialization");
      }
      if (!agentCard?.createdAt) {
        validation_errors.push("Agent card must have a createdAt timestamp");
      }
      if (!agentCard?.genetic_lineage) {
        validation_errors.push("Agent card must have genetic_lineage information");
      }

      // Return validation failure if any required fields are missing
      if (validation_errors.length > 0) {
        logger.info(`Agent card validation failed: ${agentCard?.id}`, { validation_errors });
        return {
          status: "rejected",
          validation_errors,
          card_id: agentCard?.id,
        };
      }

      // Generate registry ID
      const registry_id = `registry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const published_at = new Date().toISOString();

      // Store in registry with metadata
      const cardWithMetadata = {
        ...agentCard,
        registry_id,
        published_at,
        status: "published",
      };
      this.agentCardRegistry.set(agentCard.id, cardWithMetadata);
      this.systemMetrics.agentCardsPublished++;

      logger.info(`Agent card published: ${agentCard.id}`, {
        registry_id,
        published_at,
      });

      this.emit("agent:published", { 
        card: cardWithMetadata,
        registry_id,
      });

      return cardWithMetadata;
    } catch (error) {
      logger.error(
        { cardId: agentCard?.id, error: error.message },
        "Failed to publish agent card",
      );
      return {
        status: "error",
        error: error.message,
        card_id: agentCard?.id,
      };
    }
  }

  /**
   * Discover agents in marketplace
   */
  discoverAgents(criteria = {}) {
    logger.info("Discovering agents", criteria);

    let agents = Array.from(this.agentCardRegistry.values());

    // Filter by specialization
    if (criteria.specialization) {
      agents = agents.filter((a) => a.specialization === criteria.specialization);
    }

    // Filter by minimum fitness
    if (criteria.minFitness !== undefined) {
      agents = agents.filter((a) => (a.fitness || 0) >= criteria.minFitness);
    }

    // Filter by status
    if (criteria.status) {
      agents = agents.filter((a) => a.status === criteria.status);
    }

    // Sort by fitness descending
    agents.sort((a, b) => (b.fitness || 0) - (a.fitness || 0));

    this.emit("discovery:completed", { count: agents.length, criteria });

    return agents;
  }

  /**
   * Get system health status
   */
  getSystemHealth() {
    const uptime = Date.now() - this.systemMetrics.uptime;

    return {
      status: this.state,
      uptime,
      components: {
        genesis: {
          available: !!this.genesis,
          state: this.genesis?.state || "unknown",
        },
        oracle: {
          available: !!this.oracle,
          state: this.oracle?.state || "unknown",
        },
        diffusion: {
          available: !!this.diffusion,
          state: this.diffusion?.state || "unknown",
        },
      },
      registry: {
        totalAgents: this.agentCardRegistry.size,
        memory: this.agentCardRegistry.size * 2048, // Rough estimate
      },
      timestamp: new Date(),
    };
  }

  /**
   * Collect metrics from all system components
   */
  collectMetrics() {
    return {
      genesis: {
        populationSize: this.genesis?.config?.populationSize || 0,
        agentsCreated: this.systemMetrics.agentsCreated,
        mutationRate: this.genesis?.config?.mutationRate || 0,
        timestamp: new Date(),
      },
      oracle: {
        predictionsGenerated: this.systemMetrics.predictionsGenerated,
        circuitBreakerStatus: this.oracle?.getCircuitBreakerStatus?.() || "unknown",
        timestamp: new Date(),
      },
      diffusion: {
        consequencesExplored: this.systemMetrics.consequencesExplored,
        timestamp: new Date(),
      },
      integration: {
        workflowsExecuted: this.systemMetrics.workflowsExecuted,
        agentCardsPublished: this.systemMetrics.agentCardsPublished,
        activeWorkflows: this.activeWorkflows.size,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Collect system metrics
   */
  collectMetrics() {
    return {
      ...this.systemMetrics,
      timestamp: new Date(),
      interval: "session",
      activeComponents: {
        genesis: !!this.genesis,
        oracle: !!this.oracle,
        diffusion: !!this.diffusion,
      },
    };
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig) {
    logger.info("Updating configuration", newConfig);
    
    // Update agent-specific configurations
    if (newConfig.genesis && this.genesis) {
      this.genesis.config = {
        ...this.genesis.config,
        ...newConfig.genesis,
      };
      logger.info("Updated genesis config", newConfig.genesis);
    }

    if (newConfig.oracle && this.oracle) {
      this.oracle.config = {
        ...this.oracle.config,
        ...newConfig.oracle,
      };
      logger.info("Updated oracle config", newConfig.oracle);
    }

    if (newConfig.diffusion && this.diffusion) {
      this.diffusion.config = {
        ...this.diffusion.config,
        ...newConfig.diffusion,
      };
      logger.info("Updated diffusion config", newConfig.diffusion);
    }

    // Update orchestrator config
    this.config = { ...this.config, ...newConfig };
    this.emit("config:updated", { config: this.config });

    return {
      success: true,
      config: this.config,
    };
  }

  /**
   * Register plugin
   */
  registerPlugin(plugin) {
    if (!plugin || !plugin.name) {
      throw new Error("Plugin must have a name");
    }

    logger.info(`Registering plugin: ${plugin.name}`);
    this.config.plugins.push(plugin);

    // Attach plugin listeners to relevant events
    if (plugin.onAgentBred && this.genesis) {
      this.genesis.on("agent:bred", (data) => {
        plugin.onAgentBred(data);
      });
    }

    if (plugin.onPredictionMade && this.oracle) {
      this.oracle.on("prediction:made", (data) => {
        plugin.onPredictionMade(data);
      });
    }

    if (plugin.onConsequenceExplored && this.diffusion) {
      this.diffusion.on("consequence:explored", (data) => {
        plugin.onConsequenceExplored(data);
      });
    }

    this.emit("plugin:registered", { plugin });

    return {
      success: true,
      pluginName: plugin.name,
      pluginCount: this.config.plugins.length,
    };
  }
}
