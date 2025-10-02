/**
 * HDR Empire Framework - Performance Optimization Test Suites
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 */

describe("CacheManager", () => {
  let CacheManager, cacheManager;

  beforeAll(async () => {
    const module = await import("../../../src/performance/CacheManager.js");
    CacheManager = module.default;
  });

  beforeEach(() => {
    cacheManager = new CacheManager({
      l1MaxSize: 1000,
      l1Ttl: 60000,
      l2Ttl: 3600000,
    });
  });

  describe("Cache Strategies", () => {
    test("should support write-through strategy", async () => {
      await cacheManager.setStrategy("write-through");
      await cacheManager.set("key1", "value1");
      const value = await cacheManager.get("key1");
      expect(value).toBe("value1");
    });

    test("should support write-behind strategy", async () => {
      await cacheManager.setStrategy("write-behind");
      await cacheManager.set("key2", "value2");
      const value = await cacheManager.get("key2");
      expect(value).toBe("value2");
    });

    test("should support write-around strategy", async () => {
      await cacheManager.setStrategy("write-around");
      await cacheManager.set("key3", "value3");
      expect(await cacheManager.get("key3")).toBeDefined();
    });
  });

  describe("Cache Hit/Miss", () => {
    test("should track cache hits", async () => {
      await cacheManager.set("test", "data");
      await cacheManager.get("test");
      const stats = cacheManager.getStats();
      expect(stats.hits).toBeGreaterThan(0);
    });

    test("should track cache misses", async () => {
      await cacheManager.get("nonexistent");
      const stats = cacheManager.getStats();
      expect(stats.misses).toBeGreaterThan(0);
    });

    test("should achieve target hit rate", async () => {
      for (let i = 0; i < 100; i++) {
        await cacheManager.set(`key${i}`, `value${i}`);
      }
      for (let i = 0; i < 80; i++) {
        await cacheManager.get(`key${i}`);
      }

      const stats = cacheManager.getStats();
      const hitRate = stats.hits / (stats.hits + stats.misses);
      expect(hitRate).toBeGreaterThan(0.7);
    });
  });

  describe("L1/L2 Integration", () => {
    test("should use L1 cache first", async () => {
      await cacheManager.set("l1-test", "data");
      const value = await cacheManager.get("l1-test");
      expect(value).toBe("data");
    });

    test("should fallback to L2 on L1 miss", async () => {
      await cacheManager.set("l2-test", "data");
      cacheManager.clearL1();
      const value = await cacheManager.get("l2-test");
      expect(value).toBeDefined();
    });
  });

  describe("Eviction Policies", () => {
    test("should evict LRU items when cache full", async () => {
      const smallCache = new CacheManager({ l1MaxSize: 5 });
      for (let i = 0; i < 10; i++) {
        await smallCache.set(`key${i}`, `value${i}`);
      }
      expect(await smallCache.get("key0")).toBeUndefined();
    });
  });
});

describe("CodeSplitting", () => {
  let CodeSplitting, codeSplitting;

  beforeAll(async () => {
    const module = await import("../../../src/performance/CodeSplitting.js");
    CodeSplitting = module.default;
  });

  beforeEach(() => {
    codeSplitting = new CodeSplitting();
  });

  describe("Dynamic Imports", () => {
    test("should handle dynamic imports", async () => {
      const result = await codeSplitting.loadModule("test-module");
      expect(result).toBeDefined();
    });

    test("should cache loaded modules", async () => {
      await codeSplitting.loadModule("cached-module");
      const cached = await codeSplitting.loadModule("cached-module");
      expect(cached).toBeDefined();
    });
  });

  describe("Bundle Size Reduction", () => {
    test("should reduce initial bundle size", () => {
      const metrics = codeSplitting.getBundleMetrics();
      expect(metrics.reduction).toBeGreaterThan(0.4);
    });
  });

  describe("Lazy Loading", () => {
    test("should lazy load components", async () => {
      const component = await codeSplitting.lazyLoad("TestComponent");
      expect(component).toBeDefined();
    });

    test("should track loading performance", async () => {
      const start = Date.now();
      await codeSplitting.lazyLoad("TestComponent");
      const duration = Date.now() - start;
      // Using custom performance matcher for semantic assertion
      expect(duration).toBeMeasurement({ min: 0, max: 500, unit: "ms" });
      expect(duration).toBePerformant({
        threshold: 500,
        baseline: 1000,
        unit: "ms",
      });
    });
  });
});

describe("CriticalPathOptimizer", () => {
  let CriticalPathOptimizer, optimizer;

  beforeAll(async () => {
    const module = await import(
      "../../../src/performance/CriticalPathOptimizer.js"
    );
    CriticalPathOptimizer = module.default;
  });

  beforeEach(() => {
    optimizer = new CriticalPathOptimizer();
  });

  describe("HDR System Optimizations", () => {
    test("should optimize N-HDR operations", async () => {
      const result = await optimizer.optimize("N-HDR", { test: "data" });
      expect(result).toBeDefined();
      expect(result.optimized).toBe(true);
    });

    test("should optimize NS-HDR operations", async () => {
      const result = await optimizer.optimize("NS-HDR", { test: "data" });
      expect(result.optimized).toBe(true);
    });

    test("should optimize all HDR systems", async () => {
      const systems = [
        "N-HDR",
        "NS-HDR",
        "O-HDR",
        "R-HDR",
        "Q-HDR",
        "D-HDR",
        "VB-HDR",
      ];
      for (const system of systems) {
        const result = await optimizer.optimize(system, {});
        expect(result.optimized).toBe(true);
      }
    });
  });

  describe("Performance Improvements", () => {
    test("should meet performance targets", async () => {
      const metrics = await optimizer.getPerformanceMetrics();
      expect(metrics.improvement).toBeGreaterThan(0.25);
    });

    test("should have fallback mechanisms", async () => {
      const result = await optimizer.optimize("INVALID-SYSTEM", {});
      expect(result).toBeDefined();
    });
  });
});

describe("PerformanceBenchmark", () => {
  let PerformanceBenchmark, benchmark;

  beforeAll(async () => {
    const module = await import(
      "../../../src/performance/PerformanceBenchmark.js"
    );
    PerformanceBenchmark = module.default;
  });

  beforeEach(() => {
    benchmark = new PerformanceBenchmark();
  });

  describe("Benchmark Accuracy", () => {
    test("should measure operation times accurately", async () => {
      const result = await benchmark.measure("test-op", async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Using custom performance matcher for range validation
      expect(result.duration).toBeMeasurement({
        min: 90,
        max: 150,
        unit: "ms",
      });
      expect(result.duration).toBeWithinPercentOf(100, 50); // 50% tolerance around 100ms
    });
  });

  describe("Metrics Collection", () => {
    test("should collect performance metrics", async () => {
      await benchmark.measure("op1", async () => {});
      const metrics = benchmark.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.operations).toContain("op1");
    });
  });

  describe("Results Reporting", () => {
    test("should generate performance report", async () => {
      await benchmark.measure("test", async () => {});
      const report = benchmark.generateReport();
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
    });
  });

  describe("Comparison Functionality", () => {
    test("should compare benchmark results", async () => {
      const baseline = await benchmark.measure("baseline", async () => {});
      const optimized = await benchmark.measure("optimized", async () => {});

      const comparison = benchmark.compare(baseline, optimized);
      expect(comparison).toBeDefined();
      expect(comparison).toHaveProperty("improvement");
    });
  });
});
