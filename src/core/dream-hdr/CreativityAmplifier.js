/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Creativity Amplifier
 * Enhances and amplifies creative patterns in dream states.
 */

class CreativityAmplifier {
  constructor(config = {}) {
    this.baseAmplification = config.baseAmp || 1.2;
    this.maxAmplification = config.maxAmp || 3.0;
    this.resonanceThreshold = config.resonance || 0.4;
    this.stabilityFactor = config.stability || 0.8;
    this.amplificationHistory = new Map();
  }

  /**
   * Amplify encoded patterns
   * @param {Array} patterns - Encoded patterns
   * @returns {Promise<Object>} Amplified state
   */
  async amplify(patterns) {
    try {
      const resonanceMap = this._buildResonanceMap(patterns);
      const amplifiedPatterns = await this._amplifyPatterns(
        patterns,
        resonanceMap
      );

      const state = {
        patterns: amplifiedPatterns,
        level: this._calculateAmplificationLevel(amplifiedPatterns),
        timestamp: Date.now(),
      };

      this._updateHistory(state);
      return state;
    } catch (error) {
      throw new Error(`Pattern amplification failed: ${error.message}`);
    }
  }

  /**
   * Enhance existing creative state
   * @param {Object} state - Current creative state
   * @param {number} factor - Enhancement factor
   * @returns {Promise<Object>} Enhanced state
   */
  async enhance(state, factor) {
    if (factor <= 0) {
      throw new Error("Enhancement factor must be positive");
    }

    try {
      const normalizedFactor = Math.min(
        factor,
        this.maxAmplification / state.level
      );

      const enhancedPatterns = await this._enhancePatterns(
        state.patterns,
        normalizedFactor
      );

      const enhanced = {
        patterns: enhancedPatterns,
        level: state.level * normalizedFactor,
        timestamp: Date.now(),
      };

      this._updateHistory(enhanced);
      return enhanced;
    } catch (error) {
      throw new Error(`Creative enhancement failed: ${error.message}`);
    }
  }

