# HDR Empire Framework - Deployment Infrastructure

**Copyright © 2025 Stephen Bilodeau - Patent Pending**

This directory contains all deployment-related configurations, scripts, and monitoring setup for the HDR Empire Framework.

## Directory Structure

```
deployment/
├── scripts/                      # Deployment automation scripts
│   ├── deploy.sh                # Main deployment script (Linux/macOS)
│   ├── deploy.bat               # Main deployment script (Windows)
│   ├── rollback.sh              # Rollback to previous version
│   └── health-check.sh          # Automated health checks
├── monitoring/                   # Monitoring and alerting configuration
│   ├── prometheus.yml           # Prometheus configuration
│   ├── alerts/                  # Alert rules
│   │   └── hdr-alerts.yml      # HDR-specific alerts
│   └── grafana/                 # Grafana configuration
│       ├── dashboards/          # Dashboard definitions
│       └── datasources/         # Data source configuration
└── nginx/                        # Nginx reverse proxy config (if needed)
    ├── nginx.conf
    └── ssl/                      # SSL certificates
```

## Quick Start

### Deploy to Kubernetes

**Linux/macOS:**

```bash
# Make scripts executable
chmod +x deployment/scripts/*.sh

# Deploy to production
ENVIRONMENT=production VERSION=1.0.0 ./deployment/scripts/deploy.sh
```

**Windows:**

```powershell
.\deployment\scripts\deploy.bat production
```

### Rollback Deployment

```bash
# Rollback to previous version
./deployment/scripts/rollback.sh

# Rollback to specific revision
./deployment/scripts/rollback.sh 3
```

### Run Health Checks

```bash
./deployment/scripts/health-check.sh
```

## Deployment Scripts

### deploy.sh / deploy.bat

Main deployment script with features:

- Prerequisites validation
- Namespace creation
- Secret deployment
- ConfigMap deployment
- PVC provisioning
- Application deployment
- Health verification
- Smoke testing
- Error handling and rollback

**Environment Variables:**

- `NAMESPACE` - Kubernetes namespace (default: hdr-system)
- `ENVIRONMENT` - Deployment environment (default: production)
- `VERSION` - Image version (default: latest)
- `REGISTRY` - Container registry (default: ghcr.io)
- `DRY_RUN` - Preview changes without applying (default: false)
- `ROLLBACK` - Trigger rollback instead of deploy (default: false)

**Example:**

```bash
ENVIRONMENT=staging VERSION=1.2.0 ./deployment/scripts/deploy.sh
```

### rollback.sh

Rollback deployment to previous or specific revision.

**Usage:**

```bash
./deployment/scripts/rollback.sh [REVISION]
```

**Examples:**

```bash
# Rollback to previous version
./deployment/scripts/rollback.sh

# Rollback to revision 3
./deployment/scripts/rollback.sh 3
```

### health-check.sh

Automated health check script that verifies:

- Pod health and readiness
- Service endpoints
- HPA status
- Application health endpoint
- Resource usage

**Usage:**

```bash
NAMESPACE=hdr-system ./deployment/scripts/health-check.sh
```

## Monitoring Configuration

### Prometheus

**File:** `monitoring/prometheus.yml`

Monitors:

- HDR Empire application metrics
- Kubernetes cluster metrics
- Node metrics
- Redis and PostgreSQL

**Key Metrics:**

- `http_requests_total` - HTTP request count
- `http_request_duration_seconds` - Request latency
- `swarm_deployment_total` - NS-HDR swarm deployments
- `security_zone_breaches_total` - VB-HDR security events
- `quantum_processing_errors_total` - Q-HDR errors
- `knowledge_crystallization_total` - O-HDR crystallizations

**Access:**

```bash
kubectl port-forward service/prometheus 9090:9090 -n hdr-system
# Open http://localhost:9090
```

### Alert Rules

**File:** `monitoring/alerts/hdr-alerts.yml`

Configured alerts:

