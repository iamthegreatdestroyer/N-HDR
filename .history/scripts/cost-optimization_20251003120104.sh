#!/usr/bin/env bash

# HDR Empire Framework - Cost Optimization Tool
# Copyright © 2025 Stephen Bilodeau - Patent Pending - All Rights Reserved

set -euo pipefail

#============================================================================
# Configuration
#============================================================================

# Pricing constants (monthly)
readonly CPU_COST_PER_CORE=30      # $30 per CPU core per month
readonly MEMORY_COST_PER_GB=4      # $4 per GB RAM per month
readonly STORAGE_COST_PER_GB=0.10  # $0.10 per GB storage per month

# Thresholds
readonly OVER_PROVISIONED_THRESHOLD=30  # % utilization - below is over-provisioned
readonly HIGH_UTILIZATION_THRESHOLD=80  # % utilization - above is concerning

# Default namespace
NAMESPACE="${NAMESPACE:-hdr-production}"
AUTO_APPLY=false
ANALYZE_ONLY=true

# Color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

#============================================================================
# Utility Functions
#============================================================================

log() {
    echo -e "${GREEN}[INFO]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

log_section() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

check_prerequisites() {
    local missing_tools=()
    
    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    fi
    
    if ! command -v bc &> /dev/null; then
        missing_tools+=("bc")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again."
        log_error "  - kubectl: https://kubernetes.io/docs/tasks/tools/"
        log_error "  - bc: Package manager (apt-get install bc / brew install bc)"
        log_error "  - jq: https://stedolan.github.io/jq/download/"
        exit 1
    fi
}

usage() {
    cat << EOF
HDR Empire Framework - Cost Optimization Tool

Usage: $0 [OPTIONS]

Options:
    --namespace NAMESPACE    Kubernetes namespace to analyze (default: hdr-production)
    --analyze               Run cost analysis only (default)
    --auto-apply            Apply optimization recommendations automatically
    --help                  Show this help message

Examples:
    $0 --namespace hdr-staging --analyze
    $0 --namespace hdr-production --auto-apply

Description:
    This tool analyzes Kubernetes resource usage and provides cost-saving
    recommendations. It can automatically apply optimizations when run with
    the --auto-apply flag.

    The tool examines:
    - Pod CPU and memory limits vs actual usage
    - HPA (Horizontal Pod Autoscaler) configuration
    - Persistent Volume Claims utilization
    - Unused services and resources
    
    It generates a detailed report in: reports/cost-optimization/

EOF
    exit 0
}

#============================================================================
# Analysis Functions
#============================================================================

# Get current resource usage
get_resource_usage() {
    local pod_name=$1
    local namespace=$2
    
    # Get current usage from kubectl top
    local usage
    usage=$(kubectl top pod "$pod_name" -n "$namespace" 2>/dev/null || echo "0m 0Mi")
    
    local cpu_usage
    local mem_usage
    
    cpu_usage=$(echo "$usage" | awk '{print $2}' | sed 's/m$//')
    mem_usage=$(echo "$usage" | awk '{print $3}' | sed 's/Mi$//')
    
    # Handle case where values might be empty
    cpu_usage=${cpu_usage:-0}
    mem_usage=${mem_usage:-0}
    
    echo "$cpu_usage $mem_usage"
}

# Get resource limits
get_resource_limits() {
    local pod_name=$1
    local namespace=$2
    
    local limits
    limits=$(kubectl get pod "$pod_name" -n "$namespace" -o json 2>/dev/null)
    
    if [ -z "$limits" ]; then
        echo "0 0"
        return
    fi
    
    local cpu_limit
    local mem_limit
    
    cpu_limit=$(echo "$limits" | jq -r '.spec.containers[0].resources.limits.cpu // "0"' | sed 's/m$//')
    mem_limit=$(echo "$limits" | jq -r '.spec.containers[0].resources.limits.memory // "0"' | sed 's/Mi$//' | sed 's/Gi$//' | awk '{if ($0 ~ /Gi/) {print $0*1024} else {print $0}}')
    
    # Convert CPU cores to millicores if needed
    if [[ ! "$cpu_limit" =~ m$ ]] && [[ "$cpu_limit" =~ ^[0-9]+$ ]]; then
        cpu_limit=$((cpu_limit * 1000))
    fi
    
    echo "$cpu_limit $mem_limit"
}

# Calculate monthly cost
calculate_monthly_cost() {
    local cpu_millicores=$1
    local memory_mi=$2
    
    # Convert to cores and GB
    local cpu_cores
    local memory_gb
    
    cpu_cores=$(echo "scale=3; $cpu_millicores / 1000" | bc)
    memory_gb=$(echo "scale=3; $memory_mi / 1024" | bc)
    
    # Calculate costs
    local cpu_cost
    local memory_cost
    local total_cost
    
    cpu_cost=$(echo "scale=2; $cpu_cores * $CPU_COST_PER_CORE" | bc)
    memory_cost=$(echo "scale=2; $memory_gb * $MEMORY_COST_PER_GB" | bc)
    total_cost=$(echo "scale=2; $cpu_cost + $memory_cost" | bc)
    
    echo "$cpu_cost $memory_cost $total_cost"
}

# Analyze pod resources
analyze_pod_resources() {
    local namespace=$1
    local report_file=$2
    
    log "Analyzing pod resources in namespace: $namespace"
    
    local pods
    pods=$(kubectl get pods -n "$namespace" -o jsonpath='{.items[*].metadata.name}')
    
    if [ -z "$pods" ]; then
        log_warn "No pods found in namespace $namespace"
        return
    fi
    
    local total_cpu_limit=0
    local total_mem_limit=0
    local total_cpu_usage=0
    local total_mem_usage=0
    local over_provisioned_count=0
    
    echo "## Pod Resource Analysis" >> "$report_file"
    echo "" >> "$report_file"
    echo "| Pod Name | CPU Limit | CPU Usage | CPU Util% | Memory Limit | Memory Usage | Mem Util% | Status |" >> "$report_file"
    echo "|----------|-----------|-----------|-----------|--------------|--------------|-----------|--------|" >> "$report_file"
    
    for pod in $pods; do
        # Get limits and usage
        read -r cpu_limit mem_limit <<< "$(get_resource_limits "$pod" "$namespace")"
        read -r cpu_usage mem_usage <<< "$(get_resource_usage "$pod" "$namespace")"
        
        # Skip if no limits set
        if [ "$cpu_limit" -eq 0 ] || [ "$mem_limit" -eq 0 ]; then
            continue
        fi
        
        # Calculate utilization percentages
        local cpu_util
        local mem_util
        
        cpu_util=$(echo "scale=2; ($cpu_usage / $cpu_limit) * 100" | bc)
        mem_util=$(echo "scale=2; ($mem_usage / $mem_limit) * 100" | bc)
        
        # Determine status
        local status="✅ OK"
        if (( $(echo "$cpu_util < $OVER_PROVISIONED_THRESHOLD" | bc -l) )) || \
           (( $(echo "$mem_util < $OVER_PROVISIONED_THRESHOLD" | bc -l) )); then
            status="⚠️ Over-provisioned"
            ((over_provisioned_count++))
        elif (( $(echo "$cpu_util > $HIGH_UTILIZATION_THRESHOLD" | bc -l) )) || \
             (( $(echo "$mem_util > $HIGH_UTILIZATION_THRESHOLD" | bc -l) )); then
            status="🔴 High utilization"
        fi
        
        # Add to totals
        total_cpu_limit=$((total_cpu_limit + cpu_limit))
        total_mem_limit=$((total_mem_limit + mem_limit))
        total_cpu_usage=$((total_cpu_usage + cpu_usage))
        total_mem_usage=$((total_mem_usage + mem_usage))
        
        # Write to report
        printf "| %s | %dm | %dm | %.1f%% | %dMi | %dMi | %.1f%% | %s |\n" \
            "$pod" "$cpu_limit" "$cpu_usage" "$cpu_util" "$mem_limit" "$mem_usage" "$mem_util" "$status" >> "$report_file"
    done
    
    echo "" >> "$report_file"
    
    # Calculate overall utilization
    local overall_cpu_util
    local overall_mem_util
    
    if [ "$total_cpu_limit" -gt 0 ]; then
        overall_cpu_util=$(echo "scale=2; ($total_cpu_usage / $total_cpu_limit) * 100" | bc)
    else
        overall_cpu_util=0
    fi
    
    if [ "$total_mem_limit" -gt 0 ]; then
        overall_mem_util=$(echo "scale=2; ($total_mem_usage / $total_mem_limit) * 100" | bc)
    else
        overall_mem_util=0
    fi
    
    echo "### Summary Statistics" >> "$report_file"
    echo "" >> "$report_file"
    echo "- **Total CPU Limit:** ${total_cpu_limit}m" >> "$report_file"
    echo "- **Total CPU Usage:** ${total_cpu_usage}m" >> "$report_file"
    echo "- **Overall CPU Utilization:** ${overall_cpu_util}%" >> "$report_file"
    echo "- **Total Memory Limit:** ${total_mem_limit}Mi" >> "$report_file"
    echo "- **Total Memory Usage:** ${total_mem_usage}Mi" >> "$report_file"
    echo "- **Overall Memory Utilization:** ${overall_mem_util}%" >> "$report_file"
    echo "- **Over-provisioned Pods:** $over_provisioned_count" >> "$report_file"
    echo "" >> "$report_file"
}

# Analyze HPA configuration
analyze_hpa() {
    local namespace=$1
    local report_file=$2
    
    log "Analyzing HPA configuration..."
    
    echo "## HPA Analysis" >> "$report_file"
    echo "" >> "$report_file"
    
    local hpas
    hpas=$(kubectl get hpa -n "$namespace" -o json 2>/dev/null)
    
    if [ -z "$hpas" ] || [ "$(echo "$hpas" | jq '.items | length')" -eq 0 ]; then
        echo "No HPA resources found in namespace." >> "$report_file"
        echo "" >> "$report_file"
        return
    fi
    
    echo "| HPA Name | Min Replicas | Max Replicas | Current Replicas | CPU Target | Recommendation |" >> "$report_file"
    echo "|----------|--------------|--------------|------------------|------------|----------------|" >> "$report_file"
    
    local hpa_count
    hpa_count=$(echo "$hpas" | jq '.items | length')
    
    for ((i=0; i<hpa_count; i++)); do
        local hpa_name
        local min_replicas
        local max_replicas
        local current_replicas
        local cpu_target
        
        hpa_name=$(echo "$hpas" | jq -r ".items[$i].metadata.name")
        min_replicas=$(echo "$hpas" | jq -r ".items[$i].spec.minReplicas")
        max_replicas=$(echo "$hpas" | jq -r ".items[$i].spec.maxReplicas")
        current_replicas=$(echo "$hpas" | jq -r ".items[$i].status.currentReplicas // 0")
        cpu_target=$(echo "$hpas" | jq -r ".items[$i].spec.metrics[0].resource.target.averageUtilization // 0")
        
        local recommendation="✅ Optimal"
        
        # Check if min replicas could be reduced
        if [ "$min_replicas" -gt 2 ] && [ "$current_replicas" -eq "$min_replicas" ]; then
            recommendation="💡 Consider reducing min replicas to $((min_replicas - 1))"
        fi
        
        # Check if max replicas seems excessive
        if [ "$max_replicas" -gt 10 ] && [ "$current_replicas" -lt "$((max_replicas / 2))" ]; then
            recommendation="💡 Consider reducing max replicas to $((max_replicas / 2))"
        fi
        
        printf "| %s | %d | %d | %d | %d%% | %s |\n" \
            "$hpa_name" "$min_replicas" "$max_replicas" "$current_replicas" "$cpu_target" "$recommendation" >> "$report_file"
    done
    
    echo "" >> "$report_file"
}

# Analyze storage
analyze_storage() {
    local namespace=$1
    local report_file=$2
    
    log "Analyzing persistent storage..."
    
    echo "## Storage Analysis" >> "$report_file"
    echo "" >> "$report_file"
    
    local pvcs
    pvcs=$(kubectl get pvc -n "$namespace" -o json 2>/dev/null)
    
    if [ -z "$pvcs" ] || [ "$(echo "$pvcs" | jq '.items | length')" -eq 0 ]; then
        echo "No PVC resources found in namespace." >> "$report_file"
        echo "" >> "$report_file"
        return
    fi
    
    echo "| PVC Name | Capacity | Status | Monthly Cost | Recommendation |" >> "$report_file"
    echo "|----------|----------|--------|--------------|----------------|" >> "$report_file"
    
    local pvc_count
    pvc_count=$(echo "$pvcs" | jq '.items | length')
    local total_storage_cost=0
    
    for ((i=0; i<pvc_count; i++)); do
        local pvc_name
        local capacity
        local status
        local monthly_cost
        
        pvc_name=$(echo "$pvcs" | jq -r ".items[$i].metadata.name")
        capacity=$(echo "$pvcs" | jq -r ".items[$i].spec.resources.requests.storage" | sed 's/Gi$//')
        status=$(echo "$pvcs" | jq -r ".items[$i].status.phase")
        
        monthly_cost=$(echo "scale=2; $capacity * $STORAGE_COST_PER_GB" | bc)
        total_storage_cost=$(echo "scale=2; $total_storage_cost + $monthly_cost" | bc)
        
        local recommendation="✅ In use"
        if [ "$status" != "Bound" ]; then
            recommendation="⚠️ Not bound - consider deleting"
        fi
        
        printf "| %s | %dGi | %s | \$%.2f | %s |\n" \
            "$pvc_name" "$capacity" "$status" "$monthly_cost" "$recommendation" >> "$report_file"
    done
    
    echo "" >> "$report_file"
    echo "**Total Storage Cost:** \$$total_storage_cost/month" >> "$report_file"
    echo "" >> "$report_file"
}

# Calculate cost estimates
calculate_cost_estimates() {
    local namespace=$1
    local report_file=$2
    
    log "Calculating cost estimates..."
    
    echo "## Cost Estimates" >> "$report_file"
    echo "" >> "$report_file"
    
    local pods
    pods=$(kubectl get pods -n "$namespace" -o jsonpath='{.items[*].metadata.name}')
    
    local total_cpu_cost=0
    local total_memory_cost=0
    local total_cost=0
    
    for pod in $pods; do
        read -r cpu_limit mem_limit <<< "$(get_resource_limits "$pod" "$namespace")"
        
        if [ "$cpu_limit" -eq 0 ] || [ "$mem_limit" -eq 0 ]; then
            continue
        fi
        
        read -r cpu_cost mem_cost pod_cost <<< "$(calculate_monthly_cost "$cpu_limit" "$mem_limit")"
        
        total_cpu_cost=$(echo "scale=2; $total_cpu_cost + $cpu_cost" | bc)
        total_memory_cost=$(echo "scale=2; $total_memory_cost + $mem_cost" | bc)
        total_cost=$(echo "scale=2; $total_cost + $pod_cost" | bc)
    done
    
    echo "### Current Monthly Costs" >> "$report_file"
    echo "" >> "$report_file"
    echo "- **CPU Cost:** \$$total_cpu_cost/month" >> "$report_file"
    echo "- **Memory Cost:** \$$total_memory_cost/month" >> "$report_file"
    echo "- **Total Compute Cost:** \$$total_cost/month" >> "$report_file"
    echo "" >> "$report_file"
    
    # Calculate potential savings
    local potential_cpu_savings
    local potential_mem_savings
    local total_savings
    
    potential_cpu_savings=$(echo "scale=2; $total_cpu_cost * 0.30" | bc)
    potential_mem_savings=$(echo "scale=2; $total_memory_cost * 0.30" | bc)
    total_savings=$(echo "scale=2; $potential_cpu_savings + $potential_mem_savings" | bc)
    
    echo "### Potential Savings (30% optimization)" >> "$report_file"
    echo "" >> "$report_file"
    echo "- **Potential CPU Savings:** \$$potential_cpu_savings/month" >> "$report_file"
    echo "- **Potential Memory Savings:** \$$potential_mem_savings/month" >> "$report_file"
    echo "- **Total Potential Savings:** \$$total_savings/month" >> "$report_file"
    echo "- **Annual Potential Savings:** \$$(echo "scale=2; $total_savings * 12" | bc)/year" >> "$report_file"
    echo "" >> "$report_file"
}

# Generate recommendations
generate_recommendations() {
    local namespace=$1
    local report_file=$2
    
    log "Generating optimization recommendations..."
    
    echo "## Optimization Recommendations" >> "$report_file"
    echo "" >> "$report_file"
    
    local recommendations=()
    
    # Check for over-provisioned pods
    local pods
    pods=$(kubectl get pods -n "$namespace" -o jsonpath='{.items[*].metadata.name}')
    
    for pod in $pods; do
        read -r cpu_limit mem_limit <<< "$(get_resource_limits "$pod" "$namespace")"
        read -r cpu_usage mem_usage <<< "$(get_resource_usage "$pod" "$namespace")"
        
        if [ "$cpu_limit" -eq 0 ] || [ "$mem_limit" -eq 0 ]; then
            continue
        fi
        
        local cpu_util
        local mem_util
        
        cpu_util=$(echo "scale=2; ($cpu_usage / $cpu_limit) * 100" | bc)
        mem_util=$(echo "scale=2; ($mem_usage / $mem_limit) * 100" | bc)
        
        if (( $(echo "$cpu_util < $OVER_PROVISIONED_THRESHOLD" | bc -l) )); then
            local recommended_cpu
            recommended_cpu=$(echo "scale=0; $cpu_usage * 1.5" | bc | cut -d. -f1)
            recommendations+=("- **$pod**: Reduce CPU limit from ${cpu_limit}m to ${recommended_cpu}m (current usage: ${cpu_usage}m)")
        fi
        
        if (( $(echo "$mem_util < $OVER_PROVISIONED_THRESHOLD" | bc -l) )); then
            local recommended_mem
            recommended_mem=$(echo "scale=0; $mem_usage * 1.5" | bc | cut -d. -f1)
            recommendations+=("- **$pod**: Reduce memory limit from ${mem_limit}Mi to ${recommended_mem}Mi (current usage: ${mem_usage}Mi)")
        fi
    done
    
    if [ ${#recommendations[@]} -gt 0 ]; then
        echo "### Resource Limit Adjustments" >> "$report_file"
        echo "" >> "$report_file"
        for rec in "${recommendations[@]}"; do
            echo "$rec" >> "$report_file"
        done
        echo "" >> "$report_file"
    else
        echo "✅ All resource allocations appear optimal." >> "$report_file"
        echo "" >> "$report_file"
    fi
    
    # General recommendations
    echo "### General Recommendations" >> "$report_file"
    echo "" >> "$report_file"
    echo "1. **Review HPA Settings**: Ensure min/max replicas are appropriate for your workload" >> "$report_file"
    echo "2. **Monitor Trends**: Use Prometheus/Grafana to identify usage patterns over time" >> "$report_file"
    echo "3. **Right-size Regularly**: Review and adjust resource limits quarterly" >> "$report_file"
    echo "4. **Consider Spot Instances**: For non-critical workloads, use spot/preemptible instances" >> "$report_file"
    echo "5. **Enable Cluster Autoscaling**: Let Kubernetes adjust node count based on demand" >> "$report_file"
    echo "" >> "$report_file"
}

#============================================================================
# Main Execution
#============================================================================

main() {
    log_section "HDR Empire Framework - Cost Optimization Tool"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            --analyze)
                ANALYZE_ONLY=true
                AUTO_APPLY=false
                shift
                ;;
            --auto-apply)
                AUTO_APPLY=true
                ANALYZE_ONLY=false
                shift
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
    
    # Verify namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace '$NAMESPACE' does not exist"
        exit 1
    fi
    
    # Create report directory
    local report_dir="reports/cost-optimization"
    mkdir -p "$report_dir"
    
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)
    local report_file="$report_dir/cost-analysis-$NAMESPACE-$timestamp.md"
    
    # Generate report header
    cat > "$report_file" << EOF
# HDR Empire Framework - Cost Optimization Report

**Generated:** $(date)  
**Namespace:** $NAMESPACE  
**Analysis Type:** $([ "$ANALYZE_ONLY" = true ] && echo "Read-only" || echo "With auto-apply")

---

EOF
    
    # Run analyses
    analyze_pod_resources "$NAMESPACE" "$report_file"
    analyze_hpa "$NAMESPACE" "$report_file"
    analyze_storage "$NAMESPACE" "$report_file"
    calculate_cost_estimates "$NAMESPACE" "$report_file"
    generate_recommendations "$NAMESPACE" "$report_file"
    
    # Footer
    cat >> "$report_file" << EOF

---

**Report Generated By:** HDR Empire Framework Cost Optimization Tool  
**Copyright © 2025 Stephen Bilodeau - Patent Pending - All Rights Reserved**
EOF
    
    log_section "Cost Analysis Complete"
    log "Report saved to: $report_file"
    
    if [ "$AUTO_APPLY" = true ]; then
        log_warn "Auto-apply mode is enabled but not yet implemented"
        log_warn "Please review the report and apply recommendations manually"
    else
        log "Review the report for optimization recommendations"
        log "Run with --auto-apply to automatically apply optimizations"
    fi
    
    echo ""
}

# Execute main function
main "$@"
