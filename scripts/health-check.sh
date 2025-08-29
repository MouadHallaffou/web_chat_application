#!/bin/bash

# Health Check Script for ChatApp
# Usage: ./health-check.sh [docker|k8s|swarm]

set -e

DEPLOYMENT_TYPE=${1:-docker}
PROJECT_NAME="chatapp"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

success() {
    echo -e "${GREEN}[✓] $1${NC}"
}

failed() {
    echo -e "${RED}[✗] $1${NC}"
}

# Health check functions
check_http_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        success "$service_name is healthy ($url)"
        return 0
    else
        failed "$service_name is not responding ($url)"
        return 1
    fi
}

check_tcp_port() {
    local service_name=$1
    local host=$2
    local port=$3
    
    if timeout 5 bash -c "</dev/tcp/$host/$port"; then
        success "$service_name is reachable ($host:$port)"
        return 0
    else
        failed "$service_name is not reachable ($host:$port)"
        return 1
    fi
}

# Docker health checks
check_docker_health() {
    log "Checking Docker deployment health..."
    
    local failed_checks=0
    
    # Check if containers are running
    info "Checking container status..."
    local containers=("${PROJECT_NAME}_frontend" "${PROJECT_NAME}_backend" "${PROJECT_NAME}_mongodb" "${PROJECT_NAME}_redis")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            success "$container is running"
        else
            failed "$container is not running"
            ((failed_checks++))
        fi
    done
    
    # Check HTTP services
    info "Checking HTTP services..."
    check_http_service "Frontend" "http://localhost:3000" || ((failed_checks++))
    check_http_service "Backend" "http://localhost:5000" || ((failed_checks++))
    check_http_service "Backend Health" "http://localhost:5000/health" || ((failed_checks++))
    
    # Check database connections
    info "Checking database connections..."
    check_tcp_port "MongoDB" "localhost" "27017" || ((failed_checks++))
    check_tcp_port "Redis" "localhost" "6379" || ((failed_checks++))
    
    # Check container health status
    info "Checking container health status..."
    for container in "${containers[@]}"; do
        if docker inspect "$container" --format='{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then
            success "$container health check passed"
        else
            warning "$container health check failed or not configured"
        fi
    done
    
    # Check logs for errors
    info "Checking recent logs for errors..."
    local error_patterns=("ERROR" "FATAL" "Exception" "failed" "error")
    
    for container in "${PROJECT_NAME}_frontend" "${PROJECT_NAME}_backend"; do
        local recent_logs=$(docker logs --tail 100 "$container" 2>&1)
        local has_errors=false
        
        for pattern in "${error_patterns[@]}"; do
            if echo "$recent_logs" | grep -qi "$pattern"; then
                has_errors=true
                break
            fi
        done
        
        if [[ "$has_errors" == "true" ]]; then
            warning "$container has recent errors in logs"
        else
            success "$container logs look clean"
        fi
    done
    
    return $failed_checks
}

# Kubernetes health checks
check_k8s_health() {
    log "Checking Kubernetes deployment health..."
    
    local failed_checks=0
    local namespace="chatapp"
    
    # Check if namespace exists
    if kubectl get namespace "$namespace" >/dev/null 2>&1; then
        success "Namespace $namespace exists"
    else
        failed "Namespace $namespace does not exist"
        return 1
    fi
    
    # Check pod status
    info "Checking pod status..."
    local pods=$(kubectl get pods -n "$namespace" --no-headers)
    
    if [[ -z "$pods" ]]; then
        failed "No pods found in namespace $namespace"
        ((failed_checks++))
    else
        while read -r line; do
            local pod_name=$(echo "$line" | awk '{print $1}')
            local ready=$(echo "$line" | awk '{print $2}')
            local status=$(echo "$line" | awk '{print $3}')
            
            if [[ "$status" == "Running" ]] && [[ "$ready" =~ ^[0-9]+/[0-9]+$ ]] && [[ "${ready%%/*}" == "${ready##*/}" ]]; then
                success "Pod $pod_name is healthy"
            else
                failed "Pod $pod_name is not healthy (Status: $status, Ready: $ready)"
                ((failed_checks++))
            fi
        done <<< "$pods"
    fi
    
    # Check services
    info "Checking services..."
    local services=$(kubectl get services -n "$namespace" --no-headers)
    
    while read -r line; do
        local service_name=$(echo "$line" | awk '{print $1}')
        success "Service $service_name exists"
    done <<< "$services"
    
    # Check ingress
    info "Checking ingress..."
    if kubectl get ingress -n "$namespace" >/dev/null 2>&1; then
        local ingress_info=$(kubectl get ingress -n "$namespace" --no-headers)
        if [[ -n "$ingress_info" ]]; then
            success "Ingress is configured"
            info "Ingress details:"
            kubectl get ingress -n "$namespace"
        else
            warning "No ingress found"
        fi
    else
        warning "Ingress check failed"
    fi
    
    # Check persistent volumes
    info "Checking persistent volumes..."
    local pvcs=$(kubectl get pvc -n "$namespace" --no-headers)
    
    while read -r line; do
        local pvc_name=$(echo "$line" | awk '{print $1}')
        local status=$(echo "$line" | awk '{print $2}')
        
        if [[ "$status" == "Bound" ]]; then
            success "PVC $pvc_name is bound"
        else
            failed "PVC $pvc_name is not bound (Status: $status)"
            ((failed_checks++))
        fi
    done <<< "$pvcs"
    
    return $failed_checks
}

