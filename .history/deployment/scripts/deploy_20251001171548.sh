#!/bin/bash
# HDR Empire Framework - Deployment Script
# Copyright (c) 2025 Stephen Bilodeau - Patent Pending - All Rights Reserved
#
# Deploy HDR Empire Framework to Kubernetes cluster

set -e

# Configuration
NAMESPACE="${NAMESPACE:-hdr-system}"
ENVIRONMENT="${ENVIRONMENT:-production}"
VERSION="${VERSION:-latest}"
REGISTRY="${REGISTRY:-ghcr.io}"
IMAGE_NAME="${IMAGE_NAME:-hdr-empire}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

create_namespace() {
    log_info "Creating namespace: $NAMESPACE"
    kubectl apply -f k8s/namespace.yaml
}

deploy_secrets() {
    log_info "Deploying secrets..."
    
    if [ -f "k8s/secrets-${ENVIRONMENT}.yaml" ]; then
        kubectl apply -f "k8s/secrets-${ENVIRONMENT}.yaml"
    else
        log_warn "No environment-specific secrets found, using default"
        kubectl apply -f k8s/secrets.yaml
    fi
}

deploy_configmap() {
    log_info "Deploying ConfigMap..."
    kubectl apply -f k8s/configmap.yaml
}

deploy_pvc() {
    log_info "Deploying Persistent Volume Claims..."
    kubectl apply -f k8s/pvc.yaml
}

deploy_application() {
    log_info "Deploying HDR Empire application..."
    
    # Update image tag in deployment
    kubectl set image deployment/hdr-empire \
        hdr-empire="${REGISTRY}/${IMAGE_NAME}:${VERSION}" \
        -n "${NAMESPACE}" || true
    
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    kubectl apply -f k8s/hpa.yaml
}

wait_for_deployment() {
    log_info "Waiting for deployment to be ready..."
    kubectl rollout status deployment/hdr-empire -n "${NAMESPACE}" --timeout=5m
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check pod status
    READY_PODS=$(kubectl get pods -n "${NAMESPACE}" -l app=hdr-empire -o jsonpath='{.items[?(@.status.phase=="Running")].metadata.name}' | wc -w)
    
    if [ "$READY_PODS" -eq 0 ]; then
        log_error "No pods are running"
        kubectl get pods -n "${NAMESPACE}"
        exit 1
    fi
    
    log_info "Deployment verified: $READY_PODS pod(s) running"
    kubectl get pods -n "${NAMESPACE}" -l app=hdr-empire
}

run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # Get service endpoint
    SERVICE_IP=$(kubectl get service hdr-empire -n "${NAMESPACE}" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$SERVICE_IP" ]; then
        log_warn "LoadBalancer IP not available yet"
        return
    fi
    
    # Test health endpoint
    if curl -f "http://${SERVICE_IP}/health" &> /dev/null; then
        log_info "Health check passed"
    else
        log_error "Health check failed"
        exit 1
    fi
}

rollback() {
    log_warn "Rolling back deployment..."
    kubectl rollout undo deployment/hdr-empire -n "${NAMESPACE}"
    kubectl rollout status deployment/hdr-empire -n "${NAMESPACE}"
    log_info "Rollback completed"
}

# Main deployment flow
main() {
    log_info "Starting HDR Empire deployment to ${ENVIRONMENT}"
    log_info "Version: ${VERSION}"
    log_info "Namespace: ${NAMESPACE}"
    
    check_prerequisites
    create_namespace
    deploy_secrets
    deploy_configmap
    deploy_pvc
    deploy_application
    wait_for_deployment
    verify_deployment
    
    # Run smoke tests if not in dry-run mode
    if [ "${DRY_RUN}" != "true" ]; then
        run_smoke_tests
    fi
    
    log_info "Deployment completed successfully!"
}

# Handle errors
trap 'log_error "Deployment failed. Run with ROLLBACK=true to rollback."; exit 1' ERR

# Check if rollback is requested
if [ "${ROLLBACK}" = "true" ]; then
    rollback
    exit 0
fi

# Run main deployment
main
