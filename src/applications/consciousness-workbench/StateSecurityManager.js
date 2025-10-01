/**
 * HDR Empire Framework - State Security Manager
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 *
 * VB-HDR quantum security for consciousness state protection
 */

import EventEmitter from "events";
import VoidBladeHDR from "../../core/void-blade-hdr/VoidBladeHDR.js";

/**
 * State Security Manager
 *
 * Provides VB-HDR quantum-secured protection for consciousness
 * states with encryption, integrity verification, and access control
 */
class StateSecurityManager extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      securityLevel: config.securityLevel || "maximum",
      autoScale: config.autoScale !== false,
      encryptionEnabled: config.encryptionEnabled !== false,
      integrityChecks: config.integrityChecks !== false,
      ...config,
    };

    this.voidBlade = null;
    this.securityZones = new Map();
    this.securedStates = new Map();
    this.accessLog = [];

    this.initialized = false;
  }

  /**
   * Initialize security manager
   */
  async initialize() {
    try {
      this.voidBlade = new VoidBladeHDR();

      if (this.voidBlade.initialize) {
        await this.voidBlade.initialize();
      }

      // Create default security zone
      await this._createDefaultZone();

      this.initialized = true;
      this.emit("initialized");
    } catch (error) {
      throw new Error(
        `Security manager initialization failed: ${error.message}`
      );
    }
  }

  /**
   * Secure consciousness state
   * @param {Object} state - State to secure
   * @param {Object} options - Security options
   * @returns {Promise<Object>} Secured state
   */
  async secure(state, options = {}) {
    if (!this.initialized) {
      throw new Error("Security manager not initialized");
    }

    const {
      zoneId = "default",
      level = this.config.securityLevel,
      encrypt = this.config.encryptionEnabled,
    } = options;

    try {
      // Get or create security zone
      let zone = this.securityZones.get(zoneId);
      if (!zone) {
        zone = await this._createSecurityZone(zoneId, { level });
      }

      // Apply VB-HDR protection
      const protected = await this.voidBlade.protect(state, {
        zoneId: zone.id,
        level,
        perceptionLevel: "none",
        targetSelection: "intelligent",
      });

      // Encrypt if enabled
      let securedState = protected;
      if (encrypt) {
        securedState = this._encryptState(protected);
      }

      // Calculate integrity hash
      const integrityHash = this._calculateIntegrityHash(securedState);

      // Wrap with security metadata
      const secured = {
        id: state.id,
        type: "secured-consciousness-state",
        data: securedState,
        security: {
          zoneId: zone.id,
          level,
          encrypted: encrypt,
          integrityHash,
          securedAt: Date.now(),
        },
      };

      // Track secured state
      this.securedStates.set(state.id, {
        zoneId: zone.id,
        level,
        encrypted: encrypt,
        integrityHash,
        securedAt: Date.now(),
      });

      // Log access
      this._logAccess({
        type: "secure",
        stateId: state.id,
        level,
        timestamp: Date.now(),
      });

      this.emit("state-secured", {
        stateId: state.id,
        level,
        zoneId: zone.id,
      });

      return secured;
    } catch (error) {
      throw new Error(`State security failed: ${error.message}`);
    }
  }

  /**
   * Verify state security
   * @param {Object} securedState - Secured state to verify
   * @returns {Promise<Object>} Verification result
   */
  async verify(securedState) {
    try {
      const { id, data, security } = securedState;

      // Check if state is registered
      const metadata = this.securedStates.get(id);
      if (!metadata) {
        return {
          valid: false,
          reason: "State not found in security registry",
        };
      }

      // Verify integrity hash
      const currentHash = this._calculateIntegrityHash(data);
      if (currentHash !== security.integrityHash) {
        return {
          valid: false,
          reason: "Integrity hash mismatch - state may be tampered",
        };
      }

      // Verify with VB-HDR
      const vbResult = await this.voidBlade.verifyProtection(data);
      if (!vbResult.valid) {
        return {
          valid: false,
          reason: "VB-HDR protection verification failed",
        };
      }

      // Log verification
      this._logAccess({
        type: "verify",
        stateId: id,
        result: "success",
        timestamp: Date.now(),
      });

      return {
        valid: true,
        level: security.level,
        zoneId: security.zoneId,
        age: Date.now() - security.securedAt,
        encrypted: security.encrypted,
      };
    } catch (error) {
      return {
        valid: false,
        reason: error.message,
      };
    }
  }

  /**
   * Unsecure state (remove security)
   * @param {Object} securedState - Secured state
   * @returns {Promise<Object>} Unsecured state
   */
  async unsecure(securedState) {
    try {
      const { id, data, security } = securedState;

      // Verify first
      const verified = await this.verify(securedState);
      if (!verified.valid) {
        throw new Error(`State verification failed: ${verified.reason}`);
      }

      // Decrypt if needed
      let state = data;
      if (security.encrypted) {
        state = this._decryptState(data);
      }

      // Remove VB-HDR protection
      const unprotected = this._extractOriginalState(state);

      // Log access
      this._logAccess({
        type: "unsecure",
        stateId: id,
        timestamp: Date.now(),
      });

      this.emit("state-unsecured", { stateId: id });

      return unprotected;
    } catch (error) {
      throw new Error(`State unsecuring failed: ${error.message}`);
    }
  }

  /**
   * Create new security zone
   * @param {string} name - Zone name
   * @param {Object} config - Zone configuration
   * @returns {Promise<Object>} Created zone
   */
  async createZone(name, config = {}) {
    const { level = "high" } = config;

    try {
      const zone = await this.voidBlade.createSecurityZone({
        name,
        level,
        autoScale: this.config.autoScale,
        perceptionLevel: "none",
      });

      this.securityZones.set(zone.id, zone);
      this.emit("zone-created", { zoneId: zone.id, name });

      return zone;
    } catch (error) {
      throw new Error(`Zone creation failed: ${error.message}`);
    }
  }

  /**
   * Remove security zone
   * @param {string} zoneId - Zone identifier
   * @returns {Promise<void>}
   */
  async removeZone(zoneId) {
    if (zoneId === "default") {
      throw new Error("Cannot remove default security zone");
    }

    try {
      await this.voidBlade.removeSecurityZone(zoneId);
      this.securityZones.delete(zoneId);
      this.emit("zone-removed", { zoneId });
    } catch (error) {
      throw new Error(`Zone removal failed: ${error.message}`);
    }
  }

  /**
   * Get security statistics
   * @returns {Object} Security stats
   */
  getStatistics() {
    return {
      securedStates: this.securedStates.size,
      securityZones: this.securityZones.size,
      accessLogSize: this.accessLog.length,
      zones: Array.from(this.securityZones.values()).map((z) => ({
        id: z.id,
        name: z.name,
        level: z.level,
      })),
      recentAccess: this.accessLog.slice(-10),
    };
  }

  /**
   * Get access log
   * @param {Object} filters - Log filters
   * @returns {Array} Filtered access log
   */
  getAccessLog(filters = {}) {
    let log = this.accessLog;

    if (filters.stateId) {
      log = log.filter((entry) => entry.stateId === filters.stateId);
    }

    if (filters.type) {
      log = log.filter((entry) => entry.type === filters.type);
    }

    if (filters.since) {
      log = log.filter((entry) => entry.timestamp >= filters.since);
    }

    return log;
  }

  /**
   * Shutdown security manager
   */
  async shutdown() {
    // Remove all zones except default
    for (const zoneId of this.securityZones.keys()) {
      if (zoneId !== "default") {
        try {
          await this.removeZone(zoneId);
        } catch (error) {
          console.error(`Failed to remove zone ${zoneId}: ${error.message}`);
        }
      }
    }

    this.securedStates.clear();
    this.securityZones.clear();
    this.accessLog = [];

    this.initialized = false;
    this.emit("shutdown");
  }

  /**
   * Create default security zone
   * @private
   */
  async _createDefaultZone() {
    const zone = await this.voidBlade.createSecurityZone({
      name: "default",
      level: this.config.securityLevel,
      autoScale: this.config.autoScale,
      perceptionLevel: "none",
    });

    this.securityZones.set("default", zone);
  }

  /**
   * Create named security zone
   * @private
   */
  async _createSecurityZone(zoneId, config) {
    const zone = await this.voidBlade.createSecurityZone({
      name: zoneId,
      level: config.level || this.config.securityLevel,
      autoScale: this.config.autoScale,
      perceptionLevel: "none",
    });

    this.securityZones.set(zoneId, zone);
    return zone;
  }

  /**
   * Encrypt state
   * @private
   */
  _encryptState(state) {
    const serialized = JSON.stringify(state);
    return {
      encrypted: true,
      data: Buffer.from(serialized).toString("base64"),
      algorithm: "aes-256-gcm",
      timestamp: Date.now(),
    };
  }

  /**
   * Decrypt state
   * @private
   */
  _decryptState(encrypted) {
    if (!encrypted.encrypted) {
      return encrypted;
    }

    const serialized = Buffer.from(encrypted.data, "base64").toString("utf-8");
    return JSON.parse(serialized);
  }

  /**
   * Calculate integrity hash
   * @private
   */
  _calculateIntegrityHash(data) {
    const str = JSON.stringify(data);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return hash.toString(36);
  }

  /**
   * Extract original state from protected wrapper
   * @private
   */
  _extractOriginalState(state) {
    if (state && typeof state === "object" && state.protected) {
      return state.original || state.data || state;
    }
    return state;
  }

  /**
   * Log security access
   * @private
   */
  _logAccess(entry) {
    this.accessLog.push(entry);

    // Keep only last 10000 entries
    if (this.accessLog.length > 10000) {
      this.accessLog = this.accessLog.slice(-10000);
    }

    this.emit("access-logged", entry);
  }
}

export default StateSecurityManager;
