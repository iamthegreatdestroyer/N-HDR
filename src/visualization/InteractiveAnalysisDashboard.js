/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * This file is part of the Neural-HDR (N-HDR) system, a component of the HDR Empire
 * technology suite. Unauthorized reproduction, distribution, or disclosure of this
 * software in whole or in part is strictly prohibited. All intellectual property
 * rights, including patent-pending technologies, are reserved.
 *
 * File: InteractiveAnalysisDashboard.js
 * Created: 2025-09-30
 * HDR Empire - Pioneering the Future of AI Consciousness
 */

import SwarmVisualizationEngine from "./SwarmVisualizationEngine.js";
import ConsciousnessStateVisualizer from "./ConsciousnessStateVisualizer.js";
import MultidimensionalDataRenderer from "./MultidimensionalDataRenderer.js";
import SecurityManager from "../core/security/security-manager.js";
import config from "../../config/nhdr-config.js";

/**
 * InteractiveAnalysisDashboard
 * User-facing dashboard for monitoring and controlling N-HDR analysis
 */
class InteractiveAnalysisDashboard {
  constructor() {
    this.security = new SecurityManager();
    this.components = new Map();
    this.panels = new Map();
    this.activeAnalysis = null;
    this.metrics = new Map();

    this.initialize();
  }

  /**
   * Initialize dashboard
   */
  initialize() {
    this._validateSecurityContext();
    this._createDashboardLayout();
    this._initializeComponents();
    this._setupEventHandlers();
    this._startMetricsCollection();
  }

  /**
   * Update dashboard with analysis data
   * @param {Object} analysisData - Current analysis data
   */
  updateDashboard(analysisData) {
    this.activeAnalysis = analysisData;
    this._updateVisualizationComponents();
    this._updateMetricsDisplay();
    this._updateControlPanel();
  }

  /**
   * Set dashboard mode
   * @param {string} mode - Dashboard mode ('standard', 'detailed', 'minimal')
   */
  setDashboardMode(mode) {
    this._reconfigureDashboard(mode);
    this._updateLayoutForMode(mode);
    this._updateComponentVisibility(mode);
  }

  /**
   * Export analysis results
   * @param {string} format - Export format ('json', 'csv', 'hdf')
   * @returns {Promise<Object>} Export result
   */
  async exportResults(format) {
    if (!this.activeAnalysis) {
      throw new Error("No active analysis to export");
    }

    const exportData = await this._prepareExportData(format);
    return this._performExport(exportData, format);
  }

  /**
   * Create dashboard layout
   * @private
   */
  _createDashboardLayout() {
    // Main container
    this.container = document.createElement("div");
    this.container.className = "nhdr-dashboard";
    document.body.appendChild(this.container);

    // Create panels
    this._createVisualizationPanel();
    this._createControlPanel();
    this._createMetricsPanel();
  }

  /**
   * Initialize visualization components
   * @private
   */
  _initializeComponents() {
    // Swarm visualization
    this.components.set(
      "swarm",
      new SwarmVisualizationEngine("swarm-container")
    );

    // Consciousness state visualization
    this.components.set(
      "consciousness",
      new ConsciousnessStateVisualizer("consciousness-container")
    );

    // Multi-dimensional data visualization
    this.components.set(
      "dimensions",
      new MultidimensionalDataRenderer("dimensions-container")
    );

    // Initialize all components
    this.components.forEach((component) => component.initialize());
  }

  /**
   * Setup event handlers
   * @private
   */
  _setupEventHandlers() {
    // Control panel events
    this._setupControlEvents();

    // Visualization interaction events
    this._setupVisualizationEvents();

    // Export and sharing events
    this._setupExportEvents();

    // System state events
    this._setupStateEvents();
  }

  /**
   * Setup control panel events
   * @private
   */
  _setupControlEvents() {
    const controls = this.panels.get("controls");
    if (!controls) return;

    // Swarm control events
    controls.querySelector("#swarm-deploy").addEventListener("click", () => {
      this._handleSwarmDeployment();
    });

    // Analysis control events
    controls.querySelector("#analysis-start").addEventListener("click", () => {
      this._handleAnalysisStart();
    });

    // Visualization control events
    controls.querySelector("#vis-mode").addEventListener("change", (event) => {
      this._handleVisualizationMode(event.target.value);
    });
  }

  /**
   * Setup visualization events
   * @private
   */
  _setupVisualizationEvents() {
    this.components.forEach((component, key) => {
      component.container.addEventListener("click", (event) => {
        this._handleVisualizationInteraction(key, event);
      });
    });
  }

  /**
   * Setup export events
   * @private
   */
  _setupExportEvents() {
    const exportButton = document.querySelector("#export-results");
    if (exportButton) {
      exportButton.addEventListener("click", () => {
        this._handleExportRequest();
      });
    }
  }

  /**
   * Setup state events
   * @private
   */
  _setupStateEvents() {
    window.addEventListener("stateChange", (event) => {
      this._handleStateChange(event.detail);
    });
  }

  /**
   * Start metrics collection
   * @private
   */
  _startMetricsCollection() {
    setInterval(() => {
      this._collectMetrics();
      this._updateMetricsDisplay();
    }, config.dashboard.metricsInterval);
  }

