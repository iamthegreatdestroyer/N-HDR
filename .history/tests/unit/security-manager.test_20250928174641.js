/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * 
 * This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
 * technology suite. Unauthorized reproduction, distribution, or disclosure of this
 * software in whole or in part is strictly prohibited. All intellectual property
 * rights, including patent-pending technologies, are reserved.
 * 
 * File: security-manager.test.js
 * Created: 2025-09-28
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import SecurityManager from '../../src/core/security/security-manager';
import config from '../../config/nhdr-config';

describe('SecurityManager Tests', () => {
  let security;
  
  beforeEach(() => {
    security = new SecurityManager();
  });
  
  describe('Layer Encryption', () => {
    const mockLayerData = {
      weights: [1, 2, 3],
      biases: [0.1, 0.2, 0.3]
    };
    
    test('should encrypt layer data', async () => {
      const encrypted = await security.encryptLayer(mockLayerData, 0);
      expect(encrypted.data).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.integrity).toBeDefined();
      expect(encrypted.data).not.toEqual(JSON.stringify(mockLayerData));
    });
    
    test('should decrypt layer data', async () => {
      const encrypted = await security.encryptLayer(mockLayerData, 0);
      const decrypted = await security.decryptLayer(encrypted, 0);
      expect(decrypted).toEqual(mockLayerData);
    });
  });
  
  describe('Access Validation', () => {
    const mockBiometric = {
      fingerprint: 'test-fingerprint',
      timestamp: Date.now()
    };
    
    test('should validate first access', async () => {
      const result = await security.validateAccess(mockBiometric);
      expect(result).toBe(true);
    });
    
    test('should validate subsequent access with same biometric', async () => {
      await security.validateAccess(mockBiometric);
      const result = await security.validateAccess(mockBiometric);
      expect(result).toBe(true);
    });
    
    test('should reject invalid biometric', async () => {
      await security.validateAccess(mockBiometric);
      const result = await security.validateAccess({
        fingerprint: 'invalid-fingerprint',
        timestamp: Date.now()
      });
      expect(result).toBe(false);
    });
  });
  
  describe('Tamper Detection', () => {
    const mockNHDRFile = {
      header: {
        version: '1.0.0',
        creatorHash: 'test-hash'
      },
      layers: [],
      integrity: {}
    };
    
    test('should detect untampered file', async () => {
      const integrity = await security.createIntegrityVerification([]);
      const file = {...mockNHDRFile, integrity};
      const result = await security.detectTampering(file);
      expect(result).toBe(true);
    });
    
    test('should detect tampered file', async () => {
      const integrity = await security.createIntegrityVerification([]);
      const file = {
        ...mockNHDRFile,
        integrity: {...integrity, headerIntegrity: 'tampered'}
      };
      const result = await security.detectTampering(file);
      expect(result).toBe(false);
    });
  });
});