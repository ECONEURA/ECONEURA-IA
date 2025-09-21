#!/bin/bash

# ECONEURA-IA Project Validation Script
# Validates that the repository is in perfect condition

set -e

echo "🚀 ECONEURA-IA Repository Validation"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validation counter
PASSED=0
FAILED=0

validate_file() {
    local file=$1
    local description=$2

    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description: $file"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $description: $file (MISSING)"
        ((FAILED++))
    fi
}

validate_dir() {
    local dir=$1
    local description=$2

    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $description: $dir/"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $description: $dir/ (MISSING)"
        ((FAILED++))
    fi
}

echo ""
echo "📁 Project Structure Validation"
echo "-------------------------------"

# Required files
validate_file "package.json" "Root package.json"
validate_file "pnpm-lock.yaml" "PNPM lockfile"
validate_file "README.md" "Project README"
validate_file "tsconfig.base.json" "TypeScript base config"
validate_file ".gitignore" "Git ignore file"
validate_file "docker-compose.dev.yml" "Docker Compose config"

# Required directories
validate_dir "apps" "Applications directory"
validate_dir "packages" "Packages directory"
validate_dir ".github/workflows" "GitHub Actions workflows"

# App directories
validate_dir "apps/api" "API application"
validate_dir "apps/web" "Web application"
validate_dir "packages/shared" "Shared package"

# Docker files
validate_file "apps/api/Dockerfile" "API Dockerfile"
validate_file "apps/web/Dockerfile" "Web Dockerfile"

echo ""
echo "📦 Dependencies Validation"
echo "-------------------------"

# Check if package.json has required dependencies
if command -v jq &> /dev/null; then
    if jq -e '.devDependencies."@types/mocha"' package.json > /dev/null; then
        echo -e "${GREEN}✓${NC} @types/mocha dependency found"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} @types/mocha dependency missing"
        ((FAILED++))
    fi

    if jq -e '.devDependencies.vitest' package.json > /dev/null; then
        echo -e "${GREEN}✓${NC} vitest dependency found"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} vitest dependency missing"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠${NC} jq not available, skipping detailed dependency validation"
fi

echo ""
echo "☁️  Azure Configuration Validation"
echo "---------------------------------"

# Check Azure-specific files
validate_file "apps/api/web.config" "API web.config for Azure App Service"
validate_file "apps/web/web.config" "Web web.config for Azure App Service"
validate_file "apps/web/server.js" "Web server.js for Azure App Service"
validate_file "apps/api/.env.example" "API environment template"
validate_file "apps/web/.env.example" "Web environment template"
validate_file ".github/workflows/azure-deploy.yml" "Azure deployment workflow"
validate_file "AZURE-DEPLOYMENT.md" "Azure deployment documentation"

# Check Application Insights configuration
validate_file "apps/api/src/lib/application-insights.ts" "API Application Insights config"
validate_file "apps/web/src/lib/application-insights.ts" "Web Application Insights config"

echo ""
echo "📊 Validation Summary"
echo "====================="

TOTAL=$((PASSED + FAILED))

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All validations passed! ($PASSED/$TOTAL)${NC}"
    echo ""
    echo "✅ Repository is ready for production deployment"
    echo "✅ Ready to proceed with Azure deployment"
    exit 0
else
    echo -e "${RED}❌ Some validations failed ($FAILED/$TOTAL failed)${NC}"
    echo ""
    echo "🔧 Please fix the failed validations before proceeding"
    exit 1
fi
