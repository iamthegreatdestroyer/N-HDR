/*
 * HDR Empire Framework - Command Console
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import EventEmitter from 'events';

/**
 * CommandConsole - Natural language command interface
 * 
 * Provides intuitive command execution with:
 * - Natural language processing
 * - Command history
 * - Auto-completion
 * - Command templates
 * - Batch execution
 * - Script support
 * 
 * Supported command formats:
 * - Direct: "neural-hdr.captureState(data)"
 * - Natural: "capture consciousness state from data"
 * - Shorthand: "nhdr.capture(data)"
 */
export class CommandConsole extends EventEmitter {
  constructor() {
    super();
    
    this.commander = null;
    this.isInitialized = false;
    this.enableNLP = true;
    
    this.history = [];
    this.maxHistory = 1000;
    
    this.aliases = {
      // System aliases
      'nhdr': 'neural-hdr',
      'nshdr': 'nano-swarm',
      'ohdr': 'omniscient-hdr',
      'qhdr': 'quantum-hdr',
      'rhdr': 'reality-hdr',
      'dhdr': 'dream-hdr',
      'vbhdr': 'void-blade-hdr',
      
      // Command aliases
      'capture': 'captureState',
      'transfer': 'transferState',
      'deploy': 'deploySwarm',
      'crystallize': 'crystallizeKnowledge',
      'explore': 'exploreProbabilities',
      'compress': 'compressSpace',
      'amplify': 'amplifyCreativity',
      'protect': 'activateProtection'
    };
    
    this.templates = {
      'capture-state': {
        system: 'neural-hdr',
        command: 'captureState',
        params: ['source']
      },
      'deploy-swarm': {
        system: 'nano-swarm',
        command: 'deploySwarm',
        params: ['target', 'config']
      },
      'crystallize-knowledge': {
        system: 'omniscient-hdr',
        command: 'crystallize',
        params: ['knowledge', 'options']
      }
    };
  }

