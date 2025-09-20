# ECONEURA-IA: Instrucciones para Agentes de IA

## Arquitectura General

**ECONEURA-IA** es un ERP+CRM de nueva generación impulsado por agentes de IA. Convierte el organigrama en un centro de mando vivo que orquesta ventas, finanzas, operaciones y datos.

### Estructura del Proyecto
- **Monorepo con pnpm**: Gestión centralizada de dependencias
- **apps/api**: Backend Express.js con TypeScript
- **apps/web**: Frontend Next.js con TypeScript
- **packages/shared**: Librerías compartidas y utilidades

### Tecnologías Clave
- **Backend**: Express.js + TypeScript + OpenAPI 3.0
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Base de datos**: Prisma ORM
- **Validación**: Zod schemas
- **Autenticación**: JWT Bearer tokens
- **Monitoreo**: Prometheus metrics + health checks
- **Seguridad**: Helmet + rate limiting

## Patrones de Desarrollo

### 1. Validación con Zod
```typescript
// En packages/shared/src/types.ts
export type Company = z.infer<typeof CompanySchema>;
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
```

### 2. Clientes HTTP Estructurados
```typescript
// En packages/shared/src/clients/base-client.ts
export class BaseClient {
  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    // Implementación con manejo de errores estructurado
  }
}
```

### 3. Manejo de Errores
```typescript
export interface ErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  traceId?: string;
}
```

### 4. Arquitectura de Rutas
```
apps/api/src/routes/
├── ai.ts              # Endpoints de IA
└── crm/
    ├── companies.ts   # Gestión de empresas
    ├── contacts.ts    # Gestión de contactos
    ├── deals.ts       # Gestión de oportunidades
    └── activities.ts  # Gestión de actividades
```

## Flujos de Trabajo

### Desarrollo Local
```bash
# Verificar estado del proyecto
pnpm typecheck
pnpm test --run

# Ejecutar API en desarrollo
pnpm dev:api

# Ejecutar web en desarrollo
pnpm dev:web
```

### Commits y Git
```bash
# Patrón de commits
git commit -m "feat: agregar funcionalidad X

- Descripción detallada del cambio
- Impacto en otros módulos
- Verificaciones realizadas"
```

### Integración con Servicios Externos
- **Microsoft 365**: Integración con Office 365
- **Make**: Automatización de flujos
- **WhatsApp**: Comunicación con clientes
- **Modelos de IA**: Mistral/OpenAI locales y en nube

## Convenciones del Proyecto

### Nombres de Archivos
- `*.service.ts`: Servicios de negocio
- `*.client.ts`: Clientes HTTP
- `*.schema.ts`: Esquemas Zod
- `*.types.ts`: Definiciones de tipos TypeScript

### Estructura de Paquetes
```
packages/shared/src/
├── clients/           # Clientes HTTP
├── schemas/           # Esquemas de validación
├── validation/        # Utilidades de validación
├── ai/               # Utilidades de IA
├── metrics/          # Métricas y monitoreo
└── types.ts          # Tipos principales
```

### Seguridad y Rendimiento
- Rate limiting en todas las rutas públicas
- Validación de entrada con Zod
- Manejo de errores consistente
- Métricas de rendimiento con Prometheus
- Health checks para monitoreo

## Áreas de Enfoque

### 1. Integración con IA
- Modelos locales vs nube
- Costos de uso de IA
- Análisis de sentimientos y voz
- Insights automáticos

### 2. CRM/ERP
- Gestión de compañías y contactos
- Pipeline de ventas (deals)
- Actividades y seguimiento
- Inventario y proveedores

### 3. Métricas y KPIs
- Monitoreo en tiempo real
- Dashboards ejecutivos
- Alertas automáticas

## Comandos Útiles

```bash
# Verificar tipos
pnpm typecheck

# Ejecutar tests
pnpm test --run

# Generar documentación OpenAPI
pnpm openapi:generate

# Verificar linting
pnpm lint

# Build de producción
pnpm build
```

## Consideraciones para Desarrollo

- **TypeScript estricto**: Aprovechar tipos para prevenir errores
- **Validación temprana**: Usar Zod en boundaries de entrada
- **Manejo de errores consistente**: Seguir patrón ErrorResponse
- **Monitoreo integrado**: Incluir métricas en nuevos endpoints
- **Documentación OpenAPI**: Mantener specs actualizadas

## Integraciones Externas

- **Microsoft 365**: Sincronización de datos
- **Make**: Automatización de procesos
- **WhatsApp Business**: Comunicación con clientes
- **Modelos de IA**: Mistral/OpenAI para análisis inteligente</content>
<parameter name="filePath">/workspaces/ECONEURA-IA/.github/copilot-instructions.md