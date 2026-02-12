/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * File: src/echo-hdr/temporal/decay-model.js
 * Created: 2026-02
 * Purpose: Temporal memory decay with consolidation — Ebbinghaus-inspired
 *          forgetting curves with emotional significance modulation
 * Phase: 9.6 — ECHO-HDR Temporal Memory System
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

// ────────────────────── Constants ──────────────────────

/**
 * Decay profiles determine the shape of the forgetting curve.
 *
 * STANDARD  — Classic Ebbinghaus exponential decay
 * RESILIENT — Slower decay for emotionally significant memories
 * FRAGILE   — Faster decay for low-significance transient episodes
 * IMMORTAL  — Zero decay, memory persists indefinitely (core identity)
 */
const DecayProfile = Object.freeze({
  STANDARD: "standard",
  RESILIENT: "resilient",
  FRAGILE: "fragile",
  IMMORTAL: "immortal",
});

/** Base half-life in milliseconds per profile */
const HALF_LIFE_MS = Object.freeze({
  [DecayProfile.STANDARD]: 24 * 60 * 60 * 1000, // 24 hours
  [DecayProfile.RESILIENT]: 7 * 24 * 60 * 60 * 1000, // 7 days
  [DecayProfile.FRAGILE]: 2 * 60 * 60 * 1000, // 2 hours
  [DecayProfile.IMMORTAL]: Infinity,
});

/**
 * Consolidation stages modeled after neuroscience research.
 * Each successful recall event advances the stage and multiplies the half-life.
 */
const ConsolidationStage = Object.freeze({
  SENSORY: { name: "sensory", multiplier: 1.0, minRecalls: 0 },
  SHORT_TERM: { name: "short_term", multiplier: 2.5, minRecalls: 1 },
  WORKING: { name: "working", multiplier: 6.0, minRecalls: 3 },
  LONG_TERM: { name: "long_term", multiplier: 20.0, minRecalls: 7 },
  PERMANENT: { name: "permanent", multiplier: 100.0, minRecalls: 15 },
});

const CONSOLIDATION_STAGES = [
  ConsolidationStage.SENSORY,
  ConsolidationStage.SHORT_TERM,
  ConsolidationStage.WORKING,
  ConsolidationStage.LONG_TERM,
  ConsolidationStage.PERMANENT,
];

const MIN_STRENGTH = 0.001; // Below this, memory is considered forgotten
const MAX_STRENGTH = 1.0;

// ────────────────────── Decay Model ──────────────────────

/**
 * TemporalDecayModel
 *
 * Computes memory strength as a function of elapsed time, recall frequency,
 * emotional significance, and consolidation stage.
 *
 * Core formula (modified Ebbinghaus):
 *   S(t) = S₀ · exp(-λ · t / (halfLife · stageMultiplier · emotionBoost))
 *
 * Where:
 *   S₀  = initial strength at last recall/store (typically 1.0)
 *   λ   = ln(2), ensures 50 % decay at half-life
 *   t   = elapsed time since last interaction (ms)
 *   halfLife = base half-life for the decay profile
 *   stageMultiplier = consolidation stage multiplier (1 → 100)
 *   emotionBoost = 1 + emotionalSignificance (range [1, 2])
 */
class TemporalDecayModel {
  /**
   * @param {Object} [opts]
   * @param {number} [opts.minStrength]    Strength floor before pruning
   * @param {number} [opts.maxStrength]    Strength ceiling
   * @param {number} [opts.recallBoost]    Strength boost per recall event (0-1)
   * @param {number} [opts.consolidationAcceleration]  Speed factor for stage promotion
   */
  constructor(opts = {}) {
    this.minStrength = opts.minStrength ?? MIN_STRENGTH;
    this.maxStrength = opts.maxStrength ?? MAX_STRENGTH;
    this.recallBoost = opts.recallBoost ?? 0.15;
    this.consolidationAcceleration = opts.consolidationAcceleration ?? 1.0;
    this.lambda = Math.LN2; // ln(2)
  }

  // ────────────────── Public API ──────────────────

