/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Documentation formatters for multi-format output support.
 */

import HtmlFormatter from "./html-formatter.js";
import MarkdownFormatter from "./markdown-formatter.js";
import JsonFormatter from "./json-formatter.js";

/**
 * Get formatter instance for specified format
 * @param {string} format - The output format (html, markdown, json)
 * @returns {BaseFormatter} Formatter instance
 */
function getFormatter(format) {
  switch (format.toLowerCase()) {
    case "html":
      return new HtmlFormatter();
    case "markdown":
    case "md":
      return new MarkdownFormatter();
    case "json":
      return new JsonFormatter();
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

module.exports = {
  getFormatter,
};
