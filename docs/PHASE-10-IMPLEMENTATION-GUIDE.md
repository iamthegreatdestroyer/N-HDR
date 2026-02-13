# Phase 10: HDR-Empire Implementation Guide

**Version:** 10.6  
**Date:** February 12, 2026  
**Status:** Active Development  
**Document Type:** Implementation & Developer Reference

---

## Overview

Phase 10 introduces three revolutionary HDR subsystems that enable autonomous agent evolution, outcome prediction, and consequence modeling:

- **GENESIS-HDR**: Evolutionary agent breeding & optimization
- **ORACLE-HDR**: Outcome prediction & temporal forecasting
- **D-HDR**: Diffusion-based consequence generation & interpolation
- **Agent Card Standard**: Capability publishing & agent discovery

This guide provides developers with comprehensive implementation patterns, code examples, and best practices.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [GENESIS-HDR Implementation](#genesis-hdr-implementation)
3. [ORACLE-HDR Implementation](#oracle-hdr-implementation)
4. [D-HDR Implementation](#d-hdr-implementation)
5. [Agent Card Schema](#agent-card-schema)
6. [Integration Patterns](#integration-patterns)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation

```bash
# Install HDR-Empire with Phase 10 systems
npm install hdr-empire@10.6.0

# Or use Docker
docker pull hdr-empire:10.6.0-latest
```

### Basic Setup

```javascript
const { GenesisHDR } = require("hdr-empire/genesis");
const { OracleHDR } = require("hdr-empire/oracle");
const { DiffusionHDR } = require("hdr-empire/d-hdr");
const { HDRIntegrationOrchestrator } = require("hdr-empire/orchestrator");

// Initialize systems
const genesis = new GenesisHDR({
  populationSize: 50,
  mutationRate: 0.15,
  fitnessThreshold: 0.7,
});

const oracle = new OracleHDR({
  modelSize: "medium",
  timeHorizon: "medium",
  confidenceThreshold: 0.75,
});

const diffusion = new DiffusionHDR({
  timesteps: 50,
  scheduleType: "cosine",
  guidanceScale: 7.5,
});

// Create orchestrator for coordinated operation
const orchestrator = new HDRIntegrationOrchestrator({
  genesis,
  oracle,
  diffusion,
});
```

### First Workflow

```javascript
// Execute a complete breed-predict-analyze workflow
const result = await orchestrator.executeWorkflow({
  task: "breed_and_analyze_agent",
  targetFitness: 0.85,
  context: {
    domain: "problem_solving",
    constraints: ["time_limited", "resource_constrained"],
  },
});

console.log("Generated Agent:", result.agent);
console.log("Prediction:", result.prediction);
console.log("Consequences:", result.consequences);
```

---

## GENESIS-HDR Implementation

### Core Concepts

**GENESIS-HDR** uses genetic algorithms to evolve agents with increasing fitness scores. Key concepts:

| Concept        | Description                                                     |
| -------------- | --------------------------------------------------------------- |
| **Agent**      | Autonomous unit with traits (analyticalPower, creativity, etc.) |
| **Population** | Collection of agents undergoing evolution                       |
| **Fitness**    | Performance metric (0-1) measuring agent capability             |
| **Generation** | Iteration of the evolutionary process                           |
| **Mutation**   | Random trait modifications driving exploration                  |
| **Selection**  | Breeding of high-fitness agents                                 |

### Creating an Agent

```javascript
// Base agent definition
const baseAgent = {
  analyticalPower: 0.6, // Logical reasoning ability
  creativity: 0.5, // Novel solution generation
  communication: 0.7, // Interaction capability
  resilience: 0.4, // Stress handling
  learningRate: 0.8, // Adaptation speed
};

// Breed a new agent from base
const newAgent = genesis.breed({
  baseAgent: baseAgent,
  targetFitness: 0.85,
  maxGenerations: 100,
  mutationIntensity: 0.2, // 0 = minimal, 1 = aggressive
});

console.log(`
  ID: ${newAgent.id}
  Generation: ${newAgent.generation}
  Fitness: ${newAgent.fitnessScore}
  Traits: ${JSON.stringify(newAgent.traits)}
  Lineage: ${newAgent.parentIds.join(", ")}
`);
```

### Genetic Operators

#### Mutation

```javascript
// Single trait mutation
const mutant = genesis.mutate(agent, {
  trait: "analyticalPower",
  changeRate: 0.2, // 20% change magnitude
  direction: "increase", // or 'decrease', 'random'
});

// Multiple trait mutations (recombination)
const multiMutant = genesis.mutate(agent, {
  traits: ["analyticalPower", "creativity"],
  changeRate: 0.15,
  direction: "random",
});
```

#### Crossover

```javascript
// Breed two agents together
const offspring = genesis.crossover(agent1, agent2, {
  strategy: "uniform", // or 'single-point', 'two-point'
  mutationAfterCrossover: true,
  mutationRate: 0.1,
});
```

#### Selection

```javascript
// Select best agents from population
const selectedAgents = genesis.selectBest(population, {
  count: 10,
  method: "tournament", // or 'roulette', 'rank'
  tournamentSize: 3,
});
```

### Population Management

```javascript
// Create and evolve a population
const population = genesis.initializePopulation({
  size: 100,
  traitRanges: {
    analyticalPower: [0.3, 0.9],
    creativity: [0.2, 0.9],
    communication: [0.4, 1.0],
  },
});

// Run evolutionary loop
for (let generation = 0; generation < 50; generation++) {
  // Evaluate fitness
  population.forEach((agent) => {
    agent.fitnessScore = evaluateAgent(agent);
  });

  // Select and breed
  const selected = genesis.selectBest(population, { count: 50 });
  const offspring = [];

  for (let i = 0; i < 50; i++) {
    const parent1 = selected[i % selected.length];
    const parent2 = selected[(i + 1) % selected.length];

    const child = genesis.crossover(parent1, parent2, {
      mutationAfterCrossover: true,
    });

    offspring.push(child);
  }

  // Replace weakest agents with offspring
  population.sort((a, b) => b.fitnessScore - a.fitnessScore);
  population.splice(50, 50, ...offspring);

  console.log(
    `Generation ${generation}: Best fitness = ${population[0].fitnessScore}`,
  );
}
```

### Tracking Lineage

```javascript
// Access agent's genetic history
const lineage = genesis.getLineage(agent);

console.log(`
  Ancestor Chain: ${lineage.ancestors.map((a) => a.id).join(" → ")}
  Total Generations: ${lineage.totalGenerations}
  Mutations Applied: ${lineage.mutations.length}
  Parents: ${lineage.parents.map((p) => `${p.id} (fitness: ${p.fitnessScore})`).join(", ")}
`);

// Visualize lineage tree
const tree = genesis.getLineageTree(agent, { depth: 5 });
console.log(genesis.renderFamilyTree(tree));
```

---

## ORACLE-HDR Implementation

### Core Concepts

**ORACLE-HDR** predicts outcomes of agent decisions and actions. Key concepts:

| Concept        | Description                            |
| -------------- | -------------------------------------- |
| **Prediction** | Forecasted outcome (0-1 probability)   |
| **Confidence** | Certainty in prediction (0-1)          |
| **Factors**    | Supporting evidence for prediction     |
| **Temporal**   | Time-aware forecasting                 |
| **Ensemble**   | Multiple prediction methods aggregated |

### Making Predictions

```javascript
// Predict outcome of agent deployment
const prediction = oracle.predictAgentOutcome(agent, {
  executionContext: "production",
  timeframe: "monthly",
  successMetrics: ["uptime", "response_time", "error_rate"],
  constraints: {
    budget: 50000,
    team_size: 5,
    time_limit: "30 days",
  },
});

console.log(`
  Success Rate: ${(prediction.predicted_success_rate * 100).toFixed(1)}%
  Confidence: ${(prediction.confidence * 100).toFixed(1)}%
  Risk Score: ${prediction.risk_score}
  Supporting Factors: ${prediction.supporting_factors.join(", ")}
  Risk Factors: ${prediction.risk_factors.join(", ")}
`);
```

### Ensemble Predictions

```javascript
// Generate multiple predictions and aggregate
const ensemble = oracle.ensemblePredict(agent, {
  methods: ["neural_network", "decision_tree", "bayesian"],
  votes: 3,
  weighting: "confidence", // or 'equal', 'historical_accuracy'
});

console.log(`
  Ensemble Success Rate: ${ensemble.aggregated_success_rate}
  Method Agreement: ${ensemble.agreement_score}
  Individual Predictions:
  ${ensemble.predictions
    .map(
      (p) =>
        `  - ${p.method}: ${(p.success_rate * 100).toFixed(1)}% (confidence: ${(p.confidence * 100).toFixed(1)}%)`,
    )
    .join("\n")}
`);
```

### Temporal Forecasting

```javascript
// Predict performance over time
const timeSeries = oracle.forecastTimeSeries(agent, {
  metric: "cumulative_value_generated",
  timeHorizon: 365, // days
  granularity: "weekly", // daily, weekly, monthly
  confidenceInterval: 0.95,
});

console.log(`
  Projected Total Value: $${timeSeries.projectedTotal.toFixed(2)}
  Upper Bound (95%): $${timeSeries.confidenceBounds.upper.toFixed(2)}
  Lower Bound (95%): $${timeSeries.confidenceBounds.lower.toFixed(2)}
  Trend: ${timeSeries.trend}
`);

// Plot trajectory
timeSeries.points.forEach((point, index) => {
  console.log(
    `Week ${index}: $${point.value.toFixed(2)} ±${point.uncertainty.toFixed(2)}`,
  );
});
```

### Impact Analysis

```javascript
// Analyze multidimensional impact
const impact = oracle.analyzeImpact(agent, decision, {
  dimensions: {
    economic: { weight: 0.4, metrics: ["revenue", "cost"] },
    social: { weight: 0.3, metrics: ["satisfaction", "adoption"] },
    environmental: { weight: 0.2, metrics: ["emissions", "resources"] },
    temporal: { weight: 0.1, metrics: ["speed", "delay"] },
  },
  timeframe: "quarterly",
});

console.log(`
  Overall Impact Score: ${(impact.overall_score * 100).toFixed(1)}/100
  By Dimension:
  ${Object.entries(impact.by_dimension)
    .map(([dim, score]) => `  - ${dim}: ${(score * 100).toFixed(1)}`)
    .join("\n")}
  Key Drivers: ${impact.key_drivers.join(", ")}
`);
```

### Memory & Caching

```javascript
// Oracle maintains memory of past predictions for learning
const stats = oracle.getMemoryStats();

console.log(`
  Cached Predictions: ${stats.cached_predictions}
  Hit Rate: ${(stats.cache_hit_rate * 100).toFixed(1)}%
  Average Query Time: ${stats.avg_query_time_ms.toFixed(2)}ms
  Memory Used: ${(stats.memory_bytes / 1024 / 1024).toFixed(2)}MB
`);

// Clear old cache entries
oracle.clearCache({ olderThan: 86400000 }); // 24 hours
```

---

## D-HDR Implementation

### Core Concepts

**D-HDR** uses diffusion models to generate and explore consequence spaces. Key concepts:

| Concept           | Description                                 |
| ----------------- | ------------------------------------------- |
| **Consequence**   | Predicted outcome with impact dimensions    |
| **Embedding**     | Vector representation in consequence space  |
| **Diffusion**     | Gradual denoising from random to structured |
| **Interpolation** | Smooth transitions in consequence space     |
| **Ensemble**      | Multiple consequence variants               |

### Basic Generation

```javascript
// Generate a single consequence
const consequence = diffusion.predictOutcome("launch_product", {
  economicTarget: 0.8, // Desired economic impact
  socialTarget: 0.6, // Desired social impact
  riskTolerance: 0.3, // Risk acceptance level
});

console.log(`
  Decision: ${consequence.decision}
  Economic Impact: ${consequence.predicted_outcome.economicImpact}
  Social Impact: ${consequence.predicted_outcome.socialImpact}
  Confidence: ${consequence.confidence}
  Risk Level: ${consequence.risk_level}
`);
```

### Consequence Embedding

```javascript
// Create vector representations of outcomes
const embedding = diffusion.createEmbedding({
  decision: "strategic_decision",
  economicImpact: 0.7,
  socialImpact: 0.5,
  environmentalImpact: -0.2,
  temporalImpact: 0.3,
  confidence: 0.85,
});

// Compute similarity between outcomes
const sim1 = embedding.cosineSimilarity(otherEmbedding);
console.log(`Similarity Score: ${sim1.toFixed(3)}`);

// Find similar consequences
const similar = diffusion.findSimilar(embedding, {
  topK: 5,
  similarityThreshold: 0.7,
});

console.log(`Found ${similar.length} similar consequences`);
similar.forEach((sim) => {
  console.log(
    `  - ${sim.decision}: similarity ${(sim.score * 100).toFixed(1)}%`,
  );
});
```

### Space Interpolation

```javascript
// Smoothly interpolate between two scenarios
const scenario1 = diffusion.predictOutcome("conservative_approach", {});
const scenario2 = diffusion.predictOutcome("aggressive_approach", {});

const pathway = diffusion.interpolate(scenario1, scenario2, {
  steps: 5, // Create 5 intermediate scenarios
  method: "smooth", // or 'linear'
});

console.log(
  `Transition path from ${scenario1.decision} to ${scenario2.decision}:`,
);
pathway.steps.forEach((step, index) => {
  console.log(`
    Step ${index}: Economic=${step.economicImpact.toFixed(2)}, Social=${step.socialImpact.toFixed(2)}
  `);
});
```

### Ensemble Exploration

```javascript
// Explore decision space with multiple variants
const ensemble = diffusion.exploreDecisionSpace(
  "major_decision",
  {
    economicTarget: 0.8,
    constraints: ["budget_limited", "time_constrained"],
  },
  5, // Generate 5 variants
);

console.log(`
  Decision: ${ensemble.decision}
  Variants Generated: ${ensemble.ensemble.length}
  Average Similarity: ${(ensemble.average_similarity * 100).toFixed(1)}%
  Diversity: ${ensemble.diversity_metric}
`);

// Analyze variant distribution
ensemble.ensemble.forEach((variant, idx) => {
  console.log(`
    Variant ${idx + 1}:
      - Economic: ${variant.economicImpact.toFixed(2)}
      - Social: ${variant.socialImpact.toFixed(2)}
      - Confidence: ${variant.confidence.toFixed(2)}
  `);
});
```

### Guided Generation

```javascript
// Generate consequences with guidance towards specific values
const guided = diffusion.predictOutcome("expansion_plan", {
  economicTarget: 0.9, // Strong guidance
  socialTarget: 0.7,
  environmentalTarget: 0.5,
  guidanceStrength: 0.8, // 0 = free, 1 = strict
});

// Compare guided vs free generation
const free = diffusion.predictOutcome("expansion_plan", {
  guidanceStrength: 0.0,
});

console.log(`
  Guided Economic Impact: ${guided.predicted_outcome.economicImpact}
  Free Economic Impact: ${free.predicted_outcome.economicImpact}
  Guidance Effect: ${(
    (guided.predicted_outcome.economicImpact -
      free.predicted_outcome.economicImpact) *
    100
  ).toFixed(1)}%
`);
```

---

## Agent Card Schema

### Creating Agent Cards

```javascript
const {
  AgentCardFactory,
  AgentCardValidator,
} = require("hdr-empire/agent-card");

// Create card for evolved agent
const card = AgentCardFactory.createGenesisCard(agent, "stdio://genesis", {
  tags: ["evolution", "optimization", "high-performance"],
  capabilities: [
    { name: "analyze_data", mcp_tool: "genesis.analyze" },
    { name: "generate_solutions", mcp_tool: "genesis.generate" },
  ],
  metadata: {
    domain: "data_science",
    trainingTime: "2.5 hours",
    evolutionSteps: agent.generation,
  },
});

// Validate card
const validator = new AgentCardValidator();
const validation = validator.validateCard(card);

if (validation.valid) {
  console.log("✓ Card is valid");
} else {
  console.log("✗ Validation errors:");
  validation.errors.forEach((e) => console.log(`  - ${e}`));
}
```

### Publishing Cards

```javascript
// Register card with agent registry
const registered = validator.registerCard(card);

console.log(`
  Agent ID: ${registered.id}
  Status: ${registered.status}
  Registered At: ${registered.registered_at}
  Discovery URL: ${registered.discovery_endpoint}
`);
```

### Discovering Agents

```javascript
// Search for available agents by criteria
const agents = validator.searchCards({
  specialization: "predictive",
  minFitness: 0.75,
  tags: ["high-performance"],
  limit: 10,
});

console.log(`Found ${agents.length} matching agents:`);
agents.forEach((agent) => {
  console.log(`
    - ${agent.name}
      Fitness: ${agent.genetic_lineage.fitness_score}
      Generation: ${agent.genetic_lineage.generation}
      Parents: ${agent.genetic_lineage.parent_ids.length}
  `);
});
```

---

## Integration Patterns

### Sequential Workflow

```javascript
const workflow = async () => {
  // 1. Breed an agent
  const agent = genesis.breed({
    baseAgent: { analyticalPower: 0.5, creativity: 0.6 },
    targetFitness: 0.85,
  });

  // 2. Predict its outcome
  const prediction = oracle.predictAgentOutcome(agent, {
    executionContext: "production",
  });

  // 3. Analyze consequences
  const consequences = diffusion.exploreDecisionSpace(
    "deploy_agent",
    { agentFitness: agent.fitnessScore },
    3,
  );

  // 4. Publish capability card
  const card = AgentCardFactory.createGenesisCard(agent, "stdio://genesis");
  validator.registerCard(card);

  return { agent, prediction, consequences, card };
};

const result = await workflow();
```

### Parallel Processing

```javascript
// Breed multiple agents in parallel
const agents = await Promise.all([
  genesis.breed({ baseAgent: base1, targetFitness: 0.8 }),
  genesis.breed({ baseAgent: base2, targetFitness: 0.85 }),
  genesis.breed({ baseAgent: base3, targetFitness: 0.75 }),
]);

// Predict outcomes in parallel
const predictions = await Promise.all(
  agents.map((agent) => Promise.resolve(oracle.predictAgentOutcome(agent, {}))),
);

// Analyze consequences in parallel
const allConsequences = await Promise.all(
  agents.map((agent) =>
    Promise.resolve(diffusion.exploreDecisionSpace(`agent_${agent.id}`, {}, 3)),
  ),
);
```

### Event-Driven Coordination

```javascript
orchestrator.on("agent:bred", (event) => {
  console.log(
    `New agent bred: ${event.agent.id} (fitness: ${event.agent.fitnessScore})`,
  );

  // Trigger prediction
  oracle.predictAgentOutcome(event.agent, {
    executionContext: "production",
  });
});

orchestrator.on("prediction:made", (event) => {
  if (event.prediction.predicted_success_rate > 0.8) {
    console.log("✓ High-confidence prediction");

    // Trigger consequence exploration
    diffusion.exploreDecisionSpace(`deploy_${event.agent.id}`, {}, 3);
  }
});

orchestrator.on("consequence:explored", (event) => {
  console.log(
    `Consequence space explored with ${event.ensemble.length} variants`,
  );

  // Publish agent card
  const card = AgentCardFactory.createGenesisCard(
    event.agent,
    "stdio://genesis",
  );
  validator.registerCard(card);
});
```

---

## Best Practices

### 1. Fitness Function Design

**Good:**

```javascript
function evaluateFitness(agent) {
  const scoreComponents = {
    performanceAccuracy: computeAccuracy(agent), // Primary metric
    responseTime: 1 - computeLatency(agent) / MAX_LATENCY,
    resourceEfficiency: computeResourceScore(agent),
    adaptability: computeAdaptabilityScore(agent),
  };

  return (
    scoreComponents.performanceAccuracy * 0.5 +
    scoreComponents.responseTime * 0.2 +
    scoreComponents.resourceEfficiency * 0.2 +
    scoreComponents.adaptability * 0.1
  );
}
```

**Avoid:**

```javascript
// Too simplistic
function evaluateFitness(agent) {
  return Math.random(); // Never do this!
}

// Too noisy
function evaluateFitness(agent) {
  return agent.traits.analyticalPower * Math.random();
}
```

### 2. Mutation Rate Tuning

```javascript
// Adaptive mutation rate based on population convergence
function getAdaptiveMutationRate(population, generation) {
  const diversity = calculatePopulationDiversity(population);
  const baseRate = 0.15;

  if (diversity < 0.2) {
    // Low diversity: increase mutation to explore
    return baseRate * 1.5;
  } else if (diversity > 0.7) {
    // High diversity: decrease mutation to converge
    return baseRate * 0.7;
  }

  return baseRate;
}
```

### 3. Oracle Confidence Thresholds

```javascript
// Use confidence scores for decision-making
const prediction = oracle.predictAgentOutcome(agent, {});

if (prediction.confidence > 0.85) {
  // Deploy with high confidence
  deployAgent(agent);
} else if (prediction.confidence > 0.7) {
  // Controlled rollout
  deployCanary(agent, { percentage: 10 });
} else {
  // More testing needed
  console.log("Insufficient confidence for deployment");
  logRisksAndUncertainties(prediction);
}
```

### 4. Memory Efficiency

```javascript
// Configure appropriate memory limits for ORACLE
const oracle = new OracleHDR({
  maxMemorySize: 10000, // Store max 10K predictions
  memoryExpiryHours: 24, // Clear entries after 24h
  compressionEnabled: true,
});

// Periodically clean up old entries
setInterval(() => {
  oracle.clearCache({ olderThan: 86400000 }); // 24 hours
}, 3600000); // Every hour
```

### 5. Card Publishing Strategy

```javascript
// Publish only high-quality agents
const agent = genesis.breed({ targetFitness: 0.85 });

if (agent.fitnessScore >= 0.8 && agent.generation > 10) {
  const card = AgentCardFactory.createGenesisCard(agent, "stdio://genesis");
  const result = validator.registerCard(card);

  if (result.status === "published") {
    console.log(`✓ Agent published: ${card.id}`);
  }
}
```

---

## Troubleshooting

### Problem: Low Fitness Scores

**Symptom:** Population not improving over generations

**Solutions:**

1. Check fitness function is meaningful and differentiable
2. Increase mutation rate for better exploration
3. Use larger population sizes (50+ agents)
4. Verify trait ranges allow for improvement
5. Try different selection methods (tournament vs roulette)

```javascript
// Diagnostic check
const avgFitness =
  population.reduce((sum, a) => sum + a.fitnessScore, 0) / population.length;
const maxFitness = Math.max(...population.map((a) => a.fitnessScore));
const minFitness = Math.min(...population.map((a) => a.fitnessScore));

console.log(`
  Fitness Range: ${minFitness.toFixed(2)} - ${maxFitness.toFixed(2)}
  Average: ${avgFitness.toFixed(2)}
  Variance: ${population.reduce((sum, a) => sum + Math.pow(a.fitnessScore - avgFitness, 2), 0) / population.length}
`);
```

### Problem: Oracle Predictions Are Inaccurate

**Symptom:** Predictions don't match actual outcomes

**Solutions:**

1. Verify training data quality and quantity
2. Check if agent characteristics match training distribution
3. Use ensemble methods for more robust predictions
4. Monitor prediction confidence scores
5. Implement continuous learning from actual outcomes

```javascript
// Validation check
const predictions = agents.map((a) => oracle.predictAgentOutcome(a, {}));
const actualOutcomes = agents.map((a) => evaluateActual(a));

const accuracy =
  predictions.filter(
    (p, i) => Math.abs(p.predicted_success_rate - actualOutcomes[i]) < 0.1,
  ).length / predictions.length;

console.log(`Prediction Accuracy: ${(accuracy * 100).toFixed(1)}%`);
```

### Problem: D-HDR Interpolations Are Unrealistic

**Symptom:** Intermediate consequences don't make logical sense

**Solutions:**

1. Increase diffusion timesteps for smoother interpolation
2. Use guided generation with soft constraints
3. Validate intermediates with external logic
4. Adjust embedding dimensionality
5. Use domain-specific interpolation validators

```javascript
// Validate interpolation path
const path = diffusion.interpolate(scenario1, scenario2, { steps: 5 });

path.steps.forEach((step, idx) => {
  const validation = validateConsequence(step, {
    economicFeasible: true,
    socialAcceptable: true,
    environmentalViable: true,
  });

  if (!validation.valid) {
    console.warn(`Step ${idx} is unrealistic: ${validation.issues.join(", ")}`);
  }
});
```

---

## API Reference Quick Links

- **GENESIS-HDR API**: See `GENESIS-HDR-API-REFERENCE.md`
- **ORACLE-HDR API**: See `ORACLE-HDR-API-REFERENCE.md`
- **D-HDR API**: See `D-HDR-API-REFERENCE.md`
- **Agent Card Schema**: See `AGENT-CARD-SCHEMA.md`

---

## Support & Next Steps

For more information:

- **Examples Repository**: `/docs/examples/`
- **Performance Tuning**: See `PERFORMANCE-OPTIMIZATION.md`
- **Deployment**: See `DEPLOYMENT-GUIDE.md`
- **Community**: GitHub Discussions & Issues

---

**Document Version:** 10.6.0  
**Last Updated:** February 12, 2026  
**Status:** Active
