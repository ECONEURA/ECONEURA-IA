# 🏗️ PR-1: Estructura Monorepo

## 📋 **Resumen Ejecutivo**

**PR-1** establece la estructura del monorepo con pnpm workspaces, configuraciones TypeScript y preparación para Azure App Service, siguiendo las reglas ECONEURA v2025-09-05.

## 🎯 **Objetivos**

- ✅ Configurar pnpm workspaces
- ✅ Establecer estructura de apps y packages
- ✅ Configurar TypeScript base
- ✅ Preparar para Azure App Service
- ✅ Configurar scripts de build y desarrollo

## 🏗️ **Estructura del Monorepo**

```
ECONEURA-IA-1/
├── apps/
│   ├── api/                 # Backend API (Express.js + TypeScript)
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web/                 # Frontend (Next.js 14 + TypeScript)
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── workers/             # Background workers
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared/              # Utilidades compartidas
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── db/                  # Base de datos y esquemas
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── sdk/                 # SDK del cliente
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── package.json             # Root package.json con workspaces
├── pnpm-workspace.yaml      # Configuración de workspaces
└── tsconfig.json            # TypeScript base
```

## 📦 **Configuración de Workspaces**

### **pnpm-workspace.yaml**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### **package.json (Root)**
```json
{
  "name": "econeura-ia",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "pnpm run --parallel dev",
    "build": "pnpm run --recursive build",
    "test": "pnpm run --recursive test",
    "lint": "pnpm run --recursive lint",
    "type-check": "pnpm run --recursive type-check",
    "clean": "pnpm run --recursive clean"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "prettier": "^3.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

## 🔧 **Configuración TypeScript Base**

### **tsconfig.json (Root)**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@econeura/shared": ["./packages/shared/src"],
      "@econeura/db": ["./packages/db/src"],
      "@econeura/sdk": ["./packages/sdk/src"]
    }
  },
  "include": [],
  "exclude": ["node_modules", "dist", "build", ".next"]
}
```

## 📱 **Apps Configuration**

### **apps/api/package.json**
```json
{
  "name": "@econeura/api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "@econeura/shared": "workspace:*",
    "@econeura/db": "workspace:*"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "tsx": "^4.0.0",
    "vitest": "^1.0.0"
  }
}
```

### **apps/web/package.json**
```json
{
  "name": "@econeura/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@econeura/shared": "workspace:*",
    "@econeura/sdk": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

## 📦 **Packages Configuration**

### **packages/shared/package.json**
```json
{
  "name": "@econeura/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "lint": "eslint src --ext .ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

## 🚀 **Scripts de Desarrollo**

### **scripts/setup-pr-1.sh**
```bash
#!/bin/bash
# PR-1: Monorepo Structure Setup

set -e

echo "🏗️ Setting up Monorepo Structure (PR-1)..."

# Create directory structure
mkdir -p apps/{api,web,workers}/src
mkdir -p packages/{shared,db,sdk}/src

# Create pnpm workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# Install dependencies
pnpm install

echo "✅ PR-1: Monorepo Structure Complete!"
```

## 📊 **Métricas de Éxito**

- ✅ Estructura de directorios creada
- ✅ pnpm workspaces configurado
- ✅ TypeScript base configurado
- ✅ Package.json configurados
- ✅ Scripts de desarrollo funcionando

## 🔮 **Próximos Pasos**

**PR-2**: Configuración TypeScript avanzada
- Configurar tsconfig específicos por app
- Configurar paths y aliases
- Configurar build optimizations

---

**🎯 PR-1: Estructura Monorepo**
**📅 Fecha: Enero 2024**
**👥 Equipo: Desarrollo Base**
**🏆 Estado: ✅ COMPLETADO**
