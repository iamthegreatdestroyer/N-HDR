/**
 * GENESIS-HDR: Evolutionary Agent Ecosystem
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 *
 * Autonomous evolutionary system that breeds specialized AI agents
 * through fitness-based selection and genetic algorithms.
 *
 * Agents compete on real task benchmarks; fitness = task performance.
 * Evolved agents auto-register in NEXUS-HDR catalog.
 *
 * Phase 10: Intelligence Layer - Week 4
 */

import crypto from "crypto";
import { EventEmitter } from "events";
import pino from "pino";

const logger = pino({ name: "genesis-hdr" });

/**
 * Agent Genome - Representation of an agent's capabilities and traits
 */
class AgentGenome {
  constructor(id, generation = 0, genes = {}) {
    this.id = id;
    this.generation = generation;
    this.createdAt = new Date();

    // Core genetic traits
    this.genes = {
      // Behavior genes
      personality: genes.personality || this.randomizeGeneTrait("personality"),
      communicationStyle:
        genes.communicationStyle ||
        this.randomizeGeneTrait("communicationStyle"),
      riskTolerance: genes.riskTolerance || Math.random(),
      collaborativeTendency: genes.collaborativeTendency || Math.random(),

      // Capability genes
      domainSpecialization:
        genes.domainSpecialization ||
        this.randomizeGeneTrait("domainSpecialization"),
      analyticalPower: genes.analyticalPower || Math.random(),
      creativityIndex: genes.creativityIndex || Math.random(),
      problemSolvingStrategy:
        genes.problemSolvingStrategy || this.randomizeGeneTrait("strategy"),

      // Performance genes
      learningRate: genes.learningRate || 0.001 + Math.random() * 0.1,
      memoryRetention: genes.memoryRetention || Math.random(),
      adaptabilityScore: genes.adaptabilityScore || Math.random(),
      resilience: genes.resilience || Math.random(),
    };

    // Fitness tracking
    this.fitness = null;
    this.taskResults = {};
    this.generationFitness = [];
    this.parentIds = [];
  }

  randomizeGeneTrait(traitType) {
    const traits = {
      personality: [
        "analytical",
        "creative",
        "pragmatic",
        "empathetic",
        "bold",
      ],
      communicationStyle: [
        "verbose",
        "concise",
        "technical",
        "narrative",
        "visual",
      ],
      domainSpecialization: [
        "mathematics",
        "language",
        "vision",
        "reasoning",
        "synthesis",
      ],
      strategy: [
        "greedy",
        "exhaustive",
        "heuristic",
        "probabilistic",
        "hybrid",
      ],
    };
    return traits[traitType][
      Math.floor(Math.random() * traits[traitType].length)
    ];
  }

  /**
   * Compute phenotype (observable behavior) from genotype
   */
  getPhenotype() {
    return {
      id: this.id,
      generation: this.generation,
      personality: this.genes.personality,
      specialization: this.genes.domainSpecialization,
      capabilities: {
        analytical: Math.round(this.genes.analyticalPower * 100),
        creative: Math.round(this.genes.creativityIndex * 100),
        adaptive: Math.round(this.genes.adaptabilityScore * 100),
        resilient: Math.round(this.genes.resilience * 100),
      },
      performanceProfile: {
        learningRate: this.genes.learningRate.toFixed(4),
        memoryRetention: (this.genes.memoryRetention * 100).toFixed(1) + "%",
        riskTolerance: (this.genes.riskTolerance * 100).toFixed(1) + "%",
      },
      fitness: this.fitness,
      generation: this.generation,
      parentIds: this.parentIds,
    };
  }

  clone(newId, newGeneration) {
    const cloned = new AgentGenome(newId, newGeneration);
    cloned.genes = JSON.parse(JSON.stringify(this.genes));
    cloned.parentIds = [this.id];
    return cloned;
  }
}

/**
 * Fitness Evaluator - Computes agent performance on tasks
 */
class FitnessEvaluator {
  constructor() {
    this.taskRegistry = new Map();
    this.metricsHistory = [];
  }

