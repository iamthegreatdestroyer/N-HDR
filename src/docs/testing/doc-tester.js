/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Documentation testing framework for validating code examples and snippets
 */

const fs = require("fs").promises;
import path from "path";
import vm from "vm";
import { spawn } from "child_process";
import marked from "marked";

class DocTester {
  /**
   * Create a new documentation tester
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      tempDir: ".doc-tests",
      timeout: 30000,
      nodeVersion: process.version,
      mockImports: true,
      parallelTests: true,
      keepFiles: false,
      ...options,
    };

    this.results = [];
    this.mocks = new Map();
  }

  /**
   * Run tests on documentation files
   * @param {string[]} files - Array of documentation file paths
   * @returns {Promise<Object>} Test results
   */
  async testDocumentation(files) {
    await this._setupTempDirectory();

    const testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      tests: [],
    };

    const startTime = Date.now();

    try {
      // Extract code examples from all files
      const examples = [];
      for (const file of files) {
        const fileExamples = await this._extractExamples(file);
        examples.push(...fileExamples);
      }

      testResults.total = examples.length;

      // Run tests in parallel or sequence
      if (this.options.parallelTests) {
        const promises = examples.map((example) => this._testExample(example));
        const results = await Promise.all(promises);
        testResults.tests.push(...results);
      } else {
        for (const example of examples) {
          const result = await this._testExample(example);
          testResults.tests.push(result);
        }
      }

      // Calculate statistics
      testResults.passed = testResults.tests.filter(
        (t) => t.status === "passed"
      ).length;
      testResults.failed = testResults.tests.filter(
        (t) => t.status === "failed"
      ).length;
      testResults.skipped = testResults.tests.filter(
        (t) => t.status === "skipped"
      ).length;
      testResults.duration = Date.now() - startTime;
    } finally {
      if (!this.options.keepFiles) {
        await this._cleanupTempDirectory();
      }
    }

