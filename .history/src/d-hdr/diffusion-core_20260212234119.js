/**
 * D-HDR Diffusion Integration Core Engine
 * Phase 10 Intelligence Layer - Generative Consequence Simulation
 *
 * Bridges diffusion models with ORACLE-HDR consequence prediction
 * - Consequence-aware text embedding and sampling
 * - Guided diffusion for decision outcome generation
 * - Consequence-space navigation and interpolation
 * - Integration with quantum and oracle prediction engines
 */

import { EventEmitter } from "events";
import pino from "pino";

const logger = pino({
  name: "D-HDR-Diffusion",
  level: process.env.LOG_LEVEL || "info",
});

/**
 * ConsequenceEmbedding: Vector representation of outcome in consequence space
 * Maps decision outcomes to high-dimensional space for diffusion modeling
 */
class ConsequenceEmbedding {
  constructor(outcome, dimensions = 768) {
    this.outcome = outcome;
    this.dimensions = dimensions;

    // Initialize embedding with deterministic hash-based values
    this.vector = this._hashToVector(
      outcome.action + JSON.stringify(outcome.metadata || {}),
    );

    // Impact tensor: breakdown of component effects (economic, social, environmental)
    this.impactComponents = {
      economic: outcome.economicImpact || 0,
      social: outcome.socialImpact || 0,
      environmental: outcome.environmentalImpact || 0,
      temporal: outcome.temporalImpact || 0,
    };

    // Confidence-weighted embedding (higher confidence = stronger signal)
    this.confidence = outcome.confidence || 0.5;
    this.weights = this._computeWeights();

    // Temporal trajectory: how outcome effects propagate over time
    this.trajectory = this._computeTrajectory();
  }

  _hashToVector(str, dims = 768) {
    // Deterministic hash-based vector generation
    const hash = str
      .split("")
      .reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0);
    const vector = new Array(dims);

    const rng = this._seededRandom(hash);
    for (let i = 0; i < dims; i++) {
      vector[i] = rng() * 2 - 1; // Range [-1, 1]
    }

    return new Float32Array(vector);
  }

  _seededRandom(seed) {
    // Linear congruential generator for reproducible random numbers
    let state = seed;
    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }

  _computeWeights() {
    // Confidence-weighted distribution across impact components
    const total =
      Math.abs(this.impactComponents.economic) +
      Math.abs(this.impactComponents.social) +
      Math.abs(this.impactComponents.environmental) +
      Math.abs(this.impactComponents.temporal);

    if (total === 0) {
      return {
        economic: 0.25,
        social: 0.25,
        environmental: 0.25,
        temporal: 0.25,
      };
    }

    return {
      economic:
        (Math.abs(this.impactComponents.economic) / total) * this.confidence,
      social:
        (Math.abs(this.impactComponents.social) / total) * this.confidence,
      environmental:
        (Math.abs(this.impactComponents.environmental) / total) *
        this.confidence,
      temporal:
        (Math.abs(this.impactComponents.temporal) / total) * this.confidence,
    };
  }

  _computeTrajectory() {
    // Generate temporal decay curve: immediate, short-term, long-term effects
    return {
      immediate:
        (this.impactComponents.economic + this.impactComponents.social) * 0.8,
      shortTerm:
        (this.impactComponents.social + this.impactComponents.environmental) *
        0.6,
      longTerm:
        (this.impactComponents.environmental + this.impactComponents.temporal) *
        0.4,
    };
  }

  // Cosine similarity with another embedding (for consequence interpolation)
  cosineSimilarity(other) {
    let dotProduct = 0;
    let magnitudeSelf = 0;
    let magnitudeOther = 0;

    for (let i = 0; i < this.vector.length; i++) {
      dotProduct += this.vector[i] * other.vector[i];
      magnitudeSelf += this.vector[i] * this.vector[i];
      magnitudeOther += other.vector[i] * other.vector[i];
    }

    return (
      dotProduct / (Math.sqrt(magnitudeSelf) * Math.sqrt(magnitudeOther) + 1e-8)
    );
  }

  // Interpolate between two consequences (linear blend in embedding space)
  lerp(other, t) {
    const blended = new Float32Array(this.dimensions);
    for (let i = 0; i < this.dimensions; i++) {
      blended[i] = this.vector[i] * (1 - t) + other.vector[i] * t;
    }
    return blended;
  }
}

