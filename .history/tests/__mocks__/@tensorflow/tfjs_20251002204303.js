/*
 * HDR Empire Framework - TensorFlow Mock Configuration
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

/**
 * Jest Module Mock Configuration for TensorFlow
 *
 * This file registers the TensorFlow mock globally for all tests.
 * It must be imported before any code that uses TensorFlow.
 */

import tensorflowMock from "../../src/test/mocks/tensorflow-mock.js";

// Export the mock as default
export default tensorflowMock;

// Also export all named exports
export const {
  tensor,
  tensor1d,
  tensor2d,
  tensor3d,
  tensor4d,
  scalar,
  zeros,
  ones,
  fill,
  randomUniform,
  randomNormal,
  tidy,
  keep,
  dispose,
  add,
  sub,
  mul,
  div,
  matMul,
  TensorMock,
} = tensorflowMock;
