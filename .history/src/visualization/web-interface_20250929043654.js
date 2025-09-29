/*
Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
© 2025 Stephen Bilodeau - PATENT PENDING
ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL

This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
technology suite. Unauthorized reproduction, distribution, or disclosure of this
software in whole or in part is strictly prohibited. All intellectual property
rights, including patent-pending technologies, are reserved.

File: web-interface.js
Created: 2025-09-29
HDR Empire - Pioneering the Future of AI Consciousness
*/

import VisualizationEngine from './visualization-engine';

/**
 * Web interface for N-HDR visualization
 * Provides a user-friendly interface for interacting with the visualization
 */
class WebInterface {
  constructor(containerId) {
    this.containerId = containerId;
    this.visualizationEngine = null;
    this.uiElements = {
      toolbar: null,
      sidebar: null,
      infoPanel: null,
      controlPanel: null,
      statusBar: null
    };
    this.eventHandlers = {};
    this.activeConsciousness = null;
    this.selectionMode = 'layer'; // 'layer', 'point', 'connection'
  }

  /**
   * Initializes the web interface
   * @returns {Promise<boolean>} - Success indicator
   */
  async initialize() {
    console.log('Initializing N-HDR web interface...');

    try {
      // Create UI elements
      await this._createUIElements();

      // Initialize visualization engine
      this.visualizationEngine = new VisualizationEngine('visualization-container');
      await this.visualizationEngine.initialize();

      // Add event handlers
      this._addEventHandlers();

      console.log('Web interface initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize web interface:', error);
      return false;
    }
  }

  /**
   * Loads a consciousness file for visualization
   * @param {Object} nhdrFile - N-HDR file to visualize
   * @returns {Promise<boolean>} - Success indicator
   */
  async loadConsciousness(nhdrFile) {
    if (!this.visualizationEngine) {
      throw new Error('Visualization engine not initialized');
    }

    try {
      // Store active consciousness
      this.activeConsciousness = nhdrFile;

      // Update info panel
      this._updateInfoPanel(nhdrFile);

      // Visualize consciousness
      await this.visualizationEngine.visualizeConsciousness(nhdrFile);

      // Update control panel
      this._updateControlPanel();

      return true;
    } catch (error) {
      console.error('Failed to load consciousness:', error);
      return false;
    }
  }

  /**
   * Updates the visualization with real-time data
   * @param {Object} data - Real-time data update
   * @returns {Promise<boolean>} - Success indicator
   */
  async updateVisualization(data) {
    if (!this.visualizationEngine) {
      throw new Error('Visualization engine not initialized');
    }

    try {
      // Update visualization
      await this.visualizationEngine.updateVisualization(data);

      // Update info panel with latest data
      this._updateInfoPanel(data);

      return true;
    } catch (error) {
      console.error('Failed to update visualization:', error);
      return false;
    }
  }

