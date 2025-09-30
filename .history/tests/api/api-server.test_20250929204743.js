/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * API Server tests
 */

const request = require('supertest');
const ApiServer = require('../../src/api/api-server');
const SwarmController = require('../../src/core/swarm-controller');

describe('ApiServer', () => {
  let apiServer;
  let controller;

  beforeEach(() => {
    controller = new SwarmController();
    apiServer = new ApiServer({
      port: 3001,
      authentication: false
    });
    apiServer.initialize(controller);
  });

  afterEach(async () => {
    await apiServer.stop();
  });

  describe('System Endpoints', () => {
    beforeEach(async () => {
      await apiServer.start();
    });

    test('GET /api/v1/system/status returns system status', async () => {
      const response = await request(apiServer.app)
        .get('/api/v1/system/status')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'operational');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /api/v1/system/metrics returns system metrics', async () => {
      const response = await request(apiServer.app)
        .get('/api/v1/system/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('swarm');
      expect(response.body).toHaveProperty('quantum');
      expect(response.body).toHaveProperty('thermal');
      expect(response.body).toHaveProperty('consciousness');
    });

    test('GET /api/v1/system/config returns system configuration', async () => {
      const response = await request(apiServer.app)
        .get('/api/v1/system/config')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test('PUT /api/v1/system/config updates system configuration', async () => {
      const newConfig = {
        quantum: { enabled: true },
        thermal: { maxTemperature: 80 }
      };

      const response = await request(apiServer.app)
        .put('/api/v1/system/config')
        .send(newConfig)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Swarm Endpoints', () => {
    beforeEach(async () => {
      await apiServer.start();
    });

    test('GET /api/v1/swarm/bots returns all nanobots', async () => {
      const response = await request(apiServer.app)
        .get('/api/v1/swarm/bots')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/v1/swarm/bots creates new nanobot', async () => {
      const botData = {
        generation: 1,
        quantum: true
      };

      const response = await request(apiServer.app)
        .post('/api/v1/swarm/bots')
        .send(botData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('generation', 1);
    });

    test('GET /api/v1/swarm/tasks returns all tasks', async () => {
      const response = await request(apiServer.app)
        .get('/api/v1/swarm/tasks')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/v1/swarm/tasks creates new task', async () => {
      const taskData = {
        type: 'processing',
        priority: 1
      };

      const response = await request(apiServer.app)
        .post('/api/v1/swarm/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type', 'processing');
    });
  });

  describe('Quantum Endpoints', () => {
    beforeEach(async () => {
      await apiServer.start();
    });

    test('GET /api/v1/quantum/status returns quantum status', async () => {
      const response = await request(apiServer.app)
        .get('/api/v1/quantum/status')
        .expect(200);

      expect(response.body).toHaveProperty('securityLevel');
      expect(response.body).toHaveProperty('entropyPool');
      expect(response.body).toHaveProperty('activeKeys');
    });

    test('POST /api/v1/quantum/keys generates new quantum key', async () => {
      const keyData = {
        size: 256,
        lifetime: 3600
      };

      const response = await request(apiServer.app)
        .post('/api/v1/quantum/keys')
        .send(keyData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Thermal Endpoints', () => {
    beforeEach(async () => {
      await apiServer.start();
    });

    test('GET /api/v1/thermal/status returns thermal status', async () => {
      const response = await request(apiServer.app)
        .get('/api/v1/thermal/status')
        .expect(200);

      expect(response.body).toHaveProperty('temperature');
      expect(response.body).toHaveProperty('load');
      expect(response.body).toHaveProperty('throttling');
      expect(response.body).toHaveProperty('warning');
    });

    test('GET /api/v1/thermal/history returns thermal history', async () => {
      const response = await request(apiServer.app)
        .get('/api/v1/thermal/history')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Consciousness Endpoints', () => {
    beforeEach(async () => {
      await apiServer.start();
    });

    test('GET /api/v1/consciousness/layers returns consciousness layers', async () => {
      const response = await request(apiServer.app)
        .get('/api/v1/consciousness/layers')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/v1/consciousness/layers creates new layer', async () => {
      const layerData = {
        name: 'Test Layer',
        dimension: 3,
        nodes: []
      };

      const response = await request(apiServer.app)
        .post('/api/v1/consciousness/layers')
        .send(layerData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Layer');
    });

    test('GET /api/v1/consciousness/emergence returns emergence data', async () => {
      const response = await request(apiServer.app)
        .get('/api/v1/consciousness/emergence')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      apiServer = new ApiServer({
        port: 3001,
        authentication: true
      });
      apiServer.initialize(controller);
    });

    beforeEach(async () => {
      await apiServer.start();
    });

    test('Requests without authentication token are rejected', async () => {
      await request(apiServer.app)
        .get('/api/v1/system/status')
        .expect(401);
    });

    test('Requests with invalid token are rejected', async () => {
      await request(apiServer.app)
        .get('/api/v1/system/status')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
    });

    test('Requests with valid token are accepted', async () => {
      const token = controller.securityManager.generateToken();

      await request(apiServer.app)
        .get('/api/v1/system/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await apiServer.start();
    });

    test('Invalid routes return 404', async () => {
      await request(apiServer.app)
        .get('/api/v1/invalid/route')
        .expect(404);
    });

    test('Invalid JSON body returns 400', async () => {
      await request(apiServer.app)
        .post('/api/v1/swarm/bots')
        .send('invalid json')
        .expect(400);
    });

    test('Internal errors return 500', async () => {
      // Mock error in controller
      controller.swarmManager.createBot = () => {
        throw new Error('Internal error');
      };

      await request(apiServer.app)
        .post('/api/v1/swarm/bots')
        .send({ generation: 1 })
        .expect(500);
    });
  });
});