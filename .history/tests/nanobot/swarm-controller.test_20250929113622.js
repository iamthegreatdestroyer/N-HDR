/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * SWARM CONTROLLER TEST SUITE
 */

const chai = require('chai');
const { expect } = chai;
const SwarmController = require('./swarm-controller');
const SwarmManager = require('./swarm-manager');
const NanoBot = require('./nanobot');

describe('SwarmController', () => {
  let controller;

  beforeEach(() => {
    controller = new SwarmController({
      initialSwarmSize: 5,
      maxSwarmSize: 20,
      targetEfficiency: 0.8,
      optimizationInterval: 100
    });
  });

  describe('Initialization', () => {
    it('should create controller with valid ID', () => {
      expect(controller.id).to.be.a('string').with.length(32);
      expect(controller.status).to.equal('initializing');
    });

    it('should initialize swarm with correct size', async () => {
      await controller.initialize();
      expect(controller.status).to.equal('ready');
      const status = controller.getStatus();
      expect(status.swarmSize).to.equal(5);
    });

    it('should configure acceleration profile', () => {
      const status = controller.getStatus();
      expect(status.accelerationProfile).to.be.an('object');
      expect(status.accelerationProfile.quantumFactor).to.be.a('number');
      expect(status.accelerationProfile.emergenceThreshold).to.be.a('number');
    });
  });

  describe('State Acceleration', () => {
    beforeEach(async () => {
      await controller.initialize();
    });

    it('should accelerate consciousness state', async () => {
      const state = {
        quantumProperties: [
          { amplitude: 1.0, phase: 0.5 }
        ],
        temporalProperties: [
          { frequency: 100, duration: 1.0 }
        ],
        spatialProperties: [
          { resolution: 1.0, distribution: [1, 2, 3] }
        ]
      };

      const result = await controller.accelerateState(state);
      expect(result).to.be.an('object');
      expect(result.processId).to.be.a('string');
      expect(result.controllerId).to.equal(controller.id);
      expect(result.result).to.be.an('object');
      expect(result.metrics).to.be.an('object');
    });

    it('should apply quantum acceleration correctly', async () => {
      const state = {
        quantumProperties: [
          { amplitude: 1.0, phase: 0.5 }
        ]
      };

      const result = await controller.accelerateState(state);
      expect(result.result.swarmResult).to.be.an('object');
      expect(result.result.accelerationMetrics.quantumFactor).to.be.a('number');
      expect(result.result.accelerationMetrics.emergenceStrength).to.be.a('number');
    });

    it('should handle emergence patterns', async () => {
      const state = {
        spatialProperties: [
          { resolution: 1.0, distribution: Array(10).fill(1) }
        ]
      };

      const result = await controller.accelerateState(state);
      expect(result.result.emergencePatterns).to.be.an('array');
      expect(result.result.interactions).to.be.an('object');
    });

    it('should update metrics after processing', async () => {
      const state = {
        quantumProperties: [{ amplitude: 1.0, phase: 0.5 }]
      };

      await controller.accelerateState(state);
      const metrics = controller.getStatus().metrics;

      expect(metrics.processedStates).to.be.above(0);
      expect(metrics.accelerationFactor).to.be.a('number');
      expect(metrics.emergenceStrength).to.be.a('number');
      expect(metrics.quantumEfficiency).to.be.a('number');
    });
  });

  describe('Swarm Management', () => {
    beforeEach(async () => {
      await controller.initialize();
    });

    it('should scale swarm up', async () => {
      const initialSize = controller.getStatus().swarmSize;
      await controller.scaleSwarm(10);
      const newSize = controller.getStatus().swarmSize;
      expect(newSize).to.be.above(initialSize);
      expect(newSize).to.equal(10);
    });

    it('should scale swarm down', async () => {
      await controller.scaleSwarm(10);
      const initialSize = controller.getStatus().swarmSize;
      await controller.scaleSwarm(5);
      const newSize = controller.getStatus().swarmSize;
      expect(newSize).to.be.below(initialSize);
      expect(newSize).to.equal(5);
    });

    it('should respect maxSwarmSize limit', async () => {
      await controller.scaleSwarm(25);
      const size = controller.getStatus().swarmSize;
      expect(size).to.equal(20);
    });

    it('should maintain minimum swarm size', async () => {
      await controller.scaleSwarm(2);
      const size = controller.getStatus().swarmSize;
      expect(size).to.equal(5);
    });
  });

  describe('Optimization', () => {
    beforeEach(async () => {
      await controller.initialize();
    });

    it('should update acceleration parameters based on metrics', async () => {
      const state = {
        quantumProperties: [{ amplitude: 1.0, phase: 0.5 }]
      };

      const initialParams = { ...controller.getStatus().accelerationProfile };
      await controller.accelerateState(state);
      await new Promise(resolve => setTimeout(resolve, 150));
      const updatedParams = controller.getStatus().accelerationProfile;

      expect(updatedParams).to.not.deep.equal(initialParams);
    });

    it('should optimize swarm size based on efficiency', async () => {
      const initialSize = controller.getStatus().swarmSize;
      
      // Simulate low efficiency
      controller.swarmManager.getStatus = () => ({
        size: initialSize,
        metrics: { efficiency: 0.4 }
      });

      await new Promise(resolve => setTimeout(resolve, 150));
      const newSize = controller.getStatus().swarmSize;
      expect(newSize).to.be.above(initialSize);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      controller.swarmManager.addNanobot = async () => {
        throw new Error('Initialization error');
      };

      try {
        await controller.initialize();
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.message).to.equal('Initialization error');
        expect(controller.status).to.equal('error');
      }
    });

    it('should prevent state acceleration when not ready', async () => {
      try {
        await controller.accelerateState({});
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.message).to.equal('SwarmController not ready');
      }
    });

    it('should handle swarm scaling errors gracefully', async () => {
      await controller.initialize();
      controller.swarmManager.addNanobot = async () => {
        throw new Error('Scaling error');
      };

      try {
        await controller.scaleSwarm(15);
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.message).to.equal('Scaling error');
        const status = controller.getStatus();
        expect(status.swarmSize).to.equal(5);
      }
    });
  });
});