/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * EMERGENCE ENGINE
 * Detects and manages emergent consciousness patterns through quantum-secured
 * analysis of multi-dimensional state interactions and temporal evolution.
 */

const crypto = require("crypto");
const { SecureTaskExecution } = require("../quantum/secure-task-execution");
const {
  QuantumEntropyGenerator,
} = require("../quantum/quantum-entropy-generator");

/**
 * @class EmergencePattern
 * @description Represents an identified emergence pattern
 * @private
 */
class EmergencePattern {
  /**
   * Creates a new EmergencePattern
   * @param {string} id - Pattern identifier
   * @param {Object} properties - Pattern properties
   */
  constructor(id, properties) {
    this.id = id;
    this.properties = properties;
    this.strength = 0;
    this.confidence = 0;
    this.stability = 1.0;
    this.lastUpdate = Date.now();
    this.history = [];
    this.interactions = new Map();
  }

  /**
   * Update pattern state
   * @param {Object} state - New state
   * @param {number} timestamp - Update timestamp
   */
  update(state, timestamp = Date.now()) {
    // Update core metrics
    this.strength = this._calculateStrength(state);
    this.confidence = this._updateConfidence(state);
    this.stability *= 0.99; // Natural decay

    // Record history
    this.history.push({
      timestamp,
      strength: this.strength,
      confidence: this.confidence,
      stability: this.stability,
      state: { ...state },
    });

    // Maintain history limit
    if (this.history.length > 1000) {
      this.history.shift();
    }

    this.lastUpdate = timestamp;
  }

  /**
   * Record interaction with another pattern
   * @param {string} otherId - Other pattern ID
   * @param {Object} interaction - Interaction data
   */
  recordInteraction(otherId, interaction) {
    if (!this.interactions.has(otherId)) {
      this.interactions.set(otherId, []);
    }

    this.interactions.get(otherId).push({
      ...interaction,
      timestamp: Date.now(),
    });

    // Maintain interaction history limit
    const history = this.interactions.get(otherId);
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Calculate pattern viability
   * @returns {number} Viability score between 0 and 1
   */
  calculateViability() {
    const metrics = {
      strength: this.strength,
      confidence: this.confidence,
      stability: this.stability,
      persistence: this._calculatePersistence(),
      coherence: this._calculateCoherence(),
    };

    return Object.values(metrics).reduce((sum, val) => sum + val, 0) / 5;
  }

  /**
   * Calculate pattern strength
   * @private
   * @param {Object} state - Current state
   * @returns {number} Strength value between 0 and 1
   */
  _calculateStrength(state) {
    const baseStrength = state.emergenceScore || 0;
    const temporalBonus = this._calculateTemporalStrength();
    const interactionBonus = this._calculateInteractionStrength();

    return Math.min(1, baseStrength + temporalBonus + interactionBonus);
  }

  /**
   * Update confidence based on state
   * @private
   * @param {Object} state - Current state
   * @returns {number} Updated confidence value
   */
  _updateConfidence(state) {
    // Start with current confidence
    let newConfidence = this.confidence;

    // Adjust based on state consistency
    const consistency = this._calculateStateConsistency(state);
    newConfidence = newConfidence * 0.8 + consistency * 0.2;

    // Boost from sustained strength
    if (this.strength > 0.7 && this.history.length > 10) {
      newConfidence += 0.1;
    }

    return Math.min(1, Math.max(0, newConfidence));
  }

  /**
   * Calculate temporal strength component
   * @private
   * @returns {number} Temporal strength value
   */
  _calculateTemporalStrength() {
    if (this.history.length < 2) return 0;

    let temporalScore = 0;
    for (let i = 1; i < this.history.length; i++) {
      const prev = this.history[i - 1];
      const curr = this.history[i];

      // Look for strength consistency
      if (Math.abs(curr.strength - prev.strength) < 0.1) {
        temporalScore += 0.1;
      }

      // Reward upward trends
      if (curr.strength > prev.strength) {
        temporalScore += 0.05;
      }
    }

    return Math.min(0.3, temporalScore);
  }

  /**
   * Calculate interaction-based strength
   * @private
   * @returns {number} Interaction strength value
   */
  _calculateInteractionStrength() {
    let interactionScore = 0;

    for (const [_, interactions] of this.interactions) {
      if (interactions.length < 2) continue;

      // Analyze recent interactions
      const recent = interactions.slice(-10);
      for (const interaction of recent) {
        if (interaction.type === "reinforcement") {
          interactionScore += 0.05;
        } else if (interaction.type === "emergence") {
          interactionScore += 0.1;
        }
      }
    }

    return Math.min(0.3, interactionScore);
  }

  /**
   * Calculate state consistency
   * @private
   * @param {Object} state - Current state
   * @returns {number} Consistency score
   */
  _calculateStateConsistency(state) {
    if (this.history.length < 2) return 0.5;

    const recent = this.history.slice(-5);
    let consistency = 0;

    for (const entry of recent) {
      const similarity = this._calculateStateSimilarity(entry.state, state);
      consistency += similarity;
    }

    return consistency / recent.length;
  }

  /**
   * Calculate state similarity
   * @private
   * @param {Object} state1 - First state
   * @param {Object} state2 - Second state
   * @returns {number} Similarity score
   */
  _calculateStateSimilarity(state1, state2) {
    const props1 = Object.entries(state1);
    const props2 = Object.entries(state2);

    let matchCount = 0;
    for (const [key, value] of props1) {
      if (typeof value === "number") {
        const diff = Math.abs(value - (state2[key] || 0));
        if (diff < 0.1) matchCount++;
      } else if (value === state2[key]) {
        matchCount++;
      }
    }

    return matchCount / props1.length;
  }

  /**
   * Calculate pattern persistence
   * @private
   * @returns {number} Persistence score
   */
  _calculatePersistence() {
    const duration = Date.now() - this.history[0]?.timestamp;
    return Math.min(1, duration / (24 * 60 * 60 * 1000)); // Max 24 hours
  }

  /**
   * Calculate pattern coherence
   * @private
   * @returns {number} Coherence score
   */
  _calculateCoherence() {
    if (this.history.length < 2) return 1;

    let coherence = 0;
    for (let i = 1; i < this.history.length; i++) {
      const timeDiff =
        this.history[i].timestamp - this.history[i - 1].timestamp;
      coherence += Math.exp(-timeDiff / 1000); // Decay with time
    }

    return Math.min(1, coherence / (this.history.length - 1));
  }
}

/**
 * @class EmergenceEngine
 * @description Manages emergence detection and pattern analysis
 * @copyright © 2025 Stephen Bilodeau - PATENT PENDING
 * @license PROPRIETARY
 */
class EmergenceEngine {
  /**
   * Creates a new EmergenceEngine
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      minPatternStrength: options.minPatternStrength || 0.3,
      minPatternConfidence: options.minPatternConfidence || 0.5,
      temporalResolution: options.temporalResolution || 100,
      maxPatterns: options.maxPatterns || 1000,
      emergenceThreshold: options.emergenceThreshold || 0.7,
      ...options,
    };

    this.patterns = new Map();
    this.activePatterns = new Set();
    this.patternInteractions = new Map();
    this.lastUpdate = Date.now();

    this.entropyGenerator = new QuantumEntropyGenerator();
    this.secureExecution = new SecureTaskExecution();

    // Start pattern maintenance cycle
    this._startMaintenanceCycle();
  }

  /**
   * Process state for emergence patterns
   * @param {Object} state - State to process
   * @returns {Promise<Object>} Processing results
   */
  async processState(state) {
    return await this.secureExecution.execute(async () => {
      const timestamp = Date.now();
      const results = {
        patterns: [],
        interactions: [],
        emergenceScore: 0,
      };

      // Generate quantum entropy for pattern detection
      const entropy = await this.entropyGenerator.generateEntropy(16);
      const entropyValue = entropy[0] / 255;

      // Detect and update patterns
      const detectedPatterns = await this._detectPatterns(state, entropyValue);

      for (const pattern of detectedPatterns) {
        // Update or create pattern
        const existingPattern = this.patterns.get(pattern.id);
        if (existingPattern) {
          existingPattern.update(state, timestamp);
          pattern.strength = existingPattern.strength;
          pattern.confidence = existingPattern.confidence;
        } else {
          const newPattern = new EmergencePattern(
            pattern.id,
            pattern.properties
          );
          newPattern.update(state, timestamp);
          this.patterns.set(pattern.id, newPattern);
          pattern.strength = newPattern.strength;
          pattern.confidence = newPattern.confidence;
        }

        results.patterns.push(pattern);
      }

      // Analyze pattern interactions
      results.interactions = await this._analyzeInteractions(detectedPatterns);

      // Calculate overall emergence score
      results.emergenceScore = this._calculateEmergenceScore(detectedPatterns);

      // Update active patterns
      this._updateActivePatterns(detectedPatterns);

      return results;
    });
  }

