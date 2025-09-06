#!/bin/bash

# ============================================================================
# FRAMEWORK DE TESTING AUTOMATIZADO - ECONEURA IA
# ============================================================================
# Sistema de testing automático para todos los PRs
# Incluye tests unitarios, integración, performance y seguridad
# ============================================================================

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
TEST_RESULTS_DIR="test-results"
COVERAGE_DIR="coverage"
PERFORMANCE_DIR="performance-results"
SECURITY_DIR="security-results"

# Logging
TEST_LOG_FILE="testing-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$TEST_LOG_FILE")
exec 2>&1

echo -e "${BLUE}🧪 FRAMEWORK DE TESTING AUTOMATIZADO - ECONEURA IA${NC}"
echo -e "${BLUE}=================================================${NC}"
echo -e "${CYAN}📅 Fecha: $(date)${NC}"
echo -e "${CYAN}📝 Log: $TEST_LOG_FILE${NC}"
echo ""

# ============================================================================
# FUNCIONES DE TESTING
# ============================================================================

# Función para crear estructura de testing
create_test_structure() {
    echo -e "${YELLOW}📁 Creando estructura de testing...${NC}"
    
    mkdir -p "$TEST_RESULTS_DIR"
    mkdir -p "$COVERAGE_DIR"
    mkdir -p "$PERFORMANCE_DIR"
    mkdir -p "$SECURITY_DIR"
    
    # Crear archivos de configuración de testing
    cat > "vitest.config.ts" << 'EOF'
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@econeura/shared': resolve(__dirname, './packages/shared/src'),
      '@econeura/db': resolve(__dirname, './packages/db/src'),
      '@econeura/sdk': resolve(__dirname, './packages/sdk/src'),
      '@econeura/api': resolve(__dirname, './apps/api/src'),
      '@econeura/web': resolve(__dirname, './apps/web/src')
    }
  }
});
EOF

    cat > "test/setup.ts" << 'EOF'
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from './helpers/database';
import { setupTestRedis, teardownTestRedis } from './helpers/redis';
import { setupTestAuth, teardownTestAuth } from './helpers/auth';

// Setup global test environment
beforeAll(async () => {
  await setupTestDatabase();
  await setupTestRedis();
  await setupTestAuth();
});

afterAll(async () => {
  await teardownTestAuth();
  await teardownTestRedis();
  await teardownTestDatabase();
});

// Clean up between tests
beforeEach(async () => {
  // Clean database state
  await setupTestDatabase();
});

afterEach(async () => {
  // Clean up any test data
});
EOF

    echo -e "${GREEN}✅ Estructura de testing creada${NC}"
}

