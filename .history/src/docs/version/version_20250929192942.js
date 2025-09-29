/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Documentation versioning system for tracking changes and maintaining history.
 */

const semver = require("semver");
const fs = require("fs").promises;
const path = require("path");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const yaml = require("js-yaml");

class DocumentationVersion {
  /**
   * Create a new documentation version manager
   * @param {Object} options - Version manager options
   */
  constructor(options = {}) {
    this.options = {
      versionFile: ".docs-version.yml",
      historyFile: ".docs-history.yml",
      backupDir: ".docs-backup",
      gitIntegration: true,
      autoBackup: true,
      ...options,
    };

    this.currentVersion = null;
    this.history = [];
  }

  /**
   * Initialize version manager
   */
  async initialize() {
    await this._ensureDirectories();
    await this._loadVersion();
    await this._loadHistory();
  }

  /**
   * Create new documentation version
   * @param {string} type - Version update type (major|minor|patch)
   * @param {Object} documentation - Documentation content
   * @returns {Promise<Object>} New version info
   */
  async createVersion(type, documentation) {
    // Load current version if not loaded
    if (!this.currentVersion) {
      await this._loadVersion();
    }

    // Calculate new version
    const newVersion = semver.inc(this.currentVersion.version, type);

    // Create version entry
    const versionEntry = {
      version: newVersion,
      timestamp: new Date().toISOString(),
      author: process.env.USER || "unknown",
      changes: [],
      metadata: documentation.metadata || {},
    };

    // Calculate changes from previous version
    if (this.currentVersion) {
      versionEntry.changes = await this._calculateChanges(
        this.currentVersion,
        documentation
      );
    }

    // Backup current version
    if (this.options.autoBackup) {
      await this._backupVersion(this.currentVersion);
    }

    // Update version file
    await this._saveVersion(versionEntry);

    // Update history
    await this._addToHistory(versionEntry);

    // Git integration
    if (this.options.gitIntegration) {
      await this._commitVersion(versionEntry);
    }

    this.currentVersion = versionEntry;
    return versionEntry;
  }

  /**
   * Get version history
   * @param {Object} filters - History filters
   * @returns {Promise<Array>} Version history
   */
  async getHistory(filters = {}) {
    const history = [...this.history];

    // Apply filters
    if (filters.since) {
      const sinceDate = new Date(filters.since);
      history.filter((entry) => new Date(entry.timestamp) >= sinceDate);
    }

    if (filters.author) {
      history.filter((entry) => entry.author === filters.author);
    }

    if (filters.version) {
      if (filters.version.startsWith("^")) {
        const major = semver.major(filters.version.slice(1));
        history.filter((entry) => semver.major(entry.version) === major);
      } else if (filters.version.startsWith("~")) {
        const minor = semver.minor(filters.version.slice(1));
        history.filter((entry) => semver.minor(entry.version) === minor);
      } else {
        history.filter((entry) => entry.version === filters.version);
      }
    }

    return history;
  }

  /**
   * Restore documentation version
   * @param {string} version - Version to restore
   * @returns {Promise<Object>} Restored documentation
   */
  async restoreVersion(version) {
    // Validate version
    if (!semver.valid(version)) {
      throw new Error(`Invalid version: ${version}`);
    }

    // Find version in history
    const versionEntry = this.history.find(
      (entry) => entry.version === version
    );
    if (!versionEntry) {
      throw new Error(`Version not found: ${version}`);
    }

    // Get backup path
    const backupPath = path.join(this.options.backupDir, `docs-${version}.yml`);

    // Check if backup exists
    try {
      const backupStats = await fs.stat(backupPath);
      if (!backupStats.isFile()) {
        throw new Error(`Backup not found for version ${version}`);
      }
    } catch (error) {
      throw new Error(`Failed to access backup: ${error.message}`);
    }

    // Load backup
    const backup = yaml.load(await fs.readFile(backupPath, "utf8"));

    // Create restore point of current version
    await this._backupVersion(this.currentVersion, "restore-point");

    // Update current version
    await this._saveVersion(versionEntry);

    return backup;
  }

  /**
   * Compare documentation versions
   * @param {string} version1 - First version
   * @param {string} version2 - Second version
   * @returns {Promise<Object>} Version differences
   */
  async compareVersions(version1, version2) {
    // Load versions
    const v1 = await this._loadVersionBackup(version1);
    const v2 = await this._loadVersionBackup(version2);

    // Calculate differences
    return {
      sections: this._compareSections(v1.sections, v2.sections),
      metadata: this._compareMetadata(v1.metadata, v2.metadata),
      examples: this._compareExamples(v1, v2),
      apis: this._compareApis(v1, v2),
    };
  }

