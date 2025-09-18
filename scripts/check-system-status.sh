#!/bin/bash

# ECONEURA System Status Checker
# Verifica el estado actual del sistema y PRs implementados

echo "🔍 ECONEURA SYSTEM STATUS CHECKER"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local endpoint=$3
    
    if curl -s -f "http://localhost:$port$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name${NC} - Running on port $port"
        return 0
    else
        echo -e "${RED}❌ $service_name${NC} - Not running on port $port"
        return 1
    fi
}

# Function to check PR implementation
check_pr() {
    local pr_number=$1
    local pr_name=$2
    local file_path=$3
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✅ PR-$pr_number${NC} - $pr_name"
        return 0
    else
        echo -e "${RED}❌ PR-$pr_number${NC} - $pr_name (Missing: $file_path)"
        return 1
    fi
}

echo -e "${BLUE}📊 SYSTEM SERVICES STATUS${NC}"
echo "=========================="

# Check main services
check_service "API Server" 3001 "/health"
check_service "Web App" 3000 "/"
check_service "Database Studio" 4983 "/"

echo ""
echo -e "${BLUE}📋 PRs IMPLEMENTATION STATUS${NC}"
echo "=============================="

# Core Infrastructure PRs
echo -e "${YELLOW}Core Infrastructure:${NC}"
check_pr "0" "Monorepo Setup" "package.json"
check_pr "1" "Database Schema" "packages/db/src/schema.ts"
check_pr "2" "API Foundation" "apps/api/src/index.ts"
check_pr "3" "Authentication System" "apps/api/src/lib/auth.service.ts"
check_pr "4" "Authorization & RBAC" "apps/api/src/lib/rbac.service.ts"
check_pr "5" "Error Handling" "apps/api/src/lib/error-handler.ts"
check_pr "6" "Logging System" "apps/api/src/lib/structured-logger.ts"
check_pr "7" "Health Checks" "apps/api/src/lib/health-monitor.ts"

echo ""
echo -e "${YELLOW}Business Features:${NC}"
check_pr "8" "CRM Contacts" "apps/api/src/routes/contacts.ts"
check_pr "9" "CRM Companies" "apps/api/src/routes/companies.ts"
check_pr "10" "CRM Deals" "apps/api/src/routes/deals.ts"
check_pr "11" "ERP Products" "apps/api/src/routes/products.ts"
check_pr "12" "ERP Inventory" "apps/api/src/routes/inventory.ts"
check_pr "13" "ERP Suppliers" "apps/api/src/routes/suppliers.ts"
check_pr "14" "Finance Accounts" "apps/api/src/routes/accounts.ts"
check_pr "15" "Finance Transactions" "apps/api/src/routes/transactions.ts"

echo ""
echo -e "${YELLOW}AI & Analytics:${NC}"
check_pr "23" "AI Router" "packages/shared/src/ai/mistral-azure-router.ts"
check_pr "24" "Cost Tracking" "apps/api/src/lib/cost-tracker.service.ts"
check_pr "25" "Prompt Library" "apps/api/src/lib/prompt-library.service.ts"
check_pr "26" "Analytics Engine" "apps/api/src/lib/analytics.service.ts"
check_pr "27" "Observability" "apps/api/src/middleware/observability.ts"
check_pr "28" "FinOps System" "apps/api/src/lib/finops.ts"
check_pr "29" "Performance Monitoring" "apps/api/src/lib/performance-monitor.ts"
check_pr "30" "Advanced Analytics" "apps/api/src/routes/advanced-analytics.ts"

