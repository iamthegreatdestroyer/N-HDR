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
 * File: swarm-consciousness.test.js
 * Created: 2025-09-30
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import SwarmConsciousnessManager from "../../../src/core/integration/swarm/SwarmConsciousnessManager";
import DimensionalDataStructures from "../../../src/core/integration/data/DimensionalDataStructures";
import * as tf from "@tensorflow/tfjs";
import config from "../../../config/nhdr-config";

describe("SwarmConsciousnessManager Tests", () => {
  let swarmManager;
  let dimensionalStructures;
  let mockDimensionalState;
  let mockSecureChannel;

  beforeEach(() => {
    swarmManager = new SwarmConsciousnessManager();
    dimensionalStructures = new DimensionalDataStructures();
    mockDimensionalState = {
      dimension_0: {
        tensor: tf.tensor2d([
          [1, 2],
          [3, 4],
        ]),
        shape: [2, 2],
      },
      dimension_1: {
        tensor: tf.tensor2d([
          [5, 6],
          [7, 8],
        ]),
        shape: [2, 2],
      },
    };
    mockSecureChannel = {
      id: "test-channel",
      sessionKey: "test-key",
      entanglement: { state: "entangled" },
    };
  });

  afterEach(() => {
    Object.values(mockDimensionalState).forEach((dim) => {
      tf.dispose(dim.tensor);
    });
  });

  describe("Initialization", () => {
    test("should initialize with proper components", () => {
      expect(swarmManager.dataStructures).toBeDefined();
      expect(swarmManager.taskEngine).toBeDefined();
      expect(swarmManager.activeSwarms.size).toBe(0);
    });

    test("should set up state registry", () => {
      expect(swarmManager.stateRegistry).toBeDefined();
      expect(swarmManager.stateRegistry instanceof Map).toBe(true);
    });
  });

  describe("Consciousness Distribution", () => {
    test("should distribute consciousness to swarm", async () => {
      const result = await swarmManager.distributeConsciousness(
        mockDimensionalState,
        mockSecureChannel
      );
      expect(result.success).toBe(true);
      expect(result.swarmId).toBeDefined();
      expect(result.distribution).toBeDefined();
    });

    test("should validate dimensional state before distribution", async () => {
      const validationSpy = jest.spyOn(
        swarmManager,
        "_validateDimensionalState"
      );
      await swarmManager.distributeConsciousness(
        mockDimensionalState,
        mockSecureChannel
      );
      expect(validationSpy).toHaveBeenCalledWith(mockDimensionalState);
    });

    test("should create valid distribution plan", async () => {
      const plan = await swarmManager._createDistributionPlan(
        mockDimensionalState
      );
      expect(plan.complexity).toBeDefined();
      expect(plan.distribution).toBeDefined();
      expect(plan.timestamp).toBeDefined();
    });
  });

  describe("Swarm Entity Management", () => {
    test("should initialize swarm entities", async () => {
      const plan = await swarmManager._createDistributionPlan(
        mockDimensionalState
      );
      const entities = await swarmManager._initializeSwarmEntities(plan);
      expect(entities.length).toBeGreaterThan(0);
      entities.forEach((entity) => {
        expect(entity).toBeDefined();
      });
    });

    test("should distribute state fragments correctly", async () => {
      const plan = await swarmManager._createDistributionPlan(
        mockDimensionalState
      );
      const entities = await swarmManager._initializeSwarmEntities(plan);
      const distribution = await swarmManager._distributeStateFragments(
        entities,
        mockDimensionalState,
        mockSecureChannel
      );
      expect(distribution.fragmentCount).toBe(entities.length);
      expect(distribution.distributions.length).toBe(entities.length);
    });
  });

  describe("Distribution Integrity", () => {
    test("should verify distribution integrity", async () => {
      const result = await swarmManager.distributeConsciousness(
        mockDimensionalState,
        mockSecureChannel
      );
      const integrity = await swarmManager._verifyDistributionIntegrity(
        result.distribution
      );
      expect(integrity).toBe(true);
    });

    test("should detect integrity violations", async () => {
      const invalidDistribution = {
        fragmentCount: 1,
        distributions: [{ valid: false }],
      };
      const integrity = await swarmManager._verifyDistributionIntegrity(
        invalidDistribution
      );
      expect(integrity).toBe(false);
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid dimensional states", async () => {
      const invalidState = {
        invalid_dimension: "not a tensor",
      };
      await expect(
        swarmManager.distributeConsciousness(invalidState, mockSecureChannel)
      ).rejects.toThrow("Invalid dimensional state structure");
    });

    test("should handle distribution failures", async () => {
      const failingState = {
        ...mockDimensionalState,
        fail: true,
      };
      await expect(
        swarmManager.distributeConsciousness(failingState, mockSecureChannel)
      ).rejects.toThrow("Failed to distribute consciousness to swarm");
    });
  });

  describe("Performance Requirements", () => {
    test("should distribute within time limit", async () => {
      const startTime = Date.now();
      await swarmManager.distributeConsciousness(
        mockDimensionalState,
        mockSecureChannel
      );
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(config.performance.maxDistributionTime);
    });

    test("should scale with increasing swarm size", async () => {
      const largeState = {};
      for (let i = 0; i < 10; i++) {
        largeState[`dimension_${i}`] = {
          tensor: tf.randomNormal([10, 10]),
          shape: [10, 10],
        };
      }
      const startTime = Date.now();
      await swarmManager.distributeConsciousness(largeState, mockSecureChannel);
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(
        config.performance.maxLargeDistributionTime
      );
      Object.values(largeState).forEach((dim) => {
        tf.dispose(dim.tensor);
      });
    });
  });
});
