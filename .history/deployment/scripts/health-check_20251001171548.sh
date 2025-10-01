#!/bin/bash
# HDR Empire Framework - Health Check Script
# Copyright (c) 2025 Stephen Bilodeau - Patent Pending

set -e

NAMESPACE="${NAMESPACE:-hdr-system}"
SERVICE_NAME="${SERVICE_NAME:-hdr-empire}"

echo "[INFO] Running health checks for HDR Empire..."

# Check pod health
echo "[INFO] Checking pod health..."
POD_COUNT=$(kubectl get pods -n "$NAMESPACE" -l app=hdr-empire --field-selector=status.phase=Running -o json | jq '.items | length')

if [ "$POD_COUNT" -eq 0 ]; then
    echo "[ERROR] No running pods found"
    exit 1
fi

echo "[INFO] Found $POD_COUNT running pod(s)"

# Check each pod's readiness
READY_PODS=$(kubectl get pods -n "$NAMESPACE" -l app=hdr-empire -o jsonpath='{range .items[*]}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}' | grep -c "True" || echo "0")

echo "[INFO] Ready pods: $READY_PODS/$POD_COUNT"

if [ "$READY_PODS" -lt 1 ]; then
    echo "[ERROR] No ready pods found"
    exit 1
fi

# Check service endpoint
echo "[INFO] Checking service endpoint..."
SERVICE_IP=$(kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

if [ -z "$SERVICE_IP" ]; then
    echo "[WARN] LoadBalancer IP not available"
else
    echo "[INFO] Service IP: $SERVICE_IP"
    
    # Test health endpoint
    if curl -f -s "http://${SERVICE_IP}/health" > /dev/null; then
        echo "[SUCCESS] Health endpoint responding"
    else
        echo "[ERROR] Health endpoint not responding"
        exit 1
    fi
fi

# Check HPA status
echo "[INFO] Checking HPA status..."
kubectl get hpa -n "$NAMESPACE"

echo "[SUCCESS] All health checks passed!"
