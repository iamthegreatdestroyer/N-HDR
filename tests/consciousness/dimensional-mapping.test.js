/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * DIMENSIONAL MAPPING TESTS
 * Validates dimensional mapping functionality and state transformations.
 */

jest.mock("../quantum/secure-task-execution");

const DimensionalMapping = require("../../src/consciousness/dimensional-mapping");
const {
  SecureTaskExecution,
} = require("../../src/quantum/secure-task-execution");

describe("DimensionalMapping", () => {
  let mapping;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock SecureTaskExecution
    SecureTaskExecution.mockImplementation(() => ({
      execute: jest.fn().mockImplementation(async (task) => task()),
    }));

    // Create mapping instance
    mapping = new DimensionalMapping({
      maxDimensions: 8,
      minDimensions: 2,
      projectionQuality: 0.95,
    });
  });

  describe("Configuration", () => {
    test("should initialize with default options", () => {
      const defaultMapping = new DimensionalMapping();
      expect(defaultMapping.options.maxDimensions).toBe(12);
      expect(defaultMapping.options.minDimensions).toBe(3);
      expect(defaultMapping.options.projectionQuality).toBe(0.9);
    });

    test("should initialize with custom options", () => {
      expect(mapping.options.maxDimensions).toBe(8);
      expect(mapping.options.minDimensions).toBe(2);
      expect(mapping.options.projectionQuality).toBe(0.95);
    });
  });

  describe("Vector Operations", () => {
    test("should perform vector addition", () => {
      const v1 = new mapping.constructor.DimensionalVector([1, 0, 0]);
      const v2 = new mapping.constructor.DimensionalVector([0, 1, 0]);
      const sum = v1.add(v2);
      expect(sum.components).toEqual([1, 1, 0]);
    });

    test("should calculate dot product", () => {
      const v1 = new mapping.constructor.DimensionalVector([1, 2, 3]);
      const v2 = new mapping.constructor.DimensionalVector([4, 5, 6]);
      const dot = v1.dot(v2);
      expect(dot).toBe(32); // 1*4 + 2*5 + 3*6
    });

    test("should normalize vectors", () => {
      const v = new mapping.constructor.DimensionalVector([3, 4, 0]);
      const normalized = v.normalize();
      expect(normalized.magnitude()).toBeCloseTo(1);
      expect(normalized.components[0]).toBeCloseTo(0.6);
      expect(normalized.components[1]).toBeCloseTo(0.8);
    });
  });

  describe("Higher Dimensional Mapping", () => {
    const testState = {
      coordinates: [1, 0, 0],
      dimensions: 3,
      data: { value: 42 },
    };

    test("should map to higher dimensions", async () => {
      const mapped = await mapping.mapToHigherDimension(testState, 5);
      expect(mapped.dimensions).toBe(5);
      expect(mapped.coordinates.length).toBe(5);
      expect(mapped.data).toEqual(testState.data);
    });

    test("should preserve original state properties", async () => {
      const mapped = await mapping.mapToHigherDimension(testState, 4);
      expect(mapped.data).toEqual(testState.data);
      expect(mapped.mappingMetadata).toBeDefined();
      expect(mapped.mappingMetadata.originalDimensions).toBe(3);
    });

    test("should reject invalid target dimensions", async () => {
      await expect(mapping.mapToHigherDimension(testState, 9)).rejects.toThrow(
        "Target dimension exceeds maximum"
      );
    });

    test("should maintain vector magnitudes", async () => {
      const original = new mapping.constructor.DimensionalVector(
        testState.coordinates
      );
      const mapped = await mapping.mapToHigherDimension(testState, 5);
      const mappedVector = new mapping.constructor.DimensionalVector(
        mapped.coordinates
      );

      expect(mappedVector.magnitude()).toBeCloseTo(original.magnitude());
    });
  });

  describe("Lower Dimensional Mapping", () => {
    const testState = {
      coordinates: [1, 2, 3, 4, 5],
      dimensions: 5,
      data: { value: 42 },
    };

    test("should reduce dimensions", async () => {
      const reduced = await mapping.mapToLowerDimension(testState, 3);
      expect(reduced.dimensions).toBe(3);
      expect(reduced.coordinates.length).toBe(3);
      expect(reduced.data).toEqual(testState.data);
    });

    test("should preserve relative magnitudes", async () => {
      const original = new mapping.constructor.DimensionalVector(
        testState.coordinates
      );
      const reduced = await mapping.mapToLowerDimension(testState, 3);
      const reducedVector = new mapping.constructor.DimensionalVector(
        reduced.coordinates
      );

      // Magnitude should be proportionally preserved
      const ratio = reducedVector.magnitude() / original.magnitude();
      expect(ratio).toBeGreaterThan(0.5);
    });

    test("should reject invalid target dimensions", async () => {
      await expect(mapping.mapToLowerDimension(testState, 1)).rejects.toThrow(
        "Target dimension below minimum"
      );
    });

    test("should track variance preservation", async () => {
      const reduced = await mapping.mapToLowerDimension(testState, 3);
      expect(reduced.mappingMetadata.preservedVariance).toBeDefined();
      expect(reduced.mappingMetadata.preservedVariance).toBeGreaterThan(0);
      expect(reduced.mappingMetadata.preservedVariance).toBeLessThanOrEqual(1);
    });
  });

  describe("Dimensional Transformation", () => {
    test("should transform between arbitrary dimensions", async () => {
      const state = {
        coordinates: [1, 2, 3],
        dimensions: 3,
        data: { value: 42 },
      };

      // Transform up then down
      const upMapped = await mapping.transformDimensions(state, 5);
      expect(upMapped.dimensions).toBe(5);

      const downMapped = await mapping.transformDimensions(upMapped, 2);
      expect(downMapped.dimensions).toBe(2);

      // Original data should be preserved
      expect(downMapped.data).toEqual(state.data);
    });

    test("should handle equal dimensions", async () => {
      const state = {
        coordinates: [1, 2, 3],
        dimensions: 3,
      };

      const transformed = await mapping.transformDimensions(state, 3);
      expect(transformed).toEqual(state);
    });
  });

  describe("State Compatibility", () => {
    test("should calculate compatibility between states", async () => {
      const state1 = {
        coordinates: [1, 2, 3],
        dimensions: 3,
      };

      const state2 = {
        coordinates: [1, 2, 3, 4],
        dimensions: 4,
      };

      const compatibility = await mapping.calculateCompatibility(
        state1,
        state2
      );
      expect(compatibility.dimensionalDifference).toBe(1);
      expect(compatibility.compatibilityScore).toBeGreaterThan(0);
      expect(compatibility.compatibilityScore).toBeLessThanOrEqual(1);
    });

    test("should consider structural similarity", async () => {
      const state1 = {
        coordinates: [1, 1, 1],
        dimensions: 3,
      };

      const state2 = {
        coordinates: [1, 1, 1],
        dimensions: 3,
      };

      const compatibility = await mapping.calculateCompatibility(
        state1,
        state2
      );
      expect(compatibility.structuralSimilarity).toBe(1);
      expect(compatibility.compatibilityScore).toBeCloseTo(1);
    });

    test("should evaluate topology preservation", async () => {
      const state1 = {
        coordinates: [0, 1, 2],
        dimensions: 3,
      };

      const state2 = {
        coordinates: [0, 2, 4],
        dimensions: 3,
      };

      const compatibility = await mapping.calculateCompatibility(
        state1,
        state2
      );
      expect(compatibility.topologyPreservation).toBeDefined();
      expect(compatibility.topologyPreservation).toBeGreaterThan(0);
    });
  });

  describe("Caching", () => {
    test("should cache and retrieve mappings", async () => {
      const state = {
        coordinates: [1, 2, 3],
        dimensions: 3,
        data: { value: 42 },
      };

      // First mapping
      const mapped1 = await mapping.mapToHigherDimension(state, 5);

      // Second mapping should use cache
      const mapped2 = await mapping.mapToHigherDimension(state, 5);

      expect(mapped2).toEqual(mapped1);
    });

    test("should handle cache misses gracefully", async () => {
      const state = {
        coordinates: [1, 2, 3],
        dimensions: 3,
      };

      // Clear cache
      mapping.dimensionalCache.clear();

      // Should still work without cache
      const mapped = await mapping.mapToHigherDimension(state, 5);
      expect(mapped.dimensions).toBe(5);
    });
  });
});
