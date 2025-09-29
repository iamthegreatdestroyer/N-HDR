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
 * File: performance-monitor.js
 * Created: 2025-09-29
 * HDR Empire - Pioneering the Future of AI Consciousness
 *
 * Real-time performance monitoring system for N-HDR components, providing detailed
 * metrics and visualization capabilities.
 */

const EventEmitter = require('events');
const PerformanceAnalyzer = require('./performance-analyzer');
const Optimizer = require('./optimizer');

class PerformanceMonitor extends EventEmitter {
    /**
     * Create a new PerformanceMonitor instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        super();

        this.options = {
            updateInterval: options.updateInterval || 1000,
            historySize: options.historySize || 3600,
            autoOptimize: options.autoOptimize !== false,
            alertThresholds: {
                cpu: options.cpuAlertThreshold || 85,
                memory: options.memoryAlertThreshold || 90,
                latency: options.latencyAlertThreshold || 200,
                errors: options.errorAlertThreshold || 10
            },
            ...options
        };

        // Initialize components
        this.analyzer = new PerformanceAnalyzer(options.analyzer);
        this.optimizer = new Optimizer({
            ...options.optimizer,
            analyzer: this.analyzer
        });

        // Monitoring state
        this.isMonitoring = false;
        this.alerts = new Map();
        this.metrics = new Map();
        this.errors = new Map();

        // Performance profiles
        this.profiles = new Map();
        this._initializeProfiles();

        // Set up event listeners
        this._setupEventListeners();
    }

    /**
     * Start performance monitoring
     */
    start() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.analyzer.startMonitoring();

        if (this.options.autoOptimize) {
            this.optimizer.startOptimization();
        }

