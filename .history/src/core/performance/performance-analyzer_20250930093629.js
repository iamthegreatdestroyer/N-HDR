/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Performance Analyzer - System performance analysis and bottleneck detection
 */

const eventBus = require('../integration/event-bus');
const MetricsCollector = require('../integration/metrics-collector');

class PerformanceAnalyzer {
    constructor(options = {}) {
        this.options = {
            analysisInterval: 60000, // 1 minute
            historyWindow: 3600000, // 1 hour
            alertThresholds: {
                cpuUsage: 80, // 80%
                memoryUsage: 85, // 85%
                responseTime: 1000, // 1 second
                errorRate: 0.05 // 5%
            },
            bottleneckDetectionThresholds: {
                cpuSaturation: 90, // 90%
                memoryPressure: 90, // 90%
                highLatency: 2000, // 2 seconds
                errorSpike: 0.10 // 10%
            },
            ...options
        };

        this.metrics = new MetricsCollector();
        this.analysisResults = new Map();
        this.bottlenecks = new Set();
        this._setupMetrics();
    }

    /**
     * Start continuous performance analysis
     */
    async start() {
        this._analysisInterval = setInterval(
            () => this._performAnalysis(),
            this.options.analysisInterval
        );

        eventBus.publish('performance.analyzer.started', {
            timestamp: Date.now()
        });
    }

    /**
     * Stop performance analysis
     */
    async stop() {
        if (this._analysisInterval) {
            clearInterval(this._analysisInterval);
        }

        eventBus.publish('performance.analyzer.stopped', {
            timestamp: Date.now()
        });
    }

    /**
     * Get current performance analysis
     */
    getCurrentAnalysis() {
        return {
            timestamp: Date.now(),
            metrics: this._getLatestMetrics(),
            bottlenecks: Array.from(this.bottlenecks),
            recommendations: this._generateRecommendations()
        };
    }

    /**
     * Get historical performance data
     * @param {number} startTime - Start timestamp
     * @param {number} endTime - End timestamp
     */
    getHistoricalAnalysis(startTime, endTime) {
        return Array.from(this.analysisResults.entries())
            .filter(([timestamp]) => timestamp >= startTime && timestamp <= endTime)
            .map(([timestamp, data]) => ({
                timestamp,
                ...data
            }));
    }

    /**
     * Setup performance metrics
     * @private
     */
    _setupMetrics() {
        // System performance metrics
        this.metrics.registerMetric('performance.cpu.utilization', {
            type: 'gauge',
            description: 'CPU utilization percentage'
        });

        this.metrics.registerMetric('performance.memory.usage', {
            type: 'gauge',
            description: 'Memory usage percentage'
        });

        this.metrics.registerMetric('performance.response.time', {
            type: 'histogram',
            description: 'Response time distribution'
        });

        this.metrics.registerMetric('performance.error.rate', {
            type: 'gauge',
            description: 'Error rate percentage'
        });

        // Bottleneck metrics
        this.metrics.registerMetric('performance.bottlenecks.count', {
            type: 'gauge',
            description: 'Number of detected bottlenecks'
        });

        this.metrics.registerMetric('performance.bottlenecks.severity', {
            type: 'gauge',
            description: 'Severity level of detected bottlenecks'
        });
    }

    /**
     * Perform performance analysis
     * @private
     */
    async _performAnalysis() {
        try {
            // Collect current metrics
            const currentMetrics = this._getLatestMetrics();

            // Detect bottlenecks
            const detectedBottlenecks = this._detectBottlenecks(currentMetrics);

            // Generate analysis
            const analysis = {
                metrics: currentMetrics,
                bottlenecks: detectedBottlenecks,
                trends: this._analyzeTrends(),
                recommendations: this._generateRecommendations()
            };

            // Store analysis results
            this.analysisResults.set(Date.now(), analysis);

            // Clean up old results
            this._cleanupOldResults();

            // Update bottlenecks set
            this.bottlenecks = new Set(detectedBottlenecks);

            // Publish analysis results
            eventBus.publish('performance.analysis.completed', {
                timestamp: Date.now(),
                analysis
            });

            // Record bottleneck metrics
            this.metrics.recordMetric('performance.bottlenecks.count', 
                detectedBottlenecks.length);

            const maxSeverity = Math.max(...detectedBottlenecks.map(b => b.severity));
            this.metrics.recordMetric('performance.bottlenecks.severity', 
                maxSeverity);

        } catch (error) {
            eventBus.publish('performance.analysis.error', {
                timestamp: Date.now(),
                error: error.message
            });
        }
    }

    /**
     * Get latest performance metrics
     * @private
     */
    _getLatestMetrics() {
        return {
            cpu: {
                utilization: process.cpuUsage(),
                cores: require('os').cpus().length
            },
            memory: process.memoryUsage(),
            gc: process.memoryUsage(),
            responseTimes: this.metrics.getMetric('performance.response.time'),
            errorRates: this.metrics.getMetric('performance.error.rate')
        };
    }

