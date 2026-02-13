# Phase 10 Deployment Runbooks

**Version:** 10.6  
**Status:** Production-Ready  
**Last Updated:** February 12, 2026

---

## Overview

Complete operational guides for deploying GENESIS-HDR, ORACLE-HDR, and D-HDR systems.

This document covers:
- **Staging Deployment** (Blue-Green strategy)
- **Production Rollout** (Canary strategy with automated rollback)
- **Disaster Recovery** (Restore procedures)
- **Health Monitoring** (Pre/post-deployment validation)

---

## Pre-Deployment Checklist

### Prerequisites

- [ ] All tests passing (`npm test` - 200+ cases)
- [ ] Staging environment available
- [ ] Production cluster healthy (all nodes available)
- [ ] Backup of current production configuration
- [ ] Runbook reviewer has approved deployment
- [ ] Communication sent to stakeholders
- [ ] Rollback procedures tested in last 30 days

### Environment Validation

```bash
# Check staging
kubectl get nodes -l environment=staging
# Expected: All nodes Ready

# Check production
kubectl get nodes -l environment=production
# Expected: All nodes Ready, at least 3 nodes

# Verify critical dependencies
./scripts/check-dependencies.sh --env staging
./scripts/check-dependencies.sh --env production
```

---

## Staging Deployment (Blue-Green)

### Strategy

Blue-Green deployment eliminates downtime:
- **Blue**: Current production version
- **Green**: New version being tested
- **Switch**: Atomic cutover when ready

### Step 1: Deploy to Green Environment

```bash
#!/bin/bash
# deploy-staging.sh

set -e

NAMESPACE="staging"
IMAGE_TAG="${1:-latest}"
BLUE_DEPLOYMENT="${NAMESPACE}-blue"
GREEN_DEPLOYMENT="${NAMESPACE}-green"

echo "📦 Deploying Phase 10 to Green (${IMAGE_TAG})..."

# 1. Build Docker images
echo "Building images..."
docker build -t hdr-genesis:${IMAGE_TAG} ./src/genesis-hdr
docker build -t hdr-oracle:${IMAGE_TAG} ./src/oracle-hdr
docker build -t hdr-diffusion:${IMAGE_TAG} ./src/d-hdr

docker push hdr-genesis:${IMAGE_TAG}
docker push hdr-oracle:${IMAGE_TAG}
docker push hdr-diffusion:${IMAGE_TAG}

# 2. Apply Kubernetes manifests to green environment
kubectl apply -f k8s/genesis-deployment.yaml \
  --selector="environment=staging,color=green" \
  --namespace=$NAMESPACE

kubectl apply -f k8s/oracle-deployment.yaml \
  --selector="environment=staging,color=green" \
  --namespace=$NAMESPACE

kubectl apply -f k8s/diffusion-deployment.yaml \
  --selector="environment=staging,color=green" \
  --namespace=$NAMESPACE

# 3. Wait for rollout
echo "Waiting for Green rollout to complete..."
kubectl rollout status deployment/$GREEN_DEPLOYMENT -n $NAMESPACE --timeout=5m

# 4. Run smoke tests
echo "Running smoke tests on Green..."
./scripts/smoke-test.sh --environment staging-green --timeout 60

# 5. Run integration tests
echo "Running integration tests..."
npm run test:integration -- --env staging-green --timeout 120

echo "✓ Green deployment successful"
echo "Available at: https://staging-green.example.com"
```

### Step 2: Validate Green Environment

