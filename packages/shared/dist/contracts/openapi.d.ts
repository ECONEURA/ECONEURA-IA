export declare const openApiSpec: {
    openapi: string;
    info: {
        title: string;
        description: string;
        version: string;
        contact: {
            name: string;
            email: string;
        };
        license: {
            name: string;
            url: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    security: ({
        BearerAuth: any[];
        ApiKeyAuth?: undefined;
    } | {
        ApiKeyAuth: any[];
        BearerAuth?: undefined;
    })[];
    paths: {
        '/auth/login': {
            post: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    '401': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    '400': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/auth/refresh': {
            post: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    '401': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/auth/logout': {
            post: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/auth/me': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    '401': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/users': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        default: number;
                        maximum?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum?: undefined;
                        default?: undefined;
                        maximum?: undefined;
                    };
                })[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
            post: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '201': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    '400': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/users/{id}': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    '404': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
            put: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    '404': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
            delete: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                responses: {
                    '204': {
                        description: string;
                    };
                    '404': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/contacts': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        default: number;
                        maximum?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum?: undefined;
                        default?: undefined;
                        maximum?: undefined;
                    };
                })[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
            post: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '201': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/contacts/{id}': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
            put: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
            delete: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                responses: {
                    '204': {
                        description: string;
                    };
                };
            };
        };
        '/deals': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        default: number;
                        maximum?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum?: undefined;
                        default?: undefined;
                        maximum?: undefined;
                    };
                })[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
            post: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '201': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/products': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        default: number;
                        maximum?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum?: undefined;
                        default?: undefined;
                        maximum?: undefined;
                    };
                })[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
            post: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '201': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/orders': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        default: number;
                        maximum?: undefined;
                        enum?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                        enum?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        enum: string[];
                        minimum?: undefined;
                        default?: undefined;
                        maximum?: undefined;
                    };
                })[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
            post: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '201': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/ai/chat': {
            post: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/webhooks': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                parameters: ({
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        default: number;
                        maximum?: undefined;
                    };
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                    };
                })[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
            post: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '201': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/health': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/metrics': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                operationId: string;
                security: {
                    BearerAuth: any[];
                }[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
    };
    components: {
        securitySchemes: {
            BearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
            };
            ApiKeyAuth: {
                type: string;
                in: string;
                name: string;
            };
        };
        schemas: {
            BaseResponse: {
                type: string;
                properties: {
                    success: {
                        type: string;
                    };
                    data: {
                        type: string;
                    };
                    error: {
                        type: string;
                    };
                    message: {
                        type: string;
                    };
                    requestId: {
                        type: string;
                    };
                    timestamp: {
                        type: string;
                        format: string;
                    };
                    processingTime: {
                        type: string;
                    };
                };
                required: string[];
            };
            ErrorResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        success: {
                            type: string;
                            example: boolean;
                        };
                        error: {
                            type: string;
                        };
                        message: {
                            type: string;
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            Pagination: {
                type: string;
                properties: {
                    page: {
                        type: string;
                        minimum: number;
                    };
                    limit: {
                        type: string;
                        minimum: number;
                        maximum: number;
                    };
                    total: {
                        type: string;
                    };
                    totalPages: {
                        type: string;
                    };
                    hasNext: {
                        type: string;
                    };
                    hasPrev: {
                        type: string;
                    };
                };
                required: string[];
            };
            LoginRequest: {
                type: string;
                properties: {
                    email: {
                        type: string;
                        format: string;
                    };
                    password: {
                        type: string;
                        minLength: number;
                    };
                    organizationId: {
                        type: string;
                        format: string;
                    };
                    rememberMe: {
                        type: string;
                        default: boolean;
                    };
                    mfaToken: {
                        type: string;
                    };
                };
                required: string[];
            };
            LoginResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            type: string;
                            properties: {
                                user: {
                                    $ref: string;
                                };
                                accessToken: {
                                    type: string;
                                };
                                refreshToken: {
                                    type: string;
                                };
                                expiresIn: {
                                    type: string;
                                };
                                tokenType: {
                                    type: string;
                                    enum: string[];
                                };
                            };
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            RefreshTokenRequest: {
                type: string;
                properties: {
                    refreshToken: {
                        type: string;
                        minLength: number;
                    };
                };
                required: string[];
            };
            RefreshTokenResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            type: string;
                            properties: {
                                accessToken: {
                                    type: string;
                                };
                                refreshToken: {
                                    type: string;
                                };
                                expiresIn: {
                                    type: string;
                                };
                                tokenType: {
                                    type: string;
                                    enum: string[];
                                };
                            };
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            LogoutRequest: {
                type: string;
                properties: {
                    sessionId: {
                        type: string;
                    };
                };
            };
            User: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                    };
                    email: {
                        type: string;
                        format: string;
                    };
                    name: {
                        type: string;
                    };
                    organizationId: {
                        type: string;
                        format: string;
                    };
                    roles: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    permissions: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    isActive: {
                        type: string;
                    };
                    lastLoginAt: {
                        type: string;
                        format: string;
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                    updatedAt: {
                        type: string;
                        format: string;
                    };
                };
                required: string[];
            };
            UserResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            $ref: string;
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            UserListResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            type: string;
                            items: {
                                $ref: string;
                            };
                        };
                        pagination: {
                            $ref: string;
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            CreateUserRequest: {
                type: string;
                properties: {
                    email: {
                        type: string;
                        format: string;
                    };
                    name: {
                        type: string;
                        minLength: number;
                    };
                    password: {
                        type: string;
                        minLength: number;
                    };
                    organizationId: {
                        type: string;
                        format: string;
                    };
                    roles: {
                        type: string;
                        items: {
                            type: string;
                        };
                        default: any[];
                    };
                };
                required: string[];
            };
            UpdateUserRequest: {
                type: string;
                properties: {
                    name: {
                        type: string;
                        minLength: number;
                    };
                    email: {
                        type: string;
                        format: string;
                    };
                    roles: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    isActive: {
                        type: string;
                    };
                };
            };
            Contact: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                    };
                    firstName: {
                        type: string;
                    };
                    lastName: {
                        type: string;
                    };
                    email: {
                        type: string;
                        format: string;
                    };
                    phone: {
                        type: string;
                    };
                    company: {
                        type: string;
                    };
                    title: {
                        type: string;
                    };
                    organizationId: {
                        type: string;
                        format: string;
                    };
                    tags: {
                        type: string;
                        items: {
                            type: string;
                        };
                        default: any[];
                    };
                    customFields: {
                        type: string;
                        default: {};
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                    updatedAt: {
                        type: string;
                        format: string;
                    };
                };
                required: string[];
            };
            ContactResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            $ref: string;
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            ContactListResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            type: string;
                            items: {
                                $ref: string;
                            };
                        };
                        pagination: {
                            $ref: string;
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            CreateContactRequest: {
                type: string;
                properties: {
                    firstName: {
                        type: string;
                        minLength: number;
                    };
                    lastName: {
                        type: string;
                        minLength: number;
                    };
                    email: {
                        type: string;
                        format: string;
                    };
                    phone: {
                        type: string;
                    };
                    company: {
                        type: string;
                    };
                    title: {
                        type: string;
                    };
                    tags: {
                        type: string;
                        items: {
                            type: string;
                        };
                        default: any[];
                    };
                    customFields: {
                        type: string;
                        default: {};
                    };
                };
                required: string[];
            };
            UpdateContactRequest: {
                type: string;
                properties: {
                    firstName: {
                        type: string;
                        minLength: number;
                    };
                    lastName: {
                        type: string;
                        minLength: number;
                    };
                    email: {
                        type: string;
                        format: string;
                    };
                    phone: {
                        type: string;
                    };
                    company: {
                        type: string;
                    };
                    title: {
                        type: string;
                    };
                    tags: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    customFields: {
                        type: string;
                    };
                };
            };
            Deal: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                    };
                    title: {
                        type: string;
                    };
                    description: {
                        type: string;
                    };
                    value: {
                        type: string;
                        minimum: number;
                    };
                    currency: {
                        type: string;
                        default: string;
                    };
                    stage: {
                        type: string;
                    };
                    probability: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                    };
                    contactId: {
                        type: string;
                        format: string;
                    };
                    organizationId: {
                        type: string;
                        format: string;
                    };
                    expectedCloseDate: {
                        type: string;
                        format: string;
                    };
                    customFields: {
                        type: string;
                        default: {};
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                    updatedAt: {
                        type: string;
                        format: string;
                    };
                };
                required: string[];
            };
            DealResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            $ref: string;
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            DealListResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            type: string;
                            items: {
                                $ref: string;
                            };
                        };
                        pagination: {
                            $ref: string;
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            CreateDealRequest: {
                type: string;
                properties: {
                    title: {
                        type: string;
                        minLength: number;
                    };
                    description: {
                        type: string;
                    };
                    value: {
                        type: string;
                        minimum: number;
                    };
                    currency: {
                        type: string;
                        default: string;
                    };
                    stage: {
                        type: string;
                        minLength: number;
                    };
                    probability: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                    };
                    contactId: {
                        type: string;
                        format: string;
                    };
                    expectedCloseDate: {
                        type: string;
                        format: string;
                    };
                    customFields: {
                        type: string;
                        default: {};
                    };
                };
                required: string[];
            };
            Product: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                    };
                    name: {
                        type: string;
                    };
                    description: {
                        type: string;
                    };
                    sku: {
                        type: string;
                    };
                    price: {
                        type: string;
                        minimum: number;
                    };
                    currency: {
                        type: string;
                        default: string;
                    };
                    category: {
                        type: string;
                    };
                    organizationId: {
                        type: string;
                        format: string;
                    };
                    isActive: {
                        type: string;
                        default: boolean;
                    };
                    customFields: {
                        type: string;
                        default: {};
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                    updatedAt: {
                        type: string;
                        format: string;
                    };
                };
                required: string[];
            };
            ProductResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            $ref: string;
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            ProductListResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            type: string;
                            items: {
                                $ref: string;
                            };
                        };
                        pagination: {
                            $ref: string;
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            CreateProductRequest: {
                type: string;
                properties: {
                    name: {
                        type: string;
                        minLength: number;
                    };
                    description: {
                        type: string;
                    };
                    sku: {
                        type: string;
                        minLength: number;
                    };
                    price: {
                        type: string;
                        minimum: number;
                    };
                    currency: {
                        type: string;
                        default: string;
                    };
                    category: {
                        type: string;
                    };
                    customFields: {
                        type: string;
                        default: {};
                    };
                };
                required: string[];
            };
            Order: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                    };
                    orderNumber: {
                        type: string;
                    };
                    customerId: {
                        type: string;
                        format: string;
                    };
                    organizationId: {
                        type: string;
                        format: string;
                    };
                    status: {
                        type: string;
                        enum: string[];
                    };
                    total: {
                        type: string;
                        minimum: number;
                    };
                    currency: {
                        type: string;
                        default: string;
                    };
                    items: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                productId: {
                                    type: string;
                                    format: string;
                                };
                                quantity: {
                                    type: string;
                                    minimum: number;
                                };
                                price: {
                                    type: string;
                                    minimum: number;
                                };
                                total: {
                                    type: string;
                                    minimum: number;
                                };
                            };
                        };
                    };
                    shippingAddress: {
                        type: string;
                        properties: {
                            street: {
                                type: string;
                            };
                            city: {
                                type: string;
                            };
                            state: {
                                type: string;
                            };
                            zipCode: {
                                type: string;
                            };
                            country: {
                                type: string;
                            };
                        };
                    };
                    customFields: {
                        type: string;
                        default: {};
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                    updatedAt: {
                        type: string;
                        format: string;
                    };
                };
                required: string[];
            };
            OrderResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            $ref: string;
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            OrderListResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            type: string;
                            items: {
                                $ref: string;
                            };
                        };
                        pagination: {
                            $ref: string;
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            CreateOrderRequest: {
                type: string;
                properties: {
                    customerId: {
                        type: string;
                        format: string;
                    };
                    items: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                productId: {
                                    type: string;
                                    format: string;
                                };
                                quantity: {
                                    type: string;
                                    minimum: number;
                                };
                                price: {
                                    type: string;
                                    minimum: number;
                                };
                            };
                            required: string[];
                        };
                        minItems: number;
                    };
                    shippingAddress: {
                        type: string;
                        properties: {
                            street: {
                                type: string;
                                minLength: number;
                            };
                            city: {
                                type: string;
                                minLength: number;
                            };
                            state: {
                                type: string;
                                minLength: number;
                            };
                            zipCode: {
                                type: string;
                                minLength: number;
                            };
                            country: {
                                type: string;
                                minLength: number;
                            };
                        };
                    };
                    customFields: {
                        type: string;
                        default: {};
                    };
                };
                required: string[];
            };
            AIRequest: {
                type: string;
                properties: {
                    prompt: {
                        type: string;
                        minLength: number;
                    };
                    model: {
                        type: string;
                    };
                    temperature: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                    };
                    maxTokens: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                    };
                    organizationId: {
                        type: string;
                        format: string;
                    };
                    userId: {
                        type: string;
                        format: string;
                    };
                    context: {
                        type: string;
                    };
                };
                required: string[];
            };
            AIResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            type: string;
                            properties: {
                                id: {
                                    type: string;
                                    format: string;
                                };
                                prompt: {
                                    type: string;
                                };
                                response: {
                                    type: string;
                                };
                                model: {
                                    type: string;
                                };
                                usage: {
                                    type: string;
                                    properties: {
                                        promptTokens: {
                                            type: string;
                                        };
                                        completionTokens: {
                                            type: string;
                                        };
                                        totalTokens: {
                                            type: string;
                                        };
                                    };
                                };
                                cost: {
                                    type: string;
                                    minimum: number;
                                };
                                processingTime: {
                                    type: string;
                                };
                                createdAt: {
                                    type: string;
                                    format: string;
                                };
                            };
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            Webhook: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                    };
                    name: {
                        type: string;
                    };
                    url: {
                        type: string;
                        format: string;
                    };
                    events: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    organizationId: {
                        type: string;
                        format: string;
                    };
                    isActive: {
                        type: string;
                        default: boolean;
                    };
                    secret: {
                        type: string;
                    };
                    headers: {
                        type: string;
                        default: {};
                    };
                    createdAt: {
                        type: string;
                        format: string;
                    };
                    updatedAt: {
                        type: string;
                        format: string;
                    };
                };
                required: string[];
            };
            WebhookResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            $ref: string;
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            WebhookListResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            type: string;
                            items: {
                                $ref: string;
                            };
                        };
                        pagination: {
                            $ref: string;
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            CreateWebhookRequest: {
                type: string;
                properties: {
                    name: {
                        type: string;
                        minLength: number;
                    };
                    url: {
                        type: string;
                        format: string;
                    };
                    events: {
                        type: string;
                        items: {
                            type: string;
                        };
                        minItems: number;
                    };
                    headers: {
                        type: string;
                        default: {};
                    };
                };
                required: string[];
            };
            HealthResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            type: string;
                            properties: {
                                status: {
                                    type: string;
                                    enum: string[];
                                };
                                version: {
                                    type: string;
                                };
                                uptime: {
                                    type: string;
                                };
                                services: {
                                    type: string;
                                    properties: {
                                        database: {
                                            type: string;
                                            enum: string[];
                                        };
                                        redis: {
                                            type: string;
                                            enum: string[];
                                        };
                                        ai: {
                                            type: string;
                                            enum: string[];
                                        };
                                    };
                                };
                            };
                        };
                    };
                    $ref?: undefined;
                })[];
            };
            MetricsResponse: {
                allOf: ({
                    $ref: string;
                    type?: undefined;
                    properties?: undefined;
                } | {
                    type: string;
                    properties: {
                        data: {
                            type: string;
                            properties: {
                                requests: {
                                    type: string;
                                };
                                performance: {
                                    type: string;
                                };
                                errors: {
                                    type: string;
                                };
                                ai: {
                                    type: string;
                                };
                            };
                        };
                    };
                    $ref?: undefined;
                })[];
            };
        };
    };
    tags: {
        name: string;
        description: string;
    }[];
};
export default openApiSpec;
//# sourceMappingURL=openapi.d.ts.map