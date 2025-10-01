/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * ConsciousnessMapper.test.js
 * Unit tests for ConsciousnessMapper
 */

const ConsciousnessMapper = require('../../src/applications/ConsciousnessMapper');
const tf = require('@tensorflow/tfjs');

describe('ConsciousnessMapper', () => {
    let mapper;

    beforeEach(async () => {
        mapper = new ConsciousnessMapper({
            mappingDimensions: 16,
            temporalWindow: 10,
            similarityThreshold: 0.85
        });
        await mapper.initialize();
    });

    afterEach(async () => {
        await mapper.cleanup();
    });

    describe('initialization', () => {
        it('should initialize successfully', () => {
            expect(mapper.state.initialized).toBe(true);
            expect(mapper.state.mapping).toBe(false);
            expect(mapper.state.error).toBeNull();
        });

        it('should set up initial clusters', () => {
            expect(mapper.clusters.size).toBeGreaterThan(0);
            expect(mapper.clusters.has('dormant')).toBe(true);
            expect(mapper.clusters.has('active')).toBe(true);
        });
    });

    describe('state mapping', () => {
        it('should map consciousness state', async () => {
            const state = {
                level: 0.8,
                coherence: 0.9,
                stability: 0.7
            };

            const mapping = await mapper.mapState(state);
            expect(mapping).toBeDefined();
            expect(mapping.id).toMatch(/^map-/);
            expect(mapping.state).toHaveLength(mapper.config.mappingDimensions);
            expect(mapping.cluster).toBeDefined();
        });

        it('should handle invalid states', async () => {
            await expect(mapper.mapState(null)).rejects.toThrow();
            await expect(mapper.mapState({})).rejects.toThrow();
        });

        it('should maintain temporal consistency', async () => {
            const state1 = { level: 0.8, coherence: 0.9 };
            const state2 = { level: 0.85, coherence: 0.95 };

            const mapping1 = await mapper.mapState(state1);
            const mapping2 = await mapper.mapState(state2);

            expect(mapping2.timestamp).toBeGreaterThan(mapping1.timestamp);
        });
    });

    describe('clustering', () => {
        it('should assign states to appropriate clusters', async () => {
            const activeState = { level: 0.9, coherence: 0.95 };
            const dormantState = { level: 0.1, coherence: 0.15 };

            const activeMapping = await mapper.mapState(activeState);
            const dormantMapping = await mapper.mapState(dormantState);

            expect(activeMapping.cluster).not.toBe(dormantMapping.cluster);
        });

        it('should create new clusters when necessary', async () => {
            const uniqueState = {
                level: 0.5,
                coherence: 0.5,
                stability: 0.5,
                phase: 0.5
            };

            const initialClusters = mapper.clusters.size;
            await mapper.mapState(uniqueState);
            expect(mapper.clusters.size).toBeGreaterThan(initialClusters);
        });
    });

    describe('transition tracking', () => {
        it('should track state transitions', async () => {
            const state1 = { level: 0.3, coherence: 0.4 };
            const state2 = { level: 0.6, coherence: 0.7 };
            const state3 = { level: 0.9, coherence: 0.8 };

            await mapper.mapState(state1);
            await mapper.mapState(state2);
            await mapper.mapState(state3);

            expect(mapper.transitions.size).toBeGreaterThan(0);
        });

        it('should calculate transition probabilities', async () => {
            const states = [
                { level: 0.2, coherence: 0.3 },
                { level: 0.4, coherence: 0.5 },
                { level: 0.6, coherence: 0.7 }
            ];

            for (const state of states) {
                await mapper.mapState(state);
            }

            for (const transition of mapper.transitions.values()) {
                expect(transition.probability).toBeGreaterThanOrEqual(0);
                expect(transition.probability).toBeLessThanOrEqual(1);
            }
        });
    });

    describe('error handling', () => {
        it('should handle initialization errors', async () => {
            const invalidMapper = new ConsciousnessMapper({
                mappingDimensions: -1
            });

            await expect(invalidMapper.initialize()).rejects.toThrow();
        });

        it('should handle mapping errors', async () => {
            mapper.state.initialized = false;
            await expect(mapper.mapState({})).rejects.toThrow();
        });

        it('should handle cleanup errors', async () => {
            mapper.state.initialized = false;
            await expect(mapper.cleanup()).resolves.not.toThrow();
        });
    });

    describe('utilities', () => {
        it('should generate valid mapping IDs', () => {
            const id = mapper._generateMappingId();
            expect(id).toMatch(/^map-\d+-[a-z0-9]+$/);
        });

        it('should retrieve cluster information', () => {
            const info = mapper.getClusterInfo('dormant');
            expect(info).toBeDefined();
            expect(info.centroid).toHaveLength(mapper.config.mappingDimensions);
        });

        it('should retrieve transition information', async () => {
            const state1 = { level: 0.3, coherence: 0.4 };
            const state2 = { level: 0.6, coherence: 0.7 };

            const mapping1 = await mapper.mapState(state1);
            const mapping2 = await mapper.mapState(state2);

            const info = mapper.getTransitionInfo(
                mapping1.cluster,
                mapping2.cluster
            );

            expect(info).toBeDefined();
        });
    });
});