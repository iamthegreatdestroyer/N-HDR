# HDR Empire Framework - Kubernetes Guide

**Copyright © 2025 Stephen Bilodeau - Patent Pending**

## Overview

Comprehensive guide for deploying HDR Empire Framework on Kubernetes.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ HDR Empire  │  │ HDR Empire  │  │ HDR Empire  │     │
│  │   Pod 1     │  │   Pod 2     │  │   Pod 3     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│         │                 │                 │            │
│         └─────────────────┴─────────────────┘            │
│                          │                                │
│                 ┌────────▼────────┐                      │
│                 │  Load Balancer  │                      │
│                 │    Service      │                      │
│                 └─────────────────┘                      │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Redis     │  │  PostgreSQL  │  │  Monitoring  │   │
│  │    Cache    │  │   Database   │  │     Stack    │   │
│  └─────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

### Required Tools

```bash
# kubectl (Kubernetes CLI)
kubectl version --client

# Helm (optional, for advanced deployments)
helm version

# Access to Kubernetes cluster
kubectl cluster-info
```

### Cluster Requirements

**Minimum:**
- 3 worker nodes
- 4 vCPU per node
- 8 GB RAM per node
- 50 GB storage

**Recommended:**
- 5+ worker nodes
- 8+ vCPU per node
- 16+ GB RAM per node
- 100+ GB SSD storage

## Deployment Steps

### 1. Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

This creates:
- `hdr-system` namespace
- Service account
- RBAC roles and bindings

### 2. Configure Secrets

**Important:** Update secrets with your actual values!

```bash
# Generate secure passwords
POSTGRES_PASS=$(openssl rand -base64 32)
REDIS_PASS=$(openssl rand -base64 32)
API_KEY=$(openssl rand -base64 32)

# Create secrets
kubectl create secret generic hdr-secrets \
  --from-literal=postgres-password="$POSTGRES_PASS" \
  --from-literal=redis-password="$REDIS_PASS" \
  --from-literal=api-key="$API_KEY" \
  --from-literal=jwt-secret="$(openssl rand -base64 32)" \
  --from-literal=encryption-key="$(openssl rand -base64 32)" \
  -n hdr-system
```

### 3. Deploy ConfigMap

```bash
kubectl apply -f k8s/configmap.yaml
```

Verify:
```bash
kubectl get configmap hdr-config -n hdr-system -o yaml
```

### 4. Create Persistent Volumes

```bash
kubectl apply -f k8s/pvc.yaml
```

Check status:
```bash
kubectl get pvc -n hdr-system
```

### 5. Deploy Application

```bash
# Deploy main application
kubectl apply -f k8s/deployment.yaml

# Wait for rollout to complete
kubectl rollout status deployment/hdr-empire -n hdr-system

# Check pod status
kubectl get pods -n hdr-system -l app=hdr-empire
```

### 6. Expose Service

```bash
kubectl apply -f k8s/service.yaml
```

Get service details:
```bash
kubectl get service hdr-empire -n hdr-system
```

### 7. Enable Auto-Scaling

```bash
kubectl apply -f k8s/hpa.yaml
```

Check HPA status:
```bash
kubectl get hpa -n hdr-system
```

## Verification

### Health Checks

```bash
# Run automated health check
./deployment/scripts/health-check.sh

# Or manually
kubectl get pods -n hdr-system
kubectl get services -n hdr-system
kubectl get hpa -n hdr-system
```

### Access Application

```bash
# Via port-forward (local testing)
kubectl port-forward service/hdr-empire 3000:80 -n hdr-system

# Via LoadBalancer (production)
SERVICE_IP=$(kubectl get service hdr-empire -n hdr-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$SERVICE_IP/health
```

## Management

### Scaling

**Manual Scaling:**
```bash
# Scale to 5 replicas
kubectl scale deployment/hdr-empire --replicas=5 -n hdr-system
```

**Auto-Scaling:**
The HPA automatically scales based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)
- Min replicas: 3
- Max replicas: 10

### Updates

**Rolling Update:**
```bash
# Update image version
kubectl set image deployment/hdr-empire \
  hdr-empire=hdr-empire:2.0.0 \
  -n hdr-system

# Monitor rollout
kubectl rollout status deployment/hdr-empire -n hdr-system

# Check rollout history
kubectl rollout history deployment/hdr-empire -n hdr-system
```

