/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * WebSocket Server tests
 */

const WebSocket = require('ws');
const WebSocketServer = require('../../src/api/websocket-server');
const SwarmController = require('../../src/core/swarm-controller');

describe('WebSocketServer', () => {
  let wsServer;
  let controller;
  let client;
  const TEST_PORT = 3002;

  beforeEach(async () => {
    controller = new SwarmController();
    wsServer = new WebSocketServer({
      port: TEST_PORT,
      authentication: false
    });
    wsServer.initialize(controller);
    await wsServer.start();
  });

  afterEach(async () => {
    if (client) {
      client.close();
    }
    await wsServer.stop();
  });

  const createClient = () => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      ws.on('open', () => resolve(ws));
      ws.on('error', reject);
    });
  };

  const waitForMessage = (ws) => {
    return new Promise((resolve) => {
      ws.once('message', (data) => {
        resolve(JSON.parse(data));
      });
    });
  };

  describe('Connection Handling', () => {
    test('sends welcome message on connection', async () => {
      client = await createClient();
      const message = await waitForMessage(client);

      expect(message.event).toBe('welcome');
      expect(message.data).toHaveProperty('clientId');
      expect(message.data).toHaveProperty('timestamp');
    });

    test('handles client disconnection', async () => {
      client = await createClient();
      const firstMessage = await waitForMessage(client);
      const clientId = firstMessage.data.clientId;

      // Client should be in the clients map
      expect(wsServer.clients.has(clientId)).toBe(true);

      // Disconnect client
      client.close();
      
      // Wait for disconnection to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Client should be removed from the clients map
      expect(wsServer.clients.has(clientId)).toBe(false);
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      client = await createClient();
      await waitForMessage(client); // Wait for welcome message
    });

    test('handles subscription requests', async () => {
      client.send(JSON.stringify({
        type: 'subscribe',
        data: {
          topics: ['swarm', 'thermal']
        }
      }));

      const response = await waitForMessage(client);
      expect(response.event).toBe('subscribed');
      expect(response.data.topics).toContain('swarm');
      expect(response.data.topics).toContain('thermal');
    });

    test('handles unsubscribe requests', async () => {
      // First subscribe
      client.send(JSON.stringify({
        type: 'subscribe',
        data: {
          topics: ['swarm']
        }
      }));
      await waitForMessage(client);

      // Then unsubscribe
      client.send(JSON.stringify({
        type: 'unsubscribe',
        data: {
          topics: ['swarm']
        }
      }));

      const response = await waitForMessage(client);
      expect(response.event).toBe('unsubscribed');
      expect(response.data.topics).toContain('swarm');
    });

    test('handles system status command', async () => {
      client.send(JSON.stringify({
        type: 'command',
        data: {
          command: 'getSystemStatus'
        }
      }));

      const response = await waitForMessage(client);
      expect(response.event).toBe('systemStatus');
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('version');
      expect(response.data).toHaveProperty('uptime');
      expect(response.data).toHaveProperty('memory');
    });

    test('handles metrics command', async () => {
      client.send(JSON.stringify({
        type: 'command',
        data: {
          command: 'getMetrics'
        }
      }));

      const response = await waitForMessage(client);
      expect(response.event).toBe('metrics');
      expect(response.data).toHaveProperty('swarm');
      expect(response.data).toHaveProperty('quantum');
      expect(response.data).toHaveProperty('thermal');
      expect(response.data).toHaveProperty('consciousness');
    });

    test('handles invalid messages', async () => {
      client.send('invalid json');

      const response = await waitForMessage(client);
      expect(response.event).toBe('error');
      expect(response.data.message).toBe('Invalid message format');
    });

    test('handles unknown commands', async () => {
      client.send(JSON.stringify({
        type: 'command',
        data: {
          command: 'unknownCommand'
        }
      }));

      const response = await waitForMessage(client);
      expect(response.event).toBe('error');
      expect(response.data.message).toBe('Unknown command');
    });
  });

  describe('Broadcasting', () => {
    test('broadcasts messages to all connected clients', async () => {
      // Create two clients
      const client1 = await createClient();
      const client2 = await createClient();

      // Wait for welcome messages
      await waitForMessage(client1);
      await waitForMessage(client2);

      // Set up message promises
      const message1Promise = waitForMessage(client1);
      const message2Promise = waitForMessage(client2);

      // Broadcast a message
      wsServer.broadcast('testEvent', { data: 'test' });

      // Wait for both clients to receive the message
      const [message1, message2] = await Promise.all([
        message1Promise,
        message2Promise
      ]);

      expect(message1.event).toBe('testEvent');
      expect(message1.data).toEqual({ data: 'test' });
      expect(message2.event).toBe('testEvent');
      expect(message2.data).toEqual({ data: 'test' });

      // Cleanup
      client1.close();
      client2.close();
    });
  });

  describe('Custom Event Handlers', () => {
    test('registers and handles custom events', async () => {
      const customHandler = jest.fn();
      wsServer.registerEventHandler('customEvent', customHandler);

      client = await createClient();
      await waitForMessage(client); // Wait for welcome message

      client.send(JSON.stringify({
        type: 'customEvent',
        data: { test: true }
      }));

      // Wait for handler to be called
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(customHandler).toHaveBeenCalled();
      const [clientId, data] = customHandler.mock.calls[0];
      expect(typeof clientId).toBe('string');
      expect(data).toEqual({ test: true });
    });
  });

  describe('Error Handling', () => {
    test('handles server errors gracefully', async () => {
      client = await createClient();
      await waitForMessage(client); // Wait for welcome message

      // Simulate a server error
      wsServer.server.emit('error', new Error('Test error'));

      const response = await waitForMessage(client);
      expect(response.event).toBe('serverError');
      expect(response.data).toHaveProperty('message', 'Internal server error');
    });

    test('handles client errors gracefully', async () => {
      client = await createClient();
      await waitForMessage(client); // Wait for welcome message

      // Register a handler that throws an error
      wsServer.registerEventHandler('errorEvent', () => {
        throw new Error('Handler error');
      });

      client.send(JSON.stringify({
        type: 'errorEvent',
        data: {}
      }));

      const response = await waitForMessage(client);
      expect(response.event).toBe('error');
      expect(response.data.message).toContain('Handler error');
    });
  });
});