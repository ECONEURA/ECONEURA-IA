#!/usr/bin/env bash
set -euo pipefail

echo " Validando tipos en todo el proyecto..."

echo "\n🧱 Precompilando tipos de @econeura/shared..."
pnpm --filter "@econeura/shared" build || { echo "❌ Falló la build de @econeura/shared"; exit 1; }

echo "\n📦 Validando packages..."
pnpm -r --filter "./packages/*" exec tsc --noEmit || { echo "❌ Error en packages"; exit 1; }

echo "\n📱 Validando apps..."
pnpm -r --filter "./apps/*" exec tsc --noEmit || { echo "❌ Error en apps"; exit 1; }

echo "✅ Typecheck completo OK"

echo "\n✅ Validación de tipos completada exitosamente!"
