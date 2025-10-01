/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Load Tester - Performance testing and load simulation component
 */

import eventBus from "../integration/event-bus.js";
import MetricsCollector from "../integration/metrics-collector.js";

class LoadTester {
  constructor(options = {}) {
    this.options = {
      maxConcurrentTests: 10,
      defaultTestDuration: 300000, // 5 minutes
      warmupDuration: 30000, // 30 seconds
      cooldownDuration: 30000, // 30 seconds
      metricsInterval: 1000, // 1 second
      ...options,
    };

    this.metrics = new MetricsCollector();
    this.activeTests = new Map();
    this.testResults = new Map();
    this._setupMetrics();
  }

  /**
   * Start a new load test
   * @param {Object} testConfig - Test configuration
   */
  async startTest(testConfig) {
    const testId = `test_${Date.now()}`;

    if (this.activeTests.size >= this.options.maxConcurrentTests) {
      throw new Error("Maximum concurrent tests limit reached");
    }

    const config = {
      id: testId,
      duration: this.options.defaultTestDuration,
      warmup: this.options.warmupDuration,
      cooldown: this.options.cooldownDuration,
      targetLoad: 100, // requests per second
      loadPattern: "linear", // linear, step, spike
      ...testConfig,
    };

    // Initialize test metrics
    this._initializeTestMetrics(testId);

    // Start test execution
    const testExecution = this._executeTest(config);
    this.activeTests.set(testId, testExecution);

    // Notify test start
    eventBus.publish("loadTest.started", {
      testId,
      config,
      timestamp: Date.now(),
    });

    return testId;
  }

