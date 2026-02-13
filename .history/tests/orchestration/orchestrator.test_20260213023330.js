/**
 * HDR Orchestrator Unit Tests
 * Tests for metrics collection and system orchestration functionality
 */

import { HDRIntegrationOrchestrator } from "../../src/hdr-orchestrator.js";
import logger from "../../src/logging/logger.js";

describe("HDR Orchestrator", () => {
  let orchestrator;
  let mockGenesis;
  let mockOracle;
  let mockDiffusion;

  beforeEach(() => {
    // Create tracking arrays for calls
    const genesisCalls = [];
    const oracleCalls = [];
    const diffusionCalls = [];

    // Create mock sub-systems with metrics and call tracking
    mockGenesis = {
      metrics: {
        populationSize: 50,
        averageFitness: 0.75,
        diversity: 0.68,
      },
      on: (event, handler) => {
        genesisCalls.push({ event, handler });
      },
      _calls: genesisCalls,
    };

    mockOracle = {
      metrics: {
        predictionsGenerated: 100,
        cascadesComputed: 250,
        accuracyScore: 0.82,
      },
      on: (event, handler) => {
        oracleCalls.push({ event, handler });
      },
      _calls: oracleCalls,
    };

    mockDiffusion = {
      metrics: {
        consequencesExplored: 500,
        scenariosGenerated: 125,
      },
      on: (event, handler) => {
        diffusionCalls.push({ event, handler });
      },
      _calls: diffusionCalls,
    };

    // Create orchestrator with mocked sub-systems
    orchestrator = new HDRIntegrationOrchestrator({
      genesis: mockGenesis,
      oracle: mockOracle,
      diffusion: mockDiffusion,
    });

    // Manually set the sub-systems
    orchestrator.genesis = mockGenesis;
    orchestrator.oracle = mockOracle;
    orchestrator.diffusion = mockDiffusion;
  });

  describe("Initialization", () => {
    test("should initialize with all components", () => {
      expect(orchestrator.genesis).toBeDefined();
      expect(orchestrator.oracle).toBeDefined();
      expect(orchestrator.diffusion).toBeDefined();
    });

    test("should initialize system metrics object", () => {
      expect(orchestrator.systemMetrics).toBeDefined();
      expect(typeof orchestrator.systemMetrics).toBe("object");
    });

    test("should initialize plugins array", () => {
      expect(Array.isArray(orchestrator.config.plugins)).toBe(true);
    });
  });

  describe("Metrics Collection", () => {
    test("should collect metrics from all components", () => {
      const metrics = orchestrator.collectMetrics();

      expect(metrics).toHaveProperty("genesis");
      expect(metrics).toHaveProperty("oracle");
      expect(metrics).toHaveProperty("diffusion");
      expect(metrics).toHaveProperty("integration");
    });

    test("should collect genesis metrics correctly", () => {
      const metrics = orchestrator.collectMetrics();

      expect(metrics.genesis.populationSize).toBe(50);
      expect(metrics.genesis.agentsBred).toBe(50);
      expect(metrics.genesis.averageFitness).toBe(0.75);
      expect(metrics.genesis.diversity).toBe(0.68);
    });

    test("should collect oracle metrics correctly", () => {
      const metrics = orchestrator.collectMetrics();

      expect(metrics.oracle.predictionsGenerated).toBe(100);
      expect(metrics.oracle.cascadesComputed).toBe(250);
      expect(metrics.oracle.accuracyScore).toBe(0.82);
    });

    test("should collect diffusion metrics correctly", () => {
      const metrics = orchestrator.collectMetrics();

      expect(metrics.diffusion.consequencesExplored).toBe(500);
      expect(metrics.diffusion.scenariosGenerated).toBe(125);
    });

    test("should handle missing genesis gracefully", () => {
      orchestrator.genesis = null;

      const metrics = orchestrator.collectMetrics();

      expect(metrics.genesis).toEqual({});
    });

    test("should handle missing oracle gracefully", () => {
      orchestrator.oracle = null;

      const metrics = orchestrator.collectMetrics();

      expect(metrics.oracle).toEqual({});
    });

    test("should handle missing diffusion gracefully", () => {
      orchestrator.diffusion = null;

      const metrics = orchestrator.collectMetrics();

      expect(metrics.diffusion).toEqual({});
    });

    test("should use default values when metrics are undefined", () => {
      orchestrator.genesis = { metrics: {} };

      const metrics = orchestrator.collectMetrics();

      expect(metrics.genesis.populationSize).toBe(0);
      expect(metrics.genesis.averageFitness).toBe(0);
    });

    test("should return consistent metrics structure", () => {
      const metrics = orchestrator.collectMetrics();

      // Check genesis metrics structure
      expect(metrics.genesis).toHaveProperty("agentsBred");
      expect(metrics.genesis).toHaveProperty("populationSize");
      expect(metrics.genesis).toHaveProperty("averageFitness");
      expect(metrics.genesis).toHaveProperty("diversity");

      // Check oracle metrics structure
      expect(metrics.oracle).toHaveProperty("predictionsGenerated");
      expect(metrics.oracle).toHaveProperty("cascadesComputed");
      expect(metrics.oracle).toHaveProperty("accuracyScore");

      // Check diffusion metrics structure
      expect(metrics.diffusion).toHaveProperty("consequencesExplored");
      expect(metrics.diffusion).toHaveProperty("scenariosGenerated");
    });
  });

  describe("Metrics Updates Over Time", () => {
    test("should reflect updated metrics when components change", () => {
      let metrics1 = orchestrator.collectMetrics();
      expect(metrics1.oracle.predictionsGenerated).toBe(100);

      // Simulate component metric update
      mockOracle.metrics.predictionsGenerated = 150;

      let metrics2 = orchestrator.collectMetrics();
      expect(metrics2.oracle.predictionsGenerated).toBe(150);
    });

    test("should handle metric increases", () => {
      const metrics1 = orchestrator.collectMetrics();
      const initial = metrics1.genesis.populationSize;

      mockGenesis.metrics.populationSize = initial + 20;

      const metrics2 = orchestrator.collectMetrics();
      expect(metrics2.genesis.populationSize).toBe(initial + 20);
    });

    test("should handle metric resets", () => {
      let metrics1 = orchestrator.collectMetrics();
      expect(metrics1.diffusion.consequencesExplored).toBe(500);

      mockDiffusion.metrics.consequencesExplored = 0;

      let metrics2 = orchestrator.collectMetrics();
      expect(metrics2.diffusion.consequencesExplored).toBe(0);
    });
  });

  describe("Plugin Registration", () => {
    test("should register a valid plugin", () => {
      const mockPlugin = {
        name: "test-plugin",
        onAgentBred: () => {},
      };

      const result = orchestrator.registerPlugin(mockPlugin);

      expect(result.success).toBe(true);
      expect(orchestrator.config.plugins).toContain(mockPlugin);
    });

    test("should throw error for plugin without name", () => {
      const invalidPlugin = {
        onAgentBred: () => {},
      };

      expect(() => {
        orchestrator.registerPlugin(invalidPlugin);
      }).toThrow("Plugin must have a name");
    });

    test("should throw error for null plugin", () => {
      expect(() => {
        orchestrator.registerPlugin(null);
      }).toThrow("Plugin must have a name");
    });

    test("should attach agent bred listener to valid plugin", () => {
      const mockPlugin = {
        name: "breed-listener",
        onAgentBred: () => {},
      };

      orchestrator.registerPlugin(mockPlugin);

      // Check that genesis.on was called with the agent:bred event
      const genesisBredCall = mockGenesis._calls.find(c => c.event === "agent:bred");
      expect(genesisBredCall).toBeDefined();
      expect(typeof genesisBredCall.handler).toBe("function");
    });

    test("should attach prediction made listener to valid plugin", () => {
      const mockPlugin = {
        name: "prediction-listener",
        onPredictionMade: () => {},
      };

      orchestrator.registerPlugin(mockPlugin);

      // Check that oracle.on was called with the prediction:made event
      const oraclePredictionCall = mockOracle._calls.find(c => c.event === "prediction:made");
      expect(oraclePredictionCall).toBeDefined();
      expect(typeof oraclePredictionCall.handler).toBe("function");
    });

    test("should attach consequence explored listener to valid plugin", () => {
      const mockPlugin = {
        name: "consequence-listener",
        onConsequenceExplored: () => {},
      };

      orchestrator.registerPlugin(mockPlugin);

      // Check that diffusion.on was called with the consequence:explored event
      const diffusionCall = mockDiffusion._calls.find(c => c.event === "consequence:explored");
      expect(diffusionCall).toBeDefined();
      expect(typeof diffusionCall.handler).toBe("function");
    });

    test("should handle plugin with multiple listeners", () => {
      const mockPlugin = {
        name: "multi-listener",
        onAgentBred: () => {},
        onPredictionMade: () => {},
        onConsequenceExplored: () => {},
      };

      orchestrator.registerPlugin(mockPlugin);

      // Check all three listeners were registered
      const genesisBredCall = mockGenesis._calls.find(c => c.event === "agent:bred");
      const oraclePredictionCall = mockOracle._calls.find(c => c.event === "prediction:made");
      const diffusionCall = mockDiffusion._calls.find(c => c.event === "consequence:explored");

      expect(genesisBredCall).toBeDefined();
      expect(oraclePredictionCall).toBeDefined();
      expect(diffusionCall).toBeDefined();
    });

    test("should emit plugin:registered event", (done) => {
      const mockPlugin = {
        name: "event-test-plugin",
      };

      let eventData = null;
      let eventCalled = false;
      const listener = (data) => { 
        eventData = data; 
        eventCalled = true;
      };
      orchestrator.on("plugin:registered", listener);

      orchestrator.registerPlugin(mockPlugin);

      setImmediate(() => {
        expect(eventCalled).toBe(true);
        expect(eventData).toBeDefined();
        expect(eventData.plugin).toBeDefined();
        expect(eventData.plugin.name).toBe("event-test-plugin");
        done();
      });
    });

    test("should register multiple plugins", () => {
      const plugin1 = { name: "plugin1" };
      const plugin2 = { name: "plugin2" };
      const plugin3 = { name: "plugin3" };

      orchestrator.registerPlugin(plugin1);
      orchestrator.registerPlugin(plugin2);
      orchestrator.registerPlugin(plugin3);

      expect(orchestrator.config.plugins).toContainEqual(plugin1);
      expect(orchestrator.config.plugins).toContainEqual(plugin2);
      expect(orchestrator.config.plugins).toContainEqual(plugin3);
    });
  });

  describe("Integration Metrics", () => {
    test("should include integration metrics in collection", () => {
      const metrics = orchestrator.collectMetrics();

      expect(metrics.integration).toBeDefined();
    });

    test("should aggregate metrics from all systems", () => {
      const metrics = orchestrator.collectMetrics();

      // Verify we have data from all systems
      const totalPredictions = metrics.oracle.predictionsGenerated;
      const totalConsequences = metrics.diffusion.consequencesExplored;
      const totalAgents = metrics.genesis.populationSize;

      expect(totalPredictions).toBeGreaterThanOrEqual(0);
      expect(totalConsequences).toBeGreaterThanOrEqual(0);
      expect(totalAgents).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Metrics Accuracy", () => {
    test("should maintain metric accuracy across multiple collections", () => {
      const metrics1 = orchestrator.collectMetrics();
      const metrics2 = orchestrator.collectMetrics();
      const metrics3 = orchestrator.collectMetrics();

      // Without changing component metrics, collections should be identical
      expect(metrics1.oracle.predictionsGenerated).toBe(
        metrics2.oracle.predictionsGenerated
      );
      expect(metrics2.oracle.predictionsGenerated).toBe(
        metrics3.oracle.predictionsGenerated
      );
    });

    test("should accurately reflect numeric metrics", () => {
      mockOracle.metrics.accuracyScore = 0.9234;
      const metrics = orchestrator.collectMetrics();

      expect(metrics.oracle.accuracyScore).toBe(0.9234);
    });
  });

  describe("Error Handling in Plugin Registration", () => {
    test("should handle plugin with undefined callbacks gracefully", () => {
      const minimalPlugin = {
        name: "minimal",
      };

      expect(() => {
        orchestrator.registerPlugin(minimalPlugin);
      }).not.toThrow();
    });

    test("should not fail when registering plugin without genesis", () => {
      orchestrator.genesis = null;
      const mockPlugin = {
        name: "no-genesis-plugin",
        onAgentBred: () => {},
      };

      expect(() => {
        orchestrator.registerPlugin(mockPlugin);
      }).not.toThrow();
    });
  });

  describe("System State Consistency", () => {
    test("should maintain consistent state after metrics collection", () => {
      const metrics1 = orchestrator.collectMetrics();
      orchestrator.collectMetrics();
      orchestrator.collectMetrics();
      const metrics2 = orchestrator.collectMetrics();

      // State should be consistent without external changes
      expect(metrics1.genesis.populationSize).toBe(
        metrics2.genesis.populationSize
      );
    });

    test("should handle rapid successive metric collections", () => {
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(orchestrator.collectMetrics());
      }

      // All collections should have the same structure
      results.forEach((metrics) => {
        expect(metrics).toHaveProperty("genesis");
        expect(metrics).toHaveProperty("oracle");
        expect(metrics).toHaveProperty("diffusion");
        expect(metrics).toHaveProperty("integration");
      });
    });
  });
});
