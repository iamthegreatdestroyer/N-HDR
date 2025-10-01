/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * SystemRegistry.js
 * Registry system for HDR subsystem management and discovery
 */

const VoidBladeHDR = require("../void-blade-hdr/VoidBladeHDR");
const crypto = require("crypto");

class SystemRegistry {
  constructor(config = {}) {
    this.security = new VoidBladeHDR(config.security);
    this.registeredSystems = new Map();
    this.systemTypes = new Set();
    this.registrationHistory = [];
    this.state = {
      initialized: false,
      secure: false,
    };
  }

  /**
   * Initialize registry
   * @param {Object} parameters Registry initialization parameters
   * @returns {Promise<Object>} Initialization status
   */
  async initialize(parameters) {
    try {
      await this._setupSecurity();
      await this._loadSystemTypes();

      this.state.initialized = true;
      this.state.secure = true;

      return {
        status: "initialized",
        types: this.systemTypes.size,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Registry initialization failed: ${error.message}`);
    }
  }

  /**
   * Register new HDR system
   * @param {Object} system System instance to register
   * @param {Object} metadata System metadata
   * @returns {Promise<Object>} Registration details
   */
  async register(system, metadata) {
    if (!this.state.initialized) {
      throw new Error("Registry not initialized");
    }

    try {
      await this._validateSystem(system);
      await this._validateMetadata(metadata);

      const registrationId = this._generateRegistrationId();
      const securityZone = await this._createSecurityZone(registrationId);

      const registration = {
        id: registrationId,
        type: metadata.type,
        version: metadata.version,
        capabilities: metadata.capabilities || [],
        security: {
          zoneId: securityZone.id,
          level: securityZone.level,
        },
        timestamp: Date.now(),
      };

      this.registeredSystems.set(registrationId, {
        system,
        metadata: { ...metadata, ...registration },
        status: "active",
      });

      this.systemTypes.add(metadata.type);
      this._recordRegistration(registration);

      return registration;
    } catch (error) {
      throw new Error(`System registration failed: ${error.message}`);
    }
  }

  /**
   * Get registered system
   * @param {string} systemId System ID
   * @returns {Promise<Object>} System details
   */
  async getSystem(systemId) {
    const registration = this.registeredSystems.get(systemId);
    if (!registration) {
      throw new Error(`System not found: ${systemId}`);
    }

    await this.security.verifyAccess(registration.metadata.security.zoneId);

    return {
      system: registration.system,
      metadata: registration.metadata,
      status: registration.status,
    };
  }

  /**
   * List registered systems
   * @param {Object} filter Optional filter criteria
   * @returns {Promise<Array>} List of registered systems
   */
  async listSystems(filter = {}) {
    const systems = Array.from(this.registeredSystems.entries())
      .filter(([_, reg]) => this._matchesFilter(reg, filter))
      .map(([id, reg]) => ({
        id,
        type: reg.metadata.type,
        version: reg.metadata.version,
        status: reg.status,
        capabilities: reg.metadata.capabilities,
      }));

    return systems;
  }

  /**
   * Update system metadata
   * @param {string} systemId System ID
   * @param {Object} updates Metadata updates
   * @returns {Promise<Object>} Updated registration
   */
  async updateMetadata(systemId, updates) {
    const registration = this.registeredSystems.get(systemId);
    if (!registration) {
      throw new Error(`System not found: ${systemId}`);
    }

    await this.security.verifyAccess(registration.metadata.security.zoneId);
    await this._validateMetadata(updates);

    const updated = {
      ...registration.metadata,
      ...updates,
      timestamp: Date.now(),
    };

    registration.metadata = updated;
    this._recordUpdate(systemId, updated);

    return updated;
  }

  /**
   * Deregister system
   * @param {string} systemId System ID
   * @returns {Promise<Object>} Deregistration status
   */
  async deregister(systemId) {
    const registration = this.registeredSystems.get(systemId);
    if (!registration) {
      throw new Error(`System not found: ${systemId}`);
    }

    await this.security.verifyAccess(registration.metadata.security.zoneId);
    await this.security.deactivateZone(registration.metadata.security.zoneId);

    this.registeredSystems.delete(systemId);
    this._recordDeregistration(systemId);

    return {
      id: systemId,
      status: "deregistered",
      timestamp: Date.now(),
    };
  }

  /**
   * Get registered system count
   * @returns {Promise<number>} Number of registered systems
   */
  async getRegisteredCount() {
    return this.registeredSystems.size;
  }

  /**
   * Get system types
   * @returns {Promise<Array>} List of system types
   */
  async getSystemTypes() {
    return Array.from(this.systemTypes);
  }

  /**
   * Set up registry security
   * @private
   */
  async _setupSecurity() {
    const zone = await this.security.createSecurityZone({
      type: "system-registry",
      level: "maximum",
    });

    await this.security.activateBarrier(zone.id, {
      type: "quantum",
      strength: "maximum",
    });
  }

  /**
   * Load system types
   * @private
   */
  async _loadSystemTypes() {
    // Load predefined system types
    const coreTypes = ["neural-hdr", "reality-hdr", "void-blade-hdr"];
    coreTypes.forEach((type) => this.systemTypes.add(type));
  }

  /**
   * Validate system instance
   * @private
   * @param {Object} system System to validate
   */
  async _validateSystem(system) {
    const requiredMethods = ["initialize", "execute"];
    for (const method of requiredMethods) {
      if (typeof system[method] !== "function") {
        throw new Error(`System must implement ${method} method`);
      }
    }
  }

  /**
   * Validate system metadata
   * @private
   * @param {Object} metadata Metadata to validate
   */
  async _validateMetadata(metadata) {
    const required = ["type", "version"];
    for (const field of required) {
      if (!metadata[field]) {
        throw new Error(`Missing required metadata field: ${field}`);
      }
    }
  }

  /**
   * Generate unique registration ID
   * @private
   * @returns {string} Registration ID
   */
  _generateRegistrationId() {
    return crypto.randomUUID();
  }

  /**
   * Create security zone for system
   * @private
   * @param {string} registrationId Registration ID
   * @returns {Promise<Object>} Security zone details
   */
  async _createSecurityZone(registrationId) {
    return await this.security.createSecurityZone({
      type: "registered-system",
      systemId: registrationId,
      level: "maximum",
    });
  }

  /**
   * Record system registration
   * @private
   * @param {Object} registration Registration details
   */
  _recordRegistration(registration) {
    this.registrationHistory.push({
      type: "register",
      registration,
      timestamp: Date.now(),
    });
  }

  /**
   * Record metadata update
   * @private
   * @param {string} systemId System ID
   * @param {Object} metadata Updated metadata
   */
  _recordUpdate(systemId, metadata) {
    this.registrationHistory.push({
      type: "update",
      systemId,
      metadata,
      timestamp: Date.now(),
    });
  }

  /**
   * Record system deregistration
   * @private
   * @param {string} systemId System ID
   */
  _recordDeregistration(systemId) {
    this.registrationHistory.push({
      type: "deregister",
      systemId,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if registration matches filter
   * @private
   * @param {Object} registration System registration
   * @param {Object} filter Filter criteria
   * @returns {boolean} Whether registration matches filter
   */
  _matchesFilter(registration, filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (registration.metadata[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get registry status
   * @returns {Object} Registry status
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      secure: this.state.secure,
      systems: this.registeredSystems.size,
      types: this.systemTypes.size,
      timestamp: Date.now(),
    };
  }
}

module.exports = SystemRegistry;
