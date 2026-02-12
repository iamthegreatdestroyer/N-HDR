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
 * File: KnowledgeCrystallizer.js
 * Created: 2025-09-30
 * Modified: 2025-02-15 — Phase 9.4: RAG + Qdrant Vector Store Integration
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import SecurityManager from "../core/security/security-manager.js";
import QuantumProcessor from "../core/quantum/quantum-processor.js";
import { QdrantKnowledgeStore } from "./vector-store/qdrant-knowledge-store.js";
import config from "../../config/nhdr-config.js";

/**
 * KnowledgeCrystallizer
 * Manages the crystallization of knowledge patterns and structures from consciousness states.
 */
class KnowledgeCrystallizer {
  constructor() {
    this.security = new SecurityManager();
    this.quantumProcessor = new QuantumProcessor();

    // RAG vector store for semantic retrieval (Phase 9.4)
    this.vectorStore = new QdrantKnowledgeStore({
      host: process.env.QDRANT_HOST ?? "localhost",
      port: parseInt(process.env.QDRANT_PORT ?? "6333", 10),
    });
    this.vectorStoreReady = false;

    // Knowledge crystallization state
    this.crystalPatterns = new Map();
    this.activeFormations = new Set();
    this.stabilityMetrics = new Map();

    // Processing parameters
    this.crystallizationThreshold = config.ohdr.crystallizationThreshold;
    this.stabilityThreshold = config.ohdr.stabilityThreshold;
    this.entropyTolerance = config.ohdr.entropyTolerance;
  }

