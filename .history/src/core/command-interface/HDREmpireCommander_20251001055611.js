/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * HDR Empire Command Interface
 * Central command system for managing HDR Empire protocol subsystems.
 */

const SystemRegistry = require("./SystemRegistry");
const CommandRouter = require("./CommandRouter");
const SystemMonitor = require("./SystemMonitor");
const ConfigurationManager = require("./ConfigurationManager");
const VoidBladeHDR = require("../void-blade-hdr/VoidBladeHDR");

class HDREmpireCommander {
  constructor(config = {}) {
    this.systemRegistry = new SystemRegistry(config.registry);
    this.commandRouter = new CommandRouter(config.router);
    this.systemMonitor = new SystemMonitor(config.monitor);
    this.configManager = new ConfigurationManager(config.config);
    this.security = new VoidBladeHDR(config.security);

    this.activeSystems = new Map();
    this.commandHistory = [];
    this.securityLevel = "maximum";
    this.state = {
      initialized: false,
      secure: false,
      monitoring: false,
    };
  }

  /**
   * Initialize command interface
   * @param {Object} parameters - Initialization parameters
   * @returns {Promise<Object>} Initialization status
   */
  async initialize(parameters) {
    try {
      await this._initializeSubsystems(parameters);
      await this._setupSecurity();
      await this._startMonitoring();

      this.state.initialized = true;
      this.state.secure = true;
      this.state.monitoring = true;

      return {
        status: "initialized",
        security: this.securityLevel,
        systems: await this.systemRegistry.getRegisteredCount(),
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(
        `Command interface initialization failed: ${error.message}`
      );
    }
  }

  /**
   * Register HDR system
   * @param {Object} system - System to register
   * @param {Object} metadata - System metadata
   * @returns {Promise<Object>} Registration status
   */
  async registerSystem(system, metadata) {
    try {
      await this._validateSystem(system);
      const registration = await this.systemRegistry.register(system, metadata);
      await this._setupSystemSecurity(registration);
      await this.systemMonitor.startMonitoring(registration);

      this.activeSystems.set(registration.id, {
        system,
        metadata,
        status: "active",
        timestamp: Date.now(),
      });

      return {
        id: registration.id,
        status: "registered",
        security: await this._getSystemSecurity(registration),
        monitoring: true,
      };
    } catch (error) {
      throw new Error(`System registration failed: ${error.message}`);
    }
  }

  /**
   * Execute command
   * @param {Object} command - Command to execute
   * @param {Object} context - Command context
   * @returns {Promise<Object>} Command result
   */
  async executeCommand(command, context = {}) {
    try {
      await this._validateCommand(command);
      await this._authorizeCommand(command, context);

      const route = await this.commandRouter.routeCommand(command);
      const result = await this._executeCommandRoute(route, command);

      await this._recordCommand(command, result);
      await this._updateSystemState(result);

      return {
        commandId: command.id,
        status: result.status,
        output: result.output,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  /**
   * Get system status
   * @param {string} systemId - System ID
   * @returns {Promise<Object>} System status
   */
  async getSystemStatus(systemId) {
    try {
      const system = this.activeSystems.get(systemId);
      if (!system) {
        throw new Error(`System not found: ${systemId}`);
      }

      const monitoring = await this.systemMonitor.getStatus(systemId);
      const security = await this._getSystemSecurity({ id: systemId });

      return {
        id: systemId,
        status: system.status,
        health: monitoring.health,
        security: security.level,
        lastCommand: await this._getLastCommand(systemId),
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Status retrieval failed: ${error.message}`);
    }
  }

  /**
   * Configure system
   * @param {string} systemId - System ID
   * @param {Object} configuration - Configuration updates
   * @returns {Promise<Object>} Configuration status
   */
  async configureSystem(systemId, configuration) {
    try {
      const system = this.activeSystems.get(systemId);
      if (!system) {
        throw new Error(`System not found: ${systemId}`);
      }

      await this._validateConfiguration(configuration);
      const updated = await this.configManager.updateConfiguration(
        systemId,
        configuration
      );

      await this._reconfigureSystem(system, updated);
      await this._updateSecurity(systemId, updated);

      return {
        id: systemId,
        status: "configured",
        changes: await this._getConfigurationChanges(
          system.metadata.config,
          updated
        ),
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`System configuration failed: ${error.message}`);
    }
  }

  /**
   * Initialize subsystems
   * @private
   * @param {Object} parameters - Initialization parameters
   * @returns {Promise<void>}
   */
  async _initializeSubsystems(parameters) {
    await Promise.all([
      this.systemRegistry.initialize(parameters.registry),
      this.commandRouter.initialize(parameters.router),
      this.systemMonitor.initialize(parameters.monitor),
      this.configManager.initialize(parameters.config),
      this.security.initialize(parameters.security),
    ]);
  }

  /**
   * Setup security system
   * @private
   * @returns {Promise<void>}
   */
  async _setupSecurity() {
    const zone = await this.security.createSecurityZone({
      type: "command-interface",
      level: this.securityLevel,
    });

    await this.security.activateBarrier(zone.id, {
      type: "quantum",
      strength: "maximum",
    });
  }

  /**
   * Start system monitoring
   * @private
   * @returns {Promise<void>}
   */
  async _startMonitoring() {
    await this.systemMonitor.startGlobalMonitoring();
  }

  /**
   * Validate system for registration
   * @private
   * @param {Object} system - System to validate
   * @returns {Promise<void>}
   */
  async _validateSystem(system) {
    if (!system.initialize || !system.execute) {
      throw new Error("Invalid system interface");
    }
  }

  /**
   * Setup system security
   * @private
   * @param {Object} registration - System registration
   * @returns {Promise<void>}
   */
  async _setupSystemSecurity(registration) {
    const zone = await this.security.createSecurityZone({
      type: "hdr-system",
      systemId: registration.id,
      level: this.securityLevel,
    });

    await this.security.activateBarrier(zone.id, {
      type: "hypersonic",
      strength: "maximum",
    });
  }

  /**
   * Get system security status
   * @private
   * @param {Object} registration - System registration
   * @returns {Promise<Object>} Security status
   */
  async _getSystemSecurity(registration) {
    const zones = await this.security.listActiveZones();
    const systemZone = zones.find((zone) => zone.id.includes(registration.id));

    return {
      level: this.securityLevel,
      zone: systemZone?.id,
      protection: systemZone?.status || "none",
    };
  }

  /**
   * Validate command before execution
   * @private
   * @param {Object} command - Command to validate
   * @returns {Promise<void>}
   */
  async _validateCommand(command) {
    if (!command.type || !command.parameters) {
      throw new Error("Invalid command format");
    }
  }

  /**
   * Authorize command execution
   * @private
   * @param {Object} command - Command to authorize
   * @param {Object} context - Command context
   * @returns {Promise<void>}
   */
  async _authorizeCommand(command, context) {
    const systemId = command.systemId;
    const system = this.activeSystems.get(systemId);

    if (!system) {
      throw new Error(`System not found: ${systemId}`);
    }

    await this.security.verifyAccess(system.security?.zoneId);
  }

  /**
   * Execute routed command
   * @private
   * @param {Object} route - Command route
   * @param {Object} command - Command to execute
   * @returns {Promise<Object>} Command result
   */
  async _executeCommandRoute(route, command) {
    const system = this.activeSystems.get(route.systemId);
    if (!system) {
      throw new Error(`System not found: ${route.systemId}`);
    }

    return await system.system.execute(command.type, command.parameters);
  }

  /**
   * Record command execution
   * @private
   * @param {Object} command - Executed command
   * @param {Object} result - Command result
   * @returns {Promise<void>}
   */
  async _recordCommand(command, result) {
    this.commandHistory.push({
      command,
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Update system state after command
   * @private
   * @param {Object} result - Command result
   * @returns {Promise<void>}
   */
  async _updateSystemState(result) {
    if (result.systemId) {
      const system = this.activeSystems.get(result.systemId);
      if (system) {
        system.status = result.status || system.status;
        system.timestamp = Date.now();
      }
    }
  }

  /**
   * Get last command for system
   * @private
   * @param {string} systemId - System ID
   * @returns {Promise<Object>} Last command
   */
  async _getLastCommand(systemId) {
    return this.commandHistory
      .reverse()
      .find((entry) => entry.command.systemId === systemId);
  }

  /**
   * Validate configuration updates
   * @private
   * @param {Object} configuration - Configuration to validate
   * @returns {Promise<void>}
   */
  async _validateConfiguration(configuration) {
    if (!configuration || typeof configuration !== "object") {
      throw new Error("Invalid configuration format");
    }
  }

  /**
   * Reconfigure system
   * @private
   * @param {Object} system - System to reconfigure
   * @param {Object} configuration - New configuration
   * @returns {Promise<void>}
   */
  async _reconfigureSystem(system, configuration) {
    await system.system.initialize(configuration);
  }

  /**
   * Update system security
   * @private
   * @param {string} systemId - System ID
   * @param {Object} configuration - New configuration
   * @returns {Promise<void>}
   */
  async _updateSecurity(systemId, configuration) {
    const zones = await this.security.listActiveZones();
    const systemZone = zones.find((zone) => zone.id.includes(systemId));

    if (systemZone) {
      await this.security.updateSecurityLevel(
        systemZone.id,
        configuration.security?.level || this.securityLevel
      );
    }
  }

  /**
   * Get configuration changes
   * @private
   * @param {Object} current - Current configuration
   * @param {Object} updated - Updated configuration
   * @returns {Promise<Object>} Configuration changes
   */
  async _getConfigurationChanges(current, updated) {
    return this.configManager.compareConfigurations(current, updated);
  }

  /**
   * Get interface status
   * @returns {Object} Interface status
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      secure: this.state.secure,
      monitoring: this.state.monitoring,
      systems: this.activeSystems.size,
      commands: this.commandHistory.length,
      securityLevel: this.securityLevel,
      timestamp: Date.now(),
    };
  }

  /**
   * List active systems
   * @returns {Array<Object>} Active systems
   */
  listActiveSystems() {
    return Array.from(this.activeSystems.values()).map((system) => ({
      id: system.metadata.id,
      type: system.metadata.type,
      status: system.status,
      timestamp: system.timestamp,
    }));
  }

  /**
   * Get command history
   * @param {string} systemId - Optional system ID filter
   * @returns {Array<Object>} Command history
   */
  getCommandHistory(systemId = null) {
    let history = this.commandHistory;

    if (systemId) {
      history = history.filter((entry) => entry.command.systemId === systemId);
    }

    return history.map((entry) => ({
      commandId: entry.command.id,
      type: entry.command.type,
      status: entry.result.status,
      timestamp: entry.timestamp,
    }));
  }
}

module.exports = HDREmpireCommander;
