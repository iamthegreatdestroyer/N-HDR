/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * File: src/echo-hdr/memory/episodic-engine.js
 * Created: 2026-02
 * Purpose: Episodic memory storage — records, indexes, and manages discrete
 *          experiences (episodes) with temporal decay and emotional tagging
 * Phase: 9.6 — ECHO-HDR Temporal Memory System
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import crypto from "crypto";
import { EventEmitter } from "events";
import TemporalDecayModel, { DecayProfile } from "../temporal/decay-model.js";

// ────────────────────── Constants ──────────────────────

const MAX_EPISODES = 500_000;
const PRUNE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const INDEX_REBUILD_THRESHOLD = 1000; // rebuild context index after N inserts

/**
 * Episode types classify the nature of the stored experience.
 */
const EpisodeType = Object.freeze({
  EXPERIENCE: "experience", // general experience
  DECISION: "decision", // decision-making event
  INSIGHT: "insight", // breakthrough / aha moment
  INTERACTION: "interaction", // external interaction
  REFLECTION: "reflection", // self-reflective observation
  ERROR: "error", // failure / mistake to learn from
  MILESTONE: "milestone", // significant achievement
});

// ────────────────────── Episodic Engine ──────────────────────

/**
 * EpisodicEngine
 *
 * Core memory store for the ECHO-HDR temporal memory system.
 * Each "episode" is a discrete event with:
 *   • Unique ID
 *   • Content payload (arbitrary data)
 *   • Context tags (searchable strings)
 *   • Emotional metadata (significance, urgency, resonance)
 *   • Temporal record (tracks decay, consolidation, strength)
 *   • Association links to other episodes
 *
 * Emits events: "store", "recall", "prune", "consolidate"
 */
class EpisodicEngine extends EventEmitter {
  /**
   * @param {Object} [opts]
   * @param {number} [opts.maxEpisodes]         Capacity limit
   * @param {number} [opts.pruneIntervalMs]     Automatic prune frequency
   * @param {Object} [opts.decayConfig]         Passed to TemporalDecayModel
   */
  constructor(opts = {}) {
    super();

    this.maxEpisodes = opts.maxEpisodes ?? MAX_EPISODES;
    this.pruneIntervalMs = opts.pruneIntervalMs ?? PRUNE_INTERVAL_MS;
    this.decayModel = new TemporalDecayModel(opts.decayConfig);

    /** @type {Map<string, Object>} episode id → episode */
    this.episodes = new Map();

    /** @type {Map<string, Set<string>>} context tag → set of episode ids */
    this.contextIndex = new Map();

    /** @type {Map<string, Set<string>>} episode id → set of associated episode ids */
    this.associationGraph = new Map();

    this._insertsSinceRebuild = 0;
    this._pruneTimer = null;

    this._stats = {
      totalStored: 0,
      totalRecalled: 0,
      totalPruned: 0,
      totalConsolidated: 0,
    };
  }

  // ────────────────── Lifecycle ──────────────────

  /**
   * Start the background prune timer.
   */
  start() {
    if (this._pruneTimer) return;
    this._pruneTimer = setInterval(() => this.prune(), this.pruneIntervalMs);
    // Prevent timer from blocking process exit
    if (this._pruneTimer.unref) this._pruneTimer.unref();
  }

  /**
   * Stop the background prune timer.
   */
  stop() {
    if (this._pruneTimer) {
      clearInterval(this._pruneTimer);
      this._pruneTimer = null;
    }
  }

  // ────────────────── Store ──────────────────

