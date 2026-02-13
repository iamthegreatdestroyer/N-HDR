/**
 * Phase 10 Integration Tests: D-HDR & Agent Card Schema
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * 
 * Tests for diffusion models & agent metadata validation
 */

const {
  DiffusionHDR,
  ConsequenceGenerativeModel,
  ConsequenceEmbedding,
  DiffusionScheduler
} = require('../src/d-hdr/diffusion-core');

const {
  AgentCardValidator,
  AgentCardFactory,
  AGENT_CARD_SCHEMA
} = require('../src/agent-card/schema');

describe('Phase 10.3: D-HDR - Diffusion-Based Consequence Generation', () => {
  let diffusionHDR;
  let model;

  beforeEach(() => {
    diffusionHDR = new DiffusionHDR({
      timesteps: 30,
      scheduleType: 'cosine',
      guidanceScale: 7.5,
    });

    model = new ConsequenceGenerativeModel({
      timesteps: 30,
      scheduleType: 'cosine',
    });
  });

  describe('ConsequenceEmbedding - Vector Representation', () => {
    test('creates embedding from outcome', () => {
      const outcome = {
        action: 'deploy_service',
        economicImpact: 0.8,
        socialImpact: 0.5,
        environmentalImpact: -0.2,
        temporalImpact: 0.3,
        confidence: 0.9,
        metadata: { actors: ['team-a'] }
      };

      const embedding = new ConsequenceEmbedding(outcome, 768);

      expect(embedding.action).toBe('deploy_service');
      expect(embedding.confidence).toBe(0.9);
      expect(embedding.vector.length).toBe(768);
      expect(embedding.impactComponents.economic).toBe(0.8);
    });

    test('computes weighted impact distribution', () => {
      const outcome = {
        action: 'policy_change',
        economicImpact: 0.8,
        socialImpact: 0.6,
        environmentalImpact: 0.0,
        temporalImpact: 0.2,
        confidence: 0.8,
      };

      const emb = new ConsequenceEmbedding(outcome, 256);

      expect(emb.weights).toBeDefined();
      expect(emb.weights.economic).toBeGreaterThan(0);
      expect(emb.weights.social).toBeGreaterThan(0);
    });

    test('calculates cosine similarity between embeddings', () => {
      const outcome1 = {
        action: 'action_a',
        economicImpact: 0.8,
        socialImpact: 0.5,
        environmentalImpact: 0.2,
        temporalImpact: 0.3,
        confidence: 0.9,
      };

      const outcome2 = {
        action: 'action_a',
        economicImpact: 0.8,
        socialImpact: 0.5,
        environmentalImpact: 0.2,
        temporalImpact: 0.3,
        confidence: 0.9,
      };

      const emb1 = new ConsequenceEmbedding(outcome1, 256);
      const emb2 = new ConsequenceEmbedding(outcome2, 256);

      const similarity = emb1.cosineSimilarity(emb2);

      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
      expect(similarity).toBeCloseTo(1, 0); // Same outcomes = high similarity
    });

    test('performs linear interpolation in embedding space', () => {
      const outcome1 = {
        action: 'outcome1',
        economicImpact: 1.0,
        socialImpact: 0.0,
        environmentalImpact: 0.0,
        temporalImpact: 0.0,
        confidence: 0.9,
      };

      const outcome2 = {
        action: 'outcome2',
        economicImpact: 0.0,
        socialImpact: 1.0,
        environmentalImpact: 0.0,
        temporalImpact: 0.0,
        confidence: 0.9,
      };

      const emb1 = new ConsequenceEmbedding(outcome1, 256);
      const emb2 = new ConsequenceEmbedding(outcome2, 256);

      const blended = emb1.lerp(emb2, 0.5);

      expect(blended.length).toBe(256);
      // Interpolated point should be closer to both endpoints
    });
  });

  describe('DiffusionScheduler - Noise Schedule', () => {
    test('builds linear noise schedule', () => {
      const scheduler = new DiffusionScheduler(100, 'linear');

      expect(scheduler.alphas.length).toBe(100);
      expect(scheduler.getAlpha(0)).toBeCloseTo(1.0, 2);
      expect(scheduler.getAlpha(99)).toBeCloseTo(0.01, 2);
    });

    test('builds cosine noise schedule', () => {
      const scheduler = new DiffusionScheduler(100, 'cosine');

      expect(scheduler.alphas[0]).toBeGreaterThan(0.9);
      expect(scheduler.alphas[99]).toBeLessThan(0.1);
    });

    test('computes noise level at timestep', () => {
      const scheduler = new DiffusionScheduler(50, 'linear');

      const noise0 = scheduler.getNoiseLevel(0);
      const noise25 = scheduler.getNoiseLevel(25);
      const noise49 = scheduler.getNoiseLevel(49);

      expect(noise0).toBeLessThan(noise25);
      expect(noise25).toBeLessThan(noise49);
    });
  });

  describe('ConsequenceGenerativeModel - Diffusion Generation', () => {
    test('generates consequence by diffusion', () => {
      const consequence = model.generate('launch_product', {
        economicTarget: 0.8,
        socialTarget: 0.6,
      }, 1.0);

      expect(consequence.decision).toBe('launch_product');
      expect(consequence.generation_method).toBe('diffusion');
      expect(consequence.predicted_outcome).toBeDefined();
      expect(consequence.diffusion_trace).toBeDefined();
      expect(consequence.diffusion_trace.length).toBeGreaterThan(0);
    });

    test('interpolates between two consequences', () => {
      const cons1 = model.generate('action1', {}, 1.0);
      const cons2 = model.generate('action2', {}, 1.0);

      const interpolation = model.interpolate(cons1, cons2, 3);

      expect(interpolation.from).toBe('action1');
      expect(interpolation.to).toBe('action2');
      expect(interpolation.interpolation_steps.length).toBe(4); // steps + 1
    });

    test('generates ensemble of outcome variants', () => {
      const ensemble = model.generateEnsemble('decision', {}, 3);

      expect(ensemble.decision).toBe('decision');
      expect(ensemble.ensemble.length).toBe(3);
      expect(ensemble.average_similarity).toBeGreaterThanOrEqual(0);
      expect(ensemble.average_similarity).toBeLessThanOrEqual(1);
    });

    test('stores consequences in memory', () => {
      model.generate('action1', {}, 1.0);
      model.generate('action2', {}, 1.0);

      const stats = model.getMemoryStats();

      expect(stats.stored_consequences).toBe(2);
      expect(stats.max_memory_size).toBe(1000);
    });

    test('enforces memory size limit with FIFO eviction', () => {
      const smallModel = new ConsequenceGenerativeModel({ maxMemorySize: 5 });

      for (let i = 0; i < 10; i++) {
        smallModel.generate(`action_${i}`, {}, 1.0);
      }

      const stats = smallModel.getMemoryStats();
      expect(stats.stored_consequences).toBeLessThanOrEqual(5);
    });
  });

  describe('DiffusionHDR - System Integration', () => {
    test('initializes with configuration', () => {
      expect(diffusionHDR.config.timesteps).toBe(30);
      expect(diffusionHDR.config.guidanceScale).toBe(7.5);
      expect(diffusionHDR.generatedConsequences).toBe(0);
    });

    test('predicts outcome with optional ORACLE guidance', () => {
      const consequence = diffusionHDR.predictOutcome('feature_launch', {
        actors: ['team-a', 'team-b'],
        resources: ['budget', 'time']
      });

      expect(consequence.decision).toBe('feature_launch');
      expect(consequence.predicted_outcome).toBeDefined();
      expect(diffusionHDR.generatedConsequences).toBe(1);
    });

    test('explores decision space with ensemble', () => {
      const ensemble = diffusionHDR.exploreDecisionSpace('major_change', {}, 3);

      expect(ensemble.ensemble.length).toBe(3);
      expect(ensemble.average_similarity).toBeGreaterThanOrEqual(0);
      expect(diffusionHDR.ensemblesGenerated).toBe(1);
    });

    test('computes transition paths between outcomes', () => {
      const outcome1 = diffusionHDR.predictOutcome('decision_a', {});
      const outcome2 = diffusionHDR.predictOutcome('decision_b', {});

      const transition = diffusionHDR.transitionPath(
        'decision_a',
        'decision_b',
        outcome1,
        outcome2,
        3
      );

      expect(transition.from).toBe('decision_a');
      expect(transition.to).toBe('decision_b');
      expect(transition.interpolation_steps).toBeDefined();
    });

    test('provides system metrics', () => {
      diffusionHDR.predictOutcome('action1', {});
      diffusionHDR.exploreDecisionSpace('action2', {}, 2);

      const metrics = diffusionHDR.getMetrics();

      expect(metrics.generatedConsequences).toBe(1);
      expect(metrics.ensemblesGenerated).toBe(1);
      expect(metrics.memoryStats).toBeDefined();
    });

    test('emits consequence:generated event', (done) => {
      diffusionHDR.on('consequence:generated', (data) => {
        expect(data.decision).toBe('test_action');
        expect(data.timestamp).toBeDefined();
        done();
      });

      diffusionHDR.predictOutcome('test_action', {});
    });

    test('emits ensemble:generated event', (done) => {
      diffusionHDR.on('ensemble:generated', (data) => {
        expect(data.decision).toBe('ensemble_action');
        done();
      });

      diffusionHDR.exploreDecisionSpace('ensemble_action', {}, 2);
    });
  });
});

