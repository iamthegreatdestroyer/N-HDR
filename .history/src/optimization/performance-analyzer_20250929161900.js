/**
 * Performance Analyzer for Neural-HDR System
 * © 2025 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 * HDR EMPIRE - CONFIDENTIAL 
 * 
 * Analyzes system performance and provides optimization recommendations.
 */

const os = require('os');
const EventEmitter = require('events');

class PerformanceAnalyzer extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            sampleInterval: options.sampleInterval || 1000,
            historyLength: options.historyLength || 3600,
            warningThreshold: options.warningThreshold || 80,
            criticalThreshold: options.criticalThreshold || 90,
            ...options
        };

        this.metrics = {
            cpu: new Array(os.cpus().length).fill(0),
            memory: {
                used: 0,
                total: os.totalmem()
            },
            swarm: {
                activeNodes: 0,
                taskQueue: 0,
                processingRate: 0
            },
            quantum: {
                entropyQuality: 0,
                keyOperations: 0
            },
            consciousness: {
                activeStates: 0,
                entanglements: 0
            },
            thermal: {
                temperature: 0,
                throttling: false
            }
        };

        this.history = new Map();
        this._initializeHistory();
        this.analyzing = false;
    }

    /**
     * Starts performance analysis
     */
    start() {
        if (this.analyzing) {
            return;
        }

        this.analyzing = true;
        this._startMetricCollection();
        this.emit('started');
    }

    /**
     * Stops performance analysis
     */
    stop() {
        if (!this.analyzing) {
            return;
        }

        this.analyzing = false;
        if (this.metricInterval) {
            clearInterval(this.metricInterval);
        }
        this.emit('stopped');
    }

    /**
     * Gets current performance metrics
     * @returns {Object} Current metrics
     */
    getCurrentMetrics() {
        return { ...this.metrics };
    }

    /**
     * Gets performance history
     * @param {string} metric - Metric name
     * @param {number} [duration] - Duration in seconds
     * @returns {Array} Metric history
     */
    getHistory(metric, duration) {
        if (!this.history.has(metric)) {
            throw new Error(`Unknown metric: ${metric}`);
        }

        const history = this.history.get(metric);
        if (!duration) {
            return history;
        }

        const now = Date.now();
        return history.filter(entry => (now - entry.timestamp) <= duration * 1000);
    }

    /**
     * Gets performance analysis
     * @returns {Object} Performance analysis
     */
    async analyzePerformance() {
        const analysis = {
            timestamp: Date.now(),
            metrics: this.getCurrentMetrics(),
            issues: [],
            recommendations: []
        };

        // Analyze CPU usage
        const avgCpuUsage = this.metrics.cpu.reduce((a, b) => a + b, 0) / this.metrics.cpu.length;
        if (avgCpuUsage > this.options.criticalThreshold) {
            analysis.issues.push({
                severity: 'critical',
                component: 'cpu',
                message: `CPU usage critically high: ${avgCpuUsage.toFixed(1)}%`
            });
            analysis.recommendations.push({
                component: 'cpu',
                action: 'reduce-load',
                message: 'Reduce processing load or scale horizontally'
            });
        } else if (avgCpuUsage > this.options.warningThreshold) {
            analysis.issues.push({
                severity: 'warning',
                component: 'cpu',
                message: `CPU usage high: ${avgCpuUsage.toFixed(1)}%`
            });
        }

        // Analyze memory usage
        const memoryUsagePercent = (this.metrics.memory.used / this.metrics.memory.total) * 100;
        if (memoryUsagePercent > this.options.criticalThreshold) {
            analysis.issues.push({
                severity: 'critical',
                component: 'memory',
                message: `Memory usage critically high: ${memoryUsagePercent.toFixed(1)}%`
            });
            analysis.recommendations.push({
                component: 'memory',
                action: 'optimize-memory',
                message: 'Optimize memory usage or increase available memory'
            });
        }

        // Analyze swarm performance
        if (this.metrics.swarm.taskQueue > this.metrics.swarm.activeNodes * 2) {
            analysis.issues.push({
                severity: 'warning',
                component: 'swarm',
                message: 'Task queue growing faster than processing rate'
            });
            analysis.recommendations.push({
                component: 'swarm',
                action: 'scale-swarm',
                message: 'Increase swarm size or optimize task distribution'
            });
        }

        // Analyze quantum security performance
        if (this.metrics.quantum.entropyQuality < 0.8) {
            analysis.issues.push({
                severity: 'warning',
                component: 'quantum',
                message: 'Quantum entropy quality below threshold'
            });
            analysis.recommendations.push({
                component: 'quantum',
                action: 'improve-entropy',
                message: 'Check entropy sources or adjust collection parameters'
            });
        }

        // Analyze consciousness layer performance
        const stateRatio = this.metrics.consciousness.entanglements / this.metrics.consciousness.activeStates;
        if (stateRatio > 0.8) {
            analysis.issues.push({
                severity: 'warning',
                component: 'consciousness',
                message: 'High entanglement ratio may impact performance'
            });
            analysis.recommendations.push({
                component: 'consciousness',
                action: 'optimize-entanglements',
                message: 'Review and optimize entanglement patterns'
            });
        }

        // Analyze thermal conditions
        if (this.metrics.thermal.temperature > 80) {
            analysis.issues.push({
                severity: 'critical',
                component: 'thermal',
                message: `Temperature critically high: ${this.metrics.thermal.temperature}°C`
            });
            analysis.recommendations.push({
                component: 'thermal',
                action: 'reduce-temperature',
                message: 'Reduce processing load or improve cooling'
            });
        }

        return analysis;
    }

    /**
     * Updates metrics with new data
     * @param {string} category - Metric category
     * @param {Object} data - New metric data
     */
    updateMetrics(category, data) {
        if (!(category in this.metrics)) {
            throw new Error(`Unknown metric category: ${category}`);
        }

        this.metrics[category] = {
            ...this.metrics[category],
            ...data
        };

        this._updateHistory(category, data);
        this._checkThresholds(category, data);
    }

    /**
     * Initializes metric history storage
     * @private
     */
    _initializeHistory() {
        Object.keys(this.metrics).forEach(category => {
            this.history.set(category, []);
        });
    }

    /**
     * Starts collecting metrics
     * @private
     */
    _startMetricCollection() {
        this.metricInterval = setInterval(async () => {
            // Update CPU metrics
            const cpuUsage = os.cpus().map(cpu => {
                const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
                const idle = cpu.times.idle;
                return ((total - idle) / total) * 100;
            });
            this.updateMetrics('cpu', cpuUsage);

            // Update memory metrics
            const used = os.totalmem() - os.freemem();
            this.updateMetrics('memory', { used });

            // Analyze overall performance
            const analysis = await this.analyzePerformance();
            if (analysis.issues.length > 0) {
                this.emit('issues', analysis.issues);
            }
            if (analysis.recommendations.length > 0) {
                this.emit('recommendations', analysis.recommendations);
            }

        }, this.options.sampleInterval);
    }

    /**
     * Updates metric history
     * @param {string} category - Metric category
     * @param {Object} data - Metric data
     * @private
     */
    _updateHistory(category, data) {
        if (!this.history.has(category)) {
            return;
        }

        const history = this.history.get(category);
        history.push({
            timestamp: Date.now(),
            data
        });

        // Trim history if too long
        while (history.length > this.options.historyLength) {
            history.shift();
        }
    }

    /**
     * Checks metrics against thresholds
     * @param {string} category - Metric category
     * @param {Object} data - Metric data
     * @private
     */
    _checkThresholds(category, data) {
        switch (category) {
            case 'cpu':
                const avgCpu = Array.isArray(data) ? 
                    data.reduce((a, b) => a + b, 0) / data.length : 
                    data;
                if (avgCpu > this.options.criticalThreshold) {
                    this.emit('critical', {
                        component: 'cpu',
                        value: avgCpu,
                        message: `CPU usage critically high: ${avgCpu.toFixed(1)}%`
                    });
                } else if (avgCpu > this.options.warningThreshold) {
                    this.emit('warning', {
                        component: 'cpu',
                        value: avgCpu,
                        message: `CPU usage high: ${avgCpu.toFixed(1)}%`
                    });
                }
                break;

            case 'memory':
                const memoryPercent = (data.used / this.metrics.memory.total) * 100;
                if (memoryPercent > this.options.criticalThreshold) {
                    this.emit('critical', {
                        component: 'memory',
                        value: memoryPercent,
                        message: `Memory usage critically high: ${memoryPercent.toFixed(1)}%`
                    });
                }
                break;

            case 'thermal':
                if (data.temperature > 80) {
                    this.emit('critical', {
                        component: 'thermal',
                        value: data.temperature,
                        message: `Temperature critically high: ${data.temperature}°C`
                    });
                }
                break;
        }
    }
}

module.exports = PerformanceAnalyzer;