/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 */

const { expect } = require("chai");
const sinon = require("sinon");
const SwarmManager = require("../../src/nanobot/swarm-manager");
const NanoBot = require("../../src/nanobot/nanobot");
const {
  SecureTaskExecution,
} = require("../../src/quantum/secure-task-execution");
const {
  QuantumEntropyGenerator,
} = require("../../src/quantum/quantum-entropy-generator");
const {
  QuantumEntanglement,
} = require("../../src/consciousness/quantum-entanglement");

describe("SwarmManager", () => {
  let swarmManager;
  let secureExecutionStub;
  let entropyGeneratorStub;
  let quantumEntanglementStub;

  beforeEach(() => {
    // Create test instance
    swarmManager = new SwarmManager({
      maxBots: 10,
      minBots: 2,
      optimalTemperature: 35.0,
      loadBalancingInterval: 100,
      heartbeatInterval: 500,
      stateUpdateInterval: 50,
      quantumSyncInterval: 100,
    });

    // Create stubs
    secureExecutionStub = sinon
      .stub(SecureTaskExecution.prototype, "execute")
      .callsFake(async (fn) => await fn());

    entropyGeneratorStub = sinon
      .stub(QuantumEntropyGenerator.prototype, "generateEntropy")
      .resolves(Buffer.from("0123456789abcdef", "hex"));

    quantumEntanglementStub = {
      createEntanglement: sinon.stub().resolves({ id: "test-entanglement" }),
      synchronizeState: sinon.stub().resolves(),
      breakEntanglement: sinon.stub().resolves(),
      getEntangledPairs: sinon.stub().returns([]),
    };

    sinon
      .stub(QuantumEntanglement.prototype, "createEntanglement")
      .callsFake(quantumEntanglementStub.createEntanglement);
    sinon
      .stub(QuantumEntanglement.prototype, "synchronizeState")
      .callsFake(quantumEntanglementStub.synchronizeState);
    sinon
      .stub(QuantumEntanglement.prototype, "breakEntanglement")
      .callsFake(quantumEntanglementStub.breakEntanglement);
    sinon
      .stub(QuantumEntanglement.prototype, "getEntangledPairs")
      .callsFake(quantumEntanglementStub.getEntangledPairs);
  });

  afterEach(() => {
    // Restore stubs
    secureExecutionStub.restore();
    entropyGeneratorStub.restore();
    sinon.restore();
  });

  describe("Swarm Management", () => {
    it("should add nanobots to swarm", async () => {
      const nanobot = new NanoBot();
      const result = await swarmManager.addNanobot(nanobot);

      expect(result).to.be.true;
      expect(swarmManager.nanobots.size).to.equal(1);
      expect(quantumEntanglementStub.createEntanglement.calledOnce).to.be.true;
    });

    it("should respect maximum swarm size", async () => {
      // Add maximum number of bots
      for (let i = 0; i < swarmManager.options.maxBots; i++) {
        await swarmManager.addNanobot(new NanoBot());
      }

      try {
        await swarmManager.addNanobot(new NanoBot());
        expect.fail("Should have thrown maximum size error");
      } catch (error) {
        expect(error.message).to.include("Maximum swarm size");
      }
    });

    it("should remove nanobots from swarm", async () => {
      const nanobot = new NanoBot();
      await swarmManager.addNanobot(nanobot);

      const result = await swarmManager.removeNanobot(nanobot.id);
      expect(result).to.be.true;
      expect(swarmManager.nanobots.size).to.equal(0);
      expect(quantumEntanglementStub.breakEntanglement.calledOnce).to.be.true;
    });
  });

  describe("State Processing", () => {
    it("should distribute and process state across swarm", async () => {
      // Add minimum required bots
      const bots = [];
      for (let i = 0; i < swarmManager.options.minBots; i++) {
        const bot = new NanoBot();
        bots.push(bot);
        await swarmManager.addNanobot(bot);
      }

      const state = {
        id: "test-state",
        data: { value: 42 },
      };

      const result = await swarmManager.processState(state);

      expect(result).to.have.property("processId");
      expect(result).to.have.property("swarmId");
      expect(result).to.have.property("result");
      expect(result).to.have.property("metrics");
    });

    it("should require minimum number of bots for processing", async () => {
      const state = { id: "test-state" };

      try {
        await swarmManager.processState(state);
        expect.fail("Should have thrown insufficient size error");
      } catch (error) {
        expect(error.message).to.include("Insufficient swarm size");
      }
    });

    it("should handle processing failures gracefully", async () => {
      // Add bots with one configured to fail
      const goodBot = new NanoBot();
      const badBot = new NanoBot();
      sinon
        .stub(badBot, "processState")
        .rejects(new Error("Processing failed"));

      await swarmManager.addNanobot(goodBot);
      await swarmManager.addNanobot(badBot);

      const state = { id: "test-state" };
      const result = await swarmManager.processState(state);

      expect(result.metrics.successRate).to.be.lessThan(1);
    });
  });

  describe("Topology Management", () => {
    it("should maintain swarm topology", async () => {
      // Add multiple bots
      const bot1 = new NanoBot();
      const bot2 = new NanoBot();
      await swarmManager.addNanobot(bot1);
      await swarmManager.addNanobot(bot2);

      const status = swarmManager.getStatus();
      expect(status.topology).to.exist;
      expect(status.topology.totalConnections).to.be.greaterThan(0);
    });

    it("should update node metadata", async () => {
      const bot = new NanoBot();
      await swarmManager.addNanobot(bot);

      // Simulate state changes
      bot.thermal.temperature = 40.0;
      bot.computeLoad = 0.8;

      await new Promise((resolve) => setTimeout(resolve, 100));
      const status = swarmManager.getStatus();

      const nodeStatus = status.nanobots.find((n) => n.id === bot.id);
      expect(nodeStatus.metrics.temperature).to.equal(40.0);
    });
  });

  describe("Performance Monitoring", () => {
    it("should track swarm metrics", async () => {
      // Add bots and process states
      const bot1 = new NanoBot();
      const bot2 = new NanoBot();
      await swarmManager.addNanobot(bot1);
      await swarmManager.addNanobot(bot2);

      await swarmManager.processState({ id: "test1" });
      await swarmManager.processState({ id: "test2" });

      const metrics = swarmManager.getMetrics();
      expect(metrics.totalProcessedStates).to.equal(2);
      expect(metrics.averageLatency).to.be.a("number");
      expect(metrics.throughput).to.be.a("number");
    });

    it("should calculate swarm efficiency", async () => {
      const bot = new NanoBot();
      await swarmManager.addNanobot(bot);

      const metrics = swarmManager.getMetrics();
      expect(metrics.efficiency).to.be.within(0, 1);
    });
  });

  describe("Load Balancing", () => {
    it("should balance load across nanobots", async () => {
      // Add bots with different loads
      const bot1 = new NanoBot();
      const bot2 = new NanoBot();
      bot1._updateComputeLoad(0.8);
      bot2._updateComputeLoad(0.2);

      await swarmManager.addNanobot(bot1);
      await swarmManager.addNanobot(bot2);

      // Wait for load balancing
      await new Promise((resolve) => setTimeout(resolve, 200));

      const status = swarmManager.getStatus();
      const loads = status.nanobots.map((n) => n.metrics.currentLoad);
      const loadDiff = Math.abs(loads[0] - loads[1]);

      expect(loadDiff).to.be.lessThan(0.4);
    });
  });

  describe("Quantum Integration", () => {
    it("should establish quantum entanglement when adding bots", async () => {
      const bot = new NanoBot();
      await swarmManager.addNanobot(bot);

      expect(quantumEntanglementStub.createEntanglement.calledOnce).to.be.true;
      expect(quantumEntanglementStub.synchronizeState.called).to.be.true;
    });

    it("should maintain quantum synchronization", async () => {
      const bot = new NanoBot();
      await swarmManager.addNanobot(bot);

      // Wait for sync interval
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(quantumEntanglementStub.getEntangledPairs.called).to.be.true;
      expect(quantumEntanglementStub.synchronizeState.called).to.be.true;
    });
  });

  describe("Error Handling", () => {
    it("should handle nanobot failures", async () => {
      const bot = new NanoBot();
      await swarmManager.addNanobot(bot);

      // Simulate bot failure
      bot.status = "error";
      bot.lastUpdate = Date.now() - 2000;

      // Wait for heartbeat check
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(swarmManager.nanobots.has(bot.id)).to.be.false;
    });
  });
});
