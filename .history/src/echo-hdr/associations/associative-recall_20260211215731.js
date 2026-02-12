/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * File: src/echo-hdr/associations/associative-recall.js
 * Created: 2026-02
 * Purpose: Context-based associative retrieval with Qdrant vector search
 *          and emotional tagging for the ECHO-HDR temporal memory system
 * Phase: 9.6 — ECHO-HDR Temporal Memory System
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import crypto from "crypto";
import * as tf from "@tensorflow/tfjs";

// ────────────────────── Constants ──────────────────────

const EMBEDDING_DIM = 128;
const DEFAULT_TOP_K = 15;
const ECHO_COLLECTION = "echo_hdr_associations";
const SIMILARITY_THRESHOLD = 0.55;
const MAX_CHAIN_DEPTH = 5;
const MAX_CHAIN_RESULTS = 50;

/**
 * Association types describe the nature of a link between memories.
 */
const AssociationType = Object.freeze({
  SEMANTIC: "semantic",       // Content similarity
  TEMPORAL: "temporal",       // Close in time
  CAUSAL: "causal",           // Cause-effect relationship
  EMOTIONAL: "emotional",     // Similar emotional signature
  CONTEXTUAL: "contextual",   // Shared context tags
  USER_DEFINED: "user_defined", // Explicitly linked by system/user
});

// ────────────────────── Associative Recall ──────────────────────

/**
 * AssociativeRecall
 *
 * Vector-based associative memory retrieval that:
 *   • Embeds episode content into a shared vector space (TF.js encoder)
 *   • Stores embeddings in Qdrant for fast similarity search
 *   • Supports multi-hop association chaining (A → B → C)
 *   • Combines semantic similarity with emotional resonance scoring
 *   • Falls back to in-memory brute-force when Qdrant is unavailable
 */
class AssociativeRecall {
  /**
   * @param {Object} [opts]
   * @param {Object} [opts.qdrantClient]     Pre-configured QdrantClient instance
   * @param {number} [opts.embeddingDim]     Vector dimension
   * @param {number} [opts.topK]             Default result count
   * @param {number} [opts.similarityThreshold] Min score for matches
   */
  constructor(opts = {}) {
    this.qdrantClient = opts.qdrantClient ?? null;
    this.embeddingDim = opts.embeddingDim ?? EMBEDDING_DIM;
    this.topK = opts.topK ?? DEFAULT_TOP_K;
    this.similarityThreshold = opts.similarityThreshold ?? SIMILARITY_THRESHOLD;

    /** @type {boolean} Whether Qdrant is available */
    this.vectorStoreReady = false;

    /** @type {tf.Sequential|null} TF.js encoder model */
    this.encoder = null;

    /** @type {Map<string, Float32Array>} In-memory fallback: id → embedding */
    this._localEmbeddings = new Map();

    /** @type {Map<string, Object>} id → emotional metadata */
    this._emotionalIndex = new Map();

    this._initialized = false;
  }

  // ────────────────── Initialization ──────────────────

  /**
   * Initialize the encoder and (optionally) the Qdrant collection.
   */
  async initialize() {
    if (this._initialized) return;

    // Build encoder
    this.encoder = this._buildEncoder();

    // Attempt Qdrant setup
    if (this.qdrantClient) {
      try {
        await this._ensureCollection();
        this.vectorStoreReady = true;
      } catch (_err) {
        this.vectorStoreReady = false;
      }
    }

    this._initialized = true;
  }

  // ────────────────── Embed & Store ──────────────────

  /**
   * Embed an episode and store it for future associative retrieval.
   *
   * @param {Object} episode       Episode from EpisodicEngine
   * @returns {Promise<Float32Array>} The computed embedding
   */
  async embed(episode) {
    await this._ensureInitialized();

    const text = this._episodeToText(episode);
    const embedding = await this._encode(text);

    // Store emotional metadata
    this._emotionalIndex.set(episode.id, {
      significance: episode.temporal?.emotional?.significance ?? 0.5,
      urgency: episode.temporal?.emotional?.urgency ?? 0,
      resonance: episode.temporal?.emotional?.resonance ?? 0,
    });

    if (this.vectorStoreReady) {
      try {
        await this.qdrantClient.upsert(ECHO_COLLECTION, {
          wait: true,
          points: [
            {
              id: this._hashToInt(episode.id),
              vector: Array.from(embedding),
              payload: {
                episodeId: episode.id,
                type: episode.type,
                context: episode.context ?? [],
                significance: episode.temporal?.emotional?.significance ?? 0.5,
                urgency: episode.temporal?.emotional?.urgency ?? 0,
                resonance: episode.temporal?.emotional?.resonance ?? 0,
                createdAt: episode.createdAt ?? Date.now(),
              },
            },
          ],
        });
      } catch (_err) {
        // Fall back to local storage
        this._localEmbeddings.set(episode.id, embedding);
      }
    } else {
      this._localEmbeddings.set(episode.id, embedding);
    }

    return embedding;
  }

