/*
 * HDR Empire Framework - TensorFlow Mock Library
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

/**
 * Comprehensive TensorFlow.js Mock Library
 *
 * Provides complete mock implementation of TensorFlow.js for testing purposes.
 * Supports method chaining, tensor operations, and all core TF functionality
 * used throughout the HDR Empire Framework.
 */

/**
 * Mock Tensor class with full operation support
 */
export class TensorMock {
  constructor(values, shape = null, dtype = "float32") {
    // Handle different input types
    if (typeof values === "number") {
      this.values = [values];
      this.shape = [];
    } else if (Array.isArray(values)) {
      this.values = this._flattenArray(values);
      this.shape = shape || this._inferShape(values);
    } else if (values instanceof TensorMock) {
      this.values = [...values.values];
      this.shape = [...values.shape];
    } else {
      this.values = [values];
      this.shape = [];
    }

    this.dtype = dtype;
    this.size = this.values.length;
    this.rank = this.shape.length;
    this.disposed = false;
  }

  /**
   * Flatten nested arrays to 1D
   */
  _flattenArray(arr) {
    if (!Array.isArray(arr)) return [arr];
    return arr.reduce((acc, val) => {
      return acc.concat(Array.isArray(val) ? this._flattenArray(val) : val);
    }, []);
  }

  /**
   * Infer shape from nested array structure
   */
  _inferShape(arr) {
    if (!Array.isArray(arr)) return [];
    const shape = [arr.length];
    if (arr.length > 0 && Array.isArray(arr[0])) {
      shape.push(...this._inferShape(arr[0]));
    }
    return shape;
  }

  /**
   * Convert flat array to nested array based on shape
   */
  _reshapeArray(values, shape) {
    if (shape.length === 0) return values[0];
    if (shape.length === 1) return values;

    const result = [];
    const size = shape.slice(1).reduce((a, b) => a * b, 1);
    for (let i = 0; i < shape[0]; i++) {
      result.push(
        this._reshapeArray(
          values.slice(i * size, (i + 1) * size),
          shape.slice(1)
        )
      );
    }
    return result;
  }

  // ==================== Data Access Methods ====================

  /**
   * Get tensor data as nested array
   */
  array() {
    return this._reshapeArray([...this.values], this.shape);
  }

  /**
   * Get tensor data as flat array (sync)
   */
  arraySync() {
    return this.array();
  }

  /**
   * Get tensor data as typed array (sync)
   */
  dataSync() {
    return new Float32Array(this.values);
  }

  /**
   * Get tensor data as promise
   */
  async data() {
    return new Float32Array(this.values);
  }

  // ==================== Shape Operations ====================

  /**
   * Reshape tensor to new shape
   */
  reshape(newShape) {
    const newSize = newShape.reduce((a, b) => a * b, 1);
    if (newSize !== this.size) {
      throw new Error(
        `Cannot reshape tensor of size ${this.size} to shape [${newShape}]`
      );
    }
    return new TensorMock(this.values, newShape, this.dtype);
  }

  /**
   * Expand tensor dimensions
   */
  expandDims(axis = 0) {
    const newShape = [...this.shape];
    const normalizedAxis = axis < 0 ? this.rank + axis + 1 : axis;
    newShape.splice(normalizedAxis, 0, 1);
    return new TensorMock(this.values, newShape, this.dtype);
  }

  /**
   * Squeeze tensor dimensions (remove dimensions of size 1)
   */
  squeeze(axis = null) {
    let newShape;
    if (axis === null) {
      newShape = this.shape.filter((dim) => dim !== 1);
    } else {
      newShape = [...this.shape];
      const axes = Array.isArray(axis) ? axis : [axis];
      axes.sort((a, b) => b - a); // Sort descending
      axes.forEach((ax) => {
        if (this.shape[ax] === 1) {
          newShape.splice(ax, 1);
        }
      });
    }
    return new TensorMock(this.values, newShape, this.dtype);
  }

  /**
   * Transpose tensor
   */
  transpose(perm = null) {
    // For simplicity, just reverse dimensions for 2D case
    if (this.rank === 2 && perm === null) {
      const [rows, cols] = this.shape;
      const transposed = [];
      for (let i = 0; i < this.size; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const newIdx = col * rows + row;
        transposed[newIdx] = this.values[i];
      }
      return new TensorMock(transposed, [cols, rows], this.dtype);
    }
    return new TensorMock(this.values, [...this.shape].reverse(), this.dtype);
  }

  // ==================== Math Operations ====================

  /**
   * Element-wise addition
   */
  add(other) {
    const otherValues = this._getTensorValues(other);
    const result = this.values.map((v, i) => v + (otherValues[i] || 0));
    return new TensorMock(result, this.shape, this.dtype);
  }

  /**
   * Element-wise subtraction
   */
  sub(other) {
    const otherValues = this._getTensorValues(other);
    const result = this.values.map((v, i) => v - (otherValues[i] || 0));
    return new TensorMock(result, this.shape, this.dtype);
  }

