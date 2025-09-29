/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * DIMENSIONAL MAPPING
 * Manages multi-dimensional mapping and transformation of consciousness states,
 * enabling seamless transitions between different dimensional representations.
 */

const crypto = require("crypto");
const { SecureTaskExecution } = require("../quantum/secure-task-execution");

/**
 * @class DimensionalVector
 * @description Represents a vector in n-dimensional space
 * @private
 */
class DimensionalVector {
  /**
   * Creates a new DimensionalVector
   * @param {Array<number>} components - Vector components
   */
  constructor(components) {
    this.components = [...components];
    this.dimension = components.length;
  }

  /**
   * Add another vector
   * @param {DimensionalVector} other - Vector to add
   * @returns {DimensionalVector} Resulting vector
   */
  add(other) {
    if (this.dimension !== other.dimension) {
      throw new Error("Dimension mismatch");
    }
    return new DimensionalVector(
      this.components.map((c, i) => c + other.components[i])
    );
  }

  /**
   * Scale vector by scalar value
   * @param {number} scalar - Scaling factor
   * @returns {DimensionalVector} Scaled vector
   */
  scale(scalar) {
    return new DimensionalVector(this.components.map((c) => c * scalar));
  }

  /**
   * Calculate dot product with another vector
   * @param {DimensionalVector} other - Vector to dot with
   * @returns {number} Dot product
   */
  dot(other) {
    if (this.dimension !== other.dimension) {
      throw new Error("Dimension mismatch");
    }
    return this.components.reduce(
      (sum, c, i) => sum + c * other.components[i],
      0
    );
  }

  /**
   * Calculate vector magnitude
   * @returns {number} Vector magnitude
   */
  magnitude() {
    return Math.sqrt(this.dot(this));
  }

  /**
   * Normalize vector to unit length
   * @returns {DimensionalVector} Normalized vector
   */
  normalize() {
    const mag = this.magnitude();
    return mag === 0 ? this : this.scale(1 / mag);
  }
}

/**
 * @class DimensionalMapping
 * @description Manages multi-dimensional consciousness state mapping
 * @copyright © 2025 Stephen Bilodeau - PATENT PENDING
 * @license PROPRIETARY
 */
class DimensionalMapping {
  /**
   * Creates a new DimensionalMapping manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      maxDimensions: options.maxDimensions || 12,
      minDimensions: options.minDimensions || 3,
      projectionQuality: options.projectionQuality || 0.9,
      ...options,
    };

    this.basisVectors = new Map();
    this.dimensionalCache = new Map();
    this.secureExecution = new SecureTaskExecution();
  }

  /**
   * Map consciousness state to higher dimension
   * @param {Object} state - State to map
   * @param {number} targetDim - Target dimension
   * @returns {Promise<Object>} Mapped state
   */
  async mapToHigherDimension(state, targetDim) {
    if (targetDim > this.options.maxDimensions) {
      throw new Error(
        `Target dimension exceeds maximum (${this.options.maxDimensions})`
      );
    }

    return await this.secureExecution.execute(async () => {
      const sourceDim = this._getStateDimension(state);
      if (sourceDim >= targetDim) return state;

      // Generate or retrieve basis vectors
      const basis = await this._getOrCreateBasis(sourceDim, targetDim);

      // Map state components
      const mappedState = {
        ...state,
        dimensions: targetDim,
        coordinates: this._projectToHigherDimension(
          state.coordinates || this._extractCoordinates(state),
          basis
        ),
        mappingMetadata: {
          originalDimensions: sourceDim,
          basisHash: this._calculateBasisHash(basis),
          quality: this._calculateMappingQuality(state, targetDim),
        },
      };

      // Cache mapping for future reference
      this._cacheDimensionalMapping(state, mappedState);

      return mappedState;
    });
  }

  /**
   * Map consciousness state to lower dimension
   * @param {Object} state - State to map
   * @param {number} targetDim - Target dimension
   * @returns {Promise<Object>} Mapped state
   */
  async mapToLowerDimension(state, targetDim) {
    if (targetDim < this.options.minDimensions) {
      throw new Error(
        `Target dimension below minimum (${this.options.minDimensions})`
      );
    }

    return await this.secureExecution.execute(async () => {
      const sourceDim = this._getStateDimension(state);
      if (sourceDim <= targetDim) return state;

      // Check cache first
      const cached = this._getCachedMapping(state, targetDim);
      if (cached) return cached;

      // Perform dimensionality reduction
      const reducedCoords = await this._reduceDimensionality(
        state.coordinates || this._extractCoordinates(state),
        targetDim
      );

      const mappedState = {
        ...state,
        dimensions: targetDim,
        coordinates: reducedCoords,
        mappingMetadata: {
          originalDimensions: sourceDim,
          reductionMethod: "adaptive-projection",
          preservedVariance: this._calculatePreservedVariance(
            state.coordinates,
            reducedCoords
          ),
        },
      };

      // Cache mapping
      this._cacheDimensionalMapping(state, mappedState);

      return mappedState;
    });
  }

