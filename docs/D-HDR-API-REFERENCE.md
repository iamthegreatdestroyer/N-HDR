# D-HDR API Reference

**Version:** 10.6  
**Module:** `hdr-empire/d-hdr`  
**Status:** Stable

---

## Table of Contents

1. [Class: DiffusionHDR](#class-diffusionhdr)
2. [Class: ConsequenceEmbedding](#class-consequenceembedding)
3. [Class: DiffusionScheduler](#class-diffusionscheduler)
4. [Class: ConsequenceGenerativeModel](#class-consequencegenerativemodel)
5. [Data Structures](#data-structures)
6. [Events](#events)
7. [Configuration](#configuration)
8. [Examples](#examples)

---

## Class: DiffusionHDR

Core diffusion-based consequence modeling and exploration system.

### Constructor

```javascript
new DiffusionHDR(config: DiffusionConfig)
```

**Parameters:**

| Parameter             | Type   | Default  | Description                                    |
| --------------------- | ------ | -------- | ---------------------------------------------- |
| `timesteps`           | number | 40       | Diffusion process iterations                   |
| `scheduleType`        | string | 'cosine' | Noise schedule (`linear`, `cosine`, `sigmoid`) |
| `guidanceScale`       | number | 7.5      | How strongly to guide toward target            |
| `embeddingDim`        | number | 512      | Embedding vector dimensionality                |
| `memoryLimit`         | number | 5000     | Max consequences to cache                      |
| `interpolationSteps`  | number | 10       | Steps for space interpolation                  |
| `ensembleSize`        | number | 5        | Number of variants in ensemble                 |
| `similarityThreshold` | number | 0.85     | Min cosine similarity for dedup                |

**Example:**

```javascript
const diffusion = new DiffusionHDR({
  timesteps: 50,
  scheduleType: "cosine",
  guidanceScale: 8.0,
  embeddingDim: 768,
  memoryLimit: 10000,
  interpolationSteps: 15,
});
```

---

### Methods

#### `predictOutcome(agent: Agent, context?: Context): Consequence`

Generate predicted consequence for an agent's action.

**Parameters:**

| Parameter               | Type    | Default | Description                |
| ----------------------- | ------- | ------- | -------------------------- |
| `agent`                 | Agent   | —       | Agent performing action    |
| `context`               | Context | {}      | Environmental context      |
| `context.actionType`    | string  | —       | Type of action             |
| `context.constraints`   | object  | {}      | Outcome constraints        |
| `context.targetMetrics` | object  | {}      | Desired outcome properties |

**Returns:** `Consequence` object

**Consequence:**

```javascript
{
  id: string,
  agentId: string,
  actionType: string,
  outcome: {
    primary: string,           // Main consequence
    secondary: string[],       // Side effects
    likelihood: number,        // 0-1 probability
    severity: number,          // 0-1 impact magnitude
    timeToManifest: number     // Milliseconds until effect occurs
  },
  metrics: {
    [metricName]: number       // Quantified impacts
  },
  embedding: Float32Array,     // 512-768 dimensional vector
  constraints: {
    [constraint]: boolean      // Constraint satisfaction
  },
  alternatives: Consequence[], // Related outcomes
  timestamp: number
}
```

**Example:**

```javascript
const consequence = diffusion.predictOutcome(agent, {
  actionType: "deploy_to_production",
  constraints: {
    maxLatency: 500,
    minReliability: 0.99,
    maxCost: 50000,
  },
  targetMetrics: {
    performance: "high",
    stability: "maximum",
  },
});

console.log(`Primary outcome: ${consequence.outcome.primary}`);
console.log(`Likelihood: ${consequence.outcome.likelihood}`);
```

---

#### `exploreDecisionSpace(agent: Agent, options?: ExploreOptions): ConsequenceSet`

Explore multiple possible consequences.

**Parameters:**

| Parameter                   | Type    | Default      | Description                  |
| --------------------------- | ------- | ------------ | ---------------------------- |
| `agent`                     | Agent   | —            | Agent to analyze             |
| `options.radius`            | number  | 0.3          | Exploration range (0-1)      |
| `options.samples`           | number  | 20           | Number of variants           |
| `options.diversityBonus`    | boolean | true         | Penalize similar outcomes    |
| `options.constraintsMatter` | boolean | true         | Enforce constraints strictly |
| `options.sortBy`            | string  | 'likelihood' | Ranking metric               |

**Returns:** `ConsequenceSet` object

**ConsequenceSet:**

```javascript
{
  consequences: Consequence[],         // Explored outcomes (sorted)
  centerpoint: Consequence,            // Most likely outcome
  variance: number,                    // Outcome variance (0-1)
  distribution: {
    mean: Float32Array,               // Mean embedding vector
    variance: Float32Array,           // Per-dimension variance
    confidence: number                // Distribution quality (0-1)
  },
  constraints: {
    satisfied: number,                // Count of constraintMet outcomes
    violated: number,                 // Count of constrained violations
    violationRate: number             // Violation percentage (0-1)
  },
  resilience: {
    sensitivity: number,              // Parameter sensitivity (0-1)
    robustness: number,               // How stable are outcomes (0-1)
    uncertainty: number               // Outcome uncertainty (0-1)
  },
  timestamp: number
}
```

**Example:**

```javascript
const exploration = diffusion.exploreDecisionSpace(agent, {
  radius: 0.4,
  samples: 30,
  diversityBonus: true,
  sortBy: "likelihood",
});

console.log(`Most likely outcome: ${exploration.centerpoint.outcome.primary}`);
console.log(`Variance in outcomes: ${exploration.variance.toFixed(3)}`);
console.log(
  `Constraint satisfaction: ${exploration.constraints.satisfied}/${exploration.constraints.satisfied + exploration.constraints.violated}`,
);

// Show top 5 outcomes
exploration.consequences.slice(0, 5).forEach((c, i) => {
  console.log(
    `  ${i + 1}. ${c.outcome.primary} (likelihood: ${c.outcome.likelihood})`,
  );
});
```

---

#### `interpolate(consequence1: Consequence, consequence2: Consequence, t?: number): Consequence`

Smoothly interpolate between two consequences.

**Parameters:**

| Parameter      | Type        | Default | Description                           |
| -------------- | ----------- | ------- | ------------------------------------- |
| `consequence1` | Consequence | —       | Starting consequence                  |
| `consequence2` | Consequence | —       | Ending consequence                    |
| `t`            | number      | 0.5     | Interpolation factor (0=start, 1=end) |

**Returns:** Interpolated `Consequence`

**Example:**

```javascript
// Get outcome at 30% between consequence A and B
const blended = diffusion.interpolate(consequenceA, consequenceB, 0.3);

console.log(`Interpolated outcome: ${blended.outcome.primary}`);

// Generate smooth transition sequence
const steps = 5;
const sequence = [];
for (let i = 0; i <= steps; i++) {
  const t = i / steps;
  sequence.push(diffusion.interpolate(safe, risky, t));
}

// Analyze transition
sequence.forEach((c, i) => {
  console.log(`Step ${i}: cost=${c.metrics.cost}, risk=${c.metrics.riskScore}`);
});
```

---

#### `createEmbedding(consequence: Consequence): Float32Array`

Create or update embedding vector for a consequence.

**Parameters:**

| Parameter     | Type        | Description          |
| ------------- | ----------- | -------------------- |
| `consequence` | Consequence | Consequence to embed |

**Returns:** Embedding vector (Float32Array)

**Example:**

```javascript
const embedding = diffusion.createEmbedding(consequence);
console.log(`Embedding dimension: ${embedding.length}`); // e.g., 512
console.log(`Vector norm: ${Math.sqrt(embedding.reduce((a, b) => a + b * b))}`);
```

---

#### `generateEnsemble(agent: Agent, options?: EnsembleOptions): ConsequenceEnsemble`

Generate multiple consequence variants.

**Parameters:**

| Parameter                    | Type    | Default | Description                    |
| ---------------------------- | ------- | ------- | ------------------------------ |
| `agent`                      | Agent   | —       | Agent to analyze               |
| `options.count`              | number  | 5       | Number of variants             |
| `options.diversity`          | number  | 0.7     | Target variance (0-1)          |
| `options.bestOfK`            | number  | 3       | Generate K variants, keep best |
| `options.includeConstraints` | boolean | true    | Enforce constraints            |

**Returns:** `ConsequenceEnsemble` object

**ConsequenceEnsemble:**

```javascript
{
  consequences: Consequence[],      // Generated variants
  diversity: number,               // Actual variance achieved (0-1)
  bestConsequence: Consequence,    // Highest-likelihood variant
  agreement: number,               // How similar outcomes are (0-1)
  stability: number,               // Prediction stability (0-1)
  consensus: {
    probability: number,           // P(all agree) 0-1
    majorityOutcome: string,       // Most common primary outcome
    minorityOutcomes: string[]     // Alternative outcomes
  },
  timestamp: number
}
```

**Example:**

```javascript
const ensemble = diffusion.generateEnsemble(agent, {
  count: 10,
  diversity: 0.8,
  bestOfK: 3,
  includeConstraints: true,
});

console.log(`Generated ${ensemble.consequences.length} variants`);
console.log(`Outcome diversity: ${(ensemble.diversity * 100).toFixed(1)}%`);
console.log(`Consensus outcome: ${ensemble.consensus.majorityOutcome}`);

// Rank variants
ensemble.consequences.forEach((c, i) => {
  console.log(`  ${i + 1}. Likelihood: ${c.outcome.likelihood.toFixed(3)}`);
});
```

---

#### `generateGuided(agent: Agent, target: object): Consequence`

Generate consequence guided toward specific targets.

**Parameters:**

| Parameter | Type   | Description       |
| --------- | ------ | ----------------- |
| `agent`   | Agent  | Agent to analyze  |
| `target`  | object | Target properties |

**Target Properties:**

```javascript
{
  outcome: string,           // Desired primary outcome
  metrics?: object,          // Target metric values
  constraints?: object,      // Must-satisfy constraints
  style?: string,           // Generation style
  confidence?: number       // Required confidence (0-1)
}
```

**Returns:** `Consequence` object

**Example:**

```javascript
const guided = diffusion.generateGuided(agent, {
  outcome: "successful_deployment",
  metrics: {
    downtime: 0, // Must be zero
    performance: "high", // High performance desired
  },
  constraints: {
    maxCost: 100000,
    maxLatency: 1000,
  },
  confidence: 0.95,
});

console.log(`Guided outcome: ${guided.outcome.primary}`);
console.log(`Confidence: ${guided.outcome.likelihood}`);
```

---

#### `getMemoryStats(): MemoryStatistics`

Get statistics on cached consequences.

**Parameters:** None

**Returns:** `MemoryStatistics` object

**MemoryStatistics:**

```javascript
{
  totalCached: number,       // Number of cached consequences
  cacheSize: number,         // Memory used (bytes)
  hitRate: number,           // 0-1 cache hit rate
  missRate: number,          // 0-1 cache miss rate
  uniqueAgents: number,      // Distinct agents in cache
  uniqueOutcomes: number,    // Distinct outcome types
  averageAge: number,        // Avg consequence age (ms)
  oldestEntry: number,       // Oldest entry timestamp
  newestEntry: number        // Newest entry timestamp
}
```

**Example:**

```javascript
const stats = diffusion.getMemoryStats();
console.log(`Cached consequences: ${stats.totalCached}`);
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Memory: ${(stats.cacheSize / 1024 / 1024).toFixed(1)}MB`);
```

---

#### `clearOldConsequences(maxAge?: number): number`

Remove consequences older than threshold.

**Parameters:**

| Parameter | Type   | Default  | Description                      |
| --------- | ------ | -------- | -------------------------------- |
| `maxAge`  | number | 86400000 | Age threshold (ms, default: 24h) |

**Returns:** Number cleared

**Example:**

```javascript
const cleared = diffusion.clearOldConsequences(7 * 24 * 60 * 60 * 1000);
console.log(`Cleared ${cleared} week-old consequences`);
```

---

### Events

#### `consequence:generated`

Emitted when consequence is generated.

```javascript
diffusion.on("consequence:generated", (event) => {
  console.log(`Generated: ${event.consequence.outcome.primary}`);
});
```

**Event Data:**

```javascript
{
  consequence: Consequence,
  agentId: string,
  timestamp: number
}
```

---

#### `ensemble:generated`

Emitted when ensemble completes.

```javascript
diffusion.on("ensemble:generated", (event) => {
  console.log(`Ensemble diversity: ${event.ensemble.diversity}`);
});
```

**Event Data:**

```javascript
{
  ensemble: ConsequenceEnsemble,
  agentId: string,
  timestamp: number
}
```

---

## Class: ConsequenceEmbedding

Vector representation system for consequences.

### Static Methods

#### `computeSimilarity(emb1: Float32Array, emb2: Float32Array): number`

Calculate cosine similarity between embeddings.

```javascript
const similarity = ConsequenceEmbedding.computeSimilarity(
  embedding1,
  embedding2,
);
// Returns 0-1 (1 = identical, 0 = orthogonal)
```

---

#### `interpolateEmbeddings(emb1: Float32Array, emb2: Float32Array, t: number): Float32Array`

Linear interpolation between embedding vectors.

```javascript
const blended = ConsequenceEmbedding.interpolateEmbeddings(e1, e2, 0.5);
```

---

#### `normalizeEmbedding(embedding: Float32Array): Float32Array`

Normalize embedding to unit length.

```javascript
const normalized = ConsequenceEmbedding.normalizeEmbedding(embedding);
```

---

## Class: DiffusionScheduler

Manages noise schedule for diffusion process.

### Constructor

```javascript
new DiffusionScheduler(type: 'linear' | 'cosine' | 'sigmoid', steps: number)
```

**Example:**

```javascript
const scheduler = new DiffusionScheduler("cosine", 50);
```

---

### Methods

#### `getNoiseLevels(): number[]`

Get noise levels for all timesteps.

```javascript
const schedule = scheduler.getNoiseLevels();
// Returns [0.99, 0.98, ..., 0.01, 0.00] (50 steps)
```

---

#### `getNoiseAtStep(step: number): number`

Get noise level at specific step.

```javascript
const noise = scheduler.getNoiseAtStep(25); // 0-1
```

---

## Class: ConsequenceGenerativeModel

Generates consequences from latent space.

### Constructor

```javascript
new ConsequenceGenerativeModel(modelSize: 'small' | 'medium' | 'large')
```

---

### Methods

#### `generate(latent: Float32Array, guidance?: number): Consequence`

Generate consequence from latent vector.

```javascript
const consequence = model.generate(latentVector, 7.5);
```

---

#### `decode(embedding: Float32Array): object`

Decode embedding to consequence.

```javascript
const decoded = model.decode(embedding);
```

---

## Data Structures

### Consequence

```javascript
{
  id: string,
  agentId: string,
  actionType: string,
  outcome: {
    primary: string,
    secondary: string[],
    likelihood: number,        // 0-1
    severity: number,          // 0-1
    timeToManifest: number
  },
  metrics: { [name]: number },
  embedding: Float32Array,
  constraints: { [name]: boolean },
  alternatives: Consequence[],
  timestamp: number
}
```

---

### ConsequenceSet

```javascript
{
  consequences: Consequence[],
  centerpoint: Consequence,
  variance: number,
  distribution: {
    mean: Float32Array,
    variance: Float32Array,
    confidence: number
  },
  constraints: {
    satisfied: number,
    violated: number,
    violationRate: number
  },
  resilience: {
    sensitivity: number,
    robustness: number,
    uncertainty: number
  },
  timestamp: number
}
```

---

### ConsequenceEnsemble

```javascript
{
  consequences: Consequence[],
  diversity: number,
  bestConsequence: Consequence,
  agreement: number,
  stability: number,
  consensus: {
    probability: number,
    majorityOutcome: string,
    minorityOutcomes: string[]
  },
  timestamp: number
}
```

---

## Configuration

### Recommended Settings

**Fast / Lightweight:**

```javascript
{
  timesteps: 20,
  scheduleType: 'linear',
  embeddingDim: 256,
  ensembleSize: 3
}
```

**Balanced:**

```javascript
{
  timesteps: 40,
  scheduleType: 'cosine',
  embeddingDim: 512,
  ensembleSize: 5
}
```

**High-Quality / Research:**

```javascript
{
  timesteps: 100,
  scheduleType: 'cosine',
  embeddingDim: 768,
  ensembleSize: 10
}
```

---

## Examples

### Complete Consequence Exploration

```javascript
const diffusion = new DiffusionHDR({
  timesteps: 50,
  scheduleType: "cosine",
  guidanceScale: 7.5,
  embeddingDim: 512,
});

// Single consequence prediction
const consequence = diffusion.predictOutcome(agent, {
  actionType: "scale_to_production",
});
console.log(`Outcome: ${consequence.outcome.primary}`);

// Explore decision space
const exploration = diffusion.exploreDecisionSpace(agent, {
  radius: 0.5,
  samples: 20,
  diversityBonus: true,
});

console.log(`Decision space variance: ${exploration.variance}`);

// Interpolate between safe and risky
const safe = exploration.consequences[0];
const risky = exploration.consequences[exploration.consequences.length - 1];
const balanced = diffusion.interpolate(safe, risky, 0.5);

console.log(`Balanced outcome: ${balanced.outcome.primary}`);

// Generate guided variants
const guided = diffusion.generateGuided(agent, {
  outcome: "successful_deployment",
  metrics: { downtime: 0 },
  constraints: { maxCost: 100000 },
});

console.log(`Guided outcome: ${guided.outcome.primary}`);

// Generate ensemble for robustness
const ensemble = diffusion.generateEnsemble(agent, {
  count: 7,
  diversity: 0.8,
});

console.log(`Ensemble agreement: ${ensemble.agreement}`);
```

---

**API Version:** 10.6.0  
**Last Updated:** February 12, 2026
