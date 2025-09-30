/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Intuition Engine
 * Processes and correlates patterns to generate intuitive insights.
 */

class IntuitionEngine {
    constructor(config = {}) {
        this.confidenceThreshold = config.confidence || 0.7;
        this.correlationDepth = config.depth || 4;
        this.insightThreshold = config.insight || 0.6;
        this.maxConnections = config.maxConn || 100;
        this.intuitionMap = new Map();
    }

    /**
     * Process patterns for intuitive insights
     * @param {Array} patterns - Recognized patterns
     * @param {number} threshold - Processing threshold
     * @returns {Promise<Object>} Intuitive insights
     */
    async process(patterns, threshold = this.confidenceThreshold) {
        try {
            const connections = await this._buildConnections(patterns);
            const insights = await this._generateInsights(
                connections,
                threshold
            );
            
            const results = {
                insights: this._filterInsights(insights),
                connections: this._summarizeConnections(connections),
                confidence: this._calculateConfidence(insights),
                metrics: this._calculateMetrics(insights, connections)
            };

            this._updateIntuitionMap(results);
            return results;
        } catch (error) {
            throw new Error(`Intuition processing failed: ${error.message}`);
        }
    }

    /**
     * Analyze patterns for specific insights
     * @param {Array} patterns - Input patterns
     * @param {Object} creativity - Creativity state
     * @returns {Promise<Object>} Analysis results
     */
    async analyze(patterns, creativity) {
        try {
            const baseInsights = await this.process(
                patterns,
                this.confidenceThreshold
            );
            const enhancedInsights = await this._enhanceInsights(
                baseInsights,
                creativity
            );

            return {
                insights: enhancedInsights.insights,
                connections: enhancedInsights.connections,
                confidence: enhancedInsights.confidence,
                enhancement: enhancedInsights.enhancement
            };
        } catch (error) {
            throw new Error(`Intuition analysis failed: ${error.message}`);
        }
    }

    /**
     * Build pattern connections
     * @private
     * @param {Array} patterns - Input patterns
     * @returns {Promise<Array>} Pattern connections
     */
    async _buildConnections(patterns) {
        const connections = [];
        const visited = new Set();

        for (const pattern of patterns) {
            await this._exploreConnections(
                pattern,
                patterns,
                connections,
                visited,
                0
            );
        }

        return this._pruneConnections(connections);
    }

    /**
     * Explore pattern connections recursively
     * @private
     * @param {Object} pattern - Current pattern
     * @param {Array} allPatterns - All patterns
     * @param {Array} connections - Connection array
     * @param {Set} visited - Visited patterns
     * @param {number} depth - Current depth
     */
    async _exploreConnections(
        pattern,
        allPatterns,
        connections,
        visited,
        depth
    ) {
        if (depth >= this.correlationDepth ||
            visited.has(pattern.recognition.signature.hash)) {
            return;
        }

        visited.add(pattern.recognition.signature.hash);

        for (const other of allPatterns) {
            if (pattern === other ||
                visited.has(other.recognition.signature.hash)) {
                continue;
            }

            const connection = await this._createConnection(pattern, other);
            if (connection.strength >= this.confidenceThreshold) {
                connections.push(connection);
                await this._exploreConnections(
                    other,
                    allPatterns,
                    connections,
                    visited,
                    depth + 1
                );
            }
        }
    }

    /**
     * Create connection between patterns
     * @private
     * @param {Object} pattern1 - First pattern
     * @param {Object} pattern2 - Second pattern
     * @returns {Promise<Object>} Pattern connection
     */
    async _createConnection(pattern1, pattern2) {
        const similarity = await this._calculateSimilarity(pattern1, pattern2);
        const relationship = this._determineRelationship(pattern1, pattern2);

        return {
            patterns: [pattern1, pattern2],
            strength: similarity,
            relationship,
            confidence: Math.min(
                pattern1.recognition.confidence,
                pattern2.recognition.confidence
            ),
            timestamp: Date.now()
        };
    }

