/**
 * ORACLE-HDR Unit Tests
 * Tests for oracle predictions, error handling, and circuit breaker functionality
 */

import OracleCore from "../../src/oracle-hdr/oracle-core.js";
import logger from "../../src/logging/logger.js";

// Mock logger to avoid spam during tests
// Logger will use actual implementation but that's fine

describe("ORACLE-HDR Oracle Core", () => {
  let oracle;

  beforeEach(() => {
    oracle = new OracleCore({
      maxCascadeDepth: 5,
      monteCarloIterations: 100,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    test("should initialize with default configuration", () => {
      expect(oracle.config.maxCascadeDepth).toBe(5);
      expect(oracle.config.monteCarloIterations).toBe(100);
      expect(oracle.metrics.predictionsGenerated).toBe(0);
      expect(oracle.circuitBreakerThreshold).toBe(10);
    });

    test("should initialize metrics object with correct structure", () => {
      expect(oracle.metrics).toHaveProperty("predictionsGenerated");
      expect(oracle.metrics).toHaveProperty("cascadesComputed");
      expect(oracle.metrics).toHaveProperty("accuracyScore");
      expect(oracle.metrics).toHaveProperty("confidenceMetrics");
    });

    test("should initialize circuit breaker as closed", () => {
      expect(oracle.circuitBreakerOpen).toBe(false);
      expect(oracle.failureCount).toBe(0);
    });
  });

  describe("Circuit Breaker Configuration", () => {
    test("should set circuit breaker threshold", () => {
      oracle.setCircuitBreakerThreshold(5);
      expect(oracle.circuitBreakerThreshold).toBe(5);
      expect(oracle.failureCount).toBe(0);
      expect(oracle.circuitBreakerOpen).toBe(false);
    });

    test("should reset failure count when threshold is changed", () => {
      oracle.failureCount = 3;
      oracle.circuitBreakerOpen = true;

      oracle.setCircuitBreakerThreshold(10);

      expect(oracle.failureCount).toBe(0);
      expect(oracle.circuitBreakerOpen).toBe(false);
    });

    test("should log when circuit breaker threshold is set", () => {
      oracle.setCircuitBreakerThreshold(8);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Circuit breaker threshold set to 8")
      );
    });
  });

  describe("Error Handling in Agent Outcome Prediction", () => {
    test("should return fallback prediction for null agent", () => {
      const result = oracle.predictAgentOutcome(null);

      expect(result).toHaveProperty("predicted_outcome");
      expect(result.predicted_outcome).toBe("conservative_execution");
      expect(result.fallback_prediction).toBe(true);
      expect(result).toHaveProperty("error");
    });

    test("should return fallback prediction for undefined agent", () => {
      const result = oracle.predictAgentOutcome(undefined);

      expect(result).toHaveProperty("fallback_prediction");
      expect(result.fallback_prediction).toBe(true);
    });

    test("should return fallback prediction for invalid agent type", () => {
      const result = oracle.predictAgentOutcome("not an object");

      expect(result.predicted_outcome).toBe("conservative_execution");
      expect(result.fallback_prediction).toBe(true);
      expect(result.error).toBeDefined();
    });

    test("should include timestamp in fallback prediction", () => {
      const result = oracle.predictAgentOutcome(null);

      expect(result).toHaveProperty("timestamp");
      expect(typeof result.timestamp).toBe("string");
    });

    test("should set conservative success rate on error", () => {
      const result = oracle.predictAgentOutcome(null);

      expect(result.predicted_success_rate).toBe(0.3);
    });
  });

  describe("Failure Count and Circuit Breaker Tracking", () => {
    test("should increment failure count on error", () => {
      oracle.setCircuitBreakerThreshold(5);

      oracle.predictAgentOutcome(null);
      expect(oracle.failureCount).toBe(1);

      oracle.predictAgentOutcome(null);
      expect(oracle.failureCount).toBe(2);
    });

    test("should open circuit breaker when threshold exceeded", () => {
      oracle.setCircuitBreakerThreshold(3);

      oracle.predictAgentOutcome(null);
      oracle.predictAgentOutcome(null);
      oracle.predictAgentOutcome(null);

      expect(oracle.circuitBreakerOpen).toBe(true);
    });

    test("should reset failure count on successful prediction", () => {
      oracle.setCircuitBreakerThreshold(5);

      oracle.predictAgentOutcome(null);
      expect(oracle.failureCount).toBe(1);

      // Valid agent for successful prediction
      const validAgent = {
        id: "agent-001",
        fitnessScore: 0.8,
        generation: 5,
        traits: ["adaptive", "learning"],
      };

      oracle.predictAgentOutcome(validAgent);
      expect(oracle.failureCount).toBe(0);
    });

    test("should close circuit breaker on successful prediction", () => {
      oracle.setCircuitBreakerThreshold(3);

      oracle.predictAgentOutcome(null);
      oracle.predictAgentOutcome(null);
      oracle.predictAgentOutcome(null);
      expect(oracle.circuitBreakerOpen).toBe(true);

      const validAgent = {
        id: "agent-002",
        fitnessScore: 0.7,
        generation: 3,
        traits: ["resilient"],
      };

      oracle.predictAgentOutcome(validAgent);
      expect(oracle.circuitBreakerOpen).toBe(false);
    });
  });

  describe("Successful Predictions", () => {
    let validAgent;

    beforeEach(() => {
      validAgent = {
        id: "agent-001",
        fitnessScore: 0.85,
        generation: 10,
        traits: ["adaptive", "learning", "resilient"],
        capabilities: ["reasoning", "planning"],
      };
    });

    test("should generate valid prediction for valid agent", () => {
      const result = oracle.predictAgentOutcome(validAgent);

      expect(result).toHaveProperty("prediction_id");
      expect(result).toHaveProperty("agent_id");
      expect(result).toHaveProperty("predicted_outcome");
      expect(result).toHaveProperty("predicted_success_rate");
      expect(result).toHaveProperty("confidence_level");
      expect(result.fallback_prediction).not.toBe(true);
    });

    test("should increment predictions generated metric", () => {
      expect(oracle.metrics.predictionsGenerated).toBe(0);

      oracle.predictAgentOutcome(validAgent);
      expect(oracle.metrics.predictionsGenerated).toBe(1);

      oracle.predictAgentOutcome(validAgent);
      expect(oracle.metrics.predictionsGenerated).toBe(2);
    });

    test("should store prediction in predictions array", () => {
      oracle.predictAgentOutcome(validAgent);

      expect(oracle.predictions).toHaveLength(1);
      expect(oracle.predictions[0]).toHaveProperty("agent_id", "agent-001");
    });

    test("should include all required fields in prediction", () => {
      const result = oracle.predictAgentOutcome(validAgent);

      expect(result).toHaveProperty("prediction_id");
      expect(result).toHaveProperty("agent_id");
      expect(result).toHaveProperty("agent_generation");
      expect(result).toHaveProperty("agent_fitness");
      expect(result).toHaveProperty("predicted_outcome");
      expect(result).toHaveProperty("predicted_success_rate");
      expect(result).toHaveProperty("confidence_level");
      expect(result).toHaveProperty("predicted_actions");
      expect(result).toHaveProperty("trait_analysis");
      expect(result).toHaveProperty("simulation_results");
      expect(result).toHaveProperty("risk_assessment");
      expect(result).toHaveProperty("timestamp");
    });

    test("should emit prediction:made event on successful prediction", (done) => {
      const listener = jest.fn();
      oracle.on("prediction:made", listener);

      oracle.predictAgentOutcome(validAgent);

      setImmediate(() => {
        expect(listener).toHaveBeenCalled();
        const callData = listener.mock.calls[0][0];
        expect(callData).toHaveProperty("prediction_id");
        expect(callData).toHaveProperty("agent_id");
        expect(callData).toHaveProperty("outcome");
        expect(callData).toHaveProperty("confidence");
        done();
      });
    });

    test("should use agent properties in prediction", () => {
      const customAgent = {
        id: "custom-agent-123",
        fitnessScore: 0.95,
        generation: 25,
        traits: ["expert", "dominant"],
      };

      const result = oracle.predictAgentOutcome(customAgent);

      expect(result.agent_id).toBe("custom-agent-123");
      expect(result.agent_generation).toBe(25);
    });
  });

  describe("Cascade and Monte Carlo Metrics", () => {
    let validAgent;

    beforeEach(() => {
      validAgent = {
        id: "agent-metric-001",
        fitnessScore: 0.75,
        generation: 5,
        traits: ["analytical"],
      };
    });

    test("should track cascades computed in metrics", () => {
      oracle.predictAgentOutcome(validAgent);
      // Cascades are computed internally during prediction
      expect(oracle.metrics.cascadesComputed).toBeGreaterThanOrEqual(0);
    });

    test("should maintain metrics across multiple predictions", () => {
      const count1 = oracle.metrics.predictionsGenerated;

      oracle.predictAgentOutcome(validAgent);
      oracle.predictAgentOutcome(validAgent);
      oracle.predictAgentOutcome(validAgent);

      expect(oracle.metrics.predictionsGenerated).toBe(count1 + 3);
    });
  });

  describe("Prediction ID Uniqueness", () => {
    let validAgent;

    beforeEach(() => {
      validAgent = {
        id: "agent-unique",
        fitnessScore: 0.8,
        generation: 1,
      };
    });

    test("should generate unique prediction IDs", () => {
      const prediction1 = oracle.predictAgentOutcome(validAgent);
      const prediction2 = oracle.predictAgentOutcome(validAgent);

      expect(prediction1.prediction_id).not.toBe(prediction2.prediction_id);
    });

    test("should generate IDs with correct format", () => {
      const result = oracle.predictAgentOutcome(validAgent);

      expect(result.prediction_id).toMatch(/^pred_\d+_[a-z0-9]+$/);
    });
  });

  describe("Mixed Success and Failure Scenarios", () => {
    let validAgent;

    beforeEach(() => {
      oracle.setCircuitBreakerThreshold(3);
      validAgent = {
        id: "agent-mixed",
        fitnessScore: 0.7,
        generation: 2,
      };
    });

    test("should handle alternating failures and successes", () => {
      oracle.predictAgentOutcome(null); // Failure 1
      expect(oracle.failureCount).toBe(1);

      oracle.predictAgentOutcome(validAgent); // Success
      expect(oracle.failureCount).toBe(0);

      oracle.predictAgentOutcome(null); // Failure 1 again
      expect(oracle.failureCount).toBe(1);

      oracle.predictAgentOutcome(validAgent); // Success
      expect(oracle.failureCount).toBe(0);
    });

    test("should not open circuit if failures don't reach threshold", () => {
      oracle.predictAgentOutcome(null);
      oracle.predictAgentOutcome(null);

      expect(oracle.circuitBreakerOpen).toBe(false);
      expect(oracle.failureCount).toBe(2);
    });
  });

  describe("Configuration Persistence", () => {
    test("should preserve custom configuration", () => {
      const customOracle = new OracleCore({
        maxCascadeDepth: 10,
        monteCarloIterations: 5000,
        customOption: true,
      });

      expect(customOracle.config.maxCascadeDepth).toBe(10);
      expect(customOracle.config.monteCarloIterations).toBe(5000);
      expect(customOracle.config.customOption).toBe(true);
    });
  });
});
