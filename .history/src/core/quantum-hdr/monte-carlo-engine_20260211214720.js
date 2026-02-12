/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Monte Carlo Simulation Engine for Quantum-HDR
 * Phase 9.5 — Probabilistic pathway exploration with variance reduction,
 * convergence analysis, and MCTS-enhanced decision-making.
 */

import { createHash, randomBytes } from "crypto";

// ── Sampling strategy enum ─────────────────────────────────────────────
export const SamplingStrategy = Object.freeze({
  UNIFORM: "uniform",
  IMPORTANCE: "importance",
  STRATIFIED: "stratified",
  ANTITHETIC: "antithetic",
  LATIN_HYPERCUBE: "latin_hypercube",
  QUASI_RANDOM: "quasi_random", // Halton sequence
});

// ── Convergence criteria ────────────────────────────────────────────────
export const ConvergenceCriterion = Object.freeze({
  VARIANCE: "variance",
  CONFIDENCE_INTERVAL: "confidence_interval",
  EFFECTIVE_SAMPLE_SIZE: "effective_sample_size",
});

// ── Default configuration ───────────────────────────────────────────────
const DEFAULT_CONFIG = {
  maxSamples: 100_000,
  batchSize: 1_000,
  convergenceThreshold: 0.001,
  confidenceLevel: 0.95,
  burnIn: 500,
  thinning: 1,
  seed: null,
  strategy: SamplingStrategy.IMPORTANCE,
  criterion: ConvergenceCriterion.CONFIDENCE_INTERVAL,
  mctsExplorationConstant: Math.SQRT2,
  mctsSimulationsPerNode: 50,
  mctsMaxDepth: 20,
};

// ── Z-scores for common confidence levels ───────────────────────────────
const Z_SCORES = { 0.9: 1.645, 0.95: 1.96, 0.99: 2.576 };

/**
 * Monte Carlo Simulation Engine
 *
 * Provides configurable Monte Carlo sampling over quantum probability
 * spaces with multiple variance-reduction techniques, real-time
 * convergence monitoring, and an MCTS layer for pathway exploration.
 */
class MonteCarloEngine {
  /**
   * @param {Object} config - Engine configuration
   */
  constructor(config = {}) {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    this.maxSamples = cfg.maxSamples;
    this.batchSize = cfg.batchSize;
    this.convergenceThreshold = cfg.convergenceThreshold;
    this.confidenceLevel = cfg.confidenceLevel;
    this.burnIn = cfg.burnIn;
    this.thinning = cfg.thinning;
    this.strategy = cfg.strategy;
    this.criterion = cfg.criterion;

    // MCTS parameters
    this.mctsC = cfg.mctsExplorationConstant;
    this.mctsSimsPerNode = cfg.mctsSimulationsPerNode;
    this.mctsMaxDepth = cfg.mctsMaxDepth;

    // Deterministic PRNG seed (optional)
    this._seed = cfg.seed;
    this._rng = this._createRNG(cfg.seed);

    // Runtime statistics
    this._stats = this._freshStats();
  }

  // ======================================================================
  //   PUBLIC API
  // ======================================================================

  /**
   * Run a full Monte Carlo simulation over a quantum probability space.
   *
   * @param {Object}   probSpace       – Quantum probability space from ProbabilityStateManager
   * @param {Function} [payoff]        – Optional payoff function  (sample → number)
   * @param {Object}   [opts]          – Per-run option overrides
   * @returns {Promise<Object>} Simulation results
   */
  async simulate(probSpace, payoff, opts = {}) {
    const maxN = opts.maxSamples ?? this.maxSamples;
    const batch = opts.batchSize ?? this.batchSize;
    const strategy = opts.strategy ?? this.strategy;
    const criterion = opts.criterion ?? this.criterion;

    this._stats = this._freshStats();

    const distribution = this._extractDistribution(probSpace);
    const payoffFn =
      payoff ?? ((sample) => this._defaultPayoff(sample, distribution));

    let allSamples = [];
    let converged = false;

    for (let drawn = 0; drawn < maxN && !converged; drawn += batch) {
      const n = Math.min(batch, maxN - drawn);
      const rawSamples = this._drawSamples(distribution, n, strategy);

      // Apply burn-in only on the first batch
      const samples =
        drawn === 0 ? rawSamples.slice(this.burnIn) : rawSamples;

      // Thinning
      const thinned =
        this.thinning > 1
          ? samples.filter((_, i) => i % this.thinning === 0)
          : samples;

      // Evaluate payoff
      const evaluated = thinned.map((s) => ({
        sample: s,
        value: payoffFn(s),
        weight: s._weight ?? 1.0,
      }));

      allSamples.push(...evaluated);

      // Convergence check
      converged = this._checkConvergence(allSamples, criterion);
      this._stats.batchesRun++;
    }

    return this._buildResult(allSamples, distribution, converged);
  }

