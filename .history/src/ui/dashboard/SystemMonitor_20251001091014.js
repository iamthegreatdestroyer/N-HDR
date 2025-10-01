/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * SystemMonitor.js
 * Real-time system metrics and state visualization
 */

const { EventEmitter } = require('events');
const tf = require('@tensorflow/tfjs');

class SystemMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            samplingRate: config.samplingRate || 1000,
            metricBufferSize: config.metricBufferSize || 1000,
            anomalyThreshold: config.anomalyThreshold || 2.0,
            ...config
        };

        this.state = {
            initialized: false,
            monitoring: false,
            error: null,
            timestamp: Date.now()
        };

        this.metrics = new Map();
        this.anomalies = new Map();
        this.monitors = new Map();
        this.samplingTimer = null;
    }

    /**
     * Initialize system monitor
     * @param {Object} parameters - Initialization parameters
     * @returns {Promise<Object>} Initialization status
     */
    async initialize(parameters = {}) {
        try {
            await this._initializeMetrics();
            await this._setupMonitors(parameters);
            
            this._startMonitoring();

            this.state.initialized = true;
            this.emit('initialized', { timestamp: Date.now() });

            return {
                status: 'initialized',
                metrics: this.metrics.size,
                timestamp: Date.now()
            };
        } catch (error) {
            throw new Error(`Monitor initialization failed: ${error.message}`);
        }
    }

    /**
     * Register metric
     * @param {string} name - Metric name
     * @param {Object} config - Metric configuration
     * @returns {string} Metric ID
     */
    registerMetric(name, config = {}) {
        const metricId = this._generateMetricId();
        
        this.metrics.set(metricId, {
            name,
            config,
            values: [],
            statistics: {},
            timestamp: Date.now()
        });

        this.emit('metricRegistered', { metricId, name, timestamp: Date.now() });
        return metricId;
    }

    /**
     * Update metric value
     * @param {string} metricId - Metric ID
     * @param {number} value - Metric value
     */
    updateMetric(metricId, value) {
        const metric = this.metrics.get(metricId);
        if (!metric) return;

        metric.values.push({
            value,
            timestamp: Date.now()
        });

        while (metric.values.length > this.config.metricBufferSize) {
            metric.values.shift();
        }

        this._updateStatistics(metricId);
        this._checkAnomaly(metricId);
        
        this.emit('metricUpdated', { metricId, value, timestamp: Date.now() });
    }

    /**
     * Get metric data
     * @param {string} metricId - Metric ID
     * @param {number} limit - Data limit
     * @returns {Object} Metric data
     */
    getMetricData(metricId, limit = null) {
        const metric = this.metrics.get(metricId);
        if (!metric) return null;

        const values = limit ? 
            metric.values.slice(-limit) : 
            metric.values;

        return {
            name: metric.name,
            values,
            statistics: metric.statistics,
            timestamp: Date.now()
        };
    }

    /**
     * Initialize metrics
     * @private
     */
    async _initializeMetrics() {
        // Register default system metrics
        this.registerMetric('cpu_usage', { unit: 'percent' });
        this.registerMetric('memory_usage', { unit: 'bytes' });
        this.registerMetric('network_latency', { unit: 'ms' });
        this.registerMetric('quantum_coherence', { unit: 'ratio' });
        this.registerMetric('neural_activity', { unit: 'hz' });
        this.registerMetric('dream_depth', { unit: 'level' });
    }

    /**
     * Setup monitors
     * @private
     * @param {Object} parameters - Setup parameters
     */
    async _setupMonitors(parameters) {
        this.monitors.set('system', {
            check: this._checkSystemMetrics.bind(this),
            interval: 1000
        });

        this.monitors.set('quantum', {
            check: this._checkQuantumMetrics.bind(this),
            interval: 500
        });

        this.monitors.set('neural', {
            check: this._checkNeuralMetrics.bind(this),
            interval: 200
        });

        this.monitors.set('dream', {
            check: this._checkDreamMetrics.bind(this),
            interval: 1000
        });
    }

    /**
     * Start monitoring
     * @private
     */
    _startMonitoring() {
        if (this.samplingTimer) {
            clearInterval(this.samplingTimer);
        }

        this.state.monitoring = true;
        this.samplingTimer = setInterval(() => {
            this._sampleMetrics();
        }, this.config.samplingRate);
    }

    /**
     * Sample metrics
     * @private
     */
    async _sampleMetrics() {
        for (const [name, monitor] of this.monitors) {
            try {
                await monitor.check();
            } catch (error) {
                this.emit('monitorError', {
                    monitor: name,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        }
    }

    /**
     * Update statistics
     * @private
     * @param {string} metricId - Metric ID
     */
    _updateStatistics(metricId) {
        const metric = this.metrics.get(metricId);
        if (!metric || metric.values.length === 0) return;

        const values = metric.values.map(v => v.value);
        const tensor = tf.tensor1d(values);

        metric.statistics = {
            mean: tensor.mean().arraySync(),
            std: tensor.std().arraySync(),
            min: tensor.min().arraySync(),
            max: tensor.max().arraySync(),
            timestamp: Date.now()
        };

        tensor.dispose();
    }

    /**
     * Check for anomalies
     * @private
     * @param {string} metricId - Metric ID
     */
    _checkAnomaly(metricId) {
        const metric = this.metrics.get(metricId);
        if (!metric || !metric.statistics) return;

        const lastValue = metric.values[metric.values.length - 1].value;
        const zscore = Math.abs(
            (lastValue - metric.statistics.mean) / metric.statistics.std
        );

        if (zscore > this.config.anomalyThreshold) {
            const anomaly = {
                value: lastValue,
                zscore,
                timestamp: Date.now()
            };

            this.anomalies.set(metricId, anomaly);
            this.emit('anomalyDetected', { metricId, anomaly });
        } else if (this.anomalies.has(metricId)) {
            this.anomalies.delete(metricId);
            this.emit('anomalyResolved', { metricId, timestamp: Date.now() });
        }
    }

    /**
     * Check system metrics
     * @private
     */
    async _checkSystemMetrics() {
        // Implementation would collect actual system metrics
        // This is a placeholder that generates sample data
        this.updateMetric('cpu_usage', Math.random() * 100);
        this.updateMetric('memory_usage', Math.random() * 1024 * 1024 * 1024);
        this.updateMetric('network_latency', Math.random() * 100);
    }

    /**
     * Check quantum metrics
     * @private
     */
    async _checkQuantumMetrics() {
        this.updateMetric('quantum_coherence', Math.random());
    }

    /**
     * Check neural metrics
     * @private
     */
    async _checkNeuralMetrics() {
        this.updateMetric('neural_activity', Math.random() * 100);
    }

    /**
     * Check dream metrics
     * @private
     */
    async _checkDreamMetrics() {
        this.updateMetric('dream_depth', Math.floor(Math.random() * 10));
    }

    /**
     * Generate metric ID
     * @private
     * @returns {string} Generated ID
     */
    _generateMetricId() {
        return `metric-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    /**
     * Get monitor status
     * @returns {Object} Current status
     */
    getStatus() {
        return {
            initialized: this.state.initialized,
            monitoring: this.state.monitoring,
            metrics: this.metrics.size,
            anomalies: this.anomalies.size,
            error: this.state.error,
            timestamp: Date.now()
        };
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.samplingTimer) {
            clearInterval(this.samplingTimer);
            this.samplingTimer = null;
        }
        this.state.monitoring = false;
        this.emit('monitoringStopped', { timestamp: Date.now() });
    }

    /**
     * Cleanup monitor
     */
    async cleanup() {
        this.stopMonitoring();
        
        this.metrics.clear();
        this.anomalies.clear();
        this.monitors.clear();

        this.state.initialized = false;
        this.emit('cleaned', { timestamp: Date.now() });
    }
}

module.exports = SystemMonitor;