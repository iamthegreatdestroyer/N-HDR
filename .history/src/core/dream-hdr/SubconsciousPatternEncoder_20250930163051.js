/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Subconscious Pattern Encoder
 * Encodes and processes subconscious patterns from consciousness data.
 */

class SubconsciousPatternEncoder {
    constructor(config = {}) {
        this.encodingDepth = config.depth || 6;
        this.patternThreshold = config.threshold || 0.3;
        this.compressionLevel = config.compression || 0.7;
        this.patterns = new Map();
        this.activeEncodings = new Set();
    }

    /**
     * Encode consciousness data into patterns
     * @param {Object} consciousness - Consciousness state data
     * @returns {Promise<Array>} Encoded patterns
     */
    async encode(consciousness) {
        try {
            const rawPatterns = await this._extractPatterns(consciousness);
            const filtered = this._filterPatterns(rawPatterns);
            const encoded = await this._encodePatterns(filtered);
            
            const encodingId = this._generateEncodingId();
            this.patterns.set(encodingId, encoded);
            this.activeEncodings.add(encodingId);

            return encoded;
        } catch (error) {
            throw new Error(`Pattern encoding failed: ${error.message}`);
        }
    }

    /**
     * Merge multiple pattern sets
     * @param {Array<Array>} patternSets - Sets of patterns to merge
     * @returns {Promise<Array>} Merged patterns
     */
    async merge(patternSets) {
        try {
            const flattened = patternSets.flat();
            const unique = this._removeDuplicates(flattened);
            const consolidated = await this._consolidatePatterns(unique);

            return this._compressPatterns(consolidated);
        } catch (error) {
            throw new Error(`Pattern merge failed: ${error.message}`);
        }
    }

    /**
     * Extract patterns from consciousness data
     * @private
     * @param {Object} consciousness - Consciousness data
     * @returns {Promise<Array>} Raw patterns
     */
    async _extractPatterns(consciousness) {
        const patterns = [];

        // Extract emotional patterns
        if (consciousness.emotional) {
            patterns.push(...this._extractEmotionalPatterns(consciousness.emotional));
        }

        // Extract memory patterns
        if (consciousness.memory) {
            patterns.push(...this._extractMemoryPatterns(consciousness.memory));
        }

        // Extract thought patterns
        if (consciousness.thoughts) {
            patterns.push(...this._extractThoughtPatterns(consciousness.thoughts));
        }

        return patterns;
    }

    /**
     * Extract emotional patterns
     * @private
     * @param {Object} emotional - Emotional data
     * @returns {Array} Emotional patterns
     */
    _extractEmotionalPatterns(emotional) {
        return Object.entries(emotional).map(([type, intensity]) => ({
            type: 'emotional',
            pattern: type,
            intensity: parseFloat(intensity),
            timestamp: Date.now()
        }));
    }

    /**
     * Extract memory patterns
     * @private
     * @param {Object} memory - Memory data
     * @returns {Array} Memory patterns
     */
    _extractMemoryPatterns(memory) {
        return memory.map(mem => ({
            type: 'memory',
            pattern: mem.content,
            strength: mem.strength || 0.5,
            associations: mem.associations || [],
            timestamp: mem.timestamp || Date.now()
        }));
    }

    /**
     * Extract thought patterns
     * @private
     * @param {Object} thoughts - Thought data
     * @returns {Array} Thought patterns
     */
    _extractThoughtPatterns(thoughts) {
        return thoughts.map(thought => ({
            type: 'thought',
            pattern: thought.content,
            intensity: thought.intensity || 0.5,
            connections: thought.connections || [],
            timestamp: thought.timestamp || Date.now()
        }));
    }

    /**
     * Filter patterns based on threshold
     * @private
     * @param {Array} patterns - Raw patterns
     * @returns {Array} Filtered patterns
     */
    _filterPatterns(patterns) {
        return patterns.filter(pattern => {
            const intensity = pattern.intensity || pattern.strength || 0.5;
            return intensity >= this.patternThreshold;
        });
    }

