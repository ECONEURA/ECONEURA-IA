# Guía de Testing - ECONEURA-IA

Esta guía establece las convenciones y mejores prácticas para escribir y organizar tests en el proyecto ECONEURA-IA.

## 📁 Estructura de Tests

```
tests/
├── unit/           # Tests unitarios
├── integration/    # Tests de integración
├── e2e/           # Tests end-to-end
├── utils/         # Utilidades de testing
└── configs/       # Configuraciones de Vitest
```

## 📝 Naming Conventions

### Archivos de Test

**Unit Tests:**
```
[nombre].test.ts          # Test básico
[nombre].spec.ts          # Test de especificación
[nombre].[método].test.ts # Test específico de método
```

**Integration Tests:**
```
[nombre].integration.test.ts
[nombre].integration.spec.ts
```

**E2E Tests:**
```
[nombre].e2e.test.ts
[nombre].e2e.spec.ts
[feature].[scenario].e2e.test.ts
```

### Ejemplos

```typescript
// ✅ BUENAS prácticas
tests/unit/
├── auth.service.test.ts
├── user.model.test.ts
├── validation.utils.test.ts
└── api/
    └── endpoints.test.ts

tests/integration/
├── auth.integration.test.ts
├── database.integration.test.ts
└── api/
    └── routes.integration.test.ts

tests/e2e/
├── user-registration.e2e.test.ts
├── admin-dashboard.e2e.test.ts
└── api/
    └── full-flow.e2e.test.ts
```

```typescript
// ❌ MALAS prácticas
tests/
├── testAuth.ts           # Sin extensión .test.ts
├── authServiceSpec.js    # Extensión incorrecta
├── everything.test.ts    # Nombre demasiado genérico
```

## 🧪 Tipos de Tests

### Unit Tests
- **Propósito**: Probar unidades individuales de código
- **Alcance**: Funciones, métodos, clases
- **Dependencias**: Mocks/stubs para dependencias externas
- **Ejecución**: Rápida (< 100ms por test)
- **Coverage**: >85%

**Ejemplo:**
```typescript
// tests/unit/auth.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../../src/services/auth.service';

describe('AuthService', () => {
  describe('validateToken', () => {
    it('should validate a valid JWT token', () => {
      // Arrange
      const service = new AuthService();
      const validToken = 'valid.jwt.token';

      // Act
      const result = service.validateToken(validToken);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject an invalid JWT token', () => {
      // Arrange
      const service = new AuthService();
      const invalidToken = 'invalid.token';

      // Act & Assert
      expect(() => service.validateToken(invalidToken))
        .toThrow('Invalid token');
    });
  });
});
```

### Integration Tests
- **Propósito**: Probar integración entre componentes
- **Alcance**: APIs, base de datos, servicios externos
- **Dependencias**: Base de datos de test, servicios mockeados
- **Ejecución**: Media (1-10 segundos por test)
- **Coverage**: >80%

**Ejemplo:**
```typescript
// tests/integration/auth.integration.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestDatabase, teardownTestDatabase } from '../utils/test-db';

describe('Auth Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('POST /auth/login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });
  });
});
```

### E2E Tests
- **Propósito**: Probar flujo completo de usuario
- **Alcance**: De extremo a extremo
- **Dependencias**: Aplicación completa corriendo
- **Ejecución**: Lenta (10-60 segundos por test)
- **Coverage**: >70%

**Ejemplo:**
```typescript
// tests/e2e/user-registration.e2e.test.ts
import { describe, it, expect } from 'vitest';
import { Page, Browser } from 'playwright';
import { setupE2E, teardownE2E } from '../utils/e2e-setup';

describe('User Registration E2E', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    ({ browser, page } = await setupE2E());
  });

  afterAll(async () => {
    await teardownE2E(browser);
  });

  it('should register a new user successfully', async () => {
    // Arrange
    await page.goto('/register');

    // Act
    await page.fill('[data-testid="email"]', 'newuser@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    await page.click('[data-testid="register-button"]');

    // Assert
    await expect(page.locator('[data-testid="success-message"]'))
      .toContainText('Registration successful');
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## 🛠️ Utilidades de Testing

### Setup Files

**Unit Setup:**
```typescript
// tests/utils/unit-setup.ts
import { beforeAll, afterAll } from 'vitest';