  /**
   * Monte Carlo pathway risk assessment.
   *
   * Given an array of quantum pathways (each with `.probability` and
   * `.confidence`), estimates the risk profile via simulation.
   *
   * @param {Array}  pathways – Pathway objects with probability/confidence
   * @param {number} [n]      – Sample count per pathway
   * @returns {Promise<Object>} Risk assessment results
   */
  async assessRisk(pathways, n = 10_000) {
    const results = [];

    for (const pathway of pathways) {
      const prob = pathway.probability ?? 0.5;
      const conf = pathway.confidence ?? 0.5;

      // Build a Beta-like distribution around (prob, conf)
      const alpha = prob * conf * 20 + 1;
      const beta = (1 - prob) * conf * 20 + 1;

      const samples = Array.from({ length: n }, () =>
        this._betaSample(alpha, beta)
      );

      const mean = samples.reduce((s, v) => s + v, 0) / n;
      const variance =
        samples.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
      const sorted = [...samples].sort((a, b) => a - b);

      results.push({
        pathwayId: pathway.id ?? pathway.pathwayId,
        meanProbability: mean,
        stdDev: Math.sqrt(variance),
        var95: sorted[Math.floor(n * 0.05)], // Value at Risk 5%
        cvar95:
          sorted.slice(0, Math.floor(n * 0.05)).reduce((s, v) => s + v, 0) /
          Math.floor(n * 0.05), // Conditional VaR
        percentile25: sorted[Math.floor(n * 0.25)],
        median: sorted[Math.floor(n * 0.5)],
        percentile75: sorted[Math.floor(n * 0.75)],
        worstCase: sorted[0],
        bestCase: sorted[n - 1],
        riskScore: 1 - mean + Math.sqrt(variance), // higher = riskier
      });
    }

    return {
      pathwayRisks: results,
      overallRisk:
        results.reduce((s, r) => s + r.riskScore, 0) / results.length,
      safestPathway: results.reduce((best, r) =>
        r.riskScore < best.riskScore ? r : best
      ),
      riskiestPathway: results.reduce((worst, r) =>
        r.riskScore > worst.riskScore ? r : worst
      ),
      timestamp: Date.now(),
    };
  }

  /**
   * Monte Carlo Tree Search over decision pathways.
   *
   * Builds a search tree from `rootState`, using `expandFn` to generate
   * children and `rolloutFn` to evaluate leaf nodes.
   *
   * @param {Object}   rootState   – Root state (from ProbabilityStateManager)
   * @param {Function} expandFn    – (state) → Array<{state, action, prior}>
   * @param {Function} rolloutFn   – (state) → number (reward ∈ [0,1])
   * @param {Object}   [opts]      – Overrides for simulations count / depth
   * @returns {Promise<Object>} MCTS results with best action sequence
   */
  async mcts(rootState, expandFn, rolloutFn, opts = {}) {
    const totalSims = opts.simulations ?? this.mctsSimsPerNode * 20;
    const maxDepth = opts.maxDepth ?? this.mctsMaxDepth;
    const C = opts.explorationConstant ?? this.mctsC;

    const root = this._createMCTSNode(rootState, null, null);

    for (let i = 0; i < totalSims; i++) {
      // 1. Select
      let node = this._mctsSelect(root, C);

      // 2. Expand (if not terminal and under depth limit)
      if (node.depth < maxDepth && !node.terminal) {
        const children = expandFn(node.state);
        if (children && children.length > 0) {
          node = this._mctsExpand(node, children);
        } else {
          node.terminal = true;
        }
      }

      // 3. Rollout
      const reward = rolloutFn(node.state);

      // 4. Backpropagate
      this._mctsBackprop(node, reward);
    }

    // Extract best action sequence
    const bestSequence = this._mctsExtractBestPath(root);

    return {
      bestAction: bestSequence[0]?.action ?? null,
      bestSequence,
      rootVisits: root.visits,
      rootValue: root.value / Math.max(root.visits, 1),
      children: root.children.map((c) => ({
        action: c.action,
        visits: c.visits,
        value: c.value / Math.max(c.visits, 1),
        ucb: this._ucb1(c, root.visits, C),
      })),
      totalSimulations: totalSims,
    };
  }