  /**
   * Register a benchmark task
   */
  registerTask(taskName, taskFunction, weight = 1.0) {
    this.taskRegistry.set(taskName, { fn: taskFunction, weight });
    logger.info(`Registered benchmark task: ${taskName} (weight: ${weight})`);
  }

  /**
   * Evaluate agent fitness across all registered tasks
   */
  async evaluateAgent(agent) {
    const results = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [taskName, taskDef] of this.taskRegistry) {
      try {
        // Execute task with agent's genetic traits as parameters
        const score = await taskDef.fn(agent.genes, agent.id);

        // Normalize to [0, 1]
        const normalizedScore = Math.min(1.0, Math.max(0, score));
        results[taskName] = normalizedScore;

        totalWeightedScore += normalizedScore * taskDef.weight;
        totalWeight += taskDef.weight;
      } catch (error) {
        logger.warn(
          { taskName, agentId: agent.id, error: error.message },
          "Task evaluation failed",
        );
        results[taskName] = 0;
      }
    }

    // Final fitness = weighted average
    agent.fitness = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    agent.taskResults = results;

    return agent.fitness;
  }
}

/**
 * Mutation Engine - Generates agent variations
 */
class MutationEngine {
  constructor(mutationRate = 0.15) {
    this.mutationRate = mutationRate;
    this.mutationTypes = ["trait", "capability", "strategy", "parameter"];
  }

  /**
   * Apply mutations to create offspring variant
   */
  mutate(parentGenome, newId) {
    const offspring = parentGenome.clone(newId, parentGenome.generation + 1);

    // Small gaussian mutations to numeric genes
    offspring.genes.riskTolerance = this.gaussianMutate(
      offspring.genes.riskTolerance,
    );
    offspring.genes.analyticalPower = this.gaussianMutate(
      offspring.genes.analyticalPower,
    );
    offspring.genes.creativityIndex = this.gaussianMutate(
      offspring.genes.creativityIndex,
    );
    offspring.genes.collaborativeTendency = this.gaussianMutate(
      offspring.genes.collaborativeTendency,
    );
    offspring.genes.learningRate = this.gaussianMutate(
      offspring.genes.learningRate,
      0.001,
      0.1,
    );
    offspring.genes.memoryRetention = this.gaussianMutate(
      offspring.genes.memoryRetention,
    );
    offspring.genes.adaptabilityScore = this.gaussianMutate(
      offspring.genes.adaptabilityScore,
    );
    offspring.genes.resilience = this.gaussianMutate(
      offspring.genes.resilience,
    );

    // Trait mutations (categorical)
    if (Math.random() < this.mutationRate) {
      offspring.genes.personality = offspring.randomizeGeneTrait("personality");
    }
    if (Math.random() < this.mutationRate) {
      offspring.genes.domainSpecialization = offspring.randomizeGeneTrait(
        "domainSpecialization",
      );
    }
    if (Math.random() < this.mutationRate) {
      offspring.genes.problemSolvingStrategy =
        offspring.randomizeGeneTrait("strategy");
    }

    offspring.parentIds = [parentGenome.id];
    return offspring;
  }

  /**
   * Gaussian mutation with configurable bounds
   */
  gaussianMutate(value, min = 0, max = 1) {
    // Box-Muller transform for gaussian distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const gauss = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Apply mutation (standard deviation = 0.1 * range)
    const sigma = (max - min) * 0.1;
    const mutated = value + gauss * sigma;

    // Clamp to bounds
    return Math.max(min, Math.min(max, mutated));
  }

  /**
   * Crossover two parent genomes
   */
  crossover(parent1, parent2, newId) {
    const offspring = new AgentGenome(
      newId,
      Math.max(parent1.generation, parent2.generation) + 1,
    );

    // Uniform crossover: each gene has 50% chance from either parent
    Object.keys(offspring.genes).forEach((geneKey) => {
      offspring.genes[geneKey] =
        Math.random() < 0.5 ? parent1.genes[geneKey] : parent2.genes[geneKey];
    });

    offspring.parentIds = [parent1.id, parent2.id];
    return offspring;
  }
}

/**
 * Population Manager - Manages agent lifecycle and evolution
 */
class PopulationManager {
  constructor(populationSize = 50) {
    this.populationSize = populationSize;
    this.population = [];
    this.generation = 0;
    this.generationHistory = [];
    this.nextAgentId = 0;
  }

