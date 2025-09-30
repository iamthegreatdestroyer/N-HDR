/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Pattern Recognizer
 * Analyzes and recognizes patterns in dream states.
 */

class PatternRecognizer {
  constructor(config = {}) {
    this.recognitionThreshold = config.threshold || 0.6;
    this.patternMemory = new Map();
    this.correlationMatrix = new Map();
    this.maxPatternHistory = config.historySize || 1000;
    this.minConfidence = config.minConfidence || 0.7;
  }

  /**
   * Analyze patterns in dream state
   * @param {Array} patterns - Dream state patterns
   * @returns {Promise<Object>} Analysis results
   */
  async analyze(patterns) {
    try {
      const recognized = await this._recognizePatterns(patterns);
      const correlated = await this._correlatePatterns(recognized);
      const classified = this._classifyPatterns(correlated);

      this._updatePatternMemory(classified);

      return {
        patterns: classified,
        correlations: this._extractCorrelations(correlated),
        metrics: this._calculateMetrics(classified),
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Pattern analysis failed: ${error.message}`);
    }
  }

  /**
   * Recognize patterns
   * @private
   * @param {Array} patterns - Input patterns
   * @returns {Promise<Array>} Recognized patterns
   */
  async _recognizePatterns(patterns) {
    return Promise.all(
      patterns.map(async (pattern) => {
        const recognition = await this._recognizePattern(pattern);
        return {
          ...pattern,
          recognition,
        };
      })
    );
  }

  /**
   * Recognize single pattern
   * @private
   * @param {Object} pattern - Pattern to recognize
   * @returns {Promise<Object>} Recognition results
   */
  async _recognizePattern(pattern) {
    const signature = this._generateSignature(pattern);
    const matches = this._findMatches(signature);
    const confidence = this._calculateConfidence(matches);

    return {
      signature,
      matches,
      confidence,
      isRecognized: confidence >= this.recognitionThreshold,
      timestamp: Date.now(),
    };
  }

  /**
   * Generate pattern signature
   * @private
   * @param {Object} pattern - Input pattern
   * @returns {Object} Pattern signature
   */
  _generateSignature(pattern) {
    const nodes = pattern.encoded.nodes;
    const connections = pattern.encoded.connections;

    return {
      nodeSignature: this._generateNodeSignature(nodes),
      connectionSignature: this._generateConnectionSignature(connections),
      type: pattern.type,
      intensity: pattern.intensity || pattern.strength || 0.5,
    };
  }

  /**
   * Generate node signature
   * @private
   * @param {Array} nodes - Neural nodes
   * @returns {Array} Node signature
   */
  _generateNodeSignature(nodes) {
    return nodes.map((node) => ({
      level: node.level,
      intensity: node.intensity,
      hash: this._hashNode(node),
    }));
  }

  /**
   * Generate connection signature
   * @private
   * @param {Array} connections - Neural connections
   * @returns {Array} Connection signature
   */
  _generateConnectionSignature(connections) {
    return connections.map((conn) => ({
      fromLevel: parseInt(conn.from.split("-")[1]),
      toLevel: parseInt(conn.to.split("-")[1]),
      strength: conn.strength,
      hash: this._hashConnection(conn),
    }));
  }

  /**
   * Hash node data
   * @private
   * @param {Object} node - Neural node
   * @returns {string} Node hash
   */
  _hashNode(node) {
    const data = `${node.id}-${node.level}-${node.intensity}-${node.type}`;
    return this._simpleHash(data);
  }

  /**
   * Hash connection data
   * @private
   * @param {Object} connection - Neural connection
   * @returns {string} Connection hash
   */
  _hashConnection(connection) {
    const data = `${connection.from}-${connection.to}-${connection.strength}`;
    return this._simpleHash(data);
  }

  /**
   * Simple string hashing
   * @private
   * @param {string} str - Input string
   * @returns {string} Hash value
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Find matching patterns
   * @private
   * @param {Object} signature - Pattern signature
   * @returns {Array} Matching patterns
   */
  _findMatches(signature) {
    const matches = [];

    this.patternMemory.forEach((storedPattern, key) => {
      const similarity = this._calculateSimilarity(
        signature,
        storedPattern.signature
      );

      if (similarity >= this.recognitionThreshold) {
        matches.push({
          patternId: key,
          similarity,
          timestamp: storedPattern.timestamp,
        });
      }
    });

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Calculate pattern similarity
   * @private
   * @param {Object} sig1 - First signature
   * @param {Object} sig2 - Second signature
   * @returns {number} Similarity score
   */
  _calculateSimilarity(sig1, sig2) {
    const nodeSimilarity = this._calculateNodeSimilarity(
      sig1.nodeSignature,
      sig2.nodeSignature
    );

    const connectionSimilarity = this._calculateConnectionSimilarity(
      sig1.connectionSignature,
      sig2.connectionSignature
    );

    const typeSimilarity = sig1.type === sig2.type ? 1 : 0;
    const intensitySimilarity = 1 - Math.abs(sig1.intensity - sig2.intensity);

    return (
      nodeSimilarity * 0.4 +
      connectionSimilarity * 0.3 +
      typeSimilarity * 0.2 +
      intensitySimilarity * 0.1
    );
  }

  /**
   * Calculate node similarity
   * @private
   * @param {Array} nodes1 - First node set
   * @param {Array} nodes2 - Second node set
   * @returns {number} Similarity score
   */
  _calculateNodeSimilarity(nodes1, nodes2) {
    if (!nodes1.length || !nodes2.length) return 0;

    const matchingNodes = nodes1.filter((n1) =>
      nodes2.some(
        (n2) =>
          n2.level === n1.level && Math.abs(n2.intensity - n1.intensity) < 0.2
      )
    );

    return matchingNodes.length / Math.max(nodes1.length, nodes2.length);
  }

  /**
   * Calculate connection similarity
   * @private
   * @param {Array} conns1 - First connection set
   * @param {Array} conns2 - Second connection set
   * @returns {number} Similarity score
   */
  _calculateConnectionSimilarity(conns1, conns2) {
    if (!conns1.length || !conns2.length) return 0;

    const matchingConns = conns1.filter((c1) =>
      conns2.some(
        (c2) =>
          c2.fromLevel === c1.fromLevel &&
          c2.toLevel === c1.toLevel &&
          Math.abs(c2.strength - c1.strength) < 0.2
      )
    );

    return matchingConns.length / Math.max(conns1.length, conns2.length);
  }

  /**
   * Calculate recognition confidence
   * @private
   * @param {Array} matches - Pattern matches
   * @returns {number} Confidence score
   */
  _calculateConfidence(matches) {
    if (!matches.length) return 0;

    const weightedSum = matches.reduce(
      (sum, match, index) => sum + match.similarity * Math.pow(0.8, index),
      0
    );

    return weightedSum / (1 - Math.pow(0.8, matches.length));
  }

  /**
   * Correlate patterns
   * @private
   * @param {Array} patterns - Recognized patterns
   * @returns {Promise<Array>} Correlated patterns
   */
  async _correlatePatterns(patterns) {
    const correlations = new Map();

    // Build correlation matrix
    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        const correlation = await this._correlatePatternPair(
          patterns[i],
          patterns[j]
        );

        if (correlation.strength >= this.recognitionThreshold) {
          const key = `${i}-${j}`;
          correlations.set(key, correlation);
        }
      }
    }

    return patterns.map((pattern, index) => ({
      ...pattern,
      correlations: this._getPatternCorrelations(index, correlations),
    }));
  }

  /**
   * Correlate pattern pair
   * @private
   * @param {Object} pattern1 - First pattern
   * @param {Object} pattern2 - Second pattern
   * @returns {Promise<Object>} Correlation results
   */
  async _correlatePatternPair(pattern1, pattern2) {
    const signature1 = pattern1.recognition.signature;
    const signature2 = pattern2.recognition.signature;

    const similarity = this._calculateSimilarity(signature1, signature2);
    const relationship = this._determineRelationship(pattern1, pattern2);

    return {
      strength: similarity,
      relationship,
      confidence: Math.min(
        pattern1.recognition.confidence,
        pattern2.recognition.confidence
      ),
      timestamp: Date.now(),
    };
  }

  /**
   * Determine pattern relationship
   * @private
   * @param {Object} pattern1 - First pattern
   * @param {Object} pattern2 - Second pattern
   * @returns {string} Relationship type
   */
  _determineRelationship(pattern1, pattern2) {
    if (pattern1.type === pattern2.type) {
      return "similar";
    }

    const typeMap = {
      emotional: ["memory", "thought"],
      memory: ["emotional", "thought"],
      thought: ["emotional", "memory"],
    };

    return typeMap[pattern1.type]?.includes(pattern2.type)
      ? "complementary"
      : "unrelated";
  }

  /**
   * Get pattern correlations
   * @private
   * @param {number} patternIndex - Pattern index
   * @param {Map} correlations - Correlation matrix
   * @returns {Array} Pattern correlations
   */
  _getPatternCorrelations(patternIndex, correlations) {
    const patternCorrelations = [];

    correlations.forEach((correlation, key) => {
      const [i, j] = key.split("-").map(Number);
      if (i === patternIndex || j === patternIndex) {
        patternCorrelations.push({
          ...correlation,
          withPattern: i === patternIndex ? j : i,
        });
      }
    });

    return patternCorrelations.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Classify patterns
   * @private
   * @param {Array} patterns - Correlated patterns
   * @returns {Array} Classified patterns
   */
  _classifyPatterns(patterns) {
    return patterns.map((pattern) => ({
      ...pattern,
      classification: this._classifyPattern(pattern),
    }));
  }

  /**
   * Classify single pattern
   * @private
   * @param {Object} pattern - Pattern to classify
   * @returns {Object} Classification results
   */
  _classifyPattern(pattern) {
    const recognition = pattern.recognition;
    const correlations = pattern.correlations;

    return {
      category: this._determineCategory(pattern),
      significance: this._calculateSignificance(recognition, correlations),
      confidence: recognition.confidence,
      stability: this._calculateStability(pattern),
    };
  }

  /**
   * Determine pattern category
   * @private
   * @param {Object} pattern - Input pattern
   * @returns {string} Pattern category
   */
  _determineCategory(pattern) {
    const recognition = pattern.recognition;
    const correlations = pattern.correlations;

    if (recognition.confidence >= 0.9) {
      return "primary";
    } else if (correlations.length >= 3) {
      return "hub";
    } else if (recognition.confidence >= 0.7) {
      return "secondary";
    } else {
      return "exploratory";
    }
  }

  /**
   * Calculate pattern significance
   * @private
   * @param {Object} recognition - Recognition results
   * @param {Array} correlations - Pattern correlations
   * @returns {number} Significance score
   */
  _calculateSignificance(recognition, correlations) {
    const recognitionWeight = recognition.confidence * 0.6;
    const correlationWeight =
      correlations.reduce((sum, corr) => sum + corr.strength * 0.4, 0) /
      Math.max(1, correlations.length);

    return recognitionWeight + correlationWeight;
  }

  /**
   * Calculate pattern stability
   * @private
   * @param {Object} pattern - Input pattern
   * @returns {number} Stability score
   */
  _calculateStability(pattern) {
    const recognition = pattern.recognition;
    const matches = recognition.matches;

    if (!matches.length) return 0;

    const matchStability =
      matches.reduce((sum, match) => sum + match.similarity, 0) /
      matches.length;

    const timeStability = matches.some(
      (m) => Date.now() - m.timestamp < 24 * 60 * 60 * 1000
    )
      ? 1
      : 0.5;

    return matchStability * 0.7 + timeStability * 0.3;
  }

  /**
   * Extract pattern correlations
   * @private
   * @param {Array} patterns - Classified patterns
   * @returns {Array} Correlation network
   */
  _extractCorrelations(patterns) {
    const network = [];
    const seen = new Set();

    patterns.forEach((pattern, i) => {
      pattern.correlations.forEach((correlation) => {
        const key = [i, correlation.withPattern].sort().join("-");
        if (!seen.has(key)) {
          network.push({
            from: i,
            to: correlation.withPattern,
            strength: correlation.strength,
            relationship: correlation.relationship,
          });
          seen.add(key);
        }
      });
    });

    return network;
  }

  /**
   * Calculate analysis metrics
   * @private
   * @param {Array} patterns - Classified patterns
   * @returns {Object} Analysis metrics
   */
  _calculateMetrics(patterns) {
    return {
      totalPatterns: patterns.length,
      recognizedPatterns: patterns.filter((p) => p.recognition.isRecognized)
        .length,
      averageConfidence:
        patterns.reduce((sum, p) => sum + p.recognition.confidence, 0) /
        patterns.length,
      patternCategories: this._countPatternCategories(patterns),
      correlationDensity: this._calculateCorrelationDensity(patterns),
    };
  }

  /**
   * Count pattern categories
   * @private
   * @param {Array} patterns - Classified patterns
   * @returns {Object} Category counts
   */
  _countPatternCategories(patterns) {
    const counts = {
      primary: 0,
      hub: 0,
      secondary: 0,
      exploratory: 0,
    };

    patterns.forEach((pattern) => {
      counts[pattern.classification.category]++;
    });

    return counts;
  }

  /**
   * Calculate correlation density
   * @private
   * @param {Array} patterns - Classified patterns
   * @returns {number} Correlation density
   */
  _calculateCorrelationDensity(patterns) {
    if (patterns.length <= 1) return 0;

    const maxPossibleCorrelations =
      (patterns.length * (patterns.length - 1)) / 2;
    const actualCorrelations =
      patterns.reduce((sum, p) => sum + p.correlations.length, 0) / 2;

    return actualCorrelations / maxPossibleCorrelations;
  }

  /**
   * Update pattern memory
   * @private
   * @param {Array} patterns - New patterns
   */
  _updatePatternMemory(patterns) {
    patterns.forEach((pattern) => {
      if (pattern.recognition.confidence >= this.minConfidence) {
        const key = this._generatePatternKey(pattern);
        this.patternMemory.set(key, {
          signature: pattern.recognition.signature,
          classification: pattern.classification,
          timestamp: Date.now(),
        });
      }
    });

    // Prune old patterns if needed
    this._prunePatternMemory();
  }

  /**
   * Generate pattern key
   * @private
   * @param {Object} pattern - Input pattern
   * @returns {string} Pattern key
   */
  _generatePatternKey(pattern) {
    const signature = pattern.recognition.signature;
    return `${signature.type}-${this._simpleHash(JSON.stringify(signature))}`;
  }

  /**
   * Prune pattern memory
   * @private
   */
  _prunePatternMemory() {
    if (this.patternMemory.size <= this.maxPatternHistory) return;

    const entries = Array.from(this.patternMemory.entries());
    const sortedEntries = entries.sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    const toRemove = sortedEntries.slice(
      0,
      sortedEntries.length - this.maxPatternHistory
    );

    toRemove.forEach(([key]) => this.patternMemory.delete(key));
  }
}

module.exports = PatternRecognizer;
