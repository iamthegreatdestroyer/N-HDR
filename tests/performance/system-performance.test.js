/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * System Performance Tests
 */

const NeuralHDR = require("../../src/core/neural-hdr");
const NanoSwarmHDR = require("../../src/core/nano-swarm/ns-hdr");
const {
  createMockConsciousnessState,
  createMockNanoSwarm,
  performanceUtils,
} = require("../utils/test-utils");

describe("System Performance", () => {
  let neuralHdr;
  let nanoSwarm;
  let config;

  beforeEach(async () => {
    config = {
      quantumLayers: 6,
      security: {
        encryption: { algorithm: "aes-256-gcm", keySize: 256 },
        protection: { integrityCheck: true, tamperDetection: true },
      },
      consciousness: {
        layers: [
          { name: "base", dimensions: 16 },
          { name: "cognitive", dimensions: 32 },
          { name: "memory", dimensions: 64 },
          { name: "emotional", dimensions: 24 },
          { name: "executive", dimensions: 48 },
          { name: "meta", dimensions: 8 },
        ],
      },
      acceleration: {
        nanoSwarmIntegration: true,
        swarmSize: 16,
        optimizationLevel: "aggressive",
      },
    };

    nanoSwarm = new NanoSwarmHDR(config.acceleration);
    neuralHdr = new NeuralHDR(config);

    await Promise.all([nanoSwarm.initialize(), neuralHdr.initialize()]);

    // Force garbage collection before each test if available
    if (global.gc) {
      global.gc();
    }
  });

  afterEach(async () => {
    await Promise.all([neuralHdr.cleanup(), nanoSwarm.cleanup()]);
  });

  describe("throughput tests", () => {
    it("should handle high-volume state processing", async () => {
      const swarm = createMockNanoSwarm(config.acceleration.swarmSize);
      await nanoSwarm.initializeNetwork(swarm);

      const operations = 1000;
      const state = createMockConsciousnessState();

      const throughput = await performanceUtils.measureThroughput(
        async () => await neuralHdr.processState(state),
        5000 // 5 second test
      );

      expect(throughput).toBeGreaterThan(100); // Minimum 100 ops/sec
      expect(throughput).toBeMeasurement({
        name: "State Processing Throughput",
        metrics: {
          OPERATIONS_PER_SECOND: throughput,
        },
      });
    });

    it("should maintain performance under sustained load", async () => {
      const duration = 10000; // 10 seconds
      const interval = 10; // 10ms between operations
      const start = Date.now();
      const results = [];

      while (Date.now() - start < duration) {
        const state = createMockConsciousnessState();
        const { duration: opDuration } =
          await performanceUtils.measureExecutionTime(
            async () => await neuralHdr.processState(state)
          );
        results.push(opDuration);
        await new Promise((resolve) => setTimeout(resolve, interval));
      }

      const avgLatency = results.reduce((a, b) => a + b, 0) / results.length;
      const maxLatency = Math.max(...results);
      const p95Latency = results.sort((a, b) => a - b)[
        Math.floor(results.length * 0.95)
      ];

      expect(avgLatency).toBeLessThan(50); // 50ms average
      expect(maxLatency).toBeLessThan(200); // 200ms max
      expect(p95Latency).toBeLessThan(100); // 100ms 95th percentile

      expect({ avgLatency, maxLatency, p95Latency }).toBeMeasurement({
        name: "Sustained Load Performance",
        metrics: {
          AVERAGE_LATENCY: avgLatency,
          MAX_LATENCY: maxLatency,
          P95_LATENCY: p95Latency,
        },
      });
    });
  });

  describe("scalability tests", () => {
    it("should scale processing with swarm size", async () => {
      const sizes = [4, 8, 16, 32];
      const results = [];

      for (const size of sizes) {
        const swarm = createMockNanoSwarm(size);
        await nanoSwarm.initializeNetwork(swarm);

        const state = createMockConsciousnessState();
        const { duration } = await performanceUtils.measureExecutionTime(
          async () => await neuralHdr.processState(state)
        );

        results.push({ size, duration });
      }

      // Verify sub-linear scaling
      for (let i = 1; i < results.length; i++) {
        const scalingFactor = results[i].duration / results[i - 1].duration;
        expect(scalingFactor).toBeGreaterThan(0.4); // Should not scale worse than 0.4x
      }

      expect(results).toBeMeasurement({
        name: "Swarm Scaling Performance",
        metrics: Object.fromEntries(
          results.map((r) => [`SWARM_SIZE_${r.size}`, r.duration])
        ),
      });
    });

    it("should efficiently handle large state dimensions", async () => {
      const dimensions = [16, 32, 64, 128];
      const results = [];

      for (const dim of dimensions) {
        const state = createMockConsciousnessState({
          dimensions: dim,
        });

        const { duration, result: memoryUsage } =
          await performanceUtils.measureMemoryUsage(async () => {
            const { duration } = await performanceUtils.measureExecutionTime(
              async () => await neuralHdr.processState(state)
            );
            return duration;
          });

        results.push({
          dimensions: dim,
          duration,
          memoryUsage: memoryUsage.heapUsed,
        });
      }

      results.forEach((result) => {
        expect(result.duration).toBeLessThan(1000); // 1 second max
        expect(result.memoryUsage).toBeLessThan(1024 * 1024 * 1024); // 1GB max
      });

      expect(results).toBeMeasurement({
        name: "Dimension Scaling Performance",
        metrics: Object.fromEntries([
          ...results.map((r) => [`DURATION_DIM_${r.dimensions}`, r.duration]),
          ...results.map((r) => [`MEMORY_DIM_${r.dimensions}`, r.memoryUsage]),
        ]),
      });
    });
  });

  describe("resource utilization", () => {
    it("should efficiently manage memory usage", async () => {
      const iterations = 100;
      const memoryMeasurements = [];

      for (let i = 0; i < iterations; i++) {
        const state = createMockConsciousnessState();
        const { result: memoryUsage } =
          await performanceUtils.measureMemoryUsage(
            async () => await neuralHdr.processState(state)
          );
        memoryMeasurements.push(memoryUsage);

        // Force GC if available
        if (global.gc) {
          global.gc();
        }
      }

      const maxHeapUsed = Math.max(
        ...memoryMeasurements.map((m) => m.heapUsed)
      );
      const avgHeapUsed =
        memoryMeasurements.reduce((a, b) => a + b.heapUsed, 0) / iterations;

      expect(maxHeapUsed).toBeLessThan(1024 * 1024 * 1024); // 1GB max
      expect(avgHeapUsed).toBeLessThan(512 * 1024 * 1024); // 512MB average

      expect({ maxHeapUsed, avgHeapUsed }).toBeMeasurement({
        name: "Memory Utilization",
        metrics: {
          MAX_HEAP_USED: maxHeapUsed,
          AVG_HEAP_USED: avgHeapUsed,
        },
      });
    });

    it("should optimize CPU utilization", async () => {
      const duration = 5000; // 5 second test
      const start = Date.now();
      let operations = 0;
      const cpuMeasurements = [];

      while (Date.now() - start < duration) {
        const state = createMockConsciousnessState();
        const { duration: cpuTime } =
          await performanceUtils.measureExecutionTime(
            async () => await neuralHdr.processState(state)
          );
        cpuMeasurements.push(cpuTime);
        operations++;
      }

      const avgCpuTime =
        cpuMeasurements.reduce((a, b) => a + b, 0) / operations;
      const throughput = operations / (duration / 1000);

      expect(avgCpuTime).toBeLessThan(50); // 50ms average CPU time
      expect(throughput).toBeGreaterThan(100); // 100 ops/sec minimum

      expect({ avgCpuTime, throughput }).toBeMeasurement({
        name: "CPU Utilization",
        metrics: {
          AVERAGE_CPU_TIME: avgCpuTime,
          OPERATIONS_PER_SECOND: throughput,
        },
      });
    });
  });

  describe("load tests", () => {
    it("should handle burst processing", async () => {
      const burstSize = 100;
      const states = Array(burstSize)
        .fill(null)
        .map(() => createMockConsciousnessState());

      const { duration, result: results } =
        await performanceUtils.measureExecutionTime(
          async () =>
            await Promise.all(
              states.map((state) => neuralHdr.processState(state))
            )
        );

      expect(results.length).toBe(burstSize);
      expect(duration).toBeLessThan(burstSize * 10); // Less than 10ms per operation

      expect({
        duration,
        operationsPerSecond: burstSize / (duration / 1000),
      }).toBeMeasurement({
        name: "Burst Processing Performance",
        metrics: {
          TOTAL_DURATION: duration,
          OPERATIONS_PER_SECOND: burstSize / (duration / 1000),
        },
      });
    });

    it("should handle concurrent operations", async () => {
      const concurrency = 16;
      const operationsPerWorker = 50;
      const workers = Array(concurrency).fill(null);

      const { duration, result: results } =
        await performanceUtils.measureExecutionTime(async () => {
          return await Promise.all(
            workers.map(async () => {
              const workerResults = [];
              for (let i = 0; i < operationsPerWorker; i++) {
                const state = createMockConsciousnessState();
                workerResults.push(await neuralHdr.processState(state));
              }
              return workerResults;
            })
          );
        });

      const totalOperations = concurrency * operationsPerWorker;
      const throughput = totalOperations / (duration / 1000);

      expect(results.flat().length).toBe(totalOperations);
      expect(throughput).toBeGreaterThan(500); // Minimum 500 ops/sec

      expect({ duration, throughput }).toBeMeasurement({
        name: "Concurrent Processing Performance",
        metrics: {
          TOTAL_DURATION: duration,
          OPERATIONS_PER_SECOND: throughput,
        },
      });
    });
  });
});
