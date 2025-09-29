/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
 * technology suite. Unauthorized reproduction, distribution, or disclosure of this
 * software in whole or in part is strictly prohibited. All intellectual property
 * rights, including patent-pending technologies, are reserved.
 *
 * File: documentation-generator.js
 * Created: 2025-09-28
 * HDR Empire - Pioneering the Future of AI Consciousness
 *
 * Documentation generator component responsible for building comprehensive API docs,
 * examples, and diagrams for the N-HDR system.
 */

const fs = require("fs").promises;
const path = require("path");
const jsdoc = require("jsdoc-api");
const marked = require("marked");
const hljs = require("highlight.js");

/**
 * @class DocumentationGenerator
 * @description Generates comprehensive documentation for N-HDR system components
 */
class DocumentationGenerator {
  /**
   * Create new DocumentationGenerator
   * @param {Object} options - Generator options
   */
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || "docs",
      templatesDir: options.templatesDir || "templates",
      sourceDir: options.sourceDir || "src",
      excludePatterns: options.excludePatterns || [
        /node_modules/,
        /\.test\.js$/,
      ],
      format: options.format || "html",
      includeDiagrams: options.includeDiagrams !== false,
      includeExamples: options.includeExamples !== false,
      ...options,
    };

    // Configure marked for markdown processing
    marked.setOptions({
      highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
      headerIds: true,
      gfm: true,
    });

    this.components = new Map();
    this.examples = new Map();
    this.diagrams = new Map();
  }

  /**
   * Generate complete documentation
   * @returns {Promise<boolean>} Success status
   */
  async generateDocs() {
    try {
      // Create output directory
      await this._ensureDirectory(this.options.outputDir);

      // Parse source files
      await this._parseSourceFiles();

      // Generate component documentation
      await this._generateComponentDocs();

      // Generate API reference
      await this._generateApiReference();

      // Generate examples
      if (this.options.includeExamples) {
        await this._generateExamples();
      }

      // Generate diagrams
      if (this.options.includeDiagrams) {
        await this._generateDiagrams();
      }

      // Generate index
      await this._generateIndex();

      // Generate search index
      await this._generateSearchIndex();

      return true;
    } catch (error) {
      console.error("Documentation generation error:", error);
      return false;
    }
  }

  /**
   * Parse source files for documentation
   * @private
   */
  async _parseSourceFiles() {
    const files = await this._findSourceFiles(this.options.sourceDir);

    for (const file of files) {
      try {
        // Parse JSDoc comments
        const docs = await jsdoc.explain({ files: [file] });

        // Process each documented item
        for (const item of docs) {
          if (item.kind === "class") {
            await this._processClassDoc(item, file);
          } else if (item.kind === "function") {
            await this._processFunctionDoc(item, file);
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
  }

  /**
   * Find source files for documentation
   * @param {string} dir - Directory to search
   * @returns {Promise<Array>} Source files
   * @private
   */
  async _findSourceFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Check exclude patterns
      if (
        this.options.excludePatterns.some((pattern) => pattern.test(fullPath))
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        const subFiles = await this._findSourceFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && /\.(js|ts)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Process class documentation
   * @param {Object} doc - JSDoc documentation object
   * @param {string} file - Source file path
   * @private
   */
  async _processClassDoc(doc, file) {
    const componentId = doc.name.toLowerCase();

    // Create component documentation
    const component = {
      id: componentId,
      name: doc.name,
      description: doc.description,
      file: path.relative(this.options.sourceDir, file),
      methods: [],
      properties: [],
      examples: [],
      diagrams: [],
      source: await this._extractSource(file, doc.meta.range),
    };

    // Add to components map
    this.components.set(componentId, component);

    // Process examples if available
    if (doc.examples) {
      for (const example of doc.examples) {
        await this._processExample(componentId, example);
      }
    }
  }

  /**
   * Process function documentation
   * @param {Object} doc - JSDoc documentation object
   * @param {string} file - Source file path
   * @private
   */
  async _processFunctionDoc(doc, file) {
    const componentId = path.basename(file, ".js").toLowerCase();
    const component = this.components.get(componentId);

    if (component) {
      // Add method documentation
      const method = {
        name: doc.name,
        description: doc.description,
        params: doc.params || [],
        returns: doc.returns || [],
        examples: doc.examples || [],
        source: await this._extractSource(file, doc.meta.range),
      };

      component.methods.push(method);
    }
  }

  /**
   * Process code example
   * @param {string} componentId - Component identifier
   * @param {string} example - Example code
   * @private
   */
  async _processExample(componentId, example) {
    const exampleId = `${componentId}-${this.examples.size + 1}`;

    // Parse example code and comments
    const { code, description } = this._parseExample(example);

    // Create example documentation
    const exampleDoc = {
      id: exampleId,
      componentId,
      code,
      description,
      highlighted: hljs.highlight(code, { language: "javascript" }).value,
    };

    // Add to examples map
    this.examples.set(exampleId, exampleDoc);

    // Add to component examples
    const component = this.components.get(componentId);
    if (component) {
      component.examples.push(exampleId);
    }
  }

  /**
   * Parse example code and comments
   * @param {string} example - Raw example text
   * @returns {Object} Parsed example
   * @private
   */
  _parseExample(example) {
    const lines = example.split("\n");
    const description = [];
    const code = [];
    let inCode = false;

    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        inCode = !inCode;
        continue;
      }

      if (inCode) {
        code.push(line);
      } else {
        description.push(line);
      }
    }

    return {
      description: description.join("\n").trim(),
      code: code.join("\n").trim(),
    };
  }

  /**
   * Extract source code
   * @param {string} file - Source file path
   * @param {Array} range - Line range
   * @returns {Promise<string>} Source code
   * @private
   */
  async _extractSource(file, range) {
    const content = await fs.readFile(file, "utf8");
    const lines = content.split("\n");
    return lines.slice(range[0] - 1, range[1]).join("\n");
  }

  /**
   * Generate component documentation
   * @private
   */
  async _generateComponentDocs() {
    for (const [id, component] of this.components) {
      try {
        // Generate component page
        const content = await this._renderComponent(component);

        // Write to file
        const filePath = path.join(
          this.options.outputDir,
          "components",
          `${id}.html`
        );
        await this._ensureDirectory(path.dirname(filePath));
        await fs.writeFile(filePath, content);
      } catch (error) {
        console.error(`Error generating docs for ${id}:`, error);
      }
    }
  }

  /**
   * Generate API reference
   * @private
   */
  async _generateApiReference() {
    try {
      const content = await this._renderApiReference();
      const filePath = path.join(this.options.outputDir, "api-reference.html");
      await fs.writeFile(filePath, content);
    } catch (error) {
      console.error("Error generating API reference:", error);
    }
  }

  /**
   * Generate examples
   * @private
   */
  async _generateExamples() {
    const examplesDir = path.join(this.options.outputDir, "examples");
    await this._ensureDirectory(examplesDir);

    for (const [id, example] of this.examples) {
      try {
        // Generate example page
        const content = await this._renderExample(example);

        // Write to file
        const filePath = path.join(examplesDir, `${id}.html`);
        await fs.writeFile(filePath, content);
      } catch (error) {
        console.error(`Error generating example ${id}:`, error);
      }
    }
  }

  /**
   * Generate diagrams
   * @private
   */
  async _generateDiagrams() {
    const diagramsDir = path.join(this.options.outputDir, "diagrams");
    await this._ensureDirectory(diagramsDir);

    // Generate system architecture diagram
    await this._generateArchitectureDiagram();

    // Generate component interaction diagrams
    for (const component of this.components.values()) {
      await this._generateComponentDiagram(component);
    }
  }

  /**
   * Generate search index
   * @private
   */
  async _generateSearchIndex() {
    const searchIndex = {
      components: Array.from(this.components.values()).map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        type: "component",
      })),
      methods: [],
      examples: Array.from(this.examples.values()).map((e) => ({
        id: e.id,
        componentId: e.componentId,
        description: e.description,
        type: "example",
      })),
    };

    // Add methods to search index
    for (const component of this.components.values()) {
      for (const method of component.methods) {
        searchIndex.methods.push({
          id: `${component.id}-${method.name}`,
          componentId: component.id,
          name: method.name,
          description: method.description,
          type: "method",
        });
      }
    }

    // Write search index
    const filePath = path.join(this.options.outputDir, "search-index.json");
    await fs.writeFile(filePath, JSON.stringify(searchIndex, null, 2));
  }

  /**
   * Generate main index page
   * @private
   */
  async _generateIndex() {
    try {
      const content = await this._renderIndex();
      const filePath = path.join(this.options.outputDir, "index.html");
      await fs.writeFile(filePath, content);
    } catch (error) {
      console.error("Error generating index:", error);
    }
  }

  /**
   * Render component documentation
   * @param {Object} component - Component data
   * @returns {Promise<string>} Rendered content
   * @private
   */
  async _renderComponent(component) {
    const template = await this._loadTemplate("component");

    // Replace template variables
    return template
      .replace("{{title}}", component.name)
      .replace("{{description}}", marked(component.description))
      .replace("{{methods}}", this._renderMethods(component.methods))
      .replace("{{examples}}", this._renderExampleList(component.examples))
      .replace("{{source}}", this._renderSource(component.source));
  }

  /**
   * Render API reference
   * @returns {Promise<string>} Rendered content
   * @private
   */
  async _renderApiReference() {
    const template = await this._loadTemplate("api-reference");
    const content = Array.from(this.components.values())
      .map((component) => this._renderApiComponent(component))
      .join("\n\n");

    return template
      .replace("{{title}}", "API Reference")
      .replace("{{content}}", content);
  }

  /**
   * Render example page
   * @param {Object} example - Example data
   * @returns {Promise<string>} Rendered content
   * @private
   */
  async _renderExample(example) {
    const template = await this._loadTemplate("example");

    return template
      .replace("{{title}}", `Example: ${example.id}`)
      .replace("{{description}}", marked(example.description))
      .replace("{{code}}", example.highlighted);
  }

  /**
   * Load template file
   * @param {string} name - Template name
   * @returns {Promise<string>} Template content
   * @private
   */
  async _loadTemplate(name) {
    const filePath = path.join(this.options.templatesDir, `${name}.html`);
    return await fs.readFile(filePath, "utf8");
  }

  /**
   * Ensure directory exists
   * @param {string} dir - Directory path
   * @private
   */
  async _ensureDirectory(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }
}

module.exports = DocumentationGenerator;
