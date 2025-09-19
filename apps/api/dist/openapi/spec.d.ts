export declare const openApiSpec: {
    openapi: string;
    info: {
        title: string;
        description: string;
        version: string;
        contact: {
            name: string;
            email: string;
            url: string;
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
    tags: {
        name: string;
        description: string;
    }[];
    paths: {
        '/health': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        status: {
                                            type: string;
                                            example: string;
                                        };
                                        timestamp: {
                                            type: string;
                                            format: string;
                                        };
                                        uptime: {
                                            type: string;
                                            example: number;
                                        };
                                        version: {
                                            type: string;
                                            example: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        '/health/live': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        status: {
                                            type: string;
                                            example: string;
                                        };
                                        timestamp: {
                                            type: string;
                                            format: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        '/health/ready': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        status: {
                                            type: string;
                                            example: string;
                                        };
                                        timestamp: {
                                            type: string;
                                            format: string;
                                        };
                                    };
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
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'text/plain': {
                                schema: {
                                    type: string;
                                    example: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/v1/analytics/events': {
            post: {
                tags: string[];
                summary: string;
                description: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    eventType: {
                                        type: string;
                                        example: string;
                                    };
                                    action: {
                                        type: string;
                                        example: string;
                                    };
                                    entityType: {
                                        type: string;
                                        example: string;
                                    };
                                    entityId: {
                                        type: string;
                                        example: string;
                                    };
                                    userId: {
                                        type: string;
                                        example: string;
                                    };
                                    orgId: {
                                        type: string;
                                        example: string;
                                    };
                                    metadata: {
                                        type: string;
                                        example: {
                                            source: string;
                                        };
                                    };
                                };
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
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        eventId: {
                                            type: string;
                                            example: string;
                                        };
                                        message: {
                                            type: string;
                                            example: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
            get: {
                tags: string[];
                summary: string;
                description: string;
                parameters: ({
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        default?: undefined;
                    };
                    description: string;
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        default: number;
                    };
                    description: string;
                })[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            items: {
                                                type: string;
                                                properties: {
                                                    id: {
                                                        type: string;
                                                    };
                                                    eventType: {
                                                        type: string;
                                                    };
                                                    action: {
                                                        type: string;
                                                    };
                                                    timestamp: {
                                                        type: string;
                                                        format: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        '/v1/advanced-analytics/dashboard': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                parameters: {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        enum: string[];
                        default: string;
                    };
                    description: string;
                }[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                totalEvents: {
                                                    type: string;
                                                    example: number;
                                                };
                                                uniqueUsers: {
                                                    type: string;
                                                    example: number;
                                                };
                                                topActions: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        properties: {
                                                            action: {
                                                                type: string;
                                                                example: string;
                                                            };
                                                            count: {
                                                                type: string;
                                                                example: number;
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        '/v1/advanced-analytics/business-intelligence': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                revenue: {
                                                    type: string;
                                                    properties: {
                                                        total: {
                                                            type: string;
                                                            example: number;
                                                        };
                                                        monthly: {
                                                            type: string;
                                                            example: number;
                                                        };
                                                        growth: {
                                                            type: string;
                                                            example: number;
                                                        };
                                                    };
                                                };
                                                customers: {
                                                    type: string;
                                                    properties: {
                                                        total: {
                                                            type: string;
                                                            example: number;
                                                        };
                                                        new: {
                                                            type: string;
                                                            example: number;
                                                        };
                                                        churn: {
                                                            type: string;
                                                            example: number;
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        '/v1/advanced-security/threats/detect': {
            post: {
                tags: string[];
                summary: string;
                description: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    ipAddress: {
                                        type: string;
                                        format: string;
                                        example: string;
                                    };
                                    userAgent: {
                                        type: string;
                                        example: string;
                                    };
                                    endpoint: {
                                        type: string;
                                        example: string;
                                    };
                                    method: {
                                        type: string;
                                        example: string;
                                    };
                                    userId: {
                                        type: string;
                                        example: string;
                                    };
                                    orgId: {
                                        type: string;
                                        example: string;
                                    };
                                    body: {
                                        type: string;
                                        description: string;
                                    };
                                };
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
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        threat: {
                                            type: string;
                                            nullable: boolean;
                                            properties: {
                                                id: {
                                                    type: string;
                                                    example: string;
                                                };
                                                threatType: {
                                                    type: string;
                                                    example: string;
                                                };
                                                confidence: {
                                                    type: string;
                                                    minimum: number;
                                                    maximum: number;
                                                    example: number;
                                                };
                                                blocked: {
                                                    type: string;
                                                    example: boolean;
                                                };
                                            };
                                        };
                                        message: {
                                            type: string;
                                            example: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        '/v1/advanced-security/metrics': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                totalThreats: {
                                                    type: string;
                                                    example: number;
                                                };
                                                threatsBlocked: {
                                                    type: string;
                                                    example: number;
                                                };
                                                activeAlerts: {
                                                    type: string;
                                                    example: number;
                                                };
                                                securityEvents: {
                                                    type: string;
                                                    example: number;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        '/v1/finops/budgets': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            items: {
                                                type: string;
                                                properties: {
                                                    id: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    name: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    amount: {
                                                        type: string;
                                                        example: number;
                                                    };
                                                    currency: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                    period: {
                                                        type: string;
                                                        example: string;
                                                    };
                                                };
                                            };
                                        };
                                    };
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
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    organizationId: {
                                        type: string;
                                        example: string;
                                    };
                                    name: {
                                        type: string;
                                        example: string;
                                    };
                                    amount: {
                                        type: string;
                                        example: number;
                                    };
                                    currency: {
                                        type: string;
                                        default: string;
                                    };
                                    period: {
                                        type: string;
                                        enum: string[];
                                    };
                                };
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
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        budgetId: {
                                            type: string;
                                            example: string;
                                        };
                                        message: {
                                            type: string;
                                            example: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        '/v1/finops/costs': {
            get: {
                tags: string[];
                summary: string;
                description: string;
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        success: {
                                            type: string;
                                            example: boolean;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                totalCost: {
                                                    type: string;
                                                    example: number;
                                                };
                                                monthlyCost: {
                                                    type: string;
                                                    example: number;
                                                };
                                                costByCategory: {
                                                    type: string;
                                                    items: {
                                                        type: string;
                                                        properties: {
                                                            category: {
                                                                type: string;
                                                                example: string;
                                                            };
                                                            amount: {
                                                                type: string;
                                                                example: number;
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
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
            Error: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    error: {
                        type: string;
                        example: string;
                    };
                    details: {
                        type: string;
                        example: string;
                    };
                    timestamp: {
                        type: string;
                        format: string;
                    };
                };
            };
            Success: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    message: {
                        type: string;
                        example: string;
                    };
                    timestamp: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
    };
    security: {
        BearerAuth: any[];
    }[];
};
//# sourceMappingURL=spec.d.ts.map