  /**
   * Batch embed multiple episodes.
   *
   * @param {Object[]} episodes
   * @returns {Promise<number>} Count of successfully embedded episodes
   */
  async embedBatch(episodes) {
    let count = 0;
    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < episodes.length; i += batchSize) {
      const batch = episodes.slice(i, i + batchSize);
      const promises = batch.map((ep) => this.embed(ep).catch(() => null));
      const results = await Promise.all(promises);
      count += results.filter(Boolean).length;
    }
    return count;
  }

  // ────────────────── Search & Recall ──────────────────

  /**
   * Find episodes most similar to a text query.
   *
   * @param {string}   query        Natural language query
   * @param {Object}   [opts]
   * @param {number}   [opts.topK]  Max results
   * @param {number}   [opts.minScore] Minimum similarity score
   * @param {Object}   [opts.emotionalFilter]  { minSignificance, minResonance }
   * @returns {Promise<Object[]>}   Scored results [{ episodeId, score, payload }]
   */
  async search(query, opts = {}) {
    await this._ensureInitialized();

    const topK = opts.topK ?? this.topK;
    const minScore = opts.minScore ?? this.similarityThreshold;
    const queryEmbedding = await this._encode(query);

    let results;

    if (this.vectorStoreReady) {
      try {
        results = await this._qdrantSearch(queryEmbedding, topK, opts);
      } catch (_err) {
        results = this._localSearch(queryEmbedding, topK);
      }
    } else {
      results = this._localSearch(queryEmbedding, topK);
    }

    // Apply emotional filter
    if (opts.emotionalFilter) {
      results = results.filter((r) => {
        const sig = r.payload?.significance ?? 0;
        const res = r.payload?.resonance ?? 0;
        if (opts.emotionalFilter.minSignificance && sig < opts.emotionalFilter.minSignificance) return false;
        if (opts.emotionalFilter.minResonance && res < opts.emotionalFilter.minResonance) return false;
        return true;
      });
    }

    // Filter by minimum score
    results = results.filter((r) => r.score >= minScore);

    return results;
  }

  /**
   * Find episodes similar to an existing episode by its ID.
   *
   * @param {string}   episodeId
   * @param {number}   [topK]
   * @returns {Promise<Object[]>}
   */
  async searchByEpisode(episodeId, topK) {
    await this._ensureInitialized();

    const k = topK ?? this.topK;
    let embedding = this._localEmbeddings.get(episodeId);

    if (!embedding && this.vectorStoreReady) {
      // Attempt to get from Qdrant
      try {
        const points = await this.qdrantClient.retrieve(ECHO_COLLECTION, {
          ids: [this._hashToInt(episodeId)],
          with_vector: true,
        });
        if (points.length > 0 && points[0].vector) {
          embedding = new Float32Array(points[0].vector);
        }
      } catch (_err) {
        // not found
      }
    }

    if (!embedding) return [];

    if (this.vectorStoreReady) {
      try {
        return await this._qdrantSearch(embedding, k + 1, {});
      } catch (_err) {
        return this._localSearch(embedding, k + 1);
      }
    }

    return this._localSearch(embedding, k + 1)
      .filter((r) => r.episodeId !== episodeId); // exclude self
  }

  /**
   * Multi-hop association chain: starting from a query, walk the
   * association graph following semantic similarity.
   *
   * @param {string}   query
   * @param {number}   [depth]    Chain depth (default 3)
   * @param {number}   [branchFactor]  Top-K at each hop (default 3)
   * @returns {Promise<Object[]>}  Chain of associated results with hop depth
   */
  async chainSearch(query, depth = 3, branchFactor = 3) {
    await this._ensureInitialized();

    const visited = new Set();
    const allResults = [];

    const queryEmbedding = await this._encode(query);
    let currentEmbeddings = [{ embedding: queryEmbedding, depth: 0 }];

    for (let d = 1; d <= Math.min(depth, MAX_CHAIN_DEPTH); d++) {
      const nextEmbeddings = [];

      for (const { embedding } of currentEmbeddings) {
        let hits;
        if (this.vectorStoreReady) {
          try {
            hits = await this._qdrantSearch(embedding, branchFactor, {});
          } catch (_err) {
            hits = this._localSearch(embedding, branchFactor);
          }
        } else {
          hits = this._localSearch(embedding, branchFactor);
        }

        for (const hit of hits) {
          const eid = hit.episodeId ?? hit.payload?.episodeId;
          if (!eid || visited.has(eid)) continue;
          visited.add(eid);

          allResults.push({ ...hit, hopDepth: d });

          // Get this hit's embedding for next hop
          const emb = this._localEmbeddings.get(eid);
          if (emb) {
            nextEmbeddings.push({ embedding: emb, depth: d });
          }
        }
      }

      if (nextEmbeddings.length === 0 || allResults.length >= MAX_CHAIN_RESULTS) break;
      currentEmbeddings = nextEmbeddings;
    }

    return allResults;
  }

  /**
   * Compute a hybrid relevance score combining vector similarity
   * and emotional resonance.
   *
   * @param {number} vectorScore    Cosine similarity (0-1)
   * @param {Object} emotional      { significance, urgency, resonance }
   * @returns {number}              Final score (0-1)
   */
  hybridScore(vectorScore, emotional) {
    const sig = emotional?.significance ?? 0;
    const urg = emotional?.urgency ?? 0;
    const res = emotional?.resonance ?? 0;

    // 60% vector similarity + 25% significance + 10% resonance + 5% urgency
    return (
      0.60 * vectorScore +
      0.25 * sig +
      0.10 * res +
      0.05 * urg
    );
  }

  // ────────────────── Statistics ──────────────────

  /**
   * Get associative recall component statistics.
   */
  getStats() {
    return {
      initialized: this._initialized,
      vectorStoreReady: this.vectorStoreReady,
      localEmbeddingsCount: this._localEmbeddings.size,
      emotionalIndexCount: this._emotionalIndex.size,
      embeddingDim: this.embeddingDim,
      collection: ECHO_COLLECTION,
    };
  }

  // ────────────────── Internal: Encoder ──────────────────

  _buildEncoder() {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        inputShape: [64],
        units: 256,
        activation: "relu",
      })
    );
    model.add(
      tf.layers.dense({
        units: this.embeddingDim,
        activation: "relu",
      })
    );
    return model;
  }

  async _encode(text) {
    return tf.tidy(() => {
      // Convert text to a fixed-size numeric representation
      const raw = new Float32Array(64);
      const str = typeof text === "string" ? text : JSON.stringify(text ?? "");

      for (let i = 0; i < 64; i++) {
        let val = 0;
        for (let j = i; j < str.length; j += 64) {
          val += str.charCodeAt(j) / 256;
        }
        raw[i] = val / Math.max(1, Math.ceil(str.length / 64));
      }

      const input = tf.tensor2d([raw], [1, 64]);
      const output = this.encoder.predict(input);
      // L2 normalize
      const norm = output.norm();
      const normalized = output.div(norm.add(1e-8));
      return normalized.dataSync();
    });
  }

  _episodeToText(episode) {
    const parts = [];
    if (episode.content) {
      parts.push(typeof episode.content === "string"
        ? episode.content
        : JSON.stringify(episode.content));
    }
    if (Array.isArray(episode.context)) {
      parts.push(episode.context.join(" "));
    }
    if (episode.type) {
      parts.push(episode.type);
    }
    return parts.join(" | ");
  }

  // ────────────────── Internal: Qdrant ──────────────────

  async _ensureCollection() {
    const collections = await this.qdrantClient.getCollections();
    const exists = collections.collections?.some(
      (c) => c.name === ECHO_COLLECTION
    );

    if (!exists) {
      await this.qdrantClient.createCollection(ECHO_COLLECTION, {
        vectors: {
          size: this.embeddingDim,
          distance: "Cosine",
        },
        optimizers_config: {
          memmap_threshold: 20000,
        },
      });
    }
  }

  async _qdrantSearch(embedding, topK, _opts) {
    const response = await this.qdrantClient.search(ECHO_COLLECTION, {
      vector: Array.from(embedding),
      limit: topK,
      with_payload: true,
      score_threshold: this.similarityThreshold,
    });

    return response.map((hit) => ({
      episodeId: hit.payload?.episodeId,
      score: hit.score,
      payload: hit.payload ?? {},
    }));
  }

  // ────────────────── Internal: Local Search ──────────────────

  _localSearch(queryEmbedding, topK) {
    const scored = [];

    for (const [id, emb] of this._localEmbeddings) {
      const sim = this._cosineSimilarity(queryEmbedding, emb);
      const emotional = this._emotionalIndex.get(id) ?? {};
      const hybrid = this.hybridScore(sim, emotional);

      scored.push({
        episodeId: id,
        score: hybrid,
        vectorScore: sim,
        payload: {
          episodeId: id,
          ...(emotional),
        },
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  _cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom > 0 ? dot / denom : 0;
  }

  // ────────────────── Internal: Util ──────────────────

  _hashToInt(str) {
    // Deterministic 64-bit integer from string for Qdrant point ID
    const hash = crypto.createHash("sha256").update(str).digest();
    // Use first 8 bytes as unsigned big-endian integer
    return Number(hash.readBigUInt64BE(0) & BigInt("0x7FFFFFFFFFFFFFFF"));
  }

  async _ensureInitialized() {
    if (!this._initialized) await this.initialize();
  }
}

// ────────────────────── Exports ──────────────────────

export { AssociationType, ECHO_COLLECTION };
export default AssociativeRecall;
