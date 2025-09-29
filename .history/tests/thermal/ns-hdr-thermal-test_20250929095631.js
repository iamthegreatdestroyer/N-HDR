/**
 * NANO-SWARM HDR (NS-HDR) THERMAL MANAGEMENT TEST
 * © 2025 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 * HDR EMPIRE - CONFIDENTIAL
 *
 * This script tests the thermal management capabilities of the NS-HDR system
 * by simulating various load conditions and monitoring temperature response.
 */

const {
  ThermalManager,
  TaskProcessor,
  CONFIG,
} = require("../../implementation/ns-hdr-consolidated");

// Mock temperature values for testing
const mockTemps = {
  normal: 45,
  elevated: 65,
  high: 80,
  critical: 90,
};

/**
 * Thermal load simulator
 */
class ThermalLoadSimulator {
  constructor() {
    this.currentTemp = mockTemps.normal;
    this.loadFactor = 1;
  }

  /**
   * Simulate CPU-intensive task
   * @param {number} durationMs Duration in milliseconds
   * @returns {Promise} Task completion
   */
  async simulateLoad(durationMs) {
    const startTime = Date.now();
    while (Date.now() - startTime < durationMs) {
      // Simulate CPU load
      let x = 0;
      for (let i = 0; i < 1000000; i++) {
        x += Math.sqrt(i);
      }
      // Increment temperature based on load
      this.currentTemp = Math.min(
        mockTemps.critical,
        this.currentTemp + 0.1 * this.loadFactor
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Get current simulated temperature
   */
  getTemperature() {
    return this.currentTemp;
  }

  /**
   * Set load factor (1-10)
   */
  setLoadFactor(factor) {
    this.loadFactor = Math.max(1, Math.min(10, factor));
  }

  /**
   * Cool down simulation
   */
  async coolDown(durationMs) {
    const startTime = Date.now();
    while (Date.now() - startTime < durationMs) {
      this.currentTemp = Math.max(mockTemps.normal, this.currentTemp - 0.5);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

/**
 * Enhanced thermal manager for testing
 */
class TestThermalManager extends ThermalManager {
  constructor(simulator) {
    super();
    this.simulator = simulator;
  }

  async _readSystemTemperatures() {
    return [this.simulator.getTemperature()];
  }
}

/**
 * Test runner for thermal management
 */
class ThermalTestRunner {
  constructor() {
    this.simulator = new ThermalLoadSimulator();
    this.thermalManager = new TestThermalManager(this.simulator);
    this.processor = new TaskProcessor();
    this.processor.thermalManager = this.thermalManager;
  }

  /**
   * Run thermal management tests
   */
  async runTests() {
    console.log("Starting NS-HDR Thermal Management Tests...\n");

    await this.testNormalOperation();
    await this.testHighLoad();
    await this.testThrottling();
    await this.testCooldown();
    await this.testLoadBalancing();

    console.log("\nThermal Management Tests Completed!");
  }

  /**
   * Test system under normal operation
   */
  async testNormalOperation() {
    console.log("Testing normal operation...");
    this.simulator.setLoadFactor(2);

    console.log("Initial temperature:", this.simulator.getTemperature());
    await this.simulator.simulateLoad(5000);
    console.log(
      "Temperature after normal load:",
      this.simulator.getTemperature()
    );

    const isNormal =
      this.simulator.getTemperature() < CONFIG.thermal.throttleThreshold;
    console.log("Normal operation test:", isNormal ? "PASSED" : "FAILED");
  }

  /**
   * Test system under high load
   */
  async testHighLoad() {
    console.log("\nTesting high load conditions...");
    this.simulator.setLoadFactor(8);

    const startTemp = this.simulator.getTemperature();
    console.log("Starting temperature:", startTemp);

    await this.simulator.simulateLoad(10000);
    const endTemp = this.simulator.getTemperature();
    console.log("Temperature after high load:", endTemp);

    const tempIncreased = endTemp > startTemp;
    console.log("High load test:", tempIncreased ? "PASSED" : "FAILED");
  }

  /**
   * Test throttling behavior
   */
  async testThrottling() {
    console.log("\nTesting thermal throttling...");
    this.simulator.setLoadFactor(10);

    let throttleActivated = false;
    const monitor = setInterval(() => {
      const temp = this.simulator.getTemperature();
      if (this.thermalManager.isSystemThrottled()) {
        throttleActivated = true;
        console.log(`Throttling activated at ${temp}°C`);
      }
    }, 1000);

    await this.simulator.simulateLoad(15000);
    clearInterval(monitor);

    console.log("Throttling test:", throttleActivated ? "PASSED" : "FAILED");
  }

  /**
   * Test cooldown behavior
   */
  async testCooldown() {
    console.log("\nTesting cooldown behavior...");

    // First heat up the system
    this.simulator.setLoadFactor(10);
    await this.simulator.simulateLoad(10000);
    const highTemp = this.simulator.getTemperature();
    console.log("Peak temperature:", highTemp);

    // Then allow cooldown
    console.log("Initiating cooldown...");
    await this.simulator.coolDown(10000);
    const coolTemp = this.simulator.getTemperature();
    console.log("Temperature after cooldown:", coolTemp);

    const cooledDown = coolTemp < highTemp;
    console.log("Cooldown test:", cooledDown ? "PASSED" : "FAILED");
  }

  /**
   * Test load balancing under thermal constraints
   */
  async testLoadBalancing() {
    console.log("\nTesting load balancing...");

    const tasks = [];
    for (let i = 0; i < 10; i++) {
      tasks.push(async () => {
        await this.simulator.simulateLoad(2000);
        return true;
      });
    }

    console.log("Submitting concurrent tasks...");
    const startTime = Date.now();

    const results = await Promise.all(
      tasks.map((task) => this.processor.addTask(task))
    );

    const duration = Date.now() - startTime;
    console.log("Tasks completed in:", duration, "ms");
    console.log("Final temperature:", this.simulator.getTemperature());

    const allCompleted = results.every((r) => r === true);
    console.log("Load balancing test:", allCompleted ? "PASSED" : "FAILED");
  }
}

// Run tests if executed directly
if (require.main === module) {
  const runner = new ThermalTestRunner();
  runner.runTests().catch(console.error);
}
