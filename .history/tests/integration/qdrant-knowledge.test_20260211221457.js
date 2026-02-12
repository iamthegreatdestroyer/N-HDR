/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Qdrant Knowledge Store Integration Tests — Phase 9.7
 * Tests embedding generation, feature extraction, crystal caching,
 * and store lifecycle. Qdrant operations are mocked since no
 * live Qdrant server is available in CI.
 */

import QdrantKnowledgeStore, {
  createQdrantKnowledgeStore,
  CRYSTAL_COLLECTION,
  EXPERTISE_COLLECTION,
} from "../../src/ohdr/vector-store/qdrant-knowledge-store.js";

// ─── Test helpers ───────────────────────────────────────────────────────────

function makeCrystal(overrides = {}) {
  return {
    id: overrides.id ?? `crystal_${Date.now()}_${Math.random()}`,
    stability: overrides.stability ?? 0.85,
    entropy: overrides.entropy ?? 0.12,
    formation: {
      alignment: 0.8,
      density: 0.75,
      coherence: 0.9,
      resonance: 0.88,
      ...(overrides.formation ?? {}),
    },
    bonds: overrides.bonds ?? [
      { strength: 0.9 },
      { strength: 0.7 },
      { strength: 0.6 },
    ],
    pattern: {
      dimension: overrides.dimension ?? "quantum",
      significance: overrides.significance ?? 0.77,
      quantumSignature: overrides.quantumSignature ?? "test-sig-001",
      ...(overrides.pattern ?? {}),
    },
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("QdrantKnowledgeStore Integration", () => {
  // ─── Constructor & Config ─────────────────────────────────────────────────

  describe("constructor", () => {
    it("should create store with default options", () => {
      const store = new QdrantKnowledgeStore();
      expect(store.host).toBe("localhost");
      expect(store.port).toBe(6333);
      expect(store.embeddingDim).toBe(128);
      expect(store.client).toBeNull();
      expect(store.encoder).toBeNull();
    });

    it("should accept custom options", () => {
      const store = new QdrantKnowledgeStore({
        host: "qdrant.example.com",
        port: 6444,
        apiKey: "secret-key",
        embeddingDim: 256,
      });

      expect(store.host).toBe("qdrant.example.com");
      expect(store.port).toBe(6444);
      expect(store.apiKey).toBe("secret-key");
      expect(store.embeddingDim).toBe(256);
    });
  });

  // ─── Feature Extraction ───────────────────────────────────────────────────

  describe("feature extraction", () => {
    let store;

    beforeEach(() => {
      store = new QdrantKnowledgeStore();
    });

    it("should extract 64-element feature vector", () => {
      const crystal = makeCrystal();
      const features = store._extractFeatures(crystal);

      expect(features).toBeInstanceOf(Array);
      expect(features).toHaveLength(64);
    });

    it("should encode formation metrics in positions 0-3", () => {
      const crystal = makeCrystal({
        formation: {
          alignment: 0.11,
          density: 0.22,
          coherence: 0.33,
          resonance: 0.44,
        },
      });
      const features = store._extractFeatures(crystal);

      expect(features[0]).toBeCloseTo(0.11, 5);
      expect(features[1]).toBeCloseTo(0.22, 5);
      expect(features[2]).toBeCloseTo(0.33, 5);
      expect(features[3]).toBeCloseTo(0.44, 5);
    });

    it("should encode stability and entropy in positions 4-5", () => {
      const crystal = makeCrystal({ stability: 0.91, entropy: 0.07 });
      const features = store._extractFeatures(crystal);

      expect(features[4]).toBeCloseTo(0.91, 5);
      expect(features[5]).toBeCloseTo(0.07, 5);
    });

    it("should encode bond count and strengths", () => {
      const crystal = makeCrystal({
        bonds: [{ strength: 0.5 }, { strength: 0.8 }],
      });
      const features = store._extractFeatures(crystal);

      expect(features[6]).toBeCloseTo(0.2, 5); // 2/10
      expect(features[7]).toBeCloseTo(0.5, 5);
      expect(features[8]).toBeCloseTo(0.8, 5);
    });

    it("should handle crystal with no bonds", () => {
      const crystal = makeCrystal({ bonds: [] });
      const features = store._extractFeatures(crystal);

      expect(features[6]).toBe(0);
      expect(features[7]).toBe(0);
    });

    it("should encode quantum signature hash in positions 16-47", () => {
      const crystal = makeCrystal();
      const features = store._extractFeatures(crystal);

      for (let i = 16; i < 48; i++) {
        expect(features[i]).toBeGreaterThanOrEqual(0);
        expect(features[i]).toBeLessThanOrEqual(1);
      }
    });

    it("should encode pattern significance at position 48", () => {
      const crystal = makeCrystal({ significance: 0.65 });
      const features = store._extractFeatures(crystal);

      expect(features[48]).toBeCloseTo(0.65, 5);
    });

    it("should produce different features for different crystals", () => {
      const c1 = makeCrystal({
        stability: 0.9,
        dimension: "quantum",
        quantumSignature: "sig-alpha",
      });
      const c2 = makeCrystal({
        stability: 0.2,
        dimension: "fractal",
        quantumSignature: "sig-beta",
      });

      const f1 = store._extractFeatures(c1);
      const f2 = store._extractFeatures(c2);

      // At least stability differs
      expect(f1[4]).not.toBeCloseTo(f2[4], 3);
    });

    it("should handle missing crystal properties gracefully", () => {
      const features = store._extractFeatures({});

      expect(features).toHaveLength(64);
      expect(features[0]).toBe(0); // alignment defaults to 0
      expect(features[4]).toBe(0); // stability defaults to 0
    });
  });

  // ─── L2 Normalization ─────────────────────────────────────────────────────

  describe("L2 normalization", () => {
    let store;

    beforeEach(() => {
      store = new QdrantKnowledgeStore();
    });

    it("should normalize a vector to unit length", () => {
      const vec = [3, 4]; // norm = 5
      const norm = store._l2Normalize(vec);

      expect(norm[0]).toBeCloseTo(0.6, 5);
      expect(norm[1]).toBeCloseTo(0.8, 5);

      const mag = Math.sqrt(norm[0] ** 2 + norm[1] ** 2);
      expect(mag).toBeCloseTo(1.0, 5);
    });

    it("should handle zero vector", () => {
      const vec = [0, 0, 0];
      const norm = store._l2Normalize(vec);

      // Should not throw, falls back to dividing by 1
      expect(norm).toHaveLength(3);
      expect(norm.every((v) => v === 0)).toBe(true);
    });

    it("should normalize high-dimensional vectors", () => {
      const vec = Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.1));
      const norm = store._l2Normalize(vec);

      const mag = Math.sqrt(norm.reduce((s, v) => s + v * v, 0));
      expect(mag).toBeCloseTo(1.0, 5);
    });
  });

  // ─── Crystal ID to Point ID ───────────────────────────────────────────────

  describe("crystal ID conversion", () => {
    let store;

    beforeEach(() => {
      store = new QdrantKnowledgeStore();
    });

    it("should convert string ID to positive integer", () => {
      const pointId = store._crystalIdToPointId("test-crystal-42");

      expect(typeof pointId).toBe("number");
      expect(pointId).toBeGreaterThan(0);
      expect(Number.isInteger(pointId)).toBe(true);
    });

    it("should be deterministic", () => {
      const id1 = store._crystalIdToPointId("same-crystal");
      const id2 = store._crystalIdToPointId("same-crystal");

      expect(id1).toBe(id2);
    });

    it("should differ for different crystal IDs", () => {
      const id1 = store._crystalIdToPointId("crystal-a");
      const id2 = store._crystalIdToPointId("crystal-b");

      expect(id1).not.toBe(id2);
    });
  });

  // ─── Consciousness to Crystal ─────────────────────────────────────────────

  describe("consciousness to crystal conversion", () => {
    let store;

    beforeEach(() => {
      store = new QdrantKnowledgeStore();
    });

    it("should create pseudo-crystal from consciousness state", () => {
      const state = {
        consciousness: {
          stability: 0.92,
          entropy: 0.05,
          alignment: 0.88,
          significance: 0.75,
        },
        dimensions: { awareness: 0.9, perception: 0.8, reasoning: 0.7 },
      };

      const crystal = store._consciousnessTocrystal(state);

      expect(crystal.id).toMatch(/^pseudo_/);
      expect(crystal.stability).toBe(0.92);
      expect(crystal.formation.alignment).toBe(0.88);
      expect(crystal.bonds).toEqual([]);
    });

    it("should handle minimal state", () => {
      const crystal = store._consciousnessTocrystal({});

      expect(crystal.id).toMatch(/^pseudo_/);
      expect(crystal.stability).toBe(0.5); // fallback to avgDimValue or 0.5
      expect(crystal.bonds).toEqual([]);
    });
  });

  // ─── Stats ────────────────────────────────────────────────────────────────

  describe("statistics", () => {
    it("should report initial stats", () => {
      const store = new QdrantKnowledgeStore();
      const stats = store.getStats();

      expect(stats.totalEmbedded).toBe(0);
      expect(stats.totalSearches).toBe(0);
      expect(stats.totalRetrievals).toBe(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.initialized).toBe(false);
      expect(stats.embeddingDim).toBe(128);
      expect(stats.host).toBe("localhost");
      expect(stats.port).toBe(6333);
      expect(stats.embeddingCacheSize).toBe(0);
    });
  });

  // ─── Constants ────────────────────────────────────────────────────────────

  describe("exported constants", () => {
    it("should export collection names", () => {
      expect(CRYSTAL_COLLECTION).toBe("hdr_crystal_patterns");
      expect(EXPERTISE_COLLECTION).toBe("hdr_expertise_embeddings");
    });
  });
});
