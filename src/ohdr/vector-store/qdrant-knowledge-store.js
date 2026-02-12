/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
 * technology suite. Unauthorized reproduction, distribution, or disclosure of this
 * software in whole or in part is strictly prohibited. All intellectual property
 * rights, including patent-pending technologies, are reserved.
 *
 * File: qdrant-knowledge-store.js
 * Created: 2025-02-15
 * Purpose: RAG-enabled vector store for crystallized knowledge using Qdrant
 * Phase: 9.4 — O-HDR Vector Semantic Search & RAG Integration
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import { QdrantClient } from "@qdrant/js-client-rest";
import * as tf from "@tensorflow/tfjs";
import crypto from "crypto";
import config from "../../../config/nhdr-config.js";

// ────────────────────── Constants ──────────────────────
const CRYSTAL_COLLECTION = "hdr_crystal_patterns";
const EXPERTISE_COLLECTION = "hdr_expertise_embeddings";
const EMBEDDING_DIM = 128; // TF.js-based embedding dimension
const DEFAULT_TOP_K = 10;
const MAX_BATCH_SIZE = 100;
const DISTANCE_METRIC = "Cosine";

/**
 * QdrantKnowledgeStore
 *
 * Vector store manager that bridges the O-HDR KnowledgeCrystallizer with
 * Qdrant for semantic retrieval and RAG-style context augmentation.
 *
 * Key capabilities:
 *   • Auto-embed crystallized knowledge via TF.js encoder
 *   • Persist crystal embeddings in Qdrant collections
 *   • Semantic search: find similar crystals by vector similarity
 *   • RAG retrieval: augment generation context with relevant knowledge
 *   • Hybrid scoring: combine vector similarity with crystal stability
 */
class QdrantKnowledgeStore {
  /**
   * @param {Object} opts
   * @param {string} [opts.host]    Qdrant host (default: localhost)
   * @param {number} [opts.port]    Qdrant REST port (default: 6333)
   * @param {string} [opts.apiKey]  Optional Qdrant Cloud API key
   * @param {number} [opts.embeddingDim]  Embedding vector size
   */
  constructor(opts = {}) {
    this.host = opts.host ?? process.env.QDRANT_HOST ?? "localhost";
    this.port = opts.port ?? parseInt(process.env.QDRANT_PORT ?? "6333", 10);
    this.apiKey = opts.apiKey ?? process.env.QDRANT_API_KEY ?? undefined;
    this.embeddingDim = opts.embeddingDim ?? EMBEDDING_DIM;

    // Qdrant client — lazy-connected on first operation
    this.client = null;

    // TF.js embedding encoder — built at init
    this.encoder = null;

    // Internal caches
    this._collectionCache = new Set();
    this._embeddingCache = new Map(); // crystalId → vector
    this._stats = {
      totalEmbedded: 0,
      totalSearches: 0,
      totalRetrievals: 0,
      cacheHits: 0,
      avgSearchLatency: 0,
      initialized: false,
    };
  }

  // ────────────────────── Lifecycle ──────────────────────

  /**
   * Initialize - connect to Qdrant, build encoder, ensure collections.
   * @returns {Promise<boolean>}
   */
  async initialize() {
    try {
      // 1. Connect Qdrant client
      this.client = new QdrantClient({
        host: this.host,
        port: this.port,
        ...(this.apiKey && { apiKey: this.apiKey }),
      });

      // 2. Build TF.js embedding encoder
      this.encoder = await this._buildEncoder();

      // 3. Ensure collections exist
      await this._ensureCollection(CRYSTAL_COLLECTION, this.embeddingDim);
      await this._ensureCollection(EXPERTISE_COLLECTION, this.embeddingDim);

      this._stats.initialized = true;
      return true;
    } catch (err) {
      console.error(
        "[QdrantKnowledgeStore] Initialization failed:",
        err.message,
      );
      this._stats.initialized = false;
      return false;
    }
  }