  /**
   * Initialize console
   */
  async initialize(commander, options = {}) {
    try {
      if (this.isInitialized) {
        throw new Error('Command console already initialized');
      }

      this.commander = commander;
      this.enableNLP = options.enableNLP !== false;
      
      // Load custom aliases if provided
      if (options.aliases) {
        this.aliases = { ...this.aliases, ...options.aliases };
      }
      
      // Load custom templates if provided
      if (options.templates) {
        this.templates = { ...this.templates, ...options.templates };
      }
      
      this.isInitialized = true;
      
      this.emit('initialized', {
        nlpEnabled: this.enableNLP,
        aliasCount: Object.keys(this.aliases).length,
        templateCount: Object.keys(this.templates).length
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Command console initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute command
   */
  async execute(command, options = {}) {
    try {
      const startTime = Date.now();
      
      // Parse command
      const parsed = await this._parseCommand(command);
      
      if (!parsed) {
        throw new Error(`Unable to parse command: ${command}`);
      }
      
      // Execute through commander
      const result = await this.commander.executeCommand(
        parsed.system,
        parsed.command,
        parsed.params || {}
      );
      
      const executionTime = Date.now() - startTime;
      
      // Record in history
      this._addToHistory({
        command,
        parsed,
        result,
        executionTime,
        success: true,
        timestamp: Date.now()
      });
      
      this.emit('commandExecuted', {
        command,
        result,
        executionTime
      });
      
      return {
        success: true,
        result,
        executionTime
      };
      
    } catch (error) {
      // Record failed command in history
      this._addToHistory({
        command,
        error: error.message,
        success: false,
        timestamp: Date.now()
      });
      
      this.emit('commandFailed', {
        command,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Parse command string
   */
  async _parseCommand(command) {
    // Try template match first
    const template = this._matchTemplate(command);
    if (template) {
      return this._parseTemplate(template, command);
    }
    
    // Try direct format: "system.command(params)"
    const direct = this._parseDirectFormat(command);
    if (direct) {
      return direct;
    }
    
    // Try natural language if enabled
    if (this.enableNLP) {
      return await this._parseNaturalLanguage(command);
    }
    
    return null;
  }

  /**
   * Match command to template
   */
  _matchTemplate(command) {
    for (const [name, template] of Object.entries(this.templates)) {
      if (command.startsWith(name)) {
        return { name, template };
      }
    }
    return null;
  }

  /**
   * Parse template-based command
   */
  _parseTemplate(templateMatch, command) {
    const { template } = templateMatch;
    
    // Extract parameters from command
    const paramMatch = command.match(/\((.*)\)/);
    const params = paramMatch ? this._parseParams(paramMatch[1]) : {};
    
    return {
      system: template.system,
      command: template.command,
      params
    };
  }

  /**
   * Parse direct format command
   */
  _parseDirectFormat(command) {
    // Match: "system.command(params)"
    const match = command.match(/^([a-z-]+)\.([a-zA-Z]+)\((.*)\)$/);
    
    if (!match) return null;
    
    let [, system, cmd, paramsStr] = match;
    
    // Apply aliases
    system = this.aliases[system] || system;
    cmd = this.aliases[cmd] || cmd;
    
    const params = this._parseParams(paramsStr);
    
    return { system, command: cmd, params };
  }

  /**
   * Parse natural language command
   */
  async _parseNaturalLanguage(command) {
    // Simple NLP parsing - can be enhanced with more sophisticated NLP
    const lower = command.toLowerCase();
    
    // Neural-HDR patterns
    if (lower.includes('capture') && lower.includes('state')) {
      return {
        system: 'neural-hdr',
        command: 'captureState',
        params: this._extractParams(command)
      };
    }
    
    // Nano-Swarm patterns
    if (lower.includes('deploy') && lower.includes('swarm')) {
      return {
        system: 'nano-swarm',
        command: 'deploySwarm',
        params: this._extractParams(command)
      };
    }
    
    // Omniscient-HDR patterns
    if (lower.includes('crystallize') || lower.includes('knowledge')) {
      return {
        system: 'omniscient-hdr',
        command: 'crystallize',
        params: this._extractParams(command)
      };
    }
    
    // Quantum-HDR patterns
    if (lower.includes('explore') || lower.includes('probability')) {
      return {
        system: 'quantum-hdr',
        command: 'exploreProbabilities',
        params: this._extractParams(command)
      };
    }
    
    // Reality-HDR patterns
    if (lower.includes('compress') || lower.includes('space')) {
      return {
        system: 'reality-hdr',
        command: 'compressSpace',
        params: this._extractParams(command)
      };
    }
    
    // Dream-HDR patterns
    if (lower.includes('amplify') || lower.includes('creativity')) {
      return {
        system: 'dream-hdr',
        command: 'amplifyCreativity',
        params: this._extractParams(command)
      };
    }
    
    // Void-Blade-HDR patterns
    if (lower.includes('protect') || lower.includes('security')) {
      return {
        system: 'void-blade-hdr',
        command: 'activateProtection',
        params: this._extractParams(command)
      };
    }
    
    return null;
  }

  /**
   * Parse parameter string
   */
  _parseParams(paramsStr) {
    if (!paramsStr || paramsStr.trim() === '') {
      return {};
    }
    
    try {
      // Try JSON parse
      return JSON.parse(paramsStr);
    } catch {
      // Fallback to simple parsing
      return { value: paramsStr };
    }
  }

  /**
   * Extract parameters from natural language
   */
  _extractParams(command) {
    // Simple parameter extraction - can be enhanced
    const params = {};
    
    // Extract quoted strings
    const quoted = command.match(/"([^"]+)"/g);
    if (quoted && quoted.length > 0) {
      params.value = quoted[0].replace(/"/g, '');
    }
    
    return params;
  }

  /**
   * Add command to history
   */
  _addToHistory(entry) {
    this.history.push(entry);
    
    // Trim history if too long
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  /**
   * Get command history
   */
  async getHistory(limit = 50) {
    return this.history.slice(-limit);
  }

  /**
   * Clear history
   */
  clearHistory() {
    const count = this.history.length;
    this.history = [];
    return { cleared: count };
  }

  /**
   * Get command suggestions
   */
  getSuggestions(partial) {
    const suggestions = [];
    
    // Template suggestions
    for (const name of Object.keys(this.templates)) {
      if (name.startsWith(partial.toLowerCase())) {
        suggestions.push(name);
      }
    }
    
    // System.command suggestions
    const systems = ['neural-hdr', 'nano-swarm', 'omniscient-hdr', 
                     'quantum-hdr', 'reality-hdr', 'dream-hdr', 'void-blade-hdr'];
    
    for (const system of systems) {
      if (system.startsWith(partial.toLowerCase())) {
        suggestions.push(system);
      }
    }
    
    return suggestions;
  }

  /**
   * Shutdown console
   */
  async shutdown() {
    this.isInitialized = false;
    this.emit('shutdown');
    return { success: true };
  }
}
