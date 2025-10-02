# HDR Empire Framework - Monitoring Guide

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

## Overview

This comprehensive monitoring guide covers the complete observability stack for the HDR Empire Framework, including metrics collection, alerting, logging, tracing, and visualization. Learn how to implement effective monitoring to ensure system reliability and performance.

## Table of Contents

1. [Monitoring Architecture](#monitoring-architecture)
2. [Metrics Collection](#metrics-collection)
3. [Logging Infrastructure](#logging-infrastructure)
4. [Distributed Tracing](#distributed-tracing)
5. [Alerting Configuration](#alerting-configuration)
6. [Dashboards](#dashboards)
7. [Performance Monitoring](#performance-monitoring)
8. [Security Monitoring](#security-monitoring)
9. [Monitoring Best Practices](#monitoring-best-practices)
10. [Troubleshooting Monitoring](#troubleshooting-monitoring)

---

## Monitoring Architecture

### Observability Stack

```
Application Tier
      ↓
┌─────────────────────────────────────────┐
│         Metrics (Prometheus)             │
│  - Application metrics                   │
│  - System metrics                        │
│  - Custom metrics                        │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│         Logs (ELK Stack)                 │
│  - Application logs                      │
│  - System logs                           │
│  - Audit logs                            │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│         Traces (Jaeger)                  │
│  - Request tracing                       │
│  - Performance profiling                 │
│  - Dependency mapping                    │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│    Visualization (Grafana)               │
│  - Real-time dashboards                  │
│  - Historical analysis                   │
│  - Alert visualization                   │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│       Alerting (Alertmanager)            │
│  - Alert routing                         │
│  - Notification delivery                 │
│  - Alert aggregation                     │
└─────────────────────────────────────────┘
```

### Monitoring Components

| Component | Purpose | Port | Storage |
|-----------|---------|------|---------|
| **Prometheus** | Metrics collection and storage | 9090 | Time-series DB |
| **Grafana** | Visualization and dashboards | 3000 | PostgreSQL |
| **Elasticsearch** | Log storage and search | 9200 | Disk |
| **Logstash** | Log processing pipeline | 5044 | N/A |
| **Kibana** | Log visualization | 5601 | Elasticsearch |
| **Jaeger** | Distributed tracing | 16686 | Cassandra |
| **Alertmanager** | Alert management | 9093 | Disk |

---

## Metrics Collection

### Prometheus Setup

```yaml
# prometheus-config.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'hdr-empire-production'
    environment: 'production'

scrape_configs:
  # HDR Services
  - job_name: 'neural-hdr'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - hdr-empire
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: neural-hdr
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace

  - job_name: 'nano-swarm-hdr'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - hdr-empire
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: nano-swarm-hdr

  # Node Exporter (system metrics)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # Kubernetes metrics
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
      - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https
```

### Application Metrics

```javascript
/*
 * HDR Empire Framework - Metrics Collection
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 */

import prometheus from 'prom-client';

// Create metrics registry
const register = new prometheus.Registry();

// Default metrics (CPU, memory, etc.)
prometheus.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const operationDuration = new prometheus.Histogram({
  name: 'hdr_operation_duration_seconds',
  help: 'Duration of HDR operations',
  labelNames: ['system', 'operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const operationCounter = new prometheus.Counter({
  name: 'hdr_operations_total',
  help: 'Total number of HDR operations',
  labelNames: ['system', 'operation', 'status']
});

const systemHealth = new prometheus.Gauge({
  name: 'hdr_system_health',
  help: 'Health status of HDR systems (0-100)',
  labelNames: ['system']
});

const activeSwarms = new prometheus.Gauge({
  name: 'swarm_active_count',
  help: 'Number of active nano-swarms',
  labelNames: ['status']
});

const consciousnessStates = new prometheus.Gauge({
  name: 'consciousness_states_total',
  help: 'Total number of consciousness states',
  labelNames: ['status']
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(operationDuration);
register.registerMetric(operationCounter);
register.registerMetric(systemHealth);
register.registerMetric(activeSwarms);
register.registerMetric(consciousnessStates);

// Metrics middleware for Express
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
}

// Track HDR operation
export function trackOperation(system, operation, status, duration) {
  operationDuration.labels(system, operation).observe(duration / 1000);
  operationCounter.labels(system, operation, status).inc();
}

// Update system health
export function updateSystemHealth(system, health) {
  systemHealth.labels(system).set(health);
}

// Metrics endpoint
export function getMetrics() {
  return register.metrics();
}

export {
  httpRequestDuration,
  operationDuration,
  operationCounter,
  systemHealth,
  activeSwarms,
  consciousnessStates
};
```

### Deploying Prometheus

```bash
# Install Prometheus using Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values prometheus-values.yaml

# Verify installation
kubectl get pods -n monitoring

# Access Prometheus UI
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

---

## Logging Infrastructure

### ELK Stack Setup

```yaml
# elasticsearch-deployment.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
  namespace: logging
spec:
  serviceName: elasticsearch
  replicas: 3
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
        env:
        - name: cluster.name
          value: "hdr-empire-logs"
        - name: discovery.seed_hosts
          value: "elasticsearch-0.elasticsearch,elasticsearch-1.elasticsearch,elasticsearch-2.elasticsearch"
        - name: cluster.initial_master_nodes
          value: "elasticsearch-0,elasticsearch-1,elasticsearch-2"
        - name: ES_JAVA_OPTS
          value: "-Xms2g -Xmx2g"
        ports:
        - containerPort: 9200
          name: http
        - containerPort: 9300
          name: transport
        volumeMounts:
        - name: data
          mountPath: /usr/share/elasticsearch/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: "fast-ssd"
      resources:
        requests:
          storage: 100Gi
```

### Structured Logging

```javascript
/*
 * HDR Empire Framework - Structured Logging
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 */

import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'hdr-empire',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.VERSION || '1.0.0'
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File output
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    }),
    
    // Elasticsearch output (production only)
    ...(process.env.NODE_ENV === 'production' ? [
      new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
          node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
          auth: {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD
          }
        },
        index: 'hdr-empire-logs'
      })
    ] : [])
  ]
});

// Logging helpers
export function logInfo(message, meta = {}) {
  logger.info(message, meta);
}

export function logError(message, error, meta = {}) {
  logger.error(message, {
    ...meta,
    error: error.message,
    stack: error.stack
  });
}

export function logWarning(message, meta = {}) {
  logger.warn(message, meta);
}

export function logDebug(message, meta = {}) {
  logger.debug(message, meta);
}

// Log operation
export function logOperation(system, operation, result, duration, meta = {}) {
  logger.info('Operation completed', {
    system,
    operation,
    result,
    duration,
    ...meta
  });
}

// Log security event
export function logSecurityEvent(event, severity, details) {
  logger.warn('Security event', {
    event,
    severity,
    details,
    category: 'security'
  });
}

// Log audit event
export function logAudit(action, user, resource, meta = {}) {
  logger.info('Audit event', {
    action,
    userId: user?.id,
    username: user?.username,
    resource,
    ...meta,
    category: 'audit'
  });
}

export default logger;
```

### Log Aggregation with Fluentd

```yaml
# fluentd-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
  namespace: logging
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      read_from_head true
      <parse>
        @type json
        time_format %Y-%m-%dT%H:%M:%S.%NZ
      </parse>
    </source>

    <filter kubernetes.**>
      @type kubernetes_metadata
      @id filter_kube_metadata
    </filter>

    <filter kubernetes.**>
      @type parser
      key_name log
      <parse>
        @type json
      </parse>
    </filter>

    <match kubernetes.**>
      @type elasticsearch
      host elasticsearch.logging.svc.cluster.local
      port 9200
      logstash_format true
      logstash_prefix hdr-empire
      <buffer>
        @type file
        path /var/log/fluentd-buffers/kubernetes.system.buffer
        flush_mode interval
        retry_type exponential_backoff
        flush_interval 5s
        retry_forever false
        retry_max_interval 30
        chunk_limit_size 2M
        queue_limit_length 8
        overflow_action block
      </buffer>
    </match>
```

---

## Distributed Tracing

### Jaeger Setup

```yaml
# jaeger-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
  namespace: tracing
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
      - name: jaeger
        image: jaegertracing/all-in-one:1.50
        env:
        - name: COLLECTOR_ZIPKIN_HOST_PORT
          value: ":9411"
        - name: SPAN_STORAGE_TYPE
          value: "cassandra"
        - name: CASSANDRA_SERVERS
          value: "cassandra:9042"
        - name: CASSANDRA_KEYSPACE
          value: "jaeger_v1_production"
        ports:
        - containerPort: 5775
          protocol: UDP
        - containerPort: 6831
          protocol: UDP
        - containerPort: 6832
          protocol: UDP
        - containerPort: 5778
          protocol: TCP
        - containerPort: 16686
          protocol: TCP
        - containerPort: 14268
          protocol: TCP
        - containerPort: 14250
          protocol: TCP
        - containerPort: 9411
          protocol: TCP
```

### Implementing Tracing

```javascript
/*
 * HDR Empire Framework - Distributed Tracing
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 */

import { initTracer } from 'jaeger-client';

// Initialize Jaeger tracer
const config = {
  serviceName: process.env.SERVICE_NAME || 'hdr-empire',
  sampler: {
    type: 'probabilistic',
    param: 0.1 // Sample 10% of traces
  },
  reporter: {
    logSpans: true,
    agentHost: process.env.JAEGER_AGENT_HOST || 'jaeger-agent',
    agentPort: process.env.JAEGER_AGENT_PORT || 6831
  }
};

const options = {
  tags: {
    'hdr-empire.version': process.env.VERSION || '1.0.0',
    'environment': process.env.NODE_ENV || 'development'
  },
  logger: {
    info: (msg) => console.log('INFO', msg),
    error: (msg) => console.log('ERROR', msg)
  }
};

const tracer = initTracer(config, options);

// Trace HDR operation
export function traceOperation(system, operation, fn) {
  return async (...args) => {
    const span = tracer.startSpan(`${system}.${operation}`);
    
    span.setTag('system', system);
    span.setTag('operation', operation);
    
    try {
      const result = await fn(...args);
      span.setTag('status', 'success');
      return result;
    } catch (error) {
      span.setTag('status', 'error');
      span.setTag('error', error.message);
      span.log({
        event: 'error',
        'error.object': error,
        message: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      span.finish();
    }
  };
}

// Create child span
export function createChildSpan(parentSpan, operationName) {
  return tracer.startSpan(operationName, {
    childOf: parentSpan
  });
}

// Express middleware for tracing
export function tracingMiddleware(req, res, next) {
  const span = tracer.startSpan('http_request');
  
  span.setTag('http.method', req.method);
  span.setTag('http.url', req.url);
  span.setTag('span.kind', 'server');
  
  res.on('finish', () => {
    span.setTag('http.status_code', res.statusCode);
    span.finish();
  });
  
  req.span = span;
  next();
}

export default tracer;
```

---

## Alerting Configuration

### Alert Rules

```yaml
# prometheus-alerts.yaml
groups:
  - name: hdr_empire_alerts
    interval: 30s
    rules:
      # Service availability
      - alert: ServiceDown
        expr: up{job=~"neural-hdr|nano-swarm-hdr|omniscient-hdr"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "HDR service {{ $labels.job }} is down"
          description: "{{ $labels.job }} has been down for more than 2 minutes"

      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} over the last 5 minutes"

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"

      # Database connection issues
      - alert: DatabaseConnectionFailure
        expr: rate(database_connection_errors_total[5m]) > 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failures detected"
          description: "Database connection error rate: {{ $value }}"

      # High CPU usage
      - alert: HighCPUUsage
        expr: rate(process_cpu_seconds_total[5m]) > 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.pod }}"
          description: "CPU usage is {{ $value | humanizePercentage }}"

      # High memory usage
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 / 1024 > 3
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.pod }}"
          description: "Memory usage is {{ $value }}GB"

      # Disk space
      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
          description: "Only {{ $value | humanizePercentage }} disk space remaining"

      # HDR-specific alerts
      - alert: HighConsciousnessStateCaptureFailures
        expr: rate(hdr_operations_total{system="neural-hdr",operation="captureState",status="failed"}[10m]) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High consciousness state capture failure rate"
          description: "Failure rate: {{ $value }}"

      - alert: SwarmEfficiencyLow
        expr: swarm_efficiency < 0.7
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Swarm efficiency below threshold"
          description: "Current efficiency: {{ $value }}"

      - alert: SecurityThreatDetected
        expr: increase(security_threats_total[5m]) > 10
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "High number of security threats detected"
          description: "{{ $value }} threats detected in the last 5 minutes"
