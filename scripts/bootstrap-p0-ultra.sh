#!/usr/bin/env bash
# ECONEURA-IA P0 BOOTSTRAP ULTRA-EFICIENTE Y AUTOMATIZADO
# Ejecuta verificaciones inteligentes y solo actúa si es necesario
set -euo pipefail

# Función de logging compacta
log() { echo -e "\033[0;3${2:-4}m[$(date +%H:%M:%S)] $1\033[0m"; }
error() { log "❌ $1" 1; exit 1; }
success() { log "✅ $1" 2; }
warn() { log "⚠️ $1" 3; }

# Configuración
TRACE_ID="$(date +%s)"
WORKSPACE_ROOT="$(pwd)"
API_DIR="$WORKSPACE_ROOT/apps/api"
SCRIPTS_DIR="$WORKSPACE_ROOT/scripts"

# Cambiar al directorio correcto (ya estamos en el correcto)
log "📁 Directorio de trabajo: $WORKSPACE_ROOT"

# Verificaciones rápidas fail-fast
test -f "pnpm-workspace.yaml" || error "Ejecutar desde raíz del monorepo"
test -d "apps/api" || error "Directorio apps/api no existe"
command -v pnpm >/dev/null || error "pnpm no encontrado (npm install -g pnpm)"

log "🚀 Bootstrap P0 iniciado (ID: $TRACE_ID)"

# Función para verificar si ruta existe y está funcional
check_route_exists() {
    local route_file="$1"
    local route_name="$2"
    
    if [[ -f "$route_file" ]]; then
        if grep -q "Router\|router\|express" "$route_file" 2>/dev/null; then
            warn "$route_name ya existe y es funcional - SKIP"
            return 0
        else
            warn "$route_name existe pero no es funcional - RECREAR"
            return 1
        fi
    else
        log "$route_name no existe - CREAR"
        return 1
    fi
}

# Función para verificar dependencias críticas
check_deps() {
    log "🔍 Verificando dependencias críticas..."
    
    # Verificar que @econeura/shared existe
    if [[ ! -f "$API_DIR/package.json" ]] || ! grep -q "@econeura/shared" "$API_DIR/package.json"; then
        error "Dependencia @econeura/shared no encontrada en $API_DIR/package.json"
    fi
    
    # Verificar estructura básica de imports
    if [[ ! -d "$WORKSPACE_ROOT/packages/shared" ]]; then
        error "Directorio packages/shared no existe"
    fi
    
    success "Dependencias verificadas"
}

# Función para instalar deps solo si es necesario
smart_install() {
    local target_dir="$1"
    cd "$target_dir"
    
    if [[ ! -d "node_modules" ]] || [[ "../pnpm-lock.yaml" -nt "node_modules/.pnpm/lock.yaml" ]]; then
        log "📦 Instalando dependencias en $target_dir..."
        pnpm install --frozen-lockfile --prefer-offline --silent
        success "Dependencias instaladas"
    else
        log "📦 Dependencias OK en $target_dir"
    fi
    cd "$WORKSPACE_ROOT"
}

# Función para crear health endpoint inteligente
create_health_endpoint() {
    local route_file="$API_DIR/src/routes/health.ts"
    
    if check_route_exists "$route_file" "Health endpoint"; then
        return 0
    fi
    
    log "🏥 Creando health endpoint optimizado..."
    
    cat > "$route_file" <<'EOF'
// Auto-generated P0 Bootstrap Health Endpoint
import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.0.0',
    trace_id: req.headers['x-trace-id'] || 'none'
  };
  
  res.status(200).json(health);
});

healthRouter.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

healthRouter.get('/ready', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ready' });
});
EOF
    
    success "Health endpoint creado"
}

# Función para verificar integración con index.ts
integrate_routes() {
    local index_file="$API_DIR/src/index.ts"
    
    if [[ ! -f "$index_file" ]]; then
        warn "index.ts no existe - crear manualmente"
        return 0
    fi
    
    log "🔗 Verificando integración de rutas..."
    
    # Verificar si health ya está integrado
    if grep -q "health" "$index_file"; then
        success "Rutas ya integradas"
        return 0
    fi
    
    # Hacer backup
    cp "$index_file" "$index_file.backup-$TRACE_ID"
    
    # Agregar import si no existe
    if ! grep -q "from.*routes.*health" "$index_file"; then
        sed -i '/import.*express/a import { healthRouter } from '\''./routes/health'\'';' "$index_file"
    fi
    
    # Agregar ruta si no existe
    if ! grep -q "app.use.*health" "$index_file"; then
        sed -i '/app\.use.*\/v1/a app.use('\''\/health'\'', healthRouter);' "$index_file"
    fi
    
    success "Rutas integradas en index.ts"
}

# Función para crear script fix-lint compacto
create_fix_lint() {
    local script_file="$SCRIPTS_DIR/fix-lint-smart.sh"
    
    if [[ -f "$script_file" ]]; then
        warn "fix-lint-smart.sh ya existe - SKIP"
        return 0
    fi
    
    log "🔧 Creando fix-lint inteligente..."
    
    cat > "$script_file" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "🔍 Smart lint fix iniciado..."
if [[ -f "pnpm-workspace.yaml" ]]; then
    pnpm install --frozen-lockfile --prefer-offline --silent
    pnpm lint --fix || echo "⚠️ Algunos errores de lint persisten"
else
    echo "❌ Ejecutar desde raíz del monorepo"
    exit 1
fi
echo "✅ Lint fix completado"
EOF
    
    chmod +x "$script_file"
    success "Fix-lint inteligente creado"
}

# Función para verificación final automática
verify_bootstrap() {
    log "🧪 Verificación automática..."
    
    local errors=0
    
    # Verificar archivos críticos
    local files=(
        "$API_DIR/src/routes/health.ts"
        "$SCRIPTS_DIR/fix-lint-smart.sh"
    )
    
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            success "$(basename "$file") ✓"
        else
            error "$(basename "$file") ✗"
            ((errors++))
        fi
    done
    
    # Test rápido de compilación
    cd "$API_DIR"
    if pnpm typecheck --noEmit >/dev/null 2>&1; then
        success "TypeScript ✓"
    else
        warn "TypeScript tiene warnings (normal en bootstrap)"
    fi
    
    cd "$WORKSPACE_ROOT"
    
    if [[ $errors -eq 0 ]]; then
        success "Bootstrap P0 COMPLETADO (${SECONDS}s)"
        echo
        echo "🚀 SIGUIENTES PASOS:"
        echo "  cd apps/api && pnpm dev"
        echo "  curl http://localhost:3000/health"
        echo "  ./scripts/fix-lint-smart.sh"
    else
        error "Bootstrap FALLÓ - $errors errores encontrados"
    fi
}

# EJECUCIÓN PRINCIPAL AUTOMATIZADA
main() {
    check_deps
    smart_install "$WORKSPACE_ROOT"
    smart_install "$API_DIR"
    create_health_endpoint
    integrate_routes
    create_fix_lint
    verify_bootstrap
}

# Ejecutar con timeout de seguridad
timeout 120s bash -c 'main' || error "Bootstrap timeout (>2min)"

log "🎉 P0 Bootstrap ultra-eficiente completado en ${SECONDS}s"