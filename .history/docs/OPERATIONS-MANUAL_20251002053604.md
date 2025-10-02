# HDR Empire Framework - Operations Manual

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

## Overview

This operations manual provides comprehensive guidance for deploying, operating, and maintaining the HDR Empire Framework in production environments. It covers day-to-day operational procedures, system administration, and best practices for ensuring optimal performance and reliability.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Deployment Overview](#deployment-overview)
3. [Daily Operations](#daily-operations)
4. [System Monitoring](#system-monitoring)
5. [Performance Management](#performance-management)
6. [Incident Response](#incident-response)
7. [Maintenance Procedures](#maintenance-procedures)
8. [Security Operations](#security-operations)
9. [Capacity Planning](#capacity-planning)
10. [Operational Best Practices](#operational-best-practices)

---

## System Architecture

### Production Environment Layout

```
Production Environment
├── Load Balancer (NGINX/HAProxy)
│   ├── SSL Termination
│   └── Request Routing
├── Application Tier
│   ├── HDR Services (Kubernetes Pods)
│   │   ├── Neural-HDR (3 replicas)
│   │   ├── Nano-Swarm HDR (5 replicas)
│   │   ├── Omniscient-HDR (3 replicas)
│   │   ├── Reality-HDR (3 replicas)
│   │   ├── Quantum-HDR (3 replicas)
│   │   ├── Dream-HDR (2 replicas)
│   │   └── Void-Blade HDR (3 replicas)
│   ├── Integration Layer (3 replicas)
│   └── Command Interface (3 replicas)
├── Data Tier
│   ├── PostgreSQL Cluster (Primary + 2 Replicas)
│   ├── Redis Cluster (6 nodes - 3 master, 3 replica)
│   └── S3-Compatible Storage
└── Observability Stack
    ├── Prometheus (Metrics)
    ├── Grafana (Visualization)
    ├── ELK Stack (Logging)
    └── Jaeger (Tracing)
```

### Service Dependencies

**Critical Dependencies:**

- PostgreSQL: All HDR systems rely on database for state persistence
- Redis: Caching and session management
- Load Balancer: Entry point for all external traffic

**Service Startup Order:**

1. PostgreSQL
2. Redis
3. VB-HDR (Security first)
4. Core HDR Systems (N-HDR, NS-HDR, O-HDR, R-HDR, Q-HDR, D-HDR)
5. Integration Layer
6. Command Interface
7. Applications (Dashboard, Quantum Explorer, Consciousness Workbench)

---

## Deployment Overview

### Deployment Architecture

**Environment Types:**

- **Development**: Single server, minimal redundancy
- **Staging**: Mirrors production, scaled down
- **Production**: Full high-availability setup

**Deployment Strategy:**

- Rolling updates (zero downtime)
- Blue-green deployments for major releases
- Canary deployments for high-risk changes

### Pre-Deployment Checklist

```bash
# 1. Verify all services are healthy
kubectl get pods -n hdr-empire

# 2. Check database connectivity
psql -h $DB_HOST -U $DB_USER -d hdr_empire -c "SELECT 1"

# 3. Verify Redis cluster
redis-cli -c -h $REDIS_HOST ping

# 4. Run pre-deployment tests
npm run test:integration

# 5. Backup current state
./scripts/backup-production.sh

# 6. Review deployment plan
cat deployment-plan.md

# 7. Notify stakeholders
./scripts/notify-deployment.sh "Starting deployment v1.2.3"
```

### Deployment Procedure

```bash
# 1. Deploy infrastructure changes (if any)
kubectl apply -f k8s/infrastructure/

# 2. Deploy database migrations
npm run db:migrate

# 3. Deploy core services (rolling update)
kubectl apply -f k8s/services/hdr-systems/

# 4. Verify health of new pods
kubectl rollout status deployment/neural-hdr -n hdr-empire

# 5. Deploy integration layer
kubectl apply -f k8s/services/integration/

# 6. Deploy command interface
kubectl apply -f k8s/services/command-interface/

# 7. Deploy applications
kubectl apply -f k8s/services/applications/

# 8. Run smoke tests
npm run test:smoke

# 9. Monitor metrics for anomalies
# Check Grafana dashboards

# 10. Notify completion
./scripts/notify-deployment.sh "Deployment v1.2.3 complete"
```

### Rollback Procedure

```bash
# 1. Identify version to rollback to
kubectl rollout history deployment/neural-hdr -n hdr-empire

# 2. Execute rollback
kubectl rollout undo deployment/neural-hdr -n hdr-empire

# 3. Verify rollback
kubectl rollout status deployment/neural-hdr -n hdr-empire

# 4. Rollback database migrations (if needed)
npm run db:migrate:rollback

# 5. Notify stakeholders
./scripts/notify-deployment.sh "Rollback to v1.2.2 complete"
```

---

## Daily Operations

### Morning Checklist

**System Health (8:00 AM):**

```bash
# 1. Check all services are running
kubectl get pods -n hdr-empire | grep -v Running

# 2. Review overnight alerts
curl -s http://prometheus:9090/api/v1/alerts | jq '.data.alerts'

# 3. Check disk space
df -h | grep -E '9[0-9]%'

# 4. Review error logs from last 24 hours
kubectl logs -n hdr-empire --since=24h -l app=hdr-empire | grep ERROR

# 5. Check backup status
./scripts/check-backups.sh

# 6. Review performance metrics
curl -s http://grafana:3000/api/dashboards/db/hdr-overview
```

**Database Maintenance (9:00 AM):**

```bash
# 1. Check database size and growth
psql -h $DB_HOST -U $DB_USER -d hdr_empire -c "
  SELECT
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
  FROM pg_database
  ORDER BY pg_database_size(pg_database.datname) DESC;"

# 2. Check for long-running queries
psql -h $DB_HOST -U $DB_USER -d hdr_empire -c "
  SELECT pid, now() - pg_stat_activity.query_start AS duration, query
  FROM pg_stat_activity
  WHERE state = 'active'
  AND now() - pg_stat_activity.query_start > interval '5 minutes';"

# 3. Vacuum statistics
psql -h $DB_HOST -U $DB_USER -d hdr_empire -c "
  SELECT schemaname, relname, last_vacuum, last_autovacuum
  FROM pg_stat_user_tables
  ORDER BY last_vacuum DESC NULLS LAST
  LIMIT 10;"
```

**Cache Health (10:00 AM):**

```bash
# 1. Check Redis memory usage
redis-cli -h $REDIS_HOST info memory | grep used_memory_human

# 2. Check cache hit rate
redis-cli -h $REDIS_HOST info stats | grep keyspace

# 3. Check for evictions
redis-cli -h $REDIS_HOST info stats | grep evicted_keys

# 4. Clear stale cache entries (if needed)
redis-cli -h $REDIS_HOST --scan --pattern "stale:*" | xargs redis-cli DEL
```

### Evening Checklist

**End of Day Review (5:00 PM):**

```bash
# 1. Review daily metrics
./scripts/daily-metrics-report.sh

# 2. Check for any pending alerts
curl -s http://prometheus:9090/api/v1/alerts | jq '.data.alerts | length'

# 3. Verify backup completion
./scripts/check-backups.sh --today

# 4. Review access logs for anomalies
kubectl logs -n hdr-empire -l app=nginx --since=8h | grep -E '(401|403|500)'

# 5. Plan for next day
cat operations-calendar.md
```

---

## System Monitoring

### Key Metrics to Monitor

**System-Level Metrics:**

| Metric       | Warning Threshold | Critical Threshold | Action                   |
| ------------ | ----------------- | ------------------ | ------------------------ |
| CPU Usage    | >70%              | >85%               | Scale up pods            |
| Memory Usage | >75%              | >90%               | Investigate memory leaks |
| Disk Usage   | >80%              | >90%               | Clean old data or expand |
| Network I/O  | >500 Mbps         | >800 Mbps          | Check for DDoS           |

**Application Metrics:**

| Metric        | Warning Threshold | Critical Threshold | Action                         |
| ------------- | ----------------- | ------------------ | ------------------------------ |
| Request Rate  | >10,000/sec       | >15,000/sec        | Enable rate limiting           |
| Error Rate    | >1%               | >5%                | Check logs, rollback if needed |
| Response Time | >500ms (p95)      | >1000ms (p95)      | Optimize queries               |
| Queue Depth   | >1000             | >5000              | Scale workers                  |

**HDR-Specific Metrics:**

```bash
# Neural-HDR metrics
curl -s http://prometheus:9090/api/v1/query?query=neural_hdr_capture_duration_seconds | jq .

# Nano-Swarm HDR metrics
curl -s http://prometheus:9090/api/v1/query?query=swarm_active_bots | jq .

# Omniscient-HDR metrics
curl -s http://prometheus:9090/api/v1/query?query=omniscient_hdr_concepts_count | jq .

# Reality-HDR metrics
curl -s http://prometheus:9090/api/v1/query?query=reality_hdr_compression_ratio | jq .
```

### Grafana Dashboards

**Primary Dashboards:**

1. **HDR Empire Overview**: High-level system health
2. **Service Health**: Individual service metrics
3. **Database Performance**: PostgreSQL metrics
4. **Cache Performance**: Redis metrics
5. **Security Dashboard**: VB-HDR threats and responses
6. **Business Metrics**: User activity, operations/sec

**Accessing Dashboards:**

```bash
# Port forward to Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Open in browser
# http://localhost:3000
# Default credentials: admin/admin (change after first login)
```

### Alert Configuration

**Critical Alerts (24/7 response):**

- Service down (any HDR system)
- Database unavailable
- Security breach detected
- Data loss detected
- Disk space >95%

**Warning Alerts (business hours response):**

- High error rate (>1%)
- Slow response times (>500ms p95)
- High memory usage (>75%)
- Backup failures
- Certificate expiration (<7 days)

**Alert Routing:**

```yaml
# alertmanager-config.yaml
route:
  group_by: ["alertname", "cluster"]
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: "team-ops"
  routes:
    - match:
        severity: critical
      receiver: "team-ops-critical"
    - match:
        severity: warning
      receiver: "team-ops-warning"

receivers:
  - name: "team-ops-critical"
    pagerduty_configs:
      - service_key: "<pagerduty-key>"
    email_configs:
      - to: "ops-critical@company.com"

  - name: "team-ops-warning"
    email_configs:
      - to: "ops-team@company.com"
```

---

## Performance Management

### Performance Baselines

**Expected Performance (Production):**

| Operation                         | Target  | Current | Status  |
| --------------------------------- | ------- | ------- | ------- |
| N-HDR Capture (6 layers)          | <1000ms | 875ms   | ✅ Good |
| NS-HDR Swarm Deploy               | <200ms  | 152ms   | ✅ Good |
| O-HDR Crystallize (1000 concepts) | <3000ms | 2345ms  | ✅ Good |
| R-HDR Compress (100MB)            | <5000ms | 3872ms  | ✅ Good |
| Q-HDR Superposition               | <500ms  | 387ms   | ✅ Good |
| D-HDR Amplify                     | <2000ms | 1654ms  | ✅ Good |
| VB-HDR Security Zone              | <300ms  | 234ms   | ✅ Good |

### Performance Optimization Procedures

**Database Optimization:**

```sql
-- Identify slow queries
SELECT
  query,
  calls,
  total_time / 1000 AS total_seconds,
  mean_time / 1000 AS mean_seconds
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_consciousness_states_timestamp
ON consciousness_states(timestamp DESC);

-- Update statistics
ANALYZE consciousness_states;

-- Vacuum if needed
VACUUM ANALYZE consciousness_states;
```

**Cache Optimization:**

```bash
# Check cache hit rate
redis-cli -h $REDIS_HOST info stats | grep -E '(hits|misses)'

# Increase cache TTL for hot data
redis-cli -h $REDIS_HOST CONFIG SET maxmemory-policy allkeys-lru

# Monitor cache memory
redis-cli -h $REDIS_HOST MEMORY STATS
```

**Application Optimization:**

```bash
# Enable compression for large responses
kubectl set env deployment/neural-hdr -n hdr-empire COMPRESSION_ENABLED=true

# Increase worker threads
kubectl set env deployment/nano-swarm-hdr -n hdr-empire WORKER_THREADS=8

# Enable connection pooling
kubectl set env deployment/omniscient-hdr -n hdr-empire DB_POOL_SIZE=20
```

---

## Incident Response

### Incident Classification

**Severity Levels:**

| Level         | Description                              | Response Time | Escalation |
| ------------- | ---------------------------------------- | ------------- | ---------- |
| P1 - Critical | Service down, data loss, security breach | <15 min       | Immediate  |
| P2 - High     | Degraded performance, partial outage     | <30 min       | 1 hour     |
| P3 - Medium   | Minor issues, workarounds available      | <2 hours      | 4 hours    |
| P4 - Low      | Cosmetic issues, feature requests        | <1 day        | N/A        |

### Incident Response Procedure

**1. Detection and Alerting:**

- Alert received via PagerDuty/Email
- On-call engineer acknowledges within 5 minutes
- Initial assessment and classification

**2. Initial Response:**

```bash
# Gather initial information
kubectl get pods -n hdr-empire
kubectl describe pod <pod-name> -n hdr-empire
kubectl logs <pod-name> -n hdr-empire --tail=100

# Check recent deployments
kubectl rollout history deployment/<service-name> -n hdr-empire

# Check metrics
curl -s http://prometheus:9090/api/v1/query?query=up{job="hdr-empire"}
```

**3. Communication:**

- Post incident in #incidents Slack channel
- Update status page
- Notify stakeholders if customer-facing

**4. Mitigation:**

- Apply immediate fix or rollback
- Document all actions taken
- Verify fix with monitoring

**5. Post-Incident:**

- Write incident report
- Conduct post-mortem
- Implement preventive measures

### Common Incident Scenarios

#### Scenario 1: High Error Rate

```bash
# 1. Check error logs
kubectl logs -n hdr-empire -l app=neural-hdr --tail=100 | grep ERROR

# 2. Check database connectivity
psql -h $DB_HOST -U $DB_USER -d hdr_empire -c "SELECT 1"

# 3. Check dependencies
curl http://redis:6379/ping

# 4. If database issue, check connections
psql -h $DB_HOST -U $DB_USER -d hdr_empire -c "
  SELECT count(*) FROM pg_stat_activity;"

# 5. If needed, restart service
kubectl rollout restart deployment/neural-hdr -n hdr-empire
```

#### Scenario 2: Memory Leak

```bash
# 1. Identify pod with high memory
kubectl top pods -n hdr-empire | sort -k3 -r

# 2. Get heap dump (Node.js)
kubectl exec -n hdr-empire <pod-name> -- node --expose-gc --inspect

# 3. Restart affected pod
kubectl delete pod <pod-name> -n hdr-empire

# 4. Monitor memory after restart
watch kubectl top pod <pod-name> -n hdr-empire
```

#### Scenario 3: Database Deadlock

```sql
-- 1. Identify blocking queries
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- 2. Terminate blocking query (if safe)
SELECT pg_terminate_backend(<blocking_pid>);
```

---

## Maintenance Procedures

### Scheduled Maintenance Window

**Frequency:** Every Sunday 2:00 AM - 4:00 AM UTC

**Maintenance Activities:**

1. Database maintenance (vacuum, reindex)
2. Log rotation and archival
3. Security patch application
4. Performance optimization
5. Backup verification

### Database Maintenance

```bash
# Run during maintenance window
# 1. Full vacuum (requires downtime)
psql -h $DB_HOST -U $DB_USER -d hdr_empire -c "VACUUM FULL ANALYZE;"

# 2. Reindex
psql -h $DB_HOST -U $DB_USER -d hdr_empire -c "REINDEX DATABASE hdr_empire;"

# 3. Update statistics
psql -h $DB_HOST -U $DB_USER -d hdr_empire -c "ANALYZE;"

# 4. Check for bloat
psql -h $DB_HOST -U $DB_USER -d hdr_empire -f scripts/check-table-bloat.sql
```

### Certificate Renewal

```bash
# Check certificate expiration
echo | openssl s_client -servername hdr-empire.com -connect hdr-empire.com:443 2>/dev/null | openssl x509 -noout -dates

# Renew Let's Encrypt certificate
certbot renew --nginx

# Update Kubernetes secret
kubectl create secret tls hdr-tls-cert \
  --cert=/etc/letsencrypt/live/hdr-empire.com/fullchain.pem \
  --key=/etc/letsencrypt/live/hdr-empire.com/privkey.pem \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart ingress
kubectl rollout restart deployment/nginx-ingress -n ingress-nginx
```

### Log Rotation

```bash
# Configure logrotate
cat > /etc/logrotate.d/hdr-empire << EOF
/var/log/hdr-empire/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 hdr-empire hdr-empire
    sharedscripts
    postrotate
        kubectl rollout restart deployment/hdr-empire -n hdr-empire
    endscript
}
EOF

# Test logrotate
logrotate -d /etc/logrotate.d/hdr-empire
```

---

## Security Operations

### Security Monitoring

**Daily Security Checks:**

```bash
# 1. Review VB-HDR threat logs
kubectl logs -n hdr-empire -l app=void-blade-hdr | grep "threat-detected"

# 2. Check failed authentication attempts
kubectl logs -n hdr-empire -l app=command-interface | grep "auth-failed" | wc -l

# 3. Review access patterns
kubectl logs -n hdr-empire -l app=nginx | grep -E "40[13]" | wc -l

# 4. Check for vulnerabilities
trivy image hdr-empire/neural-hdr:latest
```

**Security Incident Response:**

```bash
# 1. Isolate affected systems
kubectl scale deployment/<compromised-service> -n hdr-empire --replicas=0

# 2. Capture forensics
kubectl logs <pod-name> -n hdr-empire > incident-logs.txt
kubectl exec <pod-name> -n hdr-empire -- ps aux > incident-processes.txt

# 3. Rotate credentials
./scripts/rotate-secrets.sh

# 4. Enable enhanced monitoring
kubectl set env deployment/void-blade-hdr -n hdr-empire THREAT_SCAN_INTERVAL=1000
```

### Access Management

```bash
# Grant user access
kubectl create serviceaccount <username> -n hdr-empire
kubectl create rolebinding <username>-binding \
  --clusterrole=hdr-operator \
  --serviceaccount=hdr-empire:<username>

# Revoke user access
kubectl delete rolebinding <username>-binding -n hdr-empire
kubectl delete serviceaccount <username> -n hdr-empire

# Audit access
kubectl get rolebindings -n hdr-empire
```

---

## Capacity Planning

### Capacity Metrics

**Current Capacity (Production):**

- Consciousness states: 1M states/day
- Knowledge concepts: 10M concepts
- Active swarms: 1000 concurrent
- Concurrent users: 10,000
- Requests/second: 50,000

**Growth Projections:**

- Month-over-month: +15%
- Year-over-year: +200%

### Scaling Procedures

**Horizontal Scaling (Add Pods):**

```bash
# Scale up service
kubectl scale deployment/neural-hdr -n hdr-empire --replicas=5

# Enable autoscaling
kubectl autoscale deployment/neural-hdr -n hdr-empire \
  --cpu-percent=70 \
  --min=3 \
  --max=10
```

**Vertical Scaling (Increase Resources):**

```yaml
# Update deployment resource limits
resources:
  requests:
    memory: "2Gi"
    cpu: "1000m"
  limits:
    memory: "4Gi"
    cpu: "2000m"
```

**Database Scaling:**

```bash
# Add read replica
kubectl apply -f k8s/database/replica.yaml

# Update connection strings for read operations
kubectl set env deployment/omniscient-hdr -n hdr-empire \
  DB_READ_HOST=postgres-replica.default.svc.cluster.local
```

---

## Operational Best Practices

### Documentation Standards

1. **Document all changes** in change log
2. **Update runbooks** after incidents
3. **Maintain architecture diagrams**
4. **Keep contact list current**
5. **Document workarounds** for known issues

### Communication Protocols

**Planned Maintenance:**

- Notify stakeholders 3 days in advance
- Post on status page
- Send email notification
- Update Slack channel

**Unplanned Outages:**

- Post incident immediately
- Provide hourly updates
- Send resolution notification
- Conduct post-mortem

### On-Call Rotation

**Rotation Schedule:**

- Primary on-call: 1 week rotation
- Secondary on-call: Backup support
- Escalation: Engineering manager

**On-Call Responsibilities:**

- Respond to alerts within 15 minutes
- Escalate if needed
- Document all actions
- Handoff summary to next on-call

### Knowledge Transfer

**Weekly Team Sync:**

- Review incidents from past week
- Share learnings and improvements
- Discuss upcoming changes
- Update documentation

**Monthly Review:**

- Capacity planning review
- Performance metrics review
- Security posture review
- Process improvements

---

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

For more information, see:

- [DEPLOYMENT-PROCEDURES.md](./DEPLOYMENT-PROCEDURES.md) - Detailed deployment procedures
- [MONITORING-GUIDE.md](./MONITORING-GUIDE.md) - Comprehensive monitoring setup
- [TROUBLESHOOTING-GUIDE.md](./TROUBLESHOOTING-GUIDE.md) - Common issues and solutions
- [SCALING-GUIDE.md](./SCALING-GUIDE.md) - Scaling strategies
- [BACKUP-RECOVERY.md](./BACKUP-RECOVERY.md) - Backup and disaster recovery
