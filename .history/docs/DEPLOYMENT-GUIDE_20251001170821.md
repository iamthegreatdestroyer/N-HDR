# HDR Empire Framework - Deployment Guide

**Copyright © 2025 Stephen Bilodeau - Patent Pending - All Rights Reserved**

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring & Logging](#monitoring--logging)
8. [Security Configuration](#security-configuration)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance & Updates](#maintenance--updates)

---

## Overview

This guide provides comprehensive instructions for deploying the HDR Empire Framework across various environments and platforms. The framework supports:

- **Docker containerization** for local development and testing
- **Kubernetes orchestration** for production-grade deployments
- **CI/CD pipelines** for automated testing and deployment
- **Monitoring & alerting** with Prometheus and Grafana
- **Multi-environment support** (development, staging, production)

### Architecture Components

The HDR Empire Framework consists of:

- **7 Core HDR Systems**: N-HDR, NS-HDR, O-HDR, R-HDR, Q-HDR, D-HDR, VB-HDR
- **Command Interface**: Centralized orchestration layer
- **Integration Layer**: Cross-system communication bridge
- **Supporting Services**: Redis, PostgreSQL, monitoring stack

---

## Prerequisites

### Required Software

```bash
# Node.js 18 or higher
node --version  # Should be v18.0.0 or higher

# Docker Engine
docker --version  # Should be 20.10.0 or higher

# Docker Compose
docker-compose --version  # Should be 2.0.0 or higher

# Kubernetes CLI (for K8s deployments)
kubectl version  # Should be 1.25.0 or higher

# Git
git --version
```

### System Requirements

**Minimum:**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 20 GB
- Network: Stable internet connection

**Recommended for Production:**
- CPU: 8+ cores
- RAM: 16+ GB
- Storage: 100+ GB SSD
- Network: High-speed, low-latency connection

---

## Quick Start

### Local Development with Docker Compose

```bash
# Clone repository
git clone https://github.com/yourusername/N-HDR.git
cd N-HDR

# Install dependencies
npm install

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Access application
curl http://localhost:3000/health
```

### Production Deployment

```bash
# Build and start all services
docker-compose up -d

# Verify deployment
docker-compose ps
docker-compose logs hdr-empire

# Run health check
curl http://localhost:3000/health
```

---

## Docker Deployment

### Building the Image

```bash
# Build production image
docker build -t hdr-empire:latest .

# Build with specific version
docker build -t hdr-empire:1.0.0 .

# Build for multi-platform
docker buildx build --platform linux/amd64,linux/arm64 -t hdr-empire:latest .
```

### Running Containers

```bash
# Run standalone container
docker run -d \
  --name hdr-empire \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e HDR_LOG_LEVEL=info \
  -v hdr-data:/app/data \
  hdr-empire:latest

# Run with custom configuration
docker run -d \
  --name hdr-empire \
  -p 3000:3000 \
  -v $(pwd)/config:/app/config:ro \
  -e NODE_ENV=production \
  hdr-empire:latest
```

### Docker Compose Stack

**Development Stack:**
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Enable hot-reload (already configured)
# Changes to source files will automatically reload

# Attach debugger on port 9229
# Use VS Code debugger or Chrome DevTools
```

**Production Stack:**
```bash
# Start full production stack
docker-compose up -d

# Scale application instances
docker-compose up -d --scale hdr-empire=3

# View service status
docker-compose ps

# Check resource usage
docker stats

# View logs
docker-compose logs -f hdr-empire
```

### Managing the Stack

```bash
# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove all data (WARNING: destructive)
docker-compose down -v

# Restart specific service
docker-compose restart hdr-empire

# Update and restart services
docker-compose pull
docker-compose up -d
```

---

## Kubernetes Deployment

### Prerequisites

```bash
# Verify kubectl connection
kubectl cluster-info

# Check available resources
kubectl get nodes
kubectl top nodes
```

### Initial Setup

```bash
# Create namespace and RBAC
kubectl apply -f k8s/namespace.yaml

# Create secrets (update with actual values first!)
kubectl create secret generic hdr-secrets \
  --from-literal=postgres-password='YOUR_PASSWORD' \
  --from-literal=redis-password='YOUR_PASSWORD' \
  --from-literal=api-key='YOUR_API_KEY' \
  -n hdr-system

# Or use the template (after updating values)
kubectl apply -f k8s/secrets.yaml

# Deploy ConfigMap
kubectl apply -f k8s/configmap.yaml

# Create persistent volumes
kubectl apply -f k8s/pvc.yaml
```

### Deploying the Application

```bash
# Deploy all resources
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml

# Wait for deployment to complete
kubectl rollout status deployment/hdr-empire -n hdr-system

# Verify deployment
kubectl get all -n hdr-system
```

### Using Deployment Scripts

**Linux/macOS:**
```bash
# Make scripts executable
chmod +x deployment/scripts/*.sh

# Deploy to production
ENVIRONMENT=production VERSION=1.0.0 ./deployment/scripts/deploy.sh

# Deploy to staging
ENVIRONMENT=staging VERSION=latest ./deployment/scripts/deploy.sh

# Dry-run deployment
DRY_RUN=true ./deployment/scripts/deploy.sh
```

**Windows:**
```powershell
# Deploy using batch script
.\deployment\scripts\deploy.bat production

# Or use PowerShell
$env:ENVIRONMENT="production"
$env:VERSION="1.0.0"
.\deployment\scripts\deploy.sh
```

### Scaling and Updates

```bash
# Manual scaling
kubectl scale deployment/hdr-empire --replicas=5 -n hdr-system

# Update image
kubectl set image deployment/hdr-empire \
  hdr-empire=hdr-empire:2.0.0 \
  -n hdr-system

# Rolling update
kubectl rollout status deployment/hdr-empire -n hdr-system

# View rollout history
kubectl rollout history deployment/hdr-empire -n hdr-system

# Rollback to previous version
./deployment/scripts/rollback.sh

# Rollback to specific revision
./deployment/scripts/rollback.sh 3
```

### Accessing the Application

```bash
# Get service details
kubectl get service hdr-empire -n hdr-system

# Port-forward for local access
kubectl port-forward service/hdr-empire 3000:80 -n hdr-system

# Access via LoadBalancer (if configured)
SERVICE_IP=$(kubectl get service hdr-empire -n hdr-system -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$SERVICE_IP/health
```

---

## CI/CD Pipeline

### GitHub Actions

The HDR Empire Framework uses GitHub Actions for automated CI/CD.

**Workflow Triggers:**
- Push to `main` or `develop` branches
- Pull requests
- Release creation
- Manual workflow dispatch

**Pipeline Stages:**

1. **Code Quality** - Linting, copyright checks
2. **Unit Tests** - Multi-version Node.js testing
3. **Integration Tests** - With Redis and PostgreSQL
4. **Security Scanning** - npm audit, Snyk, Trivy
5. **Build** - Docker image build and push
6. **Deploy Dev** - Auto-deploy to development (develop branch)
7. **Deploy Prod** - Manual approval for production (releases)

### Required Secrets

Configure these in GitHub Settings → Secrets:

```
SNYK_TOKEN              # Snyk security scanning token
KUBE_CONFIG_DEV         # Base64-encoded kubeconfig for dev
KUBE_CONFIG_PROD        # Base64-encoded kubeconfig for prod
POSTGRES_PASSWORD       # Production database password
GRAFANA_PASSWORD        # Grafana admin password
```

### Manual Deployment

```bash
# Trigger deployment workflow manually
gh workflow run ci-cd.yml \
  -f environment=production \
  -f version=1.0.0
```

### Monitoring Pipeline Status

```bash
# View workflow runs
gh run list --workflow=ci-cd.yml

# View specific run
gh run view <run-id>

# Download artifacts
gh run download <run-id>
```

---

## Monitoring & Logging

### Prometheus Metrics

**Accessing Prometheus:**
```bash
# Via kubectl port-forward
kubectl port-forward service/prometheus 9090:9090 -n hdr-system

# Open in browser
open http://localhost:9090
```

**Key Metrics:**
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `swarm_deployment_total` - NS-HDR swarm deployments
- `security_zone_breaches_total` - VB-HDR security events
- `quantum_processing_errors_total` - Q-HDR processing errors
- `knowledge_crystallization_total` - O-HDR crystallizations

### Grafana Dashboards

**Accessing Grafana:**
```bash
# Via kubectl port-forward
kubectl port-forward service/grafana 3001:3000 -n hdr-system

# Or via Docker Compose
open http://localhost:3001

# Login credentials (change in production!)
Username: admin
Password: admin (or value from GRAFANA_PASSWORD)
```

**Pre-configured Dashboards:**
- HDR Empire Overview - System-wide metrics
- NS-HDR Swarm Activity - Swarm deployment and performance
- VB-HDR Security - Security events and threats
- Infrastructure Metrics - CPU, memory, network

### Application Logs

```bash
# Kubernetes logs
kubectl logs -f deployment/hdr-empire -n hdr-system

# Follow logs from all pods
kubectl logs -f -l app=hdr-empire -n hdr-system

# Docker Compose logs
docker-compose logs -f hdr-empire

# Save logs to file
kubectl logs deployment/hdr-empire -n hdr-system > hdr-logs.txt
```

### Alerts

**Alert Channels:**
- Prometheus AlertManager
- Grafana notifications
- Custom webhooks (Slack, PagerDuty, etc.)

**Critical Alerts:**
- Pod not ready
- High error rate
- Security zone breach
- Deployment failures
- Resource exhaustion

---

## Security Configuration

### Secrets Management

**Never commit secrets to version control!**

```bash
# Generate strong passwords
openssl rand -base64 32

# Create Kubernetes secrets
kubectl create secret generic hdr-secrets \
  --from-literal=postgres-password="$(openssl rand -base64 32)" \
  --from-literal=redis-password="$(openssl rand -base64 32)" \
  --from-literal=api-key="$(openssl rand -base64 32)" \
  -n hdr-system

# Verify secrets
kubectl get secrets -n hdr-system
```

### TLS/SSL Configuration

```bash
# Generate self-signed certificate (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout deployment/nginx/ssl/key.pem \
  -out deployment/nginx/ssl/cert.pem

# Use Let's Encrypt for production
certbot certonly --standalone -d hdr-empire.example.com
```

### Network Policies

```bash
# Apply network policies (if available)
kubectl apply -f k8s/network-policy.yaml
```

### RBAC Configuration

The deployment includes:
- Service account with minimal permissions
- Role for ConfigMap and Secret access
- RoleBinding for service account

---

## Troubleshooting

### Common Issues

#### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n hdr-system

# Describe pod for details
kubectl describe pod <pod-name> -n hdr-system

# Check logs
kubectl logs <pod-name> -n hdr-system

# Common causes:
# - Image pull errors
# - Insufficient resources
# - ConfigMap/Secret not found
# - Liveness/readiness probe failures
```

#### High Memory Usage

```bash
# Check resource usage
kubectl top pods -n hdr-system

# Scale down if needed
kubectl scale deployment/hdr-empire --replicas=2 -n hdr-system

# Increase resource limits in deployment.yaml
```

#### Service Not Accessible

```bash
# Check service
kubectl get service hdr-empire -n hdr-system

# Check endpoints
kubectl get endpoints hdr-empire -n hdr-system

# Test from within cluster
kubectl run test-pod --rm -it --image=busybox -- wget -qO- http://hdr-empire:3000/health
```

#### Database Connection Issues

```bash
# Check PostgreSQL pod
kubectl get pods -n hdr-system | grep postgres

# Test database connection
kubectl exec -it <hdr-pod> -n hdr-system -- \
  node -e "const pg = require('pg'); /* test connection */"
```

### Health Checks

```bash
# Run automated health check
./deployment/scripts/health-check.sh

# Manual health check
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

### Debug Mode

```bash
# Enable debug logging
kubectl set env deployment/hdr-empire HDR_LOG_LEVEL=debug -n hdr-system

# Attach to running container
kubectl exec -it <pod-name> -n hdr-system -- /bin/sh
```

---

## Maintenance & Updates

### Backup Procedures

```bash
# Backup persistent volumes
kubectl get pvc -n hdr-system
# Use your cloud provider's snapshot functionality

# Backup configuration
kubectl get configmap hdr-config -n hdr-system -o yaml > backup-config.yaml
kubectl get secret hdr-secrets -n hdr-system -o yaml > backup-secrets.yaml

# Backup database
kubectl exec -it <postgres-pod> -n hdr-system -- \
  pg_dump -U hdr_admin hdr_empire > backup.sql
```

### Updates and Upgrades

```bash
# Pull latest images
docker-compose pull

# Update deployment
kubectl set image deployment/hdr-empire \
  hdr-empire=hdr-empire:latest -n hdr-system

# Zero-downtime rolling update
kubectl rollout status deployment/hdr-empire -n hdr-system
```

### Cleanup

```bash
# Remove old images
docker image prune -a

# Clean unused volumes
docker volume prune

# Remove old Kubernetes resources
kubectl delete pod --field-selector status.phase=Failed -n hdr-system
```

---

## Support & Contact

**Master Architect:** Stephen Bilodeau  
**Copyright:** © 2025 - All Rights Reserved  
**Status:** Patent Pending

For authorized users and partners only.

---

## Legal Notice

This deployment guide and all associated code, documentation, and configurations are proprietary and confidential to Stephen Bilodeau. All intellectual property rights, including patent-pending technologies, are reserved.

Unauthorized use, reproduction, distribution, or disclosure is strictly prohibited.

---

**Guide Version:** 1.0.0  
**Last Updated:** October 1, 2025  
**Document Status:** Official Deployment Guide
