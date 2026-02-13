/**
 * Winston-Loki Mock for Jest Testing
 * Provides a mock transport that doesn't require winston-loki package
 */

class MockLokiTransport {
  constructor(options = {}) {
    this.options = options;
  }

  log(info, callback) {
    if (callback) callback();
  }
}

export default MockLokiTransport;