/**
 * DiffusionScheduler: Controls noise schedule for diffusion process
 * Linear, cosine, and custom schedules for iterative consequence refinement
 */
class DiffusionScheduler {
  constructor(timesteps = 100, scheduleType = "cosine") {
    this.timesteps = timesteps;
    this.scheduleType = scheduleType;
    this.alphas = this._buildSchedule();
  }

  _buildSchedule() {
    const alphas = new Float32Array(this.timesteps);

    if (this.scheduleType === "linear") {
      for (let t = 0; t < this.timesteps; t++) {
        const progress = t / this.timesteps;
        alphas[t] = 1 - progress; // Linear decay from 1 to 0
      }
    } else if (this.scheduleType === "cosine") {
      // Cosine schedule inspired by https://arxiv.org/abs/2102.09672
      for (let t = 0; t < this.timesteps; t++) {
        const progress = t / this.timesteps;
        alphas[t] = Math.cos((((progress + 0.008) / 1.008) * Math.PI) / 2) ** 2;
      }
    }

    return alphas;
  }

  getNoiseLevel(t) {
    // Noise level at timestep t
    const alpha = this.alphas[Math.floor(t)];
    return Math.sqrt(1 - alpha * alpha); // sqrt(1 - alpha^2)
  }

  getAlpha(t) {
    return this.alphas[Math.floor(t)];
  }
}

/**
 * ConsequenceGenerativeModel: Diffusion-based consequence generation
 * Iteratively refines consequence embeddings from noise toward goal state
 */
class ConsequenceGenerativeModel {
  constructor(config = {}) {
    this.timesteps = config.timesteps || 50;
    this.scheduler = new DiffusionScheduler(
      this.timesteps,
      config.scheduleType || "cosine",
    );
    this.embeddingDimensions = config.embeddingDimensions || 768;

    // Guidance scale: higher = more adherence to conditioning signal
    this.guidanceScale = config.guidanceScale || 7.5;

    // Consequence memory: store generated outcomes for ensemble methods
    this.consequenceMemory = [];
    this.maxMemorySize = config.maxMemorySize || 1000;
  }

  /**
   * Generate consequence by diffusion from noise toward decision context
   * @param {string} decision - Decision description
   * @param {object} context - Decision context (actors, constraints, resources)
   * @param {number} temperature - Sampling temperature [0, 2]
   * @returns {object} Generated consequence with trajectory
   */
  generate(decision, context = {}, temperature = 1.0) {
    const startTime = Date.now();

    // Initialize noise embedding
    let current = this._sampleNoise();

    // Goal embedding: where we want to end up
    const goal = new ConsequenceEmbedding({
      action: decision,
      economicImpact: context.economicTarget || 0,
      socialImpact: context.socialTarget || 0,
      environmentalImpact: context.environmentalTarget || 0,
      temporalImpact: context.temporalTarget || 0,
      confidence: 0.9,
      metadata: context,
    });

    // Trace: record diffusion process
    const diffusionTrace = [
      {
        step: 0,
        embedding: current.vector,
        noise: 1.0,
        similarity: 0,
      },
    ];

    // Iterative denoising (from noise toward goal)
    for (let t = this.timesteps - 1; t >= 0; t--) {
      const alpha = this.scheduler.getAlpha(t / this.timesteps);
      const noise = this.scheduler.getNoiseLevel(t / this.timesteps);

      // Guidance: nudge toward goal while maintaining diversity
      const guidance = this._computeGuidance(current, goal, this.guidanceScale);

      // Denoise step: combine model prediction with guidance
      const denoised = this._denoiseStep(
        current,
        guidance,
        alpha,
        noise,
        temperature,
      );

      // Update trajectory
      const similarity = current.cosineSimilarity(goal);
      diffusionTrace.push({
        step: this.timesteps - t,
        embedding: denoised.vector,
        noise: noise,
        similarity: similarity,
      });

      current = new ConsequenceEmbedding(denoised);
    }

    const consequence = {
      decision: decision,
      generation_method: "diffusion",
      timesteps: this.timesteps,
      predicted_outcome: this._embeddingToOutcome(current),
      diffusion_trace: diffusionTrace,
      final_similarity_to_goal: current.cosineSimilarity(goal),
      generation_time_ms: Date.now() - startTime,
      guidance_scale: this.guidanceScale,
      temperature: temperature,
      context: context,
    };

    // Store in memory for ensemble methods
    this._storeConsequence(consequence);

    return consequence;
  }

