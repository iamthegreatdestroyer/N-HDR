# HDR Empire Framework - Backup and Recovery Guide

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

## Overview

This comprehensive backup and disaster recovery guide covers strategies for protecting data in the HDR Empire Framework, including automated backup procedures, point-in-time recovery, disaster recovery scenarios, and business continuity planning.

## Table of Contents

1. [Backup Strategy](#backup-strategy)
2. [Database Backups](#database-backups)
3. [Cache Persistence](#cache-persistence)
4. [Kubernetes Resources](#kubernetes-resources)
5. [Application Data](#application-data)
6. [Disaster Recovery](#disaster-recovery)
7. [Recovery Procedures](#recovery-procedures)
8. [Testing and Validation](#testing-and-validation)
9. [Backup Monitoring](#backup-monitoring)
10. [Compliance and Retention](#compliance-and-retention)

---

## Backup Strategy

### 3-2-1 Backup Rule

- **3** copies of data (production + 2 backups)
- **2** different media types (local disk + cloud storage)
- **1** off-site backup (different geographic location)

### Backup Schedule

| Type                 | Frequency         | Retention      | RTO        | RPO                    |
| -------------------- | ----------------- | -------------- | ---------- | ---------------------- |
| **Full Database**    | Daily 2:00 AM UTC | 30 days        | 4 hours    | 24 hours               |
| **Incremental DB**   | Every 6 hours     | 7 days         | 1 hour     | 6 hours                |
| **WAL Archives**     | Continuous        | 7 days         | 15 minutes | 5 minutes              |
| **Redis Snapshots**  | Every 2 hours     | 7 days         | 30 minutes | 2 hours                |
| **Kubernetes**       | Daily 3:00 AM UTC | 30 days        | 2 hours    | 24 hours               |
| **Configuration**    | On change         | Infinite (Git) | 30 minutes | 0 (version controlled) |
| **Application Data** | Daily 4:00 AM UTC | 90 days        | 4 hours    | 24 hours               |

### RTO and RPO Targets

**Recovery Time Objective (RTO):**

- **Critical Services**: 15 minutes
- **Important Services**: 1 hour
- **Full System**: 4 hours

**Recovery Point Objective (RPO):**

- **Critical Data**: 5 minutes (WAL archiving)
- **Important Data**: 1 hour
- **Bulk Data**: 24 hours

---

## Database Backups

### Full Database Backup

```bash
#!/bin/bash
# full-database-backup.sh - Perform full PostgreSQL backup

set -euo pipefail

# Configuration
BACKUP_DIR="/backups/postgres"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="hdr_empire_full_${TIMESTAMP}.sql.gz"
S3_BUCKET="s3://hdr-empire-backups/postgres"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting full database backup: $BACKUP_FILE"
kubectl exec -it postgres-0 -n hdr-empire -- \
  pg_dump -U postgres -d hdr_empire -F c -b -v -f - | \
  gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Verify backup
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
  SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
  echo "✓ Backup completed successfully: ${BACKUP_FILE} (${SIZE})"
else
  echo "✗ Backup failed!"
  exit 1
fi

# Upload to S3
echo "Uploading backup to S3..."
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "${S3_BUCKET}/" \
  --storage-class STANDARD_IA \
  --server-side-encryption AES256

# Verify S3 upload
if aws s3 ls "${S3_BUCKET}/${BACKUP_FILE}" > /dev/null 2>&1; then
  echo "✓ Backup uploaded to S3 successfully"
else
  echo "✗ S3 upload failed!"
  exit 1
fi

# Remove local backups older than retention period
find $BACKUP_DIR -name "hdr_empire_full_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log backup to database
kubectl exec -it postgres-0 -n hdr-empire -- psql -U postgres -d hdr_empire -c \
  "INSERT INTO backup_log (backup_type, backup_file, backup_size, status, timestamp)
   VALUES ('full', '${BACKUP_FILE}', $(stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}"), 'success', NOW());"

echo "Full database backup completed: ${BACKUP_FILE}"
```

### Incremental Backup with WAL Archiving

```yaml
# postgres-wal-archiving.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: hdr-empire
data:
  postgresql.conf: |
    # WAL archiving configuration
    wal_level = replica
    archive_mode = on
    archive_command = 'aws s3 cp %p s3://hdr-empire-backups/wal/%f'
    archive_timeout = 300

    # Replication settings
    max_wal_senders = 10
    wal_keep_size = 1GB

    # Performance
    shared_buffers = 4GB
    effective_cache_size = 12GB
    maintenance_work_mem = 1GB
    checkpoint_completion_target = 0.9
    wal_buffers = 16MB
    default_statistics_target = 100
    random_page_cost = 1.1
    effective_io_concurrency = 200
```

```bash
#!/bin/bash
# incremental-backup.sh - Perform incremental backup using pg_basebackup

set -euo pipefail

BACKUP_DIR="/backups/postgres/incremental"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="hdr_empire_incremental_${TIMESTAMP}"
S3_BUCKET="s3://hdr-empire-backups/postgres/incremental"

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform base backup
echo "Starting incremental backup: $BACKUP_NAME"
kubectl exec -it postgres-0 -n hdr-empire -- \
  pg_basebackup -U replicator -D - -F tar -X stream -z -P | \
  tar -C "${BACKUP_DIR}" -xzf -

# Rename backup directory
mv "${BACKUP_DIR}/data" "${BACKUP_DIR}/${BACKUP_NAME}"

# Create tar archive
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"

# Upload to S3
aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" "${S3_BUCKET}/" \
  --storage-class STANDARD_IA

# Cleanup
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"
rm -f "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

echo "Incremental backup completed: ${BACKUP_NAME}"
```

### Point-in-Time Recovery (PITR)

```bash
#!/bin/bash
# restore-pitr.sh - Restore database to specific point in time

set -euo pipefail

TARGET_TIME="$1"  # Format: 2025-01-15 14:30:00
RESTORE_DIR="/restore/postgres"

if [ -z "$TARGET_TIME" ]; then
  echo "Usage: $0 'YYYY-MM-DD HH:MM:SS'"
  exit 1
fi

# Download latest full backup
echo "Downloading latest full backup..."
LATEST_BACKUP=$(aws s3 ls s3://hdr-empire-backups/postgres/ | \
  grep "hdr_empire_full_" | sort | tail -1 | awk '{print $4}')

aws s3 cp "s3://hdr-empire-backups/postgres/${LATEST_BACKUP}" \
  "${RESTORE_DIR}/${LATEST_BACKUP}"

# Extract backup
echo "Extracting backup..."
gunzip -c "${RESTORE_DIR}/${LATEST_BACKUP}" | \
  kubectl exec -i postgres-restore-0 -n hdr-empire -- \
  pg_restore -U postgres -d hdr_empire -c -v

# Create recovery configuration
kubectl exec -i postgres-restore-0 -n hdr-empire -- bash <<EOF
cat > /var/lib/postgresql/data/recovery.conf <<RECOVERY
restore_command = 'aws s3 cp s3://hdr-empire-backups/wal/%f %p'
recovery_target_time = '${TARGET_TIME}'
recovery_target_action = 'promote'
RECOVERY
EOF

# Start PostgreSQL in recovery mode
kubectl exec postgres-restore-0 -n hdr-empire -- \
  pg_ctl restart -D /var/lib/postgresql/data

# Wait for recovery to complete
echo "Waiting for recovery to complete..."
until kubectl exec postgres-restore-0 -n hdr-empire -- \
  psql -U postgres -c "SELECT pg_is_in_recovery();" | grep -q "f"; do
  sleep 5
done

echo "Point-in-time recovery completed to: ${TARGET_TIME}"
```

---

## Cache Persistence

### Redis RDB Snapshots

```bash
#!/bin/bash
# redis-backup.sh - Backup Redis data

set -euo pipefail

BACKUP_DIR="/backups/redis"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="redis_${TIMESTAMP}.rdb"
S3_BUCKET="s3://hdr-empire-backups/redis"

mkdir -p $BACKUP_DIR

# Trigger SAVE
echo "Triggering Redis SAVE..."
kubectl exec -it redis-0 -n hdr-empire -- redis-cli SAVE

# Copy RDB file
echo "Copying RDB file..."
kubectl cp hdr-empire/redis-0:/data/dump.rdb "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Upload to S3
echo "Uploading to S3..."
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" "${S3_BUCKET}/" \
  --storage-class STANDARD_IA

# Cleanup old backups
find $BACKUP_DIR -name "redis_*.rdb.gz" -mtime +7 -delete

echo "Redis backup completed: ${BACKUP_FILE}.gz"
```

### Redis AOF Backup

```yaml
# redis-aof-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-config
  namespace: hdr-empire
data:
  redis.conf: |
    # AOF persistence
    appendonly yes
    appendfilename "appendonly.aof"
    appendfsync everysec

    # AOF rewrite
    auto-aof-rewrite-percentage 100
    auto-aof-rewrite-min-size 64mb

    # RDB snapshots (hybrid persistence)
    save 900 1
    save 300 10
    save 60 10000

    # Memory
    maxmemory 4gb
    maxmemory-policy allkeys-lru
```

```bash
#!/bin/bash
# redis-aof-backup.sh - Backup Redis AOF file

set -euo pipefail

BACKUP_DIR="/backups/redis/aof"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="appendonly_${TIMESTAMP}.aof"
S3_BUCKET="s3://hdr-empire-backups/redis/aof"

mkdir -p $BACKUP_DIR

# Trigger BGREWRITEAOF
echo "Triggering AOF rewrite..."
kubectl exec -it redis-0 -n hdr-empire -- redis-cli BGREWRITEAOF

# Wait for rewrite to complete
until kubectl exec redis-0 -n hdr-empire -- redis-cli INFO persistence | \
  grep -q "aof_rewrite_in_progress:0"; do
  sleep 2
done

# Copy AOF file
kubectl cp hdr-empire/redis-0:/data/appendonly.aof "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress and upload
gzip "${BACKUP_DIR}/${BACKUP_FILE}"
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" "${S3_BUCKET}/"

# Cleanup
find $BACKUP_DIR -name "appendonly_*.aof.gz" -mtime +7 -delete

echo "Redis AOF backup completed: ${BACKUP_FILE}.gz"
```

---

## Kubernetes Resources

### Velero Installation

```bash
# Install Velero
wget https://github.com/vmware-tanzu/velero/releases/download/v1.12.0/velero-v1.12.0-linux-amd64.tar.gz
tar -xzf velero-v1.12.0-linux-amd64.tar.gz
sudo mv velero-v1.12.0-linux-amd64/velero /usr/local/bin/

# Install Velero in cluster with AWS provider
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.8.0 \
  --bucket hdr-empire-velero-backups \
  --backup-location-config region=us-east-1 \
  --snapshot-location-config region=us-east-1 \
  --secret-file ./credentials-velero \
  --use-node-agent \
  --uploader-type restic

# Verify installation
kubectl get pods -n velero
```

### Scheduled Backups

```yaml
# velero-schedule.yaml
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: hdr-empire-daily
  namespace: velero
spec:
  schedule: "0 3 * * *" # Daily at 3:00 AM UTC
  template:
    includedNamespaces:
      - hdr-empire
    excludedResources:
      - events
      - events.events.k8s.io
    storageLocation: default
    volumeSnapshotLocations:
      - default
    ttl: 720h0m0s # 30 days
    includeClusterResources: true
---
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: hdr-empire-weekly
  namespace: velero
spec:
  schedule: "0 4 * * 0" # Weekly on Sunday at 4:00 AM UTC
  template:
    includedNamespaces:
      - hdr-empire
    storageLocation: default
    ttl: 2160h0m0s # 90 days
```

```bash
# Create schedules
kubectl apply -f velero-schedule.yaml

# Verify schedules
velero schedule get

# Trigger manual backup
velero backup create hdr-empire-manual --include-namespaces hdr-empire

# Check backup status
velero backup describe hdr-empire-manual
velero backup logs hdr-empire-manual
```

### Configuration Backup

```bash
#!/bin/bash
# backup-k8s-configs.sh - Backup all Kubernetes configurations

set -euo pipefail

BACKUP_DIR="/backups/kubernetes"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"
S3_BUCKET="s3://hdr-empire-backups/kubernetes"

mkdir -p $BACKUP_PATH

# Backup all resources in hdr-empire namespace
echo "Backing up Kubernetes resources..."

for RESOURCE in deployment statefulset service configmap secret ingress pvc pv; do
  echo "Backing up ${RESOURCE}..."
  kubectl get $RESOURCE -n hdr-empire -o yaml > "${BACKUP_PATH}/${RESOURCE}.yaml"
done

# Backup CRDs
kubectl get crd -o yaml > "${BACKUP_PATH}/crds.yaml"

# Backup RBAC
kubectl get clusterrole,clusterrolebinding,role,rolebinding -n hdr-empire -o yaml > \
  "${BACKUP_PATH}/rbac.yaml"

# Create tar archive
tar -czf "${BACKUP_PATH}.tar.gz" -C $BACKUP_DIR $TIMESTAMP

# Upload to S3
aws s3 cp "${BACKUP_PATH}.tar.gz" "${S3_BUCKET}/" \
  --storage-class STANDARD_IA

# Cleanup
rm -rf $BACKUP_PATH
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Kubernetes configuration backup completed: ${TIMESTAMP}.tar.gz"
```

---

## Disaster Recovery

### Complete System Failure

```bash
#!/bin/bash
# disaster-recovery-full.sh - Recover from complete system failure

set -euo pipefail

echo "=========================================="
echo "HDR Empire Framework - Disaster Recovery"
echo "=========================================="

# Step 1: Restore Kubernetes cluster
echo "Step 1: Restoring Kubernetes cluster..."
# Assuming cluster is already provisioned
kubectl cluster-info

# Step 2: Install core services
echo "Step 2: Installing core services..."
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
helm install velero vmware-tanzu/velero -n velero --create-namespace

# Step 3: Restore Kubernetes resources
echo "Step 3: Restoring Kubernetes resources..."
LATEST_K8S_BACKUP=$(aws s3 ls s3://hdr-empire-backups/kubernetes/ | sort | tail -1 | awk '{print $4}')
aws s3 cp "s3://hdr-empire-backups/kubernetes/${LATEST_K8S_BACKUP}" /tmp/k8s-backup.tar.gz
tar -xzf /tmp/k8s-backup.tar.gz -C /tmp

# Apply configurations
kubectl create namespace hdr-empire
kubectl apply -f /tmp/*/configmap.yaml
kubectl apply -f /tmp/*/secret.yaml
kubectl apply -f /tmp/*/pvc.yaml
kubectl apply -f /tmp/*/deployment.yaml
kubectl apply -f /tmp/*/statefulset.yaml
kubectl apply -f /tmp/*/service.yaml
kubectl apply -f /tmp/*/ingress.yaml

# Step 4: Restore PostgreSQL
echo "Step 4: Restoring PostgreSQL..."
./restore-database.sh

# Step 5: Restore Redis
echo "Step 5: Restoring Redis..."
./restore-redis.sh

# Step 6: Verify services
echo "Step 6: Verifying services..."
kubectl wait --for=condition=ready pod -l app=neural-hdr -n hdr-empire --timeout=600s
kubectl wait --for=condition=ready pod -l app=postgres -n hdr-empire --timeout=600s
kubectl wait --for=condition=ready pod -l app=redis -n hdr-empire --timeout=600s

# Step 7: Smoke tests
echo "Step 7: Running smoke tests..."
./smoke-test.sh

echo "Disaster recovery completed successfully!"
```

### Data Center Loss

```bash
#!/bin/bash
# dr-datacenter-failover.sh - Failover to secondary data center

set -euo pipefail

echo "Failing over to secondary data center..."

# Update DNS to point to secondary region
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.hdr-empire.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z0987654321XYZ",
          "DNSName": "secondary-lb-123456.us-west-2.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'

# Promote secondary database to primary
kubectl exec -it postgres-secondary-0 -n hdr-empire -- \
  psql -U postgres -c "SELECT pg_promote();"

# Update application configuration
kubectl set env deployment/neural-hdr \
  DATABASE_URL=postgres://user:pass@postgres-secondary-0.postgres:5432/hdr_empire \
  REDIS_URL=redis://redis-secondary-0.redis:6379 \
  -n hdr-empire

# Scale up services in secondary region
kubectl scale deployment/neural-hdr --replicas=10 -n hdr-empire
kubectl scale deployment/nano-swarm-hdr --replicas=15 -n hdr-empire

# Verify failover
./verify-deployment.sh

echo "Failover to secondary data center completed!"
```

---

**Copyright © 2025 Stephen Bilodeau - All Rights Reserved - Patent Pending**

For more information, see:

- [OPERATIONS-MANUAL.md](./OPERATIONS-MANUAL.md) - Daily operations
- [DEPLOYMENT-PROCEDURES.md](./DEPLOYMENT-PROCEDURES.md) - Deployment procedures
- [TROUBLESHOOTING-GUIDE.md](./TROUBLESHOOTING-GUIDE.md) - Troubleshooting guide
