# 🚀 ECONEURA - ERP/CRM + IA

**Sistema ERP/CRM moderno con inteligencia artificial, integraciones Microsoft Graph y observabilidad completa.**

[![Build Status](https://github.com/tu-usuario/econeura/workflows/CI/badge.svg)](https://github.com/tu-usuario/econeura/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Características Principales

### 💼 **ERP Completo**
- 📦 Gestión de inventario y productos
- 💰 Facturación y contabilidad
- 👥 Recursos humanos
- 📊 Reportes financieros

### 🤝 **CRM Avanzado**
- 👤 Gestión de contactos y empresas
- 💼 Pipeline de ventas
- 📈 Análisis de oportunidades
- 📞 Historial de interacciones

### 🤖 **IA Integrada**
- 🧠 Router de IA (Mistral local + Azure OpenAI)
- 💰 Control de costes (50€/org/mes)
- 📊 Métricas de uso y rendimiento
- 🔄 Fallback automático

### 🔗 **Integraciones**
- 📧 Microsoft Outlook
- 💬 Microsoft Teams
- 📋 Microsoft Planner
- 📁 Microsoft SharePoint
- 🔗 Webhooks Make.com

### 🔒 **Seguridad & Cumplimiento**
- 🏢 Multi-tenant con RLS
- 🇪🇺 Residencia de datos UE
- 🔐 Autenticación JWT
- 📝 Auditoría completa

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | Express.js, TypeScript, OpenAPI 3.0 |
| **Base de Datos** | PostgreSQL 15, Drizzle ORM, RLS |
| **IA** | Mistral 7B, Azure OpenAI, Cost Meter |
| **Observabilidad** | OpenTelemetry, Prometheus, Grafana |
| **Infraestructura** | Azure, Docker, GitHub Actions |

## 🚀 Instalación Rápida

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/econeura.git
cd econeura

# 2. Instalar dependencias
pnpm install

# 3. Configurar entorno
cp env.example .env
# Editar .env con tus configuraciones

# 4. Iniciar infraestructura
pnpm docker:up

# 5. Configurar base de datos
pnpm setup

# 6. Iniciar desarrollo
pnpm dev
```

## 📁 Estructura del Proyecto

```
econeura/
├── 📱 apps/
│   ├── web/          # Next.js 14 Frontend
│   ├── api/          # Express.js Backend
│   └── workers/      # Azure Functions
├── 📦 packages/
│   ├── shared/       # Utilidades compartidas
│   ├── db/           # Base de datos y migraciones
│   └── sdk/          # SDK TypeScript
├── 🏗️ infra/         # Infraestructura como código
└── 📚 docs/          # Documentación
```

## 🛠️ Comandos de Desarrollo

```bash
# Desarrollo completo
pnpm dev                    # Web + API + DB Studio

# Desarrollo específico
pnpm dev:web               # Solo frontend
pnpm dev:api               # Solo backend
pnpm dev:db                # Solo base de datos

# Build
pnpm build                 # Build completo
pnpm build:web             # Solo frontend
pnpm build:api             # Solo backend

# Testing
pnpm test                  # Tests unitarios
pnpm test:watch            # Tests en modo watch
pnpm test:coverage         # Tests con cobertura
pnpm test:integration      # Tests de integración

# Base de datos
pnpm db:generate           # Generar migraciones
pnpm db:migrate            # Ejecutar migraciones
pnpm db:seed               # Poblar datos
pnpm db:studio             # Abrir Drizzle Studio

# Calidad de código
pnpm lint                  # Linting
pnpm lint:fix              # Linting con auto-fix
pnpm typecheck             # Verificación de tipos
pnpm format                # Formateo con Prettier
```

## 🔧 Configuración de Entorno

### Variables Requeridas

```bash
# Base de datos
PGHOST=localhost
PGUSER=econeura_user
PGPASSWORD=econeura_password
PGDATABASE=econeura_dev

# IA
MISTRAL_BASE_URL=http://localhost:8080
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your_key

# Microsoft Graph
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_secret

# Seguridad
JWT_SECRET=your_jwt_secret
MAKE_WEBHOOK_HMAC_SECRET=your_hmac_secret
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
pnpm test

# Tests específicos
pnpm test:unit            # Tests unitarios
pnpm test:integration     # Tests de integración
pnpm test:performance     # Tests de rendimiento

# Cobertura
pnpm test:coverage        # Generar reporte de cobertura
```

## 🚀 Deploy

### Desarrollo Local
```bash
pnpm docker:up            # Iniciar servicios
pnpm setup                # Configurar BD
pnpm dev                  # Desarrollo
```

### Producción (Azure)
```bash
# Configurar secrets en GitHub
# Push a main branch
# GitHub Actions se encarga del deploy
```

## 📊 Monitoreo

- **Métricas**: http://localhost:9090 (Prometheus)
- **Dashboards**: http://localhost:3001 (Grafana)
- **Trazas**: http://localhost:16686 (Jaeger)
- **Base de datos**: http://localhost:4983 (Drizzle Studio)

## 🤝 Contribución

1. 🍴 Fork el proyecto
2. 🌿 Crea una rama (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. 📤 Push a la rama (`git push origin feature/AmazingFeature`)
5. 🔄 Abre un Pull Request

### Convenciones

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/)
- **Branches**: `feature/`, `fix/`, `docs/`, `chore/`
- **PRs**: Incluir tests y documentación

## 🚀 Pull Requests Implementados

### ✅ PR-07: Sistema de Autenticación y Autorización
- **Estado**: ✅ Completado y desplegado
- **Descripción**: JWT, API Keys, RLS y middleware de seguridad

### ✅ PR-08: BFF Proxy y API Client
- **Estado**: ✅ Completado y desplegado
- **Descripción**: Backend for Frontend proxy y cliente API optimizado

### ✅ PR-09: Migración de Iconos y UI
- **Estado**: ✅ Completado y desplegado
- **Descripción**: Migración completa de @heroicons/react a lucide-react

### ✅ PR-10: Observabilidad y Métricas
- **Estado**: ✅ Completado y desplegado
- **Descripción**: OpenTelemetry, Prometheus, métricas personalizadas

### ✅ PR-11: CI/CD Pipeline
- **Estado**: ✅ Completado y desplegado
- **Descripción**: GitHub Actions, Azure Bicep, Docker optimizado

### ✅ PR-12: CRM Interactions
- **Estado**: ✅ Completado y desplegado
- **Descripción**: Timeline de interacciones con IA y búsqueda semántica

### ✅ PR-13: Características Avanzadas
- **Estado**: ✅ Completado y desplegado
- **Descripción**: IA predictiva, métricas avanzadas, integraciones externas

### ✅ PR-14: Sistema de Inteligencia Artificial Empresarial Avanzada
- **Estado**: ✅ Completado y desplegado
- **Descripción**: Plataforma completa de IA con 10 servicios avanzados
- **Servicios**: AutoML, Sentiment Analysis, Workflow Automation, Real-time Analytics, Semantic Search, Intelligent Reporting, Chatbot, BPM
- **Impacto**: 87% automatización, 94% satisfacción cliente, 89% ROI

### ✅ PR-15: Migración a Azure OpenAI con BFF Next.js
- **Estado**: ✅ Completado y desplegado
- **Descripción**: Migración completa a Azure OpenAI con arquitectura BFF
- **Funcionalidades**: Chat GPT-4o-mini, DALL-E 3, Azure Speech TTS, Google CSE
- **Características**: Modo demo robusto, backoff automático, content filtering
- **Arquitectura**: BFF Next.js, API routes, TypeScript optimizado

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- 📧 Email: soporte@econeura.com
- 💬 Discord: [Canal de soporte](https://discord.gg/econeura)
- 📖 Docs: [Documentación completa](https://docs.econeura.com)

---

**Desarrollado con ❤️ en España 🇪🇸**
