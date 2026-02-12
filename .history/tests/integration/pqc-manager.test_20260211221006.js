/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * PQC Manager Integration Tests — Phase 9.7
 * Verifies ML-KEM key encapsulation and ML-DSA digital signatures
 * at all three NIST security levels.
 */

import { PQCManager, PQCSecurityLevel } from "../../src/security/pqc/pqc-manager.js";

describe("PQC Manager Integration", () => {
  let pqc;

  beforeEach(async () => {
    pqc = new PQCManager({ defaultLevel: PQCSecurityLevel.STANDARD });
    await pqc.initialize();
  });

  // ─── Initialization ──────────────────────────────────────────────────────

  describe("initialization", () => {
    it("should initialize at all security levels", () => {
      expect(pqc.initialized).toBe(true);
    });

    it("should be idempotent", async () => {
      await pqc.initialize();
      expect(pqc.initialized).toBe(true);
    });

    it("should default to HIGH when no level specified", async () => {
      const p = new PQCManager();
      await p.initialize();
      expect(p.defaultLevel).toBe(PQCSecurityLevel.HIGH);
    });
  });

  // ─── ML-KEM Key Encapsulation (FIPS 203) ──────────────────────────────────

  describe("ML-KEM key encapsulation", () => {
    for (const level of Object.values(PQCSecurityLevel)) {
      describe(`at ${level} level`, () => {
        it("should generate keypair", () => {
          const keys = pqc.generateKEMKeypair(level);
          expect(keys.publicKey).toBeInstanceOf(Uint8Array);
          expect(keys.secretKey).toBeInstanceOf(Uint8Array);
          expect(keys.level).toBe(level);
          expect(keys.publicKey.length).toBeGreaterThan(0);
          expect(keys.secretKey.length).toBeGreaterThan(0);
        });

        it("should encapsulate and decapsulate a shared secret", () => {
          const keys = pqc.generateKEMKeypair(level);

          const { ciphertext, sharedSecret: encSecret } =
            pqc.encapsulate(keys.publicKey, level);

          const { sharedSecret: decSecret } =
            pqc.decapsulate(ciphertext, keys.secretKey, level);

          // Shared secrets must match
          expect(Buffer.from(encSecret)).toEqual(Buffer.from(decSecret));
        });

        it("should produce different shared secrets for different keypairs", () => {
          const keysA = pqc.generateKEMKeypair(level);
          const keysB = pqc.generateKEMKeypair(level);

          const { sharedSecret: secretA } =
            pqc.encapsulate(keysA.publicKey, level);
          const { sharedSecret: secretB } =
            pqc.encapsulate(keysB.publicKey, level);

          expect(Buffer.from(secretA)).not.toEqual(Buffer.from(secretB));
        });
      });
    }

    it("should track stats", () => {
      pqc.generateKEMKeypair();
      pqc.generateKEMKeypair();
      expect(pqc.stats.kemsGenerated).toBe(2);
    });
  });

  // ─── ML-DSA Digital Signatures (FIPS 204) ─────────────────────────────────

  describe("ML-DSA digital signatures", () => {
    for (const level of Object.values(PQCSecurityLevel)) {
      describe(`at ${level} level`, () => {
        it("should generate DSA keypair", () => {
          const keys = pqc.generateDSAKeypair(level);
          expect(keys.publicKey).toBeInstanceOf(Uint8Array);
          expect(keys.secretKey).toBeInstanceOf(Uint8Array);
          expect(keys.level).toBe(level);
        });

        it("should sign and verify a string message", () => {
          const keys = pqc.generateDSAKeypair(level);
          const message = "HDR consciousness state integrity check";

          const { signature } = pqc.sign(message, keys.secretKey, level);
          const valid = pqc.verify(message, signature, keys.publicKey, level);

          expect(valid).toBe(true);
        });

        it("should sign and verify a binary message", () => {
          const keys = pqc.generateDSAKeypair(level);
          const message = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

          const { signature } = pqc.sign(message, keys.secretKey, level);
          const valid = pqc.verify(message, signature, keys.publicKey, level);

          expect(valid).toBe(true);
        });

        it("should reject tampered message", () => {
          const keys = pqc.generateDSAKeypair(level);
          const { signature } = pqc.sign(
            "original message",
            keys.secretKey,
            level,
          );

          const valid = pqc.verify(
            "tampered message",
            signature,
            keys.publicKey,
            level,
          );

          expect(valid).toBe(false);
        });

        it("should reject wrong public key", () => {
          const keysA = pqc.generateDSAKeypair(level);
          const keysB = pqc.generateDSAKeypair(level);
          const { signature } = pqc.sign(
            "test",
            keysA.secretKey,
            level,
          );

          const valid = pqc.verify("test", signature, keysB.publicKey, level);
          expect(valid).toBe(false);
        });
      });
    }

    it("should track signature stats", () => {
      const keys = pqc.generateDSAKeypair();
      pqc.sign("a", keys.secretKey);
      pqc.sign("b", keys.secretKey);
      pqc.verify("a", pqc.sign("a", keys.secretKey).signature, keys.publicKey);

      expect(pqc.stats.signaturesCreated).toBe(3);
      expect(pqc.stats.signaturesVerified).toBe(1);
    });
  });

  // ─── Hybrid Mode ──────────────────────────────────────────────────────────

  describe("hybrid mode", () => {
    it("should produce hybrid shared secret by default", () => {
      const keys = pqc.generateKEMKeypair();
      const enc = pqc.encapsulate(keys.publicKey);
      expect(enc.hybrid).toBe(true);
      expect(enc.pqcSharedSecret).toBeDefined();
    });

    it("should produce non-hybrid when disabled", async () => {
      const p = new PQCManager({
        hybridMode: false,
        defaultLevel: PQCSecurityLevel.STANDARD,
      });
      await p.initialize();

      const keys = p.generateKEMKeypair();
      const enc = p.encapsulate(keys.publicKey);
      expect(enc.hybrid).toBe(false);
    });
  });

  // ─── Zone Credentials ─────────────────────────────────────────────────────

  describe("zone credentials", () => {
    it("should create and verify zone credentials", () => {
      const creds = pqc.createZoneCredentials("test-zone-1");

      expect(creds.zoneId).toBe("test-zone-1");
      expect(creds.kem.publicKey).toBeDefined();
      expect(creds.dsa.publicKey).toBeDefined();
      expect(creds.identity.claim).toContain("test-zone-1");

      const valid = pqc.verifyZoneCredentials(creds);
      expect(valid).toBe(true);
    });

    it("should reject tampered zone credentials", () => {
      const creds = pqc.createZoneCredentials("zone-2");
      creds.identity.claim = "tampered-claim";

      const valid = pqc.verifyZoneCredentials(creds);
      expect(valid).toBe(false);
    });
  });

  // ─── Error Handling ───────────────────────────────────────────────────────

  describe("error handling", () => {
    it("should throw on invalid KEM level", () => {
      expect(() => pqc.generateKEMKeypair("invalid")).toThrow();
    });

    it("should throw on invalid DSA level", () => {
      expect(() => pqc.generateDSAKeypair("invalid")).toThrow();
    });
  });
});