// Configuración global para tests unitarios
beforeAll(() => {
  // Configuración inicial
});

afterAll(() => {
  // Limpieza final
});
```

**Integration Setup:**
```typescript
// tests/utils/integration-setup.ts
import { beforeAll, afterAll } from 'vitest';
import { setupTestDatabase } from './test-db';

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  // Cleanup
});
```

### Helpers Comunes

```typescript
// tests/utils/test-helpers.ts
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides
});

export const createMockRequest = (body = {}) => ({
  body,
  params: {},
  query: {},
  headers: {}
});

export const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis()
  };
  return res;
};
```

## 🚀 Ejecución de Tests

### Comandos Disponibles

```bash
# Todos los tests
pnpm test

# Tests unitarios
pnpm test:unit

# Tests de integración
pnpm test:integration

# Tests E2E
pnpm test:e2e

# Con coverage
pnpm test:coverage
pnpm test:unit:coverage
pnpm test:integration:coverage
pnpm test:e2e:coverage

# Modo watch
pnpm test:watch
pnpm test:unit:watch
```

### Configuración en package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run -c tests/configs/vitest.unit.config.ts",
    "test:integration": "vitest run -c tests/configs/vitest.integration.config.ts",
    "test:e2e": "vitest run -c tests/configs/vitest.e2e.config.ts",
    "test:coverage": "vitest run --coverage",
    "test:unit:coverage": "vitest run -c tests/configs/vitest.unit.config.ts --coverage",
    "test:integration:coverage": "vitest run -c tests/configs/vitest.integration.config.ts --coverage",
    "test:e2e:coverage": "vitest run -c tests/configs/vitest.e2e.config.ts --coverage"
  }
}
```

## 📊 Coverage

### Umbrales por Tipo

| Tipo | Branches | Functions | Lines | Statements |
|------|----------|-----------|-------|------------|
| Unit | 85% | 85% | 85% | 85% |
| Integration | 80% | 80% | 80% | 80% |
| E2E | 70% | 70% | 70% | 70% |

### Reportes

Los reportes de coverage se generan en:
- `coverage/unit/` - Coverage de unit tests
- `coverage/integration/` - Coverage de integration tests
- `coverage/e2e/` - Coverage de E2E tests
- `coverage/lcov-report/index.html` - Reporte HTML completo

## 🔧 Mejores Prácticas

### 1. AAA Pattern
```typescript
describe('Feature', () => {
  it('should work correctly', () => {
    // Arrange - Preparar datos y estado
    const input = 'test';
    const expected = 'TEST';

    // Act - Ejecutar la funcionalidad
    const result = toUpperCase(input);

    // Assert - Verificar resultado
    expect(result).toBe(expected);
  });
});
```

### 2. Test Data Builders
```typescript
const createUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  ...overrides
});
```

### 3. Descriptive Test Names
```typescript
// ✅ Bueno
it('should throw ValidationError when email is invalid')

// ❌ Malo
it('should work')
it('test email validation')
```

### 4. Isolated Tests
```typescript
// ✅ Aislar estado entre tests
beforeEach(() => {
  cleanup();
  setupFreshState();
});
```

### 5. Mock External Dependencies
```typescript
// ✅ Mockear servicios externos
vi.mock('../services/api', () => ({
  apiService: {
    getUser: vi.fn()
  }
}));
```

## 🐛 Debugging Tests

### Ejecutar Test Específico
```bash
# Por nombre
pnpm test -t "should validate email"

# Por archivo
pnpm test tests/unit/auth.service.test.ts

# Con debug
pnpm test --reporter=verbose
```

### Inspeccionar Estado
```typescript
it('should debug state', () => {
  console.log('Current state:', state);
  debugger; // Punto de interrupción
});
```

## 📚 Recursos Adicionales

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Mock Service Worker](https://mswjs.io/)