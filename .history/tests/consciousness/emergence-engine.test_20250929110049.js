/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 */

const { expect } = require("chai");
const EmergenceEngine = require("../../src/consciousness/emergence-engine");
const {
  SecureTaskExecution,
} = require("../../src/quantum/secure-task-execution");
const {
  QuantumEntropyGenerator,
} = require("../../src/quantum/quantum-entropy-generator");

describe("EmergenceEngine", () => {
  let engine;

  beforeEach(() => {
    engine = new EmergenceEngine({
      minPatternStrength: 0.3,
      minPatternConfidence: 0.5,
      temporalResolution: 100,
      maxPatterns: 10,
      emergenceThreshold: 0.7,
    });
  });

  describe("Pattern Detection", () => {
    it("should detect primary patterns when emergence score is above threshold", async () => {
      const state = {
        id: "test-state",
        emergenceScore: 0.8,
        nodes: [
          { id: 1, type: "neural", connections: [2, 3] },
          { id: 2, type: "neural", connections: [1, 3] },
          { id: 3, type: "neural", connections: [1, 2] },
        ],
      };

      const result = await engine.processState(state);

      expect(result.patterns).to.be.an("array");
      expect(result.patterns.length).to.be.greaterThan(0);
      expect(result.emergenceScore).to.be.greaterThan(0);

      const primaryPattern = result.patterns.find(
        (p) => p.properties.type === "primary"
      );
      expect(primaryPattern).to.exist;
      expect(primaryPattern.properties.emergenceScore).to.equal(0.8);
    });

    it("should detect structural patterns from node configurations", async () => {
      const state = {
        emergenceScore: 0.6,
        nodes: [
          { id: 1, type: "input", connections: [2, 3] },
          { id: 2, type: "hidden", connections: [1, 4] },
          { id: 3, type: "hidden", connections: [1, 4] },
          { id: 4, type: "output", connections: [2, 3] },
        ],
      };

      const result = await engine.processState(state);
      const structuralPattern = result.patterns.find(
        (p) => p.properties.type === "structural"
      );

      expect(structuralPattern).to.exist;
      expect(structuralPattern.properties.nodeCount).to.equal(4);
      expect(structuralPattern.properties.complexity).to.be.a("number");
      expect(structuralPattern.properties.complexity).to.be.greaterThan(0);
    });

    it("should detect temporal patterns from state history", async () => {
      const state = {
        emergenceScore: 0.6,
        history: [
          { timestamp: Date.now() - 3000, value: 0.5 },
          { timestamp: Date.now() - 2000, value: 0.6 },
          { timestamp: Date.now() - 1000, value: 0.7 },
          { timestamp: Date.now(), value: 0.8 },
        ],
      };

      const result = await engine.processState(state);
      const temporalPattern = result.patterns.find(
        (p) => p.properties.type === "temporal"
      );

      expect(temporalPattern).to.exist;
      expect(temporalPattern.properties.duration).to.equal(4);
      expect(temporalPattern.properties.frequency).to.be.a("number");
      expect(temporalPattern.properties.frequency).to.be.greaterThan(0);
    });
  });

  describe("Pattern Management", () => {
    it("should update existing patterns with new state data", async () => {
      const state1 = {
        id: "test-state",
        emergenceScore: 0.8,
      };

      const state2 = {
        id: "test-state",
        emergenceScore: 0.9,
      };

      const result1 = await engine.processState(state1);
      const pattern1 = result1.patterns[0];

      const result2 = await engine.processState(state2);
      const pattern2 = result2.patterns.find((p) => p.id === pattern1.id);

      expect(pattern2).to.exist;
      expect(pattern2.properties.emergenceScore).to.equal(0.9);
    });

    it("should maintain pattern count within maxPatterns limit", async () => {
      // Create more patterns than maxPatterns limit
      for (let i = 0; i < 15; i++) {
        await engine.processState({
          id: `state-${i}`,
          emergenceScore: 0.8,
        });
      }

      const stats = engine.getStatistics();
      expect(stats.totalPatterns).to.be.lessThanOrEqual(10); // maxPatterns
    });

    it("should calculate accurate emergence scores", async () => {
      const state = {
        emergenceScore: 0.8,
        nodes: [
          { id: 1, type: "neural", connections: [2] },
          { id: 2, type: "neural", connections: [1] },
        ],
        history: [
          { timestamp: Date.now() - 1000, value: 0.7 },
          { timestamp: Date.now(), value: 0.8 },
        ],
      };

      const result = await engine.processState(state);
      expect(result.emergenceScore).to.be.a("number");
      expect(result.emergenceScore).to.be.within(0, 1);
    });
  });

  describe("Pattern Interactions", () => {
    it("should detect and analyze pattern interactions", async () => {
      // Create two interacting patterns
      const state1 = {
        id: "state-1",
        emergenceScore: 0.8,
        nodes: [
          { id: 1, type: "input", connections: [2] },
          { id: 2, type: "output", connections: [1] },
        ],
      };

      const state2 = {
        id: "state-2",
        emergenceScore: 0.8,
        nodes: [
          { id: 3, type: "input", connections: [4] },
          { id: 4, type: "output", connections: [3] },
        ],
      };

      await engine.processState(state1);
      const result = await engine.processState(state2);

      expect(result.interactions).to.be.an("array");
      if (result.interactions.length > 0) {
        const interaction = result.interactions[0];
        expect(interaction).to.have.property("pattern1Id");
        expect(interaction).to.have.property("pattern2Id");
        expect(interaction).to.have.property("strength");
        expect(interaction).to.have.property("type");
      }
    });

    it("should calculate pattern interaction strength correctly", async () => {
      // Create patterns with high correlation
      const timestamp = Date.now();
      const state1 = {
        id: "state-1",
        emergenceScore: 0.8,
        history: [
          { timestamp: timestamp - 2000, value: 0.6 },
          { timestamp: timestamp - 1000, value: 0.7 },
          { timestamp: timestamp, value: 0.8 },
        ],
      };

      const state2 = {
        id: "state-2",
        emergenceScore: 0.8,
        history: [
          { timestamp: timestamp - 2000, value: 0.6 },
          { timestamp: timestamp - 1000, value: 0.7 },
          { timestamp: timestamp, value: 0.8 },
        ],
      };

      await engine.processState(state1);
      const result = await engine.processState(state2);

      if (result.interactions.length > 0) {
        const interaction = result.interactions[0];
        expect(interaction.strength).to.be.a("number");
        expect(interaction.strength).to.be.within(0, 1);
      }
    });
  });

  describe("Pattern Analysis", () => {
    it("should provide detailed pattern information", async () => {
      const state = {
        id: "test-state",
        emergenceScore: 0.8,
        nodes: [
          { id: 1, type: "neural", connections: [2] },
          { id: 2, type: "neural", connections: [1] },
        ],
      };

      const result = await engine.processState(state);
      const pattern = result.patterns[0];
      const details = engine.getPatternDetails(pattern.id);

      expect(details).to.exist;
      expect(details.metrics).to.have.all.keys(
        "strength",
        "confidence",
        "stability",
        "viability"
      );
      expect(details.history).to.be.an("array");
    });

    it("should calculate accurate system statistics", async () => {
      // Process multiple states
      await engine.processState({ id: "state-1", emergenceScore: 0.8 });
      await engine.processState({ id: "state-2", emergenceScore: 0.7 });

      const stats = engine.getStatistics();

      expect(stats).to.have.all.keys(
        "totalPatterns",
        "activePatterns",
        "averageStrength",
        "averageConfidence",
        "patternDistribution",
        "temporalMetrics",
        "interactionMetrics"
      );

      expect(stats.totalPatterns).to.be.a("number");
      expect(stats.activePatterns).to.be.a("number");
      expect(stats.averageStrength).to.be.within(0, 1);
      expect(stats.averageConfidence).to.be.within(0, 1);
    });
  });

  describe("Security Integration", () => {
    it("should use secure task execution for state processing", async () => {
      const secureTaskSpy = sinon.spy(SecureTaskExecution.prototype, "execute");

      await engine.processState({
        id: "test-state",
        emergenceScore: 0.8,
      });

      expect(secureTaskSpy.called).to.be.true;
      secureTaskSpy.restore();
    });

    it("should use quantum entropy for pattern detection", async () => {
      const entropySpy = sinon.spy(
        QuantumEntropyGenerator.prototype,
        "generateEntropy"
      );

      await engine.processState({
        id: "test-state",
        emergenceScore: 0.8,
      });

      expect(entropySpy.called).to.be.true;
      entropySpy.restore();
    });
  });
});
