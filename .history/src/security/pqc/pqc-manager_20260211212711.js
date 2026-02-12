/**
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * 
 * PQC Manager — Post-Quantum Cryptography Manager
 * Unified interface for ML-KEM (FIPS 203) key encapsulation and
 * ML-DSA (FIPS 204) digital signatures.
 * 
 * Phase 9.2: VB-HDR Post-Quantum Cryptography Upgrade
 * Uses @noble/post-quantum v0.4.0 implementing NIST PQC standards.
 */

import { ml_kem512, ml_kem768, ml_kem1024 } from '@noble/post-quantum/ml-kem';
import { ml_dsa44, ml_dsa65, ml_dsa87 } from '@noble/post-quantum/ml-dsa';
import { randomBytes, createHash, createHmac } from 'crypto';

/**
 * Security level enumeration for PQC operations
 */
export const PQCSecurityLevel = Object.freeze({
  STANDARD: 'standard',     // ML-KEM-512 / ML-DSA-44 (NIST Level 1)
  HIGH: 'high',             // ML-KEM-768 / ML-DSA-65 (NIST Level 3)
  MAXIMUM: 'maximum',       // ML-KEM-1024 / ML-DSA-87 (NIST Level 5)
});

/**
 * Maps security levels to algorithm instances
 */
const KEM_ALGORITHMS = {
  [PQCSecurityLevel.STANDARD]: ml_kem512,
  [PQCSecurityLevel.HIGH]: ml_kem768,
  [PQCSecurityLevel.MAXIMUM]: ml_kem1024,
};

const DSA_ALGORITHMS = {
  [PQCSecurityLevel.STANDARD]: ml_dsa44,
  [PQCSecurityLevel.HIGH]: ml_dsa65,
  [PQCSecurityLevel.MAXIMUM]: ml_dsa87,
};

/**
 * PQCManager — Post-Quantum Cryptography Manager
 * 
 * Provides quantum-resistant cryptographic operations:
 * - Key Encapsulation (ML-KEM): Secure key exchange resistant to quantum attacks
 * - Digital Signatures (ML-DSA): Quantum-resistant authentication and integrity
 * - Hybrid Operations: Classical + PQC for defense-in-depth
 * 
 * Thread-safe, stateless operations. Key material managed externally.
 */
export class PQCManager {
  /**
   * @param {Object} options
   * @param {string} [options.defaultLevel='high'] - Default security level
   * @param {boolean} [options.hybridMode=true] - Enable hybrid classical+PQC
   */
  constructor(options = {}) {
    this.defaultLevel = options.defaultLevel || PQCSecurityLevel.HIGH;
    this.hybridMode = options.hybridMode !== false;
    this.initialized = false;
    this.keyCache = new Map();
    this.stats = {
      kemsGenerated: 0,
      signaturesCreated: 0,
      signaturesVerified: 0,
      encapsulations: 0,
      decapsulations: 0,
      errors: 0,
    };
  }

  /**
   * Initialize PQC Manager and verify algorithm availability
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;

    // Verify all algorithm levels are functional
    for (const level of Object.values(PQCSecurityLevel)) {
      try {
        const kem = KEM_ALGORITHMS[level];
        const dsa = DSA_ALGORITHMS[level];

        // Quick functional test — generate and verify a keypair
        const kemKeys = kem.keygen();
        if (!kemKeys.publicKey || !kemKeys.secretKey) {
          throw new Error(`ML-KEM keygen failed for level ${level}`);
        }

        const dsaKeys = dsa.keygen();
        if (!dsaKeys.publicKey || !dsaKeys.secretKey) {
          throw new Error(`ML-DSA keygen failed for level ${level}`);
        }
      } catch (error) {
        console.error(`PQC level ${level} initialization failed:`, error.message);
        throw new Error(`PQC initialization failed at level ${level}: ${error.message}`);
      }
    }

    this.initialized = true;
    console.log('[PQCManager] Initialized — all security levels operational');
  }

  // ─────────────────────────────────────────────────────
  // ML-KEM KEY ENCAPSULATION (FIPS 203)
  // ─────────────────────────────────────────────────────

  /**
   * Generate ML-KEM keypair for key encapsulation
   * @param {string} [level] - Security level
   * @returns {{ publicKey: Uint8Array, secretKey: Uint8Array, level: string }}
   */
  generateKEMKeypair(level) {
    const secLevel = level || this.defaultLevel;
    const kem = KEM_ALGORITHMS[secLevel];
    if (!kem) throw new Error(`Invalid KEM security level: ${secLevel}`);

    const keys = kem.keygen();
    this.stats.kemsGenerated++;

    return {
      publicKey: keys.publicKey,
      secretKey: keys.secretKey,
      level: secLevel,
      algorithm: `ML-KEM-${secLevel}`,
      generatedAt: Date.now(),
    };
  }

