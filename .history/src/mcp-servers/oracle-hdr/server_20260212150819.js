/**
 * ORACLE-HDR MCP Server
 * © 2025-2026 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 * 
 * Exposes ORACLE-HDR predictive intelligence as MCP tools
 * Integration with Phase 9 Q-HDR, ECHO-HDR, O-HDR
 * 
 * Phase 10: Intelligence Layer - Week 4
 */

const { McpServer, StdioServerTransport } = require('@modelcontextprotocol/sdk/server/mcp');
const pino = require('pino');
const { OracleHDR } = require('./oracle-core');

const logger = pino({ name: 'oracle-hdr-mcp' });

/**
 * OracleMcpServer - MCP interface for ORACLE-HDR
 */
class OracleMcpServer {
  constructor(config = {}) {
    this.server = new McpServer({
      name: 'oracle-hdr-prediction',
      version: '10.2.0',
      description: 'ORACLE-HDR Predictive Intelligence & Causal Modeling System',
    });
    
    this.oracle = new OracleHDR({
      maxCascadeDepth: config.maxCascadeDepth || 5,
      monteCarloIterations: config.monteCarloIterations || 1000,
      memoryIntegration: config.memoryIntegration !== false,
    });
    
    this.setupTools();
    this.setupEventHandlers();
  }
  
