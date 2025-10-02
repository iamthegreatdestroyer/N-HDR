/*
 * HDR Empire Framework - TensorFlow.js Mock Factory
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

/**
 * Create a comprehensive TensorFlow.js mock for testing
 * This mock factory provides core tensor operations without requiring actual TensorFlow.js
 * 
 * @returns {Object} Mock TensorFlow.js implementation
 */
export function createTensorFlowMock() {
  return {
    /**
     * Create a tensor from values
     * @param {Array|number} values - Tensor values
     * @param {string} dtype - Data type (default: 'float32')
     * @returns {Object} Mock tensor object
     */
    tensor: (values, dtype) => ({
      values: Array.isArray(values) ? [...values] : [values],
      shape: Array.isArray(values) 
        ? (Array.isArray(values[0]) ? [values.length, values[0].length] : [values.length])
        : [],
      dtype: dtype || 'float32',
      dataSync: () => Array.isArray(values) ? [...values] : [values],
      array: async () => values,
      print: () => console.log(values),
      dispose: () => {}, // No-op for cleanup
    }),

    /**
     * Create a scalar tensor
     * @param {number} value - Scalar value
     * @returns {Object} Mock scalar tensor
     */
    scalar: (value) => ({
      value,
      shape: [],
      dtype: 'float32',
      dataSync: () => [value],
      array: async () => value,
      print: () => console.log(value),
      dispose: () => {}, // No-op for cleanup
    }),

    /**
     * Execute function with automatic tensor cleanup
     * @param {Function} fn - Function to execute
     * @returns {*} Result of function execution
     */
    tidy: (fn) => fn(),

    /**
     * Add two tensors or values
     * @param {Object|number} a - First operand
     * @param {Object|number} b - Second operand
     * @returns {Object} Result tensor
     */
    add: (a, b) => {
      const aVal = typeof a.array === 'function' ? a.value || a.dataSync()[0] : a;
      const bVal = typeof b.array === 'function' ? b.value || b.dataSync()[0] : b;
      const result = aVal + bVal;
      
      return {
        values: [result],
        shape: [],
        dtype: 'float32',
        dataSync: () => [result],
        array: async () => result,
        dispose: () => {},
      };
    },

    /**
     * Multiply two tensors or values
     * @param {Object|number} a - First operand
     * @param {Object|number} b - Second operand
     * @returns {Object} Result tensor
     */
    mul: (a, b) => {
      const aVal = typeof a.array === 'function' ? a.value || a.dataSync()[0] : a;
      const bVal = typeof b.array === 'function' ? b.value || b.dataSync()[0] : b;
      const result = aVal * bVal;
      
      return {
        values: [result],
        shape: [],
        dtype: 'float32',
        dataSync: () => [result],
        array: async () => result,
        dispose: () => {},
      };
    },

    /**
     * Subtract two tensors or values
     * @param {Object|number} a - First operand
     * @param {Object|number} b - Second operand
     * @returns {Object} Result tensor
     */
    sub: (a, b) => {
      const aVal = typeof a.array === 'function' ? a.value || a.dataSync()[0] : a;
      const bVal = typeof b.array === 'function' ? b.value || b.dataSync()[0] : b;
      const result = aVal - bVal;
      
      return {
        values: [result],
        shape: [],
        dtype: 'float32',
        dataSync: () => [result],
        array: async () => result,
        dispose: () => {},
      };
    },

    /**
     * Divide two tensors or values
     * @param {Object|number} a - First operand
     * @param {Object|number} b - Second operand
     * @returns {Object} Result tensor
     */
    div: (a, b) => {
      const aVal = typeof a.array === 'function' ? a.value || a.dataSync()[0] : a;
      const bVal = typeof b.array === 'function' ? b.value || b.dataSync()[0] : b;
      const result = aVal / bVal;
      
      return {
        values: [result],
        shape: [],
        dtype: 'float32',
        dataSync: () => [result],
        array: async () => result,
        dispose: () => {},
      };
    },

    /**
     * Calculate mean of tensor
     * @param {Object} tensor - Input tensor
     * @returns {Object} Mean scalar tensor
     */
    mean: (tensor) => {
      const values = tensor.dataSync ? tensor.dataSync() : [tensor.value || 0];
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      return {
        value: mean,
        shape: [],
        dtype: 'float32',
        dataSync: () => [mean],
        array: async () => mean,
        dispose: () => {},
      };
    },

    /**
     * Calculate sum of tensor
     * @param {Object} tensor - Input tensor
     * @returns {Object} Sum scalar tensor
     */
    sum: (tensor) => {
      const values = tensor.dataSync ? tensor.dataSync() : [tensor.value || 0];
      const sum = values.reduce((acc, val) => acc + val, 0);
      
      return {
        value: sum,
        shape: [],
        dtype: 'float32',
        dataSync: () => [sum],
        array: async () => sum,
        dispose: () => {},
      };
    },

    /**
     * Reshape tensor to new shape
     * @param {Object} tensor - Input tensor
     * @param {Array} shape - New shape
     * @returns {Object} Reshaped tensor
     */
    reshape: (tensor, shape) => ({
      ...tensor,
      shape: shape,
    }),

    /**
     * Slice tensor along dimension
     * @param {Object} tensor - Input tensor
     * @param {Array} begin - Begin indices
     * @param {Array} size - Slice size
     * @returns {Object} Sliced tensor
     */
    slice: (tensor, begin, size) => {
      const values = tensor.dataSync ? tensor.dataSync() : [tensor.value];
      const sliced = values.slice(begin[0], begin[0] + size[0]);
      
      return {
        values: sliced,
        shape: size,
        dtype: tensor.dtype || 'float32',
        dataSync: () => sliced,
        array: async () => sliced,
        dispose: () => {},
      };
    },

    /**
     * Concatenate tensors along axis
     * @param {Array} tensors - Tensors to concatenate
     * @param {number} axis - Concatenation axis
     * @returns {Object} Concatenated tensor
     */
    concat: (tensors, axis = 0) => {
      const allValues = tensors.flatMap(t => 
        t.dataSync ? t.dataSync() : [t.value]
      );
      
      return {
        values: allValues,
        shape: [allValues.length],
        dtype: 'float32',
        dataSync: () => allValues,
        array: async () => allValues,
        dispose: () => {},
      };
    },

    /**
     * Stack tensors along new axis
     * @param {Array} tensors - Tensors to stack
     * @param {number} axis - Stack axis
     * @returns {Object} Stacked tensor
     */
    stack: (tensors, axis = 0) => {
      const allValues = tensors.map(t => 
        t.dataSync ? t.dataSync() : [t.value]
      );
      
      return {
        values: allValues,
        shape: [allValues.length, allValues[0].length],
        dtype: 'float32',
        dataSync: () => allValues.flat(),
        array: async () => allValues,
        dispose: () => {},
      };
    },

    /**
     * Get tensor rank
     * @param {Object} tensor - Input tensor
     * @returns {number} Tensor rank
     */
    rank: (tensor) => tensor.shape ? tensor.shape.length : 0,

    /**
     * Clone tensor
     * @param {Object} tensor - Tensor to clone
     * @returns {Object} Cloned tensor
     */
    clone: (tensor) => ({ ...tensor }),

    /**
     * Keep tensors in memory
     * @param {Object} result - Tensor to keep
     * @returns {Object} Kept tensor
     */
    keep: (result) => result,

    /**
     * Get memory info
     * @returns {Object} Memory statistics
     */
    memory: () => ({
      numTensors: 0,
      numDataBuffers: 0,
      numBytes: 0,
      unreliable: true,
    }),

    /**
     * Enable production mode (no-op in mock)
     */
    enableProdMode: () => {},

    /**
     * Set backend (no-op in mock)
     */
    setBackend: () => Promise.resolve(true),

    /**
     * Ready promise (immediately resolved in mock)
     */
    ready: () => Promise.resolve(),
  };
}

/**
 * Initialize TensorFlow.js mock as global
 * Call this in test setup (beforeAll) to make tf available globally
 */
export function initializeTensorFlowMock() {
  global.tf = createTensorFlowMock();
}

export default createTensorFlowMock;
