/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
 * technology suite. Unauthorized reproduction, distribution, or disclosure of this
 * software in whole or in part is strictly prohibited. All intellectual property
 * rights, including patent-pending technologies, are reserved.
 *
 * File: performance-analyzer.js
 * Created: 2025-09-29
 * HDR Empire - Pioneering the Future of AI Consciousness
 *
 * Advanced performance analysis system for monitoring and optimizing N-HDR components.
 */

const EventEmitter = require('events');
const Stats = require('stats.js');

class PerformanceAnalyzer extends EventEmitter {
    /**
     * Create a new PerformanceAnalyzer instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        super();

        this.options = {
            sampleInterval: options.sampleInterval || 1000,
            historySize: options.historySize || 3600,
            thresholds: {
                cpu: options.cpuThreshold || 80,
                memory: options.memoryThreshold || 85,
                latency: options.latencyThreshold || 100,
                throughput: options.throughputThreshold || 1000
            },
            ...options
        };

        // Performance metrics storage
        this.metrics = {
            cpu: new Array(this.options.historySize).fill(0),
            memory: new Array(this.options.historySize).fill(0),
            latency: new Array(this.options.historySize).fill(0),
            throughput: new Array(this.options.historySize).fill(0),
            quantum: new Array(this.options.historySize).fill(0),
            thermal: new Array(this.options.historySize).fill(0)
        };

        // Circular buffer indices
        this.currentIndex = 0;

        // Performance stats
        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb

        // Operation tracking
        this.operations = new Map();
        this.bottlenecks = new Set();

        // Start monitoring
        this.isMonitoring = false;
        this.monitoringInterval = null;
    }

    /**
     * Start performance monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.monitoringInterval = setInterval(
            () => this._collectMetrics(),
            this.options.sampleInterval
        );

        this.emit('monitoring:start');
    }

    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;

        clearInterval(this.monitoringInterval);
        this.isMonitoring = false;
        this.monitoringInterval = null;

        this.emit('monitoring:stop');
    }

    /**
     * Begin tracking an operation
     * @param {string} operationId - Unique operation identifier
     * @param {Object} metadata - Operation metadata
     */
    beginOperation(operationId, metadata = {}) {
        this.operations.set(operationId, {
            startTime: process.hrtime.bigint(),
            metadata,
            samples: []
        });
    }

    /**
     * End tracking an operation
     * @param {string} operationId - Operation identifier
     * @returns {Object} Operation metrics
     */
    endOperation(operationId) {
        const operation = this.operations.get(operationId);
        if (!operation) return null;

        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - operation.startTime) / 1e6; // Convert to ms

        // Calculate operation metrics
        const metrics = {
            duration,
            startTime: operation.startTime,
            endTime,
            samples: operation.samples,
            metadata: operation.metadata
        };

        // Check for performance bottleneck
        if (duration > this.options.thresholds.latency) {
            this.bottlenecks.add({
                operationId,
                duration,
                timestamp: Date.now(),
                metadata: operation.metadata
            });
            this.emit('bottleneck:detected', { operationId, metrics });
        }

        this.operations.delete(operationId);
        this.emit('operation:end', { operationId, metrics });

