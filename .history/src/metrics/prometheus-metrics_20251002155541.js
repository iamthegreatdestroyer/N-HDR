/*
 * HDR Empire Framework - Prometheus Metrics
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 *
 * This file is part of the HDR Empire Framework, a proprietary and
 * confidential software system. Unauthorized copying, use, distribution,
 * or modification of this file or its contents is prohibited.
 */

import client from "prom-client";

// Create metrics registry
const register = new client.Registry();

// Add default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({
  register,
  prefix: "hdr_",
});

/**
 * Custom Metrics for HDR System Status
 */

// HDR System Status Gauge (1 = active, 0 = inactive)
const hdrSystemStatus = new client.Gauge({
  name: "hdr_system_status",
  help: "Status of HDR subsystems (1 = active, 0 = inactive)",
  labelNames: ["system"],
  registers: [register],
});

// HDR System Operation Latency Histogram
const hdrSystemLatency = new client.Histogram({
  name: "hdr_system_latency_seconds",
  help: "Latency of HDR system operations in seconds",
  labelNames: ["system", "operation"],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// HDR System Errors Counter
const hdrSystemErrors = new client.Counter({
  name: "hdr_system_errors_total",
  help: "Total count of HDR system errors",
  labelNames: ["system", "error_type"],
  registers: [register],
});

// HDR System Operations Counter
const hdrSystemOperations = new client.Counter({
  name: "hdr_system_operations_total",
  help: "Total count of HDR system operations",
  labelNames: ["system", "operation", "status"],
  registers: [register],
});

// HDR Consciousness Layers Gauge
const hdrConsciousnessLayers = new client.Gauge({
  name: "hdr_consciousness_layers",
  help: "Number of consciousness layers in use",
  labelNames: ["system"],
  registers: [register],
});

// HDR Quantum State Gauge
const hdrQuantumState = new client.Gauge({
  name: "hdr_quantum_state",
  help: "Quantum state coherence (0-1)",
  labelNames: ["system"],
  registers: [register],
});

// HDR Storage Efficiency Gauge
const hdrStorageEfficiency = new client.Gauge({
  name: "hdr_storage_efficiency",
  help: "Storage efficiency ratio (0-1)",
  labelNames: ["system"],
  registers: [register],
});

// HDR Security Level Gauge
const hdrSecurityLevel = new client.Gauge({
  name: "hdr_security_level",
  help: "Active security level (0-9)",
  labelNames: ["system"],
  registers: [register],
});

/**
 * Metric Recording Functions
 */

export function recordSystemStatus(system, status) {
  hdrSystemStatus.labels(system).set(status ? 1 : 0);
}

export function recordOperationLatency(system, operation, durationSeconds) {
  hdrSystemLatency.labels(system, operation).observe(durationSeconds);
}

export function recordError(system, errorType) {
  hdrSystemErrors.labels(system, errorType).inc();
}

export function recordOperation(system, operation, status) {
  hdrSystemOperations.labels(system, operation, status).inc();
}

export function recordConsciousnessLayers(system, layerCount) {
  hdrConsciousnessLayers.labels(system).set(layerCount);
}

export function recordQuantumState(system, coherence) {
  hdrQuantumState.labels(system).set(coherence);
}

export function recordStorageEfficiency(system, efficiency) {
  hdrStorageEfficiency.labels(system).set(efficiency);
}

export function recordSecurityLevel(system, level) {
  hdrSecurityLevel.labels(system).set(level);
}

/**
 * Initialize default system status
 */
export function initializeMetrics() {
  const systems = [
    "neural-hdr",
    "nano-swarm",
    "omniscient-hdr",
    "reality-hdr",
    "quantum-hdr",
    "dream-hdr",
    "void-blade",
  ];

  systems.forEach((system) => {
    recordSystemStatus(system, true);
    recordConsciousnessLayers(system, 0);
    recordQuantumState(system, 0);
    recordStorageEfficiency(system, 1.0);
    recordSecurityLevel(system, 0);
  });
}

/**
 * Get metrics endpoint handler
 * Use this in your Express/HTTP server to expose metrics
 */
export async function metricsHandler(req, res) {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
}

/**
 * Timer utility for measuring operation duration
 */
export function createTimer(system, operation) {
  const startTime = Date.now();

  return {
    end(status = "success") {
      const duration = (Date.now() - startTime) / 1000;
      recordOperationLatency(system, operation, duration);
      recordOperation(system, operation, status);
    },
  };
}

// Export registry for custom usage
export { register };

// Export individual metrics for advanced usage
export {
  hdrSystemStatus,
  hdrSystemLatency,
  hdrSystemErrors,
  hdrSystemOperations,
  hdrConsciousnessLayers,
  hdrQuantumState,
  hdrStorageEfficiency,
  hdrSecurityLevel,
};