  /**
   * Collect system metrics
   * @private
   */
  _collectMetrics() {
    if (!this.activeAnalysis) return;

    this.metrics.set("swarmActivity", this._getSwarmMetrics());
    this.metrics.set("quantumState", this._getQuantumMetrics());
    this.metrics.set("systemLoad", this._getSystemMetrics());
  }

  /**
   * Update visualization components
   * @private
   */
  _updateVisualizationComponents() {
    if (!this.activeAnalysis) return;

    // Update swarm visualization
    this.components
      .get("swarm")
      ?.updateSwarmState(this.activeAnalysis.swarmState);

    // Update consciousness visualization
    this.components
      .get("consciousness")
      ?.visualizeState(this.activeAnalysis.consciousnessState);

    // Update dimensional data visualization
    this.components
      .get("dimensions")
      ?.renderData(this.activeAnalysis.dimensionalData);
  }

  /**
   * Update metrics display
   * @private
   */
  _updateMetricsDisplay() {
    const metricsPanel = this.panels.get("metrics");
    if (!metricsPanel) return;

    this.metrics.forEach((value, key) => {
      const element = metricsPanel.querySelector(`#${key}-metric`);
      if (element) {
        element.textContent = this._formatMetric(key, value);
      }
    });
  }

  /**
   * Update control panel
   * @private
   */
  _updateControlPanel() {
    const controlPanel = this.panels.get("controls");
    if (!controlPanel) return;

    // Update analysis status
    this._updateAnalysisStatus();

    // Update control states
    this._updateControlStates();

    // Update parameter displays
    this._updateParameterDisplays();
  }

  /**
   * Validate security context
   * @private
   * @throws {Error} If security validation fails
   */
  _validateSecurityContext() {
    const securityToken = this.security.getDashboardToken();
    if (!securityToken || !this.security.validateToken(securityToken)) {
      throw new Error("Invalid security context for dashboard");
    }
  }

  /**
   * Handle swarm deployment
   * @private
   */
  async _handleSwarmDeployment() {
    try {
      const deployment = await this.activeAnalysis.deploySwarm();
      this._updateSwarmStatus(deployment);
    } catch (error) {
      this._handleError("Swarm deployment failed", error);
    }
  }

  /**
   * Handle analysis start
   * @private
   */
  async _handleAnalysisStart() {
    try {
      const analysis = await this.activeAnalysis.startAnalysis();
      this.updateDashboard(analysis);
    } catch (error) {
      this._handleError("Analysis start failed", error);
    }
  }

  /**
   * Handle visualization mode change
   * @private
   * @param {string} mode - New visualization mode
   */
  _handleVisualizationMode(mode) {
    this.components.forEach((component) => {
      component.setVisualizationMode(mode);
    });
  }

  /**
   * Handle visualization interaction
   * @private
   * @param {string} componentKey - Component identifier
   * @param {Event} event - Interaction event
   */
  _handleVisualizationInteraction(componentKey, event) {
    const component = this.components.get(componentKey);
    if (component) {
      component.handleInteraction(event);
    }
  }

  /**
   * Handle export request
   * @private
   */
  async _handleExportRequest() {
    try {
      const format = document.querySelector("#export-format").value;
      const result = await this.exportResults(format);
      this._showExportSuccess(result);
    } catch (error) {
      this._handleError("Export failed", error);
    }
  }

  /**
   * Handle state change
   * @private
   * @param {Object} newState - New system state
   */
  _handleStateChange(newState) {
    this.updateDashboard(newState);
  }

  /**
   * Handle error
   * @private
   * @param {string} message - Error message
   * @param {Error} error - Error object
   */
  _handleError(message, error) {
    console.error(message, error);
    this._showErrorNotification(message);
  }

  /**
   * Show error notification
   * @private
   * @param {string} message - Error message
   */
  _showErrorNotification(message) {
    const notification = document.createElement("div");
    notification.className = "nhdr-notification error";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  /**
   * Format metric value
   * @private
   * @param {string} key - Metric key
   * @param {*} value - Metric value
   * @returns {string} Formatted metric
   */
  _formatMetric(key, value) {
    switch (key) {
      case "swarmActivity":
        return `${value.toFixed(2)}%`;
      case "quantumState":
        return value.toString();
      case "systemLoad":
        return `${value.toFixed(1)} units`;
      default:
        return value.toString();
    }
  }

  /**
   * Get swarm metrics
   * @private
   * @returns {Object} Swarm metrics
   */
  _getSwarmMetrics() {
    return {
      activeNanobots: this.activeAnalysis?.swarmState?.activeCount || 0,
      efficiency: this.activeAnalysis?.swarmState?.efficiency || 0,
      coverage: this.activeAnalysis?.swarmState?.coverage || 0,
    };
  }

  /**
   * Get quantum metrics
   * @private
   * @returns {Object} Quantum metrics
   */
  _getQuantumMetrics() {
    return {
      entanglement: this.activeAnalysis?.quantumState?.entanglement || 0,
      coherence: this.activeAnalysis?.quantumState?.coherence || 0,
      stability: this.activeAnalysis?.quantumState?.stability || 0,
    };
  }

  /**
   * Get system metrics
   * @private
   * @returns {Object} System metrics
   */
  _getSystemMetrics() {
    return {
      cpu: this.activeAnalysis?.systemState?.cpuUsage || 0,
      memory: this.activeAnalysis?.systemState?.memoryUsage || 0,
      throughput: this.activeAnalysis?.systemState?.throughput || 0,
    };
  }
}

export default InteractiveAnalysisDashboard;