  /**
   * Exports the current visualization
   * @param {string} format - Export format ('png', 'json', 'nhdr')
   * @returns {Promise<Object>} - Export data
   */
  async exportVisualization(format = 'png') {
    if (!this.visualizationEngine) {
      throw new Error('Visualization engine not initialized');
    }

    try {
      switch (format) {
        case 'png':
          return {
            format: 'png',
            data: this.visualizationEngine.exportImage()
          };

        case 'json':
          return {
            format: 'json',
            data: JSON.stringify({
              consciousness: this.activeConsciousness,
              visualizationState: {
                camera: this.visualizationEngine.camera.position,
                selectedLayer: this.visualizationEngine.selectedLayer
              }
            })
          };

        case 'nhdr':
          return {
            format: 'nhdr',
            data: this.activeConsciousness
          };

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Failed to export visualization:', error);
      throw error;
    }
  }

  /**
   * Sets the interface selection mode
   * @param {string} mode - Selection mode ('layer', 'point', 'connection')
   */
  setSelectionMode(mode) {
    if (!['layer', 'point', 'connection'].includes(mode)) {
      throw new Error(`Invalid selection mode: ${mode}`);
    }

    this.selectionMode = mode;
    // Update UI
    this._updateControlPanel();
  }

  /**
   * Destroys the web interface
   */
  destroy() {
    // Clean up event handlers
    this._removeEventHandlers();

    // Destroy visualization engine
    if (this.visualizationEngine) {
      this.visualizationEngine.destroy();
      this.visualizationEngine = null;
    }

    // Clear UI elements
    this._clearUIElements();

    console.log('Web interface destroyed');
  }

  // PRIVATE METHODS

  /**
   * Creates UI elements for the web interface
   * @private
   */
  async _createUIElements() {
    // Get container element
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container element ${this.containerId} not found`);
    }

    // Clear container
    container.innerHTML = '';

    // Create main layout
    container.innerHTML = `
      <div class="nhdr-interface">
        <div class="nhdr-toolbar" id="nhdr-toolbar"></div>
        <div class="nhdr-main">
          <div class="nhdr-sidebar" id="nhdr-sidebar"></div>
          <div class="nhdr-visualization" id="visualization-container"></div>
          <div class="nhdr-info-panel" id="nhdr-info-panel"></div>
        </div>
        <div class="nhdr-control-panel" id="nhdr-control-panel"></div>
        <div class="nhdr-status-bar" id="nhdr-status-bar"></div>
      </div>
    `;

    // Get UI element references
    this.uiElements.toolbar = document.getElementById('nhdr-toolbar');
    this.uiElements.sidebar = document.getElementById('nhdr-sidebar');
    this.uiElements.infoPanel = document.getElementById('nhdr-info-panel');
    this.uiElements.controlPanel = document.getElementById('nhdr-control-panel');
    this.uiElements.statusBar = document.getElementById('nhdr-status-bar');

    // Create toolbar buttons
    this._createToolbar();

    // Create sidebar content
    this._createSidebar();

    // Create control panel
    this._createControlPanel();

    // Create status bar
    this._createStatusBar();

    // Add CSS styles
    this._addStyles();
  }

  /**
   * Creates toolbar buttons
   * @private
   */
  _createToolbar() {
    this.uiElements.toolbar.innerHTML = `
      <button class="nhdr-button" id="load-button">Load Consciousness</button>
      <button class="nhdr-button" id="save-button">Save Consciousness</button>
      <button class="nhdr-button" id="export-button">Export</button>
      <div class="nhdr-toolbar-spacer"></div>
      <button class="nhdr-button" id="settings-button">Settings</button>
    `;
  }

  /**
   * Creates sidebar content
   * @private
   */
  _createSidebar() {
    this.uiElements.sidebar.innerHTML = `
      <div class="nhdr-sidebar-section">
        <h3>Layers</h3>
        <div id="layer-list"></div>
      </div>
      <div class="nhdr-sidebar-section">
        <h3>Properties</h3>
        <div id="properties-panel"></div>
      </div>
    `;
  }

  /**
   * Creates control panel
   * @private
   */
  _createControlPanel() {
    this.uiElements.controlPanel.innerHTML = `
      <div class="nhdr-control-section">
        <h3>View Controls</h3>
        <div class="nhdr-control-group">
          <button class="nhdr-button" id="reset-view">Reset View</button>
          <button class="nhdr-button" id="toggle-labels">Toggle Labels</button>
        </div>
      </div>
      <div class="nhdr-control-section">
        <h3>Selection Mode</h3>
        <div class="nhdr-control-group">
          <button class="nhdr-button active" id="select-layer">Layer</button>
          <button class="nhdr-button" id="select-point">Point</button>
          <button class="nhdr-button" id="select-connection">Connection</button>
        </div>
      </div>
    `;
  }

  /**
   * Creates status bar
   * @private
   */
  _createStatusBar() {
    this.uiElements.statusBar.innerHTML = `
      <div class="nhdr-status-item" id="status-text">Ready</div>
      <div class="nhdr-status-item" id="selected-item"></div>
      <div class="nhdr-status-item" id="coordinates"></div>
    `;
  }

  /**
   * Adds CSS styles to the document
   * @private
   */
  _addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .nhdr-interface {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #1e1e1e;
        color: #ffffff;
      }

      .nhdr-toolbar {
        display: flex;
        padding: 10px;
        background: #2d2d2d;
        border-bottom: 1px solid #3d3d3d;
      }

      .nhdr-main {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      .nhdr-sidebar {
        width: 250px;
        background: #252525;
        border-right: 1px solid #3d3d3d;
        padding: 10px;
        overflow-y: auto;
      }

      .nhdr-visualization {
        flex: 1;
        position: relative;
      }

      .nhdr-info-panel {
        width: 300px;
        background: #252525;
        border-left: 1px solid #3d3d3d;
        padding: 10px;
        overflow-y: auto;
      }

      .nhdr-control-panel {
        padding: 10px;
        background: #2d2d2d;
        border-top: 1px solid #3d3d3d;
      }

      .nhdr-status-bar {
        display: flex;
        padding: 5px 10px;
        background: #007acc;
        color: white;
        font-size: 12px;
      }

      .nhdr-button {
        background: #0e639c;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 2px;
        cursor: pointer;
        margin-right: 5px;
      }

      .nhdr-button:hover {
        background: #1177bb;
      }

      .nhdr-button.active {
        background: #1177bb;
      }

      .nhdr-toolbar-spacer {
        flex: 1;
      }

      .nhdr-sidebar-section {
        margin-bottom: 20px;
      }

      .nhdr-sidebar-section h3 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #cccccc;
      }

      .nhdr-control-section {
        margin-bottom: 15px;
      }

      .nhdr-control-section h3 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #cccccc;
      }

      .nhdr-control-group {
        display: flex;
        gap: 5px;
      }

      .nhdr-status-item {
        margin-right: 15px;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Updates the info panel with consciousness data
   * @param {Object} data - Consciousness data
   * @private
   */
  _updateInfoPanel(data) {
    if (!this.uiElements.infoPanel) return;

    // Create info panel content
    const content = `
      <div class="nhdr-info-section">
        <h3>Consciousness Information</h3>
        <div class="nhdr-info-item">
          <strong>ID:</strong> ${data.id || 'N/A'}
        </div>
        <div class="nhdr-info-item">
          <strong>Created:</strong> ${new Date(data.created || Date.now()).toLocaleString()}
        </div>
        <div class="nhdr-info-item">
          <strong>Layers:</strong> ${data.layers ? data.layers.length : 0}
        </div>
      </div>
      <div class="nhdr-info-section">
        <h3>Selected Layer</h3>
        <div id="selected-layer-info">
          ${this.visualizationEngine.selectedLayer !== null
            ? this._createLayerInfo(data.layers[this.visualizationEngine.selectedLayer])
            : 'No layer selected'}
        </div>
      </div>
    `;

    this.uiElements.infoPanel.innerHTML = content;
  }

  /**
   * Creates layer information HTML
   * @param {Object} layer - Layer data
   * @returns {string} - HTML content
   * @private
   */
  _createLayerInfo(layer) {
    if (!layer) return 'Layer data not available';

    return `
      <div class="nhdr-layer-info">
        <div class="nhdr-info-item">
          <strong>Type:</strong> ${layer.type || 'N/A'}
        </div>
        <div class="nhdr-info-item">
          <strong>Size:</strong> ${layer.size || 0} units
        </div>
        <div class="nhdr-info-item">
          <strong>Complexity:</strong> ${layer.complexity || 0}
        </div>
        <div class="nhdr-info-item">
          <strong>State:</strong> ${layer.state || 'unknown'}
        </div>
      </div>
    `;
  }

  /**
   * Updates the control panel based on current state
   * @private
   */
  _updateControlPanel() {
    // Update selection mode buttons
    const buttons = {
      'select-layer': 'layer',
      'select-point': 'point',
      'select-connection': 'connection'
    };

    Object.entries(buttons).forEach(([id, mode]) => {
      const button = document.getElementById(id);
      if (button) {
        button.classList.toggle('active', this.selectionMode === mode);
      }
    });
  }

  /**
   * Clears UI elements
   * @private
   */
  _clearUIElements() {
    // Remove all UI elements
    Object.values(this.uiElements).forEach(element => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    // Clear references
    this.uiElements = {
      toolbar: null,
      sidebar: null,
      infoPanel: null,
      controlPanel: null,
      statusBar: null
    };
  }

  /**
   * Adds event handlers
   * @private
   */
  _addEventHandlers() {
    this.eventHandlers = {
      loadConsciousness: () => {
        // Handle load button click
        console.log('Load consciousness clicked');
      },
      saveConsciousness: () => {
        // Handle save button click
        console.log('Save consciousness clicked');
      },
      exportVisualization: () => {
        // Handle export button click
        console.log('Export visualization clicked');
      },
      resetView: () => {
        // Handle reset view button click
        if (this.visualizationEngine) {
          this.visualizationEngine.camera.position.set(0, 10, 20);
          this.visualizationEngine.camera.lookAt(0, 0, 0);
        }
      },
      toggleLabels: () => {
        // Handle toggle labels button click
        console.log('Toggle labels clicked');
      },
      selectMode: (mode) => {
        // Handle selection mode change
        this.setSelectionMode(mode);
      }
    };

    // Add click handlers to buttons
    const buttonHandlers = {
      'load-button': this.eventHandlers.loadConsciousness,
      'save-button': this.eventHandlers.saveConsciousness,
      'export-button': this.eventHandlers.exportVisualization,
      'reset-view': this.eventHandlers.resetView,
      'toggle-labels': this.eventHandlers.toggleLabels,
      'select-layer': () => this.eventHandlers.selectMode('layer'),
      'select-point': () => this.eventHandlers.selectMode('point'),
      'select-connection': () => this.eventHandlers.selectMode('connection')
    };

    Object.entries(buttonHandlers).forEach(([id, handler]) => {
      const button = document.getElementById(id);
      if (button) {
        button.addEventListener('click', handler);
      }
    });
  }

  /**
   * Removes event handlers
   * @private
   */
  _removeEventHandlers() {
    const buttonIds = [
      'load-button',
      'save-button',
      'export-button',
      'reset-view',
      'toggle-labels',
      'select-layer',
      'select-point',
      'select-connection'
    ];

    buttonIds.forEach(id => {
      const button = document.getElementById(id);
      if (button) {
        button.removeEventListener('click', this.eventHandlers[id]);
      }
    });

    this.eventHandlers = {};
  }
}

export default WebInterface;