```bash
#!/bin/bash
# validate-green.sh

ENDPOINT="https://staging-green.example.com"
TIMEOUT=300
START_TIME=$(date +%s)

echo "🔍 Validating Green environment..."

# Check API health
check_health() {
  local response=$(curl -s -o /dev/null -w "%{http_code}" $ENDPOINT/health)
  [ "$response" == "200" ]
}

# Check core endpoints
check_endpoints() {
  # GENESIS endpoint
  curl -s -X POST $ENDPOINT/api/genesis/breed \
    -H "Content-Type: application/json" \
    -d '{"populationSize": 5}' | jq .id

  # ORACLE endpoint
  curl -s -X POST $ENDPOINT/api/oracle/predict \
    -d '{"query": "test"}' | jq .confidence

  # D-HDR endpoint
  curl -s -X POST $ENDPOINT/api/diffusion/generate \
    -d '{"steps": 5}' | jq .consequences
}

# Wait for health
while ! check_health; do
  ELAPSED=$(($(date +%s) - START_TIME))
  if [ $ELAPSED -gt $TIMEOUT ]; then
    echo "✗ Green environment unhealthy after ${TIMEOUT}s"
    exit 1
  fi
  echo "Waiting for health check... (${ELAPSED}s)"
  sleep 5
done

# Run endpoint tests
if check_endpoints; then
  echo "✓ All endpoints responding"
else
  echo "✗ Endpoint validation failed"
  exit 1
fi

# Check resource utilization
kubectl top node -n staging --labels "color=green" 2>/dev/null | awk '
  NR>1 { cpu+=$2; mem+=$4 }
  END { 
    print "Resource usage: CPU=" cpu "m, MEM=" mem "Mi"
    if (cpu > 5000 || mem > 16000) exit 1
  }
'

echo "✓ Green environment validated"
```

### Step 3: Switch Traffic (Blue → Green)

```bash
#!/bin/bash
# switch-traffic.sh

NAMESPACE="staging"
BLUE_DEPLOYMENT="staging-blue"
GREEN_DEPLOYMENT="staging-green"

echo "🔄 Switching traffic from Blue to Green..."

# 1. Current traffic distribution
echo "Current routing:"
kubectl describe svc staging-router -n $NAMESPACE | grep -A5 "Selector"

# 2. Update service selector to route to green
kubectl patch service staging-router -n $NAMESPACE -p \
  '{"spec":{"selector":{"color":"green"}}}'

echo "✓ Traffic routed to Green"

# 3. Monitor for errors over 30 seconds
echo "Monitoring error rate..."
for i in {1..6}; do
  ERRORS=$(kubectl logs -l color=green -n $NAMESPACE --since=5s | grep "ERROR" | wc -l)
  echo "  30s window $i: $ERRORS errors"
  sleep 5
done

echo "✓ Traffic switch completed"
```

### Step 4: Decommission Blue

```bash
#!/bin/bash
# cleanup-blue.sh

NAMESPACE="staging"
BLUE_DEPLOYMENT="staging-blue"

echo "🗑️  Cleaning up Blue environment..."

# Keep running for 5 minutes (for rollback safety)
echo "Holding Blue deployment for 5 minutes (rollback window)..."
sleep 300

# Scale down Blue
kubectl scale deployment $BLUE_DEPLOYMENT --replicas=0 -n $NAMESPACE

echo "✓ Blue decommissioned (can restart if needed)"
```

---

## Production Deployment (Canary)

### Strategy

Canary deployment gradually shifts traffic to new version:
- Start: 5% traffic to new version
- Monitor: 30-minute observation period
- Increment: 25% → 50% → 100% or rollback

### Step 1: Create Canary Deployment

```bash
#!/bin/bash
# deploy-canary.sh

set -e

NAMESPACE="production"
IMAGE_TAG="${1:-latest}"
CANARY_PERCENT=5
OBSERVATION_PERIOD=1800  # 30 minutes

echo "🚀 Starting canary deployment (${IMAGE_TAG})..."

# 1. Update deployment spec with new image
cat k8s/genesis-production.yaml | sed "s/IMAGE_TAG/${IMAGE_TAG}/g" | \
  kubectl apply -f - --namespace=$NAMESPACE

# 2. Set canary traffic split
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: genesis-router
  namespace: $NAMESPACE
spec:
  hosts:
  - genesis.example.com
  http:
  - match:
    - headers:
        user-agent:
          regex: ".*NewVersion.*"
    route:
    - destination:
        host: genesis
        port:
          number: 8080
    timeout: 30s
  - route:
    - destination:
        host: genesis-old
        port:
          number: 8080
      weight: 95
    - destination:
        host: genesis-new
        port:
          number: 8080
      weight: 5
    timeout: 30s
EOF

echo "✓ Canary deployment created (5% traffic)"
echo "Observing for ${OBSERVATION_PERIOD}s..."
```