  /**
   * Store a new episodic memory.
   *
   * @param {Object} params
   * @param {*}      params.content         The experience payload
   * @param {string[]} [params.context]     Context tags for searching
   * @param {string}   [params.type]        EpisodeType key
   * @param {Object}   [params.emotional]   { significance, urgency, resonance } 0-1
   * @param {string}   [params.decayProfile] DecayProfile key
   * @param {string[]} [params.associateWith] Existing episode IDs to link
   * @param {Object}   [params.metadata]    Extra metadata
   * @returns {Object} The stored episode
   */
  store(params = {}) {
    // Enforce capacity
    if (this.episodes.size >= this.maxEpisodes) {
      this.prune();
      if (this.episodes.size >= this.maxEpisodes) {
        this._forceEvictWeakest();
      }
    }

    const id = this._generateId();
    const now = Date.now();

    const temporal = this.decayModel.createTemporalRecord({
      profile: params.decayProfile ?? DecayProfile.STANDARD,
      significance: params.emotional?.significance,
      urgency: params.emotional?.urgency,
      resonance: params.emotional?.resonance,
    });

    const episode = {
      id,
      content: params.content,
      context: Array.isArray(params.context) ? [...params.context] : [],
      type: params.type ?? EpisodeType.EXPERIENCE,
      temporal,
      metadata: params.metadata ?? {},
      createdAt: now,
    };

    // Store episode
    this.episodes.set(id, episode);
    this._stats.totalStored++;

    // Index by context tags
    for (const tag of episode.context) {
      const lower = tag.toLowerCase();
      if (!this.contextIndex.has(lower)) {
        this.contextIndex.set(lower, new Set());
      }
      this.contextIndex.get(lower).add(id);
    }

    // Build associations
    this.associationGraph.set(id, new Set());
    if (Array.isArray(params.associateWith)) {
      for (const otherId of params.associateWith) {
        this.addAssociation(id, otherId);
      }
    }

    this._insertsSinceRebuild++;
    this.emit("store", { id, type: episode.type, context: episode.context });

    return episode;
  }

  // ────────────────── Recall ──────────────────

  /**
   * Recall memories matching the given criteria.
   * Updates temporal records (recall event strengthens memory).
   *
   * @param {Object}   [query]
   * @param {string[]} [query.context]         Tags to match (OR logic)
   * @param {string}   [query.type]            Filter by episode type
   * @param {number}   [query.minStrength]     Minimum current strength
   * @param {number}   [query.limit]           Max results (default 20)
   * @param {boolean}  [query.strengthenOnRecall] Update temporal on recall (default true)
   * @returns {Object[]} Matching episodes sorted by strength (descending)
   */
  recall(query = {}) {
    const limit = query.limit ?? 20;
    const minStrength = query.minStrength ?? 0.01;
    const strengthenOnRecall = query.strengthenOnRecall ?? true;

    let candidateIds;

    if (Array.isArray(query.context) && query.context.length > 0) {
      // Union of all context-matched IDs
      candidateIds = new Set();
      for (const tag of query.context) {
        const lower = tag.toLowerCase();
        const ids = this.contextIndex.get(lower);
        if (ids) {
          for (const id of ids) candidateIds.add(id);
        }
      }
    } else {
      candidateIds = new Set(this.episodes.keys());
    }

    const results = [];

    for (const id of candidateIds) {
      const episode = this.episodes.get(id);
      if (!episode) continue;

      // Type filter
      if (query.type && episode.type !== query.type) continue;

      const strength = this.decayModel.computeStrength(episode.temporal);
      if (strength < minStrength) continue;

      results.push({ episode, strength });
    }

    // Sort by strength descending
    results.sort((a, b) => b.strength - a.strength);
    const top = results.slice(0, limit);

    // Strengthen on recall
    if (strengthenOnRecall) {
      for (const r of top) {
        this.decayModel.onRecall(r.episode.temporal);
      }
    }

    this._stats.totalRecalled += top.length;
    this.emit("recall", { count: top.length, context: query.context });

    return top.map((r) => ({
      ...r.episode,
      currentStrength: r.strength,
    }));
  }

  /**
   * Recall a single episode by ID.
   *
   * @param {string} id
   * @param {boolean} [strengthen=true]
   * @returns {Object|null}
   */
  recallById(id, strengthen = true) {
    const episode = this.episodes.get(id);
    if (!episode) return null;

    const strength = this.decayModel.computeStrength(episode.temporal);
    if (strengthen) {
      this.decayModel.onRecall(episode.temporal);
    }

    this._stats.totalRecalled++;
    return { ...episode, currentStrength: strength };
  }