  /**
   * Load current version
   * @private
   */
  async _loadVersion() {
    try {
      const content = await fs.readFile(this.options.versionFile, "utf8");
      this.currentVersion = yaml.load(content);
    } catch (error) {
      // Initialize with version 0.1.0 if no version file exists
      this.currentVersion = {
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        author: process.env.USER || "unknown",
        changes: [],
        metadata: {},
      };
      await this._saveVersion(this.currentVersion);
    }
  }

  /**
   * Load version history
   * @private
   */
  async _loadHistory() {
    try {
      const content = await fs.readFile(this.options.historyFile, "utf8");
      this.history = yaml.load(content) || [];
    } catch (error) {
      this.history = [];
      await this._saveHistory();
    }
  }

  /**
   * Save current version
   * @param {Object} version - Version to save
   * @private
   */
  async _saveVersion(version) {
    const content = yaml.dump(version);
    await fs.writeFile(this.options.versionFile, content, "utf8");
  }

  /**
   * Save version history
   * @private
   */
  async _saveHistory() {
    const content = yaml.dump(this.history);
    await fs.writeFile(this.options.historyFile, content, "utf8");
  }

  /**
   * Add version to history
   * @param {Object} version - Version to add
   * @private
   */
  async _addToHistory(version) {
    this.history.unshift(version);
    await this._saveHistory();
  }

  /**
   * Calculate changes between versions
   * @param {Object} oldVersion - Old version
   * @param {Object} newContent - New content
   * @returns {Array} Changes
   * @private
   */
  async _calculateChanges(oldVersion, newContent) {
    const changes = [];

    // Load old version content
    const oldContent = await this._loadVersionBackup(oldVersion.version);

    // Compare sections
    const sectionChanges = this._compareSections(
      oldContent.sections,
      newContent.sections
    );

    changes.push(
      ...sectionChanges.map((change) => ({
        type: "section",
        ...change,
      }))
    );

    // Compare metadata
    const metadataChanges = this._compareMetadata(
      oldContent.metadata,
      newContent.metadata
    );

    changes.push(
      ...metadataChanges.map((change) => ({
        type: "metadata",
        ...change,
      }))
    );

    // Compare examples
    const exampleChanges = this._compareExamples(oldContent, newContent);

    changes.push(
      ...exampleChanges.map((change) => ({
        type: "example",
        ...change,
      }))
    );

    return changes;
  }

  /**
   * Compare sections between versions
   * @param {Array} oldSections - Old sections
   * @param {Array} newSections - New sections
   * @returns {Array} Section changes
   * @private
   */
  _compareSections(oldSections, newSections) {
    const changes = [];

    // Track section changes
    const oldSectionMap = new Map(
      oldSections.map((section) => [section.id, section])
    );
    const newSectionMap = new Map(
      newSections.map((section) => [section.id, section])
    );

    // Find added sections
    for (const [id, section] of newSectionMap) {
      if (!oldSectionMap.has(id)) {
        changes.push({
          action: "added",
          sectionId: id,
          title: section.title,
        });
      }
    }

    // Find removed sections
    for (const [id, section] of oldSectionMap) {
      if (!newSectionMap.has(id)) {
        changes.push({
          action: "removed",
          sectionId: id,
          title: section.title,
        });
      }
    }

    // Find modified sections
    for (const [id, newSection] of newSectionMap) {
      const oldSection = oldSectionMap.get(id);
      if (oldSection && oldSection.content !== newSection.content) {
        changes.push({
          action: "modified",
          sectionId: id,
          title: newSection.title,
        });
      }
    }

    return changes;
  }

  /**
   * Compare metadata between versions
   * @param {Object} oldMetadata - Old metadata
   * @param {Object} newMetadata - New metadata
   * @returns {Array} Metadata changes
   * @private
   */
  _compareMetadata(oldMetadata, newMetadata) {
    const changes = [];

    // Compare metadata fields
    const allFields = new Set([
      ...Object.keys(oldMetadata || {}),
      ...Object.keys(newMetadata || {}),
    ]);

    for (const field of allFields) {
      const oldValue = oldMetadata?.[field];
      const newValue = newMetadata?.[field];

      if (!oldValue && newValue) {
        changes.push({
          action: "added",
          field,
          value: newValue,
        });
      } else if (oldValue && !newValue) {
        changes.push({
          action: "removed",
          field,
          value: oldValue,
        });
      } else if (oldValue !== newValue) {
        changes.push({
          action: "modified",
          field,
          oldValue,
          newValue,
        });
      }
    }

    return changes;
  }

