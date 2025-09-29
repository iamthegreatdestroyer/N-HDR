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
 * File: optimization-profiles.js
 * Created: 2025-09-29
 * HDR Empire - Pioneering the Future of AI Consciousness
 *
 * Predefined optimization profiles for different N-HDR usage scenarios and
 * performance requirements.
 */

/**
 * Standard optimization profiles
 */
const OPTIMIZATION_PROFILES = {
    // High Performance Profile
    'high-performance': {
        description: 'Optimized for maximum performance and throughput',
        settings: {
            // Performance analyzer settings
            analyzer: {
                sampleInterval: 500, // 500ms sampling
                historySize: 7200, // 1 hour at 500ms intervals
                thresholds: {
                    cpu: 90,
                    memory: 85,
                    latency: 50,
                    throughput: 2000
                }
            },
            // Optimizer settings
            optimizer: {
                optimizationInterval: 2000,
                autoOptimize: true,
                aggressiveness: 0.7,
                learningRate: 0.2,
                maxOptimizationAttempts: 10,
                strategies: {
                    memory: {
                        clearCaches: true,
                        forceGC: true
                    },
                    cpu: {
                        adjustBatchSize: true,
                        prioritizeProcessing: true
                    },
                    latency: {
                        optimizePaths: true,
                        enablePrefetch: true
                    },
                    throughput: {
                        optimizeQueues: true,
                        adjustConcurrency: true,
                        maxConcurrency: 16
                    }
                }
            },
            // Monitor settings
            monitor: {
                updateInterval: 500,
                alertThresholds: {
                    cpu: 90,
                    memory: 85,
                    latency: 50,
                    errors: 5
                }
            }
        }
    },

    // Balanced Profile
    'balanced': {
        description: 'Balanced performance and resource usage',
        settings: {
            analyzer: {
                sampleInterval: 1000,
                historySize: 3600,
                thresholds: {
                    cpu: 80,
                    memory: 80,
                    latency: 100,
                    throughput: 1000
                }
            },
            optimizer: {
                optimizationInterval: 5000,
                autoOptimize: true,
                aggressiveness: 0.5,
                learningRate: 0.1,
                maxOptimizationAttempts: 5,
                strategies: {
                    memory: {
                        clearCaches: true,
                        forceGC: false
                    },
                    cpu: {
                        adjustBatchSize: true,
                        prioritizeProcessing: false
                    },
                    latency: {
                        optimizePaths: true,
                        enablePrefetch: false
                    },
                    throughput: {
                        optimizeQueues: true,
                        adjustConcurrency: true,
                        maxConcurrency: 8
                    }
                }
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
        }
    },

    // Power Saver Profile
    'power-saver': {
        description: 'Optimized for minimal resource usage',
        settings: {
            analyzer: {
                sampleInterval: 2000,
                historySize: 1800,
                thresholds: {
                    cpu: 70,
                    memory: 75,
                    latency: 200,
                    throughput: 500
                }
            },
            optimizer: {
                optimizationInterval: 10000,
                autoOptimize: true,
                aggressiveness: 0.3,
                learningRate: 0.05,
                maxOptimizationAttempts: 3,
                strategies: {
                    memory: {
                        clearCaches: true,
                        forceGC: false
                    },
                    cpu: {
                        adjustBatchSize: true,
                        prioritizeProcessing: false
                    },
                    latency: {
                        optimizePaths: false,
                        enablePrefetch: false
                    },
                    throughput: {
                        optimizeQueues: true,
                        adjustConcurrency: true,
                        maxConcurrency: 4
                    }
                }
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
        }
    },

    // Debug Profile
    'debug': {
        description: 'Enhanced monitoring and diagnostics',
        settings: {
            analyzer: {
                sampleInterval: 250,
                historySize: 14400,
                thresholds: {
                    cpu: 95,
                    memory: 90,
                    latency: 25,
                    throughput: 4000
                }
            },
            optimizer: {
                optimizationInterval: 1000,
                autoOptimize: false,
                aggressiveness: 0.9,
                learningRate: 0.3,
                maxOptimizationAttempts: 20,
                strategies: {
                    memory: {
                        clearCaches: true,
                        forceGC: true
                    },
                    cpu: {
                        adjustBatchSize: true,
                        prioritizeProcessing: true
                    },
                    latency: {
                        optimizePaths: true,
                        enablePrefetch: true
                    },
                    throughput: {
                        optimizeQueues: true,
                        adjustConcurrency: true,
                        maxConcurrency: 32
                    }
                }
            },
            monitor: {
                updateInterval: 250,
                alertThresholds: {
                    cpu: 95,
                    memory: 90,
                    latency: 25,
                    errors: 1
                }
            }
        }
    },

    // Quantum-Optimized Profile
    'quantum-optimized': {
        description: 'Optimized for quantum security operations',
        settings: {
            analyzer: {
                sampleInterval: 750,
                historySize: 4800,
                thresholds: {
                    cpu: 85,
                    memory: 80,
                    latency: 75,
                    throughput: 1500,
                    quantum: 90
                }
            },
            optimizer: {
                optimizationInterval: 3000,
                autoOptimize: true,
                aggressiveness: 0.6,
                learningRate: 0.15,
                maxOptimizationAttempts: 7,
                strategies: {
                    memory: {
                        clearCaches: true,
                        forceGC: true,
                        quantumAware: true
                    },
                    cpu: {
                        adjustBatchSize: true,
                        prioritizeProcessing: true,
                        quantumPriority: true
                    },
                    latency: {
                        optimizePaths: true,
                        enablePrefetch: true,
                        quantumRouting: true
                    },
                    throughput: {
                        optimizeQueues: true,
                        adjustConcurrency: true,
                        maxConcurrency: 12,
                        quantumBalancing: true
                    }
                }
            },
            monitor: {
                updateInterval: 750,
                alertThresholds: {
                    cpu: 85,
                    memory: 80,
                    latency: 75,
                    errors: 3,
                    quantum: 90
                }
            }
        }
    }
};

/**
 * Get optimization profile
 * @param {string} profileName - Profile name
 * @returns {Object} Profile configuration
 */
function getProfile(profileName) {
    const profile = OPTIMIZATION_PROFILES[profileName];
    if (!profile) {
        throw new Error(`Unknown profile: ${profileName}`);
    }
    return profile;
}

/**
 * List available profiles
 * @returns {Array} Profile names and descriptions
 */
function listProfiles() {
    return Object.entries(OPTIMIZATION_PROFILES).map(([name, profile]) => ({
        name,
        description: profile.description
    }));
}

/**
 * Validate profile configuration
 * @param {Object} config - Profile configuration
 * @returns {boolean} Validation result
 */
function validateProfile(config) {
    // Required sections
    const requiredSections = ['analyzer', 'optimizer', 'monitor'];
    for (const section of requiredSections) {
        if (!config.settings[section]) {
            throw new Error(`Missing required section: ${section}`);
        }
    }

    // Analyzer validation
    const analyzer = config.settings.analyzer;
    if (
        !analyzer.sampleInterval ||
        !analyzer.historySize ||
        !analyzer.thresholds
    ) {
        throw new Error('Invalid analyzer configuration');
    }

    // Optimizer validation
    const optimizer = config.settings.optimizer;
    if (
        !optimizer.optimizationInterval ||
        optimizer.aggressiveness === undefined ||
        !optimizer.strategies
    ) {
        throw new Error('Invalid optimizer configuration');
    }

    // Monitor validation
    const monitor = config.settings.monitor;
    if (!monitor.updateInterval || !monitor.alertThresholds) {
        throw new Error('Invalid monitor configuration');
    }

    return true;
}

/**
 * Create custom profile
 * @param {string} name - Profile name
 * @param {Object} config - Profile configuration
 * @returns {Object} Created profile
 */
function createProfile(name, config) {
    // Validate configuration
    validateProfile(config);

    // Create new profile
    OPTIMIZATION_PROFILES[name] = {
        description: config.description || 'Custom profile',
        settings: config.settings
    };

    return OPTIMIZATION_PROFILES[name];
}

module.exports = {
    getProfile,
    listProfiles,
    validateProfile,
    createProfile,
    OPTIMIZATION_PROFILES
};