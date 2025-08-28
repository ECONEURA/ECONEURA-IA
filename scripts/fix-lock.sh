#!/usr/bin/env bash
set -euo pipefail
echo "🔧 Regenerando package-lock.json…"
git rm -f --cached package-lock.json || true
rm -rf node_modules package-lock.json
npm install --package-lock-only
npm ci
git add package-lock.json
echo "✅ Listo. Haz commit cuando revises los cambios."