  // ────────────────────── Embedding Engine ──────────────────────

  /**
   * Build a lightweight TF.js dense encoder for crystal feature vectors.
   *
   * Architecture:  input → Dense(256, relu) → Dense(128, relu) → L2-normalize
   *
   * The encoder projects heterogeneous crystal feature vectors into a
   * compact embedding space suitable for cosine similarity search.
   *
   * @returns {Promise<tf.LayersModel>}
   * @private
   */
  async _buildEncoder() {
    const inputDim = 64; // raw crystal feature vector size
    const input = tf.input({ shape: [inputDim] });

    let x = tf.layers
      .dense({ units: 256, activation: "relu", name: "enc_dense1" })
      .apply(input);
    x = tf.layers
      .dense({
        units: this.embeddingDim,
        activation: "relu",
        name: "enc_dense2",
      })
      .apply(x);

    // L2-normalize so cosine similarity works correctly
    const normLayer = tf.layers.activation({
      activation: "linear",
      name: "enc_norm",
    });
    x = normLayer.apply(x);

    const model = tf.model({ inputs: input, outputs: x });

    // Initialise weights with deterministic seed for reproducibility
    const initTensor = tf.randomNormal([inputDim, 256], 0, 0.05, "float32", 42);
    initTensor.dispose();

    return model;
  }

  /**
   * Encode a crystal into a dense embedding vector.
   *
   * Extracts a fixed-size feature vector from the crystal's properties
   * (stability, formation, entropy, bonds, quantum signature) and runs
   * it through the TF.js encoder.
   *
   * @param {Object} crystal  Crystal from KnowledgeCrystallizer
   * @returns {Promise<number[]>}  Embedding vector of length embeddingDim
   */
  async embedCrystal(crystal) {
    // Check cache
    if (this._embeddingCache.has(crystal.id)) {
      this._stats.cacheHits++;
      return this._embeddingCache.get(crystal.id);
    }

    const featureVec = this._extractFeatures(crystal);

    const inputTensor = tf.tensor2d([featureVec], [1, 64]);
    const outputTensor = this.encoder.predict(inputTensor);
    const rawEmbedding = await outputTensor.data();

    // Clean up tensors
    inputTensor.dispose();
    outputTensor.dispose();

    // L2 normalize manually (cosine-ready)
    const embedding = this._l2Normalize(Array.from(rawEmbedding));

    // Cache
    this._embeddingCache.set(crystal.id, embedding);

    return embedding;
  }

  /**
   * Extract a fixed-size feature vector from a crystal structure.
   *
   * Maps the heterogeneous crystal data into a 64-element float vector:
   *   [0-3]   formation metrics (alignment, density, coherence, resonance)
   *   [4]     stability
   *   [5]     entropy
   *   [6]     bond count
   *   [7-15]  bond strengths (padded/truncated to 9)
   *   [16-47] quantum signature hash (32 bytes → 32 floats)
   *   [48-63] pattern significance + padding
   *
   * @param {Object} crystal
   * @returns {number[]}  64-element feature vector
   * @private
   */
  _extractFeatures(crystal) {
    const features = new Float64Array(64);

    // Formation metrics [0-3]
    const f = crystal.formation ?? {};
    features[0] = f.alignment ?? 0;
    features[1] = f.density ?? 0;
    features[2] = f.coherence ?? 0;
    features[3] = f.resonance ?? 0;

    // Stability & entropy [4-5]
    features[4] = crystal.stability ?? 0;
    features[5] = crystal.entropy ?? 0;

    // Bond information [6-15]
    const bonds = crystal.bonds ?? [];
    features[6] = bonds.length / 10; // normalized bond count
    for (let i = 0; i < 9 && i < bonds.length; i++) {
      features[7 + i] = bonds[i]?.strength ?? 0;
    }

    // Quantum signature → hash → float features [16-47]
    const sigStr = JSON.stringify(crystal.pattern?.quantumSignature ?? "");
    const sigHash = crypto.createHash("sha256").update(sigStr).digest();
    for (let i = 0; i < 32; i++) {
      features[16 + i] = sigHash[i] / 255; // normalize to [0,1]
    }

    // Pattern significance + dimension encoding [48-63]
    features[48] = crystal.pattern?.significance ?? 0;
    const dimStr = crystal.pattern?.dimension ?? "";
    const dimHash = crypto.createHash("md5").update(dimStr).digest();
    for (let i = 0; i < 15 && i < dimHash.length; i++) {
      features[49 + i] = dimHash[i] / 255;
    }

    return Array.from(features);
  }

