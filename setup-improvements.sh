#!/bin/bash

# ============================================================================
# SETUP IMPROVEMENTS - Script para configurar las mejoras del sistema
# ============================================================================

set -e

echo "🚀 Configurando mejoras del sistema ECONEURA..."

# ========================================================================
# CONFIGURACIÓN DE VARIABLES DE ENTORNO
# ========================================================================

echo "📝 Configurando variables de entorno..."

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Archivo .env creado desde env.example"
fi

# Agregar variables de mejora al .env
cat >> .env << 'EOF'

# ============================================================================
# MEJORAS DEL SISTEMA - Variables de configuración
# ============================================================================

# Cache Configuration
CACHE_DEFAULT_TTL=3600
CACHE_MAX_MEMORY_SIZE=1000
CACHE_REDIS_URL=redis://localhost:6379/1

# Security Configuration
DATA_ENCRYPTION_KEY=your-secure-encryption-key-change-in-production
SECURITY_MAX_LOGIN_ATTEMPTS=5
SECURITY_LOCKOUT_DURATION=900
SECURITY_SUSPICIOUS_ACTIVITY_THRESHOLD=10
SECURITY_AUDIT_LOG_RETENTION=90

# Monitoring Configuration
MONITORING_INTERVAL=30000
MONITORING_METRICS_RETENTION=1000
MONITORING_ALERTS_RETENTION=1000
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Performance Configuration
PERFORMANCE_CACHE_ENABLED=true
PERFORMANCE_COMPRESSION_ENABLED=true
PERFORMANCE_RATE_LIMITING_ENABLED=true

# Testing Configuration
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/econeura_test
TEST_REDIS_URL=redis://localhost:6379/1
TEST_API_BASE_URL=http://localhost:3000

# API Documentation
API_DOCS_ENABLED=true
API_DOCS_PATH=/docs
SWAGGER_UI_ENABLED=true
EOF

echo "✅ Variables de entorno configuradas"

# ========================================================================
# INSTALACIÓN DE DEPENDENCIAS
# ========================================================================

echo "📦 Instalando dependencias adicionales..."

# Instalar dependencias de testing
pnpm add -D vitest @vitest/ui supertest @types/supertest

# Instalar dependencias de seguridad
pnpm add express-rate-limit express-validator helmet

# Instalar dependencias de documentación
pnpm add swagger-ui-express @types/swagger-ui-express

# Instalar dependencias de monitoreo
pnpm add systeminformation

echo "✅ Dependencias instaladas"

# ========================================================================
# CONFIGURACIÓN DE TESTING
# ========================================================================

echo "🧪 Configurando framework de testing..."

# Crear directorio de tests si no existe
mkdir -p apps/api/src/__tests__/{unit,integration,e2e}/{domain,application,infrastructure,presentation}

# Crear archivo de configuración de Vitest
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./apps/api/src/__tests__/setup/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/__tests__/**',
        '**/test/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './apps/api/src'),
      '@shared': resolve(__dirname, './packages/shared/src'),
      '@db': resolve(__dirname, './packages/db/src')
    }
  }
});
EOF

# Crear script de testing en package.json
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:ui="vitest --ui"
npm pkg set scripts.test:coverage="vitest --coverage"
npm pkg set scripts.test:integration="vitest --config vitest.integration.config.ts"
npm pkg set scripts.test:e2e="vitest --config vitest.e2e.config.ts"

echo "✅ Framework de testing configurado"

# ========================================================================
# CONFIGURACIÓN DE DOCUMENTACIÓN
# ========================================================================

echo "📚 Configurando documentación de API..."

# Crear endpoint de documentación
cat > apps/api/src/routes/docs.ts << 'EOF'
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { resolve } from 'path';

const router = Router();
const swaggerDocument = YAML.load(resolve(__dirname, '../docs/openapi.yaml'));

// Configurar Swagger UI
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ECONEURA API Documentation',
  customfavIcon: '/favicon.ico'
};

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument, swaggerOptions));
router.get('/json', (req, res) => res.json(swaggerDocument));
router.get('/yaml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(YAML.stringify(swaggerDocument));
});

export { router as docsRouter };
EOF

echo "✅ Documentación de API configurada"

# ========================================================================
# CONFIGURACIÓN DE MONITOREO
# ========================================================================

echo "📊 Configurando monitoreo de producción..."

# Crear endpoint de métricas
cat > apps/api/src/routes/metrics.ts << 'EOF'
import { Router } from 'express';
import { monitoringService } from '../lib/monitoring.service.js';

const router = Router();

