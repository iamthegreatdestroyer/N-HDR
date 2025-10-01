/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * 
 * Performance Test Setup
 */

const tf = require('@tensorflow/tfjs');
const { performanceUtils } = require('../utils/test-utils');

// Configure test environment
beforeAll(async () => {
    // Initialize TensorFlow.js with optimized backend
    await tf.setBackend('cpu');
    await tf.ready();

    // Set up performance monitoring
    global.performance = {
        measure: performanceUtils.measureExecutionTime,
        memory: performanceUtils.measureMemoryUsage,
        throughput: performanceUtils.measureThroughput
    };

    // Set up custom test assertions
    expect.extend({
        toMeetPerformanceThreshold(received, { metric, threshold }) {
            const pass = received <= threshold;
            return {
                pass,
                message: () => pass
                    ? `Expected ${received} not to be below threshold ${threshold} for ${metric}`
                    : `Expected ${received} to be below threshold ${threshold} for ${metric}`
            };
        }
    });
});

// Clean up after all tests
afterAll(async () => {
    await tf.disposeVariables();
});

// Set up test context for each test
beforeEach(() => {
    // Reset performance metrics
    if (global.gc) global.gc();
});