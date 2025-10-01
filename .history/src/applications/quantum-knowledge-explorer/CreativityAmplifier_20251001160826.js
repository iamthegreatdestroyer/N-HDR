/**
 * HDR Empire Framework - Creativity Amplifier
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 *
 * D-HDR powered creativity pattern recognition and insight amplification
 */

import EventEmitter from 'events';

/**
 * Creativity Amplifier
 * 
 * Amplifies creative connections and non-linear insights using
 * D-HDR dream-state pattern recognition and subconscious processing
 */
class CreativityAmplifier extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      creativityThreshold: config.creativityThreshold || 0.85,
      patternDepth: config.patternDepth || 12,
      nonLinearWeight: config.nonLinearWeight || 0.7,
      insightMinimum: config.insightMinimum || 3,
      ...config
    };

    this.patternCache = new Map();
    this.insightHistory = [];
    this.connectionGraph = new Map();
    
    this.initialized = false;
  }

  /**
   * Initialize the amplifier
   */
  async initialize() {
    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Amplify creative connections in exploration results
   * @param {Object} results - Exploration results
   * @returns {Promise<Object>} Amplified results
   */
  async amplify(results) {
    if (!this.initialized) {
      throw new Error('Creativity amplifier not initialized');
    }

    const { crystals, pathways, spaces } = results;

    try {
      // Detect creative patterns
      const patterns = await this._detectPatterns(crystals, pathways, spaces);

      // Generate non-linear connections
      const connections = await this._generateConnections(patterns);

      // Extract insights
      const insights = await this._extractInsights(patterns, connections);

      // Amplify weak signals
      const amplifiedInsights = this._amplifySignals(insights);

      this.emit('amplification-complete', {
        patternCount: patterns.length,
        connectionCount: connections.length,
        insightCount: amplifiedInsights.length
      });

      return {
        insights: amplifiedInsights,
        connections,
        patterns,
        metadata: {
          creativityScore: this._calculateCreativityScore(amplifiedInsights),
          nonLinearityScore: this._calculateNonLinearityScore(connections),
          amplificationFactor: amplifiedInsights.length / Math.max(1, insights.length)
        }
      };
    } catch (error) {
      throw new Error(`Creativity amplification failed: ${error.message}`);
    }
  }

  /**
   * Generate creative suggestions
   * @param {Object} context - Current context
   * @returns {Promise<Array>} Creative suggestions
   */
  async generateSuggestions(context) {
    try {
      const suggestions = [];

      // Analyze context for creative opportunities
      const opportunities = this._identifyOpportunities(context);

      // Generate suggestions for each opportunity
      for (const opportunity of opportunities) {
        const suggestion = await this._createSuggestion(opportunity);
        suggestions.push(suggestion);
      }

      // Rank by creativity potential
      suggestions.sort((a, b) => b.creativityScore - a.creativityScore);

      return suggestions;
    } catch (error) {
      throw new Error(`Suggestion generation failed: ${error.message}`);
    }
  }

  /**
   * Shutdown amplifier
   */
  async shutdown() {
    this.patternCache.clear();
    this.insightHistory = [];
    this.connectionGraph.clear();
    this.initialized = false;
    this.emit('shutdown');
  }

  /**
   * Detect creative patterns
   * @private
   */
  async _detectPatterns(crystals, pathways, spaces) {
    const patterns = [];

    // Pattern detection across crystals
    const crystalPatterns = this._detectCrystalPatterns(crystals);
    patterns.push(...crystalPatterns);

    // Pattern detection across pathways
    const pathwayPatterns = this._detectPathwayPatterns(pathways);
    patterns.push(...pathwayPatterns);

    // Pattern detection across spaces
    const spacePatterns = this._detectSpacePatterns(spaces);
    patterns.push(...spacePatterns);

    // Cross-domain patterns
    const crossPatterns = this._detectCrossPatterns(crystals, pathways, spaces);
    patterns.push(...crossPatterns);

    // Cache patterns
    patterns.forEach(p => this.patternCache.set(p.id, p));

    return patterns;
  }

  /**
   * Detect patterns in crystals
   * @private
   */
  _detectCrystalPatterns(crystals) {
    const patterns = [];

    // Group by domain
    const domainGroups = new Map();
    for (const crystal of crystals) {
      if (!crystal.domain) continue;
      
      if (!domainGroups.has(crystal.domain)) {
        domainGroups.set(crystal.domain, []);
      }
      domainGroups.get(crystal.domain).push(crystal);
    }

    // Create patterns from groups
    for (const [domain, group] of domainGroups) {
      if (group.length >= 2) {
        patterns.push({
          id: `pattern-crystal-${domain}-${Date.now()}`,
          type: 'crystal-cluster',
          domain,
          elements: group,
          strength: group.length / crystals.length,
          creativity: this._assessPatternCreativity(group)
        });
      }
    }

    return patterns;
  }

  /**
   * Detect patterns in pathways
   * @private
   */
  _detectPathwayPatterns(pathways) {
    const patterns = [];

    // Find converging pathways
    const convergenceGroups = this._findConvergingPathways(pathways);
    
    for (const group of convergenceGroups) {
      patterns.push({
        id: `pattern-pathway-convergence-${Date.now()}`,
        type: 'pathway-convergence',
        elements: group,
        strength: group.length / pathways.length,
        creativity: 0.8
      });
    }

    // Find diverging pathways
    const divergenceGroups = this._findDivergingPathways(pathways);
    
    for (const group of divergenceGroups) {
      patterns.push({
        id: `pattern-pathway-divergence-${Date.now()}`,
        type: 'pathway-divergence',
        elements: group,
        strength: group.length / pathways.length,
        creativity: 0.9
      });
    }

    return patterns;
  }

  /**
   * Detect patterns in reality spaces
   * @private
   */
  _detectSpacePatterns(spaces) {
    const patterns = [];

    // Find similar compression ratios
    const ratioGroups = new Map();
    for (const space of spaces) {
      const ratio = Math.floor(space.compressionRatio / 1000);
      if (!ratioGroups.has(ratio)) {
        ratioGroups.set(ratio, []);
      }
      ratioGroups.get(ratio).push(space);
    }

    for (const [ratio, group] of ratioGroups) {
      if (group.length >= 2) {
        patterns.push({
          id: `pattern-space-${ratio}-${Date.now()}`,
          type: 'space-similarity',
          compressionRatio: ratio * 1000,
          elements: group,
          strength: group.length / spaces.length,
          creativity: 0.7
        });
      }
    }

    return patterns;
  }

  /**
   * Detect cross-domain patterns
   * @private
   */
  _detectCrossPatterns(crystals, pathways, spaces) {
    const patterns = [];

    // Pattern: high-probability pathways from high-quality crystals
    const highQualityCrystals = crystals.filter(c => (c.quality || 0) > 0.8);
    const highProbPathways = pathways.filter(p => p.probability > 0.7);

    if (highQualityCrystals.length > 0 && highProbPathways.length > 0) {
      patterns.push({
        id: `pattern-cross-quality-${Date.now()}`,
        type: 'quality-probability',
        elements: {
          crystals: highQualityCrystals,
          pathways: highProbPathways
        },
        strength: 0.85,
        creativity: 0.95
      });
    }

    // Pattern: compressed spaces with many pathways
    const denseSpaces = spaces.filter(s => s.pathwayCount > 5);
    
    if (denseSpaces.length > 0) {
      patterns.push({
        id: `pattern-cross-density-${Date.now()}`,
        type: 'space-density',
        elements: { spaces: denseSpaces },
        strength: 0.75,
        creativity: 0.88
      });
    }

    return patterns;
  }

  /**
   * Generate non-linear connections
   * @private
   */
  async _generateConnections(patterns) {
    const connections = [];

    // Connect patterns that share elements
    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        const connection = this._findConnection(patterns[i], patterns[j]);
        if (connection) {
          connections.push(connection);
          this._addToConnectionGraph(patterns[i].id, patterns[j].id, connection);
        }
      }
    }

    // Generate surprising connections (non-linear)
    const surprisingConnections = this._generateSurprisingConnections(patterns);
    connections.push(...surprisingConnections);

    return connections;
  }

  /**
   * Find connection between patterns
   * @private
   */
  _findConnection(pattern1, pattern2) {
    // Check for shared elements
    const shared = this._findSharedElements(pattern1, pattern2);
    
    if (shared.length > 0) {
      return {
        id: `connection-${pattern1.id}-${pattern2.id}`,
        source: pattern1.id,
        target: pattern2.id,
        type: 'shared-elements',
        strength: shared.length / 10,
        sharedElements: shared,
        nonLinear: false
      };
    }

    return null;
  }

  /**
   * Find shared elements between patterns
   * @private
   */
  _findSharedElements(pattern1, pattern2) {
    const elements1 = Array.isArray(pattern1.elements) ? pattern1.elements : [];
    const elements2 = Array.isArray(pattern2.elements) ? pattern2.elements : [];

    const ids1 = new Set(elements1.map(e => e.id));
    return elements2.filter(e => ids1.has(e.id));
  }

  /**
   * Generate surprising non-linear connections
   * @private
   */
  _generateSurprisingConnections(patterns) {
    const surprising = [];

    // Connect distant patterns based on creativity scores
    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 2; j < patterns.length; j++) { // Skip adjacent
        if (patterns[i].creativity > 0.8 && patterns[j].creativity > 0.8) {
          surprising.push({
            id: `connection-surprising-${patterns[i].id}-${patterns[j].id}`,
            source: patterns[i].id,
            target: patterns[j].id,
            type: 'creative-resonance',
            strength: (patterns[i].creativity + patterns[j].creativity) / 2,
            nonLinear: true
          });
        }
      }
    }

    return surprising;
  }

  /**
   * Extract insights from patterns and connections
   * @private
   */
  async _extractInsights(patterns, connections) {
    const insights = [];

    // Insights from strong patterns
    for (const pattern of patterns) {
      if (pattern.strength > 0.7) {
        insights.push({
          id: `insight-pattern-${pattern.id}`,
          type: 'pattern-insight',
          source: pattern.id,
          description: this._generatePatternInsight(pattern),
          confidence: pattern.strength,
          creativity: pattern.creativity
        });
      }
    }

    // Insights from strong connections
    for (const connection of connections) {
      if (connection.strength > 0.6 || connection.nonLinear) {
        insights.push({
          id: `insight-connection-${connection.id}`,
          type: 'connection-insight',
          source: connection.id,
          description: this._generateConnectionInsight(connection),
          confidence: connection.strength,
          creativity: connection.nonLinear ? 0.9 : 0.7
        });
      }
    }

    return insights;
  }

  /**
   * Amplify weak signals
   * @private
   */
  _amplifySignals(insights) {
    return insights
      .filter(i => i.creativity >= this.config.creativityThreshold || i.confidence > 0.75)
      .map(insight => ({
        ...insight,
        amplified: true,
        amplificationFactor: this._calculateAmplificationFactor(insight)
      }));
  }

  /**
   * Calculate amplification factor
   * @private
   */
  _calculateAmplificationFactor(insight) {
    const creativityBonus = insight.creativity > 0.9 ? 1.5 : 1.0;
    const confidenceBonus = insight.confidence > 0.8 ? 1.3 : 1.0;
    return creativityBonus * confidenceBonus;
  }

  /**
   * Calculate creativity score
   * @private
   */
  _calculateCreativityScore(insights) {
    if (insights.length === 0) return 0;
    return insights.reduce((sum, i) => sum + i.creativity, 0) / insights.length;
  }

  /**
   * Calculate non-linearity score
   * @private
   */
  _calculateNonLinearityScore(connections) {
    if (connections.length === 0) return 0;
    const nonLinear = connections.filter(c => c.nonLinear).length;
    return nonLinear / connections.length;
  }

  /**
   * Generate insight description for pattern
   * @private
   */
  _generatePatternInsight(pattern) {
    switch (pattern.type) {
      case 'crystal-cluster':
        return `Strong clustering in ${pattern.domain} domain with ${pattern.elements.length} related concepts`;
      case 'pathway-convergence':
        return `${pattern.elements.length} pathways converging toward similar outcomes`;
      case 'pathway-divergence':
        return `${pattern.elements.length} pathways diverging into multiple possibilities`;
      case 'space-similarity':
        return `${pattern.elements.length} reality spaces with similar compression characteristics`;
      default:
        return `Pattern detected: ${pattern.type}`;
    }
  }

  /**
   * Generate insight description for connection
   * @private
   */
  _generateConnectionInsight(connection) {
    if (connection.nonLinear) {
      return `Non-linear creative connection discovered between distant patterns`;
    }
    return `Strong connection through ${connection.sharedElements?.length || 0} shared elements`;
  }

  /**
   * Assess pattern creativity
   * @private
   */
  _assessPatternCreativity(elements) {
    // Higher creativity for diverse elements
    const complexities = elements.map(e => e.complexity || 0);
    const variance = this._calculateVariance(complexities);
    return Math.min(1, variance / 10);
  }

  /**
   * Calculate variance
   * @private
   */
  _calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Find converging pathways
   * @private
   */
  _findConvergingPathways(pathways) {
    const groups = [];
    const processed = new Set();

    for (const pathway of pathways) {
      if (processed.has(pathway.id)) continue;

      const group = [pathway];
      processed.add(pathway.id);

      for (const other of pathways) {
        if (processed.has(other.id)) continue;

        if (this._areConverging(pathway, other)) {
          group.push(other);
          processed.add(other.id);
        }
      }

      if (group.length >= 2) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Check if pathways are converging
   * @private
   */
  _areConverging(pathway1, pathway2) {
    // Simple heuristic: similar final probabilities
    return Math.abs(pathway1.probability - pathway2.probability) < 0.2;
  }

  /**
   * Find diverging pathways
   * @private
   */
  _findDivergingPathways(pathways) {
    const groups = [];
    const processed = new Set();

    for (const pathway of pathways) {
      if (processed.has(pathway.id)) continue;

      const group = [pathway];
      processed.add(pathway.id);

      for (const other of pathways) {
        if (processed.has(other.id)) continue;

        if (this._areDiverging(pathway, other)) {
          group.push(other);
          processed.add(other.id);
        }
      }

      if (group.length >= 2) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Check if pathways are diverging
   * @private
   */
  _areDiverging(pathway1, pathway2) {
    // Simple heuristic: very different probabilities
    return Math.abs(pathway1.probability - pathway2.probability) > 0.5;
  }

  /**
   * Identify creative opportunities
   * @private
   */
  _identifyOpportunities(context) {
    return [
      { type: 'unexplored-domain', score: 0.8 },
      { type: 'weak-connection', score: 0.7 },
      { type: 'pattern-gap', score: 0.9 }
    ];
  }

  /**
   * Create suggestion from opportunity
   * @private
   */
  async _createSuggestion(opportunity) {
    return {
      id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: opportunity.type,
      creativityScore: opportunity.score,
      description: `Explore ${opportunity.type} for creative insights`,
      actionable: true
    };
  }

  /**
   * Add to connection graph
   * @private
   */
  _addToConnectionGraph(sourceId, targetId, connection) {
    if (!this.connectionGraph.has(sourceId)) {
      this.connectionGraph.set(sourceId, []);
    }
    this.connectionGraph.get(sourceId).push({ targetId, connection });
  }
}

export default CreativityAmplifier;