    return testResults;
  }

  /**
   * Add mock for module import
   * @param {string} moduleName - Name of module to mock
   * @param {Object} mockImplementation - Mock implementation
   */
  addMock(moduleName, mockImplementation) {
    this.mocks.set(moduleName, mockImplementation);
  }

  /**
   * Extract code examples from documentation
   * @param {string} filePath - Path to documentation file
   * @returns {Promise<Array>} Extracted examples
   * @private
   */
  async _extractExamples(filePath) {
    const content = await fs.readFile(filePath, "utf8");
    const examples = [];

    // Parse markdown
    if (filePath.endsWith(".md")) {
      const tokens = marked.lexer(content);
      this._extractMarkdownExamples(tokens, examples, filePath);
    } else {
      // Parse JSDoc comments
      this._extractJSDocExamples(content, examples, filePath);
    }

    return examples;
  }

  /**
   * Extract examples from markdown tokens
   * @param {Array} tokens - Markdown tokens
   * @param {Array} examples - Array to store examples
   * @param {string} filePath - Source file path
   * @private
   */
  _extractMarkdownExamples(tokens, examples, filePath) {
    for (const token of tokens) {
      if (token.type === "code" && token.lang === "javascript") {
        examples.push({
          code: token.text,
          language: "javascript",
          source: filePath,
          location: token.line || 0,
        });
      }
    }
  }

  /**
   * Extract examples from JSDoc comments
   * @param {string} content - File content
   * @param {Array} examples - Array to store examples
   * @param {string} filePath - Source file path
   * @private
   */
  _extractJSDocExamples(content, examples, filePath) {
    const lines = content.split("\n");
    let inExample = false;
    let currentExample = "";
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes("@example")) {
        inExample = true;
        startLine = i + 1;
        continue;
      }

      if (inExample) {
        if (line.includes("*/") || !line.trim().startsWith("*")) {
          if (currentExample.trim()) {
            examples.push({
              code: currentExample.trim(),
              language: "javascript",
              source: filePath,
              location: startLine,
            });
          }
          inExample = false;
          currentExample = "";
        } else {
          // Remove leading asterisk and space
          currentExample += line.replace(/^\s*\*\s?/, "") + "\n";
        }
      }
    }
  }

  /**
   * Test a single code example
   * @param {Object} example - Code example to test
   * @returns {Promise<Object>} Test result
   * @private
   */
  async _testExample(example) {
    const result = {
      source: example.source,
      location: example.location,
      status: "pending",
      duration: 0,
      error: null,
    };

    const startTime = Date.now();

    try {
      const testFile = await this._createTestFile(example);
      await this._runTest(testFile);

      result.status = "passed";
    } catch (error) {
      result.status = "failed";
      result.error = {
        message: error.message,
        stack: error.stack,
      };
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Create temporary test file
   * @param {Object} example - Code example
   * @returns {Promise<string>} Path to test file
   * @private
   */
  async _createTestFile(example) {
    const filename = `test-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.js`;
    const filePath = path.join(this.options.tempDir, filename);

    // Add mocks if enabled
    let content = "";
    if (this.options.mockImports) {
      content += this._generateMockCode();
    }

    // Add example code
    content += example.code;

    await fs.writeFile(filePath, content);
    return filePath;
  }

  /**
   * Generate mock implementation code
   * @returns {string} Mock code
   * @private
   */
  _generateMockCode() {
    let code = "";

    for (const [moduleName, implementation] of this.mocks) {
      code += `const ${moduleName} = ${JSON.stringify(implementation)};\n`;
    }

    return code;
  }

  /**
   * Run test file
   * @param {string} testFile - Path to test file
   * @returns {Promise<void>}
   * @private
   */
  async _runTest(testFile) {
    return new Promise((resolve, reject) => {
      const child = spawn("node", [testFile], {
        timeout: this.options.timeout,
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data;
      });

      child.stderr.on("data", (data) => {
        stderr += data;
      });

      child.on("error", (error) => {
        reject(error);
      });

      child.on("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          const error = new Error(stderr || "Test failed");
          error.stdout = stdout;
          error.stderr = stderr;
          error.code = code;
          reject(error);
        }
      });
    });
  }

  /**
   * Set up temporary directory
   * @returns {Promise<void>}
   * @private
   */
  async _setupTempDirectory() {
    await fs.mkdir(this.options.tempDir, { recursive: true });
  }

  /**
   * Clean up temporary directory
   * @returns {Promise<void>}
   * @private
   */
  async _cleanupTempDirectory() {
    await fs.rm(this.options.tempDir, { recursive: true, force: true });
  }

  /**
   * Generate test report
   * @param {Object} results - Test results
   * @returns {string} Formatted report
   */
  generateReport(results, format = "markdown") {
    switch (format) {
      case "markdown":
        return this._generateMarkdownReport(results);
      case "html":
        return this._generateHtmlReport(results);
      case "json":
        return JSON.stringify(results, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate markdown report
   * @param {Object} results - Test results
   * @returns {string} Markdown report
   * @private
   */
  _generateMarkdownReport(results) {
    let report = "# Documentation Test Report\n\n";

    report += `## Summary\n\n`;
    report += `- Total Tests: ${results.total}\n`;
    report += `- Passed: ${results.passed}\n`;
    report += `- Failed: ${results.failed}\n`;
    report += `- Skipped: ${results.skipped}\n`;
    report += `- Duration: ${results.duration}ms\n\n`;

    if (results.failed > 0) {
      report += `## Failures\n\n`;
      for (const test of results.tests) {
        if (test.status === "failed") {
          report += `### ${test.source}:${test.location}\n\n`;
          report += `\`\`\`\n${test.error.message}\n${test.error.stack}\n\`\`\`\n\n`;
        }
      }
    }

    return report;
  }

  /**
   * Generate HTML report
   * @param {Object} results - Test results
   * @returns {string} HTML report
   * @private
   */
  _generateHtmlReport(results) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Documentation Test Report</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .summary { margin-bottom: 20px; }
    .passed { color: #28a745; }
    .failed { color: #dc3545; }
    .skipped { color: #ffc107; }
    .error { background: #f8d7da; padding: 10px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Documentation Test Report</h1>

  <div class="summary">
    <h2>Summary</h2>
    <p>Total Tests: ${results.total}</p>
    <p class="passed">Passed: ${results.passed}</p>
    <p class="failed">Failed: ${results.failed}</p>
    <p class="skipped">Skipped: ${results.skipped}</p>
    <p>Duration: ${results.duration}ms</p>
  </div>

  ${
    results.failed > 0
      ? `
  <div class="failures">
    <h2>Failures</h2>
    ${results.tests
      .filter((test) => test.status === "failed")
      .map(
        (test) => `
        <div class="error">
          <h3>${test.source}:${test.location}</h3>
          <pre>${test.error.message}\n${test.error.stack}</pre>
        </div>
      `
      )
      .join("")}
  </div>
  `
      : ""
  }
</body>
</html>`;
  }
}

export default DocTester;
