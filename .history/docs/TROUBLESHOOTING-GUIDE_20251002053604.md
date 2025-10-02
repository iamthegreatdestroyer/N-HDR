# HDR Empire Framework - Troubleshooting Guide

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

## Overview

This comprehensive troubleshooting guide covers common issues encountered in the HDR Empire Framework, along with symptoms, diagnostic procedures, and resolution steps. Use this guide to quickly identify and resolve problems in development, staging, and production environments.

## Table of Contents

1. [Service Failures](#service-failures)
2. [Database Issues](#database-issues)
3. [Cache Problems](#cache-problems)
4. [Performance Issues](#performance-issues)
5. [Network Problems](#network-problems)
6. [Authentication Issues](#authentication-issues)
7. [Deployment Failures](#deployment-failures)
8. [Data Integrity Issues](#data-integrity-issues)
9. [Security Incidents](#security-incidents)
10. [Monitoring Issues](#monitoring-issues)

---

## Service Failures

### Pod Crashes (CrashLoopBackOff)

**Symptoms:**

- Pod repeatedly crashes and restarts
- `kubectl get pods` shows `CrashLoopBackOff` status
- Application unable to start

**Diagnosis:**

```bash
# Check pod status
kubectl get pods -n hdr-empire

# View pod events
kubectl describe pod <pod-name> -n hdr-empire

# Check container logs
kubectl logs <pod-name> -n hdr-empire --previous

# Check if image exists
kubectl get pod <pod-name> -n hdr-empire -o jsonpath='{.spec.containers[0].image}'
docker pull <image-name>
```

**Common Causes & Solutions:**

1. **Missing Environment Variables**

```bash
# Check environment variables
kubectl get pod <pod-name> -n hdr-empire -o json | jq '.spec.containers[0].env'

# Fix: Update deployment with missing variables
kubectl set env deployment/neural-hdr DATABASE_URL=postgres://... -n hdr-empire
```

2. **Image Pull Errors**

```bash
# Check image pull secrets
kubectl get secrets -n hdr-empire

# Fix: Create image pull secret
kubectl create secret docker-registry regcred \
  --docker-server=registry.hdr-empire.com \
  --docker-username=<username> \
  --docker-password=<password> \
  --docker-email=<email> \
  -n hdr-empire

# Add secret to deployment
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "regcred"}]}' -n hdr-empire
```

3. **Insufficient Resources**

```bash
# Check resource requests/limits
kubectl describe pod <pod-name> -n hdr-empire | grep -A 5 "Requests:"

# Check node resources
kubectl top nodes

# Fix: Adjust resource requests
kubectl set resources deployment/neural-hdr \
  --requests=cpu=500m,memory=1Gi \
  --limits=cpu=1000m,memory=2Gi \
  -n hdr-empire
```

### OOMKilled (Out of Memory)

**Symptoms:**

- Pod exits with code 137
- Last state shows `OOMKilled`
- Application memory leaks

**Diagnosis:**

```bash
# Check pod exit code
kubectl get pod <pod-name> -n hdr-empire -o jsonpath='{.status.containerStatuses[0].lastState.terminated}'

# Monitor memory usage
kubectl top pod <pod-name> -n hdr-empire

# Get heap dump (if Node.js)
kubectl exec <pod-name> -n hdr-empire -- node --inspect --heapsnapshot-signal=SIGUSR2 &
kubectl exec <pod-name> -n hdr-empire -- kill -SIGUSR2 $(pidof node)
```

**Solution:**

```bash
# Increase memory limits
kubectl set resources deployment/neural-hdr \
  --limits=memory=4Gi \
  -n hdr-empire

# Enable memory profiling
kubectl set env deployment/neural-hdr \
  NODE_OPTIONS="--max-old-space-size=3072" \
  -n hdr-empire

# Restart deployment
kubectl rollout restart deployment/neural-hdr -n hdr-empire
```

### Health Check Failures

**Symptoms:**

- Pods show `Unhealthy` status
- Readiness/liveness probes failing
- Service not receiving traffic

**Diagnosis:**

```bash
# Check probe configuration
kubectl get pod <pod-name> -n hdr-empire -o yaml | grep -A 10 "livenessProbe:"
kubectl get pod <pod-name> -n hdr-empire -o yaml | grep -A 10 "readinessProbe:"

# Test health endpoint manually
kubectl exec <pod-name> -n hdr-empire -- curl -f http://localhost:3000/health

# Check application logs
kubectl logs <pod-name> -n hdr-empire | grep -i health
```

**Solution:**

```yaml
# Fix health check configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neural-hdr
spec:
  template:
    spec:
      containers:
        - name: neural-hdr
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
```

```bash
# Apply updated configuration
kubectl apply -f deployment.yaml -n hdr-empire
```

---

## Database Issues

### Connection Pool Exhausted

**Symptoms:**

- `ECONNREFUSED` or `connection timeout` errors
- Slow database queries
- Application hanging on database operations

**Diagnosis:**

```bash
# Check active connections
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -c \
  "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Check connection limits
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -c "SHOW max_connections;"

# Check waiting connections
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -c \
  "SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock';"
```

**Solution:**

```bash
# Increase connection pool size in application
kubectl set env deployment/neural-hdr \
  DATABASE_POOL_SIZE=50 \
  -n hdr-empire

# Increase PostgreSQL max_connections
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -c \
  "ALTER SYSTEM SET max_connections = 200;"

# Restart PostgreSQL
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -c "SELECT pg_reload_conf();"

# Terminate idle connections
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE state = 'idle' AND state_change < now() - interval '10 minutes';"
```

### Slow Queries

**Symptoms:**

- High database response times
- API endpoints timing out
- Database CPU usage high

**Diagnosis:**

```bash
# Find slow queries
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -c \
  "SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds'
   ORDER BY duration DESC;"

# Check query execution plans
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -c \
  "EXPLAIN ANALYZE SELECT * FROM consciousness_states WHERE user_id = '123';"

# Check missing indexes
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -c \
  "SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE schemaname = 'public'
   AND NOT EXISTS (
     SELECT 1 FROM pg_indexes
     WHERE schemaname = pg_stats.schemaname
     AND tablename = pg_stats.tablename
     AND indexdef LIKE '%' || attname || '%'
   )
   ORDER BY n_distinct DESC
   LIMIT 10;"
```

**Solution:**

```bash
# Add missing indexes
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire <<EOF
CREATE INDEX CONCURRENTLY idx_consciousness_states_user_id
ON consciousness_states(user_id);

CREATE INDEX CONCURRENTLY idx_swarms_status
ON swarms(status) WHERE status = 'active';

CREATE INDEX CONCURRENTLY idx_knowledge_domains_created_at
ON knowledge_domains(created_at DESC);
EOF

# Analyze tables
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -c "ANALYZE;"

# Update statistics
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -c \
  "ANALYZE consciousness_states;"
```

### Database Deadlocks

**Symptoms:**

- Transactions timing out
- `deadlock detected` errors in logs
- Database write operations failing

**Diagnosis:**

```bash
# Check for deadlocks
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -c \
  "SELECT * FROM pg_stat_database WHERE datname = 'hdr_empire';" | grep deadlock

# Identify blocking queries
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -c \
  "SELECT blocked_locks.pid AS blocked_pid,
          blocked_activity.usename AS blocked_user,
          blocking_locks.pid AS blocking_pid,
          blocking_activity.usename AS blocking_user,
          blocked_activity.query AS blocked_statement,
          blocking_activity.query AS current_statement_in_blocking_process
   FROM pg_catalog.pg_locks blocked_locks
   JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
   JOIN pg_catalog.pg_locks blocking_locks
     ON blocking_locks.locktype = blocked_locks.locktype
     AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
     AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
     AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
     AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
     AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
     AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
     AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
     AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
     AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
     AND blocking_locks.pid != blocked_locks.pid
   JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
   WHERE NOT blocked_locks.granted;"
```

**Solution:**

```bash
# Terminate blocking query
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -c \
  "SELECT pg_terminate_backend(<blocking_pid>);"

# Set statement timeout
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -c \
  "ALTER DATABASE hdr_empire SET statement_timeout = '30s';"

# Implement retry logic in application
kubectl set env deployment/neural-hdr \
  DATABASE_RETRY_ATTEMPTS=3 \
  DATABASE_RETRY_DELAY=1000 \
  -n hdr-empire
```

### Replication Lag

**Symptoms:**

- Read replicas showing stale data
- High replication delay
- Inconsistent query results

**Diagnosis:**

```bash
# Check replication status
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -c \
  "SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn,
          sync_state, replay_lag
   FROM pg_stat_replication;"

# Check replication slot
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -c \
  "SELECT slot_name, active, restart_lsn, confirmed_flush_lsn
   FROM pg_replication_slots;"

# Monitor WAL archiving
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -c \
  "SELECT * FROM pg_stat_archiver;"
```

**Solution:**

```bash
# Increase WAL sender processes
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -c \
  "ALTER SYSTEM SET max_wal_senders = 10;"

# Increase replication timeout
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -c \
  "ALTER SYSTEM SET wal_sender_timeout = '60s';"

# Restart replica
kubectl delete pod postgres-replica-0 -n hdr-empire

# If lag is too high, rebuild replica
kubectl exec -it postgres-replica-0 -n hdr-empire -- pg_basebackup \
  -h postgres-0.postgres -U replicator -D /var/lib/postgresql/data -P --wal-method=stream
```

---

## Cache Problems

### Redis Connection Timeouts

**Symptoms:**

- `ETIMEDOUT` errors in application logs
- Slow response times
- Cache misses

**Diagnosis:**

```bash
# Check Redis availability
kubectl exec -it redis-0 -n hdr-empire -- redis-cli ping

# Check connection count
kubectl exec -it redis-0 -n hdr-empire -- redis-cli INFO clients

# Check network latency
kubectl exec -it <app-pod> -n hdr-empire -- ping redis-0.redis.hdr-empire.svc.cluster.local

# Check Redis logs
kubectl logs redis-0 -n hdr-empire | grep -i error
```

**Solution:**

```bash
# Increase connection timeout
kubectl set env deployment/neural-hdr \
  REDIS_CONNECT_TIMEOUT=10000 \
  -n hdr-empire

# Increase maxclients in Redis
kubectl exec -it redis-0 -n hdr-empire -- redis-cli CONFIG SET maxclients 20000

# Enable connection pooling
kubectl set env deployment/neural-hdr \
  REDIS_POOL_SIZE=50 \
  REDIS_POOL_MIN=10 \
  -n hdr-empire
```

### Redis Memory Full

**Symptoms:**

- `OOM command not allowed` errors
- Cache writes failing
- Eviction rate increasing

**Diagnosis:**

```bash
# Check memory usage
kubectl exec -it redis-0 -n hdr-empire -- redis-cli INFO memory

# Check eviction stats
kubectl exec -it redis-0 -n hdr-empire -- redis-cli INFO stats | grep evicted

# Check maxmemory policy
kubectl exec -it redis-0 -n hdr-empire -- redis-cli CONFIG GET maxmemory-policy
```

**Solution:**

```bash
# Set eviction policy
kubectl exec -it redis-0 -n hdr-empire -- redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Increase maxmemory
kubectl exec -it redis-0 -n hdr-empire -- redis-cli CONFIG SET maxmemory 4gb

# Clear expired keys
kubectl exec -it redis-0 -n hdr-empire -- redis-cli --scan --pattern '*' | xargs redis-cli DEL

# Flush stale data
kubectl exec -it redis-0 -n hdr-empire -- redis-cli FLUSHDB
```

### Cache Inconsistency

**Symptoms:**

- Stale data in cache
- Different values between cache and database
- Unexpected cache misses

**Diagnosis:**

```bash
# Check key TTL
kubectl exec -it redis-0 -n hdr-empire -- redis-cli TTL "consciousness:state:123"

# Compare cache and database
DB_VALUE=$(kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -t -c \
  "SELECT data FROM consciousness_states WHERE id = '123';")
CACHE_VALUE=$(kubectl exec -it redis-0 -n hdr-empire -- redis-cli GET "consciousness:state:123")
echo "DB: $DB_VALUE"
echo "Cache: $CACHE_VALUE"

# Check cache hit rate
kubectl exec -it redis-0 -n hdr-empire -- redis-cli INFO stats | grep keyspace
```

**Solution:**

```bash
# Invalidate specific key
kubectl exec -it redis-0 -n hdr-empire -- redis-cli DEL "consciousness:state:123"

# Invalidate pattern
kubectl exec -it redis-0 -n hdr-empire -- redis-cli --scan --pattern 'consciousness:*' | \
  xargs kubectl exec -it redis-0 -n hdr-empire -- redis-cli DEL

# Set appropriate TTL
kubectl set env deployment/neural-hdr \
  CACHE_TTL=3600 \
  -n hdr-empire

# Implement cache-aside pattern with version check
kubectl set env deployment/neural-hdr \
  CACHE_VERSION_CHECK=true \
  -n hdr-empire
```

---

## Performance Issues

### High API Latency

**Symptoms:**

- Slow response times (>1000ms)
- Timeouts in client applications
- High p95/p99 latency metrics

**Diagnosis:**

```bash
# Check current latency
kubectl exec <app-pod> -n hdr-empire -- curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/consciousness/capture

# curl-format.txt:
# time_namelookup:  %{time_namelookup}\n
# time_connect:  %{time_connect}\n
# time_starttransfer:  %{time_starttransfer}\n
# time_total:  %{time_total}\n

# Check Prometheus metrics
curl -s "http://prometheus:9090/api/v1/query?query=histogram_quantile(0.95,%20rate(http_request_duration_seconds_bucket[5m]))" | jq

# Profile application
kubectl exec <app-pod> -n hdr-empire -- node --inspect --prof

# Check slow logs
kubectl logs <app-pod> -n hdr-empire | grep -i "slow\|timeout"
```

**Solution:**

```bash
# Enable response compression
kubectl set env deployment/neural-hdr \
  COMPRESSION_ENABLED=true \
  COMPRESSION_THRESHOLD=1024 \
  -n hdr-empire

# Implement caching
kubectl set env deployment/neural-hdr \
  CACHE_ENABLED=true \
  CACHE_TTL=3600 \
  -n hdr-empire

# Increase worker threads
kubectl set env deployment/neural-hdr \
  WORKER_THREADS=4 \
  UV_THREADPOOL_SIZE=128 \
  -n hdr-empire

# Add database connection pooling
kubectl set env deployment/neural-hdr \
  DATABASE_POOL_SIZE=50 \
  DATABASE_POOL_TIMEOUT=10000 \
  -n hdr-empire

# Scale horizontally
kubectl scale deployment/neural-hdr --replicas=5 -n hdr-empire
```

### Memory Leaks

**Symptoms:**

- Gradually increasing memory usage
- OOMKilled after running for hours
- Performance degradation over time

**Diagnosis:**

```bash
# Monitor memory over time
kubectl top pod <pod-name> -n hdr-empire --containers

# Generate heap snapshot
kubectl exec <pod-name> -n hdr-empire -- node --heapsnapshot-signal=SIGUSR2 index.js &
kubectl exec <pod-name> -n hdr-empire -- kill -SIGUSR2 $(pidof node)
kubectl cp <pod-name>:/app/Heap.*.heapsnapshot ./heap.heapsnapshot -n hdr-empire

# Check for leaks with clinic
kubectl exec <pod-name> -n hdr-empire -- npm install -g clinic
kubectl exec <pod-name> -n hdr-empire -- clinic doctor -- node index.js
```

**Solution:**

```javascript
// Fix common memory leaks

// 1. Remove event listeners
class ConsciousnessCapture {
  constructor() {
    this.emitter = new EventEmitter();
    this.listener = this.handleEvent.bind(this);
    this.emitter.on("capture", this.listener);
  }

  destroy() {
    // Remove listener to prevent leak
    this.emitter.removeListener("capture", this.listener);
  }
}

// 2. Clear timers
class SwarmManager {
  constructor() {
    this.intervalId = setInterval(() => this.checkSwarms(), 1000);
  }

  destroy() {
    // Clear interval to prevent leak
    clearInterval(this.intervalId);
  }
}

// 3. Close database connections
async function processData() {
  const client = await pool.connect();
  try {
    await client.query("SELECT * FROM data");
  } finally {
    // Always release connection
    client.release();
  }
}

// 4. Limit cache size
const cache = new Map();
const MAX_CACHE_SIZE = 10000;

function addToCache(key, value) {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}
```

```bash
# Apply fixes and restart
kubectl rollout restart deployment/neural-hdr -n hdr-empire

# Set memory limits
kubectl set resources deployment/neural-hdr \
  --limits=memory=2Gi \
  -n hdr-empire

# Enable garbage collection logging
kubectl set env deployment/neural-hdr \
  NODE_OPTIONS="--max-old-space-size=1536 --trace-gc" \
  -n hdr-empire
```

### High CPU Usage

**Symptoms:**

- CPU usage consistently >80%
- Application throttling
- Slow request processing

**Diagnosis:**

```bash
# Check CPU usage
kubectl top pod -n hdr-empire | sort -k3 -rn

# Profile CPU usage
kubectl exec <pod-name> -n hdr-empire -- node --prof index.js

# Generate CPU profile
kubectl exec <pod-name> -n hdr-empire -- npm install -g clinic
kubectl exec <pod-name> -n hdr-empire -- clinic flame -- node index.js

# Check for CPU-intensive operations in logs
kubectl logs <pod-name> -n hdr-empire | grep -i "processing\|compute\|calculate"
```

**Solution:**

```bash
# Scale horizontally
kubectl scale deployment/neural-hdr --replicas=10 -n hdr-empire

# Enable clustering
kubectl set env deployment/neural-hdr \
  CLUSTER_MODE=true \
  CLUSTER_WORKERS=4 \
  -n hdr-empire

# Offload heavy computations to worker threads
kubectl set env deployment/neural-hdr \
  WORKER_THREADS=4 \
  -n hdr-empire

# Optimize algorithms (code changes required)
# - Use memoization for expensive calculations
# - Implement pagination for large datasets
# - Use streaming for large file processing
# - Add database indexes for faster queries

# Increase CPU limits
kubectl set resources deployment/neural-hdr \
  --limits=cpu=2000m \
  -n hdr-empire
```

---

## Network Problems

### DNS Resolution Failures

**Symptoms:**

- `ENOTFOUND` errors
- Unable to connect to services
- Intermittent connection issues

**Diagnosis:**

```bash
# Test DNS resolution
kubectl exec <pod-name> -n hdr-empire -- nslookup postgres-0.postgres
kubectl exec <pod-name> -n hdr-empire -- nslookup redis-0.redis.hdr-empire.svc.cluster.local

# Check CoreDNS logs
kubectl logs -n kube-system -l k8s-app=kube-dns

# Check DNS configuration
kubectl get configmap coredns -n kube-system -o yaml

# Test connectivity
kubectl exec <pod-name> -n hdr-empire -- ping postgres-0.postgres -c 3
```

**Solution:**

```bash
# Restart CoreDNS
kubectl rollout restart deployment/coredns -n kube-system

# Use FQDN in connection strings
kubectl set env deployment/neural-hdr \
  DATABASE_URL=postgres://user:pass@postgres-0.postgres.hdr-empire.svc.cluster.local:5432/db \
  -n hdr-empire

# Increase DNS timeout
kubectl set env deployment/neural-hdr \
  DNS_TIMEOUT=5000 \
  -n hdr-empire

# Add ndots configuration to pod
kubectl patch deployment neural-hdr -n hdr-empire --type=json -p='[
  {
    "op": "add",
    "path": "/spec/template/spec/dnsConfig",
    "value": {
      "options": [
        {"name": "ndots", "value": "2"}
      ]
    }
  }
]'
```

### Ingress Issues

**Symptoms:**

- 502/504 gateway errors
- Cannot access application externally
- SSL/TLS errors

**Diagnosis:**

```bash
# Check ingress configuration
kubectl get ingress -n hdr-empire
kubectl describe ingress hdr-empire-ingress -n hdr-empire

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Test backend service
kubectl run test --rm -it --image=busybox --restart=Never -- wget -O- http://neural-hdr:3000/health

# Check SSL certificate
openssl s_client -connect api.hdr-empire.com:443 -servername api.hdr-empire.com
```

**Solution:**

```bash
# Fix ingress configuration
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hdr-empire-ingress
  namespace: hdr-empire
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
spec:
  tls:
  - hosts:
    - api.hdr-empire.com
    secretName: hdr-empire-tls
  rules:
  - host: api.hdr-empire.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: neural-hdr
            port:
              number: 3000
EOF

# Renew SSL certificate
certbot certonly --manual --preferred-challenges dns -d api.hdr-empire.com

# Update Kubernetes secret
kubectl create secret tls hdr-empire-tls \
  --cert=./fullchain.pem \
  --key=./privkey.pem \
  --dry-run=client -o yaml | kubectl apply -n hdr-empire -f -

# Restart ingress controller
kubectl rollout restart deployment/ingress-nginx-controller -n ingress-nginx
```

---

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

For more information, see:

- [OPERATIONS-MANUAL.md](./OPERATIONS-MANUAL.md) - Daily operations
- [MONITORING-GUIDE.md](./MONITORING-GUIDE.md) - Monitoring setup
- [SCALING-GUIDE.md](./SCALING-GUIDE.md) - Scaling strategies
