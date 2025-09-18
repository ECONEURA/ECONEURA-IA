#!/usr/bin/env bash
set -euo pipefail

# Lock File Manager Script
# Handles automatic generation and validation of dependency lock files
# Supports pnpm, npm, and yarn with intelligent conflict resolution

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

detect_package_manager() {
    local pm="unknown"
    
    # Check package.json for packageManager field
    if [ -f "package.json" ]; then
        local package_manager=$(grep -o '"packageManager"[[:space:]]*:[[:space:]]*"[^"]*"' package.json 2>/dev/null | cut -d'"' -f4 || echo "")
        if [[ "$package_manager" =~ ^pnpm ]]; then
            pm="pnpm"
        elif [[ "$package_manager" =~ ^npm ]]; then
            pm="npm"
        elif [[ "$package_manager" =~ ^yarn ]]; then
            pm="yarn"
        fi
    fi
    
    # Fallback detection based on lock files
    if [ "$pm" = "unknown" ]; then
        if [ -f "pnpm-lock.yaml" ] && [ -s "pnpm-lock.yaml" ]; then
            pm="pnpm"
        elif [ -f "package-lock.json" ] && [ -s "package-lock.json" ]; then
            pm="npm"
        elif [ -f "yarn.lock" ] && [ -s "yarn.lock" ]; then
            pm="yarn"
        fi
    fi
    
    echo "$pm"
}

validate_lock_file() {
    local pm="$1"
    local lock_file=""
    local valid=false
    
    case "$pm" in
        "pnpm")
            lock_file="pnpm-lock.yaml"
            if [ -f "$lock_file" ] && [ -s "$lock_file" ]; then
                # Check if it has the basic pnpm structure
                if grep -q "lockfileVersion:" "$lock_file" 2>/dev/null; then
                    valid=true
                fi
            fi
            ;;
        "npm")
            lock_file="package-lock.json"
            if [ -f "$lock_file" ] && [ -s "$lock_file" ]; then
                # Check if it has basic npm structure
                if grep -q '"lockfileVersion"' "$lock_file" 2>/dev/null; then
                    valid=true
                fi
            fi
            ;;
        "yarn")
            lock_file="yarn.lock"
            if [ -f "$lock_file" ] && [ -s "$lock_file" ]; then
                # Check if it has basic yarn structure
                if grep -q "version:" "$lock_file" 2>/dev/null; then
                    valid=true
                fi
            fi
            ;;
    esac
    
    if [ "$valid" = true ]; then
        log "✅ Valid $lock_file found"
        echo "valid"
    else
        log "❌ Invalid or missing $lock_file"
        echo "invalid"
    fi
}

cleanup_conflicting_locks() {
    local target_pm="$1"
    
    log "🧹 Cleaning up conflicting lock files for $target_pm"
    
    case "$target_pm" in
        "pnpm")
            [ -f "package-lock.json" ] && [ -s "package-lock.json" ] && rm -f package-lock.json && log "Removed conflicting package-lock.json"
            [ -f "yarn.lock" ] && rm -f yarn.lock && log "Removed conflicting yarn.lock"
            [ -f "npm-shrinkwrap.json" ] && rm -f npm-shrinkwrap.json && log "Removed conflicting npm-shrinkwrap.json"
            ;;
        "npm")
            [ -f "pnpm-lock.yaml" ] && rm -f pnpm-lock.yaml && log "Removed conflicting pnpm-lock.yaml"
            [ -f "yarn.lock" ] && rm -f yarn.lock && log "Removed conflicting yarn.lock"
            ;;
        "yarn")
            [ -f "package-lock.json" ] && rm -f package-lock.json && log "Removed conflicting package-lock.json"
            [ -f "pnpm-lock.yaml" ] && rm -f pnpm-lock.yaml && log "Removed conflicting pnpm-lock.yaml"
            [ -f "npm-shrinkwrap.json" ] && rm -f npm-shrinkwrap.json && log "Removed conflicting npm-shrinkwrap.json"
            ;;
    esac
}

generate_lock_file() {
    local pm="$1"
    local force="${2:-false}"
    
    log "🔧 Generating lock file for $pm (force=$force)"
    
    # Clean up conflicting lock files first
    cleanup_conflicting_locks "$pm"
    
    case "$pm" in
        "pnpm")
            if [ "$force" = "true" ] || [ ! -f "pnpm-lock.yaml" ] || [ ! -s "pnpm-lock.yaml" ]; then
                log "Generating pnpm-lock.yaml..."
                pnpm install --lockfile-only
                log "✅ Generated pnpm-lock.yaml"
            fi
            ;;
        "npm")
            if [ "$force" = "true" ] || [ ! -f "package-lock.json" ] || [ ! -s "package-lock.json" ]; then
                log "Generating package-lock.json..."
                npm install --package-lock-only
                log "✅ Generated package-lock.json"
            fi
            ;;
        "yarn")
            if [ "$force" = "true" ] || [ ! -f "yarn.lock" ] || [ ! -s "yarn.lock" ]; then
                log "Generating yarn.lock..."
                yarn install --mode=update-lockfile
                log "✅ Generated yarn.lock"
            fi
            ;;
        *)
            log "❌ Unknown package manager: $pm"
            return 1
            ;;
    esac
}

create_minimal_npm_lock() {
    log "📝 Creating minimal package-lock.json for pnpm project"
    
    # Read current package.json to get proper name and version
    local pkg_name="econeura"
    local pkg_version="1.0.0"
    
    if [ -f "package.json" ]; then
        pkg_name=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' package.json | cut -d'"' -f4)
        pkg_version=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' package.json | cut -d'"' -f4)
    fi
    
    cat > package-lock.json << EOF
{
  "name": "${pkg_name}",
  "version": "${pkg_version}",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "${pkg_name}",
      "version": "${pkg_version}",
      "hasInstallScript": true,
      "workspaces": [
        "apps/*",
        "packages/*"
      ]
    }
  }
}
EOF
}

main() {
    local action="${1:-validate}"
    local force="${2:-false}"
    
    log "🚀 Lock File Manager - Action: $action"
    
    # Detect package manager
    local pm=$(detect_package_manager)
    log "📦 Detected package manager: $pm"
    
    if [ "$pm" = "unknown" ]; then
        log "⚠️ Could not detect package manager, defaulting to pnpm"
        pm="pnpm"
    fi
    
    case "$action" in
        "validate")
            validate_lock_file "$pm"
            ;;
        "generate")
            generate_lock_file "$pm" "$force"
            ;;
        "ensure")
            local status=$(validate_lock_file "$pm")
            if [ "$status" = "invalid" ]; then
                generate_lock_file "$pm" false
            fi
            
            # For pnpm projects, ensure a minimal npm lock exists for compatibility
            if [ "$pm" = "pnpm" ]; then
                if [ ! -f "package-lock.json" ] || [ $(wc -c < "package-lock.json") -lt 200 ]; then
                    create_minimal_npm_lock
                    log "✅ Created minimal package-lock.json for compatibility"
                fi
            fi
            ;;
        "clean")
            cleanup_conflicting_locks "$pm"
            ;;
        *)
            log "❌ Unknown action: $action"
            log "Available actions: validate, generate, ensure, clean"
            exit 1
            ;;
    esac
    
    log "✅ Lock file management completed"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi