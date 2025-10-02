/*
 * HDR Empire Framework - Optimization Integrator
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import { EventEmitter } from "events";
import CacheManager from "./CacheManager.js";
import { moduleLoader } from "./CodeSplitting.js";
import CriticalPathOptimizer from "./CriticalPathOptimizer.js";

/**
 * Integration module that wires optimization components into HDR systems
 *
 * Features:
 * - Wraps HDR system methods with optimizations
 * - Configuration system for enabling/disabling per-system
 * - Backward compatibility preservation
 * - Validation that optimized functions produce identical results
 * - Gradual rollout support with A/B testing
 */
class OptimizationIntegrator extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      cacheEnabled: options.cacheEnabled !== false,
      codeSplittingEnabled: options.codeSplittingEnabled !== false,
      criticalPathEnabled: options.criticalPathEnabled !== false,
      validateResults: options.validateResults !== false,
      abTestingEnabled: options.abTestingEnabled || false,
      abTestingPercentage: options.abTestingPercentage || 50,
      ...options,
    };

    // Initialize optimization components
    this.cache = new CacheManager({
      namespace: "hdr-integration",
      l1MaxSize: 1000,
      l1TTL: 60 * 1000, // 1 minute
      l2Enabled: true,
      l2TTL: 3600, // 1 hour
      strategy: "write-through",
    });

    this.optimizer = new CriticalPathOptimizer({
      enableCaching: this.options.cacheEnabled,
      enableParallelization: true,
      enableMemoization: true,
    });

    // Track wrapped systems
    this.wrappedSystems = new Map();

    // Per-system configuration
    this.systemConfig = {
      "neural-hdr": {
        enabled: true,
        methods: ["captureState", "transferState", "restoreState"],
        optimizations: ["cache", "parallelization"],
      },
      "nano-swarm": {
        enabled: true,
        methods: ["deploySwarm", "assignTasks", "monitorSwarm"],
        optimizations: ["cache", "batching"],
      },
      "omniscient-hdr": {
        enabled: true,
        methods: ["crystallize", "accessKnowledge", "search"],
        optimizations: ["cache", "memoization", "parallelization"],
      },
      "reality-hdr": {
        enabled: true,
        methods: ["compress", "decompress", "navigate"],
        optimizations: ["cache"],
      },
      "quantum-hdr": {
        enabled: true,
        methods: ["createSuperposition", "explorePaths", "collapse"],
        optimizations: ["cache", "parallelization"],
      },
      "dream-hdr": {
        enabled: true,
        methods: ["encodePattern", "amplifyCreativity", "processSubconscious"],
        optimizations: ["cache", "memoization"],
      },
      "void-blade-hdr": {
        enabled: true,
        methods: ["createZone", "assessThreat", "protect"],
        optimizations: ["cache"],
      },
    };

    this.metrics = {
      optimizedCalls: 0,
      unoptimizedCalls: 0,
      validationFailures: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Wrap an HDR system with optimizations
   */
  wrapSystem(systemName, systemInstance) {
    if (this.wrappedSystems.has(systemName)) {
      throw new Error(`System ${systemName} already wrapped`);
    }

    const config = this.systemConfig[systemName];
    if (!config || !config.enabled) {
      console.log(`Optimizations disabled for ${systemName}, skipping wrap`);
      return systemInstance;
    }

    console.log(`Wrapping ${systemName} with optimizations...`);

    // Create wrapped instance
    const wrapped = Object.create(systemInstance);

    // Wrap each configured method
    for (const methodName of config.methods) {
      if (typeof systemInstance[methodName] === "function") {
        wrapped[methodName] = this._wrapMethod(
          systemName,
          methodName,
          systemInstance[methodName].bind(systemInstance),
          config.optimizations
        );
      }
    }

    this.wrappedSystems.set(systemName, {
      original: systemInstance,
      wrapped,
      config,
    });

    this.emit("system:wrapped", { systemName, config });

    return wrapped;
  }

  /**
   * Wrap a single method with optimizations
   */
  _wrapMethod(systemName, methodName, originalMethod, optimizations) {
    return async (...args) => {
      // A/B testing: randomly choose optimized vs unoptimized
      if (this.options.abTestingEnabled) {
        const useOptimized =
          Math.random() * 100 < this.options.abTestingPercentage;
        if (!useOptimized) {
          this.metrics.unoptimizedCalls++;
          return originalMethod(...args);
        }
      }

      this.metrics.optimizedCalls++;

      try {
        // Apply optimizations based on system and method
        let result;

        if (systemName === "neural-hdr" && methodName === "captureState") {
          result = await this.optimizer.optimizeConsciousnessCapture(
            originalMethod,
            args[0], // state
            args[1] // options
          );
        } else if (
          systemName === "nano-swarm" &&
          methodName === "deploySwarm"
        ) {
          result = await this.optimizer.optimizeSwarmDeployment(
            originalMethod,
            args[0], // config
            args[1] // tasks
          );
        } else if (
          systemName === "omniscient-hdr" &&
          methodName === "crystallize"
        ) {
          result = await this.optimizer.optimizeKnowledgeCrystallization(
            originalMethod,
            args[0], // data
            args[1] // options
          );
        } else if (systemName === "reality-hdr" && methodName === "compress") {
          result = await this.optimizer.optimizeSpaceCompression(
            originalMethod,
            args[0], // space
            args[1] // ratio
          );
        } else if (
          systemName === "quantum-hdr" &&
          methodName === "explorePaths"
        ) {
          result = await this.optimizer.optimizeQuantumExploration(
            originalMethod,
            args[0], // states
            args[1] // options
          );
        } else if (
          systemName === "dream-hdr" &&
          methodName === "amplifyCreativity"
        ) {
          result = await this.optimizer.optimizeDreamPatternAnalysis(
            originalMethod,
            args[0], // patterns
            args[1] // options
          );
        } else {
          // Generic caching for other methods
          result = await this._cacheWrapper(
            `${systemName}:${methodName}`,
            originalMethod,
            args
          );
        }

        // Validate result if enabled
        if (this.options.validateResults && Math.random() < 0.1) {
          // 10% sampling
          await this._validateResult(
            systemName,
            methodName,
            originalMethod,
            args,
            result
          );
        }

        this.emit("method:called", {
          systemName,
          methodName,
          optimized: true,
          cached: false, // TODO: track from optimizer
        });

        return result;
      } catch (error) {
        console.error(`Error in optimized ${systemName}.${methodName}:`, error);
        this.emit("method:error", { systemName, methodName, error });

        // Fallback to unoptimized
        console.log(`Falling back to unoptimized ${systemName}.${methodName}`);
        return originalMethod(...args);
      }
    };
  }

  /**
   * Generic cache wrapper for methods
   */
  async _cacheWrapper(cacheKey, method, args) {
    const key = this._generateCacheKey(cacheKey, args);

    // Try cache
    let result = await this.cache.get(key);

    if (result) {
      this.metrics.cacheHits++;
      return result;
    }

    this.metrics.cacheMisses++;

    // Execute method
    result = await method(...args);

    // Cache result (5 minute TTL)
    await this.cache.set(key, result, 300);

    return result;
  }

  /**
   * Validate that optimized result matches unoptimized
   */
  async _validateResult(
    systemName,
    methodName,
    originalMethod,
    args,
    optimizedResult
  ) {
    try {
      const unoptimizedResult = await originalMethod(...args);

      // Deep equality check
      const match =
        JSON.stringify(optimizedResult) === JSON.stringify(unoptimizedResult);

      if (!match) {
        this.metrics.validationFailures++;
        this.emit("validation:failure", {
          systemName,
          methodName,
          optimized: optimizedResult,
          unoptimized: unoptimizedResult,
        });
        console.warn(`Validation failed for ${systemName}.${methodName}`);
      }
    } catch (error) {
      console.error(`Validation error for ${systemName}.${methodName}:`, error);
    }
  }

  /**
   * Generate cache key from method arguments
   */
  _generateCacheKey(prefix, args) {
    const argsHash = JSON.stringify(args).substring(0, 50);
    return `${prefix}:${argsHash}`;
  }

  /**
   * Enable optimizations for a system
   */
  enableSystem(systemName) {
    const config = this.systemConfig[systemName];
    if (config) {
      config.enabled = true;
      this.emit("config:changed", { systemName, enabled: true });
      console.log(`Optimizations enabled for ${systemName}`);
    }
  }

  /**
   * Disable optimizations for a system
   */
  disableSystem(systemName) {
    const config = this.systemConfig[systemName];
    if (config) {
      config.enabled = false;
      this.emit("config:changed", { systemName, enabled: false });
      console.log(`Optimizations disabled for ${systemName}`);
    }
  }

  /**
   * Get optimization status for a system
   */
  getSystemStatus(systemName) {
    const wrapped = this.wrappedSystems.get(systemName);
    const config = this.systemConfig[systemName];

    return {
      wrapped: !!wrapped,
      enabled: config?.enabled || false,
      config: config || null,
    };
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheMetrics: this.cache.getMetrics(),
      optimizerMetrics: this.optimizer.getMetrics(),
      wrappedSystems: Array.from(this.wrappedSystems.keys()),
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      optimizedCalls: 0,
      unoptimizedCalls: 0,
      validationFailures: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    this.cache.resetMetrics();
    this.optimizer.resetMetrics();
  }

  /**
   * Cleanup and destroy
   */
  async destroy() {
    await this.cache.destroy();
    await this.optimizer.destroy();
    this.wrappedSystems.clear();
    this.removeAllListeners();
  }
}

export default OptimizationIntegrator;