  /**
   * Compare examples between versions
   * @param {Object} oldContent - Old content
   * @param {Object} newContent - New content
   * @returns {Array} Example changes
   * @private
   */
  _compareExamples(oldContent, newContent) {
    const changes = [];
    const oldExamples = this._extractAllExamples(oldContent);
    const newExamples = this._extractAllExamples(newContent);

    // Compare example counts
    for (const [language, examples] of Object.entries(newExamples)) {
      const oldCount = oldExamples[language]?.length || 0;
      const newCount = examples.length;

      if (oldCount !== newCount) {
        changes.push({
          action: "count-changed",
          language,
          oldCount,
          newCount,
        });
      }
    }

    // Compare example contents
    for (const [language, examples] of Object.entries(newExamples)) {
      const oldLangExamples = oldExamples[language] || [];

      examples.forEach((example, index) => {
        const oldExample = oldLangExamples[index];
        if (!oldExample) {
          changes.push({
            action: "added",
            language,
            index,
          });
        } else if (oldExample.code !== example.code) {
          changes.push({
            action: "modified",
            language,
            index,
          });
        }
      });
    }

    return changes;
  }

  /**
   * Extract all examples from content
   * @param {Object} content - Documentation content
   * @returns {Object} Examples by language
   * @private
   */
  _extractAllExamples(content) {
    const examples = {};

    for (const section of content.sections || []) {
      const sectionExamples = this._extractExamples(section.content);

      for (const example of sectionExamples) {
        if (!examples[example.language]) {
          examples[example.language] = [];
        }
        examples[example.language].push(example);
      }
    }

    return examples;
  }

  /**
   * Extract examples from content
   * @param {string} content - Content to parse
   * @returns {Array} Extracted examples
   * @private
   */
  _extractExamples(content) {
    const examples = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      examples.push({
        language: match[1] || "text",
        code: match[2].trim(),
      });
    }

