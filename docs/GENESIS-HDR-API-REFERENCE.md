# GENESIS-HDR API Reference

**Version:** 10.6  
**Module:** `hdr-empire/genesis`  
**Status:** Stable

---

## Table of Contents

1. [Class: GenesisHDR](#class-genesishdr)
2. [Class: GeneticOperator](#class-geneticoperator)
3. [Data Structures](#data-structures)
4. [Events](#events)
5. [Configuration](#configuration)
6. [Examples](#examples)

---

## Class: GenesisHDR

Core genetic evolution engine for agent breeding and optimization.

### Constructor

```javascript
new GenesisHDR(config: GenesisConfig)
```

**Parameters:**

| Parameter           | Type   | Default      | Description                                                 |
| ------------------- | ------ | ------------ | ----------------------------------------------------------- |
| `populationSize`    | number | 50           | Target population size for evolution                        |
| `mutationRate`      | number | 0.15         | Base mutation probability (0-1)                             |
| `fitnessThreshold`  | number | 0.7          | Minimum fitness for breeding eligibility                    |
| `maxGenerations`    | number | 1000         | Maximum generations per breeding cycle                      |
| `selectionMethod`   | string | 'tournament' | How parents are selected (`tournament`, `roulette`, `rank`) |
| `tournamentSize`    | number | 3            | Tournament participants (for tournament selection)          |
| `elitismRatio`      | number | 0.1          | Fraction of top agents retained (0-1)                       |
| `crossoverStrategy` | string | 'uniform'    | Type of crossover (`uniform`, `single-point`, `two-point`)  |

**Example:**

```javascript
const genesis = new GenesisHDR({
  populationSize: 100,
  mutationRate: 0.15,
  fitnessThreshold: 0.7,
  selectionMethod: "tournament",
  tournamentSize: 3,
  elitismRatio: 0.1,
  crossoverStrategy: "uniform",
});
```

---

### Methods

#### `breed(options: BreedOptions): Agent`

Breed a single new agent, optionally starting from a base agent.

**Parameters:**

| Parameter           | Type   | Default | Description                                 |
| ------------------- | ------ | ------- | ------------------------------------------- |
| `baseAgent`         | Agent  | random  | Agent to use as breeding template           |
| `targetFitness`     | number | 0.8     | Target fitness score (0-1)                  |
| `maxGenerations`    | number | 100     | Max evolution steps                         |
| `mutationIntensity` | number | 0.5     | Mutation strength (0=minimal, 1=aggressive) |
| `traitConstraints`  | object | {}      | Min/max bounds for specific traits          |

**Returns:** `Agent` object with evolved traits

**Example:**

```javascript
const agent = genesis.breed({
  baseAgent: {
    analyticalPower: 0.6,
    creativity: 0.5,
    communication: 0.7,
  },
  targetFitness: 0.85,
  maxGenerations: 100,
  mutationIntensity: 0.3,
});

console.log(agent.fitnessScore); // ~0.85
console.log(agent.generation); // Evolution iterations
```

**Throws:**

- `Error`: If baseAgent is invalid
- `Error`: If no solution found within maxGenerations

---

#### `breedPopulation(size: number, config?: PopulationConfig): Agent[]`

Breed a new population of agents.

**Parameters:**

| Parameter               | Type    | Default | Description                              |
| ----------------------- | ------- | ------- | ---------------------------------------- |
| `size`                  | number  | —       | Target population size                   |
| `config.diversityBonus` | boolean | true    | Penalize similar agents during selection |
| `config.preserveElites` | boolean | true    | Keep best agents in new generation       |
| `config.targetFitness`  | number  | 0.8     | Average target fitness                   |

**Returns:** Array of `Agent` objects

**Example:**

```javascript
const population = genesis.breedPopulation(100, {
  diversityBonus: true,
  preserveElites: true,
  targetFitness: 0.8,
});

console.log(`${population.length} agents bred`);
console.log(`Average fitness: ${getAverage(population)}`);
```

---

#### `mutate(agent: Agent, options?: MutationOptions): Agent`

Apply mutations to an agent's traits.

**Parameters:**

| Parameter               | Type     | Default  | Description                                  |
| ----------------------- | -------- | -------- | -------------------------------------------- |
| `agent`                 | Agent    | —        | Agent to mutate                              |
| `options.traits`        | string[] | all      | Specific traits to mutate                    |
| `options.changeRate`    | number   | 0.2      | Change magnitude (0-1)                       |
| `options.direction`     | string   | 'random' | Direction (`increase`, `decrease`, `random`) |
| `options.probabilistic` | boolean  | true     | Apply probabilistically per trait            |

**Returns:** New mutated `Agent` object

**Example:**

```javascript
const mutant = genesis.mutate(agent, {
  traits: ["analyticalPower", "creativity"],
  changeRate: 0.15,
  direction: "random",
});

console.log(`Mutated ${mutant.generation} → ${agent.generation + 1}`);
```

**Note:** Returns new agent; original is unchanged

---

#### `crossover(parent1: Agent, parent2: Agent, options?: CrossoverOptions): Agent`

Create offspring from two parent agents.

**Parameters:**

| Parameter                        | Type    | Default   | Description                                               |
| -------------------------------- | ------- | --------- | --------------------------------------------------------- |
| `parent1`                        | Agent   | —         | First parent                                              |
| `parent2`                        | Agent   | —         | Second parent                                             |
| `options.strategy`               | string  | 'uniform' | Crossover method (`uniform`, `single-point`, `two-point`) |
| `options.mutationAfterCrossover` | boolean | true      | Apply mutation to offspring                               |
| `options.mutationRate`           | number  | 0.1       | Mutation rate if enabled                                  |

**Returns:** New `Agent` offspring

**Example:**

```javascript
const offspring = genesis.crossover(parent1, parent2, {
  strategy: "uniform",
  mutationAfterCrossover: true,
  mutationRate: 0.1,
});

console.log(`Offspring parent IDs: ${offspring.parentIds}`);
```

---

#### `evaluateFitness(agent: Agent): number`

Calculate fitness score for an agent (0-1).

**Parameters:**

| Parameter | Type  | Description       |
| --------- | ----- | ----------------- |
| `agent`   | Agent | Agent to evaluate |

**Returns:** Fitness score (0-1)

**Example:**

```javascript
const fitness = genesis.evaluateFitness(agent);
console.log(`Fitness: ${fitness}`); // e.g., 0.847
```

**Note:** Internally uses configurable fitness function

---

#### `batchEvaluateFitness(agents: Agent[]): Agent[]`

Evaluate fitness for multiple agents efficiently.

**Parameters:**

| Parameter | Type    | Description        |
| --------- | ------- | ------------------ |
| `agents`  | Agent[] | Agents to evaluate |

**Returns:** Same agents with updated `fitnessScore` property

**Example:**

```javascript
const evaluated = genesis.batchEvaluateFitness(population);
const avgFitness =
  evaluated.reduce((sum, a) => sum + a.fitnessScore, 0) / evaluated.length;
console.log(`Average fitness: ${avgFitness}`);
```

---

#### `selectParents(population: Agent[], count: number, options?: SelectionOptions): Agent[]`

Select parents from population for breeding.

**Parameters:**

| Parameter                | Type    | Default      | Description                            |
| ------------------------ | ------- | ------------ | -------------------------------------- |
| `population`             | Agent[] | —            | Population to select from              |
| `count`                  | number  | —            | Number of agents to select             |
| `options.method`         | string  | 'tournament' | Selection method                       |
| `options.tournamentSize` | number  | 3            | Tournament size (if tournament method) |

**Returns:** Selected `Agent` array

**Example:**

```javascript
const parents = genesis.selectParents(population, 50, {
  method: "tournament",
  tournamentSize: 3,
});

console.log(`Selected ${parents.length} parents`);
```

---

#### `selectBest(population: Agent[], options?: SelectOptions): Agent[]`

Get top agents by fitness.

**Parameters:**

| Parameter        | Type    | Default | Description                            |
| ---------------- | ------- | ------- | -------------------------------------- |
| `population`     | Agent[] | —       | Population to select from              |
| `options.count`  | number  | 10      | Number of agents to return             |
| `options.method` | string  | 'rank'  | Selection basis (`rank`, `tournament`) |

**Returns:** Top agents sorted by fitness (descending)

**Example:**

```javascript
const elite = genesis.selectBest(population, { count: 10 });
console.log(`Best agent fitness: ${elite[0].fitnessScore}`);
```

---

#### `initializePopulation(config?: InitConfig): Agent[]`

Create random initial population.

**Parameters:**

| Parameter            | Type    | Default      | Description                       |
| -------------------- | ------- | ------------ | --------------------------------- |
| `config.size`        | number  | 50           | Population size                   |
| `config.traitRanges` | object  | {all: [0,1]} | Min/max per trait                 |
| `config.diversity`   | boolean | true         | Ensure diverse initial population |

**Returns:** Array of random agents

**Example:**

```javascript
const population = genesis.initializePopulation({
  size: 100,
  traitRanges: {
    analyticalPower: [0.3, 0.9],
    creativity: [0.2, 0.9],
    communication: [0.5, 1.0],
  },
  diversity: true,
});
```

---

#### `getPopulationDiversity(population: Agent[]): DiversityMetrics`

Calculate population genetic diversity.

**Parameters:**

| Parameter    | Type    | Description           |
| ------------ | ------- | --------------------- |
| `population` | Agent[] | Population to analyze |

**Returns:** `DiversityMetrics` object

**DiversityMetrics:**

```javascript
{
  variance: number,            // Trait variance (0-1)
  distribution: {              // Per-trait stats
    [traitName]: {
      mean: number,
      stdDev: number,
      min: number,
      max: number
    }
  },
  distance: {                  // Pairwise distances
    avgEuclidean: number,      // Average distance between agents
    minEuclidean: number,      // Closest pair distance
    maxEuclidean: number       // Furthest pair distance
  },
  uniqueCommuters: number      // Unique trait combinations
}
```

**Example:**

```javascript
const diversity = genesis.getPopulationDiversity(population);
console.log(`Population variance: ${diversity.variance}`);
console.log(`Average pairwise distance: ${diversity.distance.avgEuclidean}`);
```

---

#### `getLineage(agent: Agent): LineageInfo`

Get genetic history of an agent.

**Parameters:**

| Parameter | Type  | Description      |
| --------- | ----- | ---------------- |
| `agent`   | Agent | Agent to analyze |

**Returns:** `LineageInfo` object

**LineageInfo:**

```javascript
{
  ancestors: Agent[],          // Complete ancestor chain
  parents: Agent[],            // Direct parents
  totalGenerations: number,    // Distance from original
  mutations: MutationRecord[], // Applied mutations
  crossovers: CrossoverRecord[]
}
```

**Example:**

```javascript
const lineage = genesis.getLineage(agent);
console.log(`Ancestor chain: ${lineage.ancestors.length} generations`);
lineage.mutations.forEach((m) => {
  console.log(`  Mutation: ${m.trait} at generation ${m.generation}`);
});
```

---

### Events

#### `agent:bred`

Emitted when a new agent is successfully bred.

```javascript
genesis.on("agent:bred", (event) => {
  console.log(
    `Agent ${event.agent.id} bred with fitness ${event.agent.fitnessScore}`,
  );
});
```

**Event Data:**

```javascript
{
  agent: Agent,
  timestamp: number,
  generation: number
}
```

---

#### `population:updated`

Emitted when population is evolved.

```javascript
genesis.on("population:updated", (event) => {
  console.log(`Population updated: ${event.newSize} agents`);
});
```

**Event Data:**

```javascript
{
  population: Agent[],
  avgFitness: number,
  maxFitness: number,
  timestamp: number
}
```

---

## Class: GeneticOperator

Helper class for advanced genetic operations.

### Static Methods

#### `uniformCrossover(parent1, parent2): Agent`

```javascript
const offspring = GeneticOperator.uniformCrossover(p1, p2);
```

---

#### `singlePointCrossover(parent1, parent2): Agent`

```javascript
const offspring = GeneticOperator.singlePointCrossover(p1, p2);
```

---

#### `twoPointCrossover(parent1, parent2): Agent`

```javascript
const offspring = GeneticOperator.twoPointCrossover(p1, p2);
```

---

## Data Structures

### Agent

```javascript
{
  id: string,                  // Unique identifier (UUID)
  generation: number,          // Evolution iterations
  parentIds: string[],         // IDs of direct parents
  traits: {
    analyticalPower: number,   // Logical reasoning (0-1)
    creativity: number,        // Novelty generation (0-1)
    communication: number,     // Interaction capability (0-1)
    resilience: number,        // Stress handling (0-1)
    learningRate: number       // Adaptation speed (0-1)
    [customTrait]: number      // Can have custom traits
  },
  fitnessScore: number,        // Performance metric (0-1)
  metadata: {
    createdAt: number,
    evaluatedAt: number,
    domain?: string,
    specialization?: string
  }
}
```

---

### BreedOptions

```javascript
{
  baseAgent?: Agent,
  targetFitness?: number,
  maxGenerations?: number,
  mutationIntensity?: number,
  traitConstraints?: {
    [traitName]: { min: number, max: number }
  }
}
```

---

### DiversityMetrics

```javascript
{
  variance: number,
  distribution: {
    [traitName]: {
      mean: number,
      stdDev: number,
      min: number,
      max: number
    }
  },
  distance: {
    avgEuclidean: number,
    minEuclidean: number,
    maxEuclidean: number
  },
  uniqueCommuters: number
}
```

---

## Configuration

### Recommended Settings by Domain

**Data Science / ML:**

```javascript
{
  populationSize: 50,
  mutationRate: 0.2,
  fitnessThreshold: 0.75,
  selectionMethod: 'tournament'
}
```

**High-Performance Systems:**

```javascript
{
  populationSize: 200,
  mutationRate: 0.1,
  fitnessThreshold: 0.85,
  selectionMethod: 'rank',
  elitismRatio: 0.15
}
```

**Exploration / Research:**

```javascript
{
  populationSize: 100,
  mutationRate: 0.3,
  fitnessThreshold: 0.5,
  selectionMethod: 'roulette',
  elitismRatio: 0.05
}
```

---

## Examples

### Complete Evolution Loop

```javascript
const genesis = new GenesisHDR({
  populationSize: 100,
  mutationRate: 0.15,
  fitnessThreshold: 0.7,
});

// Initialize population
let population = genesis.initializePopulation({ size: 100 });

// Evolution loop
for (let gen = 0; gen < 50; gen++) {
  // Evaluate all agents
  population = genesis.batchEvaluateFitness(population);

  // Select top performers
  const elite = genesis.selectBest(population, { count: 20 });

  // Select parents for breeding
  const parents = genesis.selectParents(population, 40, {
    method: "tournament",
    tournamentSize: 3,
  });

  // Generate offspring
  const offspring = [];
  for (let i = 0; i < 40; i++) {
    const p1 = parents[Math.floor(Math.random() * parents.length)];
    const p2 = parents[Math.floor(Math.random() * parents.length)];
    offspring.push(genesis.crossover(p1, p2));
  }

  // Replace weakest with offspring
  population.sort((a, b) => b.fitnessScore - a.fitnessScore);
  population = [...elite, ...offspring];

  const avgFitness =
    population.reduce((sum, a) => sum + a.fitnessScore, 0) / population.length;
  console.log(`Generation ${gen}: avg fitness = ${avgFitness.toFixed(3)}`);
}
```

---

**API Version:** 10.6.0  
**Last Updated:** February 12, 2026
