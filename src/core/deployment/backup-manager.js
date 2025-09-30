/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Backup Manager - System backup and recovery management
 */

const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");
const { promisify } = require("util");
const eventBus = require("../integration/event-bus");
const MetricsCollector = require("../integration/metrics-collector");
const ConfigurationManager = require("./configuration-manager");

// Promisify zlib methods
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class BackupManager {
  constructor(options = {}) {
    this.options = {
      backupDir: path.join(process.cwd(), "backups"),
      manifestFile: "backup-manifest.json",
      encryptBackups: true,
      compressionLevel: 9,
      retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
      maxBackups: 10,
      autoBackupInterval: 24 * 60 * 60 * 1000, // 24 hours
      criticalPaths: ["config", "data", "consciousness"],
      excludePaths: ["node_modules", "temp", "*.log"],
      ...options,
    };

    this.metrics = new MetricsCollector();
    this.config = new ConfigurationManager();

    this._manifest = null;
    this._backupInterval = null;
    this._activeBackup = null;
    this._restorePoint = null;

    this._setupMetrics();
  }

  /**
   * Initialize backup system
   */
  async initialize() {
    try {
      await fs.mkdir(this.options.backupDir, { recursive: true });
      await this._loadManifest();

      // Start auto-backup if configured
      if (this.options.autoBackupInterval > 0) {
        this._startAutoBackup();
      }

      eventBus.publish("backup.initialized", {
        timestamp: Date.now(),
      });
    } catch (error) {
      eventBus.publish("backup.error", {
        error: error.message,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Create a new backup
   * @param {string} [label] - Optional backup label
   */
  async createBackup(label = "") {
    if (this._activeBackup) {
      throw new Error("Backup already in progress");
    }

    try {
      this._activeBackup = {
        id: crypto.randomUUID(),
        startTime: Date.now(),
        label,
      };

      // Pre-backup tasks
      await this._preBackupTasks();

      // Get files to backup
      const files = await this._getBackupFiles();

      // Create backup package
      const backup = await this._createBackupPackage(files);

      // Process backup
      const backupPath = await this._processBackup(backup);

      // Update manifest
      await this._updateManifest({
        id: this._activeBackup.id,
        label: this._activeBackup.label,
        timestamp: this._activeBackup.startTime,
        path: backupPath,
        size: backup.size,
        fileCount: files.length,
        checksum: backup.checksum,
      });

      // Cleanup old backups
      await this._cleanupOldBackups();

      this.metrics.recordMetric("backup.created", 1);
      this.metrics.recordMetric("backup.size", backup.size);

      eventBus.publish("backup.created", {
        id: this._activeBackup.id,
        label: this._activeBackup.label,
        timestamp: Date.now(),
      });

      const result = { ...this._activeBackup, size: backup.size };
      this._activeBackup = null;
      return result;
    } catch (error) {
      this._activeBackup = null;
      eventBus.publish("backup.error", {
        error: error.message,
        operation: "create",
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Restore from backup
   * @param {string} backupId - Backup ID to restore from
   */
  async restore(backupId) {
    if (this._restorePoint) {
      throw new Error("Restore already in progress");
    }

    try {
      const backup = this._manifest.backups.find((b) => b.id === backupId);
      if (!backup) {
        throw new Error("Backup not found");
      }

      this._restorePoint = {
        id: backupId,
        startTime: Date.now(),
      };

      // Create pre-restore backup
      const preRestoreBackup = await this.createBackup(
        "pre-restore-" + backupId
      );

      // Verify backup integrity
      await this._verifyBackup(backup);

      // Restore files
      await this._restoreFiles(backup);

      this.metrics.recordMetric("backup.restored", 1);

      eventBus.publish("backup.restored", {
        id: backupId,
        timestamp: Date.now(),
      });

      const result = { ...this._restorePoint, preRestoreBackup };
      this._restorePoint = null;
      return result;
    } catch (error) {
      this._restorePoint = null;
      eventBus.publish("backup.error", {
        error: error.message,
        operation: "restore",
        backupId,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * List available backups
   */
  listBackups() {
    return this._manifest.backups.map((backup) => ({
      id: backup.id,
      label: backup.label,
      timestamp: backup.timestamp,
      size: backup.size,
      fileCount: backup.fileCount,
    }));
  }

  /**
   * Get backup details
   * @param {string} backupId - Backup ID
   */
  getBackupDetails(backupId) {
    const backup = this._manifest.backups.find((b) => b.id === backupId);
    if (!backup) {
      throw new Error("Backup not found");
    }
    return { ...backup };
  }

  /**
   * Delete a backup
   * @param {string} backupId - Backup ID to delete
   */
  async deleteBackup(backupId) {
    try {
      const backup = this._manifest.backups.find((b) => b.id === backupId);
      if (!backup) {
        throw new Error("Backup not found");
      }

      // Delete backup file
      await fs.unlink(backup.path);

      // Update manifest
      this._manifest.backups = this._manifest.backups.filter(
        (b) => b.id !== backupId
      );
      await this._saveManifest();

      this.metrics.recordMetric("backup.deleted", 1);

      eventBus.publish("backup.deleted", {
        id: backupId,
        timestamp: Date.now(),
      });
    } catch (error) {
      eventBus.publish("backup.error", {
        error: error.message,
        operation: "delete",
        backupId,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Start automatic backup
   * @private
   */
  _startAutoBackup() {
    if (this._backupInterval) {
      clearInterval(this._backupInterval);
    }

    this._backupInterval = setInterval(async () => {
      try {
        await this.createBackup("auto-backup");
      } catch (error) {
        console.error("Auto backup failed:", error);
      }
    }, this.options.autoBackupInterval);
  }

  /**
   * Stop automatic backup
   */
  stopAutoBackup() {
    if (this._backupInterval) {
      clearInterval(this._backupInterval);
      this._backupInterval = null;
    }
  }

  /**
   * Setup metrics
   * @private
   */
  _setupMetrics() {
    this.metrics.registerMetric("backup.created", {
      type: "counter",
      description: "Number of backups created",
    });

    this.metrics.registerMetric("backup.restored", {
      type: "counter",
      description: "Number of backups restored",
    });

    this.metrics.registerMetric("backup.deleted", {
      type: "counter",
      description: "Number of backups deleted",
    });

    this.metrics.registerMetric("backup.size", {
      type: "histogram",
      description: "Size of backups in bytes",
    });
  }

  /**
   * Load backup manifest
   * @private
   */
  async _loadManifest() {
    try {
      const manifestPath = path.join(
        this.options.backupDir,
        this.options.manifestFile
      );
      const content = await fs.readFile(manifestPath, "utf8");
      this._manifest = JSON.parse(content);
    } catch (error) {
      if (error.code === "ENOENT") {
        this._manifest = { backups: [] };
        await this._saveManifest();
      } else {
        throw error;
      }
    }
  }

  /**
   * Save backup manifest
   * @private
   */
  async _saveManifest() {
    const manifestPath = path.join(
      this.options.backupDir,
      this.options.manifestFile
    );
    await fs.writeFile(manifestPath, JSON.stringify(this._manifest, null, 2));
  }

  /**
   * Update manifest with new backup
   * @private
   */
  async _updateManifest(backup) {
    this._manifest.backups.push(backup);
    await this._saveManifest();
  }

  /**
   * Pre-backup tasks
   * @private
   */
  async _preBackupTasks() {
    // Verify system state
    const systemState = await this._verifySystemState();
    if (!systemState.valid) {
      throw new Error(`System state invalid: ${systemState.reason}`);
    }

    // Check disk space
    const diskSpace = await this._checkDiskSpace();
    if (!diskSpace.sufficient) {
      throw new Error("Insufficient disk space for backup");
    }
  }

  /**
   * Get files to backup
   * @private
   */
  async _getBackupFiles() {
    const files = [];

    for (const dir of this.options.criticalPaths) {
      const dirPath = path.join(process.cwd(), dir);
      try {
        await this._walkDirectory(dirPath, files);
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
    }

    return files;
  }

  /**
   * Walk directory recursively
   * @private
   */
  async _walkDirectory(dir, files) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);

      // Check exclusions
      if (this._isExcluded(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        await this._walkDirectory(fullPath, files);
      } else {
        files.push(relativePath);
      }
    }
  }

  /**
   * Check if path is excluded
   * @private
   */
  _isExcluded(filePath) {
    return this.options.excludePaths.some((pattern) => {
      if (pattern.includes("*")) {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        return regex.test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  /**
   * Create backup package
   * @private
   */
  async _createBackupPackage(files) {
    const backup = {
      metadata: {
        id: this._activeBackup.id,
        label: this._activeBackup.label,
        timestamp: this._activeBackup.startTime,
        files: {},
      },
      contents: {},
    };

    // Read and process files
    for (const file of files) {
      const content = await fs.readFile(file);
      const hash = crypto.createHash("sha256");
      hash.update(content);

      backup.metadata.files[file] = {
        size: content.length,
        checksum: hash.digest("hex"),
      };

      backup.contents[file] = content;
    }

    // Serialize and compress
    const serialized = JSON.stringify(backup);
    const compressed = await gzip(serialized);

    // Encrypt if enabled
    const processed = this.options.encryptBackups
      ? this._encrypt(compressed)
      : compressed;

    // Calculate final checksum
    const hash = crypto.createHash("sha256");
    hash.update(processed);

    return {
      data: processed,
      size: processed.length,
      checksum: hash.digest("hex"),
    };
  }

  /**
   * Process and store backup
   * @private
   */
  async _processBackup(backup) {
    const backupPath = path.join(
      this.options.backupDir,
      `${this._activeBackup.id}.nhdr`
    );

    await fs.writeFile(backupPath, backup.data);
    return backupPath;
  }

  /**
   * Verify backup integrity
   * @private
   */
  async _verifyBackup(backup) {
    const backupData = await fs.readFile(backup.path);

    // Verify checksum
    const hash = crypto.createHash("sha256");
    hash.update(backupData);
    const checksum = hash.digest("hex");

    if (checksum !== backup.checksum) {
      throw new Error("Backup integrity check failed");
    }

    return true;
  }

  /**
   * Restore files from backup
   * @private
   */
  async _restoreFiles(backup) {
    // Read backup file
    const backupData = await fs.readFile(backup.path);

    // Decrypt if needed
    const decrypted = this.options.encryptBackups
      ? this._decrypt(backupData)
      : backupData;

    // Decompress
    const decompressed = await gunzip(decrypted);
    const { metadata, contents } = JSON.parse(decompressed.toString());

    // Restore files
    for (const [file, content] of Object.entries(contents)) {
      const filePath = path.join(process.cwd(), file);
      const fileDir = path.dirname(filePath);

      // Ensure directory exists
      await fs.mkdir(fileDir, { recursive: true });

      // Write file
      await fs.writeFile(filePath, Buffer.from(content));

      // Verify checksum
      const hash = crypto.createHash("sha256");
      hash.update(Buffer.from(content));
      const checksum = hash.digest("hex");

      if (checksum !== metadata.files[file].checksum) {
        throw new Error(`File integrity check failed: ${file}`);
      }
    }
  }

  /**
   * Cleanup old backups
   * @private
   */
  async _cleanupOldBackups() {
    const now = Date.now();

    // Sort backups by timestamp
    this._manifest.backups.sort((a, b) => b.timestamp - a.timestamp);

    // Keep recent backups within retention period
    const retainedBackups = this._manifest.backups.filter((backup) => {
      const age = now - backup.timestamp;
      return age <= this.options.retentionPeriod;
    });

    // Ensure we don't exceed max backups
    while (retainedBackups.length > this.options.maxBackups) {
      const oldestBackup = retainedBackups.pop();
      await this.deleteBackup(oldestBackup.id);
    }
  }

  /**
   * Verify system state
   * @private
   */
  async _verifySystemState() {
    // Implementation would verify system integrity
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
   * Encrypt data
   * @private
   */
  _encrypt(data) {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(
      this.options.encryptionKey || "default-key",
      "salt",
      32
    );

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt data
   * @private
   */
  _decrypt(data) {
    const iv = data.slice(0, 16);
    const authTag = data.slice(16, 32);
    const encrypted = data.slice(32);

    const key = crypto.scryptSync(
      this.options.encryptionKey || "default-key",
      "salt",
      32
    );

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}

module.exports = BackupManager;
