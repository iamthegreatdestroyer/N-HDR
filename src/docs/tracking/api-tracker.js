/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * API change tracking system for monitoring and documenting API modifications.
 */

const path = require("path");
const fs = require("fs").promises;
const yaml = require("js-yaml");
const semver = require("semver");
const { diffJson } = require("diff");

class ApiTracker {
  /**
   * Create a new API tracker
   * @param {Object} options - Tracker options
   */
  constructor(options = {}) {
    this.options = {
      apiFile: ".api-spec.yml",
      changelogFile: ".api-changelog.yml",
      snapshotDir: ".api-snapshots",
      breakingChangeLevel: "major",
      featureChangeLevel: "minor",
      fixChangeLevel: "patch",
      autoSnapshot: true,
      ...options,
    };

    this.currentSpec = null;
    this.changelog = [];
  }

  /**
   * Initialize API tracker
   */
  async initialize() {
    await this._ensureDirectories();
    await this._loadSpec();
    await this._loadChangelog();
  }

  /**
   * Track API changes
   * @param {Object} newSpec - New API specification
   * @returns {Promise<Object>} Change information
   */
  async trackChanges(newSpec) {
    // Load current spec if not loaded
    if (!this.currentSpec) {
      await this._loadSpec();
    }

    // Analyze changes
    const changes = this._analyzeChanges(this.currentSpec, newSpec);

    // Determine version impact
    const versionImpact = this._determineVersionImpact(changes);

    // Create change entry
    const changeEntry = {
      timestamp: new Date().toISOString(),
      author: process.env.USER || "unknown",
      changes,
      versionImpact,
    };

    // Update changelog
    await this._addToChangelog(changeEntry);

    // Create snapshot if enabled
    if (this.options.autoSnapshot) {
      await this._createSnapshot(newSpec, changeEntry);
    }

    // Update current spec
    await this._saveSpec(newSpec);
    this.currentSpec = newSpec;

    return changeEntry;
  }

  /**
   * Get API changelog
   * @param {Object} filters - Changelog filters
   * @returns {Promise<Array>} Filtered changelog
   */
  async getChangelog(filters = {}) {
    const changelog = [...this.changelog];

    // Apply filters
    if (filters.since) {
      const sinceDate = new Date(filters.since);
      return changelog.filter(
        (entry) => new Date(entry.timestamp) >= sinceDate
      );
    }

    if (filters.author) {
      return changelog.filter((entry) => entry.author === filters.author);
    }

    if (filters.impact) {
      return changelog.filter(
        (entry) => entry.versionImpact.level === filters.impact
      );
    }

    if (filters.path) {
      return changelog.filter((entry) =>
        entry.changes.some((change) => change.path.startsWith(filters.path))
      );
    }

    return changelog;
  }

  /**
   * Get API snapshot
   * @param {string} timestamp - Snapshot timestamp
   * @returns {Promise<Object>} API snapshot
   */
  async getSnapshot(timestamp) {
    const snapshotPath = path.join(
      this.options.snapshotDir,
      `api-${timestamp}.yml`
    );

    try {
      const content = await fs.readFile(snapshotPath, "utf8");
      return yaml.load(content);
    } catch (error) {
      throw new Error(`Snapshot not found: ${timestamp}`);
    }
  }

  /**
   * Compare API versions
   * @param {string} timestamp1 - First version timestamp
   * @param {string} timestamp2 - Second version timestamp
   * @returns {Promise<Object>} Version differences
   */
  async compareVersions(timestamp1, timestamp2) {
    const spec1 = await this.getSnapshot(timestamp1);
    const spec2 = await this.getSnapshot(timestamp2);

    return this._analyzeChanges(spec1, spec2);
  }

