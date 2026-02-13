/**
 * GENESIS-HDR: MCP Server
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 * 
 * Exposes evolutionary agent generation as discoverable MCP tools.
 * Integrates with NEXUS-HDR catalog for agent registration.
 * 
 * Phase 10: Intelligence Layer - Week 4
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio');
const pino = require('pino');
const { GenesisHDR } = require('./genesis-core');

const logger = pino({ name: 'genesis-hdr-mcp' });

/**
 * GENESIS-HDR MCP Server
 */
class GenesisMcpServer {
  constructor() {
    this.server = new McpServer(
      {
        name: 'genesis-hdr-evolution',
        version: '10.1.0',
        description: 'Evolutionary agent breeding and genetic algorithm engine. Generates specialized AI agents through fitness-based selection.',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.genesis = new GenesisHDR({
      populationSize: 50,
      generationsPerEpoch: 10,
      mutationRate: 0.15,
      tournamentSize: 5,
    });
    
    this.setupTools();
    this.setupEventHandlers();
  }
  
  /**
   * Define MCP tools exposed by this server
   */
  setupTools() {
    // Tool: Start evolution
    this.server.tool(
      'genesis.start',
      'Initiate evolutionary epoch with configuration',
      {
        type: 'object',
        properties: {
          populationSize: {
            type: 'integer',
            description: 'Number of agents per generation (default: 50)',
            default: 50,
          },
          generationsPerEpoch: {
            type: 'integer',
            description: 'Number of generations to evolve (default: 10)',
            default: 10,
          },
          mutationRate: {
            type: 'number',
            description: 'Probability of mutation for each gene (0-1, default: 0.15)',
            default: 0.15,
          },
          benchmarks: {
            type: 'array',
            description: 'Array of benchmark task definitions: [{name, weight}]',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                weight: { type: 'number', default: 1.0 },
              },
            },
            default: [],
          },
        },
      },
      async (args) => this.handleStartEvolution(args)
    );
    
    // Tool: Get evolution status
    this.server.tool(
      'genesis.status',
      'Get current evolution state and metrics',
      {
        type: 'object',
        properties: {},
      },
      async () => this.handleStatus()
    );
    
    // Tool: Get evolved specialists
    this.server.tool(
      'genesis.getSpecialists',
      'Retrieve top evolved agents by specialization',
      {
        type: 'object',
        properties: {
          topNCount: {
            type: 'integer',
            description: 'Number of top agents to return (default: 5)',
            default: 5,
          },
          domain: {
            type: 'string',
            description: 'Filter by domain specialization (optional)',
          },
        },
      },
      async (args) => this.handleGetSpecialists(args)
    );
    
    // Tool: Force breed two agents
    this.server.tool(
      'genesis.breed',
      'Perform directed crossover of two agents',
      {
        type: 'object',
        properties: {
          parentId1: {
            type: 'string',
            description: 'ID of first parent agent',
          },
          parentId2: {
            type: 'string',
            description: 'ID of second parent agent',
          },
        },
        required: ['parentId1', 'parentId2'],
      },
      async (args) => this.handleBreed(args)
    );
    
    // Tool: Get population diversity
    this.server.tool(
      'genesis.getDiversity',
      'Calculate genetic diversity of current population',
      {
        type: 'object',
        properties: {},
      },
      async () => this.handleGetDiversity()
    );
    
    // Tool: Get evolution metrics
    this.server.tool(
      'genesis.getMetrics',
      'Retrieve Prometheus-compatible evolution metrics',
      {
        type: 'object',
        properties: {},
      },
      async () => this.handleGetMetrics()
    );
    
    // Tool: Broadcast best agents to catalog
    this.server.tool(
      'genesis.broadcastBest',
      'Register top agents in NEXUS-HDR catalog',
      {
        type: 'object',
        properties: {
          topNCount: {
            type: 'integer',
            description: 'Number of top agents to broadcast (default: 5)',
            default: 5,
          },
        },
      },
      async (args) => this.handleBroadcastBest(args)
    );
    
    logger.info('GENESIS MCP tools registered');
  }
  
  /**
   * Setup event handlers for evolution lifecycle
   */
  setupEventHandlers() {
    this.genesis.on('epoch:initialized', (data) => {
      logger.info('Epoch initialized', data);
    });
    
    this.genesis.on('population:evaluated', (data) => {
      logger.info('Population evaluated', data);
    });
    
    this.genesis.on('generation:evolved', (data) => {
      logger.info('Generation evolved', data);
    });
    
    this.genesis.on('agent:broadcast', (data) => {
      logger.info('Agent broadcast to catalog', { agentId: data.id, fitness: data.fitness });
    });
    
    this.genesis.on('epoch:complete', (data) => {
      logger.info('Epoch complete', data);
    });
  }
  
