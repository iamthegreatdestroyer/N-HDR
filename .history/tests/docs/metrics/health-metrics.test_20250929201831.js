/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Tests for documentation health metrics
 */

const path = require('path');
const fs = require('fs').promises;
const HealthMetrics = require('../../src/docs/metrics/health-metrics');

describe('HealthMetrics', () => {
  let metrics;
  let testDir;
  
  beforeAll(async () => {
    testDir = path.join(__dirname, 'test-docs');
    await fs.mkdir(testDir, { recursive: true });
  });

  beforeEach(() => {
    metrics = new HealthMetrics({
      minCoverage: 70,
      minReadability: 50,
      minExampleCoverage: 60,
      minApiCoverage: 80,
      maxComplexity: 80,
      checksInterval: 1000
    });
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Health Check', () => {
    beforeEach(async () => {
      // Create test source file
      await fs.writeFile(
        path.join(testDir, 'test-class.js'),
        `/**
         * Test class documentation
         */
        class TestClass {
          /**
           * Constructor documentation
           */
          constructor() {}

          /**
           * Method documentation
           * @param {string} param - Parameter description
           * @returns {void}
           * @example
           * test.method('example');
           */
          method(param) {}
        }`
      );

      // Create test documentation file
      await fs.writeFile(
        path.join(testDir, 'test.md'),
        `# Test Documentation

This is a simple test document that explains the functionality.

## Features

- Feature 1: Simple description
- Feature 2: Another description

## Code Example

\`\`\`javascript
const test = new Test();
test.method();
\`\`\`

## API Reference

### method(param)

Performs an operation with the given parameter.

- param: string - The input parameter
- returns: void - No return value`
      );
    });

    test('runs complete health check', async () => {
      const results = await metrics.runHealthCheck();
      
      expect(results).toHaveProperty('coverage');
      expect(results).toHaveProperty('readability');
      expect(results).toHaveProperty('exampleCoverage');
      expect(results).toHaveProperty('apiCoverage');
      expect(results).toHaveProperty('complexity');
      expect(results).toHaveProperty('lastUpdate');
      expect(results).toHaveProperty('issues');
      expect(results).toHaveProperty('overallScore');
      expect(results).toHaveProperty('status');
    });

    test('monitors health continuously', done => {
      metrics.startMonitoring();
      
      setTimeout(() => {
        expect(metrics.metrics.lastUpdate).toBeTruthy();
        metrics.stopMonitoring();
        done();
      }, 1500);
    });
  });

  describe('Documentation Coverage', () => {
    test('calculates documentation coverage', async () => {
      const coverage = await metrics.checkDocumentationCoverage();
      expect(coverage).toBeGreaterThanOrEqual(0);
      expect(coverage).toBeLessThanOrEqual(100);
    });

    test('identifies undocumented classes', async () => {
      await fs.writeFile(
        path.join(testDir, 'undocumented.js'),
        'class UndocumentedClass { method() {} }'
      );
      
      await metrics.checkDocumentationCoverage();
      expect(metrics.metrics.issues).toContainEqual(
        expect.objectContaining({
          type: 'coverage',
          severity: 'high'
        })
      );
    });
  });

  describe('Readability', () => {
    test('calculates readability score', async () => {
      const score = await metrics.checkReadabilityScore();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('identifies poor readability', async () => {
      await fs.writeFile(
        path.join(testDir, 'complex.md'),
        'The utilization of the implementation methodology necessitates that urgent consideration should be applied to the systematic correlation of the anticipated fourth-generation equipment.'
      );
      
      await metrics.checkReadabilityScore();
      expect(metrics.metrics.issues).toContainEqual(
        expect.objectContaining({
          type: 'readability',
          severity: 'medium'
        })
      );
    });
  });

  describe('Example Coverage', () => {
    test('calculates example coverage', async () => {
      const coverage = await metrics.checkExampleCoverage();
      expect(coverage).toBeGreaterThanOrEqual(0);
      expect(coverage).toBeLessThanOrEqual(100);
    });

    test('identifies missing examples', async () => {
      await fs.writeFile(
        path.join(testDir, 'no-examples.js'),
        `/**
         * @param {string} param
         * @returns {void}
         */
        function noExample(param) {}`
      );
      
      await metrics.checkExampleCoverage();
      expect(metrics.metrics.issues).toContainEqual(
        expect.objectContaining({
          type: 'examples',
          severity: 'medium'
        })
      );
    });
  });

  describe('API Coverage', () => {
    test('calculates API documentation coverage', async () => {
      const coverage = await metrics.checkApiCoverage();
      expect(coverage).toBeGreaterThanOrEqual(0);
      expect(coverage).toBeLessThanOrEqual(100);
    });

    test('identifies incomplete API docs', async () => {
      await fs.writeFile(
        path.join(testDir, 'incomplete-api.js'),
        `/**
         * Incomplete documentation
         */
        function missingParams() {}`
      );
      
      await metrics.checkApiCoverage();
      expect(metrics.metrics.issues).toContainEqual(
        expect.objectContaining({
          type: 'api',
          severity: 'high'
        })
      );
    });
  });

  describe('Complexity', () => {
    test('calculates documentation complexity', async () => {
      const complexity = await metrics.checkComplexity();
      expect(complexity).toBeGreaterThanOrEqual(0);
      expect(complexity).toBeLessThanOrEqual(100);
    });

    test('identifies overly complex documentation', async () => {
      // Create deeply nested documentation
      let content = '# Level 1\n';
      for (let i = 2; i <= 6; i++) {
        content += '#'.repeat(i) + ` Level ${i}\n`;
        content += 'Complex '.repeat(20) + '\n';
        content += '```javascript\n';
        content += '  '.repeat(i) + 'if (complex) {\n';
        content += '  '.repeat(i + 1) + 'while (moreComplex) {\n';
        content += '  '.repeat(i + 2) + 'try {\n';
        content += '  '.repeat(i + 3) + '// Nested code\n';
        content += '  '.repeat(i + 2) + '} catch (e) {}\n';
        content += '  '.repeat(i + 1) + '}\n';
        content += '  '.repeat(i) + '}\n';
        content += '```\n';
      }
      
      await fs.writeFile(
        path.join(testDir, 'complex-docs.md'),
        content
      );
      
      await metrics.checkComplexity();
      expect(metrics.metrics.issues).toContainEqual(
        expect.objectContaining({
          type: 'complexity',
          severity: 'medium'
        })
      );
    });
  });

  describe('Utility Functions', () => {
    test('removes markdown syntax', () => {
      const text = '# Heading\n**bold** and *italic* with `code`';
      const clean = metrics.removeMarkdown(text);
      expect(clean).not.toContain('#');
      expect(clean).not.toContain('**');
      expect(clean).not.toContain('*');
      expect(clean).not.toContain('`');
    });

    test('counts syllables correctly', () => {
      expect(metrics.countSyllables('hello')).toBe(2);
      expect(metrics.countSyllables('documentation')).toBe(5);
      expect(metrics.countSyllables('api')).toBe(2);
    });

    test('calculates heading depth correctly', () => {
      const content = '# H1\n## H2\n### H3';
      const depth = metrics.calculateHeadingDepth(content);
      expect(depth).toBeGreaterThan(0);
      expect(depth).toBeLessThanOrEqual(100);
    });

    test('calculates code complexity correctly', () => {
      const content = '```javascript\nif (x) {\n  while (y) {\n    // nested\n  }\n}\n```';
      const complexity = metrics.calculateCodeComplexity(content);
      expect(complexity).toBeGreaterThan(0);
      expect(complexity).toBeLessThanOrEqual(100);
    });

    test('calculates terminology density correctly', () => {
      const content = 'Using camelCase and snake_case in ApiController';
      const density = metrics.calculateTerminologyDensity(content);
      expect(density).toBeGreaterThan(0);
      expect(density).toBeLessThanOrEqual(100);
    });

    test('calculates reference complexity correctly', () => {
      const content = '[Link](#ref) and [another](ref) and [^1] reference';
      const complexity = metrics.calculateReferenceComplexity(content);
      expect(complexity).toBeGreaterThan(0);
      expect(complexity).toBeLessThanOrEqual(100);
    });
  });

  describe('Status and Scoring', () => {
    test('calculates overall score correctly', () => {
      metrics.metrics = {
        coverage: 90,
        readability: 85,
        exampleCoverage: 80,
        apiCoverage: 95,
        complexity: 40
      };
      
      const score = metrics.calculateOverallScore();
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('determines correct health status', () => {
      expect(metrics.getHealthStatus(95)).toBe('excellent');
      expect(metrics.getHealthStatus(85)).toBe('good');
      expect(metrics.getHealthStatus(75)).toBe('fair');
      expect(metrics.getHealthStatus(65)).toBe('poor');
      expect(metrics.getHealthStatus(55)).toBe('critical');
    });
  });
});