### Step 2: Monitor Canary Metrics

```bash
#!/bin/bash
# monitor-canary.sh

NAMESPACE="production"
WINDOW_SIZE=300  # 5 minutes
THRESHOLD_ERROR_RATE=0.5  # 0.5%
THRESHOLD_LATENCY_P99=2000  # 2000ms

echo "📊 Monitoring canary health..."

create_alert() {
  local metric=$1
  local value=$2
  local threshold=$3
  local status=$4
  
  echo "[$(date +'%H:%M:%S')] ${status}: ${metric}=${value} (threshold=${threshold})"
  
  if [ "$status" == "CRITICAL" ]; then
    # Trigger alert
    curl -X POST https://slack.com/api/chat.postMessage \
      -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
      -d "{\"channel\":\"#deployments\",\"text\":\"🚨 Canary CRITICAL: ${metric}\"}"
  fi
}

monitor_loop() {
  local interval=$1
  local duration=$2
  local elapsed=0
  
  while [ $elapsed -lt $duration ]; do
    # Get metrics from Prometheus
    ERROR_RATE=$(curl -s 'http://prometheus:9090/api/v1/query' \
      --data-urlencode 'query=rate(errors_total{job="genesis-canary"}[5m])' | \
      jq '.data.result[0].value[1]' | tr -d '"')
    
    LATENCY_P99=$(curl -s 'http://prometheus:9090/api/v1/query' \
      --data-urlencode 'query=histogram_quantile(0.99, genesis_request_duration_ms)' | \
      jq '.data.result[0].value[1]' | tr -d '"')
    
    # Check thresholds
    if (( $(echo "$ERROR_RATE > $THRESHOLD_ERROR_RATE" | bc -l) )); then
      create_alert "error_rate" "$ERROR_RATE%" "$THRESHOLD_ERROR_RATE%" "CRITICAL"
      return 1  # Canary failed
    fi
    
    if (( $(echo "$LATENCY_P99 > $THRESHOLD_LATENCY_P99" | bc -l) )); then
      create_alert "latency_p99" "${LATENCY_P99}ms" "${THRESHOLD_LATENCY_P99}ms" "WARNING"
    fi
    
    echo "[$(date +'%H:%M:%S')] ✓ error_rate=${ERROR_RATE}%, latency_p99=${LATENCY_P99}ms"
    
    sleep $interval
    elapsed=$((elapsed + interval))
  done
  
  return 0
}

# Monitor for 30 minutes
monitor_loop 60 1800
HEALTH_CHECK=$?

if [ $HEALTH_CHECK -eq 0 ]; then
  echo "✓ Canary monitoring passed"
  exit 0
else
  echo "✗ Canary monitoring failed - initiating rollback"
  exit 1
fi
```

### Step 3: Progressive Traffic Increase

```bash
#!/bin/bash
# increase-canary-traffic.sh

NAMESPACE="production"
STAGES=(5 25 50 100)  # % traffic progression
STAGE_DURATION=600     # 10 minutes per stage

echo "📈 Progressive traffic increase..."

for PERCENT in "${STAGES[@]}"; do
  echo "Shifting to ${PERCENT}% traffic..."
  
  kubectl patch virtualservice genesis-router -n $NAMESPACE --type merge -p \
    "{\"spec\":{\"http\":[{\"route\":[{\"destination\":{\"host\":\"genesis-old\"},\"weight\":$((100-PERCENT))},{\"destination\":{\"host\":\"genesis-new\"},\"weight\":$PERCENT}]}]}}"
  
  echo "Observing at ${PERCENT}% for ${STAGE_DURATION}s..."
  
  # Run health checks
  ./scripts/canary-health-check.sh --percentage $PERCENT --timeout $STAGE_DURATION
  
  if [ $? -ne 0 ]; then
    echo "✗ Canary failed at ${PERCENT}% - rolling back"
    kubectl patch virtualservice genesis-router -n $NAMESPACE --type merge -p \
      '{"spec":{"http":[{"route":[{"destination":{"host":"genesis-old"},"weight":100}]}]}}'
    exit 1
  fi
  
  echo "✓ ${PERCENT}% monitoring passed"
done

echo "✓ Canary promoted to stable"
```

