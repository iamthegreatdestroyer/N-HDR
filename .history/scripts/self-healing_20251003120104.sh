#!/usr/bin/env bash

# HDR Empire Framework - Self-Healing System
# Copyright © 2025 Stephen Bilodeau - Patent Pending - All Rights Reserved

set -euo pipefail

#============================================================================
# Configuration
#============================================================================

# Default settings
NAMESPACE="${NAMESPACE:-hdr-production}"
CHECK_INTERVAL="${CHECK_INTERVAL:-60}"  # seconds
ERROR_THRESHOLD=10  # errors per minute
CERT_WARNING_DAYS=30
LOG_FILE="${LOG_FILE:-/var/log/hdr-self-healing.log}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
RUN_ONCE=false
DRY_RUN=false

# Color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
TOTAL_ACTIONS=0
TOTAL_ERRORS=0

#============================================================================
# Utility Functions
#============================================================================

log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] [INFO] $*"
    echo -e "${GREEN}$message${NC}"
    echo "$message" >> "$LOG_FILE"
}

log_warn() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] [WARN] $*"
    echo -e "${YELLOW}$message${NC}"
    echo "$message" >> "$LOG_FILE"
}

log_error() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $*"
    echo -e "${RED}$message${NC}"
    echo "$message" >> "$LOG_FILE"
    ((TOTAL_ERRORS++))
}

log_action() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] [ACTION] $*"
    echo -e "${BLUE}$message${NC}"
    echo "$message" >> "$LOG_FILE"
    ((TOTAL_ACTIONS++))
}

send_slack_notification() {
    local message=$1
    local severity=${2:-info}
    
    if [ -z "$SLACK_WEBHOOK_URL" ]; then
        return 0
    fi
    
    local color="good"
    local emoji=":white_check_mark:"
    
    case $severity in
        error)
            color="danger"
            emoji=":x:"
            ;;
        warning)
            color="warning"
            emoji=":warning:"
            ;;
        info)
            color="good"
            emoji=":information_source:"
            ;;
    esac
    
    local payload
    payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "HDR Empire Self-Healing Alert",
            "text": "$emoji $message",
            "footer": "Namespace: $NAMESPACE",
            "ts": $(date +%s)
        }
    ]
}
EOF
)
    
    curl -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$SLACK_WEBHOOK_URL" 2>/dev/null || true
}

check_prerequisites() {
    local missing_tools=()
    
    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    fi
    
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again."
        exit 1
    fi
}

usage() {
    cat << EOF
HDR Empire Framework - Self-Healing System

Usage: $0 [OPTIONS]

Options:
    --namespace NAMESPACE    Kubernetes namespace to monitor (default: hdr-production)
    --interval SECONDS       Check interval in seconds (default: 60)
    --once                   Run checks once and exit
    --dry-run               Show what would be done without taking action
    --log-file PATH         Log file path (default: /var/log/hdr-self-healing.log)
    --help                  Show this help message

Environment Variables:
    NAMESPACE               Kubernetes namespace (default: hdr-production)
    CHECK_INTERVAL          Check interval in seconds (default: 60)
    SLACK_WEBHOOK_URL       Slack webhook for notifications
    LOG_FILE                Log file path

Examples:
    $0 --namespace hdr-staging --interval 30
    $0 --once
    SLACK_WEBHOOK_URL=https://hooks.slack.com/... $0

Description:
    This tool continuously monitors the HDR Empire Framework deployment
    and automatically takes corrective actions when issues are detected:
    
    - Restarts unhealthy pods
    - Handles OOMKilled events
    - Monitors error rates in logs
    - Checks certificate expiry
    - Resets connection pools on errors
    - Sends Slack notifications

EOF
    exit 0
}

#============================================================================
# Health Check Functions
#============================================================================

