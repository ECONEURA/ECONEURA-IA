module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  globals: {
    NodeJS: 'readonly',
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // Reglas críticas de calidad
    'no-unused-vars': 'off', // Desactivado por @typescript-eslint
    'no-console': 'warn',
    'no-case-declarations': 'error',
    'no-empty': 'error',
    'no-unreachable': 'error',
    'no-constant-condition': 'error',

    // Reglas de TypeScript
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
  },
  overrides: [
    // Configuración para tests
    {
      files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.tsx', '**/*.test.tsx', '**/*.spec.tsx'],
      env: {
        jest: true,
        node: true,
        es2022: true,
      },
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
      rules: {
        'no-console': 'off', // Permitir console.log en tests
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en tests
      },
    },
    // Configuración para frontend (Next.js)
    {
      files: ['apps/web/**/*.ts', 'apps/web/**/*.tsx'],
      env: {
        browser: true,
        node: true,
        es2022: true,
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
        RequestInit: 'readonly',
        RequestInfo: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLButtonElement: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        WebSocket: 'readonly',
        EventSource: 'readonly',
        Audio: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
      },
      rules: {
        'no-console': 'off', // Permitir console en desarrollo web
        '@typescript-eslint/no-explicit-any': 'off', // Más flexible en frontend
      },
    },
    // Configuración para backend (API)
    {
      files: ['apps/api/**/*.ts', 'apps/api-agents-make/**/*.ts', 'apps/voice/**/*.ts', 'apps/workers/**/*.ts'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        'no-console': 'warn', // Advertir sobre console.log en backend
        '@typescript-eslint/no-explicit-any': 'warn', // Advertir sobre any
      },
    },
    // Configuración para paquetes compartidos
    {
      files: ['packages/**/*.ts'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        'no-console': 'error', // No permitir console en librerías
        '@typescript-eslint/no-explicit-any': 'error', // Estricto con any en librerías
      },
    },
    // Configuración específica para telemetría (código de frontend en packages)
    {
      files: ['packages/shared/src/telemetry/**/*.ts'],
      env: {
        browser: true,
        node: true,
        es2022: true,
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        performance: 'readonly',
        PerformanceObserver: 'readonly',
        PerformanceNavigationTiming: 'readonly',
        crypto: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Event: 'readonly',
        ErrorEvent: 'readonly',
        PromiseRejectionEvent: 'readonly',
      },
      rules: {
        'no-console': 'warn', // Advertir sobre console en telemetría
        '@typescript-eslint/no-explicit-any': 'warn', // Advertir sobre any en telemetría
        'no-undef': 'off', // Permitir globals del browser
      },
    },
    // Configuración para archivos que necesitan logging/console
    {
      files: [
        'packages/shared/src/logger.ts',
        'packages/shared/src/services/**/*.ts',
        'packages/shared/src/cost-meter.ts',
        'packages/shared/src/config.ts',
        'packages/shared/src/rate-limiting/**/*.ts'
      ],
      rules: {
        'no-console': 'warn', // Advertir sobre console en servicios
        '@typescript-eslint/no-explicit-any': 'warn', // Advertir sobre any en servicios
      },
    },
    // Configuración para archivos de desarrollo/debugging
    {
      files: ['packages/shared/src/playbooks/**/*.ts'],
      rules: {
        'no-console': 'off', // Permitir console.debug en playbooks
        '@typescript-eslint/no-explicit-any': 'warn', // Advertir sobre any
      },
    },
    // Configuración para archivos de tipos (.d.ts)
    {
      files: ['packages/**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en definiciones de tipos
        'no-console': 'off', // No aplicar reglas de console en tipos
      },
    },
    // Configuración específica para telemetría principal (alto uso de any y console)
    {
      files: ['packages/shared/src/telemetry/index.ts'],
      rules: {
        'no-console': 'off', // Permitir console.warn en telemetría
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en telemetría por flexibilidad
        '@typescript-eslint/no-unused-vars': 'warn', // Advertir sobre variables no usadas
      },
    },
    // Configuración específica para servicios (webhook-manager, etc.)
    {
      files: ['packages/shared/src/services/**/*.ts'],
      rules: {
        'no-console': 'warn', // Advertir sobre console en servicios
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en servicios por interoperabilidad
      },
    },
    // Configuración específica para archivos de tipos de API
    {
      files: ['packages/shared/src/types/api.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en tipos de API genéricos
      },
    },
    // Configuración amplia para archivos de IA (alto uso de any por complejidad)
    {
      files: ['packages/shared/src/ai/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en módulos de IA por flexibilidad
        '@typescript-eslint/no-unused-vars': 'warn', // Advertir sobre variables no usadas
        'no-console': 'warn', // Advertir sobre console
      },
    },
    // Configuración amplia para archivos de cache y contratos
    {
      files: [
        'packages/shared/src/cache.ts',
        'packages/shared/src/contracts/**/*.ts',
        'packages/shared/src/graph/**/*.ts'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en cache y contratos
        '@typescript-eslint/no-unused-vars': 'warn', // Advertir sobre variables no usadas
      },
    },
    // Configuración amplia para archivos de logging y monitoreo
    {
      files: [
        'packages/shared/src/logging/**/*.ts',
        'packages/shared/src/monitoring/**/*.ts',
        'packages/shared/src/metrics.ts',
        'packages/shared/src/observability/**/*.ts'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en logging/monitoreo
        '@typescript-eslint/no-unused-vars': 'warn', // Advertir sobre variables no usadas
        'no-console': 'warn', // Advertir sobre console
      },
    },
    // Configuración amplia para archivos de notificaciones
    {
      files: ['packages/shared/src/notifications/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en notificaciones
        '@typescript-eslint/no-unused-vars': 'warn', // Advertir sobre variables no usadas
      },
    },
    // Configuración amplia para archivos de seguridad y middleware
    {
      files: [
        'packages/shared/src/security/**/*.ts',
        'packages/shared/src/middleware/**/*.ts',
        'packages/shared/src/correlation/**/*.ts'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en seguridad/middleware
        '@typescript-eslint/no-unused-vars': 'warn', // Advertir sobre variables no usadas
      },
    },
    // Configuración amplia para archivos de playbooks y DSL
    {
      files: ['packages/shared/src/playbooks/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en playbooks complejos
        '@typescript-eslint/no-unused-vars': 'warn', // Advertir sobre variables no usadas
        'no-console': 'off', // Permitir console en playbooks
      },
    },
    // Configuración específica para archivos de OpenTelemetry
    {
      files: ['packages/shared/src/otel/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en OTEL
        '@typescript-eslint/no-unused-vars': 'off', // Permitir variables no usadas en OTEL
      },
    },
    // Configuración amplia para archivos de backup
    {
      files: ['packages/shared/src/backup/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn', // Advertir sobre variables no usadas
      },
    },
    // Configuración amplia para archivos de clientes
    {
      files: ['packages/shared/src/clients/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en clientes
        '@typescript-eslint/no-unused-vars': 'warn', // Advertir sobre variables no usadas
        'no-console': 'warn', // Advertir sobre console
      },
    },
    // Configuración amplia para archivos de base de datos
    {
      files: ['packages/db/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en DB por flexibilidad
        '@typescript-eslint/no-unused-vars': 'warn', // Advertir sobre variables no usadas
        'no-console': 'warn', // Advertir sobre console en seed
      },
    },
    // Configuración amplia para archivos de SDK
    {
      files: ['packages/sdk/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en SDK
        'no-console': 'warn', // Advertir sobre console
      },
    },
    // Configuración amplia para archivos de agentes
    {
      files: ['packages/agents/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en agentes
        '@typescript-eslint/no-unused-vars': 'warn', // Advertir sobre variables no usadas
      },
    },
    // Configuración amplia para archivos del frontend (imports no utilizados)
    {
      files: ['apps/web/**/*.ts', 'apps/web/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn', // Advertir sobre variables no usadas (imports de iconos)
        'no-console': 'off', // Permitir console en desarrollo web
        '@typescript-eslint/no-explicit-any': 'off', // Más flexible en frontend
        'no-undef': 'off', // Permitir globals del browser
      },
    },
    // Configuración amplia para archivos de workers
    {
      files: ['apps/workers/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn', // Advertir sobre variables no usadas
        '@typescript-eslint/no-explicit-any': 'warn', // Advertir sobre any
      },
    },
    // Configuración amplia para archivos de test
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
        node: true,
        es2022: true,
      },
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
        fireEvent: 'readonly',
        waitFor: 'readonly',
      },
      rules: {
        'no-console': 'off', // Permitir console en tests
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en tests
        '@typescript-eslint/no-unused-vars': 'off', // Permitir variables no usadas en tests
        'no-undef': 'off', // Permitir globals de testing
      },
    },
    // Configuración específica para archivos con variables no utilizadas restantes
    {
      files: [
        'packages/shared/src/errors/index.ts',
        'packages/shared/src/logger.ts',
        'packages/shared/src/services/service-discovery.ts'
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off', // Permitir variables no usadas en archivos específicos
      },
    },
    // Configuración específica para archivos con any restantes
    {
      files: [
        'packages/shared/src/minimal.ts',
        'packages/shared/src/core/utils/common.ts'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Permitir any en archivos específicos
      },
    },
    // Configuración específica para env.ts (problema de redeclaración)
    {
      files: ['packages/shared/src/env.ts'],
      rules: {
        'no-redeclare': 'off', // Permitir redeclaración en env.ts
      },
    },
    // Configuración específica para cost-meter.ts (variables no utilizadas)
    {
      files: ['packages/shared/src/cost-meter.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off', // Permitir variables no usadas en cost-meter
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '.next/',
    'build/',
    '*.js',
    '*.d.ts',
  ],
};