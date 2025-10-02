/*
 * HDR Empire Framework - Instance-Preserving Mock Utility
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

/**
 * Instance-Preserving Mock Pattern
 *
 * This utility solves the critical challenge of mocking methods on class instances
 * while preserving the original instance for instanceof checks.
 *
 * Problem:
 *   ❌ nhdr.security = { method: async () => result }  // Loses instance
 *   ✅ preservingMock(nhdr.security, { method: async () => result })  // Keeps instance
 *
 * @param {Object} instance - The class instance to mock methods on
 * @param {Object} methodMocks - Object mapping method names to mock implementations
 * @returns {Function} Restore function to revert mocked methods to originals
 */
export function preservingMock(instance, methodMocks) {
  if (!instance || typeof instance !== "object") {
    throw new Error("preservingMock: instance must be a valid object");
  }

  if (!methodMocks || typeof methodMocks !== "object") {
    throw new Error("preservingMock: methodMocks must be a valid object");
  }

  // Store original method implementations for optional restoration
  const originalMethods = {};

  // Replace each method with mock implementation
  Object.entries(methodMocks).forEach(([methodName, mockImplementation]) => {
    // Store original if it exists
    if (instance[methodName] !== undefined) {
      originalMethods[methodName] = instance[methodName];
    }

    // Replace with mock
    instance[methodName] = mockImplementation;
  });

  // Return restore function
  return () => {
    Object.entries(originalMethods).forEach(([methodName, originalImpl]) => {
      instance[methodName] = originalImpl;
    });
  };
}

/**
 * Batch preserving mock for multiple instances
 * Useful for setting up multiple dependencies in tests
 *
 * @param {Array<{instance: Object, mocks: Object}>} configs - Array of mock configurations
 * @returns {Function} Restore function for all mocked instances
 */
export function batchPreservingMock(configs) {
  const restoreFunctions = configs.map(({ instance, mocks }) =>
    preservingMock(instance, mocks)
  );

  return () => {
    restoreFunctions.forEach((restore) => restore());
  };
}

/**
 * Create a preserving mock with automatic cleanup in afterEach
 * This is the recommended pattern for Jest tests
 *
 * Usage:
 *   beforeEach(() => {
 *     autoPreservingMock(nhdr.security, {
 *       getOperationToken: async () => "mock-token"
 *     });
 *   });
 *
 * @param {Object} instance - The class instance to mock
 * @param {Object} methodMocks - Method mocks to apply
 */
export function autoPreservingMock(instance, methodMocks) {
  const restore = preservingMock(instance, methodMocks);

  // Register cleanup if afterEach is available (Jest environment)
  if (typeof afterEach === "function") {
    afterEach(restore);
  }

  return restore;
}

/**
 * Preserve instance while mocking with validation
 * Throws error if trying to mock non-existent methods
 *
 * @param {Object} instance - The class instance
 * @param {Object} methodMocks - Method mocks
 * @param {Object} options - Validation options
 * @returns {Function} Restore function
 */
export function strictPreservingMock(instance, methodMocks, options = {}) {
  const { allowNew = true, validateTypes = true } = options;

  Object.entries(methodMocks).forEach(([methodName, mockImpl]) => {
    // Check if method exists on instance
    const methodExists = methodName in instance;

    if (!methodExists && !allowNew) {
      throw new Error(
        `strictPreservingMock: Method '${methodName}' does not exist on instance. ` +
          `Set allowNew: true to mock new methods.`
      );
    }

    // Validate that original is a function (if it exists)
    if (
      validateTypes &&
      methodExists &&
      typeof instance[methodName] === "function"
    ) {
      if (typeof mockImpl !== "function") {
        throw new Error(
          `strictPreservingMock: Original '${methodName}' is a function, ` +
            `but mock is ${typeof mockImpl}`
        );
      }
    }
  });

  return preservingMock(instance, methodMocks);
}

/**
 * Helper to create common async mock patterns
 */
export const mockPatterns = {
  /**
   * Create an async function that returns a value
   */
  asyncReturn: (value) => async () => value,

  /**
   * Create an async function that returns based on input
   */
  asyncMap: (mapFn) => async (input) => mapFn(input),

  /**
   * Create an async function that throws an error
   */
  asyncThrow: (error) => async () => {
    throw error;
  },

  /**
   * Create an async function with delay
   */
  asyncDelayed:
    (value, delayMs = 100) =>
    async () => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return value;
    },

  /**
   * Create a mock that tracks calls
   */
  tracked: () => {
    const calls = [];
    const mock = async (...args) => {
      calls.push(args);
      return { called: true, args };
    };
    mock.calls = calls;
    mock.callCount = () => calls.length;
    mock.lastCall = () => calls[calls.length - 1];
    return mock;
  },
};

/**
 * Example usage patterns for documentation
 */
export const examples = {
  // Basic usage
  basic: `
    beforeEach(() => {
      const nhdr = new NeuralHDR();
      
      preservingMock(nhdr.security, {
        getOperationToken: async () => "mock-token",
        validateToken: async () => true
      });
      
      // nhdr.security is still instanceof SecurityManager ✓
    });
  `,

  // With restore
  withRestore: `
    let restore;
    
    beforeEach(() => {
      restore = preservingMock(instance, mocks);
    });
    
    afterEach(() => {
      restore(); // Restore original methods
    });
  `,

  // Batch mocking
  batch: `
    beforeEach(() => {
      batchPreservingMock([
        { instance: nhdr.security, mocks: { ... } },
        { instance: nhdr.quantum, mocks: { ... } },
        { instance: nhdr.ohdr, mocks: { ... } }
      ]);
    });
  `,

  // Using mock patterns
  patterns: `
    preservingMock(storage, {
      retrieve: mockPatterns.asyncReturn({ data: "test" }),
      store: mockPatterns.asyncMap(data => ({ stored: true, data })),
      invalid: mockPatterns.asyncThrow(new Error("Invalid")),
      slow: mockPatterns.asyncDelayed({ result: "done" }, 500)
    });
  `,
};

export default preservingMock;
