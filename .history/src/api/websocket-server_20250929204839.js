/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * WebSocket Server implementation for real-time data streaming
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class WebSocketServer {
  constructor(options = {}) {
    this.options = {
      port: process.env.WS_PORT || 3001,
      heartbeatInterval: 30000,
      maxConnections: 100,
      authentication: true,
      ...options
    };

    this.server = null;
    this.controller = null;
    this.clients = new Map();
    this.subscriptions = new Map();
    this.eventHandlers = new Map();
  }

  /**
   * Initialize WebSocket server with SwarmController
   * @param {SwarmController} controller - Neural-HDR SwarmController instance
   */
  initialize(controller) {
    this.controller = controller;
    this._registerEventHandlers();
  }

  /**
   * Start the WebSocket server
   * @returns {Promise<void>}
   */
  async start() {
    if (!this.controller) {
      throw new Error('WebSocket Server must be initialized with a SwarmController');
    }

    return new Promise((resolve) => {
      this.server = new WebSocket.Server({
        port: this.options.port
      });

      this.server.on('connection', this._handleConnection.bind(this));
      this.server.on('error', this._handleError.bind(this));

      console.log(`Neural-HDR WebSocket Server listening on port ${this.options.port}`);
      resolve();
    });
  }

  /**
   * Stop the WebSocket server
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.server) {
      return;
    }

    // Clear all intervals
    for (const [clientId, client] of this.clients) {
      if (client.heartbeat) {
        clearInterval(client.heartbeat);
      }
    }

    // Close all connections
    for (const [clientId, client] of this.clients) {
      client.socket.close();
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('Neural-HDR WebSocket Server stopped');
        this.clients.clear();
        this.subscriptions.clear();
        resolve();
      });
    });
  }

  /**
   * Broadcast message to all connected clients
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  broadcast(event, data) {
    const message = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString()
    });

    for (const [clientId, client] of this.clients) {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(message);
      }
    }
  }

  /**
   * Register custom event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  registerEventHandler(event, handler) {
    this.eventHandlers.set(event, handler);
  }

  /**
   * Handle new WebSocket connection
   * @private
   */
  _handleConnection(socket, request) {
    const clientId = uuidv4();

    // Add client to clients map
    this.clients.set(clientId, {
      socket,
      subscriptions: new Set(),
      heartbeat: null
    });

    // Set up heartbeat
    const heartbeat = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    }, this.options.heartbeatInterval);

    this.clients.get(clientId).heartbeat = heartbeat;

    // Handle client messages
    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this._handleClientMessage(clientId, message);
      } catch (error) {
        this._sendError(clientId, 'Invalid message format');
      }
    });

    // Handle client disconnection
    socket.on('close', () => {
      this._handleDisconnection(clientId);
    });

    // Send welcome message
    this._sendToClient(clientId, 'welcome', {
      clientId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle client disconnection
   * @private
   */
  _handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    
    if (client) {
      // Clear heartbeat interval
      if (client.heartbeat) {
        clearInterval(client.heartbeat);
      }

      // Remove client subscriptions
      client.subscriptions.forEach(topic => {
        const subscribers = this.subscriptions.get(topic);
        if (subscribers) {
          subscribers.delete(clientId);
          if (subscribers.size === 0) {
            this.subscriptions.delete(topic);
          }
        }
      });

      // Remove client
      this.clients.delete(clientId);
    }
  }

  /**
   * Handle client message
   * @private
   */
  _handleClientMessage(clientId, message) {
    if (!message.type || !message.data) {
      return this._sendError(clientId, 'Invalid message format');
    }

    switch (message.type) {
      case 'subscribe':
        this._handleSubscribe(clientId, message.data);
        break;
      case 'unsubscribe':
        this._handleUnsubscribe(clientId, message.data);
        break;
      case 'command':
        this._handleCommand(clientId, message.data);
        break;
      default:
        // Check for custom event handlers
        const handler = this.eventHandlers.get(message.type);
        if (handler) {
          try {
            handler(clientId, message.data);
          } catch (error) {
            this._sendError(clientId, `Error handling event: ${error.message}`);
          }
        } else {
          this._sendError(clientId, 'Unknown message type');
        }
    }
  }

  /**
   * Handle subscription request
   * @private
   */
  _handleSubscribe(clientId, data) {
    if (!data.topics || !Array.isArray(data.topics)) {
      return this._sendError(clientId, 'Invalid subscription request');
    }

    const client = this.clients.get(clientId);
    if (!client) return;

    data.topics.forEach(topic => {
      // Add topic to client's subscriptions
      client.subscriptions.add(topic);

      // Add client to topic's subscribers
      if (!this.subscriptions.has(topic)) {
        this.subscriptions.set(topic, new Set());
      }
      this.subscriptions.get(topic).add(clientId);
    });

    this._sendToClient(clientId, 'subscribed', {
      topics: data.topics
    });
  }

  /**
   * Handle unsubscribe request
   * @private
   */
  _handleUnsubscribe(clientId, data) {
    if (!data.topics || !Array.isArray(data.topics)) {
      return this._sendError(clientId, 'Invalid unsubscribe request');
    }

    const client = this.clients.get(clientId);
    if (!client) return;

    data.topics.forEach(topic => {
      // Remove topic from client's subscriptions
      client.subscriptions.delete(topic);

      // Remove client from topic's subscribers
      const subscribers = this.subscriptions.get(topic);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          this.subscriptions.delete(topic);
        }
      }
    });

    this._sendToClient(clientId, 'unsubscribed', {
      topics: data.topics
    });
  }

  /**
   * Handle command request
   * @private
   */
  _handleCommand(clientId, data) {
    if (!data.command) {
      return this._sendError(clientId, 'Invalid command request');
    }

    try {
      switch (data.command) {
        case 'getSystemStatus':
          this._sendSystemStatus(clientId);
          break;
        case 'getMetrics':
          this._sendMetrics(clientId);
          break;
        case 'getSwarmState':
          this._sendSwarmState(clientId);
          break;
        case 'getThermalState':
          this._sendThermalState(clientId);
          break;
        case 'getConsciousnessState':
          this._sendConsciousnessState(clientId);
          break;
        default:
          this._sendError(clientId, 'Unknown command');
      }
    } catch (error) {
      this._sendError(clientId, `Command execution failed: ${error.message}`);
    }
  }

  /**
   * Send message to specific client
   * @private
   */
  _sendToClient(clientId, event, data) {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) return;

    const message = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString()
    });

    client.socket.send(message);
  }

  /**
   * Send error message to client
   * @private
   */
  _sendError(clientId, error) {
    this._sendToClient(clientId, 'error', {
      message: error
    });
  }

  /**
   * Send system status to client
   * @private
   */
  _sendSystemStatus(clientId) {
    const status = {
      status: 'operational',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: this.clients.size
    };

    this._sendToClient(clientId, 'systemStatus', status);
  }

  /**
   * Send metrics to client
   * @private
   */
  _sendMetrics(clientId) {
    const metrics = {
      swarm: {
        totalBots: this.controller.swarmManager.bots.length,
        activeBots: this.controller.swarmManager.getActiveBots().length,
        completedTasks: this.controller.swarmManager.completedTasks.length
      },
      quantum: {
        securityLevel: this.controller.quantumManager.getSecurityLevel(),
        entropyPool: this.controller.quantumManager.getEntropyPoolSize()
      },
      thermal: {
        temperature: this.controller.thermalManager.getCurrentTemperature(),
        load: this.controller.thermalManager.getCurrentLoad()
      },
      consciousness: {
        layers: this.controller.consciousnessManager.getLayers(),
        emergence: this.controller.consciousnessManager.getEmergenceLevel()
      }
    };

    this._sendToClient(clientId, 'metrics', metrics);
  }

  /**
   * Send swarm state to client
   * @private
   */
  _sendSwarmState(clientId) {
    const state = {
      bots: this.controller.swarmManager.bots.map(bot => ({
        id: bot.id,
        status: bot.status,
        generation: bot.generation,
        tasks: bot.tasks.length
      })),
      tasks: this.controller.swarmManager.getAllTasks()
    };

    this._sendToClient(clientId, 'swarmState', state);
  }

  /**
   * Send thermal state to client
   * @private
   */
  _sendThermalState(clientId) {
    const state = {
      temperature: this.controller.thermalManager.getCurrentTemperature(),
      load: this.controller.thermalManager.getCurrentLoad(),
      throttling: this.controller.thermalManager.getThrottlingLevel(),
      warning: this.controller.thermalManager.hasTemperatureWarning(),
      history: this.controller.thermalManager.getTemperatureHistory()
    };

    this._sendToClient(clientId, 'thermalState', state);
  }

  /**
   * Send consciousness state to client
   * @private
   */
  _sendConsciousnessState(clientId) {
    const state = {
      layers: this.controller.consciousnessManager.getLayers(),
      emergence: this.controller.consciousnessManager.getEmergenceLevel(),
      connections: this.controller.consciousnessManager.getLayerConnections()
    };

    this._sendToClient(clientId, 'consciousnessState', state);
  }

  /**
   * Handle server errors
   * @private
   */
  _handleError(error) {
    console.error('WebSocket Server Error:', error);
    this.broadcast('serverError', {
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = WebSocketServer;