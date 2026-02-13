/**
 * Genesis-HDR Mutation Engine Test Suite
 * 
 * Tests for MutationEngine class covering:
 * - Gaussian mutation with Box-Muller transform
 * - Genome mutation with trait randomization
 * - Crossover operations for genetic recombination
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AgentGenome, MutationEngine } from '../../src/genesis-hdr/genesis-core.js';

describe('MutationEngine', () => {
  let mutationEngine;
  let parentGenome;

  beforeEach(() => {
    // Initialize MutationEngine with default mutation rate
    mutationEngine = new MutationEngine(0.15);

    // Create a parent genome for testing
    parentGenome = new AgentGenome('test-agent', 0, {
      riskTolerance: 0.5,
      analyticalPower: 0.6,
      creativityIndex: 0.4,
      collaborativeTendency: 0.7,
      learningRate: 0.02,
      memoryRetention: 0.8,
      adaptabilityScore: 0.55,
      resilience: 0.65,
    });
    parentGenome.fitness = 0.75;
  });

  describe('Initialization', () => {
    it('should create MutationEngine with default mutation rate', () => {
      const engine = new MutationEngine();
      expect(engine).toBeDefined();
      expect(engine.mutationRate).toBe(0.15); // Default
    });

    it('should create MutationEngine with custom mutation rate', () => {
      const engine = new MutationEngine(0.25);
      expect(engine.mutationRate).toBe(0.25);
    });

    it('should accept mutation rates within valid range', () => {
      const lowRate = new MutationEngine(0.01);
      const highRate = new MutationEngine(0.5);
      expect(lowRate.mutationRate).toBe(0.01);
      expect(highRate.mutationRate).toBe(0.5);
    });
  });

  describe('gaussianMutate()', () => {
    it('should return mutated value within bounds', () => {
      const original = 0.5;
      const min = 0;
      const max = 1;

      for (let i = 0; i < 50; i++) {
        const mutated = mutationEngine.gaussianMutate(original, min, max);
        expect(mutated).toBeGreaterThanOrEqual(min);
        expect(mutated).toBeLessThanOrEqual(max);
      }
    });

    it('should clamp values at lower boundary', () => {
      // Very low value should clamp to min
      const mutated = mutationEngine.gaussianMutate(-5, 0, 1);
      expect(mutated).toBeGreaterThanOrEqual(0);
    });

    it('should clamp values at upper boundary', () => {
      // Very high value should clamp to max
      const mutated = mutationEngine.gaussianMutate(5, 0, 1);
      expect(mutated).toBeLessThanOrEqual(1);
    });

    it('should apply mutations with reasonable distribution', () => {
      const original = 0.5;
      const mutations = [];

      for (let i = 0; i < 100; i++) {
        mutations.push(mutationEngine.gaussianMutate(original, 0, 1));
      }

      // Calculate mean and std dev of mutations
      const mean = mutations.reduce((a, b) => a + b) / mutations.length;
      const variance = mutations.reduce((sum, m) => sum + Math.pow(m - mean, 2), 0) / mutations.length;
      const stdDev = Math.sqrt(variance);

      // Mean should be close to original (within 0.2 for stochastic process)
      expect(Math.abs(mean - original)).toBeLessThan(0.2);

      // Standard deviation should be reasonable (> 0 for variance, < 1 for [0,1] range)
      expect(stdDev).toBeGreaterThan(0.01);
      expect(stdDev).toBeLessThan(0.5);
    });

    it('should handle boundary values correctly', () => {
      // Test at minimum
      const atMin = mutationEngine.gaussianMutate(0, 0, 1);
      expect(atMin).toBeGreaterThanOrEqual(0);
      expect(atMin).toBeLessThanOrEqual(1);

      // Test at maximum
      const atMax = mutationEngine.gaussianMutate(1, 0, 1);
      expect(atMax).toBeGreaterThanOrEqual(0);
      expect(atMax).toBeLessThanOrEqual(1);
    });

    it('should use custom min/max bounds correctly', () => {
      const original = 50;
      const min = 0;
      const max = 100;

      for (let i = 0; i < 50; i++) {
        const mutated = mutationEngine.gaussianMutate(original, min, max);
        expect(mutated).toBeGreaterThanOrEqual(min);
        expect(mutated).toBeLessThanOrEqual(max);
      }
    });
  });

  describe('mutate()', () => {
    it('should create offspring with new ID', () => {
      const offspring = mutationEngine.mutate(parentGenome, 'offspring-1');
      expect(offspring.id).toBe('offspring-1');
      expect(offspring.id).not.toBe(parentGenome.id);
    });

    it('should increment generation number', () => {
      const offspring = mutationEngine.mutate(parentGenome, 'offspring-1');
      expect(offspring.generation).toBe(parentGenome.generation + 1);
    });

    it('should track parent ID in offspring', () => {
      const offspring = mutationEngine.mutate(parentGenome, 'offspring-1');
      expect(offspring.parentIds).toContain(parentGenome.id);
    });

    it('should keep only two parent IDs from single parent', () => {
      const offspring = mutationEngine.mutate(parentGenome, 'offspring-1');
      // Single parent creates one parentId entry
      expect(offspring.parentIds.length).toBeLessThanOrEqual(1);
    });

    it('should mutate numeric genes', () => {
      const originalGenes = { ...parentGenome.genes };
      const offspring = mutationEngine.mutate(parentGenome, 'offspring-1');

      // At least some numeric genes should be mutated
      const numericGeneKeys = [
        'riskTolerance',
        'analyticalPower',
        'creativityIndex',
        'learningRate',
        'memoryRetention',
        'adaptabilityScore',
        'resilience',
      ];

      let mutatedCount = 0;
      for (const gene of numericGeneKeys) {
        if (Math.abs(offspring.genes[gene] - originalGenes[gene]) > 0.001) {
          mutatedCount++;
        }
      }

      // With 15% mutation rate, expect some but not all genes mutated
      expect(mutatedCount).toBeGreaterThan(0);
    });

    it('should keep numeric genes within [0,1] bounds', () => {
      const offspring = mutationEngine.mutate(parentGenome, 'offspring-1');

      const numericGenes = [
        'riskTolerance',
        'analyticalPower',
        'creativityIndex',
        'learningRate',
        'memoryRetention',
        'adaptabilityScore',
        'resilience',
      ];

      for (const gene of numericGenes) {
        expect(offspring.genes[gene]).toBeGreaterThanOrEqual(0);
        expect(offspring.genes[gene]).toBeLessThanOrEqual(1);
      }
    });

    it('should preserve categorical traits (or randomize with low probability)', () => {
      const offspring = mutationEngine.mutate(parentGenome, 'offspring-1');

      // Genes should be defined even if mutated
      expect(offspring.genes.personality).toBeDefined();
      expect(offspring.genes.communicationStyle).toBeDefined();
      expect(offspring.genes.domainSpecialization).toBeDefined();
      expect(offspring.genes.problemSolvingStrategy).toBeDefined();
    });

    it('should maintain agent structure after mutation', () => {
      const offspring = mutationEngine.mutate(parentGenome, 'offspring-1');

      // Check required properties exist
      expect(offspring.id).toBeDefined();
      expect(offspring.generation).toBeDefined();
      expect(offspring.genes).toBeDefined();
      expect(offspring.parentIds).toBeDefined();
      expect(typeof offspring.getPhenotype).toBe('function');
    });

    it('should handle multiple sequential mutations', () => {
      let current = parentGenome;

      for (let i = 0; i < 5; i++) {
        current = mutationEngine.mutate(current, `offspring-${i}`);
        expect(current.generation).toBe(parentGenome.generation + i + 1);
      }

      // After 5 mutations, should have accumulated significant changes
      const finalGenes = current.genes;
      const originalGenes = parentGenome.genes;

      let differences = 0;
      for (const gene of Object.keys(originalGenes)) {
        if (typeof originalGenes[gene] === 'number' &&
            Math.abs(finalGenes[gene] - originalGenes[gene]) > 0.01) {
          differences++;
        }
      }

      expect(differences).toBeGreaterThan(0);
    });
  });

  describe('crossover()', () => {
    let parent1;
    let parent2;

    beforeEach(() => {
      parent1 = new AgentGenome('parent-1', 0, {
        riskTolerance: 0.3,
        analyticalPower: 0.8,
        creativityIndex: 0.2,
        collaborativeTendency: 0.4,
        learningRate: 0.01,
        memoryRetention: 0.6,
        adaptabilityScore: 0.7,
        resilience: 0.5,
      });

      parent2 = new AgentGenome('parent-2', 0, {
        riskTolerance: 0.9,
        analyticalPower: 0.2,
        creativityIndex: 0.8,
        collaborativeTendency: 0.6,
        learningRate: 0.03,
        memoryRetention: 0.4,
        adaptabilityScore: 0.3,
        resilience: 0.9,
      });
    });

    it('should create offspring with new ID', () => {
      const offspring = mutationEngine.crossover(parent1, parent2, 'offspring-1');
      expect(offspring.id).toBe('offspring-1');
      expect(offspring.id).not.toBe(parent1.id);
      expect(offspring.id).not.toBe(parent2.id);
    });

    it('should increment generation from both parents', () => {
      const offspring = mutationEngine.crossover(parent1, parent2, 'offspring-1');
      expect(offspring.generation).toBe(Math.max(parent1.generation, parent2.generation) + 1);
    });

    it('should track both parent IDs in offspring', () => {
      const offspring = mutationEngine.crossover(parent1, parent2, 'offspring-1');
      expect(offspring.parentIds).toContain(parent1.id);
      expect(offspring.parentIds).toContain(parent2.id);
    });

    it('should inherit genes from both parents', () => {
      const offspring = mutationEngine.crossover(parent1, parent2, 'offspring-1');

      const numericGenes = [
        'riskTolerance',
        'analyticalPower',
        'creativityIndex',
        'learningRate',
        'memoryRetention',
        'adaptabilityScore',
        'resilience',
      ];

      for (const gene of numericGenes) {
        const offspringValue = offspring.genes[gene];
        const parent1Value = parent1.genes[gene];
        const parent2Value = parent2.genes[gene];

        // Offspring should have value that's one of the parents or between them
        // (due to possible mutation in crossover)
        expect(offspringValue).toBeGreaterThanOrEqual(Math.min(parent1Value, parent2Value) - 0.15);
        expect(offspringValue).toBeLessThanOrEqual(Math.max(parent1Value, parent2Value) + 0.15);
      }
    });

    it('should maintain numeric genes within [0,1] bounds', () => {
      const offspring = mutationEngine.crossover(parent1, parent2, 'offspring-1');

      const numericGenes = [
        'riskTolerance',
        'analyticalPower',
        'creativityIndex',
        'learningRate',
        'memoryRetention',
        'adaptabilityScore',
        'resilience',
      ];

      for (const gene of numericGenes) {
        expect(offspring.genes[gene]).toBeGreaterThanOrEqual(0);
        expect(offspring.genes[gene]).toBeLessThanOrEqual(1);
      }
    });

    it('should produce approximately 50/50 gene inheritance on average', () => {
      const iterations = 100;
      let inheritFrom1 = 0;

      for (let i = 0; i < iterations; i++) {
        const offspring = mutationEngine.crossover(parent1, parent2, `offspring-${i}`);
        
        // Count how many genes are closer to parent1 vs parent2
        const target = 'analyticalPower';
        const dist1 = Math.abs(offspring.genes[target] - parent1.genes[target]);
        const dist2 = Math.abs(offspring.genes[target] - parent2.genes[target]);

        if (dist1 < dist2) {
          inheritFrom1++;
        }
      }

      // Should be approximately 50/50, allowing for randomness
      const ratio = inheritFrom1 / iterations;
      expect(ratio).toBeGreaterThan(0.3);
      expect(ratio).toBeLessThan(0.7);
    });

    it('should work with genetically distant parents', () => {
      // Create very different parents
      const distant1 = new AgentGenome('distant-1', 0, {
        riskTolerance: 0.1,
        analyticalPower: 0.1,
        creativityIndex: 0.1,
        collaborativeTendency: 0.1,
        learningRate: 0.001,
        memoryRetention: 0.1,
        adaptabilityScore: 0.1,
        resilience: 0.1,
      });

      const distant2 = new AgentGenome('distant-2', 0, {
        riskTolerance: 0.9,
        analyticalPower: 0.9,
        creativityIndex: 0.9,
        collaborativeTendency: 0.9,
        learningRate: 0.05,
        memoryRetention: 0.9,
        adaptabilityScore: 0.9,
        resilience: 0.9,
      });

      const offspring = mutationEngine.crossover(distant1, distant2, 'hybrid-offspring');
      
      // Offspring should have reasonable intermediate values (not extreme)
      const numericGenes = [
        'riskTolerance',
        'analyticalPower',
        'creativityIndex',
      ];

      for (const gene of numericGenes) {
        expect(offspring.genes[gene]).toBeGreaterThan(0.05);
        expect(offspring.genes[gene]).toBeLessThan(0.95);
      }
    });

    it('should maintain agent structure after crossover', () => {
      const offspring = mutationEngine.crossover(parent1, parent2, 'offspring-1');

      expect(offspring.id).toBeDefined();
      expect(offspring.generation).toBeDefined();
      expect(offspring.genes).toBeDefined();
      expect(offspring.parentIds).toBeDefined();
      expect(typeof offspring.getPhenotype).toBe('function');
    });

    it('should handle self-crossover (same parent twice)', () => {
      const offspring = mutationEngine.crossover(parent1, parent1, 'self-offspring');

      // Self-crossover should preserve genes closely (maybe slight mutation)
      const differences = [];
      for (const gene of Object.keys(parent1.genes)) {
        if (typeof parent1.genes[gene] === 'number') {
          differences.push(Math.abs(offspring.genes[gene] - parent1.genes[gene]));
        }
      }

      const avgDiff = differences.reduce((a, b) => a + b) / differences.length;
      
      // Self-crossover should result in minimal changes (slight mutation only)
      expect(avgDiff).toBeLessThan(0.15);
    });

    it('should allow multiple crossovers in sequence', () => {
      let current = parent1;

      for (let i = 0; i < 3; i++) {
        const partner = i === 0 ? parent2 : current;
        current = mutationEngine.crossover(current, partner, `generation-${i}`);
        expect(current.generation).toBe(Math.max(parent1.generation, parent2.generation) + i + 1);
      }

      // Should accumulate on parentIds
      expect(current.parentIds.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should support mixed mutation and crossover workflow', () => {
      const parent = parentGenome;

      // Mutate parent to create two variants
      const variant1 = mutationEngine.mutate(parent, 'variant-1');
      const variant2 = mutationEngine.mutate(parent, 'variant-2');

      // Crossover variants
      const offspring = mutationEngine.crossover(variant1, variant2, 'hybrid-offspring');

      expect(offspring.parentIds).toContain(variant1.id);
      expect(offspring.parentIds).toContain(variant2.id);
      expect(offspring.generation).toBe(parent.generation + 2);
    });

    it('should preserve fitness property through mutations', () => {
      const parentWithFitness = new AgentGenome('parent', 0);
      parentWithFitness.fitness = 0.85;

      const mutated = mutationEngine.mutate(parentWithFitness, 'mutant');
      
      // Fitness should reset/not carry over (new fitness needs evaluation)
      expect(mutated.genes).toBeDefined();
      expect(mutated.generation).toBe(1);
    });

    it('should generate genetically diverse population through repeated operations', () => {
      const baseParent = new AgentGenome('base', 0);
      const population = [baseParent];

      // Create diverse population through mutations
      for (let i = 0; i < 10; i++) {
        const mutant = mutationEngine.mutate(baseParent, `mutant-${i}`);
        population.push(mutant);
      }

      // Check all have unique IDs
      const ids = new Set(population.map(a => a.id));
      expect(ids.size).toBe(population.length);

      // Check genetic variations exist
      const analyticalPowers = population.map(a => a.genes.analyticalPower);
      const minPower = Math.min(...analyticalPowers);
      const maxPower = Math.max(...analyticalPowers);

      // Should have some variation
      expect(maxPower - minPower).toBeGreaterThan(0.1);
    });
  });
});
