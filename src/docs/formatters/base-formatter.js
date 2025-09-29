/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Base formatter interface for documentation output.
 */

class BaseFormatter {
  /**
   * Format component documentation
   * @param {Object} component - Component data
   * @returns {string} Formatted content
   */
  formatComponent(component) {
    throw new Error("formatComponent must be implemented");
  }

  /**
   * Format method documentation
   * @param {Object} method - Method data
   * @returns {string} Formatted content
   */
  formatMethod(method) {
    throw new Error("formatMethod must be implemented");
  }

  /**
   * Format example documentation
   * @param {Object} example - Example data
   * @returns {string} Formatted content
   */
  formatExample(example) {
    throw new Error("formatExample must be implemented");
  }

  /**
   * Format source code
   * @param {string} source - Source code
   * @returns {string} Formatted content
   */
  formatSource(source) {
    throw new Error("formatSource must be implemented");
  }

  /**
   * Format index page
   * @param {Object} data - Index data
   * @returns {string} Formatted content
   */
  formatIndex(data) {
    throw new Error("formatIndex must be implemented");
  }

  /**
   * Format search index
   * @param {Object} searchIndex - Search index data
   * @returns {string} Formatted content
   */
  formatSearchIndex(searchIndex) {
    throw new Error("formatSearchIndex must be implemented");
  }

  /**
   * Get file extension for this format
   * @returns {string} File extension
   */
  getFileExtension() {
    throw new Error("getFileExtension must be implemented");
  }
}