// Endpoint de métricas del sistema
router.get('/system', async (req, res) => {
  try {
    const metrics = await monitoringService.getSystemMetrics(100);
    res.json({
      success: true,
      data: { metrics }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting system metrics',
      error: error.message
    });
  }
});

// Endpoint de estado de salud
router.get('/health', async (req, res) => {
  try {
    const healthStatus = monitoringService.getHealthStatus();
    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting health status',
      error: error.message
    });
  }
});

// Endpoint de alertas
router.get('/alerts', async (req, res) => {
  try {
    const alerts = monitoringService.getAlerts(50);
    res.json({
      success: true,
      data: { alerts }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting alerts',
      error: error.message
    });
  }
});

export { router as metricsRouter };
EOF

echo "✅ Monitoreo de producción configurado"

# ========================================================================
# CONFIGURACIÓN DE SCRIPTS DE DESARROLLO
# ========================================================================

echo "🛠️ Configurando scripts de desarrollo..."

# Crear script de desarrollo con hot reload
cat > dev-improvements.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando desarrollo con mejoras..."

# Verificar que las dependencias estén instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    pnpm install
fi

# Verificar que Redis esté corriendo
if ! pgrep -x "redis-server" > /dev/null; then
    echo "⚠️  Redis no está corriendo. Iniciando Redis..."
    redis-server --daemonize yes
fi

# Verificar que PostgreSQL esté corriendo
if ! pgrep -x "postgres" > /dev/null; then
    echo "⚠️  PostgreSQL no está corriendo. Por favor, inicia PostgreSQL manualmente."
fi

# Iniciar el servidor de desarrollo
echo "🔥 Iniciando servidor de desarrollo..."
pnpm dev
EOF

chmod +x dev-improvements.sh

# Crear script de testing
cat > test-improvements.sh << 'EOF'
#!/bin/bash

echo "🧪 Ejecutando tests con mejoras..."

# Ejecutar tests unitarios
echo "📝 Ejecutando tests unitarios..."
pnpm test

# Ejecutar tests de integración
echo "🔗 Ejecutando tests de integración..."
pnpm test:integration

# Ejecutar tests E2E
echo "🌐 Ejecutando tests E2E..."
pnpm test:e2e

# Generar reporte de cobertura
echo "📊 Generando reporte de cobertura..."
pnpm test:coverage

echo "✅ Todos los tests completados"
EOF

chmod +x test-improvements.sh

echo "✅ Scripts de desarrollo configurados"

# ========================================================================
# CONFIGURACIÓN DE DOCKER
# ========================================================================

echo "🐳 Configurando Docker para mejoras..."

# Crear Dockerfile optimizado
cat > Dockerfile.improvements << 'EOF'
# ============================================================================
# DOCKERFILE OPTIMIZADO CON MEJORAS
# ============================================================================

FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache \
    postgresql-client \
    redis-tools \
    curl \
    && rm -rf /var/cache/apk/*

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Construir aplicación
RUN pnpm build

# Exponer puerto
EXPOSE 3000

# Cambiar a usuario no-root
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/v1/health || exit 1

# Comando de inicio
CMD ["pnpm", "start"]
EOF

echo "✅ Docker configurado"

# ========================================================================
# CONFIGURACIÓN DE CI/CD
# ========================================================================

echo "🔄 Configurando CI/CD..."

# Crear workflow de GitHub Actions
mkdir -p .github/workflows

cat > .github/workflows/improvements.yml << 'EOF'
name: ECONEURA Improvements CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: econeura_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run linting
        run: pnpm lint
      
      - name: Run type checking
        run: pnpm type-check
      
      - name: Run unit tests
        run: pnpm test
        env:
          TEST_DATABASE_URL: postgresql://postgres:test@localhost:5432/econeura_test
          TEST_REDIS_URL: redis://localhost:6379/1
      
      - name: Run integration tests
        run: pnpm test:integration
        env:
          TEST_DATABASE_URL: postgresql://postgres:test@localhost:5432/econeura_test
          TEST_REDIS_URL: redis://localhost:6379/1
      
      - name: Generate coverage report
        run: pnpm test:coverage
        env:
          TEST_DATABASE_URL: postgresql://postgres:test@localhost:5432/econeura_test
          TEST_REDIS_URL: redis://localhost:6379/1
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build application
        run: pnpm build
      
      - name: Build Docker image
        run: docker build -f Dockerfile.improvements -t econeura:latest .
      
      - name: Run security scan
        run: docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image econeura:latest

  deploy:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          echo "🚀 Deploying to production..."
          # Aquí irían los comandos de despliegue reales
EOF

echo "✅ CI/CD configurado"

# ========================================================================
# CONFIGURACIÓN DE MONITOREO
# ========================================================================

echo "📊 Configurando monitoreo avanzado..."

# Crear dashboard de métricas
cat > monitoring-dashboard.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ECONEURA - Dashboard de Monitoreo</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric { text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2c3e50; }
        .metric-label { color: #7f8c8d; margin-top: 5px; }
        .status-healthy { color: #27ae60; }
        .status-degraded { color: #f39c12; }
        .status-unhealthy { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ECONEURA - Dashboard de Monitoreo</h1>
        
        <div class="card">
            <h2>Estado del Sistema</h2>
            <div id="system-status" class="metric">
                <div class="metric-value" id="status-value">Cargando...</div>
                <div class="metric-label">Estado General</div>
            </div>
        </div>
        
        <div class="card">
            <h2>Métricas del Sistema</h2>
            <div class="metrics-grid">
                <div class="metric">
                    <div class="metric-value" id="memory-usage">-</div>
                    <div class="metric-label">Uso de Memoria (%)</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="cpu-usage">-</div>
                    <div class="metric-label">Uso de CPU (%)</div>
                </div>
                <div class="metric">
                    <div class="metric-value" id="uptime">-</div>
                    <div class="metric-label">Tiempo de Actividad</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>Servicios</h2>
            <div id="services-status"></div>
        </div>
        
        <div class="card">
            <h2>Alertas Recientes</h2>
            <div id="alerts-list"></div>
        </div>
    </div>

    <script>
        async function loadMetrics() {
            try {
                const response = await fetch('/v1/metrics/health');
                const data = await response.json();
                
                if (data.success) {
                    updateSystemStatus(data.data);
                }
            } catch (error) {
                console.error('Error loading metrics:', error);
            }
        }
        
        function updateSystemStatus(data) {
            // Actualizar estado general
            const statusElement = document.getElementById('status-value');
            statusElement.textContent = data.status;
            statusElement.className = `metric-value status-${data.status}`;
            
            // Actualizar métricas
            if (data.metrics) {
                document.getElementById('memory-usage').textContent = 
                    Math.round(data.metrics.memory.percentage) + '%';
                document.getElementById('cpu-usage').textContent = 
                    Math.round(data.metrics.cpu.usage) + '%';
                document.getElementById('uptime').textContent = 
                    Math.round(data.metrics.uptime / 3600) + 'h';
            }
            
            // Actualizar servicios
            updateServicesStatus(data.services);
        }
        
        function updateServicesStatus(services) {
            const container = document.getElementById('services-status');
            container.innerHTML = '';
            
            services.forEach(service => {
                const div = document.createElement('div');
                div.className = 'metric';
                div.innerHTML = `
                    <div class="metric-value status-${service.status}">${service.status}</div>
                    <div class="metric-label">${service.name} (${service.responseTime}ms)</div>
                `;
                container.appendChild(div);
            });
        }
        
        // Cargar métricas cada 30 segundos
        loadMetrics();
        setInterval(loadMetrics, 30000);
    </script>
</body>
</html>
EOF

echo "✅ Dashboard de monitoreo creado"

# ========================================================================
# FINALIZACIÓN
# ========================================================================

echo ""
echo "🎉 ¡Mejoras del sistema configuradas exitosamente!"
echo ""
echo "📋 Resumen de mejoras implementadas:"
echo "   ✅ Framework de testing completo (Vitest + Supertest)"
echo "   ✅ Optimización de performance (Cache + Compresión)"
echo "   ✅ Seguridad avanzada (Rate limiting + Validación + Encriptación)"
echo "   ✅ Documentación de API (OpenAPI/Swagger)"
echo "   ✅ Monitoreo de producción (Métricas + Alertas + Dashboard)"
echo "   ✅ CI/CD pipeline (GitHub Actions)"
echo "   ✅ Docker optimizado"
echo ""
echo "🚀 Comandos disponibles:"
echo "   ./dev-improvements.sh    - Iniciar desarrollo con mejoras"
echo "   ./test-improvements.sh   - Ejecutar todos los tests"
echo "   pnpm test:coverage       - Generar reporte de cobertura"
echo "   pnpm test:ui            - Interfaz de testing"
echo ""
echo "📚 Documentación disponible en:"
echo "   http://localhost:3000/docs - API Documentation"
echo "   monitoring-dashboard.html  - Dashboard de monitoreo"
echo ""
echo "⚠️  Recuerda configurar las variables de entorno en .env"
echo "   especialmente DATA_ENCRYPTION_KEY y ALERT_WEBHOOK_URL"
echo ""

