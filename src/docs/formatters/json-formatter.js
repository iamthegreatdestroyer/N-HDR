/**
 * Neural-HDR (N-HDR): AI Consciousness State Preservation & Transfer System
 * © 2025 Stephen Bilodeau - PATENT PENDING
 * ALL RIGHTS RESERVED - PROPRIETARY AND CONFIDENTIAL
 *
 * JSON documentation formatter.
 */

const BaseFormatter = require("./base-formatter");

class JsonFormatter extends BaseFormatter {
  formatComponent(component) {
    return {
      id: component.id,
      name: component.name,
      description: component.description,
      methods: component.methods.map((m) => this.formatMethod(m)),
      examples: component.examples.map((e) => this.formatExample(e)),
      source: this.formatSource(component.source),
    };
  }

  formatMethod(method) {
    return {
      name: method.name,
      description: method.description,
      params: this.formatParams(method.params),
      returns: this.formatReturns(method.returns),
      examples: method.examples.map((e) => this.formatExample(e)),
    };
  }

  formatParams(params) {
    if (!params || params.length === 0) return [];
    return params.map((p) => ({
      name: p.name,
      type: p.type.names,
      description: p.description,
    }));
  }

  formatReturns(returns) {
    if (!returns || returns.length === 0) return null;
    const ret = returns[0];
    return {
      type: ret.type.names,
      description: ret.description,
    };
  }

  formatExample(example) {
    return {
      id: example.id,
      description: example.description,
      code: example.code,
    };
  }

  formatSource(source) {
    return {
      code: source,
    };
  }

  formatIndex(data) {
    return {
      title: data.title,
      description: data.description,
      components: data.components.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        methodCount: c.methods.length,
        methods: c.methods.map((m) => ({
          name: m.name,
          description: m.description,
        })),
      })),
      metadata: {
        generated: new Date().toISOString(),
        generator: "Neural-HDR Documentation Generator",
        version: "1.0.0",
        copyright: "© 2025 Stephen Bilodeau - PATENT PENDING",
      },
    };
  }

  formatSearchIndex(searchIndex) {
    return searchIndex;
  }

  getFileExtension() {
    return "json";
  }

  // Override the base formatter's string output to return structured data
  toString() {
    return JSON.stringify(this, null, 2);
  }
}

module.exports = JsonFormatter;
