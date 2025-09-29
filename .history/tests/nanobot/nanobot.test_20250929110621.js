/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 */

const { expect } = require('chai');
const sinon = require('sinon');
const NanoBot = require('../../src/nanobot/nanobot');
const { SecureTaskExecution } = require('../../src/quantum/secure-task-execution');
const { QuantumEntropyGenerator } = require('../../src/quantum/quantum-entropy-generator');
const { ConsciousnessLayer } = require('../../src/consciousness/consciousness-layer');
const { StatePreservation } = require('../../src/consciousness/state-preservation');

describe('NanoBot', () => {
  let nanobot;
  let secureExecutionStub;
  let entropyGeneratorStub;
  let consciousnessLayerStub;
  let statePreservationStub;

  beforeEach(() => {
    // Create test instance
    nanobot = new NanoBot({
      maxComputeLoad: 0.8,
      maxTemperature: 50.0,
      minTemperature: 10.0,
      optimalTemperature: 35.0,
      thermalSafetyMargin: 5.0
    });

    // Create stubs
    secureExecutionStub = sinon.stub(SecureTaskExecution.prototype, 'execute')
      .callsFake(async (fn) => await fn());
    
    entropyGeneratorStub = sinon.stub(QuantumEntropyGenerator.prototype, 'generateEntropy')
      .resolves(Buffer.from('0123456789abcdef', 'hex'));
    
    consciousnessLayerStub = sinon.stub(ConsciousnessLayer.prototype, 'processState')
      .resolves({ id: 'test', processed: true });
    
    statePreservationStub = sinon.stub(StatePreservation.prototype, 'preserveState')
      .resolves();
  });

  afterEach(() => {
    // Restore stubs
    secureExecutionStub.restore();
    entropyGeneratorStub.restore();
    consciousnessLayerStub.restore();
    statePreservationStub.restore();
  });

  describe('Initialization', () => {
    it('should create a NanoBot with default options', () => {
      const bot = new NanoBot();
      expect(bot.id).to.be.a('string');
      expect(bot.status).to.equal('idle');
      expect(bot.computeLoad).to.equal(0);
      expect(bot.metrics).to.exist;
    });

    it('should override default options with provided values', () => {
      const options = {
        maxComputeLoad: 0.5,
        maxTemperature: 45.0
      };
      const bot = new NanoBot(options);
      expect(bot.options.maxComputeLoad).to.equal(0.5);
      expect(bot.options.maxTemperature).to.equal(45.0);
    });
  });

  describe('State Processing', () => {
    it('should successfully process consciousness state', async () => {
      const state = {
        id: 'test-state',
        data: { value: 42 }
      };

      const result = await nanobot.processState(state);
      
      expect(result).to.have.property('processId');
      expect(result).to.have.property('nanobotId');
      expect(result).to.have.property('result');
      expect(result).to.have.property('metrics');
      
      expect(entropyGeneratorStub.calledOnce).to.be.true;
      expect(consciousnessLayerStub.calledOnce).to.be.true;
      expect(statePreservationStub.calledOnce).to.be.true;
    });

    it('should handle processing errors gracefully', async () => {
      consciousnessLayerStub.rejects(new Error('Processing failed'));
      
      try {
        await nanobot.processState({ id: 'test' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Processing failed');
        expect(nanobot.status).to.equal('error');
        expect(nanobot.errorCount).to.equal(1);
      }
    });

    it('should respect thermal safety limits', async () => {
      // Set temperature above safety limit
      nanobot.thermal.temperature = 60.0;
      
      try {
        await nanobot.processState({ id: 'test' });
        expect.fail('Should have thrown thermal safety error');
      } catch (error) {
        expect(error.message).to.include('Thermal safety');
        expect(nanobot.status).to.equal('error');
      }
    });
  });

  describe('Thermal Management', () => {
    it('should update thermal state based on compute load', () => {
      const initialTemp = nanobot.thermal.temperature;
      
      // Simulate high compute load
      nanobot._updateComputeLoad(0.8);
      nanobot.updateThermal(20.0);
      
      expect(nanobot.thermal.temperature).to.be.greaterThan(initialTemp);
    });

    it('should activate cooling when temperature is too high', () => {
      // Set high temperature
      nanobot.thermal.temperature = 45.0;
      nanobot.updateThermal(20.0);
      
      expect(nanobot.thermal.coolingActive).to.be.true;
    });

    it('should maintain thermal history', () => {
      // Generate some thermal history
      for (let i = 0; i < 5; i++) {
        nanobot._updateComputeLoad(0.5);
        nanobot.updateThermal(20.0);
      }
      
      const history = nanobot.getThermalHistory(60);
      expect(history).to.be.an('array');
      expect(history.length).to.be.greaterThan(0);
      
      const entry = history[0];
      expect(entry).to.have.all.keys('timestamp', 'temperature', 'computeLoad', 'cooling');
    });
  });

  describe('Performance Metrics', () => {
    it('should track basic performance metrics', async () => {
      const state = { id: 'test' };
      await nanobot.processState(state);
      
      const metrics = nanobot.getMetrics();
      expect(metrics.processedStates).to.equal(1);
      expect(metrics.quantumOperations).to.equal(1);
      expect(metrics.averageLatency).to.be.a('number');
    });

    it('should calculate average latency correctly', async () => {
      // Process multiple states
      for (let i = 0; i < 3; i++) {
        await nanobot.processState({ id: `test-${i}` });
      }
      
      const metrics = nanobot.getMetrics();
      expect(metrics.processedStates).to.equal(3);
      expect(metrics.averageLatency).to.be.a('number');
      expect(metrics.averageLatency).to.be.greaterThan(0);
    });
  });

  describe('Status Reporting', () => {
    it('should provide comprehensive status information', () => {
      const status = nanobot.getStatus();
      
      expect(status).to.have.all.keys(
        'id',
        'status',
        'computeLoad',
        'quantumUsage',
        'temperature',
        'cooling',
        'metrics',
        'errorCount',
        'uptime'
      );
    });

    it('should track uptime correctly', async () => {
      const initialStatus = nanobot.getStatus();
      
      // Wait a short time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const currentStatus = nanobot.getStatus();
      expect(currentStatus.uptime).to.be.greaterThan(initialStatus.uptime);
    });
  });

  describe('State History', () => {
    it('should maintain state processing history', async () => {
      // Process multiple states
      for (let i = 0; i < 3; i++) {
        await nanobot.processState({ id: `test-${i}` });
      }
      
      expect(nanobot.stateHistory).to.be.an('array');
      expect(nanobot.stateHistory.length).to.equal(3);
      
      const entry = nanobot.stateHistory[0];
      expect(entry).to.have.all.keys('timestamp', 'state', 'temperature', 'computeLoad');
    });

    it('should limit state history size', async () => {
      // Process many states
      for (let i = 0; i < 1100; i++) {
        await nanobot.processState({ id: `test-${i}` });
      }
      
      expect(nanobot.stateHistory.length).to.equal(1000);
    });
  });
});