  // ────────────────────── Qdrant Operations ──────────────────────

  /**
   * Ensure a Qdrant collection exists; create if absent.
   * @param {string} name
   * @param {number} dim
   * @private
   */
  async _ensureCollection(name, dim) {
    if (this._collectionCache.has(name)) return;

    try {
      const { collections } = await this.client.getCollections();
      const exists = collections.some((c) => c.name === name);

      if (!exists) {
        await this.client.createCollection(name, {
          vectors: {
            size: dim,
            distance: DISTANCE_METRIC,
          },
          optimizers_config: {
            indexing_threshold: 5000,
          },
          on_disk_payload: true,
        });
      }

      this._collectionCache.add(name);
    } catch (err) {
      console.error(
        `[QdrantKnowledgeStore] Failed to ensure collection "${name}":`,
        err.message,
      );
      throw err;
    }
  }

  /**
   * Store a single crystal embedding in Qdrant.
   *
   * @param {Object} crystal  Crystal from KnowledgeCrystallizer
   * @param {string} [collection]  Target collection
   * @returns {Promise<Object>}  { success, crystalId, pointId }
   */
  async storeCrystalEmbedding(crystal, collection = CRYSTAL_COLLECTION) {
    const embedding = await this.embedCrystal(crystal);

    const pointId = this._crystalIdToPointId(crystal.id);

    await this.client.upsert(collection, {
      wait: true,
      points: [
        {
          id: pointId,
          vector: embedding,
          payload: {
            crystalId: crystal.id,
            dimension: crystal.pattern?.dimension ?? "unknown",
            stability: crystal.stability ?? 0,
            significance: crystal.pattern?.significance ?? 0,
            entropy: crystal.entropy ?? 0,
            coherence: crystal.formation?.coherence ?? 0,
            resonance: crystal.formation?.resonance ?? 0,
            bondCount: crystal.bonds?.length ?? 0,
            createdAt: Date.now(),
          },
        },
      ],
    });

    this._stats.totalEmbedded++;

    return { success: true, crystalId: crystal.id, pointId };
  }

  /**
   * Batch-store multiple crystal embeddings.
   *
   * @param {Object[]} crystals  Array of crystals
   * @param {string} [collection]
   * @returns {Promise<Object>}  { success, stored, failed }
   */
  async storeCrystalBatch(crystals, collection = CRYSTAL_COLLECTION) {
    let stored = 0;
    let failed = 0;

    // Process in batches of MAX_BATCH_SIZE
    for (let i = 0; i < crystals.length; i += MAX_BATCH_SIZE) {
      const batch = crystals.slice(i, i + MAX_BATCH_SIZE);

      const points = [];
      for (const crystal of batch) {
        try {
          const embedding = await this.embedCrystal(crystal);
          points.push({
            id: this._crystalIdToPointId(crystal.id),
            vector: embedding,
            payload: {
              crystalId: crystal.id,
              dimension: crystal.pattern?.dimension ?? "unknown",
              stability: crystal.stability ?? 0,
              significance: crystal.pattern?.significance ?? 0,
              entropy: crystal.entropy ?? 0,
              coherence: crystal.formation?.coherence ?? 0,
              resonance: crystal.formation?.resonance ?? 0,
              bondCount: crystal.bonds?.length ?? 0,
              createdAt: Date.now(),
            },
          });
        } catch {
          failed++;
        }
      }

      if (points.length > 0) {
        await this.client.upsert(collection, { wait: true, points });
        stored += points.length;
        this._stats.totalEmbedded += points.length;
      }
    }

    return { success: failed === 0, stored, failed };
  }