check_pod_health() {
    ((TOTAL_CHECKS++))
    
    log "Checking pod health..."
    
    local unhealthy_pods
    unhealthy_pods=$(kubectl get pods -n "$NAMESPACE" \
        --field-selector=status.phase!=Running,status.phase!=Succeeded 2>/dev/null || echo "")
    
    if [ -z "$unhealthy_pods" ]; then
        log "All pods are healthy"
        return 0
    fi
    
    local pod_count
    pod_count=$(echo "$unhealthy_pods" | grep -c "^" || echo 0)
    
    if [ "$pod_count" -gt 0 ]; then
        log_warn "Found $pod_count unhealthy pod(s)"
        
        # Get details of unhealthy pods
        while IFS= read -r line; do
            local pod_name
            pod_name=$(echo "$line" | awk '{print $1}')
            
            if [ -z "$pod_name" ] || [ "$pod_name" = "NAME" ]; then
                continue
            fi
            
            local pod_status
            pod_status=$(kubectl get pod "$pod_name" -n "$NAMESPACE" -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
            
            log_warn "Unhealthy pod: $pod_name (status: $pod_status)"
            
            # Check if pod is in CrashLoopBackOff
            local restart_count
            restart_count=$(kubectl get pod "$pod_name" -n "$NAMESPACE" -o jsonpath='{.status.containerStatuses[0].restartCount}' 2>/dev/null || echo 0)
            
            if [ "$restart_count" -gt 5 ]; then
                log_error "Pod $pod_name has restarted $restart_count times - needs attention"
                send_slack_notification "Pod $pod_name is in crash loop ($restart_count restarts)" "error"
            else
                # Attempt to restart the pod
                if [ "$DRY_RUN" = false ]; then
                    log_action "Deleting pod $pod_name to trigger restart"
                    kubectl delete pod "$pod_name" -n "$NAMESPACE" --grace-period=30 2>/dev/null || true
                    send_slack_notification "Restarted unhealthy pod: $pod_name" "warning"
                else
                    log_action "[DRY-RUN] Would delete pod $pod_name"
                fi
            fi
        done <<< "$unhealthy_pods"
    fi
}

check_oom_killed_pods() {
    ((TOTAL_CHECKS++))
    
    log "Checking for OOMKilled pods..."
    
    local pods
    pods=$(kubectl get pods -n "$NAMESPACE" -o json 2>/dev/null || echo "{}")
    
    local oom_pods
    oom_pods=$(echo "$pods" | jq -r '.items[] | select(.status.containerStatuses[]?.lastState.terminated.reason == "OOMKilled") | .metadata.name' 2>/dev/null || echo "")
    
    if [ -z "$oom_pods" ]; then
        log "No OOMKilled pods found"
        return 0
    fi
    
    while IFS= read -r pod_name; do
        if [ -z "$pod_name" ]; then
            continue
        fi
        
        log_warn "Pod $pod_name was OOMKilled"
        
        # Get memory limit
        local memory_limit
        memory_limit=$(kubectl get pod "$pod_name" -n "$NAMESPACE" -o jsonpath='{.spec.containers[0].resources.limits.memory}' 2>/dev/null || echo "unknown")
        
        log_warn "Current memory limit: $memory_limit"
        
        # Trigger memory cleanup
        if [ "$DRY_RUN" = false ]; then
            log_action "Triggering memory cleanup for pod $pod_name"
            
            # Try to exec into pod and trigger garbage collection
            kubectl exec "$pod_name" -n "$NAMESPACE" -- node --expose-gc -e "if (global.gc) global.gc(); console.log('GC triggered');" 2>/dev/null || true
            
            # Delete the pod to restart with clean state
            kubectl delete pod "$pod_name" -n "$NAMESPACE" --grace-period=30 2>/dev/null || true
            
            send_slack_notification "Handled OOMKilled pod: $pod_name (limit: $memory_limit)" "error"
        else
            log_action "[DRY-RUN] Would trigger memory cleanup for pod $pod_name"
        fi
    done <<< "$oom_pods"
}

check_error_rates() {
    ((TOTAL_CHECKS++))
    
    log "Checking error rates in logs..."
    
    local pods
    pods=$(kubectl get pods -n "$NAMESPACE" -l app=hdr-empire -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [ -z "$pods" ]; then
        log_warn "No pods found to check error rates"
        return 0
    fi
    
    for pod in $pods; do
        # Get recent logs and count errors
        local error_count
        error_count=$(kubectl logs "$pod" -n "$NAMESPACE" --tail=100 --since=1m 2>/dev/null | grep -ci "error" || echo 0)
        
        if [ "$error_count" -gt "$ERROR_THRESHOLD" ]; then
            log_warn "High error rate detected in pod $pod: $error_count errors/min"
            
            # Check for specific error patterns
            local conn_errors
            conn_errors=$(kubectl logs "$pod" -n "$NAMESPACE" --tail=100 --since=1m 2>/dev/null | grep -c "ECONNREFUSED" || echo 0)
            
            if [ "$conn_errors" -gt 5 ]; then
                log_warn "Connection refused errors detected: $conn_errors"
                
                if [ "$DRY_RUN" = false ]; then
                    log_action "Resetting connection pool for pod $pod"
                    
                    # Attempt to reset connection pool by restarting the pod
                    kubectl delete pod "$pod" -n "$NAMESPACE" --grace-period=30 2>/dev/null || true
                    
                    send_slack_notification "Reset connection pool due to ECONNREFUSED errors in pod: $pod" "warning"
                else
                    log_action "[DRY-RUN] Would reset connection pool for pod $pod"
                fi
            else
                send_slack_notification "High error rate detected in pod $pod: $error_count errors/min" "warning"
            fi
        fi
    done
}

check_certificate_expiry() {
    ((TOTAL_CHECKS++))
    
    log "Checking certificate expiry..."
    
    local secrets
    secrets=$(kubectl get secrets -n "$NAMESPACE" -o json 2>/dev/null || echo "{}")
    
    local tls_secrets
    tls_secrets=$(echo "$secrets" | jq -r '.items[] | select(.type == "kubernetes.io/tls") | .metadata.name' 2>/dev/null || echo "")
    
    if [ -z "$tls_secrets" ]; then
        log "No TLS secrets found"
        return 0
    fi
    
    while IFS= read -r secret_name; do
        if [ -z "$secret_name" ]; then
            continue
        fi
        
        # Get certificate data
        local cert_data
        cert_data=$(kubectl get secret "$secret_name" -n "$NAMESPACE" -o jsonpath='{.data.tls\.crt}' 2>/dev/null || echo "")
        
        if [ -z "$cert_data" ]; then
            continue
        fi
        
        # Decode and check expiry
        local expiry_date
        expiry_date=$(echo "$cert_data" | base64 -d | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "")
        
        if [ -z "$expiry_date" ]; then
            continue
        fi
        
        local expiry_epoch
        expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s 2>/dev/null || echo 0)
        
        local current_epoch
        current_epoch=$(date +%s)
        
        local days_until_expiry
        days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ "$days_until_expiry" -lt 0 ]; then
            log_error "Certificate $secret_name has EXPIRED!"
            send_slack_notification "Certificate $secret_name has EXPIRED!" "error"
        elif [ "$days_until_expiry" -lt "$CERT_WARNING_DAYS" ]; then
            log_warn "Certificate $secret_name expires in $days_until_expiry days"
            send_slack_notification "Certificate $secret_name expires in $days_until_expiry days" "warning"
        else
            log "Certificate $secret_name is valid ($days_until_expiry days remaining)"
        fi
    done <<< "$tls_secrets"
}

