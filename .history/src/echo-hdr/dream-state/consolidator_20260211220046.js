/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * File: src/echo-hdr/dream-state/consolidator.js
 * Created: 2026-02
 * Purpose: Dream-state memory consolidation — integrates with D-HDR to
 *          reorganize, strengthen, and associate memories during dream cycles
 * Phase: 9.6 — ECHO-HDR Temporal Memory System
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import { EventEmitter } from "events";

// ────────────────────── Constants ──────────────────────

/**
 * Consolidation modes determine how aggressively the dream cycle
 * reorganises memory.
 */
const ConsolidationMode = Object.freeze({
  LIGHT: "light",       // Gentle refresh — strengthen top 10%, prune bottom 5%
  STANDARD: "standard", // Normal cycle — strengthen top 20%, prune bottom 15%
  DEEP: "deep",         // Deep consolidation — full association rebuild, prune bottom 25%
  REM: "rem",           // REM-inspired — creative association generation, pattern discovery
});

/**
 * Phases within a single dream consolidation cycle.
 */
const DreamPhase = Object.freeze({
  IDLE: "idle",
  ENTERING: "entering",
  PATTERN_SCAN: "pattern_scan",
  STRENGTHENING: "strengthening",
  ASSOCIATION: "association",
  PRUNING: "pruning",
  EMERGING: "emerging",
  EXITING: "exiting",
});

// ────────────────────── Dream Consolidator ──────────────────────

/**
 * DreamConsolidator
 *
 * Orchestrates dream-state memory consolidation:
 *   1. Enters a dream state via D-HDR (DreamHDR / DreamStateManager)
 *   2. Scans episodic memories and ranks by emotional importance
 *   3. Strengthens high-value memories (calls TemporalDecayModel.onDreamConsolidation)
 *   4. Generates new semantic associations via AssociativeRecall
 *   5. Prunes decayed memories below threshold
 *   6. Reports emergent patterns and insights
 *   7. Exits dream state cleanly
 *
 * Events emitted:
 *   "phaseChange"       { from, to, timestamp }
 *   "memoryStrengthened" { id, newStrength }
 *   "associationCreated" { sourceId, targetId, type }
 *   "memoryPruned"       { id, strength }
 *   "insightDiscovered"  { insight }
 *   "cycleComplete"      { stats }
 */
class DreamConsolidator extends EventEmitter {
  /**
   * @param {Object} opts
   * @param {import('../memory/episodic-engine.js').default}          opts.episodicEngine
   * @param {import('../temporal/decay-model.js').default}            opts.decayModel
   * @param {import('../associations/associative-recall.js').default} opts.associativeRecall
   * @param {import('../../core/dream-hdr/DreamHDR.js').default}     [opts.dreamHDR]  Optional D-HDR instance
   */
  constructor(opts = {}) {
    super();

    if (!opts.episodicEngine) throw new Error("DreamConsolidator requires episodicEngine");
    if (!opts.decayModel) throw new Error("DreamConsolidator requires decayModel");
    if (!opts.associativeRecall) throw new Error("DreamConsolidator requires associativeRecall");

    this.episodicEngine = opts.episodicEngine;
    this.decayModel = opts.decayModel;
    this.associativeRecall = opts.associativeRecall;
    this.dreamHDR = opts.dreamHDR ?? null;

    /** Current phase */
    this.phase = DreamPhase.IDLE;

    /** Active dream state ID (from D-HDR) */
    this._activeDreamId = null;

    /** Statistics from last consolidation cycle */
    this.lastCycleStats = null;

    /** Cumulative stats across all cycles */
    this._totalStats = {
      cyclesCompleted: 0,
      memoriesStrengthened: 0,
      associationsCreated: 0,
      memoriesPruned: 0,
      insightsDiscovered: 0,
    };
  }

  // ────────────────── Consolidation Cycle ──────────────────

