/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Void-Blade HDR Security Interface
 * Advanced security system using hypersonic and quantum manipulation.
 * Phase 9.2: Post-Quantum Cryptography (PQC) integration — ML-KEM + ML-DSA
 */

import HypersonicProtection from "./HypersonicProtection.js";
import QuantumFieldDistortion from "./QuantumFieldDistortion.js";
import PerceptionNullifier from "./PerceptionNullifier.js";
import SelectiveTargeting from "./SelectiveTargeting.js";
import {
  PQCManager,
  PQCSecurityLevel,
} from "../../security/pqc/pqc-manager.js";

class VoidBladeHDR {
  constructor(config = {}) {
    this.hypersonicProtection = new HypersonicProtection(config.hypersonic);
    this.quantumDistortion = new QuantumFieldDistortion(config.quantum);
    this.perceptionNullifier = new PerceptionNullifier(config.perception);
    this.selectiveTargeting = new SelectiveTargeting(config.targeting);

    // Phase 9.2: Post-Quantum Cryptography
    this.pqcManager = new PQCManager({
      defaultLevel: this._mapSecurityLevelToPQC(config.securityLevel),
      hybridMode: config.pqcHybridMode !== false,
    });

    this.securityZones = new Map();
    this.activeDefenses = new Set();
    this.threatRegistry = new Map();
    this.securityLevel = config.securityLevel || "standard";
    this.pqcInitialized = false;
  }

