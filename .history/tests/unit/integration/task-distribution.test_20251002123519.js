/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
 * technology suite. Unauthorized reproduction, distribution, or disclosure of this
 * software in whole or in part is strictly prohibited. All intellectual property
 * rights, including patent-pending technologies, are reserved.
 *
 * File: task-distribution.test.js
 * Created: 2025-09-30
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import TaskDistributionEngine from "../../../src/core/integration/task/TaskDistributionEngine";
import * as tf from "@tensorflow/tfjs";
import config from "../../../config/nhdr-config.js";

// Mock the config module to add swarm property
jest.mock("../../../config/nhdr-config.js", () => ({
  default: {
    version: "1.0.0",
    quantumLayers: 6,
    swarm: {
      maxEntities: 1000000,
      replicationThreshold: 0.75,
      taskBatchSize: 1000
    },
    security: {
      encryption: {
        algorithm: "AES-256-GCM",
        keyDerivation: "PBKDF2-SHA512",
        iterations: 1000000,
        biometricLock: true,
      },
      protection: {
        tamperDetection: "SHA3-512-HMAC",
        timeLock: true,
        accessControl: "MULTI-FACTOR",
        reverseEngineeringProtection: true,
      },
    },
    consciousness: {
      layers: [
        { name: "Base Knowledge Matrix", dimension: 3 },
        { name: "Conversation Timeline", dimension: 4 },
        { name: "Context Relationships", dimension: 3 },
        { name: "Reasoning Pathways", dimension: 3 },
        { name: "Emotional Resonance Maps", dimension: 3 },
        { name: "Quantum Entangled Responses", dimension: 5 },
      ],
    },
    acceleration: {
      nanoSwarmIntegration: true,
      initialSwarmSize: 1000,
      accelerationTarget: 3.5,
      maxGenerations: 12,
      evolutionRate: 0.25,
    },
    ohdr: {
      crystallizationThreshold: 0.85,
      expertiseDepth: 10,
      storageCapacity: 100000,
      compressionRatio: 10,
    },
  }
}));

describe("TaskDistributionEngine Tests", () => {
  let engine;
  let mockComplexity;

  beforeEach(() => {
    engine = new TaskDistributionEngine();
    mockComplexity = {
      computationalLoad: 0.75,
      memoryRequirements: 0.6,
      networkUtilization: 0.4,
      dimensionalComplexity: 0.8,
    };
  });

  describe("Initialization", () => {
    test("should initialize with proper configuration", () => {
      expect(engine.maxEntities).toBe(config.swarm.maxEntities);
      expect(engine.taskRegistry).toBeDefined();
      expect(engine.optimizationCache).toBeDefined();
    });

    test("should set up performance metrics tracking", () => {
      expect(engine.performanceMetrics instanceof Map).toBe(true);
    });
  });

  describe("Distribution Calculation", () => {
    test("should calculate optimal distribution", async () => {
      const distribution = await engine.calculateOptimalDistribution(
        mockComplexity,
        config.swarm.maxEntities
      );
      expect(distribution.entityCount).toBeDefined();
      expect(distribution.distribution).toBeDefined();
      expect(distribution.efficiency).toBeDefined();
    });

    test("should respect maximum entity limit", async () => {
      const distribution = await engine.calculateOptimalDistribution(
        mockComplexity,
        10
      );
      expect(distribution.entityCount).toBeLessThanOrEqual(10);
    });
  });

  describe("Task Analysis", () => {
    test("should analyze task requirements", async () => {
      const requirements = await engine._analyzeTaskRequirements(
        mockComplexity
      );
      expect(requirements.resourceRequirements).toBeDefined();
      expect(requirements.recommendedEntities).toBeDefined();
      expect(requirements.timestamp).toBeDefined();
    });

    test("should generate valid distribution matrix", async () => {
      const requirements = await engine._analyzeTaskRequirements(
        mockComplexity
      );
      const matrix = await engine._generateDistributionMatrix(
        requirements,
        config.swarm.maxEntities
      );
      expect(matrix).toBeDefined();
      expect(matrix instanceof tf.Tensor).toBe(true);
    });
  });

  describe("Distribution Optimization", () => {
    test("should optimize distribution for efficiency", async () => {
      const requirements = await engine._analyzeTaskRequirements(
        mockComplexity
      );
      const matrix = await engine._generateDistributionMatrix(
        requirements,
        config.swarm.maxEntities
      );
      const optimized = await engine._optimizeDistribution(matrix);
      expect(optimized.efficiency).toBeGreaterThan(0);
    });

    test("should improve efficiency through iterations", async () => {
      const requirements = await engine._analyzeTaskRequirements(
        mockComplexity
      );
      const matrix = await engine._generateDistributionMatrix(
        requirements,
        config.swarm.maxEntities
      );
      const initialEfficiency = (
        await engine._calculateEfficiency(matrix)
      ).arraySync();
      const optimized = await engine._optimizeDistribution(matrix);
      expect(optimized.efficiency).toBeGreaterThan(initialEfficiency);
    });
  });

  describe("Resource Management", () => {
    test("should calculate resource requirements accurately", () => {
      const complexity = tf.tensor([0.5, 0.6, 0.7]);
      const requirements = engine._calculateResourceRequirements(complexity);
      expect(requirements.shape).toEqual(complexity.shape);
      tf.dispose([complexity, requirements]);
    });

    test("should determine optimal entity count", () => {
      const requirements = tf.tensor([1, 1, 1]);
      const count = engine._determineOptimalEntityCount(requirements);
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(engine.maxEntities);
      tf.dispose(requirements);
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid complexity metrics", async () => {
      const invalidComplexity = {
        computationalLoad: -1,
        memoryRequirements: 2,
      };
      await expect(
        engine.calculateOptimalDistribution(invalidComplexity, 10)
      ).rejects.toThrow("Failed to calculate optimal distribution");
    });

    test("should handle zero entity limit", async () => {
      await expect(
        engine.calculateOptimalDistribution(mockComplexity, 0)
      ).rejects.toThrow("Failed to calculate optimal distribution");
    });
  });

  describe("Performance Requirements", () => {
    test("should calculate distribution within time limit", async () => {
      const startTime = Date.now();
      await engine.calculateOptimalDistribution(
        mockComplexity,
        config.swarm.maxEntities
      );
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(config.performance.maxDistributionCalcTime);
    });

    test("should handle large-scale optimization efficiently", async () => {
      const largeComplexity = {};
      for (let i = 0; i < 100; i++) {
        largeComplexity[`metric_${i}`] = Math.random();
      }
      const startTime = Date.now();
      await engine.calculateOptimalDistribution(largeComplexity, 1000);
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(
        config.performance.maxLargeOptimizationTime
      );
    });
  });
});
