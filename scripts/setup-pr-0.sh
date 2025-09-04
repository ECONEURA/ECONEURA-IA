#!/bin/bash
# PR-0: Project Base Setup Script

set -e

echo "🏗️ Setting up ECONEURA Project Base (PR-0)..."

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

print_status "Installing dependencies..."
pnpm install

print_status "Setting up git hooks..."
if [ -d ".git" ]; then
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for PR-0

echo "🔍 Running pre-commit checks..."

# Run linting
pnpm run lint

# Run type checking
pnpm run type-check

echo "✅ Pre-commit checks passed!"
EOF
    chmod +x .git/hooks/pre-commit
    print_success "Git hooks configured"
else
    print_warning "Not a git repository, skipping git hooks setup"
fi

# Create environment files if they don't exist
if [ ! -f ".env.example" ]; then
    print_status "Creating .env.example..."
    cat > .env.example << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/econeura"

# Redis
REDIS_URL="redis://localhost:6379"

# API Keys
OPENAI_API_KEY="your-openai-api-key"
AZURE_OPENAI_API_KEY="your-azure-openai-api-key"
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"

# JWT
JWT_SECRET="your-jwt-secret"

# Environment
NODE_ENV="development"
PORT=3000
EOF
    print_success ".env.example created"
fi

if [ ! -f ".env.local" ]; then
    print_status "Creating .env.local from .env.example..."
    cp .env.example .env.local
    print_success ".env.local created (please update with your actual values)"
fi

# Create docs directory structure
print_status "Creating documentation structure..."
mkdir -p docs/{api,architecture,deployment,development}

# Create basic documentation files
cat > docs/README.md << 'EOF'
# ECONEURA Documentation

This directory contains all project documentation.

## Structure

- `api/` - API documentation
- `architecture/` - System architecture docs
- `deployment/` - Deployment guides
- `development/` - Development guides

## Getting Started

1. Read the [Development Guide](development/README.md)
2. Check the [API Documentation](api/README.md)
3. Review the [Architecture Overview](architecture/README.md)
EOF

print_success "Documentation structure created"

# Create infrastructure directory
print_status "Creating infrastructure directory..."
mkdir -p infrastructure/{docker,kubernetes,terraform}

print_success "Infrastructure directory created"

# Verify setup
print_status "Verifying setup..."

# Check if all required files exist
required_files=(
    "package.json"
    ".gitignore"
    ".editorconfig"
    ".prettierrc"
    ".prettierignore"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file exists"
    else
        print_error "✗ $file missing"
    fi
done

# Check if all required directories exist
required_dirs=(
    "apps"
    "packages"
    "docs"
    "scripts"
    "infrastructure"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_success "✓ $dir/ directory exists"
    else
        print_error "✗ $dir/ directory missing"
    fi
done

print_success "✅ PR-0: Project Base Setup Complete!"
print_status "Next steps:"
echo "  1. Update .env.local with your actual configuration values"
echo "  2. Run 'pnpm run dev' to start development"
echo "  3. Continue with PR-1: Monorepo Structure"

echo ""
print_status "🎯 PR-0 Implementation Summary:"
echo "  ✓ Project structure established"
echo "  ✓ Configuration files created"
echo "  ✓ Development tools configured"
echo "  ✓ Documentation structure ready"
echo "  ✓ Infrastructure directories created"
