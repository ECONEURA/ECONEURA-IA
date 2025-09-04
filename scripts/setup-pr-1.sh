#!/bin/bash
# PR-1: Monorepo Structure Setup

set -e

echo "🏗️ Setting up Monorepo Structure (PR-1)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first:"
    echo "npm install -g pnpm"
    exit 1
fi

print_status "Creating directory structure..."

# Create apps directory structure
mkdir -p apps/api/src/{lib,routes,middleware,controllers,types}
mkdir -p apps/web/src/{app,components,lib,hooks}
mkdir -p apps/workers/src/{processors,queues,services,types,utils}

# Create packages directory structure
mkdir -p packages/shared/src/{ai,types,utils,schemas}
mkdir -p packages/db/src/{migrations,schemas,queries}
mkdir -p packages/sdk/src/{client,types,utils}

print_success "Directory structure created"

# Create pnpm workspace config if it doesn't exist
if [ ! -f "pnpm-workspace.yaml" ]; then
    print_status "Creating pnpm-workspace.yaml..."
    cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF
    print_success "pnpm-workspace.yaml created"
else
    print_success "pnpm-workspace.yaml already exists"
fi

# Create TypeScript base config if it doesn't exist
if [ ! -f "tsconfig.json" ]; then
    print_status "Creating base tsconfig.json..."
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@econeura/shared": ["./packages/shared/src"],
      "@econeura/db": ["./packages/db/src"],
      "@econeura/sdk": ["./packages/sdk/src"]
    }
  },
  "include": [],
  "exclude": ["node_modules", "dist", "build", ".next"]
}
EOF
    print_success "Base tsconfig.json created"
else
    print_success "Base tsconfig.json already exists"
fi

# Install dependencies
print_status "Installing dependencies..."
pnpm install

# Verify workspace structure
print_status "Verifying workspace structure..."

# Check if all required directories exist
required_dirs=(
    "apps/api/src"
    "apps/web/src"
    "apps/workers/src"
    "packages/shared/src"
    "packages/db/src"
    "packages/sdk/src"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_success "✓ $dir/ directory exists"
    else
        print_error "✗ $dir/ directory missing"
    fi
done

# Check if workspace files exist
workspace_files=(
    "pnpm-workspace.yaml"
    "tsconfig.json"
    "package.json"
)

for file in "${workspace_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file exists"
    else
        print_error "✗ $file missing"
    fi
done

# Test workspace commands
print_status "Testing workspace commands..."

if pnpm list --depth=0 > /dev/null 2>&1; then
    print_success "✓ pnpm workspace commands working"
else
    print_error "✗ pnpm workspace commands not working"
fi

print_success "✅ PR-1: Monorepo Structure Complete!"
print_status "Next steps:"
echo "  1. Continue with PR-2: TypeScript Configuration"
echo "  2. Run 'pnpm dev' to start development"
echo "  3. Verify workspace structure with 'pnpm list'"

echo ""
print_status "🎯 PR-1 Implementation Summary:"
echo "  ✓ Monorepo structure established"
echo "  ✓ pnpm workspaces configured"
echo "  ✓ TypeScript base config created"
echo "  ✓ Directory structure created"
echo "  ✓ Dependencies installed"
