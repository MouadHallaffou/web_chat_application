#!/bin/bash

# ChatApp Deployment Script
# Usage: ./deploy.sh [docker|k8s|swarm] [dev|staging|prod]

set -e

DEPLOYMENT_TYPE=${1:-docker}
ENVIRONMENT=${2:-development}
PROJECT_NAME="chatapp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    case $DEPLOYMENT_TYPE in
        docker)
            command -v docker >/dev/null 2>&1 || error "Docker is not installed"
            command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is not installed"
            ;;
        k8s)
            command -v kubectl >/dev/null 2>&1 || error "kubectl is not installed"
            command -v helm >/dev/null 2>&1 || warning "Helm is not installed (optional)"
            ;;
        swarm)
            command -v docker >/dev/null 2>&1 || error "Docker is not installed"
            docker node ls >/dev/null 2>&1 || error "Docker Swarm is not initialized"
            ;;
    esac
    
    log "Prerequisites check completed"
}

# Environment setup
setup_environment() {
    log "Setting up environment for $ENVIRONMENT..."
    
    if [[ ! -f ".env.$ENVIRONMENT" ]]; then
        if [[ -f ".env.example" ]]; then
            cp .env.example .env.$ENVIRONMENT
            warning "Created .env.$ENVIRONMENT from template. Please update values before deploying."
        else
            error "No environment file found for $ENVIRONMENT"
        fi
    fi
    
    # Copy environment file
    cp .env.$ENVIRONMENT .env
    log "Environment setup completed"
}

# Docker deployment
deploy_docker() {
    log "Deploying with Docker Compose..."
    
    # Build images
    info "Building Docker images..."
    docker-compose build --no-cache
    
    # Start services
    info "Starting services..."
    docker-compose up -d
    
    # Wait for services
    info "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    health_check_docker
    
    log "Docker deployment completed"
}

# Kubernetes deployment
deploy_k8s() {
    log "Deploying to Kubernetes..."
    
    # Apply namespace
    kubectl apply -f k8s/namespace.yaml
    
    # Apply configurations
    kubectl apply -f k8s/configmap-secrets.yaml
    kubectl apply -f k8s/storage.yaml
    
    # Deploy databases
    info "Deploying databases..."
    kubectl apply -f k8s/mongodb.yaml
    kubectl apply -f k8s/redis.yaml
    
    # Wait for databases
    kubectl wait --for=condition=ready pod -l app=mongodb -n chatapp --timeout=300s
    kubectl wait --for=condition=ready pod -l app=redis -n chatapp --timeout=300s
    
    # Deploy applications
    info "Deploying applications..."
    kubectl apply -f k8s/backend.yaml
    kubectl apply -f k8s/frontend.yaml
    
    # Wait for applications
    kubectl wait --for=condition=ready pod -l app=chatapp-backend -n chatapp --timeout=300s
    kubectl wait --for=condition=ready pod -l app=chatapp-frontend -n chatapp --timeout=300s
    
    # Apply ingress
    kubectl apply -f k8s/ingress.yaml
    
    # Health check
    health_check_k8s
    
    log "Kubernetes deployment completed"
}

# Docker Swarm deployment
deploy_swarm() {
    log "Deploying to Docker Swarm..."
    
    # Create network if not exists
    docker network create --driver overlay ${PROJECT_NAME}_network || true
    
    # Deploy stack
    docker stack deploy --compose-file docker-compose.yml ${PROJECT_NAME}
    
    # Wait for services
    info "Waiting for services to be ready..."
    sleep 60
    
    # Health check
    health_check_swarm
    
    log "Docker Swarm deployment completed"
}

# Health checks
health_check_docker() {
    info "Running health checks..."
    
    local services=("frontend:3000" "backend:5000")
    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        if curl -sf http://localhost:$port > /dev/null; then
            log "$name service is healthy"
        else
            error "$name service is not responding"
        fi
    done
}

health_check_k8s() {
    info "Running Kubernetes health checks..."
    
    kubectl get pods -n chatapp
    kubectl get services -n chatapp
    
    # Check if all pods are ready
    if kubectl get pods -n chatapp --field-selector=status.phase!=Running | grep -v "No resources found"; then
        error "Some pods are not running"
    else
        log "All pods are running"
    fi
}

health_check_swarm() {
    info "Running Swarm health checks..."
    
    docker stack services ${PROJECT_NAME}
    
    # Check if all services are running
    local running_services=$(docker stack services ${PROJECT_NAME} --format "{{.Replicas}}" | grep -c "1/1")
    local total_services=$(docker stack services ${PROJECT_NAME} --quiet | wc -l)
    
    if [[ $running_services -eq $total_services ]]; then
        log "All services are running"
    else
        error "Some services are not running properly"
    fi
}

# Monitoring setup
setup_monitoring() {
    log "Setting up monitoring..."
    
    if [[ -f "monitoring/docker-compose.monitoring.yml" ]]; then
        cd monitoring
        docker-compose -f docker-compose.monitoring.yml up -d
        cd ..
        
        log "Monitoring stack deployed"
        info "Grafana: http://localhost:3001 (admin/grafana123)"
        info "Prometheus: http://localhost:9090"
        info "AlertManager: http://localhost:9093"
    else
        warning "Monitoring configuration not found"
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    
    case $DEPLOYMENT_TYPE in
        docker)
            docker-compose down
            docker system prune -f
            ;;
        k8s)
            kubectl delete namespace chatapp --ignore-not-found
            ;;
        swarm)
            docker stack rm ${PROJECT_NAME}
            ;;
    esac
    
    log "Cleanup completed"
}

# Main execution
main() {
    log "Starting ChatApp deployment"
    log "Deployment Type: $DEPLOYMENT_TYPE"
    log "Environment: $ENVIRONMENT"
    
    check_prerequisites
    setup_environment
    
    case $DEPLOYMENT_TYPE in
        docker)
            deploy_docker
            ;;
        k8s)
            deploy_k8s
            ;;
        swarm)
            deploy_swarm
            ;;
        *)
            error "Unknown deployment type: $DEPLOYMENT_TYPE"
            ;;
    esac
    
    if [[ "$3" == "--monitoring" ]]; then
        setup_monitoring
    fi
    
    log "Deployment completed successfully!"
    
    # Display access information
    case $DEPLOYMENT_TYPE in
        docker)
            info "Frontend: http://localhost:3000"
            info "Backend: http://localhost:5000"
            ;;
        k8s)
            info "Access via Ingress URL (check ingress.yaml)"
            ;;
        swarm)
            info "Frontend: http://localhost:3000"
            info "Backend: http://localhost:5000"
            ;;
    esac
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [docker|k8s|swarm] [dev|staging|prod] [--monitoring] [--cleanup]"
        echo ""
        echo "Options:"
        echo "  docker    Deploy using Docker Compose (default)"
        echo "  k8s       Deploy to Kubernetes"
        echo "  swarm     Deploy to Docker Swarm"
        echo "  --monitoring  Setup monitoring stack"
        echo "  --cleanup     Cleanup deployment"
        exit 0
        ;;
    --cleanup)
        cleanup
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
