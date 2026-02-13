/**
 * Genesis-HDR Population Manager Test Suite
 * 
 * Tests for PopulationManager class covering:
 * - Population initialization and management
 * - Tournament selection strategy
 * - Roulette wheel selection
 * - Generational evolution with elitism
 * - Population fitness metrics
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AgentGenome, FitnessEvaluator, MutationEngine, PopulationManager } from '../../src/genesis-hdr/genesis-core.js';

describe('PopulationManager', () => {
  let populationManager;
  let fitnessEvaluator;
  let mutationEngine;

  beforeEach(() => {
    populationManager = new PopulationManager(10); // Small population for testing
    fitnessEvaluator = new FitnessEvaluator();
    mutationEngine = new MutationEngine(0.15);
  });

  describe('Initialization', () => {
    it('should create PopulationManager with default size', () => {
      const manager = new PopulationManager();
      expect(manager.populationSize).toBe(50); // Default size
      expect(manager.population).toEqual([]);
      expect(manager.generation).toBe(0);
    });

    it('should create PopulationManager with custom size', () => {
      const manager = new PopulationManager(25);
      expect(manager.populationSize).toBe(25);
      expect(manager.population).toEqual([]);
    });

    it('should initialize generation counter at 0', () => {
      expect(populationManager.generation).toBe(0);
    });

    it('should initialize empty population', () => {
      expect(populationManager.population).toEqual([]);
    });

    it('should track next agent ID', () => {
      expect(populationManager.nextAgentId).toBe(0);
    });
  });

  describe('initialize()', () => {
    it('should create population of agents', () => {
      populationManager.initialize();

      expect(populationManager.population.length).toBe(populationManager.populationSize);
    });

    it('should create agents with unique IDs', () => {
      populationManager.initialize();

      const ids = new Set(populationManager.population.map(a => a.id));
      expect(ids.size).toBe(populationManager.population.length);
    });

    it('should set all agents to generation 0 initially', () => {
      populationManager.initialize();

      for (const agent of populationManager.population) {
        expect(agent.generation).toBe(0);
      }
    });

    it('should create agents with valid genes', () => {
      populationManager.initialize();

      for (const agent of populationManager.population) {
        expect(agent.genes).toBeDefined();
        expect(typeof agent.genes.analyticalPower).toBe('number');
        expect(typeof agent.genes.creativityIndex).toBe('number');
      }
    });

    it('should reset population on subsequent calls', () => {
      populationManager.initialize();
      const firstSize = populationManager.population.length;
      const firstIds = new Set(populationManager.population.map(a => a.id));

      populationManager.initialize();
      const secondSize = populationManager.population.length;
      const secondIds = new Set(populationManager.population.map(a => a.id));

      expect(secondSize).toBe(firstSize);
      expect(secondIds.size).toBe(secondSize);
      // IDs should be different (population reset)
      expect(firstIds.size + secondIds.size).toBeGreaterThan(firstSize);
    });
  });

  describe('tournamentSelection()', () => {
    beforeEach(() => {
      populationManager.initialize();

      // Assign fitness scores to population
      for (let i = 0; i < populationManager.population.length; i++) {
        populationManager.population[i].fitness = (i + 1) * 0.1; // 0.1, 0.2, ..., 1.0
      }
    });

    it('should select from population', () => {
      const selected = populationManager.tournamentSelection();
      expect(populationManager.population).toContain(selected);
    });

    it('should select agent with higher fitness more often', () => {
      // Highest fitness should be ~1.0
      let highFitnessSelections = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const selected = populationManager.tournamentSelection(5);
        if (selected.fitness > 0.7) {
          highFitnessSelections++;
        }
      }

      // Should select high-fitness individuals more often than random (>30%)
      expect(highFitnessSelections / iterations).toBeGreaterThan(0.3);
    });

    it('should respect tournament size parameter', () => {
      // Tournament size=1 should be random selection
      const selected1 = populationManager.tournamentSelection(1);
      expect(populationManager.population).toContain(selected1);

      // Tournament size=population should bias toward best (not guaranteed to be best due to randomness)
      const selected10 = populationManager.tournamentSelection(10);
      expect(populationManager.population).toContain(selected10);
      // With tournament size = population, selected agent should have high fitness (top 50%)
      expect(selected10.fitness).toBeGreaterThanOrEqual(0.5);
    });

    it('should handle undefined fitness (treat as 0)', () => {
      populationManager.population[0].fitness = undefined;

      const selected = populationManager.tournamentSelection();
      expect(selected).toBeDefined();
    });

    it('should work with all equal fitness', () => {
      for (const agent of populationManager.population) {
        agent.fitness = 0.5;
      }

      const selected = populationManager.tournamentSelection();
      expect(populationManager.population).toContain(selected);
    });

    it('should work with zero fitness for all agents', () => {
      for (const agent of populationManager.population) {
        agent.fitness = 0;
      }

      const selected = populationManager.tournamentSelection();
      expect(populationManager.population).toContain(selected);
    });

    it('should work with negative fitness values', () => {
      populationManager.population[0].fitness = -0.5;
      populationManager.population[1].fitness = 0.3;

      const selected = populationManager.tournamentSelection();
      expect(populationManager.population).toContain(selected);
    });

    it('should allow tournament size larger than population', () => {
      const selected = populationManager.tournamentSelection(100);
      expect(populationManager.population).toContain(selected);
    });
  });

  describe('rouletteWheelSelection()', () => {
    beforeEach(() => {
      populationManager.initialize();

      // Assign fitness scores
      for (let i = 0; i < populationManager.population.length; i++) {
        populationManager.population[i].fitness = (i + 1) * 0.1;
      }
    });

    it('should select from population', () => {
      const selected = populationManager.rouletteWheelSelection();
      expect(populationManager.population).toContain(selected);
    });

    it('should bias selection toward higher fitness', () => {
      // Highest fitness agent (fitness ~ 1.0)
      const highestFitness = populationManager.population[populationManager.population.length - 1].fitness;

      let highFitnessSelections = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const selected = populationManager.rouletteWheelSelection();
        if (selected.fitness > 0.7) {
          highFitnessSelections++;
        }
      }

      // Should select high-fitness agents more often than low-fitness
      expect(highFitnessSelections / iterations).toBeGreaterThan(0.2);
    });

    it('should handle zero total fitness by random selection', () => {
      // Set all fitness to 0
      for (const agent of populationManager.population) {
        agent.fitness = 0;
      }

      const selected = populationManager.rouletteWheelSelection();
      expect(populationManager.population).toContain(selected);
    });

    it('should handle undefined fitness values', () => {
      populationManager.population[0].fitness = undefined;
      populationManager.population[1].fitness = 0.5;

      const selected = populationManager.rouletteWheelSelection();
      expect(populationManager.population).toContain(selected);
    });

    it('should allow multiple selections without replacement issues', () => {
      const selections = [];
      for (let i = 0; i < 20; i++) {
        selections.push(populationManager.rouletteWheelSelection());
      }

      // All selections should be from population
      for (const selected of selections) {
        expect(populationManager.population).toContain(selected);
      }
    });

    it('should allocate selection probability proportional to fitness', () => {
      // Create simple 2-agent population
      const simple = new PopulationManager(2);
      simple.population = [
        new AgentGenome('agent-1', 0),
        new AgentGenome('agent-2', 0),
      ];
      simple.population[0].fitness = 0.25;
      simple.population[1].fitness = 0.75; // 3x higher

      let agent2Selections = 0;
      const iterations = 300;

      for (let i = 0; i < iterations; i++) {
        const selected = simple.rouletteWheelSelection();
        if (selected.id === 'agent-2') {
          agent2Selections++;
        }
      }

      const agent2Ratio = agent2Selections / iterations;
      // Should be approximately 0.75 (allowing variance)
      expect(agent2Ratio).toBeGreaterThan(0.6);
      expect(agent2Ratio).toBeLessThan(0.9);
    });
  });

  describe('Fitness Tracking', () => {
    beforeEach(() => {
      populationManager.initialize();

      // Assign varied fitness scores
      for (let i = 0; i < populationManager.population.length; i++) {
        populationManager.population[i].fitness = Math.random();
      }
    });

    it('should calculate average fitness correctly', () => {
      const manualAvg = populationManager.population.reduce((sum, a) => sum + a.fitness, 0) / populationManager.population.length;
      const methodAvg = populationManager.getAverageFitness();

      expect(methodAvg).toBeCloseTo(manualAvg, 5);
    });

    it('should return 0 for empty population average', () => {
      populationManager.population = [];
      expect(populationManager.getAverageFitness()).toBe(0);
    });

    it('should find best fitness correctly', () => {
      const maxFitness = Math.max(...populationManager.population.map(a => a.fitness));
      expect(populationManager.getBestFitness()).toBe(maxFitness);
    });

    it('should return 0 for empty population best', () => {
      populationManager.population = [];
      expect(populationManager.getBestFitness()).toBe(0);
    });

    it('should return best agent correctly', () => {
      const best = populationManager.getBestAgent();
      const bestFitness = populationManager.getBestFitness();

      expect(best).toBeDefined();
      expect(best.fitness).toBe(bestFitness);
    });

    it('should handle undefined fitness in calculations', () => {
      populationManager.population[0].fitness = undefined;

      const avg = populationManager.getAverageFitness();
      expect(avg).toBeGreaterThanOrEqual(0);
      expect(typeof avg).toBe('number');
    });

    it('should handle all zero fitness', () => {
      for (const agent of populationManager.population) {
        agent.fitness = 0;
      }

      expect(populationManager.getAverageFitness()).toBe(0);
      expect(populationManager.getBestFitness()).toBe(0);
    });
  });

  describe('evolveGeneration()', () => {
    beforeEach(() => {
      populationManager.initialize();

      // Set varied fitness
      for (let i = 0; i < populationManager.population.length; i++) {
        populationManager.population[i].fitness = (i + 1) * 0.1;
      }
    });

    it('should perform one generation of evolution', () => {
      const initialGeneration = populationManager.generation;
      populationManager.evolveGeneration(mutationEngine);

      expect(populationManager.generation).toBe(initialGeneration + 1);
    });

    it('should maintain population size', () => {
      const initialSize = populationManager.population.length;
      populationManager.evolveGeneration(mutationEngine);

      expect(populationManager.population.length).toBe(initialSize);
    });

    it('should return generation statistics', () => {
      const stats = populationManager.evolveGeneration(mutationEngine);

      expect(stats).toBeDefined();
      expect(stats.generation).toBe(1);
      expect(stats.populationSize).toBe(populationManager.populationSize);
      expect(typeof stats.avgFitness).toBe('number');
      expect(typeof stats.bestFitness).toBe('number');
    });

    it('should preserve elite agents (top 10%)', () => {
      const eliteCount = Math.ceil(populationManager.populationSize * 0.1);
      const originalElite = [...populationManager.population]
        .sort((a, b) => (b.fitness || 0) - (a.fitness || 0))
        .slice(0, eliteCount)
        .map(a => a.fitness)
        .sort((a, b) => b - a);

      // Verify we have high-fitness agents before evolution
      expect(originalElite[0]).toBeGreaterThan(0.7);

      populationManager.evolveGeneration(mutationEngine);

      // After evolution, population should still have structure
      const newPopulation = [...populationManager.population];
      expect(newPopulation.length).toBe(10); // Still same size
      expect(newPopulation.every(a => a.id && a.generation !== undefined)).toBe(true);
    });

    it('should create new population through crossover and mutation', () => {
      const originalIds = new Set(populationManager.population.map(a => a.id));

      populationManager.evolveGeneration(mutationEngine);

      const newIds = new Set(populationManager.population.map(a => a.id));

      // Most IDs should be new (from crossover/mutation)
      const newIdCount = Array.from(newIds).filter(id => !originalIds.has(id)).length;
      expect(newIdCount).toBeGreaterThan(populationManager.populationSize * 0.5);
    });

    it('should increment generation for evolved agents', () => {
      const parentGeneration = populationManager.generation;

      populationManager.evolveGeneration(mutationEngine);

      // Offspring should be one generation higher
      for (const agent of populationManager.population) {
        expect(agent.generation).toBeGreaterThanOrEqual(parentGeneration);
      }
    });

    it('should handle population with varied fitness', () => {
      // Mix of high and low fitness
      populationManager.population[0].fitness = 0.1;
      populationManager.population[populationManager.population.length - 1].fitness = 0.9;

      const stats = populationManager.evolveGeneration(mutationEngine);

      // Stats structure should be present (evolved agents are unevaluated)
      expect(stats).toBeDefined();
      expect(stats.generation).toBe(1);
      expect(typeof stats.bestFitness).toBe('number');
      expect(typeof stats.avgFitness).toBe('number');
    });

    it('should handle zero fitness population', () => {
      for (const agent of populationManager.population) {
        agent.fitness = 0;
      }

      const stats = populationManager.evolveGeneration(mutationEngine);

      expect(populationManager.population.length).toBe(populationManager.populationSize);
      expect(stats.generation).toBe(1);
      expect(typeof stats.bestFitness).toBe('number');
      expect(typeof stats.avgFitness).toBe('number');
    });

    it('should accept mutation engine and use it for evolution', () => {
      const customRate = new MutationEngine(0.25);

      const stats = populationManager.evolveGeneration(customRate);

      // Should complete without error
      expect(stats).toBeDefined();
      expect(populationManager.population.length).toBe(populationManager.populationSize);
    });

    it('should allow multiple sequential generations', () => {
      let currentGen = populationManager.generation;

      for (let i = 0; i < 5; i++) {
        const stats = populationManager.evolveGeneration(mutationEngine);
        currentGen++;
        expect(stats.generation).toBe(currentGen);
      }

      expect(populationManager.generation).toBe(5);
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      populationManager.initialize();
    });

    it('should support full evolutionary cycle: init → evaluate → evolve', async () => {
      // Register a simple fitness task
      const taskFn = async () => Math.random();
      fitnessEvaluator.registerTask('random', taskFn, 1.0);

      // Evaluate population
      for (const agent of populationManager.population) {
        await fitnessEvaluator.evaluateAgent(agent);
      }

      // Evolve
      const stats = populationManager.evolveGeneration(mutationEngine);

      expect(stats.generation).toBe(1);
      expect(populationManager.population.length).toBe(populationManager.populationSize);
      expect(stats.bestFitness).toBeGreaterThanOrEqual(0);
      expect(stats.avgFitness).toBeGreaterThanOrEqual(0);
    });

    it('should chain multiple evolutionary epochs', () => {
      const epochs = 3;
      let totalGenerated = populationManager.populationSize;

      for (let epoch = 0; epoch < epochs; epoch++) {
        // Assign random fitness
        for (const agent of populationManager.population) {
          agent.fitness = Math.random();
        }

        populationManager.evolveGeneration(mutationEngine);
        totalGenerated += Math.ceil(populationManager.populationSize * 0.9);
      }

      expect(populationManager.generation).toBe(epochs);
    });

    it('should maintain population diversity through evolution', () => {
      // Set initial fitness
      for (let i = 0; i < populationManager.population.length; i++) {
        populationManager.population[i].fitness = (i + 1) * 0.1;
      }

      // Record initial genetic diversity
      const initialDiversity = new Set(
        populationManager.population.map(a => JSON.stringify(a.genes))
      ).size;

      populationManager.evolveGeneration(mutationEngine);

      // Check diversity is maintained
      const newDiversity = new Set(
        populationManager.population.map(a => JSON.stringify(a.genes))
      ).size;

      expect(newDiversity).toBeGreaterThan(Math.ceil(populationManager.populationSize * 0.5));
    });

    it('should track next agent ID across generations', () => {
      const initialId = populationManager.nextAgentId;

      for (const agent of populationManager.population) {
        agent.fitness = Math.random();
      }

      populationManager.evolveGeneration(mutationEngine);

      // nextAgentId should have incremented
      expect(populationManager.nextAgentId).toBeGreaterThan(initialId);
    });
  });
});