  /**
   * Sensitivity analysis via Monte Carlo perturbation.
   *
   * Perturbs each input parameter independently and measures
   * the output variance contributed by each, returning a
   * Sobol-like first-order sensitivity index.
   *
   * @param {Object}   probSpace – Quantum probability space
   * @param {Function} payoff    – Payoff function
   * @param {number}   [n]       – Samples per parameter
   * @returns {Promise<Object>} Sensitivity indices
   */
  async sensitivityAnalysis(probSpace, payoff, n = 5_000) {
    const distribution = this._extractDistribution(probSpace);
    const keys = distribution.map((d) => d.key);

    // Baseline variance
    const baselineSamples = this._drawSamples(
      distribution,
      n,
      SamplingStrategy.LATIN_HYPERCUBE
    );
    const baselineValues = baselineSamples.map(payoff);
    const baselineVar = this._variance(baselineValues);

    const sensitivities = {};

    for (const key of keys) {
      // Fix all other params, vary only `key`
      const fixedSamples = this._drawSamples(
        distribution,
        n,
        SamplingStrategy.UNIFORM
      );
      const variedValues = fixedSamples.map((sample) => {
        const perturbed = { ...sample };
        perturbed[key] = this._rng(); // re-randomize only this key
        return payoff(perturbed);
      });

      const variedVar = this._variance(variedValues);
      sensitivities[key] = {
        firstOrderIndex:
          baselineVar > 0 ? 1 - variedVar / baselineVar : 0,
        varianceContribution: Math.abs(baselineVar - variedVar),
      };
    }

    // Normalize indices
    const totalIndex = Object.values(sensitivities).reduce(
      (s, v) => s + Math.max(0, v.firstOrderIndex),
      0
    );
    for (const key of keys) {
      sensitivities[key].normalizedIndex =
        totalIndex > 0
          ? Math.max(0, sensitivities[key].firstOrderIndex) / totalIndex
          : 0;
    }

    return {
      sensitivities,
      baselineVariance: baselineVar,
      mostSensitive: keys.reduce((best, k) =>
        (sensitivities[k].normalizedIndex ?? 0) >
        (sensitivities[best].normalizedIndex ?? 0)
          ? k
          : best
      ),
      samplesPerParam: n,
    };
  }

  /**
   * Retrieve cumulative engine statistics.
   * @returns {Object} Stats
   */
  getStats() {
    return { ...this._stats };
  }

  /**
   * Reset engine state.
   */
  reset() {
    this._stats = this._freshStats();
    this._rng = this._createRNG(this._seed);
  }

  // ======================================================================
  //   SAMPLING METHODS
  // ======================================================================

  /**
   * Draw N samples from the distribution using the selected strategy.
   * @private
   */
  _drawSamples(distribution, n, strategy) {
    switch (strategy) {
      case SamplingStrategy.IMPORTANCE:
        return this._importanceSampling(distribution, n);
      case SamplingStrategy.STRATIFIED:
        return this._stratifiedSampling(distribution, n);
      case SamplingStrategy.ANTITHETIC:
        return this._antitheticSampling(distribution, n);
      case SamplingStrategy.LATIN_HYPERCUBE:
        return this._latinHypercubeSampling(distribution, n);
      case SamplingStrategy.QUASI_RANDOM:
        return this._quasiRandomSampling(distribution, n);
      case SamplingStrategy.UNIFORM:
      default:
        return this._uniformSampling(distribution, n);
    }
  }

  /** Uniform sampling — each dimension sampled independently */
  _uniformSampling(distribution, n) {
    return Array.from({ length: n }, () => {
      const sample = {};
      for (const dim of distribution) {
        sample[dim.key] = this._rng();
      }
      return sample;
    });
  }