    /**
     * Encode patterns into neural format
     * @private
     * @param {Array} patterns - Filtered patterns
     * @returns {Promise<Array>} Encoded patterns
     */
    async _encodePatterns(patterns) {
        return Promise.all(patterns.map(async pattern => {
            const encoded = await this._encodePattern(pattern);
            return {
                ...pattern,
                encoded,
                depth: this.encodingDepth,
                compression: this.compressionLevel
            };
        }));
    }

    /**
     * Encode single pattern
     * @private
     * @param {Object} pattern - Pattern to encode
     * @returns {Promise<Object>} Encoded pattern
     */
    async _encodePattern(pattern) {
        // Generate neural encoding
        const encoding = {
            nodes: this._generateNodes(pattern),
            connections: this._generateConnections(pattern),
            weights: this._calculateWeights(pattern)
        };

        // Apply compression
        return this._compressEncoding(encoding);
    }

    /**
     * Generate neural nodes
     * @private
     * @param {Object} pattern - Pattern data
     * @returns {Array} Neural nodes
     */
    _generateNodes(pattern) {
        const nodes = [];
        const baseIntensity = pattern.intensity || pattern.strength || 0.5;

        for (let i = 0; i < this.encodingDepth; i++) {
            nodes.push({
                id: `node-${i}`,
                level: i,
                intensity: baseIntensity * Math.pow(0.9, i),
                type: pattern.type
            });
        }

        return nodes;
    }

    /**
     * Generate neural connections
     * @private
     * @param {Object} pattern - Pattern data
     * @returns {Array} Neural connections
     */
    _generateConnections(pattern) {
        const connections = [];
        const associations = pattern.associations || pattern.connections || [];

        for (let i = 0; i < this.encodingDepth - 1; i++) {
            for (let j = i + 1; j < this.encodingDepth; j++) {
                connections.push({
                    from: `node-${i}`,
                    to: `node-${j}`,
                    strength: this._calculateConnectionStrength(i, j, associations)
                });
            }
        }

        return connections;
    }

    /**
     * Calculate connection strength
     * @private
     * @param {number} fromLevel - Source level
     * @param {number} toLevel - Target level
     * @param {Array} associations - Pattern associations
     * @returns {number} Connection strength
     */
    _calculateConnectionStrength(fromLevel, toLevel, associations) {
        const baseStrength = 1 - (toLevel - fromLevel) / this.encodingDepth;
        const associationBoost = associations.length ?
            Math.min(0.2, associations.length * 0.05) : 0;

        return Math.min(1, baseStrength + associationBoost);
    }

    /**
     * Calculate pattern weights
     * @private
     * @param {Object} pattern - Pattern data
     * @returns {Object} Pattern weights
     */
    _calculateWeights(pattern) {
        return {
            emotional: pattern.type === 'emotional' ? 0.4 : 0.2,
            memory: pattern.type === 'memory' ? 0.4 : 0.2,
            thought: pattern.type === 'thought' ? 0.4 : 0.2,
            temporal: 0.2
        };
    }

    /**
     * Compress neural encoding
     * @private
     * @param {Object} encoding - Neural encoding
     * @returns {Object} Compressed encoding
     */
    _compressEncoding(encoding) {
        const compressionFactor = 1 - this.compressionLevel;

        // Compress nodes
        const compressedNodes = encoding.nodes.filter((_, index) =>
            index % Math.ceil(1 / compressionFactor) === 0
        );

        // Compress connections
        const compressedConnections = encoding.connections.filter(conn =>
            compressedNodes.some(n => n.id === conn.from) &&
            compressedNodes.some(n => n.id === conn.to)
        );

        return {
            ...encoding,
            nodes: compressedNodes,
            connections: compressedConnections,
            compressionRatio: compressionFactor
        };
    }