  /**
   * Initialize crystallization environment
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    await this._validateSecurityContext();
    await this._initializeQuantumState();

    // Initialize Qdrant vector store (non-blocking — degrade gracefully)
    try {
      this.vectorStoreReady = await this.vectorStore.initialize();
    } catch (err) {
      console.warn(
        "[KnowledgeCrystallizer] Vector store unavailable, continuing without RAG:",
        err.message,
      );
      this.vectorStoreReady = false;
    }

    return this._setupCrystallizationEnvironment();
  }

  /**
   * Begin knowledge crystallization process
   * @param {Object} consciousnessState - Input consciousness state
   * @returns {Promise<Object>} Crystallization result
   */
  async crystallize(consciousnessState) {
    try {
      // Validate input state
      await this._validateState(consciousnessState);

      // Extract knowledge patterns
      const patterns = await this._extractPatterns(consciousnessState);

      // Analyze pattern stability
      const stability = await this._analyzeStability(patterns);

      // Form crystal structures
      const crystals = await this._formCrystals(patterns, stability);

      // Validate and store results
      await this._validateAndStore(crystals);

      return {
        success: true,
        crystals,
        patterns: patterns.size,
        stability: this._calculateOverallStability(stability),
      };
    } catch (error) {
      console.error("Crystallization failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate consciousness state input
   * @param {Object} state - Consciousness state to validate
   * @returns {Promise<void>}
   */
  async _validateState(state) {
    if (!state || typeof state !== "object") {
      throw new Error("Invalid consciousness state: must be an object");
    }
    if (!state.consciousness || typeof state.consciousness !== "object") {
      throw new Error(
        "Invalid consciousness state: missing consciousness property",
      );
    }
    return true;
  }

  /**
   * Extract knowledge patterns from consciousness state
   * @private
   * @param {Object} state - Consciousness state
   * @returns {Promise<Map>} Extracted patterns
   */
  async _extractPatterns(state) {
    const patterns = new Map();

    // Process quantum state
    const quantumState = await this.quantumProcessor.processState(state);

    // Extract core patterns
    for (const [dimension, value] of Object.entries(state.dimensions)) {
      const pattern = await this._processPattern(
        dimension,
        value,
        quantumState,
      );
      if (pattern.significance > this.crystallizationThreshold) {
        patterns.set(dimension, pattern);
      }
    }

    return patterns;
  }

  /**
   * Process individual pattern
   * @private
   * @param {string} dimension - Pattern dimension
   * @param {Object} value - Pattern value
   * @param {Object} quantumState - Quantum state context
   * @returns {Promise<Object>} Processed pattern
   */
  async _processPattern(dimension, value, quantumState) {
    const patternData = {
      dimension,
      value,
      timestamp: Date.now(),
      quantumSignature: await this._generateQuantumSignature(
        value,
        quantumState,
      ),
      significance: await this._calculateSignificance(value, dimension),
    };

    return this._enrichPattern(patternData);
  }

  /**
   * Analyze pattern stability
   * @private
   * @param {Map} patterns - Extracted patterns
   * @returns {Promise<Map>} Stability metrics
   */
  async _analyzeStability(patterns) {
    const stability = new Map();

    for (const [dimension, pattern] of patterns.entries()) {
      const metrics = await this._calculateStabilityMetrics(pattern);
      if (metrics.overall >= this.stabilityThreshold) {
        stability.set(dimension, metrics);
      }
    }

    return stability;
  }

  /**
   * Form crystal structures from stable patterns
   * @private
   * @param {Map} patterns - Knowledge patterns
   * @param {Map} stability - Stability metrics
   * @returns {Promise<Array>} Crystal structures
   */
  async _formCrystals(patterns, stability) {
    const crystals = [];

    for (const [dimension, pattern] of patterns.entries()) {
      if (stability.has(dimension)) {
        const crystal = await this._crystallizePattern(
          pattern,
          stability.get(dimension),
        );
        if (crystal) {
          crystals.push(crystal);
        }
      }
    }

    return this._optimizeCrystals(crystals);
  }

  /**
   * Crystallize individual pattern
   * @private
   * @param {Object} pattern - Knowledge pattern
   * @param {Object} stability - Stability metrics
   * @returns {Promise<Object>} Crystal structure
   */
  async _crystallizePattern(pattern, stability) {
    const crystalStructure = {
      id: `crystal-${Date.now()}-${pattern.dimension}`,
      pattern: pattern,
      stability: stability,
      formation: await this._calculateFormation(pattern, stability),
      bonds: await this._analyzeBonds(pattern),
      entropy: await this._calculateEntropy(pattern),
    };

    return this._validateCrystalStructure(crystalStructure)
      ? crystalStructure
      : null;
  }

  /**
   * Calculate crystal formation parameters
   * @private
   * @param {Object} pattern - Knowledge pattern
   * @param {Object} stability - Stability metrics
   * @returns {Promise<Object>} Formation parameters
   */
  async _calculateFormation(pattern, stability) {
    return {
      alignment: await this._calculateAlignment(pattern, stability),
      density: await this._calculateDensity(pattern),
      coherence: await this._calculateCoherence(pattern),
      resonance: await this._calculateResonance(pattern, stability),
    };
  }

  /**
   * Analyze pattern bonds
   * @private
   * @param {Object} pattern - Knowledge pattern
   * @returns {Promise<Array>} Bond analysis
   */
  async _analyzeBonds(pattern) {
    const bonds = [];
    for (const [dim, pat] of this.crystalPatterns) {
      if (dim !== pattern.dimension) {
        const bondStrength = await this._calculateBondStrength(pattern, pat);
        if (bondStrength > this.crystallizationThreshold) {
          bonds.push({ dimension: dim, strength: bondStrength });
        }
      }
    }
    return bonds;
  }

  /**
   * Calculate bond strength between patterns
   * @private
   * @param {Object} pattern1 - First pattern
   * @param {Object} pattern2 - Second pattern
   * @returns {Promise<number>} Bond strength
   */
  async _calculateBondStrength(pattern1, pattern2) {
    const quantumCorrelation = await this.quantumProcessor.calculateCorrelation(
      pattern1.quantumSignature,
      pattern2.quantumSignature,
    );

    return Math.min(
      1,
      (quantumCorrelation +
        this._calculatePatternSimilarity(pattern1, pattern2)) /
        2,
    );
  }

  /**
   * Optimize crystal structures
   * @private
   * @param {Array} crystals - Crystal structures
   * @returns {Promise<Array>} Optimized crystals
   */
  async _optimizeCrystals(crystals) {
    // Sort by stability and significance
    crystals.sort((a, b) => {
      const stabilityDiff = b.stability.overall - a.stability.overall;
      if (Math.abs(stabilityDiff) < 0.001) {
        return b.pattern.significance - a.pattern.significance;
      }
      return stabilityDiff;
    });

    // Remove unstable formations
    return crystals.filter(
      (crystal) =>
        crystal.stability.overall >= this.stabilityThreshold &&
        crystal.entropy <= this.entropyTolerance,
    );
  }

  /**
   * Calculate overall stability
   * @private
   * @param {Map} stability - Stability metrics
   * @returns {number} Overall stability score
   */
  _calculateOverallStability(stability) {
    if (stability.size === 0) return 0;

    const scores = Array.from(stability.values())
      .map((m) => m.overall)
      .filter((s) => !isNaN(s));

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Validate crystal structure
   * @private
   * @param {Object} crystal - Crystal structure
   * @returns {boolean} Validation result
   */
  _validateCrystalStructure(crystal) {
    return (
      crystal &&
      crystal.pattern &&
      crystal.stability &&
      crystal.stability.overall >= this.stabilityThreshold &&
      crystal.entropy <= this.entropyTolerance &&
      crystal.formation.coherence >= this.crystallizationThreshold
    );
  }

  /**
   * Validate and store crystal formations
   * @private
   * @param {Array} crystals - Crystal structures
   */
  async _validateAndStore(crystals) {
    const validated = [];
    for (const crystal of crystals) {
      if (this._validateCrystalStructure(crystal)) {
        this.crystalPatterns.set(crystal.id, crystal);
        this.activeFormations.add(crystal.id);
        this.stabilityMetrics.set(crystal.id, crystal.stability);
        validated.push(crystal);
      }
    }

    // Auto-embed validated crystals into Qdrant (Phase 9.4)
    if (this.vectorStoreReady && validated.length > 0) {
      try {
        await this.vectorStore.storeCrystalBatch(validated);
      } catch (err) {
        console.warn(
          "[KnowledgeCrystallizer] Vector embedding failed (non-fatal):",
          err.message,
        );
      }
    }
  }

  /**
   * Generate quantum signature for pattern
   * @private
   * @param {Object} value - Pattern value
   * @param {Object} quantumState - Quantum state
   * @returns {Promise<Object>} Quantum signature
   */
  async _generateQuantumSignature(value, quantumState) {
    return this.quantumProcessor.generateSignature(value, quantumState);
  }

  /**
   * Validate security context
   * @private
   * @throws {Error} If security validation fails
   */
  async _validateSecurityContext() {
    const token = await this.security.getOperationToken("crystallize");
    if (!token || !(await this.security.validateToken(token))) {
      throw new Error("Invalid security context for crystallization");
    }
  }

  /**
   * Initialize quantum processing state
   * @private
   * @returns {Promise<boolean>} Success indicator
   */
  async _initializeQuantumState() {
    return this.quantumProcessor.initializeState({
      dimensions: config.ohdr.quantumDimensions,
      precision: config.ohdr.quantumPrecision,
    });
  }

  /**
   * Setup crystallization environment
   * @private
   * @returns {Promise<boolean>} Success indicator
   */
  async _setupCrystallizationEnvironment() {
    try {
      // Initialize pattern storage
      this.crystalPatterns.clear();
      this.activeFormations.clear();
      this.stabilityMetrics.clear();

      // Set up quantum environment
      await this.quantumProcessor.setupEnvironment({
        type: "crystallization",
        parameters: {
          threshold: this.crystallizationThreshold,
          tolerance: this.entropyTolerance,
        },
      });

      return true;
    } catch (error) {
      console.error("Failed to setup crystallization environment:", error);
      return false;
    }
  }
  // ────────────────── RAG / Semantic Search (Phase 9.4) ──────────────────

  /**
   * Search for crystallized knowledge by semantic similarity.
   *
   * @param {Object} queryCrystal  Crystal to use as query
   * @param {number} [topK=10]  Number of results
   * @returns {Promise<Object[]>}  Array of { crystalId, score, payload }
   */
  async searchKnowledge(queryCrystal, topK = 10) {
    if (!this.vectorStoreReady) {
      throw new Error("Vector store not initialized — call initialize() first");
    }
    return this.vectorStore.searchSimilarCrystals(queryCrystal, topK);
  }

  /**
   * Retrieve RAG-augmented context for a consciousness state.
   *
   * Embeds the state, finds relevant crystallized knowledge, and
   * returns a structured context block for downstream processors.
   *
   * @param {Object} consciousnessState  Input state
   * @param {Object} [opts]  { topK, minScore, includeStability }
   * @returns {Promise<Object>}  { contextEntries, totalScore, metadata }
   */
  async retrieveContext(consciousnessState, opts = {}) {
    if (!this.vectorStoreReady) {
      return {
        contextEntries: [],
        totalScore: 0,
        metadata: { error: "vector store offline" },
      };
    }
    return this.vectorStore.retrieveFromConsciousness(consciousnessState, opts);
  }

  /**
   * Search crystals by dimension name.
   *
   * @param {string} dimension
   * @param {number} [topK=10]
   * @returns {Promise<Object[]>}
   */
  async searchByDimension(dimension, topK = 10) {
    if (!this.vectorStoreReady) {
      // Fallback: filter in-memory crystalPatterns map
      const results = [];
      for (const [id, crystal] of this.crystalPatterns) {
        if (crystal.pattern?.dimension === dimension) {
          results.push({
            crystalId: id,
            score: 1.0,
            payload: { dimension, stability: crystal.stability?.overall ?? 0 },
          });
        }
        if (results.length >= topK) break;
      }
      return results;
    }
    return this.vectorStore.searchByDimension(dimension, topK);
  }

  /**
   * Get vector store diagnostics.
   * @returns {Object}
   */
  getVectorStoreStats() {
    return {
      ready: this.vectorStoreReady,
      ...(this.vectorStoreReady ? this.vectorStore.getStats() : {}),
    };
  }
}

export default KnowledgeCrystallizer;
export { QdrantKnowledgeStore };