  /**
   * Initialize population with random agents
   */
  initialize() {
    this.population = [];
    for (let i = 0; i < this.populationSize; i++) {
      this.population.push(new AgentGenome(`agent-${this.nextAgentId++}`, 0));
    }
    logger.info(`Initialized population of ${this.populationSize} agents`);
  }

  /**
   * Selection via tournament
   */
  tournamentSelection(tournament_size = 5) {
    let best =
      this.population[Math.floor(Math.random() * this.population.length)];

    for (let i = 1; i < tournament_size; i++) {
      const candidate =
        this.population[Math.floor(Math.random() * this.population.length)];
      if ((candidate.fitness || 0) > (best.fitness || 0)) {
        best = candidate;
      }
    }

    return best;
  }

  /**
   * Selection via roulette wheel
   */
  rouletteWheelSelection() {
    const fitnessSum = this.population.reduce(
      (sum, agent) => sum + (agent.fitness || 0),
      0,
    );
    if (fitnessSum === 0)
      return this.population[
        Math.floor(Math.random() * this.population.length)
      ];

    let pick = Math.random() * fitnessSum;
    for (const agent of this.population) {
      pick -= agent.fitness || 0;
      if (pick <= 0) return agent;
    }

    return this.population[this.population.length - 1];
  }

  /**
   * Advance generation: selection, crossover, mutation
   */
  evolveGeneration(mutationEngine) {
    const newPopulation = [];

    // Elitism: keep top 10% unchanged
    const eliteCount = Math.ceil(this.populationSize * 0.1);
    const sorted = [...this.population].sort(
      (a, b) => (b.fitness || 0) - (a.fitness || 0),
    );
    for (let i = 0; i < eliteCount; i++) {
      newPopulation.push(
        sorted[i].clone(`agent-${this.nextAgentId++}`, this.generation + 1),
      );
    }

    // Fill rest through crossover + mutation
    while (newPopulation.length < this.populationSize) {
      const parent1 = this.tournamentSelection();
      const parent2 = this.tournamentSelection();

      let offspring;
      if (Math.random() < 0.7) {
        // 70% crossover
        offspring = mutationEngine.crossover(
          parent1,
          parent2,
          `agent-${this.nextAgentId++}`,
        );
      } else {
        // 30% mutation of elite
        offspring = mutationEngine.mutate(
          parent1,
          `agent-${this.nextAgentId++}`,
        );
      }

      newPopulation.push(offspring);
    }

    this.population = newPopulation.slice(0, this.populationSize);
    this.generation++;

    return {
      generation: this.generation,
      populationSize: this.population.length,
      avgFitness: this.getAverageFitness(),
      bestFitness: this.getBestFitness(),
    };
  }

  getAverageFitness() {
    if (this.population.length === 0) return 0;
    const sum = this.population.reduce((s, a) => s + (a.fitness || 0), 0);
    return sum / this.population.length;
  }

  getBestFitness() {
    if (this.population.length === 0) return 0;
    return Math.max(...this.population.map((a) => a.fitness || 0));
  }

  getBestAgent() {
    return [...this.population].sort(
      (a, b) => (b.fitness || 0) - (a.fitness || 0),
    )[0];
  }
}

/**
 * GENESIS-HDR Main Engine
 */
