/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * File: src/echo-hdr/echo-hdr-core.js
 * Created: 2026-02
 * Purpose: ECHO-HDR Core Controller — main orchestrator for the temporal
 *          memory system, wiring together episodic storage, temporal decay,
 *          associative recall, and dream-state consolidation
 * Phase: 9.6 — ECHO-HDR Temporal Memory System
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import { EventEmitter } from "events";
import EpisodicEngine, { EpisodeType } from "./memory/episodic-engine.js";
import TemporalDecayModel, {
  DecayProfile,
  ConsolidationStage,
} from "./temporal/decay-model.js";
import AssociativeRecall, { AssociationType } from "./associations/associative-recall.js";
import DreamConsolidator, {
  ConsolidationMode,
  DreamPhase,
} from "./dream-state/consolidator.js";

// ────────────────────── Constants ──────────────────────

const ECHO_VERSION = "9.6.0";
const AUTO_CONSOLIDATION_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
const DEFAULT_RECALL_LIMIT = 20;

// ────────────────────── ECHO-HDR Core ──────────────────────

/**
 * EchoHDRCore
 *
 * Unified controller for the ECHO-HDR temporal memory system.
 *
 * Features:
 *   • Store memories with automatic temporal decay tracking
 *   • Recall memories by context, content, type, or emotion
 *   • Associative vector search for related memories
 *   • Dream-state consolidation (D-HDR integration)
 *   • Automatic strength tracking and pruning
 *   • Observable via EventEmitter events
 *
 * Events:
 *   "ready"              System initialized
 *   "store"              Memory stored
 *   "recall"             Memory recalled
 *   "consolidation"      Dream cycle completed
 *   "prune"              Memories pruned
 */
class EchoHDRCore extends EventEmitter {
  /**
   * @param {Object} opts
   * @param {Object} [opts.qdrantClient]   Qdrant client for vector store
   * @param {Object} [opts.dreamHDR]       DreamHDR instance for D-HDR integration
   * @param {Object} [opts.config]         Override configuration
   */
  constructor(opts = {}) {
    super();

    // Sub-components
    this.decayModel = new TemporalDecayModel();

    this.episodicEngine = new EpisodicEngine({
      decayModel: this.decayModel,
    });

    this.associativeRecall = new AssociativeRecall({
      qdrantClient: opts.qdrantClient ?? null,
    });

    this.dreamConsolidator = new DreamConsolidator({
      episodicEngine: this.episodicEngine,
      decayModel: this.decayModel,
      associativeRecall: this.associativeRecall,
      dreamHDR: opts.dreamHDR ?? null,
    });

    /** @type {boolean} */
    this._initialized = false;

    /** @type {NodeJS.Timer|null} */
    this._autoConsolidationTimer = null;

    this._config = {
      autoConsolidate: opts.config?.autoConsolidate ?? false,
      autoConsolidationInterval:
        opts.config?.autoConsolidationInterval ?? AUTO_CONSOLIDATION_INTERVAL,
      defaultRecallLimit: opts.config?.defaultRecallLimit ?? DEFAULT_RECALL_LIMIT,
    };
  }

  // ────────────────── Initialization ──────────────────

  /**
   * Initialize all ECHO-HDR sub-systems.
   */
  async initialize() {
    if (this._initialized) return;

    await this.associativeRecall.initialize();

    if (this._config.autoConsolidate) {
      this._startAutoConsolidation();
    }

    this._initialized = true;
    this.emit("ready", { version: ECHO_VERSION, timestamp: Date.now() });
  }

  /**
   * Gracefully shut down the system.
   */
  async shutdown() {
    if (this._autoConsolidationTimer) {
      clearInterval(this._autoConsolidationTimer);
      this._autoConsolidationTimer = null;
    }

    // Run final prune
    this.episodicEngine.prune();
    this._initialized = false;
  }

  // ────────────────── Store ──────────────────

  /**
   * Store a new memory.
   *
   * @param {Object}   params
   * @param {*}        params.content          The memory content (any serializable)
   * @param {string[]} [params.context]        Context tags (e.g. ["coding", "architecture"])
   * @param {string}   [params.type]           EpisodeType value
   * @param {Object}   [params.emotional]      { significance, urgency, resonance } (0-1)
   * @param {string}   [params.decayProfile]   DecayProfile value
   * @param {string[]} [params.associateWith]  Existing episode IDs to link
   * @returns {Promise<Object>}  Stored episode with temporal record
   */
  async store(params = {}) {
    await this._ensureInitialized();

    const episode = this.episodicEngine.store(
      params.content,
      params.context,
      params.type ?? EpisodeType.EXPERIENCE,
      params.emotional,
      params.decayProfile ?? DecayProfile.STANDARD,
      params.associateWith
    );

    // Embed for associative recall (non-blocking)
    this.associativeRecall
      .embed(episode)
      .catch(() => { /* embedding failure is non-fatal */ });

    this.emit("store", {
      id: episode.id,
      type: episode.type,
      context: episode.context,
      timestamp: Date.now(),
    });

    return episode;
  }

  // ────────────────── Recall ──────────────────