  /**
   * Transform state between arbitrary dimensions
   * @param {Object} state - State to transform
   * @param {number} targetDim - Target dimension
   * @returns {Promise<Object>} Transformed state
   */
  async transformDimensions(state, targetDim) {
    const currentDim = this._getStateDimension(state);

    if (targetDim === currentDim) return state;
    if (targetDim > currentDim) {
      return this.mapToHigherDimension(state, targetDim);
    }
    return this.mapToLowerDimension(state, targetDim);
  }

  /**
   * Calculate dimensional compatibility between states
   * @param {Object} state1 - First state
   * @param {Object} state2 - Second state
   * @returns {Promise<Object>} Compatibility metrics
   */
  async calculateCompatibility(state1, state2) {
    const dim1 = this._getStateDimension(state1);
    const dim2 = this._getStateDimension(state2);

    return await this.secureExecution.execute(async () => {
      // Calculate basic metrics
      const metrics = {
        dimensionalDifference: Math.abs(dim1 - dim2),
        structuralSimilarity: this._calculateStructuralSimilarity(
          state1,
          state2
        ),
        topologyPreservation: await this._calculateTopologyPreservation(
          state1,
          state2
        ),
      };

      // Calculate overall compatibility score
      metrics.compatibilityScore =
        (1 - metrics.dimensionalDifference / Math.max(dim1, dim2)) * 0.3 +
        metrics.structuralSimilarity * 0.4 +
        metrics.topologyPreservation * 0.3;

      return metrics;
    });
  }

  /**
   * Get or create dimensional basis vectors
   * @private
   * @param {number} sourceDim - Source dimension
   * @param {number} targetDim - Target dimension
   * @returns {Promise<Array<DimensionalVector>>} Basis vectors
   */
  async _getOrCreateBasis(sourceDim, targetDim) {
    const key = `${sourceDim}-${targetDim}`;
    if (this.basisVectors.has(key)) {
      return this.basisVectors.get(key);
    }

    // Create new orthonormal basis
    const basis = [];
    for (let i = 0; i < targetDim; i++) {
      // Generate random vector
      const components = Array(targetDim)
        .fill(0)
        .map(() => Math.random() * 2 - 1);
      let vector = new DimensionalVector(components);

      // Orthogonalize against existing basis vectors
      for (const existing of basis) {
        const proj = existing.scale(vector.dot(existing));
        vector = vector.add(proj.scale(-1));
      }

      // Normalize and add to basis
      basis.push(vector.normalize());
    }

    this.basisVectors.set(key, basis);
    return basis;
  }

  /**
   * Project coordinates to higher dimension
   * @private
   * @param {Array<number>} coords - Source coordinates
   * @param {Array<DimensionalVector>} basis - Basis vectors
   * @returns {Array<number>} Projected coordinates
   */
  _projectToHigherDimension(coords, basis) {
    const vector = new DimensionalVector(coords);
    const projected = basis.map((basisVector) => vector.dot(basisVector));
    return projected;
  }

  /**
   * Reduce dimensionality of coordinates
   * @private
   * @param {Array<number>} coords - Source coordinates
   * @param {number} targetDim - Target dimension
   * @returns {Promise<Array<number>>} Reduced coordinates
   */
  async _reduceDimensionality(coords, targetDim) {
    // Implement adaptive projection based on coordinate distribution
    const vector = new DimensionalVector(coords);
    const reduced = coords.slice(0, targetDim);

    // Preserve magnitude scaling
    const originalMag = vector.magnitude();
    const reducedVector = new DimensionalVector(reduced);
    const scaleFactor = originalMag / reducedVector.magnitude();

    return reduced.map((c) => c * scaleFactor);
  }

  /**
   * Calculate preserved variance after dimensionality reduction
   * @private
   * @param {Array<number>} original - Original coordinates
   * @param {Array<number>} reduced - Reduced coordinates
   * @returns {number} Preserved variance ratio
   */
  _calculatePreservedVariance(original, reduced) {
    const originalVar = this._calculateVariance(original);
    const reducedVar = this._calculateVariance(reduced);
    return reducedVar / originalVar;
  }

  /**
   * Calculate variance of coordinates
   * @private
   * @param {Array<number>} coords - Coordinates
   * @returns {number} Variance
   */
  _calculateVariance(coords) {
    const mean = coords.reduce((sum, c) => sum + c, 0) / coords.length;
    const squaredDiffs = coords.map((c) => Math.pow(c - mean, 2));
    return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / coords.length;
  }

  /**
   * Extract coordinates from state
   * @private
   * @param {Object} state - State object
   * @returns {Array<number>} Coordinates
   */
  _extractCoordinates(state) {
    if (state.coordinates) return state.coordinates;
    if (state.position) return state.position;

    // Generate coordinates from state properties
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(state))
      .digest();

    return Array.from(hash)
      .slice(0, this._getStateDimension(state))
      .map((b) => b / 255);
  }

  /**
   * Get state dimension
   * @private
   * @param {Object} state - State object
   * @returns {number} State dimension
   */
  _getStateDimension(state) {
    if (state.dimensions) return state.dimensions;
    if (state.coordinates) return state.coordinates.length;
    if (state.position) return state.position.length;
    return this.options.minDimensions;
  }

  /**
   * Calculate basis hash
   * @private
   * @param {Array<DimensionalVector>} basis - Basis vectors
   * @returns {string} Hash of basis
   */
  _calculateBasisHash(basis) {
    const hash = crypto.createHash("sha256");
    for (const vector of basis) {
      hash.update(vector.components.join(","));
    }
    return hash.digest("hex");
  }

  /**
   * Calculate mapping quality
   * @private
   * @param {Object} state - Original state
   * @param {number} targetDim - Target dimension
   * @returns {number} Quality metric between 0 and 1
   */
  _calculateMappingQuality(state, targetDim) {
    const sourceDim = this._getStateDimension(state);
    const dimRatio =
      Math.min(sourceDim, targetDim) / Math.max(sourceDim, targetDim);
    return dimRatio * this.options.projectionQuality;
  }

  /**
   * Calculate structural similarity between states
   * @private
   * @param {Object} state1 - First state
   * @param {Object} state2 - Second state
   * @returns {number} Similarity score between 0 and 1
   */
  _calculateStructuralSimilarity(state1, state2) {
    const coords1 = this._extractCoordinates(state1);
    const coords2 = this._extractCoordinates(state2);
    const minDim = Math.min(coords1.length, coords2.length);

    let similarity = 0;
    for (let i = 0; i < minDim; i++) {
      similarity += 1 - Math.abs(coords1[i] - coords2[i]);
    }

    return similarity / minDim;
  }

  /**
   * Calculate topology preservation between states
   * @private
   * @param {Object} state1 - First state
   * @param {Object} state2 - Second state
   * @returns {Promise<number>} Topology preservation score
   */
  async _calculateTopologyPreservation(state1, state2) {
    const dim1 = this._getStateDimension(state1);
    const dim2 = this._getStateDimension(state2);

    // Transform to common dimension
    const commonDim = Math.min(dim1, dim2);
    const transformed1 = await this.transformDimensions(state1, commonDim);
    const transformed2 = await this.transformDimensions(state2, commonDim);

    // Calculate topological features preservation
    const coords1 = transformed1.coordinates;
    const coords2 = transformed2.coordinates;

    let preservation = 0;
    const n = coords1.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const dist1 = Math.abs(coords1[i] - coords1[j]);
        const dist2 = Math.abs(coords2[i] - coords2[j]);
        preservation += 1 - Math.abs(dist1 - dist2) / Math.max(dist1, dist2);
      }
    }

    return preservation / ((n * (n - 1)) / 2);
  }

  /**
   * Cache dimensional mapping
   * @private
   * @param {Object} sourceState - Source state
   * @param {Object} mappedState - Mapped state
   */
  _cacheDimensionalMapping(sourceState, mappedState) {
    const key = `${this._getStateDimension(sourceState)}-${
      mappedState.dimensions
    }`;
    if (!this.dimensionalCache.has(key)) {
      this.dimensionalCache.set(key, new Map());
    }

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(sourceState))
      .digest("hex");

    this.dimensionalCache.get(key).set(hash, mappedState);
  }

  /**
   * Get cached dimensional mapping
   * @private
   * @param {Object} sourceState - Source state
   * @param {number} targetDim - Target dimension
   * @returns {Object|null} Cached mapping or null
   */
  _getCachedMapping(sourceState, targetDim) {
    const key = `${this._getStateDimension(sourceState)}-${targetDim}`;
    const cache = this.dimensionalCache.get(key);
    if (!cache) return null;

    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(sourceState))
      .digest("hex");

    return cache.get(hash) || null;
  }
}

module.exports = DimensionalMapping;