    /**
     * Remove duplicate patterns
     * @private
     * @param {Array} patterns - Pattern array
     * @returns {Array} Unique patterns
     */
    _removeDuplicates(patterns) {
        const seen = new Set();
        return patterns.filter(pattern => {
            const key = JSON.stringify({
                type: pattern.type,
                pattern: pattern.pattern
            });

            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    /**
     * Consolidate patterns
     * @private
     * @param {Array} patterns - Pattern array
     * @returns {Promise<Array>} Consolidated patterns
     */
    async _consolidatePatterns(patterns) {
        const groups = new Map();

        // Group patterns
        patterns.forEach(pattern => {
            const key = `${pattern.type}-${pattern.pattern}`;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(pattern);
        });

        // Consolidate groups
        return Array.from(groups.values()).map(group => {
            const base = group[0];
            const consolidated = {
                ...base,
                intensity: this._averageIntensity(group),
                frequency: group.length,
                lastSeen: Math.max(...group.map(p => p.timestamp))
            };

            if (base.encoded) {
                consolidated.encoded = this._mergeEncodings(
                    group.map(p => p.encoded)
                );
            }

            return consolidated;
        });
    }

    /**
     * Average pattern intensity
     * @private
     * @param {Array} patterns - Pattern array
     * @returns {number} Average intensity
     */
    _averageIntensity(patterns) {
        const intensities = patterns.map(p =>
            p.intensity || p.strength || 0.5
        );
        return intensities.reduce((sum, i) => sum + i, 0) / intensities.length;
    }

    /**
     * Merge neural encodings
     * @private
     * @param {Array} encodings - Neural encodings
     * @returns {Object} Merged encoding
     */
    _mergeEncodings(encodings) {
        const base = encodings[0];
        const others = encodings.slice(1);

        return {
            nodes: base.nodes.map(node => ({
                ...node,
                intensity: this._averageNodeIntensity(node, others)
            })),
            connections: base.connections.map(conn => ({
                ...conn,
                strength: this._averageConnectionStrength(conn, others)
            })),
            weights: this._averageWeights(encodings.map(e => e.weights)),
            compressionRatio: base.compressionRatio
        };
    }

    /**
     * Average node intensity across encodings
     * @private
     * @param {Object} node - Base node
     * @param {Array} encodings - Other encodings
     * @returns {number} Average intensity
     */
    _averageNodeIntensity(node, encodings) {
        const intensities = [node.intensity];
        encodings.forEach(encoding => {
            const matchingNode = encoding.nodes.find(n => n.id === node.id);
            if (matchingNode) {
                intensities.push(matchingNode.intensity);
            }
        });
        return intensities.reduce((sum, i) => sum + i, 0) / intensities.length;
    }

    /**
     * Average connection strength across encodings
     * @private
     * @param {Object} conn - Base connection
     * @param {Array} encodings - Other encodings
     * @returns {number} Average strength
     */
    _averageConnectionStrength(conn, encodings) {
        const strengths = [conn.strength];
        encodings.forEach(encoding => {
            const matchingConn = encoding.connections.find(c =>
                c.from === conn.from && c.to === conn.to
            );
            if (matchingConn) {
                strengths.push(matchingConn.strength);
            }
        });
        return strengths.reduce((sum, s) => sum + s, 0) / strengths.length;
    }

    /**
     * Average weights across encodings
     * @private
     * @param {Array} weights - Weight arrays
     * @returns {Object} Average weights
     */
    _averageWeights(weights) {
        const keys = Object.keys(weights[0]);
        const result = {};

        keys.forEach(key => {
            const values = weights.map(w => w[key]);
            result[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
        });

        return result;
    }

    /**
     * Compress consolidated patterns
     * @private
     * @param {Array} patterns - Consolidated patterns
     * @returns {Array} Compressed patterns
     */
    _compressPatterns(patterns) {
        return patterns
            .sort((a, b) => b.intensity - a.intensity)
            .slice(0, Math.ceil(patterns.length * this.compressionLevel));
    }

    /**
     * Generate unique encoding ID
     * @private
     * @returns {string} Unique ID
     */
    _generateEncodingId() {
        return `encoding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = SubconsciousPatternEncoder;