#!/bin/bash

echo "🔧 Fixing console.log statements..."

# Count files with console.log
CONSOLE_LOGS_COUNT=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | xargs grep -l "console\." | wc -l)

echo "📊 Found $CONSOLE_LOGS_COUNT files with console.log statements"

if [ $CONSOLE_LOGS_COUNT -eq 0 ]; then
    echo "✅ No console.log statements found. Nothing to fix."
    exit 0
fi

# Replace console.log with structured logger
echo "🔨 Replacing console.log with structured logger..."

find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | while read file; do
    # Check if file already imports logger
    if ! grep -q "import.*logger" "$file"; then
        # Add logger import at the top
        sed -i '' '1i\
import { logger } from '\''@econeura/shared/monitoring/logger'\'';
' "$file"
    fi
    
    # Replace console.log with logger.info
    sed -i '' 's/console\.log(/logger.info(/g' "$file"
    
    # Replace console.error with logger.error
    sed -i '' 's/console\.error(/logger.error(/g' "$file"
    
    # Replace console.warn with logger.warn
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    
    # Replace console.info with logger.info
    sed -i '' 's/console\.info(/logger.info(/g' "$file"
    
    # Replace console.debug with logger.debug
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
done

# Count remaining console statements
REMAINING_CONSOLE=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | xargs grep -l "console\." | wc -l)

echo "📊 Remaining console statements: $REMAINING_CONSOLE"

if [ $REMAINING_CONSOLE -gt 0 ]; then
    echo "⚠️  Some console statements remain. Manual review needed:"
    find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | xargs grep -l "console\." | head -10
fi

echo "✅ Console.log fixing completed!"

# Run lint to verify fixes
echo "🔍 Running lint to verify fixes..."
if command -v pnpm &> /dev/null; then
    pnpm lint
else
    echo "⚠️  pnpm not found. Please run 'pnpm lint' manually to verify fixes."
fi

