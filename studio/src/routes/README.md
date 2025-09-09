# 🛣️ Cockpit Routes

Este directorio contendrá las rutas API del cockpit operacional cuando se complete el merge del repositorio studio.

## Rutas Esperadas

```typescript
GET /v1/cockpit/overview    // Dashboard operacional
GET /v1/cockpit/agents      // Detalles de agentes
GET /v1/cockpit/costs       // Breakdown de costes
GET /v1/cockpit/system      // Métricas del sistema
```

## Archivos Esperados

- `overview.ts` - Ruta del dashboard
- `agents.ts` - Gestión de agentes
- `costs.ts` - Análisis de costes
- `system.ts` - Métricas del sistema

---

**Estado**: Preparado para merge desde ECONEURA/studio