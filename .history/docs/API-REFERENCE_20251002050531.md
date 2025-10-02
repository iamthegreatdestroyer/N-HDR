# HDR Empire Framework - API Reference

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

## Overview

Complete API reference for the HDR Empire Framework. This document covers all public APIs for the seven HDR systems, integration layer, and command interface.

## Table of Contents

1. [Neural-HDR API](#neural-hdr-api)
2. [Nano-Swarm HDR API](#nano-swarm-hdr-api)
3. [Omniscient-HDR API](#omniscient-hdr-api)
4. [Reality-HDR API](#reality-hdr-api)
5. [Quantum-HDR API](#quantum-hdr-api)
6. [Dream-HDR API](#dream-hdr-api)
7. [Void-Blade HDR API](#void-blade-hdr-api)
8. [Integration Layer API](#integration-layer-api)
9. [Command Interface API](#command-interface-api)
10. [REST API](#rest-api)
11. [WebSocket API](#websocket-api)

---

## Neural-HDR API

### NeuralHDR Class

Main class for consciousness state management.

#### Constructor

```javascript
import { NeuralHDR } from "./src/core/neural-hdr/index.js";

const neuralHDR = new NeuralHDR(config);
```

**Parameters**:

- `config` (Object, optional): Configuration object
  - `quantumLayers` (number): Number of layers (1-6, default: 6)
  - `captureInterval` (number): ms between captures (default: 100)
  - `persistenceMode` (string): 'local' | 'distributed' | 'hybrid'
  - `compressionEnabled` (boolean): Auto-compress (default: true)
  - `securityLevel` (string): 'standard' | 'enhanced' | 'maximum'

#### Methods

##### initialize()

Initialize the N-HDR system.

```javascript
await neuralHDR.initialize();
```

**Returns**: `Promise<void>`

**Throws**: `InitializationError` if already initialized

---

##### captureState(options)

Capture consciousness state across quantum layers.

```javascript
const state = await neuralHDR.captureState({
  depth: 6,
  mode: "full",
  validate: true,
  compress: true,
  security: {
    level: "maximum",
    encryption: true,
  },
});
```

**Parameters**:

- `options` (Object):
  - `depth` (number): Layers to capture (1-6, default: 6)
  - `mode` (string): 'quick' | 'standard' | 'full' (default: 'full')
  - `validate` (boolean): Validate fidelity (default: true)
  - `compress` (boolean): Compress state (default: true)
  - `security` (Object, optional):
    - `level` (string): Security level
    - `encryption` (boolean): Enable encryption

**Returns**: `Promise<ConsciousnessState>`

```javascript
{
  id: 'state-abc-123',
  timestamp: 1696204800000,
  layers: [
    { layerId: 0, name: 'Sensory', data: {...}, size: 5242880 },
    { layerId: 1, name: 'Pattern', data: {...}, size: 8388608 },
    // ... more layers
  ],
  fidelity: 0.9992,
  compressed: true,
  originalSize: 103MB,
  compressedSize: 5MB,
  captureTime: 875
}
```

**Throws**: `CaptureError` if capture fails

---

##### restoreState(options)

Restore consciousness state.

```javascript
await neuralHDR.restoreState({
  stateId: "state-abc-123",
  mode: "full",
  target: "current-system",
  validate: true,
});
```

**Parameters**:

- `options` (Object):
  - `stateId` (string): State identifier
  - `mode` (string): 'full' | 'partial' | 'differential'
  - `target` (string): Target system identifier
  - `validate` (boolean): Validate after restore (default: true)
  - `layers` (Array<number>, optional): Specific layers for partial mode

**Returns**: `Promise<RestorationResult>`

```javascript
{
  stateId: 'state-abc-123',
  restored: true,
  fidelity: 0.9991,
  layersRestored: 6,
  restorationTime: 1200,
  validated: true
}
```

---

##### listStates(filter)

List available consciousness states.

```javascript
const states = await neuralHDR.listStates({
  filter: {
    minFidelity: 0.99,
    dateRange: "7d",
    tags: ["checkpoint", "production"],
  },
  sort: "date",
  order: "desc",
  limit: 50,
  offset: 0,
});
```

**Parameters**:

- `filter` (Object):
  - `filter` (Object, optional): Filter criteria
    - `minFidelity` (number): Minimum fidelity
    - `dateRange` (string): Time range ('7d', '30d', etc.)
    - `tags` (Array<string>): Filter by tags
  - `sort` (string): Sort field ('date' | 'fidelity' | 'size')
  - `order` (string): Sort order ('asc' | 'desc')
  - `limit` (number): Max results
  - `offset` (number): Pagination offset

**Returns**: `Promise<Array<StateMetadata>>`

---

##### verifyIntegrity(options)

Verify state integrity.

```javascript
const result = await neuralHDR.verifyIntegrity({
  stateId: "state-abc-123",
  deep: true,
});
```

**Parameters**:

- `options` (Object):
  - `stateId` (string): State to verify
  - `deep` (boolean): Deep verification (all layers)

**Returns**: `Promise<IntegrityResult>`

```javascript
{
  stateId: 'state-abc-123',
  valid: true,
  layersChecked: 6,
  layersValid: 6,
  hashMatch: true,
  compressionValid: true,
  issues: []
}
```

---

##### deleteState(stateId)

Delete consciousness state.

```javascript
await neuralHDR.deleteState("state-abc-123");
```

**Parameters**:

- `stateId` (string): State identifier

**Returns**: `Promise<void>`

---

##### getStatus()

Get system status.

```javascript
const status = neuralHDR.getStatus();
```

**Returns**: `Object`

```javascript
{
  name: 'Neural-HDR',
  initialized: true,
  health: 98,
  metrics: {
    statesManaged: 1234,
    avgFidelity: 0.9987,
    totalCaptures: 5678,
    totalRestorations: 234
  },
  uptime: 432000
}
```

---

## Nano-Swarm HDR API

### NanoSwarmHDR Class

#### deploySwarm(options)

Deploy a nano-swarm for task acceleration.

```javascript
const swarm = await nanoSwarmHDR.deploySwarm({
  target: "/path/to/target",
  initialBots: 100,
  maxBots: 10000,
  specializations: ["crystallization", "compression"],
  taskTypes: ["data-processing", "computation"],
  config: {
    replicationThreshold: 0.75,
    batchSize: 100,
    vanishingKeys: true,
  },
});
```

**Parameters**:

- `options` (Object):
  - `target` (string): Target for swarm operations
  - `initialBots` (number): Starting bots (default: 100)
  - `maxBots` (number): Max bots (default: 10000)
  - `specializations` (Array<string>): Bot specializations
  - `taskTypes` (Array<string>): Task types to handle
  - `config` (Object, optional): Swarm configuration

**Returns**: `Promise<Swarm>`

```javascript
{
  id: 'swarm-k8s-9a3f',
  target: '/path/to/target',
  activeBots: 100,
  maxBots: 10000,
  status: 'active',
  specializations: ['crystallization'],
  createdAt: 1696204800000
}
```

---

##### assignTasks(swarmId, tasks)

Assign tasks to swarm.

```javascript
const result = await nanoSwarmHDR.assignTasks('swarm-k8s-9a3f', [
  { id: 'task-1', type: 'process', data: {...} },
  { id: 'task-2', type: 'analyze', data: {...} }
]);
```

**Parameters**:

- `swarmId` (string): Swarm identifier
- `tasks` (Array<Task>): Tasks to assign

**Returns**: `Promise<AssignmentResult>`

```javascript
{
  swarmId: 'swarm-k8s-9a3f',
  tasksAssigned: 2,
  tasksQueued: 2,
  estimatedCompletion: 5000
}
```

---

##### getSwarmMetrics(swarmId)

Get swarm performance metrics.

```javascript
const metrics = await nanoSwarmHDR.getSwarmMetrics("swarm-k8s-9a3f");
```

**Returns**: `Promise<SwarmMetrics>`

```javascript
{
  swarmId: 'swarm-k8s-9a3f',
  activeBots: 2347,
  efficiency: 0.923,
  acceleration: 4.7,
  tasksCompleted: 45821,
  tasksPending: 3142,
  pathEfficiency: 0.891,
  uptime: 3600000
}
```

---

##### optimizeSwarm(swarmId, options)

Optimize swarm performance.

```javascript
await nanoSwarmHDR.optimizeSwarm("swarm-k8s-9a3f", {
  targetEfficiency: 0.95,
  adjustThreshold: true,
  adjustBatchSize: true,
  rebalance: true,
});
```

**Parameters**:

- `swarmId` (string): Swarm identifier
- `options` (Object):
  - `targetEfficiency` (number): Target efficiency (0-1)
  - `adjustThreshold` (boolean): Adjust replication threshold
  - `adjustBatchSize` (boolean): Adjust batch size
  - `rebalance` (boolean): Rebalance workload

**Returns**: `Promise<OptimizationResult>`

---

##### terminateSwarm(swarmId, options)

Terminate a swarm.

```javascript
await nanoSwarmHDR.terminateSwarm("swarm-k8s-9a3f", {
  mode: "graceful",
  timeout: 60000,
  vanish: true,
});
```

**Parameters**:

- `swarmId` (string): Swarm identifier
- `options` (Object):
  - `mode` (string): 'immediate' | 'graceful' | 'timed'
  - `timeout` (number): Timeout for graceful (ms)
  - `vanish` (boolean): Use vanishing keys

**Returns**: `Promise<void>`

---

## Omniscient-HDR API

### OmniscientHDR Class

#### createDomain(options)

Create a knowledge domain.

```javascript
const domain = await omniscientHDR.createDomain({
  name: "Machine Learning",
  depth: 8,
  threshold: 0.85,
  isolated: true,
  config: {
    maxConnections: 1000,
    indexing: "realtime",
  },
});
```

**Parameters**:

- `options` (Object):
  - `name` (string): Domain name
  - `depth` (number): Crystallization depth (1-12)
  - `threshold` (number): Semantic threshold (0-1)
  - `isolated` (boolean): Domain isolation
  - `config` (Object, optional): Domain configuration

**Returns**: `Promise<KnowledgeDomain>`

```javascript
{
  id: 'domain-ml-456',
  name: 'Machine Learning',
  depth: 8,
  threshold: 0.85,
  concepts: 0,
  connections: 0,
  createdAt: 1696204800000
}
```

---

##### crystallize(data, options)

Crystallize knowledge from source data.

```javascript
const crystal = await omniscientHDR.crystallize(knowledgeData, {
  domainId: "domain-ml-456",
  depth: 8,
  connections: "maximum",
  quality: 0.9,
  sources: ["docs", "code"],
});
```

**Parameters**:

- `data` (any): Source data to crystallize
- `options` (Object):
  - `domainId` (string): Target domain
  - `depth` (number): Crystallization depth
  - `connections` (string): 'minimal' | 'standard' | 'maximum'
  - `quality` (number): Min quality threshold (0-1)
  - `sources` (Array<string>): Source types

**Returns**: `Promise<CrystallizationResult>`

```javascript
{
  domainId: 'domain-ml-456',
  conceptsCreated: 234,
  connectionsCreated: 567,
  quality: 0.94,
  depth: 8,
  crystallizationTime: 2345
}
```

---

##### search(options)

Search knowledge domains.

```javascript
const results = await omniscientHDR.search({
  query: "neural networks",
  domainId: "domain-ml-456", // optional
  semantic: true,
  threshold: 0.85,
  limit: 50,
});
```

**Parameters**:

- `options` (Object):
  - `query` (string): Search query
  - `domainId` (string, optional): Specific domain
  - `semantic` (boolean): Enable semantic search
  - `threshold` (number): Semantic threshold
  - `limit` (number): Max results

**Returns**: `Promise<Array<SearchResult>>`

```javascript
[
  {
    conceptId: "concept-123",
    name: "Neural Network",
    description: "...",
    relevance: 0.95,
    domainId: "domain-ml-456",
  },
  // ... more results
];
```

---

##### getConnections(options)

Get concept connections.

```javascript
const connections = await omniscientHDR.getConnections({
  conceptId: "concept-123",
  depth: 2,
  minStrength: 0.75,
  types: ["semantic", "causal"],
});
```

**Parameters**:

- `options` (Object):
  - `conceptId` (string): Source concept
  - `depth` (number): Connection depth
  - `minStrength` (number): Min connection strength
  - `types` (Array<string>): Connection types

**Returns**: `Promise<Array<Connection>>`

---

##### getDomainStats(domainId)

Get domain statistics.

```javascript
const stats = await omniscientHDR.getDomainStats("domain-ml-456");
```

**Returns**: `Promise<DomainStats>`

```javascript
{
  domainId: 'domain-ml-456',
  concepts: 12345,
  connections: 45678,
  avgQuality: 0.94,
  depth: 8,
  size: '234MB',
  lastUpdated: 1696204800000
}
```

---

## Reality-HDR API

### RealityHDR Class

#### compress(data, options)

Compress data with R-HDR.

```javascript
const compressed = await realityHDR.compress(data, {
  ratio: 10000,
  quality: 0.95,
  algorithm: "adaptive",
  chunkSize: "1MB",
  validate: true,
});
```

**Parameters**:

- `data` (any): Data to compress
- `options` (Object):
  - `ratio` (number): Target compression ratio
  - `quality` (number): Min quality (0-1)
  - `algorithm` (string): 'standard' | 'aggressive' | 'lossless' | 'adaptive'
  - `chunkSize` (string): Chunk size
  - `validate` (boolean): Validate after compression

**Returns**: `Promise<CompressionResult>`

```javascript
{
  id: 'comp-789',
  originalSize: 1500000000, // bytes
  compressedSize: 150000,
  ratio: 10000,
  quality: 0.976,
  algorithm: 'adaptive',
  navigable: true,
  compressionTime: 3000
}
```

---

##### decompress(options)

Decompress data.

```javascript
const decompressed = await realityHDR.decompress({
  compressedId: "comp-789",
  mode: "full",
  validate: true,
});
```

**Parameters**:

- `options` (Object):
  - `compressedId` (string): Compressed data ID
  - `mode` (string): 'full' | 'partial' | 'streaming'
  - `range` (Object, optional): Byte range for partial
  - `validate` (boolean): Validate integrity

**Returns**: `Promise<any>` - Decompressed data

---

##### createNavigator(compressedId)

Create navigator for compressed space.

```javascript
const navigator = await realityHDR.createNavigator("comp-789");

const data = await navigator.access({
  coordinates: [100, 200, 300],
  radius: 10,
  decompress: true,
});
```

**Parameters**:

- `compressedId` (string): Compressed data ID

**Returns**: `Promise<Navigator>`

---

## Quantum-HDR API

### QuantumHDR Class

#### createSuperposition(options)

Create quantum superposition state.

```javascript
const qstate = await quantumHDR.createSuperposition({
  source: decisionPoint,
  states: 16,
  depth: 5,
  precision: 0.001,
});
```

**Parameters**:

- `options` (Object):
  - `source` (any): Starting point
  - `states` (number): Number of states (8-64)
  - `depth` (number): Exploration depth
  - `precision` (number): Probability precision

**Returns**: `Promise<QuantumState>`

---

##### explore(options)

Explore probability pathways.

```javascript
const tree = await quantumHDR.explore({
  stateId: qstate.id,
  strategy: "breadth-first",
  maxDepth: 10,
  minProbability: 0.01,
});
```

**Parameters**:

- `options` (Object):
  - `stateId` (string): Quantum state ID
  - `strategy` (string): 'breadth-first' | 'depth-first' | 'best-first'
  - `maxDepth` (number): Max exploration depth
  - `minProbability` (number): Min probability to explore

**Returns**: `Promise<ProbabilityTree>`

---

##### collapse(options)

Collapse quantum state.

```javascript
const result = await quantumHDR.collapse({
  stateId: qstate.id,
  target: "optimal",
  validate: true,
});
```

**Parameters**:

- `options` (Object):
  - `stateId` (string): State to collapse
  - `target` (string): 'optimal' | 'specific' | 'random'
  - `outcome` (any, optional): Specific outcome
  - `validate` (boolean): Validate result

**Returns**: `Promise<CollapseResult>`

---

## Dream-HDR API

### DreamHDR Class

#### amplify(options)

Amplify creativity.

```javascript
const insights = await dreamHDR.amplify({
  target: concept,
  depth: 12,
  factor: 3.0,
  mode: "amplified",
  synthesis: true,
  filters: {
    minNovelty: 0.85,
    minConfidence: 0.7,
    maxInsights: 50,
  },
});
```

**Parameters**:

- `options` (Object):
  - `target` (any): Target for amplification
  - `depth` (number): Pattern depth (4-16)
  - `factor` (number): Amplification factor (1.0-5.0)
  - `mode` (string): 'standard' | 'amplified' | 'maximum'
  - `synthesis` (boolean): Enable pattern synthesis
  - `filters` (Object): Filter criteria

**Returns**: `Promise<Array<Insight>>`

---

##### generateInsights(options)

Generate creative insights.

```javascript
const generated = await dreamHDR.generateInsights({
  source: problemSpace,
  type: "connections",
  count: 20,
  novelty: 0.9,
});
```

**Parameters**:

- `options` (Object):
  - `source` (any): Problem space
  - `type` (string): 'connections' | 'patterns' | 'solutions'
  - `count` (number): Number to generate
  - `novelty` (number): Novelty threshold

**Returns**: `Promise<Array<Insight>>`

---

## Void-Blade HDR API

### VoidBladeHDR Class

#### createSecurityZone(options)

Create security protection zone.

```javascript
const zone = await voidBladeHDR.createSecurityZone({
  name: "critical-systems",
  level: 9,
  perception: "none",
  targeting: "intelligent",
  autoScale: true,
  resources: ["n-hdr", "ns-hdr"],
});
```

**Parameters**:

- `options` (Object):
  - `name` (string): Zone name
  - `level` (number): Security level (1-9)
  - `perception` (string): 'none' | 'reduced' | 'selective'
  - `targeting` (string): 'random' | 'intelligent' | 'adaptive'
  - `autoScale` (boolean): Auto-scale protection
  - `resources` (Array<string>): Resources to protect

**Returns**: `Promise<SecurityZone>`

---

##### protect(resource, options)

Protect a resource.

```javascript
const protected = await voidBladeHDR.protect(resource, {
  zoneId: zone.id,
  level: 9,
  encryption: "quantum",
  cloaking: true,
});
```

**Parameters**:

- `resource` (any): Resource to protect
- `options` (Object):
  - `zoneId` (string): Security zone
  - `level` (number): Security level
  - `encryption` (string): Encryption type
  - `cloaking` (boolean): Enable cloaking

**Returns**: `Promise<ProtectedResource>`

---

##### scanThreats(options)

Scan for security threats.

```javascript
const scan = await voidBladeHDR.scanThreats({
  scope: "all",
  depth: "deep",
  realtime: false,
});
```

**Parameters**:

- `options` (Object):
  - `scope` (string): 'all' | 'zone' | 'resource'
  - `depth` (string): 'quick' | 'standard' | 'deep'
  - `realtime` (boolean): Realtime scanning

**Returns**: `Promise<ThreatScanResult>`

---

## Integration Layer API

### CrossSystemBridge

#### registerSystem(name, instance, options)

Register HDR system with bridge.

```javascript
await crossSystemBridge.registerSystem("neural-hdr", neuralHDR, {
  securityLevel: "maximum",
  interfaces: ["consciousness", "state-transfer"],
});
```

---

#### sendData(source, target, data)

Send data between systems.

```javascript
await crossSystemBridge.sendData("neural-hdr", "nano-swarm-hdr", data);
```

---

## Command Interface API

### HDREmpireCommander

#### executeCommand(system, command, params)

Execute system command.

```javascript
const result = await commander.executeCommand("neural-hdr", "captureState", {
  depth: 6,
  mode: "full",
});
```

---

## REST API

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

All requests require JWT token:

```
Authorization: Bearer <token>
```

### Endpoints

#### Systems

**GET /systems**
List all HDR systems.

**GET /systems/:systemId**
Get system status.

**POST /systems/:systemId/operations**
Execute system operation.

#### Consciousness States

**POST /states/capture**
Capture consciousness state.

**GET /states**
List states.

**GET /states/:stateId**
Get state details.

**POST /states/:stateId/restore**
Restore state.

**DELETE /states/:stateId**
Delete state.

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket("ws://localhost:3000/api/ws");

ws.on("message", (data) => {
  const message = JSON.parse(data);
  // Handle message
});
```

### Message Format

```javascript
{
  type: 'event-type',
  system: 'system-name',
  data: { /* event data */ },
  timestamp: 1696204800000
}
```

### Event Types

- `system-status`: System status update
- `operation-complete`: Operation completed
- `operation-failed`: Operation failed
- `swarm-update`: Swarm metrics update
- `alert`: System alert

---

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

For more information, see:

- [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) - Development guide
- [INTEGRATION-GUIDE.md](./INTEGRATION-GUIDE.md) - Integration patterns