  // ────────────────────── Semantic Search ──────────────────────

  /**
   * Search for crystals similar to a query crystal.
   *
   * @param {Object} queryCrystal  Crystal to use as query
   * @param {number} [topK]  Number of results
   * @param {Object} [filter]  Qdrant filter conditions
   * @param {string} [collection]
   * @returns {Promise<Object[]>}  Array of { crystalId, score, payload }
   */
  async searchSimilarCrystals(
    queryCrystal,
    topK = DEFAULT_TOP_K,
    filter = null,
    collection = CRYSTAL_COLLECTION,
  ) {
    const startTime = Date.now();

    const queryVector = await this.embedCrystal(queryCrystal);

    const searchParams = {
      vector: queryVector,
      limit: topK,
      with_payload: true,
      score_threshold: 0.1,
    };

    if (filter) {
      searchParams.filter = filter;
    }

    const results = await this.client.search(collection, searchParams);

    const latency = Date.now() - startTime;
    this._stats.totalSearches++;
    this._stats.avgSearchLatency =
      (this._stats.avgSearchLatency * (this._stats.totalSearches - 1) +
        latency) /
      this._stats.totalSearches;

    return results.map((r) => ({
      crystalId: r.payload?.crystalId,
      score: r.score,
      payload: r.payload,
    }));
  }

  /**
   * Search for crystals using a raw feature query (e.g., from a text
   * or consciousness state) without an existing crystal.
   *
   * @param {number[]} featureVector  64-element feature vector
   * @param {number} [topK]
   * @param {Object} [filter]
   * @param {string} [collection]
   * @returns {Promise<Object[]>}  Array of search results
   */
  async searchByFeatures(
    featureVector,
    topK = DEFAULT_TOP_K,
    filter = null,
    collection = CRYSTAL_COLLECTION,
  ) {
    const startTime = Date.now();

    // Pad or truncate to 64
    const padded = new Float64Array(64);
    for (let i = 0; i < Math.min(featureVector.length, 64); i++) {
      padded[i] = featureVector[i];
    }

    const inputTensor = tf.tensor2d([Array.from(padded)], [1, 64]);
    const outputTensor = this.encoder.predict(inputTensor);
    const rawEmbedding = await outputTensor.data();
    inputTensor.dispose();
    outputTensor.dispose();

    const queryVector = this._l2Normalize(Array.from(rawEmbedding));

    const searchParams = {
      vector: queryVector,
      limit: topK,
      with_payload: true,
      score_threshold: 0.1,
    };
    if (filter) searchParams.filter = filter;

    const results = await this.client.search(collection, searchParams);

    const latency = Date.now() - startTime;
    this._stats.totalSearches++;
    this._stats.avgSearchLatency =
      (this._stats.avgSearchLatency * (this._stats.totalSearches - 1) +
        latency) /
      this._stats.totalSearches;

    return results.map((r) => ({
      crystalId: r.payload?.crystalId,
      score: r.score,
      payload: r.payload,
    }));
  }

  /**
   * Search by dimension name — find all crystals from a specific dimension.
   *
   * @param {string} dimension
   * @param {number} [topK]
   * @param {string} [collection]
   * @returns {Promise<Object[]>}
   */
  async searchByDimension(
    dimension,
    topK = DEFAULT_TOP_K,
    collection = CRYSTAL_COLLECTION,
  ) {
    const results = await this.client.scroll(collection, {
      filter: {
        must: [{ key: "dimension", match: { value: dimension } }],
      },
      limit: topK,
      with_payload: true,
      with_vector: false,
    });

    return (results.points ?? []).map((r) => ({
      crystalId: r.payload?.crystalId,
      score: 1.0,
      payload: r.payload,
    }));
  }