  /**
   * Element-wise multiplication
   */
  mul(other) {
    const otherValues = this._getTensorValues(other);
    const result = this.values.map((v, i) => v * (otherValues[i] || 1));
    return new TensorMock(result, this.shape, this.dtype);
  }

  /**
   * Element-wise division
   */
  div(other) {
    const otherValues = this._getTensorValues(other);
    const result = this.values.map((v, i) => v / (otherValues[i] || 1));
    return new TensorMock(result, this.shape, this.dtype);
  }

  /**
   * Matrix multiplication
   */
  matMul(other) {
    const otherTensor =
      other instanceof TensorMock ? other : new TensorMock(other);

    if (this.rank !== 2 || otherTensor.rank !== 2) {
      throw new Error("matMul requires 2D tensors");
    }

    const [m, k] = this.shape;
    const [k2, n] = otherTensor.shape;

    if (k !== k2) {
      throw new Error(`matMul shape mismatch: [${m},${k}] x [${k2},${n}]`);
    }

    const result = new Array(m * n).fill(0);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let l = 0; l < k; l++) {
          sum += this.values[i * k + l] * otherTensor.values[l * n + j];
        }
        result[i * n + j] = sum;
      }
    }

    return new TensorMock(result, [m, n], this.dtype);
  }

  /**
   * Sum reduction
   */
  sum(axis = null, keepDims = false) {
    if (axis === null) {
      const sum = this.values.reduce((a, b) => a + b, 0);
      return new TensorMock(
        [sum],
        keepDims ? this.shape.map(() => 1) : [],
        this.dtype
      );
    }
    // Simplified: just return same tensor for axis sum
    return new TensorMock(this.values, this.shape, this.dtype);
  }

  /**
   * Mean reduction
   */
  mean(axis = null, keepDims = false) {
    if (axis === null) {
      const mean = this.values.reduce((a, b) => a + b, 0) / this.size;
      return new TensorMock(
        [mean],
        keepDims ? this.shape.map(() => 1) : [],
        this.dtype
      );
    }
    // Simplified: just return same tensor for axis mean
    return new TensorMock(this.values, this.shape, this.dtype);
  }

  /**
   * Maximum value
   */
  max(axis = null, keepDims = false) {
    if (axis === null) {
      const max = Math.max(...this.values);
      return new TensorMock(
        [max],
        keepDims ? this.shape.map(() => 1) : [],
        this.dtype
      );
    }
    return new TensorMock(this.values, this.shape, this.dtype);
  }

  /**
   * Minimum value
   */
  min(axis = null, keepDims = false) {
    if (axis === null) {
      const min = Math.min(...this.values);
      return new TensorMock(
        [min],
        keepDims ? this.shape.map(() => 1) : [],
        this.dtype
      );
    }
    return new TensorMock(this.values, this.shape, this.dtype);
  }

  /**
   * Absolute value
   */
  abs() {
    const result = this.values.map((v) => Math.abs(v));
    return new TensorMock(result, this.shape, this.dtype);
  }

  /**
   * Square root
   */
  sqrt() {
    const result = this.values.map((v) => Math.sqrt(v));
    return new TensorMock(result, this.shape, this.dtype);
  }

  /**
   * Exponential
   */
  exp() {
    const result = this.values.map((v) => Math.exp(v));
    return new TensorMock(result, this.shape, this.dtype);
  }

  /**
   * Natural logarithm
   */
  log() {
    const result = this.values.map((v) => Math.log(v));
    return new TensorMock(result, this.shape, this.dtype);
  }

  /**
   * Power
   */
  pow(exponent) {
    const exp = typeof exponent === "number" ? exponent : exponent.values[0];
    const result = this.values.map((v) => Math.pow(v, exp));
    return new TensorMock(result, this.shape, this.dtype);
  }

  // ==================== Comparison Operations ====================

  /**
   * Greater than comparison
   */
  greater(other) {
    const otherValues = this._getTensorValues(other);
    const result = this.values.map((v, i) =>
      v > (otherValues[i] || 0) ? 1 : 0
    );
    return new TensorMock(result, this.shape, "bool");
  }

  /**
   * Less than comparison
   */
  less(other) {
    const otherValues = this._getTensorValues(other);
    const result = this.values.map((v, i) =>
      v < (otherValues[i] || 0) ? 1 : 0
    );
    return new TensorMock(result, this.shape, "bool");
  }

  /**
   * Equal comparison
   */
  equal(other) {
    const otherValues = this._getTensorValues(other);
    const result = this.values.map((v, i) =>
      v === (otherValues[i] || 0) ? 1 : 0
    );
    return new TensorMock(result, this.shape, "bool");
  }

  // ==================== Utility Methods ====================

  /**
   * Clone tensor
   */
  clone() {
    return new TensorMock(this.values, this.shape, this.dtype);
  }

  /**
   * Cast tensor to different dtype
   */
  cast(dtype) {
    return new TensorMock(this.values, this.shape, dtype);
  }

  /**
   * Dispose tensor (release memory)
   */
  dispose() {
    this.disposed = true;
  }

  /**
   * Print tensor to console
   */
  print(verbose = false) {
    console.log(`Tensor: shape=[${this.shape}], dtype=${this.dtype}`);
    if (verbose) {
      console.log(this.array());
    }
  }

  /**
   * Convert to string
   */
  toString() {
    return `Tensor(shape=[${this.shape}], dtype=${this.dtype}, size=${this.size})`;
  }

  /**
   * Helper to extract values from tensor or scalar
   */
  _getTensorValues(value) {
    if (value instanceof TensorMock) {
      return value.values;
    } else if (typeof value === "number") {
      return new Array(this.size).fill(value);
    } else if (Array.isArray(value)) {
      return this._flattenArray(value);
    }
    return [value];
  }
}

