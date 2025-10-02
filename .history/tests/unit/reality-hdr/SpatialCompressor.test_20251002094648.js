/**
 * HDR Empire Framework - Spatial Compressor Test Suite
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 */

describe('SpatialCompressor', () => {
  let SpatialCompressor, compressor;

  beforeAll(async () => {
    const module = await import('../../../src/core/reality-hdr/SpatialCompressor.js');
    SpatialCompressor = module.default;
  });

  beforeEach(() => {
    compressor = new SpatialCompressor({
      algorithm: 'quantum-fold',
      precision: 'ultra-high'
    });
  });

  describe('Constructor', () => {
    test('should initialize with default config', () => {
      const defaultCompressor = new SpatialCompressor();
      expect(defaultCompressor.compressionAlgorithm).toBe('quantum-fold');
      expect(defaultCompressor.precisionLevel).toBe('ultra-high');
    });

    test('should accept custom configuration', () => {
      const custom = new SpatialCompressor({
        algorithm: 'fast-fold',
        precision: 'high'
      });
      expect(custom.compressionAlgorithm).toBe('fast-fold');
      expect(custom.precisionLevel).toBe('high');
    });
  });

  describe('compress()', () => {
    const mockSpace = {
      volume: 1000,
      dimensions: { x: 10, y: 10, z: 10 }
    };

    test('should compress space with target ratio', async () => {
      const result = await compressor.compress(mockSpace, 1000);
      
      expect(result).toHaveProperty('originalVolume');
      expect(result).toHaveProperty('compressedVolume');
      expect(result).toHaveProperty('compressionRatio', 1000);
      expect(result).toHaveProperty('quantumSignature');
    });

    test('should handle different compression ratios', async () => {
      const result1 = await compressor.compress(mockSpace, 100);
      const result2 = await compressor.compress(mockSpace, 10000);
      
      expect(result1.compressionRatio).toBe(100);
      expect(result2.compressionRatio).toBe(10000);
    });

    test('should initialize quantum state', async () => {
      await compressor.compress(mockSpace, 1000);
      expect(compressor.quantumState).toBeDefined();
      expect(compressor.quantumState.signature).toBeDefined();
    });

    test('should handle compression errors', async () => {
      await expect(compressor.compress(null, 1000))
        .rejects.toThrow('Compression failed');
    });
  });

  describe('Performance Tests', () => {
    test('should achieve high compression ratios', async () => {
      const largeSpace = {
        volume: 100000,
        dimensions: { x: 100, y: 100, z: 100 }
      };
      
      const result = await compressor.compress(largeSpace, 10000);
      expect(result.compressionRatio).toBe(10000);
    });

    test('should compress within time limit', async () => {
      const space = { volume: 10000, dimensions: { x: 50, y: 50, z: 50 } };
      const start = Date.now();
      await compressor.compress(space, 1000);
      expect(Date.now() - start).toBeLessThan(1000);
    });
  });
});