  /**
   * Importance sampling — weight samples toward high-probability regions.
   * Uses the quantum probability as the importance weight.
   */
  _importanceSampling(distribution, n) {
    const totalProb = distribution.reduce((s, d) => s + d.probability, 0);
    const normalized = distribution.map((d) => ({
      ...d,
      normProb: d.probability / totalProb,
    }));

    return Array.from({ length: n }, () => {
      const sample = {};
      let weight = 1.0;

      for (const dim of normalized) {
        // Sample from importance distribution centred on dim.probability
        const u = this._rng();
        const shifted =
          dim.normProb + (u - 0.5) * (1 - dim.normProb) * 0.5;
        sample[dim.key] = Math.max(0, Math.min(1, shifted));

        // Importance weight = target / proposal
        const target = dim.normProb;
        const proposal =
          shifted > 0 && shifted < 1 ? 1.0 : Number.EPSILON;
        weight *= target / proposal;
      }

      sample._weight = weight;
      return sample;
    });
  }

  /**
   * Stratified sampling — divide [0,1] into strata, sample within each.
   */
  _stratifiedSampling(distribution, n) {
    const strata = Math.ceil(Math.sqrt(n));
    const samplesPerStratum = Math.ceil(n / strata);
    const samples = [];

    for (let s = 0; s < strata && samples.length < n; s++) {
      const lo = s / strata;
      const hi = (s + 1) / strata;

      for (
        let j = 0;
        j < samplesPerStratum && samples.length < n;
        j++
      ) {
        const sample = {};
        for (const dim of distribution) {
          sample[dim.key] = lo + this._rng() * (hi - lo);
        }
        samples.push(sample);
      }
    }

    return samples;
  }

  /**
   * Antithetic variates — for every sample u, also generate 1-u.
   * Halves variance for monotonic payoffs.
   */
  _antitheticSampling(distribution, n) {
    const half = Math.ceil(n / 2);
    const samples = [];

    for (let i = 0; i < half; i++) {
      const sample = {};
      const anti = {};

      for (const dim of distribution) {
        const u = this._rng();
        sample[dim.key] = u;
        anti[dim.key] = 1 - u;
      }

      samples.push(sample, anti);
    }

    return samples.slice(0, n);
  }

  /**
   * Latin Hypercube Sampling — ensure uniform marginal coverage.
   */
  _latinHypercubeSampling(distribution, n) {
    const d = distribution.length;
    const intervals = Array.from({ length: d }, () =>
      this._shuffleArray(Array.from({ length: n }, (_, i) => i))
    );

    return Array.from({ length: n }, (_, i) => {
      const sample = {};
      distribution.forEach((dim, j) => {
        sample[dim.key] =
          (intervals[j][i] + this._rng()) / n;
      });
      return sample;
    });
  }

  /**
   * Quasi-random sampling — Halton sequence for low-discrepancy coverage.
   */
  _quasiRandomSampling(distribution, n) {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];