  /**
   * Stop an active load test
   * @param {string} testId - Test identifier
   */
  async stopTest(testId) {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found or already completed`);
    }

    await test.stop();
    this.activeTests.delete(testId);

    // Notify test stop
    eventBus.publish("loadTest.stopped", {
      testId,
      timestamp: Date.now(),
    });
  }

  /**
   * Get test results
   * @param {string} testId - Test identifier
   */
  getTestResults(testId) {
    return this.testResults.get(testId) || null;
  }

  /**
   * Get all active tests
   */
  getActiveTests() {
    return Array.from(this.activeTests.keys());
  }

  /**
   * Setup system metrics
   * @private
   */
  _setupMetrics() {
    // Test execution metrics
    this.metrics.registerMetric("loadTest.active", {
      type: "gauge",
      description: "Number of active load tests",
    });

    this.metrics.registerMetric("loadTest.requestRate", {
      type: "gauge",
      description: "Current request rate per second",
    });

    this.metrics.registerMetric("loadTest.responseTime", {
      type: "histogram",
      description: "Response time distribution",
    });

    this.metrics.registerMetric("loadTest.errorRate", {
      type: "gauge",
      description: "Error rate percentage",
    });

    // System resource metrics
    this.metrics.registerMetric("loadTest.cpuUsage", {
      type: "gauge",
      description: "CPU usage percentage during test",
    });

    this.metrics.registerMetric("loadTest.memoryUsage", {
      type: "gauge",
      description: "Memory usage during test",
    });
  }

  /**
   * Initialize metrics for a specific test
   * @private
   */
  _initializeTestMetrics(testId) {
    this.testResults.set(testId, {
      startTime: Date.now(),
      endTime: null,
      config: null,
      metrics: {
        requestCount: 0,
        errorCount: 0,
        responseTimes: [],
        throughput: [],
        resourceUsage: [],
      },
      status: "initializing",
    });
  }

  /**
   * Execute load test
   * @private
   */
  async _executeTest(config) {
    const testId = config.id;
    let isRunning = true;
    let currentLoad = 0;

    // Update test configuration
    const testResults = this.testResults.get(testId);
    testResults.config = config;
    testResults.status = "warming-up";

    // Warmup phase
    await this._executeWarmup(config);

    // Main test execution
    testResults.status = "running";
    const startTime = Date.now();
    const metricsInterval = setInterval(() => {
      this._collectMetrics(testId);
    }, this.options.metricsInterval);

    try {
      while (isRunning && Date.now() - startTime < config.duration) {
        // Calculate target load for current time
        currentLoad = this._calculateTargetLoad(config, Date.now() - startTime);

        // Generate load
        await this._generateLoad(testId, currentLoad);

        // Check if test should continue
        isRunning = await this._checkTestConditions(testId);
      }
    } catch (error) {
      testResults.status = "error";
      eventBus.publish("loadTest.error", {
        testId,
        error: error.message,
        timestamp: Date.now(),
      });
    } finally {
      clearInterval(metricsInterval);
    }

    // Cooldown phase
    testResults.status = "cooling-down";
    await this._executeCooldown(config);

    // Finalize test
    testResults.status = "completed";
    testResults.endTime = Date.now();

    // Generate final results
    const finalResults = this._generateTestReport(testId);
    this.testResults.set(testId, finalResults);

    // Notify test completion
    eventBus.publish("loadTest.completed", {
      testId,
      results: finalResults,
      timestamp: Date.now(),
    });

    return {
      stop: async () => {
        isRunning = false;
        await this._executeCooldown(config);
      },
    };
  }

  /**
   * Execute warmup phase
   * @private
   */
  async _executeWarmup(config) {
    const warmupStart = Date.now();
    let currentLoad = 0;

    while (Date.now() - warmupStart < config.warmup) {
      // Gradually increase load during warmup
      currentLoad =
        ((Date.now() - warmupStart) / config.warmup) * config.targetLoad * 0.5;
      await this._generateLoad(config.id, currentLoad);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  /**
   * Execute cooldown phase
   * @private
   */
  async _executeCooldown(config) {
    const cooldownStart = Date.now();
    let currentLoad = config.targetLoad;

    while (Date.now() - cooldownStart < config.cooldown) {
      // Gradually decrease load during cooldown
      currentLoad =
        (1 - (Date.now() - cooldownStart) / config.cooldown) *
        config.targetLoad;
      await this._generateLoad(config.id, currentLoad);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  /**
   * Calculate target load based on pattern
   * @private
   */
  _calculateTargetLoad(config, elapsed) {
    switch (config.loadPattern) {
      case "linear":
        return config.targetLoad;

      case "step":
        const step = Math.floor(elapsed / (config.duration / 4));
        return config.targetLoad * (0.25 + step * 0.25);

      case "spike":
        const phase = (elapsed % (config.duration / 2)) / (config.duration / 2);
        return config.targetLoad * (1 + Math.sin(phase * Math.PI));

      default:
        return config.targetLoad;
    }
  }

  /**
   * Generate load for testing
   * @private
   */
  async _generateLoad(testId, targetLoad) {
    const results = this.testResults.get(testId);
    const start = Date.now();

    try {
      // Simulate system load
      const promises = Array.from({ length: Math.ceil(targetLoad) }, () =>
        this._simulateRequest(testId)
      );

      await Promise.all(promises);

      // Record metrics
      const end = Date.now();
      results.metrics.requestCount += promises.length;
      results.metrics.throughput.push({
        timestamp: Date.now(),
        value: promises.length / ((end - start) / 1000),
      });
    } catch (error) {
      results.metrics.errorCount++;
      throw error;
    }
  }

  /**
   * Simulate single request
   * @private
   */
  async _simulateRequest(testId) {
    const start = Date.now();

    try {
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

      // Record response time
      const responseTime = Date.now() - start;
      this.testResults.get(testId).metrics.responseTimes.push({
        timestamp: Date.now(),
        value: responseTime,
      });

      return responseTime;
    } catch (error) {
      this.testResults.get(testId).metrics.errorCount++;
      throw error;
    }
  }

  /**
   * Collect system metrics
   * @private
   */
  _collectMetrics(testId) {
    const results = this.testResults.get(testId);

    // Collect resource usage
    const resourceUsage = {
      timestamp: Date.now(),
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
    };

    results.metrics.resourceUsage.push(resourceUsage);

    // Update metrics
    this.metrics.recordMetric("loadTest.active", this.activeTests.size);
    this.metrics.recordMetric(
      "loadTest.cpuUsage",
      resourceUsage.cpu.user / 1000000
    );
    this.metrics.recordMetric(
      "loadTest.memoryUsage",
      resourceUsage.memory.heapUsed
    );
  }

  /**
   * Check test conditions
   * @private
   */
  async _checkTestConditions(testId) {
    const results = this.testResults.get(testId);
    const errorRate = results.metrics.errorCount / results.metrics.requestCount;

    // Check error rate threshold
    if (errorRate > 0.1) {
      // 10% error rate threshold
      throw new Error("Test stopped: Error rate exceeded threshold");
    }

    return true;
  }

  /**
   * Generate test report
   * @private
   */
  _generateTestReport(testId) {
    const results = this.testResults.get(testId);
    const duration = results.endTime - results.startTime;

    // Calculate statistics
    const responseTimes = results.metrics.responseTimes.map((r) => r.value);
    const throughput = results.metrics.throughput.map((t) => t.value);

    const stats = {
      duration,
      totalRequests: results.metrics.requestCount,
      errorCount: results.metrics.errorCount,
      errorRate: results.metrics.errorCount / results.metrics.requestCount,
      responseTime: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        p95: this._calculatePercentile(responseTimes, 95),
        p99: this._calculatePercentile(responseTimes, 99),
      },
      throughput: {
        min: Math.min(...throughput),
        max: Math.max(...throughput),
        avg: throughput.reduce((a, b) => a + b, 0) / throughput.length,
      },
    };

    return {
      ...results,
      stats,
    };
  }

  /**
   * Calculate percentile value
   * @private
   */
  _calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

export default LoadTester;
