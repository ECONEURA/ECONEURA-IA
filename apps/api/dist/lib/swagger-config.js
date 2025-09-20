export const swaggerConfig = {
    openapi: '3.0.0',
    info: {
        title: 'ECONEURA API',
        description: 'Comprehensive API for ECONEURA - Enterprise AI Platform with CRM, ERP, Security, SEPA, GDPR, and RLS capabilities',
        version: '1.0.0',
        contact: {
            name: 'ECONEURA Development Team',
            email: 'dev@econeura.com',
            url: 'https://econeura.com'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: [
        {
            url: 'http://localhost:4000',
            description: 'Development server'
        },
        {
            url: 'https://api.econeura.com',
            description: 'Production server'
        }
    ],
    tags: [
        {
            name: 'Health',
            description: 'Health check and monitoring endpoints'
        },
        {
            name: 'Authentication',
            description: 'User authentication and authorization'
        },
        {
            name: 'CRM',
            description: 'Customer Relationship Management'
        },
        {
            name: 'ERP',
            description: 'Enterprise Resource Planning'
        },
        {
            name: 'AI Platform',
            description: 'Artificial Intelligence and Machine Learning services'
        },
        {
            name: 'Security',
            description: 'Advanced security system with MFA, RBAC, and threat detection'
        },
        {
            name: 'SEPA',
            description: 'SEPA banking system with CAMT/MT940 parsing and reconciliation'
        },
        {
            name: 'GDPR',
            description: 'GDPR compliance system with data export/erase capabilities'
        },
        {
            name: 'RLS',
            description: 'Row Level Security generative suite with CI/CD integration'
        }
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            },
            ApiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key'
            },
            UserAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-User-ID'
            },
            OrganizationAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-Organization-ID'
            }
        },
        schemas: {
            SuccessResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: true
                    },
                    data: {
                        type: 'object'
                    }
                }
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: false
                    },
                    error: {
                        type: 'object',
                        properties: {
                            message: {
                                type: 'string',
                                example: 'Error message'
                            },
                            statusCode: {
                                type: 'integer',
                                example: 400
                            },
                            timestamp: {
                                type: 'string',
                                format: 'date-time'
                            },
                            context: {
                                type: 'object'
                            }
                        }
                    }
                }
            },
            PaginationQuery: {
                type: 'object',
                properties: {
                    page: {
                        type: 'integer',
                        minimum: 1,
                        default: 1,
                        description: 'Page number'
                    },
                    limit: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 100,
                        default: 10,
                        description: 'Number of items per page'
                    },
                    sort: {
                        type: 'string',
                        description: 'Field to sort by'
                    },
                    order: {
                        type: 'string',
                        enum: ['asc', 'desc'],
                        default: 'asc',
                        description: 'Sort order'
                    }
                }
            },
            PaginationResponse: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: {
                            type: 'object'
                        }
                    },
                    pagination: {
                        type: 'object',
                        properties: {
                            page: {
                                type: 'integer'
                            },
                            limit: {
                                type: 'integer'
                            },
                            total: {
                                type: 'integer'
                            },
                            pages: {
                                type: 'integer'
                            }
                        }
                    }
                }
            },
            HealthStatus: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['healthy', 'unhealthy', 'degraded']
                    },
                    timestamp: {
                        type: 'string',
                        format: 'date-time'
                    },
                    services: {
                        type: 'object',
                        properties: {
                            database: {
                                type: 'string',
                                enum: ['up', 'down']
                            },
                            cache: {
                                type: 'string',
                                enum: ['up', 'down']
                            },
                            external: {
                                type: 'string',
                                enum: ['up', 'down']
                            }
                        }
                    }
                }
            },
            SEPATransaction: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        example: 'sepa_1234567890_abcdef'
                    },
                    amount: {
                        type: 'number',
                        example: 100.50
                    },
                    currency: {
                        type: 'string',
                        example: 'EUR'
                    },
                    date: {
                        type: 'string',
                        format: 'date-time'
                    },
                    description: {
                        type: 'string',
                        example: 'Payment for services'
                    },
                    reference: {
                        type: 'string',
                        example: 'REF123456'
                    },
                    type: {
                        type: 'string',
                        enum: ['credit', 'debit']
                    },
                    status: {
                        type: 'string',
                        enum: ['pending', 'matched', 'reconciled', 'exception']
                    },
                    source: {
                        type: 'string',
                        enum: ['camt', 'mt940', 'manual']
                    }
                }
            },
            GDPRRequest: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        example: 'gdpr_req_1234567890_abcdef'
                    },
                    userId: {
                        type: 'string',
                        format: 'uuid'
                    },
                    type: {
                        type: 'string',
                        enum: ['export', 'erase', 'rectification', 'portability']
                    },
                    status: {
                        type: 'string',
                        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']
                    },
                    requestedAt: {
                        type: 'string',
                        format: 'date-time'
                    },
                    dataCategories: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['personal_info', 'financial_data', 'sepa_transactions', 'crm_data', 'audit_logs']
                        }
                    },
                    scope: {
                        type: 'string',
                        enum: ['user', 'organization']
                    },
                    priority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'urgent']
                    }
                }
            },
            RLSPolicy: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        example: 'policy_1234567890_abcdef'
                    },
                    name: {
                        type: 'string',
                        example: 'user_data_policy'
                    },
                    description: {
                        type: 'string',
                        example: 'Policy for user data access'
                    },
                    tableName: {
                        type: 'string',
                        example: 'users'
                    },
                    schemaName: {
                        type: 'string',
                        example: 'public'
                    },
                    policyType: {
                        type: 'string',
                        enum: ['select', 'insert', 'update', 'delete', 'all']
                    },
                    condition: {
                        type: 'string',
                        example: 'user_id = current_user_id()'
                    },
                    roles: {
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    status: {
                        type: 'string',
                        enum: ['draft', 'validated', 'deployed', 'failed', 'rollback']
                    },
                    version: {
                        type: 'string',
                        example: '1.0.0'
                    }
                }
            },
            User: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid'
                    },
                    email: {
                        type: 'string',
                        format: 'email'
                    },
                    username: {
                        type: 'string'
                    },
                    roles: {
                        type: 'array',
                        items: {
                            type: 'string'
                        }
                    },
                    organizationId: {
                        type: 'string',
                        format: 'uuid'
                    },
                    isActive: {
                        type: 'boolean'
                    },
                    lastLogin: {
                        type: 'string',
                        format: 'date-time'
                    }
                }
            },
            StatsResponse: {
                type: 'object',
                properties: {
                    total: {
                        type: 'integer'
                    },
                    active: {
                        type: 'integer'
                    },
                    inactive: {
                        type: 'integer'
                    },
                    successRate: {
                        type: 'number',
                        format: 'float'
                    },
                    averageResponseTime: {
                        type: 'number',
                        format: 'float'
                    }
                }
            }
        },
        parameters: {
            RequestId: {
                name: 'X-Request-ID',
                in: 'header',
                description: 'Unique request identifier',
                schema: {
                    type: 'string'
                }
            },
            UserId: {
                name: 'X-User-ID',
                in: 'header',
                description: 'User identifier',
                schema: {
                    type: 'string',
                    format: 'uuid'
                }
            },
            OrganizationId: {
                name: 'X-Organization-ID',
                in: 'header',
                description: 'Organization identifier',
                schema: {
                    type: 'string',
                    format: 'uuid'
                }
            },
            Page: {
                name: 'page',
                in: 'query',
                description: 'Page number',
                schema: {
                    type: 'integer',
                    minimum: 1,
                    default: 1
                }
            },
            Limit: {
                name: 'limit',
                in: 'query',
                description: 'Number of items per page',
                schema: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 100,
                    default: 10
                }
            }
        },
        responses: {
            Success: {
                description: 'Successful response',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/SuccessResponse'
                        }
                    }
                }
            },
            BadRequest: {
                description: 'Bad request',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            Unauthorized: {
                description: 'Unauthorized',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            Forbidden: {
                description: 'Forbidden',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            NotFound: {
                description: 'Not found',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            TooManyRequests: {
                description: 'Too many requests',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            },
            InternalServerError: {
                description: 'Internal server error',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ErrorResponse'
                        }
                    }
                }
            }
        }
    },
    security: [
        {
            BearerAuth: []
        },
        {
            ApiKeyAuth: []
        }
    ]
};
export const swaggerPaths = {
    '/health/live': {
        get: {
            tags: ['Health'],
            summary: 'Liveness probe',
            description: 'Check if the service is alive',
            responses: {
                '200': {
                    description: 'Service is alive',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/HealthStatus'
                            }
                        }
                    }
                }
            }
        }
    },
    '/health/ready': {
        get: {
            tags: ['Health'],
            summary: 'Readiness probe',
            description: 'Check if the service is ready to serve requests',
            responses: {
                '200': {
                    description: 'Service is ready',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/HealthStatus'
                            }
                        }
                    }
                },
                '503': {
                    description: 'Service is not ready',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    },
    '/v1/sepa/transactions': {
        get: {
            tags: ['SEPA'],
            summary: 'Get SEPA transactions',
            description: 'Retrieve SEPA transactions with optional filtering',
            parameters: [
                {
                    $ref: '#/components/parameters/Page'
                },
                {
                    $ref: '#/components/parameters/Limit'
                }
            ],
            responses: {
                '200': {
                    description: 'SEPA transactions retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: {
                                        type: 'boolean',
                                        example: true
                                    },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            transactions: {
                                                type: 'array',
                                                items: {
                                                    $ref: '#/components/schemas/SEPATransaction'
                                                }
                                            },
                                            count: {
                                                type: 'integer'
                                            }
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
    '/v1/gdpr/requests': {
        post: {
            tags: ['GDPR'],
            summary: 'Create GDPR request',
            description: 'Create a new GDPR request for data export, erase, rectification, or portability',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/GDPRRequest'
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'GDPR request created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/SuccessResponse'
                            }
                        }
                    }
                },
                '400': {
                    $ref: '#/components/responses/BadRequest'
                }
            }
        }
    },
    '/v1/rls/generate': {
        post: {
            tags: ['RLS'],
            summary: 'Generate RLS policy',
            description: 'Generate a new RLS policy based on template and configuration',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['schemaId', 'tableName', 'policyType', 'templateId'],
                            properties: {
                                schemaId: {
                                    type: 'string',
                                    example: 'econeura_schema'
                                },
                                tableName: {
                                    type: 'string',
                                    example: 'users'
                                },
                                policyType: {
                                    type: 'string',
                                    enum: ['select', 'insert', 'update', 'delete', 'all']
                                },
                                templateId: {
                                    type: 'string',
                                    example: 'user_based_policy'
                                },
                                variables: {
                                    type: 'object'
                                },
                                rules: {
                                    type: 'array',
                                    items: {
                                        type: 'object'
                                    }
                                },
                                options: {
                                    type: 'object'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'RLS policy generated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/SuccessResponse'
                            }
                        }
                    }
                },
                '400': {
                    $ref: '#/components/responses/BadRequest'
                }
            }
        }
    }
};
//# sourceMappingURL=swagger-config.js.map