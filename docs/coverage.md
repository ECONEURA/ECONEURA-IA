# Sistema de Coverage Unificado

Este proyecto utiliza Vitest con configuración unificada de coverage para mantener estándares de calidad consistentes en todo el monorepo.

## 🚀 Comandos Disponibles

```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar tests en modo watch
pnpm test:watch

# Ejecutar tests con coverage
pnpm test:coverage

# Ejecutar solo tests de integración
pnpm test:integration

# Ejecutar solo tests de performance
pnpm test:performance

# Abrir reporte HTML de coverage
pnpm coverage:report
```

## 📊 Configuración de Coverage

### Umbrales de Calidad

| Proyecto | Branches | Functions | Lines | Statements |
|----------|----------|-----------|-------|------------|
| Global | 80% | 80% | 80% | 80% |
| API | 85% | 85% | 85% | 85% |
| Shared | 90% | 90% | 90% | 90% |

### Reportes Generados

- **HTML**: `coverage/lcov-report/index.html` - Reporte visual interactivo
- **JSON**: `coverage/coverage-summary.json` - Datos para herramientas externas
- **LCOV**: `coverage/lcov.info` - Formato estándar para Codecov
- **Cobertura**: `coverage/cobertura-coverage.xml` - Formato para otros servicios

## 🔧 Configuración Técnica

### Vitest Config (`vitest.config.ts`)
- **Provider**: V8 (mejor performance y precisión)
- **Reportes**: text, json, html, lcov, cobertura
- **Exclusiones**: node_modules, dist, build, configs, etc.
- **Inclusiones**: Solo código fuente de apps y packages

### CI/CD Integration
- **GitHub Actions**: Workflow automático en push/PR
- **Codecov**: Upload automático de reportes
- **Artifacts**: Reportes disponibles como descarga
- **Badges**: Cobertura visible en README

## 📈 Mejores Prácticas

### 1. Mantener Cobertura Alta
- **Unit Tests**: >80% cobertura en lógica de negocio
- **Integration Tests**: >85% cobertura en APIs
- **Shared Packages**: >90% cobertura por criticidad

### 2. Exclusiones Legítimas
```typescript
// ❌ NO excluir lógica de negocio
exclude: ['**/business-logic/**']

// ✅ SÍ excluir código generado/infraestructura
exclude: ['**/generated/**', '**/migrations/**']
```

### 3. Tests Efectivos
- **Unit Tests**: Funciones puras, utilidades
- **Integration Tests**: APIs, base de datos, servicios externos
- **E2E Tests**: Flujos completos de usuario

## 🎯 Troubleshooting

### Coverage no se genera
```bash
# Verificar instalación
pnpm list vitest @vitest/coverage-v8

# Ejecutar con debug
pnpm test:coverage --reporter=verbose
```

### Umbrales fallan
```bash
# Ver reporte detallado
pnpm coverage:report

# Ejecutar sin umbrales
pnpm test:coverage --coverage.thresholds=false
```

### CI/CD falla
- Verificar que `coverage/lcov.info` se genera
- Revisar configuración de Codecov
- Verificar permisos de GitHub Actions

## 📊 Métricas de Calidad

### Cobertura por Tipo
- **Statements**: Líneas ejecutadas
- **Branches**: Ramas condicionales (if/else, switch)
- **Functions**: Funciones llamadas
- **Lines**: Líneas de código ejecutadas

### Mejores Prácticas de Cobertura
- **>80%**: Bueno para aplicaciones generales
- **>85%**: Recomendado para APIs críticas
- **>90%**: Ideal para librerías compartidas

## 🔄 Workflows Relacionados

- `coverage.yml`: Genera reportes en CI/CD
- `test.yml`: Ejecuta tests sin coverage (más rápido)
- `quality-gate.yml`: Verifica umbrales antes de merge

## 📚 Recursos Adicionales

- [Vitest Coverage Docs](https://vitest.dev/guide/coverage.html)
- [Codecov Documentation](https://docs.codecov.com/)
- [Testing Best Practices](https://martinfowler.com/bliki/TestCoverage.html)