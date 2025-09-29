/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * VANISHING KEY MANAGER
 * This component provides quantum-secured key management with time-based dissolution
 * for protecting sensitive consciousness data and system operations.
 */

const crypto = require('crypto');
const QuantumEntropyGenerator = require('./quantum-entropy-generator');

/**
 * @class VanishingKeyManager
 * @description Manages time-limited cryptographic keys with quantum security and automatic dissolution
 * @copyright © 2025 Stephen Bilodeau - PATENT PENDING
 * @license PROPRIETARY
 */
class VanishingKeyManager {
  /**
   * Creates a new VanishingKeyManager instance
   * @param {QuantumEntropyGenerator} entropyGenerator - Quantum entropy source
   */
  constructor(entropyGenerator) {
    this.entropyGenerator = entropyGenerator || new QuantumEntropyGenerator();
    this.activeKeys = new Map();
    this.dissolveInterval = 5000; // 5 seconds
    
    // Initialize dissolution timer
    this.dissolveTimer = setInterval(() => this._processDissolvedKeys(), this.dissolveInterval);
  }
  
  /**
   * Generate a new vanishing key
   * @param {Buffer|string} data - Data to generate key from
   * @param {number} lifetime - Key lifetime in milliseconds
   * @returns {Object} Key object with id and expiration
   */
  generateKey(data, lifetime) {
    // Generate quantum-secured key material
    const keyMaterial = this.entropyGenerator.getRandomBytes(32);
    const salt = this.entropyGenerator.getRandomBytes(16);
    
    // Create unique key ID using quantum hash
    const keyId = this.entropyGenerator.generateQuantumHash(
      Buffer.concat([keyMaterial, salt])
    ).toString('hex');
    
    // Calculate dissolution parameters
    const dissolveRate = this._calculateDissolveRate(data);
    const expirationTime = Date.now() + lifetime;
    
    // Generate the actual encryption key
    const key = crypto.pbkdf2Sync(
      keyMaterial,
      salt,
      100000, // High iteration count for quantum resistance
      32,
      'sha512'
    );
    
    // Store key details
    this.activeKeys.set(keyId, {
      key,
      salt,
      created: Date.now(),
      expiration: expirationTime,
      dissolveRate,
      dissolveProgress: 0,
      dissolved: false
    });
    
    return {
      id: keyId,
      expiration: expirationTime
    };
  }
  
  /**
   * Verify if a key is valid and retrieve it
   * @param {string} keyId - ID of key to verify
   * @returns {Buffer|null} Key if valid, null if dissolved or invalid
   */
  verifyKey(keyId) {
    const keyInfo = this.activeKeys.get(keyId);
    if (!keyInfo || keyInfo.dissolved) {
      return null;
    }
    
    // Check if key has expired
    if (Date.now() >= keyInfo.expiration) {
      this._dissolveKey(keyId);
      return null;
    }
    
    return keyInfo.key;
  }
  
  /**
   * Accelerate the dissolution of a key
   * @param {string} keyId - ID of key to accelerate
   * @returns {boolean} True if acceleration was successful
   */
  accelerateDissolve(keyId) {
    const keyInfo = this.activeKeys.get(keyId);
    if (!keyInfo || keyInfo.dissolved) {
      return false;
    }
    
    // Increase dissolution rate
    keyInfo.dissolveRate *= 2;
    
    // Force immediate dissolution check
    this._processDissolvedKeys();
    
    return true;
  }
  
  /**
   * Get the current status of a key
   * @param {string} keyId - ID of key to check
   * @returns {Object|null} Key status information
   */
  getKeyStatus(keyId) {
    const keyInfo = this.activeKeys.get(keyId);
    if (!keyInfo) {
      return null;
    }
    
    return {
      created: keyInfo.created,
      expiration: keyInfo.expiration,
      dissolved: keyInfo.dissolved,
      dissolveProgress: keyInfo.dissolveProgress,
      timeRemaining: Math.max(0, keyInfo.expiration - Date.now())
    };
  }
  
  /**
   * Process and remove dissolved keys
   * @private
   */
  _processDissolvedKeys() {
    const now = Date.now();
    
    for (const [keyId, keyInfo] of this.activeKeys.entries()) {
      if (keyInfo.dissolved) {
        continue;
      }
      
      // Update dissolution progress
      const timePassed = now - keyInfo.created;
      const totalLifetime = keyInfo.expiration - keyInfo.created;
      keyInfo.dissolveProgress = Math.min(1, timePassed / totalLifetime);
      
      // Check for dissolution conditions
      if (now >= keyInfo.expiration || keyInfo.dissolveProgress >= 1) {
        this._dissolveKey(keyId);
      }
    }
    
    // Clean up fully dissolved keys periodically
    this._cleanupDissolvedKeys();
  }
  
  /**
   * Calculate quantum-derived dissolve rate
   * @private
   * @param {Buffer|string} data - Data to base rate on
   * @returns {number} Dissolution rate factor
   */
  _calculateDissolveRate(data) {
    // Use quantum entropy to influence dissolution rate
    const entropyBytes = this.entropyGenerator.getRandomBytes(4);
    const entropyValue = entropyBytes.readUInt32LE(0);
    
    // Base rate between 1.0 and 2.0
    const baseRate = 1.0 + (entropyValue / 0xFFFFFFFF);
    
    // Adjust based on data complexity
    let complexity = 1.0;
    if (data) {
      const hash = crypto.createHash('sha256');
      hash.update(data);
      const dataHash = hash.digest();
      
      // Analyze bit patterns in hash
      let ones = 0;
      for (const byte of dataHash) {
        ones += byte.toString(2).split('1').length - 1;
      }
      
      // Complexity factor based on bit distribution
      complexity = 0.5 + (ones / (dataHash.length * 8));
    }
    
    return baseRate * complexity;
  }
  
  /**
   * Securely dissolve a key
   * @private
   * @param {string} keyId - ID of key to dissolve
   */
  _dissolveKey(keyId) {
    const keyInfo = this.activeKeys.get(keyId);
    if (!keyInfo || keyInfo.dissolved) {
      return;
    }
    
    // Zero out key material
    keyInfo.key.fill(0);
    keyInfo.salt.fill(0);
    keyInfo.dissolved = true;
    keyInfo.dissolveProgress = 1;
  }
  
  /**
   * Clean up fully dissolved keys
   * @private
   */
  _cleanupDissolvedKeys() {
    for (const [keyId, keyInfo] of this.activeKeys.entries()) {
      if (keyInfo.dissolved && Date.now() - keyInfo.expiration > this.dissolveInterval * 2) {
        this.activeKeys.delete(keyId);
      }
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.dissolveTimer) {
      clearInterval(this.dissolveTimer);
      this.dissolveTimer = null;
    }
    
    // Force dissolve all remaining keys
    for (const keyId of this.activeKeys.keys()) {
      this._dissolveKey(keyId);
    }
    
    this.activeKeys.clear();
  }
}

module.exports = VanishingKeyManager;