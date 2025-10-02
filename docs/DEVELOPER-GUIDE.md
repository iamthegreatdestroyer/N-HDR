# HDR Empire Framework - Developer Guide

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

## Overview

This guide provides comprehensive information for developers working on the HDR Empire Framework, including architecture, development workflows, coding standards, and contribution guidelines.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Development Environment](#development-environment)
4. [Project Structure](#project-structure)
5. [Core Systems](#core-systems)
6. [Development Workflows](#development-workflows)
7. [Coding Standards](#coding-standards)
8. [Testing Guidelines](#testing-guidelines)
9. [API Development](#api-development)
10. [Integration Patterns](#integration-patterns)
11. [Security Guidelines](#security-guidelines)
12. [Performance Optimization](#performance-optimization)
13. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
14. [Contributing](#contributing)

## Getting Started

### Prerequisites

**Required**:

- Node.js 18+ (LTS recommended)
- npm 8+
- Git 2.30+
- Code editor (VS Code recommended)

**Recommended**:

- Docker Desktop (for containerized development)
- Kubernetes CLI (kubectl) for deployment testing
- PostgreSQL 14+ (for persistence testing)
- Redis 6+ (for caching)

### Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/n-hdr.git
cd n-hdr

# Install dependencies
npm install

# Copy development configuration
cp config/hdr-config.example.js config/hdr-config.dev.js

# Run tests to verify setup
npm test

# Start in development mode
npm run dev
```

### IDE Configuration

**VS Code Extensions** (recommended):

- ESLint
- Prettier
- Jest Runner
- GitLens
- Docker
- JavaScript (ES6) code snippets

**VS Code Settings** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "jest.autoRun": "off",
  "jest.showCoverageOnLoad": false
}
```

## Architecture Overview

### System Architecture

```
HDR Empire Framework
├── Core HDR Systems (7 systems)
│   ├── Neural-HDR (N-HDR)          - Consciousness preservation
│   ├── Nano-Swarm HDR (NS-HDR)     - Task acceleration
│   ├── Omniscient-HDR (O-HDR)      - Knowledge crystallization
│   ├── Reality-HDR (R-HDR)         - Data compression
│   ├── Quantum-HDR (Q-HDR)         - Probability exploration
│   ├── Dream-HDR (D-HDR)           - Creativity amplification
│   └── Void-Blade HDR (VB-HDR)     - Security protection
├── Integration Layer
│   ├── CrossSystemBridge           - Inter-system communication
│   ├── DimensionalDataTransformer  - Data transformation
│   └── SystemSynchronizer          - State synchronization
├── Command Interface
│   ├── HDREmpireCommander          - Central command system
│   ├── SystemRegistry              - System management
│   ├── CommandRouter               - Command routing
│   ├── SystemMonitor               - Health monitoring
│   └── ConfigurationManager        - Configuration management
├── Applications
│   ├── Quantum Knowledge Explorer  - Knowledge exploration
│   ├── Consciousness Workbench     - State management
│   └── HDR Empire Dashboard        - System control
└── Infrastructure
    ├── API Layer                   - REST/WebSocket APIs
    ├── Storage Layer               - Persistence
    ├── Security Layer              - Authentication/Authorization
    └── Monitoring Layer            - Metrics/Logging
```

### Design Principles

1. **Modularity**: Each HDR system is independent and self-contained
2. **Integration**: Systems communicate through well-defined interfaces
3. **Security First**: VB-HDR protection throughout
4. **Performance**: NS-HDR acceleration where applicable
5. **Reliability**: Distributed persistence and fault tolerance
6. **Extensibility**: Plugin architecture for custom systems
7. **Observability**: Comprehensive logging and metrics

### Technology Stack

**Core**:

- Runtime: Node.js 18+ (ES Modules)
- Language: JavaScript (ES2022+)
- Package Manager: npm

**Testing**:

- Framework: Jest 29+
- Coverage: Jest coverage reports
- E2E: Playwright (for UI applications)

**Storage**:

- Primary: PostgreSQL 14+
- Cache: Redis 6+
- Object Storage: S3-compatible

**Deployment**:

- Containers: Docker
- Orchestration: Kubernetes
- CI/CD: GitHub Actions

**Monitoring**:

- Metrics: Prometheus
- Logging: Winston
- Tracing: OpenTelemetry

## Development Environment

### Environment Variables

Create `.env` file in project root:

```bash
# Environment
NODE_ENV=development

# Server
PORT=3000
HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hdr_empire_dev
DB_USER=hdr_dev
DB_PASSWORD=dev_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security
JWT_SECRET=your-dev-secret-change-in-production
ENCRYPTION_KEY=your-encryption-key-32-chars-min

# HDR Systems
N_HDR_ENABLED=true
NS_HDR_ENABLED=true
O_HDR_ENABLED=true
R_HDR_ENABLED=true
Q_HDR_ENABLED=true
D_HDR_ENABLED=true
VB_HDR_ENABLED=true

# Development
DEBUG=hdr:*
LOG_LEVEL=debug
```

### Development Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run dev:debug        # Start with debugger
npm run dev:watch        # Watch mode with tests

# Testing
npm test                 # Run all tests
npm test:unit            # Unit tests only
npm test:integration     # Integration tests
npm test:e2e             # End-to-end tests
npm test:watch           # Watch mode
npm test:coverage        # With coverage report

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix lint issues
npm run format           # Format with Prettier
npm run type-check       # Check JSDoc types

# Build
npm run build            # Production build
npm run build:docs       # Generate documentation

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed development data
npm run db:reset         # Reset database

# Utilities
npm run clean            # Clean build artifacts
npm run reset            # Full reset
```

## Project Structure

```
n-hdr/
├── src/                          # Source code
│   ├── core/                     # Core HDR systems
│   │   ├── neural-hdr/           # N-HDR implementation
│   │   ├── nano-swarm-hdr/       # NS-HDR implementation
│   │   ├── omniscient-hdr/       # O-HDR implementation
│   │   ├── reality-hdr/          # R-HDR implementation
│   │   ├── quantum-hdr/          # Q-HDR implementation
│   │   ├── dream-hdr/            # D-HDR implementation
│   │   └── void-blade-hdr/       # VB-HDR implementation
│   ├── integration/              # Integration layer
│   │   ├── CrossSystemBridge.js
│   │   ├── DimensionalDataTransformer.js
│   │   └── SystemSynchronizer.js
│   ├── command-interface/        # Command interface
│   │   ├── HDREmpireCommander.js
│   │   ├── SystemRegistry.js
│   │   ├── CommandRouter.js
│   │   ├── SystemMonitor.js
│   │   └── ConfigurationManager.js
│   ├── applications/             # User applications
│   │   ├── quantum-knowledge-explorer/
│   │   ├── consciousness-workbench/
│   │   └── dashboard/
│   ├── api/                      # API layer
│   │   ├── rest/                 # REST endpoints
│   │   ├── websocket/            # WebSocket handlers
│   │   └── graphql/              # GraphQL schema (future)
│   ├── utils/                    # Utilities
│   │   ├── logger.js
│   │   ├── errors.js
│   │   └── validators.js
│   └── index.js                  # Main entry point
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── e2e/                      # End-to-end tests
│   ├── performance/              # Performance tests
│   └── fixtures/                 # Test fixtures
├── config/                       # Configuration files
│   ├── hdr-config.js             # Main configuration
│   ├── hdr-config.example.js     # Example configuration
│   └── systems/                  # Per-system configs
├── docs/                         # Documentation
│   ├── api/                      # API documentation
│   ├── systems/                  # System documentation
│   └── architecture/             # Architecture docs
├── scripts/                      # Utility scripts
│   ├── enforce-copyright.js
│   ├── migrate.js
│   └── seed.js
├── docker/                       # Docker files
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.dev.yml
├── k8s/                          # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
├── .github/                      # GitHub configuration
│   └── workflows/                # CI/CD workflows
├── package.json                  # Dependencies
├── jest.config.js                # Jest configuration
├── .eslintrc.js                  # ESLint configuration
├── .prettierrc.js                # Prettier configuration
└── README.md                     # Project README
```

## Core Systems

### System Implementation Pattern

Each HDR system follows a consistent pattern:

```javascript
/*
 * HDR Empire Framework - System Name
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 */

import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";

/**
 * System Name - Description
 * @extends EventEmitter
 */
export class SystemName extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.logger = new Logger("SystemName");
    this.initialized = false;
    this.metrics = {
      operationsCount: 0,
      errorCount: 0,
      lastOperation: null,
    };
  }

  /**
   * Initialize the system
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      throw new Error("System already initialized");
    }

    this.logger.info("Initializing system...");

    // Initialize components
    await this._initializeComponents();

    // Register with command interface
    await this._registerSystem();

    // Start monitoring
    this._startMonitoring();

    this.initialized = true;
    this.emit("initialized");
    this.logger.info("System initialized successfully");
  }

  /**
   * Main operation
   * @param {Object} params - Operation parameters
   * @returns {Promise<Object>}
   */
  async performOperation(params) {
    this._validateInitialized();
    this._validateParams(params);

    try {
      this.logger.debug("Performing operation", params);
      this.metrics.operationsCount++;

      // Perform operation
      const result = await this._execute(params);

      this.metrics.lastOperation = Date.now();
      this.emit("operation-complete", result);

      return result;
    } catch (error) {
      this.metrics.errorCount++;
      this.logger.error("Operation failed", error);
      this.emit("operation-failed", error);
      throw error;
    }
  }

  /**
   * Get system status
   * @returns {Object}
   */
  getStatus() {
    return {
      name: "SystemName",
      initialized: this.initialized,
      health: this._calculateHealth(),
      metrics: this.metrics,
      uptime: process.uptime(),
    };
  }

  /**
   * Shutdown the system
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.logger.info("Shutting down system...");

    // Stop monitoring
    this._stopMonitoring();

    // Clean up resources
    await this._cleanup();

    this.initialized = false;
    this.emit("shutdown");
    this.logger.info("System shutdown complete");
  }

  // Private methods
  async _initializeComponents() {
    /* ... */
  }
  async _registerSystem() {
    /* ... */
  }
  _startMonitoring() {
    /* ... */
  }
  _stopMonitoring() {
    /* ... */
  }
  async _execute(params) {
    /* ... */
  }
  async _cleanup() {
    /* ... */
  }
  _validateInitialized() {
    /* ... */
  }
  _validateParams(params) {
    /* ... */
  }
  _calculateHealth() {
    /* ... */
  }
}
```

### System Communication

Systems communicate through the Integration Layer:

```javascript
// Register system with CrossSystemBridge
await crossSystemBridge.registerSystem("system-name", systemInstance);

// Send data to another system
await crossSystemBridge.sendData("source-system", "target-system", data);

// Listen for data from other systems
crossSystemBridge.on("data-received", (source, data) => {
  // Handle incoming data
});

// Transform data between systems
const transformed = await dimensionalDataTransformer.transform(
  data,
  "source-system",
  "target-system"
);
```

## Development Workflows

### Feature Development

1. **Create Feature Branch**

```bash
git checkout -b feature/feature-name
```

2. **Implement Feature**

- Write code following coding standards
- Add JSDoc comments
- Include copyright headers

3. **Write Tests**

- Unit tests for components
- Integration tests for system interactions
- E2E tests for user workflows

4. **Run Quality Checks**

```bash
npm run lint
npm test
npm run type-check
```

5. **Commit Changes**

```bash
git add .
git commit -m "feat: Add feature description"
```

6. **Push and Create PR**

```bash
git push origin feature/feature-name
# Create Pull Request on GitHub
```

### Bug Fix Workflow

1. **Create Bug Fix Branch**

```bash
git checkout -b fix/bug-description
```

2. **Write Failing Test**

- Reproduce the bug in a test
- Verify test fails

3. **Fix Bug**

- Implement fix
- Ensure test passes

4. **Run Full Test Suite**

```bash
npm test
```

5. **Commit and Push**

```bash
git commit -m "fix: Fix bug description"
git push origin fix/bug-description
```

### System Development

**Adding a New HDR System**:

1. Create system directory: `src/core/new-system-hdr/`
2. Implement core system class
3. Add system configuration
4. Register with command interface
5. Add integration layer support
6. Write comprehensive tests
7. Update documentation

**Example System Structure**:

```
src/core/new-system-hdr/
├── index.js                 # Main system class
├── components/              # System components
│   ├── component1.js
│   └── component2.js
├── utils/                   # System utilities
│   └── helpers.js
├── config/                  # System configuration
│   └── default-config.js
└── README.md                # System documentation
```

## Coding Standards

### JavaScript Style Guide

**ES Modules**:

```javascript
// Use ES6+ imports/exports
import { Module } from "./module.js";
export class MyClass {}
export default MyClass;
```

**Naming Conventions**:

```javascript
// Classes: PascalCase
class SystemManager { }

// Functions/Variables: camelCase
function processData() { }
const myVariable = 'value';

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_ENDPOINT = 'https://api.example.com';

// Private methods: _prefixed
_internalMethod() { }
```

**Function Documentation**:

```javascript
/**
 * Process data with optional parameters
 * @param {Object} data - Input data
 * @param {string} data.id - Data identifier
 * @param {number} data.value - Data value
 * @param {Object} [options={}] - Optional parameters
 * @param {boolean} [options.validate=true] - Validate input
 * @returns {Promise<Object>} Processed result
 * @throws {ValidationError} If validation fails
 * @example
 * const result = await processData({ id: '123', value: 42 });
 */
async function processData(data, options = {}) {
  // Implementation
}
```

**Error Handling**:

```javascript
// Define custom errors
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

// Use try-catch for async operations
try {
  const result = await operation();
  return result;
} catch (error) {
  logger.error("Operation failed", error);
  throw new OperationError("Failed to perform operation", { cause: error });
}
```

**Async/Await**:

```javascript
// Prefer async/await over callbacks
async function fetchData() {
  const data = await database.query("SELECT * FROM table");
  return data;
}

// Handle multiple promises
const [result1, result2] = await Promise.all([operation1(), operation2()]);

// Use Promise.allSettled for optional operations
const results = await Promise.allSettled([
  operation1(),
  operation2(),
  operation3(),
]);
```

### Copyright Headers

All source files must include copyright header:

```javascript
/*
 * HDR Empire Framework - [Component Name]
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */
```

Enforce with:

```bash
node scripts/enforce-copyright.js
```

## Testing Guidelines

### Test Structure

```javascript
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { SystemUnderTest } from "../src/system.js";

describe("SystemUnderTest", () => {
  let system;

  beforeEach(() => {
    system = new SystemUnderTest();
  });

  afterEach(async () => {
    await system.cleanup();
  });

  describe("Initialization", () => {
    test("should initialize successfully", async () => {
      await system.initialize();
      expect(system.initialized).toBe(true);
    });

    test("should throw if already initialized", async () => {
      await system.initialize();
      await expect(system.initialize()).rejects.toThrow("Already initialized");
    });
  });

  describe("Operations", () => {
    beforeEach(async () => {
      await system.initialize();
    });

    test("should perform operation successfully", async () => {
      const result = await system.performOperation({ param: "value" });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test("should handle errors gracefully", async () => {
      await expect(system.performOperation({ invalid: true })).rejects.toThrow(
        "Validation failed"
      );
    });
  });
});
```

### Test Coverage Requirements

- **Minimum**: 80% overall coverage
- **Critical Systems**: 95%+ coverage
- **New Code**: 90%+ coverage

Check coverage:

```bash
npm test:coverage
open coverage/lcov-report/index.html
```

### Integration Testing

```javascript
describe("N-HDR + NS-HDR Integration", () => {
  let neuralHDR, nanoSwarmHDR;

  beforeAll(async () => {
    neuralHDR = new NeuralHDR();
    nanoSwarmHDR = new NanoSwarmHDR();
    await neuralHDR.initialize();
    await nanoSwarmHDR.initialize();
  });

  afterAll(async () => {
    await neuralHDR.shutdown();
    await nanoSwarmHDR.shutdown();
  });

  test("should accelerate consciousness capture with swarm", async () => {
    // Deploy swarm
    const swarm = await nanoSwarmHDR.deploySwarm("capture-acceleration");

    // Capture with swarm
    const start = Date.now();
    const state = await neuralHDR.captureState({ useSwarm: swarm.id });
    const duration = Date.now() - start;

    // Verify acceleration
    expect(state.fidelity).toBeGreaterThan(0.999);
    expect(duration).toBeLessThan(200); // Should be faster

    // Cleanup
    await nanoSwarmHDR.terminateSwarm(swarm.id);
  });
});
```

## API Development

### REST API Pattern

```javascript
import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import { SystemController } from "../controllers/system.controller.js";

const router = express.Router();
const controller = new SystemController();

/**
 * @route GET /api/systems/:systemId
 * @desc Get system status
 * @access Private
 */
router.get(
  "/systems/:systemId",
  authenticate,
  authorize("system:read"),
  controller.getStatus
);

/**
 * @route POST /api/systems/:systemId/operations
 * @desc Execute system operation
 * @access Private
 */
router.post(
  "/systems/:systemId/operations",
  authenticate,
  authorize("system:write"),
  validate("operation"),
  controller.executeOperation
);

export default router;
```

### WebSocket Pattern

```javascript
import { WebSocketServer } from "ws";
import { Logger } from "../utils/logger.js";

export class SystemWebSocket {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.logger = new Logger("SystemWebSocket");
    this.clients = new Map();

    this._initialize();
  }

  _initialize() {
    this.wss.on("connection", (ws, req) => {
      const clientId = this._generateClientId();
      this.clients.set(clientId, ws);

      ws.on("message", (data) => this._handleMessage(clientId, data));
      ws.on("close", () => this._handleClose(clientId));
      ws.on("error", (error) => this._handleError(clientId, error));

      this._sendMessage(ws, { type: "connected", clientId });
    });
  }

  broadcast(message) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        this._sendMessage(client, message);
      }
    });
  }
}
```

## Integration Patterns

### Cross-System Integration

```javascript
// Pattern 1: Sequential Processing
async function sequentialWorkflow(data) {
  const crystallized = await omniscientHDR.crystallize(data);
  const compressed = await realityHDR.compress(crystallized);
  const protected = await voidBladeHDR.protect(compressed);
  return protected;
}

// Pattern 2: Parallel Processing
async function parallelWorkflow(data) {
  const [result1, result2, result3] = await Promise.all([
    omniscientHDR.process(data),
    realityHDR.process(data),
    quantumHDR.process(data),
  ]);
  return { result1, result2, result3 };
}

// Pattern 3: Pipeline Processing
async function pipelineWorkflow(data) {
  return pipeline([
    (d) => omniscientHDR.crystallize(d),
    (d) => realityHDR.compress(d),
    (d) => voidBladeHDR.protect(d),
  ])(data);
}
```

## Security Guidelines

### Authentication

```javascript
import jwt from "jsonwebtoken";

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}
```

### Authorization

```javascript
export function authorize(...permissions) {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];

    const hasPermission = permissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}
```

### Input Validation

```javascript
import Joi from "joi";

const operationSchema = Joi.object({
  type: Joi.string().required(),
  params: Joi.object().required(),
  options: Joi.object().optional(),
});

export function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    next();
  };
}
```

## Performance Optimization

### Caching Strategy

```javascript
import Redis from "ioredis";

class CacheManager {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async get(key) {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key, value, ttl = 3600) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### Database Optimization

```javascript
// Use connection pooling
import pg from "pg";
const pool = new pg.Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Use prepared statements
const result = await pool.query("SELECT * FROM table WHERE id = $1", [id]);

// Batch operations
await pool.query("BEGIN");
try {
  await pool.query("INSERT INTO ...", [data1]);
  await pool.query("INSERT INTO ...", [data2]);
  await pool.query("COMMIT");
} catch (error) {
  await pool.query("ROLLBACK");
  throw error;
}
```

## Debugging and Troubleshooting

### Logging

```javascript
import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

### Debugging

```javascript
// Debug mode
if (process.env.DEBUG) {
  console.log('Debug info:', debugData);
}

// VS Code launch configuration
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug HDR Empire",
      "program": "${workspaceFolder}/src/index.js",
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "hdr:*"
      }
    }
  ]
}
```

## Contributing

### Contribution Process

1. Fork repository
2. Create feature branch
3. Make changes
4. Write/update tests
5. Update documentation
6. Submit pull request

### Pull Request Guidelines

**PR Title**: `type: description`

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance

**PR Description Template**:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Code Review

**Reviewers check**:

- Code quality and style
- Test coverage
- Documentation
- Security implications
- Performance impact
- IP protection (copyright headers)

---

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

For more information, see:

- [API-REFERENCE.md](./API-REFERENCE.md) - Complete API documentation
- [ARCHITECTURE-OVERVIEW.md](./ARCHITECTURE-OVERVIEW.md) - Architecture details
- [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md) - Integration patterns
