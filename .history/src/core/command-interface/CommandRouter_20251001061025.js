/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * CommandRouter.js
 * Routes commands to appropriate HDR systems with validation and security
 */

const VoidBladeHDR = require('../void-blade-hdr/VoidBladeHDR');

class CommandRouter {
    constructor(config = {}) {
        this.security = new VoidBladeHDR(config.security);
        this.routes = new Map();
        this.validationRules = new Map();
        this.routingHistory = [];
        this.state = {
            initialized: false,
            secure: false
        };
    }

    /**
     * Initialize router
     * @param {Object} parameters Router initialization parameters
     * @returns {Promise<Object>} Initialization status
     */
    async initialize(parameters) {
        try {
            await this._setupSecurity();
            await this._loadValidationRules();
            
            this.state.initialized = true;
            this.state.secure = true;

            return {
                status: 'initialized',
                routes: this.routes.size,
                timestamp: Date.now()
            };
        } catch (error) {
            throw new Error(`Router initialization failed: ${error.message}`);
        }
    }

    /**
     * Register command route
     * @param {string} commandType Command type identifier
     * @param {Object} route Route configuration
     * @returns {Promise<Object>} Route registration
     */
    async registerRoute(commandType, route) {
        if (!this.state.initialized) {
            throw new Error('Router not initialized');
        }

        try {
            await this._validateRoute(route);
            const securityZone = await this._createSecurityZone(commandType);

            const registration = {
                type: commandType,
                systemId: route.systemId,
                validator: route.validator,
                security: {
                    zoneId: securityZone.id,
                    level: securityZone.level
                },
                timestamp: Date.now()
            };

            this.routes.set(commandType, registration);
            this._recordRouteRegistration(registration);

            return registration;
        } catch (error) {
            throw new Error(`Route registration failed: ${error.message}`);
        }
    }

    /**
     * Route command to system
     * @param {Object} command Command to route
     * @returns {Promise<Object>} Routing result
     */
    async routeCommand(command) {
        if (!this.state.initialized) {
            throw new Error('Router not initialized');
        }

        try {
            const route = this.routes.get(command.type);
            if (!route) {
                throw new Error(`No route found for command type: ${command.type}`);
            }

            await this.security.verifyAccess(route.security.zoneId);
            await this._validateCommand(command, route.validator);

            const result = {
                systemId: route.systemId,
                command: command,
                timestamp: Date.now()
            };

            this._recordRouting(result);
            return result;
        } catch (error) {
            throw new Error(`Command routing failed: ${error.message}`);
        }
    }

    /**
     * Get registered route
     * @param {string} commandType Command type
     * @returns {Promise<Object>} Route details
     */
    async getRoute(commandType) {
        const route = this.routes.get(commandType);
        if (!route) {
            throw new Error(`Route not found: ${commandType}`);
        }

        await this.security.verifyAccess(route.security.zoneId);
        return route;
    }

    /**
     * List registered routes
     * @param {Object} filter Optional filter criteria
     * @returns {Promise<Array>} List of routes
     */
    async listRoutes(filter = {}) {
        const routes = Array.from(this.routes.entries())
            .filter(([_, route]) => this._matchesFilter(route, filter))
            .map(([type, route]) => ({
                type,
                systemId: route.systemId,
                security: route.security.level
            }));

        return routes;
    }

    /**
     * Update route configuration
     * @param {string} commandType Command type
     * @param {Object} updates Route updates
     * @returns {Promise<Object>} Updated route
     */
    async updateRoute(commandType, updates) {
        const route = this.routes.get(commandType);
        if (!route) {
            throw new Error(`Route not found: ${commandType}`);
        }

        await this.security.verifyAccess(route.security.zoneId);
        await this._validateRoute(updates);

        const updated = {
            ...route,
            ...updates,
            timestamp: Date.now()
        };

        this.routes.set(commandType, updated);
        this._recordRouteUpdate(commandType, updated);

        return updated;
    }

    /**
     * Delete route
     * @param {string} commandType Command type
     * @returns {Promise<Object>} Deletion status
     */
    async deleteRoute(commandType) {
        const route = this.routes.get(commandType);
        if (!route) {
            throw new Error(`Route not found: ${commandType}`);
        }

        await this.security.verifyAccess(route.security.zoneId);
        await this.security.deactivateZone(route.security.zoneId);

        this.routes.delete(commandType);
        this._recordRouteDeletion(commandType);

        return {
            type: commandType,
            status: 'deleted',
            timestamp: Date.now()
        };
    }

    /**
     * Set up router security
     * @private
     */
    async _setupSecurity() {
        const zone = await this.security.createSecurityZone({
            type: 'command-router',
            level: 'maximum'
        });

        await this.security.activateBarrier(zone.id, {
            type: 'quantum',
            strength: 'maximum'
        });
    }

    /**
     * Load validation rules
     * @private
     */
    async _loadValidationRules() {
        // Load core command validation rules
        this.validationRules.set('neural', {
            required: ['systemId', 'parameters'],
            parameters: ['layerCount', 'compression']
        });

        this.validationRules.set('reality', {
            required: ['systemId', 'parameters'],
            parameters: ['dimension', 'coordinates']
        });

        this.validationRules.set('quantum', {
            required: ['systemId', 'parameters'],
            parameters: ['state', 'entanglement']
        });
    }

    /**
     * Validate route configuration
     * @private
     * @param {Object} route Route to validate
     */
    async _validateRoute(route) {
        if (!route.systemId) {
            throw new Error('Route must specify systemId');
        }

        if (route.validator && typeof route.validator !== 'function') {
            throw new Error('Route validator must be a function');
        }
    }

    /**
     * Create security zone for route
     * @private
     * @param {string} commandType Command type
     * @returns {Promise<Object>} Security zone details
     */
    async _createSecurityZone(commandType) {
        return await this.security.createSecurityZone({
            type: 'command-route',
            commandType,
            level: 'maximum'
        });
    }

    /**
     * Validate command
     * @private
     * @param {Object} command Command to validate
     * @param {Function} validator Custom validator function
     */
    async _validateCommand(command, validator) {
        // Check core requirements
        if (!command.type || !command.parameters) {
            throw new Error('Invalid command format');
        }

        // Apply type-specific validation rules
        const rules = this.validationRules.get(command.type);
        if (rules) {
            for (const required of rules.required) {
                if (!command[required]) {
                    throw new Error(`Missing required field: ${required}`);
                }
            }

            for (const param of rules.parameters) {
                if (!command.parameters[param]) {
                    throw new Error(`Missing required parameter: ${param}`);
                }
            }
        }

        // Apply custom validation if provided
        if (validator) {
            await validator(command);
        }
    }

    /**
     * Record route registration
     * @private
     * @param {Object} registration Route registration
     */
    _recordRouteRegistration(registration) {
        this.routingHistory.push({
            type: 'register',
            registration,
            timestamp: Date.now()
        });
    }

    /**
     * Record command routing
     * @private
     * @param {Object} result Routing result
     */
    _recordRouting(result) {
        this.routingHistory.push({
            type: 'route',
            result,
            timestamp: Date.now()
        });
    }

    /**
     * Record route update
     * @private
     * @param {string} commandType Command type
     * @param {Object} route Updated route
     */
    _recordRouteUpdate(commandType, route) {
        this.routingHistory.push({
            type: 'update',
            commandType,
            route,
            timestamp: Date.now()
        });
    }

    /**
     * Record route deletion
     * @private
     * @param {string} commandType Command type
     */
    _recordRouteDeletion(commandType) {
        this.routingHistory.push({
            type: 'delete',
            commandType,
            timestamp: Date.now()
        });
    }

    /**
     * Check if route matches filter
     * @private
     * @param {Object} route Route configuration
     * @param {Object} filter Filter criteria
     * @returns {boolean} Whether route matches filter
     */
    _matchesFilter(route, filter) {
        for (const [key, value] of Object.entries(filter)) {
            if (route[key] !== value) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get router status
     * @returns {Object} Router status
     */
    getStatus() {
        return {
            initialized: this.state.initialized,
            secure: this.state.secure,
            routes: this.routes.size,
            history: this.routingHistory.length,
            timestamp: Date.now()
        };
    }
}

module.exports = CommandRouter;