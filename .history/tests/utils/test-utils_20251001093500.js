/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * 
 * Test Utilities
 */

const tf = require('@tensorflow/tfjs');
const crypto = require('crypto');

/**
 * Generate random quantum state for testing
 * @param {number} dimensions Number of qubits
 * @returns {Float32Array} Quantum state vector
 */
function generateQuantumState(dimensions = 8) {
    const state = new Float32Array(Math.pow(2, dimensions));
    let sumSquared = 0;

    // Generate random amplitudes
    for (let i = 0; i < state.length; i++) {
        state[i] = Math.random();
        sumSquared += state[i] * state[i];
    }

    // Normalize to ensure sum of squares = 1
    const normFactor = Math.sqrt(sumSquared);
    for (let i = 0; i < state.length; i++) {
        state[i] /= normFactor;
    }

    return state;
}

/**
 * Create mock consciousness state for testing
 * @param {Object} params Custom parameters
 * @returns {Object} Mock consciousness state
 */
function createMockConsciousnessState(params = {}) {
    return {
        level: params.level || Math.random(),
        coherence: params.coherence || Math.random(),
        stability: params.stability || Math.random(),
        phase: params.phase || Math.random() * 2 * Math.PI,
        entanglement: params.entanglement || Math.random(),
        timestamp: params.timestamp || Date.now(),
        ...params
    };
}

/**
 * Generate secure test encryption key
 * @param {number} bits Key size in bits
 * @returns {Buffer} Encryption key
 */
function generateTestKey(bits = 256) {
    return crypto.randomBytes(bits / 8);
}

/**
 * Create mock NS-HDR network for testing
 * @param {number} size Number of nodes
 * @returns {Object} Mock NS-HDR network
 */
function createMockNanoSwarm(size = 16) {
    const nodes = new Map();
    for (let i = 0; i < size; i++) {
        nodes.set(`node-${i}`, {
            id: `node-${i}`,
            status: 'active',
            load: Math.random(),
            connections: new Set()
        });
    }

    // Create random connections
    nodes.forEach((node, id) => {
        const numConnections = Math.floor(Math.random() * (size - 1));
        while (node.connections.size < numConnections) {
            const targetId = `node-${Math.floor(Math.random() * size)}`;
            if (targetId !== id) {
                node.connections.add(targetId);
                nodes.get(targetId).connections.add(id);
            }
        }
    });

    return {
        nodes,
        size,
        timestamp: Date.now()
    };
}

/**
 * Mock tensor operations for testing
 */
const tensorUtils = {
    createRandomTensor: (shape) => {
        return tf.randomNormal(shape);
    },

    createZeroTensor: (shape) => {
        return tf.zeros(shape);
    },

    tensorToState: (tensor) => {
        return tensor.arraySync();
    },

    stateToTensor: (state) => {
        return tf.tensor(state);
    }
};

/**
 * Performance measurement utilities
 */
const performanceUtils = {
    measureExecutionTime: async (fn) => {
        const start = process.hrtime.bigint();
        const result = await fn();
        const end = process.hrtime.bigint();
        return {
            result,
            duration: Number(end - start) / 1e6 // Convert to milliseconds
        };
    },

    measureMemoryUsage: (fn) => {
        const initialMemory = process.memoryUsage();
        const result = fn();
        const finalMemory = process.memoryUsage();

        return {
            result,
            memoryDelta: {
                heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
                heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
                external: finalMemory.external - initialMemory.external,
                rss: finalMemory.rss - initialMemory.rss
            }
        };
    },

    measureThroughput: async (fn, duration = 1000) => {
        const start = Date.now();
        let operations = 0;
        
        while (Date.now() - start < duration) {
            await fn();
            operations++;
        }

        return operations / (duration / 1000); // Operations per second
    }
};

/**
 * Async test utilities
 */
const asyncUtils = {
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    withTimeout: (promise, ms) => {
        const timeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
        });
        return Promise.race([promise, timeout]);
    },

    retryWithBackoff: async (fn, maxRetries = 3, initialDelay = 100) => {
        let retries = 0;
        while (true) {
            try {
                return await fn();
            } catch (error) {
                if (retries >= maxRetries) throw error;
                await asyncUtils.delay(initialDelay * Math.pow(2, retries));
                retries++;
            }
        }
    }
};

module.exports = {
    generateQuantumState,
    createMockConsciousnessState,
    generateTestKey,
    createMockNanoSwarm,
    tensorUtils,
    performanceUtils,
    asyncUtils
};