echo ""
echo -e "${YELLOW}Security & Compliance:${NC}"
check_pr "33" "Advanced Security" "apps/api/src/lib/security-manager.service.ts"
check_pr "34" "RBAC Granular" "apps/api/src/routes/rbac-granular.ts"
check_pr "35" "GDPR Compliance" "apps/api/src/lib/gdpr.service.ts"
check_pr "36" "HITL System" "apps/api/src/routes/hitl-v2.ts"
check_pr "37" "Stripe Integration" "apps/api/src/routes/stripe-receipts.ts"
check_pr "38" "Inventory Kardex" "apps/api/src/routes/inventory-kardex.ts"
check_pr "39" "Supplier Scorecard" "apps/api/src/routes/supplier-scorecard.ts"
check_pr "40" "Interactions SAS+AV" "apps/api/src/routes/interactions-sas-av.ts"

echo ""
echo -e "${YELLOW}Integration & APIs:${NC}"
check_pr "41" "Fiscalidad Regional" "apps/api/src/lib/fiscalidad-regional.service.ts"
check_pr "42" "SEPA Parser" "apps/api/src/lib/sepa-parser.service.ts"
check_pr "43" "RLS Generativa" "apps/api/src/routes/rls-generativa.ts"
check_pr "44" "Blue/Green Deployment" "apps/api/src/routes/blue-green-deployment.ts"
check_pr "45" "FinOps Advanced" "apps/api/src/lib/finops.ts"
check_pr "46" "Semantic Search CRM" "apps/api/src/routes/semantic-search-crm.ts"
check_pr "54" "Reportes Mensuales" "apps/api/src/routes/reportes-mensuales.ts"

echo ""
echo -e "${YELLOW}FASE 5 - Integration:${NC}"
check_pr "FASE-5" "Service Discovery" "packages/shared/src/services/service-discovery.ts"
check_pr "FASE-5" "Service Client" "packages/shared/src/clients/service-client.ts"
check_pr "FASE-5" "Webhook Manager" "packages/shared/src/services/webhook-manager.ts"
check_pr "FASE-5" "Workers Integration" "apps/api/src/lib/workers-integration.service.ts"
check_pr "FASE-5" "Workers Routes" "apps/api/src/routes/workers-integration.ts"

echo ""
echo -e "${BLUE}📈 SYSTEM METRICS${NC}"
echo "=================="

# Count implemented PRs
total_prs=85
implemented_prs=0
missing_prs=0

# Count files in key directories
api_routes=$(find apps/api/src/routes -name "*.ts" 2>/dev/null | wc -l)
api_services=$(find apps/api/src/lib -name "*.ts" 2>/dev/null | wc -l)
shared_services=$(find packages/shared/src -name "*.ts" 2>/dev/null | wc -l)

echo "API Routes: $api_routes"
echo "API Services: $api_services"
echo "Shared Services: $shared_services"

echo ""
echo -e "${BLUE}🧪 TESTING STATUS${NC}"
echo "=================="

# Check if tests exist
if [ -d "apps/api/src/__tests__" ]; then
    test_files=$(find apps/api/src/__tests__ -name "*.test.ts" 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ API Tests${NC} - $test_files test files"
else
    echo -e "${RED}❌ API Tests${NC} - No test directory found"
fi

if [ -d "apps/workers/src/__tests__" ]; then
    worker_tests=$(find apps/workers/src/__tests__ -name "*.test.ts" 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Workers Tests${NC} - $worker_tests test files"
else
    echo -e "${RED}❌ Workers Tests${NC} - No test directory found"
fi

echo ""
echo -e "${BLUE}📊 SUMMARY${NC}"
echo "=========="

# Calculate completion percentage
if [ $total_prs -gt 0 ]; then
    completion_percentage=$((implemented_prs * 100 / total_prs))
    echo "Total PRs: $total_prs"
    echo "Implemented: $implemented_prs"
    echo "Missing: $missing_prs"
    echo "Completion: $completion_percentage%"
fi

echo ""
echo -e "${BLUE}🚀 NEXT STEPS${NC}"
echo "============="
echo "1. Complete remaining PRs without Azure (18 PRs)"
echo "2. Implement Azure-dependent PRs (20 PRs)"
echo "3. Run comprehensive testing"
echo "4. Deploy to production"

echo ""
echo -e "${GREEN}✅ System status check completed!${NC}"