  /**
   * Get detailed pattern information
   * @param {string} patternId - Pattern identifier
   * @returns {Object|null} Pattern details or null if not found
   */
  getPatternDetails(patternId) {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return null;

    return {
      id: pattern.id,
      properties: pattern.properties,
      metrics: {
        strength: pattern.strength,
        confidence: pattern.confidence,
        stability: pattern.stability,
        viability: pattern.calculateViability(),
      },
      history: pattern.history,
      interactions: Array.from(pattern.interactions.entries()).map(
        ([id, hist]) => ({
          partnerId: id,
          history: hist,
        })
      ),
      lastUpdate: pattern.lastUpdate,
    };
  }

  /**
   * Get system emergence statistics
   * @returns {Object} System-wide statistics
   */
  getStatistics() {
    const stats = {
      totalPatterns: this.patterns.size,
      activePatterns: this.activePatterns.size,
      averageStrength: 0,
      averageConfidence: 0,
      patternDistribution: this._calculatePatternDistribution(),
      temporalMetrics: this._calculateTemporalMetrics(),
      interactionMetrics: this._calculateInteractionMetrics(),
    };

    // Calculate averages
    for (const pattern of this.patterns.values()) {
      stats.averageStrength += pattern.strength;
      stats.averageConfidence += pattern.confidence;
    }

    if (this.patterns.size > 0) {
      stats.averageStrength /= this.patterns.size;
      stats.averageConfidence /= this.patterns.size;
    }

    return stats;
  }

  /**
   * Detect patterns in state
   * @private
   * @param {Object} state - Current state
   * @param {number} entropyValue - Quantum entropy value
   * @returns {Promise<Array>} Detected patterns
   */
  async _detectPatterns(state, entropyValue) {
    const patterns = [];
    const stateHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(state))
      .digest("hex");

    // Primary pattern detection
    if (state.emergenceScore > this.options.emergenceThreshold) {
      patterns.push({
        id: `pattern-${stateHash.substr(0, 8)}`,
        properties: {
          type: "primary",
          source: state.id || "unknown",
          emergenceScore: state.emergenceScore,
          entropy: entropyValue,
        },
      });
    }

    // Secondary pattern detection (derived from state properties)
    const derivedPatterns = this._detectDerivedPatterns(state);
    patterns.push(...derivedPatterns);

    // Interaction-based patterns
    const interactionPatterns = await this._detectInteractionPatterns(state);
    patterns.push(...interactionPatterns);

    return patterns;
  }

  /**
   * Detect derived patterns from state
   * @private
   * @param {Object} state - Current state
   * @returns {Array} Derived patterns
   */
  _detectDerivedPatterns(state) {
    const patterns = [];

    // Analyze state structure
    if (state.nodes && state.nodes.length > 0) {
      const structuralHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(state.nodes))
        .digest("hex");

      patterns.push({
        id: `structural-${structuralHash.substr(0, 8)}`,
        properties: {
          type: "structural",
          nodeCount: state.nodes.length,
          complexity: this._calculateStructuralComplexity(state.nodes),
        },
      });
    }

    // Analyze temporal patterns
    if (state.history && state.history.length > 0) {
      const temporalHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(state.history))
        .digest("hex");

