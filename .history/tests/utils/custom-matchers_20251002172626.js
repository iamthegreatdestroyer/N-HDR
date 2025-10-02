/*
 * HDR Empire Framework - Custom Jest Matchers for Performance Testing
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

/**
 * Register custom Jest matchers for performance testing
 * 
 * Provides specialized matchers for:
 * - toBeMeasurement: Validate measurements are within acceptable ranges
 * - toBePerformant: Validate performance meets thresholds
 */
export function registerPerformanceMatchers() {
  expect.extend({
    /**
     * Check if a measurement falls within an acceptable range
     * 
     * @example
     * expect(latency).toBeMeasurement({ min: 0, max: 100, unit: 'ms' })
     */
    toBeMeasurement(received, { min, max, unit = 'ms' }) {
      const pass = received >= min && received <= max;
      
      const message = () => {
        if (pass) {
          return (
            `Expected ${received}${unit} NOT to be between ${min}${unit} and ${max}${unit}, ` +
            `but it was`
          );
        } else {
          return (
            `Expected ${received}${unit} to be between ${min}${unit} and ${max}${unit}, ` +
            `but it was ${received < min ? 'below' : 'above'} the ${received < min ? 'minimum' : 'maximum'}`
          );
        }
      };
      
      return { pass, message };
    },

    /**
     * Check if a performance metric meets threshold requirements
     * 
     * @example
     * expect(executionTime).toBePerformant({ 
     *   threshold: 50, 
     *   baseline: 100, 
     *   unit: 'ms' 
     * })
     */
    toBePerformant(received, { threshold, baseline, unit = 'ms' }) {
      const pass = received <= threshold;
      const percentOfBaseline = baseline ? ((received / baseline) * 100).toFixed(2) : 'N/A';
      
      const message = () => {
        if (pass) {
          return (
            `Expected ${received}${unit} NOT to be below threshold ${threshold}${unit}, ` +
            `but it was (${percentOfBaseline}% of baseline ${baseline}${unit})`
          );
        } else {
          const exceededBy = received - threshold;
          return (
            `Expected ${received}${unit} to be below threshold ${threshold}${unit}, ` +
            `but it exceeded by ${exceededBy}${unit} ` +
            `(${percentOfBaseline}% of baseline ${baseline}${unit})`
          );
        }
      };
      
      return { pass, message };
    },

    /**
     * Check if a value is within a percentage of a target
     * 
     * @example
     * expect(actual).toBeWithinPercentOf(target, 5) // within 5%
     */
    toBeWithinPercentOf(received, target, percentage) {
      const tolerance = (target * percentage) / 100;
      const min = target - tolerance;
      const max = target + tolerance;
      const pass = received >= min && received <= max;
      
      const actualPercent = (((received - target) / target) * 100).toFixed(2);
      
      const message = () => {
        if (pass) {
          return (
            `Expected ${received} NOT to be within ${percentage}% of ${target}, ` +
            `but it was (${actualPercent}% difference)`
          );
        } else {
          return (
            `Expected ${received} to be within ${percentage}% of ${target} ` +
            `(range: ${min.toFixed(2)} - ${max.toFixed(2)}), ` +
            `but it was ${actualPercent}% different`
          );
        }
      };
      
      return { pass, message };
    },

    /**
     * Check if a duration is faster than a reference
     * 
     * @example
     * expect(optimizedTime).toBeFasterThan(originalTime)
     */
    toBeFasterThan(received, reference, unit = 'ms') {
      const pass = received < reference;
      const improvement = reference - received;
      const percentFaster = ((improvement / reference) * 100).toFixed(2);
      
      const message = () => {
        if (pass) {
          return (
            `Expected ${received}${unit} NOT to be faster than ${reference}${unit}, ` +
            `but it was ${percentFaster}% faster (${improvement}${unit} improvement)`
          );
        } else {
          const slower = received - reference;
          const percentSlower = ((slower / reference) * 100).toFixed(2);
          return (
            `Expected ${received}${unit} to be faster than ${reference}${unit}, ` +
            `but it was ${percentSlower}% slower (${slower}${unit} slower)`
          );
        }
      };
      
      return { pass, message };
    },

    /**
     * Check if throughput meets minimum requirements
     * 
     * @example
     * expect(opsPerSecond).toMeetThroughput(1000) // minimum 1000 ops/sec
     */
    toMeetThroughput(received, minimum, unit = 'ops/sec') {
      const pass = received >= minimum;
      const percentOfMin = ((received / minimum) * 100).toFixed(2);
      
      const message = () => {
        if (pass) {
          return (
            `Expected ${received} ${unit} NOT to meet minimum ${minimum} ${unit}, ` +
            `but it was ${percentOfMin}% of minimum`
          );
        } else {
          const shortfall = minimum - received;
          return (
            `Expected ${received} ${unit} to meet minimum ${minimum} ${unit}, ` +
            `but it fell short by ${shortfall} ${unit} (${percentOfMin}% of minimum)`
          );
        }
      };
      
      return { pass, message };
    }
  });
}

/**
 * Auto-register matchers when imported
 * This allows tests to simply import the file to enable matchers
 */
if (typeof expect !== 'undefined') {
  registerPerformanceMatchers();
}

export default registerPerformanceMatchers;