  /**
   * Retrieve all episodes associated with a given episode.
   *
   * @param {string} id           Source episode ID
   * @param {number} [depth=1]    Association chain depth
   * @returns {Object[]}          Associated episodes
   */
  recallAssociations(id, depth = 1) {
    const visited = new Set();
    const results = [];

    const walk = (currentId, d) => {
      if (d > depth || visited.has(currentId)) return;
      visited.add(currentId);

      const neighbors = this.associationGraph.get(currentId);
      if (!neighbors) return;

      for (const nid of neighbors) {
        if (visited.has(nid)) continue;
        const episode = this.episodes.get(nid);
        if (!episode) continue;

        const strength = this.decayModel.computeStrength(episode.temporal);
        if (strength > this.decayModel.minStrength) {
          results.push({ ...episode, currentStrength: strength, depth: d });
          walk(nid, d + 1);
        }
      }
    };

    walk(id, 1);
    return results;
  }

  // ────────────────── Associations ──────────────────

  /**
   * Create a bidirectional association between two episodes.
   *
   * @param {string} idA
   * @param {string} idB
   */
  addAssociation(idA, idB) {
    if (!this.episodes.has(idA) || !this.episodes.has(idB)) return;
    if (idA === idB) return;

    if (!this.associationGraph.has(idA))
      this.associationGraph.set(idA, new Set());
    if (!this.associationGraph.has(idB))
      this.associationGraph.set(idB, new Set());

    this.associationGraph.get(idA).add(idB);
    this.associationGraph.get(idB).add(idA);
  }

  // ────────────────── Consolidation ──────────────────

  /**
   * Consolidate a set of episodes (typically called during dream-state).
   * Applies dream consolidation boost and returns statistics.
   *
   * @param {string[]} [episodeIds]  Specific IDs to consolidate (default: all weakening)
   * @param {number}   [boost]       Consolidation boost amount
   * @returns {Object}               Consolidation results
   */
  consolidate(episodeIds, boost = 0.3) {
    let targets;

    if (Array.isArray(episodeIds) && episodeIds.length > 0) {
      targets = episodeIds.map((id) => this.episodes.get(id)).filter(Boolean);
    } else {
      // Auto-select: episodes that are weakening (strength 0.1 - 0.5) and
      // have high emotional significance
      targets = [];
      for (const episode of this.episodes.values()) {
        const s = this.decayModel.computeStrength(episode.temporal);
        if (
          s > 0.1 &&
          s < 0.5 &&
          (episode.temporal.emotional?.significance ?? 0) > 0.3
        ) {
          targets.push(episode);
        }
      }
    }

    let consolidated = 0;
    const details = [];

    for (const episode of targets) {
      const before = this.decayModel.computeStrength(episode.temporal);
      this.decayModel.onDreamConsolidation(episode.temporal, boost);
      const after = this.decayModel.computeStrength(episode.temporal);

      consolidated++;
      details.push({
        id: episode.id,
        strengthBefore: before,
        strengthAfter: after,
        stage: episode.temporal.consolidationStage,
      });
    }

    this._stats.totalConsolidated += consolidated;
    this.emit("consolidate", { count: consolidated });

    return {
      consolidated,
      details,
      timestamp: Date.now(),
    };
  }

  // ────────────────── Pruning ──────────────────

  /**
   * Remove all forgotten (decayed below threshold) episodes.
   *
   * @returns {number} Number of pruned episodes
   */
  prune() {
    const forgotten = [];

    for (const [id, episode] of this.episodes) {
      if (this.decayModel.shouldPrune(episode.temporal)) {
        forgotten.push(id);
      }
    }

    for (const id of forgotten) {
      this._removeEpisode(id);
    }

    this._stats.totalPruned += forgotten.length;
    if (forgotten.length > 0) {
      this.emit("prune", { count: forgotten.length });
    }

    return forgotten.length;
  }

  // ────────────────── Statistics ──────────────────