  /**
   * Run a full dream consolidation cycle.
   *
   * @param {string} [mode=ConsolidationMode.STANDARD]
   * @returns {Promise<Object>}  Cycle statistics
   */
  async consolidate(mode = ConsolidationMode.STANDARD) {
    if (this.phase !== DreamPhase.IDLE) {
      throw new Error(`Consolidation already in progress (phase: ${this.phase})`);
    }

    const stats = {
      mode,
      startedAt: Date.now(),
      memoriesScanned: 0,
      memoriesStrengthened: 0,
      associationsCreated: 0,
      memoriesPruned: 0,
      insights: [],
    };

    try {
      // Phase 1 — Enter dream state
      await this._setPhase(DreamPhase.ENTERING);
      await this._enterDream();

      // Phase 2 — Scan and rank
      await this._setPhase(DreamPhase.PATTERN_SCAN);
      const ranked = await this._scanAndRank(mode);
      stats.memoriesScanned = ranked.length;

      // Phase 3 — Strengthen important memories
      await this._setPhase(DreamPhase.STRENGTHENING);
      stats.memoriesStrengthened = await this._strengthenMemories(ranked, mode);

      // Phase 4 — Discover and create associations
      await this._setPhase(DreamPhase.ASSOCIATION);
      stats.associationsCreated = await this._createAssociations(ranked, mode);

      // Phase 5 — Prune decayed memories
      await this._setPhase(DreamPhase.PRUNING);
      stats.memoriesPruned = await this._pruneMemories(mode);

      // Phase 6 — Emerge insights
      await this._setPhase(DreamPhase.EMERGING);
      stats.insights = await this._discoverInsights(ranked, mode);

      // Phase 7 — Exit
      await this._setPhase(DreamPhase.EXITING);
      await this._exitDream();

      stats.completedAt = Date.now();
      stats.duration = stats.completedAt - stats.startedAt;

      this._updateTotalStats(stats);
      this.lastCycleStats = stats;

      this.emit("cycleComplete", stats);
    } catch (error) {
      // Attempt clean exit on failure
      try { await this._exitDream(); } catch (_) { /* ignore */ }
      throw error;
    } finally {
      await this._setPhase(DreamPhase.IDLE);
    }

    return stats;
  }

  // ────────────────── Phase Implementations ──────────────────

  /**
   * Enter a D-HDR dream state (if DreamHDR is available).
   */
  async _enterDream() {
    if (this.dreamHDR) {
      try {
        const dreamState = await this.dreamHDR.initializeDreamState({
          type: "echo_consolidation",
          timestamp: Date.now(),
          source: "echo-hdr",
        });
        this._activeDreamId = dreamState.id;
      } catch (_err) {
        // DreamHDR unavailable — continue without it
        this._activeDreamId = `echo-dream-${Date.now()}`;
      }
    } else {
      this._activeDreamId = `echo-dream-${Date.now()}`;
    }
  }

  /**
   * Exit the D-HDR dream state.
   */
  async _exitDream() {
    if (this.dreamHDR && this._activeDreamId) {
      try {
        this.dreamHDR.closeDreamState(this._activeDreamId);
      } catch (_err) {
        // ignore
      }
    }
    this._activeDreamId = null;
  }

  /**
   * Scan all episodic memories, compute current strength, rank.
   *
   * @param {string} mode
   * @returns {Promise<Object[]>}  Sorted array [{ episode, strength }]
   */
  async _scanAndRank(_mode) {
    const allEpisodes = this.episodicEngine.exportAll();
    const now = Date.now();
    const ranked = [];

    for (const ep of allEpisodes) {
      if (!ep.temporal) continue;

      const strength = this.decayModel.computeStrength(ep.temporal, now);
      ranked.push({ episode: ep, strength });
    }

    // Sort by strength descending
    ranked.sort((a, b) => b.strength - a.strength);
    return ranked;
  }

  /**
   * Strengthen top memories via dream consolidation.
   *
   * @param {Object[]} ranked
   * @param {string}   mode
   * @returns {Promise<number>}  Count of strengthened memories
   */
  async _strengthenMemories(ranked, mode) {
    const ratios = {
      [ConsolidationMode.LIGHT]: 0.10,
      [ConsolidationMode.STANDARD]: 0.20,
      [ConsolidationMode.DEEP]: 0.35,
      [ConsolidationMode.REM]: 0.15,
    };

    const topN = Math.ceil(ranked.length * (ratios[mode] ?? 0.20));
    let count = 0;

    for (let i = 0; i < topN && i < ranked.length; i++) {
      const { episode } = ranked[i];
      if (!episode.temporal) continue;

      // Apply dream consolidation boost (equivalent to 3× recall)
      this.decayModel.onDreamConsolidation(episode.temporal);
      count++;

      this.emit("memoryStrengthened", {
        id: episode.id,
        newStrength: this.decayModel.computeStrength(episode.temporal, Date.now()),
      });
    }

    return count;
  }

