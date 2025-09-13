#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

// Manually create OpenAPI document
const openApiDocument = {
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
    { name: 'Finance - Invoices', description: 'Invoice management' },
    { name: 'Finance - Reports', description: 'Financial reporting' },
    { name: 'System', description: 'System health and metadata' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authentication token'
      }
    },
    schemas: {
      ProblemDetails: {
        type: 'object',
        properties: {
          type: { type: 'string', format: 'uri', default: 'about:blank' },
          title: { type: 'string' },
          status: { type: 'integer', minimum: 400, maximum: 599 },
          detail: { type: 'string' },
          instance: { type: 'string' },
          traceId: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
        required: ['type', 'title', 'status']
      },
      ValidationError: {
        allOf: [
          { $ref: '#/components/schemas/ProblemDetails' },
          {
            type: 'object',
            properties: {
              errors: {
                type: 'object',
                additionalProperties: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            },
            required: ['errors']
          }
        ]
      },
      PaginationResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {}
          },
          pagination: {
            type: 'object',
            properties: {
              cursor: { type: 'string', nullable: true },
              hasMore: { type: 'boolean' },
              total: { type: 'integer', nullable: true },
              limit: { type: 'integer' }
            },
            required: ['hasMore', 'limit']
          }
        },
        required: ['data', 'pagination']
      },
      Company: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          orgId: { type: 'string', format: 'uuid' },
          name: { type: 'string', minLength: 2, maxLength: 120 },
          industry: { type: 'string', maxLength: 80 },
          website: { type: 'string', format: 'uri' },
          employees: { type: 'integer', minimum: 0, default: 0 },
          status: { type: 'string', enum: ['active', 'inactive', 'prospect'], default: 'prospect' },
          taxId: { type: 'string', maxLength: 50 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', maxLength: 50 },
          address: { type: 'string', maxLength: 500 },
          city: { type: 'string', maxLength: 100 },
          country: { type: 'string', maxLength: 100 },
          tags: { type: 'array', items: { type: 'string' }, default: [] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          deletedAt: { type: 'string', format: 'date-time', nullable: true },
        },
        required: ['id', 'orgId', 'name', 'status', 'createdAt', 'updatedAt']
      },
      CreateCompany: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 120 },
          industry: { type: 'string', maxLength: 80 },
          website: { type: 'string', format: 'uri' },
          employees: { type: 'integer', minimum: 0, default: 0 },
          status: { type: 'string', enum: ['active', 'inactive', 'prospect'], default: 'prospect' },
          taxId: { type: 'string', maxLength: 50 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', maxLength: 50 },
          address: { type: 'string', maxLength: 500 },
          city: { type: 'string', maxLength: 100 },
          country: { type: 'string', maxLength: 100 },
          tags: { type: 'array', items: { type: 'string' }, default: [] },
        },
        required: ['name']
      },
      UpdateCompany: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 120 },
          industry: { type: 'string', maxLength: 80 },
          website: { type: 'string', format: 'uri' },
          employees: { type: 'integer', minimum: 0 },
          status: { type: 'string', enum: ['active', 'inactive', 'prospect'] },
          taxId: { type: 'string', maxLength: 50 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', maxLength: 50 },
          address: { type: 'string', maxLength: 500 },
          city: { type: 'string', maxLength: 100 },
          country: { type: 'string', maxLength: 100 },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 100 },
          organizationSlug: { type: 'string', minLength: 3, maxLength: 50 },
          deviceId: { type: 'string', minLength: 1, maxLength: 255 },
          deviceName: { type: 'string', maxLength: 255 },
          rememberMe: { type: 'boolean', default: false },
        },
        required: ['email', 'password']
      },
      LoginResponse: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              displayName: { type: 'string' },
            }
          },
          organization: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              slug: { type: 'string' },
            }
          },
          permissions: {
            type: 'array',
            items: { type: 'string' }
          },
          tokens: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              expiresIn: { type: 'integer' },
              tokenType: { type: 'string', enum: ['Bearer'] },
            }
          },
        },
        required: ['user', 'organization', 'permissions', 'tokens']
      },
      HealthCheck: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
          version: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          checks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                message: { type: 'string' },
                duration: { type: 'integer' },
              },
              required: ['name', 'status']
            }
          }
        },
        required: ['status', 'version', 'timestamp', 'checks']
      }
    }
  },
  paths: {
    '/api/v1/auth/login': {
      post: {
        summary: 'User login',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successful login',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProblemDetails' }
              }
            }
          }
        }
      }
    },
    '/api/v1/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' },
                  deviceId: { type: 'string' },
                },
                required: ['refreshToken']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Token refreshed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tokens: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                        expiresIn: { type: 'integer' },
                        tokenType: { type: 'string' },
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/auth/logout': {
      post: {
        summary: 'User logout',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          '204': {
            description: 'Logged out successfully'
          }
        }
      }
    },
    '/api/v1/auth/me': {
      get: {
        summary: 'Get current user info',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { type: 'object' },
                    organization: { type: 'object' },
                    role: { type: 'object' },
                    permissions: { type: 'array', items: { type: 'string' } },
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/auth/sessions': {
      get: {
        summary: 'Get user sessions',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User sessions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sessions: { type: 'array', items: { type: 'object' } },
                    total: { type: 'integer' },
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Revoke session',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '204': {
            description: 'Session revoked'
          }
        }
      }
    },
    '/api/v1/crm/companies': {
      get: {
        summary: 'List companies',
        tags: ['CRM - Companies'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'cursor', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
          { name: 'sort', in: 'query', schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'prospect'] } },
          { name: 'industry', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Companies list',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginationResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Company' }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create company',
        tags: ['CRM - Companies'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCompany' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Company created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Company' }
              }
            }
          },
          '422': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          }
        }
      }
    },
    '/api/v1/crm/companies/{id}': {
      get: {
        summary: 'Get company by ID',
        tags: ['CRM - Companies'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Company details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Company' }
              }
            }
          },
          '404': {
            description: 'Company not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProblemDetails' }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update company',
        tags: ['CRM - Companies'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateCompany' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Company updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Company' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete company',
        tags: ['CRM - Companies'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '204': {
            description: 'Company deleted'
          }
        }
      }
    },
    '/api/health': {
      get: {
        summary: 'Health check',
        tags: ['System'],
        responses: {
          '200': {
            description: 'System health status',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthCheck' }
              }
            }
          }
        }
      }
    },
    '/api/openapi.json': {
      get: {
        summary: 'Get OpenAPI specification',
        tags: ['System'],
        responses: {
          '200': {
            description: 'OpenAPI specification',
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }
};

// Write OpenAPI document
const outputPath = path.resolve(process.cwd(), 'openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2));


// Also write a YAML version for human readability
import('js-yaml').then((yaml) => {
  const yamlStr = yaml.dump(openApiDocument);
  const yamlPath = path.resolve(process.cwd(), 'openapi.yaml');
  fs.writeFileSync(yamlPath, yamlStr);
  
}).catch(err => {
  console.error('Note: YAML generation skipped (optional)');
});

export default openApiDocument;