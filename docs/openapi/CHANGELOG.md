# OpenAPI Changelog

## PR-88 - Alineación de Especificación

**Fecha:** 2025-09-10  
**Objetivo:** Alinear especificación hasta diff=0  

### Endpoints Documentados

#### Autenticación (`/v1/auth/*`)
- `POST /v1/auth/login` - Login de usuario
- `POST /v1/auth/refresh` - Refresh de token
- `POST /v1/auth/logout` - Logout de usuario
- `GET /v1/auth/me` - Información del usuario actual
- `GET /v1/auth/sessions` - Sesiones del usuario
- `DELETE /v1/auth/sessions/{id}` - Revocar sesión

#### CRM - Companies (`/v1/crm/companies/*`)
- `GET /v1/crm/companies` - Listar empresas
- `POST /v1/crm/companies` - Crear empresa
- `GET /v1/crm/companies/{id}` - Obtener empresa por ID
- `PUT /v1/crm/companies/{id}` - Actualizar empresa
- `DELETE /v1/crm/companies/{id}` - Eliminar empresa

### Esquemas Principales
- `Company` - Entidad de empresa completa
- `CreateCompany` - DTO para crear empresa
- `UpdateCompany` - DTO para actualizar empresa
- `LoginRequest` - DTO para login
- `LoginResponse` - Respuesta de login
- `HealthCheck` - Estado del sistema
- `ProblemDetails` - Errores estándar
- `ValidationError` - Errores de validación
- `PaginationResponse` - Respuestas paginadas

### Seguridad
- **Bearer Auth:** JWT tokens implementado
- **Security schemes:** Configurado para endpoints protegidos

### Estado de Sincronización
- ✅ **Diff = 0** - No hay diferencias entre spec y runtime
- ✅ **7 rutas /v1/*** documentadas y sincronizadas
- ✅ **Esquemas completos** para todas las entidades
- ✅ **Códigos de respuesta** estándar (200, 201, 400, 401, 404, 422)

### Próximos Pasos
- Documentar endpoints adicionales (`/v1/contacts`, `/v1/deals`, etc.)
- Agregar ejemplos de request/response
- Implementar validación con Spectral
- Generar clientes SDK automáticamente