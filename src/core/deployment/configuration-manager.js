/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Configuration Manager - System settings and environment configuration management
 */

const fs = require("fs").promises;
const path = require("path");
const eventBus = require("../integration/event-bus");
const MetricsCollector = require("../integration/metrics-collector");
const crypto = require("crypto");

class ConfigurationManager {
  constructor(options = {}) {
    this.options = {
      configDir: path.join(process.cwd(), "config"),
      secretsFile: path.join(process.cwd(), "config", "secrets.enc"),
      defaultConfigFile: "default.json",
      environmentConfigFile: "environment.json",
      localConfigFile: "local.json",
      encryptionKey:
        process.env.NHDR_CONFIG_KEY || this._generateEncryptionKey(),
      validateSchema: true,
      watchForChanges: true,
      autoReload: true,
      ...options,
    };

    this.metrics = new MetricsCollector();
    this._config = new Map();
    this._secrets = new Map();
    this._schemas = new Map();
    this._watchers = new Map();
    this._cache = new Map();

    this._setupMetrics();
  }

  /**
   * Initialize configuration system
   */
  async initialize() {
    try {
      // Ensure config directory exists
      await fs.mkdir(this.options.configDir, { recursive: true });

      // Load configurations
      await this._loadConfigurations();

      // Set up file watchers if enabled
      if (this.options.watchForChanges) {
        await this._setupConfigWatchers();
      }

      // Publish initialization event
      eventBus.publish("configuration.initialized", {
        timestamp: Date.now(),
      });
    } catch (error) {
      eventBus.publish("configuration.error", {
        error: error.message,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key
   * @param {string} [environment] - Environment name
   */
  get(key, environment = process.env.NODE_ENV || "development") {
    const cacheKey = `${environment}:${key}`;

    // Check cache first
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    // Get configuration value with environment override
    const value = this._resolveConfigValue(key, environment);

    // Cache the result
    this._cache.set(cacheKey, value);

    return value;
  }

  /**
   * Set configuration value
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   * @param {string} [environment] - Environment name
   */
  async set(key, value, environment = process.env.NODE_ENV || "development") {
    try {
      // Validate value against schema if available
      if (this.options.validateSchema) {
        await this._validateValue(key, value);
      }

      // Update configuration
      const config = this._config.get(environment) || {};
      this._setNestedValue(config, key.split("."), value);
      this._config.set(environment, config);

      // Clear cache
      this._invalidateCache(key, environment);

      // Save to file
      await this._saveConfiguration(environment);

      // Publish change event
      eventBus.publish("configuration.changed", {
        key,
        environment,
        timestamp: Date.now(),
      });
    } catch (error) {
      eventBus.publish("configuration.error", {
        error: error.message,
        key,
        environment,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Get secret value
   * @param {string} key - Secret key
   */
  async getSecret(key) {
    try {
      // Load secrets if not loaded
      if (this._secrets.size === 0) {
        await this._loadSecrets();
      }

      return this._secrets.get(key);
    } catch (error) {
      eventBus.publish("configuration.error", {
        error: "Error accessing secret",
        key,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Set secret value
   * @param {string} key - Secret key
   * @param {string} value - Secret value
   */
  async setSecret(key, value) {
    try {
      // Encrypt and store secret
      this._secrets.set(key, value);
      await this._saveSecrets();

      // Publish event (without secret value)
      eventBus.publish("configuration.secret.changed", {
        key,
        timestamp: Date.now(),
      });
    } catch (error) {
      eventBus.publish("configuration.error", {
        error: "Error storing secret",
        key,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Register configuration schema
   * @param {string} key - Configuration key
   * @param {Object} schema - JSON schema
   */
  registerSchema(key, schema) {
    this._schemas.set(key, schema);
  }

  /**
   * Setup configuration metrics
   * @private
   */
  _setupMetrics() {
    this.metrics.registerMetric("configuration.changes", {
      type: "counter",
      description: "Number of configuration changes",
    });

    this.metrics.registerMetric("configuration.errors", {
      type: "counter",
      description: "Number of configuration errors",
    });

    this.metrics.registerMetric("configuration.access", {
      type: "counter",
      description: "Number of configuration accesses",
    });
  }

  /**
   * Load all configurations
   * @private
   */
  async _loadConfigurations() {
    try {
      // Load default configuration
      const defaultConfig = await this._loadConfigFile(
        this.options.defaultConfigFile
      );
      this._config.set("default", defaultConfig);

      // Load environment configurations
      const envConfigs = await this._loadConfigFile(
        this.options.environmentConfigFile
      );

      for (const [env, config] of Object.entries(envConfigs)) {
        this._config.set(env, {
          ...defaultConfig,
          ...config,
        });
      }

      // Load local configuration if exists
      try {
        const localConfig = await this._loadConfigFile(
          this.options.localConfigFile
        );
        this._config.set("local", localConfig);
      } catch (error) {
        // Local config is optional
      }
    } catch (error) {
      throw new Error(`Failed to load configurations: ${error.message}`);
    }
  }

  /**
   * Load configuration file
   * @private
   */
  async _loadConfigFile(filename) {
    const filePath = path.join(this.options.configDir, filename);
    try {
      const content = await fs.readFile(filePath, "utf8");
      return JSON.parse(content);
    } catch (error) {
      if (error.code === "ENOENT") {
        return {};
      }
      throw error;
    }
  }

  /**
   * Save configuration to file
   * @private
   */
  async _saveConfiguration(environment) {
    const config = this._config.get(environment);
    if (!config) return;

    const filename =
      environment === "default"
        ? this.options.defaultConfigFile
        : this.options.environmentConfigFile;

    const filePath = path.join(this.options.configDir, filename);

    try {
      await fs.writeFile(filePath, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }

  /**
   * Load encrypted secrets
   * @private
   */
  async _loadSecrets() {
    try {
      const content = await fs.readFile(this.options.secretsFile);
      const decrypted = this._decrypt(content);
      this._secrets = new Map(Object.entries(JSON.parse(decrypted)));
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw new Error(`Failed to load secrets: ${error.message}`);
      }
    }
  }

  /**
   * Save encrypted secrets
   * @private
   */
  async _saveSecrets() {
    const secrets = Object.fromEntries(this._secrets);
    const encrypted = this._encrypt(JSON.stringify(secrets));
    await fs.writeFile(this.options.secretsFile, encrypted);
  }

  /**
   * Encrypt data
   * @private
   */
  _encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(this.options.encryptionKey, "hex"),
      iv
    );

    const encrypted = Buffer.concat([
      cipher.update(data, "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt data
   * @private
   */
  _decrypt(data) {
    const iv = data.slice(0, 16);
    const authTag = data.slice(16, 32);
    const encrypted = data.slice(32);

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(this.options.encryptionKey, "hex"),
      iv
    );

    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  }

  /**
   * Generate encryption key
   * @private
   */
  _generateEncryptionKey() {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Setup configuration file watchers
   * @private
   */
  async _setupConfigWatchers() {
    const configFiles = [
      this.options.defaultConfigFile,
      this.options.environmentConfigFile,
      this.options.localConfigFile,
    ];

    for (const file of configFiles) {
      const filePath = path.join(this.options.configDir, file);

      try {
        const watcher = fs.watch(filePath);
        watcher.on("change", () => this._handleConfigChange(file));
        this._watchers.set(file, watcher);
      } catch (error) {
        // File might not exist yet
        console.warn(`Could not watch ${file}: ${error.message}`);
      }
    }
  }

  /**
   * Handle configuration file changes
   * @private
   */
  async _handleConfigChange(file) {
    if (!this.options.autoReload) return;

    try {
      // Reload configurations
      await this._loadConfigurations();

      // Clear cache
      this._cache.clear();

      // Publish change event
      eventBus.publish("configuration.reloaded", {
        file,
        timestamp: Date.now(),
      });
    } catch (error) {
      eventBus.publish("configuration.error", {
        error: error.message,
        file,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Resolve configuration value
   * @private
   */
  _resolveConfigValue(key, environment) {
    // Track access
    this.metrics.recordMetric("configuration.access", 1);

    const parts = key.split(".");

    // Try environment-specific config
    const envConfig = this._config.get(environment);
    if (envConfig) {
      const envValue = this._getNestedValue(envConfig, parts);
      if (envValue !== undefined) {
        return envValue;
      }
    }

    // Try local config
    const localConfig = this._config.get("local");
    if (localConfig) {
      const localValue = this._getNestedValue(localConfig, parts);
      if (localValue !== undefined) {
        return localValue;
      }
    }

    // Fall back to default config
    const defaultConfig = this._config.get("default");
    return defaultConfig
      ? this._getNestedValue(defaultConfig, parts)
      : undefined;
  }

  /**
   * Get nested object value
   * @private
   */
  _getNestedValue(obj, parts) {
    return parts.reduce((value, part) => {
      return value && value[part];
    }, obj);
  }

  /**
   * Set nested object value
   * @private
   */
  _setNestedValue(obj, parts, value) {
    const lastPart = parts.pop();
    const target = parts.reduce((obj, part) => {
      obj[part] = obj[part] || {};
      return obj[part];
    }, obj);
    target[lastPart] = value;
  }

  /**
   * Validate configuration value against schema
   * @private
   */
  async _validateValue(key, value) {
    const schema = this._schemas.get(key);
    if (!schema) return;

    // Basic schema validation
    for (const [field, rules] of Object.entries(schema)) {
      if (rules.required && value[field] === undefined) {
        throw new Error(`Missing required field: ${field}`);
      }

      if (rules.type && typeof value[field] !== rules.type) {
        throw new Error(`Invalid type for ${field}: expected ${rules.type}`);
      }

      if (rules.enum && !rules.enum.includes(value[field])) {
        throw new Error(
          `Invalid value for ${field}: must be one of ${rules.enum.join(", ")}`
        );
      }
    }
  }

  /**
   * Invalidate cache entries
   * @private
   */
  _invalidateCache(key, environment) {
    const cacheKey = `${environment}:${key}`;
    this._cache.delete(cacheKey);

    // Also invalidate parent keys
    const parts = key.split(".");
    while (parts.length > 1) {
      parts.pop();
      const parentKey = `${environment}:${parts.join(".")}`;
      this._cache.delete(parentKey);
    }
  }
}

module.exports = ConfigurationManager;
