#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Typechecking packages (@econeura/shared and @econeura/api)..."
pnpm --filter @econeura/shared exec tsc --noEmit -p tsconfig.json
pnpm --filter @econeura/api exec tsc --noEmit -p tsconfig.json
echo "✅ Typecheck OK"
#!/usr/bin/env zsh

echo "🔍 Validando tipos en todo el proyecto..."

echo "\n🧱 Precompilando tipos de @econeura/shared..."
pnpm --filter "@econeura/shared" build || { echo "❌ Falló la build de @econeura/shared"; exit 1; }

echo "\n📦 Validando packages..."
pnpm -r --filter "./packages/*" exec tsc --noEmit || { echo "❌ Error en packages"; exit 1; }

echo "\n📱 Validando apps..."
pnpm -r --filter "./apps/*" exec tsc --noEmit || { echo "❌ Error en apps"; exit 1; }

echo "\n✅ Validación de tipos completada exitosamente!"
