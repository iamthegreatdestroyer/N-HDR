/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Enhanced template engine for documentation system.
 */

const fs = require("fs").promises;
const path = require("path");
const ejs = require("ejs");

class TemplateEngine {
  /**
   * Create new template engine instance
   * @param {Object} options - Template engine options
   */
  constructor(options = {}) {
    this.options = {
      templatesDir: options.templatesDir || path.join(__dirname, "templates"),
      cache: options.cache !== false,
      defaultLayout: options.defaultLayout || "default",
      ...options,
    };

    this.templates = new Map();
    this.layouts = new Map();
  }

  /**
   * Load all templates and layouts
   */
  async loadTemplates() {
    // Load layouts
    const layoutsDir = path.join(this.options.templatesDir, "layouts");
    const layouts = await this._loadDirectory(layoutsDir);
    for (const [name, content] of Object.entries(layouts)) {
      this.layouts.set(name, ejs.compile(content, { filename: name }));
    }

    // Load templates
    const templatesDir = path.join(this.options.templatesDir, "templates");
    const templates = await this._loadDirectory(templatesDir);
    for (const [name, content] of Object.entries(templates)) {
      this.templates.set(name, ejs.compile(content, { filename: name }));
    }
  }

  /**
   * Render template with data
   * @param {string} template - Template name
   * @param {Object} data - Template data
   * @param {Object} [options] - Render options
   * @returns {Promise<string>} Rendered content
   */
  async render(template, data, options = {}) {
    const templateFn = this.templates.get(template);
    if (!templateFn) {
      throw new Error(`Template not found: ${template}`);
    }

    // Render template content
    const content = templateFn({ ...data, options: this.options });

    // Use layout if specified
    const layout = options.layout || this.options.defaultLayout;
    if (layout) {
      const layoutFn = this.layouts.get(layout);
      if (!layoutFn) {
        throw new Error(`Layout not found: ${layout}`);
      }

      return layoutFn({
        content,
        data,
        options: this.options,
      });
    }

    return content;
  }

  /**
   * Load all templates from directory
   * @param {string} dir - Directory path
   * @returns {Promise<Object>} Template map
   * @private
   */
  async _loadDirectory(dir) {
    try {
      const files = await fs.readdir(dir);
      const templates = {};

      for (const file of files) {
        if (path.extname(file) === ".ejs") {
          const name = path.basename(file, ".ejs");
          const content = await fs.readFile(path.join(dir, file), "utf8");
          templates[name] = content;
        }
      }

      return templates;
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn(`Directory not found: ${dir}`);
        return {};
      }
      throw error;
    }
  }

  /**
   * Add or update template
   * @param {string} name - Template name
   * @param {string} content - Template content
   */
  addTemplate(name, content) {
    this.templates.set(name, ejs.compile(content, { filename: name }));
  }

  /**
   * Add or update layout
   * @param {string} name - Layout name
   * @param {string} content - Layout content
   */
  addLayout(name, content) {
    this.layouts.set(name, ejs.compile(content, { filename: name }));
  }

  /**
   * Get template function
   * @param {string} name - Template name
   * @returns {Function} Template function
   */
  getTemplate(name) {
    return this.templates.get(name);
  }

  /**
   * Get layout function
   * @param {string} name - Layout name
   * @returns {Function} Layout function
   */
  getLayout(name) {
    return this.layouts.get(name);
  }
}

module.exports = TemplateEngine;