  /**
   * Generate multiple consequence variants via ensemble
   * Useful for exploring outcome space and decision robustness
   */
  generateEnsemble(decision, context = {}, numVariants = 5) {
    const ensemble = [];

    for (let i = 0; i < numVariants; i++) {
      const temperature = 0.5 + (i / numVariants) * 1.0; // Vary temperature across ensemble
      const consequence = this.generate(decision, context, temperature);
      consequence.variant_index = i;
      ensemble.push(consequence);
    }

    return {
      decision: decision,
      ensemble: ensemble,
      average_similarity:
        ensemble.reduce((sum, c) => sum + c.final_similarity_to_goal, 0) /
        ensemble.length,
      generated_at: new Date().toISOString(),
      context: context,
    };
  }

  /**
   * Interpolate between two consequences in embedding space
   * Useful for understanding outcome transitions
   */
  interpolate(consequence1, consequence2, steps = 5) {
    const emb1 = new ConsequenceEmbedding(consequence1.predicted_outcome);
    const emb2 = new ConsequenceEmbedding(consequence2.predicted_outcome);

    const interpolated = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const blended = emb1.lerp(emb2, t);

      interpolated.push({
        step: i,
        t_value: t,
        interpolated_outcome: this._vectorToOutcome(blended),
        similarity_to_start: emb1.cosineSimilarity(
          new ConsequenceEmbedding({ vector: blended }),
        ),
        similarity_to_end: new ConsequenceEmbedding({
          vector: blended,
        }).cosineSimilarity(emb2),
      });
    }

    return {
      from: consequence1.decision,
      to: consequence2.decision,
      interpolation_steps: interpolated,
      total_steps: steps,
    };
  }

  _sampleNoise() {
    // Random isotropic Gaussian noise
    return new ConsequenceEmbedding({
      action: "noise",
      economicImpact: (Math.random() - 0.5) * 2,
      socialImpact: (Math.random() - 0.5) * 2,
      environmentalImpact: (Math.random() - 0.5) * 2,
      temporalImpact: (Math.random() - 0.5) * 2,
      confidence: 0.1,
    });
  }

  _computeGuidance(current, goal, scale) {
    // Compute gradient toward goal in embedding space
    const similarity = current.cosineSimilarity(goal);

    // Guidance direction: weighted combination of goal impacts
    return {
      economicGuidance:
        goal.impactComponents.economic * scale * (1 - similarity),
      socialGuidance: goal.impactComponents.social * scale * (1 - similarity),
      environmentalGuidance:
        goal.impactComponents.environmental * scale * (1 - similarity),
      temporalGuidance:
        goal.impactComponents.temporal * scale * (1 - similarity),
    };
  }

  _denoiseStep(current, guidance, alpha, noise, temperature) {
    // Modified outcome based on denoising and guidance
    const scaledEconomic =
      current.impactComponents.economic * alpha +
      guidance.economicGuidance * noise;
    const scaledSocial =
      current.impactComponents.social * alpha + guidance.socialGuidance * noise;
    const scaledEnv =
      current.impactComponents.environmental * alpha +
      guidance.environmentalGuidance * noise;
    const scaledTemporal =
      current.impactComponents.temporal * alpha +
      guidance.temporalGuidance * noise;

    // Apply temperature scaling for diversity
    return {
      action: current.outcome.action,
      economicImpact: scaledEconomic * temperature,
      socialImpact: scaledSocial * temperature,
      environmentalImpact: scaledEnv * temperature,
      temporalImpact: scaledTemporal * temperature,
      confidence: Math.min(alpha, 0.95),
      metadata: current.outcome.metadata,
    };
  }

  _embeddingToOutcome(embedding) {
    return {
      action: embedding.outcome.action,
      economicImpact: embedding.impactComponents.economic,
      socialImpact: embedding.impactComponents.social,
      environmentalImpact: embedding.impactComponents.environmental,
      temporalImpact: embedding.impactComponents.temporal,
      confidence: embedding.confidence,
      impactProfile: embedding.impactComponents,
      temporalTrajectory: embedding.trajectory,
      metadata: embedding.outcome.metadata,
    };
  }

  _vectorToOutcome(vector) {
    // Reconstruct outcome from embedding vector
    // Uses first 4 dimensions as impact components
    return {
      from_embedding: true,
      economicImpact: vector[0],
      socialImpact: vector[1],
      environmentalImpact: vector[2],
      temporalImpact: vector[3],
      confidence: 0.5,
    };
  }

  _storeConsequence(consequence) {
    this.consequenceMemory.push(consequence);
    if (this.consequenceMemory.length > this.maxMemorySize) {
      this.consequenceMemory.shift(); // FIFO eviction
    }
  }

  getMemoryStats() {
    return {
      stored_consequences: this.consequenceMemory.length,
      max_memory_size: this.maxMemorySize,
      average_similarity:
        this.consequenceMemory.length > 0
          ? this.consequenceMemory.reduce(
              (sum, c) => sum + c.final_similarity_to_goal,
              0,
            ) / this.consequenceMemory.length
          : 0,
    };
  }
}