### Step 4: Rollback Procedure

```bash
#!/bin/bash
# rollback-canary.sh

NAMESPACE="production"

echo "⏮️  Rolling back canary deployment..."

# 1. Immediate traffic redirect to old version
kubectl patch virtualservice genesis-router -n $NAMESPACE --type merge -p \
  '{"spec":{"http":[{"route":[{"destination":{"host":"genesis-old"},"weight":100}]}]}}'

echo "✓ Traffic routed back to stable version"

# 2. Log the incident
cat >> deployment-incidents.log <<EOF
Deployment: $(date)
Reason: Automated rollback triggered
Metrics: error_rate > threshold OR latency_p99 > threshold
Action: Traffic restored to previous version
EOF

# 3. Notify team
curl -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -d "{\"channel\":\"#ops\",\"text\":\"⚠️ Canary rollback initiated\"}"

# 4. Scale down canary
kubectl scale deployment genesis-canary --replicas=0 -n $NAMESPACE

echo "✗ Canary rolled back - investigation required"
exit 1
```

---

## Disaster Recovery

### Restore from Backup

```bash
#!/bin/bash
# restore-from-backup.sh

TIMESTAMP="${1}"  # e.g., "2026-02-12-14-30-00"
NAMESPACE="production"

echo "🔄 Restoring from backup (${TIMESTAMP})..."

# 1. Locate backup
BACKUP_PATH="gs://hdr-backups/phase10/${TIMESTAMP}"
gsutil ls $BACKUP_PATH

# 2. Restore configurations
kubectl apply -f $BACKUP_PATH/configmaps.yaml -n $NAMESPACE
kubectl apply -f $BACKUP_PATH/secrets.yaml -n $NAMESPACE

# 3. Restore database state
./scripts/restore-database.sh --backup-path $BACKUP_PATH --timestamp $TIMESTAMP

# 4. Restart services
kubectl rollout restart deployment/genesis-hdr -n $NAMESPACE
kubectl rollout restart deployment/oracle-hdr -n $NAMESPACE
kubectl rollout restart deployment/d-hdr -n $NAMESPACE

# 5. Verify restoration
echo "Verifying restored services..."
kubectl rollout status deployment/genesis-hdr -n $NAMESPACE --timeout=5m

echo "✓ Restoration complete"
```

### Database Point-in-Time Recovery

```bash
#!/bin/bash
# pitr-recovery.sh

TARGET_TIME="${1}"  # ISO 8601 format
DATABASE="hdr_production"

echo "🗄️  Database PITR to ${TARGET_TIME}..."

# 1. Create recovery database
mongorestore \
  --uri="mongodb+srv://admin:${MONGO_PASSWORD}@cluster.mongodb.net" \
  --archive="gs://hdr-backups/databases/latest.archive" \
  --nsFrom="${DATABASE}.*" \
  --nsTo="${DATABASE}_recovery.*" 2>&1

# 2. Verify target timestamp
mongo --uri="mongodb+srv://admin:${MONGO_PASSWORD}@cluster.mongodb.net/${DATABASE}_recovery" \
  --eval "db.predictions.findOne({}, {timestamp: 1})" | grep $TARGET_TIME

# 3. Switch traffic to recovery database
kubectl patch configmap hdr-config -n production \
  -p '{"data":{"MONGODB_DATABASE":"hdr_production_recovery"}}'

# 4. Restart services to pick up new config
kubectl rollout restart deployment/oracle-hdr -n production

echo "✓ Database recovered to ${TARGET_TIME}"
```

---

## Post-Deployment Validation

### Automated Validation Suite

