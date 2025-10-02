# Authentication Implementation Guide

**HDR Empire Framework - Authentication System**  
**Copyright © 2025 Stephen Bilodeau - Patent Pending**  
**Last Updated:** October 2, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication Flows](#authentication-flows)
4. [Integration Examples](#integration-examples)
5. [Security Best Practices](#security-best-practices)
6. [API Reference](#api-reference)
7. [Configuration](#configuration)

---

## Overview

The HDR Empire Authentication System provides enterprise-grade security for all HDR systems, integrating with the VB-HDR (Void-Blade HDR) security layer to deliver quantum-resistant, multi-layered authentication and authorization.

### Key Features

- **JWT-based Authentication** - Secure token-based authentication
- **Role-Based Access Control (RBAC)** - Granular permission management
- **OAuth/OIDC Integration** - Support for external identity providers
- **Session Management** - Secure session tracking and lifecycle management
- **Multi-Factor Authentication (MFA)** - Optional additional security layer
- **VB-HDR Integration** - Quantum-resistant encryption for all auth tokens
- **Audit Logging** - Comprehensive authentication event tracking

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                       │
│  (HDR Systems: N-HDR, NS-HDR, O-HDR, R-HDR, Q-HDR, etc.) │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│              AUTHENTICATION MIDDLEWARE                   │
│  (Token Verification, Role Checks, Permission Checks)    │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│            AUTHENTICATION SYSTEM                         │
│  • User Management    • Token Management                 │
│  • Role Management    • Session Management               │
│  • Permission Engine  • OAuth Integration                │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│                VB-HDR SECURITY LAYER                     │
│  (Quantum Encryption, Threat Assessment, Audit Logging)  │
└─────────────────────────────────────────────────────────┘
```

### Authentication Flow

1. **User Login** → Authentication System validates credentials
2. **Token Generation** → VB-HDR encrypts JWT token
3. **Token Storage** → Secure session management
4. **Request Authorization** → Middleware validates token + permissions
5. **Audit Logging** → VB-HDR logs all authentication events

---

## Authentication Flows

### 1. Standard Login Flow

```javascript
// 1. User submits credentials
const credentials = {
  username: "user@hdrempire.com",
  password: "securePassword123",
};

// 2. Authentication system validates credentials
const authSystem = new AuthenticationSystem({
  jwtSecret: process.env.HDR_JWT_SECRET,
  tokenExpiry: 3600000, // 1 hour
});

const { token, user } = await authSystem.authenticate(
  credentials.username,
  credentials.password
);

// 3. Token is encrypted by VB-HDR
const protectedToken = await voidBladeHDR.protectResource({ token }, "maximum");

// 4. Return protected token to client
return {
  token: protectedToken.encrypted,
  user: {
    id: user.id,
    username: user.username,
    roles: user.roles,
  },
  expiresIn: 3600,
};
```

### 2. Token Verification Flow

```javascript
// 1. Extract token from request
const token = request.headers.authorization?.split(" ")[1];

// 2. Decrypt token using VB-HDR
const decryptedToken = await voidBladeHDR.verifyProtection({
  encrypted: token,
});

// 3. Verify token validity
const session = await authSystem.verifyToken(decryptedToken.token);

// 4. Attach user context to request
request.user = {
  id: session.userId,
  username: session.username,
  roles: session.roles,
};
```

### 3. Role-Based Authorization Flow

```javascript
// Middleware to check user role
async function requireRole(role) {
  return async (request, response, next) => {
    // Verify token
    const session = await authSystem.verifyToken(request.token);

    // Check role
    const hasRole = await authSystem.hasRole(session.userId, role);

    if (!hasRole) {
      return response.status(403).json({
        error: "Insufficient permissions",
        required: role,
      });
    }

    next();
  };
}

// Usage in route
app.post("/api/nhdr/capture", requireRole("developer"), async (req, res) => {
  // Protected endpoint - only developers can access
});
```

### 4. Permission-Based Authorization Flow

```javascript
// Middleware to check specific permission
async function requirePermission(permission) {
  return async (request, response, next) => {
    const session = await authSystem.verifyToken(request.token);

    const hasPermission = await authSystem.hasPermission(
      session.userId,
      permission
    );

    if (!hasPermission) {
      return response.status(403).json({
        error: "Insufficient permissions",
        required: permission,
      });
    }

    next();
  };
}

// Usage
app.delete(
  "/api/ohdr/crystal/:id",
  requirePermission("delete"),
  async (req, res) => {
    // Only users with delete permission can access
  }
);
```

### 5. OAuth/OIDC Integration Flow

```javascript
// OAuth provider configuration
const oauthConfig = {
  providers: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "https://hdrempire.com/auth/github/callback",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://hdrempire.com/auth/google/callback",
    },
  },
};

// OAuth callback handler
async function handleOAuthCallback(provider, profile) {
  // 1. Check if user exists
  let user = await authSystem.findUserByProviderId(provider, profile.id);

  // 2. Create user if not exists
  if (!user) {
    user = await authSystem.registerUser(
      `${provider}-${profile.id}`,
      crypto.randomBytes(32).toString("hex"),
      ["user"]
    );

    await authSystem.linkOAuthProvider(user.id, provider, profile);
  }

  // 3. Generate authentication token
  const { token } = await authSystem.authenticate(user.username, "oauth-token");

  return { token, user };
}
```

---

## Integration Examples

### Express.js Integration

```javascript
const express = require("express");
const { AuthenticationSystem } = require("./src/authentication");
const { VoidBladeHDR } = require("./src/core/void-blade-hdr");

const app = express();
const authSystem = new AuthenticationSystem();
const voidBladeHDR = new VoidBladeHDR({ securityLevel: "maximum" });

// Authentication middleware
async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const session = await authSystem.verifyToken(token);
    req.user = session;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Login endpoint
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authSystem.authenticate(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Protected endpoint
app.get("/api/nhdr/states", authenticate, async (req, res) => {
  // Only authenticated users can access
  res.json({ states: [] });
});

// Role-protected endpoint
app.post(
  "/api/admin/users",
  authenticate,
  requireRole("admin"),
  async (req, res) => {
    // Only admins can access
    res.json({ success: true });
  }
);
```

### React Integration

```javascript
// Authentication service
class AuthService {
  constructor() {
    this.token = localStorage.getItem("hdr_token");
  }

  async login(username, password) {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Authentication failed");
    }

    const { token, user } = await response.json();
    localStorage.setItem("hdr_token", token);
    localStorage.setItem("hdr_user", JSON.stringify(user));

    this.token = token;
    return { token, user };
  }

  async logout() {
    await fetch("/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    localStorage.removeItem("hdr_token");
    localStorage.removeItem("hdr_user");
    this.token = null;
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }
}

// Protected route component
function ProtectedRoute({ children, requiredRole }) {
  const authService = new AuthService();
  const user = JSON.parse(localStorage.getItem("hdr_user") || "{}");

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && !user.roles?.includes(requiredRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
```

---

## Security Best Practices

### 1. Password Security

```javascript
// ALWAYS hash passwords - NEVER store plaintext
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// User registration with hashed password
async function registerUser(username, password, roles) {
  const hashedPassword = await hashPassword(password);

  const user = {
    id: generateUserId(),
    username,
    password: hashedPassword, // Stored as hash
    roles,
    createdAt: Date.now(),
  };

  await database.users.insert(user);
  return { id: user.id, username: user.username };
}
```

### 2. Token Security

```javascript
// Use VB-HDR for quantum-resistant token encryption
async function generateSecureToken(user) {
  // 1. Create JWT
  const jwt = jsonwebtoken.sign(
    {
      userId: user.id,
      username: user.username,
      roles: user.roles,
      iat: Date.now(),
      exp: Date.now() + 3600000,
    },
    process.env.JWT_SECRET
  );

  // 2. Encrypt with VB-HDR quantum encryption
  const protected = await voidBladeHDR.protectResource(
    { token: jwt },
    "quantum-fortress"
  );

  return protected.encrypted;
}
```

### 3. Session Security

```javascript
// Implement session timeout and refresh
class SessionManager {
  constructor(config) {
    this.sessions = new Map();
    this.sessionTimeout = config.timeout || 3600000; // 1 hour
    this.refreshWindow = config.refreshWindow || 300000; // 5 minutes
  }

  async createSession(user, token) {
    const session = {
      userId: user.id,
      token,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
    };

    this.sessions.set(token, session);

    // Auto-cleanup expired sessions
    this.scheduleCleanup(token);

    return session;
  }

  async refreshSession(token) {
    const session = this.sessions.get(token);

    if (!session) {
      throw new Error("Session not found");
    }

    // Check if within refresh window
    const timeUntilExpiry = session.expiresAt - Date.now();

    if (timeUntilExpiry < this.refreshWindow) {
      session.expiresAt = Date.now() + this.sessionTimeout;
      session.lastActivity = Date.now();
    }

    return session;
  }

  scheduleCleanup(token) {
    setTimeout(() => {
      const session = this.sessions.get(token);
      if (session && session.expiresAt < Date.now()) {
        this.sessions.delete(token);
      }
    }, this.sessionTimeout);
  }
}
```

### 4. Rate Limiting

```javascript
// Implement rate limiting for authentication endpoints
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.post("/auth/login", authLimiter, async (req, res) => {
  // Login handler
});
```

### 5. HTTPS/TLS Enforcement

```javascript
// Always use HTTPS in production
function enforceHTTPS(req, res, next) {
  if (process.env.NODE_ENV === "production" && !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
}

app.use(enforceHTTPS);
```

### 6. CORS Configuration

```javascript
const cors = require("cors");

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["https://hdrempire.com"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
```

### 7. Security Headers

```javascript
const helmet = require("helmet");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

---

## API Reference

### AuthenticationSystem

#### `authenticate(username, password)`

Authenticates a user and returns a session token.

**Parameters:**

- `username` (string): User's username or email
- `password` (string): User's password

**Returns:**

- `Promise<{ token: string, user: Object }>`

**Example:**

```javascript
const { token, user } = await authSystem.authenticate(
  "user@example.com",
  "password"
);
```

#### `verifyToken(token)`

Verifies a session token and returns session information.

**Parameters:**

- `token` (string): JWT token to verify

**Returns:**

- `Promise<Session>`

**Example:**

```javascript
const session = await authSystem.verifyToken(token);
```

#### `registerUser(username, password, roles)`

Registers a new user.

**Parameters:**

- `username` (string): Desired username
- `password` (string): User's password (will be hashed)
- `roles` (Array<string>): Array of role names

**Returns:**

- `Promise<{ id: string, username: string }>`

**Example:**

```javascript
const user = await authSystem.registerUser("newuser", "password", ["user"]);
```

#### `hasRole(userId, role)`

Checks if a user has a specific role.

**Parameters:**

- `userId` (string): User ID to check
- `role` (string): Role name to verify

**Returns:**

- `Promise<boolean>`

**Example:**

```javascript
const isAdmin = await authSystem.hasRole(userId, "admin");
```

#### `hasPermission(userId, permission)`

Checks if a user has a specific permission.

**Parameters:**

- `userId` (string): User ID to check
- `permission` (string): Permission name to verify

**Returns:**

- `Promise<boolean>`

**Example:**

```javascript
const canDelete = await authSystem.hasPermission(userId, "delete");
```

---

## Configuration

### Environment Variables

```bash
# JWT Configuration
HDR_JWT_SECRET=your-super-secret-key-change-this
HDR_JWT_EXPIRY=3600000  # 1 hour in milliseconds

# Session Configuration
HDR_SESSION_TIMEOUT=3600000
HDR_SESSION_REFRESH_WINDOW=300000

# OAuth Providers
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Security
HDR_ALLOWED_ORIGINS=https://hdrempire.com,https://app.hdrempire.com
HDR_RATE_LIMIT_WINDOW=900000  # 15 minutes
HDR_RATE_LIMIT_MAX=5

# VB-HDR Integration
HDR_SECURITY_LEVEL=maximum
HDR_QUANTUM_ENCRYPTION=true
```

### Configuration File

```javascript
// config/auth-config.js
module.exports = {
  jwt: {
    secret: process.env.HDR_JWT_SECRET,
    expiry: parseInt(process.env.HDR_JWT_EXPIRY) || 3600000,
    algorithm: "HS256",
  },
  session: {
    timeout: parseInt(process.env.HDR_SESSION_TIMEOUT) || 3600000,
    refreshWindow: parseInt(process.env.HDR_SESSION_REFRESH_WINDOW) || 300000,
    cookieSecure: process.env.NODE_ENV === "production",
    cookieHttpOnly: true,
    cookieSameSite: "strict",
  },
  oauth: {
    providers: {
      github: {
        enabled: !!process.env.GITHUB_CLIENT_ID,
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
      google: {
        enabled: !!process.env.GOOGLE_CLIENT_ID,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    },
  },
  security: {
    level: process.env.HDR_SECURITY_LEVEL || "maximum",
    quantumEncryption: process.env.HDR_QUANTUM_ENCRYPTION === "true",
    rateLimit: {
      windowMs: parseInt(process.env.HDR_RATE_LIMIT_WINDOW) || 900000,
      max: parseInt(process.env.HDR_RATE_LIMIT_MAX) || 5,
    },
  },
  roles: {
    admin: ["read", "write", "delete", "manage-users", "manage-systems"],
    developer: ["read", "write", "deploy", "debug"],
    analyst: ["read", "analyze", "export"],
    user: ["read"],
  },
};
```

---

## Conclusion

The HDR Empire Authentication System provides enterprise-grade security with:

- ✅ **Quantum-resistant encryption** via VB-HDR integration
- ✅ **Flexible RBAC** with granular permissions
- ✅ **OAuth/OIDC support** for external identity providers
- ✅ **Comprehensive audit logging** for compliance
- ✅ **Industry best practices** for password and session security

For additional support or questions, contact the HDR Empire security team.

---

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**
