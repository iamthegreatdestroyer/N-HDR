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
 * File: KnowledgeExtractionEngine.test.js
 * Created: 2025-09-30
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import * as tf from "@tensorflow/tfjs";
import KnowledgeExtractionEngine from "../../src/analyzer/KnowledgeExtractionEngine";
import { QuantumProcessor } from "../../src/core/quantum/quantum-processor";
import config from "../../config/nhdr-config";

jest.mock("../../src/core/quantum/quantum-processor");

describe("KnowledgeExtractionEngine", () => {
  let engine;
  let mockResults;

  beforeEach(() => {
    engine = new KnowledgeExtractionEngine();
    mockResults = {
      quantum: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      entanglement: true,
      patterns: [
        [0.5, 0.3, 0.2],
        [0.2, 0.5, 0.3],
        [0.3, 0.2, 0.5],
      ],
    };

    // Mock QuantumProcessor methods
    QuantumProcessor.prototype.processQuantumStates = jest
      .fn()
      .mockResolvedValue({
        states: mockResults.quantum,
        entanglement: true,
      });
  });

  afterEach(() => {
    tf.disposeVariables();
  });

  describe("extractKnowledge", () => {
    it("should successfully extract knowledge from results", async () => {
      const extraction = await engine.extractKnowledge(mockResults);

      expect(extraction).toBeDefined();
      expect(extraction.success).toBe(true);
      expect(extraction.extractionId).toBeDefined();
      expect(extraction.knowledge).toBeDefined();
      expect(extraction.metadata).toBeDefined();
      expect(extraction.timestamp).toBeDefined();
    });

    it("should generate valid knowledge graph", async () => {
      const extraction = await engine.extractKnowledge(mockResults);
      const { knowledge } = extraction;

      expect(knowledge.nodes).toBeDefined();
      expect(knowledge.edges).toBeDefined();
      expect(knowledge.metadata).toBeDefined();
      expect(Array.isArray(knowledge.nodes)).toBe(true);
      expect(Array.isArray(knowledge.edges)).toBe(true);
    });

    it("should fail for invalid results format", async () => {
      const invalidResults = {
        quantum: null,
        patterns: [],
      };

      await expect(engine.extractKnowledge(invalidResults)).rejects.toThrow(
        "Failed to extract knowledge"
      );
    });
  });

  describe("analyzePatterns", () => {
    it("should analyze patterns from extracted knowledge", async () => {
      const extraction = await engine.extractKnowledge(mockResults);
      const patterns = await engine.analyzePatterns(extraction.extractionId);

      expect(patterns).toBeDefined();
      expect(typeof patterns).toBe("object");
      expect(patterns.connections).toBeDefined();
    });

    it("should fail for invalid extraction ID", async () => {
      await expect(engine.analyzePatterns("invalid-id")).rejects.toThrow(
        "Invalid extraction ID"
      );
    });
  });

  describe("Graph Operations", () => {
    it("should calculate correct graph density", async () => {
      const extraction = await engine.extractKnowledge(mockResults);
      const { knowledge } = extraction;

      const density = knowledge.metadata.density;
      expect(density).toBeGreaterThanOrEqual(0);
      expect(density).toBeLessThanOrEqual(1);
    });

    it("should prune weak nodes and edges", async () => {
      const extraction = await engine.extractKnowledge(mockResults);
      const { knowledge } = extraction;

      knowledge.nodes.forEach((node) => {
        expect(node.weight).toBeGreaterThanOrEqual(
          config.knowledge.nodeThreshold
        );
        expect(node.connections.length).toBeGreaterThanOrEqual(
          config.knowledge.minConnections
        );
      });

      knowledge.edges.forEach((edge) => {
        expect(edge.weight).toBeGreaterThanOrEqual(
          config.knowledge.edgeThreshold
        );
      });
    });
  });
});
