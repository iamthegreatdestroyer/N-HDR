/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * UnifiedController.js
 * Provides centralized control for all HDR system components
 */

const { EventEmitter } = require('events');
const StateTranslator = require('./StateTranslator');

class UnifiedController extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            autoSync: config.autoSync || true,
            syncInterval: config.syncInterval || 1000,
            errorThreshold: config.errorThreshold || 3,
            ...config
        };

        this.state = {
            initialized: false,
            syncing: false,
            error: null,
            timestamp: Date.now()
        };

        this.components = new Map();
        this.translator = new StateTranslator(config.translator);
        this.syncTimer = null;
        this.errorCount = 0;
    }

    /**
     * Initialize unified controller
     * @param {Object} parameters - Initialization parameters
     * @returns {Promise<Object>} Initialization status
     */
    async initialize(parameters = {}) {
        try {
            await this._initializeComponents(parameters);
            await this.translator.initialize();

            if (this.config.autoSync) {
                this._startAutoSync();
            }

            this.state.initialized = true;
            this.emit('initialized', { timestamp: Date.now() });

            return {
                status: 'initialized',
                components: this.components.size,
                timestamp: Date.now()
            };
        } catch (error) {
            throw new Error(`Controller initialization failed: ${error.message}`);
        }
    }

    /**
     * Register component
     * @param {string} name - Component name
     * @param {Object} component - Component instance
     * @returns {Promise<Object>} Registration status
     */
    async registerComponent(name, component) {
        if (!component || typeof component.getState !== 'function') {
            throw new Error('Invalid component: must implement getState method');
        }

        this.components.set(name, component);
        this.emit('componentRegistered', { name, timestamp: Date.now() });

        return {
            status: 'registered',
            name,
            timestamp: Date.now()
        };
    }

    /**
     * Sync component states
     * @returns {Promise<Object>} Sync status
     */
    async syncStates() {
        if (!this.state.initialized) {
            throw new Error('Controller not initialized');
        }

        try {
            this.state.syncing = true;
            const states = new Map();

            // Collect states from all components
            for (const [name, component] of this.components) {
                states.set(name, await component.getState());
            }

            // Translate states
            const translated = await this.translator.translateStates(states);

            // Update components with translated states
            for (const [name, state] of translated) {
                const component = this.components.get(name);
                if (component && typeof component.setState === 'function') {
                    await component.setState(state);
                }
            }

            this.errorCount = 0;
            this.state.syncing = false;
            this.emit('statesSynced', { timestamp: Date.now() });

            return {
                status: 'synced',
                components: translated.size,
                timestamp: Date.now()
            };
        } catch (error) {
            this.errorCount++;
            this.state.error = error.message;
            this.state.syncing = false;

            if (this.errorCount >= this.config.errorThreshold) {
                this._stopAutoSync();
            }

            throw new Error(`State sync failed: ${error.message}`);
        }
    }

    /**
     * Initialize components
     * @private
     * @param {Object} parameters - Initialization parameters
     */
    async _initializeComponents(parameters) {
        for (const [name, component] of this.components) {
            if (typeof component.initialize === 'function') {
                await component.initialize(parameters);
            }
        }
    }

    /**
     * Start auto sync
     * @private
     */
    _startAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        this.syncTimer = setInterval(async () => {
            try {
                await this.syncStates();
            } catch (error) {
                this.emit('syncError', { error: error.message, timestamp: Date.now() });
            }
        }, this.config.syncInterval);
    }

    /**
     * Stop auto sync
     * @private
     */
    _stopAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    /**
     * Get controller status
     * @returns {Object} Current status
     */
    getStatus() {
        return {
            initialized: this.state.initialized,
            syncing: this.state.syncing,
            components: this.components.size,
            error: this.state.error,
            errorCount: this.errorCount,
            autoSync: Boolean(this.syncTimer),
            timestamp: Date.now()
        };
    }

    /**
     * Get component
     * @param {string} name - Component name
     * @returns {Object|null} Component instance
     */
    getComponent(name) {
        return this.components.get(name) || null;
    }

    /**
     * Remove component
     * @param {string} name - Component name
     * @returns {Promise<Object>} Removal status
     */
    async removeComponent(name) {
        const component = this.components.get(name);
        if (component) {
            if (typeof component.cleanup === 'function') {
                await component.cleanup();
            }
            this.components.delete(name);
            this.emit('componentRemoved', { name, timestamp: Date.now() });
        }

        return {
            status: 'removed',
            name,
            timestamp: Date.now()
        };
    }

    /**
     * Cleanup controller
     */
    async cleanup() {
        this._stopAutoSync();
        
        for (const [name, component] of this.components) {
            await this.removeComponent(name);
        }

        this.state.initialized = false;
        this.emit('cleaned', { timestamp: Date.now() });
    }
}

module.exports = UnifiedController;