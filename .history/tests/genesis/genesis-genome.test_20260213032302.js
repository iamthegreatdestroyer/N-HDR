/**
 * Genesis-HDR AgentGenome Test Suite
 * Tests for genetic trait management, phenotype computation, and genome operations
 * 
 * @group genesis
 * @fileoverview Unit tests for AgentGenome class (genome initialization, mutations, cloning)
 */

import { AgentGenome } from '../../src/genesis-hdr/genesis-core.js';

describe('AgentGenome Tests', () => {
  describe('Initialization', () => {
    test('should initialize with default genes', () => {
      const genome = new AgentGenome('test-agent-1', 0);

      expect(genome.id).toBe('test-agent-1');
      expect(genome.generation).toBe(0);
      expect(genome.genes).toBeDefined();
      expect(genome.fitness).toBeNull(); // fitness initializes to null
      expect(genome.parentIds).toEqual([]);
    });

    test('should initialize all genetic traits within valid ranges', () => {
      const genome = new AgentGenome('test-agent-2', 0);

      expect(genome.genes.riskTolerance).toBeGreaterThanOrEqual(0);
      expect(genome.genes.riskTolerance).toBeLessThanOrEqual(1);
      expect(genome.genes.analyticalPower).toBeGreaterThanOrEqual(0);
      expect(genome.genes.analyticalPower).toBeLessThanOrEqual(1);
      expect(genome.genes.creativityIndex).toBeGreaterThanOrEqual(0);
      expect(genome.genes.creativityIndex).toBeLessThanOrEqual(1);
      expect(genome.genes.learningRate).toBeGreaterThanOrEqual(0.001);
      expect(genome.genes.learningRate).toBeLessThanOrEqual(0.1);
    });

    test('should initialize with custom genes', () => {
      const customGenes = {
        analyticalPower: 0.8,
        creativityIndex: 0.5,
        personality: 'creative',
        riskTolerance: 0.3,
        learningRate: 0.05,
        memoryRetention: 0.7,
        adaptabilityScore: 0.6,
        resilience: 0.75,
      };

      const genome = new AgentGenome('test-agent-3', 1, customGenes);

      expect(genome.genes.analyticalPower).toBe(0.8);
      expect(genome.genes.creativityIndex).toBe(0.5);
      expect(genome.genes.personality).toBe('creative');
      expect(genome.genes.riskTolerance).toBe(0.3);
      expect(genome.genes.learningRate).toBe(0.05);
    });

    test('should have valid personality traits', () => {
      const personalities = ['analytical', 'creative', 'pragmatic', 'intuitive'];
      const genome = new AgentGenome('test-agent-4', 0);

      expect(personalities).toContain(genome.genes.personality);
    });

    test('should have valid domain specializations', () => {
      const validSpecializations = [
        'mathematics',
        'language',
        'vision',
        'reasoning',
        'synthesis',
      ];
      const genome = new AgentGenome('test-agent-5', 0);

      expect(validSpecializations).toContain(
        genome.genes.domainSpecialization
      );
    });

    test('should have valid problem-solving strategies', () => {
      const validStrategies = [
        'greedy',
        'exhaustive',
        'heuristic',
        'probabilistic',
        'hybrid',
      ];
      const genome = new AgentGenome('test-agent-6', 0);

      expect(validStrategies).toContain(genome.genes.problemSolvingStrategy);
    });
  });

  describe('Gene Randomization', () => {
    test('should randomize personality traits from valid set', () => {
      const genome = new AgentGenome('test-agent-7', 0);
      const validPersonalities = [
        'analytical',
        'creative',
        'pragmatic',
        'empathetic',
        'bold',
      ];

      const newPersonality = genome.randomizeGeneTrait('personality');

      expect(typeof newPersonality).toBe('string');
      expect(validPersonalities).toContain(newPersonality);
    });


    test('should randomize communication style traits', () => {
      const genome = new AgentGenome('test-agent-8', 0);
      const validStyles = [
        'verbose',
        'concise',
        'technical',
        'narrative',
        'visual',
      ];

      const newStyle = genome.randomizeGeneTrait('communicationStyle');

      expect(validStyles).toContain(newStyle);
    });

    test('should support domain-specific randomization', () => {
      const genome = new AgentGenome('test-agent-9', 0);
      
      const specializations = [
        'synthesis',
        'analysis',
        'optimization',
        'prediction',
      ];
      const newSpecialization = genome.randomizeGeneTrait(
        'domainSpecialization'
      );

      expect(specializations).toContain(newSpecialization);
    });
  });

  describe('Phenotype Computation', () => {
    test('should compute phenotype with all required fields', () => {
      const genome = new AgentGenome('test-agent-10', 2);
      genome.fitness = 0.75;

      const phenotype = genome.getPhenotype();

      expect(phenotype.id).toBe('test-agent-10');
      expect(phenotype.generation).toBe(2);
      expect(phenotype.personality).toBeDefined();
      expect(phenotype.specialization).toBeDefined();
      expect(phenotype.capabilities).toBeDefined();
      expect(phenotype.performanceProfile).toBeDefined();
      expect(phenotype.fitness).toBe(0.75);
    });

    test('should format capabilities as percentages', () => {
      const genome = new AgentGenome('test-agent-11', 0);
      genome.genes.analyticalPower = 0.85;
      genome.genes.creativityIndex = 0.65;

      const phenotype = genome.getPhenotype();

      expect(phenotype.capabilities.analytical).toBe(85);
      expect(phenotype.capabilities.creative).toBe(65);
      expect(typeof phenotype.capabilities.analytical).toBe('number');
    });

    test('should format performance profile correctly', () => {
      const genome = new AgentGenome('test-agent-12', 0);
      genome.genes.learningRate = 0.025;
      genome.genes.memoryRetention = 0.8;
      genome.genes.riskTolerance = 0.4;

      const phenotype = genome.getPhenotype();

      expect(phenotype.performanceProfile.learningRate).toBe('0.0250');
      expect(phenotype.performanceProfile.memoryRetention).toBe('80.0%');
      expect(phenotype.performanceProfile.riskTolerance).toBe('40.0%');
    });

    test('should include parent tracking in phenotype', () => {
      const genome = new AgentGenome('test-agent-13', 1);
      genome.parentIds = ['parent-1', 'parent-2'];

      const phenotype = genome.getPhenotype();

      expect(phenotype.parentIds).toEqual(['parent-1', 'parent-2']);
    });
  });

  describe('Cloning', () => {
    test('should clone genome with same genes', () => {
      const original = new AgentGenome('test-agent-14', 0);
      const originalGenes = JSON.stringify(original.genes);

      const cloned = original.clone('cloned-agent-14', 1);

      expect(cloned.id).toBe('cloned-agent-14');
      expect(cloned.generation).toBe(1);
      expect(JSON.stringify(cloned.genes)).toBe(originalGenes);
      expect(cloned.parentIds[0]).toBe('test-agent-14');
    });

    test('should create independent gene copies', () => {
      const original = new AgentGenome('test-agent-15', 0);
      const cloned = original.clone('cloned-agent-15', 1);

      // Modify the clone
      cloned.genes.analyticalPower = 1.0;

      // Original should be unchanged
      expect(original.genes.analyticalPower).not.toBe(1.0);
    });

    test('should track parent lineage', () => {
      const parent = new AgentGenome('parent-1', 0);
      const child = parent.clone('child-1', 1);
      const grandchild = child.clone('grandchild-1', 2);

      expect(child.parentIds).toContain('parent-1');
      expect(grandchild.parentIds).toContain('child-1');
      expect(grandchild.generation).toBe(2);
    });

    test('should reset fitness on clone', () => {
      const original = new AgentGenome('test-agent-16', 0);
      original.fitness = 0.9;

      const cloned = original.clone('cloned-agent-16', 1);

      // Cloned fitness should be null (reset)
      expect(cloned.fitness).toBeNull();
      expect(original.fitness).toBe(0.9);
    });

    test('should support multi-generation cloning', (done) => {
      const chain = [];
      let current = new AgentGenome('gen0', 0);
      chain.push(current);

      for (let i = 1; i < 5; i++) {
        current = current.clone(`gen${i}`, i);
        chain.push(current);
      }

      expect(chain.length).toBe(5);
      expect(chain[0].generation).toBe(0);
      expect(chain[4].generation).toBe(4);
      expect(chain[4].parentIds.length).toBeGreaterThan(0);

      done();
    });
  });

  describe('Fitness Tracking', () => {
    test('should initialize with null fitness', () => {
      const genome = new AgentGenome('test-agent-14', 0);

      expect(genome.fitness).toBeNull();
    });

    test('should update fitness value', () => {
      const genome = new AgentGenome('test-agent-18', 0);

      genome.fitness = 0.65;

      expect(genome.fitness).toBe(0.65);
    });

    test('should track task results', () => {
      const genome = new AgentGenome('test-agent-19', 0);
      genome.taskResults = {
        task1: 0.8,
        task2: 0.6,
        task3: 0.95,
      };

      expect(genome.taskResults.task1).toBe(0.8);
      expect(Object.keys(genome.taskResults).length).toBe(3);
    });

    test('should support fitness score calculation', () => {
      const genome = new AgentGenome('test-agent-20', 0);
      const fitnessComponents = [
        genome.genes.analyticalPower * 0.25,
        genome.genes.creativityIndex * 0.15,
        genome.genes.learningRate * 20 * 0.2, // Normalize learning rate
        genome.genes.adaptabilityScore * 0.2,
        genome.genes.resilience * 0.2,
      ];
      const expectedFitness = fitnessComponents.reduce((a, b) => a + b, 0);

      expect(expectedFitness).toBeGreaterThanOrEqual(0);
      expect(expectedFitness).toBeLessThanOrEqual(1.5);
    });
  });

  describe('Gene Trait Management', () => {
    test('should support communication style variations', () => {
      const genome = new AgentGenome('test-agent-21', 0);
      const styles = [
        'technical',
        'narrative',
        'visual',
        'socratic',
      ];

      expect(styles).toContain(genome.genes.communicationStyle);
    });

    test('should have valid collaborative tendency', () => {
      const genome = new AgentGenome('test-agent-22', 0);

      expect(genome.genes.collaborativeTendency).toBeGreaterThanOrEqual(0);
      expect(genome.genes.collaborativeTendency).toBeLessThanOrEqual(1);
    });

    test('should compute analytical power trait', () => {
      const genome = new AgentGenome('test-agent-23', 0);

      expect(genome.genes.analyticalPower).toBeDefined();
      expect(typeof genome.genes.analyticalPower).toBe('number');
    });

    test('should compute creativity index trait', () => {
      const genome = new AgentGenome('test-agent-24', 0);

      expect(genome.genes.creativityIndex).toBeDefined();
      expect(typeof genome.genes.creativityIndex).toBe('number');
    });

    test('should track learning rate within biological bounds', () => {
      const genome = new AgentGenome('test-agent-25', 0);

      expect(genome.genes.learningRate).toBeGreaterThanOrEqual(0.001);
      expect(genome.genes.learningRate).toBeLessThanOrEqual(0.1);
    });

    test('should track memory retention trait', () => {
      const genome = new AgentGenome('test-agent-26', 0);

      expect(genome.genes.memoryRetention).toBeGreaterThanOrEqual(0);
      expect(genome.genes.memoryRetention).toBeLessThanOrEqual(1);
    });

    test('should support adaptability scoring', () => {
      const genome = new AgentGenome('test-agent-27', 0);

      expect(genome.genes.adaptabilityScore).toBeGreaterThanOrEqual(0);
      expect(genome.genes.adaptabilityScore).toBeLessThanOrEqual(1);
    });

    test('should track resilience trait', () => {
      const genome = new AgentGenome('test-agent-28', 0);

      expect(genome.genes.resilience).toBeGreaterThanOrEqual(0);
      expect(genome.genes.resilience).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty parent IDs', () => {
      const genome = new AgentGenome('test-agent-29', 0);

      expect(genome.parentIds).toEqual([]);
      expect(Array.isArray(genome.parentIds)).toBe(true);
    });

    test('should handle generation 0 correctly', () => {
      const genome = new AgentGenome('test-agent-30', 0);

      expect(genome.generation).toBe(0);
      const phenotype = genome.getPhenotype();
      expect(phenotype.generation).toBe(0);
    });

    test('should support high generation numbers', () => {
      const genome = new AgentGenome('test-agent-31', 1000);

      expect(genome.generation).toBe(1000);
      const phenotype = genome.getPhenotype();
      expect(phenotype.generation).toBe(1000);
    });

    test('should handle genome IDs with special characters', () => {
      const specialId = 'agent-2025-02-13-abc123_test';
      const genome = new AgentGenome(specialId, 0);

      expect(genome.id).toBe(specialId);
    });

    test('should preserve all genes through clone chain', () => {
      const original = new AgentGenome('test-agent-32', 0);
      const originalGenes = { ...original.genes };

      let current = original;
      for (let i = 0; i < 10; i++) {
        current = current.clone(`agent-gen${i}`, i + 1);
      }

      // Check that original genes structure is preserved
      expect(Object.keys(current.genes).length).toBe(
        Object.keys(originalGenes).length
      );
    });
  });
});
