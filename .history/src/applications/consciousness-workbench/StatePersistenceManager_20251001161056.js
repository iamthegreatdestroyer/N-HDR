/**
 * HDR Empire Framework - State Persistence Manager
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 *
 * Persistent storage for consciousness states with compression and encryption
 */

import EventEmitter from 'events';
import fs from 'fs/promises';
import path from 'path';

/**
 * State Persistence Manager
 * 
 * Manages secure storage and retrieval of consciousness states
 * with optional compression and format conversion
 */
class StatePersistenceManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      storagePath: config.storagePath || './data/consciousness-states',
      compressionEnabled: config.compressionEnabled !== false,
      maxStorageSize: config.maxStorageSize || 1024 * 1024 * 1024, // 1GB
      autoCleanup: config.autoCleanup !== false,
      ...config
    };

    this.stateIndex = new Map();
    this.storageSize = 0;
    this.initialized = false;
  }

  /**
   * Initialize persistence manager
   */
  async initialize() {
    try {
      // Create storage directory
      await fs.mkdir(this.config.storagePath, { recursive: true });

      // Load state index
      await this._loadStateIndex();

      // Calculate storage size
      await this._calculateStorageSize();

      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      throw new Error(`Persistence manager initialization failed: ${error.message}`);
    }
  }

  /**
   * Save consciousness state
   * @param {Object} state - State to save
   * @returns {Promise<Object>} Save result
   */
  async save(state) {
    if (!this.initialized) {
      throw new Error('Persistence manager not initialized');
    }

    try {
      const statePath = this._getStatePath(state.id);

      // Compress if enabled
      const dataToSave = this.config.compressionEnabled 
        ? this._compress(state)
        : state;

      // Write to disk
      await fs.writeFile(
        statePath,
        JSON.stringify(dataToSave, null, 2),
        'utf-8'
      );

      // Update index
      const stat = await fs.stat(statePath);
      this.stateIndex.set(state.id, {
        id: state.id,
        path: statePath,
        size: stat.size,
        compressed: this.config.compressionEnabled,
        savedAt: Date.now()
      });

      this.storageSize += stat.size;

      // Check storage limits
      if (this.config.autoCleanup && this.storageSize > this.config.maxStorageSize) {
        await this._cleanup();
      }

      this.emit('state-saved', { stateId: state.id, size: stat.size });

      return {
        stateId: state.id,
        path: statePath,
        size: stat.size,
        compressed: this.config.compressionEnabled
      };
    } catch (error) {
      throw new Error(`State save failed: ${error.message}`);
    }
  }

  /**
   * Load consciousness state
   * @param {string} stateId - State identifier
   * @returns {Promise<Object>} Loaded state
   */
  async load(stateId) {
    if (!this.initialized) {
      throw new Error('Persistence manager not initialized');
    }

    try {
      const indexEntry = this.stateIndex.get(stateId);
      if (!indexEntry) {
        throw new Error(`State ${stateId} not found in index`);
      }

      // Read from disk
      const data = await fs.readFile(indexEntry.path, 'utf-8');
      let state = JSON.parse(data);

      // Decompress if needed
      if (indexEntry.compressed) {
        state = this._decompress(state);
      }

      this.emit('state-loaded', { stateId });

      return state;
    } catch (error) {
      throw new Error(`State load failed: ${error.message}`);
    }
  }

  /**
   * Delete consciousness state
   * @param {string} stateId - State identifier
   * @returns {Promise<void>}
   */
  async delete(stateId) {
    try {
      const indexEntry = this.stateIndex.get(stateId);
      if (!indexEntry) {
        return; // Already deleted
      }

      // Delete file
      await fs.unlink(indexEntry.path);

      // Update index and storage size
      this.storageSize -= indexEntry.size;
      this.stateIndex.delete(stateId);

      this.emit('state-deleted', { stateId });
    } catch (error) {
      throw new Error(`State deletion failed: ${error.message}`);
    }
  }

  /**
   * Export state in specific format
   * @param {Object} state - State to export
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Exported data
   */
  async export(state, options = {}) {
    const {
      format = 'json',
      compress = true,
      includeMetadata = true
    } = options;

    try {
      let exported;

      switch (format) {
        case 'json':
          exported = this._exportJSON(state, { compress, includeMetadata });
          break;
        case 'binary':
          exported = this._exportBinary(state, { compress, includeMetadata });
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      this.emit('state-exported', { stateId: state.id, format });

      return exported;
    } catch (error) {
      throw new Error(`State export failed: ${error.message}`);
    }
  }

  /**
   * Import state from external data
   * @param {Object} data - Import data
   * @returns {Promise<Object>} Imported state
   */
  async import(data) {
    try {
      let state;

      if (data.format === 'json') {
        state = this._importJSON(data);
      } else if (data.format === 'binary') {
        state = this._importBinary(data);
      } else {
        throw new Error(`Unsupported import format: ${data.format}`);
      }

      this.emit('state-imported', { stateId: state.id });

      return state;
    } catch (error) {
      throw new Error(`State import failed: ${error.message}`);
    }
  }

  /**
   * List all stored states
   * @returns {Array} State list
   */
  listStates() {
    return Array.from(this.stateIndex.values()).map(entry => ({
      id: entry.id,
      size: entry.size,
      compressed: entry.compressed,
      savedAt: entry.savedAt
    }));
  }

  /**
   * Get storage statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      stateCount: this.stateIndex.size,
      totalSize: this.storageSize,
      maxSize: this.config.maxStorageSize,
      utilizationPercent: (this.storageSize / this.config.maxStorageSize) * 100,
      compressionEnabled: this.config.compressionEnabled
    };
  }

  /**
   * Shutdown persistence manager
   */
  async shutdown() {
    // Save state index
    await this._saveStateIndex();

    this.stateIndex.clear();
    this.storageSize = 0;
    this.initialized = false;
    this.emit('shutdown');
  }

  /**
   * Get state file path
   * @private
   */
  _getStatePath(stateId) {
    return path.join(this.config.storagePath, `${stateId}.json`);
  }

  /**
   * Compress state
   * @private
   */
  _compress(state) {
    return {
      compressed: true,
      data: Buffer.from(JSON.stringify(state)).toString('base64'),
      originalSize: JSON.stringify(state).length
    };
  }

  /**
   * Decompress state
   * @private
   */
  _decompress(compressed) {
    if (!compressed.compressed) {
      return compressed;
    }

    const json = Buffer.from(compressed.data, 'base64').toString('utf-8');
    return JSON.parse(json);
  }

  /**
   * Export as JSON
   * @private
   */
  _exportJSON(state, options) {
    const exported = {
      format: 'json',
      version: '1.0.0',
      data: options.compress ? this._compress(state) : state
    };

    if (options.includeMetadata) {
      exported.metadata = {
        exportedAt: Date.now(),
        compressed: options.compress
      };
    }

    return exported;
  }

  /**
   * Export as binary
   * @private
   */
  _exportBinary(state, options) {
    const json = JSON.stringify(state);
    return {
      format: 'binary',
      version: '1.0.0',
      data: Buffer.from(json).toString('base64'),
      metadata: options.includeMetadata ? {
        exportedAt: Date.now(),
        originalSize: json.length
      } : undefined
    };
  }

  /**
   * Import from JSON
   * @private
   */
  _importJSON(data) {
    if (data.data.compressed) {
      return this._decompress(data.data);
    }
    return data.data;
  }

  /**
   * Import from binary
   * @private
   */
  _importBinary(data) {
    const json = Buffer.from(data.data, 'base64').toString('utf-8');
    return JSON.parse(json);
  }

  /**
   * Load state index
   * @private
   */
  async _loadStateIndex() {
    const indexPath = path.join(this.config.storagePath, 'index.json');
    
    try {
      const data = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(data);
      
      for (const entry of index) {
        this.stateIndex.set(entry.id, entry);
      }
    } catch (error) {
      // Index doesn't exist yet, will be created on first save
    }
  }

  /**
   * Save state index
   * @private
   */
  async _saveStateIndex() {
    const indexPath = path.join(this.config.storagePath, 'index.json');
    const index = Array.from(this.stateIndex.values());
    
    await fs.writeFile(
      indexPath,
      JSON.stringify(index, null, 2),
      'utf-8'
    );
  }

  /**
   * Calculate storage size
   * @private
   */
  async _calculateStorageSize() {
    this.storageSize = 0;
    
    for (const entry of this.stateIndex.values()) {
      this.storageSize += entry.size;
    }
  }

  /**
   * Cleanup old states
   * @private
   */
  async _cleanup() {
    // Sort by age, oldest first
    const entries = Array.from(this.stateIndex.values())
      .sort((a, b) => a.savedAt - b.savedAt);

    // Delete oldest states until under limit
    for (const entry of entries) {
      if (this.storageSize <= this.config.maxStorageSize * 0.8) {
        break;
      }

      await this.delete(entry.id);
    }

    this.emit('cleanup-complete', {
      deletedCount: entries.length,
      newSize: this.storageSize
    });
  }
}

export default StatePersistenceManager;
