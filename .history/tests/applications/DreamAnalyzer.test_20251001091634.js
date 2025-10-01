/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * DreamAnalyzer.test.js
 * Unit tests for DreamAnalyzer
 */

const DreamAnalyzer = require('../../src/applications/DreamAnalyzer');
const tf = require('@tensorflow/tfjs');

describe('DreamAnalyzer', () => {
    let analyzer;

    beforeEach(async () => {
        analyzer = new DreamAnalyzer({
            patternDimensions: 32,
            dreamDepth: 8,
            correlationThreshold: 0.75
        });
        await analyzer.initialize();
    });

    afterEach(async () => {
        await analyzer.cleanup();
    });

    describe('initialization', () => {
        it('should initialize successfully', () => {
            expect(analyzer.state.initialized).toBe(true);
            expect(analyzer.state.analyzing).toBe(false);
            expect(analyzer.state.error).toBeNull();
        });

        it('should set up initial pattern banks', () => {
            expect(analyzer.patterns.size).toBeGreaterThan(0);
            expect(analyzer.patterns.has('archetypal')).toBe(true);
            expect(analyzer.patterns.has('personal')).toBe(true);
        });
    });

    describe('dream analysis', () => {
        it('should analyze dream state', async () => {
            const dreamState = {
                intensity: 0.8,
                lucidity: 0.6,
                emotionalCharge: 0.7,
                patterns: ['alpha', 'beta', 'gamma']
            };

            const analysis = await analyzer.analyzeDream(dreamState);
            expect(analysis).toBeDefined();
            expect(analysis.id).toMatch(/^dream-/);
            expect(analysis.patterns).toHaveLength(dreamState.patterns.length);
            expect(analysis.correlations).toBeDefined();
        });

        it('should handle invalid dream states', async () => {
            await expect(analyzer.analyzeDream(null)).rejects.toThrow();
            await expect(analyzer.analyzeDream({})).rejects.toThrow();
        });

        it('should track dream sequence', async () => {
            const dream1 = { intensity: 0.3, lucidity: 0.4 };
            const dream2 = { intensity: 0.6, lucidity: 0.7 };

            const analysis1 = await analyzer.analyzeDream(dream1);
            const analysis2 = await analyzer.analyzeDream(dream2);

            expect(analysis2.timestamp).toBeGreaterThan(analysis1.timestamp);
            expect(analyzer.sequence.length).toBe(2);
        });
    });

    describe('pattern recognition', () => {
        it('should recognize archetypal patterns', async () => {
            const dreamState = {
                intensity: 0.9,
                lucidity: 0.8,
                patterns: ['omega', 'theta']
            };

            const analysis = await analyzer.analyzeDream(dreamState);
            expect(analysis.archetypes).toBeDefined();
            expect(analysis.archetypes.length).toBeGreaterThan(0);
        });

        it('should identify new patterns', async () => {
            const uniqueDream = {
                intensity: 0.7,
                lucidity: 0.6,
                patterns: ['novel-alpha', 'novel-beta']
            };

            const initialPatterns = analyzer.patterns.size;
            await analyzer.analyzeDream(uniqueDream);
            expect(analyzer.patterns.size).toBeGreaterThan(initialPatterns);
        });
    });

    describe('correlation analysis', () => {
        it('should calculate pattern correlations', async () => {
            const dream1 = { intensity: 0.5, lucidity: 0.6, patterns: ['alpha'] };
            const dream2 = { intensity: 0.7, lucidity: 0.8, patterns: ['beta'] };

            const analysis1 = await analyzer.analyzeDream(dream1);
            const analysis2 = await analyzer.analyzeDream(dream2);

            expect(analysis2.correlations).toBeDefined();
            expect(analysis2.correlations.length).toBeGreaterThan(0);
        });

        it('should track pattern evolution', async () => {
            const dreams = [
                { intensity: 0.3, lucidity: 0.4, patterns: ['alpha'] },
                { intensity: 0.5, lucidity: 0.6, patterns: ['beta'] },
                { intensity: 0.7, lucidity: 0.8, patterns: ['gamma'] }
            ];

            for (const dream of dreams) {
                await analyzer.analyzeDream(dream);
            }

            expect(analyzer.evolution.size).toBeGreaterThan(0);
        });
    });

    describe('error handling', () => {
        it('should handle initialization errors', async () => {
            const invalidAnalyzer = new DreamAnalyzer({
                patternDimensions: -1
            });

            await expect(invalidAnalyzer.initialize()).rejects.toThrow();
        });

        it('should handle analysis errors', async () => {
            analyzer.state.initialized = false;
            await expect(analyzer.analyzeDream({})).rejects.toThrow();
        });

        it('should handle cleanup errors', async () => {
            analyzer.state.initialized = false;
            await expect(analyzer.cleanup()).resolves.not.toThrow();
        });
    });

    describe('utilities', () => {
        it('should generate valid analysis IDs', () => {
            const id = analyzer._generateAnalysisId();
            expect(id).toMatch(/^dream-\d+-[a-z0-9]+$/);
        });

        it('should retrieve pattern information', () => {
            const info = analyzer.getPatternInfo('archetypal');
            expect(info).toBeDefined();
            expect(info.features).toHaveLength(analyzer.config.patternDimensions);
        });

        it('should calculate dream similarity', async () => {
            const dream1 = { intensity: 0.5, lucidity: 0.6 };
            const dream2 = { intensity: 0.6, lucidity: 0.7 };

            const analysis1 = await analyzer.analyzeDream(dream1);
            const analysis2 = await analyzer.analyzeDream(dream2);

            const similarity = analyzer.calculateSimilarity(
                analysis1,
                analysis2
            );

            expect(similarity).toBeGreaterThanOrEqual(0);
            expect(similarity).toBeLessThanOrEqual(1);
        });
    });
});