/**
 * @file Documentation Generator for N-HDR System
 * @copyright HDR Empire. Patent-pending. All rights reserved.
 */

const fs = require("fs").promises;
const path = require("path");
const jsdoc = require("jsdoc-to-markdown");

class DocumentationGenerator {
  constructor() {
    this.apiDocs = {};
    this.exampleRegistry = {};
    this.usageGuides = {};
  }

  /**
   * Generates API documentation for a specific module
   * @param {string} modulePath - Path to the module file
   * @returns {Promise<object>} Generated documentation
   */
  async generateApiDocs(modulePath) {
    try {
      const docs = await jsdoc.render({
        files: modulePath,
        configure: path.join(__dirname, "jsdoc.config.json"),
      });

      this.apiDocs[modulePath] = docs;
      return docs;
    } catch (error) {
      throw new Error(
        `Failed to generate API docs for ${modulePath}: ${error.message}`
      );
    }
  }

  /**
   * Scans the codebase for examples and patterns
   * @param {string} basePath - Base path to scan for examples
   * @returns {Promise<object>} Collected examples
   */
  async scanForExamples(basePath) {
    try {
      const files = await this.walkDirectory(basePath);
      const examples = {};

      for (const file of files) {
        const content = await fs.readFile(file, "utf8");
        const extracted = this.extractExamples(content);
        if (Object.keys(extracted).length > 0) {
          examples[file] = extracted;
        }
      }

      this.exampleRegistry = examples;
      return examples;
    } catch (error) {
      throw new Error(`Failed to scan for examples: ${error.message}`);
    }
  }

  /**
   * Extracts code examples from content
   * @private
   * @param {string} content - File content to analyze
   * @returns {object} Extracted examples
   */
  extractExamples(content) {
    const examples = {};
    const exampleRegex = /\/\*\*\s*\n\s*\* @example\s*([\s\S]*?)\*\//g;
    let match;

    while ((match = exampleRegex.exec(content)) !== null) {
      const exampleId = `example_${Object.keys(examples).length + 1}`;
      examples[exampleId] = match[1].trim();
    }

    return examples;
  }

  /**
   * Generates comprehensive usage guides
   * @param {object} config - Guide configuration
   * @returns {Promise<object>} Generated guides
   */
  async generateUsageGuides(config) {
    try {
      const guides = {};

      for (const [section, data] of Object.entries(config)) {
        guides[section] = await this.generateGuideSection(data);
      }

      this.usageGuides = guides;
      return guides;
    } catch (error) {
      throw new Error(`Failed to generate usage guides: ${error.message}`);
    }
  }

  /**
   * Recursively walks a directory to find files
   * @private
   * @param {string} dir - Directory to walk
   * @returns {Promise<string[]>} List of file paths
   */
  async walkDirectory(dir) {
    const files = await fs.readdir(dir);
    const paths = [];

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) {
        paths.push(...(await this.walkDirectory(filePath)));
      } else if (file.endsWith(".js")) {
        paths.push(filePath);
      }
    }

    return paths;
  }

  /**
   * Generates a section of the usage guide
   * @private
   * @param {object} sectionData - Data for the guide section
   * @returns {Promise<string>} Generated guide section
   */
  async generateGuideSection(sectionData) {
    try {
      const { title, content, examples } = sectionData;
      let guide = `# ${title}\n\n`;

      guide += content + "\n\n";

      if (examples) {
        guide += "## Examples\n\n";
        for (const example of examples) {
          guide += "```javascript\n" + example + "\n```\n\n";
        }
      }

      return guide;
    } catch (error) {
      throw new Error(`Failed to generate guide section: ${error.message}`);
    }
  }

  /**
   * Exports all documentation to files
   * @param {string} outputDir - Output directory for documentation
   * @returns {Promise<void>}
   */
  async exportDocumentation(outputDir) {
    try {
      await fs.mkdir(outputDir, { recursive: true });

      // Export API docs
      await fs.writeFile(
        path.join(outputDir, "api.md"),
        JSON.stringify(this.apiDocs, null, 2)
      );

      // Export example registry
      await fs.writeFile(
        path.join(outputDir, "examples.md"),
        JSON.stringify(this.exampleRegistry, null, 2)
      );

      // Export usage guides
      await fs.writeFile(
        path.join(outputDir, "guides.md"),
        JSON.stringify(this.usageGuides, null, 2)
      );
    } catch (error) {
      throw new Error(`Failed to export documentation: ${error.message}`);
    }
  }
}

module.exports = DocumentationGenerator;
