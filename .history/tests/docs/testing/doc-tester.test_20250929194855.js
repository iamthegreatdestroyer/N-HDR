/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Tests for documentation testing framework
 */

const fs = require("fs").promises;
const path = require("path");
const { expect } = require("chai");
const DocTester = require("../../../src/docs/testing/doc-tester");

describe("DocTester", () => {
  let tester;
  const tempDir = path.join(__dirname, "../../temp/doc-tester");

  beforeEach(async () => {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });

    // Initialize tester with temp directory
    tester = new DocTester({
      tempDir: path.join(tempDir, ".doc-tests"),
      keepFiles: true, // Keep files for test verification
    });
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("example extraction", () => {
    it("should extract examples from markdown files", async () => {
      const mdPath = path.join(tempDir, "test.md");
      const content = `
# Test Document

Here's an example:

\`\`\`javascript
const x = 1;
console.log(x);
\`\`\`

And another:

\`\`\`javascript
const y = 2;
console.log(y);
\`\`\`
`;
      await fs.writeFile(mdPath, content);

      const results = await tester.testDocumentation([mdPath]);
      expect(results.total).to.equal(2);
    });

    it("should extract examples from JSDoc comments", async () => {
      const jsPath = path.join(tempDir, "test.js");
      const content = `
/**
 * Test function
 * @example
 * const x = 1;
 * console.log(x);
 */
function test() {}

/**
 * Another function
 * @example
 * const y = 2;
 * console.log(y);
 */
function another() {}
`;
      await fs.writeFile(jsPath, content);

      const results = await tester.testDocumentation([jsPath]);
      expect(results.total).to.equal(2);
    });
  });

  describe("test execution", () => {
    it("should pass valid examples", async () => {
      const mdPath = path.join(tempDir, "test.md");
      const content = `
\`\`\`javascript
const x = 1;
console.log(x);
\`\`\`
`;
      await fs.writeFile(mdPath, content);

      const results = await tester.testDocumentation([mdPath]);
      expect(results.passed).to.equal(1);
      expect(results.failed).to.equal(0);
    });

    it("should fail invalid examples", async () => {
      const mdPath = path.join(tempDir, "test.md");
      const content = `
\`\`\`javascript
throw new Error('Test error');
\`\`\`
`;
      await fs.writeFile(mdPath, content);

      const results = await tester.testDocumentation([mdPath]);
      expect(results.passed).to.equal(0);
      expect(results.failed).to.equal(1);
    });

    it("should handle syntax errors", async () => {
      const mdPath = path.join(tempDir, "test.md");
      const content = `
\`\`\`javascript
const x = {;
\`\`\`
`;
      await fs.writeFile(mdPath, content);

      const results = await tester.testDocumentation([mdPath]);
      expect(results.passed).to.equal(0);
      expect(results.failed).to.equal(1);
      expect(results.tests[0].error.message).to.include("SyntaxError");
    });

    it("should respect timeout option", async () => {
      tester = new DocTester({
        tempDir: path.join(tempDir, ".doc-tests"),
        timeout: 100, // Very short timeout
      });

      const mdPath = path.join(tempDir, "test.md");
      const content = `
\`\`\`javascript
while(true) {}
\`\`\`
`;
      await fs.writeFile(mdPath, content);

      const results = await tester.testDocumentation([mdPath]);
      expect(results.failed).to.equal(1);
      expect(results.tests[0].error.message).to.include("timeout");
    });
  });

  describe("mocking", () => {
    it("should support module mocking", async () => {
      tester.addMock("fs", {
        readFileSync: () => "mocked content",
      });

      const mdPath = path.join(tempDir, "test.md");
      const content = `
\`\`\`javascript
const content = fs.readFileSync('test.txt');
console.log(content);
\`\`\`
`;
      await fs.writeFile(mdPath, content);

      const results = await tester.testDocumentation([mdPath]);
      expect(results.passed).to.equal(1);
    });

    it("should handle complex mocks", async () => {
      tester.addMock("SwarmController", {
        start: () => Promise.resolve(),
        stop: () => Promise.resolve(),
        swarmManager: {
          bots: [1, 2, 3],
        },
      });

      const mdPath = path.join(tempDir, "test.md");
      const content = `
\`\`\`javascript
const controller = SwarmController;
await controller.start();
console.log(controller.swarmManager.bots.length);
await controller.stop();
\`\`\`
`;
      await fs.writeFile(mdPath, content);

      const results = await tester.testDocumentation([mdPath]);
      expect(results.passed).to.equal(1);
    });
  });

  describe("parallel execution", () => {
    it("should run tests in parallel", async () => {
      const mdPath = path.join(tempDir, "test.md");
      const content = `
\`\`\`javascript
console.log('Test 1');
\`\`\`

\`\`\`javascript
console.log('Test 2');
\`\`\`

\`\`\`javascript
console.log('Test 3');
\`\`\`
`;
      await fs.writeFile(mdPath, content);

      const results = await tester.testDocumentation([mdPath]);
      expect(results.total).to.equal(3);
      expect(results.passed).to.equal(3);
    });
  });

  describe("report generation", () => {
    let results;

    beforeEach(async () => {
      const mdPath = path.join(tempDir, "test.md");
      const content = `
\`\`\`javascript
console.log('Pass');
\`\`\`

\`\`\`javascript
throw new Error('Fail');
\`\`\`
`;
      await fs.writeFile(mdPath, content);
      results = await tester.testDocumentation([mdPath]);
    });

    it("should generate markdown report", () => {
      const report = tester.generateReport(results, "markdown");
      expect(report).to.include("# Documentation Test Report");
      expect(report).to.include("Total Tests: 2");
      expect(report).to.include("Passed: 1");
      expect(report).to.include("Failed: 1");
    });

    it("should generate HTML report", () => {
      const report = tester.generateReport(results, "html");
      expect(report).to.include("<!DOCTYPE html>");
      expect(report).to.include("Documentation Test Report");
      expect(report).to.include("Total Tests: 2");
    });

    it("should generate JSON report", () => {
      const report = tester.generateReport(results, "json");
      const parsed = JSON.parse(report);
      expect(parsed.total).to.equal(2);
      expect(parsed.passed).to.equal(1);
      expect(parsed.failed).to.equal(1);
    });

    it("should reject invalid report format", () => {
      expect(() => tester.generateReport(results, "invalid")).to.throw(
        "Unsupported format: invalid"
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty files", async () => {
      const mdPath = path.join(tempDir, "empty.md");
      await fs.writeFile(mdPath, "");

      const results = await tester.testDocumentation([mdPath]);
      expect(results.total).to.equal(0);
    });

    it("should handle missing files", async () => {
      let error;
      try {
        await tester.testDocumentation(["non-existent.md"]);
      } catch (e) {
        error = e;
      }
      expect(error).to.exist;
    });

    it("should handle non-JavaScript code blocks", async () => {
      const mdPath = path.join(tempDir, "test.md");
      const content = `
\`\`\`python
print("Hello")
\`\`\`
`;
      await fs.writeFile(mdPath, content);

      const results = await tester.testDocumentation([mdPath]);
      expect(results.total).to.equal(0);
    });
  });
});
