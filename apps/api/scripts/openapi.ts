#!/usr/bin/env node
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// Import all schemas from shared
import {
  // CRM schemas
  CompanySchema,
  CreateCompanySchema,
  UpdateCompanySchema,
  CompanyFilterSchema,
  ContactSchema,
  CreateContactSchema,
  UpdateContactSchema,
  ContactFilterSchema,
  DealSchema,
  CreateDealSchema,
  UpdateDealSchema,
  DealFilterSchema,
  MoveDealStageSchema,
  ActivitySchema,
  CreateActivitySchema,
  UpdateActivitySchema,

  // ERP schemas
  ProductSchema,
  CreateProductSchema,
  UpdateProductSchema,
  ProductFilterSchema,
  SupplierSchema,
  CreateSupplierSchema,
  UpdateSupplierSchema,
  SupplierFilterSchema,
  WarehouseSchema,
  CreateWarehouseSchema,
  UpdateWarehouseSchema,
  InventorySchema,
  CreateInventorySchema,
  UpdateInventorySchema,
  CreateInventoryAdjustmentSchema,
  PurchaseOrderSchema,
  CreatePurchaseOrderSchema,

  // Finance schemas
  InvoiceSchema,
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  InvoiceFilterSchema,
  PaymentSchema,
  CreatePaymentSchema,
  UpdatePaymentSchema,
  ExpenseSchema,
  CreateExpenseSchema,
  UpdateExpenseSchema,
  FinancialSummarySchema,

  // Auth schemas
  LoginRequestSchema,
  LoginResponseSchema,
  RefreshTokenRequestSchema,
  RefreshTokenResponseSchema,
  LogoutRequestSchema,
  MeResponseSchema,
  SessionsResponseSchema,

  // Common schemas
  PaginationRequestSchema,
  PaginationResponseSchema,
  ProblemDetailsSchema,
  ValidationErrorSchema,
  HealthCheckResponseSchema,

} from '@econeura/shared/src/schemas';

// Create registry
const registry = new OpenAPIRegistry();

// Register security scheme
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT authentication token'
});

// Helper to create paginated response schema
function createPaginatedResponse(itemSchema: z.ZodType<any>): void {
  return z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      cursor: z.string().nullable(),
      hasMore: z.boolean(),
      total: z.number().int().optional(),
      limit: z.number().int(),
    }),
  });
}

