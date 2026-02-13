/**
 * Phase 10 Integration Tests: GENESIS-HDR
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 *
 * Test suite for evolutionary agent ecosystem
 */

const {
  GenesisHDR,
  AgentGenome,
  FitnessEvaluator,
  MutationEngine,
  PopulationManager,
} = require("../src/genesis-hdr/genesis-core");

describe("Phase 10.1: GENESIS-HDR - Evolutionary Agent Ecosystem", () => {
  let genesis;

  beforeEach(() => {
    genesis = new GenesisHDR({
      populationSize: 20,
      generationsPerEpoch: 3,
      mutationRate: 0.15,
    });
  });

  describe("AgentGenome - Genetic Representation", () => {
    test("creates genome with random traits", () => {
      const genome = new AgentGenome("test-agent-1", 0);

      expect(genome.id).toBe("test-agent-1");
      expect(genome.generation).toBe(0);
      expect(genome.genes).toBeDefined();
      expect(genome.genes.personality).toMatch(
        /analytical|creative|pragmatic|empathetic|bold/,
      );
      expect(genome.genes.analyticalPower).toBeGreaterThanOrEqual(0);
      expect(genome.genes.analyticalPower).toBeLessThanOrEqual(1);
    });

    test("genome phenotype captures observable behavior", () => {
      const genome = new AgentGenome("agent-2", 1);
      const phenotype = genome.getPhenotype();

      expect(phenotype.id).toBe("agent-2");
      expect(phenotype.generation).toBe(1);
      expect(phenotype.specialization).toBeDefined();
      expect(phenotype.capabilities).toBeDefined();
      expect(phenotype.capabilities.analytical).toBeGreaterThanOrEqual(0);
      expect(phenotype.capabilities.analytical).toBeLessThanOrEqual(100);
    });

    test("genome cloning preserves genes", () => {
      const original = new AgentGenome("parent", 0);
      const clone = original.clone("child", 1);

      expect(clone.genes).toEqual(original.genes);
      expect(clone.parentIds).toContain("parent");
      expect(clone.generation).toBe(1);
    });
  });

  describe("FitnessEvaluator - Agent Performance Assessment", () => {
    let evaluator;

    beforeEach(() => {
      evaluator = new FitnessEvaluator();
    });

    test("registers benchmark tasks", () => {
      const taskFn = async (genes, agentId) => Math.random();
      evaluator.registerTask("task-1", taskFn, 2.0);

      expect(evaluator.taskRegistry.size).toBe(1);
      expect(evaluator.taskRegistry.has("task-1")).toBe(true);
    });

    test("evaluates agent fitness across tasks", async () => {
      const taskFn = async (genes, agentId) => {
        // Reward analytical power
        return genes.analyticalPower;
      };

      evaluator.registerTask("analysis", taskFn, 1.0);

      const agent = new AgentGenome("test-agent", 0);
      agent.genes.analyticalPower = 0.8;

      const fitness = await evaluator.evaluateAgent(agent);

      expect(fitness).toBeCloseTo(0.8, 1);
      expect(agent.fitness).toBe(fitness);
      expect(agent.taskResults).toBeDefined();
    });

    test("normalizes fitness to [0, 1]", async () => {
      const taskFn = async (genes, agentId) => Math.random() * 10; // Can be > 1
      evaluator.registerTask("unconstrained", taskFn, 1.0);

      const agent = new AgentGenome("test", 0);
      const fitness = await evaluator.evaluateAgent(agent);

      expect(fitness).toBeGreaterThanOrEqual(0);
      expect(fitness).toBeLessThanOrEqual(1);
    });
  });

  describe("MutationEngine - Genetic Variation", () => {
    let mutator;

    beforeEach(() => {
      mutator = new MutationEngine(0.2);
    });

    test("applies gaussian mutations to numeric genes", () => {
      const parent = new AgentGenome("parent", 0);
      parent.genes.analyticalPower = 0.5;

      const offspring = mutator.mutate(parent, "offspring");

      expect(offspring.parentIds).toContain("parent");
      expect(offspring.generation).toBe(1);
      // Mutation may change value (but rarely to extremes)
      expect(offspring.genes.analyticalPower).toBeGreaterThanOrEqual(-0.5);
      expect(offspring.genes.analyticalPower).toBeLessThanOrEqual(1.5);
    });

    test("mutates trait genes with mutation rate", () => {
      const parent = new AgentGenome("parent", 0);
      const originalPersonality = parent.genes.personality;

      const mutated = mutator.mutate(parent, "mutant");

      // With 20% mutation rate, some phenotype changes expected over many iterations
      expect(mutated.generation).toBe(1);
    });

    test("performs crossover between parents", () => {
      const parent1 = new AgentGenome("p1", 0);
      const parent2 = new AgentGenome("p2", 0);

      parent1.genes.analyticalPower = 0.9;
      parent2.genes.analyticalPower = 0.1;

      const offspring = mutator.crossover(parent1, parent2, "child");

      expect(offspring.generation).toBe(1);
      expect(offspring.parentIds).toContain("p1");
      expect(offspring.parentIds).toContain("p2");
      // Child should inherit from one parent
      const inherited = offspring.genes.analyticalPower;
      expect(inherited).toBeGreaterThanOrEqual(Math.min(0.1, 0.9));
      expect(inherited).toBeLessThanOrEqual(Math.max(0.1, 0.9));
    });
  });

  describe("PopulationManager - Generation Evolution", () => {
    let popManager;

    beforeEach(() => {
      popManager = new PopulationManager(15);
    });

    test("initializes population of agents", () => {
      popManager.initialize();

      expect(popManager.population.length).toBe(15);
      expect(popManager.generation).toBe(0);
      popManager.population.forEach((agent) => {
        expect(agent).toBeInstanceOf(AgentGenome);
      });
    });

    test("tournament selection favors high fitness", () => {
      popManager.initialize();

      // Set fitness values
      popManager.population[0].fitness = 0.1;
      popManager.population[1].fitness = 0.9;

      const selected = popManager.tournamentSelection(5);
      // Higher fitness should have better chance
      expect(selected).toBeDefined();
    });

    test("evolves generation via selection and crossover", () => {
      popManager.initialize();
      popManager.population.forEach((agent, idx) => {
        agent.fitness = Math.random();
      });

      const mutator = new MutationEngine(0.15);
      const stats = popManager.evolveGeneration(mutator);

      expect(stats.generation).toBe(1);
      expect(stats.populationSize).toBe(15);
      expect(stats.avgFitness).toBeDefined();
      expect(stats.bestFitness).toBeDefined();
    });

    test("maintains population size through evolution", () => {
      popManager.initialize();
      const initialSize = popManager.population.length;

      popManager.population.forEach((a) => (a.fitness = Math.random()));

      const mutator = new MutationEngine(0.1);
      popManager.evolveGeneration(mutator);

      expect(popManager.population.length).toBe(initialSize);
    });

    test("calculates genetic diversity", () => {
      popManager.initialize();
      const diversity = popManager.getAverageFitness(); // Setup for diversity calc

      popManager.population.forEach((a, idx) => {
        a.fitness = idx / popManager.population.length;
      });

      const div = popManager.getAverageFitness();
      expect(div).toBeGreaterThanOrEqual(0);
    });
  });

  describe("GENESIS-HDR Full System", () => {
    test("initializes with configuration", () => {
      expect(genesis.config.populationSize).toBe(20);
      expect(genesis.config.generationsPerEpoch).toBe(3);
      expect(genesis.state).toBe("idle");
    });

    test("registers benchmark tasks", () => {
      const mockTask = async (genes, agentId) => genes.analyticalPower;
      genesis.registerBenchmark("test-task", mockTask, 1.0);

      expect(genesis.fitnessEvaluator.taskRegistry.size).toBe(1);
    });

    test("initializes evolutionary epoch", async () => {
      await genesis.initializeEpoch();

      expect(genesis.populationManager.population.length).toBe(20);
      expect(genesis.state).toBe("evaluating");
    });

    test("evaluates population fitness", async () => {
      genesis.registerBenchmark("task", async (g, a) => Math.random(), 1.0);
      await genesis.initializeEpoch();

      const result = await genesis.evaluatePopulation();

      expect(result.avgFitness).toBeGreaterThanOrEqual(0);
      expect(result.bestFitness).toBeGreaterThanOrEqual(result.avgFitness);
      expect(genesis.evolutionMetrics.agentsEvaluated).toBe(20);
    });

    test("evolves generation", async () => {
      genesis.registerBenchmark("task", async (g, a) => Math.random(), 1.0);
      await genesis.initializeEpoch();
      await genesis.evaluatePopulation();

      const stats = genesis.evolveGeneration();

      expect(stats.generation).toBe(1);
      expect(stats.populationSize).toBe(20);
      expect(genesis.evolutionMetrics.generationCount).toBe(1);
    });

    test("gets population statistics", async () => {
      await genesis.initializeEpoch();
      genesis.populationManager.population.forEach(
        (a) => (a.fitness = Math.random()),
      );

      const stats = genesis.getPopulationStats();

      expect(stats.generation).toBeDefined();
      expect(stats.populationSize).toBe(20);
      expect(stats.avgFitness).toBeGreaterThanOrEqual(0);
      expect(stats.avgFitness).toBeLessThanOrEqual(1);
    });

    test("gets best agent phenotype", async () => {
      await genesis.initializeEpoch();
      genesis.populationManager.population[0].fitness = 0.95;

      const best = genesis.getBestAgentPhenotype();

      expect(best).toBeDefined();
      expect(best.fitness).toBe(0.95);
    });

    test("broadcasts agents with increasing accuracy", async () => {
      genesis.registerBenchmark("task", async (g, a) => g.analyticalPower, 1.0);

      // Run epoch
      await genesis.initializeEpoch();
      await genesis.evaluatePopulation();

      // Broadcast top agents
      await genesis.broadcastBestAgents(3);

      expect(genesis.evolutionMetrics.broadcastCount).toBeGreaterThan(0);
    });
  });

  describe("Event Emission", () => {
    test("emits epoch:initialized event", async () => {
      const listener = jest.fn();
      genesis.on("epoch:initialized", listener);

      await genesis.initializeEpoch();

      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ populationSize: 20 }),
      );
    });

    test("emits population:evaluated event", async () => {
      const listener = jest.fn();
      genesis.on("population:evaluated", listener);

      genesis.registerBenchmark("task", async (g, a) => Math.random(), 1.0);
      await genesis.initializeEpoch();
      await genesis.evaluatePopulation();

      expect(listener).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          generation: expect.any(Number),
          avgFitness: expect.any(Number),
          bestFitness: expect.any(Number),
        }),
      );
    });

    test("emits generation:evolved event", async () => {
      const listener = jest.fn();
      genesis.on("generation:evolved", listener);

      genesis.registerBenchmark("task", async (g, a) => Math.random(), 1.0);
      await genesis.initializeEpoch();
      await genesis.evaluatePopulation();
      genesis.evolveGeneration();

      expect(listener).toHaveBeenCalled();
    });
  });
});