- **HighCPUUsage** - CPU > 80% for 5 minutes
- **HighMemoryUsage** - Memory > 85% for 5 minutes
- **PodNotReady** - Pod not running for 5 minutes
- **HighErrorRate** - Error rate > 5% for 5 minutes
- **SwarmDeploymentFailure** - NS-HDR deployment failures
- **SecurityZoneBreach** - VB-HDR security breaches
- **QuantumProcessingErrors** - Q-HDR processing errors
- **CrystallizationFailures** - O-HDR failures

### Grafana

**Configuration:** `monitoring/grafana/`

Pre-configured with:

- Prometheus datasource
- Dashboard provisioning
- Alert channels (configure as needed)

**Access:**

```bash
kubectl port-forward service/grafana 3001:3000 -n hdr-system
# Open http://localhost:3001
# Default: admin/admin (change in production!)
```

**Dashboards:**

- HDR Empire Overview
- NS-HDR Swarm Activity
- VB-HDR Security Monitoring
- Infrastructure Metrics

## Environment Configuration

### Development

```bash
ENVIRONMENT=development VERSION=dev ./deployment/scripts/deploy.sh
```

Characteristics:

- Debug logging enabled
- Lower resource limits
- Development secrets
- Hot-reload capabilities

### Staging

```bash
ENVIRONMENT=staging VERSION=1.2.0-rc1 ./deployment/scripts/deploy.sh
```

Characteristics:

- Production-like configuration
- Test data
- Pre-production testing
- Performance testing

### Production

```bash
ENVIRONMENT=production VERSION=1.2.0 ./deployment/scripts/deploy.sh
```

Characteristics:

- Maximum security
- High availability (3+ replicas)
- Auto-scaling enabled
- Production secrets
- Monitoring and alerting

## Best Practices

### 1. Version Tagging

Always use specific version tags:

```bash
VERSION=1.2.0 ./deployment/scripts/deploy.sh
```

Never use `latest` in production!

### 2. Secret Management

- Generate strong passwords: `openssl rand -base64 32`
- Rotate secrets regularly
- Never commit secrets to version control
- Use sealed secrets or external secret managers

### 3. Resource Planning

- Set appropriate resource requests/limits
- Monitor actual usage
- Adjust based on load
- Use HPA for auto-scaling

### 4. Monitoring

- Set up alerting rules
- Monitor key metrics
- Review logs regularly
- Set up dashboards

### 5. Backup Strategy

- Backup persistent volumes
- Backup configurations
- Test restore procedures
- Document recovery steps

### 6. Rollback Plan

- Test rollback procedures
- Keep recent revisions
- Document rollback steps
- Have fallback options

## Troubleshooting

### Deployment Fails

```bash
# Check script output
ENVIRONMENT=production ./deployment/scripts/deploy.sh

# Check pod status
kubectl get pods -n hdr-system

# Check events
kubectl get events -n hdr-system --sort-by='.lastTimestamp'
```

### Health Check Fails

```bash
# Run verbose health check
./deployment/scripts/health-check.sh

# Check individual components
kubectl get pods -n hdr-system
kubectl get services -n hdr-system
kubectl get hpa -n hdr-system
```

### Monitoring Not Working

```bash
# Check Prometheus
kubectl get pods -n hdr-system | grep prometheus
kubectl logs <prometheus-pod> -n hdr-system

# Check Grafana
kubectl get pods -n hdr-system | grep grafana
kubectl logs <grafana-pod> -n hdr-system
```

## Documentation

For detailed deployment instructions, see:

- [**Main Deployment Guide**](../docs/DEPLOYMENT-GUIDE.md) - Complete deployment documentation
- [**Docker Compose Guide**](../docs/DOCKER-COMPOSE-GUIDE.md) - Docker-specific instructions
- [**Kubernetes Guide**](../docs/KUBERNETES-GUIDE.md) - Kubernetes-specific details

## Support

For deployment issues or questions:

- Check troubleshooting section in deployment guides
- Review logs and events
- Verify prerequisites
- Consult with system administrator

---

**Deployment Infrastructure Version:** 1.0.0  
**Last Updated:** October 1, 2025  
**Copyright:** © 2025 Stephen Bilodeau - All Rights Reserved
