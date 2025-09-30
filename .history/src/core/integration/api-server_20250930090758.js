/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * API Server - RESTful API interface for Neural-HDR system
 */

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const eventBus = require("./event-bus");

class ApiServer {
  constructor(options = {}) {
    this.options = {
      port: process.env.API_PORT || 3000,
      rateLimitWindow: 15 * 60 * 1000, // 15 minutes
      rateLimitMax: 100, // requests per window
      jwtSecret: process.env.JWT_SECRET || "nhdr-development-secret",
      corsOrigins: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",")
        : ["http://localhost:3000"],
      ...options,
    };

    this.app = express();
    this._setupMiddleware();
    this._setupRoutes();
    this._setupErrorHandling();

    // Event tracking
    this._activeConnections = new Set();
    this._requestMetrics = {
      total: 0,
      success: 0,
      failed: 0,
      avgResponseTime: 0,
    };
  }

  /**
   * Start the API server
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.options.port, () => {
          console.log(`API Server listening on port ${this.options.port}`);
          this._startMetricsReporting();
          resolve();
        });

        // Track connections
        this.server.on("connection", (socket) => {
          this._activeConnections.add(socket);
          socket.on("close", () => {
            this._activeConnections.delete(socket);
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the API server
   */
  async stop() {
    return new Promise((resolve, reject) => {
      try {
        // Close all active connections
        this._activeConnections.forEach((socket) => socket.destroy());
        this._activeConnections.clear();

        // Stop the server
        if (this.server) {
          this.server.close(() => {
            console.log("API Server stopped");
            resolve();
          });
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get server metrics
   */
  getMetrics() {
    return {
      activeConnections: this._activeConnections.size,
      requests: { ...this._requestMetrics },
    };
  }

  /**
   * Set up middleware
   * @private
   */
  _setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: this.options.corsOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.options.rateLimitWindow,
      max: this.options.rateLimitMax,
    });
    this.app.use(limiter);

    // Request parsing
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    // Request tracking
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      this._requestMetrics.total++;

      res.on("finish", () => {
        const duration = Date.now() - req.startTime;

        // Update metrics
        if (res.statusCode < 400) {
          this._requestMetrics.success++;
        } else {
          this._requestMetrics.failed++;
        }

        // Update average response time
        const totalRequests =
          this._requestMetrics.success + this._requestMetrics.failed;
        this._requestMetrics.avgResponseTime =
          (this._requestMetrics.avgResponseTime * (totalRequests - 1) +
            duration) /
          totalRequests;

        // Emit metrics event
        eventBus.publish("api.metrics", {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration,
        });
      });

      next();
    });
  }

  /**
   * Set up API routes
   * @private
   */
  _setupRoutes() {
    // Authentication routes
    this.app.post("/api/auth/login", this._handleLogin.bind(this));
    this.app.post("/api/auth/refresh", this._handleTokenRefresh.bind(this));

    // System routes
    this.app.get(
      "/api/system/status",
      this._authenticateToken.bind(this),
      this._handleSystemStatus.bind(this)
    );
    this.app.get(
      "/api/system/metrics",
      this._authenticateToken.bind(this),
      this._handleSystemMetrics.bind(this)
    );

    // Consciousness routes
    this.app.get(
      "/api/consciousness/layers",
      this._authenticateToken.bind(this),
      this._handleGetLayers.bind(this)
    );
    this.app.post(
      "/api/consciousness/preserve",
      this._authenticateToken.bind(this),
      this._handlePreserve.bind(this)
    );
    this.app.post(
      "/api/consciousness/transfer",
      this._authenticateToken.bind(this),
      this._handleTransfer.bind(this)
    );

    // Swarm routes
    this.app.get(
      "/api/swarm/nodes",
      this._authenticateToken.bind(this),
      this._handleGetNodes.bind(this)
    );
    this.app.post(
      "/api/swarm/optimize",
      this._authenticateToken.bind(this),
      this._handleOptimize.bind(this)
    );

    // Quantum routes
    this.app.get(
      "/api/quantum/state",
      this._authenticateToken.bind(this),
      this._handleQuantumState.bind(this)
    );
    this.app.post(
      "/api/quantum/operate",
      this._authenticateToken.bind(this),
      this._handleQuantumOperation.bind(this)
    );
  }

  /**
   * Set up error handling
   * @private
   */
  _setupErrorHandling() {
    // 404 handler
    this.app.use((req, res, next) => {
      res.status(404).json({
        error: "Not Found",
        message: "The requested resource does not exist",
      });
    });

    // Error handler
    this.app.use((error, req, res, next) => {
      console.error("API Error:", error);

      // Emit error event
      eventBus.publish("api.error", {
        error: error.message,
        path: req.path,
        method: req.method,
      });

      res.status(error.status || 500).json({
        error: error.name || "Internal Server Error",
        message: error.message || "An unexpected error occurred",
      });
    });
  }

  /**
   * Start metrics reporting
   * @private
   */
  _startMetricsReporting() {
    setInterval(() => {
      eventBus.publish("api.stats", this.getMetrics());
    }, 5000); // Report every 5 seconds
  }

  /**
   * Authentication middleware
   * @private
   */
  _authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication token is required",
      });
    }

    try {
      const user = jwt.verify(token, this.options.jwtSecret);
      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Invalid or expired token",
      });
    }
  }

  /**
   * Handle login request
   * @private
   */
  async _handleLogin(req, res) {
    try {
      const { username, password } = req.body;

      // Validate credentials (implement your auth logic)
      // ...

      // Generate token
      const token = jwt.sign(
        { username, role: "user" },
        this.options.jwtSecret,
        { expiresIn: "1h" }
      );

      res.json({ token });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle token refresh
   * @private
   */
  async _handleTokenRefresh(req, res) {
    try {
      const { token } = req.body;

      // Verify existing token
      const user = jwt.verify(token, this.options.jwtSecret);

      // Generate new token
      const newToken = jwt.sign(
        { username: user.username, role: user.role },
        this.options.jwtSecret,
        { expiresIn: "1h" }
      );

      res.json({ token: newToken });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle system status request
   * @private
   */
  async _handleSystemStatus(req, res) {
    try {
      // Get system status from event bus
      eventBus.publish("system.status.request", { requestId: Date.now() });

      // Wait for response
      const status = await new Promise((resolve) => {
        const subId = eventBus.subscribe(
          "system.status.response",
          (data) => {
            eventBus.unsubscribe(subId);
            resolve(data);
          },
          { timeout: 5000 }
        );
      });

      res.json(status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle system metrics request
   * @private
   */
  async _handleSystemMetrics(req, res) {
    try {
      // Get system metrics from event bus
      eventBus.publish("system.metrics.request", { requestId: Date.now() });

      // Wait for response
      const metrics = await new Promise((resolve) => {
        const subId = eventBus.subscribe(
          "system.metrics.response",
          (data) => {
            eventBus.unsubscribe(subId);
            resolve(data);
          },
          { timeout: 5000 }
        );
      });

      res.json(metrics);
    } catch (error) {
      next(error);
    }
  }

  // Additional route handlers...
  async _handleGetLayers(req, res) {
    // Implementation for consciousness layers
  }

  async _handlePreserve(req, res) {
    // Implementation for consciousness preservation
  }

  async _handleTransfer(req, res) {
    // Implementation for consciousness transfer
  }

  async _handleGetNodes(req, res) {
    // Implementation for swarm nodes
  }

  async _handleOptimize(req, res) {
    // Implementation for swarm optimization
  }

  async _handleQuantumState(req, res) {
    // Implementation for quantum state
  }

  async _handleQuantumOperation(req, res) {
    // Implementation for quantum operations
  }
}

module.exports = ApiServer;
