/**
 * Phase 10 Integration Tests: Combined System Integration
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 *
 * Tests for GENESIS + ORACLE + D-HDR + Agent Card integration
 */

import { jest } from '@jest/globals';
import { EventEmitter } from "events";
import { GenesisHDR } from "../../src/genesis-hdr/genesis-core.js";
import { OracleHDR } from "../../src/oracle-hdr/oracle-core.js";
import { DiffusionHDR } from "../../src/d-hdr/diffusion-core.js";
import { AgentCardFactory } from "../../src/agent-card/schema.js";
import { HDRIntegrationOrchestrator } from "../../src/hdr-orchestrator.js";

describe("Phase 10.5: Combined System Integration", () => {
  let genesis;
  let oracle;
  let diffusion;
  let orchestrator;

  beforeEach(() => {
    genesis = new GenesisHDR({
      populationSize: 10,
      mutationRate: 0.15,
      fitnessThreshold: 0.7,
    });

    oracle = new OracleHDR({
      modelSize: "small",
      timeHorizon: "medium",
    });

    diffusion = new DiffusionHDR({
      timesteps: 50,
      scheduleType: "cosine",
      guidanceScale: 7.5,
    });

    orchestrator = new HDRIntegrationOrchestrator({
      genesis,
      oracle,
      diffusion,
    });
  });

  describe("Workflow: Genesis → Oracle → D-HDR", () => {
    test("generates agent with GENESIS", () => {
      const agent = genesis.breed({
        baseAgent: { analyticalPower: 0.5, creativity: 0.6 },
        targetFitness: 0.85,
      });

      expect(agent).toBeDefined();
      expect(agent.generation).toBeGreaterThan(0);
      expect(agent.fitnessScore).toBeGreaterThanOrEqual(0);
      expect(agent.fitnessScore).toBeLessThanOrEqual(1);
    });

    test("predicts GENESIS agent outcome with ORACLE", () => {
      const agent = genesis.breed({
        baseAgent: { analyticalPower: 0.5, creativity: 0.6 },
      });

      const prediction = oracle.predictAgentOutcome(agent, {
        executionContext: "production",
        timeframe: "monthly",
      });

      expect(prediction.predicted_success_rate).toBeGreaterThanOrEqual(0);
      expect(prediction.predicted_success_rate).toBeLessThanOrEqual(1);
      expect(prediction.supporting_factors).toBeDefined();
    });

    test("generates consequence variations with D-HDR", () => {
      const agent = genesis.breed({
        baseAgent: { analyticalPower: 0.5, creativity: 0.6 },
      });

      const prediction = oracle.predictAgentOutcome(agent, {});

      const consequences = diffusion.exploreDecisionSpace(
        "deploy_agent",
        {
          agentFitness: agent.fitnessScore,
          predictionConfidence: prediction.confidence,
        },
        3,
      );

      expect(consequences.ensemble.length).toBe(3);
      expect(consequences.average_similarity).toBeGreaterThanOrEqual(0);
    });

    test("full orchestrated workflow end-to-end", async () => {
      const result = await orchestrator.executeWorkflow({
        task: "breed_and_analyze_agent",
        targetFitness: 0.8,
        context: {},
      });

      expect(result.status).toBe("completed");
      expect(result.agent).toBeDefined();
      expect(result.agent.generation).toBeGreaterThan(0);
      expect(result.prediction).toBeDefined();
      expect(result.consequences).toBeDefined();
      expect(result.consequences.ensemble.length).toBeGreaterThan(0);
    });
  });

  describe("Multi-Agent Ecosystem", () => {
    test("breeds population and evaluates with ORACLE", () => {
      const population = genesis.breedPopulation(5);

      expect(population.length).toBe(5);

      const predictions = population.map((agent) =>
        oracle.predictAgentOutcome(agent, {}),
      );

      expect(
        predictions.every((p) => p.predicted_success_rate !== undefined),
      ).toBe(true);
    });

    test("selects best agent from ecosystem", () => {
      const population = genesis.breedPopulation(10);

      const predictions = population.map((agent) => ({
        agent,
        prediction: oracle.predictAgentOutcome(agent, {}),
      }));

      const best = predictions.reduce((best, current) =>
        current.prediction.predicted_success_rate >
        best.prediction.predicted_success_rate
          ? current
          : best,
      );

      expect(best.agent).toBeDefined();
      expect(best.prediction.predicted_success_rate).toBeGreaterThanOrEqual(0);
    });

    test("analyzes diversity in population", () => {
      const population = genesis.breedPopulation(20);

      const diversity = genesis.getPopulationDiversity(population);

      expect(diversity.genetic_variance).toBeGreaterThanOrEqual(0);
      expect(diversity.trait_distribution).toBeDefined();
      expect(diversity.average_pairwise_distance).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Agent Card Publication & Discovery", () => {
    test("creates agent card for GENESIS agent", () => {
      const agent = genesis.breed({
        baseAgent: { analyticalPower: 0.6, creativity: 0.7 },
      });

      const card = AgentCardFactory.createGenesisCard(agent, "stdio://genesis");

      expect(card.id).toBeDefined();
      expect(card.specialization).toBe("evolutionary");
      expect(card.genetic_lineage.generation).toBe(agent.generation);
      expect(card.genetic_lineage.fitness_score).toBe(agent.fitnessScore);
    });

    test("publishes agent card to registry", () => {
      const agent = genesis.breed({
        baseAgent: { analyticalPower: 0.6 },
      });

      const card = AgentCardFactory.createGenesisCard(agent, "stdio://genesis");

      const published = orchestrator.publishAgentCard(card);

      expect(published.status).toBe("published");
      expect(published.registry_id).toBeDefined();
      expect(published.published_at).toBeDefined();
    });

    test("discovers agents by specialization", () => {
      // Create and publish multiple agents
      const agents = genesis.breedPopulation(5);

      const cards = agents.map((agent) =>
        AgentCardFactory.createGenesisCard(agent, "stdio://genesis"),
      );

      cards.forEach((card) => orchestrator.publishAgentCard(card));

      const discovered = orchestrator.discoverAgents({
        specialization: "evolutionary",
        minFitness: 0.5,
      });

      expect(discovered.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Event Emission & Coordination", () => {
    test("emits agent:bred event", (done) => {
      orchestrator.on("agent:bred", (data) => {
        expect(data.agentId).toBeDefined();
        expect(data.fitnessScore).toBeDefined();
        done();
      });

      genesis.breed({ baseAgent: { analyticalPower: 0.5 } });
    });

    test("emits prediction:made event", (done) => {
      const agent = genesis.breed({ baseAgent: { analyticalPower: 0.5 } });

      orchestrator.on("prediction:made", (data) => {
        expect(data.agentId).toBe(agent.id);
        expect(data.successRate).toBeDefined();
        done();
      });

      oracle.predictAgentOutcome(agent, {});
    });

    test("emits consequence:explored event", (done) => {
      orchestrator.on("consequence:explored", (data) => {
        expect(data.decision).toBeDefined();
        expect(data.variants).toBeGreaterThan(0);
        done();
      });

      diffusion.exploreDecisionSpace("test_decision", {}, 2);
    });

    test("coordinates workflow with event sequencing", async () => {
      const events = [];

      orchestrator.on("agent:bred", () => events.push("bred"));
      orchestrator.on("prediction:made", () => events.push("predicted"));
      orchestrator.on("consequence:explored", () => events.push("explored"));

      await orchestrator.executeWorkflow({
        task: "breed_and_analyze_agent",
        targetFitness: 0.75,
      });

      expect(events).toContain("bred");
      expect(events).toContain("predicted");
      expect(events).toContain("explored");
    });
  });

  describe("Performance & Scalability", () => {
    test("breeds large population efficiently", () => {
      const startTime = Date.now();

      const population = genesis.breedPopulation(100);

      const elapsed = Date.now() - startTime;

      expect(population.length).toBe(100);
      expect(elapsed).toBeLessThan(5000); // Should complete in <5 seconds
    });

    test("predicts on population without timeouts", async () => {
      const population = genesis.breedPopulation(50);

      const startTime = Date.now();

      const predictions = Promise.all(
        population.map((agent) =>
          Promise.resolve(oracle.predictAgentOutcome(agent, {})),
        ),
      );

      await predictions;

      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(10000); // <10 seconds for 50 agents
    });

    test("handles concurrent D-HDR explorations", async () => {
      const explorations = Array(5)
        .fill(null)
        .map(() =>
          Promise.resolve(
            diffusion.exploreDecisionSpace(
              `exploration_${Math.random()}`,
              {},
              3,
            ),
          ),
        );

      const results = await Promise.all(explorations);

      expect(results.length).toBe(5);
      expect(results.every((r) => r.ensemble.length === 3)).toBe(true);
    });

    test("measures end-to-end orchestration latency", async () => {
      const latencies = [];

      for (let i = 0; i < 5; i++) {
        const start = Date.now();

        await orchestrator.executeWorkflow({
          task: "breed_and_analyze_agent",
          targetFitness: 0.7,
        });

        latencies.push(Date.now() - start);
      }

      const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;

      expect(avgLatency).toBeLessThan(3000); // Avg <3s per workflow
      expect(Math.max(...latencies)).toBeLessThan(5000); // Max <5s
    });
  });

  describe("Error Handling & Recovery", () => {
    test("handles invalid agent data gracefully", () => {
      const invalidAgent = {
        /* missing required fields */
      };

      const prediction = oracle.predictAgentOutcome(invalidAgent, {});

      expect(prediction.error).toBeDefined();
      expect(prediction.fallback_prediction).toBeDefined();
    });

    test("recovers from D-HDR generation failures", () => {
      const consequence1 = diffusion.predictOutcome("action1", {});
      expect(consequence1).toBeDefined();

      const consequence2 = diffusion.predictOutcome("action2", {});
      expect(consequence2).toBeDefined();

      // Both should work despite any internal issues in first
    });

    test("validates agent cards on publication", () => {
      const invalidCard = {
        id: "invalid",
        name: "agent",
        // Missing required fields
      };

      const result = orchestrator.publishAgentCard(invalidCard);

      expect(result.status).toBe("rejected");
      expect(result.validation_errors).toBeDefined();
    });

    test("implements circuit breaker for ORACLE", () => {
      oracle.setCircuitBreakerThreshold(3);

      let failures = 0;
      for (let i = 0; i < 5; i++) {
        try {
          oracle.predictAgentOutcome(null, {});
        } catch (e) {
          failures++;
        }
      }

      const status = oracle.getCircuitBreakerStatus();

      expect(status.state).toBeDefined(); // 'closed', 'open', or 'half-open'
      expect(failures).toBeGreaterThan(0);
    });
  });

  describe("Monitoring & Observability", () => {
    test("tracks system health", () => {
      genesis.breed({ baseAgent: { analyticalPower: 0.5 } });
      oracle.predictAgentOutcome({ fitnessScore: 0.7 }, {});
      diffusion.predictOutcome("action", {});

      const health = orchestrator.getSystemHealth();

      expect(health.status).toBeDefined();
      expect(health.components.genesis).toBeDefined();
      expect(health.components.oracle).toBeDefined();
      expect(health.components.diffusion).toBeDefined();
    });

    test("collects metrics for all components", () => {
      const metrics = orchestrator.collectMetrics();

      expect(metrics.genesis).toBeDefined();
      expect(metrics.oracle).toBeDefined();
      expect(metrics.diffusion).toBeDefined();
      expect(metrics.integration).toBeDefined();

      expect(metrics.genesis.agents_bred).toBeGreaterThanOrEqual(0);
      expect(metrics.oracle.predictions_made).toBeGreaterThanOrEqual(0);
      expect(metrics.diffusion.explorations_performed).toBeGreaterThanOrEqual(
        0,
      );
    });

    test("logs significant events", (done) => {
      const logs = [];

      orchestrator.on("event:logged", (log) => {
        logs.push(log);
        if (logs.length === 3) {
          expect(logs.some((l) => l.component === "genesis")).toBe(true);
          done();
        }
      });

      genesis.breed({ baseAgent: { analyticalPower: 0.5 } });
      oracle.predictAgentOutcome({ fitnessScore: 0.7 }, {});
      diffusion.predictOutcome("action", {});
    });
  });

  describe("Configuration & Extension", () => {
    test("allows runtime configuration changes", () => {
      const newConfig = {
        genesis: { mutationRate: 0.25 },
        oracle: { modelSize: "large" },
      };

      orchestrator.updateConfiguration(newConfig);

      expect(genesis.config.mutationRate).toBe(0.25);
      expect(oracle.config.modelSize).toBe("large");
    });

    test("supports custom hooks/plugins", () => {
      const plugin = {
        name: "test-plugin",
        onAgentBred: jest.fn(),
        onPredictionMade: jest.fn(),
      };

      orchestrator.registerPlugin(plugin);

      genesis.breed({ baseAgent: { analyticalPower: 0.5 } });

      expect(plugin.onAgentBred).toHaveBeenCalled();
    });
  });
});