        return metrics;
    }

    /**
     * Add a sample to an operation
     * @param {string} operationId - Operation identifier
     * @param {number} value - Sample value
     */
    addOperationSample(operationId, value) {
        const operation = this.operations.get(operationId);
        if (operation) {
            operation.samples.push({
                timestamp: process.hrtime.bigint(),
                value
            });
        }
    }

    /**
     * Get performance analysis report
     * @returns {Object} Performance report
     */
    getAnalysis() {
        const now = Date.now();
        const analysis = {
            timestamp: now,
            metrics: {
                cpu: this._calculateMetricStats('cpu'),
                memory: this._calculateMetricStats('memory'),
                latency: this._calculateMetricStats('latency'),
                throughput: this._calculateMetricStats('throughput'),
                quantum: this._calculateMetricStats('quantum'),
                thermal: this._calculateMetricStats('thermal')
            },
            operations: {
                active: this.operations.size,
                bottlenecks: Array.from(this.bottlenecks)
                    .filter(b => now - b.timestamp < 3600000) // Last hour
            },
            thresholds: this.options.thresholds,
            recommendations: this._generateRecommendations()
        };

        return analysis;
    }

    /**
     * Clear performance history
     */
    clearHistory() {
        for (const metric of Object.keys(this.metrics)) {
            this.metrics[metric].fill(0);
        }
        this.currentIndex = 0;
        this.bottlenecks.clear();
    }

    /**
     * Collect current performance metrics
     * @private
     */
    _collectMetrics() {
        // Update current index
        this.currentIndex = (this.currentIndex + 1) % this.options.historySize;

        // Collect CPU metrics
        const cpuUsage = process.cpuUsage();
        const totalCPU = cpuUsage.user + cpuUsage.system;
        this.metrics.cpu[this.currentIndex] = totalCPU;

        // Collect memory metrics
        const memoryUsage = process.memoryUsage();
        this.metrics.memory[this.currentIndex] = memoryUsage.heapUsed;

        // Calculate current throughput
        const activeOps = this.operations.size;
        this.metrics.throughput[this.currentIndex] = activeOps;

        // Calculate average latency
        const latencies = Array.from(this.operations.values())
            .map(op => Number(process.hrtime.bigint() - op.startTime) / 1e6);
        this.metrics.latency[this.currentIndex] = latencies.length > 0
            ? latencies.reduce((a, b) => a + b, 0) / latencies.length
            : 0;

        // Check thresholds
        this._checkThresholds();

        // Emit metrics update
        this.emit('metrics:update', {
            cpu: totalCPU,
            memory: memoryUsage.heapUsed,
            throughput: activeOps,
            latency: this.metrics.latency[this.currentIndex]
        });
    }

    /**
     * Calculate statistics for a metric
     * @param {string} metric - Metric name
     * @returns {Object} Metric statistics
     * @private
     */
    _calculateMetricStats(metric) {
        const values = this.metrics[metric];
        const nonZero = values.filter(v => v > 0);

        if (nonZero.length === 0) {
            return {
                current: 0,
                min: 0,
                max: 0,
                avg: 0,
                trend: 'stable'
            };
        }

        const current = values[this.currentIndex];
        const min = Math.min(...nonZero);
        const max = Math.max(...nonZero);
        const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;

        // Calculate trend
        const recent = values.slice(-10).filter(v => v > 0);
        const trend = recent.length >= 2
            ? this._calculateTrend(recent)
            : 'stable';

        return { current, min, max, avg, trend };
    }

    /**
     * Calculate trend from recent values
     * @param {Array} values - Recent metric values
     * @returns {string} Trend indicator
     * @private
     */
    _calculateTrend(values) {
        const changes = [];
        for (let i = 1; i < values.length; i++) {
            changes.push(values[i] - values[i-1]);
        }

        const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
        const threshold = 0.05; // 5% change threshold

        if (avgChange > threshold) return 'increasing';
        if (avgChange < -threshold) return 'decreasing';
        return 'stable';
    }

    /**
     * Check metrics against thresholds
     * @private
     */
    _checkThresholds() {
        const current = {
            cpu: this.metrics.cpu[this.currentIndex],
            memory: this.metrics.memory[this.currentIndex],
            latency: this.metrics.latency[this.currentIndex],
            throughput: this.metrics.throughput[this.currentIndex]
        };

        for (const [metric, value] of Object.entries(current)) {
            const threshold = this.options.thresholds[metric];
            if (value > threshold) {
                this.emit('threshold:exceeded', {
                    metric,
                    value,
                    threshold
                });
            }
        }
    }

    /**
     * Generate performance recommendations
     * @returns {Array} List of recommendations
     * @private
     */
    _generateRecommendations() {
        const recommendations = [];
        const analysis = {
            cpu: this._calculateMetricStats('cpu'),
            memory: this._calculateMetricStats('memory'),
            latency: this._calculateMetricStats('latency'),
            throughput: this._calculateMetricStats('throughput')
        };

        // CPU recommendations
        if (analysis.cpu.trend === 'increasing' && analysis.cpu.avg > 70) {
            recommendations.push({
                component: 'cpu',
                severity: 'high',
                message: 'High CPU utilization detected',
                action: 'Consider scaling compute resources or optimizing operations'
            });
        }

        // Memory recommendations
        if (analysis.memory.trend === 'increasing' && analysis.memory.avg > 75) {
            recommendations.push({
                component: 'memory',
                severity: 'high',
                message: 'Memory usage trending upward',
                action: 'Check for memory leaks and optimize memory-intensive operations'
            });
        }

        // Latency recommendations
        if (analysis.latency.avg > this.options.thresholds.latency) {
            recommendations.push({
                component: 'latency',
                severity: 'medium',
                message: 'High operation latency detected',
                action: 'Review bottleneck operations and optimize critical paths'
            });
        }

        // Throughput recommendations
        if (analysis.throughput.trend === 'decreasing') {
            recommendations.push({
                component: 'throughput',
                severity: 'medium',
                message: 'Decreasing operation throughput',
                action: 'Investigate potential blockages or resource constraints'
            });
        }

        return recommendations;
    }
}

module.exports = PerformanceAnalyzer;