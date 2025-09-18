#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Ejecutando auditoría completa de ECONEURA..."

# Crear directorio de artefactos
mkdir -p .artifacts/audit

echo "📊 Ejecutando jscpd (duplicación de código)..."
NODE_OPTIONS="--max-old-space-size=4096" npx --yes jscpd@4.0.4 --reporters json --output .artifacts/audit --threshold 0.5 --min-tokens 50 . || true

echo "🔍 Ejecutando knip (exports no utilizados)..."
npx --yes knip@5.27.2 --reporter json > .artifacts/audit/knip.json || true

echo "📝 Ejecutando ts-prune (código muerto TypeScript)..."
npx --yes ts-prune@0.10.3 -p tsconfig.base.json > .artifacts/audit/ts-prune.txt || true

echo "📦 Ejecutando depcheck (dependencias huérfanas)..."
npx --yes depcheck@1.4.7 --json > .artifacts/audit/depcheck.json || true

echo "🔒 Ejecutando gitleaks (secretos en git)..."
npx --yes gitleaks@8.18.0 detect --no-git -r .artifacts/audit/gitleaks.json || true

echo "🕵️ Ejecutando trufflehog (secretos en filesystem)..."
npx --yes trufflehog@3.78.0 filesystem --json . > .artifacts/audit/trufflehog.json || true

echo "📏 Identificando archivos grandes (>1MB)..."
git ls-files -z | xargs -0 -I{} bash -c '[[ $(wc -c < "{}") -gt 1048576 ]] && echo "{}"' > .artifacts/audit/large-files.txt || true

echo "✅ Auditoría completa finalizada. Artefactos en .artifacts/audit/"