describe('Phase 10.4: Agent Card Schema - Capability Publishing', () => {
  let validator;

  beforeEach(() => {
    validator = new AgentCardValidator();
  });

  describe('AgentCardValidator', () => {
    test('validates correct agent card', () => {
      const card = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'test-agent',
        version: '1.0.0',
        specialization: 'evolutionary',
        mcp_server: {
          endpoint: 'stdio://genesis',
          protocol: 'stdio'
        },
        registered_at: new Date().toISOString(),
        capabilities: [
          {
            name: 'breed_agents',
            mcp_tool: 'genesis.breed'
          }
        ]
      };

      const result = validator.validateCard(card);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.card).toBeDefined();
    });

    test('rejects invalid UUID', () => {
      const card = {
        id: 'invalid-id',
        name: 'agent',
        version: '1.0.0',
        specialization: 'evolutionary',
        mcp_server: {
          endpoint: 'stdio',
          protocol: 'stdio'
        },
        registered_at: new Date().toISOString(),
        capabilities: []
      };

      const result = validator.validateCard(card);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('rejects invalid specialization', () => {
      const card = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'agent',
        version: '1.0.0',
        specialization: 'invalid_spec',
        mcp_server: {
          endpoint: 'stdio',
          protocol: 'stdio'
        },
        registered_at: new Date().toISOString(),
        capabilities: []
      };

      const result = validator.validateCard(card);

      expect(result.valid).toBe(false);
    });

    test('registers valid card', () => {
      const card = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'oracle-agent',
        version: '10.0.0',
        specialization: 'predictive',
        mcp_server: {
          endpoint: 'stdio://oracle',
          protocol: 'stdio'
        },
        registered_at: new Date().toISOString(),
        capabilities: [
          {
            name: 'predict',
            mcp_tool: 'oracle.predict'
          }
        ]
      };

      const registered = validator.registerCard(card);

      expect(registered.id).toBe(card.id);
      expect(registered.status).toBe('active');
      expect(registered.registered_at).toBeDefined();
    });

    test('retrieves registered card', () => {
      const card = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'agent',
        version: '1.0.0',
        specialization: 'evolutionary',
        mcp_server: {
          endpoint: 'stdio',
          protocol: 'stdio'
        },
        registered_at: new Date().toISOString(),
        capabilities: []
      };

      validator.registerCard(card);
      const retrieved = validator.getCard(card.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe('agent');
    });

    test('searches cards by criteria', () => {
      const card1 = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'genesis-1',
        version: '1.0.0',
        specialization: 'evolutionary',
        tags: ['evolution', 'breeding'],
        mcp_server: {
          endpoint: 'stdio',
          protocol: 'stdio'
        },
        registered_at: new Date().toISOString(),
        capabilities: []
      };

      const card2 = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'oracle-1',
        version: '1.0.0',
        specialization: 'predictive',
        tags: ['prediction'],
        mcp_server: {
          endpoint: 'stdio',
          protocol: 'stdio'
        },
        registered_at: new Date().toISOString(),
        capabilities: []
      };

      validator.registerCard(card1);
      validator.registerCard(card2);

      const results = validator.searchCards({ specialization: 'evolutionary' });

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('genesis-1');
    });

    test('gets statistics about cards', () => {
      const card = {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'agent',
        version: '1.0.0',
        specialization: 'evolutionary',
        genetic_lineage: {
          fitness_score: 85
        },
        trust_score: 75,
        mcp_server: {
          endpoint: 'stdio',
          protocol: 'stdio'
        },
        registered_at: new Date().toISOString(),
        capabilities: []
      };

      validator.registerCard(card);

      const stats = validator.getStatistics();

      expect(stats.total_cards).toBe(1);
      expect(stats.specializations.evolutionary).toBe(1);
      expect(stats.active_cards).toBe(1);
      expect(stats.average_fitness).toBeDefined();
    });
  });

  describe('AgentCardFactory', () => {
    test('creates GENESIS agent card', () => {
      const agent = {
        id: 'genesis-agent-1',
        generation: 5,
        fitnessScore: 0.87,
        parents: ['parent-1', 'parent-2'],
        mutations: { analyticalPower: { from_value: 0.5, to_value: 0.7 } }
      };

      const card = AgentCardFactory.createGenesisCard(agent, 'stdio://genesis');

      expect(card.specialization).toBe('evolutionary');
      expect(card.genetic_lineage.generation).toBe(5);
      expect(card.genetic_lineage.parent_ids.length).toBe(2);
      expect(card.source_system).toBe('genesis-hdr');
    });

    test('creates ORACLE agent card', () => {
      const predictions = {};

      const card = AgentCardFactory.createOracleCard(predictions, 'stdio://oracle');

      expect(card.specialization).toBe('predictive');
      expect(card.capabilities.length).toBeGreaterThan(0);
      expect(card.source_system).toBe('oracle-hdr');
    });

    test('validates factory-created cards', () => {
      const agent = {
        id: 'genesis-test',
        generation: 1,
        fitnessScore: 0.5
      };

      const card = AgentCardFactory.createGenesisCard(agent, 'stdio://genesis');
      const result = validator.validateCard(card);

      expect(result.valid).toBeTruthy();
    });
  });
});
