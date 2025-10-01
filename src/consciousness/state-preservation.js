/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * STATE PRESERVATION
 * Manages the preservation and restoration of consciousness layer states with
 * quantum-secured temporal snapshots and integrity verification.
 */

import crypto from "crypto";
import { VanishingKeyManager } from "../quantum/vanishing-key-manager.js";
import { SecureTaskExecution } from "../quantum/secure-task-execution.js";

/**
 * @class StatePreservation
 * @description Handles preservation and restoration of consciousness states
 * @copyright © 2025 Stephen Bilodeau - PATENT PENDING
 * @license PROPRIETARY
 */
class StatePreservation {
  /**
   * Creates a new StatePreservation instance
   * @param {Object} options - Configuration options
   * @param {number} options.temporalResolution - Milliseconds between state snapshots
   * @param {number} options.maxSnapshots - Maximum number of snapshots to maintain
   * @param {number} options.integrityCheckInterval - Milliseconds between integrity checks
   */
  constructor(options = {}) {
    this.options = {
      temporalResolution: options.temporalResolution || 1000,
      maxSnapshots: options.maxSnapshots || 1000,
      integrityCheckInterval: options.integrityCheckInterval || 5000,
    };

    this.snapshots = new Map();
    this.snapshotTimestamps = [];
    this.integrityHashes = new Map();
    this.lastIntegrityCheck = Date.now();

    // Initialize security components
    this.keyManager = new VanishingKeyManager();
    this.secureExecution = new SecureTaskExecution();

    // Start integrity checking
    this._startIntegrityChecks();
  }

  /**
   * Preserve consciousness layer state
   * @param {string} layerId - Consciousness layer identifier
   * @param {Object} state - Layer state to preserve
   * @returns {Promise<string>} Snapshot identifier
   */
  async preserveState(layerId, state) {
    const timestamp = Date.now();
    const snapshotId = `${layerId}-${timestamp}`;

    try {
      // Secure the state data
      const securedState = await this._secureState(state);

      // Create temporal snapshot
      const snapshot = {
        id: snapshotId,
        layerId,
        timestamp,
        state: securedState,
        metadata: {
          nodes: state.nodes.length,
          connections: state.connections.length,
          emergenceScore: state.emergenceScore,
        },
      };

      // Calculate integrity hash
      const hash = this._calculateIntegrityHash(snapshot);

      // Store snapshot and hash
      this.snapshots.set(snapshotId, snapshot);
      this.integrityHashes.set(snapshotId, hash);
      this.snapshotTimestamps.push(timestamp);

      // Maintain snapshot limit
      await this._pruneSnapshots();

      return snapshotId;
    } catch (error) {
      throw new Error(`Failed to preserve state: ${error.message}`);
    }
  }

  /**
   * Restore consciousness layer state
   * @param {string} snapshotId - Snapshot identifier
   * @returns {Promise<Object>} Restored state
   * @throws {Error} If snapshot not found or integrity check fails
   */
  async restoreState(snapshotId) {
    if (!this.snapshots.has(snapshotId)) {
      throw new Error("Snapshot not found");
    }

    try {
      const snapshot = this.snapshots.get(snapshotId);

      // Verify integrity
      if (!this._verifyIntegrity(snapshot)) {
        throw new Error("Snapshot integrity verification failed");
      }

      // Restore secured state
      const restoredState = await this._restoreSecuredState(snapshot.state);

      return {
        ...restoredState,
        _restored: {
          timestamp: snapshot.timestamp,
          metadata: snapshot.metadata,
        },
      };
    } catch (error) {
      throw new Error(`Failed to restore state: ${error.message}`);
    }
  }