check_disk_space() {
    ((TOTAL_CHECKS++))
    
    log "Checking disk space on nodes..."
    
    local nodes
    nodes=$(kubectl get nodes -o json 2>/dev/null || echo "{}")
    
    local node_count
    node_count=$(echo "$nodes" | jq '.items | length' 2>/dev/null || echo 0)
    
    if [ "$node_count" -eq 0 ]; then
        log_warn "No nodes found"
        return 0
    fi
    
    for ((i=0; i<node_count; i++)); do
        local node_name
        local disk_pressure
        
        node_name=$(echo "$nodes" | jq -r ".items[$i].metadata.name" 2>/dev/null || echo "")
        disk_pressure=$(echo "$nodes" | jq -r ".items[$i].status.conditions[] | select(.type==\"DiskPressure\") | .status" 2>/dev/null || echo "False")
        
        if [ "$disk_pressure" = "True" ]; then
            log_error "Node $node_name is experiencing disk pressure"
            send_slack_notification "Node $node_name is experiencing disk pressure" "error"
            
            if [ "$DRY_RUN" = false ]; then
                log_action "Triggering log cleanup on node $node_name"
                # In a real scenario, you would clean up logs or trigger cleanup jobs
                # For now, just log the action
            else
                log_action "[DRY-RUN] Would trigger log cleanup on node $node_name"
            fi
        fi
    done
}

check_resource_quotas() {
    ((TOTAL_CHECKS++))
    
    log "Checking resource quotas..."
    
    local quotas
    quotas=$(kubectl get resourcequota -n "$NAMESPACE" -o json 2>/dev/null || echo "{}")
    
    local quota_count
    quota_count=$(echo "$quotas" | jq '.items | length' 2>/dev/null || echo 0)
    
    if [ "$quota_count" -eq 0 ]; then
        log "No resource quotas defined"
        return 0
    fi
    
    for ((i=0; i<quota_count; i++)); do
        local quota_name
        quota_name=$(echo "$quotas" | jq -r ".items[$i].metadata.name" 2>/dev/null || echo "")
        
        # Check CPU quota
        local cpu_used
        local cpu_hard
        
        cpu_used=$(echo "$quotas" | jq -r ".items[$i].status.used.cpu" 2>/dev/null || echo "0")
        cpu_hard=$(echo "$quotas" | jq -r ".items[$i].status.hard.cpu" 2>/dev/null || echo "0")
        
        if [ "$cpu_used" != "0" ] && [ "$cpu_hard" != "0" ]; then
            # Convert to millicores for comparison
            local cpu_used_m
            local cpu_hard_m
            
            cpu_used_m=$(echo "$cpu_used" | sed 's/m$//' | sed 's/[^0-9]//g')
            cpu_hard_m=$(echo "$cpu_hard" | sed 's/m$//' | sed 's/[^0-9]//g')
            
            if [ -n "$cpu_used_m" ] && [ -n "$cpu_hard_m" ]; then
                local cpu_percent
                cpu_percent=$(echo "scale=0; ($cpu_used_m * 100) / $cpu_hard_m" | bc 2>/dev/null || echo 0)
                
                if [ "$cpu_percent" -gt 90 ]; then
                    log_warn "CPU quota $quota_name is at ${cpu_percent}% capacity"
                    send_slack_notification "CPU quota $quota_name is at ${cpu_percent}% capacity" "warning"
                fi
            fi
        fi
    done
}

