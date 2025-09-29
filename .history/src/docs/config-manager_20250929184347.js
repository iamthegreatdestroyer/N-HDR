/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Configuration manager for documentation system.
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const deepmerge = require('deepmerge');
const { cosmiconfigSync } = require('cosmiconfig');

class ConfigManager {
  /**
   * Create new configuration manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      configName: options.configName || 'documentation',
      defaultConfigPath: options.defaultConfigPath || path.join(__dirname, 'defaults'),
      ...options
    };

    this.config = null;
    this.explorerSync = cosmiconfigSync(this.options.configName);
  }

  /**
   * Load configuration
   * @param {string} [configPath] - Optional path to config file
   * @returns {Promise<Object>} Configuration object
   */
  async load(configPath = null) {
    try {
      // Load default configuration
      const defaultConfig = await this._loadDefaultConfig();

      // Load user configuration
      let userConfig = {};
      
      if (configPath) {
        // Load from specific path
        userConfig = await this._loadConfigFile(configPath);
      } else {
        // Search for configuration file
        const result = this.explorerSync.search();
        if (result) {
          userConfig = result.config;
        }
      }

      // Merge configurations
      this.config = deepmerge(defaultConfig, userConfig);

      // Validate configuration
      await this._validateConfig(this.config);

      return this.config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Load default configuration
   * @returns {Promise<Object>} Default configuration
   * @private
   */
  async _loadDefaultConfig() {
    try {
      const defaultConfig = await fs.readFile(
        path.join(this.options.defaultConfigPath, 'default.yaml'),
        'utf8'
      );
      return yaml.load(defaultConfig);
    } catch (error) {
      console.warn('Failed to load default configuration:', error);
      return {};
    }
  }

  /**
   * Load configuration from file
   * @param {string} filePath - Path to configuration file
   * @returns {Promise<Object>} Configuration object
   * @private
   */
  async _loadConfigFile(filePath) {
    try {
      const ext = path.extname(filePath);
      const content = await fs.readFile(filePath, 'utf8');

      switch (ext) {
        case '.json':
          return JSON.parse(content);
        case '.yaml':
        case '.yml':
          return yaml.load(content);
        case '.js':
          return require(filePath);
        default:
          throw new Error(`Unsupported configuration file type: ${ext}`);
      }
    } catch (error) {
      throw new Error(`Failed to load config file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Validate configuration object
   * @param {Object} config - Configuration to validate
   * @private
   */
  async _validateConfig(config) {
    // Load validation schema
    const schema = await this._loadValidationSchema();

    // Validate configuration against schema
    const Ajv = require('ajv');
    const ajv = new Ajv();
    const validate = ajv.compile(schema);

    if (!validate(config)) {
      const errors = validate.errors.map(e => `${e.dataPath} ${e.message}`).join('\n');
      throw new Error(`Invalid configuration:\n${errors}`);
    }
  }

  /**
   * Load validation schema
   * @returns {Promise<Object>} JSON Schema for configuration
   * @private
   */
  async _loadValidationSchema() {
    try {
      const schemaPath = path.join(this.options.defaultConfigPath, 'schema.json');
      const schema = await fs.readFile(schemaPath, 'utf8');
      return JSON.parse(schema);
    } catch (error) {
      console.warn('Failed to load validation schema:', error);
      return {};
    }
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key (dot notation supported)
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Configuration value
   */
  get(key, defaultValue = undefined) {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    const value = key.split('.').reduce((obj, k) => obj && obj[k], this.config);
    return value === undefined ? defaultValue : value;
  }

  /**
   * Set configuration value
   * @param {string} key - Configuration key (dot notation supported)
   * @param {*} value - Value to set
   */
  set(key, value) {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    const keys = key.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, k) => {
      if (!(k in obj)) obj[k] = {};
      return obj[k];
    }, this.config);

    target[lastKey] = value;
  }

  /**
   * Save configuration to file
   * @param {string} filePath - Path to save configuration
   */
  async save(filePath) {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    try {
      const ext = path.extname(filePath);
      let content;

      switch (ext) {
        case '.json':
          content = JSON.stringify(this.config, null, 2);
          break;
        case '.yaml':
        case '.yml':
          content = yaml.dump(this.config);
          break;
        default:
          throw new Error(`Unsupported configuration file type: ${ext}`);
      }

      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }
}

module.exports = ConfigManager;