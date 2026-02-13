/**
 * API Gateway
 * External REST API interface for FORGE-HDR system management and monitoring
 */

class APIGateway {
  constructor(config = {}) {
    this.config = {
      port: config.port || 3000,
      host: config.host || "0.0.0.0",
      apiVersion: config.apiVersion || "v1",
      enableSwagger: config.enableSwagger !== false,
      corsEnabled: config.corsEnabled !== false,
      ...config,
    };

    this.modules = {
      kubernetesClient: null,
      prometheusClient: null,
      circuitBreaker: null,
      selfHealer: null,
      costTracker: null,
      topologyAnalyzer: null,
      resourceOptimizer: null,
      rateLimiter: null,
      loadBalancer: null,
      budgetEnforcer: null,
      eventBus: null,
      orchestrationEngine: null,
      anomalyDetector: null,
      performanceProfiler: null,
      complianceChecker: null,
      configManager: null,
    };

    this.routes = [];
    this.middleware = [];
    this.errorHandlers = [];
    this.requestLog = [];
    this.eventBus = config.eventBus;
    this.isRunning = false;

    this.initializeMiddleware();
    this.initializeRoutes();
  }

  /**
   * Register module
   */
  registerModule(name, module) {
    if (!this.modules.hasOwnProperty(name)) {
      throw new Error(`Unknown module: ${name}`);
    }

    this.modules[name] = module;
    console.log(`Module registered: ${name}`);
  }

  /**
   * Initialize middleware
   */
  initializeMiddleware() {
    // CORS middleware
    if (this.config.corsEnabled) {
      this.middleware.push((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS",
        );
        res.header(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization",
        );

        if (req.method === "OPTIONS") {
          return res.status(200).end();
        }

        next();
      });
    }

    // Request logging
    this.middleware.push((req, res, next) => {
      const startTime = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - startTime;
        const logEntry = {
          timestamp: startTime,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          remoteIp: req.ip,
        };

        this.requestLog.push(logEntry);
        if (this.requestLog.length > 1000) {
          this.requestLog.shift();
        }
      });