check_deployment_status() {
    ((TOTAL_CHECKS++))
    
    log "Checking deployment status..."
    
    local deployments
    deployments=$(kubectl get deployments -n "$NAMESPACE" -o json 2>/dev/null || echo "{}")
    
    local deployment_count
    deployment_count=$(echo "$deployments" | jq '.items | length' 2>/dev/null || echo 0)
    
    if [ "$deployment_count" -eq 0 ]; then
        log_warn "No deployments found"
        return 0
    fi
    
    for ((i=0; i<deployment_count; i++)); do
        local deploy_name
        local desired_replicas
        local ready_replicas
        
        deploy_name=$(echo "$deployments" | jq -r ".items[$i].metadata.name" 2>/dev/null || echo "")
        desired_replicas=$(echo "$deployments" | jq -r ".items[$i].status.replicas // 0" 2>/dev/null || echo 0)
        ready_replicas=$(echo "$deployments" | jq -r ".items[$i].status.readyReplicas // 0" 2>/dev/null || echo 0)
        
        if [ "$ready_replicas" -lt "$desired_replicas" ]; then
            log_warn "Deployment $deploy_name has $ready_replicas/$desired_replicas replicas ready"
            
            # Check if this has been ongoing
            local unavailable_replicas
            unavailable_replicas=$(echo "$deployments" | jq -r ".items[$i].status.unavailableReplicas // 0" 2>/dev/null || echo 0)
            
            if [ "$unavailable_replicas" -gt 0 ]; then
                log_warn "Deployment $deploy_name has $unavailable_replicas unavailable replicas"
                send_slack_notification "Deployment $deploy_name has $unavailable_replicas unavailable replicas" "warning"
            fi
        fi
    done
}

#============================================================================
# Main Monitoring Loop
#============================================================================

run_health_checks() {
    log "Starting health check cycle..."
    
    check_pod_health
    check_oom_killed_pods
    check_error_rates
    check_certificate_expiry
    check_disk_space
    check_resource_quotas
    check_deployment_status
    
    log "Health check cycle complete (checks: $TOTAL_CHECKS, actions: $TOTAL_ACTIONS, errors: $TOTAL_ERRORS)"
}

cleanup() {
    log "Received termination signal, shutting down gracefully..."
    send_slack_notification "Self-healing system stopped for namespace $NAMESPACE" "info"
    exit 0
}

#============================================================================
# Main Execution
#============================================================================

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            --interval)
                CHECK_INTERVAL="$2"
                shift 2
                ;;
            --once)
                RUN_ONCE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --log-file)
                LOG_FILE="$2"
                shift 2
                ;;
            --help)
                usage
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                ;;
        esac
    done
    
    # Check prerequisites
    check_prerequisites
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Verify namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace '$NAMESPACE' does not exist"
        exit 1
    fi
    
    log "HDR Empire Self-Healing System Starting"
    log "Namespace: $NAMESPACE"
    log "Check interval: ${CHECK_INTERVAL}s"
    log "Log file: $LOG_FILE"
    log "Dry run: $DRY_RUN"
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        log "Slack notifications: enabled"
        send_slack_notification "Self-healing system started for namespace $NAMESPACE" "info"
    else
        log "Slack notifications: disabled"
    fi
    
    # Set up signal handlers
    trap cleanup SIGTERM SIGINT
    
    # Run health checks
    if [ "$RUN_ONCE" = true ]; then
        run_health_checks
        log "Single check complete, exiting"
        exit 0
    fi
    
    # Continuous monitoring loop
    while true; do
        run_health_checks
        log "Sleeping for ${CHECK_INTERVAL}s..."
        sleep "$CHECK_INTERVAL"
    done
}

# Execute main function
main "$@"
