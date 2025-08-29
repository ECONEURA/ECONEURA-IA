#!/bin/bash

echo "🔧 Corrigiendo imports de .js a .ts en packages/shared..."

# Find all TypeScript files in packages/shared and replace .js imports with .ts
find packages/shared/src -name "*.ts" -type f -exec sed -i '' 's/from '\''\.\/\([^'\'']*\)\.js'\''/from '\''\.\/\1.ts'\''/g' {} \;
find packages/shared/src -name "*.ts" -type f -exec sed -i '' 's/from '\''\.\.\/\([^'\'']*\)\.js'\''/from '\''\.\.\/\1.ts'\''/g' {} \;
find packages/shared/src -name "*.ts" -type f -exec sed -i '' 's/from '\''\.\.\/\.\.\/\([^'\'']*\)\.js'\''/from '\''\.\.\/\.\.\/\1.ts'\''/g' {} \;

echo "✅ Imports corregidos!"