        this.emit('monitor:start');
    }

    /**
     * Stop performance monitoring
     */
    stop() {
        if (!this.isMonitoring) return;

        this.isMonitoring = false;
        this.analyzer.stopMonitoring();
        this.optimizer.stopOptimization();

        this.emit('monitor:stop');
    }

    /**
     * Get current performance snapshot
     * @returns {Object} Performance snapshot
     */
    getSnapshot() {
        const analysis = this.analyzer.getAnalysis();
        const optimization = this.optimizer.getOptimizationReport();

        return {
            timestamp: Date.now(),
            metrics: analysis.metrics,
            optimization: {
                status: optimization.status,
                activeOptimizations: optimization.activeOptimizations,
                recommendations: optimization.recommendations
            },
            alerts: Array.from(this.alerts.values()),
            errors: Array.from(this.errors.values())
        };
    }

    /**
     * Apply a performance profile
     * @param {string} profileName - Profile name
     */
    applyProfile(profileName) {
        const profile = this.profiles.get(profileName);
        if (!profile) {
            throw new Error(`Unknown profile: ${profileName}`);
        }

        // Apply analyzer settings
        this.analyzer.options = {
            ...this.analyzer.options,
            ...profile.analyzer
        };

        // Apply optimizer settings
        this.optimizer.options = {
            ...this.optimizer.options,
            ...profile.optimizer
        };

        // Apply monitor settings
        this.options = {
            ...this.options,
            ...profile.monitor
        };

        this.emit('profile:applied', { profileName, profile });
    }

    /**
     * Register a performance alert
     * @param {string} alertId - Alert identifier
     * @param {Object} alert - Alert configuration
     */
    registerAlert(alertId, alert) {
        this.alerts.set(alertId, {
            id: alertId,
            timestamp: Date.now(),
            acknowledged: false,
            ...alert
        });

        this.emit('alert:registered', { alertId, alert });
    }

    /**
     * Acknowledge an alert
     * @param {string} alertId - Alert identifier
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = Date.now();
            this.emit('alert:acknowledged', { alertId, alert });
        }
    }

    /**
     * Get performance report
     * @returns {Object} Performance report
     */
    generateReport() {
        const snapshot = this.getSnapshot();
        const report = {
            timestamp: snapshot.timestamp,
            summary: this._generateSummary(snapshot),
            details: {
                metrics: snapshot.metrics,
                optimization: snapshot.optimization,
                alerts: snapshot.alerts,
                errors: snapshot.errors
            },
            recommendations: this._generateRecommendations(snapshot)
        };

        return report;
    }

    /**
     * Initialize performance profiles
     * @private
     */
    _initializeProfiles() {
        // High Performance profile
        this.profiles.set('high-performance', {
            analyzer: {
                sampleInterval: 500,
                thresholds: {
                    cpu: 90,
                    memory: 85,
                    latency: 50
                }
            },
            optimizer: {
                optimizationInterval: 2000,
                aggressiveness: 0.7
            },
            monitor: {
                updateInterval: 500,
                alertThresholds: {
                    cpu: 90,
                    memory: 85,
                    latency: 50,
                    errors: 5
                }
            }
        });

        // Balanced profile
        this.profiles.set('balanced', {
            analyzer: {
                sampleInterval: 1000,
                thresholds: {
                    cpu: 80,
                    memory: 80,
                    latency: 100
                }
            },
            optimizer: {
                optimizationInterval: 5000,
                aggressiveness: 0.5
            },
            monitor: {
                updateInterval: 1000,
                alertThresholds: {
                    cpu: 85,
                    memory: 90,
                    latency: 200,
                    errors: 10
                }
            }
        });

        // Power Saver profile
        this.profiles.set('power-saver', {
            analyzer: {
                sampleInterval: 2000,
                thresholds: {
                    cpu: 70,
                    memory: 75,
                    latency: 200
                }
            },
            optimizer: {
                optimizationInterval: 10000,
                aggressiveness: 0.3
            },
            monitor: {
                updateInterval: 2000,
                alertThresholds: {
                    cpu: 80,
                    memory: 85,
                    latency: 300,
                    errors: 20
                }
            }
        });
    }

    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Listen for analyzer events
        this.analyzer.on('metrics:update', (metrics) => {
            this._checkAlertThresholds(metrics);
            this.emit('metrics:update', metrics);
        });

        this.analyzer.on('threshold:exceeded', (data) => {
            this._handleThresholdExceeded(data);
        });

        // Listen for optimizer events
        this.optimizer.on('optimization:start', (data) => {
            this.emit('optimization:start', data);
        });

        this.optimizer.on('optimization:success', (data) => {
            this.emit('optimization:success', data);
        });

        this.optimizer.on('optimization:error', (data) => {
            this._handleOptimizationError(data);
        });
    }

    /**
     * Check metrics against alert thresholds
     * @param {Object} metrics - Current metrics
     * @private
     */
    _checkAlertThresholds(metrics) {
        for (const [metric, value] of Object.entries(metrics)) {
            const threshold = this.options.alertThresholds[metric];
            if (threshold && value > threshold) {
                this._createAlert(metric, value, threshold);
            }
        }
    }

    /**
     * Create performance alert
     * @param {string} metric - Metric name
     * @param {number} value - Current value
     * @param {number} threshold - Threshold value
     * @private
     */
    _createAlert(metric, value, threshold) {
        const alertId = `${metric}_${Date.now()}`;
        const alert = {
            type: 'threshold',
            metric,
            value,
            threshold,
            timestamp: Date.now(),
            severity: this._calculateAlertSeverity(value, threshold)
        };

        this.registerAlert(alertId, alert);
    }

    /**
     * Calculate alert severity
     * @param {number} value - Current value
     * @param {number} threshold - Threshold value
     * @returns {string} Severity level
     * @private
     */
    _calculateAlertSeverity(value, threshold) {
        const ratio = value / threshold;
        if (ratio >= 1.5) return 'critical';
        if (ratio >= 1.2) return 'high';
        if (ratio >= 1) return 'medium';
        return 'low';
    }

    /**
     * Handle threshold exceeded event
     * @param {Object} data - Threshold data
     * @private
     */
    _handleThresholdExceeded(data) {
        const alertId = `threshold_${data.metric}_${Date.now()}`;
        const alert = {
            type: 'threshold_exceeded',
            ...data,
            timestamp: Date.now(),
            severity: this._calculateAlertSeverity(data.value, data.threshold)
        };

        this.registerAlert(alertId, alert);
    }

    /**
     * Handle optimization error
     * @param {Object} data - Error data
     * @private
     */
    _handleOptimizationError(data) {
        const errorId = `optimization_${Date.now()}`;
        this.errors.set(errorId, {
            id: errorId,
            timestamp: Date.now(),
            type: 'optimization',
            ...data
        });

        this.emit('error', { id: errorId, ...data });
    }

    /**
     * Generate performance summary
     * @param {Object} snapshot - Performance snapshot
     * @returns {Object} Performance summary
     * @private
     */
    _generateSummary(snapshot) {
        return {
            status: this._calculateOverallStatus(snapshot),
            activeOptimizations: snapshot.optimization.activeOptimizations.length,
            activeAlerts: snapshot.alerts.filter(a => !a.acknowledged).length,
            recentErrors: snapshot.errors.filter(
                e => Date.now() - e.timestamp < 3600000 // Last hour
            ).length,
            metrics: {
                cpu: snapshot.metrics.cpu.current,
                memory: snapshot.metrics.memory.current,
                latency: snapshot.metrics.latency.current,
                throughput: snapshot.metrics.throughput.current
            }
        };
    }

    /**
     * Calculate overall system status
     * @param {Object} snapshot - Performance snapshot
     * @returns {string} System status
     * @private
     */
    _calculateOverallStatus(snapshot) {
        const criticalAlerts = snapshot.alerts.filter(
            a => a.severity === 'critical' && !a.acknowledged
        ).length;
        const highAlerts = snapshot.alerts.filter(
            a => a.severity === 'high' && !a.acknowledged
        ).length;

        if (criticalAlerts > 0) return 'critical';
        if (highAlerts > 0) return 'degraded';
        if (snapshot.optimization.status === 'active') return 'optimizing';
        return 'healthy';
    }

    /**
     * Generate performance recommendations
     * @param {Object} snapshot - Performance snapshot
     * @returns {Array} Recommendations
     * @private
     */
    _generateRecommendations(snapshot) {
        const recommendations = [...snapshot.optimization.recommendations];

        // Add profile recommendations
        const metrics = snapshot.metrics;
        if (
            metrics.cpu.current > 85 &&
            metrics.memory.current > 85 &&
            !this.profiles.get('high-performance')
        ) {
            recommendations.push({
                type: 'profile',
                priority: 'high',
                message: 'Consider switching to high-performance profile',
                action: 'applyProfile',
                params: { profile: 'high-performance' }
            });
        }

        // Add monitoring recommendations
        if (snapshot.alerts.length > 10) {
            recommendations.push({
                type: 'monitoring',
                priority: 'medium',
                message: 'High number of unacknowledged alerts',
                action: 'review',
                params: { component: 'alerts' }
            });
        }

        return recommendations;
    }
}

module.exports = PerformanceMonitor;