/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * ECHO-HDR Integration Tests — Phase 9.7
 * Tests the full ECHO-HDR temporal memory system: store, recall, decay,
 * associative search, dream consolidation, export/import.
 */

import EchoHDRCore, {
  EpisodeType,
  DecayProfile,
  ConsolidationMode,
  ConsolidationStage,
  DreamPhase,
  AssociationType,
  ECHO_VERSION,
} from "../../src/echo-hdr/echo-hdr-core.js";

describe("ECHO-HDR Integration", () => {
  let echo;

  beforeEach(async () => {
    echo = new EchoHDRCore();
    await echo.initialize();
  });

  afterEach(async () => {
    await echo.shutdown();
  });

  // ─── Initialization ──────────────────────────────────────────────────────

  describe("initialization", () => {
    it("should initialize successfully", () => {
      expect(echo._initialized).toBe(true);
    });

    it("should emit ready event on init", async () => {
      const echo2 = new EchoHDRCore();
      const readyPromise = new Promise((resolve) =>
        echo2.once("ready", resolve)
      );
      await echo2.initialize();
      const evt = await readyPromise;
      expect(evt.version).toBe(ECHO_VERSION);
      expect(evt.timestamp).toBeDefined();
      await echo2.shutdown();
    });

    it("should be idempotent", async () => {
      await echo.initialize(); // second call
      expect(echo._initialized).toBe(true);
    });
  });

  // ─── Memory Storage ──────────────────────────────────────────────────────

  describe("memory storage", () => {
    it("should store a simple memory", async () => {
      const ep = await echo.store({
        content: "First ECHO-HDR memory",
        context: ["test", "integration"],
        type: EpisodeType.EXPERIENCE,
      });

      expect(ep).toBeDefined();
      expect(ep.id).toBeDefined();
      expect(ep.content).toBe("First ECHO-HDR memory");
      expect(ep.context).toEqual(expect.arrayContaining(["test"]));
    });

    it("should store with emotional context", async () => {
      const ep = await echo.store({
        content: "Critical breakthrough",
        context: ["breakthrough"],
        type: EpisodeType.MILESTONE,
        emotional: { significance: 0.95, urgency: 0.3, resonance: 0.8 },
        decayProfile: DecayProfile.RESILIENT,
      });

      expect(ep.emotional.significance).toBe(0.95);
      expect(ep.temporal).toBeDefined();
    });

    it("should store with associations", async () => {
      const ep1 = await echo.store({
        content: "First event",
        context: ["chain"],
      });

      const ep2 = await echo.store({
        content: "Second event linked to first",
        context: ["chain"],
        associateWith: [ep1.id],
      });

      expect(ep2.associations).toContain(ep1.id);
    });

    it("should emit store event", async () => {
      const storePromise = new Promise((resolve) =>
        echo.once("store", resolve)
      );
      await echo.store({ content: "event test", context: ["evt"] });
      const evt = await storePromise;
      expect(evt.id).toBeDefined();
      expect(evt.context).toEqual(["evt"]);
    });

    it("should store structured data content", async () => {
      const data = {
        decision: "Use Qdrant for vector search",
        alternatives: ["Pinecone", "Weaviate"],
        rationale: "Self-hosted, OSS, gRPC",
      };
      const ep = await echo.store({
        content: data,
        context: ["architecture", "decision"],
        type: EpisodeType.DECISION,
      });

      expect(ep.content).toEqual(data);
    });
  });

  // ─── Memory Recall ────────────────────────────────────────────────────────

  describe("memory recall", () => {
    beforeEach(async () => {
      await echo.store({
        content: "Architecture discussion",
        context: ["architecture", "meeting"],
        type: EpisodeType.EXPERIENCE,
      });
      await echo.store({
        content: "Security vulnerability found",
        context: ["security", "error"],
        type: EpisodeType.ERROR,
        emotional: { significance: 0.9, urgency: 0.95, resonance: 0.5 },
      });
      await echo.store({
        content: "Caching strategy decided",
        context: ["architecture", "decision"],
        type: EpisodeType.DECISION,
      });
    });

    it("should recall by context", () => {
      const results = echo.recall({ context: ["architecture"] });
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it("should recall by type", () => {
      const results = echo.recall({ type: EpisodeType.ERROR });
      expect(results.length).toBe(1);
      expect(results[0].content).toContain("vulnerability");
    });

    it("should recall by context and type", () => {
      const results = echo.recall({
        context: ["architecture"],
        type: EpisodeType.DECISION,
      });
      expect(results.length).toBe(1);
    });

    it("should respect limit", () => {
      const results = echo.recall({ context: ["architecture"], limit: 1 });
      expect(results.length).toBe(1);
    });

    it("should recall by ID", async () => {
      const stored = await echo.store({
        content: "Unique memory",
        context: ["unique"],
      });
      const found = echo.recallById(stored.id);
      expect(found).toBeDefined();
      expect(found.content).toBe("Unique memory");
    });

    it("should return empty for missing context", () => {
      const results = echo.recall({ context: ["nonexistent"] });
      expect(results.length).toBe(0);
    });
  });

  // ─── Temporal Decay ───────────────────────────────────────────────────────

  describe("temporal decay", () => {
    it("should track memory strength", async () => {
      const ep = await echo.store({
        content: "Decaying memory",
        context: ["decay"],
      });

      const strength = echo.getMemoryStrength(ep.id);
      expect(strength).toBeGreaterThan(0.9); // just created → near 1.0
    });

    it("should return diagnostics", async () => {
      const ep = await echo.store({
        content: "Diagnosable memory",
        context: ["diag"],
        decayProfile: DecayProfile.STANDARD,
      });

      const diag = echo.getDecayDiagnostics(ep.id);
      expect(diag).toBeDefined();
      expect(diag.currentStrength).toBeCloseTo(1.0, 1);
      expect(diag.stage).toBeDefined();
    });

    it("should return null for missing ID", () => {
      expect(echo.getMemoryStrength("nonexistent")).toBeNull();
      expect(echo.getDecayDiagnostics("nonexistent")).toBeNull();
    });

    it("should preserve immortal memories", async () => {
      const ep = await echo.store({
        content: "Immortal knowledge",
        context: ["core"],
        decayProfile: DecayProfile.IMMORTAL,
      });

      const strength = echo.getMemoryStrength(ep.id);
      expect(strength).toBe(1.0);
    });
  });

  // ─── Dream Consolidation ──────────────────────────────────────────────────

  describe("dream consolidation", () => {
    beforeEach(async () => {
      // Seed memories
      for (let i = 0; i < 10; i++) {
        await echo.store({
          content: `Memory #${i}: ${
            i % 2 === 0 ? "important" : "trivial"
          } event`,
          context: i % 2 === 0 ? ["important", "core"] : ["noise"],
          type: i % 3 === 0 ? EpisodeType.INSIGHT : EpisodeType.EXPERIENCE,
          emotional: {
            significance: i % 2 === 0 ? 0.8 : 0.1,
            urgency: 0.3,
            resonance: i % 2 === 0 ? 0.7 : 0.05,
          },
        });
      }
    });

    it("should run LIGHT consolidation", async () => {
      const stats = await echo.dreamConsolidate(ConsolidationMode.LIGHT);
      expect(stats).toBeDefined();
      expect(stats.strengthened).toBeDefined();
    });

    it("should run STANDARD consolidation", async () => {
      const stats = await echo.dreamConsolidate(ConsolidationMode.STANDARD);
      expect(stats).toBeDefined();
    });

    it("should emit consolidation event", async () => {
      const p = new Promise((resolve) =>
        echo.once("consolidation", resolve)
      );
      await echo.dreamConsolidate(ConsolidationMode.LIGHT);
      const evt = await p;
      expect(evt.mode).toBe(ConsolidationMode.LIGHT);
      expect(evt.stats).toBeDefined();
    });
  });

  // ─── Pruning ──────────────────────────────────────────────────────────────

  describe("pruning", () => {
    it("should prune and emit event", async () => {
      await echo.store({
        content: "Will persist",
        context: ["persist"],
        decayProfile: DecayProfile.IMMORTAL,
      });

      const prunePromise = new Promise((resolve) =>
        echo.once("prune", resolve)
      );
      const count = echo.prune();
      const evt = await prunePromise;

      expect(typeof count).toBe("number");
      expect(evt.count).toBe(count);
    });
  });

  // ─── Export / Import ──────────────────────────────────────────────────────

  describe("export / import", () => {
    it("should round-trip export and import", async () => {
      await echo.store({
        content: "Exportable memory",
        context: ["export"],
      });
      await echo.store({
        content: "Another exportable",
        context: ["export", "second"],
      });

      const state = echo.exportState();
      expect(state.version).toBe(ECHO_VERSION);
      expect(state.episodes.length).toBe(2);

      // Create fresh instance and import
      const echo2 = new EchoHDRCore();
      await echo2.initialize();

      const imported = await echo2.importState(state);
      expect(imported).toBe(2);

      const recalled = echo2.recall({ context: ["export"] });
      expect(recalled.length).toBe(2);

      await echo2.shutdown();
    });

    it("should handle empty import", async () => {
      const count = await echo.importState({});
      expect(count).toBe(0);
    });
  });

  // ─── Statistics ───────────────────────────────────────────────────────────

  describe("statistics", () => {
    it("should return comprehensive stats", async () => {
      await echo.store({ content: "stat test", context: ["stats"] });

      const stats = echo.getStats();
      expect(stats.version).toBe(ECHO_VERSION);
      expect(stats.initialized).toBe(true);
      expect(stats.episodic).toBeDefined();
      expect(stats.associative).toBeDefined();
      expect(stats.consolidation).toBeDefined();
    });
  });

  // ─── Enums & Constants ────────────────────────────────────────────────────

  describe("re-exported enums", () => {
    it("should export EpisodeType values", () => {
      expect(EpisodeType.EXPERIENCE).toBeDefined();
      expect(EpisodeType.DECISION).toBeDefined();
      expect(EpisodeType.INSIGHT).toBeDefined();
      expect(EpisodeType.MILESTONE).toBeDefined();
    });

    it("should export DecayProfile values", () => {
      expect(DecayProfile.STANDARD).toBeDefined();
      expect(DecayProfile.RESILIENT).toBeDefined();
      expect(DecayProfile.FRAGILE).toBeDefined();
      expect(DecayProfile.IMMORTAL).toBeDefined();
    });

    it("should export ConsolidationMode values", () => {
      expect(ConsolidationMode.LIGHT).toBeDefined();
      expect(ConsolidationMode.STANDARD).toBeDefined();
      expect(ConsolidationMode.DEEP).toBeDefined();
      expect(ConsolidationMode.REM).toBeDefined();
    });

    it("should export version constant", () => {
      expect(ECHO_VERSION).toBe("9.6.0");
    });
  });
});
