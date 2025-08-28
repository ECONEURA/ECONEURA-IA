# EcoNeura SDK

SDK tipado para interactuar con la API de EcoNeura.

## Instalación

```bash
npm install @econeura/shared
# o
pnpm add @econeura/shared
```

## Uso básico

```typescript
import { EcoNeuraClient } from '@econeura/shared';

// Crear instancia del cliente
const client = new EcoNeuraClient({
  baseUrl: 'https://api.econeura.dev',
  headers: {
    'x-org-id': 'mi-organizacion',
    'authorization': 'Bearer mi-token',
  }
});

// Usar los diferentes clientes
async function ejemplo() {
  // Empresas (CRM)
  const companies = await client.crm.listCompanies({
    page: 1,
    perPage: 20,
    status: 'active'
  });

  // IA - Chat completion
  const completion = await client.ai.createChatCompletion({
    messages: [
      { role: 'user', content: 'Hola!' }
    ],
    model: 'mistral-medium'
  });

  // Flujos automatizados
  const flow = await client.flows.startFlow({
    flow_type: 'cobro_proactivo',
    input_data: {
      customer_id: '123',
      amount: 1000
    }
  });
}
```

## Dominios disponibles

- `client.ai`: APIs de IA (chat, completion, etc.)
- `client.crm`: Gestión de empresas, contactos y oportunidades
- `client.flows`: Control de flujos automatizados
- `client.integrations`: Webhooks y canales de comunicación
- `client.admin`: Administración de organizaciones

## Esquemas y tipos

Todos los esquemas y tipos están disponibles para importar:

```typescript
import {
  // Base
  BaseHeaders,
  BaseResponse,
  PaginationParams,
  
  // AI
  AIRequest,
  ChatCompletion,
  
  // CRM
  Company,
  Contact,
  Deal,
  
  // etc...
} from '@econeura/shared';
```

## Features

- ✅ Validación automática de requests/responses
- 🔒 Tipado end-to-end
- 📝 Documentación inline
- 🚦 Manejo consistente de errores
- 📊 Paginación unificada
- 🔍 Query params tipados

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Compilar
pnpm build

# Tests
pnpm test
```

## Licencia

MIT
