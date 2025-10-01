/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * 
 * Security Manager Unit Tests
 */

const SecurityManager = require('../../src/core/security/security-manager');
const crypto = require('crypto');
const { generateTestKey } = require('../utils/test-utils');

describe('SecurityManager', () => {
    let securityManager;
    let config;

    beforeEach(() => {
        config = {
            encryption: {
                algorithm: 'aes-256-gcm',
                keySize: 256,
                tagLength: 16
            },
            protection: {
                integrityCheck: true,
                tamperDetection: true,
                biometricAuth: true
            }
        };

        securityManager = new SecurityManager(config);
    });

    afterEach(async () => {
        await securityManager.cleanup();
    });

    describe('initialization', () => {
        it('should initialize successfully', async () => {
            await securityManager.initialize();
            expect(securityManager.state.initialized).toBe(true);
            expect(securityManager.state.error).toBeNull();
        });

        it('should generate encryption keys', async () => {
            await securityManager.initialize();
            expect(securityManager.keys.size).toBeGreaterThan(0);
            expect(securityManager.keys.has('primary')).toBe(true);
        });

        it('should verify configuration', async () => {
            const invalidConfig = { ...config, encryption: { algorithm: 'invalid' } };
            const invalidManager = new SecurityManager(invalidConfig);
            await expect(invalidManager.initialize()).rejects.toThrow();
        });
    });

    describe('encryption operations', () => {
        beforeEach(async () => {
            await securityManager.initialize();
        });

        it('should encrypt data', async () => {
            const data = Buffer.from('test data');
            const encrypted = await securityManager.encrypt(data);

            expect(encrypted).toBeDefined();
            expect(encrypted.ciphertext).toBeDefined();
            expect(encrypted.iv).toBeDefined();
            expect(encrypted.tag).toBeDefined();
        });

        it('should decrypt data', async () => {
            const data = Buffer.from('test data');
            const encrypted = await securityManager.encrypt(data);
            const decrypted = await securityManager.decrypt(encrypted);

            expect(decrypted.toString()).toBe(data.toString());
        });

        it('should handle large data blocks', async () => {
            const data = crypto.randomBytes(1024 * 1024); // 1MB
            const encrypted = await securityManager.encrypt(data);
            const decrypted = await securityManager.decrypt(encrypted);

            expect(decrypted.equals(data)).toBe(true);
        });
    });

    describe('integrity verification', () => {
        beforeEach(async () => {
            await securityManager.initialize();
        });

        it('should generate integrity checksums', async () => {
            const data = Buffer.from('test data');
            const checksum = await securityManager.generateChecksum(data);

            expect(checksum).toBeDefined();
            expect(typeof checksum).toBe('string');
            expect(checksum.length).toBeGreaterThan(0);
        });

        it('should verify data integrity', async () => {
            const data = Buffer.from('test data');
            const checksum = await securityManager.generateChecksum(data);
            const verified = await securityManager.verifyIntegrity(data, checksum);

            expect(verified).toBe(true);
        });

        it('should detect tampering', async () => {
            const data = Buffer.from('test data');
            const checksum = await securityManager.generateChecksum(data);
            const tamperedData = Buffer.from('tampered data');

            const verified = await securityManager.verifyIntegrity(tamperedData, checksum);
            expect(verified).toBe(false);
        });
    });

    describe('key management', () => {
        beforeEach(async () => {
            await securityManager.initialize();
        });

        it('should rotate encryption keys', async () => {
            const initialKey = securityManager.keys.get('primary');
            await securityManager.rotateKeys();
            const newKey = securityManager.keys.get('primary');

            expect(newKey).not.toEqual(initialKey);
        });

        it('should handle key backup/restore', async () => {
            const key = generateTestKey();
            await securityManager.backupKey('test', key);
            const restored = await securityManager.restoreKey('test');

            expect(restored.equals(key)).toBe(true);
        });

        it('should enforce key security policies', async () => {
            const weakKey = Buffer.alloc(16); // Too small
            await expect(securityManager.validateKey(weakKey)).rejects.toThrow();
        });
    });

    describe('biometric authentication', () => {
        beforeEach(async () => {
            await securityManager.initialize();
        });

        it('should enroll biometric data', async () => {
            const bioData = crypto.randomBytes(1024);
            const enrolled = await securityManager.enrollBiometric(bioData);

            expect(enrolled).toBe(true);
            expect(securityManager.biometrics.size).toBe(1);
        });

        it('should verify biometric data', async () => {
            const bioData = crypto.randomBytes(1024);
            await securityManager.enrollBiometric(bioData);
            const verified = await securityManager.verifyBiometric(bioData);

            expect(verified).toBe(true);
        });

        it('should reject invalid biometric data', async () => {
            const validData = crypto.randomBytes(1024);
            const invalidData = crypto.randomBytes(1024);
            
            await securityManager.enrollBiometric(validData);
            const verified = await securityManager.verifyBiometric(invalidData);

            expect(verified).toBe(false);
        });
    });

    describe('error handling', () => {
        it('should handle encryption errors', async () => {
            await securityManager.initialize();
            securityManager.keys.clear();

            await expect(securityManager.encrypt(Buffer.from('test'))).rejects.toThrow();
        });

        it('should handle decryption errors', async () => {
            await securityManager.initialize();
            const invalidData = { ciphertext: Buffer.from('invalid'), iv: Buffer.alloc(16), tag: Buffer.alloc(16) };

            await expect(securityManager.decrypt(invalidData)).rejects.toThrow();
        });

        it('should handle integrity check errors', async () => {
            await securityManager.initialize();
            const invalidChecksum = 'invalid';

            await expect(securityManager.verifyIntegrity(Buffer.from('test'), invalidChecksum)).resolves.toBe(false);
        });
    });

    describe('utilities', () => {
        beforeEach(async () => {
            await securityManager.initialize();
        });

        it('should generate random values', () => {
            const random = securityManager._generateRandom(32);
            expect(random.length).toBe(32);
        });

        it('should validate encryption parameters', () => {
            const params = {
                algorithm: 'aes-256-gcm',
                keySize: 256,
                tagLength: 16
            };

            expect(() => securityManager._validateEncryptionParams(params)).not.toThrow();
        });

        it('should manage secure sessions', async () => {
            const session = await securityManager.createSession();
            expect(session).toBeDefined();
            expect(session.id).toMatch(/^sess-/);
            expect(session.key).toBeDefined();

            const validated = await securityManager.validateSession(session);
            expect(validated).toBe(true);
        });
    });
});