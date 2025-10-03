# HDR Empire Framework - Metrics & Monitoring Guide

**Copyright © 2025 Stephen Bilodeau - Patent Pending - All Rights Reserved**

## Overview

The HDR Empire Framework includes comprehensive monitoring capabilities using Prometheus metrics and Grafana dashboards. This guide covers all available metrics, integration patterns, and operational best practices.

---

## Table of Contents

1. [Available Metrics](#available-metrics)
2. [Prometheus Integration](#prometheus-integration)
3. [Grafana Dashboard](#grafana-dashboard)
4. [Application Integration](#application-integration)
5. [Alert Configuration](#alert-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Available Metrics

### HDR System Metrics

The framework exposes 8 custom Prometheus metrics for comprehensive monitoring:

| Metric Name                                   | Type      | Description                                   | Labels                         | Unit         |
| --------------------------------------------- | --------- | --------------------------------------------- | ------------------------------ | ------------ |
| `hdr_consciousness_transfers_total`           | Counter   | Total number of consciousness state transfers | `status`, `system`             | count        |
| `hdr_consciousness_transfer_duration_seconds` | Histogram | Duration of consciousness transfers           | `system`                       | seconds      |
| `hdr_quantum_operations_total`                | Counter   | Total quantum operations executed             | `operation_type`, `status`     | count        |
| `hdr_swarm_entities_active`                   | Gauge     | Number of active nano-swarm entities          | `swarm_id`, `type`             | count        |
| `hdr_dimensional_complexity`                  | Gauge     | Current dimensional complexity level          | `system`, `dimension`          | level (0-10) |
| `hdr_security_events_total`                   | Counter   | Security events detected                      | `event_type`, `severity`       | count        |
| `hdr_cache_hit_ratio`                         | Gauge     | Cache hit ratio for performance optimization  | `cache_layer`                  | ratio (0-1)  |
| `hdr_api_requests_total`                      | Counter   | Total API requests by endpoint                | `endpoint`, `method`, `status` | count        |

### Standard Application Metrics

In addition to custom metrics, standard Node.js and process metrics are exposed:

- `process_cpu_user_seconds_total` - User CPU time
- `process_cpu_system_seconds_total` - System CPU time
- `process_resident_memory_bytes` - Resident memory size
- `process_heap_bytes` - V8 heap size
- `nodejs_eventloop_lag_seconds` - Event loop lag
- `nodejs_active_handles_total` - Active handles
- `nodejs_active_requests_total` - Active requests

---

## Prometheus Integration

### 1. Configuration

Add the following scrape configuration to your `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "hdr-empire"
    static_configs:
      - targets: ["hdr-empire-service:3000"]
    metrics_path: "/metrics"
    scrape_interval: 10s
    scrape_timeout: 5s
```

### 2. Kubernetes Service Discovery

For Kubernetes deployments, use service discovery:

```yaml
scrape_configs:
  - job_name: "hdr-empire-k8s"
    kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
            - hdr-production
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_name]
        action: keep
        regex: hdr-empire
      - source_labels: [__meta_kubernetes_endpoint_port_name]
        action: keep
        regex: metrics
```

### 3. Docker Compose Integration

If using Docker Compose, add Prometheus to your `docker-compose.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=30d"
    networks:
      - hdr-network

  hdr-empire:
    # ... your HDR Empire service configuration
    ports:
      - "3000:3000" # Metrics endpoint at /metrics
    networks:
      - hdr-network

volumes:
  prometheus-data:

networks:
  hdr-network:
    driver: bridge
```

### 4. Verification

Verify Prometheus is scraping metrics:

```bash
# Check targets are up
curl http://localhost:9090/api/v1/targets

# Query specific metric
curl 'http://localhost:9090/api/v1/query?query=hdr_consciousness_transfers_total'

# Check all HDR metrics
curl 'http://localhost:9090/api/v1/label/__name__/values' | grep hdr_
```

---

## Grafana Dashboard

### 1. Dashboard Import

The HDR Empire Framework includes a pre-built Grafana dashboard located at:

```
dashboards/hdr-system-dashboard.json
```

**To import:**

1. Open Grafana UI (http://localhost:3000)
2. Navigate to **Dashboards → Import**
3. Click **Upload JSON file**
4. Select `dashboards/hdr-system-dashboard.json`
5. Select your Prometheus data source
6. Click **Import**

### 2. Dashboard Panels

The dashboard includes 10 comprehensive panels:

1. **Consciousness Transfer Rate** - Transfers per second over time
2. **Transfer Duration Distribution** - P50, P95, P99 latencies
3. **Active Swarm Entities** - Real-time entity count by swarm
4. **Quantum Operations** - Operation types and success rates
5. **Dimensional Complexity** - Complexity levels across dimensions
6. **Security Events** - Event types and severity distribution
7. **Cache Performance** - Hit ratios for L1/L2 caches
8. **API Request Rates** - Requests/sec by endpoint
9. **System Resources** - CPU, memory, event loop lag
10. **Error Rates** - Failed operations by system component

### 3. Custom Dashboard Variables

The dashboard supports the following variables for filtering:

- `$namespace` - Kubernetes namespace
- `$instance` - Service instance/pod
- `$system` - HDR system (neural, quantum, swarm, etc.)
- `$timerange` - Time range for queries

### 4. Access Dashboard

After import, access the dashboard at:

```
http://localhost:3000/d/hdr-empire/hdr-empire-system-overview
```

---

## Application Integration

### 1. Basic Metrics Export

The metrics endpoint is automatically configured. Access metrics at:

```
GET http://localhost:3000/metrics
```

### 2. Custom Metric Recording

To record custom metrics in your application code:

```javascript
import { prometheusMetrics } from "./src/metrics/prometheus-metrics.js";

// Record a consciousness transfer
prometheusMetrics.consciousnessTransfersTotal.inc({
  status: "success",
  system: "neural-hdr",
});

// Record transfer duration
const timer = prometheusMetrics.consciousnessTransferDuration.startTimer();
// ... perform transfer
timer({ system: "neural-hdr" });

// Update active entities
prometheusMetrics.swarmEntitiesActive.set(
  { swarm_id: "swarm-1", type: "worker" },
  150
);

// Record quantum operation
prometheusMetrics.quantumOperationsTotal.inc({
  operation_type: "entanglement",
  status: "success",
});
```

### 3. Express/Fastify Integration

#### Express Example

```javascript
import express from "express";
import { prometheusMetrics } from "./src/metrics/prometheus-metrics.js";

const app = express();

// Expose metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", prometheusMetrics.register.contentType);
  res.end(await prometheusMetrics.register.metrics());
});

// Middleware to track API requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    prometheusMetrics.apiRequestsTotal.inc({
      endpoint: req.route?.path || req.path,
      method: req.method,
      status: res.statusCode,
    });
  });
  next();
});

app.listen(3000);
```

#### Fastify Example

```javascript
import Fastify from "fastify";
import { prometheusMetrics } from "./src/metrics/prometheus-metrics.js";

const fastify = Fastify();

// Metrics endpoint
fastify.get("/metrics", async (request, reply) => {
  reply.type(prometheusMetrics.register.contentType);
  return prometheusMetrics.register.metrics();
});

// Request tracking hook
fastify.addHook("onResponse", (request, reply, done) => {
  prometheusMetrics.apiRequestsTotal.inc({
    endpoint: request.routerPath || request.url,
    method: request.method,
    status: reply.statusCode,
  });
  done();
});

fastify.listen({ port: 3000 });
```

### 4. Health Check Integration

Combine metrics with health checks:

```javascript
app.get("/health", (req, res) => {
  const metrics = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    metrics: {
      activeEntities: prometheusMetrics.swarmEntitiesActive.get(),
      cacheHitRatio: prometheusMetrics.cacheHitRatio.get(),
      uptime: process.uptime(),
    },
  };
  res.json(metrics);
});
```

---

## Alert Configuration

### 1. Prometheus Alert Rules

Create `prometheus-alerts.yml`:

```yaml
groups:
  - name: hdr_empire_alerts
    interval: 30s
    rules:
      # High transfer failure rate
      - alert: HighTransferFailureRate
        expr: |
          rate(hdr_consciousness_transfers_total{status="failed"}[5m]) /
          rate(hdr_consciousness_transfers_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
          system: hdr-empire
        annotations:
          summary: "High consciousness transfer failure rate"
          description: "Transfer failure rate is {{ $value | humanizePercentage }} (threshold: 5%)"

      # Slow transfer duration
      - alert: SlowTransferDuration
        expr: |
          histogram_quantile(0.95, 
            rate(hdr_consciousness_transfer_duration_seconds_bucket[5m])
          ) > 2.0
        for: 10m
        labels:
          severity: warning
          system: hdr-empire
        annotations:
          summary: "Slow consciousness transfers detected"
          description: "P95 transfer duration is {{ $value }}s (threshold: 2s)"

      # Low swarm entities
      - alert: LowSwarmEntities
        expr: hdr_swarm_entities_active < 10
        for: 5m
        labels:
          severity: critical
          system: hdr-empire
        annotations:
          summary: "Low number of active swarm entities"
          description: "Only {{ $value }} entities active (threshold: 10)"

      # High dimensional complexity
      - alert: HighDimensionalComplexity
        expr: hdr_dimensional_complexity > 8
        for: 15m
        labels:
          severity: warning
          system: hdr-empire
        annotations:
          summary: "High dimensional complexity detected"
          description: "Complexity level is {{ $value }} (threshold: 8)"

      # Security events spike
      - alert: SecurityEventSpike
        expr: |
          rate(hdr_security_events_total[5m]) > 10
        for: 2m
        labels:
          severity: critical
          system: hdr-empire
        annotations:
          summary: "Security event spike detected"
          description: "{{ $value }} security events/sec (threshold: 10/sec)"

      # Low cache hit ratio
      - alert: LowCacheHitRatio
        expr: hdr_cache_hit_ratio < 0.7
        for: 10m
        labels:
          severity: warning
          system: hdr-empire
        annotations:
          summary: "Low cache hit ratio"
          description: "Cache hit ratio is {{ $value | humanizePercentage }} (threshold: 70%)"

      # High API error rate
      - alert: HighAPIErrorRate
        expr: |
          rate(hdr_api_requests_total{status=~"5.."}[5m]) /
          rate(hdr_api_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
          system: hdr-empire
        annotations:
          summary: "High API error rate"
          description: "API error rate is {{ $value | humanizePercentage }} (threshold: 5%)"

      # High event loop lag
      - alert: HighEventLoopLag
        expr: nodejs_eventloop_lag_seconds > 0.1
        for: 5m
        labels:
          severity: warning
          system: hdr-empire
        annotations:
          summary: "High Node.js event loop lag"
          description: "Event loop lag is {{ $value }}s (threshold: 0.1s)"
```

### 2. Load Alert Rules

Add to your `prometheus.yml`:

```yaml
rule_files:
  - "prometheus-alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]
```

### 3. Alertmanager Configuration

Create `alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ["alertname", "system"]
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: "hdr-team"

receivers:
  - name: "hdr-team"
    email_configs:
      - to: "alerts@hdr-empire.com"
        from: "prometheus@hdr-empire.com"
        smarthost: "smtp.example.com:587"
        auth_username: "prometheus"
        auth_password: "password"
    slack_configs:
      - api_url: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
        channel: "#hdr-alerts"
        title: "HDR Empire Alert: {{ .GroupLabels.alertname }}"
        text: "{{ range .Alerts }}{{ .Annotations.description }}{{ end }}"
```

---

## Troubleshooting

### Metrics Not Appearing

**Problem:** Metrics endpoint returns empty or no HDR-specific metrics

**Solutions:**

1. **Check metrics initialization:**

   ```javascript
   // Ensure prometheus-metrics.js is imported
   import "./src/metrics/prometheus-metrics.js";
   ```

2. **Verify endpoint accessibility:**

   ```bash
   curl http://localhost:3000/metrics
   ```

3. **Check Prometheus scrape config:**

   ```bash
   # Verify target is up
   curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.labels.job=="hdr-empire")'
   ```

4. **Check application logs:**
   ```bash
   kubectl logs -f deployment/hdr-empire -n hdr-production | grep metrics
   ```

### Grafana Dashboard Not Loading

**Problem:** Dashboard shows "No Data" or fails to load

**Solutions:**

1. **Verify Prometheus data source:**

   - Go to Configuration → Data Sources
   - Test connection to Prometheus
   - Ensure URL is correct (e.g., `http://prometheus:9090`)

2. **Check time range:**

   - Adjust dashboard time range to "Last 15 minutes"
   - Ensure there's been activity generating metrics

3. **Verify metrics exist in Prometheus:**

   ```bash
   curl 'http://localhost:9090/api/v1/query?query=hdr_consciousness_transfers_total'
   ```

4. **Re-import dashboard:**
   - Delete existing dashboard
   - Import fresh copy from `dashboards/hdr-system-dashboard.json`

### High Memory Usage

**Problem:** Prometheus consuming excessive memory

**Solutions:**

1. **Reduce retention time:**

   ```yaml
   # prometheus.yml
   storage:
     tsdb:
       retention:
         time: 15d # Reduce from default 15d to 7d
   ```

2. **Reduce scrape frequency:**

   ```yaml
   scrape_interval: 30s # Increase from 15s
   ```

3. **Add resource limits:**
   ```yaml
   # docker-compose.yml or Kubernetes
   resources:
     limits:
       memory: 4Gi
       cpu: 2
     requests:
       memory: 2Gi
       cpu: 1
   ```

### Missing Labels

**Problem:** Metrics missing expected labels

**Solution:**

Ensure labels are provided when recording metrics:

```javascript
// ❌ Incorrect - missing labels
prometheusMetrics.consciousnessTransfersTotal.inc();

// ✅ Correct - with labels
prometheusMetrics.consciousnessTransfersTotal.inc({
  status: "success",
  system: "neural-hdr",
});
```

---

## Best Practices

### 1. Metric Naming

- Use snake_case: `hdr_consciousness_transfers_total`
- Include unit suffix: `_seconds`, `_bytes`, `_total`
- Namespace with prefix: `hdr_*`

### 2. Label Cardinality

- Keep label cardinality low (< 100 unique values)
- Avoid user IDs or timestamps as labels
- Use finite sets: `status` ∈ {success, failed}, not arbitrary strings

### 3. Histogram Buckets

When creating custom histograms, choose appropriate buckets:

```javascript
new Histogram({
  name: "hdr_operation_duration_seconds",
  help: "Duration of operations",
  labelNames: ["operation"],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10], // 1ms to 10s
});
```

### 4. Dashboard Organization

- Group related panels together
- Use consistent color schemes
- Add panel descriptions
- Use template variables for filtering

### 5. Alert Thresholds

- Set thresholds based on baseline metrics
- Use `for` clause to avoid flapping alerts
- Include meaningful descriptions
- Test alerts in staging first

---

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)

---

**Support:** For issues or questions, refer to the main HDR Empire Framework documentation or contact the development team.

**Copyright © 2025 Stephen Bilodeau - Patent Pending - All Rights Reserved**
