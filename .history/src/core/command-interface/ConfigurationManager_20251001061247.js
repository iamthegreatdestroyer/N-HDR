/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * ConfigurationManager.js
 * System-wide configuration management with security integration
 */

const VoidBladeHDR = require('../void-blade-hdr/VoidBladeHDR');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class ConfigurationManager {
    constructor(config = {}) {
        this.security = new VoidBladeHDR(config.security);
        this.configurations = new Map();
        this.templates = new Map();
        this.configHistory = [];
        this.state = {
            initialized: false,
            secure: false
        };

        this.configPath = config.configPath || path.join(process.cwd(), 'config');
        this.backupPath = config.backupPath || path.join(process.cwd(), 'backups');
    }

    /**
     * Initialize configuration manager
     * @param {Object} parameters Configuration initialization parameters
     * @returns {Promise<Object>} Initialization status
     */
    async initialize(parameters) {
        try {
            await this._setupSecurity();
            await this._loadTemplates();
            await this._ensureDirectories();
            
            this.state.initialized = true;
            this.state.secure = true;

            return {
                status: 'initialized',
                configs: this.configurations.size,
                templates: this.templates.size,
                timestamp: Date.now()
            };
        } catch (error) {
            throw new Error(`Configuration manager initialization failed: ${error.message}`);
        }
    }

    /**
     * Load configuration
     * @param {string} systemId System ID
     * @returns {Promise<Object>} Configuration data
     */
    async loadConfiguration(systemId) {
        if (!this.state.initialized) {
            throw new Error('Configuration manager not initialized');
        }

        try {
            const config = this.configurations.get(systemId);
            if (!config) {
                throw new Error(`Configuration not found: ${systemId}`);
            }

            await this.security.verifyAccess(config.security.zoneId);
            const decrypted = await this._decryptConfiguration(config.data);

            return {
                id: systemId,
                config: decrypted,
                version: config.version,
                timestamp: config.timestamp
            };
        } catch (error) {
            throw new Error(`Configuration load failed: ${error.message}`);
        }
    }

    /**
     * Save configuration
     * @param {string} systemId System ID
     * @param {Object} configData Configuration data
     * @returns {Promise<Object>} Save status
     */
    async saveConfiguration(systemId, configData) {
        if (!this.state.initialized) {
            throw new Error('Configuration manager not initialized');
        }

        try {
            await this._validateConfiguration(configData);
            const encrypted = await this._encryptConfiguration(configData);

            const existingConfig = this.configurations.get(systemId);
            if (existingConfig) {
                await this._backupConfiguration(systemId, existingConfig);
            }

            const securityZone = await this._createSecurityZone(systemId);
            const version = this._generateVersion();

            const config = {
                id: systemId,
                data: encrypted,
                version,
                security: {
                    zoneId: securityZone.id,
                    level: securityZone.level
                },
                timestamp: Date.now()
            };

            this.configurations.set(systemId, config);
            await this._persistConfiguration(config);
            this._recordConfigurationSave(config);

            return {
                id: systemId,
                version,
                timestamp: Date.now()
            };
        } catch (error) {
            throw new Error(`Configuration save failed: ${error.message}`);
        }
    }

    /**
     * Update configuration
     * @param {string} systemId System ID
     * @param {Object} updates Configuration updates
     * @returns {Promise<Object>} Update status
     */
    async updateConfiguration(systemId, updates) {
        const config = this.configurations.get(systemId);
        if (!config) {
            throw new Error(`Configuration not found: ${systemId}`);
        }

        await this.security.verifyAccess(config.security.zoneId);
        const current = await this._decryptConfiguration(config.data);
        const updated = this._mergeConfigurations(current, updates);

        return await this.saveConfiguration(systemId, updated);
    }

    /**
     * Get configuration version
     * @param {string} systemId System ID
     * @returns {Promise<Object>} Version information
     */
    async getConfigurationVersion(systemId) {
        const config = this.configurations.get(systemId);
        if (!config) {
            throw new Error(`Configuration not found: ${systemId}`);
        }

        await this.security.verifyAccess(config.security.zoneId);

        return {
            id: systemId,
            version: config.version,
            timestamp: config.timestamp
        };
    }

    /**
     * List configurations
     * @param {Object} filter Optional filter criteria
     * @returns {Promise<Array>} List of configurations
     */
    async listConfigurations(filter = {}) {
        const configs = Array.from(this.configurations.entries())
            .filter(([_, config]) => this._matchesFilter(config, filter))
            .map(([id, config]) => ({
                id,
                version: config.version,
                timestamp: config.timestamp
            }));

        return configs;
    }

    /**
     * Delete configuration
     * @param {string} systemId System ID
     * @returns {Promise<Object>} Deletion status
     */
    async deleteConfiguration(systemId) {
        const config = this.configurations.get(systemId);
        if (!config) {
            throw new Error(`Configuration not found: ${systemId}`);
        }

        await this.security.verifyAccess(config.security.zoneId);
        await this._backupConfiguration(systemId, config);
        await this.security.deactivateZone(config.security.zoneId);

        this.configurations.delete(systemId);
        await this._deletePersistedConfiguration(systemId);
        this._recordConfigurationDelete(systemId);

        return {
            id: systemId,
            status: 'deleted',
            timestamp: Date.now()
        };
    }

    /**
     * Compare configurations
     * @param {Object} current Current configuration
     * @param {Object} updated Updated configuration
     * @returns {Promise<Object>} Configuration differences
     */
    async compareConfigurations(current, updated) {
        const differences = {
            added: [],
            modified: [],
            removed: []
        };

        // Find added and modified
        for (const [key, value] of Object.entries(updated)) {
            if (!(key in current)) {
                differences.added.push(key);
            } else if (JSON.stringify(current[key]) !== JSON.stringify(value)) {
                differences.modified.push(key);
            }
        }

        // Find removed
        for (const key of Object.keys(current)) {
            if (!(key in updated)) {
                differences.removed.push(key);
            }
        }

        return differences;
    }

    /**
     * Get configuration template
     * @param {string} type Configuration type
     * @returns {Promise<Object>} Configuration template
     */
    async getConfigurationTemplate(type) {
        const template = this.templates.get(type);
        if (!template) {
            throw new Error(`Template not found: ${type}`);
        }

        return template;
    }

    /**
     * Set up manager security
     * @private
     */
    async _setupSecurity() {
        const zone = await this.security.createSecurityZone({
            type: 'config-manager',
            level: 'maximum'
        });

        await this.security.activateBarrier(zone.id, {
            type: 'quantum',
            strength: 'maximum'
        });
    }

    /**
     * Load configuration templates
     * @private
     */
    async _loadTemplates() {
        // Load core configuration templates
        this.templates.set('neural', {
            type: 'neural-hdr',
            required: ['layerCount', 'compression', 'security'],
            defaults: {
                layerCount: 6,
                compression: 'quantum',
                security: {
                    level: 'maximum',
                    encryption: 'aes-256-gcm'
                }
            }
        });

        this.templates.set('reality', {
            type: 'reality-hdr',
            required: ['dimensions', 'coordinates', 'security'],
            defaults: {
                dimensions: 4,
                coordinates: 'quantum',
                security: {
                    level: 'maximum',
                    barrier: 'hypersonic'
                }
            }
        });
    }

    /**
     * Ensure required directories exist
     * @private
     */
    async _ensureDirectories() {
        await fs.mkdir(this.configPath, { recursive: true });
        await fs.mkdir(this.backupPath, { recursive: true });
    }

    /**
     * Create security zone for configuration
     * @private
     * @param {string} systemId System ID
     * @returns {Promise<Object>} Security zone details
     */
    async _createSecurityZone(systemId) {
        return await this.security.createSecurityZone({
            type: 'configuration',
            systemId,
            level: 'maximum'
        });
    }

    /**
     * Validate configuration data
     * @private
     * @param {Object} configData Configuration to validate
     */
    async _validateConfiguration(configData) {
        if (!configData || typeof configData !== 'object') {
            throw new Error('Invalid configuration format');
        }

        if (configData.type) {
            const template = this.templates.get(configData.type);
            if (template) {
                for (const required of template.required) {
                    if (!(required in configData)) {
                        throw new Error(`Missing required field: ${required}`);
                    }
                }
            }
        }
    }

    /**
     * Generate version string
     * @private
     * @returns {string} Version string
     */
    _generateVersion() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Encrypt configuration
     * @private
     * @param {Object} configData Configuration to encrypt
     * @returns {Promise<Buffer>} Encrypted configuration
     */
    async _encryptConfiguration(configData) {
        const key = await this.security.generateKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(configData)),
            cipher.final()
        ]);

        const tag = cipher.getAuthTag();

        return Buffer.concat([iv, tag, encrypted]);
    }

    /**
     * Decrypt configuration
     * @private
     * @param {Buffer} encrypted Encrypted configuration
     * @returns {Promise<Object>} Decrypted configuration
     */
    async _decryptConfiguration(encrypted) {
        const key = await this.security.generateKey();
        const iv = encrypted.slice(0, 16);
        const tag = encrypted.slice(16, 32);
        const data = encrypted.slice(32);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);

        const decrypted = Buffer.concat([
            decipher.update(data),
            decipher.final()
        ]);

        return JSON.parse(decrypted.toString());
    }

    /**
     * Merge configurations
     * @private
     * @param {Object} current Current configuration
     * @param {Object} updates Configuration updates
     * @returns {Object} Merged configuration
     */
    _mergeConfigurations(current, updates) {
        return {
            ...current,
            ...updates,
            security: {
                ...current.security,
                ...(updates.security || {})
            }
        };
    }

    /**
     * Backup configuration
     * @private
     * @param {string} systemId System ID
     * @param {Object} config Configuration to backup
     */
    async _backupConfiguration(systemId, config) {
        const backupFile = path.join(
            this.backupPath,
            `${systemId}-${config.version}.bak`
        );

        await fs.writeFile(backupFile, JSON.stringify(config));
    }

    /**
     * Persist configuration
     * @private
     * @param {Object} config Configuration to persist
     */
    async _persistConfiguration(config) {
        const configFile = path.join(this.configPath, `${config.id}.json`);
        await fs.writeFile(configFile, JSON.stringify(config));
    }

    /**
     * Delete persisted configuration
     * @private
     * @param {string} systemId System ID
     */
    async _deletePersistedConfiguration(systemId) {
        const configFile = path.join(this.configPath, `${systemId}.json`);
        await fs.unlink(configFile);
    }

    /**
     * Record configuration save
     * @private
     * @param {Object} config Saved configuration
     */
    _recordConfigurationSave(config) {
        this.configHistory.push({
            type: 'save',
            config: {
                id: config.id,
                version: config.version
            },
            timestamp: Date.now()
        });
    }

    /**
     * Record configuration delete
     * @private
     * @param {string} systemId System ID
     */
    _recordConfigurationDelete(systemId) {
        this.configHistory.push({
            type: 'delete',
            systemId,
            timestamp: Date.now()
        });
    }

    /**
     * Check if configuration matches filter
     * @private
     * @param {Object} config Configuration
     * @param {Object} filter Filter criteria
     * @returns {boolean} Whether configuration matches filter
     */
    _matchesFilter(config, filter) {
        for (const [key, value] of Object.entries(filter)) {
            if (config[key] !== value) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get manager status
     * @returns {Object} Manager status
     */
    getStatus() {
        return {
            initialized: this.state.initialized,
            secure: this.state.secure,
            configurations: this.configurations.size,
            templates: this.templates.size,
            history: this.configHistory.length,
            timestamp: Date.now()
        };
    }
}

module.exports = ConfigurationManager;