**Rollback:**
```bash
# Rollback to previous version
kubectl rollout undo deployment/hdr-empire -n hdr-system

# Rollback to specific revision
kubectl rollout undo deployment/hdr-empire -n hdr-system --to-revision=2
```

### Configuration Updates

```bash
# Edit ConfigMap
kubectl edit configmap hdr-config -n hdr-system

# Restart pods to pick up new config
kubectl rollout restart deployment/hdr-empire -n hdr-system
```

## Monitoring

### Logs

```bash
# View logs from all pods
kubectl logs -l app=hdr-empire -n hdr-system --tail=100 -f

# View logs from specific pod
kubectl logs <pod-name> -n hdr-system -f

# Previous pod logs (if pod crashed)
kubectl logs <pod-name> -n hdr-system --previous
```

### Resource Usage

```bash
# Pod resource usage
kubectl top pods -n hdr-system

# Node resource usage
kubectl top nodes

# Detailed pod information
kubectl describe pod <pod-name> -n hdr-system
```

### Events

```bash
# View namespace events
kubectl get events -n hdr-system --sort-by='.lastTimestamp'

# Watch events in real-time
kubectl get events -n hdr-system --watch
```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl get pods -n hdr-system

# Describe pod
kubectl describe pod <pod-name> -n hdr-system

# Check logs
kubectl logs <pod-name> -n hdr-system

# Common issues:
# - ImagePullBackOff: Image not found or registry auth
# - CrashLoopBackOff: Application error
# - Pending: Insufficient resources
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints hdr-empire -n hdr-system

# Test from within cluster
kubectl run test --rm -it --image=busybox -- \
  wget -qO- http://hdr-empire:3000/health
```

### Database Connection Issues

```bash
# Check PostgreSQL pod
kubectl get pods -n hdr-system | grep postgres

# Test database connection
kubectl exec -it <hdr-pod> -n hdr-system -- \
  node -e "console.log('Testing database connection...')"

# Check database logs
kubectl logs <postgres-pod> -n hdr-system
```

### Resource Constraints

```bash
# Check resource limits
kubectl describe deployment hdr-empire -n hdr-system

# Increase resources in deployment.yaml:
# resources:
#   limits:
#     memory: "4Gi"
#     cpu: "4000m"
```

## Security Best Practices

1. **Use Strong Secrets**
   - Generate with: `openssl rand -base64 32`
   - Rotate regularly
   - Never commit to version control

2. **RBAC**
   - Use minimal required permissions
   - Service accounts for pods only
   - Audit regularly

3. **Network Policies**
   - Implement network segmentation
   - Restrict pod-to-pod communication
   - Use network policies

4. **Pod Security**
   - Run as non-root user (already configured)
   - Read-only root filesystem where possible
   - Drop unnecessary capabilities

5. **Image Security**
   - Use specific image tags, not `latest`
   - Scan images for vulnerabilities
   - Use trusted registries

## Backup and Disaster Recovery

### Backup

```bash
# Backup namespace configuration
kubectl get all -n hdr-system -o yaml > backup-$(date +%Y%m%d).yaml

# Backup ConfigMaps and Secrets
kubectl get configmap,secret -n hdr-system -o yaml > backup-config-$(date +%Y%m%d).yaml

# Backup PVCs (use cloud provider snapshots)
```

### Restore

```bash
# Restore from backup
kubectl apply -f backup-20251001.yaml
```

## Advanced Topics

### Custom Resource Definitions

If using Helm or operators:
```bash
# Install CRDs
kubectl apply -f crds/
```

### Ingress Configuration

```bash
# Install ingress controller (nginx example)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Apply ingress
kubectl apply -f k8s/ingress.yaml
```

### Service Mesh (Istio)

```bash
# Label namespace for automatic injection
kubectl label namespace hdr-system istio-injection=enabled

# Restart pods to inject sidecar
kubectl rollout restart deployment/hdr-empire -n hdr-system
```

## Performance Tuning

### Resource Optimization

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

### Pod Anti-Affinity

Already configured to spread pods across nodes for high availability.

### Pod Disruption Budget

```bash
# Apply PDB (if needed)
kubectl apply -f k8s/pdb.yaml
```

## Clean Up

```bash
# Delete all resources in namespace
kubectl delete namespace hdr-system

# Or delete individually
kubectl delete -f k8s/
```

---

**For more information, see the main [Deployment Guide](DEPLOYMENT-GUIDE.md)**