# Docker Swarm health checks
check_swarm_health() {
    log "Checking Docker Swarm deployment health..."
    
    local failed_checks=0
    
    # Check if swarm is active
    if docker info | grep -q "Swarm: active"; then
        success "Docker Swarm is active"
    else
        failed "Docker Swarm is not active"
        return 1
    fi
    
    # Check stack services
    info "Checking stack services..."
    local services=$(docker stack services "$PROJECT_NAME" --format "table {{.Name}}\t{{.Replicas}}" --no-trunc)
    
    if [[ -z "$services" ]]; then
        failed "No services found for stack $PROJECT_NAME"
        return 1
    fi
    
    while read -r line; do
        if [[ "$line" =~ ^NAME ]]; then
            continue
        fi
        
        local service_name=$(echo "$line" | awk '{print $1}')
        local replicas=$(echo "$line" | awk '{print $2}')
        
        if [[ "$replicas" =~ ^[0-9]+/[0-9]+$ ]] && [[ "${replicas%%/*}" == "${replicas##*/}" ]]; then
            success "Service $service_name is healthy ($replicas)"
        else
            failed "Service $service_name is not healthy ($replicas)"
            ((failed_checks++))
        fi
    done <<< "$services"
    
    # Check node status
    info "Checking node status..."
    local nodes=$(docker node ls --format "table {{.Hostname}}\t{{.Status}}\t{{.Availability}}")
    
    while read -r line; do
        if [[ "$line" =~ ^HOSTNAME ]]; then
            continue
        fi
        
        local hostname=$(echo "$line" | awk '{print $1}')
        local status=$(echo "$line" | awk '{print $2}')
        local availability=$(echo "$line" | awk '{print $3}')
        
        if [[ "$status" == "Ready" ]] && [[ "$availability" == "Active" ]]; then
            success "Node $hostname is healthy"
        else
            warning "Node $hostname status: $status, availability: $availability"
        fi
    done <<< "$nodes"
    
    return $failed_checks
}

# Performance checks
check_performance() {
    log "Running performance checks..."
    
    # Memory usage
    info "Memory usage:"
    case $DEPLOYMENT_TYPE in
        docker)
            docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}" | head -5
            ;;
        k8s)
            kubectl top pods -n chatapp 2>/dev/null || warning "Metrics server not available"
            ;;
        swarm)
            docker service ls --format "table {{.Name}}\t{{.Replicas}}"
            ;;
    esac
    
    # Disk usage
    info "Disk usage:"
    df -h | grep -E "(Filesystem|/dev/)"
    
    # Network connectivity
    info "Network connectivity:"
    case $DEPLOYMENT_TYPE in
        docker)
            check_http_service "Frontend Response Time" "http://localhost:3000" || true
            check_http_service "Backend Response Time" "http://localhost:5000/health" || true
            ;;
        k8s)
            local ingress_ip=$(kubectl get ingress -n chatapp -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "N/A")
            info "Ingress IP: $ingress_ip"
            ;;
    esac
}

# Generate health report
generate_report() {
    local failed_checks=$1
    local total_checks=$2
    
    echo ""
    echo "=================================="
    echo "HEALTH CHECK REPORT"
    echo "=================================="
    echo "Deployment Type: $DEPLOYMENT_TYPE"
    echo "Timestamp: $(date)"
    echo "Failed Checks: $failed_checks"
    echo "Total Checks: $total_checks"
    echo "Success Rate: $(( (total_checks - failed_checks) * 100 / total_checks ))%"
    echo "=================================="
    
    if [[ $failed_checks -eq 0 ]]; then
        success "All health checks passed!"
        return 0
    else
        error "$failed_checks health checks failed!"
        return 1
    fi
}

# Main execution
main() {
    log "Starting health check for $DEPLOYMENT_TYPE deployment..."
    
    local failed_checks=0
    local start_time=$(date +%s)
    
    case $DEPLOYMENT_TYPE in
        docker)
            check_docker_health
            failed_checks=$?
            ;;
        k8s)
            check_k8s_health
            failed_checks=$?
            ;;
        swarm)
            check_swarm_health
            failed_checks=$?
            ;;
        *)
            error "Unknown deployment type: $DEPLOYMENT_TYPE"
            exit 1
            ;;
    esac
    
    if [[ $failed_checks -eq 0 ]]; then
        check_performance
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    info "Health check completed in ${duration}s"
    generate_report $failed_checks 10
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [docker|k8s|swarm]"
        echo ""
        echo "Deployment Types:"
        echo "  docker    Check Docker Compose deployment (default)"
        echo "  k8s       Check Kubernetes deployment"
        echo "  swarm     Check Docker Swarm deployment"
        exit 0
        ;;
    *)
        main
        ;;
esac