  /**
   * Handle genesis.start
   */
  async handleStartEvolution(args) {
    try {
      logger.info('Starting evolution with args', args);
      
      // Configure population size
      if (args.populationSize) {
        this.genesis.config.populationSize = args.populationSize;
        this.genesis.populationManager.populationSize = args.populationSize;
      }
      
      // Configure generations
      if (args.generationsPerEpoch) {
        this.genesis.config.generationsPerEpoch = args.generationsPerEpoch;
      }
      
      // Configure mutation rate
      if (args.mutationRate) {
        this.genesis.config.mutationRate = args.mutationRate;
        this.genesis.mutationEngine.mutationRate = args.mutationRate;
      }
      
      // Register benchmark tasks (if provided)
      if (args.benchmarks && Array.isArray(args.benchmarks)) {
        for (const benchmark of args.benchmarks) {
          // Create dummy task function
          const taskFunc = async (genes, agentId) => {
            // Fitness = random (0-1) + genetic trait contribution
            const geneBonus = genes.analyticalPower * 0.3 + genes.creativityIndex * 0.2 + genes.adaptabilityScore * 0.2;
            return Math.random() * 0.5 + geneBonus * 0.5;
          };
          
          this.genesis.registerBenchmark(
            benchmark.name || `benchmark-${Math.random()}`,
            taskFunc,
            benchmark.weight || 1.0
          );
        }
      }
      
      // Run evolution epoch
      await this.genesis.runEpoch();
      
      return {
        status: 'success',
        message: 'Evolution epoch completed',
        metrics: this.genesis.evolutionMetrics,
        bestAgent: this.genesis.getBestAgentPhenotype(),
      };
      
    } catch (error) {
      logger.error({ error: error.message }, 'Evolution failed');
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
  
  /**
   * Handle genesis.status
   */
  async handleStatus() {
    const stats = this.genesis.getPopulationStats();
    return {
      state: stats.state,
      currentGeneration: stats.generation,
      populationSize: stats.populationSize,
      averageFitness: stats.avgFitness.toFixed(4),
      bestFitness: stats.bestFitness.toFixed(4),
      geneticDiversity: stats.diversity.toFixed(4),
      metrics: this.genesis.evolutionMetrics,
    };
  }
  
  /**
   * Handle genesis.getSpecialists
   */
  async handleGetSpecialists(args) {
    const topNCount = args.topNCount || 5;
    const domain = args.domain;
    
    let specialists = [...this.genesis.populationManager.population]
      .sort((a, b) => (b.fitness || 0) - (a.fitness || 0))
      .slice(0, topNCount);
    
    // Filter by domain if specified
    if (domain) {
      specialists = specialists.filter(a => a.genes.domainSpecialization === domain);
    }
    
    return {
      specialists: specialists.map(a => a.getPhenotype()),
      count: specialists.length,
      domain: domain || 'all',
    };
  }
  
  /**
   * Handle genesis.breed
   */
  async handleBreed(args) {
    try {
      // Find parent agents by ID
      const parent1 = this.genesis.populationManager.population.find(a => a.id === args.parentId1);
      const parent2 = this.genesis.populationManager.population.find(a => a.id === args.parentId2);
      
      if (!parent1 || !parent2) {
        return {
          status: 'error',
          message: 'One or both parent agents not found',
        };
      }
      
      // Perform crossover
      const newId = `agent-${this.genesis.populationManager.nextAgentId++}`;
      const offspring = this.genesis.mutationEngine.crossover(parent1, parent2, newId);
      
      // Evaluate fitness
      await this.genesis.fitnessEvaluator.evaluateAgent(offspring);
      
      return {
        status: 'success',
        offspring: offspring.getPhenotype(),
        selfitness: offspring.fitness.toFixed(4),
      };
      
    } catch (error) {
      logger.error({ error: error.message }, 'Breeding failed');
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
  
  /**
   * Handle genesis.getDiversity
   */
  async handleGetDiversity() {
    const diversity = this.genesis.calculateDiversity();
    return {
      geneticDiversity: diversity.toFixed(4),
      populationSize: this.genesis.populationManager.population.length,
      generationCount: this.genesis.populationManager.generation,
    };
  }
  
  /**
   * Handle genesis.getMetrics
   */
  async handleGetMetrics() {
    const metrics = this.genesis.evolutionMetrics;
    const stats = this.genesis.getPopulationStats();
    
    return {
      prometheus: [
        `genesis_generation_count ${metrics.generationCount}`,
        `genesis_agents_created_total ${metrics.agentsCreated}`,
        `genesis_agents_evaluated_total ${metrics.agentsEvaluated}`,
        `genesis_peak_fitness ${metrics.peakFitness.toFixed(4)}`,
        `genesis_average_fitness ${metrics.averageFitness.toFixed(4)}`,
        `genesis_genetic_diversity ${stats.diversity.toFixed(4)}`,
        `genesis_population_size ${stats.populationSize}`,
        `genesis_agents_broadcast_total ${metrics.broadcastCount}`,
      ],
      summary: {
        generations: metrics.generationCount,
        agentsCreated: metrics.agentsCreated,
        agentsEvaluated: metrics.agentsEvaluated,
        peakFitness: metrics.peakFitness,
        averageFitness: metrics.averageFitness,
        broadcastCount: metrics.broadcastCount,
      },
    };
  }
  
  /**
   * Handle genesis.broadcastBest
   */
  async handleBroadcastBest(args) {
    try {
      const topNCount = args.topNCount || 5;
      await this.genesis.broadcastBestAgents(topNCount);
      
      return {
        status: 'success',
        message: `Broadcasted top ${topNCount} agents to NEXUS-HDR catalog`,
        broadcastCount: this.genesis.evolutionMetrics.broadcastCount,
      };
      
    } catch (error) {
      logger.error({ error: error.message }, 'Broadcast failed');
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
  
  /**
   * Start MCP server
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('GENESIS-HDR MCP server started');
  }
}

// Entry point
if (require.main === module) {
  const server = new GenesisMcpServer();
  server.start().catch(error => {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  });
}

module.exports = { GenesisMcpServer };
