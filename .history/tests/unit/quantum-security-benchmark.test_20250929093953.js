/**
 * Unit tests for NS-HDR Quantum Security Benchmark
 * © 2025 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 * HDR EMPIRE - CONFIDENTIAL
 */

const crypto = require('crypto');
const {
  QuantumBenchmarkRunner,
  EntropyAnalyzer,
  SecurityAnalyzer,
  CONFIG
} = require('../../src/core/quantum/quantum-security-benchmark');

// Mock QuantumEntropyGenerator
jest.mock('../../src/core/nano-swarm-hdr', () => ({
  QuantumEntropyGenerator: jest.fn().mockImplementation(() => ({
    getEntropy: jest.fn((size) => crypto.randomBytes(size))
  }))
}));

describe('EntropyAnalyzer', () => {
  describe('measureEntropy', () => {
    test('should calculate correct entropy for uniform distribution', () => {
      // Create perfectly uniform distribution
      const data = Buffer.from([0, 1, 2, 3]);
      const result = EntropyAnalyzer.measureEntropy(data);
      
      expect(result.entropy).toBeCloseTo(2.0, 1);
      expect(result.maxEntropy).toBe(8);
      expect(result.entropyQuality).toBeGreaterThan(0);
      expect(result.distribution).toHaveLength(256);
    });

    test('should calculate zero entropy for constant data', () => {
      const data = Buffer.from([0, 0, 0, 0]);
      const result = EntropyAnalyzer.measureEntropy(data);
      
      expect(result.entropy).toBe(0);
      expect(result.entropyQuality).toBe(0);
    });
  });

  describe('analyzeDistribution', () => {
    test('should detect uniform distribution', () => {
      const distribution = new Array(256).fill(10); // Perfectly uniform
      const result = EntropyAnalyzer.analyzeDistribution(distribution);
      
      expect(result.uniformity).toBe(1);
      expect(result.maxDeviation).toBe(0);
    });

    test('should detect non-uniform distribution', () => {
      const distribution = new Array(256).fill(10);
      distribution[0] = 20; // Make it non-uniform
      const result = EntropyAnalyzer.analyzeDistribution(distribution);
      
      expect(result.uniformity).toBeLessThan(1);
      expect(result.maxDeviation).toBeGreaterThan(0);
    });
  });
});

describe('SecurityAnalyzer', () => {
  const mockResults = {
    summary: {
      averageRandomSpeedup: 5,
      averageHashSpeedup: 3,
      averageEntropyImprovement: 1.5
    }
  };

  test('should calculate security scores correctly', () => {
    const analysis = SecurityAnalyzer.analyzeSecurityImplications(mockResults);
    
    expect(analysis.score).toBeGreaterThan(0);
    expect(analysis.level).toMatch(/^(Quantum-Grade|High|Medium|Standard)$/);
    expect(analysis.components).toHaveProperty('randomness');
    expect(analysis.components).toHaveProperty('hashing');
    expect(analysis.components).toHaveProperty('entropy');
  });

  test('should identify strengths and weaknesses', () => {
    const analysis = SecurityAnalyzer.analyzeSecurityImplications(mockResults);
    
    expect(Array.isArray(analysis.analysis.strengths)).toBe(true);
    expect(Array.isArray(analysis.analysis.weaknesses)).toBe(true);
    expect(Array.isArray(analysis.analysis.recommendations)).toBe(true);
  });
});

describe('PerformanceTester', () => {
  let runner;

  beforeEach(() => {
    runner = new QuantumBenchmarkRunner();
  });

  test('should test random generation performance', async () => {
    const result = await runner.performanceTester.testRandomGeneration(32);
    
    expect(result).toHaveProperty('dataSize', 32);
    expect(result).toHaveProperty('cryptoAvgTimeMs');
    expect(result).toHaveProperty('quantumAvgTimeMs');
    expect(result).toHaveProperty('speedupFactor');
    expect(result.iterations).toBe(CONFIG.iterations);
  });

  test('should test hashing performance', async () => {
    const result = await runner.performanceTester.testHashing('sha256', 32);
    
    expect(result).toHaveProperty('algorithm', 'sha256');
    expect(result).toHaveProperty('dataSize', 32);
    expect(result).toHaveProperty('cryptoAvgTimeMs');
    expect(result).toHaveProperty('quantumAvgTimeMs');
    expect(result).toHaveProperty('speedupFactor');
  });
});

describe('QuantumBenchmarkRunner', () => {
  let runner;

  beforeEach(() => {
    runner = new QuantumBenchmarkRunner();
  });

  test('should run complete benchmark suite', async () => {
    // Mock fs.writeFile to avoid file system operations
    const mockWriteFile = jest.spyOn(require('fs').promises, 'writeFile')
      .mockImplementation(() => Promise.resolve());

    const results = await runner.runBenchmark();
    
    expect(results).toHaveProperty('config');
    expect(results).toHaveProperty('timestamp');
    expect(results).toHaveProperty('randomnessTests');
    expect(results).toHaveProperty('hashingTests');
    expect(results).toHaveProperty('summary');
    expect(results).toHaveProperty('security');

    expect(mockWriteFile).toHaveBeenCalled();
    mockWriteFile.mockRestore();
  });

  test('should calculate correct summary statistics', () => {
    const mockResults = {
      randomnessTests: [
        { speedupFactor: 2 },
        { speedupFactor: 4 }
      ],
      hashingTests: [
        { speedupFactor: 1 },
        { speedupFactor: 3 }
      ]
    };

    const summary = runner._calculateSummary(mockResults);
    
    expect(summary.averageRandomSpeedup).toBe(3);
    expect(summary.averageHashSpeedup).toBe(2);
    expect(summary.bestRandomSpeedup).toBe(4);
    expect(summary.bestHashSpeedup).toBe(3);
  });
});