  /**
   * Merge multiple creative states
   * @param {Array<Object>} states - Creative states to merge
   * @returns {Promise<Object>} Merged state
   */
  async merge(states) {
    if (!states.length) {
      throw new Error("No states to merge");
    }

    try {
      const mergedPatterns = this._mergePatterns(states.map((s) => s.patterns));

      const amplified = await this.amplify(mergedPatterns);
      const stabilized = await this._stabilize(amplified);

      return {
        patterns: stabilized,
        level: this._calculateAmplificationLevel(stabilized),
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Creative state merge failed: ${error.message}`);
    }
  }

  /**
   * Build resonance map for patterns
   * @private
   * @param {Array} patterns - Encoded patterns
   * @returns {Map} Resonance map
   */
  _buildResonanceMap(patterns) {
    const resonanceMap = new Map();

    patterns.forEach((pattern) => {
      const resonance = this._calculateResonance(pattern);
      if (resonance >= this.resonanceThreshold) {
        resonanceMap.set(pattern.encoded.nodes[0].id, resonance);
      }
    });

    return resonanceMap;
  }

  /**
   * Calculate pattern resonance
   * @private
   * @param {Object} pattern - Encoded pattern
   * @returns {number} Resonance value
   */
  _calculateResonance(pattern) {
    const nodes = pattern.encoded.nodes;
    const connections = pattern.encoded.connections;

    // Node resonance
    const nodeResonance =
      nodes.reduce((sum, node) => sum + node.intensity, 0) / nodes.length;

    // Connection resonance
    const connectionResonance =
      connections.reduce((sum, conn) => sum + conn.strength, 0) /
      connections.length;

    return nodeResonance * 0.6 + connectionResonance * 0.4;
  }

  /**
   * Amplify patterns
   * @private
   * @param {Array} patterns - Encoded patterns
   * @param {Map} resonanceMap - Resonance values
   * @returns {Promise<Array>} Amplified patterns
   */
  async _amplifyPatterns(patterns, resonanceMap) {
    return Promise.all(
      patterns.map(async (pattern) => {
        const resonance = resonanceMap.get(pattern.encoded.nodes[0].id) || 0;
        return this._amplifyPattern(pattern, resonance);
      })
    );
  }

  /**
   * Amplify single pattern
   * @private
   * @param {Object} pattern - Pattern to amplify
   * @param {number} resonance - Pattern resonance
   * @returns {Promise<Object>} Amplified pattern
   */
  async _amplifyPattern(pattern, resonance) {
    const amplificationFactor = this._calculateAmplificationFactor(resonance);

    return {
      ...pattern,
      encoded: {
        nodes: this._amplifyNodes(pattern.encoded.nodes, amplificationFactor),
        connections: this._amplifyConnections(
          pattern.encoded.connections,
          amplificationFactor
        ),
        weights: this._adjustWeights(
          pattern.encoded.weights,
          amplificationFactor
        ),
        compressionRatio: pattern.encoded.compressionRatio,
      },
      amplificationFactor,
      resonance,
    };
  }

  /**
   * Calculate amplification factor
   * @private
   * @param {number} resonance - Pattern resonance
   * @returns {number} Amplification factor
   */
  _calculateAmplificationFactor(resonance) {
    const base = this.baseAmplification;
    const resonanceBoost = resonance * (this.maxAmplification - base);
    return Math.min(this.maxAmplification, base + resonanceBoost);
  }

  /**
   * Amplify neural nodes
   * @private
   * @param {Array} nodes - Neural nodes
   * @param {number} factor - Amplification factor
   * @returns {Array} Amplified nodes
   */
  _amplifyNodes(nodes, factor) {
    return nodes.map((node) => ({
      ...node,
      intensity: Math.min(1, node.intensity * factor),
    }));
  }

  /**
   * Amplify neural connections
   * @private
   * @param {Array} connections - Neural connections
   * @param {number} factor - Amplification factor
   * @returns {Array} Amplified connections
   */
  _amplifyConnections(connections, factor) {
    return connections.map((conn) => ({
      ...conn,
      strength: Math.min(1, conn.strength * Math.sqrt(factor)),
    }));
  }

  /**
   * Adjust pattern weights
   * @private
   * @param {Object} weights - Pattern weights
   * @param {number} factor - Amplification factor
   * @returns {Object} Adjusted weights
   */
  _adjustWeights(weights, factor) {
    const adjustment = (Math.sqrt(factor) - 1) * 0.2;
    const result = {};

    Object.entries(weights).forEach(([key, value]) => {
      result[key] = Math.min(1, value + adjustment);
    });

    return result;
  }

  /**
   * Enhance patterns with factor
   * @private
   * @param {Array} patterns - Patterns to enhance
   * @param {number} factor - Enhancement factor
   * @returns {Promise<Array>} Enhanced patterns
   */
  async _enhancePatterns(patterns, factor) {
    return Promise.all(
      patterns.map(async (pattern) => ({
        ...pattern,
        encoded: {
          nodes: this._amplifyNodes(pattern.encoded.nodes, factor),
          connections: this._amplifyConnections(
            pattern.encoded.connections,
            factor
          ),
          weights: this._adjustWeights(pattern.encoded.weights, factor),
          compressionRatio: pattern.encoded.compressionRatio,
        },
        amplificationFactor: (pattern.amplificationFactor || 1) * factor,
      }))
    );
  }

  /**
   * Merge pattern sets
   * @private
   * @param {Array<Array>} patternSets - Sets of patterns
   * @returns {Array} Merged patterns
   */
  _mergePatterns(patternSets) {
    const merged = [];
    const seen = new Set();

    patternSets.forEach((patterns) => {
      patterns.forEach((pattern) => {
        const key = `${pattern.type}-${pattern.pattern}`;
        if (!seen.has(key)) {
          merged.push(pattern);
          seen.add(key);
        }
      });
    });

    return merged;
  }

  /**
   * Stabilize amplified patterns
   * @private
   * @param {Object} state - Amplified state
   * @returns {Promise<Array>} Stabilized patterns
   */
  async _stabilize(state) {
    const stabilityFactor = this.stabilityFactor;

    return state.patterns.map((pattern) => ({
      ...pattern,
      encoded: {
        nodes: pattern.encoded.nodes.map((node) => ({
          ...node,
          intensity: node.intensity * stabilityFactor,
        })),
        connections: pattern.encoded.connections.map((conn) => ({
          ...conn,
          strength: conn.strength * stabilityFactor,
        })),
        weights: pattern.encoded.weights,
        compressionRatio: pattern.encoded.compressionRatio,
      },
    }));
  }

  /**
   * Calculate amplification level
   * @private
   * @param {Array} patterns - Amplified patterns
   * @returns {number} Amplification level
   */
  _calculateAmplificationLevel(patterns) {
    if (!patterns.length) return 1;

    const factors = patterns.map((p) => p.amplificationFactor || 1);
    return factors.reduce((sum, f) => sum + f, 0) / factors.length;
  }

  /**
   * Update amplification history
   * @private
   * @param {Object} state - Amplified state
   */
  _updateHistory(state) {
    const key = Date.now().toString();
    this.amplificationHistory.set(key, {
      level: state.level,
      patterns: state.patterns.length,
      timestamp: state.timestamp,
    });

    // Keep only last 100 entries
    const keys = Array.from(this.amplificationHistory.keys());
    if (keys.length > 100) {
      this.amplificationHistory.delete(keys[0]);
    }
  }
}

module.exports = CreativityAmplifier;
