/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * Markdown documentation formatter.
 */

const BaseFormatter = require("./base-formatter");

class MarkdownFormatter extends BaseFormatter {
  formatComponent(component) {
    return `
# ${component.name}

${component.description}

## Methods

${component.methods.map((m) => this.formatMethod(m)).join("\n\n")}

## Examples

${component.examples.map((e) => this.formatExample(e)).join("\n\n")}

## Source

${this.formatSource(component.source)}
`.trim();
  }

  formatMethod(method) {
    return `
### ${method.name}

${method.description}

${this.formatParams(method.params)}

${this.formatReturns(method.returns)}

${method.examples.map((e) => this.formatExample(e)).join("\n\n")}
`.trim();
  }

  formatParams(params) {
    if (!params || params.length === 0) return "";
    return `
#### Parameters

| Name | Type | Description |
|------|------|-------------|
${params
  .map(
    (p) => `| ${p.name} | \`${p.type.names.join("|")}\` | ${p.description} |`
  )
  .join("\n")}
`.trim();
  }

  formatReturns(returns) {
    if (!returns || returns.length === 0) return "";
    const ret = returns[0];
    return `
#### Returns

\`${ret.type.names.join("|")}\`${ret.description ? ` - ${ret.description}` : ""}
`.trim();
  }

  formatExample(example) {
    return `
#### Example: ${example.id}

${example.description}

\`\`\`javascript
${example.code}
\`\`\`
`.trim();
  }

  formatSource(source) {
    return `
#### Source Code

\`\`\`javascript
${source}
\`\`\`
`.trim();
  }

  formatIndex(data) {
    return `
# ${data.title}

${data.description || ""}

## Components

${data.components.map((c) => this._formatComponentSummary(c)).join("\n\n")}

## Navigation

${this._formatNavigation(data.components)}

---

Neural-HDR Documentation - © 2025 Stephen Bilodeau - PATENT PENDING
`.trim();
  }

  _formatComponentSummary(component) {
    return `
### [${component.name}](#${component.id})

${component.description}

#### Methods
${component.methods.map((m) => `- [${m.name}](#${m.name})`).join("\n")}
`.trim();
  }

  _formatNavigation(components) {
    return components
      .map((c) =>
        `
- [${c.name}](#${c.id})
${c.methods.map((m) => `  - [${m.name}](#${m.name})`).join("\n")}
`.trim()
      )
      .join("\n");
  }

  formatSearchIndex(searchIndex) {
    return JSON.stringify(searchIndex, null, 2);
  }

  getFileExtension() {
    return "md";
  }
}

module.exports = MarkdownFormatter;
