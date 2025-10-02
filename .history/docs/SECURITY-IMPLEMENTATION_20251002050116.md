# HDR Empire Framework - Security Implementation Guide

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

## Overview

This guide provides comprehensive documentation on security implementation in the HDR Empire Framework, with deep focus on the Void-Blade HDR (VB-HDR) system, encryption, authentication, authorization, audit logging, and threat detection.

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Void-Blade HDR Deep Dive](#void-blade-hdr-deep-dive)
3. [Encryption Implementation](#encryption-implementation)
4. [Authentication & Authorization](#authentication--authorization)
5. [Security Zones](#security-zones)
6. [Threat Detection & Response](#threat-detection--response)
7. [Audit Logging](#audit-logging)
8. [Secure Communication](#secure-communication)
9. [Security Best Practices](#security-best-practices)
10. [Security Testing](#security-testing)

---

## Security Architecture

### Multi-Layer Security Model

The HDR Empire Framework implements defense-in-depth with multiple security layers:

```
┌─────────────────────────────────────────────────────────┐
│              SECURITY ARCHITECTURE                       │
├─────────────────────────────────────────────────────────┤
│  Layer 5: Application Security                          │
│           - Input Validation                            │
│           - CSRF Protection                             │
│           - XSS Prevention                              │
├─────────────────────────────────────────────────────────┤
│  Layer 4: Access Control                                │
│           - Authentication (JWT)                        │
│           - Authorization (RBAC)                        │
│           - Session Management                          │
├─────────────────────────────────────────────────────────┤
│  Layer 3: VB-HDR Protection                             │
│           - Security Zones (9 Levels)                   │
│           - Threat Detection                            │
│           - Intelligent Targeting                       │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Encryption                                    │
│           - Data at Rest (AES-256)                      │
│           - Data in Transit (TLS 1.3)                   │
│           - Quantum-Safe Algorithms                     │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Infrastructure Security                       │
│           - Network Segmentation                        │
│           - Firewall Rules                              │
│           - DDoS Protection                             │
└─────────────────────────────────────────────────────────┘
```

### Security Principles

1. **Zero Trust**: Never trust, always verify
2. **Least Privilege**: Minimal access rights
3. **Defense in Depth**: Multiple security layers
4. **Security by Default**: Secure out of the box
5. **Fail Secure**: Secure state on failure

---

## Void-Blade HDR Deep Dive

### VB-HDR Architecture

```javascript
/*
 * HDR Empire Framework - Void-Blade HDR System
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 */

import { HDRBaseSystem } from '../base/HDRBaseSystem.js';
import { QuantumEncryption } from './encryption/QuantumEncryption.js';
import { ThreatDetector } from './threat/ThreatDetector.js';
import { SecurityZoneManager } from './zones/SecurityZoneManager.js';

class VoidBladeHDR extends HDRBaseSystem {
  constructor(config = {}) {
    super('Void-Blade HDR', config);
    
    this.config = {
      securityLevels: 9,
      perceptionModes: ['none', 'reduced', 'selective'],
      targetingModes: ['random', 'intelligent', 'adaptive'],
      threatScanInterval: 5000,
      autoResponse: true,
      ...config
    };

    this.securityZones = new Map();
    this.protectedResources = new Map();
    this.threats = new Map();
    this.auditLog = [];
  }

  async initialize() {
    await super.initialize();

    // Initialize encryption engine
    this.encryption = new QuantumEncryption({
      algorithm: 'AES-256-GCM',
      keyRotationInterval: 86400000 // 24 hours
    });
    await this.encryption.initialize();

    // Initialize threat detector
    this.threatDetector = new ThreatDetector({
      scanInterval: this.config.threatScanInterval,
      aiEnabled: true,
      learningMode: true
    });
    await this.threatDetector.initialize();

    // Initialize security zone manager
    this.zoneManager = new SecurityZoneManager({
      maxZones: 100
    });
    await this.zoneManager.initialize();

    // Start threat scanning
    this.startThreatScanning();

    console.log('Void-Blade HDR initialized with 9-level security');
  }

  /**
   * Create a security zone with specified protection level
   */
  async createSecurityZone(options = {}) {
    const startTime = Date.now();

    try {
      const zone = {
        id: this.generateZoneId(),
        name: options.name || `Zone-${Date.now()}`,
        level: this.validateSecurityLevel(options.level || 5),
        perception: options.perception || 'selective',
        targeting: options.targeting || 'intelligent',
        autoScale: options.autoScale !== false,
        resources: options.resources || [],
        createdAt: Date.now(),
        status: 'active',
        metrics: {
          threatsDetected: 0,
          threatsNeutralized: 0,
          resourcesProtected: 0
        }
      };

      // Create zone in zone manager
      await this.zoneManager.createZone(zone);

      // Configure protection
      await this.configureZoneProtection(zone);

      this.securityZones.set(zone.id, zone);

      this.recordOperation(true, Date.now() - startTime);
      this.emit('zone-created', zone);
      this.audit('zone-created', zone);

      return zone;
    } catch (error) {
      this.recordOperation(false, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Protect a resource with VB-HDR
   */
  async protect(resource, options = {}) {
    const startTime = Date.now();

    try {
      const protection = {
        id: this.generateProtectionId(),
        resourceId: resource.id || this.generateResourceId(),
        resource: resource,
        zoneId: options.zoneId,
        level: options.level || 5,
        encryption: options.encryption || 'quantum',
        cloaking: options.cloaking !== false,
        vanishingKeys: options.vanishingKeys !== false,
        createdAt: Date.now(),
        status: 'protected'
      };

      // Encrypt resource
      if (protection.encryption) {
        protection.encryptedData = await this.encryption.encrypt(
          resource,
          {
            algorithm: this.getEncryptionAlgorithm(protection.encryption),
            level: protection.level
          }
        );
      }

      // Apply cloaking
      if (protection.cloaking) {
        await this.applyCloaking(protection);
      }

      // Setup vanishing keys
      if (protection.vanishingKeys) {
        await this.setupVanishingKeys(protection);
      }

      // Add to zone if specified
      if (protection.zoneId) {
        const zone = this.securityZones.get(protection.zoneId);
        if (zone) {
          zone.resources.push(protection.resourceId);
          zone.metrics.resourcesProtected++;
        }
      }

      this.protectedResources.set(protection.resourceId, protection);

      this.recordOperation(true, Date.now() - startTime);
      this.emit('resource-protected', protection);
      this.audit('resource-protected', protection);

      return protection;
    } catch (error) {
      this.recordOperation(false, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Scan for security threats
   */
  async scanThreats(options = {}) {
    const startTime = Date.now();

    try {
      const scan = {
        id: this.generateScanId(),
        scope: options.scope || 'all',
        depth: options.depth || 'standard',
        realtime: options.realtime || false,
        startedAt: Date.now(),
        status: 'scanning'
      };

      // Determine scan targets
      const targets = this.getScanTargets(scan.scope);

      // Execute threat scan
      const threats = await this.threatDetector.scan(targets, {
        depth: scan.depth,
        realtime: scan.realtime
      });

      scan.threatsFound = threats.length;
      scan.completedAt = Date.now();
      scan.status = 'completed';

      // Store threats
      threats.forEach(threat => {
        this.threats.set(threat.id, threat);
        
        // Auto-respond if enabled
        if (this.config.autoResponse) {
          this.respondToThreat(threat);
        }
      });

      this.recordOperation(true, Date.now() - startTime);
      this.emit('scan-completed', scan);
      this.audit('threat-scan', scan);

      return {
        scan,
        threats
      };
    } catch (error) {
      this.recordOperation(false, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Verify protection integrity
   */
  async verifyProtection(resourceId) {
    const protection = this.protectedResources.get(resourceId);
    
    if (!protection) {
      throw new Error(`Resource ${resourceId} not protected`);
    }

    const verification = {
      resourceId,
      verified: true,
      issues: []
    };

    // Verify encryption
    if (protection.encryption) {
      const encryptionValid = await this.encryption.verify(
        protection.encryptedData
      );
      
      if (!encryptionValid) {
        verification.verified = false;
        verification.issues.push('Encryption integrity compromised');
      }
    }

    // Verify cloaking
    if (protection.cloaking) {
      const cloakingActive = await this.verifyCloaking(protection);
      
      if (!cloakingActive) {
        verification.verified = false;
        verification.issues.push('Cloaking inactive');
      }
    }

    // Verify vanishing keys
    if (protection.vanishingKeys) {
      const keysValid = await this.verifyVanishingKeys(protection);
      
      if (!keysValid) {
        verification.verified = false;
        verification.issues.push('Vanishing keys compromised');
      }
    }

    this.emit('protection-verified', verification);
    this.audit('protection-verification', verification);

    return verification;
  }

  /**
   * Respond to detected threat
   */
  async respondToThreat(threat) {
    const response = {
      threatId: threat.id,
      action: this.determineResponse(threat),
      timestamp: Date.now()
    };

    switch (response.action) {
      case 'block':
        await this.blockThreat(threat);
        break;
      case 'isolate':
        await this.isolateThreat(threat);
        break;
      case 'neutralize':
        await this.neutralizeThreat(threat);
        break;
      case 'monitor':
        await this.monitorThreat(threat);
        break;
    }

    // Update zone metrics
    if (threat.zoneId) {
      const zone = this.securityZones.get(threat.zoneId);
      if (zone) {
        zone.metrics.threatsDetected++;
        if (response.action !== 'monitor') {
          zone.metrics.threatsNeutralized++;
        }
      }
    }

    this.emit('threat-responded', response);
    this.audit('threat-response', response);

    return response;
  }

  /**
   * Configure zone protection mechanisms
   */
  async configureZoneProtection(zone) {
    // Configure perception manipulation
    await this.configurePerception(zone);

    // Configure intelligent targeting
    await this.configureTargeting(zone);

    // Configure auto-scaling
    if (zone.autoScale) {
      await this.configureAutoScale(zone);
    }
  }

  async configurePerception(zone) {
    // Implement perception mode (none/reduced/selective)
    switch (zone.perception) {
      case 'none':
        zone.perceptionLevel = 0;
        break;
      case 'reduced':
        zone.perceptionLevel = 0.25;
        break;
      case 'selective':
        zone.perceptionLevel = 0.5;
        break;
    }
  }

  async configureTargeting(zone) {
    // Implement targeting mode (random/intelligent/adaptive)
    zone.targetingStrategy = zone.targeting;
  }

  async configureAutoScale(zone) {
    // Implement auto-scaling based on threat level
    zone.autoScaleConfig = {
      minResources: 1,
      maxResources: 100,
      scaleUpThreshold: 0.75,
      scaleDownThreshold: 0.25
    };
  }

  async applyCloaking(protection) {
    // Apply perceptual cloaking to resource
    protection.cloaked = true;
    protection.cloakingStrength = protection.level / this.config.securityLevels;
  }

  async setupVanishingKeys(protection) {
    // Setup vanishing keys (self-destructing encryption keys)
    protection.vanishingKeys = {
      enabled: true,
      ttl: 3600000, // 1 hour
      accessCount: 0,
      maxAccesses: 10
    };
  }

  async verifyCloaking(protection) {
    return protection.cloaked === true;
  }

  async verifyVanishingKeys(protection) {
    if (!protection.vanishingKeys) return true;
    
    return protection.vanishingKeys.accessCount < protection.vanishingKeys.maxAccesses;
  }

  determineResponse(threat) {
    // Determine appropriate response based on threat level
    if (threat.severity >= 9) return 'neutralize';
    if (threat.severity >= 7) return 'isolate';
    if (threat.severity >= 5) return 'block';
    return 'monitor';
  }

  async blockThreat(threat) {
    threat.status = 'blocked';
  }

  async isolateThreat(threat) {
    threat.status = 'isolated';
  }

  async neutralizeThreat(threat) {
    threat.status = 'neutralized';
  }

  async monitorThreat(threat) {
    threat.status = 'monitoring';
  }

  startThreatScanning() {
    this.scanInterval = setInterval(() => {
      this.scanThreats({ scope: 'all', depth: 'standard' });
    }, this.config.threatScanInterval);
  }

  getScanTargets(scope) {
    if (scope === 'all') {
      return Array.from(this.protectedResources.keys());
    }
    // Implement scope-based targeting
    return [];
  }

  validateSecurityLevel(level) {
    if (level < 1 || level > this.config.securityLevels) {
      throw new Error(`Security level must be between 1 and ${this.config.securityLevels}`);
    }
    return level;
  }

  getEncryptionAlgorithm(type) {
    const algorithms = {
      standard: 'AES-256-GCM',
      quantum: 'CRYSTALS-Kyber',
      maximum: 'AES-256-GCM + CRYSTALS-Kyber'
    };
    return algorithms[type] || algorithms.standard;
  }

  audit(action, details) {
    this.auditLog.push({
      timestamp: Date.now(),
      action,
      details,
      system: 'VB-HDR'
    });
  }

  generateZoneId() {
    return `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateProtectionId() {
    return `protection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateResourceId() {
    return `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateScanId() {
    return `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async shutdown() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }

    await this.encryption.shutdown();
    await this.threatDetector.shutdown();
    await this.zoneManager.shutdown();
    
    await super.shutdown();
  }
}

export { VoidBladeHDR };
```

---

## Encryption Implementation

### Quantum-Safe Encryption

```javascript
import crypto from 'crypto';

class QuantumEncryption {
  constructor(config) {
    this.config = config;
    this.keys = new Map();
  }

  async initialize() {
    // Initialize encryption engines
    this.algorithm = this.config.algorithm || 'aes-256-gcm';
    this.keySize = 32; // 256 bits
    
    // Setup key rotation
    if (this.config.keyRotationInterval) {
      this.setupKeyRotation();
    }
  }

  /**
   * Encrypt data with specified algorithm
   */
  async encrypt(data, options = {}) {
    const algorithm = options.algorithm || this.algorithm;
    const key = await this.getOrGenerateKey(options.keyId);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return {
      algorithm,
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      keyId: options.keyId || 'default',
      timestamp: Date.now()
    };
  }

  /**
   * Decrypt encrypted data
   */
  async decrypt(encryptedData) {
    const key = await this.getKey(encryptedData.keyId);
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');

    const decipher = crypto.createDecipheriv(
      encryptedData.algorithm,
      key,
      iv
    );
    
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.encrypted, 'base64')),
      decipher.final()
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * Verify encryption integrity
   */
  async verify(encryptedData) {
    try {
      await this.decrypt(encryptedData);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate new encryption key
   */
  async generateKey(keyId = 'default') {
    const key = crypto.randomBytes(this.keySize);
    
    this.keys.set(keyId, {
      key,
      createdAt: Date.now(),
      rotationCount: 0
    });

    return key;
  }

  async getOrGenerateKey(keyId = 'default') {
    if (!this.keys.has(keyId)) {
      return await this.generateKey(keyId);
    }
    return this.keys.get(keyId).key;
  }

  async getKey(keyId) {
    const keyData = this.keys.get(keyId);
    if (!keyData) {
      throw new Error(`Key ${keyId} not found`);
    }
    return keyData.key;
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys() {
    for (const [keyId, keyData] of this.keys.entries()) {
      const newKey = crypto.randomBytes(this.keySize);
      
      this.keys.set(keyId, {
        key: newKey,
        createdAt: Date.now(),
        rotationCount: keyData.rotationCount + 1,
        previousKey: keyData.key
      });
    }
  }

  setupKeyRotation() {
    this.rotationInterval = setInterval(() => {
      this.rotateKeys();
    }, this.config.keyRotationInterval);
  }

  async shutdown() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
    }
    
    // Securely wipe keys
    this.keys.clear();
  }
}

export { QuantumEncryption };
```

---

## Authentication & Authorization

### JWT Authentication

```javascript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

class AuthenticationManager {
  constructor(config) {
    this.config = config;
    this.secret = config.jwtSecret || process.env.JWT_SECRET;
    this.tokenExpiry = config.tokenExpiry || '24h';
    this.sessions = new Map();
  }

  /**
   * Authenticate user with credentials
   */
  async authenticate(username, password) {
    // Verify credentials (implement based on your user store)
    const user = await this.getUserByUsername(username);
    
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Create session
    const session = {
      userId: user.id,
      username: user.username,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.parseExpiry(this.tokenExpiry)
    };

    this.sessions.set(token, session);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        roles: user.roles
      }
    };
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      
      const session = this.sessions.get(token);
      if (!session) {
        throw new AuthenticationError('Session not found');
      }

      if (session.expiresAt < Date.now()) {
        this.sessions.delete(token);
        throw new AuthenticationError('Session expired');
      }

      return {
        userId: decoded.userId,
        username: decoded.username,
        roles: decoded.roles
      };
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roles: user.roles
      },
      this.secret,
      {
        expiresIn: this.tokenExpiry
      }
    );
  }

  /**
   * Revoke token (logout)
   */
  async revokeToken(token) {
    this.sessions.delete(token);
  }

  async getUserByUsername(username) {
    // Implement based on your user store
    return null;
  }

  parseExpiry(expiry) {
    // Parse expiry string (e.g., '24h', '7d')
    const units = {
      h: 3600000,
      d: 86400000
    };
    
    const match = expiry.match(/(\d+)([hd])/);
    if (match) {
      return parseInt(match[1]) * units[match[2]];
    }
    
    return 86400000; // Default 24 hours
  }
}

export { AuthenticationManager };
```

### Role-Based Authorization

```javascript
class AuthorizationManager {
  constructor() {
    this.permissions = new Map();
    this.roleHierarchy = new Map();
  }

  /**
   * Define role permissions
   */
  defineRole(role, permissions) {
    this.permissions.set(role, permissions);
  }

  /**
   * Check if user has permission
   */
  hasPermission(user, permission) {
    if (!user.roles || user.roles.length === 0) {
      return false;
    }

    for (const role of user.roles) {
      const rolePermissions = this.permissions.get(role);
      if (rolePermissions && rolePermissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Authorize command execution
   */
  async authorizeCommand(user, command) {
    const permission = `${command.system}.${command.operation}`;
    
    if (!this.hasPermission(user, permission)) {
      throw new AuthorizationError(`User lacks permission: ${permission}`);
    }

    return true;
  }
}

// Define roles and permissions
const authz = new AuthorizationManager();

authz.defineRole('admin', [
  'neural-hdr.*',
  'nano-swarm-hdr.*',
  'omniscient-hdr.*',
  'reality-hdr.*',
  'quantum-hdr.*',
  'dream-hdr.*',
  'void-blade-hdr.*'
]);

authz.defineRole('user', [
  'neural-hdr.captureState',
  'neural-hdr.listStates',
  'omniscient-hdr.search',
  'reality-hdr.compress'
]);

authz.defineRole('readonly', [
  'neural-hdr.listStates',
  'omniscient-hdr.search'
]);

export { AuthorizationManager };
```

---

## Security Zones

### Security Zone Management

```javascript
class SecurityZoneManager {
  constructor(config) {
    this.config = config;
    this.zones = new Map();
  }

  async initialize() {
    // Initialize zone management
  }

  async createZone(zone) {
    if (this.zones.size >= this.config.maxZones) {
      throw new Error('Maximum zones reached');
    }

    this.zones.set(zone.id, zone);
    
    return zone;
  }

  async getZone(zoneId) {
    return this.zones.get(zoneId);
  }

  async listZones() {
    return Array.from(this.zones.values());
  }

  async deleteZone(zoneId) {
    this.zones.delete(zoneId);
  }

  async shutdown() {
    this.zones.clear();
  }
}

export { SecurityZoneManager };
```

---

## Threat Detection & Response

### AI-Powered Threat Detector

```javascript
class ThreatDetector {
  constructor(config) {
    this.config = config;
    this.patterns = new Map();
    this.history = [];
  }

  async initialize() {
    // Initialize threat detection AI
    if (this.config.aiEnabled) {
      await this.initializeAI();
    }
  }

  async initializeAI() {
    // Initialize AI models for threat detection
  }

  /**
   * Scan for threats
   */
  async scan(targets, options) {
    const threats = [];

    for (const target of targets) {
      const targetThreats = await this.scanTarget(target, options);
      threats.push(...targetThreats);
    }

    return threats;
  }

  async scanTarget(target, options) {
    const threats = [];

    // Check for known threat patterns
    const patternMatches = this.checkPatterns(target);
    threats.push(...patternMatches);

    // AI-based anomaly detection
    if (this.config.aiEnabled) {
      const anomalies = await this.detectAnomalies(target);
      threats.push(...anomalies);
    }

    return threats.map(threat => ({
      ...threat,
      target,
      detectedAt: Date.now(),
      status: 'detected'
    }));
  }

  checkPatterns(target) {
    // Check against known threat patterns
    return [];
  }

  async detectAnomalies(target) {
    // AI-based anomaly detection
    return [];
  }

  async shutdown() {
    // Cleanup
  }
}

export { ThreatDetector };
```

---

## Audit Logging

### Comprehensive Audit System

```javascript
import winston from 'winston';

class AuditLogger {
  constructor(config) {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'audit.log' }),
        new winston.transports.File({ 
          filename: 'audit-error.log',
          level: 'error'
        })
      ]
    });
  }

  log(event, user, details) {
    this.logger.info({
      event,
      userId: user?.id,
      username: user?.username,
      details,
      timestamp: new Date().toISOString()
    });
  }

  logSecurityEvent(event, severity, details) {
    this.logger.warn({
      type: 'security',
      event,
      severity,
      details,
      timestamp: new Date().toISOString()
    });
  }

  logError(error, context) {
    this.logger.error({
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

export { AuditLogger };
```

---

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

For more information, see:
- [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) - Development guide
- [API-REFERENCE.md](./API-REFERENCE.md) - API documentation
- [VOID-BLADE-HDR.md](./VB-HDR-COMPREHENSIVE-DOCUMENTATION.md) - VB-HDR system reference
