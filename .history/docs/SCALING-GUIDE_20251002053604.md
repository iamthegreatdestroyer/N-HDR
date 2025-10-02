# HDR Empire Framework - Scaling Guide

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

## Overview

This comprehensive scaling guide covers strategies for scaling the HDR Empire Framework horizontally and vertically, along with capacity planning, auto-scaling configuration, and performance optimization. Learn how to scale each component to handle increasing load while maintaining performance and reliability.

## Table of Contents

1. [Scaling Strategy Overview](#scaling-strategy-overview)
2. [Horizontal Pod Autoscaling](#horizontal-pod-autoscaling)
3. [Vertical Scaling](#vertical-scaling)
4. [Database Scaling](#database-scaling)
5. [Cache Scaling](#cache-scaling)
6. [Load Balancer Scaling](#load-balancer-scaling)
7. [Storage Scaling](#storage-scaling)
8. [Capacity Planning](#capacity-planning)
9. [Cost Optimization](#cost-optimization)
10. [Scaling Best Practices](#scaling-best-practices)

---

## Scaling Strategy Overview

### Scaling Dimensions

| Dimension      | Approach                        | When to Use                     | Trade-offs                                     |
| -------------- | ------------------------------- | ------------------------------- | ---------------------------------------------- |
| **Horizontal** | Add more pods                   | High request volume             | Better availability, more complexity           |
| **Vertical**   | Increase pod resources          | CPU/memory-intensive operations | Simpler, limited by node capacity              |
| **Database**   | Read replicas, sharding         | Database bottleneck             | Improved read throughput, eventual consistency |
| **Cache**      | Redis cluster                   | Cache bottleneck                | Better performance, data distribution          |
| **Storage**    | Add volumes, use object storage | Storage capacity                | Scalable, potential latency                    |

### Current Capacity Baseline

| Metric                       | Current | Target  | Headroom |
| ---------------------------- | ------- | ------- | -------- |
| **Requests/sec**             | 10,000  | 50,000  | 5x       |
| **Concurrent users**         | 10,000  | 100,000 | 10x      |
| **Consciousness states/day** | 1M      | 10M     | 10x      |
| **Active swarms**            | 1,000   | 10,000  | 10x      |
| **Knowledge domains**        | 10M     | 100M    | 10x      |
| **Database size**            | 500GB   | 5TB     | 10x      |
| **Response time (p95)**      | 500ms   | <500ms  | Maintain |
| **Availability**             | 99.9%   | 99.99%  | Improve  |

---

## Horizontal Pod Autoscaling

### Metrics Server Installation

```bash
# Install metrics server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify installation
kubectl get deployment metrics-server -n kube-system
kubectl top nodes
kubectl top pods -n hdr-empire
```

### CPU-Based HPA

```yaml
# hpa-neural-hdr-cpu.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: neural-hdr-hpa
  namespace: hdr-empire
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: neural-hdr
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 30
        - type: Pods
          value: 4
          periodSeconds: 30
      selectPolicy: Max
```

### Memory-Based HPA

```yaml
# hpa-nano-swarm-memory.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nano-swarm-hdr-hpa
  namespace: hdr-empire
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nano-swarm-hdr
  minReplicas: 5
  maxReplicas: 30
  metrics:
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 75
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Custom Metrics HPA

```yaml
# hpa-omniscient-custom.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: omniscient-hdr-hpa
  namespace: hdr-empire
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: omniscient-hdr
  minReplicas: 3
  maxReplicas: 25
  metrics:
    # CPU metric
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

    # Custom metric: requests per second
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"

    # Custom metric: active operations
    - type: Pods
      pods:
        metric:
          name: hdr_active_operations
        target:
          type: AverageValue
          averageValue: "100"
```

### Deploying HPA

```bash
# Apply HPA configurations
kubectl apply -f hpa-neural-hdr-cpu.yaml
kubectl apply -f hpa-nano-swarm-memory.yaml
kubectl apply -f hpa-omniscient-custom.yaml

# Verify HPA status
kubectl get hpa -n hdr-empire

# Watch HPA in action
kubectl get hpa neural-hdr-hpa -n hdr-empire --watch

# Describe HPA for details
kubectl describe hpa neural-hdr-hpa -n hdr-empire
```

### Custom Metrics with Prometheus Adapter

```yaml
# prometheus-adapter-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: adapter-config
  namespace: monitoring
data:
  config.yaml: |
    rules:
    - seriesQuery: 'http_requests_total{namespace="hdr-empire"}'
      resources:
        overrides:
          namespace: {resource: "namespace"}
          pod: {resource: "pod"}
      name:
        matches: "^(.*)_total$"
        as: "${1}_per_second"
      metricsQuery: 'rate(<<.Series>>{<<.LabelMatchers>>}[1m])'

    - seriesQuery: 'hdr_operations_total{namespace="hdr-empire"}'
      resources:
        overrides:
          namespace: {resource: "namespace"}
          pod: {resource: "pod"}
      name:
        matches: "^(.*)_total$"
        as: "${1}_active"
      metricsQuery: 'sum(rate(<<.Series>>{<<.LabelMatchers>>,status="active"}[2m])) by (<<.GroupBy>>)'
```

```bash
# Install Prometheus Adapter
helm install prometheus-adapter prometheus-community/prometheus-adapter \
  --namespace monitoring \
  --set prometheus.url=http://prometheus-kube-prometheus-prometheus.monitoring.svc \
  --set prometheus.port=9090 \
  --values prometheus-adapter-config.yaml

# Verify custom metrics
kubectl get --raw "/apis/custom.metrics.k8s.io/v1beta1/namespaces/hdr-empire/pods/*/http_requests_per_second" | jq
```

---

## Vertical Scaling

### Vertical Pod Autoscaler (VPA)

```bash
# Install VPA
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler
./hack/vpa-up.sh

# Verify installation
kubectl get pods -n kube-system | grep vpa
```

```yaml
# vpa-neural-hdr.yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: neural-hdr-vpa
  namespace: hdr-empire
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: neural-hdr
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
      - containerName: neural-hdr
        minAllowed:
          cpu: 500m
          memory: 1Gi
        maxAllowed:
          cpu: 4000m
          memory: 8Gi
        controlledResources:
          - cpu
          - memory
```

```bash
# Apply VPA
kubectl apply -f vpa-neural-hdr.yaml

# Check VPA recommendations
kubectl describe vpa neural-hdr-vpa -n hdr-empire

# View VPA recommendations
kubectl get vpa neural-hdr-vpa -n hdr-empire -o jsonpath='{.status.recommendation}' | jq
```

### Manual Vertical Scaling

```bash
# Update resource limits
kubectl set resources deployment/neural-hdr \
  --limits=cpu=2000m,memory=4Gi \
  --requests=cpu=1000m,memory=2Gi \
  -n hdr-empire

# Apply gradual scaling
# Start conservative
kubectl set resources deployment/neural-hdr --requests=cpu=500m,memory=1Gi -n hdr-empire
# Monitor for 1 week, then adjust
kubectl set resources deployment/neural-hdr --requests=cpu=1000m,memory=2Gi -n hdr-empire
# Monitor for 1 week, then adjust
kubectl set resources deployment/neural-hdr --requests=cpu=2000m,memory=4Gi -n hdr-empire

# Verify changes
kubectl get deployment neural-hdr -n hdr-empire -o jsonpath='{.spec.template.spec.containers[0].resources}' | jq
```

---

## Database Scaling

### Read Replicas

```yaml
# postgres-replica.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres-replica
  namespace: hdr-empire
spec:
  serviceName: postgres-replica
  replicas: 3
  selector:
    matchLabels:
      app: postgres
      role: replica
  template:
    metadata:
      labels:
        app: postgres
        role: replica
    spec:
      containers:
        - name: postgres
          image: postgres:15
          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: username
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
            - name: POSTGRES_PRIMARY_HOST
              value: postgres-0.postgres.hdr-empire.svc.cluster.local
            - name: POSTGRES_PRIMARY_PORT
              value: "5432"
          ports:
            - containerPort: 5432
              name: postgres
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
            - name: replica-config
              mountPath: /docker-entrypoint-initdb.d
      volumes:
        - name: replica-config
          configMap:
            name: postgres-replica-config
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: "fast-ssd"
        resources:
          requests:
            storage: 500Gi
```

```bash
# Deploy read replicas
kubectl apply -f postgres-replica.yaml

# Verify replication
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -c \
  "SELECT client_addr, state, sync_state FROM pg_stat_replication;"

# Configure application to use read replicas
kubectl set env deployment/neural-hdr \
  DATABASE_READ_URL=postgres://user:pass@postgres-replica:5432/hdr_empire \
  DATABASE_WRITE_URL=postgres://user:pass@postgres-0.postgres:5432/hdr_empire \
  -n hdr-empire
```

### Connection Pooling with PgBouncer

```yaml
# pgbouncer-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pgbouncer
  namespace: hdr-empire
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pgbouncer
  template:
    metadata:
      labels:
        app: pgbouncer
    spec:
      containers:
        - name: pgbouncer
          image: pgbouncer/pgbouncer:1.21.0
          ports:
            - containerPort: 6432
          env:
            - name: POSTGRESQL_HOST
              value: postgres-0.postgres.hdr-empire.svc.cluster.local
            - name: POSTGRESQL_PORT
              value: "5432"
            - name: POSTGRESQL_USERNAME
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: username
            - name: POSTGRESQL_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            - name: POSTGRESQL_DATABASE
              value: hdr_empire
            - name: PGBOUNCER_POOL_MODE
              value: transaction
            - name: PGBOUNCER_MAX_CLIENT_CONN
              value: "10000"
            - name: PGBOUNCER_DEFAULT_POOL_SIZE
              value: "100"
            - name: PGBOUNCER_MIN_POOL_SIZE
              value: "10"
            - name: PGBOUNCER_RESERVE_POOL_SIZE
              value: "10"
            - name: PGBOUNCER_MAX_DB_CONNECTIONS
              value: "500"
```

```bash
# Deploy PgBouncer
kubectl apply -f pgbouncer-deployment.yaml

# Update application connection string
kubectl set env deployment/neural-hdr \
  DATABASE_URL=postgres://user:pass@pgbouncer:6432/hdr_empire \
  -n hdr-empire

# Monitor PgBouncer
kubectl exec -it pgbouncer-0 -n hdr-empire -- psql -h localhost -p 6432 -U pgbouncer pgbouncer -c "SHOW POOLS;"
kubectl exec -it pgbouncer-0 -n hdr-empire -- psql -h localhost -p 6432 -U pgbouncer pgbouncer -c "SHOW STATS;"
```

### Database Sharding Strategy

```javascript
/*
 * HDR Empire Framework - Database Sharding
 *
 * Copyright (c) 2025 Stephen Bilodeau
 * All rights reserved - Patent Pending
 */

import { createHash } from "crypto";

// Shard configuration
const SHARDS = [
  { id: 0, host: "postgres-shard-0.postgres", database: "hdr_empire_0" },
  { id: 1, host: "postgres-shard-1.postgres", database: "hdr_empire_1" },
  { id: 2, host: "postgres-shard-2.postgres", database: "hdr_empire_2" },
  { id: 3, host: "postgres-shard-3.postgres", database: "hdr_empire_3" },
];

// Hash-based sharding
function getShardByUserId(userId) {
  const hash = createHash("md5").update(userId).digest("hex");
  const shardIndex = parseInt(hash.substring(0, 8), 16) % SHARDS.length;
  return SHARDS[shardIndex];
}

// Range-based sharding (for time-series data)
function getShardByDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const shardIndex = (year * 12 + month) % SHARDS.length;
  return SHARDS[shardIndex];
}

// Get connection for user
export async function getUserConnection(userId) {
  const shard = getShardByUserId(userId);
  return createConnection(shard);
}

// Query across all shards
export async function queryAllShards(query, params) {
  const promises = SHARDS.map((shard) => {
    const conn = createConnection(shard);
    return conn.query(query, params);
  });

  const results = await Promise.all(promises);
  return results.flat();
}

// Shard migration utility
export async function migrateUserToShard(userId, targetShardId) {
  const sourceShard = getShardByUserId(userId);
  const targetShard = SHARDS.find((s) => s.id === targetShardId);

  // Begin transaction on both shards
  const sourceConn = createConnection(sourceShard);
  const targetConn = createConnection(targetShard);

  await sourceConn.query("BEGIN");
  await targetConn.query("BEGIN");

  try {
    // Copy user data
    const userData = await sourceConn.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );
    await targetConn.query("INSERT INTO users SELECT * FROM $1", [userData]);

    // Copy consciousness states
    const states = await sourceConn.query(
      "SELECT * FROM consciousness_states WHERE user_id = $1",
      [userId]
    );
    await targetConn.query(
      "INSERT INTO consciousness_states SELECT * FROM $1",
      [states]
    );

    // Delete from source
    await sourceConn.query(
      "DELETE FROM consciousness_states WHERE user_id = $1",
      [userId]
    );
    await sourceConn.query("DELETE FROM users WHERE id = $1", [userId]);

    // Commit both transactions
    await sourceConn.query("COMMIT");
    await targetConn.query("COMMIT");

    return { success: true };
  } catch (error) {
    // Rollback on error
    await sourceConn.query("ROLLBACK");
    await targetConn.query("ROLLBACK");
    throw error;
  }
}
```

---

## Cache Scaling

### Redis Cluster

```yaml
# redis-cluster.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
  namespace: hdr-empire
spec:
  serviceName: redis-cluster
  replicas: 6
  selector:
    matchLabels:
      app: redis-cluster
  template:
    metadata:
      labels:
        app: redis-cluster
    spec:
      containers:
        - name: redis
          image: redis:7.2-alpine
          command:
            - redis-server
          args:
            - /conf/redis.conf
            - --cluster-enabled yes
            - --cluster-config-file /data/nodes.conf
            - --cluster-node-timeout 5000
            - --appendonly yes
            - --maxmemory 4gb
            - --maxmemory-policy allkeys-lru
          ports:
            - containerPort: 6379
              name: client
            - containerPort: 16379
              name: gossip
          volumeMounts:
            - name: conf
              mountPath: /conf
            - name: data
              mountPath: /data
      volumes:
        - name: conf
          configMap:
            name: redis-cluster-config
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: "fast-ssd"
        resources:
          requests:
            storage: 50Gi
```

```bash
# Deploy Redis cluster
kubectl apply -f redis-cluster.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=redis-cluster -n hdr-empire --timeout=300s

# Create cluster
kubectl exec -it redis-cluster-0 -n hdr-empire -- redis-cli --cluster create \
  $(kubectl get pods -l app=redis-cluster -n hdr-empire -o jsonpath='{range.items[*]}{.status.podIP}:6379 ') \
  --cluster-replicas 1

# Verify cluster
kubectl exec -it redis-cluster-0 -n hdr-empire -- redis-cli cluster info
kubectl exec -it redis-cluster-0 -n hdr-empire -- redis-cli cluster nodes

# Update application to use cluster
kubectl set env deployment/neural-hdr \
  REDIS_CLUSTER_ENABLED=true \
  REDIS_CLUSTER_NODES="redis-cluster-0.redis-cluster:6379,redis-cluster-1.redis-cluster:6379,redis-cluster-2.redis-cluster:6379" \
  -n hdr-empire
```

### Redis Sentinel for High Availability

```yaml
# redis-sentinel.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-sentinel
  namespace: hdr-empire
spec:
  replicas: 3
  selector:
    matchLabels:
      app: redis-sentinel
  template:
    metadata:
      labels:
        app: redis-sentinel
    spec:
      containers:
        - name: sentinel
          image: redis:7.2-alpine
          command:
            - redis-sentinel
          args:
            - /conf/sentinel.conf
          ports:
            - containerPort: 26379
          volumeMounts:
            - name: config
              mountPath: /conf
      volumes:
        - name: config
          configMap:
            name: redis-sentinel-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-sentinel-config
  namespace: hdr-empire
data:
  sentinel.conf: |
    sentinel monitor mymaster redis-0.redis 6379 2
    sentinel down-after-milliseconds mymaster 5000
    sentinel parallel-syncs mymaster 1
    sentinel failover-timeout mymaster 10000
```

---

## Capacity Planning

### Growth Projections

```bash
#!/bin/bash
# capacity-planning.sh - Analyze growth and project capacity needs

# Get current metrics
CURRENT_USERS=$(kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -t -c \
  "SELECT COUNT(*) FROM users;")

CURRENT_STATES=$(kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -t -c \
  "SELECT COUNT(*) FROM consciousness_states;")

CURRENT_RPS=$(curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total[5m])" | \
  jq -r '.data.result[0].value[1]')

# Calculate growth rate (MoM)
GROWTH_RATE=0.15  # 15% month-over-month

# Project 12 months
echo "Capacity Projections (15% MoM Growth):"
echo "======================================="
echo "Month | Users | States | RPS | Pods | DB Size | Cost"

USERS=$CURRENT_USERS
STATES=$CURRENT_STATES
RPS=$CURRENT_RPS

for MONTH in {1..12}; do
  USERS=$(echo "$USERS * (1 + $GROWTH_RATE)" | bc)
  STATES=$(echo "$STATES * (1 + $GROWTH_RATE)" | bc)
  RPS=$(echo "$RPS * (1 + $GROWTH_RATE)" | bc)

  # Calculate required pods (1 pod per 1000 RPS)
  PODS=$(echo "$RPS / 1000" | bc)

  # Calculate database size (1GB per 10K states)
  DB_SIZE=$(echo "$STATES / 10000" | bc)

  # Calculate monthly cost ($100 per pod + $1 per GB storage)
  COST=$(echo "$PODS * 100 + $DB_SIZE * 1" | bc)

  printf "%-5d | %-5d | %-6d | %-3d | %-4d | %-7d | \$%-5d\n" \
    $MONTH ${USERS%.*} ${STATES%.*} ${RPS%.*} $PODS $DB_SIZE $COST
done
```

### Load Testing

```bash
# Install k6 load testing tool
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: k6-script
  namespace: hdr-empire
data:
  test.js: |
    import http from 'k6/http';
    import { check, sleep } from 'k6';

    export let options = {
      stages: [
        { duration: '2m', target: 100 },   // Ramp up to 100 users
        { duration: '5m', target: 100 },   // Stay at 100 users
        { duration: '2m', target: 500 },   // Ramp up to 500 users
        { duration: '5m', target: 500 },   // Stay at 500 users
        { duration: '2m', target: 1000 },  // Ramp up to 1000 users
        { duration: '5m', target: 1000 },  // Stay at 1000 users
        { duration: '2m', target: 0 },     // Ramp down to 0 users
      ],
      thresholds: {
        http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
        http_req_failed: ['rate<0.01'],    // Error rate under 1%
      },
    };

    export default function () {
      // Test consciousness capture
      let captureRes = http.post('http://neural-hdr.hdr-empire:3000/api/consciousness/capture', JSON.stringify({
        depth: 6,
        mode: 'quick'
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

      check(captureRes, {
        'status is 200': (r) => r.status === 200,
        'response time < 1s': (r) => r.timings.duration < 1000,
      });

      sleep(1);
    }
---
apiVersion: batch/v1
kind: Job
metadata:
  name: k6-load-test
  namespace: hdr-empire
spec:
  template:
    spec:
      containers:
      - name: k6
        image: grafana/k6:latest
        command: ['k6', 'run', '/scripts/test.js']
        volumeMounts:
        - name: k6-script
          mountPath: /scripts
      volumes:
      - name: k6-script
        configMap:
          name: k6-script
      restartPolicy: Never
EOF

# Run load test
kubectl wait --for=condition=complete job/k6-load-test -n hdr-empire --timeout=30m

# View results
kubectl logs job/k6-load-test -n hdr-empire
```

---

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

For more information, see:

- [OPERATIONS-MANUAL.md](./OPERATIONS-MANUAL.md) - Daily operations
- [DEPLOYMENT-PROCEDURES.md](./DEPLOYMENT-PROCEDURES.md) - Deployment procedures
- [MONITORING-GUIDE.md](./MONITORING-GUIDE.md) - Monitoring and metrics