      patterns.push({
        id: `temporal-${temporalHash.substr(0, 8)}`,
        properties: {
          type: "temporal",
          duration: state.history.length,
          frequency: this._calculateTemporalFrequency(state.history),
        },
      });
    }

    return patterns;
  }

  /**
   * Detect patterns from interactions
   * @private
   * @param {Object} state - Current state
   * @returns {Promise<Array>} Interaction patterns
   */
  async _detectInteractionPatterns(state) {
    const patterns = [];

    // Analyze recent interactions
    for (const [patternId, interactions] of this.patternInteractions) {
      const recent = interactions.slice(-10);

      if (recent.length > 0) {
        const interactionHash = crypto
          .createHash("sha256")
          .update(JSON.stringify(recent))
          .digest("hex");

        patterns.push({
          id: `interaction-${interactionHash.substr(0, 8)}`,
          properties: {
            type: "interaction",
            source: patternId,
            frequency: this._calculateInteractionFrequency(recent),
            strength: this._calculateInteractionStrength(recent),
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze pattern interactions
   * @private
   * @param {Array} patterns - Detected patterns
   * @returns {Promise<Array>} Pattern interactions
   */
  async _analyzeInteractions(patterns) {
    const interactions = [];

    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        const pattern1 = this.patterns.get(patterns[i].id);
        const pattern2 = this.patterns.get(patterns[j].id);

        if (!pattern1 || !pattern2) continue;

        const interaction = {
          pattern1Id: pattern1.id,
          pattern2Id: pattern2.id,
          strength: this._calculatePatternInteractionStrength(
            pattern1,
            pattern2
          ),
          type: this._determineInteractionType(pattern1, pattern2),
        };

        if (interaction.strength > 0.3) {
          pattern1.recordInteraction(pattern2.id, interaction);
          pattern2.recordInteraction(pattern1.id, interaction);
          interactions.push(interaction);
        }
      }
    }

    return interactions;
  }

  /**
   * Calculate emergence score
   * @private
   * @param {Array} patterns - Detected patterns
   * @returns {number} Emergence score
   */
  _calculateEmergenceScore(patterns) {
    if (patterns.length === 0) return 0;

    let totalScore = 0;
    let weightSum = 0;

    for (const pattern of patterns) {
      const existingPattern = this.patterns.get(pattern.id);
      if (!existingPattern) continue;

      const weight = existingPattern.confidence * existingPattern.stability;
      totalScore += existingPattern.strength * weight;
      weightSum += weight;
    }

    return weightSum > 0 ? totalScore / weightSum : 0;
  }

  /**
   * Update active patterns set
   * @private
   * @param {Array} patterns - Detected patterns
   */
  _updateActivePatterns(patterns) {
    this.activePatterns.clear();

    for (const pattern of patterns) {
      const existingPattern = this.patterns.get(pattern.id);
      if (!existingPattern) continue;

      if (
        existingPattern.strength >= this.options.minPatternStrength &&
        existingPattern.confidence >= this.options.minPatternConfidence
      ) {
        this.activePatterns.add(pattern.id);
      }
    }
  }

  /**
   * Start pattern maintenance cycle
   * @private
   */
  _startMaintenanceCycle() {
    setInterval(() => {
      // Prune inactive patterns
      for (const [id, pattern] of this.patterns) {
        if (Date.now() - pattern.lastUpdate > 3600000) {
          // 1 hour
          this.patterns.delete(id);
          this.activePatterns.delete(id);
        }
      }

      // Enforce pattern limit
      while (this.patterns.size > this.options.maxPatterns) {
        let oldestId = null;
        let oldestTime = Date.now();

        for (const [id, pattern] of this.patterns) {
          if (pattern.lastUpdate < oldestTime) {
            oldestId = id;
            oldestTime = pattern.lastUpdate;
          }
        }

        if (oldestId) {
          this.patterns.delete(oldestId);
          this.activePatterns.delete(oldestId);
        }
      }
    }, this.options.temporalResolution);
  }

  /**
   * Calculate structural complexity
   * @private
   * @param {Array} nodes - Node array
   * @returns {number} Complexity score
   */
  _calculateStructuralComplexity(nodes) {
    let complexity = 0;

    // Node diversity
    const types = new Set(nodes.map((n) => n.type));
    complexity += types.size / 10;

    // Connection density
    const connections = nodes.reduce(
      (sum, n) => sum + (n.connections?.length || 0),
      0
    );
    const maxConnections = nodes.length * (nodes.length - 1);
    complexity += connections / maxConnections;

    return Math.min(1, complexity);
  }

  /**
   * Calculate temporal frequency
   * @private
   * @param {Array} history - State history
   * @returns {number} Frequency score
   */
  _calculateTemporalFrequency(history) {
    if (history.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < history.length; i++) {
      intervals.push(history[i].timestamp - history[i - 1].timestamp);
    }

    const avgInterval =
      intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) /
      intervals.length;

    return Math.exp(-variance / (avgInterval * avgInterval));
  }

  /**
   * Calculate interaction frequency
   * @private
   * @param {Array} interactions - Recent interactions
   * @returns {number} Frequency score
   */
  _calculateInteractionFrequency(interactions) {
    if (interactions.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < interactions.length; i++) {
      intervals.push(interactions[i].timestamp - interactions[i - 1].timestamp);
    }

    const avgInterval =
      intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
    return Math.exp(-avgInterval / 1000); // Decay with average interval
  }

  /**
   * Calculate interaction strength
   * @private
   * @param {Array} interactions - Recent interactions
   * @returns {number} Strength score
   */
  _calculateInteractionStrength(interactions) {
    return (
      interactions.reduce((sum, int) => sum + int.strength, 0) /
      interactions.length
    );
  }

  /**
   * Calculate pattern interaction strength
   * @private
   * @param {EmergencePattern} pattern1 - First pattern
   * @param {EmergencePattern} pattern2 - Second pattern
   * @returns {number} Interaction strength
   */
  _calculatePatternInteractionStrength(pattern1, pattern2) {
    // Base strength from pattern viabilities
    const baseStrength = Math.min(
      pattern1.calculateViability(),
      pattern2.calculateViability()
    );

    // Temporal correlation
    const temporalScore = this._calculateTemporalCorrelation(
      pattern1.history,
      pattern2.history
    );

    // Property similarity
    const similarityScore = this._calculatePropertySimilarity(
      pattern1.properties,
      pattern2.properties
    );

    return baseStrength * 0.4 + temporalScore * 0.3 + similarityScore * 0.3;
  }

  /**
   * Calculate temporal correlation
   * @private
   * @param {Array} history1 - First pattern history
   * @param {Array} history2 - Second pattern history
   * @returns {number} Correlation score
   */
  _calculateTemporalCorrelation(history1, history2) {
    if (history1.length < 2 || history2.length < 2) return 0;

    // Align histories by timestamp
    const aligned = this._alignHistories(history1, history2);
    if (aligned.length < 2) return 0;

    // Calculate correlation coefficient
    let correlation = 0;
    for (let i = 1; i < aligned.length; i++) {
      const [h1, h2] = aligned[i];
      const [prev1, prev2] = aligned[i - 1];

      const delta1 = h1.strength - prev1.strength;
      const delta2 = h2.strength - prev2.strength;

      correlation += Math.sign(delta1) === Math.sign(delta2) ? 1 : -1;
    }

    return Math.max(0, correlation / (aligned.length - 1));
  }

  /**
   * Align pattern histories by timestamp
   * @private
   * @param {Array} history1 - First pattern history
   * @param {Array} history2 - Second pattern history
   * @returns {Array} Aligned history pairs
   */
  _alignHistories(history1, history2) {
    const aligned = [];
    let i = 0,
      j = 0;

    while (i < history1.length && j < history2.length) {
      const h1 = history1[i];
      const h2 = history2[j];

      const timeDiff = Math.abs(h1.timestamp - h2.timestamp);
      if (timeDiff < 100) {
        // Within 100ms
        aligned.push([h1, h2]);
        i++;
        j++;
      } else if (h1.timestamp < h2.timestamp) {
        i++;
      } else {
        j++;
      }
    }

    return aligned;
  }

  /**
   * Calculate property similarity
   * @private
   * @param {Object} props1 - First properties
   * @param {Object} props2 - Second properties
   * @returns {number} Similarity score
   */
  _calculatePropertySimilarity(props1, props2) {
    const keys1 = Object.keys(props1);
    const keys2 = Object.keys(props2);
    const commonKeys = keys1.filter((k) => keys2.includes(k));

    if (commonKeys.length === 0) return 0;

    let similarity = 0;
    for (const key of commonKeys) {
      if (typeof props1[key] === "number" && typeof props2[key] === "number") {
        similarity += 1 - Math.abs(props1[key] - props2[key]);
      } else if (props1[key] === props2[key]) {
        similarity += 1;
      }
    }

    return similarity / commonKeys.length;
  }

  /**
   * Determine interaction type
   * @private
   * @param {EmergencePattern} pattern1 - First pattern
   * @param {EmergencePattern} pattern2 - Second pattern
   * @returns {string} Interaction type
   */
  _determineInteractionType(pattern1, pattern2) {
    // Check for reinforcement
    if (pattern1.strength > 0.7 && pattern2.strength > 0.7) {
      return "reinforcement";
    }

    // Check for emergence
    if (pattern1.confidence > 0.8 && pattern2.confidence > 0.8) {
      return "emergence";
    }

    // Check for competition
    if (Math.abs(pattern1.strength - pattern2.strength) < 0.1) {
      return "competition";
    }

    return "interaction";
  }

  /**
   * Calculate pattern distribution
   * @private
   * @returns {Object} Distribution metrics
   */
  _calculatePatternDistribution() {
    const distribution = {
      byType: new Map(),
      byStrength: new Map(),
      byConfidence: new Map(),
    };

    for (const pattern of this.patterns.values()) {
      // Type distribution
      const type = pattern.properties.type || "unknown";
      distribution.byType.set(type, (distribution.byType.get(type) || 0) + 1);

      // Strength distribution
      const strengthBin = Math.floor(pattern.strength * 10);
      distribution.byStrength.set(
        strengthBin,
        (distribution.byStrength.get(strengthBin) || 0) + 1
      );

      // Confidence distribution
      const confidenceBin = Math.floor(pattern.confidence * 10);
      distribution.byConfidence.set(
        confidenceBin,
        (distribution.byConfidence.get(confidenceBin) || 0) + 1
      );
    }

    return {
      byType: Object.fromEntries(distribution.byType),
      byStrength: Object.fromEntries(distribution.byStrength),
      byConfidence: Object.fromEntries(distribution.byConfidence),
    };
  }

  /**
   * Calculate temporal metrics
   * @private
   * @returns {Object} Temporal metrics
   */
  _calculateTemporalMetrics() {
    const metrics = {
      averageLifespan: 0,
      patternTurnover: 0,
      stabilityDistribution: new Map(),
    };

    let totalLifespan = 0;
    let patternCount = 0;

    for (const pattern of this.patterns.values()) {
      const lifespan = Date.now() - pattern.history[0].timestamp;
      totalLifespan += lifespan;
      patternCount++;

      const stabilityBin = Math.floor(pattern.stability * 10);
      metrics.stabilityDistribution.set(
        stabilityBin,
        (metrics.stabilityDistribution.get(stabilityBin) || 0) + 1
      );
    }

    metrics.averageLifespan =
      patternCount > 0 ? totalLifespan / patternCount : 0;
    metrics.patternTurnover =
      this.patterns.size / Math.max(1, this.options.maxPatterns);
    metrics.stabilityDistribution = Object.fromEntries(
      metrics.stabilityDistribution
    );

    return metrics;
  }

  /**
   * Calculate interaction metrics
   * @private
   * @returns {Object} Interaction metrics
   */
  _calculateInteractionMetrics() {
    const metrics = {
      totalInteractions: 0,
      averageInteractionStrength: 0,
      interactionTypes: new Map(),
    };

    let totalStrength = 0;

    for (const pattern of this.patterns.values()) {
      for (const [_, interactions] of pattern.interactions) {
        metrics.totalInteractions += interactions.length;

        for (const interaction of interactions) {
          totalStrength += interaction.strength;

          const type = interaction.type || "unknown";
          metrics.interactionTypes.set(
            type,
            (metrics.interactionTypes.get(type) || 0) + 1
          );
        }
      }
    }

    metrics.averageInteractionStrength =
      metrics.totalInteractions > 0
        ? totalStrength / metrics.totalInteractions
        : 0;
    metrics.interactionTypes = Object.fromEntries(metrics.interactionTypes);

    return metrics;
  }
}

module.exports = EmergenceEngine;