// ==================== TensorFlow Namespace Functions ====================

/**
 * Create tensor from array
 */
export function tensor(values, shape = null, dtype = "float32") {
  return new TensorMock(values, shape, dtype);
}

/**
 * Create 1D tensor
 */
export function tensor1d(values, dtype = "float32") {
  const flat = Array.isArray(values) ? values : [values];
  return new TensorMock(flat, [flat.length], dtype);
}

/**
 * Create 2D tensor
 */
export function tensor2d(values, shape = null, dtype = "float32") {
  if (!Array.isArray(values)) values = [[values]];
  if (!Array.isArray(values[0])) values = [values];

  const inferredShape = shape || [values.length, values[0].length];
  return new TensorMock(values, inferredShape, dtype);
}

/**
 * Create 3D tensor
 */
export function tensor3d(values, shape = null, dtype = "float32") {
  return new TensorMock(values, shape, dtype);
}

/**
 * Create 4D tensor
 */
export function tensor4d(values, shape = null, dtype = "float32") {
  return new TensorMock(values, shape, dtype);
}

/**
 * Create scalar tensor
 */
export function scalar(value, dtype = "float32") {
  return new TensorMock([value], [], dtype);
}

/**
 * Create tensor filled with zeros
 */
export function zeros(shape, dtype = "float32") {
  const size = shape.reduce((a, b) => a * b, 1);
  return new TensorMock(new Array(size).fill(0), shape, dtype);
}

/**
 * Create tensor filled with ones
 */
export function ones(shape, dtype = "float32") {
  const size = shape.reduce((a, b) => a * b, 1);
  return new TensorMock(new Array(size).fill(1), shape, dtype);
}

/**
 * Create tensor filled with constant value
 */
export function fill(shape, value, dtype = "float32") {
  const size = shape.reduce((a, b) => a * b, 1);
  return new TensorMock(new Array(size).fill(value), shape, dtype);
}

/**
 * Create random uniform tensor
 */
export function randomUniform(
  shape,
  minval = 0,
  maxval = 1,
  dtype = "float32"
) {
  const size = shape.reduce((a, b) => a * b, 1);
  const values = new Array(size)
    .fill(0)
    .map(() => Math.random() * (maxval - minval) + minval);
  return new TensorMock(values, shape, dtype);
}

/**
 * Create random normal tensor
 */
export function randomNormal(shape, mean = 0, stdDev = 1, dtype = "float32") {
  const size = shape.reduce((a, b) => a * b, 1);
  const values = new Array(size).fill(0).map(() => {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z * stdDev + mean;
  });
  return new TensorMock(values, shape, dtype);
}

/**
 * Memory management - run function and clean up tensors
 */
export function tidy(fn) {
  const result = fn();
  // In real TensorFlow, this would dispose intermediate tensors
  // For mock, we just return the result
  return result;
}

/**
 * Keep tensor alive in tidy
 */
export function keep(tensor) {
  return tensor;
}

/**
 * Dispose tensor(s)
 */
export function dispose(tensor) {
  if (Array.isArray(tensor)) {
    tensor.forEach((t) => t && t.dispose && t.dispose());
  } else if (tensor && tensor.dispose) {
    tensor.dispose();
  }
}

// ==================== Operations (Global Functions) ====================

export const add = (a, b) => {
  const tensorA = a instanceof TensorMock ? a : new TensorMock(a);
  return tensorA.add(b);
};

export const sub = (a, b) => {
  const tensorA = a instanceof TensorMock ? a : new TensorMock(a);
  return tensorA.sub(b);
};

export const mul = (a, b) => {
  const tensorA = a instanceof TensorMock ? a : new TensorMock(a);
  return tensorA.mul(b);
};

export const div = (a, b) => {
  const tensorA = a instanceof TensorMock ? a : new TensorMock(a);
  return tensorA.div(b);
};

export const matMul = (a, b) => {
  const tensorA = a instanceof TensorMock ? a : new TensorMock(a);
  return tensorA.matMul(b);
};

// ==================== Default Export (TensorFlow Namespace) ====================

const tf = {
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

  // Memory info
  memory: () => ({ numTensors: 0, numDataBuffers: 0, numBytes: 0 }),

  // Backend
  backend: () => "cpu",
  setBackend: () => Promise.resolve(true),

  // Ready promise
  ready: () => Promise.resolve(),

  // Version
  version: { "tfjs-core": "4.0.0" },
};

export default tf;
