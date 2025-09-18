export const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'ECONEURA API',
        description: 'Enterprise ERP/CRM with AI capabilities',
        version: '1.0.0',
        contact: {
            name: 'ECONEURA Team',
            email: 'support@econeura.com'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: [
        {
            url: 'https://api.econeura.com/v1',
            description: 'Production server'
        },
        {
            url: 'https://staging-api.econeura.com/v1',
            description: 'Staging server'
        },
        {
            url: 'http://localhost:3001/api/v1',
            description: 'Development server'
        }
    ],
    security: [
        {
            BearerAuth: []
        },
        {
            ApiKeyAuth: []
        }
    ],
    paths: {
        '/auth/login': {
            post: {
                tags: ['Authentication'],
                summary: 'User login',
                description: 'Authenticate user and return access token',
                operationId: 'login',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/LoginRequest'
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Login successful',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/LoginResponse'
                                }
                            }
                        }
                    },
                    '401': {
                        description: 'Invalid credentials',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse'
                                }
                            }
                        }
                    },
                    '400': {
                        description: 'Validation error',
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
        '/auth/refresh': {
            post: {
                tags: ['Authentication'],
                summary: 'Refresh access token',
                description: 'Get new access token using refresh token',
                operationId: 'refreshToken',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/RefreshTokenRequest'
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Token refreshed successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/RefreshTokenResponse'
                                }
                            }
                        }
                    },
                    '401': {
                        description: 'Invalid refresh token',
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
        '/auth/logout': {
            post: {
                tags: ['Authentication'],
                summary: 'User logout',
                description: 'Logout user and invalidate session',
                operationId: 'logout',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/LogoutRequest'
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Logout successful',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/BaseResponse'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/auth/me': {
            get: {
                tags: ['Authentication'],
                summary: 'Get current user',
                description: 'Get current authenticated user information',
                operationId: 'getCurrentUser',
                security: [{ BearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'User information',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/UserResponse'
                                }
                            }
                        }
                    },
                    '401': {
                        description: 'Unauthorized',
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
        '/users': {
            get: {
                tags: ['Users'],
                summary: 'List users',
                description: 'Get paginated list of users',
                operationId: 'listUsers',
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 }
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                    },
                    {
                        name: 'search',
                        in: 'query',
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    '200': {
                        description: 'List of users',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/UserListResponse'
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Users'],
                summary: 'Create user',
                description: 'Create a new user',
                operationId: 'createUser',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CreateUserRequest'
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'User created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/UserResponse'
                                }
                            }
                        }
                    },
                    '400': {
                        description: 'Validation error',
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
        '/users/{id}': {
            get: {
                tags: ['Users'],
                summary: 'Get user by ID',
                description: 'Get user information by ID',
                operationId: 'getUser',
                security: [{ BearerAuth: [] }],
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
                        description: 'User information',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/UserResponse'
                                }
                            }
                        }
                    },
                    '404': {
                        description: 'User not found',
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
            put: {
                tags: ['Users'],
                summary: 'Update user',
                description: 'Update user information',
                operationId: 'updateUser',
                security: [{ BearerAuth: [] }],
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
                            schema: {
                                $ref: '#/components/schemas/UpdateUserRequest'
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'User updated successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/UserResponse'
                                }
                            }
                        }
                    },
                    '404': {
                        description: 'User not found',
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
            delete: {
                tags: ['Users'],
                summary: 'Delete user',
                description: 'Delete user by ID',
                operationId: 'deleteUser',
                security: [{ BearerAuth: [] }],
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
                        description: 'User deleted successfully'
                    },
                    '404': {
                        description: 'User not found',
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
        '/contacts': {
            get: {
                tags: ['CRM'],
                summary: 'List contacts',
                description: 'Get paginated list of contacts',
                operationId: 'listContacts',
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 }
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                    },
                    {
                        name: 'search',
                        in: 'query',
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    '200': {
                        description: 'List of contacts',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ContactListResponse'
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['CRM'],
                summary: 'Create contact',
                description: 'Create a new contact',
                operationId: 'createContact',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CreateContactRequest'
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Contact created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ContactResponse'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/contacts/{id}': {
            get: {
                tags: ['CRM'],
                summary: 'Get contact by ID',
                description: 'Get contact information by ID',
                operationId: 'getContact',
                security: [{ BearerAuth: [] }],
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
                        description: 'Contact information',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ContactResponse'
                                }
                            }
                        }
                    }
                }
            },
            put: {
                tags: ['CRM'],
                summary: 'Update contact',
                description: 'Update contact information',
                operationId: 'updateContact',
                security: [{ BearerAuth: [] }],
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
                            schema: {
                                $ref: '#/components/schemas/UpdateContactRequest'
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Contact updated successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ContactResponse'
                                }
                            }
                        }
                    }
                }
            },
            delete: {
                tags: ['CRM'],
                summary: 'Delete contact',
                description: 'Delete contact by ID',
                operationId: 'deleteContact',
                security: [{ BearerAuth: [] }],
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
                        description: 'Contact deleted successfully'
                    }
                }
            }
        },
        '/deals': {
            get: {
                tags: ['CRM'],
                summary: 'List deals',
                description: 'Get paginated list of deals',
                operationId: 'listDeals',
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 }
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                    },
                    {
                        name: 'stage',
                        in: 'query',
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    '200': {
                        description: 'List of deals',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/DealListResponse'
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['CRM'],
                summary: 'Create deal',
                description: 'Create a new deal',
                operationId: 'createDeal',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CreateDealRequest'
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Deal created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/DealResponse'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/products': {
            get: {
                tags: ['ERP'],
                summary: 'List products',
                description: 'Get paginated list of products',
                operationId: 'listProducts',
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 }
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                    },
                    {
                        name: 'category',
                        in: 'query',
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    '200': {
                        description: 'List of products',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ProductListResponse'
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['ERP'],
                summary: 'Create product',
                description: 'Create a new product',
                operationId: 'createProduct',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CreateProductRequest'
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Product created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ProductResponse'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/orders': {
            get: {
                tags: ['ERP'],
                summary: 'List orders',
                description: 'Get paginated list of orders',
                operationId: 'listOrders',
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 }
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                    },
                    {
                        name: 'status',
                        in: 'query',
                        schema: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] }
                    }
                ],
                responses: {
                    '200': {
                        description: 'List of orders',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/OrderListResponse'
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['ERP'],
                summary: 'Create order',
                description: 'Create a new order',
                operationId: 'createOrder',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CreateOrderRequest'
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Order created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/OrderResponse'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/ai/chat': {
            post: {
                tags: ['AI'],
                summary: 'AI Chat',
                description: 'Send message to AI and get response',
                operationId: 'aiChat',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/AIRequest'
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'AI response',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/AIResponse'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/webhooks': {
            get: {
                tags: ['Webhooks'],
                summary: 'List webhooks',
                description: 'Get paginated list of webhooks',
                operationId: 'listWebhooks',
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, default: 1 }
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                    }
                ],
                responses: {
                    '200': {
                        description: 'List of webhooks',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/WebhookListResponse'
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Webhooks'],
                summary: 'Create webhook',
                description: 'Create a new webhook',
                operationId: 'createWebhook',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CreateWebhookRequest'
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Webhook created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/WebhookResponse'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/health': {
            get: {
                tags: ['System'],
                summary: 'Health check',
                description: 'Check system health',
                operationId: 'healthCheck',
                responses: {
                    '200': {
                        description: 'System is healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/HealthResponse'
                                }
                            }
                        }
                    }
                }
            }
        },
        '/metrics': {
            get: {
                tags: ['System'],
                summary: 'System metrics',
                description: 'Get system metrics',
                operationId: 'getMetrics',
                security: [{ BearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'System metrics',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/MetricsResponse'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
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
            }
        },
        schemas: {
            BaseResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' },
                    error: { type: 'string' },
                    message: { type: 'string' },
                    requestId: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    processingTime: { type: 'number' }
                },
                required: ['success', 'requestId', 'timestamp']
            },
            ErrorResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            error: { type: 'string' },
                            message: { type: 'string' }
                        }
                    }
                ]
            },
            Pagination: {
                type: 'object',
                properties: {
                    page: { type: 'integer', minimum: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100 },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    hasNext: { type: 'boolean' },
                    hasPrev: { type: 'boolean' }
                },
                required: ['page', 'limit']
            },
            LoginRequest: {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 1 },
                    organizationId: { type: 'string', format: 'uuid' },
                    rememberMe: { type: 'boolean', default: false },
                    mfaToken: { type: 'string' }
                },
                required: ['email', 'password']
            },
            LoginResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: {
                                type: 'object',
                                properties: {
                                    user: { $ref: '#/components/schemas/User' },
                                    accessToken: { type: 'string' },
                                    refreshToken: { type: 'string' },
                                    expiresIn: { type: 'integer' },
                                    tokenType: { type: 'string', enum: ['Bearer'] }
                                }
                            }
                        }
                    }
                ]
            },
            RefreshTokenRequest: {
                type: 'object',
                properties: {
                    refreshToken: { type: 'string', minLength: 1 }
                },
                required: ['refreshToken']
            },
            RefreshTokenResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: {
                                type: 'object',
                                properties: {
                                    accessToken: { type: 'string' },
                                    refreshToken: { type: 'string' },
                                    expiresIn: { type: 'integer' },
                                    tokenType: { type: 'string', enum: ['Bearer'] }
                                }
                            }
                        }
                    }
                ]
            },
            LogoutRequest: {
                type: 'object',
                properties: {
                    sessionId: { type: 'string' }
                }
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    name: { type: 'string' },
                    organizationId: { type: 'string', format: 'uuid' },
                    roles: { type: 'array', items: { type: 'string' } },
                    permissions: { type: 'array', items: { type: 'string' } },
                    isActive: { type: 'boolean' },
                    lastLoginAt: { type: 'string', format: 'date-time' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                },
                required: ['id', 'email', 'name', 'organizationId', 'roles', 'permissions', 'isActive', 'createdAt', 'updatedAt']
            },
            UserResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: { $ref: '#/components/schemas/User' }
                        }
                    }
                ]
            },
            UserListResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                            pagination: { $ref: '#/components/schemas/Pagination' }
                        }
                    }
                ]
            },
            CreateUserRequest: {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' },
                    name: { type: 'string', minLength: 1 },
                    password: { type: 'string', minLength: 8 },
                    organizationId: { type: 'string', format: 'uuid' },
                    roles: { type: 'array', items: { type: 'string' }, default: [] }
                },
                required: ['email', 'name', 'password', 'organizationId']
            },
            UpdateUserRequest: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1 },
                    email: { type: 'string', format: 'email' },
                    roles: { type: 'array', items: { type: 'string' } },
                    isActive: { type: 'boolean' }
                }
            },
            Contact: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    company: { type: 'string' },
                    title: { type: 'string' },
                    organizationId: { type: 'string', format: 'uuid' },
                    tags: { type: 'array', items: { type: 'string' }, default: [] },
                    customFields: { type: 'object', default: {} },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                },
                required: ['id', 'firstName', 'lastName', 'organizationId', 'createdAt', 'updatedAt']
            },
            ContactResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: { $ref: '#/components/schemas/Contact' }
                        }
                    }
                ]
            },
            ContactListResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: { type: 'array', items: { $ref: '#/components/schemas/Contact' } },
                            pagination: { $ref: '#/components/schemas/Pagination' }
                        }
                    }
                ]
            },
            CreateContactRequest: {
                type: 'object',
                properties: {
                    firstName: { type: 'string', minLength: 1 },
                    lastName: { type: 'string', minLength: 1 },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    company: { type: 'string' },
                    title: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' }, default: [] },
                    customFields: { type: 'object', default: {} }
                },
                required: ['firstName', 'lastName']
            },
            UpdateContactRequest: {
                type: 'object',
                properties: {
                    firstName: { type: 'string', minLength: 1 },
                    lastName: { type: 'string', minLength: 1 },
                    email: { type: 'string', format: 'email' },
                    phone: { type: 'string' },
                    company: { type: 'string' },
                    title: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    customFields: { type: 'object' }
                }
            },
            Deal: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    value: { type: 'number', minimum: 0 },
                    currency: { type: 'string', default: 'USD' },
                    stage: { type: 'string' },
                    probability: { type: 'number', minimum: 0, maximum: 100, default: 0 },
                    contactId: { type: 'string', format: 'uuid' },
                    organizationId: { type: 'string', format: 'uuid' },
                    expectedCloseDate: { type: 'string', format: 'date' },
                    customFields: { type: 'object', default: {} },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                },
                required: ['id', 'title', 'value', 'stage', 'organizationId', 'createdAt', 'updatedAt']
            },
            DealResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: { $ref: '#/components/schemas/Deal' }
                        }
                    }
                ]
            },
            DealListResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: { type: 'array', items: { $ref: '#/components/schemas/Deal' } },
                            pagination: { $ref: '#/components/schemas/Pagination' }
                        }
                    }
                ]
            },
            CreateDealRequest: {
                type: 'object',
                properties: {
                    title: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    value: { type: 'number', minimum: 0 },
                    currency: { type: 'string', default: 'USD' },
                    stage: { type: 'string', minLength: 1 },
                    probability: { type: 'number', minimum: 0, maximum: 100, default: 0 },
                    contactId: { type: 'string', format: 'uuid' },
                    expectedCloseDate: { type: 'string', format: 'date' },
                    customFields: { type: 'object', default: {} }
                },
                required: ['title', 'value', 'stage']
            },
            Product: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    sku: { type: 'string' },
                    price: { type: 'number', minimum: 0 },
                    currency: { type: 'string', default: 'USD' },
                    category: { type: 'string' },
                    organizationId: { type: 'string', format: 'uuid' },
                    isActive: { type: 'boolean', default: true },
                    customFields: { type: 'object', default: {} },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                },
                required: ['id', 'name', 'sku', 'price', 'organizationId', 'isActive', 'createdAt', 'updatedAt']
            },
            ProductResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: { $ref: '#/components/schemas/Product' }
                        }
                    }
                ]
            },
            ProductListResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                            pagination: { $ref: '#/components/schemas/Pagination' }
                        }
                    }
                ]
            },
            CreateProductRequest: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    sku: { type: 'string', minLength: 1 },
                    price: { type: 'number', minimum: 0 },
                    currency: { type: 'string', default: 'USD' },
                    category: { type: 'string' },
                    customFields: { type: 'object', default: {} }
                },
                required: ['name', 'sku', 'price']
            },
            Order: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    orderNumber: { type: 'string' },
                    customerId: { type: 'string', format: 'uuid' },
                    organizationId: { type: 'string', format: 'uuid' },
                    status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
                    total: { type: 'number', minimum: 0 },
                    currency: { type: 'string', default: 'USD' },
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                productId: { type: 'string', format: 'uuid' },
                                quantity: { type: 'number', minimum: 1 },
                                price: { type: 'number', minimum: 0 },
                                total: { type: 'number', minimum: 0 }
                            }
                        }
                    },
                    shippingAddress: {
                        type: 'object',
                        properties: {
                            street: { type: 'string' },
                            city: { type: 'string' },
                            state: { type: 'string' },
                            zipCode: { type: 'string' },
                            country: { type: 'string' }
                        }
                    },
                    customFields: { type: 'object', default: {} },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                },
                required: ['id', 'orderNumber', 'customerId', 'organizationId', 'status', 'total', 'items', 'createdAt', 'updatedAt']
            },
            OrderResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: { $ref: '#/components/schemas/Order' }
                        }
                    }
                ]
            },
            OrderListResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                            pagination: { $ref: '#/components/schemas/Pagination' }
                        }
                    }
                ]
            },
            CreateOrderRequest: {
                type: 'object',
                properties: {
                    customerId: { type: 'string', format: 'uuid' },
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                productId: { type: 'string', format: 'uuid' },
                                quantity: { type: 'number', minimum: 1 },
                                price: { type: 'number', minimum: 0 }
                            },
                            required: ['productId', 'quantity', 'price']
                        },
                        minItems: 1
                    },
                    shippingAddress: {
                        type: 'object',
                        properties: {
                            street: { type: 'string', minLength: 1 },
                            city: { type: 'string', minLength: 1 },
                            state: { type: 'string', minLength: 1 },
                            zipCode: { type: 'string', minLength: 1 },
                            country: { type: 'string', minLength: 1 }
                        }
                    },
                    customFields: { type: 'object', default: {} }
                },
                required: ['customerId', 'items']
            },
            AIRequest: {
                type: 'object',
                properties: {
                    prompt: { type: 'string', minLength: 1 },
                    model: { type: 'string' },
                    temperature: { type: 'number', minimum: 0, maximum: 2, default: 0.7 },
                    maxTokens: { type: 'number', minimum: 1, maximum: 4000, default: 1000 },
                    organizationId: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    context: { type: 'object' }
                },
                required: ['prompt', 'organizationId', 'userId']
            },
            AIResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    prompt: { type: 'string' },
                                    response: { type: 'string' },
                                    model: { type: 'string' },
                                    usage: {
                                        type: 'object',
                                        properties: {
                                            promptTokens: { type: 'number' },
                                            completionTokens: { type: 'number' },
                                            totalTokens: { type: 'number' }
                                        }
                                    },
                                    cost: { type: 'number', minimum: 0 },
                                    processingTime: { type: 'number' },
                                    createdAt: { type: 'string', format: 'date-time' }
                                }
                            }
                        }
                    }
                ]
            },
            Webhook: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    url: { type: 'string', format: 'uri' },
                    events: { type: 'array', items: { type: 'string' } },
                    organizationId: { type: 'string', format: 'uuid' },
                    isActive: { type: 'boolean', default: true },
                    secret: { type: 'string' },
                    headers: { type: 'object', default: {} },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                },
                required: ['id', 'name', 'url', 'events', 'organizationId', 'isActive', 'createdAt', 'updatedAt']
            },
            WebhookResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: { $ref: '#/components/schemas/Webhook' }
                        }
                    }
                ]
            },
            WebhookListResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: { type: 'array', items: { $ref: '#/components/schemas/Webhook' } },
                            pagination: { $ref: '#/components/schemas/Pagination' }
                        }
                    }
                ]
            },
            CreateWebhookRequest: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1 },
                    url: { type: 'string', format: 'uri' },
                    events: { type: 'array', items: { type: 'string' }, minItems: 1 },
                    headers: { type: 'object', default: {} }
                },
                required: ['name', 'url', 'events']
            },
            HealthResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                                    version: { type: 'string' },
                                    uptime: { type: 'number' },
                                    services: {
                                        type: 'object',
                                        properties: {
                                            database: { type: 'string', enum: ['up', 'down'] },
                                            redis: { type: 'string', enum: ['up', 'down'] },
                                            ai: { type: 'string', enum: ['up', 'down'] }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            MetricsResponse: {
                allOf: [
                    { $ref: '#/components/schemas/BaseResponse' },
                    {
                        type: 'object',
                        properties: {
                            data: {
                                type: 'object',
                                properties: {
                                    requests: { type: 'object' },
                                    performance: { type: 'object' },
                                    errors: { type: 'object' },
                                    ai: { type: 'object' }
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    tags: [
        {
            name: 'Authentication',
            description: 'User authentication and authorization'
        },
        {
            name: 'Users',
            description: 'User management'
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
            name: 'AI',
            description: 'Artificial Intelligence services'
        },
        {
            name: 'Webhooks',
            description: 'Webhook management'
        },
        {
            name: 'System',
            description: 'System health and metrics'
        }
    ]
};
export default openApiSpec;
//# sourceMappingURL=openapi.js.map