    return Array.from({ length: n }, (_, i) => {
      const sample = {};
      distribution.forEach((dim, j) => {
        const base = primes[j % primes.length];
        sample[dim.key] = this._halton(i + 1, base);
      });
      return sample;
    });
  }

  // ======================================================================
  //   MCTS INTERNALS
  // ======================================================================

  _createMCTSNode(state, parent, action) {
    return {
      state,
      parent,
      action,
      children: [],
      visits: 0,
      value: 0,
      depth: parent ? parent.depth + 1 : 0,
      terminal: false,
    };
  }

  /** UCB1 selection policy */
  _mctsSelect(node, C) {
    while (node.children.length > 0) {
      // Select child with highest UCB1
      node = node.children.reduce((best, c) => {
        const ucb = this._ucb1(c, node.visits, C);
        return ucb > this._ucb1(best, node.visits, C) ? c : best;
      });
    }
    return node;
  }

  _ucb1(node, parentVisits, C) {
    if (node.visits === 0) return Infinity;
    const exploit = node.value / node.visits;
    const explore = C * Math.sqrt(Math.log(parentVisits) / node.visits);
    return exploit + explore;
  }

  _mctsExpand(parent, children) {
    for (const child of children) {
      parent.children.push(
        this._createMCTSNode(child.state, parent, child.action)
      );
    }
    // Return a random unvisited child
    const unvisited = parent.children.filter((c) => c.visits === 0);
    return unvisited.length > 0
      ? unvisited[Math.floor(this._rng() * unvisited.length)]
      : parent.children[Math.floor(this._rng() * parent.children.length)];
  }

  _mctsBackprop(node, reward) {
    while (node) {
      node.visits++;
      node.value += reward;
      node = node.parent;
    }
  }

  _mctsExtractBestPath(root) {
    const path = [];
    let node = root;

    while (node.children.length > 0) {
      // Pick child with highest visit count (robust child selection)
      const best = node.children.reduce((b, c) =>
        c.visits > b.visits ? c : b
      );
      path.push({
        action: best.action,
        visits: best.visits,
        avgReward: best.value / Math.max(best.visits, 1),
      });
      node = best;
    }

    return path;
  }

  // ======================================================================
  //   CONVERGENCE & STATISTICS
  // ======================================================================

  _checkConvergence(evaluated, criterion) {
    if (evaluated.length < 100) return false;

    const values = evaluated.map((e) => e.value * (e.weight ?? 1.0));
    const n = values.length;
    const mean = values.reduce((s, v) => s + v, 0) / n;
    const variance =
      values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
    const stdErr = Math.sqrt(variance / n);

    switch (criterion) {
      case ConvergenceCriterion.VARIANCE:
        return variance < this.convergenceThreshold;

      case ConvergenceCriterion.CONFIDENCE_INTERVAL: {
        const z = Z_SCORES[this.confidenceLevel] ?? 1.96;
        const halfWidth = z * stdErr;
        return halfWidth < this.convergenceThreshold * Math.abs(mean || 1);
      }

      case ConvergenceCriterion.EFFECTIVE_SAMPLE_SIZE: {
        const weights = evaluated.map((e) => e.weight ?? 1.0);
        const sumW = weights.reduce((s, w) => s + w, 0);
        const sumW2 = weights.reduce((s, w) => s + w * w, 0);
        const ess = (sumW * sumW) / sumW2;
        return ess > n * 0.5; // ESS > 50% of actual sample count
      }

      default:
        return false;
    }
  }

  _buildResult(evaluated, distribution, converged) {
    const values = evaluated.map((e) => e.value * (e.weight ?? 1.0));
    const weights = evaluated.map((e) => e.weight ?? 1.0);
    const n = values.length;

    const sumW = weights.reduce((s, w) => s + w, 0);
    const weightedMean =
      evaluated.reduce((s, e) => s + e.value * (e.weight ?? 1.0), 0) / sumW;
    const mean = values.reduce((s, v) => s + v, 0) / n;
    const variance =
      values.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(n - 1, 1);
    const stdErr = Math.sqrt(variance / n);
    const z = Z_SCORES[this.confidenceLevel] ?? 1.96;

    const sorted = [...values].sort((a, b) => a - b);

    // Effective sample size
    const sumW2 = weights.reduce((s, w) => s + w * w, 0);
    const ess = (sumW * sumW) / sumW2;

    this._stats.totalSamples += n;
    this._stats.lastConverged = converged;

    return {
      mean: weightedMean,
      unweightedMean: mean,
      variance,
      stdError: stdErr,
      confidenceInterval: {
        level: this.confidenceLevel,
        lower: mean - z * stdErr,
        upper: mean + z * stdErr,
      },
      percentiles: {
        p5: sorted[Math.floor(n * 0.05)],
        p25: sorted[Math.floor(n * 0.25)],
        p50: sorted[Math.floor(n * 0.5)],
        p75: sorted[Math.floor(n * 0.75)],
        p95: sorted[Math.floor(n * 0.95)],
      },
      sampleCount: n,
      effectiveSampleSize: Math.round(ess),
      converged,
      batchesRun: this._stats.batchesRun,
      distribution: distribution.map((d) => ({
        key: d.key,
        probability: d.probability,
      })),
      signature: this._resultSignature(mean, variance, n),
      timestamp: Date.now(),
    };
  }

  // ======================================================================
  //   HELPERS
  // ======================================================================

  /**
   * Extract usable probability distribution from quantum probability space.
   * Works with ProbabilityStateManager output format.
   */
  _extractDistribution(probSpace) {
    // Handle ProbabilityStateManager currentState format
    if (probSpace?.quantum?.waveFunctions) {
      return probSpace.quantum.waveFunctions.map((wf) => ({
        key: wf.key,
        probability: wf.probability,
        amplitude: wf.amplitude,
        phase: wf.phase,
        coherence: wf.coherence ?? 1.0,
      }));
    }

    // Handle classical mapping format
    if (probSpace?.classical?.probabilities) {
      return Object.entries(probSpace.classical.probabilities).map(
        ([key, probability]) => ({
          key,
          probability,
          amplitude: Math.sqrt(probability),
          phase: 0,
          coherence: 1.0,
        })
      );
    }

    // Handle flat { key: probability } format
    if (typeof probSpace === "object" && !Array.isArray(probSpace)) {
      return Object.entries(probSpace).map(([key, val]) => ({
        key,
        probability: typeof val === "number" ? val : 0.5,
        amplitude: Math.sqrt(typeof val === "number" ? val : 0.5),
        phase: 0,
        coherence: 1.0,
      }));
    }

    return [{ key: "default", probability: 0.5, amplitude: 0.707, phase: 0, coherence: 1.0 }];
  }

  _defaultPayoff(sample, distribution) {
    // Compute expected overlap between sample values and target probabilities
    let score = 0;
    for (const dim of distribution) {
      const value = sample[dim.key] ?? 0;
      score += 1 - Math.abs(value - dim.probability);
    }
    return score / distribution.length;
  }

  /** Fast xorshift128+ PRNG — reproducible when seeded */
  _createRNG(seed) {
    if (seed == null) {
      // Fall back to crypto-seeded xorshift
      const buf = randomBytes(16);
      let s0 = BigInt(`0x${buf.subarray(0, 8).toString("hex")}`);
      let s1 = BigInt(`0x${buf.subarray(8, 16).toString("hex")}`);
      if (s0 === 0n) s0 = 1n;
      if (s1 === 0n) s1 = 1n;

      return () => {
        let a = s0;
        const b = s1;
        s0 = b;
        a ^= a << 23n;
        a ^= a >> 17n;
        a ^= b ^ (b >> 26n);
        s1 = a;
        return Number((a + b) & 0x1f_ffff_ffff_ffffn) / 0x20_0000_0000_0000;
      };
    }

    // Seeded variant
    const hash = createHash("sha256")
      .update(String(seed))
      .digest();
    let s0 = BigInt(`0x${hash.subarray(0, 8).toString("hex")}`);
    let s1 = BigInt(`0x${hash.subarray(8, 16).toString("hex")}`);
    if (s0 === 0n) s0 = 1n;
    if (s1 === 0n) s1 = 1n;

    return () => {
      let a = s0;
      const b = s1;
      s0 = b;
      a ^= a << 23n;
      a ^= a >> 17n;
      a ^= b ^ (b >> 26n);
      s1 = a;
      return Number((a + b) & 0x1f_ffff_ffff_ffffn) / 0x20_0000_0000_0000;
    };
  }

  /** Beta(α,β) sampling via Jöhnk's algorithm for small α,β */
  _betaSample(alpha, beta) {
    // Use ratio-of-uniforms for general (α, β)
    const u = this._gammaSample(alpha);
    const v = this._gammaSample(beta);
    return u / (u + v);
  }

  /** Gamma(α) sampling — Marsaglia & Tsang's method */
  _gammaSample(alpha) {
    if (alpha < 1) {
      return this._gammaSample(alpha + 1) * Math.pow(this._rng(), 1 / alpha);
    }

    const d = alpha - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x, v;
      do {
        x = this._normalSample();
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = this._rng();
      if (
        u < 1 - 0.0331 * (x * x) * (x * x) ||
        Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))
      ) {
        return d * v;
      }
    }
  }

  /** Standard normal via Box-Muller */
  _normalSample() {
    const u1 = this._rng();
    const u2 = this._rng();
    return Math.sqrt(-2 * Math.log(u1 || Number.MIN_VALUE)) *
      Math.cos(2 * Math.PI * u2);
  }

  /** Halton sequence element */
  _halton(index, base) {
    let result = 0;
    let f = 1 / base;
    let i = index;
    while (i > 0) {
      result += f * (i % base);
      i = Math.floor(i / base);
      f /= base;
    }
    return result;
  }

  /** Fisher-Yates shuffle */
  _shuffleArray(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this._rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /** Sample variance */
  _variance(values) {
    const n = values.length;
    if (n < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / n;
    return values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
  }

  /** SHA-256 based signature for de-duplication / caching */
  _resultSignature(mean, variance, n) {
    return createHash("sha256")
      .update(`${mean}:${variance}:${n}:${Date.now()}`)
      .digest("hex")
      .slice(0, 16);
  }

  _freshStats() {
    return {
      totalSamples: 0,
      batchesRun: 0,
      lastConverged: false,
      createdAt: Date.now(),
    };
  }
}

export { MonteCarloEngine };

export function createMonteCarloEngine(config = {}) {
  return new MonteCarloEngine(config);
}

export default MonteCarloEngine;
