/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Integration Manager for external system connectivity
 */

const EventEmitter = require("events");
const { v4: uuidv4 } = require("uuid");

class IntegrationManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      maxConnections: 50,
      timeoutMs: 30000,
      retryAttempts: 3,
      retryDelayMs: 1000,
      ...options,
    };

    this.controller = null;
    this.connections = new Map();
    this.adapters = new Map();
    this.pipelines = new Map();
    this.transformers = new Map();
  }

  /**
   * Initialize Integration Manager with SwarmController
   * @param {SwarmController} controller - Neural-HDR SwarmController instance
   */
  initialize(controller) {
    this.controller = controller;
    this._registerDefaultAdapters();
    this._registerDefaultTransformers();
  }

  /**
   * Register external system adapter
   * @param {string} systemType - External system type
   * @param {Object} adapter - System adapter implementation
   */
  registerAdapter(systemType, adapter) {
    if (
      typeof adapter.connect !== "function" ||
      typeof adapter.disconnect !== "function" ||
      typeof adapter.send !== "function"
    ) {
      throw new Error("Invalid adapter implementation");
    }

    this.adapters.set(systemType, adapter);
  }

  /**
   * Register data transformer
   * @param {string} transformType - Transformer type
   * @param {Function} transformer - Transformer function
   */
  registerTransformer(transformType, transformer) {
    if (typeof transformer !== "function") {
      throw new Error("Transformer must be a function");
    }

    this.transformers.set(transformType, transformer);
  }

  /**
   * Create integration pipeline
   * @param {Object} config - Pipeline configuration
   * @returns {string} Pipeline ID
   */
  createPipeline(config) {
    const pipelineId = uuidv4();

    if (!config.source || !config.target || !config.transformations) {
      throw new Error("Invalid pipeline configuration");
    }

    this.pipelines.set(pipelineId, {
      id: pipelineId,
      config,
      status: "created",
      error: null,
      stats: {
        processed: 0,
        failed: 0,
        lastRun: null,
      },
    });

    return pipelineId;
  }

  /**
   * Start integration pipeline
   * @param {string} pipelineId - Pipeline ID
   */
  async startPipeline(pipelineId) {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    try {
      pipeline.status = "starting";

      // Connect to source system
      const sourceConnection = await this._connectToSystem(
        pipeline.config.source.system,
        pipeline.config.source.config
      );

      // Connect to target system
      const targetConnection = await this._connectToSystem(
        pipeline.config.target.system,
        pipeline.config.target.config
      );

      // Set up data flow
      sourceConnection.on("data", async (data) => {
        try {
          // Apply transformations
          const transformedData = await this._applyTransformations(
            data,
            pipeline.config.transformations
          );

          // Send to target
          await targetConnection.send(transformedData);

          // Update stats
          pipeline.stats.processed++;
          pipeline.stats.lastRun = new Date();

          this.emit("pipelineProgress", {
            pipelineId,
            status: pipeline.status,
            stats: pipeline.stats,
          });
        } catch (error) {
          pipeline.stats.failed++;
          this.emit("pipelineError", {
            pipelineId,
            error: error.message,
          });
        }
      });

      pipeline.status = "running";
      this.emit("pipelineStarted", { pipelineId });
    } catch (error) {
      pipeline.status = "error";
      pipeline.error = error.message;
      this.emit("pipelineError", {
        pipelineId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Stop integration pipeline
   * @param {string} pipelineId - Pipeline ID
   */
  async stopPipeline(pipelineId) {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    try {
      pipeline.status = "stopping";

      // Disconnect from systems
      await this._disconnectFromSystem(pipeline.config.source.system);
      await this._disconnectFromSystem(pipeline.config.target.system);

      pipeline.status = "stopped";
      this.emit("pipelineStopped", { pipelineId });
    } catch (error) {
      pipeline.status = "error";
      pipeline.error = error.message;
      this.emit("pipelineError", {
        pipelineId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get pipeline status
   * @param {string} pipelineId - Pipeline ID
   * @returns {Object} Pipeline status
   */
  getPipelineStatus(pipelineId) {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    return {
      id: pipeline.id,
      status: pipeline.status,
      error: pipeline.error,
      stats: pipeline.stats,
    };
  }

  /**
   * Connect to external system
   * @private
   */
  async _connectToSystem(systemType, config) {
    const adapter = this.adapters.get(systemType);
    if (!adapter) {
      throw new Error(`No adapter found for system type: ${systemType}`);
    }

    const connectionId = uuidv4();
    const connection = await adapter.connect(config);

    this.connections.set(connectionId, {
      id: connectionId,
      type: systemType,
      connection,
      status: "connected",
      error: null,
    });

    return connection;
  }

  /**
   * Disconnect from external system
   * @private
   */
  async _disconnectFromSystem(systemType) {
    const connections = Array.from(this.connections.entries()).filter(
      ([_, conn]) => conn.type === systemType
    );

    for (const [id, conn] of connections) {
      try {
        await this.adapters.get(systemType).disconnect(conn.connection);
        this.connections.delete(id);
      } catch (error) {
        console.error(`Error disconnecting from ${systemType}:`, error);
      }
    }
  }

  /**
   * Apply data transformations
   * @private
   */
  async _applyTransformations(data, transformations) {
    let transformedData = data;

    for (const transform of transformations) {
      const transformer = this.transformers.get(transform.type);
      if (!transformer) {
        throw new Error(`Transformer not found: ${transform.type}`);
      }

      transformedData = await transformer(transformedData, transform.config);
    }

    return transformedData;
  }

  /**
   * Register default system adapters
   * @private
   */
  _registerDefaultAdapters() {
    // Register REST API adapter
    this.registerAdapter("rest", {
      connect: async (config) => {
        // Implementation for REST API connection
        return new RestAdapter(config);
      },
      disconnect: async (connection) => {
        await connection.close();
      },
      send: async (connection, data) => {
        await connection.send(data);
      },
    });

    // Register WebSocket adapter
    this.registerAdapter("websocket", {
      connect: async (config) => {
        // Implementation for WebSocket connection
        return new WebSocketAdapter(config);
      },
      disconnect: async (connection) => {
        await connection.close();
      },
      send: async (connection, data) => {
        await connection.send(data);
      },
    });

    // Register Message Queue adapter
    this.registerAdapter("messagequeue", {
      connect: async (config) => {
        // Implementation for Message Queue connection
        return new MessageQueueAdapter(config);
      },
      disconnect: async (connection) => {
        await connection.close();
      },
      send: async (connection, data) => {
        await connection.send(data);
      },
    });
  }

  /**
   * Register default data transformers
   * @private
   */
  _registerDefaultTransformers() {
    // JSON transformer
    this.registerTransformer("json", (data, config) => {
      return JSON.stringify(data);
    });

    // XML transformer
    this.registerTransformer("xml", (data, config) => {
      // Implementation for XML transformation
      return convertToXml(data);
    });

    // Data mapping transformer
    this.registerTransformer("map", (data, config) => {
      const result = {};
      for (const [target, source] of Object.entries(config.mapping)) {
        result[target] = data[source];
      }
      return result;
    });

    // Filter transformer
    this.registerTransformer("filter", (data, config) => {
      if (typeof config.condition === "function") {
        return config.condition(data) ? data : null;
      }
      return data;
    });

    // Aggregate transformer
    this.registerTransformer("aggregate", (data, config) => {
      // Implementation for data aggregation
      return aggregateData(data, config);
    });
  }
}

// Adapter class implementations (would be in separate files in production)
class RestAdapter {
  constructor(config) {
    this.config = config;
    this.events = new EventEmitter();
  }

  async send(data) {
    // Implementation
  }

  async close() {
    // Implementation
  }

  on(event, handler) {
    this.events.on(event, handler);
  }
}

class WebSocketAdapter {
  constructor(config) {
    this.config = config;
    this.events = new EventEmitter();
  }

  async send(data) {
    // Implementation
  }

  async close() {
    // Implementation
  }

  on(event, handler) {
    this.events.on(event, handler);
  }
}

class MessageQueueAdapter {
  constructor(config) {
    this.config = config;
    this.events = new EventEmitter();
  }

  async send(data) {
    // Implementation
  }

  async close() {
    // Implementation
  }

  on(event, handler) {
    this.events.on(event, handler);
  }
}

// Helper functions (would be in separate utility files in production)
function convertToXml(data) {
  // Implementation
  return "";
}

function aggregateData(data, config) {
  // Implementation
  return {};
}

module.exports = IntegrationManager;
