/**
 * Agent Card Standard Schema
 * Phase 10 Intelligence Layer - Capability Publishing & Marketplace Registry
 * 
 * Defines the standard JSON Schema for agent metadata cards
 * - Capability declaration and advertising
 * - Genetic lineage for GENESIS-bred agents
 * - Performance metrics and specializations
 * - MCP server endpoint discovery
 * - Integration with NEXUS-HDR agent marketplace
 */

const Ajv = require('ajv');
const pino = require('pino');

const logger = pino({ name: 'Agent-Card-Schema', level: process.env.LOG_LEVEL || 'info' });

/**
 * Core Agent Card JSON Schema - defines agent metadata structure
 */
const AGENT_CARD_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Agent Card Schema v10.0',
  description: 'Standard metadata card for N-HDR agents',
  type: 'object',
  required: [
    'id',
    'name',
    'version',
    'specialization',
    'mcp_server',
    'registered_at'
  ],
  properties: {
    // Identity
    id: {
      type: 'string',
      description: 'Unique agent identifier (UUID)',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    },
    
    name: {
      type: 'string',
      description: 'Human-readable agent name',
      minLength: 1,
      maxLength: 255
    },
    
    version: {
      type: 'string',
      description: 'Semantic version (major.minor.patch)',
      pattern: '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$'
    },

    description: {
      type: 'string',
      description: 'Detailed description of agent purpose and capabilities',
      maxLength: 2000
    },

    // Classification & Specialization
    specialization: {
      type: 'string',
      description: 'Primary specialization domain',
      enum: [
        'evolutionary',     // GENESIS-HDR
        'predictive',       // ORACLE-HDR
        'generative',       // D-HDR
        'conscious',        // ECHO-HDR (consciousness/memory)
        'quantum',          // Q-HDR
        'observation',      // O-HDR
        'namespace',        // N-HDR
        'vault',            // VB-HDR
        'unknown'
      ]
    },

    subdomain: {
      type: 'string',
      description: 'Secondary specialization (e.g., "financial_prediction")',
      maxLength: 100
    },

    capabilities: {
      type: 'array',
      description: 'Array of capabilities/services offered',
      items: {
        type: 'object',
        required: ['name', 'mcp_tool'],
        properties: {
          name: {
            type: 'string',
            description: 'Capability name (e.g., "consequence_prediction")',
            maxLength: 100
          },
          description: {
            type: 'string',
            description: 'Capability description',
            maxLength: 500
          },
          mcp_tool: {
            type: 'string',
            description: 'MCP tool ID for invocation',
            pattern: '^[a-z0-9_-]+\\.[a-z0-9_-]+$'
          },
          input_schema: {
            type: 'object',
            description: 'JSON Schema for tool input parameters',
            additionalProperties: true
          },
          output_schema: {
            type: 'object',
            description: 'JSON Schema for tool output',
            additionalProperties: true
          },
          availability: {
            type: 'string',
            enum: ['always', 'conditional', 'scheduled'],
            default: 'always'
          }
        }
      },
      minItems: 1
    },

    // Performance & Metrics
    performance: {
      type: 'object',
      description: 'Performance characteristics',
      properties: {
        responsetime_ms: {
          type: 'number',
          description: 'Average response time in milliseconds',
          minimum: 0
        },
        accuracy: {
          type: 'number',
          description: 'Reported accuracy metric [0, 1]',
          minimum: 0,
          maximum: 1
        },
        throughput_requests_per_second: {
          type: 'number',
          description: 'Requests per second capacity',
          minimum: 0
        },
        uptime_percentage: {
          type: 'number',
          description: 'Availability/uptime percentage [0, 100]',
          minimum: 0,
          maximum: 100
        },
        reliability_score: {
          type: 'number',
          description: 'Composite reliability [0, 1]',
          minimum: 0,
          maximum: 1
        }
      }
    },

    // Genetic Lineage (for GENESIS-bred agents)
    genetic_lineage: {
      type: 'object',
      description: 'Genetic information for evolved agents',
      properties: {
        generation: {
          type: 'integer',
          description: 'Generation number in evolutionary lineage',
          minimum: 0
        },
        parent_ids: {
          type: 'array',
          description: 'UUIDs of parent agents',
          items: {
            type: 'string',
            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          },
          maxItems: 2
        },
        genetic_mutations: {
          type: 'object',
          description: 'Applied mutations (trait changes)',
          additionalProperties: {
            type: 'object',
            properties: {
              trait: { type: 'string' },
              from_value: {},
              to_value: {},
              mutation_rate: { type: 'number', minimum: 0, maximum: 1 }
            }
          }
        },
        fitness_score: {
          type: 'number',
          description: 'Fitness evaluation score',
          minimum: 0,
          maximum: 100
        }
      }
    },

    // MCP Server Registration
    mcp_server: {
      type: 'object',
      description: 'MCP server information for agent connectivity',
      required: ['endpoint', 'protocol'],
      properties: {
        endpoint: {
          type: 'string',
          description: 'MCP server endpoint URL or stdio identifier',
          minLength: 1
        },
        protocol: {
          type: 'string',
          enum: ['stdio', 'http', 'websocket', 'grpc'],
          description: 'Protocol for MCP communication'
        },
        tools_count: {
          type: 'integer',
          description: 'Number of MCP tools exposed',
          minimum: 0
        },
        resources_count: {
          type: 'integer',
          description: 'Number of MCP resources available',
          minimum: 0
        },
        discovery_enabled: {
          type: 'boolean',
          description: 'Whether agent accepts tool discovery queries',
          default: true
        },
        heartbeat_interval_seconds: {
          type: 'integer',
          description: 'Heartbeat check interval',
          minimum: 5,
          default: 30
        }
      }
    },

    // Temporal Information
    registered_at: {
      type: 'string',
      description: 'ISO 8601 registration timestamp',
      format: 'date-time'
    },

    last_updated: {
      type: 'string',
      description: 'ISO 8601 last update timestamp',
      format: 'date-time'
    },

    last_heartbeat: {
      type: 'string',
      description: 'ISO 8601 last successful heartbeat',
      format: 'date-time'
    },

    // Operational Status
    status: {
      type: 'string',
      enum: ['active', 'inactive', 'deprecated', 'maintenance', 'error'],
      description: 'Current operational status'
    },

    // Resource Requirements
    requirements: {
      type: 'object',
      description: 'Computational and environmental requirements',
      properties: {
        minimum_memory_mb: {
          type: 'integer',
          description: 'Minimum RAM requirement in MB',
          minimum: 16
        },
        gpu_required: {
          type: 'boolean',
          description: 'Whether GPU is required',
          default: false
        },
        network_required: {
          type: 'boolean',
          description: 'Whether network connectivity required',
          default: true
        },
        required_dependencies: {
          type: 'array',
          description: 'List of required system/library dependencies',
          items: { type: 'string' }
        }
      }
    },

    // Trust & Security
    trust_score: {
      type: 'number',
      description: 'Trust score based on behavior history [0, 100]',
      minimum: 0,
      maximum: 100,
      default: 50
    },

    security: {
      type: 'object',
      description: 'Security-related metadata',
      properties: {
        post_quantum_ready: {
          type: 'boolean',
          description: 'Whether cryptography is post-quantum resistant',
          default: false
        },
        access_control: {
          type: 'string',
          enum: ['open', 'restricted', 'private'],
          description: 'Access control level'
        },
        audit_enabled: {
          type: 'boolean',
          description: 'Whether tool invocations are audited',
          default: true
        }
      }
    },

    // Metadata & Classification
    tags: {
      type: 'array',
      description: 'Search/classification tags',
      items: { type: 'string', maxLength: 50 },
      maxItems: 20
    },

    owner: {
      type: 'string',
      description: 'Owner/creator identifier',
      maxLength: 255
    },

    source_system: {
      type: 'string',
      description: 'System that generated this agent (N-HDR phase)',
      enum: [
        'genesis-hdr',
        'oracle-hdr',
        'd-hdr',
        'echo-hdr',
        'q-hdr',
        'o-hdr',
        'n-hdr',
        'vb-hdr'
      ]
    },

    // Extended Metadata
    metadata: {
      type: 'object',
      description: 'Custom metadata (extensibility)',
      additionalProperties: true
    }
  },

  additionalProperties: false
};

/**
 * Agent Card Validator - validates and manages agent metadata
 */
class AgentCardValidator {
  constructor() {
    this.ajv = new Ajv({
      useDefaults: true,
      removeAdditional: true,
      verbose: true
    });
    
    this.validate = this.ajv.compile(AGENT_CARD_SCHEMA);
    this.validatedCards = new Map();
    this.validationErrors = [];
  }

  /**
   * Validate an agent card against schema
   * @param {object} card - Agent card to validate
   * @returns {object} {valid: boolean, errors: [], card: validatedCard}
   */
  validateCard(card) {
    const valid = this.validate(card);
    
    if (!valid) {
      this.validationErrors = this.validate.errors || [];
      logger.warn('Agent card validation failed', {
        card_id: card.id,
        errors: this.validationErrors
      });
      
      return {
        valid: false,
        errors: this._formatErrors(this.validate.errors),
        card: null
      };
    }

    // Validation passed - store card
    const validatedCard = { ...card };
    this.validatedCards.set(validatedCard.id, validatedCard);

    logger.info('Agent card validated', {
      card_id: validatedCard.id,
      name: validatedCard.name,
      specialization: validatedCard.specialization
    });

    return {
      valid: true,
      errors: [],
      card: validatedCard
    };
  }

  /**
   * Register a new valid agent card
   */
  registerCard(card) {
    const result = this.validateCard(card);
    if (!result.valid) {
      throw new Error(`Agent card validation failed: ${result.errors.join(', ')}`);
    }

    // Ensure timestamps
    result.card.registered_at = result.card.registered_at || new Date().toISOString();
    result.card.last_updated = new Date().toISOString();
    result.card.status = result.card.status || 'active';

    return result.card;
  }

