#!/bin/bash

# ============================================================================
# FIX CODE QUALITY - Correcciones específicas de calidad de código
# ============================================================================

set -euo pipefail

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "🔧 Fixing code quality issues..."

# 1. Remove unused imports (basic cleanup)
log_info "Removing obvious unused imports..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | while read file; do
    if [[ -f "$file" ]]; then
        # Remove imports that are clearly unused (starting with unused comment)
        sed -i '/\/\/ @ts-ignore.*unused/d' "$file"
        sed -i '/\/\* eslint-disable.*unused-vars \*\//d' "$file"
    fi
done

# 2. Fix missing return types where obvious
log_info "Adding obvious return types..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | while read file; do
    if [[ -f "$file" ]]; then
        # Add void return type to functions that don't return anything
        sed -i 's/function \([^(]*\)(\([^)]*\)) {/function \1(\2): void {/g' "$file"
        # Fix async functions without return type
        sed -i 's/async function \([^(]*\)(\([^)]*\)) {/async function \1(\2): Promise<void> {/g' "$file"
    fi
done

# 3. Fix boolean comparisons
log_info "Fixing boolean comparisons..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | while read file; do
    if [[ -f "$file" ]]; then
        # Fix == true/false comparisons
        sed -i 's/== true//' "$file"
        sed -i 's/=== true//' "$file"
        sed -i 's/== false//' "$file"
        sed -i 's/=== false//' "$file"
        sed -i 's/!== false//' "$file"
        sed -i 's/!= false//' "$file"
    fi
done

# 4. Fix string concatenation to template literals (simple cases)
log_info "Converting simple string concatenations to template literals..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | while read file; do
    if [[ -f "$file" ]]; then
        # Convert simple concatenations like "Hello " + name + "!"
        # This is a basic conversion, complex cases will need manual review
        sed -i "s/\"\\([^\"]*\\)\" + \\([a-zA-Z_][a-zA-Z0-9_]*\\) + \"\\([^\"]*\\)\"/\`\\1\${\2}\\3\`/g" "$file"
    fi
done

# 5. Remove redundant else after return
log_info "Removing redundant else statements..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | while read file; do
    if [[ -f "$file" ]]; then
        # This is complex and needs careful handling, so we'll just mark for manual review
        if grep -q "return.*; } else {" "$file"; then
            log_warning "File $file may have redundant else after return - manual review needed"
        fi
    fi
done

# 6. Fix var declarations to const/let
log_info "Converting var declarations to const/let..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | while read file; do
    if [[ -f "$file" ]]; then
        # Convert var to let (conservative approach)
        sed -i 's/^[[:space:]]*var /  let /g' "$file"
    fi
done

# 7. Add missing semicolons (basic cases)
log_info "Adding missing semicolons..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | while read file; do
    if [[ -f "$file" ]]; then
        # Add semicolons to simple statements (conservative)
        sed -i 's/^\([[:space:]]*[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*([^)]*)\)$/\1;/g' "$file"
        sed -i 's/^\([[:space:]]*return [^{;]*\)$/\1;/g' "$file"
    fi
done

# 8. Fix indentation inconsistencies (convert tabs to spaces)
log_info "Converting tabs to spaces..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | while read file; do
    if [[ -f "$file" ]]; then
        # Convert tabs to 2 spaces
        sed -i 's/\t/  /g' "$file"
    fi
done

# 9. Remove trailing whitespace
log_info "Removing trailing whitespace..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | while read file; do
    if [[ -f "$file" ]]; then
        sed -i 's/[[:space:]]*$//' "$file"
    fi
done

# 10. Add missing final newline
log_info "Adding missing final newlines..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | while read file; do
    if [[ -f "$file" ]]; then
        # Add newline at end of file if missing
        sed -i -e '$a\' "$file"
    fi
done

log_success "Code quality fixes completed!"

# Generate summary
echo ""
echo "📊 Summary of fixes applied:"
echo "  ✅ Unused import comments removed"
echo "  ✅ Basic return types added"
echo "  ✅ Boolean comparisons simplified"
echo "  ✅ Simple string concatenations converted to template literals"
echo "  ✅ var declarations converted to let"
echo "  ✅ Basic semicolons added"
echo "  ✅ Tabs converted to spaces"
echo "  ✅ Trailing whitespace removed"
echo "  ✅ Final newlines added"
echo ""
echo "⚠️  Some issues may require manual review:"
echo "  - Complex boolean logic"
echo "  - Advanced type annotations"
echo "  - Redundant else statements"
echo "  - Complex string concatenations"
echo ""
echo "💡 Run linter after these fixes to catch remaining issues"