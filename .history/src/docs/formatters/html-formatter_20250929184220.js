/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * HTML documentation formatter.
 */

const BaseFormatter = require('./base-formatter');
const marked = require('marked');
const hljs = require('highlight.js');

class HtmlFormatter extends BaseFormatter {
  constructor() {
    super();
    this.setupMarked();
  }

  /**
   * Setup marked configuration
   * @private
   */
  setupMarked() {
    marked.setOptions({
      highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
      },
      headerIds: true,
      gfm: true
    });
  }

  formatComponent(component) {
    return `
      <article class="component" id="${component.id}">
        <h1>${component.name}</h1>
        <div class="description">
          ${marked(component.description)}
        </div>
        <div class="methods">
          ${component.methods.map(m => this.formatMethod(m)).join('\n')}
        </div>
        <div class="examples">
          ${component.examples.map(e => this.formatExample(e)).join('\n')}
        </div>
        <div class="source">
          ${this.formatSource(component.source)}
        </div>
      </article>
    `;
  }

  formatMethod(method) {
    return `
      <section class="method" id="${method.name}">
        <h2>${method.name}</h2>
        <div class="description">
          ${marked(method.description)}
        </div>
        <div class="params">
          ${this.formatParams(method.params)}
        </div>
        <div class="returns">
          ${this.formatReturns(method.returns)}
        </div>
        <div class="examples">
          ${method.examples.map(e => this.formatExample(e)).join('\n')}
        </div>
      </section>
    `;
  }

  formatParams(params) {
    if (!params || params.length === 0) return '';
    return `
      <h3>Parameters</h3>
      <table class="params">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${params.map(p => `
            <tr>
              <td>${p.name}</td>
              <td><code>${p.type.names.join('|')}</code></td>
              <td>${marked(p.description)}</td>
            </tr>
          `).join('\n')}
        </tbody>
      </table>
    `;
  }

  formatReturns(returns) {
    if (!returns || returns.length === 0) return '';
    const ret = returns[0];
    return `
      <h3>Returns</h3>
      <div class="returns">
        <code>${ret.type.names.join('|')}</code>
        ${ret.description ? `<p>${marked(ret.description)}</p>` : ''}
      </div>
    `;
  }

  formatExample(example) {
    return `
      <div class="example" id="${example.id}">
        <h3>Example</h3>
        <div class="description">
          ${marked(example.description)}
        </div>
        <pre><code class="hljs javascript">${example.highlighted}</code></pre>
      </div>
    `;
  }

  formatSource(source) {
    return `
      <h3>Source</h3>
      <pre><code class="hljs javascript">${hljs.highlight(source, { language: 'javascript' }).value}</code></pre>
    `;
  }

  formatIndex(data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data.title}</title>
          <meta charset="utf-8">
          <link rel="stylesheet" href="assets/styles.css">
          <link rel="stylesheet" href="assets/hljs.css">
        </head>
        <body>
          <div class="container">
            <header>
              <h1>${data.title}</h1>
              ${data.description ? `<p>${marked(data.description)}</p>` : ''}
            </header>
            <nav>
              ${this.formatNavigation(data.components)}
            </nav>
            <main>
              ${data.components.map(c => this.formatComponent(c)).join('\n')}
            </main>
            <footer>
              <p>Neural-HDR Documentation - © 2025 Stephen Bilodeau - PATENT PENDING</p>
            </footer>
          </div>
          <script src="assets/search.js"></script>
        </body>
      </html>
    `;
  }

  formatNavigation(components) {
    return `
      <ul class="nav">
        ${components.map(c => `
          <li>
            <a href="#${c.id}">${c.name}</a>
            ${c.methods.length > 0 ? `
              <ul>
                ${c.methods.map(m => `
                  <li><a href="#${m.name}">${m.name}</a></li>
                `).join('\n')}
              </ul>
            ` : ''}
          </li>
        `).join('\n')}
      </ul>
    `;
  }

  formatSearchIndex(searchIndex) {
    // Convert to stringified JSON for browser use
    return JSON.stringify(searchIndex, null, 2);
  }

  getFileExtension() {
    return 'html';
  }
}

module.exports = HtmlFormatter;