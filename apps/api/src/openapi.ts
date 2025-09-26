import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import { version } from '../../package.json';

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ECONEURA API',
    version,
    description: 'API para gestión de CRM, ERP y Finanzas',
    contact: {
      name: 'ECONEURA Support',
      url: 'https://econeura.com/support'
    }
  },
  servers: [
    {
      url: '{protocol}://{host}',
      variables: {
        protocol: {
          enum: ['http', 'https'],
          default: 'http'
        },
        host: {
          default: 'localhost:4000'
        }
      }
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            format: 'uri'
          },
          title: {
            type: 'string'
          },
          status: {
            type: 'integer',
            format: 'int32'
          },
          detail: {
            type: 'string'
          },
          instance: {
            type: 'string',
            format: 'uri-reference'
          },
          traceId: {
            type: 'string'
          }
        },
        required: ['type', 'title', 'status', 'detail', 'instance']
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            format: 'int32',
            minimum: 1
          },
          pageSize: {
            type: 'integer',
            format: 'int32',
            minimum: 1
          },
          total: {
            type: 'integer',
            format: 'int32',
            minimum: 0
          }
        },
        required: ['page', 'pageSize', 'total']
      }
    }
  }
};

export function setupOpenAPI(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get('/openapi.json', (req, res) => {
    res.json(openApiSpec);
  });
}