  /**
   * Register MCP tools
   */
  setupTools() {
    // Tool 1: Predict single consequence
    this.server.tool('oracle.predictConsequence', {
      description: 'Predict single consequence of action with confidence level',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'The action to predict consequences for'
          },
          context: {
            type: 'object',
            description: 'Additional context (historicalPrecedent, riskLevel, etc.)',
            properties: {
              historicalPrecedent: { type: 'boolean' },
              riskLevel: { type: 'number', minimum: 0, maximum: 1 },
              complexity: { type: 'number', minimum: 0, maximum: 1 },
            }
          },
          confidence: {
            type: 'number',
            description: 'Confidence level for prediction (0-1)',
            minimum: 0,
            maximum: 1,
            default: 0.7
          }
        },
        required: ['action']
      }
    }, (args) => this.handlePredictConsequence(args));
    
    // Tool 2: Trace cascade effects
    this.server.tool('oracle.traceCascade', {
      description: 'Trace nth-order cascade effects of initial action',
      inputSchema: {
        type: 'object',
        properties: {
          initialAction: {
            type: 'string',
            description: 'The initial action or intervention'
          },
          maxSteps: {
            type: 'integer',
            description: 'Maximum cascade depth (default 5)',
            minimum: 1,
            maximum: 10,
            default: 5
          },
          context: {
            type: 'object',
            description: 'Context for cascade evaluation'
          }
        },
        required: ['initialAction']
      }
    }, (args) => this.handleTraceCascade(args));
    
    // Tool 3: Monte Carlo simulation
    this.server.tool('oracle.monteCarloSimulation', {
      description: 'Run Monte Carlo simulation to estimate outcome distributions',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Action to simulate consequences for'
          },
          context: {
            type: 'object',
            description: 'Context parameters (complexity, uncertainty, etc.)',
            properties: {
              complexity: { type: 'number', minimum: 0, maximum: 1 },
              uncertainty: { type: 'number', minimum: 0, maximum: 1 },
            }
          }
        },
        required: ['action']
      }
    }, (args) => this.handleMonteCarloSimulation(args));
    
    // Tool 4: Assess risk
    this.server.tool('oracle.assessRisk', {
      description: 'Assess risk of decision across scenarios using VaR and CVaR',
      inputSchema: {
        type: 'object',
        properties: {
          decision: {
            type: 'string',
            description: 'Decision or strategy to assess'
          },
          scenarios: {
            type: 'array',
            description: 'Array of scenarios with probability and impact',
            items: {
              type: 'object',
              properties: {
                probability: { type: 'number' },
                impact: { type: 'number' },
                description: { type: 'string' }
              }
            }
          }
        },
        required: ['decision']
      }
    }, (args) => this.handleAssessRisk(args));
    
    // Tool 5: Find breaking point
    this.server.tool('oracle.findBreakingPoint', {
      description: 'Find parameter threshold where system fails or changes behavior',
      inputSchema: {
        type: 'object',
        properties: {
          parameter: {
            type: 'string',
            description: 'Parameter to analyze'
          },
          range: {
            type: 'object',
            description: 'Parameter range to search',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' }
            },
            required: ['min', 'max']
          }
        },
        required: ['parameter', 'range']
      }
    }, (args) => this.handleFindBreakingPoint(args));
    
    // Tool 6: Get status and metrics
    this.server.tool('oracle.status', {
      description: 'Get ORACLE-HDR status and prediction metrics',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }, (args) => this.handleStatus(args));
    
    // Tool 7: Get Prometheus metrics
    this.server.tool('oracle.getMetrics', {
      description: 'Get Prometheus-compatible metrics',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }, (args) => this.handleGetMetrics(args));
    
    logger.info('Registered 7 ORACLE-HDR MCP tools');
  }
  
  /**
   * Handle: oracle.predictConsequence
   */
  async handlePredictConsequence(args) {
    try {
      const prediction = this.oracle.predictConsequence(
        args.action,
        args.context || {},
        args.confidence || 0.7
      );
      
      return {
        result: {
          status: 'success',
          prediction: {
            action: prediction.action,
            probability: prediction.baselineProbability.toFixed(4),
            impact: prediction.impact.toFixed(4),
            expectedValue: prediction.expected.toFixed(4),
            confidence: prediction.confidence,
            timestamp: prediction.timestamp
          }
        }
      };
    } catch (error) {
      logger.error('Error in predictConsequence:', error);
      return {
        error: error.message
      };
    }
  }
  
  /**
   * Handle: oracle.traceCascade
   */
  async handleTraceCascade(args) {
    try {
      const cascade = this.oracle.traceCascade(
        args.initialAction,
        args.context || {},
        args.maxSteps || 5
      );
      
      return {
        result: {
          status: 'success',
          cascade: {
            initialAction: args.initialAction,
            totalNodes: cascade.totalNodes,
            maxDepth: cascade.maxDepth,
            cascadeEffect: cascade.cascadeEffect,
            summary: {
              positiveImpacts: cascade.allImpacts.filter(i => i > 0).length,
              negativeImpacts: cascade.allImpacts.filter(i => i < 0).length,
              averageImpact: (cascade.allImpacts.reduce((a, b) => a + b, 0) / cascade.allImpacts.length).toFixed(4)
            },
            treeRoot: cascade.root
          }
        }
      };
    } catch (error) {
      logger.error('Error in traceCascade:', error);
      return {
        error: error.message
      };
    }
  }
  
  /**
   * Handle: oracle.monteCarloSimulation
   */
  async handleMonteCarloSimulation(args) {
    try {
      const simulation = this.oracle.monteCarloSimulation(
        args.action,
        args.context || {}
      );
      
      return {
        result: {
          status: 'success',
          simulation: {
            action: simulation.action,
            iterations: simulation.iterations,
            successRate: simulation.successRate,
            meanImpact: simulation.meanImpact,
            percentiles: simulation.percentiles,
            interpretation: `${simulation.successRate} of simulations succeeded with average impact ${simulation.meanImpact}`
          }
        }
      };
    } catch (error) {
      logger.error('Error in monteCarloSimulation:', error);
      return {
        error: error.message
      };
    }
  }
  
  /**
   * Handle: oracle.assessRisk
   */
  async handleAssessRisk(args) {
    try {
      const assessment = this.oracle.assessRisk(
        args.decision,
        args.scenarios || []
      );
      
      return {
        result: {
          status: 'success',
          assessment: {
            decision: args.decision,
            riskLevel: assessment.interpretation.riskLevel,
            expectedValue: assessment.riskMetrics.expectedValue,
            valueAtRisk95: assessment.riskMetrics.valueAtRisk95,
            conditionalVaR95: assessment.riskMetrics.conditionalVaR95,
            standardDeviation: assessment.riskMetrics.standardDeviation,
            interpretation: assessment.interpretation.interpretation,
            scenariosAnalyzed: assessment.riskMetrics.scenarioCount
          }
        }
      };
    } catch (error) {
      logger.error('Error in assessRisk:', error);
      return {
        error: error.message
      };
    }
  }
  
  /**
   * Handle: oracle.findBreakingPoint
   */
  async handleFindBreakingPoint(args) {
    try {
      // Create simple test function if not provided
      const testFunction = (param, value) => {
        // Test function: passes if value < param
        return {
          success: value < 0.7,
          value
        };
      };
      
      const breakingPoint = this.oracle.findBreakingPoint(
        args.parameter,
        args.range,
        testFunction
      );
      
      return {
        result: {
          status: 'success',
          breakingPoint: {
            parameter: breakingPoint.parameter,
            breachPoint: breakingPoint.breachPoint.toFixed(4),
            safeRange: {
              min: breakingPoint.safeRange[0].toFixed(4),
              max: breakingPoint.safeRange[1].toFixed(4)
            },
            dangerousRange: {
              min: breakingPoint.dangerousRange[0].toFixed(4),
              max: breakingPoint.dangerousRange[1].toFixed(4)
            },
            safetyMargin: (breakingPoint.margin * 100).toFixed(1) + '%'
          }
        }
      };
    } catch (error) {
      logger.error('Error in findBreakingPoint:', error);
      return {
        error: error.message
      };
    }
  }
  
  /**
   * Handle: oracle.status
   */
  async handleStatus(args) {
    try {
      const metrics = this.oracle.getMetrics();
      
      return {
        result: {
          status: 'success',
          oracle: {
            state: 'operational',
            version: '10.2.0',
            predictionsGenerated: metrics.predictionsGenerated,
            cascadesComputed: metrics.cascadesComputed,
            causalLinksRegistered: metrics.causalLinksRegistered,
            predictionAccuracy: metrics.predictionAccuracy,
            timestamp: new Date().toISOString()
          }
        }
      };
    } catch (error) {
      logger.error('Error in status:', error);
      return {
        error: error.message
      };
    }
  }
  
  /**
   * Handle: oracle.getMetrics
   */
  async handleGetMetrics(args) {
    try {
      const metrics = this.oracle.getMetrics();
      
      // Format as Prometheus metrics
      const prometheusMetrics = [
        `# HELP oracle_predictions_total Total predictions generated`,
        `# TYPE oracle_predictions_total counter`,
        `oracle_predictions_total ${metrics.predictionsGenerated}`,
        ``,
        `# HELP oracle_cascades_computed Total cascades traced`,
        `# TYPE oracle_cascades_computed counter`,
        `oracle_cascades_computed ${metrics.cascadesComputed}`,
        ``,
        `# HELP oracle_causal_links_registered Causal relationships registered`,
        `# TYPE oracle_causal_links_registered gauge`,
        `oracle_causal_links_registered ${metrics.causalLinksRegistered}`,
        ``,
        `# HELP oracle_prediction_accuracy Accuracy of predictions (0-1)`,
        `# TYPE oracle_prediction_accuracy gauge`,
        `oracle_prediction_accuracy ${parseFloat(metrics.predictionAccuracy.accuracy) / 100}`,
      ];
      
      return {
        result: {
          status: 'success',
          prometheus: prometheusMetrics.join('\n'),
          summary: {
            predictionsGenerated: metrics.predictionsGenerated,
            cascadesComputed: metrics.cascadesComputed,
            causalLinksRegistered: metrics.causalLinksRegistered,
            predictionAccuracy: metrics.predictionAccuracy.accuracy,
            predictionCount: metrics.predictionAccuracy.totalPredictions
          }
        }
      };
    } catch (error) {
      logger.error('Error in getMetrics:', error);
      return {
        error: error.message
      };
    }
  }
  
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // No specific events from ORACLE yet, but structure ready for future integration
    logger.info('Event handlers initialized (ready for ECHO-HDR integration)');
  }
  
  /**
   * Start MCP server
   */
  async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      logger.info('ORACLE-HDR MCP server started successfully');
    } catch (error) {
      logger.error('Failed to start ORACLE-HDR MCP server:', error);
      process.exit(1);
    }
  }
}

// Entry point
if (require.main === module) {
  const server = new OracleMcpServer();
  server.start();
}

module.exports = { OracleMcpServer };
