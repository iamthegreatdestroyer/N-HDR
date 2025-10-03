#!/usr/bin/env bash

# HDR Empire Framework - Smoke Tests
# Copyright © 2025 Stephen Bilodeau - Patent Pending - All Rights Reserved

set -euo pipefail

#============================================================================
# Configuration
#============================================================================

NAMESPACE="${NAMESPACE:-hdr-production}"
ENVIRONMENT="${ENVIRONMENT:-production}"
RESPONSE_TIME_THRESHOLD=200  # milliseconds

# Color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

#============================================================================
# Utility Functions
#============================================================================

log() {
    echo -e "${GREEN}[INFO]${NC} $*"
}

log_test() {
    echo -e "${BLUE}[TEST]${NC} $*"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $*"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $*"
    ((TESTS_FAILED++))
}

check_prerequisites() {
    local missing_tools=()
    
    for tool in kubectl jq curl bc; do
        if ! command -v $tool &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo "Missing tools: ${missing_tools[*]}"
        exit 1
    fi
}

#============================================================================
# Test Functions
#============================================================================

test_deployment_status() {
    ((TESTS_TOTAL++))
    log_test "Test 1: Checking deployment status..."
    
    local deployment
    deployment=$(kubectl get deployment -n "$NAMESPACE" -o json 2>/dev/null)
    
    if [ -z "$deployment" ]; then
        log_fail "No deployments found"
        return 1
    fi
    
    local ready
    ready=$(echo "$deployment" | jq -r '.items[0].status.conditions[] | select(.type=="Available") | .status')
    
    if [ "$ready" = "True" ]; then
        log_pass "Deployment is available"
        return 0
    else
        log_fail "Deployment is not available"
        return 1
    fi
}

test_pod_health() {
    ((TESTS_TOTAL++))
    log_test "Test 2: Checking pod health..."
    
    local pods
    pods=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase=Running 2>/dev/null | grep -c "Running" || echo 0)
    
    if [ "$pods" -gt 0 ]; then
        log_pass "$pods pod(s) running"
        return 0
    else
        log_fail "No running pods found"
        return 1
    fi
}

