#!/bin/bash

# ECONEURA-IA Development Environment Manager
# Enhanced development workflow with monitoring and debugging tools

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.dev.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Check if required tools are installed
check_dependencies() {
    local missing_deps=()

    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi

    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install the missing dependencies and try again."
        exit 1
    fi
}

# Start the development environment
start_dev() {
    log_info "Starting ECONEURA-IA development environment..."

    check_docker
    check_dependencies

    # Create necessary directories
    mkdir -p "$PROJECT_ROOT/logs"

    # Start services
    docker-compose -f "$COMPOSE_FILE" up -d

    log_success "Development environment started!"
    show_services
}

# Stop the development environment
stop_dev() {
    log_info "Stopping ECONEURA-IA development environment..."
    docker-compose -f "$COMPOSE_FILE" down
    log_success "Development environment stopped!"
}

# Show status of services
status_dev() {
    log_info "Development environment status:"
    docker-compose -f "$COMPOSE_FILE" ps
}

# Show logs from services
logs_dev() {
    local service=${1:-"api"}
    log_info "Showing logs for service: $service"
    docker-compose -f "$COMPOSE_FILE" logs -f "$service"
}

# Start development tools (pgAdmin, Redis Commander)
start_tools() {
    log_info "Starting development tools..."
    docker-compose -f "$COMPOSE_FILE" --profile tools up -d
    log_success "Development tools started!"
    show_tools
}

# Rebuild services
rebuild_dev() {
    local service=${1:-""}
    log_info "Rebuilding services..."
    if [ -n "$service" ]; then
        docker-compose -f "$COMPOSE_FILE" build "$service"
        docker-compose -f "$COMPOSE_FILE" up -d "$service"
    else
        docker-compose -f "$COMPOSE_FILE" build
        docker-compose -f "$COMPOSE_FILE" up -d
    fi
    log_success "Services rebuilt!"
}

# Run tests
test_dev() {
    log_info "Running tests..."
    docker-compose -f "$COMPOSE_FILE" exec api pnpm test
}

# Run linting
lint_dev() {
    log_info "Running linting..."
    docker-compose -f "$COMPOSE_FILE" exec api pnpm lint
}

# Show available services and their URLs
show_services() {
    echo
    log_info "🚀 Development Services:"
    echo "  📱 Web App:     http://localhost:3000"
    echo "  🔌 API:         http://localhost:4000"
    echo "  📊 API Docs:    http://localhost:4000/api-docs"
    echo "  🐘 PostgreSQL:  localhost:5432"
    echo "  🔴 Redis:       localhost:6379"
    echo
    log_info "💡 Useful commands:"
    echo "  ./dev-env.sh logs api          # View API logs"
    echo "  ./dev-env.sh logs web          # View Web logs"
    echo "  ./dev-env.sh test              # Run tests"
    echo "  ./dev-env.sh lint              # Run linting"
    echo "  ./dev-env.sh tools             # Start development tools"
    echo "  ./dev-env.sh stop              # Stop all services"
}

# Show development tools
show_tools() {
    echo
    log_info "🛠️  Development Tools:"
    echo "  🐘 pgAdmin:     http://localhost:5050 (admin@econeura.com / admin123)"
    echo "  🔴 Redis Cmdr: http://localhost:8081"
    echo
}

# Show help
show_help() {
    echo "ECONEURA-IA Development Environment Manager"
    echo
    echo "Usage: $0 [command]"
    echo
    echo "Commands:"
    echo "  start       Start the development environment"
    echo "  stop        Stop the development environment"
    echo "  status      Show status of services"
    echo "  logs        Show logs from services (default: api)"
    echo "  tools       Start development tools (pgAdmin, Redis Commander)"
    echo "  rebuild     Rebuild services"
    echo "  test        Run tests"
    echo "  lint        Run linting"
    echo "  help        Show this help message"
    echo
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs web"
    echo "  $0 tools"
}

# Main script logic
case "${1:-help}" in
    start)
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    status)
        status_dev
        ;;
    logs)
        logs_dev "$2"
        ;;
    tools)
        start_tools
        ;;
    rebuild)
        rebuild_dev "$2"
        ;;
    test)
        test_dev
        ;;
    lint)
        lint_dev
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac