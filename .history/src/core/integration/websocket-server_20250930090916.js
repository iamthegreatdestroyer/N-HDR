/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * WebSocket Server - Real-time communication interface for Neural-HDR system
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const eventBus = require('./event-bus');

class WebSocketServer {
    constructor(options = {}) {
        this.options = {
            port: process.env.WS_PORT || 3001,
            jwtSecret: process.env.JWT_SECRET || 'nhdr-development-secret',
            pingInterval: 30000, // 30 seconds
            maxPayloadSize: 1024 * 1024, // 1MB
            ...options
        };

        this._clients = new Map();
        this._subscriptions = new Map();
        this._metrics = {
            totalConnections: 0,
            activeConnections: 0,
            messagesSent: 0,
            messagesReceived: 0,
            errors: 0
        };
    }

    /**
     * Start WebSocket server
     */
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.wss = new WebSocket.Server({
                    port: this.options.port,
                    maxPayload: this.options.maxPayloadSize
                });

                this._setupServerHandlers();
                this._startHeartbeat();
                this._setupMetricsReporting();

                console.log(`WebSocket Server listening on port ${this.options.port}`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Stop WebSocket server
     */
    async stop() {
        return new Promise((resolve, reject) => {
            try {
                // Close all client connections
                this._clients.forEach(client => {
                    if (client.ws.readyState === WebSocket.OPEN) {
                        client.ws.close(1000, 'Server shutting down');
                    }
                });

                // Clear data
                this._clients.clear();
                this._subscriptions.clear();

                // Close server
                if (this.wss) {
                    this.wss.close(() => {
                        console.log('WebSocket Server stopped');
                        resolve();
                    });
                } else {
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Get server metrics
     */
    getMetrics() {
        return { ...this._metrics };
    }

    /**
     * Broadcast message to all clients or filtered subset
     * @param {string} channel - Message channel
     * @param {*} data - Message data
     * @param {Object} options - Broadcast options
     */
    broadcast(channel, data, options = {}) {
        const message = JSON.stringify({
            channel,
            data,
            timestamp: Date.now()
        });

        this._clients.forEach(client => {
            if (this._shouldReceiveMessage(client, options)) {
                this._sendToClient(client.ws, message);
            }
        });
    }

    /**
     * Set up server event handlers
     * @private
     */
    _setupServerHandlers() {
        this.wss.on('connection', async (ws, req) => {
            try {
                // Authenticate connection
                const client = await this._authenticateConnection(ws, req);
                if (!client) {
                    ws.close(4001, 'Authentication failed');
                    return;
                }

                // Store client information
                this._clients.set(client.id, client);
                this._metrics.totalConnections++;
                this._metrics.activeConnections++;

                // Set up client handlers
                this._setupClientHandlers(client);

                // Send welcome message
                this._sendToClient(ws, JSON.stringify({
                    channel: 'system',
                    data: {
                        type: 'welcome',
                        clientId: client.id,
                        timestamp: Date.now()
                    }
                }));

                // Notify system of new connection
                eventBus.publish('websocket.connection', {
                    clientId: client.id,
                    user: client.user
                });

            } catch (error) {
                console.error('Connection handler error:', error);
                ws.close(4000, 'Internal server error');
            }
        });
    }

    /**
     * Authenticate WebSocket connection
     * @private
     */
    async _authenticateConnection(ws, req) {
        try {
            // Get token from query string or headers
            const token = this._extractToken(req);
            if (!token) return null;

            // Verify token
            const user = jwt.verify(token, this.options.jwtSecret);

            return {
                id: `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ws,
                user,
                subscriptions: new Set(),
                lastPing: Date.now(),
                stats: {
                    messagesSent: 0,
                    messagesReceived: 0
                }
            };
        } catch (error) {
            console.error('Authentication error:', error);
            return null;
        }
    }

    /**
     * Set up client event handlers
     * @private
     */
    _setupClientHandlers(client) {
        const { ws, id } = client;

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this._handleClientMessage(client, message);
                
                // Update metrics
                client.stats.messagesReceived++;
                this._metrics.messagesReceived++;
            } catch (error) {
                console.error('Message handler error:', error);
                this._metrics.errors++;
            }
        });

        ws.on('close', () => {
            this._handleClientDisconnect(client);
        });

        ws.on('error', (error) => {
            console.error(`Client ${id} error:`, error);
            this._metrics.errors++;
        });

        ws.on('pong', () => {
            client.lastPing = Date.now();
        });
    }

    /**
     * Handle client message
     * @private
     */
    _handleClientMessage(client, message) {
        const { type, channel, data } = message;

        switch (type) {
            case 'subscribe':
                this._handleSubscribe(client, channel, data);
                break;

            case 'unsubscribe':
                this._handleUnsubscribe(client, channel);
                break;

            case 'publish':
                this._handlePublish(client, channel, data);
                break;

            default:
                // Forward message to event bus
                eventBus.publish(`websocket.message.${channel}`, {
                    clientId: client.id,
                    user: client.user,
                    data
                });
        }
    }

    /**
     * Handle client subscription request
     * @private
     */
    _handleSubscribe(client, channel, options = {}) {
        // Add to client subscriptions
        client.subscriptions.add(channel);

        // Add to channel subscriptions
        if (!this._subscriptions.has(channel)) {
            this._subscriptions.set(channel, new Set());
        }
        this._subscriptions.get(channel).add(client.id);

        // Confirm subscription
        this._sendToClient(client.ws, JSON.stringify({
            channel: 'system',
            data: {
                type: 'subscribed',
                channel,
                timestamp: Date.now()
            }
        }));
    }

    /**
     * Handle client unsubscribe request
     * @private
     */
    _handleUnsubscribe(client, channel) {
        // Remove from client subscriptions
        client.subscriptions.delete(channel);

        // Remove from channel subscriptions
        const channelSubs = this._subscriptions.get(channel);
        if (channelSubs) {
            channelSubs.delete(client.id);
            if (channelSubs.size === 0) {
                this._subscriptions.delete(channel);
            }
        }

        // Confirm unsubscription
        this._sendToClient(client.ws, JSON.stringify({
            channel: 'system',
            data: {
                type: 'unsubscribed',
                channel,
                timestamp: Date.now()
            }
        }));
    }

    /**
     * Handle client publish request
     * @private
     */
    _handlePublish(client, channel, data) {
        // Validate publication permissions
        if (!this._canPublish(client, channel)) {
            this._sendError(client.ws, 'Unauthorized to publish to this channel');
            return;
        }

        // Broadcast to subscribers
        this.broadcast(channel, data, {
            exclude: [client.id]
        });

        // Forward to event bus
        eventBus.publish(`websocket.publish.${channel}`, {
            clientId: client.id,
            user: client.user,
            data
        });
    }

    /**
     * Handle client disconnect
     * @private
     */
    _handleClientDisconnect(client) {
        // Remove from subscriptions
        client.subscriptions.forEach(channel => {
            const channelSubs = this._subscriptions.get(channel);
            if (channelSubs) {
                channelSubs.delete(client.id);
                if (channelSubs.size === 0) {
                    this._subscriptions.delete(channel);
                }
            }
        });

        // Remove client
        this._clients.delete(client.id);
        this._metrics.activeConnections--;

        // Notify system
        eventBus.publish('websocket.disconnection', {
            clientId: client.id,
            user: client.user
        });
    }

    /**
     * Start heartbeat monitoring
     * @private
     */
    _startHeartbeat() {
        setInterval(() => {
            const now = Date.now();

            this._clients.forEach((client, id) => {
                if (now - client.lastPing > this.options.pingInterval * 2) {
                    // Client hasn't responded to ping
                    console.log(`Client ${id} timed out`);
                    client.ws.terminate();
                } else if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.ping();
                }
            });
        }, this.options.pingInterval);
    }

    /**
     * Set up metrics reporting
     * @private
     */
    _setupMetricsReporting() {
        setInterval(() => {
            eventBus.publish('websocket.metrics', this.getMetrics());
        }, 5000); // Report every 5 seconds
    }

    /**
     * Send message to client
     * @private
     */
    _sendToClient(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
            this._metrics.messagesSent++;
        }
    }

    /**
     * Send error message to client
     * @private
     */
    _sendError(ws, message) {
        this._sendToClient(ws, JSON.stringify({
            channel: 'system',
            data: {
                type: 'error',
                message,
                timestamp: Date.now()
            }
        }));
    }

    /**
     * Extract authentication token
     * @private
     */
    _extractToken(req) {
        // Try query string
        const url = new URL(req.url, 'ws://localhost');
        const token = url.searchParams.get('token');
        if (token) return token;

        // Try headers
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
                return parts[1];
            }
        }

        return null;
    }

    /**
     * Check if client can publish to channel
     * @private
     */
    _canPublish(client, channel) {
        // Implement your permission logic here
        return true;
    }

    /**
     * Check if client should receive message
     * @private
     */
    _shouldReceiveMessage(client, options) {
        if (!options) return true;

        // Check exclusions
        if (options.exclude && options.exclude.includes(client.id)) {
            return false;
        }

        // Check inclusions
        if (options.include && !options.include.includes(client.id)) {
            return false;
        }

        // Check roles
        if (options.roles && !options.roles.includes(client.user.role)) {
            return false;
        }

        return true;
    }
}

module.exports = WebSocketServer;