```bash
#!/bin/bash
# post-deploy-validation.sh

ENVIRONMENT="${1:-staging}"
TIMEOUT=600

echo "✅ Post-deployment validation (${ENVIRONMENT})..."

validate_genesis() {
  echo "Testing GENESIS-HDR..."
  
  # Test breeding
  RESULT=$(curl -s -X POST http://${ENVIRONMENT}-endpoint/api/genesis/breed \
    -H "Content-Type: application/json" \
    -d '{"populationSize": 10, "generations": 5}')
  
  BREEDING_SUCCESS=$(echo $RESULT | jq '.agents | length')
  [ "$BREEDING_SUCCESS" -ge 10 ] && echo "  ✓ Breeding works" || echo "  ✗ Breeding failed" && exit 1
}

validate_oracle() {
  echo "Testing ORACLE-HDR..."
  
  # Test prediction
  RESULT=$(curl -s -X POST http://${ENVIRONMENT}-endpoint/api/oracle/predict \
    -H "Content-Type: application/json" \
    -d '{"agent": {"id": "test"}, "context": {}}')
  
  PREDICTION_VALID=$(echo $RESULT | jq '.confidence > 0')
  [ "$PREDICTION_VALID" == "true" ] && echo "  ✓ Prediction works" || echo "  ✗ Prediction failed" && exit 1
}

validate_diffusion() {
  echo "Testing D-HDR..."
  
  # Test consequence generation
  RESULT=$(curl -s -X POST http://${ENVIRONMENT}-endpoint/api/diffusion/generate \
    -H "Content-Type: application/json" \
    -d '{"agent": {"id": "test"}, "steps": 10}')
  
  CONSEQUENCE_VALID=$(echo $RESULT | jq '.consequences | length')
  [ "$CONSEQUENCE_VALID" -gt 0 ] && echo "  ✓ Generation works" || echo "  ✗ Generation failed" && exit 1
}

validate_integration() {
  echo "Testing integration..."
  
  # Test end-to-end workflow
  npm run test:integration -- --env $ENVIRONMENT --timeout $TIMEOUT
}

# Run all validations
validate_genesis
validate_oracle
validate_diffusion
validate_integration

echo "✅ All validations passed"
```

---

## Runbook Checklists

### Pre-Production Deployment Checklist

| Item | Owner | Status |
|------|-------|--------|
| Code review approval | Tech Lead | [ ] |
| All tests passing | CI/CD | [ ] |
| Security scan passed | Security | [ ] |
| Load testing results reviewed | DevOps | [ ] |
| Staging deployment validated | QA | [ ] |
| Incident commander assigned | Ops | [ ] |
| Communication plan ready | PM | [ ] |
| Rollback plan tested | DevOps | [ ] |
| ~10 min

| Start Time | Approx Duration | Step |
|-----------|------------------|------|
| 14:00 | 2m | Create canary deployment (5% traffic) |
| 14:02 | 30m | Monitor canary metrics |
| 14:32 | 5m | Increase to 25% |
| 14:37 | 10m | Monitor at 25% |
| 14:47 | 5m | Increase to 50% |
| 14:52 | 10m | Monitor at 50% |
| 15:02 | 5m | Increase to 100% |
| 15:07 | 5m | Final validation |
| **15:12** | **~1h 12m** | **Deployment complete** |

---

### Rollback Decision Matrix

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 0.5% | Automatic rollback |
| Latency p99 | > 2000ms | Manual review, likely rollback |
| CPU Usage | > 80% | Wait 5m, then assess |
| Memory Usage | > 85% | Manual review |
| Service availability | < 99.9% | Automatic rollback |
| Customer reports | > 5 in 10m | Manual rollback |

---

## Support & Escalation

### Incident Response

**Severity 1 (Immediate Rollback)**
- Error rate > 2%
- Service completely down
- Data corruption detected
- **Action**: Trigger automatic rollback immediately

**Severity 2 (Manual Review)**
- Error rate 0.5-2%
- Elevated latency (p99 > 2s)
- Partial feature unavailability
- **Action**: Page on-call engineer for assessment

**Severity 3 (Monitor)**
- Error rate < 0.5%
- Latency slightly elevated
- No impact to production
- **Action**: Continue monitoring, proceed cautiously

### Escalation Chain

1. **Incident Detected** → Automated alert to #deployments Slack channel
2. **10 minutes, not resolved** → Page on-call DevOps engineer
3. **20 minutes, not resolved** → Page DevOps lead + incident commander
4. **30 minutes, not resolved** → Escalate to VP Engineering

---

**Version:** 10.6  
**Last Updated:** February 12, 2026  
**Maintained By:** DevOps Team

