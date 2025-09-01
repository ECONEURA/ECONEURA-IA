#!/usr/bin/env zsh

echo "🔍 Validando tipos en todo el proyecto..."

# Validar packages primero
echo "\n📦 Validando packages..."
for pkg in packages/*; do
  if [ -d "$pkg" ]; then
    echo "\n🔸 Validando $pkg..."
    cd $pkg
    pnpm tsc --noEmit
    if [ $? -ne 0 ]; then
      echo "❌ Error en $pkg"
      exit 1
    fi
    cd ../..
  fi
done

# Validar apps después
echo "\n📱 Validando apps..."
for app in apps/*; do
  if [ -d "$app" ]; then
    echo "\n🔸 Validando $app..."
    cd $app
    pnpm tsc --noEmit
    if [ $? -ne 0 ]; then
      echo "❌ Error en $app"
      exit 1
    fi
    cd ../..
  fi
done

echo "\n✅ Validación de tipos completada exitosamente!"
