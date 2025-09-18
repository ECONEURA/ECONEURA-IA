import { z } from 'zod';
export declare const ServiceHealthSchema: z.ZodObject<{
    status: z.ZodEnum<["healthy", "unhealthy", "degraded"]>;
    responseTime: z.ZodNumber;
    lastCheck: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    error?: string;
    status?: "degraded" | "healthy" | "unhealthy";
    lastCheck?: string;
    responseTime?: number;
}, {
    error?: string;
    status?: "degraded" | "healthy" | "unhealthy";
    lastCheck?: string;
    responseTime?: number;
}>;
export declare const HealthStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["healthy", "unhealthy", "degraded"]>;
    timestamp: z.ZodString;
    version: z.ZodString;
    uptime: z.ZodNumber;
    services: z.ZodRecord<z.ZodString, z.ZodObject<{
        status: z.ZodEnum<["healthy", "unhealthy", "degraded"]>;
        responseTime: z.ZodNumber;
        lastCheck: z.ZodString;
        error: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error?: string;
        status?: "degraded" | "healthy" | "unhealthy";
        lastCheck?: string;
        responseTime?: number;
    }, {
        error?: string;
        status?: "degraded" | "healthy" | "unhealthy";
        lastCheck?: string;
        responseTime?: number;
    }>>;
    metrics: z.ZodObject<{
        memory: z.ZodObject<{
            used: z.ZodNumber;
            total: z.ZodNumber;
            percentage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            total?: number;
            percentage?: number;
            used?: number;
        }, {
            total?: number;
            percentage?: number;
            used?: number;
        }>;
        cpu: z.ZodObject<{
            usage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            usage?: number;
        }, {
            usage?: number;
        }>;
        requests: z.ZodObject<{
            total: z.ZodNumber;
            errors: z.ZodNumber;
            errorRate: z.ZodNumber;
            responseTime: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            total?: number;
            errors?: number;
            responseTime?: number;
            errorRate?: number;
        }, {
            total?: number;
            errors?: number;
            responseTime?: number;
            errorRate?: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        memory?: {
            total?: number;
            percentage?: number;
            used?: number;
        };
        cpu?: {
            usage?: number;
        };
        requests?: {
            total?: number;
            errors?: number;
            responseTime?: number;
            errorRate?: number;
        };
    }, {
        memory?: {
            total?: number;
            percentage?: number;
            used?: number;
        };
        cpu?: {
            usage?: number;
        };
        requests?: {
            total?: number;
            errors?: number;
            responseTime?: number;
            errorRate?: number;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    status?: "degraded" | "healthy" | "unhealthy";
    timestamp?: string;
    version?: string;
    metrics?: {
        memory?: {
            total?: number;
            percentage?: number;
            used?: number;
        };
        cpu?: {
            usage?: number;
        };
        requests?: {
            total?: number;
            errors?: number;
            responseTime?: number;
            errorRate?: number;
        };
    };
    services?: Record<string, {
        error?: string;
        status?: "degraded" | "healthy" | "unhealthy";
        lastCheck?: string;
        responseTime?: number;
    }>;
    uptime?: number;
}, {
    status?: "degraded" | "healthy" | "unhealthy";
    timestamp?: string;
    version?: string;
    metrics?: {
        memory?: {
            total?: number;
            percentage?: number;
            used?: number;
        };
        cpu?: {
            usage?: number;
        };
        requests?: {
            total?: number;
            errors?: number;
            responseTime?: number;
            errorRate?: number;
        };
    };
    services?: Record<string, {
        error?: string;
        status?: "degraded" | "healthy" | "unhealthy";
        lastCheck?: string;
        responseTime?: number;
    }>;
    uptime?: number;
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
export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;
export type HealthStatus = z.infer<typeof HealthStatusSchema>;
export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
export declare class HealthChecker {
    private services;
    registerService(name: string, checkFn: () => Promise<ServiceHealth>): void;
    checkService(name: string): Promise<ServiceHealth>;
    checkAllServices(): Promise<Record<string, ServiceHealth>>;
    getOverallStatus(services: Record<string, ServiceHealth>): 'healthy' | 'unhealthy' | 'degraded';
}
export declare function checkDatabase(): Promise<ServiceHealth>;
export declare function checkRedis(): Promise<ServiceHealth>;
export declare function checkAzureOpenAI(): Promise<ServiceHealth>;
export declare function getSystemMetrics(): {
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    cpu: {
        usage: number;
    };
    requests: {
        total: number;
        errors: number;
        errorRate: number;
    };
};
export declare function buildHealthResponse(services: Record<string, ServiceHealth>, overallStatus: 'healthy' | 'unhealthy' | 'degraded', version?: string): HealthStatus;
declare const _default: {
    HealthChecker: typeof HealthChecker;
    checkDatabase: typeof checkDatabase;
    checkRedis: typeof checkRedis;
    checkAzureOpenAI: typeof checkAzureOpenAI;
    getSystemMetrics: typeof getSystemMetrics;
    buildHealthResponse: typeof buildHealthResponse;
    ServiceHealthSchema: z.ZodObject<{
        status: z.ZodEnum<["healthy", "unhealthy", "degraded"]>;
        responseTime: z.ZodNumber;
        lastCheck: z.ZodString;
        error: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        error?: string;
        status?: "degraded" | "healthy" | "unhealthy";
        lastCheck?: string;
        responseTime?: number;
    }, {
        error?: string;
        status?: "degraded" | "healthy" | "unhealthy";
        lastCheck?: string;
        responseTime?: number;
    }>;
    HealthStatusSchema: z.ZodObject<{
        status: z.ZodEnum<["healthy", "unhealthy", "degraded"]>;
        timestamp: z.ZodString;
        version: z.ZodString;
        uptime: z.ZodNumber;
        services: z.ZodRecord<z.ZodString, z.ZodObject<{
            status: z.ZodEnum<["healthy", "unhealthy", "degraded"]>;
            responseTime: z.ZodNumber;
            lastCheck: z.ZodString;
            error: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            error?: string;
            status?: "degraded" | "healthy" | "unhealthy";
            lastCheck?: string;
            responseTime?: number;
        }, {
            error?: string;
            status?: "degraded" | "healthy" | "unhealthy";
            lastCheck?: string;
            responseTime?: number;
        }>>;
        metrics: z.ZodObject<{
            memory: z.ZodObject<{
                used: z.ZodNumber;
                total: z.ZodNumber;
                percentage: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                total?: number;
                percentage?: number;
                used?: number;
            }, {
                total?: number;
                percentage?: number;
                used?: number;
            }>;
            cpu: z.ZodObject<{
                usage: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                usage?: number;
            }, {
                usage?: number;
            }>;
            requests: z.ZodObject<{
                total: z.ZodNumber;
                errors: z.ZodNumber;
                errorRate: z.ZodNumber;
                responseTime: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                total?: number;
                errors?: number;
                responseTime?: number;
                errorRate?: number;
            }, {
                total?: number;
                errors?: number;
                responseTime?: number;
                errorRate?: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            memory?: {
                total?: number;
                percentage?: number;
                used?: number;
            };
            cpu?: {
                usage?: number;
            };
            requests?: {
                total?: number;
                errors?: number;
                responseTime?: number;
                errorRate?: number;
            };
        }, {
            memory?: {
                total?: number;
                percentage?: number;
                used?: number;
            };
            cpu?: {
                usage?: number;
            };
            requests?: {
                total?: number;
                errors?: number;
                responseTime?: number;
                errorRate?: number;
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        status?: "degraded" | "healthy" | "unhealthy";
        timestamp?: string;
        version?: string;
        metrics?: {
            memory?: {
                total?: number;
                percentage?: number;
                used?: number;
            };
            cpu?: {
                usage?: number;
            };
            requests?: {
                total?: number;
                errors?: number;
                responseTime?: number;
                errorRate?: number;
            };
        };
        services?: Record<string, {
            error?: string;
            status?: "degraded" | "healthy" | "unhealthy";
            lastCheck?: string;
            responseTime?: number;
        }>;
        uptime?: number;
    }, {
        status?: "degraded" | "healthy" | "unhealthy";
        timestamp?: string;
        version?: string;
        metrics?: {
            memory?: {
                total?: number;
                percentage?: number;
                used?: number;
            };
            cpu?: {
                usage?: number;
            };
            requests?: {
                total?: number;
                errors?: number;
                responseTime?: number;
                errorRate?: number;
            };
        };
        services?: Record<string, {
            error?: string;
            status?: "degraded" | "healthy" | "unhealthy";
            lastCheck?: string;
            responseTime?: number;
        }>;
        uptime?: number;
    }>;
    HealthCheckResponseSchema: z.ZodObject<{
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
};
export default _default;
//# sourceMappingURL=index.d.ts.map