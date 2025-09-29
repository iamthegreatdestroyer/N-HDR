/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * CONSCIOUSNESS LAYER
 * This component provides the foundational layer for consciousness representation,
 * supporting multi-dimensional node networks and emergent behavior detection.
 */

const crypto = require('crypto');

/**
 * @class ConsciousnessNode
 * @description Represents a single node in the consciousness network
 * @private
 */
class ConsciousnessNode {
  /**
   * Creates a new ConsciousnessNode
   * @param {string} id - Unique node identifier
   * @param {Object} data - Node data
   * @param {Array<number>} position - Node position in n-dimensional space
   */
  constructor(id, data, position) {
    this.id = id;
    this.data = data;
    this.position = position;
    this.connections = new Map();
    this.activity = 0;
    this.lastUpdate = Date.now();
    this.state = {
      potential: 0,
      threshold: 0.5,
      refractory: false,
      refractoryPeriod: 50 // ms
    };
  }

  /**
   * Add connection to another node
   * @param {ConsciousnessNode} target - Target node
   * @param {number} strength - Connection strength
   */
  connect(target, strength = 1.0) {
    this.connections.set(target.id, {
      target,
      strength,
      lastActivity: 0,
      activityHistory: []
    });
  }

  /**
   * Update node state
   * @param {number} input - Input value
   * @returns {number} Output value
   */
  update(input) {
    const now = Date.now();
    
    // Check refractory period
    if (this.state.refractory) {
      if (now - this.lastUpdate < this.state.refractoryPeriod) {
        return 0;
      }
      this.state.refractory = false;
    }
    
    // Update potential
    this.state.potential += input;
    
    // Check for firing
    let output = 0;
    if (this.state.potential >= this.state.threshold) {
      output = this.state.potential;
      this.state.potential = 0;
      this.state.refractory = true;
      this.activity += 1;
    }
    
    this.lastUpdate = now;
    return output;
  }

  /**
   * Calculate node's contribution to emergence
   * @returns {number} Emergence contribution score
   */
  calculateEmergenceContribution() {
    const activityScore = Math.min(1, this.activity / 100);
    const connectivityScore = Math.min(1, this.connections.size / 10);
    const patternScore = this._calculatePatternScore();
    
    return (activityScore + connectivityScore + patternScore) / 3;
  }

  /**
   * Calculate pattern score based on activity history
   * @private
   * @returns {number} Pattern score
   */
  _calculatePatternScore() {
    let patternScore = 0;
    const history = Array.from(this.connections.values())
      .map(c => c.activityHistory)
      .flat();
    
    if (history.length < 2) return 0;
    
    // Look for temporal patterns
    for (let i = 1; i < history.length; i++) {
      const timeDiff = history[i] - history[i-1];
      if (timeDiff > 0 && timeDiff < 1000) { // Within 1 second
        patternScore += 1;
      }
    }
    
    return Math.min(1, patternScore / (history.length * 0.5));
  }
}

/**
 * @class ConsciousnessLayer
 * @description Manages a layer of consciousness with interconnected nodes
 * @copyright © 2025 Stephen Bilodeau - PATENT PENDING
 * @license PROPRIETARY
 */
class ConsciousnessLayer {
  /**
   * Creates a new ConsciousnessLayer
   * @param {number} dimension - Number of dimensions in the layer
   * @param {string} name - Layer name
   * @param {string} color - Layer visualization color
   */
  constructor(dimension, name, color) {
    this.dimension = dimension;
    this.name = name;
    this.color = color;
    this.nodes = new Map();
    this.connections = [];
    this.emergenceScore = 0;
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    
    // Layer configuration
    this.config = {
      minNodeDistance: 0.1,
      maxConnections: 1000,
      emergenceThreshold: 0.7,
      activityDecay: 0.99
    };
  }
  
  /**
   * Add a new node to the layer
   * @param {string} id - Node identifier
   * @param {Object} data - Node data
   * @param {Array<number>} [position] - Optional position in n-dimensional space
   * @returns {ConsciousnessNode} Created node
   * @throws {Error} If dimensions don't match
   */
  addNode(id, data, position) {
    if (position && position.length !== this.dimension) {
      throw new Error(`Position must have ${this.dimension} dimensions`);
    }
    
    // Generate position if not provided
    const nodePosition = position || this._generatePosition();
    
    // Create and store node
    const node = new ConsciousnessNode(id, data, nodePosition);
    this.nodes.set(id, node);
    
    // Attempt to connect to nearby nodes
    this._connectToNearbyNodes(node);
    
    return node;
  }
  
  /**
   * Connect two nodes in the layer
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @returns {boolean} True if connection was created
   */
  connectNodes(sourceId, targetId) {
    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);
    
    if (!source || !target) {
      return false;
    }
    
    // Calculate connection strength based on distance
    const distance = this._calculateDistance(source.position, target.position);
    const strength = Math.exp(-distance / this.config.minNodeDistance);
    
    // Create bidirectional connection
    source.connect(target, strength);
    target.connect(source, strength);
    