  /**
   * Create a fresh memory metadata record for temporal tracking.
   *
   * @param {Object} [opts]
   * @param {string} [opts.profile]        DecayProfile key
   * @param {number} [opts.significance]   Emotional significance 0-1 (default 0.5)
   * @param {number} [opts.urgency]        Urgency score 0-1 (default 0)
   * @param {number} [opts.resonance]      Emotional resonance 0-1 (default 0)
   * @returns {Object} Temporal metadata
   */
  createTemporalRecord(opts = {}) {
    const now = Date.now();
    const profile = opts.profile ?? DecayProfile.STANDARD;

    return {
      profile,
      halfLifeMs: HALF_LIFE_MS[profile] ?? HALF_LIFE_MS[DecayProfile.STANDARD],
      createdAt: now,
      lastInteractionAt: now,
      recallCount: 0,
      consolidationStageIndex: 0,
      consolidationStage: CONSOLIDATION_STAGES[0].name,
      strength: this.maxStrength,
      emotional: {
        significance: Math.min(1, Math.max(0, opts.significance ?? 0.5)),
        urgency: Math.min(1, Math.max(0, opts.urgency ?? 0)),
        resonance: Math.min(1, Math.max(0, opts.resonance ?? 0)),
      },
    };
  }

  /**
   * Compute the current strength of a memory.
   *
   * @param {Object} temporal   Temporal metadata (from createTemporalRecord)
   * @param {number} [atTime]   Timestamp to evaluate at (default: now)
   * @returns {number}          Strength in [0, 1]
   */
  computeStrength(temporal, atTime) {
    if (!temporal) return 0;
    if (temporal.profile === DecayProfile.IMMORTAL) return this.maxStrength;

    const now = atTime ?? Date.now();
    const elapsed = Math.max(0, now - temporal.lastInteractionAt);

    const stage = CONSOLIDATION_STAGES[temporal.consolidationStageIndex] ?? CONSOLIDATION_STAGES[0];
    const emotionBoost = 1 + this._compositeEmotionalScore(temporal.emotional);
    const effectiveHalfLife = temporal.halfLifeMs * stage.multiplier * emotionBoost;

    const strength = temporal.strength * Math.exp(
      (-this.lambda * elapsed) / effectiveHalfLife
    );

    return Math.max(this.minStrength, Math.min(this.maxStrength, strength));
  }

  /**
   * Record a recall event — strengthens the memory and may promote
   * its consolidation stage.
   *
   * @param {Object} temporal   Temporal metadata (mutated in place)
   * @returns {Object}          Updated temporal record
   */
  onRecall(temporal) {
    if (!temporal) return temporal;

    const now = Date.now();
    // First, decay strength to current level before boosting
    temporal.strength = this.computeStrength(temporal, now);
    // Apply recall boost
    temporal.strength = Math.min(
      this.maxStrength,
      temporal.strength + this.recallBoost * (1 - temporal.strength)
    );
    temporal.lastInteractionAt = now;
    temporal.recallCount += 1;

    // Attempt consolidation stage promotion
    this._attemptConsolidation(temporal);

    return temporal;
  }

  /**
   * Mark a memory as having undergone dream-state consolidation.
   * Provides a significant strength boost and may accelerate stage promotion.
   *
   * @param {Object} temporal   Temporal metadata
   * @param {number} [boost]    Extra boost factor (default 0.3)
   * @returns {Object}          Updated temporal record
   */
  onDreamConsolidation(temporal, boost = 0.3) {
    if (!temporal) return temporal;

    const now = Date.now();
    temporal.strength = this.computeStrength(temporal, now);
    temporal.strength = Math.min(this.maxStrength, temporal.strength + boost);
    temporal.lastInteractionAt = now;
    // Dream consolidation counts as multiple recalls
    temporal.recallCount += 3 * this.consolidationAcceleration;
    this._attemptConsolidation(temporal);

    return temporal;
  }

