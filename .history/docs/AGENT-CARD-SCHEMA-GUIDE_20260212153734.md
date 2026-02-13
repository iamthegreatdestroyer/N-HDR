# Agent Card Schema & Discovery - Developer Guide

**Version:** 10.6  
**Module:** `hdr-empire/agent-card`  
**Status:** Stable

---

## Overview

Agent Cards are standardized capability advertisements for evolved agents. They enable:

- **Discovery**: Find agents by specialization and capability
- **Interoperability**: Standard interface for all agents
- **Verification**: Validated fitness and provenance claims
- **Integration**: MCP-based capability publication

---

## Agent Card Structure

### Complete Schema

```javascript
{
  // Identification
  id: string,                        // UUID
  name: string,                      // Human-readable name
  version: string,                   // Semantic version

  // Genetic Information
  genetic_lineage: {
    original_agent_id: string,       // Root ancestor
    parent_ids: string[],            // Direct parents
    generation: number,              // Breeding iterations
    fitness_score: number,           // Final evaluation (0-1)
    specialization: string,          // Primary domain
    traits: {
      analytical_power: number,      // 0-1
      creativity: number,            // 0-1
      communication: number,         // 0-1
      resilience: number,            // 0-1
      learning_rate: number          // 0-1
    }
  },

  // Capabilities
  mcp_server: {
    protocol: string,               // "stdio" or "sse" or "http"
    command: string,                // e.g., "stdio://genesis"
    env?: object,                   // Environment variables
    timeout?: number                // Response timeout (ms)
  },

  capabilities: [
    {
      name: string,                 // e.g., "analyze_data"
      description: string,
      input_schema: JSONSchema,
      output_schema: JSONSchema,
      performance_metrics: {
        avgLatency: number,          // ms
        throughput: number,          // ops/sec
        errorRate: number            // 0-1
      }
    }
  ],

  // Classification
  tags: string[],                   // e.g., ["optimization", "fast"]
  category: string,                 // Primary domain
  subcategory: string[],            // Secondary domains
  
  // Metadata
  metadata: {
    description: string,
    author: string,
    created_at: number,             // Timestamp
    trained_for: string,            // Target domain
    training_data_size: number,
    training_time_ms: number,
    certification_level: string,    // "draft", "beta", "stable", "production"
    sla?: {
      availability: number,         // 0-1 (e.g., 0.999)
      latency_p99: number,          // ms
      errorRate: number             // 0-1
    }
  },

  // Resource Requirements
  requirements: {
    min_memory_mb: number,
    recommended_memory_mb: number,
    min_cpu_cores: number,
    estimated_per_request_ms: number,
    concurrent_request_limit: number
  },

  // Validation
  validation: {
    schema_version: string,         // "1.0"
    json_schema_valid: boolean,
    required_fields_present: boolean,
    capability_count: number
  },

  // Publishing
  registry: {
    published_at: number,           // Timestamp
    published_by: string,           // Username/entity
    discovery_endpoint: string,     // URL for registry
    health_check_url?: string,
    last_validation: number         // Timestamp
  }
}
```

---

## Creating Agent Cards

### Using AgentCardFactory

```javascript
const { AgentCardFactory, AgentCardValidator } = require('hdr-empire/agent-card');

// Create from evolved agent
const card = AgentCardFactory.createGenesisCard(agent, 'stdio://genesis', {
  tags: ['optimization', 'high-performance'],
  specialization: 'data_analysis',
  
  capabilities: [
    {
      name: 'analyze_patterns',
      description: 'Identify patterns in datasets',
      input_schema: {
        type: 'object',
        properties: {
          data: { type: 'array' },
          threshold: { type: 'number', minimum: 0, maximum: 1 }
        },
        required: ['data']
      },
      output_schema: {
        type: 'object',
        properties: {
          patterns: { type: 'array' },
          confidence: { type: 'number' }
        }
      }
    },
    {
      name: 'generate_insights',
      description: 'Generate actionable insights',
      input_schema: { /* ... */ },
      output_schema: { /* ... */ }
    }
  ],

  metadata: {
    description: 'High-performance pattern analyzer evolved for efficiency',
    author: 'GENESIS-HDR v10.6',
    trained_for: 'data_science',
    certification_level: 'stable'
  },

  requirements: {
    min_memory_mb: 256,
    recommended_memory_mb: 512,
    min_cpu_cores: 2,
    concurrent_request_limit: 10
  },

  sla: {
    availability: 0.999,
    latency_p99: 250,
    errorRate: 0.001
  }
});
```

---

### Minimal Card (Draft)

```javascript
const minimalCard = AgentCardFactory.createGenesisCard(agent, 'stdio://genesis', {
  tags: ['experimental'],
  capabilities: [
    {
      name: 'core_capability',
      description: 'Primary function',
      input_schema: { type: 'object' },
      output_schema: { type: 'object' }
    }
  ]
});

// Auto-populated fields:
// - id: UUID
// - genetic_lineage: from agent object
// - validation: auto-checked
// - registry.published_at: current time
```