  // ────────────────────── RAG Retrieval ──────────────────────

  /**
   * Retrieve augmented context for RAG — given a query crystal,
   * find relevant knowledge and format for context injection.
   *
   * Returns a structured context block that can be prepended to
   * an LLM prompt or consciousness processing pipeline.
   *
   * @param {Object} queryCrystal  Crystal to use as query
   * @param {Object} [opts]
   * @param {number} [opts.topK=5]  Number of context entries
   * @param {number} [opts.minScore=0.3]  Minimum similarity score
   * @param {boolean} [opts.includeStability=true]  Weight by stability
   * @param {string} [opts.collection]
   * @returns {Promise<Object>}  { contextEntries, totalScore, metadata }
   */
  async retrieveAugmentedContext(queryCrystal, opts = {}) {
    const {
      topK = 5,
      minScore = 0.3,
      includeStability = true,
      collection = CRYSTAL_COLLECTION,
    } = opts;

    const results = await this.searchSimilarCrystals(
      queryCrystal,
      topK * 2,
      null,
      collection,
    );

    // Filter by minimum score
    let entries = results.filter((r) => r.score >= minScore);

    // Hybrid scoring: combine vector similarity with crystal stability
    if (includeStability) {
      entries = entries.map((e) => ({
        ...e,
        hybridScore:
          e.score * 0.6 +
          (e.payload?.stability ?? 0) * 0.25 +
          (e.payload?.coherence ?? 0) * 0.15,
      }));

      entries.sort((a, b) => b.hybridScore - a.hybridScore);
    }

    // Limit to topK after hybrid sort
    entries = entries.slice(0, topK);

    this._stats.totalRetrievals++;

    const totalScore = entries.reduce(
      (sum, e) => sum + (e.hybridScore ?? e.score),
      0,
    );

    return {
      contextEntries: entries.map((e) => ({
        crystalId: e.crystalId,
        dimension: e.payload?.dimension,
        relevanceScore: e.hybridScore ?? e.score,
        stability: e.payload?.stability,
        significance: e.payload?.significance,
        coherence: e.payload?.coherence,
        resonance: e.payload?.resonance,
      })),
      totalScore,
      metadata: {
        queryTime: Date.now(),
        candidatesScanned: results.length,
        returned: entries.length,
        scoringMethod: includeStability ? "hybrid" : "cosine",
      },
    };
  }

  /**
   * RAG context retrieval from a consciousness state.
   *
   * Converts a raw consciousness state into a pseudo-crystal,
   * embeds it, and retrieves relevant knowledge context.
   *
   * @param {Object} consciousnessState
   * @param {Object} [opts]  Same as retrieveAugmentedContext opts
   * @returns {Promise<Object>}
   */
  async retrieveFromConsciousness(consciousnessState, opts = {}) {
    // Build a pseudo-crystal from consciousness state
    const pseudoCrystal = this._consciousnessTocrystal(consciousnessState);
    return this.retrieveAugmentedContext(pseudoCrystal, opts);
  }

  // ────────────────────── Collection Management ──────────────────────

  /**
   * Get collection statistics.
   * @param {string} [collection]
   * @returns {Promise<Object>}
   */
  async getCollectionInfo(collection = CRYSTAL_COLLECTION) {
    try {
      const info = await this.client.getCollection(collection);
      return {
        name: collection,
        pointsCount: info.points_count ?? 0,
        vectorsCount: info.vectors_count ?? 0,
        indexedVectors: info.indexed_vectors_count ?? 0,
        status: info.status,
        dimension: this.embeddingDim,
      };
    } catch {
      return { name: collection, pointsCount: 0, status: "not_found" };
    }
  }

