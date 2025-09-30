/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * API Server implementation for Neural-HDR system integration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

class ApiServer {
  constructor(options = {}) {
    this.options = {
      port: process.env.PORT || 3000,
      corsOptions: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
      },
      rateLimits: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      },
      authentication: true,
      ...options
    };

    this.app = express();
    this.server = null;
    this.controller = null;
    this.middlewares = new Set();
    this.routes = new Map();
  }

  /**
   * Initialize API server with SwarmController
   * @param {SwarmController} controller - Neural-HDR SwarmController instance
   */
  initialize(controller) {
    this.controller = controller;
    
    // Basic security middlewares
    this._registerDefaultMiddleware();
    
    // API endpoints
    this._registerApiEndpoints();
    
    // Custom middlewares
    for (const middleware of this.middlewares) {
      this.app.use(middleware);
    }
  }

  /**
   * Start the API server
   * @returns {Promise<void>}
   */
  async start() {
    if (!this.controller) {
      throw new Error('API Server must be initialized with a SwarmController');
    }

    return new Promise((resolve) => {
      this.server = this.app.listen(this.options.port, () => {
        console.log(`Neural-HDR API Server listening on port ${this.options.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the API server
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.server) {
      return;
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('Neural-HDR API Server stopped');
        resolve();
      });
    });
  }

  /**
   * Register custom middleware
   * @param {Function} middleware - Express middleware function
   */
  registerMiddleware(middleware) {
    this.middlewares.add(middleware);
  }

  /**
   * Register custom route
   * @param {string} method - HTTP method
   * @param {string} path - Route path
   * @param {Function} handler - Route handler
   */
  registerRoute(method, path, handler) {
    this.routes.set(`${method.toUpperCase()}:${path}`, handler);
  }

  /**
   * Set up default middleware
   * @private
   */
  _registerDefaultMiddleware() {
    // Security headers
    this.app.use(helmet());

    // CORS
    this.app.use(cors(this.options.corsOptions));

    // JSON body parser
    this.app.use(express.json());

    // Request logging
    this.app.use((req, res, next) => {
      const requestId = uuidv4();
      console.log(`[${requestId}] ${req.method} ${req.path}`);
      next();
    });

    // Rate limiting
    const limiter = rateLimit(this.options.rateLimits);
    this.app.use(limiter);

    // Authentication middleware
    if (this.options.authentication) {
      this.app.use(this._verifyAuthentication.bind(this));
    }

    // Error handling
    this.app.use((err, req, res, next) => {
      console.error('API Error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
      });
    });
  }

  /**
   * Register API endpoints
   * @private
   */
  _registerApiEndpoints() {
    // System endpoints
    this._registerSystemEndpoints();

    // Swarm endpoints
    this._registerSwarmEndpoints();

    // Quantum endpoints
    this._registerQuantumEndpoints();

    // Thermal endpoints
    this._registerThermalEndpoints();

    // Consciousness endpoints
    this._registerConsciousnessEndpoints();

    // Custom routes
    for (const [route, handler] of this.routes) {
      const [method, path] = route.split(':');
      this.app[method.toLowerCase()](path, handler);
    }
  }

  /**
   * Register system-level endpoints
   * @private
   */
  _registerSystemEndpoints() {
    // System status
    this.app.get('/api/v1/system/status', (req, res) => {
      res.json({
        status: 'operational',
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    });

    // System metrics
    this.app.get('/api/v1/system/metrics', (req, res) => {
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

      res.json(metrics);
    });

    // System configuration
    this.app.get('/api/v1/system/config', (req, res) => {
      res.json(this.controller.getConfiguration());
    });

    // Update configuration
    this.app.put('/api/v1/system/config', (req, res) => {
      try {
        this.controller.updateConfiguration(req.body);
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  /**
   * Register swarm-related endpoints
   * @private
   */
  _registerSwarmEndpoints() {
    // Get all nanobots
    this.app.get('/api/v1/swarm/bots', (req, res) => {
      const bots = this.controller.swarmManager.bots.map(bot => ({
        id: bot.id,
        status: bot.status,
        generation: bot.generation,
        tasks: bot.tasks.length
      }));
      res.json(bots);
    });

    // Get specific nanobot
    this.app.get('/api/v1/swarm/bots/:id', (req, res) => {
      const bot = this.controller.swarmManager.getBotById(req.params.id);
      if (!bot) {
        return res.status(404).json({ error: 'Bot not found' });
      }
      res.json(bot);
    });

    // Create new nanobot
    this.app.post('/api/v1/swarm/bots', (req, res) => {
      try {
        const bot = this.controller.swarmManager.createBot(req.body);
        res.status(201).json(bot);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Delete nanobot
    this.app.delete('/api/v1/swarm/bots/:id', (req, res) => {
      try {
        this.controller.swarmManager.removeBot(req.params.id);
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Get all tasks
    this.app.get('/api/v1/swarm/tasks', (req, res) => {
      const tasks = this.controller.swarmManager.getAllTasks();
      res.json(tasks);
    });

    // Add new task
    this.app.post('/api/v1/swarm/tasks', (req, res) => {
      try {
        const task = this.controller.swarmManager.addTask(req.body);
        res.status(201).json(task);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  /**
   * Register quantum-related endpoints
   * @private
   */
  _registerQuantumEndpoints() {
    // Get quantum security status
    this.app.get('/api/v1/quantum/status', (req, res) => {
      const status = {
        securityLevel: this.controller.quantumManager.getSecurityLevel(),
        entropyPool: this.controller.quantumManager.getEntropyPoolSize(),
        activeKeys: this.controller.quantumManager.getActiveKeyCount()
      };
      res.json(status);
    });

    // Generate quantum key
    this.app.post('/api/v1/quantum/keys', (req, res) => {
      try {
        const key = this.controller.quantumManager.generateKey(req.body);
        res.status(201).json({ id: key.id });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Verify quantum key
    this.app.post('/api/v1/quantum/keys/verify', (req, res) => {
      try {
        const isValid = this.controller.quantumManager.verifyKey(req.body.keyId);
        res.json({ valid: isValid });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  /**
   * Register thermal-related endpoints
   * @private
   */
  _registerThermalEndpoints() {
    // Get thermal status
    this.app.get('/api/v1/thermal/status', (req, res) => {
      const status = {
        temperature: this.controller.thermalManager.getCurrentTemperature(),
        load: this.controller.thermalManager.getCurrentLoad(),
        throttling: this.controller.thermalManager.getThrottlingLevel(),
        warning: this.controller.thermalManager.hasTemperatureWarning()
      };
      res.json(status);
    });

    // Get thermal history
    this.app.get('/api/v1/thermal/history', (req, res) => {
      const history = this.controller.thermalManager.getTemperatureHistory();
      res.json(history);
    });

    // Update thermal settings
    this.app.put('/api/v1/thermal/settings', (req, res) => {
      try {
        this.controller.thermalManager.updateSettings(req.body);
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
  }

  /**
   * Register consciousness-related endpoints
   * @private
   */
  _registerConsciousnessEndpoints() {
    // Get consciousness layers
    this.app.get('/api/v1/consciousness/layers', (req, res) => {
      const layers = this.controller.consciousnessManager.getLayers();
      res.json(layers);
    });

    // Get specific layer
    this.app.get('/api/v1/consciousness/layers/:id', (req, res) => {
      try {
        const layer = this.controller.consciousnessManager.getLayer(req.params.id);
        res.json(layer);
      } catch (error) {
        res.status(404).json({ error: 'Layer not found' });
      }
    });

    // Create new layer
    this.app.post('/api/v1/consciousness/layers', (req, res) => {
      try {
        const layer = this.controller.consciousnessManager.createLayer(req.body);
        res.status(201).json(layer);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Update layer
    this.app.put('/api/v1/consciousness/layers/:id', (req, res) => {
      try {
        const layer = this.controller.consciousnessManager.updateLayer(
          req.params.id,
          req.body
        );
        res.json(layer);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Delete layer
    this.app.delete('/api/v1/consciousness/layers/:id', (req, res) => {
      try {
        this.controller.consciousnessManager.deleteLayer(req.params.id);
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Get emergence data
    this.app.get('/api/v1/consciousness/emergence', (req, res) => {
      const emergence = this.controller.consciousnessManager.getEmergenceData();
      res.json(emergence);
    });
  }

  /**
   * Verify authentication token
   * @private
   */
  _verifyAuthentication(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    try {
      const token = authHeader.split(' ')[1];
      const isValid = this.controller.securityManager.verifyToken(token);
      
      if (!isValid) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      
      next();
    } catch (error) {
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
}

module.exports = ApiServer;