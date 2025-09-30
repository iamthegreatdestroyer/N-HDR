/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Update Manager - System update and version control management
 */

const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const semver = require("semver");
const eventBus = require("../integration/event-bus");
const MetricsCollector = require("../integration/metrics-collector");
const ConfigurationManager = require("./configuration-manager");

class UpdateManager {
  constructor(options = {}) {
    this.options = {
      updateDir: path.join(process.cwd(), "updates"),
      manifestFile: "update-manifest.json",
      verifySignatures: true,
      autoInstall: false,
      updateCheckInterval: 3600000, // 1 hour
      maxConcurrentUpdates: 1,
      ...options,
    };

    this.metrics = new MetricsCollector();
    this.config = new ConfigurationManager();

    this._updateQueue = [];
    this._activeUpdates = new Set();
    this._updateHistory = new Map();
    this._updateInterval = null;
    this._manifest = null;

    this._setupMetrics();
  }

  /**
   * Initialize update system
   */
  async initialize() {
    try {
      await fs.mkdir(this.options.updateDir, { recursive: true });
      await this._loadManifest();

      if (this.options.autoInstall) {
        this._startUpdateCheck();
      }

      eventBus.publish("updates.initialized", {
        timestamp: Date.now(),
      });
    } catch (error) {
      eventBus.publish("updates.error", {
        error: error.message,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Check for available updates
   */
  async checkForUpdates() {
    try {
      const currentVersion = await this.config.get("system.version");
      const updates = await this._fetchAvailableUpdates();

      const availableUpdates = updates.filter((update) =>
        semver.gt(update.version, currentVersion)
      );

      this.metrics.recordMetric("updates.available", availableUpdates.length);

      return {
        currentVersion,
        availableUpdates,
        lastCheck: Date.now(),
      };
    } catch (error) {
      eventBus.publish("updates.error", {
        error: error.message,
        operation: "checkForUpdates",
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Queue an update for installation
   * @param {string} version - Target version
   */
  async queueUpdate(version) {
    try {
      const currentVersion = await this.config.get("system.version");

      if (!semver.valid(version)) {
        throw new Error("Invalid version specified");
      }

      if (!semver.gt(version, currentVersion)) {
        throw new Error("Version must be greater than current version");
      }

      const update = await this._fetchUpdateDetails(version);

      if (!update) {
        throw new Error("Update not found");
      }

      if (
        this.options.verifySignatures &&
        !this._verifyUpdateSignature(update)
      ) {
        throw new Error("Update signature verification failed");
      }

      this._updateQueue.push(update);
      this._processUpdateQueue();

      eventBus.publish("updates.queued", {
        version,
        timestamp: Date.now(),
      });
    } catch (error) {
      eventBus.publish("updates.error", {
        error: error.message,
        version,
        operation: "queueUpdate",
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Install a specific update
   * @param {Object} update - Update details
   */
  async _installUpdate(update) {
    try {
      this._activeUpdates.add(update.version);

      // Pre-update tasks
      await this._preUpdateTasks(update);

      // Download update
      const updateFiles = await this._downloadUpdate(update);

      // Verify update integrity
      if (!this._verifyUpdateIntegrity(updateFiles, update.checksums)) {
        throw new Error("Update integrity check failed");
      }

      // Apply update
      await this._applyUpdate(update, updateFiles);

      // Post-update tasks
      await this._postUpdateTasks(update);

      // Update history
      this._updateHistory.set(update.version, {
        installedAt: Date.now(),
        status: "success",
      });

      // Update system version
      await this.config.set("system.version", update.version);

      this._activeUpdates.delete(update.version);

      eventBus.publish("updates.installed", {
        version: update.version,
        timestamp: Date.now(),
      });

      this.metrics.recordMetric("updates.installed", 1);
    } catch (error) {
      this._activeUpdates.delete(update.version);

      this._updateHistory.set(update.version, {
        installedAt: Date.now(),
        status: "failed",
        error: error.message,
      });

      eventBus.publish("updates.error", {
        error: error.message,
        version: update.version,
        operation: "install",
        timestamp: Date.now(),
      });

      this.metrics.recordMetric("updates.failed", 1);
      throw error;
    }
  }

  /**
   * Get update history
   */
  getUpdateHistory() {
    return Array.from(this._updateHistory.entries()).map(
      ([version, details]) => ({
        version,
        ...details,
      })
    );
  }

  /**
   * Start automatic update check
   * @private
   */
  _startUpdateCheck() {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
    }

    this._updateInterval = setInterval(async () => {
      try {
        const { availableUpdates } = await this.checkForUpdates();

        if (availableUpdates.length > 0 && this.options.autoInstall) {
          // Queue only the latest version
          const latestVersion = availableUpdates[availableUpdates.length - 1];
          await this.queueUpdate(latestVersion.version);
        }
      } catch (error) {
        console.error("Auto update check failed:", error);
      }
    }, this.options.updateCheckInterval);
  }

  /**
   * Stop automatic update check
   */
  stopUpdateCheck() {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
  }

  /**
   * Process update queue
   * @private
   */
  async _processUpdateQueue() {
    if (this._activeUpdates.size >= this.options.maxConcurrentUpdates) {
      return;
    }

    while (
      this._updateQueue.length > 0 &&
      this._activeUpdates.size < this.options.maxConcurrentUpdates
    ) {
      const update = this._updateQueue.shift();
      await this._installUpdate(update);
    }
  }

  /**
   * Pre-update tasks
   * @private
   */
  async _preUpdateTasks(update) {
    // Notify system of impending update
    eventBus.publish("updates.starting", {
      version: update.version,
      timestamp: Date.now(),
    });

    // Verify system state
    await this._verifySystemState();

    // Create update workspace
    const workspacePath = path.join(
      this.options.updateDir,
      `update-${update.version}`
    );
    await fs.mkdir(workspacePath, { recursive: true });

    return workspacePath;
  }

  /**
   * Post-update tasks
   * @private
   */
  async _postUpdateTasks(update) {
    // Clean up temporary files
    const workspacePath = path.join(
      this.options.updateDir,
      `update-${update.version}`
    );
    await fs.rm(workspacePath, { recursive: true, force: true });

    // Update manifest
    await this._updateManifest(update);
  }

  /**
   * Verify system state
   * @private
   */
  async _verifySystemState() {
    // Check system integrity
    const integrityCheck = await this._checkSystemIntegrity();
    if (!integrityCheck.valid) {
      throw new Error(
        `System integrity check failed: ${integrityCheck.reason}`
      );
    }

    // Verify available disk space
    const diskSpace = await this._checkDiskSpace();
    if (!diskSpace.sufficient) {
      throw new Error("Insufficient disk space for update");
    }

    // Check active processes
    const processes = await this._checkActiveProcesses();
    if (processes.blocking.length > 0) {
      throw new Error("Blocking processes must be terminated before update");
    }
  }

  /**
   * Setup metrics
   * @private
   */
  _setupMetrics() {
    this.metrics.registerMetric("updates.available", {
      type: "gauge",
      description: "Number of available updates",
    });

    this.metrics.registerMetric("updates.installed", {
      type: "counter",
      description: "Number of successfully installed updates",
    });

    this.metrics.registerMetric("updates.failed", {
      type: "counter",
      description: "Number of failed updates",
    });

    this.metrics.registerMetric("updates.verification", {
      type: "counter",
      description: "Number of update verifications",
    });
  }

  /**
   * Load update manifest
   * @private
   */
  async _loadManifest() {
    try {
      const manifestPath = path.join(
        this.options.updateDir,
        this.options.manifestFile
      );
      const content = await fs.readFile(manifestPath, "utf8");
      this._manifest = JSON.parse(content);
    } catch (error) {
      if (error.code === "ENOENT") {
        this._manifest = { updates: [] };
        await this._saveManifest();
      } else {
        throw error;
      }
    }
  }

  /**
   * Save update manifest
   * @private
   */
  async _saveManifest() {
    const manifestPath = path.join(
      this.options.updateDir,
      this.options.manifestFile
    );
    await fs.writeFile(manifestPath, JSON.stringify(this._manifest, null, 2));
  }

  /**
   * Update manifest with new update
   * @private
   */
  async _updateManifest(update) {
    this._manifest.updates = this._manifest.updates.filter(
      (u) => u.version !== update.version
    );

    this._manifest.updates.push({
      version: update.version,
      installedAt: Date.now(),
      checksums: update.checksums,
    });

    await this._saveManifest();
  }

  /**
   * Verify update signature
   * @private
   */
  _verifyUpdateSignature(update) {
    try {
      const verify = crypto.createVerify("SHA256");
      verify.update(JSON.stringify(update.data));

      const isValid = verify.verify(
        update.publicKey,
        update.signature,
        "base64"
      );

      this.metrics.recordMetric("updates.verification", 1);

      return isValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify update integrity
   * @private
   */
  _verifyUpdateIntegrity(files, checksums) {
    for (const [file, expectedHash] of Object.entries(checksums)) {
      const hash = crypto.createHash("sha256");
      hash.update(files[file]);
      const actualHash = hash.digest("hex");

      if (actualHash !== expectedHash) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check system integrity
   * @private
   */
  async _checkSystemIntegrity() {
    // Implementation would verify core system files and state
    return { valid: true };
  }

  /**
   * Check available disk space
   * @private
   */
  async _checkDiskSpace() {
    // Implementation would check actual disk space
    return { sufficient: true };
  }

  /**
   * Check active processes
   * @private
   */
  async _checkActiveProcesses() {
    // Implementation would check for blocking processes
    return { blocking: [] };
  }

  /**
   * Fetch available updates
   * @private
   */
  async _fetchAvailableUpdates() {
    // Implementation would fetch from update server
    return this._manifest.updates;
  }

  /**
   * Fetch update details
   * @private
   */
  async _fetchUpdateDetails(version) {
    return this._manifest.updates.find((u) => u.version === version);
  }

  /**
   * Download update files
   * @private
   */
  async _downloadUpdate(update) {
    // Implementation would download from update server
    return {};
  }

  /**
   * Apply update
   * @private
   */
  async _applyUpdate(update, files) {
    // Implementation would apply update files
    return true;
  }
}

module.exports = UpdateManager;
