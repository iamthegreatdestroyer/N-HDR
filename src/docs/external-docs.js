/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * External documentation services integration.
 */

import axios from "axios";
import path from "path";
import { promisify } from "util";
const fs = require("fs").promises;

class ExternalDocsIntegration {
  /**
   * Create new external documentation integration
   * @param {Object} options - Integration options
   */
  constructor(options = {}) {
    this.options = {
      services: {
        github: options.github || {},
        readthedocs: options.readthedocs || {},
        swagger: options.swagger || {},
        ...options.services,
      },
      cacheDir: options.cacheDir || ".cache/external-docs",
      cacheDuration: options.cacheDuration || 3600, // 1 hour
      ...options,
    };

    this.cache = new Map();
  }

  /**
   * Initialize integration
   */
  async initialize() {
    await this._ensureDirectory(this.options.cacheDir);
    await this._loadCache();
  }

  /**
   * Fetch documentation from external service
   * @param {string} service - Service name
   * @param {Object} params - Service parameters
   * @returns {Promise<Object>} Documentation data
   */
  async fetchDocs(service, params) {
    const cacheKey = this._getCacheKey(service, params);
    const cached = this._getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    const docs = await this._fetchFromService(service, params);
    await this._saveToCache(cacheKey, docs);

    return docs;
  }

  /**
   * Add documentation link
   * @param {string} service - Service name
   * @param {Object} params - Service parameters
   * @param {string} filePath - Documentation file path
   */
  async addLink(service, params, filePath) {
    const docs = await this.fetchDocs(service, params);
    await this._injectLink(filePath, docs);
  }

  /**
   * Sync documentation with external service
   * @param {string} service - Service name
   * @param {Object} params - Service parameters
   * @param {string} localPath - Local documentation path
   */
  async sync(service, params, localPath) {
    const docs = await this.fetchDocs(service, params);
    await this._syncDocs(docs, localPath);
  }

  /**
   * Fetch documentation from service
   * @param {string} service - Service name
   * @param {Object} params - Service parameters
   * @returns {Promise<Object>} Documentation data
   * @private
   */
  async _fetchFromService(service, params) {
    switch (service) {
      case "github":
        return await this._fetchFromGitHub(params);
      case "readthedocs":
        return await this._fetchFromReadTheDocs(params);
      case "swagger":
        return await this._fetchFromSwagger(params);
      default:
        throw new Error(`Unsupported service: ${service}`);
    }
  }