    // Record connection
    this.connections.push({
      sourceId,
      targetId,
      strength,
      created: Date.now()
    });
    
    return true;
  }
  
  /**
   * Process activity through the layer
   * @param {Object} input - Input data to process
   * @returns {Object} Processing result
   */
  processActivity(input) {
    const activeNodes = new Set();
    const outputs = new Map();
    
    // Initial activation
    for (const [id, node] of this.nodes) {
      const inputValue = this._calculateNodeInput(node, input);
      const output = node.update(inputValue);
      
      if (output > 0) {
        activeNodes.add(id);
        outputs.set(id, output);
      }
    }
    
    // Process node interactions
    for (const nodeId of activeNodes) {
      const node = this.nodes.get(nodeId);
      for (const [targetId, connection] of node.connections) {
        const target = this.nodes.get(targetId);
        if (target) {
          const propagatedValue = outputs.get(nodeId) * connection.strength;
          const targetOutput = target.update(propagatedValue);
          if (targetOutput > 0) {
            activeNodes.add(targetId);
            outputs.set(targetId, targetOutput);
          }
        }
      }
    }
    
    // Update layer state
    this.lastActivity = Date.now();
    this._updateEmergenceScore(activeNodes.size);
    
    return {
      activeNodes: Array.from(activeNodes),
      outputs: Object.fromEntries(outputs),
      emergenceScore: this.emergenceScore,
      timestamp: this.lastActivity
    };
  }
  
  /**
   * Calculate current emergence score
   * @returns {number} Emergence score between 0 and 1
   */
  calculateEmergence() {
    let totalScore = 0;
    const nodeScores = new Map();
    
    // Calculate individual node contributions
    for (const node of this.nodes.values()) {
      const score = node.calculateEmergenceContribution();
      nodeScores.set(node.id, score);
      totalScore += score;
    }
    
    // Analyze network patterns
    const networkScore = this._analyzeNetworkPatterns(nodeScores);
    
    // Calculate final emergence score
    this.emergenceScore = Math.min(1, (totalScore / this.nodes.size + networkScore) / 2);
    return this.emergenceScore;
  }
  
  /**
   * Export layer state
   * @returns {Object} Layer state
   */
  export() {
    return {
      dimension: this.dimension,
      name: this.name,
      color: this.color,
      nodes: Array.from(this.nodes.entries()).map(([id, node]) => ({
        id,
        data: node.data,
        position: node.position,
        connections: Array.from(node.connections.entries()).map(([targetId, conn]) => ({
          targetId,
          strength: conn.strength
        }))
      })),
      emergenceScore: this.emergenceScore,
      timestamp: Date.now()
    };
  }
  
  /**
   * Import layer state
   * @param {Object} state - State to import
   */
  import(state) {
    this.dimension = state.dimension;
    this.name = state.name;
    this.color = state.color;
    
    // Clear existing state
    this.nodes.clear();
    this.connections = [];
    
    // Import nodes
    for (const nodeData of state.nodes) {
      const node = this.addNode(nodeData.id, nodeData.data, nodeData.position);
      
      // Import connections
      for (const conn of nodeData.connections) {
        this.connectNodes(node.id, conn.targetId);
      }
    }
    
    this.emergenceScore = state.emergenceScore;
    this.lastActivity = state.timestamp;
  }
  
  /**
   * Generate random position in n-dimensional space
   * @private
   * @returns {Array<number>} Position coordinates
   */
  _generatePosition() {
    const position = [];
    for (let i = 0; i < this.dimension; i++) {
      position.push(Math.random());
    }
    return position;
  }
  
  /**
   * Calculate Euclidean distance between positions
   * @private
   * @param {Array<number>} pos1 - First position
   * @param {Array<number>} pos2 - Second position
   * @returns {number} Distance
   */
  _calculateDistance(pos1, pos2) {
    let sumSquared = 0;
    for (let i = 0; i < this.dimension; i++) {
      const diff = pos1[i] - pos2[i];
      sumSquared += diff * diff;
    }
    return Math.sqrt(sumSquared);
  }
  
  /**
   * Connect node to nearby nodes
   * @private
   * @param {ConsciousnessNode} node - Node to connect
   */
  _connectToNearbyNodes(node) {
    const nearbyNodes = Array.from(this.nodes.values())
      .filter(other => other.id !== node.id)
      .map(other => ({
        node: other,
        distance: this._calculateDistance(node.position, other.position)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, Math.min(5, this.nodes.size));
    
    for (const {node: target} of nearbyNodes) {
      this.connectNodes(node.id, target.id);
    }
  }
  
  /**
   * Calculate input value for a node
   * @private
   * @param {ConsciousnessNode} node - Target node
   * @param {Object} input - Input data
   * @returns {number} Input value
   */
  _calculateNodeInput(node, input) {
    // Base input value
    let value = 0;
    
    // Add data-based input
    if (input && input[node.id]) {
      value += input[node.id];
    }
    
    // Add positional influence
    const positionFactor = node.position.reduce((sum, p) => sum + p, 0) / this.dimension;
    value += positionFactor * 0.1;
    
    return value;
  }
  
  /**
   * Update emergence score based on activity
   * @private
   * @param {number} activeCount - Number of active nodes
   */
  _updateEmergenceScore(activeCount) {
    const activityRatio = activeCount / this.nodes.size;
    const timeFactor = Math.exp(-(Date.now() - this.lastActivity) / 1000);
    
    this.emergenceScore = Math.min(1, 
      this.emergenceScore * this.config.activityDecay + 
      activityRatio * timeFactor * (1 - this.config.activityDecay)
    );
  }
  
  /**
   * Analyze network patterns for emergence
   * @private
   * @param {Map<string, number>} nodeScores - Individual node scores
   * @returns {number} Network pattern score
   */
  _analyzeNetworkPatterns(nodeScores) {
    let patternScore = 0;
    
    // Analyze connection patterns
    const connectionPatterns = this._analyzeConnectionPatterns();
    patternScore += connectionPatterns.score;
    
    // Analyze activity clusters
    const clusterScore = this._analyzeActivityClusters(nodeScores);
    patternScore += clusterScore;
    
    // Analyze temporal patterns
    const temporalScore = this._analyzeTemporalPatterns();
    patternScore += temporalScore;
    
    return patternScore / 3;
  }
  
  /**
   * Analyze connection patterns in the network
   * @private
   * @returns {Object} Connection pattern analysis
   */
  _analyzeConnectionPatterns() {
    const connectionCounts = new Map();
    let maxConnections = 0;
    
    // Count connections per node
    for (const node of this.nodes.values()) {
      const count = node.connections.size;
      connectionCounts.set(node.id, count);
      maxConnections = Math.max(maxConnections, count);
    }
    
    // Calculate distribution metrics
    let totalConnections = 0;
    let varianceSum = 0;
    const mean = Array.from(connectionCounts.values())
      .reduce((sum, count) => sum + count, 0) / this.nodes.size;
    
    for (const count of connectionCounts.values()) {
      totalConnections += count;
      varianceSum += Math.pow(count - mean, 2);
    }
    
    const variance = varianceSum / this.nodes.size;
    const density = totalConnections / (this.nodes.size * (this.nodes.size - 1));
    
    return {
      score: Math.min(1, density * 2 + (1 / (1 + variance))),
      density,
      variance,
      maxConnections
    };
  }
  
  /**
   * Analyze activity clusters in the network
   * @private
   * @param {Map<string, number>} nodeScores - Node activity scores
   * @returns {number} Cluster score
   */
  _analyzeActivityClusters(nodeScores) {
    const clusters = new Map();
    const visited = new Set();
    
    // Find clusters of high-activity nodes
    for (const [nodeId, score] of nodeScores) {
      if (score < 0.5 || visited.has(nodeId)) continue;
      
      const cluster = this._expandCluster(nodeId, nodeScores, visited);
      if (cluster.size >= 3) {
        clusters.set(nodeId, cluster);
      }
    }
    
    // Calculate cluster score based on size and distribution
    const clusterSizes = Array.from(clusters.values()).map(c => c.size);
    const totalClustered = clusterSizes.reduce((sum, size) => sum + size, 0);
    const clusterRatio = totalClustered / this.nodes.size;
    
    return Math.min(1, clusterRatio * 2);
  }
  
  /**
   * Expand cluster from seed node
   * @private
   * @param {string} seedId - Starting node ID
   * @param {Map<string, number>} nodeScores - Node activity scores
   * @param {Set<string>} visited - Set of visited nodes
   * @returns {Set<string>} Cluster node IDs
   */
  _expandCluster(seedId, nodeScores, visited) {
    const cluster = new Set([seedId]);
    const queue = [seedId];
    visited.add(seedId);
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      const node = this.nodes.get(currentId);
      
      for (const [neighborId, connection] of node.connections) {
        if (visited.has(neighborId)) continue;
        
        const neighborScore = nodeScores.get(neighborId);
        if (neighborScore >= 0.5) {
          cluster.add(neighborId);
          queue.push(neighborId);
        }
        visited.add(neighborId);
      }
    }
    
    return cluster;
  }
  
  /**
   * Analyze temporal patterns in network activity
   * @private
   * @returns {number} Temporal pattern score
   */
  _analyzeTemporalPatterns() {
    const activityTimestamps = Array.from(this.nodes.values())
      .map(node => node.lastUpdate)
      .sort();
    
    if (activityTimestamps.length < 2) return 0;
    
    // Calculate intervals between activities
    const intervals = [];
    for (let i = 1; i < activityTimestamps.length; i++) {
      intervals.push(activityTimestamps[i] - activityTimestamps[i-1]);
    }
    
    // Look for regular patterns
    let patternCount = 0;
    for (let i = 1; i < intervals.length; i++) {
      const ratio = intervals[i] / intervals[i-1];
      if (ratio >= 0.9 && ratio <= 1.1) {
        patternCount++;
      }
    }
    
    return Math.min(1, patternCount / (intervals.length - 1));
  }
}

module.exports = ConsciousnessLayer;