  /**
   * Generate API changelog report
   * @param {Object} options - Report options
   * @returns {Promise<string>} Changelog report
   */
  async generateReport(options = {}) {
    const format = options.format || "markdown";
    const changelog = await this.getChangelog(options.filters || {});

    switch (format) {
      case "markdown":
        return this._generateMarkdownReport(changelog);
      case "html":
        return this._generateHtmlReport(changelog);
      case "json":
        return JSON.stringify(changelog, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Load API specification
   * @private
   */
  async _loadSpec() {
    try {
      const content = await fs.readFile(this.options.apiFile, "utf8");
      this.currentSpec = yaml.load(content);
    } catch (error) {
      // Initialize with empty spec if no file exists
      this.currentSpec = { version: "1.0.0", paths: {} };
      await this._saveSpec(this.currentSpec);
    }
  }

  /**
   * Save API specification
   * @param {Object} spec - API specification
   * @private
   */
  async _saveSpec(spec) {
    const content = yaml.dump(spec);
    await fs.writeFile(this.options.apiFile, content, "utf8");
  }

  /**
   * Load API changelog
   * @private
   */
  async _loadChangelog() {
    try {
      const content = await fs.readFile(this.options.changelogFile, "utf8");
      this.changelog = yaml.load(content) || [];
    } catch (error) {
      this.changelog = [];
      await this._saveChangelog();
    }
  }

  /**
   * Save API changelog
   * @private
   */
  async _saveChangelog() {
    const content = yaml.dump(this.changelog);
    await fs.writeFile(this.options.changelogFile, content, "utf8");
  }

  /**
   * Add entry to changelog
   * @param {Object} entry - Changelog entry
   * @private
   */
  async _addToChangelog(entry) {
    this.changelog.unshift(entry);
    await this._saveChangelog();
  }

  /**
   * Analyze API changes
   * @param {Object} oldSpec - Old API specification
   * @param {Object} newSpec - New API specification
   * @returns {Array} Changes
   * @private
   */
  _analyzeChanges(oldSpec, newSpec) {
    const changes = [];

    // Compare paths
    const allPaths = new Set([
      ...Object.keys(oldSpec.paths || {}),
      ...Object.keys(newSpec.paths || {}),
    ]);

    for (const path of allPaths) {
      const oldPath = oldSpec.paths?.[path];
      const newPath = newSpec.paths?.[path];

      if (!oldPath && newPath) {
        // New endpoint
        changes.push({
          type: "endpoint",
          action: "added",
          path,
          details: newPath,
        });
      } else if (oldPath && !newPath) {
        // Removed endpoint
        changes.push({
          type: "endpoint",
          action: "removed",
          path,
          details: oldPath,
        });
      } else if (oldPath && newPath) {
        // Compare methods
        const methodChanges = this._compareEndpointMethods(
          path,
          oldPath,
          newPath
        );
        changes.push(...methodChanges);
      }
    }

    // Compare schemas
    const schemaChanges = this._compareSchemas(
      oldSpec.components?.schemas,
      newSpec.components?.schemas
    );
    changes.push(...schemaChanges);

    return changes;
  }

  /**
   * Compare endpoint methods
   * @param {string} path - Endpoint path
   * @param {Object} oldPath - Old endpoint specification
   * @param {Object} newPath - New endpoint specification
   * @returns {Array} Method changes
   * @private
   */
  _compareEndpointMethods(path, oldPath, newPath) {
    const changes = [];
    const allMethods = new Set([
      ...Object.keys(oldPath),
      ...Object.keys(newPath),
    ]);

    for (const method of allMethods) {
      const oldMethod = oldPath[method];
      const newMethod = newPath[method];

      if (!oldMethod && newMethod) {
        // New method
        changes.push({
          type: "method",
          action: "added",
          path,
          method,
          details: newMethod,
        });
      } else if (oldMethod && !newMethod) {
        // Removed method
        changes.push({
          type: "method",
          action: "removed",
          path,
          method,
          details: oldMethod,
        });
      } else if (oldMethod && newMethod) {
        // Compare method details
        const methodChanges = this._compareMethodDetails(
          path,
          method,
          oldMethod,
          newMethod
        );
        changes.push(...methodChanges);
      }
    }

    return changes;
  }

  /**
   * Compare method details
   * @param {string} path - Endpoint path
   * @param {string} method - HTTP method
   * @param {Object} oldMethod - Old method specification
   * @param {Object} newMethod - New method specification
   * @returns {Array} Detail changes
   * @private
   */
  _compareMethodDetails(path, method, oldMethod, newMethod) {
    const changes = [];

    // Compare parameters
    const paramChanges = this._compareParameters(
      oldMethod.parameters,
      newMethod.parameters
    );

    if (paramChanges.length > 0) {
      changes.push({
        type: "parameters",
        action: "modified",
        path,
        method,
        changes: paramChanges,
      });
    }

    // Compare request body
    const requestChanges = this._compareRequestBody(
      oldMethod.requestBody,
      newMethod.requestBody
    );

    if (requestChanges.length > 0) {
      changes.push({
        type: "request",
        action: "modified",
        path,
        method,
        changes: requestChanges,
      });
    }

    // Compare responses
    const responseChanges = this._compareResponses(
      oldMethod.responses,
      newMethod.responses
    );

    if (responseChanges.length > 0) {
      changes.push({
        type: "responses",
        action: "modified",
        path,
        method,
        changes: responseChanges,
      });
    }

    return changes;
  }

  /**
   * Compare parameters
   * @param {Array} oldParams - Old parameters
   * @param {Array} newParams - New parameters
   * @returns {Array} Parameter changes
   * @private
   */
  _compareParameters(oldParams = [], newParams = []) {
    const changes = [];

    // Create parameter maps
    const oldParamMap = new Map(
      oldParams.map((param) => [`${param.in}:${param.name}`, param])
    );
    const newParamMap = new Map(
      newParams.map((param) => [`${param.in}:${param.name}`, param])
    );

    // Find added and modified parameters
    for (const [key, param] of newParamMap) {
      const oldParam = oldParamMap.get(key);
      if (!oldParam) {
        changes.push({
          type: "parameter",
          action: "added",
          name: param.name,
          in: param.in,
          details: param,
        });
      } else if (JSON.stringify(oldParam) !== JSON.stringify(param)) {
        changes.push({
          type: "parameter",
          action: "modified",
          name: param.name,
          in: param.in,
          oldDetails: oldParam,
          newDetails: param,
        });
      }
    }

    // Find removed parameters
    for (const [key, param] of oldParamMap) {
      if (!newParamMap.has(key)) {
        changes.push({
          type: "parameter",
          action: "removed",
          name: param.name,
          in: param.in,
          details: param,
        });
      }
    }

    return changes;
  }

  /**
   * Compare request body
   * @param {Object} oldBody - Old request body
   * @param {Object} newBody - New request body
   * @returns {Array} Request body changes
   * @private
   */
  _compareRequestBody(oldBody, newBody) {
    const changes = [];

    if (!oldBody && newBody) {
      changes.push({
        type: "requestBody",
        action: "added",
        details: newBody,
      });
    } else if (oldBody && !newBody) {
      changes.push({
        type: "requestBody",
        action: "removed",
        details: oldBody,
      });
    } else if (oldBody && newBody) {
      // Compare content types
      const contentChanges = this._compareContent(
        oldBody.content,
        newBody.content
      );

      if (contentChanges.length > 0) {
        changes.push({
          type: "requestBody",
          action: "modified",
          changes: contentChanges,
        });
      }
    }

    return changes;
  }

  /**
   * Compare responses
   * @param {Object} oldResponses - Old responses
   * @param {Object} newResponses - New responses
   * @returns {Array} Response changes
   * @private
   */
  _compareResponses(oldResponses = {}, newResponses = {}) {
    const changes = [];
    const allCodes = new Set([
      ...Object.keys(oldResponses),
      ...Object.keys(newResponses),
    ]);

    for (const code of allCodes) {
      const oldResponse = oldResponses[code];
      const newResponse = newResponses[code];

      if (!oldResponse && newResponse) {
        changes.push({
          type: "response",
          action: "added",
          code,
          details: newResponse,
        });
      } else if (oldResponse && !newResponse) {
        changes.push({
          type: "response",
          action: "removed",
          code,
          details: oldResponse,
        });
      } else if (oldResponse && newResponse) {
        // Compare content types
        const contentChanges = this._compareContent(
          oldResponse.content,
          newResponse.content
        );

        if (contentChanges.length > 0) {
          changes.push({
            type: "response",
            action: "modified",
            code,
            changes: contentChanges,
          });
        }
      }
    }

    return changes;
  }

  /**
   * Compare content types
   * @param {Object} oldContent - Old content
   * @param {Object} newContent - New content
   * @returns {Array} Content changes
   * @private
   */
  _compareContent(oldContent = {}, newContent = {}) {
    const changes = [];
    const allTypes = new Set([
      ...Object.keys(oldContent),
      ...Object.keys(newContent),
    ]);

    for (const type of allTypes) {
      const oldType = oldContent[type];
      const newType = newContent[type];

      if (!oldType && newType) {
        changes.push({
          type: "contentType",
          action: "added",
          contentType: type,
          details: newType,
        });
      } else if (oldType && !newType) {
        changes.push({
          type: "contentType",
          action: "removed",
          contentType: type,
          details: oldType,
        });
      } else if (oldType && newType) {
        // Compare schemas
        const schemaChanges = this._compareSchemas(
          { content: oldType.schema },
          { content: newType.schema }
        );

        if (schemaChanges.length > 0) {
          changes.push({
            type: "contentType",
            action: "modified",
            contentType: type,
            changes: schemaChanges,
          });
        }
      }
    }

    return changes;
  }

  /**
   * Compare schemas
   * @param {Object} oldSchemas - Old schemas
   * @param {Object} newSchemas - New schemas
   * @returns {Array} Schema changes
   * @private
   */
  _compareSchemas(oldSchemas = {}, newSchemas = {}) {
    const changes = [];
    const allSchemas = new Set([
      ...Object.keys(oldSchemas),
      ...Object.keys(newSchemas),
    ]);

    for (const schema of allSchemas) {
      const oldSchema = oldSchemas[schema];
      const newSchema = newSchemas[schema];

      if (!oldSchema && newSchema) {
        changes.push({
          type: "schema",
          action: "added",
          schema,
          details: newSchema,
        });
      } else if (oldSchema && !newSchema) {
        changes.push({
          type: "schema",
          action: "removed",
          schema,
          details: oldSchema,
        });
      } else if (oldSchema && newSchema) {
        const diff = diffJson(oldSchema, newSchema);
        if (diff.some((part) => part.added || part.removed)) {
          changes.push({
            type: "schema",
            action: "modified",
            schema,
            diff,
          });
        }
      }
    }

    return changes;
  }

  /**
   * Determine version impact
   * @param {Array} changes - API changes
   * @returns {Object} Version impact
   * @private
   */
  _determineVersionImpact(changes) {
    let level = "none";
    const breaking = [];
    const features = [];
    const fixes = [];

    for (const change of changes) {
      if (this._isBreakingChange(change)) {
        level = this.options.breakingChangeLevel;
        breaking.push(change);
      } else if (this._isFeatureChange(change)) {
        level = level === "none" ? this.options.featureChangeLevel : level;
        features.push(change);
      } else {
        level = level === "none" ? this.options.fixChangeLevel : level;
        fixes.push(change);
      }
    }

    return {
      level,
      breaking,
      features,
      fixes,
    };
  }

  /**
   * Check if change is breaking
   * @param {Object} change - API change
   * @returns {boolean} Whether change is breaking
   * @private
   */
  _isBreakingChange(change) {
    // Endpoint or method removal is breaking
    if (
      (change.type === "endpoint" || change.type === "method") &&
      change.action === "removed"
    ) {
      return true;
    }

    // Required parameter addition is breaking
    if (
      change.type === "parameter" &&
      change.action === "added" &&
      change.details.required
    ) {
      return true;
    }

    // Parameter removal or type change is breaking
    if (
      change.type === "parameter" &&
      (change.action === "removed" ||
        (change.action === "modified" &&
          change.oldDetails.type !== change.newDetails.type))
    ) {
      return true;
    }

    // Response schema changes are breaking
    if (
      change.type === "response" &&
      change.changes?.some((c) => c.type === "schema" && c.action !== "added")
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check if change is a feature
   * @param {Object} change - API change
   * @returns {boolean} Whether change is a feature
   * @private
   */
  _isFeatureChange(change) {
    return (
      (change.type === "endpoint" && change.action === "added") ||
      (change.type === "method" && change.action === "added") ||
      (change.type === "response" && change.action === "added") ||
      (change.type === "schema" && change.action === "added")
    );
  }

  /**
   * Generate markdown report
   * @param {Array} changelog - Changelog entries
   * @returns {string} Markdown report
   * @private
   */
  _generateMarkdownReport(changelog) {
    let report = "# API Changelog\n\n";

    for (const entry of changelog) {
      report += `## ${new Date(entry.timestamp).toISOString()}\n`;
      report += `Author: ${entry.author}\n\n`;

      if (entry.versionImpact.breaking.length > 0) {
        report += "### Breaking Changes\n\n";
        for (const change of entry.versionImpact.breaking) {
          report += this._formatChangeMarkdown(change);
        }
      }

      if (entry.versionImpact.features.length > 0) {
        report += "### New Features\n\n";
        for (const change of entry.versionImpact.features) {
          report += this._formatChangeMarkdown(change);
        }
      }

      if (entry.versionImpact.fixes.length > 0) {
        report += "### Fixes\n\n";
        for (const change of entry.versionImpact.fixes) {
          report += this._formatChangeMarkdown(change);
        }
      }

      report += "\n---\n\n";
    }

    return report;
  }

  /**
   * Generate HTML report
   * @param {Array} changelog - Changelog entries
   * @returns {string} HTML report
   * @private
   */
  _generateHtmlReport(changelog) {
    let report = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>API Changelog</title>
        <style>
          body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .entry { margin-bottom: 40px; }
          .breaking { color: #dc3545; }
          .feature { color: #28a745; }
          .fix { color: #007bff; }
        </style>
      </head>
      <body>
        <h1>API Changelog</h1>
    `;

    for (const entry of changelog) {
      report += `
        <div class="entry">
          <h2>${new Date(entry.timestamp).toISOString()}</h2>
          <p>Author: ${entry.author}</p>
      `;

      if (entry.versionImpact.breaking.length > 0) {
        report += '<h3 class="breaking">Breaking Changes</h3>';
        for (const change of entry.versionImpact.breaking) {
          report += this._formatChangeHtml(change);
        }
      }

      if (entry.versionImpact.features.length > 0) {
        report += '<h3 class="feature">New Features</h3>';
        for (const change of entry.versionImpact.features) {
          report += this._formatChangeHtml(change);
        }
      }

      if (entry.versionImpact.fixes.length > 0) {
        report += '<h3 class="fix">Fixes</h3>';
        for (const change of entry.versionImpact.fixes) {
          report += this._formatChangeHtml(change);
        }
      }

      report += "<hr></div>";
    }

    report += "</body></html>";
    return report;
  }

  /**
   * Format change for markdown
   * @param {Object} change - API change
   * @returns {string} Formatted change
   * @private
   */
  _formatChangeMarkdown(change) {
    let text = "";

    switch (change.type) {
      case "endpoint":
        text += `- ${change.action.toUpperCase()} endpoint: \`${
          change.path
        }\`\n`;
        break;
      case "method":
        text += `- ${change.action.toUpperCase()} method: \`${change.method} ${
          change.path
        }\`\n`;
        break;
      case "parameter":
        text += `- ${change.action.toUpperCase()} parameter: \`${
          change.name
        }\` in ${change.in}\n`;
        break;
      case "response":
        text += `- ${change.action.toUpperCase()} response: Status ${
          change.code
        }\n`;
        break;
      case "schema":
        text += `- ${change.action.toUpperCase()} schema: \`${
          change.schema
        }\`\n`;
        break;
    }

    return text;
  }

  /**
   * Format change for HTML
   * @param {Object} change - API change
   * @returns {string} Formatted change
   * @private
   */
  _formatChangeHtml(change) {
    let text = '<div class="change">';

    switch (change.type) {
      case "endpoint":
        text += `<p>${change.action.toUpperCase()} endpoint: <code>${
          change.path
        }</code></p>`;
        break;
      case "method":
        text += `<p>${change.action.toUpperCase()} method: <code>${
          change.method
        } ${change.path}</code></p>`;
        break;
      case "parameter":
        text += `<p>${change.action.toUpperCase()} parameter: <code>${
          change.name
        }</code> in ${change.in}</p>`;
        break;
      case "response":
        text += `<p>${change.action.toUpperCase()} response: Status ${
          change.code
        }</p>`;
        break;
      case "schema":
        text += `<p>${change.action.toUpperCase()} schema: <code>${
          change.schema
        }</code></p>`;
        break;
    }

    text += "</div>";
    return text;
  }

  /**
   * Create API snapshot
   * @param {Object} spec - API specification
   * @param {Object} changeEntry - Change entry
   * @private
   */
  async _createSnapshot(spec, changeEntry) {
    const timestamp = changeEntry.timestamp.replace(/[:.]/g, "-");
    const snapshotPath = path.join(
      this.options.snapshotDir,
      `api-${timestamp}.yml`
    );

    const content = yaml.dump(spec);
    await fs.writeFile(snapshotPath, content, "utf8");
  }

  /**
   * Ensure required directories exist
   * @private
   */
  async _ensureDirectories() {
    await fs.mkdir(this.options.snapshotDir, { recursive: true });
  }
}

module.exports = ApiTracker;
