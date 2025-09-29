/**
 * NS-HDR Integration Tests
 * © 2025 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 * HDR EMPIRE - CONFIDENTIAL
 */

const {
  SwarmController,
  QuantumEntropyGenerator,
  ThermalManager,
  CONFIG,
} = require("../../implementation/ns-hdr-consolidated");

describe("NS-HDR System Integration", () => {
  let controller;
  let quantum;
  let thermal;

  beforeEach(() => {
    controller = new SwarmController();
    quantum = new QuantumEntropyGenerator();
    thermal = new ThermalManager();
  });

  afterEach(() => {
    // Clean up resources
  });

  describe("System Initialization", () => {
    test("should initialize all components correctly", async () => {
      await controller.initialize();

      const status = controller.getStatus();
      expect(status).toBeDefined();
      expect(status.temperature).toBeGreaterThanOrEqual(0);
      expect(status.isThrottled).toBe(false);
      expect(status.activeTaskCount).toBe(0);
      expect(status.queueLength).toBe(0);
    });
  });

  describe("Task Processing with Thermal Management", () => {
    test("should process tasks while managing temperature", async () => {
      await controller.initialize();

      const tasks = Array(5)
        .fill()
        .map(() => async (entropy) => {
          // Simulate CPU-intensive task
          const result = await intensiveCalculation(entropy);
          return result;
        });

      const results = await Promise.all(
        tasks.map((task) => controller.processTask(task))
      );

      expect(results).toHaveLength(5);
      expect(results.every((r) => r !== null)).toBe(true);

      const finalStatus = controller.getStatus();
      expect(finalStatus.temperature).toBeDefined();
    });

    test("should throttle under high load", async () => {
      await controller.initialize();

      // Create many CPU-intensive tasks
      const tasks = Array(20)
        .fill()
        .map(() => async (entropy) => {
          await intensiveCalculation(entropy);
          return true;
        });

      let throttled = false;
      const monitor = setInterval(() => {
        if (controller.getStatus().isThrottled) {
          throttled = true;
        }
      }, 100);

      await Promise.all(tasks.map((task) => controller.processTask(task)));

      clearInterval(monitor);
      expect(throttled).toBe(true);
    });
  });

  describe("Quantum Security Integration", () => {
    test("should generate and use quantum entropy", async () => {
      const entropy1 = await quantum.getEntropy(32);
      const entropy2 = await quantum.getEntropy(32);

      expect(entropy1).toBeInstanceOf(Buffer);
      expect(entropy2).toBeInstanceOf(Buffer);
      expect(entropy1).not.toEqual(entropy2);
    });

    test("should use quantum entropy in task processing", async () => {
      await controller.initialize();

      const task = async (entropy) => {
        expect(entropy).toBeInstanceOf(Buffer);
        expect(entropy.length).toBeGreaterThan(0);
        return true;
      };

      const result = await controller.processTask(task);
      expect(result).toBe(true);
    });
  });
});

/**
 * Helper function to simulate CPU-intensive calculation
 */
async function intensiveCalculation(entropy) {
  const iterations = 100000;
  let result = 0;

  // Use entropy to vary calculation
  const seed = entropy.readUInt32LE(0);

  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt((i + seed) % 10000);
  }

  return result;
}
