#!/usr/bin/env bash
set -Eeuo pipefail

# Dependency validation script for DEV verification
# Ensures all required tools and versions are available

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_command() {
    local cmd="$1"
    local min_version="$2"
    local version_flag="$3"
    
    if ! command -v "$cmd" >/dev/null 2>&1; then
        log "❌ $cmd not found"
        return 1
    fi
    
    if [ -n "$min_version" ]; then
        local current_version
        current_version=$($cmd $version_flag 2>/dev/null | head -n1 | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -n1 || echo "0.0.0")
        
        if [ "$(printf '%s\n' "$min_version" "$current_version" | sort -V | head -n1)" = "$min_version" ]; then
            log "✅ $cmd version $current_version (>= $min_version required)"
        else
            log "❌ $cmd version $current_version < $min_version required"
            return 1
        fi
    else
        log "✅ $cmd available"
    fi
    
    return 0
}

check_node_modules() {
    if [ ! -d "node_modules" ]; then
        log "❌ node_modules not found. Run 'pnpm install' first"
        return 1
    fi
    
    # Check for required packages
    local required_packages=("zx" "ts-node" "ws")
    for package in "${required_packages[@]}"; do
        if [ ! -d "node_modules/$package" ]; then
            log "❌ Package $package not installed"
            return 1
        fi
    done
    
    log "✅ All required Node.js packages available"
    return 0
}

check_files() {
    local required_files=(
        "scripts/ops/dev_smoke.sh"
        "scripts/ops/openapi_diff.mjs"
        "scripts/ops/ws_probe.mjs"
        "scripts/ops/verify_no_secrets.mjs"
        "snapshots/openapi.runtime.json"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log "❌ Required file missing: $file"
            return 1
        fi
    done
    
    log "✅ All required files present"
    return 0
}

main() {
    log "Starting dependency validation..."
    
    local all_good=true
    
    # Check system commands
    check_command "curl" "7.0.0" "--version" || all_good=false
    check_command "jq" "" "" || log "⚠️ jq not available, will use Python fallback"
    check_command "python3" "3.6.0" "--version" || all_good=false
    check_command "node" "18.0.0" "--version" || all_good=false
    check_command "pnpm" "8.0.0" "--version" || all_good=false
    
    # Check Node.js packages
    check_node_modules || all_good=false
    
    # Check required files
    check_files || all_good=false
    
    if [ "$all_good" = true ]; then
        log "✅ All dependencies validated successfully"
        exit 0
    else
        log "❌ Dependency validation failed"
        exit 1
    fi
}

main "$@"