  /**
   * Recall memories by context and filters.
   *
   * @param {Object}   params
   * @param {string[]} [params.context]     Context tags to match
   * @param {string}   [params.type]        EpisodeType filter
   * @param {number}   [params.minStrength] Minimum strength (0-1, default 0.1)
   * @param {number}   [params.limit]       Max results
   * @returns {Object[]}  Matched episodes with current strength
   */
  recall(params = {}) {
    const results = this.episodicEngine.recall(
      params.context,
      params.type,
      params.minStrength ?? 0.1,
      params.limit ?? this._config.defaultRecallLimit
    );

    this.emit("recall", {
      queryContext: params.context,
      resultCount: results.length,
      timestamp: Date.now(),
    });

    return results;
  }

  /**
   * Recall a specific memory by ID.
   *
   * @param {string} id  Episode ID
   * @returns {Object|null}
   */
  recallById(id) {
    return this.episodicEngine.recallById(id);
  }

  // ────────────────── Search (Vector) ──────────────────

  /**
   * Semantic search through memories using vector similarity.
   *
   * @param {string}   query              Natural language query
   * @param {Object}   [opts]
   * @param {number}   [opts.topK]        Max results
   * @param {number}   [opts.minScore]    Minimum similarity
   * @param {Object}   [opts.emotionalFilter]  { minSignificance, minResonance }
   * @returns {Promise<Object[]>}  Scored results
   */
  async search(query, opts = {}) {
    await this._ensureInitialized();
    return this.associativeRecall.search(query, opts);
  }

  /**
   * Multi-hop associative chain search.
   *
   * @param {string} query
   * @param {number} [depth=3]
   * @param {number} [branchFactor=3]
   * @returns {Promise<Object[]>}
   */
  async chainSearch(query, depth = 3, branchFactor = 3) {
    await this._ensureInitialized();
    return this.associativeRecall.chainSearch(query, depth, branchFactor);
  }

  // ────────────────── Dream Consolidation ──────────────────

  /**
   * Run a dream consolidation cycle.
   *
   * @param {string} [mode=ConsolidationMode.STANDARD]
   * @returns {Promise<Object>}  Cycle statistics
   */
  async dreamConsolidate(mode = ConsolidationMode.STANDARD) {
    await this._ensureInitialized();

    const stats = await this.dreamConsolidator.consolidate(mode);

    this.emit("consolidation", {
      mode,
      stats,
      timestamp: Date.now(),
    });

    return stats;
  }

  // ────────────────── Decay & Maintenance ──────────────────

  /**
   * Get the current strength of a memory.
   *
   * @param {string} id  Episode ID
   * @returns {number|null}  Strength (0-1) or null if not found
   */
  getMemoryStrength(id) {
    const ep = this.episodicEngine.recallById(id);
    if (!ep || !ep.temporal) return null;
    return this.decayModel.computeStrength(ep.temporal, Date.now());
  }

  /**
   * Get decay diagnostics for a memory.
   *
   * @param {string} id  Episode ID
   * @returns {Object|null}
   */
  getDecayDiagnostics(id) {
    const ep = this.episodicEngine.recallById(id);
    if (!ep || !ep.temporal) return null;
    return this.decayModel.diagnose(ep.temporal);
  }

  /**
   * Manually prune decayed memories.
   *
   * @returns {number}  Count of pruned episodes
   */
  prune() {
    const count = this.episodicEngine.prune();
    this.emit("prune", { count, timestamp: Date.now() });
    return count;
  }

  // ────────────────── Statistics ──────────────────

  /**
   * Comprehensive system diagnostics.
   */
  getStats() {
    return {
      version: ECHO_VERSION,
      initialized: this._initialized,
      episodic: this.episodicEngine.getStats(),
      associative: this.associativeRecall.getStats(),
      consolidation: this.dreamConsolidator.getStats(),
    };
  }

  // ────────────────── Export / Import ──────────────────

  /**
   * Export full memory state for persistence.
   *
   * @returns {Object}
   */
  exportState() {
    return {
      version: ECHO_VERSION,
      exportedAt: Date.now(),
      episodes: this.episodicEngine.exportAll(),
    };
  }

  /**
   * Import a previously exported state.
   *
   * @param {Object} state
   * @returns {Promise<number>}  Count of imported episodes
   */
  async importState(state) {
    await this._ensureInitialized();

    if (!state?.episodes) return 0;

    const count = this.episodicEngine.importAll(state.episodes);

    // Re-embed all imported episodes
    const all = this.episodicEngine.exportAll();
    await this.associativeRecall.embedBatch(all).catch(() => { /* non-fatal */ });

    return count;
  }

  // ────────────────── Internal ──────────────────

  _startAutoConsolidation() {
    this._autoConsolidationTimer = setInterval(async () => {
      try {
        await this.dreamConsolidate(ConsolidationMode.LIGHT);
      } catch (_err) {
        // Auto-consolidation failures are non-fatal
      }
    }, this._config.autoConsolidationInterval);

    // Don't let the timer block Node.js exit
    if (this._autoConsolidationTimer.unref) {
      this._autoConsolidationTimer.unref();
    }
  }

  async _ensureInitialized() {
    if (!this._initialized) await this.initialize();
  }
}

// ────────────────────── Exports ──────────────────────

export {
  // Core
  EchoHDRCore,
  ECHO_VERSION,
  // Re-exports for convenience
  EpisodeType,
  DecayProfile,
  ConsolidationStage,
  ConsolidationMode,
  DreamPhase,
  AssociationType,
};

export default EchoHDRCore;
