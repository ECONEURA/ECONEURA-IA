@echo off
cd /d "C:\workspaces\ECONEURA-IA"
echo "=== VERIFICACION DE COMPILACION ==="
echo "Intentando compilar con diferentes metodos..."

echo.
echo "=== Metodo 1: pnpm build ==="
pnpm --filter @econeura/api build 2>&1 | head -n 20

echo.
echo "=== Metodo 2: npm run build ==="
cd apps\api
npm run build 2>&1 | head -n 20

echo.
echo "=== Metodo 3: tsc directo ==="
npx tsc -p tsconfig.json 2>&1 | head -n 20

echo.
echo "=== Metodo 4: node con tsc global ==="
node -e "console.log('Testing node availability')"
tsc -p tsconfig.json 2>&1 | head -n 20

pause