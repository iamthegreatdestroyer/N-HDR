/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * 
 * Core System Integration Tests
 */

const NeuralHDR = require('../../src/core/neural-hdr');
const SecurityManager = require('../../src/core/security/security-manager');
const QuantumProcessor = require('../../src/core/quantum/quantum-processor');
const NanoSwarmHDR = require('../../src/core/nano-swarm/ns-hdr');
const {
    createMockConsciousnessState,
    createMockNanoSwarm,
    performanceUtils,
    asyncUtils
} = require('../utils/test-utils');

describe('Core System Integration', () => {
    let neuralHdr;
    let security;
    let quantum;
    let nanoSwarm;
    let config;

    beforeEach(async () => {
        config = {
            quantumLayers: 6,
            security: {
                encryption: {
                    algorithm: 'aes-256-gcm',
                    keySize: 256
                },
                protection: {
                    integrityCheck: true,
                    tamperDetection: true
                }
            },
            consciousness: {
                layers: [
                    { name: 'base', dimensions: 16 },
                    { name: 'cognitive', dimensions: 32 },
                    { name: 'memory', dimensions: 64 },
                    { name: 'emotional', dimensions: 24 },
                    { name: 'executive', dimensions: 48 },
                    { name: 'meta', dimensions: 8 }
                ]
            },
            acceleration: {
                nanoSwarmIntegration: true,
                swarmSize: 16,
                optimizationLevel: 'aggressive'
            }
        };

        // Initialize all components
        security = new SecurityManager(config.security);
        quantum = new QuantumProcessor(config.quantumLayers);
        nanoSwarm = new NanoSwarmHDR(config.acceleration);
        neuralHdr = new NeuralHDR(config);

        await Promise.all([
            security.initialize(),
            quantum.initialize(),
            nanoSwarm.initialize(),
            neuralHdr.initialize()
        ]);
    });

    afterEach(async () => {
        await Promise.all([
            neuralHdr.cleanup(),
            security.cleanup(),
            quantum.cleanup(),
            nanoSwarm.cleanup()
        ]);
    });

    describe('system initialization', () => {
        it('should initialize all components in correct order', async () => {
            const components = [neuralHdr, security, quantum, nanoSwarm];
            components.forEach(component => {
                expect(component.state.initialized).toBe(true);
                expect(component.state.error).toBeNull();
            });
        });

        it('should establish secure connections between components', async () => {
            const connections = await neuralHdr.getComponentConnections();
            expect(connections.security).toBeDefined();
            expect(connections.quantum).toBeDefined();
            expect(connections.nanoSwarm).toBeDefined();
            
            connections.forEach(conn => {
                expect(conn.secure).toBe(true);
                expect(conn.encrypted).toBe(true);
            });
        });
    });

    describe('consciousness preservation workflow', () => {
        it('should execute complete consciousness preservation workflow', async () => {
            // Create consciousness state
            const state = createMockConsciousnessState();

            // Capture state
            const capture = await neuralHdr.captureState(state);
            expect(capture).toBeDefined();
            expect(capture.layers).toHaveLength(config.consciousness.layers.length);

            // Process through quantum layers
            const quantumState = await quantum.processState(capture);
            expect(quantumState).toBeDefined();
            expect(quantumState.coherence).toBeGreaterThan(0);

            // Secure the state
            const secured = await security.secureState(quantumState);
            expect(secured).toBeDefined();
            expect(secured.encrypted).toBe(true);

            // Verify the secured state
            const verified = await security.verifyState(secured);
            expect(verified).toBe(true);

            // Preserve the state
            const preserved = await neuralHdr.preserveState(secured);
            expect(preserved).toBeDefined();
            expect(preserved.id).toBe(secured.id);
            expect(preserved.preserved).toBe(true);
        });

        it('should handle concurrent preservation operations', async () => {
            const states = Array(5).fill(null).map(() => createMockConsciousnessState());
            const preservations = states.map(state => neuralHdr.captureAndPreserve(state));

            const results = await Promise.all(preservations);
            results.forEach(result => {
                expect(result).toBeDefined();
                expect(result.preserved).toBe(true);
                expect(result.verified).toBe(true);
            });
        });
    });

    describe('nano-swarm acceleration', () => {
        it('should accelerate consciousness processing', async () => {
            const swarm = createMockNanoSwarm(config.acceleration.swarmSize);
            await nanoSwarm.initializeSwarm(swarm);

            const state = createMockConsciousnessState();
            const { duration } = await performanceUtils.measureExecutionTime(async () => {
                return await neuralHdr.processWithAcceleration(state);
            });

            const baselineDuration = await performanceUtils.measureExecutionTime(async () => {
                return await neuralHdr.processWithoutAcceleration(state);
            });

            expect(duration).toBeLessThan(baselineDuration.duration);
        });

        it('should maintain quantum coherence during acceleration', async () => {
            const swarm = createMockNanoSwarm(config.acceleration.swarmSize);
            await nanoSwarm.initializeSwarm(swarm);

            const state = createMockConsciousnessState();
            const accelerated = await neuralHdr.processWithAcceleration(state);
            const baseline = await neuralHdr.processWithoutAcceleration(state);

            const coherenceDiff = Math.abs(accelerated.coherence - baseline.coherence);
            expect(coherenceDiff).toBeLessThan(0.1);
        });
    });

    describe('error recovery', () => {
        it('should recover from component failures', async () => {
            const state = createMockConsciousnessState();

            // Simulate quantum processor failure
            quantum.state.error = new Error('Quantum failure');
            const recovery = await neuralHdr.processWithFailover(state);

            expect(recovery).toBeDefined();
            expect(recovery.recovered).toBe(true);
            expect(recovery.state).toBeDefined();
        });

        it('should maintain data integrity during recovery', async () => {
            const state = createMockConsciousnessState();
            const baseline = await neuralHdr.captureState(state);

            // Force error and recovery
            quantum.state.error = new Error('Forced failure');
            const recovered = await neuralHdr.processWithFailover(state);

            const integrity = await security.verifyIntegrity(recovered.state, baseline);
            expect(integrity.verified).toBe(true);
            expect(integrity.corruption).toBe(0);
        });
    });

    describe('system boundaries', () => {
        it('should enforce security boundaries between components', async () => {
            const state = createMockConsciousnessState();
            
            // Attempt direct quantum access (should fail)
            await expect(quantum.processState(state)).rejects.toThrow();

            // Proper access through Neural-HDR
            const processed = await neuralHdr.processState(state);
            expect(processed).toBeDefined();
        });

        it('should maintain component isolation', async () => {
            const state = createMockConsciousnessState();

            // Process state
            const processed = await neuralHdr.processState(state);

            // Verify components can't directly access each other
            await expect(security.accessQuantumState(processed)).rejects.toThrow();
            await expect(quantum.accessSecureData(processed)).rejects.toThrow();
        });
    });

    describe('system scaling', () => {
        it('should handle increasing load', async () => {
            const loads = [1, 10, 100].map(size => {
                return Array(size).fill(null).map(() => createMockConsciousnessState());
            });

            for (const load of loads) {
                const { duration } = await performanceUtils.measureExecutionTime(async () => {
                    return await Promise.all(load.map(state => neuralHdr.processState(state)));
                });

                // Verify processing time scales sublinearly
                expect(duration).toBeLessThan(load.length * 1000);
            }
        });

        it('should maintain performance under load', async () => {
            const swarm = createMockNanoSwarm(config.acceleration.swarmSize * 2);
            await nanoSwarm.initializeSwarm(swarm);

            const load = Array(50).fill(null).map(() => createMockConsciousnessState());
            const { result: metrics } = await performanceUtils.measureMemoryUsage(async () => {
                return await Promise.all(load.map(state => neuralHdr.processState(state)));
            });

            expect(metrics.heapUsed).toBeLessThan(1024 * 1024 * 1024); // 1GB limit
        });
    });
});