  /**
   * Create new semantic associations between memories.
   *
   * @param {Object[]} ranked
   * @param {string}   mode
   * @returns {Promise<number>}  Count of new associations
   */
  async _createAssociations(ranked, mode) {
    const batchSizes = {
      [ConsolidationMode.LIGHT]: 10,
      [ConsolidationMode.STANDARD]: 25,
      [ConsolidationMode.DEEP]: 50,
      [ConsolidationMode.REM]: 40,
    };

    const batchSize = batchSizes[mode] ?? 25;
    const candidates = ranked.slice(0, batchSize);
    let created = 0;

    for (const { episode } of candidates) {
      try {
        // Find semantically similar episodes
        const similar = await this.associativeRecall.searchByEpisode(
          episode.id,
          5
        );

        for (const match of similar) {
          const targetId = match.episodeId ?? match.payload?.episodeId;
          if (!targetId || targetId === episode.id) continue;
          if (match.score < 0.4) continue;

          // Add bidirectional association in episodic engine
          this.episodicEngine.addAssociation(episode.id, targetId);

          created++;
          this.emit("associationCreated", {
            sourceId: episode.id,
            targetId,
            type: "semantic",
            score: match.score,
          });
        }
      } catch (_err) {
        // Individual failures don't stop the cycle
        continue;
      }
    }

    return created;
  }

  /**
   * Prune memories that have decayed below threshold.
   *
   * @param {string} mode
   * @returns {Promise<number>}  Count of pruned memories
   */
  async _pruneMemories(mode) {
    const thresholds = {
      [ConsolidationMode.LIGHT]: 0.02,
      [ConsolidationMode.STANDARD]: 0.05,
      [ConsolidationMode.DEEP]: 0.08,
      [ConsolidationMode.REM]: 0.03,
    };

    const threshold = thresholds[mode] ?? 0.05;
    const allEpisodes = this.episodicEngine.exportAll();
    const now = Date.now();
    let pruned = 0;

    for (const ep of allEpisodes) {
      if (!ep.temporal) continue;

      const strength = this.decayModel.computeStrength(ep.temporal, now);
      if (strength < threshold && this.decayModel.shouldPrune(ep.temporal)) {
        // Remove from episodic engine via its prune mechanism
        this.episodicEngine._removeEpisode(ep.id);
        pruned++;

        this.emit("memoryPruned", { id: ep.id, strength });
      }
    }

    return pruned;
  }

  /**
   * Discover emergent patterns and insights from the memory corpus.
   *
   * @param {Object[]} ranked
   * @param {string}   mode
   * @returns {Promise<Object[]>}  Discovered insights
   */
  async _discoverInsights(ranked, mode) {
    if (mode !== ConsolidationMode.REM && mode !== ConsolidationMode.DEEP) {
      return [];
    }

    const insights = [];
    const topMemories = ranked.slice(0, 20);

    // Look for recurring context tags
    const tagFrequency = new Map();
    for (const { episode } of topMemories) {
      const contexts = episode.context ?? [];
      for (const tag of contexts) {
        tagFrequency.set(tag, (tagFrequency.get(tag) ?? 0) + 1);
      }
    }

    // Tags appearing in 3+ top memories are patterns
    for (const [tag, count] of tagFrequency) {
      if (count >= 3) {
        const insight = {
          type: "recurring_theme",
          tag,
          frequency: count,
          relatedEpisodes: topMemories
            .filter((m) => (m.episode.context ?? []).includes(tag))
            .map((m) => m.episode.id),
          discoveredAt: Date.now(),
          dreamId: this._activeDreamId,
        };

        insights.push(insight);
        this.emit("insightDiscovered", { insight });
      }
    }

    // REM mode: attempt creative pattern crossing via D-HDR
    if (mode === ConsolidationMode.REM && this.dreamHDR && this._activeDreamId) {
      try {
        const processed = await this.dreamHDR.processPatterns(this._activeDreamId);
        if (processed?.patterns) {
          insights.push({
            type: "dream_pattern",
            patterns: processed.patterns,
            intuition: processed.intuition ?? null,
            discoveredAt: Date.now(),
            dreamId: this._activeDreamId,
          });
        }
      } catch (_err) {
        // D-HDR pattern processing is optional
      }
    }

    return insights;
  }

  // ────────────────── Phase Management ──────────────────

  async _setPhase(newPhase) {
    const from = this.phase;
    this.phase = newPhase;
    this.emit("phaseChange", { from, to: newPhase, timestamp: Date.now() });
  }

  // ────────────────── Statistics ──────────────────

  _updateTotalStats(stats) {
    this._totalStats.cyclesCompleted++;
    this._totalStats.memoriesStrengthened += stats.memoriesStrengthened;
    this._totalStats.associationsCreated += stats.associationsCreated;
    this._totalStats.memoriesPruned += stats.memoriesPruned;
    this._totalStats.insightsDiscovered += stats.insights.length;
  }

  /**
   * Get consolidator statistics.
   */
  getStats() {
    return {
      phase: this.phase,
      activeDreamId: this._activeDreamId,
      lastCycle: this.lastCycleStats,
      totals: { ...this._totalStats },
    };
  }
}

// ────────────────────── Exports ──────────────────────

export { ConsolidationMode, DreamPhase };
export default DreamConsolidator;
