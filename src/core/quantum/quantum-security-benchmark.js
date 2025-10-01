/**
 * NANO-SWARM HDR (NS-HDR) QUANTUM SECURITY BENCHMARK
 * © 2025 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 * HDR EMPIRE - CONFIDENTIAL
 *
 * This module benchmarks the quantum security features of the NS-HDR system,
 * comparing quantum-derived entropy against standard cryptographic algorithms.
 */

import crypto from "crypto";
const fs = require("fs").promises;
import { QuantumEntropyGenerator } from "./nano-swarm-hdr.js";

/**
 * Benchmark configuration
 */
const CONFIG = {
  // Number of iterations for each test
  iterations: 10000,

  // Data sizes to test (in bytes)
  dataSizes: [16, 32, 64, 128, 256, 512, 1024, 2048, 4096],

  // Hash algorithms to compare
  hashAlgorithms: ["sha256", "sha512"],

  // Results output
  resultsFile: "quantum-benchmark-results.json",
};

/**
 * Core entropy measurement functionality
 */
class EntropyAnalyzer {
  /**
   * Measure entropy quality of provided data
   * @param {Buffer} data Data to analyze
   * @returns {Object} Entropy metrics
   */
  static measureEntropy(data) {
    const counts = new Array(256).fill(0);

    // Count occurrences of each byte value
    for (let i = 0; i < data.length; i++) {
      counts[data[i]]++;
    }

    // Calculate Shannon entropy
    let entropy = 0;
    for (let i = 0; i < 256; i++) {
      if (counts[i] > 0) {
        const probability = counts[i] / data.length;
        entropy -= probability * Math.log2(probability);
      }
    }

    // Calculate theoretical maximum entropy (8 bits per byte)
    const maxEntropy = 8;

    // Calculate entropy quality (0-1)
    const entropyQuality = entropy / maxEntropy;

    return {
      entropy,
      maxEntropy,
      entropyQuality,
      distribution: counts,
    };
  }

  /**
   * Analyze entropy distribution patterns
   * @param {Array} distribution Byte distribution array
   * @returns {Object} Distribution analysis
   */
  static analyzeDistribution(distribution) {
    const total = distribution.reduce((sum, count) => sum + count, 0);
    const expected = total / 256; // Perfect uniform distribution

    let chiSquared = 0;
    let maxDeviation = 0;

    for (let i = 0; i < 256; i++) {
      const deviation = Math.abs(distribution[i] - expected);
      chiSquared += Math.pow(deviation, 2) / expected;
      maxDeviation = Math.max(maxDeviation, deviation);
    }

    return {
      chiSquared,
      maxDeviation,
      uniformity: 1 - maxDeviation / expected,
    };
  }
}

/**
 * Performance testing functionality
 */
class PerformanceTester {
  constructor() {
    this.quantumGen = new QuantumEntropyGenerator();
  }

  /**
   * Run randomness generation performance test
   * @param {number} size Data size in bytes
   * @returns {Object} Test results
   */
  async testRandomGeneration(size) {
    // Test crypto.randomBytes
    const cryptoTimes = [];
    for (let i = 0; i < CONFIG.iterations; i++) {
      const startTime = process.hrtime.bigint();
      crypto.randomBytes(size);
      const endTime = process.hrtime.bigint();
      cryptoTimes.push(Number(endTime - startTime) / 1e6);
    }

    // Test quantum entropy generation
    const quantumTimes = [];
    for (let i = 0; i < CONFIG.iterations; i++) {
      const startTime = process.hrtime.bigint();
      this.quantumGen.getEntropy(size);
      const endTime = process.hrtime.bigint();
      quantumTimes.push(Number(endTime - startTime) / 1e6);
    }

    // Calculate statistics
    const cryptoAvg =
      cryptoTimes.reduce((sum, val) => sum + val, 0) / cryptoTimes.length;
    const quantumAvg =
      quantumTimes.reduce((sum, val) => sum + val, 0) / quantumTimes.length;

    return {
      dataSize: size,
      cryptoAvgTimeMs: cryptoAvg,
      quantumAvgTimeMs: quantumAvg,
      speedupFactor: cryptoAvg / quantumAvg,
      iterations: CONFIG.iterations,
    };
  }

  /**
   * Run hashing performance test
   * @param {string} algorithm Hash algorithm
   * @param {number} size Data size in bytes
   * @returns {Object} Test results
   */
  async testHashing(algorithm, size) {
    const testData = crypto.randomBytes(size);

    // Test standard crypto hashing
    const cryptoTimes = [];
    for (let i = 0; i < CONFIG.iterations; i++) {
      const startTime = process.hrtime.bigint();
      crypto.createHash(algorithm).update(testData).digest();
      const endTime = process.hrtime.bigint();
      cryptoTimes.push(Number(endTime - startTime) / 1e6);
    }

    // Test quantum hashing
    const quantumTimes = [];
    for (let i = 0; i < CONFIG.iterations; i++) {
      const startTime = process.hrtime.bigint();
      const entropy = this.quantumGen.getEntropy(32);
      crypto.createHmac(algorithm, entropy).update(testData).digest();
      const endTime = process.hrtime.bigint();
      quantumTimes.push(Number(endTime - startTime) / 1e6);
    }

    const cryptoAvg =
      cryptoTimes.reduce((sum, val) => sum + val, 0) / cryptoTimes.length;
    const quantumAvg =
      quantumTimes.reduce((sum, val) => sum + val, 0) / quantumTimes.length;

    return {
      dataSize: size,
      algorithm,
      cryptoAvgTimeMs: cryptoAvg,
      quantumAvgTimeMs: quantumAvg,
      speedupFactor: cryptoAvg / quantumAvg,
      iterations: CONFIG.iterations,
    };
  }
}

