/*
 * HDR Empire Framework - Application Launcher Test Suite
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('Application Launcher', () => {
  let launcher;

  beforeEach(() => {
    launcher = {
      initialize: jest.fn(),
      launchApplication: jest.fn(),
      closeApplication: jest.fn(),
      getRunningApplications: jest.fn(),
      getAvailableApplications: jest.fn(),
      restartApplication: jest.fn(),
      getApplicationStatus: jest.fn()
    };
  });

  describe('Application Launch', () => {
    test('should launch Quantum Knowledge Explorer', async () => {
      launcher.launchApplication.mockResolvedValue({
        launched: true,
        application: 'quantum-knowledge-explorer',
        windowId: 'window-001',
        pid: 12345,
        launchTime: 450
      });

      const result = await launcher.launchApplication({
        name: 'quantum-knowledge-explorer'
      });

      expect(result.launched).toBe(true);
      expect(result.application).toBe('quantum-knowledge-explorer');
    });

    test('should launch Consciousness Workbench', async () => {
      launcher.launchApplication.mockResolvedValue({
        launched: true,
        application: 'consciousness-workbench',
        windowId: 'window-002',
        pid: 12346
      });

      const result = await launcher.launchApplication({
        name: 'consciousness-workbench'
      });

      expect(result.launched).toBe(true);
    });

    test('should handle launch failures', async () => {
      launcher.launchApplication.mockRejectedValue(new Error('Application not found'));

      await expect(launcher.launchApplication({ name: 'invalid-app' }))
        .rejects.toThrow('Application not found');
    });

    test('should launch with custom configuration', async () => {
      launcher.launchApplication.mockResolvedValue({
        launched: true,
        application: 'quantum-knowledge-explorer',
        config: { theme: 'dark', layout: 'grid' }
      });

      const result = await launcher.launchApplication({
        name: 'quantum-knowledge-explorer',
        config: { theme: 'dark', layout: 'grid' }
      });

      expect(result.config).toBeDefined();
    });
  });

  describe('Application Management', () => {
    test('should close running application', async () => {
      launcher.closeApplication.mockResolvedValue({
        closed: true,
        application: 'quantum-knowledge-explorer',
        windowId: 'window-001',
        cleanupComplete: true
      });

      const result = await launcher.closeApplication({
        windowId: 'window-001'
      });

      expect(result.closed).toBe(true);
      expect(result.cleanupComplete).toBe(true);
    });

    test('should restart application', async () => {
      launcher.restartApplication.mockResolvedValue({
        restarted: true,
        application: 'consciousness-workbench',
        newWindowId: 'window-003'
      });

      const result = await launcher.restartApplication({
        windowId: 'window-002'
      });

      expect(result.restarted).toBe(true);
    });
  });

  describe('Application Discovery', () => {
    test('should list available applications', async () => {
      launcher.getAvailableApplications.mockResolvedValue({
        applications: [
          { name: 'quantum-knowledge-explorer', version: '1.0.0', category: 'Knowledge' },
          { name: 'consciousness-workbench', version: '1.0.0', category: 'Consciousness' }
        ],
        totalApplications: 2
      });

      const result = await launcher.getAvailableApplications();
      expect(result.applications.length).toBe(2);
    });

    test('should list running applications', async () => {
      launcher.getRunningApplications.mockResolvedValue({
        applications: [
          { name: 'quantum-knowledge-explorer', windowId: 'window-001', pid: 12345 }
        ],
        totalRunning: 1
      });

      const result = await launcher.getRunningApplications();
      expect(result.totalRunning).toBe(1);
    });
  });

  describe('Application Status', () => {
    test('should get application status', async () => {
      launcher.getApplicationStatus.mockResolvedValue({
        application: 'quantum-knowledge-explorer',
        windowId: 'window-001',
        status: 'running',
        uptime: 3600,
        responsive: true
      });

      const result = await launcher.getApplicationStatus({
        windowId: 'window-001'
      });

      expect(result.status).toBe('running');
      expect(result.responsive).toBe(true);
    });

    test('should detect unresponsive applications', async () => {
      launcher.getApplicationStatus.mockResolvedValue({
        application: 'test-app',
        status: 'running',
        responsive: false,
        warning: 'Application not responding'
      });

      const result = await launcher.getApplicationStatus({
        windowId: 'window-999'
      });

      expect(result.responsive).toBe(false);
    });
  });
});
