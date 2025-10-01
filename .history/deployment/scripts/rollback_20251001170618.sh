#!/bin/bash
# HDR Empire Framework - Rollback Script
# Copyright (c) 2025 Stephen Bilodeau - Patent Pending

set -e

NAMESPACE="${NAMESPACE:-hdr-system}"
REVISION="${1:-0}"  # 0 means previous revision

echo "[INFO] Rolling back HDR Empire deployment in namespace: $NAMESPACE"

if [ "$REVISION" -eq 0 ]; then
    echo "[INFO] Rolling back to previous revision"
    kubectl rollout undo deployment/hdr-empire -n "$NAMESPACE"
else
    echo "[INFO] Rolling back to revision: $REVISION"
    kubectl rollout undo deployment/hdr-empire -n "$NAMESPACE" --to-revision="$REVISION"
fi

echo "[INFO] Waiting for rollback to complete..."
kubectl rollout status deployment/hdr-empire -n "$NAMESPACE" --timeout=5m

echo "[INFO] Verifying rollback..."
kubectl get pods -n "$NAMESPACE" -l app=hdr-empire

echo "[SUCCESS] Rollback completed successfully"
