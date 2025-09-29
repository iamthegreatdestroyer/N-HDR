/**
 * @file Update Manager for N-HDR System
 * @copyright HDR Empire. Patent-pending. All rights reserved.
 */

const fs = require("fs").promises;
const path = require("path");
const semver = require("semver");
const crypto = require("crypto");
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

class UpdateManager {
  constructor() {
    this.currentVersion = null;
    this.availableUpdates = new Map();
    this.updateHistory = [];
    this.config = new Map();
    this.updateServer = null;
  }

  /**
   * Initializes the update manager
   * @param {object} config - Update manager configuration
   */
  async initialize(config = {}) {
    this.config = new Map(Object.entries(config));
    this.updateServer = this.config.get("updateServer");

    await this.loadCurrentVersion();
    await this.checkForUpdates();
  }

  /**
   * Loads the current system version
   * @private
   */
  async loadCurrentVersion() {
    try {
      const packageJson = require(path.join(process.cwd(), "package.json"));
      this.currentVersion = packageJson.version;
    } catch (error) {
      throw new Error(`Failed to load current version: ${error.message}`);
    }
  }

  /**
   * Checks for available updates
   * @returns {Map} Available updates
   */
  async checkForUpdates() {
    try {
      const response = await fetch(`${this.updateServer}/updates/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentVersion: this.currentVersion,
          systemInfo: await this.getSystemInfo(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Update check failed: ${response.statusText}`);
      }

      const updates = await response.json();
      this.processAvailableUpdates(updates);
      return this.availableUpdates;
    } catch (error) {
      throw new Error(`Failed to check for updates: ${error.message}`);
    }
  }

  /**
   * Gets system information for update check
   * @private
   * @returns {object} System information
   */
  async getSystemInfo() {
    const components = [
      "neural-hdr",
      "security-manager",
      "quantum-processor",
      "ns-hdr",
    ];

    const info = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      components: {},
    };

    for (const component of components) {
      try {
        const componentPath = path.join(
          process.cwd(),
          "src",
          "core",
          component
        );
        const stats = await fs.stat(componentPath);
        info.components[component] = {
          exists: true,
          lastModified: stats.mtime,
        };
      } catch {
        info.components[component] = {
          exists: false,
        };
      }
    }

    return info;
  }

  /**
   * Processes available updates
   * @private
   * @param {Array} updates - Available updates
   */
  processAvailableUpdates(updates) {
    this.availableUpdates.clear();

    for (const update of updates) {
      if (semver.gt(update.version, this.currentVersion)) {
        this.availableUpdates.set(update.version, {
          ...update,
          compatible: this.checkUpdateCompatibility(update),
        });
      }
    }
  }

  /**
   * Checks update compatibility
   * @private
   * @param {object} update - Update information
   * @returns {boolean} Whether the update is compatible
   */
  checkUpdateCompatibility(update) {
    // Check system requirements
    const meetsRequirements = this.checkSystemRequirements(update.requirements);

    // Check component compatibility
    const componentsCompatible = this.checkComponentCompatibility(
      update.components
    );

    // Check for breaking changes
    const noBreakingChanges =
      !update.breakingChanges ||
      this.canHandleBreakingChanges(update.breakingChanges);

    return meetsRequirements && componentsCompatible && noBreakingChanges;
  }

  /**
   * Checks system requirements
   * @private
   * @param {object} requirements - System requirements
   * @returns {boolean} Whether requirements are met
   */
  checkSystemRequirements(requirements) {
    if (!requirements) return true;

    return (
      semver.satisfies(process.version, requirements.node) &&
      (!requirements.os || requirements.os.includes(process.platform)) &&
      (!requirements.memory ||
        process.memoryUsage().heapTotal >= requirements.memory)
    );
  }

  /**
   * Checks component compatibility
   * @private
   * @param {object} components - Component requirements
   * @returns {boolean} Whether components are compatible
   */
  checkComponentCompatibility(components) {
    if (!components) return true;

    for (const [component, version] of Object.entries(components)) {
      try {
        const componentPath = path.join(
          process.cwd(),
          "src",
          "core",
          component
        );
        const componentPackage = require(path.join(
          componentPath,
          "package.json"
        ));
        if (!semver.satisfies(componentPackage.version, version)) {
          return false;
        }
      } catch {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if breaking changes can be handled
   * @private
   * @param {Array} breakingChanges - Breaking changes
   * @returns {boolean} Whether changes can be handled
   */
  canHandleBreakingChanges(breakingChanges) {
    // Check if we have migration scripts for all breaking changes
    return breakingChanges.every((change) =>
      fs.existsSync(path.join(process.cwd(), "migrations", `${change.id}.js`))
    );
  }

  /**
   * Downloads an update package
   * @param {string} version - Update version
   * @returns {object} Download result
   */
  async downloadUpdate(version) {
    const update = this.availableUpdates.get(version);
    if (!update) {
      throw new Error(`Update ${version} not found`);
    }

    try {
      const response = await fetch(
        `${this.updateServer}/updates/download/${version}`
      );
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const hash = crypto
        .createHash("sha256")
        .update(Buffer.from(buffer))
        .digest("hex");

      if (hash !== update.hash) {
        throw new Error("Update package integrity check failed");
      }

      const updatePath = path.join(process.cwd(), "updates", version);
      await fs.mkdir(updatePath, { recursive: true });
      await fs.writeFile(
        path.join(updatePath, "update.zip"),
        Buffer.from(buffer)
      );

      return {
        path: updatePath,
        size: buffer.byteLength,
        hash,
      };
    } catch (error) {
      throw new Error(`Failed to download update: ${error.message}`);
    }
  }

  /**
   * Installs an update
   * @param {string} version - Update version
   * @returns {object} Installation result
   */
  async installUpdate(version) {
    const update = this.availableUpdates.get(version);
    if (!update) {
      throw new Error(`Update ${version} not found`);
    }

    const installation = {
      version,
      timestamp: new Date(),
      steps: [],
    };

    try {
      // Create backup
      await this.createBackup();
      installation.steps.push({
        name: "backup",
        status: "completed",
      });

      // Stop services
      await this.stopServices();
      installation.steps.push({
        name: "stop-services",
        status: "completed",
      });

      // Install update
      const updatePath = path.join(process.cwd(), "updates", version);
      await this.extractUpdate(updatePath);
      installation.steps.push({
        name: "extract",
        status: "completed",
      });

      // Apply migrations
      if (update.breakingChanges) {
        await this.applyMigrations(update.breakingChanges);
        installation.steps.push({
          name: "migrations",
          status: "completed",
        });
      }

      // Update dependencies
      await this.updateDependencies();
      installation.steps.push({
        name: "dependencies",
        status: "completed",
      });

      // Verify installation
      await this.verifyInstallation(version);
      installation.steps.push({
        name: "verification",
        status: "completed",
      });

      // Start services
      await this.startServices();
      installation.steps.push({
        name: "start-services",
        status: "completed",
      });

      installation.status = "success";
      this.updateHistory.push(installation);

      // Update current version
      this.currentVersion = version;
      await this.updatePackageVersion(version);
    } catch (error) {
      installation.status = "failed";
      installation.error = error.message;

      // Rollback
      await this.rollback();
      installation.steps.push({
        name: "rollback",
        status: "completed",
      });

      this.updateHistory.push(installation);
      throw error;
    }

    return installation;
  }

  /**
   * Creates a system backup
   * @private
   */
  async createBackup() {
    const backupPath = path.join(
      process.cwd(),
      "backups",
      Date.now().toString()
    );
    await fs.mkdir(backupPath, { recursive: true });

    const items = await fs.readdir(process.cwd());
    for (const item of items) {
      if (item !== "backups" && item !== "updates") {
        const source = path.join(process.cwd(), item);
        const target = path.join(backupPath, item);
        await fs.cp(source, target, { recursive: true });
      }
    }
  }

  /**
   * Stops system services
   * @private
   */
  async stopServices() {
    const services = [
      "neural-hdr-service",
      "quantum-service",
      "ns-hdr-service",
    ];

    for (const service of services) {
      await execAsync(`pm2 stop ${service}`);
    }
  }

  /**
   * Extracts update package
   * @private
   * @param {string} updatePath - Path to update package
   */
  async extractUpdate(updatePath) {
    await execAsync(
      `unzip -o ${path.join(updatePath, "update.zip")} -d ${process.cwd()}`
    );
  }

  /**
   * Applies migration scripts
   * @private
   * @param {Array} breakingChanges - Breaking changes
   */
  async applyMigrations(breakingChanges) {
    for (const change of breakingChanges) {
      const migrationPath = path.join(
        process.cwd(),
        "migrations",
        `${change.id}.js`
      );
      const migration = require(migrationPath);
      await migration.up();
    }
  }

  /**
   * Updates system dependencies
   * @private
   */
  async updateDependencies() {
    await execAsync("npm install");
  }

  /**
   * Verifies update installation
   * @private
   * @param {string} version - Expected version
   */
  async verifyInstallation(version) {
    // Verify version
    const packageJson = require(path.join(process.cwd(), "package.json"));
    if (packageJson.version !== version) {
      throw new Error("Version mismatch after installation");
    }

    // Verify system integrity
    const integrityCheck = await this.runIntegrityCheck();
    if (!integrityCheck.passed) {
      throw new Error(`System integrity check failed: ${integrityCheck.error}`);
    }
  }

  /**
   * Runs system integrity check
   * @private
   * @returns {object} Check result
   */
  async runIntegrityCheck() {
    try {
      // Check core components
      const components = [
        "neural-hdr",
        "security-manager",
        "quantum-processor",
        "ns-hdr",
      ];

      for (const component of components) {
        const componentPath = path.join(
          process.cwd(),
          "src",
          "core",
          component
        );
        await fs.access(componentPath);
      }

      // Run test suite
      await execAsync("npm test");

      return {
        passed: true,
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message,
      };
    }
  }

  /**
   * Starts system services
   * @private
   */
  async startServices() {
    const services = [
      "neural-hdr-service",
      "quantum-service",
      "ns-hdr-service",
    ];

    for (const service of services) {
      await execAsync(`pm2 start ${service}`);
    }
  }

  /**
   * Updates package.json version
   * @private
   * @param {string} version - New version
   */
  async updatePackageVersion(version) {
    const packagePath = path.join(process.cwd(), "package.json");
    const packageJson = require(packagePath);
    packageJson.version = version;
    await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
  }

  /**
   * Rolls back an update
   * @private
   */
  async rollback() {
    const backups = await fs.readdir(path.join(process.cwd(), "backups"));
    if (backups.length === 0) {
      throw new Error("No backups available for rollback");
    }

    // Get latest backup
    const latestBackup = backups
      .map((b) => parseInt(b))
      .sort((a, b) => b - a)[0]
      .toString();

    const backupPath = path.join(process.cwd(), "backups", latestBackup);

    // Stop services
    await this.stopServices();

    // Restore backup
    const items = await fs.readdir(backupPath);
    for (const item of items) {
      const source = path.join(backupPath, item);
      const target = path.join(process.cwd(), item);
      await fs.rm(target, { recursive: true, force: true });
      await fs.cp(source, target, { recursive: true });
    }

    // Start services
    await this.startServices();
  }

  /**
   * Gets update history
   * @returns {Array} Update history
   */
  getUpdateHistory() {
    return this.updateHistory;
  }

  /**
   * Exports update information to markdown
   * @returns {string} Markdown formatted update info
   */
  exportToMarkdown() {
    let markdown = "# N-HDR Update Information\n\n";

    // Current Version
    markdown += `## Current Version: ${this.currentVersion}\n\n`;

    // Available Updates
    markdown += "## Available Updates\n\n";
    if (this.availableUpdates.size === 0) {
      markdown += "*No updates available*\n\n";
    } else {
      markdown += "| Version | Compatible | Breaking Changes | Size |\n";
      markdown += "|---------|------------|------------------|------|\n";

      for (const [version, update] of this.availableUpdates) {
        markdown += `| ${version} | ${update.compatible ? "✅" : "❌"} | ${
          update.breakingChanges?.length || 0
        } | ${update.size} |\n`;
      }
      markdown += "\n";
    }

    // Update History
    markdown += "## Update History\n\n";
    if (this.updateHistory.length === 0) {
      markdown += "*No updates installed*\n\n";
    } else {
      markdown += "| Version | Status | Timestamp | Steps Completed |\n";
      markdown += "|---------|--------|-----------|----------------|\n";

      for (const update of this.updateHistory) {
        const completed = update.steps.filter(
          (s) => s.status === "completed"
        ).length;
        markdown += `| ${update.version} | ${
          update.status
        } | ${update.timestamp.toISOString()} | ${completed}/${
          update.steps.length
        } |\n`;
      }
    }

    return markdown;
  }
}

module.exports = UpdateManager;
