#!/bin/bash

echo "🎨 Solucionando URLs SVG problemáticas..."

# Fix SVG URLs in React components
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/bg-\[url.*data:image\/svg+xml.*\]/bg-gradient-to-br from-white\/10 to-transparent/g' {} \;

echo "✅ URLs SVG solucionadas!"