/**
 * Security analysis functionality
 */
class SecurityAnalyzer {
  /**
   * Analyze security implications of benchmark results
   * @param {Object} results Benchmark results
   * @returns {Object} Security analysis
   */
  static analyzeSecurityImplications(results) {
    // Calculate security scores
    const randomnessScore =
      Math.min(1, results.summary.averageRandomSpeedup / 10) * 0.3;
    const hashingScore =
      Math.min(1, results.summary.averageHashSpeedup / 5) * 0.3;
    const entropyScore =
      Math.min(1, (results.summary.averageEntropyImprovement - 1) * 10) * 0.4;
    const totalScore = randomnessScore + hashingScore + entropyScore;

    // Determine security level
    let securityLevel;
    if (totalScore >= 0.8) {
      securityLevel = "Quantum-Grade";
    } else if (totalScore >= 0.6) {
      securityLevel = "High";
    } else if (totalScore >= 0.4) {
      securityLevel = "Medium";
    } else {
      securityLevel = "Standard";
    }

    const implications = {
      score: totalScore,
      level: securityLevel,
      components: {
        randomness: randomnessScore / 0.3,
        hashing: hashingScore / 0.3,
        entropy: entropyScore / 0.4,
      },
      analysis: {
        strengths: [],
        weaknesses: [],
        recommendations: [],
      },
    };

    // Analyze components
    this._analyzeRandomness(implications);
    this._analyzeHashing(implications);
    this._analyzeEntropy(implications);

    return implications;
  }

  /**
   * Analyze randomness performance
   * @private
   */
  static _analyzeRandomness(implications) {
    const score = implications.components.randomness;

    if (score > 0.8) {
      implications.analysis.strengths.push(
        "Excellent quantum random generation performance"
      );
    } else if (score < 0.4) {
      implications.analysis.weaknesses.push(
        "Quantum random generation needs optimization"
      );
      implications.analysis.recommendations.push(
        "Consider implementing parallel quantum entropy collection"
      );
    }
  }

  /**
   * Analyze hashing performance
   * @private
   */
  static _analyzeHashing(implications) {
    const score = implications.components.hashing;

    if (score > 0.8) {
      implications.analysis.strengths.push(
        "Strong quantum hashing performance"
      );
    } else if (score < 0.4) {
      implications.analysis.weaknesses.push(
        "Quantum hashing performance below target"
      );
      implications.analysis.recommendations.push(
        "Optimize quantum entropy integration in hash operations"
      );
    }
  }

  /**
   * Analyze entropy quality
   * @private
   */
  static _analyzeEntropy(implications) {
    const score = implications.components.entropy;

    if (score > 0.8) {
      implications.analysis.strengths.push(
        "High-quality quantum entropy generation"
      );
    } else if (score < 0.4) {
      implications.analysis.weaknesses.push(
        "Entropy quality needs improvement"
      );
      implications.analysis.recommendations.push(
        "Implement additional quantum entropy sources"
      );
    }
  }
}

/**
 * Main benchmark runner
 */
class QuantumBenchmarkRunner {
  constructor() {
    this.performanceTester = new PerformanceTester();
  }

  /**
   * Run all benchmark tests
   * @returns {Promise<Object>} Benchmark results
   */
  async runBenchmark() {
    console.log("Starting NS-HDR Quantum Security Benchmark...");

    const results = {
      config: CONFIG,
      timestamp: Date.now(),
      randomnessTests: [],
      hashingTests: [],
      entropyTests: [],
    };

    // Run randomness tests
    console.log("\nTesting random number generation...");
    for (const size of CONFIG.dataSizes) {
      const test = await this.performanceTester.testRandomGeneration(size);
      results.randomnessTests.push(test);
      console.log(
        `Completed ${size} bytes: ${test.speedupFactor.toFixed(2)}x speedup`
      );
    }

    // Run hashing tests
    console.log("\nTesting hashing performance...");
    for (const algorithm of CONFIG.hashAlgorithms) {
      for (const size of CONFIG.dataSizes) {
        const test = await this.performanceTester.testHashing(algorithm, size);
        results.hashingTests.push(test);
        console.log(
          `Completed ${algorithm} ${size} bytes: ${test.speedupFactor.toFixed(
            2
          )}x speedup`
        );
      }
    }

    // Calculate summary
    results.summary = this._calculateSummary(results);

    // Analyze security implications
    results.security = SecurityAnalyzer.analyzeSecurityImplications(results);

    // Save results
    await fs.writeFile(CONFIG.resultsFile, JSON.stringify(results, null, 2));

    return results;
  }

  /**
   * Calculate benchmark summary statistics
   * @private
   */
  _calculateSummary(results) {
    const randomSpeedups = results.randomnessTests.map((t) => t.speedupFactor);
    const hashSpeedups = results.hashingTests.map((t) => t.speedupFactor);

    return {
      averageRandomSpeedup: this._average(randomSpeedups),
      averageHashSpeedup: this._average(hashSpeedups),
      bestRandomSpeedup: Math.max(...randomSpeedups),
      bestHashSpeedup: Math.max(...hashSpeedups),
    };
  }

  /**
   * Calculate average of array
   * @private
   */
  _average(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
}

module.exports = {
  QuantumBenchmarkRunner,
  EntropyAnalyzer,
  SecurityAnalyzer,
  CONFIG,
};
