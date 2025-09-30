/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Integration Manager Tests
 */

const IntegrationManager = require("../src/api/integration");

describe("IntegrationManager", () => {
  let integrationManager;
  let mockController;

  beforeEach(() => {
    mockController = {
      // Mock SwarmController methods
    };
    integrationManager = new IntegrationManager();
  });

  describe("Initialization", () => {
    test("should initialize with default options", () => {
      expect(integrationManager.options.maxConnections).toBe(50);
      expect(integrationManager.options.timeoutMs).toBe(30000);
      expect(integrationManager.options.retryAttempts).toBe(3);
      expect(integrationManager.options.retryDelayMs).toBe(1000);
    });

    test("should initialize with custom options", () => {
      const customOptions = {
        maxConnections: 100,
        timeoutMs: 60000,
        retryAttempts: 5,
        retryDelayMs: 2000,
      };
      integrationManager = new IntegrationManager(customOptions);
      expect(integrationManager.options).toEqual(
        expect.objectContaining(customOptions)
      );
    });

    test("should initialize with SwarmController", () => {
      integrationManager.initialize(mockController);
      expect(integrationManager.controller).toBe(mockController);
    });
  });

  describe("Adapter Management", () => {
    test("should register valid adapter", () => {
      const mockAdapter = {
        connect: jest.fn(),
        disconnect: jest.fn(),
        send: jest.fn(),
      };

      integrationManager.registerAdapter("test", mockAdapter);
      expect(integrationManager.adapters.get("test")).toBe(mockAdapter);
    });

    test("should reject invalid adapter", () => {
      const invalidAdapter = {
        connect: jest.fn(),
        // Missing disconnect and send
      };

      expect(() => {
        integrationManager.registerAdapter("test", invalidAdapter);
      }).toThrow("Invalid adapter implementation");
    });
  });

  describe("Transformer Management", () => {
    test("should register valid transformer", () => {
      const mockTransformer = jest.fn();
      integrationManager.registerTransformer("test", mockTransformer);
      expect(integrationManager.transformers.get("test")).toBe(mockTransformer);
    });

    test("should reject invalid transformer", () => {
      const invalidTransformer = {};
      expect(() => {
        integrationManager.registerTransformer("test", invalidTransformer);
      }).toThrow("Transformer must be a function");
    });
  });

  describe("Pipeline Management", () => {
    const validConfig = {
      source: {
        system: "rest",
        config: {},
      },
      target: {
        system: "websocket",
        config: {},
      },
      transformations: [{ type: "json", config: {} }],
    };

    test("should create pipeline with valid configuration", () => {
      const pipelineId = integrationManager.createPipeline(validConfig);
      expect(typeof pipelineId).toBe("string");

      const pipeline = integrationManager.pipelines.get(pipelineId);
      expect(pipeline).toBeDefined();
      expect(pipeline.status).toBe("created");
      expect(pipeline.config).toEqual(validConfig);
    });

    test("should reject invalid pipeline configuration", () => {
      const invalidConfig = {
        source: { system: "rest" },
        // Missing target and transformations
      };

      expect(() => {
        integrationManager.createPipeline(invalidConfig);
      }).toThrow("Invalid pipeline configuration");
    });

    test("should start pipeline", async () => {
      const pipelineId = integrationManager.createPipeline(validConfig);

      const mockSourceConnection = {
        on: jest.fn(),
        send: jest.fn(),
      };

      const mockTargetConnection = {
        send: jest.fn(),
      };

      // Mock system connections
      jest
        .spyOn(integrationManager, "_connectToSystem")
        .mockImplementation((type) => {
          return type === "rest" ? mockSourceConnection : mockTargetConnection;
        });

      await integrationManager.startPipeline(pipelineId);

      const pipeline = integrationManager.pipelines.get(pipelineId);
      expect(pipeline.status).toBe("running");
    });

    test("should stop pipeline", async () => {
      const pipelineId = integrationManager.createPipeline(validConfig);

      // Mock disconnect method
      jest
        .spyOn(integrationManager, "_disconnectFromSystem")
        .mockResolvedValue();

      await integrationManager.stopPipeline(pipelineId);

      const pipeline = integrationManager.pipelines.get(pipelineId);
      expect(pipeline.status).toBe("stopped");
    });

    test("should get pipeline status", () => {
      const pipelineId = integrationManager.createPipeline(validConfig);
      const status = integrationManager.getPipelineStatus(pipelineId);

      expect(status).toEqual({
        id: pipelineId,
        status: "created",
        error: null,
        stats: {
          processed: 0,
          failed: 0,
          lastRun: null,
        },
      });
    });
  });

  describe("Data Transformation", () => {
    test("should apply transformations in sequence", async () => {
      const mockData = { test: "data" };
      const transformations = [
        { type: "json", config: {} },
        { type: "map", config: { mapping: { new: "test" } } },
      ];

      // Register test transformers
      integrationManager.registerTransformer("json", (data) =>
        JSON.stringify(data)
      );
      integrationManager.registerTransformer("map", (data, config) => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        const result = {};
        for (const [target, source] of Object.entries(config.mapping)) {
          result[target] = parsed[source];
        }
        return result;
      });

      const result = await integrationManager._applyTransformations(
        mockData,
        transformations
      );
      expect(result).toEqual({ new: "data" });
    });

    test("should handle transformation errors", async () => {
      const mockData = { test: "data" };
      const transformations = [{ type: "nonexistent", config: {} }];

      await expect(
        integrationManager._applyTransformations(mockData, transformations)
      ).rejects.toThrow("Transformer not found: nonexistent");
    });
  });

  describe("Event Emission", () => {
    test("should emit pipeline events", async () => {
      const pipelineStartedHandler = jest.fn();
      integrationManager.on("pipelineStarted", pipelineStartedHandler);

      const validConfig = {
        source: { system: "rest", config: {} },
        target: { system: "websocket", config: {} },
        transformations: [],
      };

      const pipelineId = integrationManager.createPipeline(validConfig);

      // Mock system connections
      jest.spyOn(integrationManager, "_connectToSystem").mockResolvedValue({
        on: jest.fn(),
        send: jest.fn(),
      });

      await integrationManager.startPipeline(pipelineId);

      expect(pipelineStartedHandler).toHaveBeenCalledWith({ pipelineId });
    });
  });
});
