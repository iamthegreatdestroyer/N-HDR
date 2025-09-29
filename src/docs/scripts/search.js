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
 * File: search.js
 * Created: 2025-09-28
 * HDR Empire - Pioneering the Future of AI Consciousness
 *
 * Intelligent documentation search component with auto-suggestions and fuzzy matching
 * for fast and accurate code/component lookups.
 */

class DocSearch {
  constructor() {
    this.searchIndex = null;
    this.searchInput = document.getElementById("search-input");
    this.searchResults = document.getElementById("search-results");
    this.searchData = null;

    this.init();
  }

  /**
   * Initialize search functionality
   */
  async init() {
    try {
      // Load search index
      const response = await fetch("../search-index.json");
      this.searchData = await response.json();

      // Build search index
      this.buildSearchIndex();

      // Attach event listeners
      if (this.searchInput) {
        this.searchInput.addEventListener(
          "input",
          this.debounce(() => this.handleSearch(), 300)
        );
      }
    } catch (error) {
      console.error("Error initializing search:", error);
    }
  }

  /**
   * Build search index from components data
   */
  buildSearchIndex() {
    this.searchIndex = {
      components: new Map(),
      methods: new Map(),
      examples: new Map(),
    };

    // Index components
    for (const component of this.searchData.components) {
      this.searchIndex.components.set(component.id, {
        ...component,
        tokens: this.tokenize(`${component.name} ${component.description}`),
      });
    }

    // Index methods
    for (const method of this.searchData.methods) {
      this.searchIndex.methods.set(method.id, {
        ...method,
        tokens: this.tokenize(`${method.name} ${method.description}`),
      });
    }

    // Index examples
    for (const example of this.searchData.examples) {
      this.searchIndex.examples.set(example.id, {
        ...example,
        tokens: this.tokenize(example.description),
      });
    }
  }

  /**
   * Handle search input
   */
  async handleSearch() {
    const query = this.searchInput.value.trim();

    if (!query) {
      this.clearResults();
      return;
    }

    const results = await this.search(query);
    this.displayResults(results);
  }

  /**
   * Perform search across all content
   * @param {string} query - Search query
   * @returns {Array} Search results
   */
  async search(query) {
    const queryTokens = this.tokenize(query);
    const results = [];

    // Search components
    for (const [id, component] of this.searchIndex.components) {
      const score = this.calculateRelevance(queryTokens, component.tokens);
      if (score > 0) {
        results.push({
          type: "component",
          score,
          ...component,
        });
      }
    }

    // Search methods
    for (const [id, method] of this.searchIndex.methods) {
      const score = this.calculateRelevance(queryTokens, method.tokens);
      if (score > 0) {
        results.push({
          type: "method",
          score,
          ...method,
        });
      }
    }

    // Search examples
    for (const [id, example] of this.searchIndex.examples) {
      const score = this.calculateRelevance(queryTokens, example.tokens);
      if (score > 0) {
        results.push({
          type: "example",
          score,
          ...example,
        });
      }
    }

    // Sort results by relevance score
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate relevance score
   * @param {Array} queryTokens - Query tokens
   * @param {Array} docTokens - Document tokens
   * @returns {number} Relevance score
   */
  calculateRelevance(queryTokens, docTokens) {
    let score = 0;

    for (const queryToken of queryTokens) {
      let bestMatch = 0;

      for (const docToken of docTokens) {
        const similarity = this.calcLevenshteinSimilarity(queryToken, docToken);
        bestMatch = Math.max(bestMatch, similarity);
      }

      score += bestMatch;
    }

    return score / queryTokens.length;
  }

  /**
   * Calculate Levenshtein similarity
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calcLevenshteinSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1)
      .fill()
      .map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);

    return 1 - distance / maxLen;
  }

  /**
   * Tokenize text for search
   * @param {string} text - Text to tokenize
   * @returns {Array} Array of tokens
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((token) => token.length > 2);
  }

  /**
   * Display search results
   * @param {Array} results - Search results
   */
  displayResults(results) {
    if (!this.searchResults) return;

    if (results.length === 0) {
      this.searchResults.innerHTML = "<p>No results found.</p>";
      return;
    }

    const html = results
      .map((result) => {
        const title = result.name || result.id;
        const type = result.type.charAt(0).toUpperCase() + result.type.slice(1);
        const description = result.description || "";
        const url = this.getResultUrl(result);

        return `
                <div class="search-result">
                    <h3><a href="${url}">${title}</a></h3>
                    <span class="result-type">${type}</span>
                    <p>${description}</p>
                </div>
            `;
      })
      .join("");

    this.searchResults.innerHTML = html;
  }

  /**
   * Get URL for search result
   * @param {Object} result - Search result
   * @returns {string} URL
   */
  getResultUrl(result) {
    switch (result.type) {
      case "component":
        return `../components/${result.id}.html`;
      case "method":
        return `../components/${result.componentId}.html#method-${result.name}`;
      case "example":
        return `../examples/${result.id}.html`;
      default:
        return "#";
    }
  }

  /**
   * Clear search results
   */
  clearResults() {
    if (this.searchResults) {
      this.searchResults.innerHTML = "";
    }
  }

  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize search when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new DocSearch();
});
