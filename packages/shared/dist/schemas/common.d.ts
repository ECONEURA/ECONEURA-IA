import { z } from 'zod';
export declare const PaginationRequestSchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sort?: string;
    limit?: number;
    cursor?: string;
}, {
    sort?: string;
    limit?: number;
    cursor?: string;
}>;
export declare const PaginationResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodUnknown, "many">;
    pagination: z.ZodObject<{
        cursor: z.ZodNullable<z.ZodString>;
        hasMore: z.ZodBoolean;
        total: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        limit?: number;
        cursor?: string;
        hasMore?: boolean;
        total?: number;
    }, {
        limit?: number;
        cursor?: string;
        hasMore?: boolean;
        total?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data?: unknown[];
    pagination?: {
        limit?: number;
        cursor?: string;
        hasMore?: boolean;
        total?: number;
    };
}, {
    data?: unknown[];
    pagination?: {
        limit?: number;
        cursor?: string;
        hasMore?: boolean;
        total?: number;
    };
}>;
export declare const ProblemDetailsSchema: z.ZodObject<{
    type: z.ZodDefault<z.ZodString>;
    title: z.ZodString;
    status: z.ZodNumber;
    detail: z.ZodOptional<z.ZodString>;
    instance: z.ZodOptional<z.ZodString>;
    traceId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
    errors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    type?: string;
    status?: number;
    timestamp?: string;
    title?: string;
    detail?: string;
    instance?: string;
    traceId?: string;
    errors?: Record<string, string[]>;
}, {
    type?: string;
    status?: number;
    timestamp?: string;
    title?: string;
    detail?: string;
    instance?: string;
    traceId?: string;
    errors?: Record<string, string[]>;
}>;
export declare const ValidationErrorSchema: z.ZodObject<{
    detail: z.ZodOptional<z.ZodString>;
    instance: z.ZodOptional<z.ZodString>;
    traceId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"https://econeura.dev/errors/validation">;
    title: z.ZodLiteral<"Validation Failed">;
    status: z.ZodLiteral<422>;
    errors: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: "https://econeura.dev/errors/validation";
    status?: 422;
    timestamp?: string;
    title?: "Validation Failed";
    detail?: string;
    instance?: string;
    traceId?: string;
    errors?: Record<string, string[]>;
}, {
    type?: "https://econeura.dev/errors/validation";
    status?: 422;
    timestamp?: string;
    title?: "Validation Failed";
    detail?: string;
    instance?: string;
    traceId?: string;
    errors?: Record<string, string[]>;
}>;
export declare const SuccessResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodUnknown;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    data?: unknown;
    success?: true;
    meta?: Record<string, unknown>;
}, {
    data?: unknown;
    success?: true;
    meta?: Record<string, unknown>;
}>;
export declare const ErrorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        type: z.ZodDefault<z.ZodString>;
        title: z.ZodString;
        status: z.ZodNumber;
        detail: z.ZodOptional<z.ZodString>;
        instance: z.ZodOptional<z.ZodString>;
        traceId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodString>;
        errors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        status?: number;
        timestamp?: string;
        title?: string;
        detail?: string;
        instance?: string;
        traceId?: string;
        errors?: Record<string, string[]>;
    }, {
        type?: string;
        status?: number;
        timestamp?: string;
        title?: string;
        detail?: string;
        instance?: string;
        traceId?: string;
        errors?: Record<string, string[]>;
    }>;
}, "strip", z.ZodTypeAny, {
    error?: {
        type?: string;
        status?: number;
        timestamp?: string;
        title?: string;
        detail?: string;
        instance?: string;
        traceId?: string;
        errors?: Record<string, string[]>;
    };
    success?: false;
}, {
    error?: {
        type?: string;
        status?: number;
        timestamp?: string;
        title?: string;
        detail?: string;
        instance?: string;
        traceId?: string;
        errors?: Record<string, string[]>;
    };
    success?: false;
}>;
export declare const IdempotencyRequestSchema: z.ZodObject<{
    idempotencyKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    idempotencyKey?: string;
}, {
    idempotencyKey?: string;
}>;
export declare const BatchOperationSchema: z.ZodObject<{
    operation: z.ZodEnum<["create", "update", "delete"]>;
    data: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    data?: unknown;
    operation?: "create" | "update" | "delete";
}, {
    data?: unknown;
    operation?: "create" | "update" | "delete";
}>;
export declare const BatchRequestSchema: z.ZodObject<{
    operations: z.ZodArray<z.ZodObject<{
        operation: z.ZodEnum<["create", "update", "delete"]>;
        data: z.ZodUnknown;
    }, "strip", z.ZodTypeAny, {
        data?: unknown;
        operation?: "create" | "update" | "delete";
    }, {
        data?: unknown;
        operation?: "create" | "update" | "delete";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    operations?: {
        data?: unknown;
        operation?: "create" | "update" | "delete";
    }[];
}, {
    operations?: {
        data?: unknown;
        operation?: "create" | "update" | "delete";
    }[];
}>;
export declare const BatchResponseSchema: z.ZodObject<{
    results: z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        success: z.ZodBoolean;
        data: z.ZodOptional<z.ZodUnknown>;
        error: z.ZodOptional<z.ZodObject<{
            type: z.ZodDefault<z.ZodString>;
            title: z.ZodString;
            status: z.ZodNumber;
            detail: z.ZodOptional<z.ZodString>;
            instance: z.ZodOptional<z.ZodString>;
            traceId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodString>;
            errors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
        }, "strip", z.ZodTypeAny, {
            type?: string;
            status?: number;
            timestamp?: string;
            title?: string;
            detail?: string;
            instance?: string;
            traceId?: string;
            errors?: Record<string, string[]>;
        }, {
            type?: string;
            status?: number;
            timestamp?: string;
            title?: string;
            detail?: string;
            instance?: string;
            traceId?: string;
            errors?: Record<string, string[]>;
        }>>;
    }, "strip", z.ZodTypeAny, {
        error?: {
            type?: string;
            status?: number;
            timestamp?: string;
            title?: string;
            detail?: string;
            instance?: string;
            traceId?: string;
            errors?: Record<string, string[]>;
        };
        data?: unknown;
        success?: boolean;
        index?: number;
    }, {
        error?: {
            type?: string;
            status?: number;
            timestamp?: string;
            title?: string;
            detail?: string;
            instance?: string;
            traceId?: string;
            errors?: Record<string, string[]>;
        };
        data?: unknown;
        success?: boolean;
        index?: number;
    }>, "many">;
    summary: z.ZodObject<{
        total: z.ZodNumber;
        succeeded: z.ZodNumber;
        failed: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total?: number;
        succeeded?: number;
        failed?: number;
    }, {
        total?: number;
        succeeded?: number;
        failed?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    results?: {
        error?: {
            type?: string;
            status?: number;
            timestamp?: string;
            title?: string;
            detail?: string;
            instance?: string;
            traceId?: string;
            errors?: Record<string, string[]>;
        };
        data?: unknown;
        success?: boolean;
        index?: number;
    }[];
    summary?: {
        total?: number;
        succeeded?: number;
        failed?: number;
    };
}, {
    results?: {
        error?: {
            type?: string;
            status?: number;
            timestamp?: string;
            title?: string;
            detail?: string;
            instance?: string;
            traceId?: string;
            errors?: Record<string, string[]>;
        };
        data?: unknown;
        success?: boolean;
        index?: number;
    }[];
    summary?: {
        total?: number;
        succeeded?: number;
        failed?: number;
    };
}>;
export declare const FileUploadSchema: z.ZodObject<{
    id: z.ZodString;
    filename: z.ZodString;
    mimeType: z.ZodString;
    size: z.ZodNumber;
    url: z.ZodString;
    thumbnailUrl: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        width?: number;
        height?: number;
        duration?: number;
    }, {
        width?: number;
        height?: number;
        duration?: number;
    }>>;
    uploadedAt: z.ZodString;
    uploadedByUserId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
    filename?: string;
    mimeType?: string;
    size?: number;
    url?: string;
    thumbnailUrl?: string;
    metadata?: {
        width?: number;
        height?: number;
        duration?: number;
    };
    uploadedAt?: string;
    uploadedByUserId?: string;
}, {
    id?: string;
    filename?: string;
    mimeType?: string;
    size?: number;
    url?: string;
    thumbnailUrl?: string;
    metadata?: {
        width?: number;
        height?: number;
        duration?: number;
    };
    uploadedAt?: string;
    uploadedByUserId?: string;
}>;
export declare const NotificationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    orgId: z.ZodString;
    type: z.ZodEnum<["info", "success", "warning", "error"]>;
    category: z.ZodString;
    title: z.ZodString;
    message: z.ZodString;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    actionUrl: z.ZodOptional<z.ZodString>;
    actionLabel: z.ZodOptional<z.ZodString>;
    isRead: z.ZodDefault<z.ZodBoolean>;
    readAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    type?: "info" | "error" | "success" | "warning";
    orgId?: string;
    data?: Record<string, unknown>;
    title?: string;
    id?: string;
    userId?: string;
    category?: string;
    actionUrl?: string;
    actionLabel?: string;
    isRead?: boolean;
    readAt?: string;
    createdAt?: string;
    expiresAt?: string;
}, {
    message?: string;
    type?: "info" | "error" | "success" | "warning";
    orgId?: string;
    data?: Record<string, unknown>;
    title?: string;
    id?: string;
    userId?: string;
    category?: string;
    actionUrl?: string;
    actionLabel?: string;
    isRead?: boolean;
    readAt?: string;
    createdAt?: string;
    expiresAt?: string;
}>;
export declare const WebhookEventSchema: z.ZodObject<{
    id: z.ZodString;
    orgId: z.ZodString;
    event: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    timestamp: z.ZodString;
    signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    orgId?: string;
    timestamp?: string;
    data?: Record<string, unknown>;
    id?: string;
    event?: string;
    signature?: string;
}, {
    orgId?: string;
    timestamp?: string;
    data?: Record<string, unknown>;
    id?: string;
    event?: string;
    signature?: string;
}>;
export declare const WebhookSubscriptionSchema: z.ZodObject<{
    id: z.ZodString;
    orgId: z.ZodString;
    url: z.ZodString;
    events: z.ZodArray<z.ZodString, "many">;
    secret: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    orgId?: string;
    id?: string;
    url?: string;
    createdAt?: string;
    events?: string[];
    secret?: string;
    isActive?: boolean;
    headers?: Record<string, string>;
    updatedAt?: string;
}, {
    orgId?: string;
    id?: string;
    url?: string;
    createdAt?: string;
    events?: string[];
    secret?: string;
    isActive?: boolean;
    headers?: Record<string, string>;
    updatedAt?: string;
}>;
export declare const RateLimitResponseSchema: z.ZodObject<{
    limit: z.ZodNumber;
    remaining: z.ZodNumber;
    reset: z.ZodString;
    retryAfter: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit?: number;
    remaining?: number;
    reset?: string;
    retryAfter?: number;
}, {
    limit?: number;
    remaining?: number;
    reset?: string;
    retryAfter?: number;
}>;
export declare const HealthCheckResponseSchema: z.ZodObject<{
    status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
    version: z.ZodString;
    timestamp: z.ZodString;
    checks: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        status: z.ZodEnum<["healthy", "degraded", "unhealthy"]>;
        message: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        message?: string;
        status?: "degraded" | "healthy" | "unhealthy";
        duration?: number;
        metadata?: Record<string, unknown>;
        name?: string;
    }, {
        message?: string;
        status?: "degraded" | "healthy" | "unhealthy";
        duration?: number;
        metadata?: Record<string, unknown>;
        name?: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    status?: "degraded" | "healthy" | "unhealthy";
    timestamp?: string;
    version?: string;
    checks?: {
        message?: string;
        status?: "degraded" | "healthy" | "unhealthy";
        duration?: number;
        metadata?: Record<string, unknown>;
        name?: string;
    }[];
}, {
    status?: "degraded" | "healthy" | "unhealthy";
    timestamp?: string;
    version?: string;
    checks?: {
        message?: string;
        status?: "degraded" | "healthy" | "unhealthy";
        duration?: number;
        metadata?: Record<string, unknown>;
        name?: string;
    }[];
}>;
export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;
export type PaginationResponse = z.infer<typeof PaginationResponseSchema>;
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type IdempotencyRequest = z.infer<typeof IdempotencyRequestSchema>;
export type BatchOperation = z.infer<typeof BatchOperationSchema>;
export type BatchRequest = z.infer<typeof BatchRequestSchema>;
export type BatchResponse = z.infer<typeof BatchResponseSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export type WebhookSubscription = z.infer<typeof WebhookSubscriptionSchema>;
export type RateLimitResponse = z.infer<typeof RateLimitResponseSchema>;
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
//# sourceMappingURL=common.d.ts.map