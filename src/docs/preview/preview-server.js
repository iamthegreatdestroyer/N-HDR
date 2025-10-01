/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Documentation preview system for real-time documentation changes
 */

const fs = require("fs").promises;
import path from "path";
import chokidar from "chokidar";
import express from "express";
import WebSocket from "ws";
import marked from "marked";
import highlight from "highlight.js";
import yaml from "js-yaml";
import http from "http";

class PreviewServer {
  /**
   * Create a new preview server
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      port: 3000,
      docsDir: "./docs",
      assetsDir: "./assets",
      watchPatterns: ["**/*.md", "**/*.js", "**/*.yml"],
      debounceMs: 100,
      autoOpen: true,
      customTheme: null,
      syntaxTheme: "github",
      customScripts: [],
      customStyles: [],
      ...options,
    };

    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    this.watcher = null;
    this.clients = new Set();

    // Configure markdown renderer
    marked.setOptions({
      highlight: (code, lang) => {
        if (lang && highlight.getLanguage(lang)) {
          return highlight.highlight(code, { language: lang }).value;
        }
        return code;
      },
    });
  }

  /**
   * Start the preview server
   * @returns {Promise<void>}
   */
  async start() {
    await this._setupServer();
    await this._setupWebSocket();
    await this._setupWatcher();
    await this._startServer();

    if (this.options.autoOpen) {
      this._openBrowser();
    }
  }

  /**
   * Stop the preview server
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.watcher) {
      await this.watcher.close();
    }

    for (const client of this.clients) {
      client.close();
    }

    await new Promise((resolve) => this.server.close(resolve));
  }

  /**
   * Set up express server
   * @returns {Promise<void>}
   * @private
   */
  async _setupServer() {
    // Serve static files from docs directory
    this.app.use(express.static(this.options.docsDir));

    // Serve assets
    if (this.options.assetsDir) {
      this.app.use("/assets", express.static(this.options.assetsDir));
    }

    // Main page handler
    this.app.get("/", async (req, res) => {
      const html = await this._generateIndexHtml();
      res.send(html);
    });

    // Documentation page handler
    this.app.get("/:page", async (req, res) => {
      try {
        const content = await this._renderPage(req.params.page);
        res.send(content);
      } catch (error) {
        res.status(404).send(this._generate404Page());
      }
    });

    // API endpoints
    this.app.get("/api/toc", async (req, res) => {
      const toc = await this._generateTableOfContents();
      res.json(toc);
    });

    this.app.get("/api/search", async (req, res) => {
      const results = await this._searchDocumentation(req.query.q);
      res.json(results);
    });
  }

  /**
   * Set up WebSocket server
   * @returns {Promise<void>}
   * @private
   */
  async _setupWebSocket() {
    this.wss.on("connection", (ws) => {
      this.clients.add(ws);

      ws.on("close", () => {
        this.clients.delete(ws);
      });

      ws.on("message", async (message) => {
        try {
          const data = JSON.parse(message);

          switch (data.type) {
            case "requestPage":
              const content = await this._renderPage(data.page);
              ws.send(
                JSON.stringify({
                  type: "pageContent",
                  page: data.page,
                  content,
                })
              );
              break;

            case "search":
              const results = await this._searchDocumentation(data.query);
              ws.send(
                JSON.stringify({
                  type: "searchResults",
                  results,
                })
              );
              break;
          }
        } catch (error) {
          ws.send(
            JSON.stringify({
              type: "error",
              error: error.message,
            })
          );
        }
      });
    });
  }

  /**
   * Set up file watcher
   * @returns {Promise<void>}
   * @private
   */
  async _setupWatcher() {
    const watchPaths = this.options.watchPatterns.map((pattern) =>
      path.join(this.options.docsDir, pattern)
    );

    this.watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
    });

    let debounceTimeout;

    const handleChange = async () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(async () => {
        try {
          const toc = await this._generateTableOfContents();

          for (const client of this.clients) {
            client.send(
              JSON.stringify({
                type: "refresh",
                toc,
              })
            );
          }
        } catch (error) {
          console.error("Error handling file change:", error);
        }
      }, this.options.debounceMs);
    };

    this.watcher
      .on("add", handleChange)
      .on("change", handleChange)
      .on("unlink", handleChange);
  }

  /**
   * Start the HTTP server
   * @returns {Promise<void>}
   * @private
   */
  async _startServer() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.options.port, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(
            `Preview server running at http://localhost:${this.options.port}`
          );
          resolve();
        }
      });
    });
  }

  /**
   * Generate main index HTML
   * @returns {Promise<string>}
   * @private
   */
  async _generateIndexHtml() {
    const toc = await this._generateTableOfContents();

    return `<!DOCTYPE html>
<html>
<head>
  <title>Neural-HDR Documentation</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Syntax highlighting -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/${
    this.options.syntaxTheme
  }.min.css">
  
  <!-- Custom styles -->
  ${this.options.customStyles
    .map((style) => `<link rel="stylesheet" href="${style}">`)
    .join("\n")}
  
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
    }
    
    .sidebar {
      width: 300px;
      height: 100vh;
      overflow-y: auto;
      padding: 20px;
      background: #f8f9fa;
      border-right: 1px solid #dee2e6;
    }
    
    .content {
      flex: 1;
      height: 100vh;
      overflow-y: auto;
      padding: 40px;
    }
    
    .search {
      margin-bottom: 20px;
    }
    
    .search input {
      width: 100%;
      padding: 8px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
    }
    
    .toc a {
      display: block;
      padding: 5px 0;
      color: #495057;
      text-decoration: none;
    }
    
    .toc a:hover {
      color: #228be6;
    }
    
    .preview {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .preview img {
      max-width: 100%;
    }
    
    .preview pre {
      padding: 16px;
      overflow: auto;
      border-radius: 6px;
    }
    
    .preview code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    }
    
    .error {
      color: #dc3545;
      padding: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="sidebar">
    <div class="search">
      <input type="text" placeholder="Search documentation..." id="search">
    </div>
    <div class="toc">
      ${this._renderTableOfContents(toc)}
    </div>
  </div>
  
  <div class="content">
    <div class="preview" id="preview"></div>
  </div>

  <!-- Scripts -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
  ${this.options.customScripts
    .map((script) => `<script src="${script}"></script>`)
    .join("\n")}
  
  <script>
    // WebSocket connection
    const ws = new WebSocket('ws://' + location.host);
    const preview = document.getElementById('preview');
    const search = document.getElementById('search');
    
    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'refresh':
          // Update TOC
          document.querySelector('.toc').innerHTML = 
            renderToc(data.toc);
          
          // Reload current page
          if (currentPage) {
            loadPage(currentPage);
          }
          break;
          
        case 'pageContent':
          preview.innerHTML = data.content;
          highlightCode();
          break;
          
        case 'searchResults':
          showSearchResults(data.results);
          break;
          
        case 'error':
          showError(data.error);
          break;
      }
    };
    
    // Page loading
    let currentPage = null;
    
    function loadPage(page) {
      currentPage = page;
      ws.send(JSON.stringify({
        type: 'requestPage',
        page
      }));
      
      // Update URL
      history.pushState(null, '', '/' + page);
    }
    
    // Search functionality
    let searchTimeout;
    
    search.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = search.value.trim();
        
        if (query) {
          ws.send(JSON.stringify({
            type: 'search',
            query
          }));
        }
      }, 300);
    });
    
    // Helper functions
    function renderToc(toc) {
      return toc.map(item => {
        if (item.children) {
          return \`
            <div class="toc-item">
              <a href="javascript:void(0)" onclick="loadPage('\${item.path}')">\${item.title}</a>
              <div class="toc-children">\${renderToc(item.children)}</div>
            </div>
          \`;
        }
        
        return \`
          <div class="toc-item">
            <a href="javascript:void(0)" onclick="loadPage('\${item.path}')">\${item.title}</a>
          </div>
        \`;
      }).join('');
    }
    
    function showSearchResults(results) {
      preview.innerHTML = \`
        <h2>Search Results</h2>
        \${results.length ? results.map(result => \`
          <div class="search-result">
            <h3>
              <a href="javascript:void(0)" onclick="loadPage('\${result.path}')">
                \${result.title}
              </a>
            </h3>
            <p>\${result.excerpt}</p>
          </div>
        \`).join('') : '<p>No results found</p>'}
      \`;
    }
    
    function showError(error) {
      preview.innerHTML = \`
        <div class="error">
          <h2>Error</h2>
          <p>\${error}</p>
        </div>
      \`;
    }
    
    function highlightCode() {
      document.querySelectorAll('pre code').forEach(block => {
        hljs.highlightBlock(block);
      });
    }
    
    // Initial page load
    const path = location.pathname.slice(1);
    if (path) {
      loadPage(path);
    }
  </script>
</body>
</html>`;
  }

  /**
   * Generate 404 page
   * @returns {string}
   * @private
   */
  _generate404Page() {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Page Not Found - Neural-HDR Documentation</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 600px;
      margin: 60px auto;
      padding: 20px;
      text-align: center;
    }
    h1 { color: #343a40; }
    p { color: #495057; }
    a { color: #228be6; }
  </style>
</head>
<body>
  <h1>Page Not Found</h1>
  <p>The requested documentation page could not be found.</p>
  <p><a href="/">Return to Documentation Home</a></p>
</body>
</html>`;
  }

  /**
   * Render documentation page
   * @param {string} page - Page path
   * @returns {Promise<string>}
   * @private
   */
  async _renderPage(page) {
    const filePath = path.join(this.options.docsDir, page);
    const content = await fs.readFile(filePath, "utf8");

    if (page.endsWith(".md")) {
      return marked(content);
    }

    if (page.endsWith(".yml") || page.endsWith(".yaml")) {
      const data = yaml.load(content);
      return `<pre><code class="language-yaml">${content}</code></pre>`;
    }

    // Default to syntax-highlighted display for other files
    const extension = path.extname(page).slice(1);
    return `<pre><code class="language-${extension}">${content}</code></pre>`;
  }

  /**
   * Generate table of contents
   * @returns {Promise<Array>}
   * @private
   */
  async _generateTableOfContents() {
    const toc = [];
    const scanDir = async (dir, base = "") => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const items = [];

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(base, entry.name);

        if (entry.isDirectory()) {
          const children = await scanDir(fullPath, relativePath);
          if (children.length > 0) {
            items.push({
              title: entry.name,
              path: relativePath,
              children,
            });
          }
        } else {
          // Only include files matching watch patterns
          if (this._shouldIncludeFile(relativePath)) {
            items.push({
              title: this._getFileTitle(entry.name, fullPath),
              path: relativePath,
            });
          }
        }
      }

      return items.sort((a, b) => {
        // Directories first, then by title
        if (a.children && !b.children) return -1;
        if (!a.children && b.children) return 1;
        return a.title.localeCompare(b.title);
      });
    };

    return scanDir(this.options.docsDir);
  }

  /**
   * Check if file should be included in docs
   * @param {string} filePath - Relative file path
   * @returns {boolean}
   * @private
   */
  _shouldIncludeFile(filePath) {
    return this.options.watchPatterns.some((pattern) => {
      const regex = new RegExp(
        pattern.replace(/\*/g, ".*").replace(/\?/g, ".")
      );
      return regex.test(filePath);
    });
  }

  /**
   * Get file title from content or filename
   * @param {string} filename - File name
   * @param {string} fullPath - Full file path
   * @returns {Promise<string>}
   * @private
   */
  async _getFileTitle(filename, fullPath) {
    try {
      const content = await fs.readFile(fullPath, "utf8");

      if (filename.endsWith(".md")) {
        // Try to find first heading
        const match = content.match(/^#\s+(.+)$/m);
        if (match) {
          return match[1];
        }
      }

      // Remove extension and convert to title case
      return filename
        .replace(/\.[^/.]+$/, "")
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    } catch {
      return filename;
    }
  }

  /**
   * Search documentation content
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   * @private
   */
  async _searchDocumentation(query) {
    if (!query) {
      return [];
    }

    const results = [];
    const searchRegex = new RegExp(query, "i");

    const searchFile = async (filePath, relativePath) => {
      try {
        const content = await fs.readFile(filePath, "utf8");

        if (searchRegex.test(content)) {
          const title = await this._getFileTitle(
            path.basename(filePath),
            filePath
          );

          // Find matching excerpt
          let excerpt = "";
          const match = content.match(
            new RegExp(`.{0,150}${query}.{0,150}`, "i")
          );

          if (match) {
            excerpt = match[0]
              .replace(new RegExp(query, "gi"), "<mark>$&</mark>")
              .trim();

            if (match.index > 0) excerpt = "..." + excerpt;
            if (match.index + match[0].length < content.length) {
              excerpt = excerpt + "...";
            }
          }

          results.push({
            title,
            path: relativePath,
            excerpt,
          });
        }
      } catch {
        // Skip files that can't be read
      }
    };

    const scanDir = async (dir, base = "") => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(base, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath, relativePath);
        } else if (this._shouldIncludeFile(relativePath)) {
          await searchFile(fullPath, relativePath);
        }
      }
    };

    await scanDir(this.options.docsDir);
    return results;
  }

  /**
   * Open preview in default browser
   * @private
   */
  _openBrowser() {
    const url = `http://localhost:${this.options.port}`;
    const start =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
        ? "start"
        : "xdg-open";

    require("child_process").exec(`${start} ${url}`);
  }
}

export default PreviewServer;
