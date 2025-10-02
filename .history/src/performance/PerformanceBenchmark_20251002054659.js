/*
 * HDR Empire Framework - Performance Benchmark System
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

/**
 * Comprehensive performance benchmarking system for HDR Empire Framework
 * 
 * Features:
 * - Before/after performance measurement
 * - Statistical analysis (mean, median, p95, p99, min, max)
 * - Warmup phase to eliminate JIT compilation effects
 * - Memory profiling (heap size, GC tracking)
 * - Target validation against performance goals
 * - Export results to JSON and Markdown formats
 */
class PerformanceBenchmark extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      warmupIterations: options.warmupIterations || 10,
      benchmarkIterations: options.benchmarkIterations || 100,
      cooldownTime: options.cooldownTime || 500, // ms
      gcBetweenTests: options.gcBetweenTests !== false,
      memoryProfiling: options.memoryProfiling !== false,
      ...options
    };
    
    // Performance targets (ms)
    this.targets = {
      'neural-hdr-capture': 1000,
      'nano-swarm-deploy': 200,
      'omniscient-crystallize': 3000,
      'reality-compress': 5000,
      'quantum-superposition': 500,
      'dream-amplify': 2000,
      'void-blade-zone': 300
    };
    
    this.results = new Map();
    this.memorySnapshots = [];
  }
  
  /**
   * Run comprehensive benchmark suite
   */
  async runBenchmarkSuite(benchmarks) {
    console.log('Starting HDR Empire Framework Performance Benchmark Suite');
    console.log(`Warmup iterations: ${this.options.warmupIterations}`);
    console.log(`Benchmark iterations: ${this.options.benchmarkIterations}`);
    console.log('='.repeat(80));
    
    const suiteResults = {
      startTime: new Date().toISOString(),
      benchmarks: {},
      summary: {}
    };
    
    for (const [name, benchmark] of Object.entries(benchmarks)) {
      console.log(`\nBenchmarking: ${name}`);
      
      // Run warmup
      await this._warmup(benchmark.fn, benchmark.setup);
      
      // Run benchmark
      const result = await this.benchmark(
        name,
        benchmark.fn,
        benchmark.setup,
        benchmark.teardown
      );
      
      suiteResults.benchmarks[name] = result;
      
      // Check against target
      const target = this.targets[name];
      if (target) {
        const passed = result.stats.mean <= target;
        console.log(`Target: ${target}ms, Actual: ${result.stats.mean.toFixed(2)}ms - ${passed ? '✓ PASS' : '✗ FAIL'}`);
      }
      
      // Cooldown between benchmarks
      await this._sleep(this.options.cooldownTime);
    }
    
    // Generate summary
    suiteResults.summary = this._generateSummary(suiteResults.benchmarks);
    suiteResults.endTime = new Date().toISOString();
    
    this.emit('suite:complete', suiteResults);
    return suiteResults;
  }
  
  /**
   * Benchmark a single operation
   */
  async benchmark(name, fn, setup = null, teardown = null) {
    const measurements = [];
    const memoryBefore = this._captureMemory();
    
    this.emit('benchmark:start', { name });
    
    for (let i = 0; i < this.options.benchmarkIterations; i++) {
      // Setup
      let context;
      if (setup) {
        context = await setup();
      }
      
      // Force GC before measurement
      if (this.options.gcBetweenTests && global.gc) {
        global.gc();
      }
      
      // Measure execution
      const start = performance.now();
      try {
        await fn(context);
      } catch (error) {
        console.error(`Error in benchmark ${name}:`, error);
        this.emit('benchmark:error', { name, error, iteration: i });
      }
      const end = performance.now();
      
      measurements.push(end - start);
      
      // Teardown
      if (teardown) {
        await teardown(context);
      }
      
      // Emit progress
      if (i % 10 === 0) {
        this.emit('benchmark:progress', {
          name,
          iteration: i,
          total: this.options.benchmarkIterations
        });
      }
    }
    
    const memoryAfter = this._captureMemory();
    
    // Calculate statistics
    const stats = this._calculateStats(measurements);
    
    const result = {
      name,
      iterations: this.options.benchmarkIterations,
      measurements,
      stats,
      memory: {
        before: memoryBefore,
        after: memoryAfter,
        delta: {
          heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
          external: memoryAfter.external - memoryBefore.external
        }
      },
      timestamp: new Date().toISOString()
    };
    
    this.results.set(name, result);
    this.emit('benchmark:complete', result);
    
    return result;
  }
  
  /**
   * Compare two benchmarks (before/after optimization)
   */
  async compareBenchmarks(name, baselineFn, optimizedFn, setup = null, teardown = null) {
    console.log(`\nComparing: ${name}`);
    console.log('-'.repeat(80));
    
    // Run baseline
    console.log('Running baseline...');
    const baselineResult = await this.benchmark(
      `${name}-baseline`,
      baselineFn,
      setup,
      teardown
    );
    
    // Cooldown
    await this._sleep(this.options.cooldownTime);
    
    // Run optimized
    console.log('Running optimized...');
    const optimizedResult = await this.benchmark(
      `${name}-optimized`,
      optimizedFn,
      setup,
      teardown
    );
    
    // Calculate improvement
    const improvement = this._calculateImprovement(baselineResult, optimizedResult);
    
    const comparison = {
      name,
      baseline: baselineResult,
      optimized: optimizedResult,
      improvement,
      timestamp: new Date().toISOString()
    };
    
    this.emit('comparison:complete', comparison);
    
    // Display results
    this._displayComparison(comparison);
    
    return comparison;
  }
  
  /**
   * Warmup phase to eliminate JIT compilation effects
   */
  async _warmup(fn, setup = null) {
    console.log(`Warming up (${this.options.warmupIterations} iterations)...`);
    
    for (let i = 0; i < this.options.warmupIterations; i++) {
      const context = setup ? await setup() : null;
      try {
        await fn(context);
      } catch (error) {
        // Ignore warmup errors
      }
    }
  }
  
  /**
   * Calculate statistics from measurements
   */
  _calculateStats(measurements) {
    const sorted = [...measurements].sort((a, b) => a - b);
    const n = sorted.length;
    
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    
    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];
    
    const p95 = sorted[Math.floor(n * 0.95)];
    const p99 = sorted[Math.floor(n * 0.99)];
    const min = sorted[0];
    const max = sorted[n - 1];
    
    // Standard deviation
    const squaredDiffs = measurements.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / n;
    const stdDev = Math.sqrt(variance);
    
    return {
      mean,
      median,
      p95,
      p99,
      min,
      max,
      stdDev,
      count: n
    };
  }
  
  /**
   * Calculate improvement between baseline and optimized
   */
  _calculateImprovement(baseline, optimized) {
    const meanImprovement = ((baseline.stats.mean - optimized.stats.mean) / baseline.stats.mean) * 100;
    const medianImprovement = ((baseline.stats.median - optimized.stats.median) / baseline.stats.median) * 100;
    const p95Improvement = ((baseline.stats.p95 - optimized.stats.p95) / baseline.stats.p95) * 100;
    
    const memoryImprovement = baseline.memory && optimized.memory
      ? ((baseline.memory.delta.heapUsed - optimized.memory.delta.heapUsed) / baseline.memory.delta.heapUsed) * 100
      : 0;
    
    return {
      mean: meanImprovement,
      median: medianImprovement,
      p95: p95Improvement,
      memory: memoryImprovement,
      faster: meanImprovement > 0
    };
  }
  
  /**
   * Capture current memory usage
   */
  _captureMemory() {
    if (!this.options.memoryProfiling) return null;
    
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      timestamp: Date.now()
    };
  }
  
  /**
   * Generate summary of all benchmarks
   */
  _generateSummary(benchmarks) {
    const summary = {
      totalBenchmarks: Object.keys(benchmarks).length,
      passed: 0,
      failed: 0,
      averageImprovement: 0,
      results: []
    };
    
    for (const [name, result] of Object.entries(benchmarks)) {
      const target = this.targets[name];
      if (target) {
        const passed = result.stats.mean <= target;
        if (passed) {
          summary.passed++;
        } else {
          summary.failed++;
        }
        
        summary.results.push({
          name,
          mean: result.stats.mean,
          target,
          passed,
          margin: target - result.stats.mean
        });
      }
    }
    
    return summary;
  }
  
  /**
   * Display comparison results
   */
  _displayComparison(comparison) {
    console.log('\nResults:');
    console.log(`Baseline: ${comparison.baseline.stats.mean.toFixed(2)}ms (±${comparison.baseline.stats.stdDev.toFixed(2)}ms)`);
    console.log(`Optimized: ${comparison.optimized.stats.mean.toFixed(2)}ms (±${comparison.optimized.stats.stdDev.toFixed(2)}ms)`);
    console.log(`Improvement: ${comparison.improvement.mean.toFixed(2)}% ${comparison.improvement.faster ? 'faster' : 'slower'}`);
    
    if (comparison.improvement.memory !== 0) {
      console.log(`Memory: ${comparison.improvement.memory.toFixed(2)}% ${comparison.improvement.memory > 0 ? 'less' : 'more'}`);
    }
  }
  
  /**
   * Export results to JSON file
   */
  async exportJSON(filePath, results) {
    const json = JSON.stringify(results, null, 2);
    await fs.writeFile(filePath, json, 'utf8');
    console.log(`\nResults exported to: ${filePath}`);
  }
  
  /**
   * Export results to Markdown file
   */
  async exportMarkdown(filePath, results) {
    let markdown = '# HDR Empire Framework - Performance Benchmark Results\n\n';
    markdown += `**Date:** ${results.startTime}\n\n`;
    markdown += `**Configuration:**\n`;
    markdown += `- Warmup iterations: ${this.options.warmupIterations}\n`;
    markdown += `- Benchmark iterations: ${this.options.benchmarkIterations}\n`;
    markdown += `- Memory profiling: ${this.options.memoryProfiling}\n\n`;
    
    markdown += '## Summary\n\n';
    markdown += `- Total benchmarks: ${results.summary.totalBenchmarks}\n`;
    markdown += `- Passed: ${results.summary.passed}\n`;
    markdown += `- Failed: ${results.summary.failed}\n\n`;
    
    markdown += '## Results\n\n';
    markdown += '| Benchmark | Mean | Median | P95 | P99 | Min | Max | Target | Status |\n';
    markdown += '|-----------|------|--------|-----|-----|-----|-----|--------|--------|\n';
    
    for (const [name, result] of Object.entries(results.benchmarks)) {
      const target = this.targets[name] || 'N/A';
      const status = target !== 'N/A' && result.stats.mean <= target ? '✓' : '✗';
      
      markdown += `| ${name} `;
      markdown += `| ${result.stats.mean.toFixed(2)}ms `;
      markdown += `| ${result.stats.median.toFixed(2)}ms `;
      markdown += `| ${result.stats.p95.toFixed(2)}ms `;
      markdown += `| ${result.stats.p99.toFixed(2)}ms `;
      markdown += `| ${result.stats.min.toFixed(2)}ms `;
      markdown += `| ${result.stats.max.toFixed(2)}ms `;
      markdown += `| ${target}${typeof target === 'number' ? 'ms' : ''} `;
      markdown += `| ${status} |\n`;
    }
    
    if (this.options.memoryProfiling) {
      markdown += '\n## Memory Usage\n\n';
      markdown += '| Benchmark | Heap Delta | External Delta |\n';
      markdown += '|-----------|------------|----------------|\n';
      
      for (const [name, result] of Object.entries(results.benchmarks)) {
        if (result.memory) {
          const heapDelta = (result.memory.delta.heapUsed / 1024 / 1024).toFixed(2);
          const externalDelta = (result.memory.delta.external / 1024 / 1024).toFixed(2);
          markdown += `| ${name} | ${heapDelta} MB | ${externalDelta} MB |\n`;
        }
      }
    }
    
    await fs.writeFile(filePath, markdown, 'utf8');
    console.log(`Results exported to: ${filePath}`);
  }
  
  /**
   * Sleep utility
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get all benchmark results
   */
  getAllResults() {
    return Array.from(this.results.entries()).map(([name, result]) => ({
      name,
      ...result
    }));
  }
  
  /**
   * Clear all results
   */
  clearResults() {
    this.results.clear();
    this.memorySnapshots = [];
  }
}

export default PerformanceBenchmark;
