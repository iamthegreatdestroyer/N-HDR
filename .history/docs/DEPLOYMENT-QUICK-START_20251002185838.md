# HDR Empire Framework - Deployment Quick-Start Guide

**Copyright © 2025 Stephen Bilodeau - Patent Pending - All Rights Reserved**

## Overview

This guide provides step-by-step instructions for deploying the HDR Empire Framework in various environments, from local development to enterprise Kubernetes production deployments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start with Docker Compose](#quick-start-with-docker-compose)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Production Deployment](#production-deployment)
5. [Configuration](#configuration)
6. [Health Checks](#health-checks)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Docker** 24.0+ and **Docker Compose** 2.20+
- **Kubernetes** 1.27+ (for production deployments)
- **kubectl** (Kubernetes CLI)
- **Node.js** 18+ (for local development)

### Hardware Requirements

**Minimum (Development):**
- CPU: 2 cores
- RAM: 4 GB
- Disk: 10 GB

**Recommended (Production):**
- CPU: 4-8 cores
- RAM: 16-32 GB
- Disk: 100 GB SSD

### Network Requirements

- Ports 3000 (application), 9090 (Prometheus), 3001 (Grafana)
- Outbound internet access for Docker image pulls
- Internal network connectivity between services

---

## Quick Start with Docker Compose

### 1. Clone Repository

```bash
git clone https://github.com/your-org/hdr-empire.git
cd hdr-empire
```

### 2. Configure Environment

Create `.env` file:

```bash
# Application Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=your-secure-password

# Database Configuration (if needed)
DATABASE_URL=postgresql://user:password@postgres:5432/hdr_empire

# Security
JWT_SECRET=your-jwt-secret-change-this
ENCRYPTION_KEY=your-encryption-key-change-this

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ADMIN_PASSWORD=admin-change-this
```

### 3. Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 4. Verify Deployment

```bash
# Application health check
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","timestamp":"2025-10-02T12:00:00.000Z"}

# Metrics endpoint
curl http://localhost:3000/metrics

# Prometheus UI
open http://localhost:9090

# Grafana UI (default: admin/admin)
open http://localhost:3001
```

### 5. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| HDR Empire API | http://localhost:3000 | N/A |
| Prometheus | http://localhost:9090 | N/A |
| Grafana | http://localhost:3001 | admin / admin |
| Redis | localhost:6379 | (from .env) |

### 6. Stop Services

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (WARNING: deletes data)
docker-compose down -v
```

---

## Kubernetes Deployment

### 1. Prerequisites

Ensure you have:
- Kubernetes cluster (local minikube, cloud EKS/GKE/AKS, or on-prem)
- kubectl configured with cluster access
- Appropriate RBAC permissions

### 2. Create Namespace

```bash
# Create HDR production namespace
kubectl create namespace hdr-production

# Set as default namespace
kubectl config set-context --current --namespace=hdr-production
```

### 3. Configure Secrets

Create secrets for sensitive data:

```bash
# Create generic secret
kubectl create secret generic hdr-secrets \
  --from-literal=redis-password=your-secure-password \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=encryption-key=your-encryption-key \
  -n hdr-production

# Create Docker registry secret (if using private registry)
kubectl create secret docker-registry hdr-registry-secret \
  --docker-server=ghcr.io \
  --docker-username=your-github-username \
  --docker-password=your-github-token \
  -n hdr-production
```

### 4. Deploy Infrastructure

```bash
# Apply namespace configuration
kubectl apply -f k8s/namespace.yaml

# Deploy ConfigMap
kubectl apply -f k8s/configmap.yaml

# Deploy secrets (if not created manually)
kubectl apply -f k8s/secrets.yaml

# Deploy Persistent Volume Claims
kubectl apply -f k8s/pvc.yaml

# Verify resources
kubectl get configmap,secret,pvc -n hdr-production
```

### 5. Deploy Application

```bash
# Deploy HDR Empire application
kubectl apply -f k8s/deployment.yaml

# Deploy service
kubectl apply -f k8s/service.yaml

# Deploy ingress (optional, for external access)
kubectl apply -f k8s/ingress.yaml

# Deploy Horizontal Pod Autoscaler
kubectl apply -f k8s/hpa.yaml

# Wait for rollout to complete
kubectl rollout status deployment/hdr-empire -n hdr-production --timeout=5m
```

### 6. Verify Deployment

```bash
# Check pod status
kubectl get pods -n hdr-production -l app=hdr-empire

# Expected output:
# NAME                          READY   STATUS    RESTARTS   AGE
# hdr-empire-7f9b8c6d-abcde     1/1     Running   0          2m
# hdr-empire-7f9b8c6d-fghij     1/1     Running   0          2m

# Check service
kubectl get svc -n hdr-production -l app=hdr-empire

# View logs
kubectl logs -f deployment/hdr-empire -n hdr-production

# Check events
kubectl get events -n hdr-production --sort-by='.lastTimestamp'
```

### 7. Access Application

#### Port Forward (Development/Testing)

```bash
# Forward application port
kubectl port-forward -n hdr-production svc/hdr-empire 3000:80

# Access application
curl http://localhost:3000/health
```

#### LoadBalancer (Cloud)

```bash
# Get external IP
kubectl get svc hdr-empire -n hdr-production

# Access via external IP
curl http://<EXTERNAL-IP>/health
```

#### Ingress (Production)

```bash
# Get ingress details
kubectl get ingress -n hdr-production

# Access via domain
curl https://hdr-empire.your-domain.com/health
```

---

## Production Deployment

### 1. High Availability Setup

For production, deploy with multiple replicas and redundancy:

**Update `k8s/deployment.yaml`:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hdr-empire
  namespace: hdr-production
spec:
  replicas: 3  # Minimum 3 for HA
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero-downtime deployments
  template:
    spec:
      affinity:
        podAntiAffinity:  # Spread across nodes
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: hdr-empire
                topologyKey: kubernetes.io/hostname
```

### 2. Resource Limits

Set appropriate resource limits:

```yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 2Gi
```

### 3. Health Probes

Configure liveness and readiness probes:

```yaml
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
    path: /health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### 4. Horizontal Pod Autoscaling

Enable autoscaling based on metrics:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hdr-empire-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hdr-empire
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### 5. Monitoring & Logging

Deploy Prometheus and Grafana:

```bash
# Install Prometheus Operator (if not already installed)
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml

# Deploy ServiceMonitor for HDR Empire
kubectl apply -f k8s/servicemonitor.yaml

# Deploy Grafana
kubectl apply -f k8s/monitoring/grafana-deployment.yaml

# Access Grafana
kubectl port-forward -n hdr-production svc/grafana 3001:80
```

### 6. Backup Strategy

Set up automated backups for persistent data:

```bash
# Create backup CronJob
kubectl apply -f k8s/backup-cronjob.yaml

# Manual backup
kubectl create job hdr-backup-manual \
  --from=cronjob/hdr-backup \
  -n hdr-production

# Verify backup
kubectl get job hdr-backup-manual -n hdr-production
```

### 7. Security Hardening

#### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: hdr-empire-netpol
  namespace: hdr-production
spec:
  podSelector:
    matchLabels:
      app: hdr-empire
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: hdr-production
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 6379  # Redis
```

#### Pod Security Standards

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: hdr-production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment (production/development) |
| `PORT` | `3000` | Application port |
| `LOG_LEVEL` | `info` | Logging level (debug/info/warn/error) |
| `REDIS_URL` | `redis://redis:6379` | Redis connection URL |
| `REDIS_PASSWORD` | - | Redis password |
| `DATABASE_URL` | - | Database connection string |
| `JWT_SECRET` | - | JWT signing secret |
| `ENCRYPTION_KEY` | - | Data encryption key |
| `PROMETHEUS_ENABLED` | `true` | Enable Prometheus metrics |
| `GRAFANA_ENABLED` | `true` | Enable Grafana dashboards |

### ConfigMap

The `k8s/configmap.yaml` contains non-sensitive configuration:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hdr-config
  namespace: hdr-production
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
  PROMETHEUS_ENABLED: "true"
  # Add more configuration as needed
```

### Secrets

Store sensitive data in secrets:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: hdr-secrets
  namespace: hdr-production
type: Opaque
stringData:
  redis-password: "your-secure-password"
  jwt-secret: "your-jwt-secret"
  encryption-key: "your-encryption-key"
```

---

## Health Checks

### Application Health Endpoint

```bash
# Basic health check
curl http://localhost:3000/health

# Response:
{
  "status": "healthy",
  "timestamp": "2025-10-02T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "components": {
    "redis": "healthy",
    "database": "healthy",
    "swarm": "active"
  }
}
```

### Readiness Check

```bash
# Readiness endpoint
curl http://localhost:3000/health/ready

# Response when ready:
{
  "ready": true,
  "checks": {
    "redis": true,
    "swarm_initialized": true
  }
}
```

### Liveness Check

```bash
# Liveness endpoint
curl http://localhost:3000/health/live

# Response:
{
  "alive": true
}
```

---

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

**Symptoms:**
- Pods stuck in `Pending`, `CrashLoopBackOff`, or `ImagePullBackOff` state

**Diagnosis:**

```bash
# Check pod status
kubectl describe pod <pod-name> -n hdr-production

# View pod logs
kubectl logs <pod-name> -n hdr-production

# Check events
kubectl get events -n hdr-production --field-selector involvedObject.name=<pod-name>
```

**Common Causes:**

1. **Image Pull Error:**
   ```bash
   # Verify image exists
   docker pull ghcr.io/your-org/hdr-empire:latest
   
   # Check image pull secrets
   kubectl get secret hdr-registry-secret -n hdr-production
   ```

2. **Resource Constraints:**
   ```bash
   # Check node resources
   kubectl top nodes
   
   # Check pod resource requests
   kubectl describe pod <pod-name> -n hdr-production | grep -A 5 "Requests"
   ```

3. **Missing Secrets/ConfigMaps:**
   ```bash
   # Verify secrets exist
   kubectl get secret hdr-secrets -n hdr-production
   
   # Verify configmap exists
   kubectl get configmap hdr-config -n hdr-production
   ```

#### 2. Application Not Accessible

**Symptoms:**
- Service endpoint returns connection refused or timeout

**Diagnosis:**

```bash
# Check service endpoints
kubectl get endpoints hdr-empire -n hdr-production

# Check service configuration
kubectl describe svc hdr-empire -n hdr-production

# Test connectivity from within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://hdr-empire.hdr-production.svc.cluster.local/health
```

**Solutions:**

1. **Service Not Found:**
   ```bash
   # Recreate service
   kubectl delete svc hdr-empire -n hdr-production
   kubectl apply -f k8s/service.yaml
   ```

2. **Port Mismatch:**
   ```bash
   # Verify container port matches service targetPort
   kubectl get pod <pod-name> -n hdr-production -o jsonpath='{.spec.containers[0].ports[0].containerPort}'
   ```

#### 3. Redis Connection Failure

**Symptoms:**
- Application logs show "Redis connection refused" or similar errors

**Diagnosis:**

```bash
# Check Redis deployment
kubectl get pods -l app=redis -n hdr-production

# Test Redis connectivity
kubectl run -it --rm redis-test --image=redis:7-alpine --restart=Never -- \
  redis-cli -h redis.hdr-production.svc.cluster.local -a <password> ping
```

**Solutions:**

1. **Redis Not Running:**
   ```bash
   # Deploy Redis (if not using external service)
   kubectl apply -f k8s/redis-deployment.yaml
   ```

2. **Incorrect Password:**
   ```bash
   # Update secret
   kubectl create secret generic hdr-secrets \
     --from-literal=redis-password=correct-password \
     --dry-run=client -o yaml | kubectl apply -f -
   
   # Restart pods to pick up new secret
   kubectl rollout restart deployment/hdr-empire -n hdr-production
   ```

#### 4. High Memory Usage

**Symptoms:**
- Pods being OOMKilled or restarted frequently

**Diagnosis:**

```bash
# Check memory usage
kubectl top pods -n hdr-production

# View resource limits
kubectl describe pod <pod-name> -n hdr-production | grep -A 5 "Limits"
```

**Solutions:**

1. **Increase Memory Limits:**
   ```yaml
   resources:
     requests:
       memory: 1Gi
     limits:
       memory: 2Gi  # Increase from 1Gi
   ```

2. **Enable HPA:**
   ```bash
   kubectl apply -f k8s/hpa.yaml
   ```

3. **Investigate Memory Leaks:**
   ```bash
   # Get heap snapshot
   kubectl exec -it <pod-name> -n hdr-production -- \
     node --inspect=0.0.0.0:9229 /app/index.js
   ```

#### 5. Metrics Not Appearing in Prometheus

**Symptoms:**
- Prometheus shows targets as down or no HDR metrics

**Diagnosis:**

```bash
# Check ServiceMonitor
kubectl get servicemonitor -n hdr-production

# Verify metrics endpoint
kubectl port-forward -n hdr-production svc/hdr-empire 3000:80
curl http://localhost:3000/metrics
```

**Solutions:**

1. **Create ServiceMonitor:**
   ```yaml
   apiVersion: monitoring.coreos.com/v1
   kind: ServiceMonitor
   metadata:
     name: hdr-empire
     namespace: hdr-production
   spec:
     selector:
       matchLabels:
         app: hdr-empire
     endpoints:
       - port: http
         path: /metrics
   ```

2. **Verify Prometheus Configuration:**
   ```bash
   kubectl logs -n monitoring prometheus-<pod-name> | grep hdr-empire
   ```

### Debugging Commands

```bash
# Get all resources in namespace
kubectl get all -n hdr-production

# Describe deployment
kubectl describe deployment hdr-empire -n hdr-production

# View recent logs
kubectl logs --tail=100 -f deployment/hdr-empire -n hdr-production

# Execute command in pod
kubectl exec -it <pod-name> -n hdr-production -- sh

# Port forward for local testing
kubectl port-forward -n hdr-production svc/hdr-empire 3000:80

# Get resource usage
kubectl top pods -n hdr-production
kubectl top nodes

# Check cluster info
kubectl cluster-info
kubectl get nodes
```

### Rollback Deployment

If deployment fails:

```bash
# View rollout history
kubectl rollout history deployment/hdr-empire -n hdr-production

# Rollback to previous version
kubectl rollout undo deployment/hdr-empire -n hdr-production

# Rollback to specific revision
kubectl rollout undo deployment/hdr-empire --to-revision=2 -n hdr-production
```

---

## Performance Optimization

### 1. Resource Allocation

Adjust resources based on observed usage:

```yaml
resources:
  requests:
    cpu: "1000m"      # 1 CPU core
    memory: "1Gi"
  limits:
    cpu: "2000m"      # 2 CPU cores
    memory: "2Gi"
```

### 2. Connection Pooling

Configure Redis connection pooling:

```javascript
// In application code
const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    keepAlive: 5000,
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  },
  maxRetriesPerRequest: 3
});
```

### 3. Caching Strategy

Enable L1/L2 caching:

```yaml
env:
  - name: CACHE_ENABLED
    value: "true"
  - name: CACHE_L1_SIZE
    value: "1000"
  - name: CACHE_L1_TTL
    value: "60000"  # 1 minute
  - name: CACHE_L2_TTL
    value: "3600000"  # 1 hour
```

---

## Security Best Practices

1. **Use Secrets for Sensitive Data** - Never hardcode credentials
2. **Enable Network Policies** - Restrict pod-to-pod communication
3. **Run as Non-Root User** - Set `runAsNonRoot: true` in pod spec
4. **Enable Pod Security Standards** - Use `restricted` policy
5. **Regular Updates** - Keep images and dependencies updated
6. **Enable RBAC** - Use least-privilege access control
7. **Use TLS/SSL** - Encrypt traffic with ingress TLS
8. **Enable Audit Logging** - Monitor access and changes

---

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [HDR Empire Metrics Guide](./METRICS-MONITORING-GUIDE.md)
- [HDR Empire API Reference](../api/api-reference.md)

---

## Support

For deployment issues or questions:
- Check troubleshooting section above
- Review application logs
- Consult HDR Empire documentation
- Contact development team

**Copyright © 2025 Stephen Bilodeau - Patent Pending - All Rights Reserved**
