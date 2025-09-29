/**
 * NEURAL-HDR (N-HDR) MIGRATION UTILITY
 * © 2025 Stephen Bilodeau - PATENT PENDING - ALL RIGHTS RESERVED
 * HDR EMPIRE - CONFIDENTIAL
 *
 * This utility facilitates migration from the original NS-HDR implementation
 * to the enhanced version, preserving configurations and data.
 */

const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

class NSHDRMigrationUtility {
  constructor(options = {}) {
    this.sourceDir = options.sourceDir || process.cwd();
    this.backupDir = options.backupDir || path.join(process.cwd(), "backups");
    this.timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  }

  /**
   * Run the migration process
   */
  async migrate() {
    console.log("Starting NS-HDR migration process...");

    try {
      // Create backup directory if it doesn't exist
      await this._ensureBackupDirectory();

      // Backup existing files
      await this._backupExistingFiles();

      // Migrate configurations
      await this._migrateConfigurations();

      // Update file paths and references
      await this._updateFileReferences();

      // Validate migration
      await this._validateMigration();

      console.log("Migration completed successfully!");
    } catch (error) {
      console.error("Migration failed:", error);
      await this._handleMigrationFailure(error);
      throw error;
    }
  }

  /**
   * Ensure backup directory exists
   * @private
   */
  async _ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create backup directory: ${error.message}`);
    }
  }

  /**
   * Backup existing NS-HDR files
   * @private
   */
  async _backupExistingFiles() {
    console.log("Creating backups of existing files...");

    const filesToBackup = [
      "nano-swarm-hdr.js",
      "ns-hdr-enhanced.js",
      "config.json",
    ];

    for (const file of filesToBackup) {
      const sourcePath = path.join(this.sourceDir, file);
      try {
        const exists = await fs
          .access(sourcePath)
          .then(() => true)
          .catch(() => false);

        if (exists) {
          const backupPath = path.join(
            this.backupDir,
            `${file}.${this.timestamp}.bak`
          );
          await fs.copyFile(sourcePath, backupPath);
          console.log(`Backed up ${file} to ${backupPath}`);
        }
      } catch (error) {
        console.warn(`Warning: Could not backup ${file}: ${error.message}`);
      }
    }
  }

  /**
   * Migrate configuration settings
   * @private
   */
  async _migrateConfigurations() {
    console.log("Migrating configuration settings...");

    try {
      // Read old configuration
      const oldConfigPath = path.join(this.sourceDir, "config.json");
      const oldConfig = await fs
        .readFile(oldConfigPath, "utf8")
        .then(JSON.parse)
        .catch(() => ({}));

      // Merge with new configuration structure
      const newConfig = {
        quantum: {
          entropyBufferSize: oldConfig.entropyBufferSize || 4096,
          hashAlgorithm: oldConfig.hashAlgorithm || "sha512",
          saltLength: oldConfig.saltLength || 32,
        },
        thermal: {
          maxTemperature: oldConfig.maxTemp || 85,
          throttleThreshold: oldConfig.throttleTemp || 75,
          pollingInterval: oldConfig.tempPollInterval || 1000,
          cooldownPeriod: oldConfig.cooldownTime || 5000,
        },
        processing: {
          maxConcurrent: oldConfig.maxTasks || require("os").cpus().length,
          queueLimit: oldConfig.queueSize || 10000,
          timeoutMs: oldConfig.taskTimeout || 30000,
        },
      };

      // Save new configuration
      const newConfigPath = path.join(this.sourceDir, "config.new.json");
      await fs.writeFile(newConfigPath, JSON.stringify(newConfig, null, 2));

      console.log("Configuration migration completed");
    } catch (error) {
      throw new Error(`Configuration migration failed: ${error.message}`);
    }
  }

  /**
   * Update file references in the codebase
   * @private
   */
  async _updateFileReferences() {
    console.log("Updating file references...");

    const files = [
      "implementation/ns-hdr-consolidated.js",
      "tests/thermal/ns-hdr-thermal-test.js",
      "tests/quantum/quantum-security-benchmark.js",
    ];

    for (const file of files) {
      const filePath = path.join(this.sourceDir, file);
      try {
        const exists = await fs
          .access(filePath)
          .then(() => true)
          .catch(() => false);

        if (exists) {
          let content = await fs.readFile(filePath, "utf8");

          // Update require statements
          content = content.replace(
            /require\(['"]\.\/nano-swarm-hdr['"]\)/g,
            "require('./ns-hdr-consolidated')"
          );

          await fs.writeFile(filePath, content);
          console.log(`Updated references in ${file}`);
        }
      } catch (error) {
        console.warn(
          `Warning: Could not update references in ${file}: ${error.message}`
        );
      }
    }
  }

  /**
   * Validate the migration
   * @private
   */
  async _validateMigration() {
    console.log("Validating migration...");

    const validationSteps = [
      this._validateFileStructure.bind(this),
      this._validateConfigurations.bind(this),
      this._validateBackups.bind(this),
    ];

    for (const step of validationSteps) {
      await step();
    }
  }

  /**
   * Validate file structure
   * @private
   */
  async _validateFileStructure() {
    const requiredFiles = [
      "implementation/ns-hdr-consolidated.js",
      "config.new.json",
    ];

    for (const file of requiredFiles) {
      const exists = await fs
        .access(path.join(this.sourceDir, file))
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        throw new Error(`Validation failed: Missing required file ${file}`);
      }
    }
  }

  /**
   * Validate configurations
   * @private
   */
  async _validateConfigurations() {
    const configPath = path.join(this.sourceDir, "config.new.json");
    const config = await fs.readFile(configPath, "utf8").then(JSON.parse);

    // Verify required configuration sections
    const requiredSections = ["quantum", "thermal", "processing"];
    for (const section of requiredSections) {
      if (!config[section]) {
        throw new Error(`Validation failed: Missing config section ${section}`);
      }
    }
  }

  /**
   * Validate backups
   * @private
   */
  async _validateBackups() {
    const backups = await fs.readdir(this.backupDir);
    if (backups.length === 0) {
      throw new Error("Validation failed: No backup files found");
    }
  }

  /**
   * Handle migration failure
   * @private
   */
  async _handleMigrationFailure(error) {
    console.error("Migration failed, initiating rollback...");

    try {
      // Restore from backups
      const backups = await fs.readdir(this.backupDir);
      for (const backup of backups) {
        if (backup.includes(this.timestamp)) {
          const originalName = backup.replace(`.${this.timestamp}.bak`, "");
          await fs.copyFile(
            path.join(this.backupDir, backup),
            path.join(this.sourceDir, originalName)
          );
          console.log(`Restored ${originalName} from backup`);
        }
      }

      console.log("Rollback completed successfully");
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
      throw new Error("Critical: Both migration and rollback failed");
    }
  }
}

module.exports = NSHDRMigrationUtility;

// Execute migration if run directly
if (require.main === module) {
  const migrator = new NSHDRMigrationUtility();
  migrator.migrate().catch(console.error);
}
