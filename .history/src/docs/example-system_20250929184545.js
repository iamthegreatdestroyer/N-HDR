/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Enhanced code example system.
 */

const fs = require('fs').promises;
const path = require('path');
const prettier = require('prettier');
const hljs = require('highlight.js');

class ExampleSystem {
  /**
   * Create new example system instance
   * @param {Object} options - Example system options
   */
  constructor(options = {}) {
    this.options = {
      examplesDir: options.examplesDir || path.join(process.cwd(), 'examples'),
      categories: options.categories || [
        'initialization',
        'consciousness',
        'quantum',
        'security',
        'swarm',
        'integration',
        'advanced'
      ],
      runnable: options.runnable !== false,
      copyButton: options.copyButton !== false,
      ...options
    };

    this.examples = new Map();
    this.categories = new Map();
    this.tags = new Map();
  }

  /**
   * Initialize example system
   */
  async initialize() {
    await this._ensureDirectory(this.options.examplesDir);
    await this._loadExamples();
  }

  /**
   * Add new example
   * @param {Object} example - Example definition
   */
  async addExample(example) {
    this._validateExample(example);
    const id = this._generateId(example);

    // Format code
    const formattedCode = await this._formatCode(example.code);
    
    // Create example object
    const exampleObj = {
      id,
      title: example.title,
      description: example.description,
      category: example.category,
      tags: example.tags || [],
      code: formattedCode,
      highlighted: hljs.highlight(formattedCode, { language: 'javascript' }).value,
      runnable: example.runnable !== false && this.options.runnable,
      dependencies: example.dependencies || [],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    // Save example
    this.examples.set(id, exampleObj);

    // Update categories
    if (!this.categories.has(example.category)) {
      this.categories.set(example.category, new Set());
    }
    this.categories.get(example.category).add(id);

    // Update tags
    for (const tag of example.tags || []) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag).add(id);
    }

    // Save to file
    await this._saveExample(exampleObj);

