/**
 * Genesis-HDR FitnessEvaluator Test Suite
 * Tests for task registration, agent evaluation, and fitness scoring
 * 
 * @group genesis
 * @fileoverview Unit tests for FitnessEvaluator class
 */

import { FitnessEvaluator, AgentGenome } from '../../src/genesis-hdr/genesis-core.js';

// Helper function to create mockable task functions
const createMockTask = (returnValue = 0.5) => {
  const fn = async () => returnValue;
  fn.calls = [];
  fn.mockResolvedValue = (val) => {
    fn.returnValue = val;
    return fn;
  };
  return fn;
};

describe('FitnessEvaluator Tests', () => {
  describe('Initialization', () => {
    test('should initialize with empty task registry', () => {
      const evaluator = new FitnessEvaluator();

      expect(evaluator.taskRegistry).toBeDefined();
      expect(evaluator.taskRegistry instanceof Map).toBe(true);
      expect(evaluator.taskRegistry.size).toBe(0);
    });

    test('should initialize with empty metrics history', () => {
      const evaluator = new FitnessEvaluator();

      expect(evaluator.metricsHistory).toBeDefined();
      expect(Array.isArray(evaluator.metricsHistory)).toBe(true);
      expect(evaluator.metricsHistory.length).toBe(0);
    });
  });

  describe('Task Registration', () => {
    test('should register a task with default weight', () => {
      const evaluator = new FitnessEvaluator();
      const mockTask = async () => 0.8;

      evaluator.registerTask('problem-solving', mockTask);

      expect(evaluator.taskRegistry.has('problem-solving')).toBe(true);
      expect(evaluator.taskRegistry.get('problem-solving')).toBeDefined();
    });

    test('should register a task with custom weight', () => {
      const evaluator = new FitnessEvaluator();
      const mockTask = async () => 0.75;

      evaluator.registerTask('learning', mockTask, 2.5);

      const taskDef = evaluator.taskRegistry.get('learning');
      expect(taskDef.weight).toBe(2.5);
    });

    test('should support multiple task registration', () => {
      const evaluator = new FitnessEvaluator();
      const task1 = async () => 0.8;
      const task2 = async () => 0.7;
      const task3 = async () => 0.9;

      evaluator.registerTask('task1', task1);
      evaluator.registerTask('task2', task2);
      evaluator.registerTask('task3', task3);

      expect(evaluator.taskRegistry.size).toBe(3);
    });

    test('should allow task weight override', () => {
      const evaluator = new FitnessEvaluator();
      const task = async () => 0.8;

      evaluator.registerTask('adaptive', task, 1.0);
      expect(evaluator.taskRegistry.get('adaptive').weight).toBe(1.0);

      // Re-register with different weight
      evaluator.registerTask('adaptive', task, 3.0);
      expect(evaluator.taskRegistry.get('adaptive').weight).toBe(3.0);
    });
  });

  describe('Agent Evaluation', () => {
    test('should evaluate agent with single task', async () => {
      const evaluator = new FitnessEvaluator();
      const mockTask = async () => 0.85;
      evaluator.registerTask('analysis', mockTask);

      const agent = new AgentGenome('test-agent-1', 0);
      const fitness = await evaluator.evaluateAgent(agent);

      expect(fitness).toBe(0.85);
      expect(agent.fitness).toBe(0.85);
      expect(agent.taskResults).toBeDefined();
      expect(agent.taskResults.analysis).toBe(0.85);
    });

    test('should evaluate agent with multiple weighted tasks', async () => {
      const evaluator = new FitnessEvaluator();

      // Task 1: score 0.8, weight 1.0
      evaluator.registerTask('task1', jest.fn().mockResolvedValue(0.8), 1.0);
      // Task 2: score 0.6, weight 2.0
      evaluator.registerTask('task2', jest.fn().mockResolvedValue(0.6), 2.0);

      const agent = new AgentGenome('test-agent-2', 0);
      const fitness = await evaluator.evaluateAgent(agent);

      // Expected: (0.8 * 1.0 + 0.6 * 2.0) / (1.0 + 2.0) = 2.0 / 3.0 ≈ 0.667
      expect(fitness).toBeCloseTo(0.667, 2);
      expect(agent.fitness).toBeCloseTo(0.667, 2);
    });

    test('should normalize scores to [0, 1] range', async () => {
      const evaluator = new FitnessEvaluator();

      // Task that returns value > 1
      evaluator.registerTask('exceeding', jest.fn().mockResolvedValue(1.5));

      const agent = new AgentGenome('test-agent-3', 0);
      const fitness = await evaluator.evaluateAgent(agent);

      expect(fitness).toBeLessThanOrEqual(1.0);
      expect(agent.taskResults.exceeding).toBe(1.0);
    });

    test('should clamp negative scores to 0', async () => {
      const evaluator = new FitnessEvaluator();

      // Task that returns negative value
      evaluator.registerTask('failing', jest.fn().mockResolvedValue(-0.5));

      const agent = new AgentGenome('test-agent-4', 0);
      const fitness = await evaluator.evaluateAgent(agent);

      expect(fitness).toBeGreaterThanOrEqual(0);
      expect(agent.taskResults.failing).toBe(0);
    });

    test('should handle task execution errors gracefully', async () => {
      const evaluator = new FitnessEvaluator();

      const failingTask = jest
        .fn()
        .mockRejectedValue(new Error('Task failed'));
      evaluator.registerTask('failing', failingTask);

      const agent = new AgentGenome('test-agent-5', 0);
      const fitness = await evaluator.evaluateAgent(agent);

      expect(agent.taskResults.failing).toBe(0);
      expect(fitness).toBe(0);
    });

    test('should pass agent genes to task function', async () => {
      const evaluator = new FitnessEvaluator();
      const mockTask = jest.fn().mockResolvedValue(0.9);

      evaluator.registerTask('genetic-aware', mockTask);

      const agent = new AgentGenome('test-agent-6', 0);
      await evaluator.evaluateAgent(agent);

      expect(mockTask).toHaveBeenCalledWith(agent.genes, agent.id);
    });

    test('should support parallel task evaluation', async () => {
      const evaluator = new FitnessEvaluator();
      const task1 = jest.fn().mockResolvedValue(0.8);
      const task2 = jest.fn().mockResolvedValue(0.7);
      const task3 = jest.fn().mockResolvedValue(0.9);

      evaluator.registerTask('task1', task1);
      evaluator.registerTask('task2', task2);
      evaluator.registerTask('task3', task3);

      const agent = new AgentGenome('test-agent-7', 0);
      const fitness = await evaluator.evaluateAgent(agent);

      const expected = (0.8 + 0.7 + 0.9) / 3;
      expect(fitness).toBeCloseTo(expected, 2);
      expect(agent.taskResults.task1).toBe(0.8);
      expect(agent.taskResults.task2).toBe(0.7);
      expect(agent.taskResults.task3).toBe(0.9);
    });
  });

  describe('Fitness Scores', () => {
    test('should compute weighted average fitness correctly', async () => {
      const evaluator = new FitnessEvaluator();

      // Tasks: 0.5 (w=1), 0.7 (w=2), 0.9 (w=1)
      // Expected: (0.5*1 + 0.7*2 + 0.9*1) / (1+2+1) = 3.3 / 4 = 0.825
      evaluator.registerTask('t1', jest.fn().mockResolvedValue(0.5), 1.0);
      evaluator.registerTask('t2', jest.fn().mockResolvedValue(0.7), 2.0);
      evaluator.registerTask('t3', jest.fn().mockResolvedValue(0.9), 1.0);

      const agent = new AgentGenome('test-agent-8', 0);
      const fitness = await evaluator.evaluateAgent(agent);

      expect(fitness).toBeCloseTo(0.825, 2);
    });

    test('should handle zero total weight gracefully', async () => {
      const evaluator = new FitnessEvaluator();

      // This shouldn't happen in practice, but let's be safe
      const agent = new AgentGenome('test-agent-9', 0);
      const fitness = await evaluator.evaluateAgent(agent);

      expect(fitness).toBe(0);
    });

    test('should track task results for analysis', async () => {
      const evaluator = new FitnessEvaluator();
      evaluator.registerTask('reasoning', jest.fn().mockResolvedValue(0.82));
      evaluator.registerTask('creativity', jest.fn().mockResolvedValue(0.65));

      const agent = new AgentGenome('test-agent-10', 0);
      await evaluator.evaluateAgent(agent);

      expect(agent.taskResults).toEqual({
        reasoning: 0.82,
        creativity: 0.65,
      });
    });
  });

  describe('Multi-Agent Evaluation', () => {
    test('should evaluate multiple agents independently', async () => {
      const evaluator = new FitnessEvaluator();
      evaluator.registerTask('general', jest.fn().mockResolvedValue(0.75));

      const agent1 = new AgentGenome('agent-1', 0);
      const agent2 = new AgentGenome('agent-2', 0);
      const agent3 = new AgentGenome('agent-3', 0);

      const fitness1 = await evaluator.evaluateAgent(agent1);
      const fitness2 = await evaluator.evaluateAgent(agent2);
      const fitness3 = await evaluator.evaluateAgent(agent3);

      expect(fitness1).toBe(0.75);
      expect(fitness2).toBe(0.75);
      expect(fitness3).toBe(0.75);
      expect(agent1.fitness).toBe(0.75);
      expect(agent2.fitness).toBe(0.75);
      expect(agent3.fitness).toBe(0.75);
    });

    test('should evaluate genetically diverse agents differently', async () => {
      const evaluator = new FitnessEvaluator();

      // Task that rewards analytical power
      const analyticTask = jest.fn((genes) => genes.analyticalPower);
      evaluator.registerTask('analytical', analyticTask);

      const analyticalAgent = new AgentGenome('analytical-agent', 0);
      analyticalAgent.genes.analyticalPower = 0.95;

      const creativeAgent = new AgentGenome('creative-agent', 0);
      creativeAgent.genes.analyticalPower = 0.1;

      const fitness1 = await evaluator.evaluateAgent(analyticalAgent);
      const fitness2 = await evaluator.evaluateAgent(creativeAgent);

      expect(fitness1).toBeGreaterThan(fitness2);
      expect(fitness1).toBeCloseTo(0.95, 1);
      expect(fitness2).toBeCloseTo(0.1, 1);
    });
  });

  describe('Metrics History', () => {
    test('should maintain metrics history', async () => {
      const evaluator = new FitnessEvaluator();
      evaluator.registerTask('task', jest.fn().mockResolvedValue(0.8));

      const agent1 = new AgentGenome('agent-1', 0);
      const agent2 = new AgentGenome('agent-2', 0);

      await evaluator.evaluateAgent(agent1);
      await evaluator.evaluateAgent(agent2);

      expect(evaluator.metricsHistory).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should evaluate agent with no registered tasks', async () => {
      const evaluator = new FitnessEvaluator();
      const agent = new AgentGenome('test-agent-11', 0);

      const fitness = await evaluator.evaluateAgent(agent);

      expect(fitness).toBe(0);
      expect(agent.fitness).toBe(0);
    });

    test('should handle task returning exactly 0', async () => {
      const evaluator = new FitnessEvaluator();
      evaluator.registerTask('zero-task', jest.fn().mockResolvedValue(0));

      const agent = new AgentGenome('test-agent-12', 0);
      const fitness = await evaluator.evaluateAgent(agent);

      expect(fitness).toBe(0);
    });

    test('should handle task returning exactly 1', async () => {
      const evaluator = new FitnessEvaluator();
      evaluator.registerTask('perfect-task', jest.fn().mockResolvedValue(1));

      const agent = new AgentGenome('test-agent-13', 0);
      const fitness = await evaluator.evaluateAgent(agent);

      expect(fitness).toBe(1);
    });

    test('should support high-weight tasks', async () => {
      const evaluator = new FitnessEvaluator();
      evaluator.registerTask(
        'critical',
        jest.fn().mockResolvedValue(0.5),
        1000.0
      );
      evaluator.registerTask('minor', jest.fn().mockResolvedValue(1), 1.0);

      const agent = new AgentGenome('test-agent-14', 0);
      const fitness = await evaluator.evaluateAgent(agent);

      // Critical task dominates
      expect(fitness).toBeCloseTo(0.5, 1);
    });

    test('should support many registered tasks', async () => {
      const evaluator = new FitnessEvaluator();

      // Register 50 tasks
      for (let i = 0; i < 50; i++) {
        evaluator.registerTask(
          `task-${i}`,
          jest.fn().mockResolvedValue(0.5 + Math.random() * 0.5)
        );
      }

      const agent = new AgentGenome('test-agent-15', 0);
      const fitness = await evaluator.evaluateAgent(agent);

      expect(fitness).toBeGreaterThanOrEqual(0);
      expect(fitness).toBeLessThanOrEqual(1);
      expect(agent.taskResults).toBeDefined();
      expect(Object.keys(agent.taskResults).length).toBe(50);
    });
  });
});
