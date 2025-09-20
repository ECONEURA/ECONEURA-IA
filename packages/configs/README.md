# Configuraciones Compartidas de Dependencias

Este directorio contiene configuraciones de `package.json` compartidas para mantener consistencia y reducir duplicación en el monorepo.

## Estructura

```
packages/configs/
├── package.base.json     # Configuración base (TypeScript, ESLint, Prettier)
├── package.api.json      # Configuración para APIs/Backend (Express, Zod, etc.)
├── package.web.json      # Configuración para Web/Frontend (Next.js, React, etc.)
└── package.shared.json   # Configuración para utilidades compartidas
```

## Cómo Usar

### Opción 1: Aplicar automáticamente (Recomendado)

```bash
# Para una API
./scripts/apply-config.sh api apps/api

# Para una app web
./scripts/apply-config.sh web apps/web

# Para un paquete compartido
./scripts/apply-config.sh shared packages/shared

# Para configuración base
./scripts/apply-config.sh base packages/utils
```

### Opción 2: Copiar manualmente

1. Copia el contenido del config apropiado
2. Pégalo en el `package.json` de tu proyecto
3. Ejecuta `pnpm install`

## Configuraciones Disponibles

### Base (`package.base.json`)
- **TypeScript** y tipos de Node.js
- **ESLint** y **Prettier** para linting y formato
- **Husky** y **lint-staged** para Git hooks
- Scripts comunes: `typecheck`, `lint`, `format`

### API (`package.api.json`)
- **Express.js** como framework web
- **Zod** para validación de esquemas
- **Helmet**, **CORS**, **compression** para seguridad y performance
- **Prisma** para base de datos
- Scripts: `dev`, `build`, `start`, `test`

### Web (`package.web.json`)
- **Next.js** como framework React
- **Tailwind CSS** para estilos
- **Headless UI** y **Heroicons** para componentes
- Scripts: `dev`, `build`, `start`, `lint`, `test`

### Shared (`package.shared.json`)
- **Zod** y **Joi** para validación
- **Lodash** para utilidades
- **date-fns** para manejo de fechas
- **UUID** para identificadores únicos
- **Axios** para HTTP requests

## Beneficios

✅ **Consistencia**: Todas las apps usan las mismas versiones de dependencias
✅ **Mantenimiento**: Actualizar una dependencia en un solo lugar
✅ **Productividad**: Configuraciones probadas y optimizadas
✅ **Seguridad**: Versiones actualizadas y auditadas

## Actualización

Cuando se actualice una configuración compartida:

1. Ejecuta el script de aplicación en todos los proyectos afectados
2. Revisa cambios en `package.json`
3. Ejecuta `pnpm install` para instalar nuevas dependencias
4. Actualiza `pnpm-lock.yaml` con `pnpm install`

## Troubleshooting

### Error: "Configuración no encontrada"
Verifica que el tipo especificado existe en `packages/configs/`

### Error: "Proyecto no encontrado"
Verifica que la ruta del proyecto existe y contiene un `package.json`

### Dependencias conflictivas
Si hay conflictos, revisa las versiones en el config compartido y ajusta según sea necesario.