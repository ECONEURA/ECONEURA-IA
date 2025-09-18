#!/bin/bash

echo "🔧 Fixing .js imports to .ts imports..."

# Count files with .js imports
JS_IMPORTS_COUNT=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | xargs grep -l "import.*from.*\.js" | wc -l)

echo "📊 Found $JS_IMPORTS_COUNT files with .js imports"

if [ $JS_IMPORTS_COUNT -eq 0 ]; then
    echo "✅ No .js imports found. Nothing to fix."
    exit 0
fi

# Fix .js imports in TypeScript files
echo "🔨 Fixing imports in TypeScript files..."

# Fix relative imports
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | while read file; do
    # Fix relative imports from .js to .ts
    sed -i '' 's/from '\''\.\/\([^'\'']*\)\.js'\''/from '\''\.\/\1.ts'\''/g' "$file"
    sed -i '' 's/from '\''\.\.\/\([^'\'']*\)\.js'\''/from '\''\.\.\/\1.ts'\''/g' "$file"
    sed -i '' 's/from '\''\.\.\/\.\.\/\([^'\'']*\)\.js'\''/from '\''\.\.\/\.\.\/\1.ts'\''/g' "$file"
    sed -i '' 's/from '\''\.\.\/\.\.\/\.\.\/\([^'\'']*\)\.js'\''/from '\''\.\.\/\.\.\/\.\.\/\1.ts'\''/g' "$file"
    
    # Fix imports without extension (add .ts)
    sed -i '' 's/from '\''\.\/\([^'\'']*\)'\''/from '\''\.\/\1.ts'\''/g' "$file"
    sed -i '' 's/from '\''\.\.\/\([^'\'']*\)'\''/from '\''\.\.\/\1.ts'\''/g' "$file"
    sed -i '' 's/from '\''\.\.\/\.\.\/\([^'\'']*\)'\''/from '\''\.\.\/\.\.\/\1.ts'\''/g' "$file"
    sed -i '' 's/from '\''\.\.\/\.\.\/\.\.\/\([^'\'']*\)'\''/from '\''\.\.\/\.\.\/\.\.\/\1.ts'\''/g' "$file"
done

# Fix specific problematic imports
echo "🔨 Fixing specific problematic imports..."

# Fix shared package imports
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | while read file; do
    # Fix @econeura/shared imports
    sed -i '' 's/from '\''@econeura\/shared\/src\/\([^'\'']*\)\.js'\''/from '\''@econeura\/shared\/src\/\1.ts'\''/g' "$file"
    sed -i '' 's/from '\''@econeura\/shared\/\([^'\'']*\)\.js'\''/from '\''@econeura\/shared\/\1.ts'\''/g' "$file"
    
    # Fix @econeura/db imports
    sed -i '' 's/from '\''@econeura\/db\/src\/\([^'\'']*\)\.js'\''/from '\''@econeura\/db\/src\/\1.ts'\''/g' "$file"
    sed -i '' 's/from '\''@econeura\/db\/\([^'\'']*\)\.js'\''/from '\''@econeura\/db\/\1.ts'\''/g' "$file"
    
    # Fix @econeura/agents imports
    sed -i '' 's/from '\''@econeura\/agents\/\([^'\'']*\)\.js'\''/from '\''@econeura\/agents\/\1.ts'\''/g' "$file"
done

# Count remaining .js imports
REMAINING_JS_IMPORTS=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | xargs grep -l "import.*from.*\.js" | wc -l)

echo "📊 Remaining .js imports: $REMAINING_JS_IMPORTS"

if [ $REMAINING_JS_IMPORTS -gt 0 ]; then
    echo "⚠️  Some .js imports remain. Manual review needed:"
    find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | xargs grep -l "import.*from.*\.js" | head -10
fi

echo "✅ Import fixing completed!"

# Run typecheck to verify fixes
echo "🔍 Running typecheck to verify fixes..."
if command -v pnpm &> /dev/null; then
    pnpm typecheck
else
    echo "⚠️  pnpm not found. Please run 'pnpm typecheck' manually to verify fixes."
fi

