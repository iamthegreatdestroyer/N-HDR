/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * QuantumOptimizer.test.js
 * Unit tests for QuantumOptimizer
 */

const QuantumOptimizer = require('../../src/applications/QuantumOptimizer');
const tf = require('@tensorflow/tfjs');

describe('QuantumOptimizer', () => {
    let optimizer;

    beforeEach(async () => {
        optimizer = new QuantumOptimizer({
            quantumDimensions: 64,
            optimizationDepth: 12,
            entropyThreshold: 0.65
        });
        await optimizer.initialize();
    });

    afterEach(async () => {
        await optimizer.cleanup();
    });

    describe('initialization', () => {
        it('should initialize successfully', () => {
            expect(optimizer.state.initialized).toBe(true);
            expect(optimizer.state.optimizing).toBe(false);
            expect(optimizer.state.error).toBeNull();
        });

        it('should set up quantum registers', () => {
            expect(optimizer.registers.size).toBeGreaterThan(0);
            expect(optimizer.registers.has('primary')).toBe(true);
            expect(optimizer.registers.has('auxiliary')).toBe(true);
        });
    });

    describe('quantum state optimization', () => {
        it('should optimize quantum state', async () => {
            const state = {
                entanglement: 0.8,
                coherence: 0.7,
                superposition: 0.9,
                qubits: [1, 0, 1, 0]
            };

            const optimization = await optimizer.optimizeState(state);
            expect(optimization).toBeDefined();
            expect(optimization.id).toMatch(/^qopt-/);
            expect(optimization.state).toHaveLength(state.qubits.length);
            expect(optimization.metrics).toBeDefined();
        });

        it('should handle invalid states', async () => {
            await expect(optimizer.optimizeState(null)).rejects.toThrow();
            await expect(optimizer.optimizeState({})).rejects.toThrow();
        });

        it('should maintain quantum coherence', async () => {
            const state1 = { entanglement: 0.7, coherence: 0.8 };
            const state2 = { entanglement: 0.75, coherence: 0.85 };

            const opt1 = await optimizer.optimizeState(state1);
            const opt2 = await optimizer.optimizeState(state2);

            expect(opt2.timestamp).toBeGreaterThan(opt1.timestamp);
            expect(opt2.metrics.coherence).toBeGreaterThanOrEqual(opt1.metrics.coherence);
        });
    });

    describe('entanglement management', () => {
        it('should manage quantum entanglement', async () => {
            const state = {
                entanglement: 0.9,
                coherence: 0.8,
                qubits: [1, 1, 0, 1]
            };

            const optimization = await optimizer.optimizeState(state);
            expect(optimization.entanglement).toBeDefined();
            expect(optimization.entanglement.pairs.length).toBeGreaterThan(0);
        });

        it('should track entanglement history', async () => {
            const states = [
                { entanglement: 0.6, coherence: 0.7 },
                { entanglement: 0.7, coherence: 0.8 },
                { entanglement: 0.8, coherence: 0.9 }
            ];

            for (const state of states) {
                await optimizer.optimizeState(state);
            }

            expect(optimizer.entanglementHistory.length).toBe(states.length);
        });
    });

    describe('quantum metrics', () => {
        it('should calculate quantum metrics', async () => {
            const state = {
                entanglement: 0.75,
                coherence: 0.85,
                qubits: [1, 0, 1, 1]
            };

            const optimization = await optimizer.optimizeState(state);
            expect(optimization.metrics.fidelity).toBeGreaterThan(0);
            expect(optimization.metrics.purity).toBeGreaterThan(0);
            expect(optimization.metrics.entropy).toBeDefined();
        });

        it('should track metric evolution', async () => {
            const states = [
                { entanglement: 0.3, coherence: 0.4 },
                { entanglement: 0.5, coherence: 0.6 },
                { entanglement: 0.7, coherence: 0.8 }
            ];

            for (const state of states) {
                await optimizer.optimizeState(state);
            }

            expect(optimizer.metricHistory.size).toBeGreaterThan(0);
        });
    });

    describe('error handling', () => {
        it('should handle initialization errors', async () => {
            const invalidOptimizer = new QuantumOptimizer({
                quantumDimensions: -1
            });

            await expect(invalidOptimizer.initialize()).rejects.toThrow();
        });

        it('should handle optimization errors', async () => {
            optimizer.state.initialized = false;
            await expect(optimizer.optimizeState({})).rejects.toThrow();
        });

        it('should handle cleanup errors', async () => {
            optimizer.state.initialized = false;
            await expect(optimizer.cleanup()).resolves.not.toThrow();
        });
    });

    describe('utilities', () => {
        it('should generate valid optimization IDs', () => {
            const id = optimizer._generateOptimizationId();
            expect(id).toMatch(/^qopt-\d+-[a-z0-9]+$/);
        });

        it('should retrieve register information', () => {
            const info = optimizer.getRegisterInfo('primary');
            expect(info).toBeDefined();
            expect(info.qubits).toHaveLength(optimizer.config.quantumDimensions);
        });

        it('should calculate quantum state fidelity', async () => {
            const state1 = {
                entanglement: 0.6,
                coherence: 0.7,
                qubits: [1, 0, 1, 0]
            };
            const state2 = {
                entanglement: 0.7,
                coherence: 0.8,
                qubits: [1, 0, 1, 1]
            };

            const opt1 = await optimizer.optimizeState(state1);
            const opt2 = await optimizer.optimizeState(state2);

            const fidelity = optimizer.calculateFidelity(opt1, opt2);
            expect(fidelity).toBeGreaterThanOrEqual(0);
            expect(fidelity).toBeLessThanOrEqual(1);
        });

        it('should manage quantum gates', () => {
            const hadamardGate = optimizer.createGate('hadamard', 0);
            expect(hadamardGate).toBeDefined();
            expect(hadamardGate.type).toBe('hadamard');
            expect(hadamardGate.target).toBe(0);

            const cnotGate = optimizer.createGate('cnot', 0, 1);
            expect(cnotGate).toBeDefined();
            expect(cnotGate.type).toBe('cnot');
            expect(cnotGate.control).toBe(0);
            expect(cnotGate.target).toBe(1);
        });
    });
});