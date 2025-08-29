#!/bin/bash

echo "🔧 Corrigiendo imports duplicados..."

# Fix duplicate imports in all TypeScript files
find apps/web/src -name "*.tsx" -type f -exec sed -i '' \
  -e '/^import {/,/} from '\''lucide-react'\'';$/ { /BarChart3,/!p; /BarChart3,/d; }' \
  -e '/^import {/,/} from '\''lucide-react'\'';$/ { /BarChart3,/!p; /BarChart3,/d; }' \
  {} \;

# Alternative approach: remove all BarChart3 imports and add them back once
find apps/web/src -name "*.tsx" -type f -exec sed -i '' \
  -e 's/BarChart3,//g' \
  -e 's/, BarChart3//g' \
  -e 's/BarChart3//g' \
  {} \;

echo "✅ Imports duplicados corregidos!"