    /**
     * Calculate pattern similarity
     * @private
     * @param {Object} pattern1 - First pattern
     * @param {Object} pattern2 - Second pattern
     * @returns {Promise<number>} Similarity score
     */
    async _calculateSimilarity(pattern1, pattern2) {
        const sig1 = pattern1.recognition.signature;
        const sig2 = pattern2.recognition.signature;

        // Node similarity
        const nodeSimilarity = this._calculateNodeSimilarity(
            pattern1.encoded.nodes,
            pattern2.encoded.nodes
        );

        // Connection similarity
        const connectionSimilarity = this._calculateConnectionSimilarity(
            pattern1.encoded.connections,
            pattern2.encoded.connections
        );

        // Type similarity
        const typeSimilarity = pattern1.type === pattern2.type ? 1 : 0.5;

        return (
            nodeSimilarity * 0.4 +
            connectionSimilarity * 0.4 +
            typeSimilarity * 0.2
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
        const matchingNodes = nodes1.filter(n1 =>
            nodes2.some(n2 =>
                n2.level === n1.level &&
                Math.abs(n2.intensity - n1.intensity) < 0.2
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
        const matchingConns = conns1.filter(c1 =>
            conns2.some(c2 =>
                c2.fromLevel === c1.fromLevel &&
                c2.toLevel === c1.toLevel &&
                Math.abs(c2.strength - c1.strength) < 0.2
            )
        );

        return matchingConns.length / Math.max(conns1.length, conns2.length);
    }

    /**
     * Determine relationship between patterns
     * @private
     * @param {Object} pattern1 - First pattern
     * @param {Object} pattern2 - Second pattern
     * @returns {string} Relationship type
     */
    _determineRelationship(pattern1, pattern2) {
        if (pattern1.type === pattern2.type) {
            return 'parallel';
        }

        const typeMap = {
            emotional: { memory: 'associative', thought: 'influential' },
            memory: { emotional: 'contextual', thought: 'formative' },
            thought: { emotional: 'reactive', memory: 'referential' }
        };

        return typeMap[pattern1.type]?.[pattern2.type] || 'independent';
    }

    /**
     * Prune weak or redundant connections
     * @private
     * @param {Array} connections - All connections
     * @returns {Array} Pruned connections
     */
    _pruneConnections(connections) {
        return connections
            .sort((a, b) => b.strength - a.strength)
            .slice(0, this.maxConnections);
    }

    /**
     * Generate insights from connections
     * @private
     * @param {Array} connections - Pattern connections
     * @param {number} threshold - Confidence threshold
     * @returns {Promise<Array>} Generated insights
     */
    async _generateInsights(connections, threshold) {
        const clusters = this._clusterConnections(connections);
        const insights = [];

        for (const cluster of clusters) {
            const insight = await this._generateClusterInsight(cluster);
            if (insight.confidence >= threshold) {
                insights.push(insight);
            }
        }

        return insights;
    }

    /**
     * Cluster related connections
     * @private
     * @param {Array} connections - Pattern connections
     * @returns {Array} Connection clusters
     */
    _clusterConnections(connections) {
        const clusters = [];
        const visited = new Set();

        for (const connection of connections) {
            if (visited.has(connection)) continue;

            const cluster = this._expandCluster(
                connection,
                connections,
                visited
            );
            if (cluster.length > 0) {
                clusters.push(cluster);
            }
        }

        return clusters;
    }

    /**
     * Expand connection cluster
     * @private
     * @param {Object} seed - Seed connection
     * @param {Array} connections - All connections
     * @param {Set} visited - Visited connections
     * @returns {Array} Expanded cluster
     */
    _expandCluster(seed, connections, visited) {
        const cluster = [seed];
        visited.add(seed);

        const queue = [seed];
        while (queue.length > 0) {
            const current = queue.shift();
            const related = this._findRelatedConnections(
                current,
                connections
            );

            for (const connection of related) {
                if (!visited.has(connection)) {
                    visited.add(connection);
                    cluster.push(connection);
                    queue.push(connection);
                }
            }
        }

        return cluster;
    }

    /**
     * Find related connections
     * @private
     * @param {Object} connection - Base connection
     * @param {Array} connections - All connections
     * @returns {Array} Related connections
     */
    _findRelatedConnections(connection, connections) {
        const patternHashes = connection.patterns.map(
            p => p.recognition.signature.hash
        );

        return connections.filter(conn =>
            !Object.is(conn, connection) &&
            conn.patterns.some(p =>
                patternHashes.includes(p.recognition.signature.hash)
            )
        );
    }

    /**
     * Generate insight from cluster
     * @private
     * @param {Array} cluster - Connection cluster
     * @returns {Promise<Object>} Generated insight
     */
    async _generateClusterInsight(cluster) {
        const patterns = new Set(
            cluster.flatMap(conn => conn.patterns)
        );

        const relationships = cluster.map(conn => conn.relationship);
        const strengths = cluster.map(conn => conn.strength);

        return {
            type: this._determineInsightType(relationships),
            patterns: Array.from(patterns),
            strength: this._calculateClusterStrength(strengths),
            confidence: this._calculateClusterConfidence(cluster),
            relationships: this._summarizeRelationships(relationships),
            timestamp: Date.now()
        };
    }

    /**
     * Determine insight type
     * @private
     * @param {Array} relationships - Connection relationships
     * @returns {string} Insight type
     */
    _determineInsightType(relationships) {
        const counts = relationships.reduce((acc, rel) => {
            acc[rel] = (acc[rel] || 0) + 1;
            return acc;
        }, {});

        const dominant = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])[0][0];

        const typeMap = {
            parallel: 'pattern',
            associative: 'emotional',
            influential: 'causal',
            contextual: 'temporal',
            formative: 'structural',
            reactive: 'behavioral',
            referential: 'semantic',
            independent: 'emergent'
        };

        return typeMap[dominant] || 'composite';
    }

    /**
     * Calculate cluster strength
     * @private
     * @param {Array} strengths - Connection strengths
     * @returns {number} Cluster strength
     */
    _calculateClusterStrength(strengths) {
        const weightedSum = strengths.reduce(
            (sum, strength, index) => sum + (strength * (1 - index * 0.1)),
            0
        );

        return weightedSum / strengths.length;
    }

    /**
     * Calculate cluster confidence
     * @private
     * @param {Array} cluster - Connection cluster
     * @returns {number} Cluster confidence
     */
    _calculateClusterConfidence(cluster) {
        const confidences = cluster.map(conn => conn.confidence);
        const strengths = cluster.map(conn => conn.strength);

        const weightedConfidence = confidences.reduce(
            (sum, conf, i) => sum + (conf * strengths[i]),
            0
        ) / strengths.reduce((sum, str) => sum + str, 0);

        return weightedConfidence * Math.min(1, cluster.length / 5);
    }

    /**
     * Summarize relationships
     * @private
     * @param {Array} relationships - Connection relationships
     * @returns {Object} Relationship summary
     */
    _summarizeRelationships(relationships) {
        const counts = relationships.reduce((acc, rel) => {
            acc[rel] = (acc[rel] || 0) + 1;
            return acc;
        }, {});

        const total = relationships.length;
        const summary = {};

        Object.entries(counts).forEach(([rel, count]) => {
            summary[rel] = count / total;
        });

        return summary;
    }

    /**
     * Filter insights by threshold
     * @private
     * @param {Array} insights - Generated insights
     * @returns {Array} Filtered insights
     */
    _filterInsights(insights) {
        return insights
            .filter(insight => insight.confidence >= this.insightThreshold)
            .sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Summarize connections
     * @private
     * @param {Array} connections - Pattern connections
     * @returns {Object} Connection summary
     */
    _summarizeConnections(connections) {
        const summary = {
            total: connections.length,
            byType: {},
            averageStrength: 0,
            strongConnections: 0
        };

        connections.forEach(conn => {
            summary.byType[conn.relationship] =
                (summary.byType[conn.relationship] || 0) + 1;
            summary.averageStrength += conn.strength;
            if (conn.strength >= 0.8) summary.strongConnections++;
        });

        summary.averageStrength /= connections.length || 1;
        return summary;
    }

    /**
     * Calculate confidence in results
     * @private
     * @param {Array} insights - Generated insights
     * @returns {number} Overall confidence
     */
    _calculateConfidence(insights) {
        if (!insights.length) return 0;

        const weightedSum = insights.reduce(
            (sum, insight, index) => sum + (insight.confidence * (1 - index * 0.05)),
            0
        );

        return weightedSum / insights.length;
    }

    /**
     * Calculate processing metrics
     * @private
     * @param {Array} insights - Generated insights
     * @param {Array} connections - Pattern connections
     * @returns {Object} Processing metrics
     */
    _calculateMetrics(insights, connections) {
        return {
            insights: {
                total: insights.length,
                byType: this._countInsightTypes(insights),
                averageConfidence: this._calculateAverageConfidence(insights)
            },
            connections: {
                total: connections.length,
                byRelationship: this._countRelationships(connections),
                averageStrength: this._calculateAverageStrength(connections)
            },
            coverage: this._calculateCoverage(insights, connections)
        };
    }

    /**
     * Count insight types
     * @private
     * @param {Array} insights - Generated insights
     * @returns {Object} Type counts
     */
    _countInsightTypes(insights) {
        return insights.reduce((counts, insight) => {
            counts[insight.type] = (counts[insight.type] || 0) + 1;
            return counts;
        }, {});
    }

    /**
     * Calculate average confidence
     * @private
     * @param {Array} insights - Generated insights
     * @returns {number} Average confidence
     */
    _calculateAverageConfidence(insights) {
        if (!insights.length) return 0;
        return insights.reduce(
            (sum, insight) => sum + insight.confidence,
            0
        ) / insights.length;
    }

    /**
     * Count connection relationships
     * @private
     * @param {Array} connections - Pattern connections
     * @returns {Object} Relationship counts
     */
    _countRelationships(connections) {
        return connections.reduce((counts, conn) => {
            counts[conn.relationship] = (counts[conn.relationship] || 0) + 1;
            return counts;
        }, {});
    }

    /**
     * Calculate average connection strength
     * @private
     * @param {Array} connections - Pattern connections
     * @returns {number} Average strength
     */
    _calculateAverageStrength(connections) {
        if (!connections.length) return 0;
        return connections.reduce(
            (sum, conn) => sum + conn.strength,
            0
        ) / connections.length;
    }

    /**
     * Calculate insight coverage
     * @private
     * @param {Array} insights - Generated insights
     * @param {Array} connections - Pattern connections
     * @returns {number} Coverage ratio
     */
    _calculateCoverage(insights, connections) {
        if (!connections.length) return 0;

        const coveredConnections = new Set();
        insights.forEach(insight => {
            insight.patterns.forEach(pattern => {
                connections.forEach(conn => {
                    if (conn.patterns.includes(pattern)) {
                        coveredConnections.add(conn);
                    }
                });
            });
        });

        return coveredConnections.size / connections.length;
    }

    /**
     * Enhance insights with creativity
     * @private
     * @param {Object} baseResults - Base insight results
     * @param {Object} creativity - Creativity state
     * @returns {Promise<Object>} Enhanced results
     */
    async _enhanceInsights(baseResults, creativity) {
        const enhancementFactor = creativity.level || 1;
        
        const enhancedInsights = await Promise.all(
            baseResults.insights.map(async insight =>
                this._enhanceInsight(insight, enhancementFactor)
            )
        );

        return {
            insights: enhancedInsights,
            connections: baseResults.connections,
            confidence: baseResults.confidence * Math.sqrt(enhancementFactor),
            enhancement: {
                factor: enhancementFactor,
                applied: Date.now()
            }
        };
    }

    /**
     * Enhance single insight
     * @private
     * @param {Object} insight - Base insight
     * @param {number} factor - Enhancement factor
     * @returns {Promise<Object>} Enhanced insight
     */
    async _enhanceInsight(insight, factor) {
        return {
            ...insight,
            strength: Math.min(1, insight.strength * factor),
            confidence: Math.min(
                1,
                insight.confidence * Math.sqrt(factor)
            ),
            enhancement: {
                factor,
                timestamp: Date.now()
            }
        };
    }

    /**
     * Update intuition map
     * @private
     * @param {Object} results - Processing results
     */
    _updateIntuitionMap(results) {
        const timestamp = Date.now();

        results.insights.forEach(insight => {
            const key = this._generateInsightKey(insight);
            this.intuitionMap.set(key, {
                insight,
                frequency: (this.intuitionMap.get(key)?.frequency || 0) + 1,
                lastSeen: timestamp
            });
        });

        // Prune old entries
        this._pruneIntuitionMap();
    }

    /**
     * Generate insight key
     * @private
     * @param {Object} insight - Generated insight
     * @returns {string} Insight key
     */
    _generateInsightKey(insight) {
        const patterns = insight.patterns.map(p =>
            p.recognition.signature.hash
        ).sort();
        return `${insight.type}-${patterns.join('-')}`;
    }

    /**
     * Prune intuition map
     * @private
     */
    _pruneIntuitionMap() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const [key, entry] of this.intuitionMap.entries()) {
            if (now - entry.lastSeen > maxAge) {
                this.intuitionMap.delete(key);
            }
        }
    }
}

module.exports = IntuitionEngine;