# Función para ejecutar tests unitarios
run_unit_tests() {
    local pr_number=$1
    
    echo -e "${YELLOW}🧪 Ejecutando tests unitarios para PR-$pr_number...${NC}"
    
    # Ejecutar tests unitarios con coverage
    pnpm test:unit --coverage --reporter=verbose --outputFile="$TEST_RESULTS_DIR/unit-tests-pr-$pr_number.json" || {
        echo -e "${RED}❌ Tests unitarios fallaron para PR-$pr_number${NC}"
        return 1
    }
    
    # Generar reporte de coverage
    pnpm test:coverage --reporter=html --outputDir="$COVERAGE_DIR/pr-$pr_number" || {
        echo -e "${RED}❌ Generación de coverage falló para PR-$pr_number${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Tests unitarios completados para PR-$pr_number${NC}"
    return 0
}

# Función para ejecutar tests de integración
run_integration_tests() {
    local pr_number=$1
    
    echo -e "${YELLOW}🔗 Ejecutando tests de integración para PR-$pr_number...${NC}"
    
    # Ejecutar tests de integración
    pnpm test:integration --reporter=verbose --outputFile="$TEST_RESULTS_DIR/integration-tests-pr-$pr_number.json" || {
        echo -e "${RED}❌ Tests de integración fallaron para PR-$pr_number${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Tests de integración completados para PR-$pr_number${NC}"
    return 0
}

# Función para ejecutar tests de performance
run_performance_tests() {
    local pr_number=$1
    
    echo -e "${YELLOW}⚡ Ejecutando tests de performance para PR-$pr_number...${NC}"
    
    # Ejecutar tests de performance con k6
    k6 run --out json="$PERFORMANCE_DIR/performance-pr-$pr_number.json" tests/performance/api.performance.test.ts || {
        echo -e "${RED}❌ Tests de performance fallaron para PR-$pr_number${NC}"
        return 1
    }
    
    # Ejecutar tests de carga
    k6 run --out json="$PERFORMANCE_DIR/load-pr-$pr_number.json" tests/k6/load-test.js || {
        echo -e "${RED}❌ Tests de carga fallaron para PR-$pr_number${NC}"
        return 1
    }
    
    # Ejecutar tests de estrés
    k6 run --out json="$PERFORMANCE_DIR/stress-pr-$pr_number.json" tests/k6/stress-test.js || {
        echo -e "${RED}❌ Tests de estrés fallaron para PR-$pr_number${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Tests de performance completados para PR-$pr_number${NC}"
    return 0
}

# Función para ejecutar tests de seguridad
run_security_tests() {
    local pr_number=$1
    
    echo -e "${YELLOW}🔒 Ejecutando tests de seguridad para PR-$pr_number...${NC}"
    
    # Ejecutar audit de dependencias
    pnpm audit --json > "$SECURITY_DIR/audit-pr-$pr_number.json" || {
        echo -e "${RED}❌ Audit de dependencias falló para PR-$pr_number${NC}"
        return 1
    }
    
    # Ejecutar tests de seguridad
    pnpm test:security --reporter=verbose --outputFile="$SECURITY_DIR/security-tests-pr-$pr_number.json" || {
        echo -e "${RED}❌ Tests de seguridad fallaron para PR-$pr_number${NC}"
        return 1
    }
    
    # Ejecutar análisis de vulnerabilidades
    npm audit --audit-level=moderate || {
        echo -e "${RED}❌ Análisis de vulnerabilidades falló para PR-$pr_number${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Tests de seguridad completados para PR-$pr_number${NC}"
    return 0
}

# Función para ejecutar tests end-to-end
run_e2e_tests() {
    local pr_number=$1
    
    echo -e "${YELLOW}🌐 Ejecutando tests end-to-end para PR-$pr_number...${NC}"
    
    # Ejecutar tests E2E con Playwright
    pnpm test:e2e --reporter=verbose --outputFile="$TEST_RESULTS_DIR/e2e-tests-pr-$pr_number.json" || {
        echo -e "${RED}❌ Tests E2E fallaron para PR-$pr_number${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Tests E2E completados para PR-$pr_number${NC}"
    return 0
}

# Función para generar reporte de testing
generate_test_report() {
    local pr_number=$1
    
    echo -e "${YELLOW}📊 Generando reporte de testing para PR-$pr_number...${NC}"
    
    # Crear reporte HTML
    cat > "$TEST_RESULTS_DIR/report-pr-$pr_number.html" << EOF
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Testing - PR-$pr_number</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background: #d4edda; border-color: #c3e6cb; }
        .error { background: #f8d7da; border-color: #f5c6cb; }
        .warning { background: #fff3cd; border-color: #ffeaa7; }
        .info { background: #d1ecf1; border-color: #bee5eb; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metric { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 5px; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Reporte de Testing - PR-$pr_number</h1>
        <p><strong>Fecha:</strong> $(date)</p>
        <p><strong>PR:</strong> $pr_number</p>
    </div>
    
    <div class="section info">
        <h2>📋 Resumen Ejecutivo</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value" id="total-tests">-</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value" id="passed-tests">-</div>
                <div class="metric-label">Tests Pasados</div>
            </div>
            <div class="metric">
                <div class="metric-value" id="failed-tests">-</div>
                <div class="metric-label">Tests Fallidos</div>
            </div>
            <div class="metric">
                <div class="metric-value" id="coverage">-</div>
                <div class="metric-label">Coverage</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>🧪 Tests Unitarios</h2>
        <p>Resultados de tests unitarios con coverage detallado.</p>
        <a href="coverage/pr-$pr_number/index.html" target="_blank">Ver Coverage Report</a>
    </div>
    
    <div class="section">
        <h2>🔗 Tests de Integración</h2>
        <p>Resultados de tests de integración entre componentes.</p>
    </div>
    
    <div class="section">
        <h2>⚡ Tests de Performance</h2>
        <p>Resultados de tests de performance y carga.</p>
    </div>
    
    <div class="section">
        <h2>🔒 Tests de Seguridad</h2>
        <p>Resultados de tests de seguridad y auditoría.</p>
    </div>
    
    <div class="section">
        <h2>🌐 Tests End-to-End</h2>
        <p>Resultados de tests end-to-end completos.</p>
    </div>
    
    <script>
        // Cargar métricas dinámicamente
        fetch('unit-tests-pr-$pr_number.json')
            .then(response => response.json())
            .then(data => {
                document.getElementById('total-tests').textContent = data.numTotalTests || 0;
                document.getElementById('passed-tests').textContent = data.numPassedTests || 0;
                document.getElementById('failed-tests').textContent = data.numFailedTests || 0;
                document.getElementById('coverage').textContent = (data.coverage?.lines?.pct || 0) + '%';
            })
            .catch(error => console.error('Error cargando métricas:', error));
    </script>
</body>
</html>
EOF
    
    echo -e "${GREEN}✅ Reporte de testing generado para PR-$pr_number${NC}"
}

# Función para validar calidad de código
validate_code_quality() {
    local pr_number=$1
    
    echo -e "${YELLOW}🔍 Validando calidad de código para PR-$pr_number...${NC}"
    
    # Linting
    echo -e "${CYAN}📝 Ejecutando linting...${NC}"
    pnpm lint --format=json --output-file="$TEST_RESULTS_DIR/lint-pr-$pr_number.json" || {
        echo -e "${RED}❌ Linting falló para PR-$pr_number${NC}"
        return 1
    }
    
    # Type checking
    echo -e "${CYAN}🔍 Ejecutando type checking...${NC}"
    pnpm typecheck || {
        echo -e "${RED}❌ Type checking falló para PR-$pr_number${NC}"
        return 1
    }
    
    # Formatting
    echo -e "${CYAN}🎨 Ejecutando formatting...${NC}"
    pnpm format --check || {
        echo -e "${RED}❌ Formatting falló para PR-$pr_number${NC}"
        return 1
    }
    
    # Complexity analysis
    echo -e "${CYAN}📊 Ejecutando análisis de complejidad...${NC}"
    pnpm complexity --format=json --output-file="$TEST_RESULTS_DIR/complexity-pr-$pr_number.json" || {
        echo -e "${RED}❌ Análisis de complejidad falló para PR-$pr_number${NC}"
        return 1
    }
    
    echo -e "${GREEN}✅ Validación de calidad de código completada para PR-$pr_number${NC}"
    return 0
}

# Función para ejecutar suite completa de tests
run_complete_test_suite() {
    local pr_number=$1
    
    echo -e "${PURPLE}🧪 EJECUTANDO SUITE COMPLETA DE TESTS PARA PR-$pr_number${NC}"
    echo -e "${PURPLE}====================================================${NC}"
    
    local test_results=()
    
    # Crear estructura de testing
    create_test_structure
    
    # Ejecutar tests unitarios
    if run_unit_tests "$pr_number"; then
        test_results+=("✅ Tests unitarios: PASSED")
    else
        test_results+=("❌ Tests unitarios: FAILED")
    fi
    
    # Ejecutar tests de integración
    if run_integration_tests "$pr_number"; then
        test_results+=("✅ Tests de integración: PASSED")
    else
        test_results+=("❌ Tests de integración: FAILED")
    fi
    
    # Ejecutar tests de performance
    if run_performance_tests "$pr_number"; then
        test_results+=("✅ Tests de performance: PASSED")
    else
        test_results+=("❌ Tests de performance: FAILED")
    fi
    
    # Ejecutar tests de seguridad
    if run_security_tests "$pr_number"; then
        test_results+=("✅ Tests de seguridad: PASSED")
    else
        test_results+=("❌ Tests de seguridad: FAILED")
    fi
    
    # Ejecutar tests E2E
    if run_e2e_tests "$pr_number"; then
        test_results+=("✅ Tests E2E: PASSED")
    else
        test_results+=("❌ Tests E2E: FAILED")
    fi
    
    # Validar calidad de código
    if validate_code_quality "$pr_number"; then
        test_results+=("✅ Calidad de código: PASSED")
    else
        test_results+=("❌ Calidad de código: FAILED")
    fi
    
    # Generar reporte
    generate_test_report "$pr_number"
    
    # Mostrar resultados
    echo -e "${BLUE}📊 RESULTADOS DE TESTING PARA PR-$pr_number${NC}"
    echo -e "${BLUE}==========================================${NC}"
    for result in "${test_results[@]}"; do
        echo -e "$result"
    done
    
    # Determinar si todos los tests pasaron
    local failed_tests=0
    for result in "${test_results[@]}"; do
        if [[ $result == *"FAILED"* ]]; then
            ((failed_tests++))
        fi
    done
    
    if [ $failed_tests -eq 0 ]; then
        echo -e "${GREEN}🎉 TODOS LOS TESTS PASARON PARA PR-$pr_number${NC}"
        return 0
    else
        echo -e "${RED}❌ $failed_tests TESTS FALLARON PARA PR-$pr_number${NC}"
        return 1
    fi
}

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

main() {
    local pr_number=${1:-"unknown"}
    
    echo -e "${BLUE}🧪 INICIANDO FRAMEWORK DE TESTING AUTOMATIZADO${NC}"
    echo -e "${BLUE}===============================================${NC}"
    
    # Verificar dependencias
    echo -e "${YELLOW}🔍 Verificando dependencias...${NC}"
    command -v pnpm >/dev/null 2>&1 || { echo -e "${RED}❌ PNPM no está instalado${NC}"; exit 1; }
    command -v k6 >/dev/null 2>&1 || { echo -e "${RED}❌ K6 no está instalado${NC}"; exit 1; }
    command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js no está instalado${NC}"; exit 1; }
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ No se encontró package.json. Ejecutar desde la raíz del proyecto.${NC}"
        exit 1
    fi
    
    # Ejecutar suite completa de tests
    if run_complete_test_suite "$pr_number"; then
        echo -e "${GREEN}🎉 TESTING COMPLETADO EXITOSAMENTE PARA PR-$pr_number${NC}"
        exit 0
    else
        echo -e "${RED}❌ TESTING FALLÓ PARA PR-$pr_number${NC}"
        exit 1
    fi
}

# Ejecutar función principal
main "$@"
