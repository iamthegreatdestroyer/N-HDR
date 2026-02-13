/**
 * Winston Mock for Jest Testing
 * Provides a mock logger that doesn't require winston package
 */

const mockLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
  log: () => {},
  child: () => mockLogger,
};

const mockWinston = {
  createLogger: () => mockLogger,
  format: {
    combine: () => {},
    timestamp: () => {},
    simple: () => {},
    errors: () => {},
    json: () => {},
  },
  transports: {
    Console: function () {},
    File: function () {},
  },
};

export default mockWinston;