    /**
     * Detect system bottlenecks
     * @private
     */
    _detectBottlenecks(metrics) {
        const bottlenecks = [];
        const thresholds = this.options.bottleneckDetectionThresholds;

        // CPU bottleneck detection
        const cpuUtilization = metrics.cpu.utilization.user / 
            (metrics.cpu.utilization.user + metrics.cpu.utilization.system) * 100;

        if (cpuUtilization > thresholds.cpuSaturation) {
            bottlenecks.push({
                type: 'CPU_SATURATION',
                severity: this._calculateSeverity(cpuUtilization, thresholds.cpuSaturation),
                metric: cpuUtilization,
                threshold: thresholds.cpuSaturation,
                description: 'CPU usage exceeding saturation threshold'
            });
        }

        // Memory bottleneck detection
        const memoryUsage = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;

        if (memoryUsage > thresholds.memoryPressure) {
            bottlenecks.push({
                type: 'MEMORY_PRESSURE',
                severity: this._calculateSeverity(memoryUsage, thresholds.memoryPressure),
                metric: memoryUsage,
                threshold: thresholds.memoryPressure,
                description: 'Memory usage exceeding pressure threshold'
            });
        }

        // Response time bottleneck detection
        const p95ResponseTime = this._calculatePercentile(
            metrics.responseTimes || [], 95);

        if (p95ResponseTime > thresholds.highLatency) {
            bottlenecks.push({
                type: 'HIGH_LATENCY',
                severity: this._calculateSeverity(p95ResponseTime, thresholds.highLatency),
                metric: p95ResponseTime,
                threshold: thresholds.highLatency,
                description: '95th percentile response time exceeding threshold'
            });
        }

        // Error rate bottleneck detection
        const errorRate = metrics.errorRates || 0;

        if (errorRate > thresholds.errorSpike) {
            bottlenecks.push({
                type: 'ERROR_SPIKE',
                severity: this._calculateSeverity(errorRate, thresholds.errorSpike),
                metric: errorRate,
                threshold: thresholds.errorSpike,
                description: 'Error rate exceeding spike threshold'
            });
        }

        return bottlenecks;
    }

    /**
     * Calculate metric severity
     * @private
     */
    _calculateSeverity(value, threshold) {
        const exceedance = (value - threshold) / threshold;
        // Return severity on scale of 1-10
        return Math.min(Math.ceil(exceedance * 10), 10);
    }

    /**
     * Analyze performance trends
     * @private
     */
    _analyzeTrends() {
        const recentResults = Array.from(this.analysisResults.entries())
            .slice(-10) // Look at last 10 analyses
            .map(([timestamp, data]) => ({
                timestamp,
                ...data
            }));

        if (recentResults.length < 2) {
            return { trends: [] };
        }

        const trends = [];

        // CPU trend analysis
        const cpuTrend = this._calculateTrend(
            recentResults.map(r => r.metrics.cpu.utilization.user)
        );
        if (Math.abs(cpuTrend) > 0.1) {
            trends.push({
                metric: 'CPU_UTILIZATION',
                trend: cpuTrend,
                direction: cpuTrend > 0 ? 'increasing' : 'decreasing'
            });
        }

        // Memory trend analysis
        const memoryTrend = this._calculateTrend(
            recentResults.map(r => r.metrics.memory.heapUsed)
        );
        if (Math.abs(memoryTrend) > 0.1) {
            trends.push({
                metric: 'MEMORY_USAGE',
                trend: memoryTrend,
                direction: memoryTrend > 0 ? 'increasing' : 'decreasing'
            });
        }

        return { trends };
    }

    /**
     * Calculate trend slope
     * @private
     */
    _calculateTrend(values) {
        if (values.length < 2) return 0;

        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    /**
     * Generate performance recommendations
     * @private
     */
    _generateRecommendations() {
        const recommendations = [];
        const bottleneckArray = Array.from(this.bottlenecks);

        // CPU recommendations
        if (bottleneckArray.some(b => b.type === 'CPU_SATURATION')) {
            recommendations.push({
                type: 'CPU_OPTIMIZATION',
                priority: 'high',
                description: 'Consider scaling compute resources or optimizing CPU-intensive operations',
                actions: [
                    'Scale up CPU cores',
                    'Profile and optimize compute-heavy operations',
                    'Implement caching for expensive calculations',
                    'Consider parallel processing for suitable workloads'
                ]
            });
        }

        // Memory recommendations
        if (bottleneckArray.some(b => b.type === 'MEMORY_PRESSURE')) {
            recommendations.push({
                type: 'MEMORY_OPTIMIZATION',
                priority: 'high',
                description: 'Address memory pressure through optimization or scaling',
                actions: [
                    'Increase available memory',
                    'Implement memory leak detection',
                    'Optimize object lifecycle management',
                    'Consider implementing memory caching'
                ]
            });
        }

        // Latency recommendations
        if (bottleneckArray.some(b => b.type === 'HIGH_LATENCY')) {
            recommendations.push({
                type: 'LATENCY_OPTIMIZATION',
                priority: 'medium',
                description: 'Optimize response times and reduce latency',
                actions: [
                    'Implement request caching',
                    'Optimize database queries',
                    'Consider asynchronous processing',
                    'Analyze and optimize network calls'
                ]
            });
        }

        // Error handling recommendations
        if (bottleneckArray.some(b => b.type === 'ERROR_SPIKE')) {
            recommendations.push({
                type: 'ERROR_HANDLING',
                priority: 'high',
                description: 'Address increased error rates in the system',
                actions: [
                    'Review error logs for patterns',
                    'Implement circuit breakers',
                    'Enhance error handling mechanisms',
                    'Consider retry policies for transient failures'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Clean up old analysis results
     * @private
     */
    _cleanupOldResults() {
        const cutoff = Date.now() - this.options.historyWindow;
        
        for (const [timestamp] of this.analysisResults) {
            if (timestamp < cutoff) {
                this.analysisResults.delete(timestamp);
            }
        }
    }

    /**
     * Calculate percentile value
     * @private
     */
    _calculatePercentile(values, percentile) {
        if (!values || values.length === 0) return 0;
        
        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }
}

module.exports = PerformanceAnalyzer;