test_liveness_probe() {
    ((TESTS_TOTAL++))
    log_test "Test 3: Checking liveness probe..."
    
    local pod
    pod=$(kubectl get pods -n "$NAMESPACE" -l app=hdr-empire -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$pod" ]; then
        log_fail "No pod found"
        return 1
    fi
    
    if kubectl exec "$pod" -n "$NAMESPACE" -- wget -q -O- http://localhost:3000/health/live &>/dev/null; then
        log_pass "Liveness probe responding"
        return 0
    else
        log_fail "Liveness probe failed"
        return 1
    fi
}

test_readiness_probe() {
    ((TESTS_TOTAL++))
    log_test "Test 4: Checking readiness probe..."
    
    local pod
    pod=$(kubectl get pods -n "$NAMESPACE" -l app=hdr-empire -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$pod" ]; then
        log_fail "No pod found"
        return 1
    fi
    
    if kubectl exec "$pod" -n "$NAMESPACE" -- wget -q -O- http://localhost:3000/health/ready &>/dev/null; then
        log_pass "Readiness probe responding"
        return 0
    else
        log_fail "Readiness probe failed"
        return 1
    fi
}

test_api_endpoints() {
    ((TESTS_TOTAL++))
    log_test "Test 5: Checking API endpoints..."
    
    local service_ip
    service_ip=$(kubectl get svc -n "$NAMESPACE" hdr-empire -o jsonpath='{.spec.clusterIP}' 2>/dev/null)
    
    if [ -z "$service_ip" ]; then
        log_fail "Service not found"
        return 1
    fi
    
    # Port forward for testing
    kubectl port-forward -n "$NAMESPACE" svc/hdr-empire 8080:80 &>/dev/null &
    local PF_PID=$!
    sleep 2
    
    if curl -s -f http://localhost:8080/ &>/dev/null; then
        log_pass "API endpoint responding"
        kill $PF_PID 2>/dev/null || true
        return 0
    else
        log_fail "API endpoint not responding"
        kill $PF_PID 2>/dev/null || true
        return 1
    fi
}

test_service_connectivity() {
    ((TESTS_TOTAL++))
    log_test "Test 6: Checking service connectivity..."
    
    local svc
    svc=$(kubectl get svc -n "$NAMESPACE" hdr-empire 2>/dev/null)
    
    if [ -n "$svc" ]; then
        log_pass "Service exists and is accessible"
        return 0
    else
        log_fail "Service not found"
        return 1
    fi
}

test_ingress_config() {
    ((TESTS_TOTAL++))
    log_test "Test 7: Checking ingress configuration..."
    
    local ingress
    ingress=$(kubectl get ingress -n "$NAMESPACE" 2>/dev/null)
    
    if [ -n "$ingress" ]; then
        log_pass "Ingress configured"
        return 0
    else
        log_fail "Ingress not found"
        return 1
    fi
}

test_hpa_status() {
    ((TESTS_TOTAL++))
    log_test "Test 8: Checking HPA status..."
    
    local hpa
    hpa=$(kubectl get hpa -n "$NAMESPACE" 2>/dev/null)
    
    if [ -n "$hpa" ]; then
        log_pass "HPA configured"
        return 0
    else
        log_fail "HPA not found"
        return 1
    fi
}

test_monitoring_stack() {
    ((TESTS_TOTAL++))
    log_test "Test 9: Checking monitoring stack..."
    
    local jaeger
    local loki
    
    jaeger=$(kubectl get pods -n monitoring -l app=jaeger 2>/dev/null | grep -c "Running" || echo 0)
    loki=$(kubectl get pods -n monitoring -l app=loki 2>/dev/null | grep -c "Running" || echo 0)
    
    if [ "$jaeger" -gt 0 ] && [ "$loki" -gt 0 ]; then
        log_pass "Monitoring stack running (Jaeger: $jaeger, Loki: $loki)"
        return 0
    else
        log_fail "Monitoring stack incomplete"
        return 1
    fi
}

test_resource_limits() {
    ((TESTS_TOTAL++))
    log_test "Test 10: Checking resource limits..."
    
    local pod
    pod=$(kubectl get pods -n "$NAMESPACE" -l app=hdr-empire -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -z "$pod" ]; then
        log_fail "No pod found"
        return 1
    fi
    
    local cpu_limit
    local mem_limit
    
    cpu_limit=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.spec.containers[0].resources.limits.cpu}' 2>/dev/null)
    mem_limit=$(kubectl get pod "$pod" -n "$NAMESPACE" -o jsonpath='{.spec.containers[0].resources.limits.memory}' 2>/dev/null)
    
    if [ -n "$cpu_limit" ] && [ -n "$mem_limit" ]; then
        log_pass "Resource limits configured (CPU: $cpu_limit, Memory: $mem_limit)"
        return 0
    else
        log_fail "Resource limits not properly configured"
        return 1
    fi
}

test_secrets_exist() {
    ((TESTS_TOTAL++))
    log_test "Test 11: Checking secrets..."
    
    if kubectl get secret hdr-secrets -n "$NAMESPACE" &>/dev/null; then
        log_pass "Required secrets exist"
        return 0
    else
        log_fail "Required secrets not found"
        return 1
    fi
}

test_performance_baseline() {
    ((TESTS_TOTAL++))
    log_test "Test 12: Checking performance baseline..."
    
    kubectl port-forward -n "$NAMESPACE" svc/hdr-empire 8080:80 &>/dev/null &
    local PF_PID=$!
    sleep 2
    
    local start_time
    local end_time
    local response_time
    
    start_time=$(date +%s%3N)
    curl -s -f http://localhost:8080/ &>/dev/null || true
    end_time=$(date +%s%3N)
    
    response_time=$((end_time - start_time))
    
    kill $PF_PID 2>/dev/null || true
    
    if [ "$response_time" -lt "$RESPONSE_TIME_THRESHOLD" ]; then
        log_pass "Performance baseline met (${response_time}ms < ${RESPONSE_TIME_THRESHOLD}ms)"
        return 0
    else
        log_fail "Performance baseline not met (${response_time}ms >= ${RESPONSE_TIME_THRESHOLD}ms)"
        return 1
    fi
}

#============================================================================
# Main Execution
#============================================================================

main() {
    check_prerequisites
    
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         HDR Empire Framework - Smoke Tests                    ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Namespace: $NAMESPACE"
    echo ""
    
    # Run all tests
    test_deployment_status
    test_pod_health
    test_liveness_probe
    test_readiness_probe
    test_api_endpoints
    test_service_connectivity
    test_ingress_config
    test_hpa_status
    test_monitoring_stack
    test_resource_limits
    test_secrets_exist
    test_performance_baseline
    
    # Calculate pass rate
    local pass_rate
    pass_rate=$(echo "scale=2; ($TESTS_PASSED / $TESTS_TOTAL) * 100" | bc)
    
    # Generate JSON results
    local results_dir="test-results/smoke-tests"
    mkdir -p "$results_dir"
    
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)
    local results_file="$results_dir/results-$ENVIRONMENT-$timestamp.json"
    
    cat > "$results_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "environment": "$ENVIRONMENT",
  "namespace": "$NAMESPACE",
  "total_tests": $TESTS_TOTAL,
  "passed": $TESTS_PASSED,
  "failed": $TESTS_FAILED,
  "pass_rate": $pass_rate,
  "status": "$([ "$TESTS_FAILED" -eq 0 ] && echo "success" || echo "failure")"
}
EOF
    
    # Display summary
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Test Summary${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo "Total Tests: $TESTS_TOTAL"
    echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
    echo "Pass Rate: ${pass_rate}%"
    echo "Results: $results_file"
    echo ""
    
    if [ "$TESTS_FAILED" -eq 0 ]; then
        echo -e "${GREEN}✅ All smoke tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some smoke tests failed${NC}"
        exit 1
    fi
}

main "$@"
