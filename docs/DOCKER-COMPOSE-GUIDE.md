# HDR Empire Framework - Docker Compose Guide

**Copyright © 2025 Stephen Bilodeau - Patent Pending**

## Overview

This guide covers Docker Compose deployment for the HDR Empire Framework.

## Available Compose Files

### docker-compose.yml (Production)

Full production stack including:

- HDR Empire application (3 replicas)
- Redis for caching
- PostgreSQL for persistence
- Prometheus for metrics
- Grafana for visualization
- Nginx reverse proxy

### docker-compose.dev.yml (Development)

Development environment with:

- Hot-reload enabled
- Debugging port exposed (9229)
- Source code mounted
- Simplified services

## Quick Start

### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f hdr-empire-dev

# Stop environment
docker-compose -f docker-compose.dev.yml down
```

### Production

```bash
# Start production stack
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop stack
docker-compose down
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL
POSTGRES_PASSWORD=your_secure_password_here

# Grafana
GRAFANA_PASSWORD=your_grafana_password

# Application
NODE_ENV=production
HDR_LOG_LEVEL=info
HDR_QUANTUM_LAYERS=6
HDR_SWARM_INITIAL_BOTS=100
```

### Volumes

Persistent data is stored in Docker volumes:

- `hdr-data` - Application data
- `hdr-logs` - Application logs
- `hdr-timestamps` - Blockchain timestamps
- `redis-data` - Redis persistence
- `postgres-data` - Database data
- `prometheus-data` - Metrics data
- `grafana-data` - Dashboard configurations

## Service URLs

When running locally:

- **Application**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **Nginx**: http://localhost:80

## Scaling

```bash
# Scale application to 5 instances
docker-compose up -d --scale hdr-empire=5

# Verify scaling
docker-compose ps
```

## Backup and Restore

### Backup

```bash
# Backup volumes
docker run --rm -v hdr-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/hdr-data.tar.gz /data

# Backup database
docker-compose exec postgres pg_dump -U hdr_admin hdr_empire > backup.sql
```

### Restore

```bash
# Restore volume
docker run --rm -v hdr-data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/hdr-data.tar.gz -C /

# Restore database
docker-compose exec -T postgres psql -U hdr_admin hdr_empire < backup.sql
```

## Troubleshooting

### Port Already in Use

```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use different host port
```

### Container Won't Start

```bash
# Check logs
docker-compose logs hdr-empire

# Rebuild container
docker-compose build --no-cache hdr-empire
docker-compose up -d
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps postgres

# Test connection
docker-compose exec hdr-empire node -e "console.log('Connection test')"
```

## Maintenance

### Update Images

```bash
# Pull latest images
docker-compose pull

# Recreate containers with new images
docker-compose up -d
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: data loss)
docker-compose down -v

# Remove unused Docker resources
docker system prune -a
```