  /**
   * Determine whether a memory should be pruned (forgotten).
   *
   * @param {Object} temporal   Temporal metadata
   * @param {number} [atTime]   Timestamp to evaluate at
   * @returns {boolean}
   */
  shouldPrune(temporal, atTime) {
    if (!temporal) return true;
    if (temporal.profile === DecayProfile.IMMORTAL) return false;
    return this.computeStrength(temporal, atTime) <= this.minStrength;
  }

  /**
   * Bulk-evaluate a collection of temporal records, returning
   * categorized memory IDs.
   *
   * @param {Map<string, Object>} temporalMap  id → temporal record
   * @param {number} [atTime]
   * @returns {{ active: string[], weakening: string[], forgotten: string[] }}
   */
  categorize(temporalMap, atTime) {
    const active = [];
    const weakening = [];
    const forgotten = [];

    for (const [id, temporal] of temporalMap) {
      const s = this.computeStrength(temporal, atTime);
      if (s <= this.minStrength) {
        forgotten.push(id);
      } else if (s < 0.3) {
        weakening.push(id);
      } else {
        active.push(id);
      }
    }

    return { active, weakening, forgotten };
  }

  /**
   * Return human-readable diagnostics for a temporal record.
   *
   * @param {Object} temporal
   * @returns {Object}
   */
  diagnose(temporal) {
    if (!temporal) return { error: "no temporal record" };

    const now = Date.now();
    const currentStrength = this.computeStrength(temporal, now);
    const stage = CONSOLIDATION_STAGES[temporal.consolidationStageIndex];
    const emotionBoost = 1 + this._compositeEmotionalScore(temporal.emotional);
    const effectiveHalfLife = temporal.halfLifeMs * stage.multiplier * emotionBoost;

    // Estimate time until forgotten
    let timeToForget = Infinity;
    if (temporal.profile !== DecayProfile.IMMORTAL && currentStrength > this.minStrength) {
      timeToForget = (effectiveHalfLife / this.lambda) *
        Math.log(currentStrength / this.minStrength);
    }

    return {
      currentStrength,
      profile: temporal.profile,
      consolidationStage: stage.name,
      stageMultiplier: stage.multiplier,
      emotionalBoost: emotionBoost,
      effectiveHalfLifeHours: effectiveHalfLife / (3600 * 1000),
      recallCount: temporal.recallCount,
      ageMs: now - temporal.createdAt,
      estimatedTimeToForgetMs: timeToForget,
      nextStageRecalls: this._recallsToNextStage(temporal),
    };
  }

  // ────────────────── Internal ──────────────────

  /**
   * Composite emotional score contributing to decay resistance.
   * Range: [0, 1]
   */
  _compositeEmotionalScore(emotional) {
    if (!emotional) return 0;
    return (
      0.5 * (emotional.significance ?? 0) +
      0.2 * (emotional.urgency ?? 0) +
      0.3 * (emotional.resonance ?? 0)
    );
  }

  /**
   * Attempt to promote consolidation stage based on recall count.
   */
  _attemptConsolidation(temporal) {
    const nextIndex = temporal.consolidationStageIndex + 1;
    if (nextIndex >= CONSOLIDATION_STAGES.length) return;

    const nextStage = CONSOLIDATION_STAGES[nextIndex];
    const adjustedThreshold = nextStage.minRecalls / this.consolidationAcceleration;

    if (temporal.recallCount >= adjustedThreshold) {
      temporal.consolidationStageIndex = nextIndex;
      temporal.consolidationStage = nextStage.name;
    }
  }

  /**
   * How many more recalls are needed to reach the next stage.
   */
  _recallsToNextStage(temporal) {
    const nextIndex = temporal.consolidationStageIndex + 1;
    if (nextIndex >= CONSOLIDATION_STAGES.length) return 0;
    const nextStage = CONSOLIDATION_STAGES[nextIndex];
    const threshold = nextStage.minRecalls / this.consolidationAcceleration;
    return Math.max(0, Math.ceil(threshold - temporal.recallCount));
  }
}

// ────────────────────── Exports ──────────────────────

export { DecayProfile, ConsolidationStage, CONSOLIDATION_STAGES };
export default TemporalDecayModel;