// Auth endpoints
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  summary: 'User login',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successful login',
      content: {
        'application/json': {
          schema: LoginResponseSchema,
        },
      },
    },
    401: {
      description: 'Invalid credentials',
      content: {
        'application/json': {
          schema: ProblemDetailsSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh',
  summary: 'Refresh access token',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RefreshTokenRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Token refreshed successfully',
      content: {
        'application/json': {
          schema: RefreshTokenResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  summary: 'User logout',
  tags: ['Authentication'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: LogoutRequestSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'Logged out successfully',
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/me',
  summary: 'Get current user info',
  tags: ['Authentication'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Current user information',
      content: {
        'application/json': {
          schema: MeResponseSchema,
        },
      },
    },
  },
});

// CRM - Companies endpoints
registry.registerPath({
  method: 'get',
  path: '/api/v1/crm/companies',
  summary: 'List companies',
  tags: ['CRM - Companies'],
  security: [{ bearerAuth: [] }],
  request: {
    query: CompanyFilterSchema.extend({
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
      sort: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Companies list',
      content: {
        'application/json': {
          schema: createPaginatedResponse(CompanySchema),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/crm/companies',
  summary: 'Create company',
  tags: ['CRM - Companies'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateCompanySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Company created',
      content: {
        'application/json': {
          schema: CompanySchema,
        },
      },
    },
    422: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: ValidationErrorSchema,
        },
      },
    },
  },
});

// CRM - Contacts endpoints
registry.registerPath({
  method: 'get',
  path: '/api/v1/crm/contacts',
  summary: 'List contacts',
  tags: ['CRM - Contacts'],
  security: [{ bearerAuth: [] }],
  request: {
    query: ContactFilterSchema.extend({
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
      sort: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Contacts list',
      content: {
        'application/json': {
          schema: createPaginatedResponse(ContactSchema),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/crm/contacts',
  summary: 'Create contact',
  tags: ['CRM - Contacts'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateContactSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Contact created',
      content: {
        'application/json': {
          schema: ContactSchema,
        },
      },
    },
  },
});

// CRM - Deals endpoints
registry.registerPath({
  method: 'get',
  path: '/api/v1/crm/deals',
  summary: 'List deals',
  tags: ['CRM - Deals'],
  security: [{ bearerAuth: [] }],
  request: {
    query: DealFilterSchema.extend({
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
      sort: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Deals list',
      content: {
        'application/json': {
          schema: createPaginatedResponse(DealSchema),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/crm/deals/{id}/stage',
  summary: 'Move deal to different stage',
  tags: ['CRM - Deals'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: MoveDealStageSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Deal stage updated',
      content: {
        'application/json': {
          schema: DealSchema,
        },
      },
    },
  },
});

// ERP - Products endpoints
registry.registerPath({
  method: 'get',
  path: '/api/v1/erp/products',
  summary: 'List products',
  tags: ['ERP - Products'],
  security: [{ bearerAuth: [] }],
  request: {
    query: ProductFilterSchema.extend({
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
      sort: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Products list',
      content: {
        'application/json': {
          schema: createPaginatedResponse(ProductSchema),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/erp/products',
  summary: 'Create product',
  tags: ['ERP - Products'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateProductSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Product created',
      content: {
        'application/json': {
          schema: ProductSchema,
        },
      },
    },
  },
});

// ERP - Inventory endpoints
registry.registerPath({
  method: 'post',
  path: '/api/v1/erp/inventory/adjust',
  summary: 'Adjust inventory',
  tags: ['ERP - Inventory'],
  security: [{ bearerAuth: [] }],
  request: {
    headers: z.object({
      'x-idempotency-key': z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: CreateInventoryAdjustmentSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Inventory adjusted',
      content: {
        'application/json': {
          schema: InventorySchema,
        },
      },
    },
  },
});

// Finance - Invoices endpoints
registry.registerPath({
  method: 'get',
  path: '/api/v1/finance/invoices',
  summary: 'List invoices',
  tags: ['Finance - Invoices'],
  security: [{ bearerAuth: [] }],
  request: {
    query: InvoiceFilterSchema.extend({
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
      sort: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Invoices list',
      content: {
        'application/json': {
          schema: createPaginatedResponse(InvoiceSchema),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/finance/invoices',
  summary: 'Create invoice',
  tags: ['Finance - Invoices'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateInvoiceSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Invoice created',
      content: {
        'application/json': {
          schema: InvoiceSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/finance/invoices/{id}/approve',
  summary: 'Approve invoice',
  tags: ['Finance - Invoices'],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Invoice approved',
      content: {
        'application/json': {
          schema: InvoiceSchema,
        },
      },
    },
  },
});

// Finance - Summary endpoint
registry.registerPath({
  method: 'get',
  path: '/api/v1/finance/summary',
  summary: 'Get financial summary',
  tags: ['Finance - Reports'],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
    }),
  },
  responses: {
    200: {
      description: 'Financial summary',
      content: {
        'application/json': {
          schema: FinancialSummarySchema,
        },
      },
    },
  },
});

// Health check endpoint
registry.registerPath({
  method: 'get',
  path: '/api/health',
  summary: 'Health check',
  tags: ['System'],
  responses: {
    200: {
      description: 'System health status',
      content: {
        'application/json': {
          schema: HealthCheckResponseSchema,
        },
      },
    },
  },
});

// Serve OpenAPI endpoint
registry.registerPath({
  method: 'get',
  path: '/api/openapi.json',
  summary: 'Get OpenAPI specification',
  tags: ['System'],
  responses: {
    200: {
      description: 'OpenAPI specification',
      content: {
        'application/json': {
          schema: z.object({}).passthrough(),
        },
      },
    },
  },
});

// Generate OpenAPI document
const generator = new OpenApiGeneratorV31(registry.definitions);
const openApiDocument = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'ECONEURA API',
    version: '1.0.0',
    description: 'Production-ready ERP+CRM API with AI capabilities',
    contact: {
      name: 'ECONEURA Team',
      email: 'api@econeura.dev',
      url: 'https://econeura.dev'
    },
    license: {
      name: 'Proprietary',
      url: 'https://econeura.dev/license'
    }
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:4000',
      description: 'Development server',
    },
    {
      url: 'https://api.econeura.dev',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication and session management' },
    { name: 'CRM - Companies', description: 'Company management' },
    { name: 'CRM - Contacts', description: 'Contact management' },
    { name: 'CRM - Deals', description: 'Deal pipeline management' },
    { name: 'ERP - Products', description: 'Product catalog management' },
    { name: 'ERP - Inventory', description: 'Inventory tracking and adjustments' },
    { name: 'ERP - Suppliers', description: 'Supplier management' },
    { name: 'Finance - Invoices', description: 'Invoice management' },
    { name: 'Finance - Payments', description: 'Payment processing' },
    { name: 'Finance - Reports', description: 'Financial reporting' },
    { name: 'System', description: 'System health and metadata' },
  ],
});

// Write OpenAPI document
const outputPath = path.resolve(process.cwd(), 'apps/api/openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2));
console.log(`✅ OpenAPI spec generated at: ${outputPath}`);

// Also write a YAML version for human readability
import('js-yaml').then((yaml) => {
  const yamlStr = yaml.dump(openApiDocument);
  const yamlPath = path.resolve(process.cwd(), 'apps/api/openapi.yaml');
  fs.writeFileSync(yamlPath, yamlStr);
  console.log(`✅ OpenAPI YAML generated at: ${yamlPath}`);
}).catch(err => {
  console.error('Failed to generate YAML:', err);
});

export default openApiDocument;