---

## Validation

### Full Validation

```javascript
const validator = new AgentCardValidator();
const result = validator.validateCard(card);

if (result.valid) {
  console.log('✓ Card is valid');
} else {
  console.log('✗ Validation errors:');
  result.errors.forEach(error => {
    console.log(`  - ${error.field}: ${error.message}`);
  });
  
  // Warnings (non-blocking)
  result.warnings.forEach(warn => {
    console.warn(`  ⚠ ${warn.field}: ${warn.message}`);
  });
}
```

**Validation Checks:**

- Schema compliance
- Required fields present
- Genetic lineage valid
- Fitness score reasonable (0-1)
- Capabilities properly defined
- Resource requirements sensible
- Tags properly formatted
- No conflicting requirements

---

### Field-Level Validation

```javascript
// Validate specific sections
const capabilityValid = validator.validateCapabilities(card.capabilities);
const requirementsValid = validator.validateRequirements(card.requirements);
const metadataValid = validator.validateMetadata(card.metadata);

console.log(`Capabilities: ${capabilityValid ? '✓' : '✗'}`);
console.log(`Requirements: ${requirementsValid ? '✓' : '✗'}`);
console.log(`Metadata: ${metadataValid ? '✓' : '✗'}`);
```

---

## Publishing to Registry

### Register a Card

```javascript
const registered = validator.registerCard(card);

console.log(`
  Status: ${registered.status}           // "published" or "draft"
  Agent ID: ${registered.id}
  Registry URL: ${registered.registry_url}
  Discovery Endpoint: ${registered.discovery_endpoint}
  Registered: ${new Date(registered.published_at).toISOString()}
`);
```

---

### Update Published Card

```javascript
// Increment generation and re-publish
card.version = '1.1.0';
card.metadata.certification_level = 'production';
card.registry.last_validation = Date.now();

const updated = validator.updateCard(card.id, card);
console.log(`Updated to ${updated.version}`);
```

---

### Revoke/Deprecate Card

```javascript
const revocation = validator.revokeCard(card.id, {
  reason: 'Critical bug in core_capability',
  replacement_id: newer_card.id,  // Optional: point to replacement
  deprecationNotice: 'Use v2.0 instead'
});

console.log(`Card revoked: ${revocation.revoked_at}`);
```

---

## Discovery & Search

### Search Cards

```javascript
const matches = validator.searchCards({
  specialization: 'data_science',
  minFitness: 0.8,
  tags: ['fast', 'accurate'],
  certificationLevel: 'production',
  limit: 20,
  sortBy: 'fitness_score'
});

console.log(`Found ${matches.length} matching agents:`);
matches.forEach(agent => {
  console.log(`
    ${agent.name} (v${agent.version})
    Fitness: ${agent.genetic_lineage.fitness_score}
    Capabilities: ${agent.capabilities.length}
    Tags: ${agent.tags.join(', ')}
  `);
});
```

---

### Advanced Search

```javascript
// Complex query with multiple criteria
const results = validator.advancedSearch({
  query: {
    fitness_score: { $gte: 0.85 },
    generation: { $lte: 50 },
    tags: { $in: ['optimization', 'analysis'] },
    'metadata.certification_level': 'production'
  },
  fields: ['name', 'fitness_score', 'tags', 'capabilities'],
  limit: 10,
  offset: 0
});

// Faceted search (get aggregates)
const facets = validator.facetedSearch({
  specialization: {},
  certification_level: {},
  tags: { limit: 10 }
});

console.log(`By specialization:`, facets.specialization);
console.log(`By cert level:`, facets.certification_level);
```

---

### Get Card by ID

```javascript
const card = validator.getCard(cardId);

if (card) {
  console.log(`Agent: ${card.name}`);
  console.log(`Fitness: ${card.genetic_lineage.fitness_score}`);
} else {
  console.log('Card not found');
}
```

---

## Integration Examples

### Complete Card Lifecycle

```javascript
const { GenesisHDR } = require('hdr-empire/genesis');
const { AgentCardFactory, AgentCardValidator } = require('hdr-empire/agent-card');

// 1. Breed an agent
const genesis = new GenesisHDR({ populationSize: 50 });
const agent = genesis.breed({
  targetFitness: 0.85,
  maxGenerations: 100
});

// 2. Create capability card
const card = AgentCardFactory.createGenesisCard(agent, 'stdio://genesis', {
  tags: ['ml', 'optimization'],
  specialization: 'ml_training',
  
  capabilities: [{
    name: 'train_model',
    description: 'Train ML models with optimized algorithms',
    input_schema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        epochs: { type: 'integer', minimum: 1 }
      }
    },
    output_schema: {
      type: 'object',
      properties: {
        accuracy: { type: 'number' },
        loss: { type: 'number' }
      }
    }
  }],

  metadata: {
    description: `High-performance model trainer (Gen ${agent.generation})`,
    author: 'GENESIS-HDR',
    trained_for: 'ml_training',
    certification_level: 'beta'
  },

  requirements: {
    min_memory_mb: 256,
    min_cpu_cores: 2
  }
});

// 3. Validate
const validator = new AgentCardValidator();
const validation = validator.validateCard(card);

if (!validation.valid) {
  console.error('Validation failed:', validation.errors);
  process.exit(1);
}

// 4. Publish
const published = validator.registerCard(card);
console.log(`✓ Published as ${published.id}`);

// 5. Search & discover
const discoveredAgents = validator.searchCards({
  specialization: 'ml_training',
  minFitness: 0.8,
  certificationLevel: 'beta'
});

console.log(`Found ${discoveredAgents.length} available ML trainers`);
```