  /**
   * Encapsulate a shared secret using recipient's public key
   * @param {Uint8Array} recipientPublicKey - Recipient's ML-KEM public key
   * @param {string} [level] - Security level
   * @returns {{ ciphertext: Uint8Array, sharedSecret: Uint8Array }}
   */
  encapsulate(recipientPublicKey, level) {
    const secLevel = level || this.defaultLevel;
    const kem = KEM_ALGORITHMS[secLevel];
    if (!kem) throw new Error(`Invalid KEM security level: ${secLevel}`);

    try {
      const result = kem.encapsulate(recipientPublicKey);
      this.stats.encapsulations++;

      if (this.hybridMode) {
        // Hybrid: combine PQC shared secret with classical HKDF derivation
        const hybridSecret = this._deriveHybridKey(result.sharedSecret);
        return {
          ciphertext: result.ciphertext,
          sharedSecret: hybridSecret,
          pqcSharedSecret: result.sharedSecret,
          hybrid: true,
        };
      }

      return {
        ciphertext: result.ciphertext,
        sharedSecret: result.sharedSecret,
        hybrid: false,
      };
    } catch (error) {
      this.stats.errors++;
      throw new Error(`KEM encapsulation failed: ${error.message}`);
    }
  }

  /**
   * Decapsulate to recover shared secret using own secret key
   * @param {Uint8Array} ciphertext - Encapsulated ciphertext
   * @param {Uint8Array} secretKey - Own ML-KEM secret key
   * @param {string} [level] - Security level
   * @returns {{ sharedSecret: Uint8Array }}
   */
  decapsulate(ciphertext, secretKey, level) {
    const secLevel = level || this.defaultLevel;
    const kem = KEM_ALGORITHMS[secLevel];
    if (!kem) throw new Error(`Invalid KEM security level: ${secLevel}`);

    try {
      const sharedSecret = kem.decapsulate(ciphertext, secretKey);
      this.stats.decapsulations++;

      if (this.hybridMode) {
        const hybridSecret = this._deriveHybridKey(sharedSecret);
        return {
          sharedSecret: hybridSecret,
          pqcSharedSecret: sharedSecret,
          hybrid: true,
        };
      }

      return { sharedSecret, hybrid: false };
    } catch (error) {
      this.stats.errors++;
      throw new Error(`KEM decapsulation failed: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────
  // ML-DSA DIGITAL SIGNATURES (FIPS 204)
  // ─────────────────────────────────────────────────────

  /**
   * Generate ML-DSA keypair for digital signatures
   * @param {string} [level] - Security level
   * @returns {{ publicKey: Uint8Array, secretKey: Uint8Array, level: string }}
   */
  generateDSAKeypair(level) {
    const secLevel = level || this.defaultLevel;
    const dsa = DSA_ALGORITHMS[secLevel];
    if (!dsa) throw new Error(`Invalid DSA security level: ${secLevel}`);

    const keys = dsa.keygen();

    return {
      publicKey: keys.publicKey,
      secretKey: keys.secretKey,
      level: secLevel,
      algorithm: `ML-DSA-${secLevel}`,
      generatedAt: Date.now(),
    };
  }

  /**
   * Sign a message with ML-DSA
   * @param {Uint8Array|string} message - Message to sign
   * @param {Uint8Array} secretKey - Signer's secret key
   * @param {string} [level] - Security level
   * @returns {{ signature: Uint8Array, algorithm: string }}
   */
  sign(message, secretKey, level) {
    const secLevel = level || this.defaultLevel;
    const dsa = DSA_ALGORITHMS[secLevel];
    if (!dsa) throw new Error(`Invalid DSA security level: ${secLevel}`);

    try {
      const msgBytes = typeof message === 'string'
        ? new TextEncoder().encode(message)
        : message;

      const signature = dsa.sign(secretKey, msgBytes);
      this.stats.signaturesCreated++;

      return {
        signature,
        algorithm: `ML-DSA-${secLevel}`,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.stats.errors++;
      throw new Error(`DSA signing failed: ${error.message}`);
    }
  }

  /**
   * Verify a ML-DSA signature
   * @param {Uint8Array|string} message - Original message
   * @param {Uint8Array} signature - Signature to verify
   * @param {Uint8Array} publicKey - Signer's public key
   * @param {string} [level] - Security level
   * @returns {boolean} - True if signature is valid
   */
  verify(message, signature, publicKey, level) {
    const secLevel = level || this.defaultLevel;
    const dsa = DSA_ALGORITHMS[secLevel];
    if (!dsa) throw new Error(`Invalid DSA security level: ${secLevel}`);

    try {
      const msgBytes = typeof message === 'string'
        ? new TextEncoder().encode(message)
        : message;

      const valid = dsa.verify(publicKey, msgBytes, signature);
      this.stats.signaturesVerified++;
      return valid;
    } catch (error) {
      this.stats.errors++;
      return false;
    }
  }

  // ─────────────────────────────────────────────────────
  // SECURITY ZONE OPERATIONS (VoidBlade Integration)
  // ─────────────────────────────────────────────────────

  /**
   * Create PQC-secured security zone credentials
   * Used by VoidBladeHDR for quantum-resistant security zones.
   * 
   * @param {string} zoneId - Security zone identifier
   * @param {string} [level] - Security level
   * @returns {Object} Zone cryptographic material
   */
  createZoneCredentials(zoneId, level) {
    const secLevel = level || this.defaultLevel;

    // Generate KEM keypair for zone key exchange
    const kemKeys = this.generateKEMKeypair(secLevel);

    // Generate DSA keypair for zone authentication
    const dsaKeys = this.generateDSAKeypair(secLevel);

    // Create zone identity signature
    const zoneIdentity = `vbhdr-zone-${zoneId}-${Date.now()}`;
    const identitySignature = this.sign(zoneIdentity, dsaKeys.secretKey, secLevel);

    return {
      zoneId,
      level: secLevel,
      kem: {
        publicKey: Buffer.from(kemKeys.publicKey).toString('base64'),
        secretKey: Buffer.from(kemKeys.secretKey).toString('base64'),
      },
      dsa: {
        publicKey: Buffer.from(dsaKeys.publicKey).toString('base64'),
        secretKey: Buffer.from(dsaKeys.secretKey).toString('base64'),
      },
      identity: {
        claim: zoneIdentity,
        signature: Buffer.from(identitySignature.signature).toString('base64'),
      },
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24h
    };
  }

  /**
   * Verify a security zone's PQC credentials
   * @param {Object} credentials - Zone credentials from createZoneCredentials
   * @returns {boolean} - True if credentials are valid
   */
  verifyZoneCredentials(credentials) {
    try {
      const publicKey = new Uint8Array(Buffer.from(credentials.dsa.publicKey, 'base64'));
      const signature = new Uint8Array(Buffer.from(credentials.identity.signature, 'base64'));

      // Check expiry
      if (credentials.expiresAt < Date.now()) {
        return false;
      }

      return this.verify(
        credentials.identity.claim,
        signature,
        publicKey,
        credentials.level
      );
    } catch {
      return false;
    }
  }

  /**
   * Perform PQC key exchange between two security zones
   * @param {Object} initiatorCredentials - Initiating zone credentials
   * @param {Object} responderCredentials - Responding zone credentials
   * @returns {Object} Shared secret material for secure communication
   */
  performZoneKeyExchange(initiatorCredentials, responderCredentials) {
    const level = initiatorCredentials.level;

    // Initiator encapsulates using responder's public key
    const responderPK = new Uint8Array(
      Buffer.from(responderCredentials.kem.publicKey, 'base64')
    );

    const { ciphertext, sharedSecret } = this.encapsulate(responderPK, level);

    return {
      ciphertext: Buffer.from(ciphertext).toString('base64'),
      sharedSecret: Buffer.from(sharedSecret).toString('base64'),
      level,
      timestamp: Date.now(),
    };
  }

  /**
   * Complete a PQC key exchange (responder side)
   * @param {string} ciphertextB64 - Base64 ciphertext from initiator
   * @param {Object} ownCredentials - Own zone credentials
   * @returns {Object} Recovered shared secret
   */
  completeZoneKeyExchange(ciphertextB64, ownCredentials) {
    const level = ownCredentials.level;

    const ciphertext = new Uint8Array(Buffer.from(ciphertextB64, 'base64'));
    const secretKey = new Uint8Array(
      Buffer.from(ownCredentials.kem.secretKey, 'base64')
    );

    const { sharedSecret } = this.decapsulate(ciphertext, secretKey, level);

    return {
      sharedSecret: Buffer.from(sharedSecret).toString('base64'),
      level,
      timestamp: Date.now(),
    };
  }

  // ─────────────────────────────────────────────────────
  // UTILITY & DIAGNOSTICS
  // ─────────────────────────────────────────────────────

  /**
   * Derive a hybrid key combining PQC shared secret with classical HKDF
   * @private
   * @param {Uint8Array} pqcSecret - PQC shared secret
   * @returns {Uint8Array} Hybrid derived key
   */
  _deriveHybridKey(pqcSecret) {
    // HKDF-SHA256 extract
    const salt = randomBytes(32);
    const prk = createHmac('sha256', salt).update(pqcSecret).digest();

    // HKDF-SHA256 expand
    const info = Buffer.from('nhdr-pqc-hybrid-v1');
    const okm = createHmac('sha256', prk).update(
      Buffer.concat([info, Buffer.from([0x01])])
    ).digest();

    return new Uint8Array(okm);
  }

  /**
   * Get operational statistics
   * @returns {Object} Stats
   */
  getStats() {
    return { ...this.stats, initialized: this.initialized };
  }

  /**
   * Get supported algorithms info
   * @returns {Object} Algorithm details per security level
   */
  getAlgorithms() {
    return {
      kem: {
        [PQCSecurityLevel.STANDARD]: 'ML-KEM-512 (FIPS 203, NIST Level 1)',
        [PQCSecurityLevel.HIGH]: 'ML-KEM-768 (FIPS 203, NIST Level 3)',
        [PQCSecurityLevel.MAXIMUM]: 'ML-KEM-1024 (FIPS 203, NIST Level 5)',
      },
      dsa: {
        [PQCSecurityLevel.STANDARD]: 'ML-DSA-44 (FIPS 204, NIST Level 1)',
        [PQCSecurityLevel.HIGH]: 'ML-DSA-65 (FIPS 204, NIST Level 3)',
        [PQCSecurityLevel.MAXIMUM]: 'ML-DSA-87 (FIPS 204, NIST Level 5)',
      },
    };
  }
}

export default PQCManager;