/**
 * D-HDR orchestrator - integrates diffusion with ORACLE and Q-HDR predictions
 */
class DiffusionHDR extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      timesteps: config.timesteps || 50,
      scheduleType: config.scheduleType || "cosine",
      guidanceScale: config.guidanceScale || 7.5,
      embeddingDimensions: config.embeddingDimensions || 768,
      memoryIntegration: config.memoryIntegration !== false,
      quantumIntegration: config.quantumIntegration !== false,
      ...config,
    };

    this.model = new ConsequenceGenerativeModel(this.config);
    this.generatedConsequences = 0;
    this.ensemblesGenerated = 0;
    this.interpolations = 0;

    logger.info("D-HDR Diffusion initialized", { config: this.config });
  }

  /**
   * Generate consequences with optional ORACLE guidance
   * @param {string} decision - Decision to explore
   * @param {object} context - Context (actors, constraints, resources)
   * @param {object} oracleInsights - Optional ORACLE predictions for guidance
   * @returns Generated consequence with diffusion trajectory
   */
  predictOutcome(decision, context = {}, oracleInsights = null) {
    // Enhance context with ORACLE insights if available
    const enhancedContext = oracleInsights
      ? {
          ...context,
          economicTarget: oracleInsights.prediction?.economicImpact || 0,
          socialTarget: oracleInsights.prediction?.socialImpact || 0,
          environmentalTarget:
            oracleInsights.prediction?.environmentalImpact || 0,
          temporalTarget: oracleInsights.prediction?.temporalImpact || 0,
        }
      : context;

    const consequence = this.model.generate(decision, enhancedContext);
    this.generatedConsequences++;

    this.emit("consequence:generated", {
      decision: decision,
      consequence: consequence,
      guided_by_oracle: !!oracleInsights,
      timestamp: new Date().toISOString(),
    });

    return consequence;
  }

  /**
   * Generate ensemble of outcomes to explore decision space
   * @param {string} decision - Decision to explore
   * @param {object} context - Context
   * @param {number} numVariants - Number of variants to generate
   * @returns Ensemble with variants and aggregate statistics
   */
  exploreDecisionSpace(decision, context = {}, numVariants = 5) {
    const ensemble = this.model.generateEnsemble(
      decision,
      context,
      numVariants,
    );
    this.ensemblesGenerated++;

    this.emit("ensemble:generated", {
      decision: decision,
      num_variants: numVariants,
      average_similarity: ensemble.average_similarity,
      timestamp: new Date().toISOString(),
    });

    return ensemble;
  }

  /**
   * Interpolate between two decision outcomes
   * Useful for understanding transition paths
   */
  transitionPath(fromDecision, toDecision, fromOutcome, toOutcome, steps = 5) {
    const interpolation = this.model.interpolate(fromOutcome, toOutcome, steps);
    this.interpolations++;

    this.emit("transition:computed", {
      from: fromDecision,
      to: toDecision,
      steps: steps,
      timestamp: new Date().toISOString(),
    });

    return interpolation;
  }

  /**
   * Get system metrics
   */
  getMetrics() {
    return {
      generatedConsequences: this.generatedConsequences,
      ensemblesGenerated: this.ensemblesGenerated,
      interpolations: this.interpolations,
      memoryStats: this.model.getMemoryStats(),
      config: this.config,
    };
  }
}

module.exports = {
  DiffusionHDR,
  ConsequenceGenerativeModel,
  ConsequenceEmbedding,
  DiffusionScheduler,
};
