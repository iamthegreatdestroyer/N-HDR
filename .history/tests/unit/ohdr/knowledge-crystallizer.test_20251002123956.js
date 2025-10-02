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
 * File: knowledge-crystallizer.test.js
 * Created: 2025-09-30
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import { jest } from "@jest/globals";
import KnowledgeCrystallizer from "../../../src/ohdr/KnowledgeCrystallizer.js";
import SecurityManager from "../../../src/core/security/security-manager.js";
import QuantumProcessor from "../../../src/core/quantum/quantum-processor.js";
import config from "../../../config/nhdr-config.js";

describe("KnowledgeCrystallizer", () => {
  let crystallizer;
  let mockSecurityManager;
  let mockQuantumProcessor;

  const mockConsciousnessState = {
    dimensions: {
      memory: {
        patterns: [
          /* ... */
        ],
      },
      cognition: {
        processes: [
          /* ... */
        ],
      },
      emotion: {
        states: [
          /* ... */
        ],
      },
    },
  };

  beforeEach(() => {
    // Create crystallizer instance
    crystallizer = new KnowledgeCrystallizer();

    // Mock security manager methods directly on the instance
    crystallizer.security = {
      getOperationToken: async () => "mock-token",
      validateToken: async () => true,
    };

    // Mock quantum processor methods directly on the instance
    crystallizer.quantumProcessor = {
      initializeState: async () => true,
      setupEnvironment: async () => true,
      processState: async () => ({ quantumState: "processed" }),
      generateSignature: async () => ({ signature: "quantum-signature" }),
      calculateCorrelation: async () => 0.85,
    };
  });

  describe("Initialization", () => {
    test("should initialize successfully", async () => {
      const result = await crystallizer.initialize();
      expect(result).toBe(true);
      expect(mockSecurityManager.getOperationToken).toHaveBeenCalledWith(
        "crystallize"
      );
      expect(mockQuantumProcessor.initializeState).toHaveBeenCalled();
    });

    test("should fail initialization with invalid security token", async () => {
      mockSecurityManager.validateToken.mockResolvedValue(false);
      await expect(crystallizer.initialize()).rejects.toThrow(
        "Invalid security context"
      );
    });
  });

  describe("Crystallization Process", () => {
    beforeEach(async () => {
      await crystallizer.initialize();
    });

    test("should successfully crystallize consciousness state", async () => {
      const result = await crystallizer.crystallize(mockConsciousnessState);
      expect(result.success).toBe(true);
      expect(result.crystals).toBeDefined();
      expect(result.patterns).toBeGreaterThan(0);
    });

    test("should extract patterns above threshold", async () => {
      await crystallizer.crystallize(mockConsciousnessState);
      expect(crystallizer.crystalPatterns.size).toBeGreaterThan(0);

      // Verify all patterns meet threshold
      for (const [_, crystal] of crystallizer.crystalPatterns) {
        expect(crystal.pattern.significance).toBeGreaterThanOrEqual(
          config.ohdr.crystallizationThreshold
        );
      }
    });

    test("should maintain quantum security during crystallization", async () => {
      await crystallizer.crystallize(mockConsciousnessState);
      expect(mockQuantumProcessor.generateSignature).toHaveBeenCalled();
      expect(mockSecurityManager.validateToken).toHaveBeenCalled();
    });
  });

  describe("Pattern Analysis", () => {
    beforeEach(async () => {
      await crystallizer.initialize();
    });

    test("should analyze pattern stability correctly", async () => {
      const result = await crystallizer.crystallize(mockConsciousnessState);
      expect(result.stability).toBeGreaterThanOrEqual(0);
      expect(result.stability).toBeLessThanOrEqual(1);
    });

    test("should form valid crystal structures", async () => {
      const result = await crystallizer.crystallize(mockConsciousnessState);
      expect(Array.isArray(result.crystals)).toBe(true);

      for (const crystal of result.crystals) {
        expect(crystal).toHaveProperty("id");
        expect(crystal).toHaveProperty("pattern");
        expect(crystal).toHaveProperty("stability");
        expect(crystal).toHaveProperty("formation");
        expect(crystal.stability.overall).toBeGreaterThanOrEqual(
          config.ohdr.stabilityThreshold
        );
      }
    });
  });

  describe("Error Handling", () => {
    beforeEach(async () => {
      await crystallizer.initialize();
    });

    test("should handle invalid consciousness state", async () => {
      const result = await crystallizer.crystallize({});
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("should handle quantum processing errors", async () => {
      mockQuantumProcessor.processState.mockRejectedValue(
        new Error("Quantum error")
      );
      const result = await crystallizer.crystallize(mockConsciousnessState);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Quantum error");
    });
  });

  describe("Performance and Optimization", () => {
    beforeEach(async () => {
      await crystallizer.initialize();
    });

    test("should optimize crystal formations", async () => {
      const result = await crystallizer.crystallize(mockConsciousnessState);
      const sortedCrystals = result.crystals;

      // Verify crystals are sorted by stability
      for (let i = 1; i < sortedCrystals.length; i++) {
        expect(sortedCrystals[i - 1].stability.overall).toBeGreaterThanOrEqual(
          sortedCrystals[i].stability.overall
        );
      }
    });

    test("should maintain acceptable entropy levels", async () => {
      const result = await crystallizer.crystallize(mockConsciousnessState);
      for (const crystal of result.crystals) {
        expect(crystal.entropy).toBeLessThanOrEqual(
          config.ohdr.entropyTolerance
        );
      }
    });
  });
});
