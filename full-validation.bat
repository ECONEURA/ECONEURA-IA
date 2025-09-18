@echo off
echo "=== ECONEURA-IA FULL VALIDATION SUITE ==="
echo "Starting comprehensive validation..."
echo.

cd /d "C:\workspaces\ECONEURA-IA"

echo "=== 1. BUILD VALIDATION ==="
echo "Building API..."
pnpm --filter @econeura/api build
if %ERRORLEVEL% neq 0 (
    echo "❌ Build failed!"
    pause
    exit /b 1
)
echo "✅ Build successful!"
echo.

echo "=== 2. LINT VALIDATION ==="
echo "Running lint checks..."
pnpm --filter @econeura/api lint
if %ERRORLEVEL% neq 0 (
    echo "⚠️ Lint issues found!"
) else (
    echo "✅ Lint checks passed!"
)
echo.

echo "=== 3. TEST VALIDATION ==="
echo "Running tests..."
pnpm --filter @econeura/api test
if %ERRORLEVEL% neq 0 (
    echo "❌ Tests failed!"
) else (
    echo "✅ Tests passed!"
)
echo.

echo "=== 4. TEST COVERAGE ==="
echo "Generating coverage report..."
pnpm --filter @econeura/api test --coverage
echo.

echo "=== 5. FULL WORKSPACE BUILD ==="
echo "Building entire workspace..."
pnpm build
if %ERRORLEVEL% neq 0 (
    echo "⚠️ Some workspace builds may have issues"
) else (
    echo "✅ Full workspace build successful!"
)
echo.

echo "=== VALIDATION COMPLETE ==="
echo "Check the output above for any issues that need resolution."
echo "If all validations pass, the project is ready for deployment."
pause