# HDR Empire Framework - Deployment Procedures

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

## Overview

This document provides detailed step-by-step deployment procedures for the HDR Empire Framework across all environments (development, staging, production). It covers deployment strategies, automation, rollback procedures, and post-deployment verification.

## Table of Contents

1. [Deployment Architecture](#deployment-architecture)
2. [Environment Setup](#environment-setup)
3. [Pre-Deployment Procedures](#pre-deployment-procedures)
4. [Deployment Strategies](#deployment-strategies)
5. [Database Migrations](#database-migrations)
6. [Service Deployment](#service-deployment)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedures](#rollback-procedures)
9. [Deployment Automation](#deployment-automation)
10. [Troubleshooting Deployments](#troubleshooting-deployments)

---

## Deployment Architecture

### CI/CD Pipeline

```
Code Commit (GitHub)
      ↓
Build (GitHub Actions)
      ↓
Unit Tests
      ↓
Integration Tests
      ↓
Build Docker Images
      ↓
Push to Registry
      ↓
Deploy to Dev
      ↓
Automated Tests
      ↓
Deploy to Staging
      ↓
Manual Approval
      ↓
Deploy to Production
      ↓
Smoke Tests
      ↓
Monitoring
```

### Deployment Environments

| Environment     | Purpose                | Access         | Data                       |
| --------------- | ---------------------- | -------------- | -------------------------- |
| **Development** | Feature development    | All developers | Synthetic                  |
| **Staging**     | Pre-production testing | QA team        | Anonymized production copy |
| **Production**  | Live system            | Ops team only  | Real customer data         |

---

## Environment Setup

### Development Environment

```bash
# 1. Clone repository
git clone https://github.com/your-org/hdr-empire.git
cd hdr-empire

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.development

# Edit .env.development with development settings
nano .env.development

# 4. Start local services (Docker Compose)
docker-compose up -d postgres redis

# 5. Run database migrations
npm run db:migrate

# 6. Seed development data
npm run db:seed

# 7. Start development server
npm run dev
```

### Staging Environment

```bash
# 1. Create namespace
kubectl create namespace hdr-empire-staging

# 2. Create secrets
kubectl create secret generic hdr-secrets \
  --from-literal=DB_PASSWORD=$DB_PASSWORD \
  --from-literal=REDIS_PASSWORD=$REDIS_PASSWORD \
  --from-literal=JWT_SECRET=$JWT_SECRET \
  -n hdr-empire-staging

# 3. Deploy infrastructure
kubectl apply -f k8s/staging/infrastructure/ -n hdr-empire-staging

# 4. Wait for infrastructure
kubectl wait --for=condition=ready pod -l tier=infrastructure -n hdr-empire-staging --timeout=300s

# 5. Deploy services
kubectl apply -f k8s/staging/services/ -n hdr-empire-staging

# 6. Verify deployment
kubectl get pods -n hdr-empire-staging
```

### Production Environment

```bash
# 1. Verify prerequisites
./scripts/pre-deployment-check.sh production

# 2. Create namespace (if first deployment)
kubectl create namespace hdr-empire

# 3. Deploy secrets (from secure vault)
./scripts/deploy-secrets.sh production

# 4. Deploy infrastructure
kubectl apply -f k8s/production/infrastructure/

# 5. Wait for infrastructure readiness
kubectl wait --for=condition=ready pod -l tier=infrastructure -n hdr-empire --timeout=600s

# 6. Run database migrations
kubectl exec -it $(kubectl get pod -l app=migration-job -n hdr-empire -o jsonpath='{.items[0].metadata.name}') \
  -n hdr-empire -- npm run db:migrate

# 7. Deploy services (rolling update)
./scripts/deploy-services.sh production

# 8. Verify deployment
./scripts/verify-deployment.sh production
```

---

## Pre-Deployment Procedures

### Pre-Deployment Checklist

```bash
#!/bin/bash
# pre-deployment-check.sh

set -e

ENVIRONMENT=$1
ERRORS=0

echo "Running pre-deployment checks for $ENVIRONMENT..."

# 1. Check Git status
echo "Checking Git status..."
if [[ $(git status --porcelain) ]]; then
  echo "ERROR: Uncommitted changes detected"
  ERRORS=$((ERRORS + 1))
fi

# 2. Verify tests pass
echo "Running tests..."
if ! npm test; then
  echo "ERROR: Tests failed"
  ERRORS=$((ERRORS + 1))
fi

# 3. Check for security vulnerabilities
echo "Checking for vulnerabilities..."
if npm audit --audit-level=high | grep -q "found"; then
  echo "ERROR: High severity vulnerabilities found"
  ERRORS=$((ERRORS + 1))
fi

# 4. Verify Docker images exist
echo "Checking Docker images..."
IMAGES=("neural-hdr" "nano-swarm-hdr" "omniscient-hdr" "reality-hdr" "quantum-hdr" "dream-hdr" "void-blade-hdr")
for image in "${IMAGES[@]}"; do
  if ! docker pull "hdr-empire/$image:$VERSION"; then
    echo "ERROR: Image hdr-empire/$image:$VERSION not found"
    ERRORS=$((ERRORS + 1))
  fi
done

# 5. Check Kubernetes cluster access
echo "Checking Kubernetes access..."
if ! kubectl cluster-info; then
  echo "ERROR: Cannot access Kubernetes cluster"
  ERRORS=$((ERRORS + 1))
fi

# 6. Verify database connectivity
echo "Checking database connectivity..."
if ! kubectl exec -n $ENVIRONMENT $(kubectl get pod -l app=postgres -n $ENVIRONMENT -o jsonpath='{.items[0].metadata.name}') \
  -- psql -U postgres -c "SELECT 1" > /dev/null; then
  echo "ERROR: Cannot connect to database"
  ERRORS=$((ERRORS + 1))
fi

# 7. Check available resources
echo "Checking cluster resources..."
NODE_CPU=$(kubectl top nodes | awk '{print $3}' | grep -oP '\d+' | head -1)
if [ "$NODE_CPU" -gt 80 ]; then
  echo "WARNING: CPU usage above 80%"
fi

# 8. Verify backup completed
echo "Checking latest backup..."
LATEST_BACKUP=$(./scripts/check-backups.sh --latest)
if [ -z "$LATEST_BACKUP" ]; then
  echo "ERROR: No recent backup found"
  ERRORS=$((ERRORS + 1))
fi

# 9. Check certificate expiration
echo "Checking SSL certificates..."
CERT_EXPIRY=$(echo | openssl s_client -servername hdr-empire.com -connect hdr-empire.com:443 2>/dev/null | \
  openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_TIMESTAMP=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_TIMESTAMP=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))

if [ "$DAYS_UNTIL_EXPIRY" -lt 7 ]; then
  echo "WARNING: SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
fi

# Summary
echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ All pre-deployment checks passed"
  exit 0
else
  echo "❌ Pre-deployment checks failed with $ERRORS errors"
  exit 1
fi
```

### Backup Before Deployment

```bash
#!/bin/bash
# backup-before-deployment.sh

ENVIRONMENT=$1
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/backups/pre-deployment"

echo "Creating pre-deployment backup..."

# 1. Backup database
echo "Backing up database..."
kubectl exec -n $ENVIRONMENT $(kubectl get pod -l app=postgres -n $ENVIRONMENT -o jsonpath='{.items[0].metadata.name}') \
  -- pg_dump -U postgres hdr_empire | gzip > "$BACKUP_DIR/database-$TIMESTAMP.sql.gz"

# 2. Backup Redis
echo "Backing up Redis..."
kubectl exec -n $ENVIRONMENT $(kubectl get pod -l app=redis -n $ENVIRONMENT -o jsonpath='{.items[0].metadata.name}') \
  -- redis-cli SAVE
kubectl cp $ENVIRONMENT/$(kubectl get pod -l app=redis -n $ENVIRONMENT -o jsonpath='{.items[0].metadata.name}'):/data/dump.rdb \
  "$BACKUP_DIR/redis-$TIMESTAMP.rdb"

# 3. Backup configuration
echo "Backing up configuration..."
kubectl get configmap -n $ENVIRONMENT -o yaml > "$BACKUP_DIR/configmaps-$TIMESTAMP.yaml"
kubectl get secret -n $ENVIRONMENT -o yaml > "$BACKUP_DIR/secrets-$TIMESTAMP.yaml"

# 4. Create manifest snapshot
echo "Creating manifest snapshot..."
kubectl get all -n $ENVIRONMENT -o yaml > "$BACKUP_DIR/manifests-$TIMESTAMP.yaml"

echo "✅ Backup complete: $BACKUP_DIR"
```

---

## Deployment Strategies

### Rolling Update (Default)

Zero-downtime deployment by gradually replacing pods.

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neural-hdr
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1 # 1 extra pod during update
      maxUnavailable: 1 # 1 pod can be unavailable
  template:
    spec:
      containers:
        - name: neural-hdr
          image: hdr-empire/neural-hdr:v1.2.3
```

**Deployment Command:**

```bash
# Deploy new version
kubectl set image deployment/neural-hdr neural-hdr=hdr-empire/neural-hdr:v1.2.3 -n hdr-empire

# Monitor rollout
kubectl rollout status deployment/neural-hdr -n hdr-empire

# Verify
kubectl get pods -n hdr-empire -l app=neural-hdr
```

### Blue-Green Deployment

Deploy new version alongside old, then switch traffic.

```bash
#!/bin/bash
# blue-green-deployment.sh

VERSION=$1
ENVIRONMENT=$2

# 1. Deploy green environment
echo "Deploying green environment..."
kubectl apply -f k8s/$ENVIRONMENT/green/ -n hdr-empire

# 2. Wait for green to be ready
kubectl wait --for=condition=ready pod -l version=green -n hdr-empire --timeout=300s

# 3. Run smoke tests on green
echo "Running smoke tests on green..."
./scripts/smoke-test.sh green

# 4. Switch traffic to green
echo "Switching traffic to green..."
kubectl patch service hdr-empire -n hdr-empire -p '{"spec":{"selector":{"version":"green"}}}'

# 5. Monitor for 10 minutes
echo "Monitoring green environment..."
sleep 600

# 6. Check for errors
ERROR_RATE=$(curl -s http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m]) | jq -r '.data.result[0].value[1]')

if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
  echo "ERROR: High error rate detected, rolling back..."
  kubectl patch service hdr-empire -n hdr-empire -p '{"spec":{"selector":{"version":"blue"}}}'
  exit 1
fi

# 7. Decommission blue
echo "Decommissioning blue environment..."
kubectl delete -f k8s/$ENVIRONMENT/blue/ -n hdr-empire

echo "✅ Blue-green deployment complete"
```

### Canary Deployment

Gradually shift traffic to new version.

```yaml
# canary-deployment.yaml
apiVersion: v1
kind: Service
metadata:
  name: hdr-empire
spec:
  selector:
    app: neural-hdr
  ports:
    - port: 80
---
# Stable deployment (90% traffic)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neural-hdr-stable
spec:
  replicas: 9
  template:
    metadata:
      labels:
        app: neural-hdr
        version: stable
    spec:
      containers:
        - name: neural-hdr
          image: hdr-empire/neural-hdr:v1.2.2
---
# Canary deployment (10% traffic)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neural-hdr-canary
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: neural-hdr
        version: canary
    spec:
      containers:
        - name: neural-hdr
          image: hdr-empire/neural-hdr:v1.2.3
```

**Canary Progression:**

```bash
# Stage 1: 10% canary traffic
kubectl scale deployment/neural-hdr-canary -n hdr-empire --replicas=1
kubectl scale deployment/neural-hdr-stable -n hdr-empire --replicas=9

# Monitor for 30 minutes
sleep 1800

# Stage 2: 50% canary traffic
kubectl scale deployment/neural-hdr-canary -n hdr-empire --replicas=5
kubectl scale deployment/neural-hdr-stable -n hdr-empire --replicas=5

# Monitor for 30 minutes
sleep 1800

# Stage 3: 100% canary traffic
kubectl scale deployment/neural-hdr-canary -n hdr-empire --replicas=10
kubectl scale deployment/neural-hdr-stable -n hdr-empire --replicas=0

# Update canary to stable
kubectl set image deployment/neural-hdr-stable neural-hdr=hdr-empire/neural-hdr:v1.2.3 -n hdr-empire
kubectl scale deployment/neural-hdr-stable -n hdr-empire --replicas=10
kubectl delete deployment/neural-hdr-canary -n hdr-empire
```

---

## Database Migrations

### Migration Strategy

```bash
# migrations/20251002_add_timeline_support.sql
-- Migration: Add timeline support
-- Author: Stephen Bilodeau
-- Date: 2025-10-02

BEGIN;

-- Add timeline tables
CREATE TABLE IF NOT EXISTS timelines (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  divergence DECIMAL(5,4) DEFAULT 0,
  state VARCHAR(50) NOT NULL DEFAULT 'active'
);

-- Add indexes
CREATE INDEX idx_timelines_created_at ON timelines(created_at DESC);
CREATE INDEX idx_timelines_state ON timelines(state);

-- Add audit log
INSERT INTO migration_log (migration_name, applied_at)
VALUES ('20251002_add_timeline_support', NOW());

COMMIT;
```

### Running Migrations

```bash
#!/bin/bash
# run-migrations.sh

ENVIRONMENT=$1
DRY_RUN=${2:-false}

echo "Running database migrations for $ENVIRONMENT..."

# 1. Get database pod
DB_POD=$(kubectl get pod -l app=postgres -n $ENVIRONMENT -o jsonpath='{.items[0].metadata.name}')

# 2. Check current migration version
CURRENT_VERSION=$(kubectl exec -n $ENVIRONMENT $DB_POD -- \
  psql -U postgres -d hdr_empire -t -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1")

echo "Current version: $CURRENT_VERSION"

# 3. List pending migrations
PENDING=$(ls migrations/*.sql | while read migration; do
  VERSION=$(basename $migration .sql)
  if [[ "$VERSION" > "$CURRENT_VERSION" ]]; then
    echo $migration
  fi
done)

if [ -z "$PENDING" ]; then
  echo "No pending migrations"
  exit 0
fi

echo "Pending migrations:"
echo "$PENDING"

# 4. Run migrations
if [ "$DRY_RUN" = "true" ]; then
  echo "DRY RUN: Would apply these migrations"
  exit 0
fi

echo "$PENDING" | while read migration; do
  echo "Applying $migration..."

  kubectl exec -n $ENVIRONMENT $DB_POD -- \
    psql -U postgres -d hdr_empire -f /tmp/migrations/$(basename $migration)

  if [ $? -eq 0 ]; then
    echo "✅ $migration applied successfully"
  else
    echo "❌ $migration failed"
    exit 1
  fi
done

echo "✅ All migrations applied successfully"
```

### Rollback Migrations

```bash
#!/bin/bash
# rollback-migration.sh

ENVIRONMENT=$1
TARGET_VERSION=$2

echo "Rolling back to version $TARGET_VERSION..."

DB_POD=$(kubectl get pod -l app=postgres -n $ENVIRONMENT -o jsonpath='{.items[0].metadata.name}')

# Find rollback script
ROLLBACK_SCRIPT="migrations/rollback_${TARGET_VERSION}.sql"

if [ ! -f "$ROLLBACK_SCRIPT" ]; then
  echo "ERROR: Rollback script not found: $ROLLBACK_SCRIPT"
  exit 1
fi

# Apply rollback
kubectl exec -n $ENVIRONMENT $DB_POD -- \
  psql -U postgres -d hdr_empire -f /tmp/migrations/$(basename $ROLLBACK_SCRIPT)

if [ $? -eq 0 ]; then
  echo "✅ Rollback to $TARGET_VERSION successful"
else
  echo "❌ Rollback failed"
  exit 1
fi
```

---

## Service Deployment

### Deploy All Services

```bash
#!/bin/bash
# deploy-services.sh

ENVIRONMENT=$1
VERSION=$2

SERVICES=(
  "void-blade-hdr"      # Deploy security first
  "neural-hdr"
  "nano-swarm-hdr"
  "omniscient-hdr"
  "reality-hdr"
  "quantum-hdr"
  "dream-hdr"
  "integration-layer"
  "command-interface"
  "dashboard"
  "quantum-explorer"
  "consciousness-workbench"
)

echo "Deploying HDR Empire services to $ENVIRONMENT..."

for service in "${SERVICES[@]}"; do
  echo "Deploying $service..."

  # Update image
  kubectl set image deployment/$service \
    $service=hdr-empire/$service:$VERSION \
    -n hdr-empire-$ENVIRONMENT

  # Wait for rollout
  kubectl rollout status deployment/$service -n hdr-empire-$ENVIRONMENT --timeout=300s

  if [ $? -ne 0 ]; then
    echo "❌ Deployment of $service failed"

    # Rollback this service
    kubectl rollout undo deployment/$service -n hdr-empire-$ENVIRONMENT

    exit 1
  fi

  echo "✅ $service deployed successfully"

  # Wait between services
  sleep 10
done

echo "✅ All services deployed successfully"
```

### Deploy Single Service

```bash
# Deploy specific service
kubectl set image deployment/neural-hdr \
  neural-hdr=hdr-empire/neural-hdr:v1.2.3 \
  -n hdr-empire

# Monitor deployment
kubectl rollout status deployment/neural-hdr -n hdr-empire

# Check pod status
kubectl get pods -n hdr-empire -l app=neural-hdr

# View logs
kubectl logs -n hdr-empire -l app=neural-hdr --tail=50
```

---

## Post-Deployment Verification

### Smoke Tests

```bash
#!/bin/bash
# smoke-test.sh

ENVIRONMENT=$1
BASE_URL="https://hdr-empire-${ENVIRONMENT}.com"

echo "Running smoke tests for $ENVIRONMENT..."

# 1. Health check
echo "Testing health endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Health check failed: $HTTP_CODE"
  exit 1
fi
echo "✅ Health check passed"

# 2. Authentication
echo "Testing authentication..."
TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' | jq -r '.token')

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi
echo "✅ Authentication passed"

# 3. Neural-HDR capture
echo "Testing N-HDR capture..."
CAPTURE_RESULT=$(curl -s -X POST $BASE_URL/api/consciousness/capture \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"depth":6,"mode":"quick"}' | jq -r '.id')

if [ -z "$CAPTURE_RESULT" ]; then
  echo "❌ N-HDR capture failed"
  exit 1
fi
echo "✅ N-HDR capture passed"

# 4. Omniscient-HDR search
echo "Testing O-HDR search..."
SEARCH_RESULT=$(curl -s -X GET "$BASE_URL/api/knowledge/search?q=test" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.results | length')

if [ "$SEARCH_RESULT" -lt 0 ]; then
  echo "❌ O-HDR search failed"
  exit 1
fi
echo "✅ O-HDR search passed"

# 5. Nano-Swarm deployment
echo "Testing NS-HDR deployment..."
SWARM_RESULT=$(curl -s -X POST $BASE_URL/api/swarm/deploy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"initialBots":10}' | jq -r '.id')

if [ -z "$SWARM_RESULT" ]; then
  echo "❌ NS-HDR deployment failed"
  exit 1
fi
echo "✅ NS-HDR deployment passed"

echo "✅ All smoke tests passed"
```

### Integration Tests

```bash
# Run integration tests against deployed environment
npm run test:integration -- --env=$ENVIRONMENT

# Verify all systems
./scripts/verify-all-systems.sh $ENVIRONMENT
```

---

## Rollback Procedures

### Quick Rollback

```bash
#!/bin/bash
# quick-rollback.sh

ENVIRONMENT=$1

echo "Executing quick rollback..."

# Rollback all services
SERVICES=$(kubectl get deployments -n hdr-empire-$ENVIRONMENT -o jsonpath='{.items[*].metadata.name}')

for service in $SERVICES; do
  echo "Rolling back $service..."
  kubectl rollout undo deployment/$service -n hdr-empire-$ENVIRONMENT
done

# Verify rollback
./scripts/verify-deployment.sh $ENVIRONMENT

echo "✅ Rollback complete"
```

### Rollback to Specific Version

```bash
# View deployment history
kubectl rollout history deployment/neural-hdr -n hdr-empire

# Rollback to specific revision
kubectl rollout undo deployment/neural-hdr -n hdr-empire --to-revision=3

# Verify
kubectl rollout status deployment/neural-hdr -n hdr-empire
```

---

## Deployment Automation

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy HDR Empire

on:
  push:
    branches:
      - main
      - staging
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build Docker images
        run: |
          docker build -t hdr-empire/neural-hdr:${{ github.sha }} .
          # ... build other images

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push hdr-empire/neural-hdr:${{ github.sha }}

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          kubectl set image deployment/neural-hdr neural-hdr=hdr-empire/neural-hdr:${{ github.sha }} -n hdr-empire-staging

      - name: Run smoke tests
        run: ./scripts/smoke-test.sh staging

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          ./scripts/deploy-services.sh production ${{ github.sha }}

      - name: Verify deployment
        run: ./scripts/verify-deployment.sh production
```

---

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

For more information, see:

- [OPERATIONS-MANUAL.md](./OPERATIONS-MANUAL.md) - Daily operations procedures
- [MONITORING-GUIDE.md](./MONITORING-GUIDE.md) - Monitoring and alerting
- [TROUBLESHOOTING-GUIDE.md](./TROUBLESHOOTING-GUIDE.md) - Common issues
