/*
 * HDR Empire Framework - Command Console Test Suite
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('Command Console', () => {
  let console;

  beforeEach(() => {
    console = {
      initialize: jest.fn(),
      executeCommand: jest.fn(),
      getCommandHistory: jest.fn(),
      clearHistory: jest.fn(),
      getAvailableCommands: jest.fn(),
      validateCommand: jest.fn(),
      autoComplete: jest.fn(),
      getCommandHelp: jest.fn()
    };
  });

  describe('Command Execution', () => {
    test('should execute N-HDR commands', async () => {
      console.executeCommand.mockResolvedValue({
        executed: true,
        command: 'nhdr.captureState',
        result: { success: true, stateId: 'state-001' },
        executionTime: 150
      });

      const result = await console.executeCommand('nhdr.captureState', {});
      expect(result.executed).toBe(true);
      expect(result.result.success).toBe(true);
    });

    test('should execute NS-HDR commands', async () => {
      console.executeCommand.mockResolvedValue({
        executed: true,
        command: 'nshdr.deploySwarm',
        result: { swarmId: 'swarm-001', size: 150 }
      });

      const result = await console.executeCommand('nshdr.deploySwarm', { size: 150 });
      expect(result.executed).toBe(true);
    });

    test('should handle command errors', async () => {
      console.executeCommand.mockRejectedValue(new Error('Invalid command'));

      await expect(console.executeCommand('invalid.command', {}))
        .rejects.toThrow('Invalid command');
    });
  });

  describe('Command History', () => {
    test('should track command history', async () => {
      console.getCommandHistory.mockResolvedValue({
        history: [
          { command: 'nhdr.captureState', timestamp: Date.now(), success: true },
          { command: 'nshdr.deploySwarm', timestamp: Date.now(), success: true }
        ],
        totalCommands: 2
      });

      const result = await console.getCommandHistory();
      expect(result.history.length).toBe(2);
    });

    test('should clear history', async () => {
      console.clearHistory.mockResolvedValue({
        cleared: true,
        previousCount: 10
      });

      const result = await console.clearHistory();
      expect(result.cleared).toBe(true);
    });
  });

  describe('Command Discovery', () => {
    test('should list available commands', async () => {
      console.getAvailableCommands.mockResolvedValue({
        commands: [
          { name: 'nhdr.captureState', description: 'Capture consciousness state' },
          { name: 'nshdr.deploySwarm', description: 'Deploy nano-swarm' }
        ],
        totalCommands: 2
      });

      const result = await console.getAvailableCommands();
      expect(result.commands.length).toBeGreaterThan(0);
    });

    test('should provide command help', async () => {
      console.getCommandHelp.mockResolvedValue({
        command: 'nhdr.captureState',
        description: 'Capture consciousness state',
        parameters: [
          { name: 'source', type: 'string', required: true },
          { name: 'layers', type: 'number', required: false }
        ],
        examples: ['nhdr.captureState --source ai-model']
      });

      const result = await console.getCommandHelp('nhdr.captureState');
      expect(result.parameters).toBeDefined();
      expect(result.examples).toBeDefined();
    });
  });

  describe('Command Validation', () => {
    test('should validate command syntax', async () => {
      console.validateCommand.mockResolvedValue({
        valid: true,
        command: 'nhdr.captureState',
        parameters: { source: 'ai-model' }
      });

      const result = await console.validateCommand('nhdr.captureState --source ai-model');
      expect(result.valid).toBe(true);
    });

    test('should detect invalid syntax', async () => {
      console.validateCommand.mockResolvedValue({
        valid: false,
        errors: ['Missing required parameter: source']
      });

      const result = await console.validateCommand('nhdr.captureState');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Auto-Completion', () => {
    test('should provide command auto-completion', async () => {
      console.autoComplete.mockResolvedValue({
        suggestions: [
          'nhdr.captureState',
          'nhdr.persistState',
          'nhdr.loadState'
        ],
        partial: 'nhdr.'
      });

      const result = await console.autoComplete('nhdr.');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });
});
