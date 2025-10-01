# HDR Empire Framework - Quick Deployment Reference

**Copyright © 2025 Stephen Bilodeau - Patent Pending**

Quick reference for common deployment operations.

---

## 🚀 Quick Commands

### Docker

```bash
# Development
npm run docker:dev          # Start dev environment
npm run docker:logs         # View logs
npm run docker:down         # Stop all

# Production
npm run docker:build        # Build image
npm run docker:prod         # Start production stack
npm run docker:stop         # Stop application
```

### Kubernetes

```bash
# Deploy
npm run k8s:deploy          # Deploy to K8s
npm run k8s:health          # Check health
npm run k8s:rollback        # Rollback

# Manual kubectl commands
kubectl get pods -n hdr-system
kubectl logs -f deployment/hdr-empire -n hdr-system
kubectl describe pod <pod-name> -n hdr-system
```

### Testing

```bash
npm test                    # All tests
npm run test:integration    # Integration tests
npm run test:security       # Security tests
```

---

## 📋 Common Tasks

### Scale Application

```bash
# Kubernetes
kubectl scale deployment/hdr-empire --replicas=5 -n hdr-system

# Docker Compose
docker-compose up -d --scale hdr-empire=5
```

### View Logs

```bash
# Kubernetes
kubectl logs -l app=hdr-empire -n hdr-system --tail=100 -f

# Docker
docker-compose logs -f hdr-empire
```

### Update Deployment

```bash
# Kubernetes
kubectl set image deployment/hdr-empire hdr-empire=hdr-empire:2.0.0 -n hdr-system
kubectl rollout status deployment/hdr-empire -n hdr-system

# Docker Compose
docker-compose pull
docker-compose up -d
```

### Access Monitoring

```bash
# Prometheus
kubectl port-forward service/prometheus 9090:9090 -n hdr-system
# Open http://localhost:9090

# Grafana
kubectl port-forward service/grafana 3001:3000 -n hdr-system
# Open http://localhost:3001 (admin/admin)
```

---

## 🔍 Troubleshooting

### Pod Won't Start

```bash
kubectl describe pod <pod-name> -n hdr-system
kubectl logs <pod-name> -n hdr-system
kubectl get events -n hdr-system --sort-by='.lastTimestamp'
```

### Check Resources

```bash
kubectl top pods -n hdr-system
kubectl top nodes
kubectl get hpa -n hdr-system
```

### Database Issues

```bash
# Check PostgreSQL
kubectl get pods -n hdr-system | grep postgres
kubectl logs <postgres-pod> -n hdr-system

# Test connection from app pod
kubectl exec -it <hdr-pod> -n hdr-system -- node -e "console.log('test')"
```

---

## 📚 Documentation Links

- **[Full Deployment Guide](DEPLOYMENT-GUIDE.md)**
- **[Docker Guide](DOCKER-COMPOSE-GUIDE.md)**
- **[Kubernetes Guide](KUBERNETES-GUIDE.md)**
- **[Task 4 Summary](TASK-4-COMPLETION-SUMMARY.md)**

---

## 🆘 Emergency Procedures

### Rollback Deployment

```bash
npm run k8s:rollback
# Or: kubectl rollout undo deployment/hdr-empire -n hdr-system
```

### Scale Down (High Load)

```bash
kubectl scale deployment/hdr-empire --replicas=10 -n hdr-system
```

### Restart Pods

```bash
kubectl rollout restart deployment/hdr-empire -n hdr-system
```

### Check Service Health

```bash
./deployment/scripts/health-check.sh
# Or: curl http://<service-ip>/health
```

---

**For detailed instructions, always refer to the full documentation.**
