/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * QUANTUM SECURITY TESTING
 * This component provides comprehensive testing for the quantum security layer,
 * including entropy generation, key management, and secure task execution.
 */

const QuantumEntropyGenerator = require('../../src/quantum/quantum-entropy-generator');
const VanishingKeyManager = require('../../src/quantum/vanishing-key-manager');
const SecureTaskExecution = require('../../src/quantum/secure-task-execution');

describe('Quantum Security Layer', () => {
  let entropyGenerator;
  let keyManager;
  let secureExecution;

  beforeEach(() => {
    entropyGenerator = new QuantumEntropyGenerator();
    keyManager = new VanishingKeyManager(entropyGenerator);
    secureExecution = new SecureTaskExecution(entropyGenerator, keyManager);
  });

  afterEach(() => {
    entropyGenerator.destroy();
    keyManager.destroy();
    secureExecution.destroy();
  });

  describe('QuantumEntropyGenerator', () => {
    test('should generate random bytes with high entropy', () => {
      const bytes = entropyGenerator.getRandomBytes(1024);
      expect(bytes).toBeInstanceOf(Buffer);
      expect(bytes.length).toBe(1024);

      const quality = entropyGenerator.measureEntropyQuality();
      expect(quality).toBeGreaterThan(0.9);
    });

    test('should generate consistent random integers within range', () => {
      const min = 1;
      const max = 100;
      const samples = 1000;
      const numbers = new Set();

      for (let i = 0; i < samples; i++) {
        const num = entropyGenerator.getRandomInt(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
        numbers.add(num);
      }

      // Should have good distribution
      expect(numbers.size).toBeGreaterThan((max - min) * 0.9);
    });

    test('should generate quantum hashes', () => {
      const data = 'test data';
      const hash1 = entropyGenerator.generateQuantumHash(data);
      const hash2 = entropyGenerator.generateQuantumHash(data);

      expect(hash1).toBeInstanceOf(Buffer);
      expect(hash1.length).toBe(64); // 512 bits
      expect(hash1).not.toEqual(hash2); // Should include random salt
    });

    test('should detect hardware entropy sources', () => {
      const sources = entropyGenerator._detectHardwareSources();
      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
    });
  });

  describe('VanishingKeyManager', () => {
    test('should generate and verify vanishing keys', async () => {
      const data = 'sensitive data';
      const lifetime = 100; // 100ms lifetime

      const keyInfo = keyManager.generateKey(data, lifetime);
      expect(keyInfo.id).toBeTruthy();
      expect(keyInfo.expiration).toBeGreaterThan(Date.now());

      // Key should be valid initially
      const key = keyManager.verifyKey(keyInfo.id);
      expect(key).toBeInstanceOf(Buffer);

      // Wait for key to dissolve
      await new Promise(resolve => setTimeout(resolve, lifetime + 50));

      // Key should be invalid after lifetime
      const expiredKey = keyManager.verifyKey(keyInfo.id);
      expect(expiredKey).toBeNull();
    });

    test('should track key status', () => {
      const data = 'test data';
      const lifetime = 500;

      const keyInfo = keyManager.generateKey(data, lifetime);
      const status = keyManager.getKeyStatus(keyInfo.id);

      expect(status).toBeTruthy();
      expect(status.created).toBeLessThanOrEqual(Date.now());
      expect(status.expiration).toBeGreaterThan(Date.now());
      expect(status.dissolved).toBe(false);
      expect(status.dissolveProgress).toBeGreaterThanOrEqual(0);
      expect(status.dissolveProgress).toBeLessThanOrEqual(1);
    });

    test('should accelerate key dissolution', async () => {
      const data = 'test data';
      const lifetime = 1000;

      const keyInfo = keyManager.generateKey(data, lifetime);
      const accelerated = keyManager.accelerateDissolve(keyInfo.id);
      expect(accelerated).toBe(true);

      // Wait for accelerated dissolution
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = keyManager.getKeyStatus(keyInfo.id);
      expect(status.dissolveProgress).toBeGreaterThan(0);
    });
  });

  describe('SecureTaskExecution', () => {
    test('should securely execute tasks with proof', async () => {
      const task = {
        execute: async (params) => params.value * 2,
        params: { value: 42 },
        lifetime: 1000
      };

      const result = await secureExecution.secureExecute(task);
      expect(result.result).toBe(84);
      expect(result.executionId).toBeTruthy();
      expect(result.proof).toBeTruthy();
      expect(result.proof.layers.length).toBe(3);
    });

    test('should verify task execution', async () => {
      const task = {
        execute: async () => 'test result',
        params: { test: true },
        lifetime: 1000
      };

      const result = await secureExecution.secureExecute(task);
      const verified = await secureExecution.verifyExecution(result.executionId);
      expect(verified).toBe(true);
    });

    test('should maintain execution chain integrity', async () => {
      const tasks = [
        { execute: async () => 'result 1', params: { id: 1 } },
        { execute: async () => 'result 2', params: { id: 2 } },
        { execute: async () => 'result 3', params: { id: 3 } }
      ];

      for (const task of tasks) {
        await secureExecution.secureExecute(task);
      }

      const chainValid = await secureExecution.validateExecutionChain();
      expect(chainValid).toBe(true);
    });

    test('should generate valid execution proofs', async () => {
      const execution = {
        executionId: 'test-execution',
        startTime: '1000000',
        endTime: '2000000',
        resultHash: 'abcdef1234567890'
      };

      const proof = await secureExecution.generateExecutionProof(execution);
      expect(proof.timestamp).toBeTruthy();
      expect(proof.nonce).toBeTruthy();
      expect(proof.layers).toHaveLength(3);
      expect(proof.metadata.entropyQuality).toBeGreaterThan(0.9);
    });
  });
});