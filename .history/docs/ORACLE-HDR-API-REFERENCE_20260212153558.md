# ORACLE-HDR API Reference

**Version:** 10.6  
**Module:** `hdr-empire/oracle`  
**Status:** Stable

---

## Table of Contents

1. [Class: OracleHDR](#class-oraclehdr)
2. [Class: PredictionEnsemble](#class-predictionensemble)
3. [Data Structures](#data-structures)
4. [Events](#events)
5. [Configuration](#configuration)
6. [Examples](#examples)

---

## Class: OracleHDR

Outcome prediction and forecasting engine using ensemble methods.

### Constructor

```javascript
new OracleHDR(config: OracleConfig)
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `modelSize` | string | 'medium' | Model capacity (`small`, `medium`, `large`) |
| `timeHorizon` | string | 'medium' | Time span for predictions (`short`, `medium`, `long`) |
| `maxMemory` | number | 1000 | Max predictions to cache |
| `confidenceThreshold` | number | 0.6 | Minimum confidence for prediction |
| `ensembleMethod` | string | 'voting' | How predictions combine (`voting`, `weighted`, `bagging`) |
| `updateRate` | number | 0.01 | Learning rate for adaptive models |
| `cacheStrategy` | string | 'fifo' | Cache eviction policy (`fifo`, `lru`, `lfu`) |
| `includeUncertainty` | boolean | true | Calculate confidence intervals |

**Example:**

```javascript
const oracle = new OracleHDR({
  modelSize: 'large',
  timeHorizon: 'long',
  maxMemory: 5000,
  confidenceThreshold: 0.7,
  ensembleMethod: 'weighted',
  includeUncertainty: true
});
```

---

### Methods

#### `predictAgentOutcome(agent: Agent, context?: Context): Prediction`

Predict the outcome of an agent's action in given context.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agent` | Agent | — | Agent to analyze |
| `context` | Context | {} | Environmental conditions |
| `context.timeframe` | string | 'short' | Prediction horizon |
| `context.constraints` | object | {} | Environmental limits |
| `context.historicalData` | object | {} | Past performance patterns |

**Returns:** `Prediction` object

**Prediction:**

```javascript
{
  agentId: string,
  outcome: {
    successProbability: number,     // 0-1 likelihood of success
    expectedValue: number,          // Projected outcome metric
    riskScore: number,              // 0-1 risk assessment
    confidenceLevel: number         // 0-1 prediction certainty
  },
  explanation: {
    dominantFactors: string[],      // Key decision factors
    alternatives: number,           // Alternative outcomes
    uncertaintyRange: [min, max]    // Confidence interval
  },
  timestamp: number,
  ttl: number                       // Cache time-to-live (ms)
}
```

**Example:**

```javascript
const prediction = oracle.predictAgentOutcome(agent, {
  timeframe: 'medium',
  constraints: { budget: 100000, timeline: '6 months' }
});

console.log(`Success probability: ${prediction.outcome.successProbability}`);
console.log(`Confidence: ${prediction.outcome.confidenceLevel}`);
console.log(`Risk score: ${prediction.outcome.riskScore}`);
```

**Throws:**
- `Error`: If agent is invalid
- `Error`: If context contains conflicting constraints

---

#### `predictOutcomeForDecision(decision: Decision): Prediction`

Predict outcome for a specific decision.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `decision` | Decision | Decision to evaluate |

**Returns:** `Prediction` object

**Decision:**

```javascript
{
  agentId: string,
  actionType: string,           // e.g., 'invest', 'deploy', 'explore'
  parameters: object,
  constraints: object,
  expectedDuration: number,
  requiredResources: object
}
```

**Example:**

```javascript
const decision = {
  agentId: agent.id,
  actionType: 'deploy_system',
  parameters: { target: 'production', scale: 100 },
  constraints: { maxLatency: 500 },
  expectedDuration: 3600000
};

const prediction = oracle.predictOutcomeForDecision(decision);
```

---

#### `generateEnsemble(agent: Agent, options?: EnsembleOptions): EnsemblePrediction`

Generate predictions using multiple prediction methods.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agent` | Agent | — | Agent to analyze |
| `options.methods` | string[] | ['ml', 'statistical', 'heuristic'] | Prediction methods to use |
| `options.votingStrategy` | string | 'weighted' | How to combine predictions |
| `options.confidence` | number | 0.95 | Required confidence level |
| `options.includeVariance` | boolean | true | Calculate variance across methods |

**Returns:** `EnsemblePrediction` object

**EnsemblePrediction:**

```javascript
{
  predictions: Prediction[],                // Per-method predictions
  aggregated: Prediction,                   // Combined prediction
  variance: number,                         // Disagreement measure (0-1)
  weights: { [method]: number },            // Method importance weights
  agreement: number,                        // How much methods agree (0-1)
  recommendation: string,                   // Best course of action
  confidence: number                        // Overall ensemble confidence
}
```

**Example:**

```javascript
const ensemble = oracle.generateEnsemble(agent, {
  methods: ['neural_network', 'decision_tree', 'markov_chain'],
  votingStrategy: 'weighted',
  confidence: 0.90
});

console.log(`Ensemble agreement: ${ensemble.agreement}`); // 0-1
console.log(`Recommendation: ${ensemble.recommendation}`);
```

---

#### `forecastTimeSeries(agent: Agent, config: ForecastConfig): TimeForecast`

Forecast agent performance over time.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agent` | Agent | — | Agent to forecast |
| `config.horizonSteps` | number | 12 | Time steps to predict |
| `config.stepSize` | string | 'hour' | Time unit (`minute`, `hour`, `day`, `week`) |
| `config.method` | string | 'arima' | Forecasting algorithm |
| `config.seasonality` | number | null | Seasonal pattern period |
| `config.confidence` | number | 0.95 | Confidence level for bands |

**Returns:** `TimeForecast` object

**TimeForecast:**

```javascript
{
  timestamps: number[],                // Forecast time points
  forecast: {                          // Predicted values
    expected: number[],                // Best estimate
    upper: number[],                   // Upper confidence bound
    lower: number[]                    // Lower confidence bound
  },
  mape: number,                        // Mean absolute percentage error
  seasonality: {
    detected: boolean,
    period: number,
    strength: number                   // 0-1
  },
  trend: 'increasing' | 'stable' | 'decreasing',
  warnings: string[]                   // Forecast limitations
}
```

**Example:**

```javascript
const forecast = oracle.forecastTimeSeries(agent, {
  horizonSteps: 24,
  stepSize: 'hour',
  method: 'exponential_smoothing'
});

forecast.timestamps.forEach((ts, i) => {
  const dt = new Date(ts);
  console.log(`${dt.toISOString()}: ${forecast.forecast.expected[i].toFixed(2)} ` +
    `[${forecast.forecast.lower[i].toFixed(2)}, ${forecast.forecast.upper[i].toFixed(2)}]`);
});
```

---

#### `analyzeImpact(agent: Agent, action: string): ImpactAnalysis`

Analyze multidimensional impact of an agent's action.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent` | Agent | Agent to analyze |
| `action` | string | Action to evaluate |

**Returns:** `ImpactAnalysis` object

**ImpactAnalysis:**

```javascript
{
  dimensions: {
    economic: number,            // Economic impact (-1 to 1, 0=neutral)
    social: number,              // Social impact
    environmental: number,       // Environmental impact
    technical: number,           // Technical/system impact
    organizational: number       // Org structure impact
  },
  timeline: {
    immediate: number,           // 0-1 impact score (now-1 hour)
    shortTerm: number,           // 1 hour - 1 day
    mediumTerm: number,          // 1 day - 1 month
    longTerm: number             // > 1 month
  },
  stakeholders: {
    [stakeholderGroup]: {
      affected: boolean,
      sentiment: number,         // -1 to 1 (negative to positive)
      magnitude: number          // 0-1 impact size
    }
  },
  riskFactors: {
    [riskType]: {
      probability: number,       // 0-1 likelihood
      severity: number,          // 0-1 impact severity
      mitigation: string[]       // Mitigation strategies
    }
  },
  overallScore: number,          // Summary impact (-100 to 100)
  recommendation: string         // Go/no-go recommendation
}
```

**Example:**

```javascript
const impact = oracle.analyzeImpact(agent, 'scale_to_production');

console.log('Impact Across Dimensions:');
Object.entries(impact.dimensions).forEach(([dim, score]) => {
  console.log(`  ${dim}: ${score.toFixed(2)}`);
});

console.log(`\nStakeholder Effects:`);
Object.entries(impact.stakeholders).forEach(([group, data]) => {
  if (data.affected) {
    console.log(`  ${group}: sentiment=${data.sentiment}, magnitude=${data.magnitude}`);
  }
});

console.log(`\nOverall Impact Score: ${impact.overallScore}`);
console.log(`Recommendation: ${impact.recommendation}`);
```

---

#### `getMemoryStats(): MemoryStatistics`

Get statistics on cached predictions.

**Parameters:** None

**Returns:** `MemoryStatistics` object

**MemoryStatistics:**

```javascript
{
  totalCached: number,           // Number of cached predictions
  cacheSize: number,             // Memory used (bytes)
  hitRate: number,               // 0-1 cache hit rate
  missRate: number,              // 0-1 cache miss rate
  averageAge: number,            // Avg prediction age (ms)
  evictions: number,             // Total evictions
  oldestPrediction: number,      // Oldest prediction timestamp
  newestPrediction: number       // Newest prediction timestamp
}
```

**Example:**

```javascript
const stats = oracle.getMemoryStats();
console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Cached predictions: ${stats.totalCached}`);
console.log(`Cache size: ${(stats.cacheSize / 1024).toFixed(1)}KB`);
```

---

#### `clearOldPredictions(maxAge?: number): number`

Remove predictions older than specified age.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxAge` | number | 86400000 | Age threshold in milliseconds (default: 24 hours) |

**Returns:** Number of predictions cleared

**Example:**

```javascript
// Clear predictions older than 48 hours
const cleared = oracle.clearOldPredictions(48 * 60 * 60 * 1000);
console.log(`Cleared ${cleared} old predictions`);
```

---

#### `updatePredictionModel(feedback: PredictionFeedback): void`

Update prediction models based on actual outcomes.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `feedback` | PredictionFeedback | Actual outcome vs prediction |

**PredictionFeedback:**

```javascript
{
  predictionId: string,
  actualOutcome: number,         // Actual result (0-1)
  predictedOutcome: number,      // Original prediction
  error: number,                 // |actual - predicted|
  timestamp: number,
  context?: object
}
```

**Example:**

```javascript
oracle.updatePredictionModel({
  predictionId: prediction.id,
  actualOutcome: 0.92,
  predictedOutcome: 0.87,
  error: 0.05,
  timestamp: Date.now()
});
```

---

#### `getBestAgents(count: number, sortBy?: string): Agent[]`

Get agents with best predicted outcomes.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `count` | number | — | Number of agents to return |
| `sortBy` | string | 'successProbability' | Metric to sort by |

**Returns:** Top agents sorted by prediction metric

**Example:**

```javascript
const topAgents = oracle.getBestAgents(10, 'successProbability');
topAgents.forEach((agent, i) => {
  console.log(`${i+1}. ${agent.id} - success prob: ${agent.lastPrediction.outcome.successProbability}`);
});
```

---

### Events

#### `prediction:made`

Emitted when a prediction is generated.

```javascript
oracle.on('prediction:made', (event) => {
  console.log(`Predicted ${event.agentId}: success=${event.prediction.outcome.successProbability}`);
});
```

**Event Data:**
```javascript
{
  agentId: string,
  prediction: Prediction,
  timestamp: number
}
```

---

#### `ensemble:generated`

Emitted when ensemble prediction is completed.

```javascript
oracle.on('ensemble:generated', (event) => {
  console.log(`Ensemble agreement: ${event.ensemble.agreement}`);
});
```

**Event Data:**
```javascript
{
  agentId: string,
  ensemble: EnsemblePrediction,
  timestamp: number
}
```

---

## Class: PredictionEnsemble

Helper class for ensemble prediction management.

### Static Methods

#### `combineVoting(predictions: Prediction[]): Prediction`

Combine predictions through majority voting.

```javascript
const combined = PredictionEnsemble.combineVoting(predictions);
```

---

#### `combineWeighted(predictions: Prediction[], weights: number[]): Prediction`

Combine with custom weights.

```javascript
const weights = [0.5, 0.3, 0.2];
const combined = PredictionEnsemble.combineWeighted(predictions, weights);
```

---

#### `calculateAgreement(predictions: Prediction[]): number`

Calculate agreement metric (0-1).

```javascript
const agreement = PredictionEnsemble.calculateAgreement(predictions);
```

---

## Data Structures

### Prediction

```javascript
{
  id: string,                      // Unique identifier
  agentId: string,
  outcome: {
    successProbability: number,    // 0-1
    expectedValue: number,         // Normalized score
    riskScore: number,             // 0-1
    confidenceLevel: number        // 0-1
  },
  explanation: {
    dominantFactors: string[],
    alternatives: number,
    uncertaintyRange: [min, max]
  },
  timestamp: number,
  ttl: number
}
```

---

### EnsemblePrediction

```javascript
{
  predictions: Prediction[],
  aggregated: Prediction,
  variance: number,
  weights: { [method]: number },
  agreement: number,
  recommendation: string,
  confidence: number
}
```

---

### Context

```javascript
{
  timeframe?: string,
  constraints?: object,
  historicalData?: object,
  environmentalFactors?: object,
  stakeholders?: string[]
}
```

---

## Configuration

### Recommended Settings

**High Confidence / Low Risk:**
```javascript
{
  modelSize: 'large',
  confidenceThreshold: 0.85,
  timeHorizon: 'short',
  ensembleMethod: 'weighted'
}
```

**Balanced:**
```javascript
{
  modelSize: 'medium',
  confidenceThreshold: 0.7,
  timeHorizon: 'medium',
  ensembleMethod: 'voting'
}
```

**Exploratory / Research:**
```javascript
{
  modelSize: 'small',
  confidenceThreshold: 0.5,
  timeHorizon: 'long',
  ensembleMethod: 'bagging'
}
```

---

## Examples

### Complete Prediction Workflow

```javascript
const oracle = new OracleHDR({
  modelSize: 'large',
  timeHorizon: 'medium',
  ensembleMethod: 'weighted'
});

// Make a basic prediction
const prediction = oracle.predictAgentOutcome(agent, {
  timeframe: 'medium',
  constraints: { deadline: Date.now() + 7*86400000 }
});

console.log(`Basic prediction confidence: ${prediction.outcome.confidenceLevel}`);

// Generate ensemble for more robust prediction
const ensemble = oracle.generateEnsemble(agent, {
  methods: ['neural_network', 'statistical', 'heuristic'],
  confidence: 0.95
});

console.log(`Ensemble agreement: ${ensemble.agreement}`);
console.log(`Methods recommend: ${ensemble.recommendation}`);

// Forecast performance over time
const forecast = oracle.forecastTimeSeries(agent, {
  horizonSteps: 30,
  stepSize: 'day',
  method: 'exponential_smoothing'
});

console.log(`Expected trend: ${forecast.trend}`);

// Analyze impact
const impact = oracle.analyzeImpact(agent, 'scale_to_production');
console.log(`Overall impact score: ${impact.overallScore}/100`);

// Check memory
const stats = oracle.getMemoryStats();
console.log(`Cache efficiency: ${(stats.hitRate * 100).toFixed(1)}%`);

// Clean old predictions periodically
const cleared = oracle.clearOldPredictions(48 * 60 * 60 * 1000);
console.log(`Cleaned ${cleared} stale predictions`);
```

---

**API Version:** 10.6.0  
**Last Updated:** February 12, 2026