  /**
   * Update existing card
   */
  updateCard(cardId, updates) {
    const existing = this.validatedCards.get(cardId);
    if (!existing) {
      throw new Error(`Card ${cardId} not found`);
    }

    const updated = { ...existing, ...updates, last_updated: new Date().toISOString() };
    return this.validateCard(updated);
  }

  /**
   * Get card by ID
   */
  getCard(cardId) {
    return this.validatedCards.get(cardId) || null;
  }

  /**
   * Search cards by criteria
   */
  searchCards(criteria = {}) {
    const results = [];

    for (const card of this.validatedCards.values()) {
      let matches = true;

      if (criteria.specialization && card.specialization !== criteria.specialization) {
        matches = false;
      }
      if (criteria.tag && (!card.tags || !card.tags.includes(criteria.tag))) {
        matches = false;
      }
      if (criteria.status && card.status !== criteria.status) {
        matches = false;
      }
      if (criteria.minFitness && card.genetic_lineage?.fitness_score < criteria.minFitness) {
        matches = false;
      }

      if (matches) {
        results.push(card);
      }
    }

    return results;
  }

  /**
   * Get statistics about registered cards
   */
  getStatistics() {
    const cards = Array.from(this.validatedCards.values());
    const specializations = {};
    let totalFitness = 0;
    let fitnessSamples = 0;

    for (const card of cards) {
      const spec = card.specialization;
      specializations[spec] = (specializations[spec] || 0) + 1;

      if (card.genetic_lineage?.fitness_score) {
        totalFitness += card.genetic_lineage.fitness_score;
        fitnessSamples++;
      }
    }

    return {
      total_cards: cards.length,
      specializations: specializations,
      active_cards: cards.filter(c => c.status === 'active').length,
      average_fitness: fitnessSamples > 0 ? (totalFitness / fitnessSamples).toFixed(2) : 0,
      average_trust_score: cards.length > 0
        ? (cards.reduce((sum, c) => sum + (c.trust_score || 50), 0) / cards.length).toFixed(2)
        : 0
    };
  }

  _formatErrors(errors) {
    return errors.map(e => `${e.dataPath}: ${e.message}`);
  }
}

/**
 * Agent Card Factory - creates valid agent cards from components
 */
class AgentCardFactory {
  /**
   * Create card for GENESIS-bred agent
   */
  static createGenesisCard(agent, mcpEndpoint) {
    return {
      id: agent.id || require('crypto').randomUUID(),
      name: agent.name || `Genesis-Agent-${Date.now()}`,
      version: '10.0.0',
      specialization: 'evolutionary',
      description: `GENESIS-HDR bred agent from generation ${agent.generation || 0}`,
      
      capabilities: [
        {
          name: 'genetic_breeding',
          description: 'Can participate in evolutionary breeding',
          mcp_tool: 'genesis.breed'
        }
      ],

      performance: {
        accuracy: agent.fitnessScore || 0.5,
        reliability_score: 0.9
      },

      genetic_lineage: {
        generation: agent.generation || 0,
        parent_ids: agent.parents || [],
        fitness_score: (agent.fitnessScore || 0) * 100,
        genetic_mutations: agent.mutations || {}
      },

      mcp_server: {
        endpoint: mcpEndpoint,
        protocol: 'stdio',
        discovery_enabled: true
      },

      source_system: 'genesis-hdr',
      registered_at: new Date().toISOString(),
      status: 'active'
    };
  }

  /**
   * Create card for ORACLE-derived agent
   */
  static createOracleCard(predictions, mcpEndpoint) {
    return {
      id: require('crypto').randomUUID(),
      name: `Oracle-Agent-${Date.now()}`,
      version: '10.0.0',
      specialization: 'predictive',
      description: 'ORACLE-HDR predictive intelligence agent',

      capabilities: [
        {
          name: 'consequence_prediction',
          description: 'Predict action consequences',
          mcp_tool: 'oracle.predictConsequence'
        },
        {
          name: 'cascade_analysis',
          description: 'Trace cascade effects',
          mcp_tool: 'oracle.traceCascade'
        },
        {
          name: 'risk_assessment',
          description: 'Assess decision risk',
          mcp_tool: 'oracle.assessRisk'
        }
      ],

      performance: {
        accuracy: 0.72,
        reliability_score: 0.88
      },

      mcp_server: {
        endpoint: mcpEndpoint,
        protocol: 'stdio',
        tools_count: 7,
        discovery_enabled: true
      },

      source_system: 'oracle-hdr',
      registered_at: new Date().toISOString(),
      status: 'active'
    };
  }
}

module.exports = {
  AGENT_CARD_SCHEMA,
  AgentCardValidator,
  AgentCardFactory
};