  /**
   * Get engine statistics and health metrics.
   *
   * @returns {Object}
   */
  getStats() {
    const now = Date.now();
    let activeCount = 0;
    let weakeningCount = 0;
    let avgStrength = 0;

    for (const episode of this.episodes.values()) {
      const s = this.decayModel.computeStrength(episode.temporal, now);
      avgStrength += s;
      if (s >= 0.3) activeCount++;
      else if (s > this.decayModel.minStrength) weakeningCount++;
    }

    const total = this.episodes.size;
    avgStrength = total > 0 ? avgStrength / total : 0;

    // Type distribution
    const typeDistribution = {};
    for (const episode of this.episodes.values()) {
      typeDistribution[episode.type] =
        (typeDistribution[episode.type] ?? 0) + 1;
    }

    // Consolidation stage distribution
    const stageDistribution = {};
    for (const episode of this.episodes.values()) {
      const stage = episode.temporal.consolidationStage;
      stageDistribution[stage] = (stageDistribution[stage] ?? 0) + 1;
    }

    return {
      totalEpisodes: total,
      activeEpisodes: activeCount,
      weakeningEpisodes: weakeningCount,
      averageStrength: avgStrength,
      capacityUsed: total / this.maxEpisodes,
      typeDistribution,
      stageDistribution,
      associations: this.associationGraph.size,
      contextTags: this.contextIndex.size,
      ...this._stats,
    };
  }

  /**
   * Export all episodes for persistence.
   *
   * @returns {Object[]}
   */
  exportAll() {
    const out = [];
    for (const episode of this.episodes.values()) {
      out.push({
        ...episode,
        currentStrength: this.decayModel.computeStrength(episode.temporal),
        associations: [...(this.associationGraph.get(episode.id) ?? [])],
      });
    }
    return out;
  }

  /**
   * Import episodes from a previous export.
   *
   * @param {Object[]} data
   * @returns {number} Number of imported episodes
   */
  importAll(data) {
    if (!Array.isArray(data)) return 0;

    let imported = 0;
    for (const item of data) {
      if (!item.id || !item.content) continue;

      this.episodes.set(item.id, {
        id: item.id,
        content: item.content,
        context: item.context ?? [],
        type: item.type ?? EpisodeType.EXPERIENCE,
        temporal: item.temporal ?? this.decayModel.createTemporalRecord(),
        metadata: item.metadata ?? {},
        createdAt: item.createdAt ?? Date.now(),
      });

      // Rebuild context index
      for (const tag of item.context ?? []) {
        const lower = tag.toLowerCase();
        if (!this.contextIndex.has(lower))
          this.contextIndex.set(lower, new Set());
        this.contextIndex.get(lower).add(item.id);
      }

      // Rebuild association graph
      this.associationGraph.set(item.id, new Set(item.associations ?? []));
      imported++;
    }

    return imported;
  }

  // ────────────────── Internal ──────────────────

  _generateId() {
    return `echo-ep-${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}`;
  }

  _removeEpisode(id) {
    const episode = this.episodes.get(id);
    if (!episode) return;

    // Remove from context index
    for (const tag of episode.context) {
      const lower = tag.toLowerCase();
      const ids = this.contextIndex.get(lower);
      if (ids) {
        ids.delete(id);
        if (ids.size === 0) this.contextIndex.delete(lower);
      }
    }

    // Remove from association graph
    const neighbors = this.associationGraph.get(id);
    if (neighbors) {
      for (const nid of neighbors) {
        this.associationGraph.get(nid)?.delete(id);
      }
    }
    this.associationGraph.delete(id);

    this.episodes.delete(id);
  }

  _forceEvictWeakest() {
    // Find and remove the weakest 10 % to make room
    const entries = [];
    for (const [id, episode] of this.episodes) {
      entries.push({
        id,
        strength: this.decayModel.computeStrength(episode.temporal),
      });
    }
    entries.sort((a, b) => a.strength - b.strength);

    const evictCount = Math.ceil(this.maxEpisodes * 0.1);
    for (let i = 0; i < evictCount && i < entries.length; i++) {
      this._removeEpisode(entries[i].id);
    }
  }
}

// ────────────────────── Exports ──────────────────────

export { EpisodeType };
export default EpisodicEngine;
