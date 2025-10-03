/**
 * HDR Empire Framework - Structured Logging Configuration
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import winston from "winston";
import LokiTransport from "winston-loki";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create a configured logger instance
 * @param {object} options - Logger configuration options
 * @param {string} options.serviceName - Name of the service
 * @param {string} options.level - Log level (info, debug, error, etc.)
 * @param {string} options.lokiUrl - Loki server URL
 * @param {boolean} options.lokiEnabled - Enable Loki transport
 * @returns {Logger} Configured Winston logger instance
 */
export function createLogger(options = {}) {
  const {
    serviceName = "hdr-empire",
    level = process.env.LOG_LEVEL || "info",
    lokiUrl = process.env.LOKI_URL || "http://loki:3100",
    lokiEnabled = process.env.LOKI_ENABLED === "true",
  } = options;

  const transports = [new winston.transports.Console()];

  // Add Loki transport if enabled
  if (lokiEnabled) {
    transports.push(
      new LokiTransport({
        host: lokiUrl,
        labels: { service: serviceName },
        json: true,
        batching: true,
        interval: 5,
        format: winston.format.json(),
      })
    );
  }

  return winston.createLogger({
    level,
    format: logFormat,
    defaultMeta: { service: serviceName },
    transports,
  });
}

// Create default logger instance
const logger = createLogger();

/**
 * Add trace ID correlation to logger
 * @param {Logger} logger - Winston logger instance
 * @param {string} traceId - Trace ID from distributed tracing
 * @param {string} spanId - Span ID from distributed tracing
 * @returns {Logger} Child logger with trace context
 */
export function addTraceContext(logger, traceId, spanId) {
  return logger.child({
    trace: { trace_id: traceId, span_id: spanId },
  });
}

export default logger;