      next();
    });

    // Rate limiting middleware
    this.middleware.push((req, res, next) => {
      if (this.modules.rateLimiter) {
        const allowed = this.modules.rateLimiter.allowRequest(req.ip);

        if (!allowed) {
          return res.status(429).json({
            error: "Too many requests",
            retryAfter: 60,
          });
        }
      }

      next();
    });
  }

  /**
   * Initialize API routes
   */
  initializeRoutes() {
    // Health check
    this.addRoute("GET", "/health", this.handleHealth.bind(this));

    // System status
    this.addRoute("GET", "/api/status", this.handleStatus.bind(this));
    this.addRoute("GET", "/api/stats", this.handleStatistics.bind(this));

    // Kubernetes endpoints
    this.addRoute("GET", "/api/pods", this.handleListPods.bind(this));
    this.addRoute(
      "GET",
      "/api/pods/:namespace",
      this.handleListPods.bind(this),
    );
    this.addRoute(
      "POST",
      "/api/pods/:namespace/:name/restart",
      this.handleRestartPod.bind(this),
    );
    this.addRoute(
      "GET",
      "/api/deployments",
      this.handleListDeployments.bind(this),
    );
    this.addRoute(
      "POST",
      "/api/deployments/:namespace/:name/scale",
      this.handleScaleDeployment.bind(this),
    );

    // Performance endpoints
    this.addRoute(
      "GET",
      "/api/performance/summary",
      this.handlePerformanceSummary.bind(this),
    );
    this.addRoute(
      "GET",
      "/api/performance/endpoints",
      this.handlePerformanceEndpoints.bind(this),
    );
    this.addRoute(
      "GET",
      "/api/performance/slow-requests",
      this.handleSlowRequests.bind(this),
    );

    // Compliance endpoints
    this.addRoute(
      "GET",
      "/api/compliance/report",
      this.handleComplianceReport.bind(this),
    );
    this.addRoute(
      "GET",
      "/api/compliance/violations",
      this.handleComplianceViolations.bind(this),
    );
    this.addRoute(
      "POST",
      "/api/compliance/check",
      this.handleComplianceCheck.bind(this),
    );

    // Cost tracking endpoints
    this.addRoute(
      "GET",
      "/api/cost/summary",
      this.handleCostSummary.bind(this),
    );
    this.addRoute(
      "GET",
      "/api/cost/breakdown",
      this.handleCostBreakdown.bind(this),
    );
    this.addRoute(
      "GET",
      "/api/budget/status",
      this.handleBudgetStatus.bind(this),
    );

    // Configuration endpoints
    this.addRoute("GET", "/api/config", this.handleGetConfig.bind(this));
    this.addRoute(
      "GET",
      "/api/config/:section",
      this.handleGetConfigSection.bind(this),
    );
    this.addRoute(
      "POST",
      "/api/config/:section",
      this.handleUpdateConfig.bind(this),
    );
    this.addRoute(
      "POST",
      "/api/config/:section/reset",
      this.handleResetConfig.bind(this),
    );

    // Anomaly detection endpoints
    this.addRoute("GET", "/api/anomalies", this.handleAnomalies.bind(this));
    this.addRoute(
      "GET",
      "/api/anomalies/summary",
      this.handleAnomalySummary.bind(this),
    );

    // Circuit breaker endpoints
    this.addRoute(
      "GET",
      "/api/circuit-breaker/status",
      this.handleCircuitBreakerStatus.bind(this),
    );
    this.addRoute(
      "POST",
      "/api/circuit-breaker/:id/reset",
      this.handleResetCircuitBreaker.bind(this),
    );

    // Self-healing endpoints
    this.addRoute(
      "GET",
      "/api/self-healing/status",
      this.handleSelfHealingStatus.bind(this),
    );
    this.addRoute(
      "POST",
      "/api/self-healing/repair",
      this.handleTriggerRepair.bind(this),
    );

    // Metrics endpoints
    this.addRoute("GET", "/api/metrics", this.handleMetrics.bind(this));
    this.addRoute(
      "GET",
      "/api/metrics/:type",
      this.handleMetricsByType.bind(this),
    );

    // Topology endpoints
    this.addRoute("GET", "/api/topology", this.handleTopology.bind(this));
    this.addRoute(
      "GET",
      "/api/topology/dependencies",
      this.handleDependencies.bind(this),
    );

    // Events endpoints
    this.addRoute("GET", "/api/events", this.handleEvents.bind(this));
    this.addRoute(
      "POST",
      "/api/events/subscribe",
      this.handleSubscribeEvents.bind(this),
    );

    // Admin endpoints
    this.addRoute("POST", "/api/admin/restart", this.handleRestart.bind(this));
    this.addRoute(
      "POST",
      "/api/admin/shutdown",
      this.handleShutdown.bind(this),
    );
  }

  /**
   * Add route
   */
  addRoute(method, path, handler) {
    this.routes.push({
      method: method.toUpperCase(),
      path,
      handler,
      pattern: this.compilePathPattern(path),
    });
  }

  /**
   * Compile path pattern for matching
   */
  compilePathPattern(path) {
    const paramNames = [];
    const pattern = path
      .split("/")
      .map((segment) => {
        if (segment.startsWith(":")) {
          paramNames.push(segment.substring(1));
          return "([^/]+)";
        }
        return segment;
      })
      .join("/");

    return {
      regex: new RegExp(`^${pattern}$`),
      paramNames,
    };
  }

  /**
   * Match and extract route params
   */
  matchRoute(method, path) {
    for (const route of this.routes) {
      if (route.method === method) {
        const match = route.pattern.regex.exec(path);

        if (match) {
          const params = {};

          route.pattern.paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
          });

          return { route, params };
        }
      }
    }

    return null;
  }

  /**
   * Handle requests
   */
  async handleRequest(method, path, body = null, query = {}) {
    const match = this.matchRoute(method, path);

    if (!match) {
      return {
        statusCode: 404,
        body: { error: "Route not found" },
      };
    }

    try {
      const result = await match.route.handler({
        path,
        method,
        body,
        query,
        params: match.params,
      });

      return result;
    } catch (err) {
      console.error("Route handler error:", err);

      return {
        statusCode: 500,
        body: { error: "Internal server error", message: err.message },
      };
    }
  }

  /**
   * Handler methods
   */

  async handleHealth(req) {
    return {
      statusCode: 200,
      body: { status: "healthy", timestamp: Date.now() },
    };
  }

  async handleStatus(req) {
    return {
      statusCode: 200,
      body: {
        status: "running",
        modules: this.getModuleStatus(),
        timestamp: Date.now(),
      },
    };
  }

  async handleStatistics(req) {
    return {
      statusCode: 200,
      body: {
        requestsSinceStart: this.requestLog.length,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };
  }

  async handleListPods(req) {
    if (!this.modules.kubernetesClient) {
      return {
        statusCode: 503,
        body: { error: "Kubernetes client not available" },
      };
    }

    const namespace = req.params.namespace || "default";
    const pods = await this.modules.kubernetesClient.listPods(namespace);

    return { statusCode: 200, body: { pods } };
  }

  async handleRestartPod(req) {
    if (!this.modules.kubernetesClient) {
      return {
        statusCode: 503,
        body: { error: "Kubernetes client not available" },
      };
    }

    const { namespace, name } = req.params;

    try {
      await this.modules.kubernetesClient.restartPod(namespace, name);
      return { statusCode: 200, body: { message: "Pod restart initiated" } };
    } catch (err) {
      return { statusCode: 500, body: { error: err.message } };
    }
  }

  async handleListDeployments(req) {
    if (!this.modules.kubernetesClient) {
      return {
        statusCode: 503,
        body: { error: "Kubernetes client not available" },
      };
    }

    const namespace = req.query.namespace || "default";
    const deployments =
      await this.modules.kubernetesClient.listDeployments(namespace);

    return { statusCode: 200, body: { deployments } };
  }

  async handleScaleDeployment(req) {
    const { namespace, name } = req.params;
    const { replicas } = req.body;

    if (!replicas || replicas < 1) {
      return { statusCode: 400, body: { error: "Invalid replica count" } };
    }

    if (!this.modules.kubernetesClient) {
      return {
        statusCode: 503,
        body: { error: "Kubernetes client not available" },
      };
    }

    try {
      await this.modules.kubernetesClient.scaleDeployment(
        namespace,
        name,
        replicas,
      );
      return {
        statusCode: 200,
        body: { message: "Deployment scaled successfully" },
      };
    } catch (err) {
      return { statusCode: 500, body: { error: err.message } };
    }
  }

  async handlePerformanceSummary(req) {
    if (!this.modules.performanceProfiler) {
      return {
        statusCode: 503,
        body: { error: "Performance profiler not available" },
      };
    }

    const summary = this.modules.performanceProfiler.getPerformanceSummary();

    return { statusCode: 200, body: summary };
  }

  async handlePerformanceEndpoints(req) {
    if (!this.modules.performanceProfiler) {
      return {
        statusCode: 503,
        body: { error: "Performance profiler not available" },
      };
    }

    const limit = req.query.limit || 10;
    const endpoints =
      this.modules.performanceProfiler.getTopSlowEndpoints(limit);

    return { statusCode: 200, body: { endpoints } };
  }

  async handleSlowRequests(req) {
    if (!this.modules.performanceProfiler) {
      return {
        statusCode: 503,
        body: { error: "Performance profiler not available" },
      };
    }

    const limit = req.query.limit || 100;
    const endpoint = req.query.endpoint;
    const requests = this.modules.performanceProfiler.getSlowRequests(
      limit,
      endpoint,
    );

    return { statusCode: 200, body: { requests } };
  }

  async handleComplianceReport(req) {
    if (!this.modules.complianceChecker) {
      return {
        statusCode: 503,
        body: { error: "Compliance checker not available" },
      };
    }

    const resourceName = req.query.resource;
    const report =
      this.modules.complianceChecker.getComplianceReport(resourceName);

    return { statusCode: 200, body: report };
  }

  async handleComplianceViolations(req) {
    if (!this.modules.complianceChecker) {
      return {
        statusCode: 503,
        body: { error: "Compliance checker not available" },
      };
    }

    const stats = this.modules.complianceChecker.getViolationStatistics();

    return { statusCode: 200, body: stats };
  }

  async handleComplianceCheck(req) {
    if (!this.modules.complianceChecker) {
      return {
        statusCode: 503,
        body: { error: "Compliance checker not available" },
      };
    }

    const resources = req.body.resources || [];

    try {
      await this.modules.complianceChecker.performComplianceCheck(resources);
      const report = this.modules.complianceChecker.complianceSummary();
      return { statusCode: 200, body: report };
    } catch (err) {
      return { statusCode: 500, body: { error: err.message } };
    }
  }

  async handleCostSummary(req) {
    if (!this.modules.costTracker) {
      return { statusCode: 503, body: { error: "Cost tracker not available" } };
    }

    const summary = this.modules.costTracker.getCostSummary();

    return { statusCode: 200, body: summary };
  }

  async handleCostBreakdown(req) {
    if (!this.modules.costTracker) {
      return { statusCode: 503, body: { error: "Cost tracker not available" } };
    }

    const breakdown = this.modules.costTracker.getCostBreakdown();

    return { statusCode: 200, body: breakdown };
  }

  async handleBudgetStatus(req) {
    if (!this.modules.budgetEnforcer) {
      return {
        statusCode: 503,
        body: { error: "Budget enforcer not available" },
      };
    }

    const status = this.modules.budgetEnforcer.getBudgetStatus();

    return { statusCode: 200, body: status };
  }

  async handleGetConfig(req) {
    if (!this.modules.configManager) {
      return {
        statusCode: 503,
        body: { error: "Configuration manager not available" },
      };
    }

    const config = this.modules.configManager.getConfig();

    return { statusCode: 200, body: { config } };
  }

  async handleGetConfigSection(req) {
    if (!this.modules.configManager) {
      return {
        statusCode: 503,
        body: { error: "Configuration manager not available" },
      };
    }

    const config = this.modules.configManager.getConfig(req.params.section);

    return { statusCode: 200, body: { config } };
  }

  async handleUpdateConfig(req) {
    if (!this.modules.configManager) {
      return {
        statusCode: 503,
        body: { error: "Configuration manager not available" },
      };
    }

    const validation = this.modules.configManager.validateConfig(
      req.params.section,
      req.body,
    );

    if (!validation.valid) {
      return {
        statusCode: 400,
        body: { error: "Invalid configuration", details: validation.errors },
      };
    }

    const config = this.modules.configManager.updateConfig(
      req.params.section,
      req.body,
    );

    return { statusCode: 200, body: { config } };
  }

  async handleResetConfig(req) {
    if (!this.modules.configManager) {
      return {
        statusCode: 503,
        body: { error: "Configuration manager not available" },
      };
    }

    const config = this.modules.configManager.resetConfig(req.params.section);

    return { statusCode: 200, body: { config } };
  }

  async handleAnomalies(req) {
    if (!this.modules.anomalyDetector) {
      return {
        statusCode: 503,
        body: { error: "Anomaly detector not available" },
      };
    }

    const anomalies = this.modules.anomalyDetector.getAnomalies();

    return { statusCode: 200, body: { anomalies } };
  }

  async handleAnomalySummary(req) {
    if (!this.modules.anomalyDetector) {
      return {
        statusCode: 503,
        body: { error: "Anomaly detector not available" },
      };
    }

    const summary = this.modules.anomalyDetector.getStatistics();

    return { statusCode: 200, body: summary };
  }

  async handleCircuitBreakerStatus(req) {
    if (!this.modules.circuitBreaker) {
      return {
        statusCode: 503,
        body: { error: "Circuit breaker not available" },
      };
    }

    const status = this.modules.circuitBreaker.getStatus();

    return { statusCode: 200, body: { status } };
  }

  async handleResetCircuitBreaker(req) {
    if (!this.modules.circuitBreaker) {
      return {
        statusCode: 503,
        body: { error: "Circuit breaker not available" },
      };
    }

    try {
      this.modules.circuitBreaker.reset(req.params.id);
      return { statusCode: 200, body: { message: "Circuit breaker reset" } };
    } catch (err) {
      return { statusCode: 500, body: { error: err.message } };
    }
  }

  async handleSelfHealingStatus(req) {
    if (!this.modules.selfHealer) {
      return { statusCode: 503, body: { error: "Self healer not available" } };
    }

    const status = this.modules.selfHealer.getStatus();

    return { statusCode: 200, body: status };
  }

  async handleTriggerRepair(req) {
    if (!this.modules.selfHealer) {
      return { statusCode: 503, body: { error: "Self healer not available" } };
    }

    try {
      await this.modules.selfHealer.repair();
      return { statusCode: 200, body: { message: "Repair initiated" } };
    } catch (err) {
      return { statusCode: 500, body: { error: err.message } };
    }
  }

  async handleMetrics(req) {
    if (!this.modules.prometheusClient) {
      return {
        statusCode: 503,
        body: { error: "Prometheus client not available" },
      };
    }

    const metrics = await this.modules.prometheusClient.queryAllMetrics();

    return { statusCode: 200, body: { metrics } };
  }

  async handleMetricsByType(req) {
    if (!this.modules.prometheusClient) {
      return {
        statusCode: 503,
        body: { error: "Prometheus client not available" },
      };
    }

    const metrics = await this.modules.prometheusClient.queryMetrics(
      req.params.type,
    );

    return { statusCode: 200, body: { metrics } };
  }

  async handleTopology(req) {
    if (!this.modules.topologyAnalyzer) {
      return {
        statusCode: 503,
        body: { error: "Topology analyzer not available" },
      };
    }

    const topology = this.modules.topologyAnalyzer.getTopology();

    return { statusCode: 200, body: topology };
  }

  async handleDependencies(req) {
    if (!this.modules.topologyAnalyzer) {
      return {
        statusCode: 503,
        body: { error: "Topology analyzer not available" },
      };
    }

    const dependencies = this.modules.topologyAnalyzer.getAllDependencies();

    return { statusCode: 200, body: { dependencies } };
  }

  async handleEvents(req) {
    const limit = req.query.limit || 100;

    return { statusCode: 200, body: { events: [] } };
  }

  async handleSubscribeEvents(req) {
    return { statusCode: 200, body: { message: "Subscribed to events" } };
  }

  async handleRestart(req) {
    if (this.eventBus) {
      this.eventBus.publish("apiGateway:restartRequested", {
        timestamp: Date.now(),
      });
    }

    return { statusCode: 200, body: { message: "Restart initiated" } };
  }

  async handleShutdown(req) {
    if (this.eventBus) {
      this.eventBus.publish("apiGateway:shutdownRequested", {
        timestamp: Date.now(),
      });
    }

    return { statusCode: 200, body: { message: "Shutdown initiated" } };
  }

  /**
   * Get module status
   */
  getModuleStatus() {
    const status = {};

    for (const [name, module] of Object.entries(this.modules)) {
      if (module) {
        status[name] = {
          loaded: true,
          running: module.isRunning || false,
        };
      } else {
        status[name] = {
          loaded: false,
          running: false,
        };
      }
    }

    return status;
  }

  /**
   * Start API gateway
   */
  async start() {
    if (this.isRunning) {
      console.warn("API gateway already running");
      return;
    }

    this.isRunning = true;

    console.log(
      `API Gateway listening on ${this.config.host}:${this.config.port}`,
    );

    if (this.eventBus) {
      this.eventBus.publish("apiGateway:started", {
        port: this.config.port,
        host: this.config.host,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Stop API gateway
   */
  async stop() {
    if (!this.isRunning) {
      console.warn("API gateway not running");
      return;
    }

    this.isRunning = false;

    if (this.eventBus) {
      this.eventBus.publish("apiGateway:stopped", { timestamp: Date.now() });
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      isRunning: this.isRunning,
      routeCount: this.routes.length,
      requestsHandled: this.requestLog.length,
      configuration: {
        port: this.config.port,
        host: this.config.host,
        apiVersion: this.config.apiVersion,
        corsEnabled: this.config.corsEnabled,
      },
    };
  }
}

module.exports = { APIGateway };
