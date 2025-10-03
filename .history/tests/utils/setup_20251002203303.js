/*
 * HDR Empire Framework - Jest Test Setup
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import { registerPerformanceMatchers } from "./custom-matchers.js";

// Register custom performance matchers globally
registerPerformanceMatchers();

// Configure TensorFlow mock
// This must be done before any tests import TensorFlow
if (process.env.NODE_ENV === 'test') {
  // Dynamic import of TensorFlow mock
  const tensorflowMockModule = await import('../../src/test/mocks/tensorflow-mock.js');
  
  // Make mock available globally
  global.tf = tensorflowMockModule.default;
  
  // Mock the @tensorflow/tfjs module
  jest.mock('@tensorflow/tfjs', () => tensorflowMockModule.default, { virtual: true });
  
  console.log("✓ TensorFlow mock configured");
}

// Additional global setup can be added here
console.log("✓ HDR Empire Framework test environment initialized");
console.log("✓ Custom performance matchers registered");