    return examples;
  }

  /**
   * Compare APIs between versions
   * @param {Object} oldContent - Old content
   * @param {Object} newContent - New content
   * @returns {Array} API changes
   * @private
   */
  _compareApis(oldContent, newContent) {
    const changes = [];
    const oldApis = this._extractApis(oldContent);
    const newApis = this._extractApis(newContent);

    // Compare API endpoints
    const allEndpoints = new Set([
      ...Object.keys(oldApis),
      ...Object.keys(newApis),
    ]);

    for (const endpoint of allEndpoints) {
      const oldApi = oldApis[endpoint];
      const newApi = newApis[endpoint];

      if (!oldApi && newApi) {
        changes.push({
          action: "added",
          endpoint,
          details: newApi,
        });
      } else if (oldApi && !newApi) {
        changes.push({
          action: "removed",
          endpoint,
          details: oldApi,
        });
      } else if (oldApi && newApi) {
        const paramChanges = this._compareApiParams(
          oldApi.params,
          newApi.params
        );
        const responseChanges = this._compareApiResponse(
          oldApi.response,
          newApi.response
        );

        if (paramChanges.length > 0 || responseChanges.length > 0) {
          changes.push({
            action: "modified",
            endpoint,
            paramChanges,
            responseChanges,
          });
        }
      }
    }

    return changes;
  }

  /**
   * Extract APIs from content
   * @param {Object} content - Documentation content
   * @returns {Object} Extracted APIs
   * @private
   */
  _extractApis(content) {
    const apis = {};
    const apiSection = content.sections?.find((s) => s.id === "api");

    if (!apiSection) return apis;

    // Simple API extraction (enhance based on actual format)
    const endpointRegex = /### `([A-Z]+) ([^`]+)`/g;
    let match;

    while ((match = endpointRegex.exec(apiSection.content)) !== null) {
      const method = match[1];
      const path = match[2];
      const endpoint = `${method} ${path}`;

      apis[endpoint] = this._parseApiDetails(
        apiSection.content.slice(match.index)
      );
    }

    return apis;
  }

  /**
   * Parse API details from content
   * @param {string} content - API section content
   * @returns {Object} API details
   * @private
   */
  _parseApiDetails(content) {
    // Simple parser (enhance based on actual format)
    const params = {};
    const response = {};

    // Extract parameters
    const paramsMatch = content.match(/#### Parameters\n\n([\s\S]+?)\n\n/);
    if (paramsMatch) {
      const paramLines = paramsMatch[1].split("\n");
      for (const line of paramLines) {
        const paramMatch = line.match(/- `([^`]+)` \(([^)]+)\): (.+)/);
        if (paramMatch) {
          params[paramMatch[1]] = {
            type: paramMatch[2],
            description: paramMatch[3],
          };
        }
      }
    }

    // Extract response
    const responseMatch = content.match(/#### Response\n\n([\s\S]+?)\n\n/);
    if (responseMatch) {
      const responseLines = responseMatch[1].split("\n");
      for (const line of responseLines) {
        const fieldMatch = line.match(/- `([^`]+)` \(([^)]+)\): (.+)/);
        if (fieldMatch) {
          response[fieldMatch[1]] = {
            type: fieldMatch[2],
            description: fieldMatch[3],
          };
        }
      }
    }

    return { params, response };
  }

  /**
   * Compare API parameters
   * @param {Object} oldParams - Old parameters
   * @param {Object} newParams - New parameters
   * @returns {Array} Parameter changes
   * @private
   */
  _compareApiParams(oldParams, newParams) {
    const changes = [];
    const allParams = new Set([
      ...Object.keys(oldParams),
      ...Object.keys(newParams),
    ]);

    for (const param of allParams) {
      const oldParam = oldParams[param];
      const newParam = newParams[param];

      if (!oldParam && newParam) {
        changes.push({
          action: "added",
          param,
          details: newParam,
        });
      } else if (oldParam && !newParam) {
        changes.push({
          action: "removed",
          param,
          details: oldParam,
        });
      } else if (
        oldParam.type !== newParam.type ||
        oldParam.description !== newParam.description
      ) {
        changes.push({
          action: "modified",
          param,
          oldDetails: oldParam,
          newDetails: newParam,
        });
      }
    }

    return changes;
  }

  /**
   * Compare API responses
   * @param {Object} oldResponse - Old response
   * @param {Object} newResponse - New response
   * @returns {Array} Response changes
   * @private
   */
  _compareApiResponse(oldResponse, newResponse) {
    const changes = [];
    const allFields = new Set([
      ...Object.keys(oldResponse),
      ...Object.keys(newResponse),
    ]);

    for (const field of allFields) {
      const oldField = oldResponse[field];
      const newField = newResponse[field];

      if (!oldField && newField) {
        changes.push({
          action: "added",
          field,
          details: newField,
        });
      } else if (oldField && !newField) {
        changes.push({
          action: "removed",
          field,
          details: oldField,
        });
      } else if (
        oldField.type !== newField.type ||
        oldField.description !== newField.description
      ) {
        changes.push({
          action: "modified",
          field,
          oldDetails: oldField,
          newDetails: newField,
        });
      }
    }

    return changes;
  }

  /**
   * Backup version content
   * @param {Object} version - Version to backup
   * @param {string} [suffix] - Optional backup suffix
   * @private
   */
  async _backupVersion(version, suffix = "") {
    if (!version) return;

    const backupName = suffix
      ? `docs-${version.version}-${suffix}.yml`
      : `docs-${version.version}.yml`;

    const backupPath = path.join(this.options.backupDir, backupName);
    const content = yaml.dump(version);

    await fs.writeFile(backupPath, content, "utf8");
  }

  /**
   * Load version backup
   * @param {string} version - Version to load
   * @returns {Promise<Object>} Version content
   * @private
   */
  async _loadVersionBackup(version) {
    const backupPath = path.join(this.options.backupDir, `docs-${version}.yml`);

    const content = await fs.readFile(backupPath, "utf8");
    return yaml.load(content);
  }

  /**
   * Commit version changes to git
   * @param {Object} version - Version information
   * @private
   */
  async _commitVersion(version) {
    if (!this.options.gitIntegration) return;

    try {
      // Add version files
      await exec("git add " + this.options.versionFile);
      await exec("git add " + this.options.historyFile);

      // Create commit
      const message =
        `docs: release version ${version.version}\n\n` +
        `${version.changes.length} changes:\n` +
        version.changes
          .map((change) => `- ${change.type}: ${change.action}`)
          .join("\n");

      await exec(`git commit -m "${message}"`);

      // Create tag
      await exec(
        `git tag -a v${version.version} -m "Documentation v${version.version}"`
      );
    } catch (error) {
      console.error("Git integration error:", error);
      // Continue without git integration
    }
  }

  /**
   * Ensure required directories exist
   * @private
   */
  async _ensureDirectories() {
    await fs.mkdir(this.options.backupDir, { recursive: true });
  }
}

module.exports = DocumentationVersion;