  /**
   * Get list of available snapshots
   * @param {string} [layerId] - Optional layer ID to filter by
   * @returns {Array<Object>} List of snapshot metadata
   */
  getSnapshots(layerId) {
    const snapshots = Array.from(this.snapshots.values())
      .filter((s) => !layerId || s.layerId === layerId)
      .map((s) => ({
        id: s.id,
        layerId: s.layerId,
        timestamp: s.timestamp,
        metadata: s.metadata,
      }));

    return snapshots.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Verify integrity of all snapshots
   * @returns {Promise<Object>} Verification results
   */
  async verifyAllSnapshots() {
    const results = {
      total: this.snapshots.size,
      verified: 0,
      failed: 0,
      failures: [],
    };

    for (const [id, snapshot] of this.snapshots) {
      if (this._verifyIntegrity(snapshot)) {
        results.verified++;
      } else {
        results.failed++;
        results.failures.push(id);
      }
    }

    return results;
  }

  /**
   * Secure state data using quantum-resistant encryption
   * @private
   * @param {Object} state - State to secure
   * @returns {Promise<Object>} Secured state
   */
  async _secureState(state) {
    const key = await this.keyManager.generateKey();

    return await this.secureExecution.execute(async () => {
      // Serialize state
      const serialized = JSON.stringify(state);

      // Generate IV
      const iv = crypto.randomBytes(12);

      // Create cipher
      const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

      // Encrypt data
      let encrypted = cipher.update(serialized, "utf8", "base64");
      encrypted += cipher.final("base64");

      // Get auth tag
      const authTag = cipher.getAuthTag();

      return {
        data: encrypted,
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
        keyId: await this.keyManager.storeKey(key),
      };
    });
  }

  /**
   * Restore secured state data
   * @private
   * @param {Object} securedState - Secured state to restore
   * @returns {Promise<Object>} Restored state
   */
  async _restoreSecuredState(securedState) {
    const key = await this.keyManager.retrieveKey(securedState.keyId);

    return await this.secureExecution.execute(async () => {
      // Decode components
      const iv = Buffer.from(securedState.iv, "base64");
      const authTag = Buffer.from(securedState.authTag, "base64");

      // Create decipher
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decrypted = decipher.update(securedState.data, "base64", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    });
  }

  /**
   * Calculate integrity hash for snapshot
   * @private
   * @param {Object} snapshot - Snapshot to hash
   * @returns {string} Integrity hash
   */
  _calculateIntegrityHash(snapshot) {
    const hash = crypto.createHash("sha3-256");

    // Hash components in deterministic order
    hash.update(snapshot.id);
    hash.update(snapshot.layerId);
    hash.update(snapshot.timestamp.toString());
    hash.update(JSON.stringify(snapshot.metadata));
    hash.update(JSON.stringify(snapshot.state));

    return hash.digest("base64");
  }

  /**
   * Verify snapshot integrity
   * @private
   * @param {Object} snapshot - Snapshot to verify
   * @returns {boolean} True if integrity check passes
   */
  _verifyIntegrity(snapshot) {
    const storedHash = this.integrityHashes.get(snapshot.id);
    if (!storedHash) return false;

    const currentHash = this._calculateIntegrityHash(snapshot);
    return storedHash === currentHash;
  }

  /**
   * Start periodic integrity checks
   * @private
   */
  _startIntegrityChecks() {
    setInterval(async () => {
      const now = Date.now();
      if (
        now - this.lastIntegrityCheck >=
        this.options.integrityCheckInterval
      ) {
        await this.verifyAllSnapshots();
        this.lastIntegrityCheck = now;
      }
    }, this.options.integrityCheckInterval);
  }

  /**
   * Prune old snapshots to maintain size limit
   * @private
   */
  async _pruneSnapshots() {
    while (this.snapshotTimestamps.length > this.options.maxSnapshots) {
      const oldestTimestamp = this.snapshotTimestamps.shift();
      const oldestSnapshot = Array.from(this.snapshots.values()).find(
        (s) => s.timestamp === oldestTimestamp
      );

      if (oldestSnapshot) {
        this.snapshots.delete(oldestSnapshot.id);
        this.integrityHashes.delete(oldestSnapshot.id);

        // Clean up associated keys
        try {
          await this.keyManager.deleteKey(oldestSnapshot.state.keyId);
        } catch (error) {
          console.warn(
            `Failed to delete key for snapshot ${oldestSnapshot.id}`
          );
        }
      }
    }
  }
}

export default StatePreservation;
