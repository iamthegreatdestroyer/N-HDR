/**
 * HDR Empire Framework - Distributed Tracing Configuration
 * 
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 * 
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import * as opentelemetry from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

/**
 * Initialize distributed tracing with OpenTelemetry and Jaeger
 * @returns {NodeSDK} The initialized OpenTelemetry SDK instance
 */
export function initializeTracing() {
  const exporterConfig = {
    endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger-collector:14268/api/traces',
  };

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'hdr-empire',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'production',
  });

  const sdk = new opentelemetry.NodeSDK({
    resource,
    traceExporter: new JaegerExporter(exporterConfig),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start()
    .then(() => console.log('Tracing initialized'))
    .catch((error) => console.error('Error initializing tracing', error));

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}

/**
 * Create custom spans for HDR operations
 * @param {Tracer} tracer - OpenTelemetry tracer instance
 * @param {string} name - Span name
 * @param {object} options - Span options
 * @returns {Span} The created span
 */
export function createHDRSpan(tracer, name, options = {}) {
  return tracer.startSpan(name, options);
}

/**
 * Add context propagation to carrier
 * @param {Context} context - OpenTelemetry context
 * @param {object} carrier - Carrier object for propagation
 * @param {TextMapSetter} setter - Setter for carrier
 * @returns {object} Modified carrier with propagated context
 */
export function propagateContext(context, carrier, setter) {
  const { propagation } = opentelemetry.api;
  propagation.inject(context, carrier, setter);
  return carrier;
}

/**
 * Extract context from carrier
 * @param {object} carrier - Carrier object with propagated context
 * @param {TextMapGetter} getter - Getter for carrier
 * @returns {Context} Extracted OpenTelemetry context
 */
export function extractContext(carrier, getter) {
  const { propagation } = opentelemetry.api;
  return propagation.extract(propagation.context(), carrier, getter);
}