---

### MCP Server Endpoints

Every published Agent Card provides MCP endpoints:

```javascript
// List all capabilities
GET /agents/{agentId}/capabilities

// Invoke capability
POST /agents/{agentId}/capabilities/{capabilityName}
Body: { ...input parameters... }

// Health check
GET /agents/{agentId}/health

// Metrics
GET /agents/{agentId}/metrics

// Info
GET /agents/{agentId}/info
```

---

## Best Practices

### 1. Realistic Fitness Claims

```javascript
// Good: Conservative, auditable
agent.fitnessScore = 0.82;  // Proven under specific conditions

// Problematic: Inflated claims
agent.fitnessScore = 1.0;   // No agent can achieve perfect fitness
```

---

### 2. Detailed Capability Specifications

```javascript
// Good: Clear interface contract
capability: {
  name: 'analyze_sentiment',
  description: 'Analyze text sentiment with 92% accuracy',
  input_schema: {
    type: 'object',
    properties: {
      text: { type: 'string', minLength: 1 },
      language: { type: 'string', enum: ['en', 'es', 'fr'] }
    },
    required: ['text']
  },
  output_schema: {
    type: 'object',
    properties: {
      sentiment: { enum: ['positive', 'neutral', 'negative'] },
      confidence: { type: 'number', minimum: 0, maximum: 1 }
    }
  }
}

// Avoid: Vague specs
capability: {
  name: 'analyze',
  description: 'Analyzes stuff'
  // no schemas!
}
```

---

### 3. Honest SLA Claims

```javascript
// Good: Achievable under stated conditions
sla: {
  availability: 0.999,        // 0.001% downtime = 43 min/month
  latency_p99: 500,          // 99th percentile latency
  errorRate: 0.01            // 1% error rate max
}

// Problematic: Unrealistic
sla: {
  availability: 0.9999999,   // 99.99999% is hard to achieve
  latency_p99: 1,            // 1ms is very fast
  errorRate: 0.00001         // 0.001% seems unrealistic
}
```

---

### 4. Tag Organizational Strategy

```javascript
// Good: Consistent, hierarchical
tags: [
  'optimization',              // Category
  'ml-training',              // Domain
  'high-performance',         // Characteristic
  'gpu-accelerated',          // Implementation detail
  'v10-compatible'            // Version info
]

// Avoid: Unstructured
tags: [
  'awesome',
  'fast',
  'best',
  'BEST_AGENT_EVER!!!'        // Avoid hype language
]
```

---

### 5. Genealogy Accuracy

```javascript
// Verify agent lineage is correct
if (!agent.parentIds || agent.parentIds.length === 0) {
  throw new Error('Agent must have parent information');
}

if (agent.generation && agent.generation < 0) {
  throw new Error('Invalid generation count');
}

// Store original trainer ID
card.metadata.trained_by = 'genesis-hdr-v10.6';
```

---

## Monitoring & Maintenance

### Health Check Endpoint

```javascript
GET /agents/{agentId}/health
```

**Response:**

```javascript
{
  status: 'healthy' | 'degraded' | 'offline',
  timestamp: number,
  metrics: {
    uptime: number,            // Percent
    avgLatency: number,        // ms
    errorRate: number,         // Percent
    requestsPerSecond: number,
    cpuUsage: number,          // Percent
    memoryUsage: number        // MB
  },
  lastFailure?: {
    capability: string,
    error: string,
    timestamp: number
  }
}
```

---

### Card Lifecycle Events

```javascript
// Published
{
  event: 'card:published',
  cardId: string,
  timestamp: number
}

// Used (capability invoked)
{
  event: 'capability:invoked',
  cardId: string,
  capability: string,
  latency: number,
  success: boolean,
  timestamp: number
}

// Updated
{
  event: 'card:updated',
  cardId: string,
  oldVersion: string,
  newVersion: string,
  timestamp: number
}

// Deprecated
{
  event: 'card:deprecated',
  cardId: string,
  replacementId?: string,
  timestamp: number
}
```

---

## Schema Versioning

Current schema version: **1.0**

**Future:** v1.1 will add:
- Advanced performance profiling
- Custom SLA metrics
- Fine-grained permission model
- Integration with external registries

---

## Examples

All example cards available in `/docs/examples/agent-cards/`

---

**API Version:** 10.6.0  
**Last Updated:** February 12, 2026