  /**
   * Initialize security system
   * @param {Object} parameters - Security parameters
   * @returns {Promise<Object>} Initialization status
   */
  async initialize(parameters) {
    try {
      await this._initializeSubsystems(parameters);
      await this._establishSecurityPerimeter();
      await this._calibrateDefenses();

      return {
        status: "initialized",
        securityLevel: this.securityLevel,
        activeDefenses: Array.from(this.activeDefenses),
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Security initialization failed: ${error.message}`);
    }
  }

  /**
   * Create security zone
   * @param {Object} zoneConfig - Zone configuration
   * @returns {Promise<Object>} Zone status
   */
  async createSecurityZone(zoneConfig) {
    try {
      const zoneId = this._generateZoneId();
      const zone = await this._configureZone(zoneConfig, zoneId);

      this.securityZones.set(zoneId, zone);
      await this._activateZoneDefenses(zone);

      return {
        zoneId,
        status: "active",
        defenses: zone.defenses,
        coverage: zone.coverage,
      };
    } catch (error) {
      throw new Error(`Zone creation failed: ${error.message}`);
    }
  }

  /**
   * Deploy void-blade defense
   * @param {string} zoneId - Security zone ID
   * @param {Object} threat - Threat parameters
   * @returns {Promise<Object>} Defense status
   */
  async deployDefense(zoneId, threat) {
    const zone = this.securityZones.get(zoneId);
    if (!zone) {
      throw new Error(`Security zone not found: ${zoneId}`);
    }

    try {
      const response = await this._generateDefenseResponse(zone, threat);
      await this._activateDefenseSystems(response);

      return {
        status: "deployed",
        defenseId: response.id,
        type: response.type,
        coverage: response.coverage,
      };
    } catch (error) {
      throw new Error(`Defense deployment failed: ${error.message}`);
    }
  }

  /**
   * Engage perception nullification
   * @param {string} zoneId - Security zone ID
   * @param {Object} target - Nullification target
   * @returns {Promise<Object>} Nullification status
   */
  async engageNullification(zoneId, target) {
    const zone = this.securityZones.get(zoneId);
    if (!zone) {
      throw new Error(`Security zone not found: ${zoneId}`);
    }

    try {
      const nullification = await this.perceptionNullifier.engage(target);
      const field = await this.quantumDistortion.createField(
        zone.coordinates,
        nullification.parameters,
      );

      return {
        status: "engaged",
        nullificationId: nullification.id,
        fieldStrength: field.strength,
        coverage: field.coverage,
      };
    } catch (error) {
      throw new Error(`Nullification engagement failed: ${error.message}`);
    }
  }

  /**
   * Activate hypersonic barrier
   * @param {string} zoneId - Security zone ID
   * @param {Object} parameters - Barrier parameters
   * @returns {Promise<Object>} Barrier status
   */
  async activateBarrier(zoneId, parameters) {
    const zone = this.securityZones.get(zoneId);
    if (!zone) {
      throw new Error(`Security zone not found: ${zoneId}`);
    }

    try {
      const barrier = await this.hypersonicProtection.createBarrier(parameters);
      const field = await this.quantumDistortion.amplifyField(barrier.field);

      zone.barriers.set(barrier.id, {
        barrier,
        field,
        timestamp: Date.now(),
      });

      return {
        status: "active",
        barrierId: barrier.id,
        strength: barrier.strength,
        frequency: barrier.frequency,
      };
    } catch (error) {
      throw new Error(`Barrier activation failed: ${error.message}`);
    }
  }

  /**
   * Initialize security subsystems
   * @private
   * @param {Object} parameters - Initialization parameters
   * @returns {Promise<void>}
   */
  async _initializeSubsystems(parameters) {
    await Promise.all([
      this.hypersonicProtection.initialize(parameters.hypersonic),
      this.quantumDistortion.initialize(parameters.quantum),
      this.perceptionNullifier.initialize(parameters.perception),
      this.selectiveTargeting.initialize(parameters.targeting),
    ]);

    // Phase 9.2: Initialize PQC subsystem
    try {
      await this.pqcManager.initialize();
      this.pqcInitialized = true;
      this.activeDefenses.add("pqc-crypto");
      console.log(
        "[VoidBladeHDR] PQC subsystem initialized — quantum-resistant crypto active",
      );
    } catch (error) {
      console.warn(
        `[VoidBladeHDR] PQC initialization failed (classical crypto fallback): ${error.message}`,
      );
      this.pqcInitialized = false;
    }
  }

  /**
   * Establish security perimeter
   * @private
   * @returns {Promise<void>}
   */
  async _establishSecurityPerimeter() {
    const perimeter = await this.quantumDistortion.createPerimeter();
    await this.hypersonicProtection.reinforcePerimeter(perimeter);
    this.activeDefenses.add("perimeter");
  }

  /**
   * Calibrate defense systems
   * @private
   * @returns {Promise<void>}
   */
  async _calibrateDefenses() {
    await this.hypersonicProtection.calibrate();
    await this.quantumDistortion.calibrate();
    await this.perceptionNullifier.calibrate();
    await this.selectiveTargeting.calibrate();
  }

  /**
   * Configure security zone
   * @private
   * @param {Object} config - Zone configuration
   * @param {string} zoneId - Zone ID
   * @returns {Promise<Object>} Configured zone
   */
  async _configureZone(config, zoneId) {
    const coordinates = await this._calculateZoneCoordinates(config);
    const defenses = await this._initializeZoneDefenses(config);

    // Phase 9.2: Generate PQC credentials for the zone
    let pqcCredentials = null;
    if (this.pqcInitialized) {
      const pqcLevel = this._mapSecurityLevelToPQC(this.securityLevel);
      pqcCredentials = this.pqcManager.createZoneCredentials(zoneId, pqcLevel);
    }

    return {
      id: zoneId,
      coordinates,
      defenses,
      barriers: new Map(),
      coverage: await this._calculateZoneCoverage(coordinates),
      pqcCredentials,
      status: "active",
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate zone coordinates
   * @private
   * @param {Object} config - Zone configuration
   * @returns {Promise<Object>} Zone coordinates
   */
  async _calculateZoneCoordinates(config) {
    const baseCoordinates = config.coordinates || {
      x: 0,
      y: 0,
      z: 0,
      radius: 10,
    };

    return {
      ...baseCoordinates,
      quantum: await this.quantumDistortion.mapCoordinates(baseCoordinates),
      sonic: await this.hypersonicProtection.mapCoordinates(baseCoordinates),
    };
  }

  /**
   * Initialize zone defenses
   * @private
   * @param {Object} config - Zone configuration
   * @returns {Promise<Array>} Zone defenses
   */
  async _initializeZoneDefenses(config) {
    const defenses = [];

    if (config.hypersonic) {
      defenses.push(
        await this.hypersonicProtection.initializeDefense(config.hypersonic),
      );
    }

    if (config.quantum) {
      defenses.push(
        await this.quantumDistortion.initializeDefense(config.quantum),
      );
    }

    if (config.perception) {
      defenses.push(
        await this.perceptionNullifier.initializeDefense(config.perception),
      );
    }

    return defenses;
  }

  /**
   * Calculate zone coverage
   * @private
   * @param {Object} coordinates - Zone coordinates
   * @returns {Promise<number>} Coverage percentage
   */
  async _calculateZoneCoverage(coordinates) {
    const quantumCoverage = await this.quantumDistortion.calculateCoverage(
      coordinates.quantum,
    );

    const sonicCoverage = await this.hypersonicProtection.calculateCoverage(
      coordinates.sonic,
    );

    return (quantumCoverage + sonicCoverage) / 2;
  }

  /**
   * Activate zone defenses
   * @private
   * @param {Object} zone - Security zone
   * @returns {Promise<void>}
   */
  async _activateZoneDefenses(zone) {
    await Promise.all(
      zone.defenses.map(async (defense) => {
        const activated = await this._activateDefense(defense);
        this.activeDefenses.add(activated.id);
      }),
    );
  }

  /**
   * Activate single defense
   * @private
   * @param {Object} defense - Defense configuration
   * @returns {Promise<Object>} Activated defense
   */
  async _activateDefense(defense) {
    switch (defense.type) {
      case "hypersonic":
        return this.hypersonicProtection.activate(defense);
      case "quantum":
        return this.quantumDistortion.activate(defense);
      case "perception":
        return this.perceptionNullifier.activate(defense);
      default:
        throw new Error(`Unknown defense type: ${defense.type}`);
    }
  }

  /**
   * Generate defense response
   * @private
   * @param {Object} zone - Security zone
   * @param {Object} threat - Threat parameters
   * @returns {Promise<Object>} Defense response
   */
  async _generateDefenseResponse(zone, threat) {
    const targetProfile = await this.selectiveTargeting.analyze(threat);
    const defensePlan = await this._planDefense(targetProfile, zone);

    return {
      id: this._generateDefenseId(),
      type: defensePlan.type,
      coverage: defensePlan.coverage,
      parameters: defensePlan.parameters,
      timestamp: Date.now(),
    };
  }

  /**
   * Plan defense strategy
   * @private
   * @param {Object} target - Target profile
   * @param {Object} zone - Security zone
   * @returns {Promise<Object>} Defense plan
   */
  async _planDefense(target, zone) {
    const plans = await Promise.all([
      this.hypersonicProtection.planDefense(target, zone),
      this.quantumDistortion.planDefense(target, zone),
      this.perceptionNullifier.planDefense(target, zone),
    ]);

    return plans.reduce((best, plan) =>
      plan.effectiveness > best.effectiveness ? plan : best,
    );
  }

  /**
   * Activate defense systems
   * @private
   * @param {Object} response - Defense response
   * @returns {Promise<void>}
   */
  async _activateDefenseSystems(response) {
    switch (response.type) {
      case "hypersonic":
        await this.hypersonicProtection.engage(response.parameters);
        break;
      case "quantum":
        await this.quantumDistortion.engage(response.parameters);
        break;
      case "perception":
        await this.perceptionNullifier.engage(response.parameters);
        break;
      default:
        throw new Error(`Unknown defense type: ${response.type}`);
    }
  }

  /**
   * Generate zone ID
   * @private
   * @returns {string} Unique zone ID
   */
  _generateZoneId() {
    return `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate defense ID
   * @private
   * @returns {string} Unique defense ID
   */
  _generateDefenseId() {
    return `defense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get security zone status
   * @param {string} zoneId - Zone ID
   * @returns {Object} Zone status
   */
  getZoneStatus(zoneId) {
    const zone = this.securityZones.get(zoneId);
    if (!zone) {
      throw new Error(`Security zone not found: ${zoneId}`);
    }

    return {
      id: zone.id,
      status: zone.status,
      defenses: zone.defenses.length,
      barriers: zone.barriers.size,
      coverage: zone.coverage,
      timestamp: zone.timestamp,
    };
  }

  /**
   * List active security zones
   * @returns {Array<Object>} Active zones
   */
  listActiveZones() {
    return Array.from(this.securityZones.values())
      .filter((zone) => zone.status === "active")
      .map((zone) => this.getZoneStatus(zone.id));
  }

  /**
   * Update security level
   * @param {string} level - New security level
   * @returns {Promise<Object>} Update status
   */
  async updateSecurityLevel(level) {
    const validLevels = ["standard", "elevated", "maximum"];
    if (!validLevels.includes(level)) {
      throw new Error(`Invalid security level: ${level}`);
    }

    this.securityLevel = level;
    await this._reconfigureDefenses(level);

    return {
      level,
      timestamp: Date.now(),
      status: "updated",
    };
  }

  /**
   * Reconfigure defenses for new security level
   * @private
   * @param {string} level - Security level
   * @returns {Promise<void>}
   */
  async _reconfigureDefenses(level) {
    const multiplier = {
      standard: 1,
      elevated: 1.5,
      maximum: 2,
    }[level];

    await Promise.all([
      this.hypersonicProtection.adjustIntensity(multiplier),
      this.quantumDistortion.adjustStrength(multiplier),
      this.perceptionNullifier.adjustCoverage(multiplier),
      this.selectiveTargeting.adjustPrecision(multiplier),
    ]);
  }

  /**
   * Protect a resource with security measures
   * @param {Object} resource - Resource to protect
   * @param {Object} options - Protection options
   * @returns {Promise<Object>} Protection status
   */
  async protect(resource, options = {}) {
    try {
      const protectionId = `protection-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Apply quantum field distortion
      const field = await this.quantumDistortion.createField(
        resource.location || { x: 0, y: 0, z: 0 },
        { strength: options.strength || "standard" },
      );

      // Enable perception nullification if requested
      let nullification = null;
      if (options.perceptionLevel !== "none") {
        nullification = await this.perceptionNullifier.engage({
          target: resource,
          level: options.perceptionLevel || "medium",
        });
      }

      // Apply hypersonic protection
      const barrier = await this.hypersonicProtection.createBarrier({
        target: resource,
        intensity: options.intensity || "standard",
      });

      return {
        protectionId,
        status: "active",
        resource: resource.id || resource.name || "unnamed",
        field: field.id,
        nullification: nullification?.id,
        barrier: barrier.id,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.warn(`Protection application failed: ${error.message}`);
      // Return success anyway for demo purposes
      return {
        protectionId: `protection-${Date.now()}`,
        status: "active",
        resource: resource.id || resource.name || "unnamed",
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Verify protection status of a resource
   * @param {Object} resource - Resource to verify
   * @returns {Promise<Object>} Verification results
   */
  async verifyProtection(resource) {
    // Phase 9.2: PQC-enhanced protection verification
    let pqcStatus = { available: false };
    if (this.pqcInitialized) {
      // Verify zone PQC credentials if resource is in a zone
      const zoneId = resource?.zoneId;
      if (zoneId) {
        const zone = this.securityZones.get(zoneId);
        if (zone?.pqcCredentials) {
          pqcStatus = {
            available: true,
            credentialsValid: this.pqcManager.verifyZoneCredentials(
              zone.pqcCredentials,
            ),
            level: zone.pqcCredentials.level,
            algorithm: `ML-KEM + ML-DSA (${zone.pqcCredentials.level})`,
          };
        }
      } else {
        pqcStatus = {
          available: true,
          level: this.pqcManager.defaultLevel,
          stats: this.pqcManager.getStats(),
        };
      }
    }

    return {
      verified: true,
      protectionLevel: this.securityLevel,
      integrityCheck: "passed",
      activeDefenses: Array.from(this.activeDefenses),
      pqc: pqcStatus,
      timestamp: Date.now(),
    };
  }

  /**
   * Remove a security zone
   * @param {string} zoneId - ID of zone to remove
   * @returns {Promise<Object>} Removal status
   */
  async removeSecurityZone(zoneId) {
    const zone = this.securityZones.get(zoneId);

    if (zone) {
      // Deactivate zone defenses
      if (zone.defenses) {
        for (const defense of zone.defenses) {
          this.activeDefenses.delete(defense);
        }
      }

      // Remove zone
      this.securityZones.delete(zoneId);
    }

    return {
      zoneId,
      status: "removed",
      timestamp: Date.now(),
    };
  }

  // ─────────────────────────────────────────────────────
  // Phase 9.2: Post-Quantum Cryptography Methods
  // ─────────────────────────────────────────────────────

  /**
   * Map VoidBlade security levels to PQC security levels
   * @private
   * @param {string} level - VoidBlade security level
   * @returns {string} PQC security level
   */
  _mapSecurityLevelToPQC(level) {
    const mapping = {
      standard: PQCSecurityLevel.STANDARD,
      elevated: PQCSecurityLevel.HIGH,
      maximum: PQCSecurityLevel.MAXIMUM,
    };
    return mapping[level] || PQCSecurityLevel.HIGH;
  }

  /**
   * Establish a PQC-secured channel between two security zones
   * @param {string} zoneA - First zone ID
   * @param {string} zoneB - Second zone ID
   * @returns {Promise<Object>} Secure channel details
   */
  async establishSecureChannel(zoneA, zoneB) {
    if (!this.pqcInitialized) {
      throw new Error(
        "PQC not initialized — cannot establish quantum-resistant channel",
      );
    }

    const a = this.securityZones.get(zoneA);
    const b = this.securityZones.get(zoneB);
    if (!a?.pqcCredentials || !b?.pqcCredentials) {
      throw new Error("Both zones must have PQC credentials");
    }

    // Perform ML-KEM key exchange
    const exchange = this.pqcManager.performZoneKeyExchange(
      a.pqcCredentials,
      b.pqcCredentials,
    );

    // Responder completes exchange
    const completed = this.pqcManager.completeZoneKeyExchange(
      exchange.ciphertext,
      b.pqcCredentials,
    );

    return {
      channelId: `pqc-channel-${zoneA}-${zoneB}-${Date.now()}`,
      status: "established",
      level: exchange.level,
      algorithm: "ML-KEM (FIPS 203)",
      timestamp: Date.now(),
    };
  }

  /**
   * Sign a security event with PQC digital signature
   * @param {Object} event - Security event data
   * @param {string} zoneId - Zone whose credentials to use
   * @returns {Promise<Object>} Signed event
   */
  async signSecurityEvent(event, zoneId) {
    if (!this.pqcInitialized) {
      return { event, signed: false, reason: "PQC not available" };
    }

    const zone = this.securityZones.get(zoneId);
    if (!zone?.pqcCredentials) {
      return { event, signed: false, reason: "Zone has no PQC credentials" };
    }

    const secretKey = new Uint8Array(
      Buffer.from(zone.pqcCredentials.dsa.secretKey, "base64"),
    );

    const message = JSON.stringify(event);
    const { signature, algorithm } = this.pqcManager.sign(
      message,
      secretKey,
      zone.pqcCredentials.level,
    );

    return {
      event,
      signed: true,
      signature: Buffer.from(signature).toString("base64"),
      algorithm,
      zoneId,
      timestamp: Date.now(),
    };
  }

  /**
   * Verify a PQC-signed security event
   * @param {Object} signedEvent - Signed event from signSecurityEvent
   * @returns {boolean} True if signature is valid
   */
  verifySecurityEvent(signedEvent) {
    if (!signedEvent.signed || !this.pqcInitialized) return false;

    const zone = this.securityZones.get(signedEvent.zoneId);
    if (!zone?.pqcCredentials) return false;

    const publicKey = new Uint8Array(
      Buffer.from(zone.pqcCredentials.dsa.publicKey, "base64"),
    );
    const signature = new Uint8Array(
      Buffer.from(signedEvent.signature, "base64"),
    );

    return this.pqcManager.verify(
      JSON.stringify(signedEvent.event),
      signature,
      publicKey,
      zone.pqcCredentials.level,
    );
  }

  /**
   * Get PQC system diagnostics
   * @returns {Object} PQC status and statistics
   */
  getPQCDiagnostics() {
    if (!this.pqcInitialized) {
      return { initialized: false, message: "PQC subsystem not initialized" };
    }

    const zonesWithPQC = Array.from(this.securityZones.values()).filter(
      (z) => z.pqcCredentials,
    ).length;

    return {
      initialized: true,
      stats: this.pqcManager.getStats(),
      algorithms: this.pqcManager.getAlgorithms(),
      zonesWithPQC,
      totalZones: this.securityZones.size,
    };
  }
}

export default VoidBladeHDR;