```

### Alertmanager Configuration

```yaml
# alertmanager-config.yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical'
      continue: true
    
    - match:
        severity: warning
      receiver: 'warning'

receivers:
  - name: 'default'
    email_configs:
      - to: 'ops-team@company.com'
        from: 'alertmanager@hdr-empire.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alertmanager@hdr-empire.com'
        auth_password: 'your-password'
        headers:
          Subject: 'HDR Empire Alert: {{ .GroupLabels.alertname }}'

  - name: 'critical'
    pagerduty_configs:
      - service_key: 'your-pagerduty-service-key'
        description: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'
    
    slack_configs:
      - channel: '#alerts-critical'
        title: 'Critical Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}\n{{ end }}'
        send_resolved: true
    
    email_configs:
      - to: 'ops-critical@company.com'
        from: 'alertmanager@hdr-empire.com'
        headers:
          Subject: '[CRITICAL] HDR Empire: {{ .GroupLabels.alertname }}'

  - name: 'warning'
    slack_configs:
      - channel: '#alerts-warning'
        title: 'Warning: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}\n{{ end }}'
        send_resolved: true

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'cluster', 'service']
```

---

## Dashboards

### Grafana Dashboard - HDR Empire Overview

```json
{
  "dashboard": {
    "title": "HDR Empire Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "System Health",
        "targets": [
          {
            "expr": "hdr_system_health",
            "legendFormat": "{{system}}"
          }
        ],
        "type": "gauge"
      },
      {
        "title": "Active Swarms",
        "targets": [
          {
            "expr": "swarm_active_count",
            "legendFormat": "{{status}}"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Consciousness States",
        "targets": [
          {
            "expr": "consciousness_states_total",
            "legendFormat": "{{status}}"
          }
        ],
        "type": "stat"
      }
    ]
  }
}
```

---

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

For more information, see:
- [OPERATIONS-MANUAL.md](./OPERATIONS-MANUAL.md) - Operations procedures
- [TROUBLESHOOTING-GUIDE.md](./TROUBLESHOOTING-GUIDE.md) - Troubleshooting guide