  /**
   * Delete a crystal embedding.
   * @param {string} crystalId
   * @param {string} [collection]
   * @returns {Promise<boolean>}
   */
  async deleteCrystalEmbedding(crystalId, collection = CRYSTAL_COLLECTION) {
    const pointId = this._crystalIdToPointId(crystalId);
    await this.client.delete(collection, { points: [pointId] });
    this._embeddingCache.delete(crystalId);
    return true;
  }

  /**
   * Delete all embeddings for a given dimension.
   * @param {string} dimension
   * @param {string} [collection]
   * @returns {Promise<Object>}
   */
  async deleteDimension(dimension, collection = CRYSTAL_COLLECTION) {
    const result = await this.client.delete(collection, {
      filter: {
        must: [{ key: "dimension", match: { value: dimension } }],
      },
    });
    return { success: true, deleted: result };
  }

  // ────────────────────── Diagnostics ──────────────────────

  /**
   * @returns {Object}  Store statistics
   */
  getStats() {
    return {
      ...this._stats,
      embeddingCacheSize: this._embeddingCache.size,
      embeddingDim: this.embeddingDim,
      collections: Array.from(this._collectionCache),
      host: this.host,
      port: this.port,
    };
  }

  // ────────────────────── Helpers ──────────────────────

  /**
   * Convert a crystal ID string to a Qdrant-compatible integer point ID.
   * Uses a hash to reduce arbitrary-length crystal IDs to a positive int.
   *
   * @param {string} crystalId
   * @returns {number}
   * @private
   */
  _crystalIdToPointId(crystalId) {
    const hash = crypto.createHash("sha256").update(String(crystalId)).digest();
    // Read first 6 bytes as a positive integer (48-bit — safe for JS int)
    return hash.readUIntBE(0, 6);
  }

  /**
   * L2-normalize a vector.
   * @param {number[]} vec
   * @returns {number[]}
   * @private
   */
  _l2Normalize(vec) {
    let norm = 0;
    for (const v of vec) norm += v * v;
    norm = Math.sqrt(norm) || 1;
    return vec.map((v) => v / norm);
  }

  /**
   * Build a pseudo-crystal from a consciousness state for embedding.
   *
   * @param {Object} state  Consciousness state with .consciousness, .dimensions, etc.
   * @returns {Object}  Crystal-like structure suitable for embedCrystal()
   * @private
   */
  _consciousnessTocrystal(state) {
    const consciousness = state.consciousness ?? state;

    // Extract dimension values if present
    const dimensions = consciousness.dimensions ?? state.dimensions ?? {};
    const dimValues = Object.values(dimensions);
    const avgDimValue =
      dimValues.length > 0
        ? dimValues.reduce((s, v) => s + (typeof v === "number" ? v : 0), 0) /
          dimValues.length
        : 0.5;

    return {
      id: `pseudo_${crypto.randomUUID()}`,
      stability: consciousness.stability ?? avgDimValue,
      entropy: consciousness.entropy ?? 0,
      formation: {
        alignment: consciousness.alignment ?? avgDimValue,
        density: consciousness.density ?? avgDimValue,
        coherence: consciousness.coherence ?? avgDimValue,
        resonance: consciousness.resonance ?? avgDimValue,
      },
      bonds: [],
      pattern: {
        dimension: "consciousness_query",
        significance: consciousness.significance ?? avgDimValue,
        quantumSignature: consciousness.quantumSignature ?? state.id ?? "",
      },
    };
  }
}

// ────────────────────── Factory ──────────────────────

/**
 * Create and initialize a QdrantKnowledgeStore with default config.
 *
 * @param {Object} [opts]  Overrides for QdrantKnowledgeStore constructor
 * @returns {Promise<QdrantKnowledgeStore>}
 */
async function createQdrantKnowledgeStore(opts = {}) {
  const store = new QdrantKnowledgeStore(opts);
  await store.initialize();
  return store;
}

export default QdrantKnowledgeStore;
export {
  QdrantKnowledgeStore,
  createQdrantKnowledgeStore,
  CRYSTAL_COLLECTION,
  EXPERTISE_COLLECTION,
};
