/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 * 
 * BASE VISUALIZATION VIEW
 * Base class for N-HDR visualization components
 */

/**
 * @class BaseView
 * @description Base class for visualization views
 */
class BaseView {
  /**
   * Create new BaseView
   * @param {Object} options - View options
   */
  constructor(options = {}) {
    this.options = {
      refreshRate: options.refreshRate || 1000,
      animationEnabled: options.animationEnabled !== false,
      theme: options.theme || 'dark',
      ...options
    };

    this.metrics = new Map();
    this.lastUpdate = Date.now();
    this.isInitialized = false;
  }

  /**
   * Initialize view
   * @param {HTMLElement} container - View container element
   * @returns {Promise<boolean>} Success status
   */
  async initialize(container) {
    if (this.isInitialized) {
      return true;
    }

    try {
      this.container = container;
      await this._initializeView();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('View initialization error:', error);
      return false;
    }
  }

  /**
   * Update view with new metrics
   * @param {Map} metrics - Current metrics
   */
  update(metrics) {
    if (!this.isInitialized) {
      return;
    }

    try {
      this._updateView(metrics);
      this.lastUpdate = Date.now();
    } catch (error) {
      console.error('View update error:', error);
    }
  }

  /**
   * Render view content
   * @returns {Promise<boolean>} Success status
   */
  async render() {
    if (!this.isInitialized) {
      return false;
    }

    try {
      await this._renderContent();
      return true;
    } catch (error) {
      console.error('View render error:', error);
      return false;
    }
  }

  /**
   * Clean up view resources
   */
  cleanup() {
    if (!this.isInitialized) {
      return;
    }

    try {
      this._cleanupView();
      this.isInitialized = false;
    } catch (error) {
      console.error('View cleanup error:', error);
    }
  }

  /**
   * Initialize view content
   * @protected
   */
  async _initializeView() {
    // To be implemented by child classes
    throw new Error('_initializeView must be implemented');
  }

  /**
   * Update view with new metrics
   * @param {Map} metrics - Current metrics
   * @protected
   */
  _updateView(metrics) {
    // To be implemented by child classes
    throw new Error('_updateView must be implemented');
  }

  /**
   * Render view content
   * @protected
   */
  async _renderContent() {
    // To be implemented by child classes
    throw new Error('_renderContent must be implemented');
  }

  /**
   * Clean up view resources
   * @protected
   */
  _cleanupView() {
    // To be implemented by child classes
    throw new Error('_cleanupView must be implemented');
  }

  /**
   * Format metric value for display
   * @param {*} value - Metric value
   * @param {string} type - Value type
   * @returns {string} Formatted value
   * @protected
   */
  _formatValue(value, type = 'number') {
    switch (type) {
      case 'number':
        return typeof value === 'number' 
          ? value.toFixed(2)
          : 'N/A';
      
      case 'percentage':
        return typeof value === 'number'
          ? `${(value * 100).toFixed(1)}%`
          : 'N/A';
      
      case 'bytes':
        return typeof value === 'number'
          ? this._formatBytes(value)
          : 'N/A';
      
      case 'timestamp':
        return value instanceof Date
          ? value.toISOString()
          : 'N/A';
      
      default:
        return String(value);
    }
  }

  /**
   * Format byte size for display
   * @param {number} bytes - Byte size
   * @returns {string} Formatted size
   * @protected
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Get theme colors
   * @returns {Object} Theme colors
   * @protected
   */
  _getThemeColors() {
    return this.options.theme === 'dark'
      ? {
          background: '#1E1E1E',
          text: '#FFFFFF',
          primary: '#007ACC',
          secondary: '#569CD6',
          accent: '#C586C0',
          error: '#F44747'
        }
      : {
          background: '#FFFFFF',
          text: '#000000',
          primary: '#0078D4',
          secondary: '#106EBE',
          accent: '#A4262C',
          error: '#E81123'
        };
  }
}

module.exports = BaseView;