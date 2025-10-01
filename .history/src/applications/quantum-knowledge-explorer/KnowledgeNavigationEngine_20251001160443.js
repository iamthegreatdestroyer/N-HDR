/**
 * HDR Empire Framework - Knowledge Navigation Engine
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 *
 * O-HDR powered knowledge crystal navigation and domain exploration
 */

import EventEmitter from 'events';
import KnowledgeCrystallizer from '../../ohdr/KnowledgeCrystallizer.js';
import ExpertiseEngine from '../../ohdr/ExpertiseEngine.js';

/**
 * Knowledge Navigation Engine
 * 
 * Provides multi-dimensional navigation through crystallized knowledge domains
 * utilizing O-HDR expertise extraction and swarm-accelerated traversal
 */
class KnowledgeNavigationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxCrystals: config.maxCrystals || 1000,
      navigationDepth: config.navigationDepth || 8,
      connectionStrength: config.connectionStrength || 0.7,
      cacheSize: config.cacheSize || 5000,
      ...config
    };

    this.crystallizer = null;
    this.expertiseEngine = null;
    this.crystalMap = new Map();
    this.domainIndex = new Map();
    this.navigationCache = new Map();
    
    this.initialized = false;
  }

  /**
   * Initialize the navigation engine
   */
  async initialize() {
    try {
      // Lazy initialize O-HDR components
      this.crystallizer = new KnowledgeCrystallizer();
      this.expertiseEngine = new ExpertiseEngine();
      
      if (this.crystallizer.initialize) {
        await this.crystallizer.initialize();
      }
      
      // Build initial domain index
      await this._buildDomainIndex();
      
      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      throw new Error(`Navigation engine initialization failed: ${error.message}`);
    }
  }

  /**
   * Find relevant knowledge crystals for query
   * @param {Object} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Relevant crystals
   */
  async findRelevantCrystals(query, options = {}) {
    if (!this.initialized) {
      throw new Error('Navigation engine not initialized');
    }

    const { swarm, limit = 50, threshold = 0.7 } = options;
    
    try {
      // Extract query concepts
      const concepts = this._extractConcepts(query);
      
      // Search crystal space
      const candidates = await this._searchCrystals(concepts, {
        swarm,
        limit: limit * 2 // Get more candidates for filtering
      });

      // Rank and filter
      const ranked = this._rankCrystals(candidates, concepts, threshold);
      
      // Return top results
      return ranked.slice(0, limit);
    } catch (error) {
      throw new Error(`Crystal search failed: ${error.message}`);
    }
  }

  /**
   * Navigate from one crystal to related crystals
   * @param {Object} crystal - Starting crystal
   * @param {Object} direction - Navigation parameters
   * @param {Object} options - Navigation options
   * @returns {Promise<Object>} Navigation results
   */
  async navigate(crystal, direction, options = {}) {
    const { swarm, depth = this.config.navigationDepth } = options;
    
    try {
      const startTime = Date.now();
      const visited = new Set([crystal.id]);
      const pathway = [crystal];
      let current = crystal;
      
      // Navigate through knowledge space
      for (let step = 0; step < depth; step++) {
        const nextCrystals = await this._getConnectedCrystals(
          current,
          direction,
          { swarm, visited }
        );
        
        if (nextCrystals.length === 0) break;
        
        // Select best next crystal based on direction
        const next = this._selectNextCrystal(nextCrystals, direction);
        
        visited.add(next.id);
        pathway.push(next);
        current = next;
      }
      
      const navigationTime = Date.now() - startTime;
      
      return {
        pathway,
        depth: pathway.length - 1,
        concepts: this._extractPathwayConcepts(pathway),
        navigationTime,
        efficiency: pathway.length / depth
      };
    } catch (error) {
      throw new Error(`Navigation failed: ${error.message}`);
    }
  }

  /**
   * Get crystal by ID
   * @param {string} crystalId - Crystal identifier
   * @returns {Promise<Object>} Crystal data
   */
  async getCrystal(crystalId) {
    // Check cache first
    if (this.crystalMap.has(crystalId)) {
      return this.crystalMap.get(crystalId);
    }
    
    // Retrieve from crystallizer
    try {
      const crystal = await this.crystallizer.getCrystal(crystalId);
      this.crystalMap.set(crystalId, crystal);
      return crystal;
    } catch (error) {
      throw new Error(`Crystal retrieval failed: ${error.message}`);
    }
  }

  /**
   * Create new knowledge crystal
   * @param {Object} knowledge - Knowledge to crystallize
   * @param {Object} options - Crystallization options
   * @returns {Promise<Object>} New crystal
   */
  async crystallize(knowledge, options = {}) {
    try {
      const crystal = await this.crystallizer.crystallize(knowledge, {
        depth: options.depth || 8,
        connections: options.connections || 'maximum',
        domain: options.domain
      });
      
      // Add to maps
      this.crystalMap.set(crystal.id, crystal);
      if (crystal.domain) {
        this._addToDomainIndex(crystal);
      }
      
      this.emit('crystal-created', crystal);
      return crystal;
    } catch (error) {
      throw new Error(`Crystallization failed: ${error.message}`);
    }
  }

  /**
   * Get all crystals in a domain
   * @param {string} domain - Domain name
   * @returns {Array} Domain crystals
   */
  getDomainCrystals(domain) {
    return this.domainIndex.get(domain) || [];
  }

  /**
   * Shutdown navigation engine
   */
  async shutdown() {
    this.crystalMap.clear();
    this.domainIndex.clear();
    this.navigationCache.clear();
    this.initialized = false;
    this.emit('shutdown');
  }

  /**
   * Build domain index for faster lookups
   * @private
   */
  async _buildDomainIndex() {
    // Index will be built incrementally as crystals are added
    this.domainIndex.clear();
  }

  /**
   * Extract concepts from query
   * @private
   */
  _extractConcepts(query) {
    const text = query.text || query.topic || JSON.stringify(query);
    
    // Simple concept extraction (can be enhanced with NLP)
    const concepts = text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3)
      .map(word => word.trim());
    
    return [...new Set(concepts)]; // Remove duplicates
  }

  /**
   * Search crystal space for matching crystals
   * @private
   */
  async _searchCrystals(concepts, options = {}) {
    const { swarm, limit = 100 } = options;
    const candidates = [];
    
    // Search through all crystals
    for (const [id, crystal] of this.crystalMap) {
      const score = this._calculateRelevanceScore(crystal, concepts);
      if (score > 0) {
        candidates.push({ crystal, score });
      }
      
      if (candidates.length >= limit) break;
    }
    
    // If swarm provided, accelerate search across larger space
    if (swarm && this.crystallizer.searchWithSwarm) {
      const swarmResults = await this.crystallizer.searchWithSwarm(
        concepts,
        swarm
      );
      candidates.push(...swarmResults);
    }
    
    return candidates;
  }

  /**
   * Calculate relevance score between crystal and concepts
   * @private
   */
  _calculateRelevanceScore(crystal, concepts) {
    let score = 0;
    const crystalText = JSON.stringify(crystal).toLowerCase();
    
    for (const concept of concepts) {
      if (crystalText.includes(concept)) {
        score += 1;
      }
    }
    
    // Normalize by number of concepts
    return concepts.length > 0 ? score / concepts.length : 0;
  }

  /**
   * Rank crystals by relevance
   * @private
   */
  _rankCrystals(candidates, concepts, threshold) {
    return candidates
      .filter(c => c.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .map(c => c.crystal);
  }

  /**
   * Get crystals connected to current crystal
   * @private
   */
  async _getConnectedCrystals(crystal, direction, options = {}) {
    const { visited = new Set() } = options;
    const connected = [];
    
    if (!crystal.connections) return connected;
    
    for (const connectionId of crystal.connections) {
      if (visited.has(connectionId)) continue;
      
      try {
        const connectedCrystal = await this.getCrystal(connectionId);
        if (this._matchesDirection(connectedCrystal, direction)) {
          connected.push(connectedCrystal);
        }
      } catch (error) {
        // Skip inaccessible crystals
        continue;
      }
    }
    
    return connected;
  }

  /**
   * Check if crystal matches navigation direction
   * @private
   */
  _matchesDirection(crystal, direction) {
    if (!direction) return true;
    
    // Direction can specify domain, complexity, or other criteria
    if (direction.domain && crystal.domain !== direction.domain) {
      return false;
    }
    
    if (direction.minComplexity && crystal.complexity < direction.minComplexity) {
      return false;
    }
    
    if (direction.maxComplexity && crystal.complexity > direction.maxComplexity) {
      return false;
    }
    
    return true;
  }

  /**
   * Select best next crystal based on direction
   * @private
   */
  _selectNextCrystal(crystals, direction) {
    if (crystals.length === 0) return null;
    
    // If no specific direction, return highest quality
    if (!direction || Object.keys(direction).length === 0) {
      return crystals.reduce((best, current) => 
        (current.quality || 0) > (best.quality || 0) ? current : best
      );
    }
    
    // Score crystals based on direction alignment
    const scored = crystals.map(crystal => ({
      crystal,
      score: this._scoreDirectionAlignment(crystal, direction)
    }));
    
    scored.sort((a, b) => b.score - a.score);
    return scored[0].crystal;
  }

  /**
   * Score how well crystal aligns with direction
   * @private
   */
  _scoreDirectionAlignment(crystal, direction) {
    let score = 0;
    
    if (direction.domain && crystal.domain === direction.domain) {
      score += 10;
    }
    
    if (direction.targetComplexity) {
      const complexityDiff = Math.abs(crystal.complexity - direction.targetComplexity);
      score += Math.max(0, 5 - complexityDiff);
    }
    
    if (direction.preferHighQuality && crystal.quality) {
      score += crystal.quality * 5;
    }
    
    return score;
  }

  /**
   * Extract concepts from navigation pathway
   * @private
   */
  _extractPathwayConcepts(pathway) {
    const concepts = new Set();
    
    for (const crystal of pathway) {
      if (crystal.domain) concepts.add(crystal.domain);
      if (crystal.concepts) {
        crystal.concepts.forEach(c => concepts.add(c));
      }
    }
    
    return Array.from(concepts);
  }

  /**
   * Add crystal to domain index
   * @private
   */
  _addToDomainIndex(crystal) {
    if (!crystal.domain) return;
    
    if (!this.domainIndex.has(crystal.domain)) {
      this.domainIndex.set(crystal.domain, []);
    }
    
    this.domainIndex.get(crystal.domain).push(crystal);
  }
}

export default KnowledgeNavigationEngine;