    return id;
  }

  /**
   * Get example by ID
   * @param {string} id - Example ID
   * @returns {Object} Example object
   */
  getExample(id) {
    const example = this.examples.get(id);
    if (!example) {
      throw new Error(`Example not found: ${id}`);
    }
    return example;
  }

  /**
   * Get examples by category
   * @param {string} category - Category name
   * @returns {Array<Object>} Array of examples
   */
  getExamplesByCategory(category) {
    const ids = this.categories.get(category);
    if (!ids) {
      return [];
    }
    return Array.from(ids).map(id => this.getExample(id));
  }

  /**
   * Get examples by tag
   * @param {string} tag - Tag name
   * @returns {Array<Object>} Array of examples
   */
  getExamplesByTag(tag) {
    const ids = this.tags.get(tag);
    if (!ids) {
      return [];
    }
    return Array.from(ids).map(id => this.getExample(id));
  }

  /**
   * Search examples
   * @param {Object} query - Search query
   * @returns {Array<Object>} Array of matching examples
   */
  searchExamples(query) {
    const results = [];
    const searchText = query.text?.toLowerCase();

    for (const example of this.examples.values()) {
      if (
        (query.category && example.category !== query.category) ||
        (query.tag && !example.tags.includes(query.tag)) ||
        (searchText && !this._matchesSearch(example, searchText))
      ) {
        continue;
      }
      results.push(example);
    }

    return results;
  }

  /**
   * Get all categories
   * @returns {Array<string>} Array of category names
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Get all tags
   * @returns {Array<string>} Array of tag names
   */
  getTags() {
    return Array.from(this.tags.keys());
  }

  /**
   * Get example statistics
   * @returns {Object} Example statistics
   */
  getStatistics() {
    return {
      total: this.examples.size,
      categories: Object.fromEntries(
        Array.from(this.categories.entries()).map(([k, v]) => [k, v.size])
      ),
      tags: Object.fromEntries(
        Array.from(this.tags.entries()).map(([k, v]) => [k, v.size])
      )
    };
  }

  /**
   * Validate example definition
   * @param {Object} example - Example to validate
   * @private
   */
  _validateExample(example) {
    if (!example.title || typeof example.title !== 'string') {
      throw new Error('Example must have a title');
    }
    if (!example.code || typeof example.code !== 'string') {
      throw new Error('Example must have code');
    }
    if (!example.category || !this.options.categories.includes(example.category)) {
      throw new Error(`Invalid category: ${example.category}`);
    }
  }

  /**
   * Generate example ID
   * @param {Object} example - Example definition
   * @returns {string} Generated ID
   * @private
   */
  _generateId(example) {
    const base = example.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    let id = base;
    let counter = 1;

    while (this.examples.has(id)) {
      id = `${base}-${counter++}`;
    }

    return id;
  }

  /**
   * Format code using prettier
   * @param {string} code - Code to format
   * @returns {Promise<string>} Formatted code
   * @private
   */
  async _formatCode(code) {
    try {
      return prettier.format(code, {
        parser: 'babel',
        singleQuote: true,
        printWidth: 80
      });
    } catch (error) {
      console.warn('Failed to format code:', error);
      return code;
    }
  }

  /**
   * Save example to file
   * @param {Object} example - Example to save
   * @private
   */
  async _saveExample(example) {
    const filePath = path.join(
      this.options.examplesDir,
      example.category,
      `${example.id}.js`
    );

    await this._ensureDirectory(path.dirname(filePath));

    const content = [
      '/**',
      ' * Neural-HDR Example',
      ` * Title: ${example.title}`,
      ` * Category: ${example.category}`,
      example.tags.length > 0 ? ` * Tags: ${example.tags.join(', ')}` : null,
      ' *',
      ' * ' + example.description.split('\n').join('\n * '),
      ' */',
      '',
      example.code
    ].filter(Boolean).join('\n');

    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Load examples from files
   * @private
   */
  async _loadExamples() {
    for (const category of this.options.categories) {
      const categoryDir = path.join(this.options.examplesDir, category);
      
      try {
        const files = await fs.readdir(categoryDir);
        
        for (const file of files) {
          if (path.extname(file) === '.js') {
            const content = await fs.readFile(path.join(categoryDir, file), 'utf8');
            const example = this._parseExample(content, category);
            if (example) {
              await this.addExample(example);
            }
          }
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`Error loading examples from ${category}:`, error);
        }
      }
    }
  }

  /**
   * Parse example from file content
   * @param {string} content - File content
   * @param {string} category - Example category
   * @returns {Object} Parsed example
   * @private
   */
  _parseExample(content, category) {
    const match = content.match(/\/\*\*([\s\S]*?)\*\/\s*([\s\S]*)/);
    if (!match) return null;

    const [, comment, code] = match;
    const lines = comment.split('\n').map(line => line.trim().replace(/^\* ?/, ''));
    
    const title = lines.find(line => line.startsWith('Title:'))?.slice(6).trim();
    const tags = lines.find(line => line.startsWith('Tags:'))?.slice(5).split(',').map(t => t.trim()) || [];
    const description = lines.slice(lines.findIndex(line => !line.includes(':')) + 1).join('\n').trim();

    if (!title || !code.trim()) return null;

    return {
      title,
      description,
      category,
      tags,
      code: code.trim()
    };
  }

  /**
   * Check if example matches search text
   * @param {Object} example - Example to check
   * @param {string} searchText - Search text
   * @returns {boolean} True if matches
   * @private
   */
  _matchesSearch(example, searchText) {
    return (
      example.title.toLowerCase().includes(searchText) ||
      example.description.toLowerCase().includes(searchText) ||
      example.code.toLowerCase().includes(searchText) ||
      example.tags.some(tag => tag.toLowerCase().includes(searchText))
    );
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
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
}

module.exports = ExampleSystem;