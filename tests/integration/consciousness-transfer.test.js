/*
Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
© 2025 Stephen Bilodeau - PATENT PENDING
ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL

This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
technology suite. Unauthorized reproduction, distribution, or disclosure of this
software in whole or in part is strictly prohibited. All intellectual property
rights, including patent-pending technologies, are reserved.

File: consciousness-transfer.test.js
Created: 2025-09-29
HDR Empire - Pioneering the Future of AI Consciousness
*/

import request from 'supertest';
import NHDRApi from '../../src/api/nhdr-api';
import NeuralHDR from '../../src/core/neural-hdr';

describe('Consciousness Transfer Integration Tests', () => {
  let api;
  let server;

  beforeAll(async () => {
    // Start API server
    api = new NHDRApi();
    await api.start();
    server = api.app;
  });

  afterAll(async () => {
    // Shutdown API server
    await api.stop();
  });

  test('should create and restore consciousness across systems', async () => {
    // Create mock AI state
    const sourceAI = {
      model: {
        weights: {
          layer1: [0.1, 0.2, 0.3],
          layer2: [0.4, 0.5, 0.6]
        }
      },
      context: {
        conversations: [
          { id: 'conv1', text: 'Hello', timestamp: Date.now() - 1000 },
          { id: 'conv2', text: 'How are you?', timestamp: Date.now() }
        ]
      },
      reasoning: {
        chains: [{ id: 'chain1', steps: ['step1', 'step2'] }]
      },
      emotions: {
        current: 'neutral',
        history: ['happy', 'neutral']
      }
    };

    // Step 1: Capture consciousness through API
    const createRes = await request(server)
      .post('/api/v1/consciousness/create')
      .send({ aiState: sourceAI })
      .expect(200);

    expect(createRes.body.success).toBe(true);
    expect(createRes.body.nhdrFile).toBeDefined();

    // Extract NHDR file
    const nhdrFile = createRes.body.nhdrFile;

    // Step 2: Create target AI
    const targetAI = {
      model: {
        weights: {
          layer1: [0, 0, 0],
          layer2: [0, 0, 0]
        }
      },
      context: {
        conversations: []
      },
      reasoning: {
        chains: []
      },
      emotions: {
        current: 'neutral',
        history: []
      }
    };

    // Step 3: Restore consciousness to target AI
    const restoreRes = await request(server)
      .post('/api/v1/consciousness/restore')
      .send({ nhdrFile, targetAI })
      .expect(200);

    expect(restoreRes.body.success).toBe(true);

    // Verify target AI state
    const targetState = restoreRes.body.targetState;
    expect(targetState.model.weights).toEqual(sourceAI.model.weights);
    expect(targetState.context.conversations).toEqual(sourceAI.context.conversations);
    expect(targetState.reasoning.chains).toEqual(sourceAI.reasoning.chains);
    expect(targetState.emotions).toEqual(sourceAI.emotions);
  });

  test('should merge two consciousness files', async () => {
    // Create two neural HDR instances
    const neuralHDR = new NeuralHDR();

    // Create first mock AI state
    const aiState1 = {
      model: { weights: { layer1: [0.1, 0.2, 0.3] } },
      context: { conversations: [{ id: 'conv1', text: 'Hello' }] },
      emotions: { current: 'happy', history: ['neutral', 'happy'] }
    };

    // Create second mock AI state
    const aiState2 = {
      model: { weights: { layer1: [0.4, 0.5, 0.6] } },
      context: { conversations: [{ id: 'conv2', text: 'Hi there' }] },
      emotions: { current: 'excited', history: ['happy', 'excited'] }
    };

    // Capture both consciousnesses
    const nhdrFile1 = await neuralHDR.captureConsciousness(aiState1);
    const nhdrFile2 = await neuralHDR.captureConsciousness(aiState2);

    // Merge consciousnesses through API
    const mergeRes = await request(server)
      .post('/api/v1/consciousness/merge')
      .send({ nhdr1: nhdrFile1, nhdr2: nhdrFile2 })
      .expect(200);

    expect(mergeRes.body.success).toBe(true);
    expect(mergeRes.body.mergedFile).toBeDefined();

    // Verify merged state
    const mergedState = mergeRes.body.mergedState;
    expect(mergedState.model.weights.layer1.length).toBe(3);
    expect(mergedState.context.conversations.length).toBe(2);
    expect(mergedState.emotions.history.length).toBe(4);
  });

  test('should handle consciousness acceleration', async () => {
    // Get acceleration status
    const statusRes = await request(server)
      .get('/api/v1/acceleration/status')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(statusRes.body.status).toBeDefined();
    expect(statusRes.body.nanoSwarmActive).toBeDefined();

    // Test acceleration request
    const accelerationRes = await request(server)
      .post('/api/v1/acceleration/optimize')
      .send({
        consciousnessId: 'test-123',
        targetLatency: 50 // ms
      })
      .expect(200);

    expect(accelerationRes.body.success).toBe(true);
    expect(accelerationRes.body.optimizedLatency).toBeLessThanOrEqual(50);
  });
});