class GenesisHDR extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      populationSize: config.populationSize || 50,
      generationsPerEpoch: config.generationsPerEpoch || 10,
      mutationRate: config.mutationRate || 0.15,
      tournamentSize: config.tournamentSize || 5,
      catalogUrl: config.catalogUrl || "http://nexus-hdr:3000/catalog",
      ...config,
    };

    this.populationManager = new PopulationManager(this.config.populationSize);
    this.fitnessEvaluator = new FitnessEvaluator();
    this.mutationEngine = new MutationEngine(this.config.mutationRate);

    this.state = "idle";
    this.evolutionMetrics = {
      generationCount: 0,
      agentsCreated: 0,
      agentsEvaluated: 0,
      peakFitness: 0,
      averageFitness: 0,
      broadcastCount: 0,
    };

    logger.info("GENESIS-HDR initialized", { config: this.config });
  }

  /**
   * Register benchmark task for agent evaluation
   */
  registerBenchmark(taskName, taskFunction, weight = 1.0) {
    this.fitnessEvaluator.registerTask(taskName, taskFunction, weight);
  }

  /**
   * Breed a new agent (on-demand)
   * Can breed from scratch or based on baseAgent template
   */
  breed(options = {}) {
    const { baseAgent = null, targetFitness = null } = options;

    // Create new agent genome
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    let genes = {};
    
    if (baseAgent) {
      // Create agent based on provided template
      genes = {
        analyticalPower: baseAgent.analyticalPower || Math.random(),
        creativityIndex: baseAgent.creativity || Math.random(),
        personality: baseAgent.personality || "analytical",
        communicationStyle: baseAgent.communicationStyle || "technical",
        riskTolerance: baseAgent.riskTolerance || Math.random(),
        collaborativeTendency: baseAgent.collaborativeTendency || Math.random(),
        domainSpecialization: baseAgent.domainSpecialization || "synthesis",
        problemSolvingStrategy: baseAgent.strategy || "hybrid",
        learningRate: baseAgent.learningRate || 0.01 + Math.random() * 0.05,
        memoryRetention: baseAgent.memoryRetention || Math.random(),
        adaptabilityScore: baseAgent.adaptabilityScore || Math.random(),
        resilience: baseAgent.resilience || Math.random(),
      };
    }

    const newAgent = new AgentGenome(agentId, 1, genes);
    
    // Calculate fitness score from genetic traits
    // Weighted average of key performance genes
    const fitnessComponents = [
      newAgent.genes.analyticalPower * 0.25,
      newAgent.genes.creativityIndex * 0.15,
      newAgent.genes.learningRate * 0.2,
      newAgent.genes.adaptabilityScore * 0.2,
      newAgent.genes.resilience * 0.2,
    ];
    newAgent.fitnessScore = Math.min(1, Math.max(0, fitnessComponents.reduce((a, b) => a + b, 0)));
    
    this.evolutionMetrics.agentsCreated++;
    
    logger.info(`Bred new agent: ${agentId}`, {
      personality: newAgent.genes.personality,
      analyticalPower: newAgent.genes.analyticalPower.toFixed(3),
      fitnessScore: newAgent.fitnessScore.toFixed(3),
    });

    this.emit("agent:bred", {
      agentId: newAgent.id,
      fitnessScore: newAgent.fitnessScore,
      phenotype: newAgent.getPhenotype(),
      targetFitness,
    });

    return newAgent;
  }

  /**
   * Breed a population of agents
   */
  breedPopulation(size = 10, options = {}) {
    const population = [];
    for (let i = 0; i < size; i++) {
      const agent = this.breed(options);
      population.push(agent);
    }
    return population;
  }

  /**
   * Initialize evolutionary epoch
   */
  async initializeEpoch() {
    logger.info("Initializing evolutionary epoch");
    this.populationManager.initialize();
    this.state = "evaluating";
    this.emit("epoch:initialized", {
      populationSize: this.config.populationSize,
    });
  }

  /**
   * Evaluate entire population
   */
  async evaluatePopulation() {
    logger.info(
      `Evaluating population (generation ${this.populationManager.generation})`,
    );
    this.state = "evaluating";

    for (const agent of this.populationManager.population) {
      await this.fitnessEvaluator.evaluateAgent(agent);
      this.evolutionMetrics.agentsEvaluated++;
    }

    const avgFitness = this.populationManager.getAverageFitness();
    const bestFitness = this.populationManager.getBestFitness();

    this.evolutionMetrics.averageFitness = avgFitness;
    this.evolutionMetrics.peakFitness = Math.max(
      this.evolutionMetrics.peakFitness,
      bestFitness,
    );

    this.emit("population:evaluated", {
      generation: this.populationManager.generation,
      avgFitness,
      bestFitness,
      populationSize: this.populationManager.population.length,
    });

    return { avgFitness, bestFitness };
  }

  /**
   * Evolve population to next generation
   */
  evolveGeneration() {
    this.state = "evolving";

    const stats = this.populationManager.evolveGeneration(this.mutationEngine);
    this.evolutionMetrics.generationCount++;
    this.evolutionMetrics.agentsCreated += Math.ceil(
      this.config.populationSize * 0.9,
    ); // Elite not counted

    this.emit("generation:evolved", stats);

    return stats;
  }

  /**
   * Broadcast best agents to NEXUS-HDR catalog
   */
  async broadcastBestAgents(topNCount = 5) {
    const topAgents = [...this.populationManager.population]
      .sort((a, b) => (b.fitness || 0) - (a.fitness || 0))
      .slice(0, topNCount);

    for (const agent of topAgents) {
      try {
        const agentCard = {
          id: agent.id,
          generation: agent.generation,
          fitness: agent.fitness,
          phenotype: agent.getPhenotype(),
          registeredAt: new Date(),
          source: "genesis-hdr",
        };

        // TODO: POST to NEXUS-HDR catalog
        logger.info(
          `Broadcasting agent: ${agent.id} (fitness: ${agent.fitness.toFixed(3)})`,
        );
        this.evolutionMetrics.broadcastCount++;
        this.emit("agent:broadcast", agentCard);
      } catch (error) {
        logger.warn(
          { agentId: agent.id, error: error.message },
          "Failed to broadcast agent",
        );
      }
    }
  }

  /**
   * Run full evolutionary epoch
   */
  async runEpoch() {
    logger.info("Starting evolutionary epoch");
    this.state = "running";

    try {
      await this.initializeEpoch();

      for (let gen = 0; gen < this.config.generationsPerEpoch; gen++) {
        await this.evaluatePopulation();
        const stats = this.evolveGeneration();

        logger.info(
          `Generation ${stats.generation}: avgFitness=${stats.avgFitness.toFixed(4)}, bestFitness=${stats.bestFitness.toFixed(4)}`,
        );

        // Broadcast top agents every 5 generations
        if ((gen + 1) % 5 === 0) {
          await this.broadcastBestAgents();
        }
      }

      this.state = "idle";
      this.emit("epoch:complete", { metrics: this.evolutionMetrics });
    } catch (error) {
      logger.error({ error: error.message }, "Epoch execution failed");
      this.state = "error";
      throw error;
    }
  }

  /**
   * Get current population stats
   */
  getPopulationStats() {
    return {
      generation: this.populationManager.generation,
      populationSize: this.populationManager.population.length,
      avgFitness: this.populationManager.getAverageFitness(),
      bestFitness: this.populationManager.getBestFitness(),
      diversity: this.calculateDiversity(),
      state: this.state,
    };
  }

  /**
   * Calculate genetic diversity of population
   */
  calculateDiversity() {
    if (this.populationManager.population.length < 2) return 1.0;

    let totalDistance = 0;
    let comparisons = 0;

    // Sample random pairs
    for (
      let i = 0;
      i < Math.min(100, this.populationManager.population.length);
      i++
    ) {
      const a =
        this.populationManager.population[
          Math.floor(Math.random() * this.populationManager.population.length)
        ];
      const b =
        this.populationManager.population[
          Math.floor(Math.random() * this.populationManager.population.length)
        ];

      if (a.id !== b.id) {
        const distance = this.calculateGeneticDistance(a, b);
        totalDistance += distance;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalDistance / comparisons : 1.0;
  }

  /**
   * Calculate genetic distance between two agents
   */
  calculateGeneticDistance(agent1, agent2) {
    let distance = 0;
    const numericGenes = [
      "riskTolerance",
      "analyticalPower",
      "creativityIndex",
      "learningRate",
      "memoryRetention",
      "adaptabilityScore",
      "resilience",
    ];

    for (const gene of numericGenes) {
      distance += Math.abs(
        (agent1.genes[gene] || 0) - (agent2.genes[gene] || 0),
      );
    }

    return distance / numericGenes.length;
  }

  /**
   * Get best agent phenotype
   */
  getBestAgentPhenotype() {
    const best = this.populationManager.getBestAgent();
    return best ? best.getPhenotype() : null;
  }
}

export {
  GenesisHDR,
  AgentGenome,
  FitnessEvaluator,
  MutationEngine,
  PopulationManager,
};
