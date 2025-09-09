# OpenAPI Specification - ECONEURA API

## Fuente Canónica

**Archivo:** `apps/api/openapi/openapi.yaml`

Este archivo es la **fuente única de verdad** para la especificación OpenAPI de ECONEURA API.

## Estructura

### Información Base
- **Título:** ECONEURA API
- **Versión:** 1.0.0
- **Descripción:** Production-ready ERP+CRM API with AI capabilities

### Servidores
- **Desarrollo:** `http://localhost:4000`
- **Producción:** `https://api.econeura.dev`

### Rutas Públicas `/v1/*`
- `/v1/auth/*` - Autenticación
- `/v1/crm/*` - CRM (Companies, Contacts, Deals)
- `/v1/erp/*` - ERP (Products, Inventory)
- `/v1/finance/*` - Finanzas (Invoices, Reports)
- `/v1/health` - Health check
- `/v1/openapi.json` - Especificación OpenAPI

### Esquemas Principales
- `Company` - Entidad de empresa
- `LoginRequest/Response` - Autenticación
- `HealthCheck` - Estado del sistema
- `ProblemDetails` - Errores estándar
- `ValidationError` - Errores de validación
- `PaginationResponse` - Respuestas paginadas

### Seguridad
- **Bearer Auth:** JWT tokens
- **OIDC:** OpenID Connect (futuro)

## Uso

### Generar Documentación
```bash
npx @stoplight/spectral lint apps/api/openapi/openapi.yaml
```

### Validar Especificación
```bash
npx @apidevtools/swagger-parser validate apps/api/openapi/openapi.yaml
```

### Generar Clientes
```bash
npx @openapitools/openapi-generator-cli generate \
  -i apps/api/openapi/openapi.yaml \
  -g typescript-fetch \
  -o clients/typescript
```

## Mantenimiento

1. **Solo editar:** `apps/api/openapi/openapi.yaml`
2. **Validar:** Usar Spectral antes de commit
3. **Sincronizar:** Con implementación real en `/v1/*`
4. **Versionar:** Cambios en `docs/openapi/CHANGELOG.md`

## Diferencias con Runtime

Para verificar diferencias entre especificación y runtime:
```bash
node scripts/openapi/snapshot.mjs
node scripts/openapi/diff.mjs
```

El objetivo es mantener `reports/openapi-diff.json` vacío (0 diferencias).