  /**
   * Fetch documentation from GitHub
   * @param {Object} params - GitHub parameters
   * @returns {Promise<Object>} Documentation data
   * @private
   */
  async _fetchFromGitHub(params) {
    const { owner, repo, path = "", ref = "main" } = params;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(this.options.services.github.token && {
            Authorization: `token ${this.options.services.github.token}`,
          }),
        },
        params: { ref },
      });

      return {
        type: "github",
        content: Buffer.from(response.data.content, "base64").toString(),
        metadata: {
          sha: response.data.sha,
          url: response.data.html_url,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch from GitHub: ${error.message}`);
    }
  }

  /**
   * Fetch documentation from ReadTheDocs
   * @param {Object} params - ReadTheDocs parameters
   * @returns {Promise<Object>} Documentation data
   * @private
   */
  async _fetchFromReadTheDocs(params) {
    const { project, version = "latest", page } = params;
    const apiUrl = `https://${project}.readthedocs.io/en/${version}/${page}`;

    try {
      const response = await axios.get(apiUrl);
      return {
        type: "readthedocs",
        content: response.data,
        metadata: {
          project,
          version,
          url: apiUrl,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch from ReadTheDocs: ${error.message}`);
    }
  }

  /**
   * Fetch documentation from Swagger
   * @param {Object} params - Swagger parameters
   * @returns {Promise<Object>} Documentation data
   * @private
   */
  async _fetchFromSwagger(params) {
    const { url } = params;

    try {
      const response = await axios.get(url);
      return {
        type: "swagger",
        content: response.data,
        metadata: {
          url,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch from Swagger: ${error.message}`);
    }
  }

  /**
   * Get cache key for service and params
   * @param {string} service - Service name
   * @param {Object} params - Service parameters
   * @returns {string} Cache key
   * @private
   */
  _getCacheKey(service, params) {
    return `${service}:${JSON.stringify(params)}`;
  }

  /**
   * Get documentation from cache
   * @param {string} key - Cache key
   * @returns {Object} Cached documentation
   * @private
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.options.cacheDuration * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Save documentation to cache
   * @param {string} key - Cache key
   * @param {Object} data - Documentation data
   * @private
   */
  async _saveToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    const cacheFile = path.join(
      this.options.cacheDir,
      `${key.replace(/[^a-z0-9]/gi, "_")}.json`
    );
    await fs.writeFile(
      cacheFile,
      JSON.stringify({
        key,
        data,
        timestamp: Date.now(),
      })
    );
  }

  /**
   * Load cache from disk
   * @private
   */
  async _loadCache() {
    try {
      const files = await fs.readdir(this.options.cacheDir);

      for (const file of files) {
        if (!file.endsWith(".json")) continue;

        const filePath = path.join(this.options.cacheDir, file);
        const content = await fs.readFile(filePath, "utf8");
        const { key, data, timestamp } = JSON.parse(content);

        const age = Date.now() - timestamp;
        if (age <= this.options.cacheDuration * 1000) {
          this.cache.set(key, { data, timestamp });
        } else {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.warn("Failed to load cache:", error);
      }
    }
  }

  /**
   * Inject external documentation link
   * @param {string} filePath - Documentation file path
   * @param {Object} docs - Documentation data
   * @private
   */
  async _injectLink(filePath, docs) {
    try {
      let content = await fs.readFile(filePath, "utf8");
      const link = this._formatLink(docs);

      // Insert link at appropriate location based on file type
      if (filePath.endsWith(".md")) {
        content = this._injectMarkdownLink(content, link);
      } else if (filePath.endsWith(".html")) {
        content = this._injectHtmlLink(content, link);
      }

      await fs.writeFile(filePath, content);
    } catch (error) {
      throw new Error(`Failed to inject link: ${error.message}`);
    }
  }

  /**
   * Format documentation link
   * @param {Object} docs - Documentation data
   * @returns {Object} Formatted link
   * @private
   */
  _formatLink(docs) {
    const { type, metadata } = docs;
    const title = this._getLinkTitle(type, metadata);
    const url = metadata.url;

    return {
      title,
      url,
      icon: this._getLinkIcon(type),
    };
  }

  /**
   * Get link title
   * @param {string} type - Service type
   * @param {Object} metadata - Documentation metadata
   * @returns {string} Link title
   * @private
   */
  _getLinkTitle(type, metadata) {
    switch (type) {
      case "github":
        return `View on GitHub`;
      case "readthedocs":
        return `Read the Docs - ${metadata.project}`;
      case "swagger":
        return `API Documentation`;
      default:
        return `External Documentation`;
    }
  }

  /**
   * Get link icon
   * @param {string} type - Service type
   * @returns {string} Icon class
   * @private
   */
  _getLinkIcon(type) {
    switch (type) {
      case "github":
        return "fa-github";
      case "readthedocs":
        return "fa-book";
      case "swagger":
        return "fa-code";
      default:
        return "fa-external-link";
    }
  }

  /**
   * Inject link into Markdown content
   * @param {string} content - Markdown content
   * @param {Object} link - Link data
   * @returns {string} Updated content
   * @private
   */
  _injectMarkdownLink(content, link) {
    const linkText = `\n\n---\n\n[${link.title}](${link.url}) <i class="fas ${link.icon}"></i>`;
    return content + linkText;
  }

  /**
   * Inject link into HTML content
   * @param {string} content - HTML content
   * @param {Object} link - Link data
   * @returns {string} Updated content
   * @private
   */
  _injectHtmlLink(content, link) {
    const linkHtml = `
      <div class="external-link">
        <a href="${link.url}" target="_blank" rel="noopener">
          <i class="fas ${link.icon}"></i> ${link.title}
        </a>
      </div>
    `;
    return content.replace("</body>", `${linkHtml}</body>`);
  }

  /**
   * Sync external documentation
   * @param {Object} docs - Documentation data
   * @param {string} localPath - Local documentation path
   * @private
   */
  async _syncDocs(docs, localPath) {
    try {
      const content = docs.content;

      // Transform content based on service type
      const transformed = await this._transformContent(docs.type, content);

      // Write to local path
      await fs.writeFile(localPath, transformed);

      // Update metadata
      await this._updateMetadata(localPath, docs.metadata);
    } catch (error) {
      throw new Error(`Failed to sync documentation: ${error.message}`);
    }
  }

  /**
   * Transform documentation content
   * @param {string} type - Service type
   * @param {string} content - Documentation content
   * @returns {Promise<string>} Transformed content
   * @private
   */
  async _transformContent(type, content) {
    switch (type) {
      case "github":
        return this._transformGitHubContent(content);
      case "readthedocs":
        return this._transformReadTheDocsContent(content);
      case "swagger":
        return this._transformSwaggerContent(content);
      default:
        return content;
    }
  }

  /**
   * Transform GitHub content
   * @param {string} content - GitHub content
   * @returns {string} Transformed content
   * @private
   */
  _transformGitHubContent(content) {
    // Add custom styling
    return content.replace(
      /(```[^`]+```)/g,
      '<div class="github-snippet">$1</div>'
    );
  }

  /**
   * Transform ReadTheDocs content
   * @param {string} content - ReadTheDocs content
   * @returns {string} Transformed content
   * @private
   */
  _transformReadTheDocsContent(content) {
    // Extract main content and apply custom styling
    const mainContent = content.match(
      /<div[^>]+class="document"[^>]*>([\s\S]*?)<\/div>/
    );
    return mainContent ? mainContent[1] : content;
  }

  /**
   * Transform Swagger content
   * @param {string} content - Swagger content
   * @returns {string} Transformed content
   * @private
   */
  _transformSwaggerContent(content) {
    // Convert Swagger JSON to HTML
    const swaggerUi = require("swagger-ui");
    return swaggerUi.generateHTML(content);
  }

  /**
   * Update documentation metadata
   * @param {string} filePath - Documentation file path
   * @param {Object} metadata - Documentation metadata
   * @private
   */
  async _updateMetadata(filePath, metadata) {
    const metaFile = `${filePath}.meta.json`;
    await fs.writeFile(metaFile, JSON.stringify(metadata, null, 2));
  }

  /**
   * Ensure directory exists
   * @param {string} dir - Directory path
   * @private
   */
  async _ensureDirectory(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }
}

export default ExternalDocsIntegration;
